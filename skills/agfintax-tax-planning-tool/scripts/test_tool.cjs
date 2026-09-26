#!/usr/bin/env node
/*
 * Regression test for the AG FinTax Tax Planning Tool.
 * Usage:  node skills/agfintax-tax-planning-tool/scripts/test_tool.cjs [path/to/tool.html]
 * Needs Playwright + Chromium (uses a global install if it isn't a local dependency).
 * Exit code 0 = all checks passed.
 */
const path = require("path");
const { execSync } = require("child_process");

function loadPlaywright() {
  try { return require("playwright"); } catch (_) {}
  const root = execSync("npm root -g").toString().trim();
  return require(path.join(root, "playwright"));
}
const { chromium } = loadPlaywright();

const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "assets", "AG_FinTax_Tax_Planning_Tool.html"));
const launchOpts = {};
if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;

let failures = 0, passes = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  ok ? passes++ : failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `\n      expected: ${expected}\n      actual:   ${actual}`}`);
}
const money = n => "$" + Math.round(n).toLocaleString("en-US");

(async () => {
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/xlsx|cdnjs|ERR_|net::/i.test(m.text())) errors.push(m.text()); });
  await page.route(/cdnjs\.cloudflare\.com/, r => r.abort()).catch(() => {});   // run offline; XLSX stubbed below
  await page.addInitScript(() => {
    window.XLSX = { utils: { book_new: () => ({}), aoa_to_sheet: rows => ({ rows }), book_append_sheet: (wb, ws) => { window.__xlsxRows = ws.rows; } },
                    write: () => new Uint8Array([80, 75, 3, 4]) };
  });
  await page.goto("file://" + file);

  // helpers
  const set = async (id, v) => page.evaluate(([id, v]) => {
    const e = document.getElementById(id); e.value = v;
    e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true }));
  }, [id, String(v)]);
  const txt = id => page.evaluate(id => document.getElementById(id).textContent.trim(), id);
  const tab = n => page.evaluate(n => switchTab(n), n);

  check("script loads with no JS errors", errors.join(" | "), "");
  check("strategy table renders 18 rows", await page.evaluate(() => document.querySelectorAll("#strat-tbody tr").length), 18);
  check("Other Income drill-down collapsed by default", await page.evaluate(() => getComputedStyle(document.getElementById("other-inc-body")).display), "none");
  check("TLH drill-down collapsed by default", await page.evaluate(() => getComputedStyle(document.getElementById("tlh-body")).display), "none");

  // tabs
  for (let i = 0; i < 7; i++) {
    await page.click(`.tabs .tab:nth-child(${i + 1})`);
    check(`tab ${i} becomes visible`, await page.evaluate(i => getComputedStyle(document.getElementById("tab-" + i)).display, i), "block");
  }

  // ── Rates: auto-fill + manual override
  await set("state", "California");
  check("state auto-fills rate", await page.inputValue("#state_rate"), "13.3");
  check("combined = 37 + 13.3", await txt("combined_rate"), "50.3%");
  await set("state_rate", "5");
  check("manual state rate override sticks", await txt("combined_rate"), "42.0%");
  await set("state", "Texas");
  check("0% state works", await txt("combined_rate"), "37.0%");

  // ── Scenario: MFJ, Texas, 37%, Sched C profit $150k, no W-2 → S-Corp
  await set("biz_profit_1", 150000);
  check("2026 profit auto-copied", await page.inputValue("#biz_profit26_1"), "150000");
  check("S-Corp salary defaults to 25%", await page.inputValue("#scorp_salary"), "37500");
  {
    const se = 150000 * 0.9235 * 0.153, fica = 37500 * 0.153, sav = (se - fica) * (1 - 0.37 / 2);
    check("S-Corp SE tax (92.35% base)", await txt("scorp_se_current"), money(se));
    check("S-Corp net savings", await txt("scorp_sav_detail"), money(sav));
    check("S-Corp row in strategy table", await txt("sav-s1"), money(sav));
  }
  await set("scorp_salary", 60000);
  {
    const se = 150000 * 0.9235 * 0.153, fica = 60000 * 0.153, sav = (se - fica) * (1 - 0.37 / 2);
    check("manual S-Corp salary respected", await txt("scorp_sav_detail"), money(sav));
    await set("biz_profit_1", 150001); // re-trigger auto logic
    check("manual salary not overwritten by recalc", await page.inputValue("#scorp_salary"), "60000");
    await set("biz_profit_1", 150000);
  }
  check("gross income uses 2026 profit", await txt("gross_inc"), "$150,000");
  await set("biz_profit26_1", 200000);
  check("2026 override drives gross income", await txt("gross_inc"), "$200,000");
  await set("biz_profit_1", 180000);
  check("2026 manual override not overwritten", await page.inputValue("#biz_profit26_1"), "200000");
  await set("biz_profit26_1", 150000);

  // C-Corp profit excluded from personal income
  await set("entity_type_1", "C-Corp");
  check("C-Corp profit not personal income", await txt("gross_inc"), "$0");
  check("no S-Corp savings for C-Corp", await txt("sav-s1"), "—");
  await set("entity_type_1", "Schedule C");

  // ── Solo 401k caps
  await set("k401_status", "max");
  check("401k max = 2026 limit", await page.inputValue("#k401_amt"), "24500");
  await set("solo_deferral", 24500);
  check("solo deferral limited by W-2 401k (shared limit)", await txt("solo_total"), "$0");
  await set("k401_status", "0");
  await set("solo_employer", 100000);
  {
    const halfSE = (150000 * 0.9235 * 0.153) / 2, emp = (150000 - halfSE) * 0.2;
    check("solo total = deferral + ~20% employer", await txt("solo_total"), money(24500 + emp));
  }
  await set("solo_deferral", ""); await set("solo_employer", "");

  // ── 401(k): only UNUSED room counts as savings
  await set("w2_tp", 200000); await set("w2_sp", 8000);
  await set("k401_status", "custom"); await set("k401_amt", 10000);
  check("TP 401k room = limit − current", await txt("k401_tp_sav"), "$14,500 room → " + money(14500 * 0.37));
  check("spouse room limited to W-2 pay", await txt("k401_sp_sav"), "$8,000 room → " + money(8000 * 0.37));
  check("Maximize 401(k) strategy = room only", await txt("sav-s18"), money(22500 * 0.37));
  await set("k401_status", "max");
  check("maxed 401k adds $0", await txt("k401_tp_sav"), "Maxed — $0 extra");
  await set("k401_status", "0"); await set("w2_tp", ""); await set("w2_sp", "");
  check("no W-2 → no 401k strategy", await txt("sav-s18"), "—");

  // ── Home office: already claiming ≥ $20k → no NEW savings
  await set("ho_claiming", "Yes"); await set("ho_current_amt", 25000);
  check("optimized home office adds $0", await txt("sav-s2"), "—");
  await set("ho_current_amt", 2000);
  await set("ho_size", 300); await set("home_size", 3000); await set("ho_mort", 30000); await set("ho_util", 6000);
  check("home office counts only the increase", await txt("sav-s2"), money((3600 - 2000) * 0.37));
  await set("ho_claiming", "");

  // ── Vehicle: 0% business use is 0, not 100%
  await set("veh_count", "1"); await set("veh_reg_1", "Business");
  await set("veh_fmv_1", 80000); await set("veh_gvwr_1", "Yes"); await set("veh_pct_1", 0);
  check("0% business use → $0 deduction", await txt("veh_ded_1"), "$0");
  await set("veh_pct_1", 100);
  check("heavy SUV 100% bonus", await txt("veh_ded_1"), "$80,000");
  await set("veh_gvwr_1", "No");
  check("passenger auto capped", await txt("veh_ded_1"), "$20,200");
  await set("veh_count", "2");
  check("changing vehicle count keeps entries", await page.inputValue("#veh_fmv_1"), "80000");
  await set("veh_count", "0");

  // ── IRA: Roth not deductible
  await set("ira_contrib", "Yes"); await set("ira_amt", 7000); await set("ira_type", "Roth");
  check("Roth IRA not in AGI deductions", await txt("sum-ret-ded"), "-$0");
  await set("ira_type", "Traditional");
  check("Traditional IRA deducted", await txt("sum-ret-ded"), "-$7,000");
  await set("ira_contrib", "No");

  // ── HSA cap
  await set("hsa_elig", "Yes"); await set("hsa_cov", "single"); await set("hsa_amt", 9000);
  check("HSA capped at self-only limit", await txt("sav-s6"), money(4400 * 0.37));
  await set("hsa_elig", "No");

  // ── OZ default = 25% of short-term gains (policy), editable
  await set("cg_st", 40000);
  check("OZ defaults to 25% of ST gains", await page.inputValue("#oz_cg_amt"), "10000");
  check("OZ default valued at ordinary rate", await txt("oz_deferred_tax"), money(10000 * 0.37));
  await set("oz_cg_amt", 20000);
  await set("cg_st", 60000);
  check("manual OZ amount not overwritten", await page.inputValue("#oz_cg_amt"), "20000");
  await set("oz_cg_amt", ""); await set("cg_st", "");

  // ── Capital gains: TLH + OZ not auto-counted
  await set("cg_lt", 100000);
  check("OZ not counted until amount entered", await txt("sav-s12"), "—");
  await set("oz_cg_amt", 500000);
  check("OZ capped at available gains", await txt("oz_deferred_tax"), money(100000 * 0.238));
  await set("has_losses", "Yes"); await set("loss_harvest_amt", 20000);
  check("TLH at CG rate", await txt("sav-s11"), money(20000 * 0.238));
  check("OZ reduced by harvested gains", await txt("oz_deferred_tax"), money(80000 * 0.238));
  await set("oz_cg_amt", ""); await set("has_losses", "No"); await set("cg_lt", "");

  // ── Bonus dep investments: shared EBL cap, MFJ $512k above business income
  await set("mcg_inv", 250000); await set("mcg_mat", "Yes");               // 1,000,000 K-1
  await set("show_inv2", "Yes"); await set("mcg2_inv", 100000); await set("mcg2_mat", "Yes"); // +400,000
  check("K-1 loss never exceeds remaining income (rest → NOL)", await txt("sum-k1-loss"), "-" + money(150000));
  await set("w2_tp", 1000000);   // W-2 wages are not business income for §461(l)
  check("combined K-1 capped at biz income + EBL", await txt("sum-k1-loss"), "-" + money(150000 + 512000));
  await set("filing_status", "Single");
  check("Single EBL cap", await txt("sum-k1-loss"), "-" + money(150000 + 256000));
  await set("filing_status", "MFJ");
  await set("mcg2_mat", "No");
  check("passive K-1 with no passive income adds $0", await txt("mcg2_yr1"), "$0");
  await set("mcg_inv", ""); await set("show_inv2", "No"); await set("w2_tp", "");

  // ── Waterfall adds up
  await set("w2_tp", 400000); await set("hsa_elig", "Yes"); await set("hsa_cov", "family"); await set("hsa_amt", 8750);
  await set("og_interest", "Yes"); await set("og_inv", 100000);
  {
    const g = await page.evaluate(() => {
      const n = id => parseFloat(document.getElementById(id).textContent.replace(/[^0-9.]/g, "")) || 0;
      return n("sum-gross") - n("sum-ret-ded") - n("sum-biz-ded") - n("sum-k1-loss") - n("sum-other-ded") - n("sum-adj-agi");
    });
    check("AGI waterfall reconciles", Math.abs(g) <= 2, true);
  }

  // ── Not Applicable removes from totals; fee after tax displays
  const before = await txt("tot-2025");
  await page.selectOption("#sel-s15", "Not Applicable");
  const after = await txt("tot-2025");
  const og = 85000 * 0.37;
  check("Not Applicable excluded from total", Math.round(parseFloat(before.replace(/[$,]/g, "")) - parseFloat(after.replace(/[$,]/g, ""))), Math.round(og));
  await set("ag_fee", 10000);
  check("fee after tax displays", await txt("fee-after-tax"), money(10000 * 0.63));

  // ── Kids need a business; child tax above std deduction netted
  await set("kids_biz", "Yes"); await set("kids_adult_count", 1);
  {
    const childTax = (24000 - 16100) * 0.10;
    check("adult child savings net of child's tax", await txt("kids_tax_sav"), money(24000 * 0.37 - childTax));
  }

  // ── Donation OBBBA rules (eligible ≥ $1M)
  await set("w2_tp", 1200000);
  const agi = await page.evaluate(() => state.adjAGI);
  {
    const cap = agi * 0.5, floor = agi * 0.005, daf = Math.min(50000, cap), don = Math.min(500000, cap - daf);
    const rate = 0.35;
    check("DAF savings apply 0.5% floor + 35% cap", await txt("daf_tax_sav"), money((daf - Math.min(floor, daf)) * rate));
    check("leveraged donation allowed within cap", await txt("don_allowed_ded"), money(don));
  }

  // ── Bracket-drop warning appears when strategies push income into a lower bracket
  await set("mcg_inv", 300000); await set("mcg_mat", "Yes");
  check("total savings capped at estimated tax", await page.evaluate(() => { const T = totals(); return T.sav <= state.taxWithout + (STRATEGIES[0]._sav || 0) + 1; }), true);
  check("bracket-drop warning shown", await page.evaluate(() => getComputedStyle(document.getElementById("rate_warn")).display !== "none"), true);
  await set("mcg_inv", ""); await set("daf_amt", ""); await set("don_amt", "");
  check("bracket-drop warning hidden at normal levels", await page.evaluate(() => getComputedStyle(document.getElementById("rate_warn")).display), "none");

  // ── Preview + Excel
  await page.click(".btn-preview");
  check("preview lists strategies", await page.evaluate(() => document.querySelectorAll("#pv-strat-rows tr").length > 1), true);
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.click("#dl-btn")]);
  check("Excel filename", dl.suggestedFilename(), "AG_FinTax_Client_TaxPlan_2026.xlsx");
  check("Excel has 18 strategy rows", await page.evaluate(() => window.__xlsxRows.filter(r => r.length === 6).length - 1), 18);

  // ── Bonus-dep default investment (fresh page): $50k under $500k income, $100k above
  await page.reload();
  check("no default investment with no income", await page.inputValue("#mcg_inv"), "");
  await set("biz_profit_1", 300000);
  check("default investment $50k when income < $500k", await page.inputValue("#mcg_inv"), "50000");
  await set("w2_tp", 400000);
  check("default investment $100k when income ≥ $500k", await page.inputValue("#mcg_inv"), "100000");
  await set("mcg_inv", 75000); await set("w2_tp", 0);
  check("manual investment amount not overwritten", await page.inputValue("#mcg_inv"), "75000");

  // ── Mobile: no horizontal page scroll at 390px
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 7; i++) {
    await tab(i);
    check(`no horizontal scroll at 390px (tab ${i})`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
  }

  check("no JS errors during run", errors.join(" | "), "");
  await browser.close();
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
