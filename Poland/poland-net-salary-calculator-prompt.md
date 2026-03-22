# Prompt: Poland Net Salary Calculator — poland.html
# Target: Cowork (agentic desktop AI)
# Template: Agentic — Research + Implementation
# Token estimate: ~1,200 tokens
# Strategy: Two-phase structure (Spec Review → Implement) with stop conditions prevents hallucinating tax rules.

---

```
## ROLE
You are a senior full-stack developer implementing a Polish net salary calculator as a single HTML file. The spec document SPEC-POLAND-NET-SALARY-2026.md is your single source of truth — you MUST NOT invent or assume any tax rate, bracket, or amount not present in that document.

---

## CONTEXT (carry forward)
- Project already has: template.html, shared.js, shared.css, nav.js
- Output file: poland.html (inside the Poland/ folder)
- The calculator MUST be built from template.html and MUST import shared.js, shared.css, and nav.js — do not recreate anything already in those shared files
- Tax year: 2026
- Languages: Polish (pl), English (en) — the UI MUST support both via a language toggle
- Spec document: Poland/SPEC-POLAND-NET-SALARY-2026.md (read this FIRST before writing any code)

---

## PHASE 1 — SPEC REVIEW

### Step 1: Read the Spec
Read SPEC-POLAND-NET-SALARY-2026.md in its entirety. Confirm you have loaded:
- All ZUS rates (employee + employer, with annual cap)
- Health insurance formulas for all 3 B2B tax forms + employees
- PIT progressive scale (12%/32%) + tax-free amount
- B2B taxation: flat 19%, ryczałt rate table (all 10 tiers), progressive scale
- B2B ZUS tiers: ulga na start, preferential, full, Small ZUS Plus
- All special reliefs: under-26, 2+ children, 4+ children, returning resident, IP Box, 50% author's costs, joint filing
- Child tax credit amounts (per child rank) + income limits
- Child benefit (Rodzina 800+)
- PPK rates
- VAT threshold (informational)
- All formulas from Section 10

### Step 2: Read the Template and Shared Files
Read template.html, shared.js, shared.css, and nav.js. Understand:
- The HTML structure and where [CUSTOMIZABLE] sections are
- What shared.js expects: computeForGross(g) return signature, required DOM IDs
- How nav.js works and what data-page attribute to set
- The CSS variable system for theming

✅ CHECKPOINT 1: "Spec loaded — [N] tax rules, [N] B2B tax forms, [N] ZUS tiers, [N] relief types confirmed"

---

## PHASE 2 — IMPLEMENTATION

### Starting State
- template.html defines the base HTML structure
- shared.js, shared.css, nav.js handle global layout, utilities, nav
- SPEC-POLAND-NET-SALARY-2026.md is the single source of truth for all tax logic

### Target State
- poland.html is a complete, working calculator for Poland tax year 2026
- Covers BOTH employment contracts AND B2B contracts
- All tax and benefit rules from the spec are implemented
- Self-contained logic layer, inherits layout from shared files

### Implementation Rules

**MUST follow:**
- Copy structure from template.html — do not rewrite scaffolding
- Link shared.css, shared.js, nav.js exactly as template.html does
- All calculator logic in inline <script> — do not modify shared files
- Set <body data-page="poland"> and register in nav.js COUNTRIES array + shared.js pageFlags
- Language toggle (pl/en) visible, switches ALL UI labels without reload
- All labels, tooltips, headers, error messages, result labels translated in both languages
- Use Polish flag colors for theme (red #DC143C and white #FFFFFF as accents, dark navy #1B1B3A as primary)

**Calculator Mode Tabs — TWO main modes:**

1. **Employment Contract (Umowa o Pracę)** — default mode
2. **B2B Contract (Działalność Gospodarcza / JDG)** — alternate mode

When switching modes, the input panel changes to show relevant fields. Results panel structure stays the same.

**Employment Contract Inputs — MUST include:**
- Gross monthly salary (mandatory — slider + input field)
- Calculation period: monthly / annual toggle
- Commuter status: local / commuter (affects KUP: 250 vs 300 PLN)
- 50% Author's Costs (KUP50): toggle + percentage slider (0–100% of salary qualifying for IP work)
- Age: input or "Under 26" toggle (activates Ulga dla Młodych)
- Marital status: single / married
- Joint filing with spouse: toggle (only if married) + spouse annual income input
- Number of children: 0–10 selector
- PIT-0 for 2+ children: auto-activate when children ≥ 2 (with toggle to override if not qualifying)
- Large family relief (4+ children): auto-activate when children ≥ 4
- Returning resident (Ulga na Powrót): toggle
- PPK participation: toggle (default OFF) + employee rate selector (0.5% / 2% / 3% / 4%) + employer rate selector (1.5% / 2% / 2.5% / 3% / 3.5% / 4%)

**B2B Contract Inputs — MUST include:**
- Monthly revenue (mandatory — slider + input)
- Monthly deductible costs (input field, default 0 for ryczałt)
- Tax form: tax scale / flat 19% / ryczałt (radio buttons or tabs)
- If ryczałt: activity type selector (with rate auto-populated):
  - IT programming/consultancy — 12%
  - IT testing/support — 8.5%
  - Healthcare/architecture/engineering — 14%
  - Freelance professional services — 17%
  - Other services — 15%
  - Manufacturing/construction — 5.5%
  - Trade/retail — 3%
  - Custom rate entry (2%–17%)
- ZUS regime: ulga na start / preferential (mały ZUS) / full (duży ZUS) / Small ZUS Plus
  - If Small ZUS Plus: input for contribution base (PLN 1,441.80–5,652)
- Voluntary sickness insurance: toggle (default ON for full/preferential ZUS)
- IP Box: toggle + percentage of income qualifying (0–100%)
- VAT registered: toggle → if yes, VAT rate selector (23% / 8% / 5% / mixed)
  - Show gross invoice amount (revenue + VAT) as informational

**Shared Inputs (both modes):**
- Number of children (for child benefit display)
- Children's ages (for eligibility display)

**Calculator Outputs — MUST display:**

*Main results:*
- Gross salary / revenue
- Total ZUS employee contributions (with breakdown: pension, disability, sickness)
- Health insurance contribution
- Taxable income
- Income tax (PIT) advance payment
- Net take-home pay (monthly)
- Effective tax rate (%)

*Summary grid (4 boxes):*
- Net salary
- Total deductions
- Effective tax rate
- Employer cost (employment) / Total ZUS+health (B2B)

*Breakdown table — ALL line items:*
- Employment: Gross → ZUS pension → ZUS disability → ZUS sickness → Health insurance → KUP → Taxable income → PIT → PPK (if active) → Net
- B2B: Revenue → Costs → ZUS social (breakdown) → Health insurance → Tax base → Income tax → Net

*Employer cost section (employment mode):*
- Gross salary
- Employer ZUS (pension, disability, accident, FP, FGŚP)
- Employer PPK (if active)
- Total employer cost

*Benefit cards section:*
- Child benefit (Rodzina 800+): PLN 800 × number of children — clearly labeled as separate from salary
- Child tax credit (Ulga na dzieci): annual amount, broken down per child
- Active relief badges: show which reliefs are active (under-26, 2+ children, 4+ children, returning resident, IP Box, 50% KUP, joint filing)

*Charts (using shared.js chart infrastructure):*
- Net vs Gross curve
- Effective tax rate curve
- Donut chart: net / PIT / ZUS / health / (PPK)

*Annual overview:*
- Annual gross
- Annual net
- Annual total deductions
- Annual child benefit (separate)
- Annual child tax credit
- Joint filing savings (if applicable)

**UI Requirements:**
- Results update in real-time as inputs change
- Show disclaimer: "This calculator provides estimates only. Consult a tax advisor (doradca podatkowy) for official calculations. Based on 2026 tax legislation."
- Disclaimer in both Polish and English
- Mobile-responsive layout
- Group inputs: Basic Info / Tax Reliefs / Family / B2B Options (collapsible)
- Flag [UNVERIFIED] values from spec with ⚠️ tooltip
- When switching between Employment and B2B modes, reset relevant fields but keep shared fields (children, etc.)

**MUST NOT:**
- NEVER invent a tax rate, bracket, ZUS amount, or relief rule not in SPEC-POLAND-NET-SALARY-2026.md
- NEVER modify shared.js, shared.css, or nav.js
- NEVER use a frontend framework — vanilla JS only
- NEVER store or transmit any user input outside the browser

### shared.js Contract Requirements
Your page MUST expose these for shared.js compatibility:
- `function computeForGross(g)` — returns `{ net, deductions, kindergeld? }`
  - For Poland: `kindergeld` = child benefit (Rodzina 800+) amount
  - `deductions` = ZUS + health + PIT + PPK
  - This function is used by shared.js for the net-vs-gross and tax-rate curve charts
- Required DOM IDs: `salarySlider`, `salaryInput`, `netAmount`, `whatifBar`, `saveCalcBtn`, `historyList`, `historySearch`, `navDropdown`
- Chart canvas IDs: `netVsGrossChart`, `taxRateChart`

### Stop Conditions — STOP and ask the user before:
- Any spec value flagged [UNVERIFIED] that would materially affect the calculation
- Template structure conflicts with required output fields
- Shared files impose constraints preventing a required feature

### Checkpoint outputs:
✅ CHECKPOINT 2A: "Spec consumed — [N] tax rules, [N] B2B forms, [N] reliefs loaded"
✅ CHECKPOINT 2B: "HTML structure built from template — shared files linked, pl/en toggle scaffolded"
✅ CHECKPOINT 2C: "Employment calculation engine complete — ZUS, health, PIT, KUP, reliefs, PPK, joint filing"
✅ CHECKPOINT 2D: "B2B calculation engine complete — 3 tax forms, 4 ZUS tiers, ryczałt rates, IP Box"
✅ CHECKPOINT 2E: "UI complete — all inputs, outputs, translations, charts, real-time updates working"
✅ CHECKPOINT 2F: "poland.html written to disk — ready for review"

---

## SUCCESS CRITERIA
- [ ] poland.html loads without errors and inherits layout from template.html
- [ ] Employment mode: all inputs present, real-time calculation, correct ZUS/health/PIT/net
- [ ] B2B mode: all 3 tax forms work, ryczałt rate table complete, ZUS tiers selectable
- [ ] All 6 special reliefs selectable and correctly modify the calculation
- [ ] Joint filing for married couples works and shows savings
- [ ] Child tax credit calculated per child with income limits enforced
- [ ] Child benefit (800+) displayed separately from salary
- [ ] PPK optional, correctly deducted from net
- [ ] Polish and English toggle works on every visible string
- [ ] Annual cap (PLN 282,600) on pension/disability correctly applied in annual view
- [ ] Solidarity tax (4% >1M) applied when applicable
- [ ] Employer cost section shows full breakdown
- [ ] Net vs Gross and Tax Rate charts render correctly
- [ ] Donut chart shows proportional breakdown
- [ ] Disclaimer visible in both languages
- [ ] Mobile viewport (375px) renders correctly
- [ ] No tax value contradicts SPEC-POLAND-NET-SALARY-2026.md
- [ ] computeForGross(g) function works correctly for shared.js integration
```
