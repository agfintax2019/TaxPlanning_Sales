# AG FinTax — Tax Planning Strategy Tool (Sales Team)

**Open the tool:** [`skills/agfintax-tax-planning-tool/assets/AG_FinTax_Tax_Planning_Tool.html`](skills/agfintax-tax-planning-tool/assets/AG_FinTax_Tax_Planning_Tool.html). Download it and double-click to open it in any browser. No install is needed.

## For sales reps
1. **Profile** → client, filing status, state (the rate auto-fills and can be edited), federal bracket (the hint shows the bracket implied by income).
2. **Income → Business → Deductions → Capital Gains → Investments.** Fill in only what applies.
3. **Strategies** → review savings, then mark each strategy ✅ / ❌ / 🔍 and set a priority. ❌ removes it from the totals.
4. **👁 Client Preview** → walk the client through it, then **🖨 Print / Save PDF**. Or use **Download Excel**.

Red warning boxes mean the number was limited for a tax-law reason (passive loss, EBL, entity requirement, bracket drop). Read them before presenting.

## For maintainers
This repo is also a **Claude skill** (`skills/agfintax-tax-planning-tool/`, linked at `.claude/skills/`). Claude Code picks it up automatically in this repo. To use it on claude.ai, zip the `skills/agfintax-tax-planning-tool` folder and upload it under Settings → Capabilities → Skills.

```bash
# regression test (65 checks, headless Chromium)
node skills/agfintax-tax-planning-tool/scripts/test_tool.cjs
```

- Tax constants: `skills/agfintax-tax-planning-tool/references/tax-constants.md`
- Formulas: `skills/agfintax-tax-planning-tool/references/calculation-logic.md`
- What changed: `skills/agfintax-tax-planning-tool/CHANGELOG.md`
