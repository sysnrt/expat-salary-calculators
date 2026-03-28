# Ireland Income Tax System -- Developer Documentation

**Jurisdiction:** Republic of Ireland
**Tax Year:** 2026 (1 January 2026 -- 31 December 2026)
**Last Updated:** 28 March 2026
**Author:** Sarah (Taxation Expert Agent)
**Target Audience:** David (Developer) -- for salary calculator implementation

---

## Table of Contents

1. [Regulatory Sources](#1-regulatory-sources)
2. [System Overview](#2-system-overview)
3. [Income Tax Bands and Rates](#3-income-tax-bands-and-rates)
4. [Tax Credits](#4-tax-credits)
5. [Universal Social Charge (USC)](#5-universal-social-charge-usc)
6. [Pay Related Social Insurance (PRSI)](#6-pay-related-social-insurance-prsi)
7. [Pension Relief](#7-pension-relief)
8. [Other Deductions and Reliefs](#8-other-deductions-and-reliefs)
9. [Benefit in Kind (BIK)](#9-benefit-in-kind-bik)
10. [Pay Period Calculations](#10-pay-period-calculations)
11. [Emergency Tax](#11-emergency-tax)
12. [Calculation Order and Flow](#12-calculation-order-and-flow)
13. [Worked Examples](#13-worked-examples)
14. [Edge Cases and Developer Notes](#14-edge-cases-and-developer-notes)
15. [2026 Budget Changes Summary](#15-2026-budget-changes-summary)

---

## 1. Regulatory Sources

| Source | URL | Retrieved |
|--------|-----|-----------|
| Revenue.ie -- Tax rates, bands and reliefs | https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/tax-relief-charts/index.aspx | 2026-03-28 |
| Revenue.ie -- USC standard rates and thresholds | https://www.revenue.ie/en/jobs-and-pensions/usc/standard-rates-thresholds.aspx | 2026-03-28 |
| Revenue.ie -- USC reduced rates | https://www.revenue.ie/en/jobs-and-pensions/usc/reduced-rates.aspx | 2026-03-28 |
| Revenue.ie -- Calculating USC | https://www.revenue.ie/en/jobs-and-pensions/usc/calculating-usc.aspx | 2026-03-28 |
| Revenue.ie -- Tax credits | https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/income-and-employment/employee-tax-credit/index.aspx | 2026-03-28 |
| Revenue.ie -- Pension relief limits | https://www.revenue.ie/en/jobs-and-pensions/pension/relief/tax-relief-limits.aspx | 2026-03-28 |
| Revenue.ie -- Week 1 basis | https://www.revenue.ie/en/employing-people/paying-an-employee/methods-of-calculating-tax/week1-basis.aspx | 2026-03-28 |
| Revenue.ie -- Budget 2026 Summary (PDF) | https://www.revenue.ie/en/corporate/press-office/budget-information/current-year/budget-summary.pdf | 2026-03-28 |
| Citizens Information -- Paying PRSI | https://www.citizensinformation.ie/en/social-welfare/irish-social-welfare-system/social-insurance-prsi/paying-social-insurance/ | 2026-03-28 |
| Citizens Information -- USC | https://www.citizensinformation.ie/en/money-and-tax/tax/income-tax/universal-social-charge/ | 2026-03-28 |
| Gov.ie -- PRSI Class A Rates | https://www.gov.ie/en/department-of-social-protection/publications/prsi-class-a-rates/ | 2026-03-28 |
| Gov.ie -- PRSI Contribution Rates and User Guide (SW14) 2026 | https://assets.gov.ie/static/documents/cb168977/PRSI_C20260116_Contribution_Rates_and_User_Guide_-_SW_14_-_English_Version_-_January_2026_.pdf-web.pdf | 2026-03-28 |
| KPMG -- Budget 2026 Tables | https://kpmg.com/ie/en/insights/tax/budget-2026/tables.html | 2026-03-28 |
| NKC -- PRSI Rate Increases 2025-2028 | https://www.nkc.ie/news/new-prsi-rates-and-thresholds | 2026-03-28 |
| Gov.ie -- Budget 2026 tax changes announcement | https://www.gov.ie/en/department-of-finance/press-releases/ | 2026-03-28 |

---

## 2. System Overview

The Irish salary deduction system has **four** main components deducted from an employee's gross pay:

1. **Income Tax (PAYE)** -- Progressive tax at 20% and 40%, reduced by tax credits
2. **USC (Universal Social Charge)** -- Separate progressive charge on gross income
3. **PRSI (Pay Related Social Insurance)** -- Social insurance contribution at flat rate
4. **Pension contributions** (optional) -- Pre-tax deduction with relief at marginal rate

**Net pay formula:**

```
Net Pay = Gross Pay
        - Income Tax (after credits)
        - USC
        - Employee PRSI
        - Pension Contribution (if applicable)
```

**IMPORTANT:** Income Tax, USC, and PRSI are calculated independently on (potentially different) income bases. They are NOT interdependent, though pension contributions reduce the income base for Income Tax but NOT for USC or PRSI.

---

## 3. Income Tax Bands and Rates

### 3.1 Tax Rates

Ireland has two income tax rates:

| Rate | Name |
|------|------|
| **20%** | Standard rate |
| **40%** | Higher rate |

### 3.2 Standard Rate Cut-Off Points (Annual, 2026)

| Category | Standard Rate Band (20%) | Balance (40%) |
|----------|--------------------------|---------------|
| Single person | First €44,000 | Remainder |
| Single person (SPCCC qualifying) | First €48,000 | Remainder |
| Married couple / civil partners (one income) | First €53,000 | Remainder |
| Married couple / civil partners (two incomes) | Up to €88,000 (see below) | Remainder |
| Widowed person / surviving civil partner (no dependent children) | First €44,000 | Remainder |

### 3.3 Married Couples -- Two Incomes: Band Transfer Rules

For married couples / civil partners where both are earning:

- The base standard rate band is **€53,000**
- This can be increased by the **lesser** of:
  - **€35,000**, OR
  - The income of the lower-earning spouse
- Maximum combined standard rate band = **€88,000** (€53,000 + €35,000)
- The €35,000 increase is **NOT transferable** -- one spouse cannot give their unused portion to the other

**Developer implementation:**

```
// For jointly-assessed married couple (two incomes)
let baseband = 53000;
let increase = Math.min(35000, lowerEarnerIncome);
let combinedStandardBand = baseband + increase;
// Each spouse's band: allocate baseband first to higher earner if needed
```

### 3.4 Income Tax Calculation Formula

```
grossTaxableIncome = grossIncome - pensionContribution - otherAllowableDeductions

if (grossTaxableIncome <= standardRateBand) {
    grossTax = grossTaxableIncome * 0.20;
} else {
    grossTax = (standardRateBand * 0.20) + ((grossTaxableIncome - standardRateBand) * 0.40);
}

incomeTaxPayable = Math.max(0, grossTax - totalTaxCredits);
```

**CRITICAL:** Tax credits reduce the tax liability, NOT the taxable income. Tax payable cannot go below zero (unused credits are not refundable except in specific circumstances like PAYE overpayments).

---

## 4. Tax Credits

### 4.1 Main Tax Credits (Annual, 2026)

| Credit | Amount (EUR) | Notes |
|--------|-------------|-------|
| **Single Person Tax Credit** | 2,000 | Default for single/widowed (no dependent children) |
| **Married Person / Civil Partner Tax Credit** | 4,000 | Replaces Single Person Credit for married/civil partners |
| **Employee (PAYE) Tax Credit** | 2,000 | For PAYE employees; limited to 20% of PAYE income if income < €10,000 |
| **Earned Income Tax Credit** | 2,000 | For self-employed; cannot be combined with Employee Tax Credit on same income |
| **Single Person Child Carer Credit (SPCCC)** | 1,900 | For qualifying single parents; also extends standard rate band to €48,000 |
| **Home Carer Tax Credit** | 1,950 | For married couples where one spouse is a home carer; income limit on carer |
| **Widowed Person / Surviving Civil Partner (no dependent children)** | 2,540 | Instead of Single Person Credit |
| **Widowed Person / Surviving Civil Partner -- Bereaved in Year of Assessment** | 4,000 | Year of bereavement |
| **Age Tax Credit (single/widowed)** | 245 | If aged 65+ at any point during the year |
| **Age Tax Credit (married/partnered)** | 490 | If either spouse aged 65+ |
| **Incapacitated Child Tax Credit** | 3,800 | Per qualifying child |
| **Blind Person's Tax Credit (one spouse)** | 1,950 | |
| **Blind Person's Tax Credit (both spouses)** | 3,900 | |
| **Rent Tax Credit (single)** | 1,000 max | 20% of rent paid, capped at €1,000 |
| **Rent Tax Credit (married/jointly assessed)** | 2,000 max | 20% of rent paid, capped at €2,000 |

### 4.2 Employee (PAYE) Tax Credit -- Special Rule

The Employee Tax Credit is capped at the **lower** of:
- €2,000, OR
- 20% of the employee's PAYE income

```
employeeTaxCredit = Math.min(2000, grossPAYEIncome * 0.20);
```

For employees earning €10,000 or more, the full €2,000 credit applies. Below €10,000, the credit is proportionally reduced.

### 4.3 Default Credits for a Standard Single PAYE Employee

For a typical single PAYE employee, the default credits are:

| Credit | Amount |
|--------|--------|
| Single Person Tax Credit | €2,000 |
| Employee (PAYE) Tax Credit | €2,000 |
| **Total** | **€4,000** |

This means a single PAYE employee earning €20,000 or less pays **zero income tax** (€20,000 * 20% = €4,000 gross tax - €4,000 credits = €0).

### 4.4 Default Credits for a Married Couple (One PAYE Income)

| Credit | Amount |
|--------|--------|
| Married Person Tax Credit | €4,000 |
| Employee (PAYE) Tax Credit | €2,000 |
| **Total** | **€6,000** |

### 4.5 Rent Tax Credit

- Available for tax years 2022--2028 (extended in Budget 2026)
- Credit = 20% of qualifying rent payments, subject to max
- Single: max €1,000; Married/jointly assessed: max €2,000
- Tenancy must be registered with the RTB (Residential Tenancies Board)
- Cannot be claimed where housing support (e.g., HAP) is received

---

## 5. Universal Social Charge (USC)

### 5.1 Exemption

USC does **not** apply if total income for the year is **€13,000 or less**.

**CRITICAL:** If income exceeds €13,000, USC applies to the **entire** income from the first euro -- there is no free threshold. The €13,000 is a cliff, not a band.

### 5.2 Standard USC Rates and Bands (2026)

| Band | Rate | Income Range | Cumulative Upper Limit |
|------|------|-------------|----------------------|
| 1 | **0.5%** | First €12,012 | €12,012 |
| 2 | **2.0%** | Next €16,688 | €28,700 |
| 3 | **3.0%** | Next €41,344 | €70,044 |
| 4 | **8.0%** | Balance | No limit |

### 5.3 Reduced USC Rates (Medical Card Holders / Age 70+)

Applies if **both** conditions are met:
1. Total income is **€60,000 or less**, AND
2. The individual is **aged 70 or over** at any point during the year, OR holds a **full medical card** (not just a GP visit card)

| Band | Rate | Income Range |
|------|------|-------------|
| 1 | **0.5%** | First €12,012 |
| 2 | **2.0%** | Balance |

**NOTE:** If income exceeds €60,000, standard rates apply regardless of age/medical card status.

### 5.4 Self-Employment Surcharge

An additional **3% USC surcharge** applies to **non-PAYE income exceeding €100,000**.

This is relevant if the calculator supports self-employed or mixed-income scenarios. For a pure PAYE salary calculator, this can be ignored.

### 5.5 USC Calculation Formula (Standard)

```
function calculateUSC(annualIncome) {
    if (annualIncome <= 13000) return 0;  // Exemption

    let usc = 0;
    let remaining = annualIncome;

    // Band 1: 0.5% on first €12,012
    let band1 = Math.min(remaining, 12012);
    usc += band1 * 0.005;
    remaining -= band1;

    // Band 2: 2% on next €16,688
    let band2 = Math.min(remaining, 16688);
    usc += band2 * 0.02;
    remaining -= band2;

    // Band 3: 3% on next €41,344
    let band3 = Math.min(remaining, 41344);
    usc += band3 * 0.03;
    remaining -= band3;

    // Band 4: 8% on balance
    usc += remaining * 0.08;

    return usc;
}
```

### 5.6 USC Income Base

USC is charged on **gross income before pension deductions**. Pension contributions do **NOT** reduce the USC base. This is a key difference from Income Tax.

Items exempt from USC:
- Social welfare payments
- Payments subject to DIRT (deposit interest retention tax) -- already taxed at source

---

## 6. Pay Related Social Insurance (PRSI)

### 6.1 Overview

PRSI has two components for employed workers:
- **Employee PRSI** -- deducted from employee's gross pay
- **Employer PRSI** -- paid by employer on top of gross pay (not deducted from employee)

For a **net pay calculator**, only the employee portion is deducted. Employer PRSI is a cost to the employer.

### 6.2 Employee PRSI -- Class A (2026)

**IMPORTANT: Split-year rates apply in 2026.**

| Period | Rate |
|--------|------|
| 1 January -- 30 September 2026 | **4.2%** |
| 1 October -- 31 December 2026 | **4.35%** |

PRSI is charged on **all gross reckonable earnings** (no upper earnings limit).

### 6.3 Employee PRSI Exemption Threshold

- Employees earning **€352 or less per week** are **exempt** from employee PRSI (classified under subclass AO -- zero employee contribution)
- Equivalent thresholds: €704 fortnightly, €1,525 monthly, €18,304 annually

**CRITICAL:** If weekly earnings exceed €352, PRSI applies to the **entire** gross pay from the first euro -- the €352 is an exemption cliff, not an allowance.

### 6.4 PRSI Credit (Tapered Relief)

For employees earning between **€352.01 and €424.00 per week**, a weekly PRSI credit applies to reduce the PRSI charge:

**Maximum weekly credit:** €12.00

**Taper formula:**

```
if (weeklyGross <= 352.00) {
    // Exempt from PRSI
    employeePRSI = 0;
} else if (weeklyGross <= 424.00) {
    // PRSI credit applies
    let grossPRSI = weeklyGross * 0.042;  // (or 0.0435 from Oct)
    let excessOver352 = weeklyGross - 352.01;
    let creditReduction = excessOver352 / 6;
    let credit = Math.max(0, 12.00 - creditReduction);
    employeePRSI = Math.max(0, grossPRSI - credit);
} else {
    // No credit -- full PRSI
    employeePRSI = weeklyGross * 0.042;  // (or 0.0435 from Oct)
}
```

**Example:** Weekly earnings = €380
- Gross PRSI = €380 * 4.2% = €15.96
- Excess over €352.01 = €27.99
- Credit reduction = €27.99 / 6 = €4.67
- Net credit = €12.00 - €4.67 = €7.33
- PRSI payable = €15.96 - €7.33 = **€8.63**

### 6.5 Employer PRSI -- Class A (2026)

| Period | Earnings Threshold | Lower Rate | Higher Rate |
|--------|-------------------|------------|-------------|
| 1 Jan -- 30 Sep 2026 | €552/week | **9.0%** (at or below) | **11.25%** (above) |
| 1 Oct -- 31 Dec 2026 | €552/week | **9.15%** (at or below) | **11.40%** (above) |

**Equivalent thresholds:** €552/week = €1,104 fortnightly = €2,392 monthly = €28,704 annually

**CRITICAL:** The employer rate is determined by weekly (or equivalent period) earnings, NOT annual earnings. If weekly pay is €552 or less, the lower rate applies to ALL of the employee's earnings for that period. If over €552, the higher rate applies to ALL earnings for that period.

### 6.6 PRSI Income Base

PRSI is charged on **gross reckonable pay** -- this includes salary, overtime, bonuses, commission, and BIK.

**Pension contributions do NOT reduce the PRSI base.** This is the same as USC.

### 6.7 PRSI Class A Subclasses (Reference)

For completeness, the main subclasses within Class A:

| Subclass | Employee Rate | Employer Rate | Condition |
|----------|--------------|---------------|-----------|
| **AO** | 0% | 11.25% (or 9.0% if <=€552/wk) | Weekly earnings <= €352 |
| **AX** | 4.2% | 11.25% | Weekly earnings > €352 and > €552 |
| **AL** | 4.2% | 9.0% | Weekly earnings > €352 and <= €552 |
| **A1** | 4.2% | 11.25% | Community employment schemes |

*Note: From 1 October 2026, the employee rate becomes 4.35% and employer rates increase by 0.15% across all subclasses.*

### 6.8 Developer Implementation Note: Split-Year PRSI

Because PRSI rates change on 1 October 2026, the calculator should either:

**Option A (Simplified -- recommended for MVP):** Use a blended annual rate:
- Employee: (4.2% * 39 weeks + 4.35% * 13 weeks) / 52 = **4.2375%** approximately
- Or allow the user to select their pay period and apply the correct rate based on date

**Option B (Accurate):** Track pay periods and apply:
- 4.2% for pay periods ending on or before 30 September 2026
- 4.35% for pay periods ending on or after 1 October 2026

---

## 7. Pension Relief

### 7.1 Age-Related Contribution Limits

Pension contributions qualify for income tax relief up to the following percentages of **gross relevant earnings**, subject to the earnings cap:

| Age | Maximum % of Earnings |
|-----|----------------------|
| Under 30 | 15% |
| 30 -- 39 | 20% |
| 40 -- 49 | 25% |
| 50 -- 54 | 30% |
| 55 -- 59 | 35% |
| 60 and over | 40% |

### 7.2 Earnings Cap

Maximum pensionable earnings for relief: **€115,000** per year (2026)

### 7.3 How Pension Relief Works

- Employee pension contributions are deducted from gross income **before** calculating Income Tax
- Relief is effectively at the employee's **marginal rate** (20% or 40%)
- Pension contributions do **NOT** reduce the base for USC or PRSI

```
taxableIncomeForIT = grossIncome - Math.min(pensionContribution, maxAllowablePension);
// USC and PRSI are still calculated on grossIncome
```

### 7.4 Maximum Allowable Pension Deduction

```
let agePercentage = getAgePercentage(employeeAge); // from table above
let maxPension = Math.min(grossIncome, 115000) * agePercentage;
let allowablePension = Math.min(actualPensionContribution, maxPension);
```

### 7.5 Standard Fund Threshold

The lifetime limit for tax-relieved pension funds: **€2,200,000** (2026). This increases to €2,400,000 in 2027, €2,600,000 in 2028, and €2,800,000 in 2029. This is not relevant to the salary calculator but is noted for reference.

### 7.6 Employer Pension Contributions

Employer contributions to an employee's pension are **not** counted against the employee's age-related limits. They are a separate benefit and are not subject to employee BIK (within Revenue limits).

---

## 8. Other Deductions and Reliefs

### 8.1 Flat Rate Expenses (FRE)

Revenue allows fixed deductions for certain occupations (e.g., nurses, teachers, shop assistants). These reduce taxable income at the marginal rate.

- The amount varies by occupation (see Revenue PDF: https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/documents/flat-rate-expenses.pdf)
- Typical amounts range from €64 to €318 per year
- For a salary calculator, this could be an optional input field where the user enters their FRE amount

### 8.2 Medical Expenses Relief

- Tax relief at **20% (standard rate)** on qualifying medical expenses
- No upper limit on expenses (except dental: €1,000/adult, €500/child)
- Nursing home expenses: relief at **marginal rate** (up to 40%)
- Not typically included in a payroll calculator -- claimed via tax return

### 8.3 Mortgage Interest Tax Credit

- Maximum: **€1,250** (single) / **€2,500** (married)
- For qualifying mortgages on principal private residences
- Typically claimed via tax return, not payroll

### 8.4 Rent Tax Credit

See Section 4.5 above. This is claimed via tax return, not through payroll. However, if the calculator is designed as an after-tax annual calculator, it could be included as an optional credit.

---

## 9. Benefit in Kind (BIK)

### 9.1 Company Car BIK (2026)

BIK on company cars is calculated based on:
- **Original Market Value (OMV)** of the vehicle
- **CO2 emission category** (A1 through D)
- **Annual business kilometres** driven

**OMV reductions for 2026:**
- General reduction: **€10,000** off OMV for categories A1--D (all cars and vans)
- Additional EV reduction: **€20,000** for electric vehicles
- Total EV OMV reduction in 2026: **€30,000**

**New for 2026:** Category **A1** introduced for zero-emission vehicles with reduced rates (6%--15% depending on business mileage), compared to the previous Category A rates (9%--22.5%).

**Van BIK rate:** Flat **8%** of OMV

### 9.2 Health Insurance BIK

Employer-paid health insurance is a BIK. The taxable benefit is the gross premium minus any employee contribution. Tax relief at the standard rate (20%) is given at source by the insurer on the first €1,000 of premium per adult and €500 per child.

### 9.3 BIK and Calculator Scope

BIK is generally an advanced feature. For an MVP salary calculator, BIK can be treated as an optional additional gross income input that is subject to Income Tax, USC, and PRSI.

---

## 10. Pay Period Calculations

### 10.1 Supported Pay Periods

| Period | Divisor | Weeks |
|--------|---------|-------|
| Annual | 1 | 52 |
| Monthly | 12 | ~4.33 |
| Fortnightly | 26 | 2 |
| Weekly | 52 | 1 |

### 10.2 Converting Annual to Period Values

For **cumulative basis** (the standard PAYE method):

```
periodCredits = annualCredits / numberOfPeriods;
periodStandardRateBand = annualStandardRateBand / numberOfPeriods;
periodUSCBands = annualUSCBands.map(band => band / numberOfPeriods);
```

| Annual Value | Monthly | Fortnightly | Weekly |
|-------------|---------|-------------|--------|
| Tax credits: €4,000 | €333.33 | €153.85 | €76.92 |
| Standard band: €44,000 | €3,666.67 | €1,692.31 | €846.15 |
| USC Band 1: €12,012 | €1,001.00 | €462.00 | €231.00 |
| USC Band 2: €28,700 | €2,391.67 | €1,103.85 | €551.92 |
| USC Band 3: €70,044 | €5,837.00 | €2,694.00 | €1,347.00 |

### 10.3 Cumulative vs Non-Cumulative (Week 1 / Month 1) Basis

**Cumulative basis (default):**
- Tax is calculated on a year-to-date basis
- Each pay period, cumulative income, credits, and bands are compared
- This automatically corrects over/under-payments from previous periods

**Non-cumulative (Week 1 / Month 1) basis:**
- Each pay period is treated independently
- No year-to-date accumulation
- Used for emergency tax or when Revenue instructs it via RPN

For a basic salary calculator (showing "what will I take home per month"), the **non-cumulative per-period** approach is sufficient. The cumulative approach is needed for actual payroll processing.

---

## 11. Emergency Tax

### 11.1 When Emergency Tax Applies

Emergency tax applies when an employer does not have a Revenue Payroll Notification (RPN) for the employee. This occurs when:
- A new employee has not registered their employment with Revenue
- Revenue has not yet issued an RPN

### 11.2 Emergency Tax Rates (2026)

**If the employee has provided their PPSN:**

| Week | Income Tax Treatment | USC Treatment |
|------|---------------------|---------------|
| Weeks 1--4 | 20% on income up to the single standard rate band (€846.15/week); 40% on balance. **No tax credits.** | Standard USC rates apply |
| Week 5 onwards | **40% on all income.** No credits. | Standard USC rates apply |

**If the employee has NOT provided their PPSN:**

| Week | Income Tax Treatment | USC Treatment |
|------|---------------------|---------------|
| All weeks | **40% on all income.** No credits. | **11% flat rate** on all income |

### 11.3 Emergency Tax -- Developer Note

Emergency tax is not typically the focus of a salary calculator (which shows regular take-home pay). However, if included, it should be modelled as a separate mode with the rules above.

---

## 12. Calculation Order and Flow

### 12.1 Step-by-Step Calculation Flow

For a given pay period (showing annual calculation; divide bands/credits by period count for periodic):

```
INPUT:
  grossAnnualSalary
  maritalStatus (single / married_one_income / married_two_incomes / single_parent)
  pensionContributionPercentage (optional)
  employeeAge (for pension limits)
  hasMedicalCard (boolean, for USC)
  isOver70 (boolean, for USC)

STEP 1: Determine pension deduction
  maxPensionPercent = lookupAgePercentage(employeeAge)
  maxPensionAmount = min(grossAnnualSalary, 115000) * maxPensionPercent
  pensionDeduction = min(grossAnnualSalary * pensionContributionPercentage, maxPensionAmount)

STEP 2: Calculate Income Tax
  taxableIncome = grossAnnualSalary - pensionDeduction
  standardRateBand = lookupBand(maritalStatus)  // e.g., €44,000 for single
  taxCredits = lookupCredits(maritalStatus)      // e.g., €4,000 for single PAYE

  if (taxableIncome <= standardRateBand)
    grossTax = taxableIncome * 0.20
  else
    grossTax = (standardRateBand * 0.20) + ((taxableIncome - standardRateBand) * 0.40)

  incomeTax = max(0, grossTax - taxCredits)

STEP 3: Calculate USC (on GROSS income -- not reduced by pension)
  if (grossAnnualSalary <= 13000)
    usc = 0
  else if (hasMedicalCard || isOver70) AND (grossAnnualSalary <= 60000)
    usc = calculateReducedUSC(grossAnnualSalary)
  else
    usc = calculateStandardUSC(grossAnnualSalary)

STEP 4: Calculate Employee PRSI (on GROSS income -- not reduced by pension)
  weeklyEquivalent = grossAnnualSalary / 52
  if (weeklyEquivalent <= 352)
    annualPRSI = 0
  else
    annualPRSI = grossAnnualSalary * 0.042  // or blended rate 0.042375
    // Apply PRSI credit if applicable (see Section 6.4)

STEP 5: Calculate Net Pay
  annualNetPay = grossAnnualSalary - pensionDeduction - incomeTax - usc - annualPRSI
  monthlyNetPay = annualNetPay / 12
  weeklyNetPay = annualNetPay / 52
```

---

## 13. Worked Examples

### 13.1 Example 1: Single PAYE Employee -- €45,000 Gross

**Inputs:**
- Gross annual salary: €45,000
- Status: Single
- No pension contributions
- No medical card, under 70

**Step 1: Pension** -- None

**Step 2: Income Tax**
- Taxable income: €45,000
- Standard rate band (single): €44,000
- Tax at 20%: €44,000 * 0.20 = €8,800.00
- Tax at 40%: (€45,000 - €44,000) * 0.40 = €1,000 * 0.40 = €400.00
- Gross tax: €8,800.00 + €400.00 = **€9,200.00**
- Tax credits: €2,000 (single) + €2,000 (PAYE) = €4,000.00
- Income tax payable: €9,200.00 - €4,000.00 = **€5,200.00**

**Step 3: USC**
- Income > €13,000, so USC applies to all income
- Band 1: €12,012 * 0.5% = €60.06
- Band 2: (€28,700 - €12,012) = €16,688 * 2% = €333.76
- Band 3: (€45,000 - €28,700) = €16,300 * 3% = €489.00
- Band 4: €0
- **Total USC: €882.82**

**Step 4: Employee PRSI**
- Weekly equivalent: €45,000 / 52 = €865.38 (> €352, so PRSI applies; > €424, so no credit)
- Annual PRSI (Jan-Sep, 39 weeks): 39 * €865.38 * 4.2% = **€1,417.34**
- Annual PRSI (Oct-Dec, 13 weeks): 13 * €865.38 * 4.35% = **€489.58**
- **Total PRSI: €1,906.92**
- *(Simplified using blended rate: €45,000 * 4.2375% = €1,906.88 -- near-identical)*

**Step 5: Summary**

| Component | Annual | Monthly |
|-----------|--------|---------|
| Gross salary | €45,000.00 | €3,750.00 |
| Income Tax | -€5,200.00 | -€433.33 |
| USC | -€882.82 | -€73.57 |
| Employee PRSI | -€1,906.92 | -€158.91 |
| **Net pay** | **€37,010.26** | **€3,084.19** |

**Effective tax rate:** (€5,200 + €882.82 + €1,906.92) / €45,000 = **17.76%**

---

### 13.2 Example 2: Single PAYE Employee -- €85,000 Gross, with 5% Pension (Age 42)

**Inputs:**
- Gross annual salary: €85,000
- Status: Single
- Pension contribution: 5% of gross = €4,250
- Age: 42 (max pension relief: 25%)
- No medical card, under 70

**Step 1: Pension**
- Max allowable: min(€85,000, €115,000) * 25% = €21,250
- Actual contribution: €4,250 (within limit)
- Pension deduction for IT: €4,250

**Step 2: Income Tax**
- Taxable income: €85,000 - €4,250 = €80,750
- Standard rate band (single): €44,000
- Tax at 20%: €44,000 * 0.20 = €8,800.00
- Tax at 40%: (€80,750 - €44,000) * 0.40 = €36,750 * 0.40 = €14,700.00
- Gross tax: €8,800.00 + €14,700.00 = **€23,500.00**
- Tax credits: €2,000 (single) + €2,000 (PAYE) = €4,000.00
- Income tax payable: €23,500.00 - €4,000.00 = **€19,500.00**

**Step 3: USC (calculated on GROSS €85,000 -- pension does NOT reduce USC base)**
- Band 1: €12,012 * 0.5% = €60.06
- Band 2: €16,688 * 2% = €333.76
- Band 3: €41,344 * 3% = €1,240.32
- Band 4: (€85,000 - €70,044) = €14,956 * 8% = €1,196.48
- **Total USC: €2,830.62**

**Step 4: Employee PRSI (calculated on GROSS €85,000 -- pension does NOT reduce PRSI base)**
- Weekly equivalent: €85,000 / 52 = €1,634.62 (> €424, no credit)
- Using blended rate: €85,000 * 4.2375% = **€3,601.88**

**Step 5: Summary**

| Component | Annual | Monthly |
|-----------|--------|---------|
| Gross salary | €85,000.00 | €7,083.33 |
| Pension (5%) | -€4,250.00 | -€354.17 |
| Income Tax | -€19,500.00 | -€1,625.00 |
| USC | -€2,830.62 | -€235.89 |
| Employee PRSI | -€3,601.88 | -€300.16 |
| **Net pay** | **€54,817.50** | **€4,568.13** |

**Effective tax rate (on gross):** (€19,500 + €2,830.62 + €3,601.88) / €85,000 = **30.51%**

---

### 13.3 Example 3: Married Couple (One Income) -- €60,000 Gross

**Inputs:**
- Gross annual salary: €60,000
- Status: Married, one income
- No pension
- No medical card, under 70

**Step 2: Income Tax**
- Taxable income: €60,000
- Standard rate band (married, one income): €53,000
- Tax at 20%: €53,000 * 0.20 = €10,600.00
- Tax at 40%: (€60,000 - €53,000) * 0.40 = €7,000 * 0.40 = €2,800.00
- Gross tax: €10,600.00 + €2,800.00 = **€13,400.00**
- Tax credits: €4,000 (married) + €2,000 (PAYE) = €6,000.00
- Income tax payable: €13,400.00 - €6,000.00 = **€7,400.00**

**Step 3: USC**
- Band 1: €12,012 * 0.5% = €60.06
- Band 2: €16,688 * 2% = €333.76
- Band 3: (€60,000 - €28,700) = €31,300 * 3% = €939.00
- **Total USC: €1,332.82**

**Step 4: Employee PRSI**
- Weekly equivalent: €60,000 / 52 = €1,153.85 (> €424, no credit)
- Using blended rate: €60,000 * 4.2375% = **€2,542.50**

**Step 5: Summary**

| Component | Annual | Monthly |
|-----------|--------|---------|
| Gross salary | €60,000.00 | €5,000.00 |
| Income Tax | -€7,400.00 | -€616.67 |
| USC | -€1,332.82 | -€111.07 |
| Employee PRSI | -€2,542.50 | -€211.88 |
| **Net pay** | **€48,724.68** | **€4,060.39** |

**Effective tax rate:** 18.79%

---

## 14. Edge Cases and Developer Notes

### 14.1 Critical Edge Cases

| # | Scenario | Expected Behaviour |
|---|----------|-------------------|
| 1 | Income = €13,000 exactly | USC = **€0** (exempt at or below €13,000) |
| 2 | Income = €13,001 | USC applies to **full** €13,001 (cliff, not a band) |
| 3 | Income = €20,000 (single PAYE) | Income Tax = €0 (€4,000 gross tax = €4,000 credits) |
| 4 | Weekly pay = €352.00 | Employee PRSI = €0 (exempt) |
| 5 | Weekly pay = €352.01 | Employee PRSI applies to **full** €352.01 (cliff) with €12 credit |
| 6 | Weekly pay = €424.00 | PRSI credit = €12 - (€71.99/6) = €0.00 (credit fully tapered) |
| 7 | Weekly pay = €424.01 | No PRSI credit; full PRSI on all earnings |
| 8 | Employee PAYE income < €10,000 | Employee Tax Credit capped at 20% of income |
| 9 | Pension contribution exceeds age limit | Cap at age-related % of min(salary, €115,000) |
| 10 | Married two incomes, lower earner < €35,000 | Band increase = lower earner's income (not €35,000) |
| 11 | Gross tax < tax credits | Income tax = €0 (cannot go negative) |
| 12 | USC reduced rate, income = €60,000 | Reduced rates apply |
| 13 | USC reduced rate, income = €60,001 | **Standard** rates apply (cliff) |
| 14 | Pay period spanning 1 October 2026 | PRSI rate changes from 4.2% to 4.35% |
| 15 | Employer weekly pay exactly €552 | Lower employer PRSI rate (9.0% / 9.15%) applies |
| 16 | Employer weekly pay = €552.01 | Higher employer PRSI rate (11.25% / 11.40%) applies |
| 17 | Zero income | All deductions = €0 |
| 18 | Negative income | Invalid input -- reject |

### 14.2 Rounding Rules

- Revenue uses standard **banker's rounding** (round half to even) for most calculations
- Tax credits and bands are expressed in whole euros for annual values
- Per-period credits/bands can result in decimal values -- carry forward and use cumulative basis to avoid rounding drift
- Final tax payable should be rounded to **two decimal places** (cents)

### 14.3 Data Types and Precision

- Use **decimal/fixed-point** arithmetic where possible (avoid floating-point rounding issues)
- If using JavaScript, consider working in **cents** (multiply all values by 100, divide at the end)
- Or use a library like `decimal.js` or `big.js`

### 14.4 Input Validation

| Input | Valid Range | Notes |
|-------|------------|-------|
| Gross salary | >= 0 | No upper limit but consider realistic max ~€500,000 |
| Pension % | 0--100 | Effective limit is age-related cap |
| Age | 16--75 | Working age range for pension limits |
| Marital status | Enum | single, married_one_income, married_two_incomes, single_parent, widowed |

---

## 15. 2026 Budget Changes Summary

Budget 2026 was announced on 1 October 2025. The following changes are **confirmed** and in effect from 1 January 2026:

### 15.1 Confirmed Changes for 2026

| Item | 2025 Value | 2026 Value | Change |
|------|-----------|-----------|--------|
| USC 2% band upper limit | €27,382 | **€28,700** | +€1,318 |
| PRSI employer threshold (lower rate) | €527/week | **€552/week** | +€25/week |
| Standard Fund Threshold (pensions) | €2,000,000 | **€2,200,000** | +€200,000 |
| Minimum wage | €13.50/hr | **€14.15/hr** | +€0.65/hr |

### 15.2 Changes from 1 October 2026

| Item | Pre-Oct Rate | Post-Oct Rate |
|------|-------------|--------------|
| Employee PRSI (Class A) | 4.2% | **4.35%** |
| Employer PRSI (higher rate) | 11.25% | **11.40%** |
| Employer PRSI (lower rate) | 9.0% | **9.15%** |

### 15.3 Unchanged from 2025

The following were **NOT changed** in Budget 2026:

- Income tax rates (20% / 40%) -- **unchanged**
- Income tax bands (€44,000 single, €53,000 married one income) -- **unchanged**
- Personal tax credits (single €2,000, married €4,000, PAYE €2,000) -- **unchanged**
- USC rates (0.5%, 2%, 3%, 8%) -- **unchanged** (only the band threshold changed)
- USC exemption threshold (€13,000) -- **unchanged**
- USC reduced rate income limit (€60,000) -- **unchanged**
- PRSI employee exemption threshold (€352/week) -- **unchanged**
- PRSI credit (€12 max, taper €352-€424) -- **unchanged**
- Pension age-related limits -- **unchanged**
- Pension earnings cap (€115,000) -- **unchanged**
- Rent tax credit amounts (€1,000/€2,000) -- **unchanged** (but extended to 2028)

### 15.4 Confidence Level

All values in this document are based on:
- The Finance Act provisions enacted following Budget 2026
- Revenue.ie published rates for 2026 (confirmed and in effect since 1 January 2026)
- The PRSI rate increases from 1 October 2026 are legislated under the Social Welfare Acts and are confirmed

**No fallback values are needed** -- all 2026 rates are confirmed and published by Revenue and the Department of Social Protection.

---

## Appendix A: Quick Reference Card

### Single PAYE Employee (Standard)

```
Income Tax:     20% on first €44,000, 40% on balance
Credits:        €4,000 (€2,000 personal + €2,000 PAYE)
USC:            0.5% / 2% / 3% / 8% (exempt if income <= €13,000)
PRSI:           4.2% (4.35% from Oct) on all income if > €352/week
Pension cap:    Age-dependent %, max earnings €115,000
```

### Married One Income PAYE (Standard)

```
Income Tax:     20% on first €53,000, 40% on balance
Credits:        €6,000 (€4,000 married + €2,000 PAYE)
USC:            Same as single
PRSI:           Same as single
```

### Single Parent (SPCCC) PAYE (Standard)

```
Income Tax:     20% on first €48,000, 40% on balance
Credits:        €5,900 (€2,000 personal + €2,000 PAYE + €1,900 SPCCC)
USC:            Same as single
PRSI:           Same as single
```

---

## Appendix B: USC Band Boundaries (for developer reference)

| Band End | Cumulative Income | Calculation |
|----------|------------------|-------------|
| Band 1 ends | €12,012 | Fixed |
| Band 2 ends | €28,700 | €12,012 + €16,688 |
| Band 3 ends | €70,044 | €28,700 + €41,344 |
| Band 4 | No upper limit | |

---

## Appendix C: Employer Cost Calculator (Optional Feature)

If the calculator also shows total employer cost:

```
totalEmployerCost = grossSalary + employerPRSI + employerPensionContribution
```

Employer PRSI is calculated on the employee's gross pay at the rates in Section 6.5.

---

*End of document.*
