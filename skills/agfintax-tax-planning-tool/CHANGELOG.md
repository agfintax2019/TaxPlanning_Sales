# Changelog

## 2026-09-26 (b) — Sales-team feedback
- **401(k):** existing contributions are no longer shown as savings. The new strategy #18, **Maximize 401(k) Contributions**, counts only the unused room (limit − current deferral, capped at W-2 pay) for the TP and spouse. The Solo 401(k) deferral limit accounts for the recommended max-out.
- **Optional drill-downs** (collapsed by default, tagged "Sales rep can skip"): Other Income (passive, interest/dividends, other) and Unrealized Gains / Losses & Tax-Loss Harvesting.
- **Opportunity Zone** amount defaults to 25% of short-term capital gains (editable). ST gains are applied first, at the ordinary rate.
- **Bonus-depreciation Investment 1** defaults to $50,000 when gross income is under $500,000, and $100,000 otherwise (editable).
- **Larger fonts throughout:** small text +2px, body text +1px.
- Test suite: 79 checks.

## 2026-09-26 — Bug-fix release + packaged as a skill

### Critical
- **The tool did not work at all.** A missing comma after strategy `s11` in the `STRATEGIES` array caused a JavaScript syntax error. No tab switching, no calculations, no preview, no Excel.

### Calculation bugs
- **State rate couldn't be overridden:** a hidden variable overwrote any manual entry once a state was picked. The input is now the single source of truth.
- **"Net Fee After Tax" never displayed** (it wrote `.value` to a `<div>`).
- **S-Corp savings added to AGI deductions**, even though an SE-tax saving isn't a deduction. This understated AGI and inflated the donation cap.
- **S-Corp eligibility** used business #1's entity type against *all* businesses' profit. It now models only Schedule C / single-member LLC profit.
- **SE tax** was computed on 100% of profit instead of 92.35%, ignored the wage base already used by W-2 wages, and ignored the lost ½-SE-tax deduction. Wage base updated to $184,500 (2026).
- **C-Corp profit was counted as personal income.**
- **2026 projections were ignored**: "2026 Tax Year" totals used 2025 figures, and the 2026 business fields had no effect at all.
- **Home office**: an existing claim ≥ $20k was counted as *new* savings. It is now incremental only, and the office % is capped at 100%.
- **Vehicle**: entering 0% business use was treated as 100%. Vehicles hidden by "Personal / not business use" still counted. Passenger cars ignored the luxury auto caps and the >50% business-use rule. Prior-year vehicles counted as new. Changing the vehicle count wiped entered data.
- **Roth / Backdoor Roth IRA** contributions were deducted from AGI.
- **Solo 401(k)** had no limits: the deferral wasn't shared with the W-2 401(k), and the employer share, §415(c) total and earned income weren't enforced.
- **HSA, SEHI, DBP** were uncapped.
- **Bonus-depreciation investments**: each investment got its own EBL cap (double-counting), the cap ignored filing status (always the single figure), and losses could exceed total income. Passive-scenario losses can now offset passive income.
- **Tax-loss harvesting**: the strategy table valued the full loss at the ordinary rate, while the badge used a different formula. Both now use one consistent ST → LT → $3,000 order.
- **Opportunity Zone** auto-counted deferral of *all* capital gains even with nothing entered, and typing 0 fell back to all gains.
- **R&D credit** was calculated but never included in the totals (now strategy #17).
- **Cost seg** counted only "Yes" (not "Interested"), counted even when "Own rentals" was No, and ignored passive-loss rules.
- **Augusta** counted for Schedule C owners, who can't pay rent to themselves. Typing 0 days became 14.
- **Kids** savings ignored the child's own tax on wages above the standard deduction and didn't require a business.
- **Donations**: the "Total Donations" tile showed $150k even when not eligible. The OBBBA 0.5% floor and 35% benefit cap (2026+) are now applied.
- **AGI waterfall didn't reconcile** (S-Corp savings were in AGI but not in the waterfall, and donations were shown as an AGI deduction).
- **"Not Applicable" had no effect** on totals.
- **Totals could exceed the client's entire tax bill.** Income-tax savings are now capped at the estimated tax, with a warning.
- **"Tax without planning"** was gross income × marginal rate. It now uses 2026 brackets, the standard deduction, LTCG rates and NIIT.

### Outdated 2026 figures corrected
401(k) $23,500 → $24,500 · §415(c) $70,000 → $72,000 · IRA $7,000 → $7,500 · EBL $313k/$626k → $256k/$512k · standard deduction $14,600 → $16,100 · child salary cap $16,200 → $16,100 · SS wage base $176,100 → $184,500 · several state flat-tax rates.

### UX / compliance
- Mobile layout (ticker, tabs, summary grids, preview) with no horizontal scroll at 390px.
- Client preview now lists each strategy and has a **Print / Save PDF** button (prints the preview only).
- Excel export includes priority, the "counted" flag, tax without planning and ROI. Filename includes the client and year, and there is a clear error if the Excel library fails to load.
- Added compliance notes: S-Corp reasonable compensation (no IRS % rule), Augusta entity requirement, OZ 12/31/2026 recognition timing, and a syndicated conservation easement warning (listed transaction / SECURE 2.0 §605).
- Duplicate `style` attribute on the home-office message fixed. Escape closes tooltips.
