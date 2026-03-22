# Slovakia Net Salary Calculator 2026 — Implementation Specification

> **Purpose**: This document is a complete, self-contained specification for a coding agent to implement `slovakia.html` as part of the ExpatCalc project. It covers every tax rule, formula, threshold, and edge case needed for a fully correct Slovak net salary calculator for tax year 2026.

> **Target file**: `Slovakia/slovakia.html`
> **Template**: `../template.html` (duplicate and customize)
> **Shared dependencies**: `../shared.css`, `../shared.js`, `../nav.js`
> **Languages**: Slovak (`sk`) and English (`en`)

---

## TABLE OF CONTENTS

1. [Project Integration](#1-project-integration)
2. [Constants & Reference Values](#2-constants--reference-values)
3. [Step-by-Step Net Salary Calculation](#3-step-by-step-net-salary-calculation)
4. [Social Insurance Contributions (Detail)](#4-social-insurance-contributions-detail)
5. [Health Insurance Contributions (Detail)](#5-health-insurance-contributions-detail)
6. [Income Tax Calculation (Detail)](#6-income-tax-calculation-detail)
7. [Non-Taxable Allowances (NČZD)](#7-non-taxable-allowances-nčzd)
8. [Tax Bonus on Children (Daňový bonus)](#8-tax-bonus-on-children-daňový-bonus)
9. [Child Benefit (Prídavok na dieťa)](#9-child-benefit-prídavok-na-dieťa)
10. [Special Cases & Exemptions](#10-special-cases--exemptions)
11. [Input Fields Specification](#11-input-fields-specification)
12. [UI Customization (CSS Variables & Theme)](#12-ui-customization-css-variables--theme)
13. [Translation System](#13-translation-system)
14. [Verification Examples](#14-verification-examples)
15. [Sources & Legal References](#15-sources--legal-references)

---

## 1. PROJECT INTEGRATION

### File Structure
```
Slovakia/
  slovakia.html      ← the calculator (to be created)
../template.html     ← duplicate this as starting point
../shared.css        ← shared styles (DO NOT MODIFY)
../shared.js         ← shared JS: odometer, what-if, scrubber, history (DO NOT MODIFY)
../nav.js            ← navigation system (MUST BE UPDATED — see below)
```

### nav.js Registration
Add to the `COUNTRIES` array in `nav.js`:
```js
{ id: 'slovakia', file: 'Slovakia/slovakia.html', flag: '🇸🇰', name: 'Slovakia', local: 'Slovensko' }
```

### shared.js Registration
Add to the `pageFlags` object in `shared.js`:
```js
'slovakia.html': '🇸🇰'
```

### Body Tag
```html
<body data-page="slovakia">
```

### Shared CSS Link (from subfolder)
```html
<link rel="stylesheet" href="../shared.css">
```

### Script Tags (at end of body, after calculator script)
```html
<script src="../nav.js"></script>
<script src="../shared.js"></script>
```

### Required Contracts with shared.js
The calculator script MUST expose:
- `function computeForGross(g)` — returns `{ net, deductions }` for a given gross salary
- `function updateFromSlider()` — triggered by what-if buttons
- Element IDs: `salarySlider`, `salaryInput`, `netAmount`, `whatifBar`, `saveCalcBtn`, `historyList`, `historySearch`, `navDropdown`
- Chart canvas IDs: `netVsGrossChart`, `taxRateChart`

---

## 2. CONSTANTS & REFERENCE VALUES

All values are for tax year 2026 (January 1, 2026 – December 31, 2026).

### Životné minimum (Subsistence Minimum)
Valid from July 1, 2025 to June 30, 2026 (used for entire tax year 2026 calculations):

| Person | Monthly Amount |
|--------|---------------|
| First adult | €284.13 |
| Additional adult in household | €198.22 |
| Dependent child | €129.74 |

### Minimum Wage 2026
- Monthly: **€916** (for standard 40h workweek) — NOTE: see note below
- Hourly: **€5.259**

> **IMPORTANT NOTE ON MIN WAGE**: Some sources report €915, others €916. The official gazette sets it at €916 for monthly pay. Use **€916** as the minimum wage in the calculator. However, for the slider minimum, use **€700** to allow part-time or lower entries.

### Maximum Assessment Base for Social Insurance (2026)
- **€16,764 per month** (applies to all social insurance funds except accident insurance)
- Accident insurance: **no cap**

### Average Wage (for tax bonus calculation)
- Average monthly wage from 2024: **€1,524** (used for the 2026 tax bonus threshold)

---

## 3. STEP-BY-STEP NET SALARY CALCULATION

The monthly net salary calculation follows this exact order:

```
1. Start with GROSS MONTHLY SALARY

2. Calculate EMPLOYEE SOCIAL INSURANCE (9.4% of gross, capped at max assessment base)
   → See Section 4 for breakdown

3. Calculate EMPLOYEE HEALTH INSURANCE (5.0% of gross, NO cap — but see disability exception)
   → See Section 5 for details

4. PARTIAL TAX BASE = Gross − Social Insurance − Health Insurance

5. Apply NON-TAXABLE ALLOWANCE (NČZD na daňovníka)
   → Monthly: €497.23 (applied automatically by employer)
   → See Section 7 for annual reduction rules

6. TAXABLE BASE (monthly) = max(0, Partial Tax Base − NČZD monthly)

7. Calculate INCOME TAX using progressive brackets
   → See Section 6

8. Apply TAX BONUS ON CHILDREN (monthly credit, reduces tax)
   → See Section 8

9. NET SALARY = Gross − Social Insurance − Health Insurance − Income Tax + Tax Bonus on Children
```

### Employer Cost Calculation (for "From Employer Cost" mode)
```
EMPLOYER COST = Gross + Employer Social Insurance + Employer Health Insurance
Employer Social Insurance = 25.2% of gross (capped) — see Section 4
Employer Health Insurance = 11.0% of gross (no cap) — see Section 5
```

---

## 4. SOCIAL INSURANCE CONTRIBUTIONS (DETAIL)

Source: Sociálna poisťovňa (Social Insurance Agency), tables effective January 1, 2026.

### Maximum Assessment Base
**€16,764 / month** for all funds EXCEPT accident insurance (which has no cap).

When gross salary exceeds €16,764, social insurance contributions are calculated on €16,764 only (except accident insurance for employer).

### Employee Contributions (total: 9.4%)

| Fund | Rate | Notes |
|------|------|-------|
| Sickness (nemocenské) | 1.4% | |
| Old-age pension (starobné) | 4.0% | |
| Disability pension (invalidné) | 3.0% | NOT paid by old-age/early pensioners |
| Unemployment (nezamestnanosti) | 1.0% | NOT paid by old-age/early pensioners or >70% disability |
| **TOTAL** | **9.4%** | |

### Employer Contributions (total: 25.2%)

| Fund | Rate | Cap applies? | Notes |
|------|------|-------------|-------|
| Sickness (nemocenské) | 1.4% | Yes (€16,764) | |
| Old-age pension (starobné) | 14.0% | Yes (€16,764) | |
| Disability pension (invalidné) | 3.0% | Yes (€16,764) | NOT paid for old-age/early pensioners |
| Unemployment (nezamestnanosti) | 1.0% | Yes (€16,764) | NOT paid for old-age/early pensioners or >70% disability. 0.5% for certain categories (see note) |
| Support financing (financovanie podpory) | 0.5% | Yes (€16,764) | New from 2026 — replaces part of old reserve fund |
| Guarantee insurance (garančné) | 0.25% | Yes (€16,764) | |
| Reserve solidarity fund (rezervný fond) | 4.75% | Yes (€16,764) | |
| Accident insurance (úrazové) | 0.8% | **NO CAP** | Calculated on full gross, always |
| **TOTAL** | **25.2%** (on capped base) + **0.8%** (uncapped) | | |

> **NOTE on employer unemployment rate**: The standard rate is 1.0%. For employees who have been granted an old-age pension, early pension, or disability pension with >70% incapacity, the employer does NOT pay unemployment insurance at all. Some sources show 0.5% for certain contract types — the standard employee relationship uses 1.0%.

### Formulas
```
assessmentBase = min(grossSalary, 16764)

employeeSocialInsurance = assessmentBase × 0.094
  (or broken down: assessmentBase × (0.014 + 0.04 + 0.03 + 0.01))

employerSocialInsurance =
    assessmentBase × (0.014 + 0.14 + 0.03 + 0.01 + 0.005 + 0.0025 + 0.0475)
  + grossSalary × 0.008  // accident insurance on FULL gross, no cap
  // = assessmentBase × 0.249 + grossSalary × 0.008
```

---

## 5. HEALTH INSURANCE CONTRIBUTIONS (DETAIL)

Effective January 1, 2026 through December 31, 2027 (temporary increase as part of consolidation package).

### Rates

| Payer | Standard Rate | Reduced Rate (ZŤP - disabled) |
|-------|--------------|-------------------------------|
| Employee | **5.0%** | **2.5%** |
| Employer | **11.0%** | **5.5%** |

### Assessment Base
- **No maximum cap** — health insurance is calculated on the full gross salary, regardless of amount.
- No minimum assessment base for employees (the minimum applies only to self-employed).

### Formulas
```
employeeHealthInsurance = grossSalary × 0.05    // standard
employeeHealthInsurance = grossSalary × 0.025   // if disabled (ZŤP holder)

employerHealthInsurance = grossSalary × 0.11    // standard
employerHealthInsurance = grossSalary × 0.055   // if disabled (ZŤP holder)
```

---

## 6. INCOME TAX CALCULATION (DETAIL)

### 2026 Progressive Tax Brackets (Annual)

| Bracket | Annual Tax Base Range | Rate | Monthly Equivalent |
|---------|----------------------|------|-------------------|
| 1st | €0 – €43,983.32 | 19% | €0 – €3,665.28 |
| 2nd | €43,983.33 – €60,349.21 | 25% | €3,665.28 – €5,029.10 |
| 3rd | €60,349.22 – €75,010.32 | 30% | €5,029.10 – €6,250.86 |
| 4th | Above €75,010.32 | 35% | Above €6,250.86 |

> **Bracket thresholds expressed as multiples of životné minimum (ŽM = €284.13)**:
> - 1st→2nd: 154.8 × ŽM = €43,983.32
> - 2nd→3rd: 212.4 × ŽM = €60,349.21
> - 3rd→4th: 264.0 × ŽM = €75,010.32

### Monthly Tax Calculation
For monthly payroll, the employer applies the tax brackets on a monthly basis. The monthly thresholds are the annual thresholds divided by 12:

```
monthlyBracket1Limit = 43983.32 / 12 = 3665.28
monthlyBracket2Limit = 60349.21 / 12 = 5029.10
monthlyBracket3Limit = 75010.32 / 12 = 6250.86

function calculateMonthlyTax(monthlyTaxBase):
  if monthlyTaxBase <= 0: return 0

  tax = 0
  remaining = monthlyTaxBase

  // 1st bracket: 19%
  bracket1 = min(remaining, 3665.28)
  tax += bracket1 × 0.19
  remaining -= bracket1

  // 2nd bracket: 25%
  if remaining > 0:
    bracket2 = min(remaining, 5029.10 - 3665.28)  // = 1363.82
    tax += bracket2 × 0.25
    remaining -= bracket2

  // 3rd bracket: 30%
  if remaining > 0:
    bracket3 = min(remaining, 6250.86 - 5029.10)  // = 1221.76
    tax += bracket3 × 0.30
    remaining -= bracket3

  // 4th bracket: 35%
  if remaining > 0:
    tax += remaining × 0.35

  return tax
```

---

## 7. NON-TAXABLE ALLOWANCES (NČZD)

### 7.1 Non-Taxable Allowance on Taxpayer (NČZD na daňovníka)

**Monthly application**: The employer applies a flat **€497.23/month** during the year for all employees (regardless of income level). The annual reconciliation adjusts this.

**Annual calculation** (for the annual overview display):

| Condition | NČZD Amount |
|-----------|-------------|
| Tax base ≤ €26,083.13 (91.8 × ŽM) | **€5,966.73** (21 × ŽM) |
| Tax base > €26,083.13 and < €43,983.32 | **€14,661.11 − (tax base ÷ 3)** |
| Tax base ≥ €43,983.32 (154.8 × ŽM) | **€0** |

```
function annualNCZD_taxpayer(annualTaxBase):
  if annualTaxBase <= 26083.13:
    return 5966.73
  elif annualTaxBase < 43983.32:
    return max(0, 14661.11 - annualTaxBase / 3)
  else:
    return 0
```

> **For monthly calculation**: Always use €497.23/month. The annual reduction only matters for the annual summary display.

### 7.2 Non-Taxable Allowance on Spouse (NČZD na manželku/manžela)

This is an **annual** allowance only — it is NOT applied monthly by the employer. It is claimed in the annual tax return or annual tax settlement.

**Eligibility conditions** (spouse must meet at least ONE):
- Caring for a child under 3 years (or under 6 years with health complications)
- Receiving care allowance (opatrovateľský príspevok)
- Registered as job seeker at the Office of Labour
- Has a disability status (ZŤP or ZŤP/S)

**Calculation**:

| Taxpayer's Annual Tax Base | Spouse Has No Income | Spouse Has Income |
|---------------------------|---------------------|------------------|
| ≤ €43,983.32 (154.8 × ŽM) | €5,455.30 (19.2 × ŽM) | max(0, €5,455.30 − spouse income) |
| > €43,983.32 and < €60,349.20 | max(0, €20,116.40 − tax base ÷ 3) | max(0, €20,116.40 − tax base ÷ 3 − spouse income) |
| ≥ €60,349.20 | €0 | €0 |

```
function annualNCZD_spouse(annualTaxBase, spouseIncome):
  if annualTaxBase <= 43983.32:
    return max(0, 5455.30 - spouseIncome)
  elif annualTaxBase < 60349.20:
    return max(0, 20116.40 - annualTaxBase / 3 - spouseIncome)
  else:
    return 0
```

> **Implementation note**: Since this is annual only, show this in the annual overview section of the results. The monthly net calculation does NOT include spouse allowance — only the annual display should reflect the potential tax saving from spouse allowance.

### 7.3 Supplementary Pension Savings Deduction (Doplnkové dôchodkové sporenie — III. pilier)

- Maximum annual deduction: **€180**
- Only personal contributions count (not employer contributions)
- Account must have been opened after December 31, 2013
- Annual only — for simplicity, include as a toggle in the calculator
- **How it works**: The €180 is subtracted from the annual tax base before calculating annual tax. This saves the taxpayer €180 × 0.19 = **€34.20** per year (or €180 × 0.25 = €45 if in the 25% bracket). Display this as an annual tax saving in the Annual Overview section. It is NOT applied in the monthly payroll calculation.

### 7.4 Pensioner Reduction
If the taxpayer receives an old-age pension, early pension, or service pension, the NČZD on taxpayer is **reduced by the total annual pension received**. If the pension ≥ €5,966.73, the NČZD becomes €0.

---

## 8. TAX BONUS ON CHILDREN (DAŇOVÝ BONUS NA DIEŤA)

### Monthly Amounts

| Child's Age | Monthly Bonus |
|------------|---------------|
| Under 15 years | **€100** |
| 15 to 17 years (inclusive) | **€50** |
| 18+ years | **€0** (no bonus) |

> "Under 15" means the child has not yet turned 15 in the given month. The bonus at €100 is paid for the last time in the month when the child turns 15. From the following month, it drops to €50. The bonus at €50 is paid for the last time in the month the child turns 18.

### Percentage Limit (Cap Based on Tax Base)
The total tax bonus is capped at a percentage of the taxpayer's **partial tax base** (čiastkový základ dane = gross − social insurance − health insurance):

| Number of Children | Maximum % of Partial Tax Base |
|-------------------|------------------------------|
| 1 | 29% |
| 2 | 36% |
| 3 | 43% |
| 4 | 50% |
| 5 | 57% |
| 6 or more | 64% |

```
percentageLimits = { 1: 0.29, 2: 0.36, 3: 0.43, 4: 0.50, 5: 0.57, 6: 0.64 }

function getPercentageLimit(numChildren):
  if numChildren >= 6: return 0.64
  return percentageLimits[numChildren] or 0
```

### High-Income Reduction (Phase-Out)
If the taxpayer's **annual tax base** exceeds **€27,432** (= 1.5 × 12 × average monthly wage from 2024 = 1.5 × 12 × €1,524):

```
annualThreshold = 27432

For each child:
  reduction = (annualTaxBase - annualThreshold) / 10
  adjustedBonus = max(0, standardBonus - reduction)
```

> **For monthly calculation**: The monthly threshold is €27,432 / 12 = **€2,286**. If monthly partial tax base exceeds this, reduction kicks in.
> Monthly reduction per child = (monthlyPartialTaxBase × 12 − 27432) / 10 / 12

### Implementation for Calculator

For the **monthly** display, the calculator should:
1. Calculate the raw monthly bonus = sum of (€100 or €50 per child based on age)
2. Calculate the percentage cap = partialTaxBase × percentageLimit
3. Apply the cap: monthlyBonus = min(rawBonus, percentageCap)
4. For high income: calculate the annual reduction and apply monthly
5. The tax bonus **reduces the tax** (it does not increase net directly if tax is already 0)
6. If tax bonus > tax owed, the remaining bonus is **still paid out** (it becomes a negative tax / refund)

```
function calculateTaxBonus(numChildrenUnder15, numChildren15to17, monthlyPartialTaxBase):
  totalChildren = numChildrenUnder15 + numChildren15to17
  if totalChildren == 0: return 0

  rawMonthlyBonus = numChildrenUnder15 × 100 + numChildren15to17 × 50

  // Percentage cap
  pctLimit = getPercentageLimit(totalChildren)
  percentageCap = monthlyPartialTaxBase × pctLimit
  bonus = min(rawMonthlyBonus, percentageCap)

  // High-income reduction (annualized then back to monthly)
  annualTaxBase = monthlyPartialTaxBase × 12
  if annualTaxBase > 27432:
    annualReductionPerChild = (annualTaxBase - 27432) / 10
    monthlyReductionPerChild = annualReductionPerChild / 12
    totalReduction = monthlyReductionPerChild × totalChildren
    bonus = max(0, bonus - totalReduction)

  return bonus
```

---

## 9. CHILD BENEFIT (PRÍDAVOK NA DIEŤA)

This is a **state social benefit**, not a tax deduction. It is paid by the state regardless of income, to any parent/guardian of a dependent child.

### Amounts (2026)

| Benefit | Monthly Amount |
|---------|---------------|
| Child allowance (prídavok na dieťa) | **€60.00** per child |
| Supplement (príplatok k prídavku) | **€30.00** per child |

> **Supplement eligibility**: Only for recipients who **cannot** claim the tax bonus on children — typically pensioners or those with no taxable income. For working parents who claim the tax bonus, only the base €60 applies.

### Implementation
- Show child benefit as an informational/supplementary line in the results (not part of the net salary formula)
- Display as "Monthly child benefit: €60 × N children = €X"
- For the annual overview: €720 per child per year
- If the user indicates they are a pensioner (no tax bonus), show the supplement too: €90/month per child

---

## 10. SPECIAL CASES & EXEMPTIONS

### 10.1 Old-Age Pensioner (Starobný dôchodca) Working as Employee

When an employee has been granted an old-age pension or early old-age pension:

**Employee does NOT pay**:
- Disability insurance (3%) — EXEMPT
- Unemployment insurance (1%) — EXEMPT
- Employee total becomes: **5.4%** (instead of 9.4%)

**Employer does NOT pay**:
- Disability insurance (3%) — EXEMPT
- Unemployment insurance (1%) — EXEMPT
- Employer total becomes: **21.2%** capped + 0.8% uncapped (instead of 25.2% + 0.8%)

**Additionally**:
- The NČZD on taxpayer is reduced by the annual pension amount received
- No tax bonus on children can be claimed (generally, as pensioners' children are typically 18+)

### 10.2 Disability Pension Recipient (Invalidný dôchodca) Working as Employee

When an employee has >70% disability and receives a disability pension:
- **Unemployment insurance**: NOT paid by employee or employer
- **Health insurance**: Reduced rate applies (employee 2.5%, employer 5.5%)

When an employee has ≤70% disability:
- Social insurance contributions are paid normally
- **Health insurance**: Reduced rate applies (employee 2.5%, employer 5.5%)

### 10.3 ZŤP (Severely Disabled Person) Status
A person with a ZŤP card (preukaz ZŤP) has:
- Reduced health insurance rate: employee **2.5%** (instead of 5%)
- Reduced employer health insurance: **5.5%** (instead of 11%)
- This is independent of whether they are on a disability pension

### 10.4 Agreement Workers (Dohodári)
Out of scope for this calculator — focus on standard employment contracts only.

---

## 11. INPUT FIELDS SPECIFICATION

### Card 1: Gross Salary
- Slider: min=700, max=15000, step=50, default=2000
- Number input for exact entry
- What-if bar (standard from template)
- Tab bar: "From Gross" / "From Employer Cost"

### Card 2: Tax Options
| Input | Type | ID | Default | Notes |
|-------|------|-----|---------|-------|
| Disability status (ZŤP) | Toggle | `disabilityToggle` | OFF | Reduces health insurance rate |
| Old-age pensioner | Toggle | `pensionerToggle` | OFF | Exempts disability + unemployment insurance, reduces NČZD |
| Monthly pension amount | Number input | `pensionInput` | 0 | Only shown when pensioner toggle is ON. Used to reduce annual NČZD |
| Supplementary pension (III. pilier) | Toggle | `pillar3Toggle` | OFF | Annual deduction up to €180 |

### Card 3: Family & Children
| Input | Type | ID | Default | Notes |
|-------|------|-----|---------|-------|
| Number of children under 15 | Counter (+/-) | `childrenUnder15` | 0 | Max 10 |
| Number of children 15-17 | Counter (+/-) | `children15to17` | 0 | Max 10 |
| Married | Toggle | `marriedToggle` | OFF | Enables spouse allowance section |
| Spouse qualifies for NČZD | Toggle | `spouseNCZDToggle` | OFF | Only shown when married. Must meet conditions |
| Spouse annual income | Number input | `spouseIncomeInput` | 0 | Only shown when spouse NČZD toggle is ON |

### Card 4: (Optional) Additional Info
| Input | Type | ID | Default | Notes |
|-------|------|-----|---------|-------|
| Show child benefit | Toggle | `childBenefitToggle` | ON | Shows informational child benefit amount |

---

## 12. UI CUSTOMIZATION (CSS VARIABLES & THEME)

### Slovak Flag Colors
- White: `#FFFFFF`
- Blue: `#0B4EA2`
- Red: `#EE1C25`

### Recommended CSS Variables
```css
:root {
  --primary: #0B4EA2;
  --primary-light: #1565C0;
  --accent: #EE1C25;
  --accent-green: #0B4EA2;
  --bg: #f5f5f7;
  --card: #ffffff;
  --text: #1a1a2e;
  --text-light: #6b7280;
  --border: #e5e7eb;
  --shadow: 0 4px 24px rgba(0,0,0,0.07);
  --radius: 16px;
  --gold: #d4a843;
  --red: #EE1C25;
  --blue: #0B4EA2;
  --teal: #16a085;
}
```

### Hero Gradient
```css
.hero {
  background: linear-gradient(135deg, #0B4EA2 0%, #1565C0 40%, #1976D2 70%, #EE1C25 100%);
}
.hero::before {
  background: radial-gradient(ellipse, rgba(238,28,37,0.12) 0%, transparent 60%);
}
```

### Flag Strip
```html
<div class="flag-strip">
  <div style="background:#FFFFFF"></div>
  <div style="background:#0B4EA2"></div>
  <div style="background:#EE1C25"></div>
</div>
```

### Range Slider
```css
input[type="range"] {
  background: linear-gradient(90deg, #0B4EA2, #EE1C25);
}
```

### Result Hero
```css
.result-hero {
  background: linear-gradient(135deg, #0B4EA2, #1565C0);
}
```

---

## 13. TRANSLATION SYSTEM

Every user-visible string must support both English (`en`) and Slovak (`sk`).

### Language Buttons in Hero
```html
<div class="lang-selector">
  <button class="lang-btn active" data-lang="en" title="English">🇬🇧</button>
  <button class="lang-btn" data-lang="sk" title="Slovenčina">🇸🇰</button>
</div>
```

### Translation Dictionary (Key Translations)

```js
var T = {
  heroTitle:        { en: '🇸🇰 Slovakia Salary Calculator 2026', sk: '🇸🇰 Mzdová kalkulačka 2026' },
  heroSub:          { en: 'Gross-to-net calculator with all deductions and family benefits', sk: 'Kalkulačka z hrubej na čistú mzdu so všetkými odvodmi a rodinnými benefitmi' },
  badge:            { en: 'Valid from January 1, 2026', sk: 'Platné od 1. januára 2026' },
  grossSalary:      { en: 'Gross Salary', sk: 'Hrubá mzda' },
  monthlyGross:     { en: 'Monthly gross salary (€)', sk: 'Mesačná hrubá mzda (€)' },
  perMonth:         { en: '€/month', sk: '€/mesiac' },
  fromGross:        { en: 'From Gross', sk: 'Z hrubej mzdy' },
  fromEmployerCost: { en: 'From Employer Cost', sk: 'Z nákladov zamestnávateľa' },
  taxOptions:       { en: 'Tax Options', sk: 'Daňové nastavenia' },
  disability:       { en: 'Disability status (ZŤP)', sk: 'Zdravotné postihnutie (ZŤP)' },
  disabilitySub:    { en: 'Reduced health insurance rate', sk: 'Znížená sadzba zdravotného poistenia' },
  pensioner:        { en: 'Old-age pensioner', sk: 'Starobný dôchodca' },
  pensionerSub:     { en: 'Exempt from disability & unemployment insurance', sk: 'Oslobodenie od invalidného a poistenia v nezamestnanosti' },
  monthlyPension:   { en: 'Monthly pension amount (€)', sk: 'Mesačný dôchodok (€)' },
  pillar3:          { en: 'Supplementary pension (III. pillar)', sk: 'Doplnkové dôchodkové sporenie (III. pilier)' },
  pillar3Sub:       { en: 'Annual deduction up to €180', sk: 'Ročný odpočet do výšky 180 €' },
  childrenFamily:   { en: 'Children & Family', sk: 'Deti a rodina' },
  childrenUnder15:  { en: 'Children under 15', sk: 'Deti do 15 rokov' },
  children15to17:   { en: 'Children aged 15–17', sk: 'Deti vo veku 15–17' },
  married:          { en: 'Married', sk: 'Ženatý/Vydatá' },
  spouseNCZD:       { en: 'Spouse qualifies for tax allowance', sk: 'Manžel/ka spĺňa podmienky na NČZD' },
  spouseNCZDSub:    { en: 'Caring for child <3y, job seeker, disabled, or receiving care allowance', sk: 'Starostlivosť o dieťa <3r, evidencia na ÚP, ZŤP, alebo opatrovateľský príspevok' },
  spouseIncome:     { en: 'Spouse annual income (€)', sk: 'Ročný príjem manžela/ky (€)' },
  monthlyNet:       { en: 'Monthly Net Salary', sk: 'Čistá mesačná mzda' },
  annualNet:        { en: 'Annual net', sk: 'Ročná čistá mzda' },
  effectiveRate:    { en: 'Effective rate', sk: 'Efektívna sadzba' },
  employerCost:     { en: 'Employer cost', sk: 'Náklady zamestnávateľa' },
  takeHomeRatio:    { en: 'Take-home ratio', sk: 'Pomer čistej mzdy' },
  breakdown:        { en: 'Monthly Breakdown', sk: 'Mesačný rozpis' },
  grossSalaryRow:   { en: 'Gross salary', sk: 'Hrubá mzda' },
  socialIns:        { en: 'Social insurance', sk: 'Sociálne poistenie' },
  sickness:         { en: 'Sickness', sk: 'Nemocenské' },
  oldAgePension:    { en: 'Old-age pension', sk: 'Starobné' },
  disabilityIns:    { en: 'Disability', sk: 'Invalidné' },
  unemployment:     { en: 'Unemployment', sk: 'Nezamestnanosť' },
  healthIns:        { en: 'Health insurance', sk: 'Zdravotné poistenie' },
  incomeTax:        { en: 'Income tax', sk: 'Daň z príjmov' },
  taxAllowance:     { en: 'Tax-free allowance (NČZD)', sk: 'Nezdaniteľná časť (NČZD)' },
  taxableIncome:    { en: 'Taxable income', sk: 'Zdaniteľný príjem' },
  taxBonus:         { en: 'Tax bonus on children', sk: 'Daňový bonus na deti' },
  netSalary:        { en: 'Net salary', sk: 'Čistá mzda' },
  employerCosts:    { en: 'Employer Costs', sk: 'Náklady zamestnávateľa' },
  empSocialIns:     { en: 'Social insurance (employer)', sk: 'Sociálne poistenie (zamestnávateľ)' },
  empHealthIns:     { en: 'Health insurance (employer)', sk: 'Zdravotné poistenie (zamestnávateľ)' },
  empAccidentIns:   { en: 'Accident insurance', sk: 'Úrazové poistenie' },
  totalEmployerCost:{ en: 'Total employer cost', sk: 'Celkové náklady zamestnávateľa' },
  childBenefit:     { en: 'Child Benefit (State)', sk: 'Prídavok na dieťa (štát)' },
  childBenefitSub:  { en: 'Paid by the state, not from salary', sk: 'Vypláca štát, nie zo mzdy' },
  perChild:         { en: 'per child', sk: 'na dieťa' },
  annualOverview:   { en: 'Annual Overview', sk: 'Ročný prehľad' },
  spouseAllowance:  { en: 'Spouse tax allowance (annual)', sk: 'NČZD na manžela/ku (ročne)' },
  pillar3Deduction: { en: 'Pillar III deduction (annual)', sk: 'Odpočet III. pilier (ročne)' },
  annualTaxSaving:  { en: 'Annual tax saving', sk: 'Ročná úspora na dani' },
  netVsGross:       { en: 'Net vs. Gross', sk: 'Čistá vs. hrubá mzda' },
  taxRates:         { en: 'Tax Rates', sk: 'Daňové sadzby' },
  disclaimer:       { en: 'This calculator provides estimates only. Consult a tax advisor for precise calculations.', sk: 'Táto kalkulačka poskytuje iba odhady. Pre presné výpočty konzultujte daňového poradcu.' },
  showChildBenefit: { en: 'Show child benefit', sk: 'Zobraziť prídavok na dieťa' },
  showChildBenefitSub: { en: 'State-paid benefit (€60/month per child)', sk: 'Štátna dávka (60 €/mesiac na dieťa)' },
  raise10:          { en: '+10% Raise', sk: '+10% Zvýšenie' },
  raise20:          { en: '+20% Raise', sk: '+20% Zvýšenie' },
  bonus1k:          { en: '+1K Bonus', sk: '+1K Bonus' },
  bonus2k:          { en: '+2K Bonus', sk: '+2K Bonus' },
  minWage:          { en: 'Min Wage', sk: 'Min. mzda' },
  supportFinancing: { en: 'Support financing', sk: 'Financovanie podpory' },
  guarantee:        { en: 'Guarantee', sk: 'Garančné' },
  reserveFund:      { en: 'Reserve solidarity fund', sk: 'Rezervný fond solidarity' },
  accident:         { en: 'Accident', sk: 'Úrazové' },
};
```

---

## 14. VERIFICATION EXAMPLES

### Example 1: Single, No Children, €2,000 Gross
```
Gross: €2,000.00

Social insurance:
  Assessment base: €2,000 (below cap)
  Sickness:    2,000 × 0.014 = €28.00
  Old-age:     2,000 × 0.040 = €80.00
  Disability:  2,000 × 0.030 = €60.00
  Unemployment:2,000 × 0.010 = €20.00
  TOTAL:       2,000 × 0.094 = €188.00

Health insurance:
  2,000 × 0.05 = €100.00

Partial tax base: 2,000 - 188 - 100 = €1,712.00
NČZD (monthly): €497.23
Taxable income: 1,712.00 - 497.23 = €1,214.77
Tax (19%): 1,214.77 × 0.19 = €230.81

Net: 2,000 - 188 - 100 - 230.81 = €1,481.19

Employer costs:
  Social (capped): 2,000 × 0.249 = €498.00
  Accident (uncapped): 2,000 × 0.008 = €16.00
  Health: 2,000 × 0.11 = €220.00
  Total employer cost: 2,000 + 498 + 16 + 220 = €2,734.00
```

### Example 2: Married, 2 Children Under 15, €3,000 Gross
```
Gross: €3,000.00

Social insurance: 3,000 × 0.094 = €282.00
Health insurance: 3,000 × 0.05 = €150.00
Partial tax base: 3,000 - 282 - 150 = €2,568.00
NČZD (monthly): €497.23
Taxable income: 2,568.00 - 497.23 = €2,070.77
Tax (19%): 2,070.77 × 0.19 = €393.45

Tax bonus (2 children under 15): 2 × €100 = €200.00
  Percentage cap check: 2,568.00 × 0.36 = €924.48 → bonus €200 is within cap ✓
  High-income check: annual base = 2,568 × 12 = 30,816 > 27,432
    Reduction per child: (30,816 - 27,432) / 10 = €338.40/year = €28.20/month
    Total reduction: 28.20 × 2 = €56.40
    Adjusted bonus: 200.00 - 56.40 = €143.60

Tax after bonus: 393.45 - 143.60 = €249.85
Net: 3,000 - 282 - 150 - 249.85 = €2,318.15

Child benefit (informational): 2 × €60 = €120/month
```

### Example 3: Old-Age Pensioner, No Children, €1,500 Gross, Pension €600/month
```
Gross: €1,500.00

Social insurance (pensioner — no disability, no unemployment):
  Sickness:    1,500 × 0.014 = €21.00
  Old-age:     1,500 × 0.040 = €60.00
  Disability:  EXEMPT (€0)
  Unemployment:EXEMPT (€0)
  TOTAL: €81.00 (effective rate: 5.4%)

Health insurance: 1,500 × 0.05 = €75.00

Partial tax base: 1,500 - 81 - 75 = €1,344.00
NČZD (monthly): €497.23
  BUT annual pension = 600 × 12 = €7,200 > €5,966.73
  → Annual NČZD reduced to 0 (pension exceeds allowance)
  → Monthly NČZD adjustment: employer still applies €497.23/month during year,
    but annual settlement will claw this back
  FOR CALCULATOR: Show effective monthly NČZD as €0 for pensioner if pension ≥ €497.23/month

Taxable income: 1,344.00 - 0 = €1,344.00
Tax (19%): 1,344.00 × 0.19 = €255.36

Net: 1,500 - 81 - 75 - 255.36 = €1,088.64
```

### Example 4: High Earner, €8,000 Gross, Single, No Children
```
Gross: €8,000.00

Social insurance: 8,000 × 0.094 = €752.00 (still below cap of €16,764)
Health insurance: 8,000 × 0.05 = €400.00

Partial tax base: 8,000 - 752 - 400 = €6,848.00
NČZD (monthly): €497.23
  Annual base = 6,848 × 12 = €82,176 > €43,983.32 → annual NČZD = €0
  → Monthly NČZD effective: €0

Taxable income: 6,848.00
Tax calculation (monthly brackets):
  Bracket 1 (19%): 3,665.28 × 0.19 = €696.40
  Bracket 2 (25%): (5,029.10 - 3,665.28) × 0.25 = 1,363.82 × 0.25 = €340.96
  Bracket 3 (30%): (6,250.86 - 5,029.10) × 0.30 = 1,221.76 × 0.30 = €366.53
  Bracket 4 (35%): (6,848.00 - 6,250.86) × 0.35 = 597.14 × 0.35 = €209.00
  TOTAL TAX: €1,612.89

Net: 8,000 - 752 - 400 - 1,612.89 = €5,235.11
```

---

## 15. SOURCES & LEGAL REFERENCES

### Primary Legal Sources
- **Zákon č. 595/2003 Z.z. o dani z príjmov** (Income Tax Act) — §11 (non-taxable parts), §33 (tax bonus on children)
- **Zákon č. 461/2003 Z.z. o sociálnom poistení** (Social Insurance Act) — contribution rates
- **Zákon č. 580/2004 Z.z. o zdravotnom poistení** (Health Insurance Act) — contribution rates
- **Zákon č. 600/2003 Z.z. o prídavku na dieťa** (Child Allowance Act)
- **Third Consolidation Package** (effective January 1, 2026)

### Cross-Referenced Research Sources
- [PwC Tax Summaries — Slovak Republic Individual Taxes](https://taxsummaries.pwc.com/slovak-republic/individual/taxes-on-personal-income)
- [PwC Tax Summaries — Slovak Republic Other Taxes (Social/Health)](https://taxsummaries.pwc.com/slovak-republic/individual/other-taxes)
- [Accace — Consolidation Package Slovakia 2026](https://www.accace.com/consolidation-package-in-slovakia-from-2026/)
- [Accace — 2026 Tax Guideline for Slovakia](https://accace.com/tax-guideline-for-slovakia/)
- [KPMG — Slovakia New Tax Provisions 2026](https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-235.html)
- [Grant Thornton — Consolidation of Public Finances 2026](https://www.grantthornton.sk/en/news/consolidation-of-public-finances-for-2026-the-most-significant-changes-for-individuals-and-employers)
- [Sociálna poisťovňa — Tables of Insurance Premiums from January 2026](https://www.socpoist.sk/socialne-poistenie/platenie-poistneho/tabulky-platenia-poistneho/tabulky-platenia-poistneho-od-1-6)
- [Podnikajte.sk — Daňový bonus na dieťa 2026](https://www.podnikajte.sk/dan-z-prijmov/danovy-bonus-na-dieta-2026)
- [Podnikajte.sk — NČZD 2026](https://www.podnikajte.sk/dan-z-prijmov/nezdanitelne-casti-zakladu-dane-2026)
- [Finsider.sk — Prídavky na dieťa 2026](https://www.finsider.sk/servis/pridavky-na-dieta-2026/)
- [WageIndicator — Slovakia Minimum Wage 2026](https://wageindicator.org/salary/minimum-wage/minimum-wages-news/2026/minimum-wage-raised-in-slovakia-from-01-january-2026-january-01-2026)
- [Marian Drozd Tax Advisor — Salary Calculator 2026](https://www.danovy-poradca.sk/en/resources/kalkulacky/mzda)

---

## IMPLEMENTATION CHECKLIST

- [ ] Duplicate `template.html` → `Slovakia/slovakia.html`
- [ ] Update `<head>`: meta, title, CSS variables for Slovak theme
- [ ] Set `<body data-page="slovakia">`
- [ ] Fix shared resource paths: `../shared.css`, `../nav.js`, `../shared.js`
- [ ] Implement hero section with 🇬🇧/🇸🇰 language selector
- [ ] Implement salary input card (slider min=700, max=15000, default=2000)
- [ ] Implement tax options card (ZŤP toggle, pensioner toggle + pension input, III. pillar toggle)
- [ ] Implement family card (children under 15 counter, children 15-17 counter, married toggle, spouse NČZD toggle + income input)
- [ ] Implement child benefit toggle
- [ ] Implement `computeBreakdown()` with all social/health/tax logic
- [ ] Implement `computeForGross()` wrapper for shared.js compatibility
- [ ] Implement `renderResults()`, `renderBreakdown()`, `renderDonut()`, `renderEmployerBars()`
- [ ] Implement `renderAnnualBar()` and `renderCurveCharts()`
- [ ] Implement all verification examples and check results match
- [ ] Implement "From Employer Cost" reverse calculation mode
- [ ] Implement full translation system (en/sk)
- [ ] Register in `nav.js` COUNTRIES array
- [ ] Register in `shared.js` pageFlags object
- [ ] Test edge cases: pensioner, ZŤP, high earner above all brackets, minimum wage, 0 children, 6+ children
