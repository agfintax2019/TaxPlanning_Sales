---
name: agfintax-tax-planning-tool
description: Maintain, fix, extend, or annually update the AG FinTax Tax Planning Strategy Tool, the single-file HTML calculator the AG FinTax sales team uses on client calls. It models 17 strategies (S-Corp, home office, vehicle, hiring children, Solo 401k, HSA, SEHI, Accountable Plan, Augusta, cost seg, TLH, Opportunity Zone, Defined Benefit, bonus-depreciation investments, oil & gas, DAF/leveraged donations, R&D credit) and produces a client preview plus an Excel export. Use this skill whenever the user asks to fix a bug in the tax planning tool, change a calculation, update tax limits for a new year (401k, HSA, SS wage base, brackets, EBL, standard deduction), add or remove a strategy, change tooltips or sales copy, change the client preview or Excel export, re-brand the tool, or deploy or share it with the sales team. Also trigger on "tax planning tool", "sales tool", "strategy calculator", "the AG FinTax calculator", "update the tool for 2027", or requests that mention the tool's tabs (Profile, Income, Business, Deductions, Capital Gains, Investments, Strategies).
---

# AG FinTax Tax Planning Strategy Tool

A self-contained HTML page (no build step, no server). Sales reps open it in a browser, enter the prospect's numbers across 7 tabs, and show the **Client Preview** or download the **Excel** workbook.

- **Tool:** `assets/AG_FinTax_Tax_Planning_Tool.html`, the single source of truth. Edit this file only.
- **Regression test:** `scripts/test_tool.cjs`, a headless Chromium run of 65 checks (calculations, tabs, Excel, mobile layout).
- **Constants and sources:** `references/tax-constants.md`
- **How every number is calculated:** `references/calculation-logic.md`
- **Fix history:** `CHANGELOG.md`

## Golden rules

1. **Tax-law numbers live only in the `TAX` object** at the top of the `<script>`. Never hard-code a limit inside `recalc()`. The HTML labels and tooltips repeat some numbers as text; when a constant changes, search the file for the old number and update the text too.
2. **Run the test after every change:**
   ```bash
   node skills/agfintax-tax-planning-tool/scripts/test_tool.cjs
   ```
   It must end with `0 failed`. If you change a formula on purpose, update the matching expectation in the test in the same commit and say why.
3. **One syntax error kills the whole tool.** All logic sits in one `<script>` block, so one stray comma stops every tab, calculation and export. This happened before (see CHANGELOG). The test's first check catches it.
4. **Conservative by default.** A savings figure must never count something the client already has (e.g. an existing home office claim), money the client hasn't committed (e.g. Opportunity Zone gains), or losses they can't use (passive, EBL, beyond income). When in doubt, count less and show a note explaining why.
5. **Keep compliance warnings.** The Augusta entity requirement, S-Corp reasonable compensation, OZ timing, and syndicated conservation easement (listed transaction / SECURE 2.0 §605) warnings protect the firm. Don't remove them to make numbers look better.

## Common workflows

### Annual tax-year update (e.g. 2026 → 2027)
1. Open `references/tax-constants.md`. For each row, find the new IRS/SSA figure: Rev. Proc. for inflation adjustments (brackets, standard deduction, HSA), IRS notice for retirement limits, SSA fact sheet for the wage base.
2. Update `TAX` (including `TAX.year` and `TAX.brackets`) and `STATE_RATES` if states changed rates.
3. Search the HTML for each old number and the old year (`2026`) and update the labels, notes and `STRAT_INFO` tooltips.
4. Update the expected numbers in `scripts/test_tool.cjs` (it references the 401k limit, EBL, child salary cap, luxury auto cap and filename year), then run it.
5. Update the "Last verified" column in `references/tax-constants.md` and add a CHANGELOG entry.

### Fix a bug or change a calculation
1. Reproduce it: add a failing check to `scripts/test_tool.cjs` that shows the bug.
2. Fix it in `recalc()` or the relevant helper. Keep the display (`st(...)`), the strategy state (`state[key]` / `state[key+"_sav"]`) and the badge (`setBadge`) consistent.
3. Run the test, and update `references/calculation-logic.md` if the formula changed.

### Add a strategy
1. Add the input card to the right tab (copy an existing `card` block and its `strat-savings-box` badge).
2. Compute it in `recalc()`: set `state.<key>` to the deduction and, for anything that isn't simply deduction × combined rate, set `state.<key>_sav` and use `type:"custom"` (or `"credit"` for a dollar-for-dollar credit, `"se"` for an SE-tax saving).
3. Add it to `STRATEGIES` (keep the commas!), `STRAT_INFO` (tooltip) and `BADGE_COLORS`, and add its deduction to the right AGI bucket (`retDed` / `bizDed` / `otherAdj`) if it reduces AGI.
4. Update the row-count checks in the test (`17`).

### Share or deploy to the sales team
- Easiest: send the HTML file. It works offline except Excel export, which loads SheetJS from cdnjs.
- Website: upload the HTML as a standalone page (WordPress: a "Custom HTML" page, or host the file and iframe it). No backend is needed.
- Client data never leaves the browser. Nothing is stored, and a page reload clears everything.

## Architecture cheat-sheet

| Piece | Where |
|---|---|
| Tax constants | `const TAX={...}` (top of script) |
| State top marginal rates | `STATE_RATES` (auto-fills the editable State Rate input) |
| Strategy list / table rows | `STRATEGIES` array. `type` controls how savings are derived |
| Tooltip copy | `STRAT_INFO` |
| All calculations | `recalc()`, called by every input's `onchange` / `oninput` |
| Business blocks | `addBusiness()` + `getBusinesses()` (uses 2026 projected profit, falls back to 2025) |
| Totals, fee, ROI | `totals()` + `updateTotals()`. Excludes strategies marked "Not Applicable" and caps income-tax savings at the estimated tax |
| Client preview | `updatePreview()`. The "Print / Save PDF" button prints only the preview (`@media print`) |
| Excel | `downloadExcel()`, which uses the artifact `claude.use("downloads")` when available and falls back to a normal browser download |
