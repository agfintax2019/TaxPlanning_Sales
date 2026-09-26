# Tax constants (`TAX` object) — sources & confidence

Last full review: **September 2026**, for tax year **2026**.
Confidence: **Confirmed** = published IRS/SSA figure · **Verify** = best available figure, re-check before relying on it · **Policy** = AG FinTax business rule, not tax law.

| Constant | Value | Status | Source / note | Also appears in HTML text |
|---|---|---|---|---|
| `year` | 2026 | — | Plan year | Many labels ("2026"), Excel filename |
| `ssWageBase` | $184,500 | Confirmed | SSA 2026 COLA fact sheet | S-Corp SE tax rate field, s1 tooltip |
| `seFactor` | 0.9235 | Confirmed | IRC §1402(a)(12) | S-Corp SE tax field |
| `k401Deferral` | $24,500 | Confirmed | IRS Notice 2025-67 | 401(k) dropdowns, Solo deferral label, s5 tooltip |
| `total415c` | $72,000 | Confirmed | IRS Notice 2025-67 | Solo note, s5 tooltip, strategy desc |
| `iraLimit` | $7,500 (+$1,100 catch-up) | Confirmed | IRS Notice 2025-67 | IRA amount label |
| `hsaSelf` / `hsaFamily` | $4,400 / $8,750 | Confirmed | Rev. Proc. 2025-19 | HSA labels, s6 tooltip |
| `ebl` | $512,000 MFJ / $256,000 others | Verify | §461(l) as amended by OBBBA; Rev. Proc. 2025-32 | Bonus Dep note, s14 tooltip |
| `stdDed` | $32,200 MFJ / $16,100 single & MFS / $24,150 HoH | Verify | OBBBA + Rev. Proc. 2025-32 | Kids note |
| `childMinorMaxSalary` | $16,100 | Policy (= single std. deduction) | — | Kids label, s4 tooltip |
| `childAdultMaxSalary` | $24,000 | Policy | — | Kids label |
| `luxAutoYr1Bonus` / `NoBonus` | $20,200 / $12,200 | **Verify — 2025 figures** | Rev. Proc. 2025-16. Replace with the 2026 Rev. Proc. when released | s3 tooltip ("~$20,000") |
| `scorpMinProfit` | $40,000 | Policy | — | S-Corp badge, not-eligible note |
| `ozDefaultStPct` | 25% | Policy | Default QOZ investment = 25% of short-term gains | OZ label |
| `mcgDefault*` | $50k below $500k gross income, else $100k | Policy | Default 1:4 bonus-depreciation investment #1 | Investment amount label |
| `ogDefault` | $50,000 | Policy | Default oil & gas investment for every prospect (interest defaults to Yes) | O&G amount label |
| `scorpSalaryPct` | 25% | Policy (starting point only) | The IRS has **no** fixed % rule. Reasonable compensation must be documented | S-Corp salary label & note |
| `ltcgRate` + `niitRate` | 20% + 3.8% | Confirmed | §1(h), §1411. Assumes a high earner (top LTCG bracket) | RE CG note |
| `niitThreshold` | $250k MFJ / $200k single & HoH / $125k MFS | Confirmed (not indexed) | §1411 | — |
| `itemizedBenefitCap` | 35% | Verify | OBBBA limitation on itemized deductions for 37%-bracket filers (modeled as a 35% cap) | Donation note |
| `charityFloorPct` | 0.5% of AGI | Verify | OBBBA charitable floor for itemizers (2026+) | Donation note |
| `charityAgiCap` | 50% | Policy / simplification | §170(b): 60% cash to public charities, 30% appreciated property. Tool uses 50% | Donation notes |
| `donationMinIncome` | $1,000,000 | Policy | — | Donation card |
| `donationMultiple` | 5× | Policy | See compliance warning (listed transactions / SECURE 2.0 §605) | Donation card |
| `ogDeductPct` | 85% | Policy / estimate | IDC 65–80% + bonus on tangible equipment | O&G note, s15 tooltip |
| `capLossOrdinary` | $3,000 | Confirmed | §1211(b) | s11 tooltip |
| `augustaMaxDays` | 14 | Confirmed | §280A(g) | Augusta labels |
| `homeOfficeOptimized` | $20,000 | Policy | — | Home office message |
| `brackets` | 2026 tables | Verify | Rev. Proc. 2025-32 | Used for "Tax without planning", bracket hint & bracket-drop warning |

## State rates (`STATE_RATES`)
These are top marginal rates, used as a starting point only. The field is editable, and reps should override it for clients below the top bracket or subject to local tax (NYC, MD counties, etc.). Reviewed September 2026 for recent flat-tax changes (IA, LA, IN, NC, MS, KY, OH, NE, GA, ID, AR, UT, WV, MO, MT, KS). **Verify** every year.

## Annual checklist
1. Find the IRS "inflation adjustments" Rev. Proc. (Oct/Nov) → brackets, standard deduction, EBL, and the OZ/other indexed items.
2. Find the IRS retirement plan limits notice (Nov) → `k401Deferral`, `total415c`, `iraLimit`, catch-ups.
3. Find the SSA COLA fact sheet (Oct) → `ssWageBase`.
4. Find the HSA Rev. Proc. (May) → `hsaSelf` / `hsaFamily`.
5. Find the auto depreciation limits Rev. Proc. (Feb/Mar) → `luxAutoYr1*`.
6. Check state rate changes.
7. Update the constants and HTML text, then update the test expectations and run it.
