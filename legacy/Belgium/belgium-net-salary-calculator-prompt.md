# Prompt: Belgium Net Salary Calculator — belgium.html
# Target: Cowork (agentic desktop AI)
# Template: Agentic — Research + Implementation
# Token estimate: ~900 tokens
# Strategy: Two-phase structure (Research → Document → Implement) with explicit stop conditions prevents the agent from hallucinating tax rules or silently skipping tax regimes.

---

```
## ROLE
You are a senior full-stack developer and Belgian tax law researcher. Your task is two-phased: first research and document all rules, then implement a net salary calculator as a single HTML file. You MUST NOT skip either phase.

---

## CONTEXT (carry forward)
- Project already has: template.html, shared.js, shared.css, nav.js
- Output file: belgium.html
- The calculator MUST be built from template.html and MUST import shared.js, shared.css, and nav.js — do not recreate anything already in those shared files
- Tax year: 2026
- Languages: Dutch (nl), French (fr), English (en) — the UI MUST support all three via a language toggle

---

## PHASE 1 — RESEARCH & DOCUMENTATION
### Step 1: Web Research

Search the internet for the following from authoritative Belgian sources only (SPF Finances / FOD Financiën, RSZ/ONSS, FAMIFED, official government portals, or peer-reviewed tax guides updated for 2026). Cross-reference at least 2 sources per rule.

Search for and document ALL of the following:

**A. Social Security Contributions (RSZ/ONSS)**
- Employee contribution rate (currently ~13.07%) — verify exact 2026 rate
- Special RSZ reduction thresholds (low-wage workers)
- Which income components are RSZ-exempt (meal vouchers, eco vouchers, etc.)

**B. Professional Withholding Tax (Bedrijfsvoorheffing / Précompte professionnel)**
- 2026 tax scales (barema's) per gross income bracket
- Reduction for dependent children (per number of dependents, ages)
- Reduction for spouse/partner with no or low income (category 1 vs 2 vs 3 taxpayer)
- Reduction for disabled taxpayer or dependent
- Marital status impact: single, married/cohabiting, single parent

**C. Personal Income Tax (IPB/PB) — for reference/annual estimate**
- 2026 federal tax brackets and rates
- Personal allowance (belastingvrije som / quotité exemptée)
- Additional child allowances per child (rank 1, 2, 3, 4+)
- Tax reduction for low incomes (belastingkrediet / crédit d'impôt)

**D. Special Tax Regimes**
- Expat tax regime (new regime post-2022): conditions, 30% cost-of-living allowance cap, €90,000 gross ceiling — verify 2026 rules
- Researchers/academics special regime (if still applicable 2026)
- Cross-border workers: relevant only if user selects this — note limitations

**E. Net Pay Deductions & Benefits**
- Meal vouchers: employer/employee split, RSZ treatment, maximum amounts 2026
- Eco vouchers: annual cap, RSZ treatment
- Group insurance / hospitalization insurance: employee contribution treatment
- Company car benefit in kind (VAT forfait / CO2 contribution) — include BIK formula
- Commuting reimbursement: public transport (100% exempt), own car (km allowance 2026 rate)
- Holiday pay (enkel/dubbel vakantiegeld / pécule de vacances): calculation method for employees

**F. Child Benefit (Kinderbijslag / Allocations familiales)**
- Note: child benefit is a regional matter as of 2019
- Document all 3 regional systems for 2026:
  - Flanders: Groeipakket — base amounts per child, social supplements, school bonus
  - Wallonia: FAMIWAL — base amounts, social supplements
  - Brussels: Iriscare — base amounts, social supplements
- Include: number of children, child ages, family income bracket triggers for social supplements
- CLEARLY mark this section as a separate display block in the calculator (not part of net salary — it is an additional benefit paid separately)

### Step 2: Document the Rules

After researching, output a structured specification document with the following sections. Use this exact format so the implementation phase can consume it directly:

---
### [SPEC DOCUMENT — BELGIUM NET SALARY 2026]

#### 1. RSZ Contributions
- Formula: ...
- Exceptions: ...
- Sources: [URL1], [URL2]

#### 2. Professional Withholding Tax
- Scale table: [list all brackets, rates]
- Reductions:
  - Dependents: [table: 1 child = X, 2 children = Y, ...]
  - Marital status: [values per category]
- Sources: [URL1], [URL2]

#### 3. Personal Income Tax Annual Estimate
- Brackets + rates: ...
- Personal allowance: ...
- Child allowances: ...
- Sources: ...

#### 4. Special Tax Regimes
- Expat regime: [conditions, calculation method]
- Others: ...
- Sources: ...

#### 5. Benefits & Deductions Table
- [Benefit name]: RSZ treatment | Tax treatment | 2026 cap | formula
- Repeat per benefit

#### 6. Child Benefit by Region
- Flanders: [amounts per child, supplements]
- Wallonia: [amounts per child, supplements]
- Brussels: [amounts per child, supplements]
- Sources: ...

#### 7. Uncertainties & Flagged Items
- List every value you could NOT verify from 2 sources — mark as [UNVERIFIED — manual check required]
---

✅ CHECKPOINT 1: Output the full [SPEC DOCUMENT] before proceeding. Stop here and wait for confirmation to continue to Phase 2.

---

## PHASE 2 — IMPLEMENTATION

### Starting state
- template.html exists and defines the base HTML structure, header, footer, and nav
- shared.js, shared.css, nav.js exist and handle global styles, utilities, and navigation
- The spec document from Phase 1 is your single source of truth for all tax logic

### Target state
- belgium.html is created as a complete, working net salary calculator for Belgium tax year 2026
- All tax and benefit rules from the spec document are implemented accurately
- The file is self-contained in its logic layer but inherits layout from the shared files

### Implementation Rules

**MUST follow:**
- Copy the structure from template.html as the base — do not rewrite the scaffolding
- Link shared.css, shared.js, nav.js exactly as template.html does — same paths, same order
- All calculator logic goes in an inline <script> block or a dedicated belgium.js — do not modify shared.js
- Language toggle (nl/fr/en) MUST be visible and switch all UI labels without page reload
- All labels, tooltips, section headers, error messages, and result labels MUST be translated in all 3 languages

**Calculator inputs — MUST include all of these:**
- Gross monthly salary (mandatory)
- Employment type: employee / self-employed (informational only — note limitations for self-employed)
- Marital status: single / married or legal cohabitant / single parent
- Spouse/partner income: none / low (under threshold) / normal
- Number of dependent children (0–10+), with age input per child (for child benefit calculation)
- Region of residence: Flanders / Wallonia / Brussels-Capital (for child benefit + commune tax)
- Commune tax rate (% additionnel communal / aanvullende gemeentebelasting) — default 7%, editable
- Special tax regime: none / expat regime / researcher regime
- Benefits (optional toggles):
  - Meal vouchers (employer contribution amount, number per month)
  - Eco vouchers (annual amount)
  - Company car (CO2 rate input, fuel type for BIK calculation)
  - Group insurance (employee monthly contribution)
  - Hospitalization insurance (employee monthly contribution)
  - Commuting reimbursement (public transport toggle / km distance for own car)
- Disabled dependent toggle (self, child, or other dependent)

**Calculator outputs — MUST display all of these:**
- Gross monthly salary
- RSZ employee contribution (amount + rate)
- Taxable base after RSZ
- Professional withholding tax (bedrijfsvoorheffing — monthly estimated amount)
- Net taxable salary
- Benefit in kind additions (company car, other)
- Total net take-home pay (monthly)
- Annual gross estimate
- Annual net estimate
- Effective tax rate (%)
- ── SEPARATOR ──
- Child benefit section (clearly labeled as separate from salary):
  - Monthly child benefit estimate by region
  - Social supplement eligibility indicator (if income is below threshold)
  - School bonus estimate (Flanders only, annual)

**UI requirements:**
- Results update in real-time as inputs change (no submit button needed, but include a Reset button)
- Show a disclaimer: "This calculator provides estimates only. Consult a tax advisor or sociaal secretariaat for official calculations. Tax rules are based on 2026 legislation."
- Disclaimer in all 3 languages
- Mobile-responsive layout
- Group inputs into logical collapsible sections: Basic Info / Family Situation / Benefits & Perks / Advanced (special regimes)
- Flag any [UNVERIFIED] values from the spec document visually in the UI with a ⚠️ tooltip

**MUST NOT:**
- NEVER invent a tax rate, bracket, or amount not present in the spec document
- NEVER modify shared.js, shared.css, or nav.js
- NEVER use a frontend framework (React, Vue) — vanilla JS only unless template.html already loads one
- NEVER store or transmit any user input outside the browser session

### Stop Conditions — STOP and ask the user before:
- Discovering that template.html uses a framework or structure that conflicts with any requirement above
- Any 2026 tax value in the spec is flagged [UNVERIFIED] and would materially affect the calculation
- The shared files impose a layout constraint that prevents displaying a required output field

### Checkpoint output after each major step:
✅ CHECKPOINT 2A: "Spec document consumed — [N] tax rules, [N] benefit types, [N] child benefit amounts loaded into logic layer"
✅ CHECKPOINT 2B: "HTML structure built from template.html — shared files linked, language toggle scaffolded"
✅ CHECKPOINT 2C: "Tax calculation engine complete — RSZ, BV, child benefit logic implemented"
✅ CHECKPOINT 2D: "UI complete — all inputs, outputs, translations, and real-time updates working"
✅ CHECKPOINT 2E: "belgium.html written to disk — ready for review"

---

## SUCCESS CRITERIA
- [ ] belgium.html loads without errors and inherits layout from template.html
- [ ] All inputs listed above are present and functional
- [ ] All outputs listed above are displayed and update in real-time
- [ ] Dutch, French, and English toggle works on every visible string
- [ ] Child benefit is clearly separated from salary calculation and shows all 3 regions
- [ ] Expat and researcher special regimes are selectable and change the calculation
- [ ] No tax value in the implementation contradicts the spec document
- [ ] Disclaimer is visible in all 3 languages
- [ ] File passes a visual check on mobile viewport (375px width)
```
