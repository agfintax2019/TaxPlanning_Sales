# Calculation logic

`CR` = combined rate = selected federal marginal rate + state rate (the State Rate input).
`cgRate` = 20% LTCG + 3.8% NIIT + state rate.
All money inputs are floored at 0. The plan year is 2026: W-2 and business profit use the **2026 projected** fields, which auto-copy from 2025 until a rep overrides them.

## Income
- **Pass-through profit** = sum of 2026 profit for every business **except C-Corps**. C-Corp profit is taxed at the corporate level, and only the owner's W-2 salary counts.
- **Gross income** = 2026 W-2 (TP + spouse) + pass-through profit + passive + interest/dividends + other + all capital gains.
- **Tax without planning** (preview) = 2026 federal brackets on (gross − LT/RE gains − existing 401k/traditional IRA − standard deduction) + 20% on LT/RE gains + 3.8% NIIT on investment income over the threshold, plus a flat state rate on taxable income.
- **Bracket hint** (Profile tab) warns when the selected federal rate doesn't match the bracket implied by income.

## Strategies

| # | Strategy | Deduction | Savings | Gating / caps |
|---|---|---|---|---|
| 1 | S-Corp | — | (SE tax as sole prop − FICA on salary) × (1 − CR/2) | Only Schedule C / single-member LLC profit > $40k. SE tax = 15.3% on 92.35% of profit, and the Social Security portion only up to (wage base − TP W-2). The (1 − CR/2) factor accounts for losing the deductible half of the SE/FICA tax. Salary defaults to 25% (editable, sticky once typed) |
| 2 | Home office | Expenses × office % | Ded × CR | Only the **increase** over the amount already claimed; $0 if the current claim is ≥ $20k. Requires business income |
| 3 | Vehicle | Heavy (>6,000 lb): 100% (bonus) or 20% (MACRS). Passenger: same, capped at the luxury auto limit × business % | Ded × CR | Business use ≤ 50% → 10% straight-line. A vehicle placed in service before 2026 counts $0. Requires business income |
| 4 | Hire children | Count × salary (minor ≤ $16,100, adult ≤ $24,000) | Ded × CR − child's own tax on wages above the standard deduction | Requires business income |
| 18 | Maximize 401(k) | Unused room = min($24,500, 2026 W-2) − current deferral, for TP and spouse | Ded × CR | Existing deferrals are baseline and are **never** counted as AG FinTax savings. Maxed → $0 |
| 5 | Solo 401(k) | min(deferral, employer, §415(c), earned income) | Ded × CR | Deferral ≤ $24,500 − TP's W-2 401(k), including the recommended max-out when strategy 18 is counted. Employer ≤ 20% of (net SE income − ½ SE tax) + 25% of S/C-Corp salary. No non-family employees |
| 6 | HSA | min(contribution, self-only / family limit) | Ded × CR | HDHP = Yes |
| 7 | SEHI | min(premium, business income) | Ded × CR | Paid from business, not on W-2 |
| 8 | Accountable Plan | Reimbursements | Ded × CR | Requires a business |
| 9 | Augusta | Days (≤14) × daily rate | Ded × CR | Requires an S-Corp/C-Corp/Partnership, or the S-Corp election being recommended |
| 10 | Cost seg | Study amount | Ded × CR | Owns rentals; study done or "Interested". Without REP status it is passive: limited to passive income, and the rest is suspended |
| 11 | TLH | Loss used | ST gains × CR + LT/RE gains × cgRate + ≤$3,000 × CR | Remainder carries forward |
| 12 | Opportunity Zone | Defaults to 25% of short-term gains (policy); editable and sticky once typed; ≤ gains left after TLH | ST portion × CR + LT portion × cgRate (ST used first; tax **deferred**) | Without ST gains, nothing is counted until an amount is entered |
| 13 | Defined Benefit | min(contribution, business earned income − Solo 401k) | Ded × CR | Requires business income |
| 14 | Bonus-dep investment | K-1 = amount × multiple. Investment 1 defaults to $50k if gross income < $500k, else $100k (policy; editable and sticky) | Usable loss × CR | Material participation: combined loss ≤ min(pass-through profit + EBL, income left after all other deductions), and the excess becomes an NOL (Year 2 savings = min(NOL, 80% × Year 2 income) × CR). Passive: limited to passive income left after cost seg. EBL is shared by both investments and depends on filing status |
| 15 | Oil & gas | 85% × investment | Ded × CR | Working interest (non-passive) |
| 16 | Donations | DAF + min(5 × donation, 50% AGI budget left) | (Deduction − 0.5% AGI floor) × (min(fed, 35%) + state) | Gross income ≥ $1M. Carryforward shown |
| 17 | R&D credit | — | Credit amount (1:1) | R&D = Yes and at least one qualifying activity checked |

## AGI waterfall (Strategies tab)
Gross − **Retirement** (401k + 401k max-out room + traditional IRA + Solo 401k + DBP) − **Business** (HO + vehicle + kids + SEHI + HSA + accountable plan + Augusta + cost seg) − **K-1 loss** − **O&G / CG adjustments** (IDC + TLH used + OZ deferred) = **Adjusted AGI**. The waterfall always reconciles. Donations are itemized, so they come after AGI.

## Totals
- Every strategy with savings counts **unless it is marked ❌ Not Applicable** (the row greys out).
- Income-tax savings are **capped at the estimated tax without planning**, with S-Corp SE savings added on top. A red banner explains any cap.
- A **bracket-drop warning** appears when strategies push remaining taxable income below the selected federal bracket, because savings are then overstated at the marginal rate.
- Fee after tax = fee × (1 − CR). ROI = (savings − net fee) ÷ net fee.
