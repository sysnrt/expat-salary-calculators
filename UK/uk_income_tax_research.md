# UK Income Tax & Payroll Deductions — Developer Reference
**Jurisdiction:** United Kingdom (England, Wales, Northern Ireland; Scotland noted separately)
**Tax Year:** 2025/26 (6 April 2025 – 5 April 2026)
**Document Author:** Sarah (Taxation Expert)
**Last Updated:** 2026-03-28
**Status:** Research-verified against HMRC authoritative sources

---

## Regulatory Sources

| Source | URL | Topic |
|--------|-----|-------|
| HMRC — Income Tax Rates | https://www.gov.uk/income-tax-rates | Bands, personal allowance, taper |
| HMRC — Rates & Allowances (historic) | https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past | All years |
| HMRC — Scottish Income Tax | https://www.gov.uk/scottish-income-tax | Scottish bands |
| HMRC — NIC Rates & Letters | https://www.gov.uk/national-insurance-rates-letters | Class 1 employee rates |
| HMRC — Employer Rates & Thresholds 2025/26 | https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026 | All employer-facing thresholds |
| HMRC — NIC Rates & Allowances | https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions | Full NIC schedule |
| HMRC — Student Loan Repayment | https://www.gov.uk/repaying-your-student-loan/what-you-pay | All plan thresholds |
| HMRC — Tax Codes | https://www.gov.uk/tax-codes/what-your-tax-code-means | PAYE code interpretation |
| HMRC — Dividends | https://www.gov.uk/tax-on-dividends | Dividend rates |
| HMRC — Capital Gains Tax Rates | https://www.gov.uk/capital-gains-tax/rates | CGT rates & exempt amount |
| HMRC — Marriage Allowance | https://www.gov.uk/marriage-allowance | Transfer rules |
| HMRC — Blind Person's Allowance | https://www.gov.uk/blind-persons-allowance | Allowance amount |
| HMRC — Workplace Pensions | https://www.gov.uk/workplace-pensions/what-you-employer-and-the-government-pay | Auto-enrolment rates |
| HMRC — PAYE Manual (Tax Tables) | https://www.gov.uk/hmrc-internal-manuals/paye-manual/paye70025 | PAYE calculation methodology |

---

## Table of Contents

1. [Income Tax Bands — England, Wales & Northern Ireland](#1-income-tax-bands--england-wales--northern-ireland)
2. [Income Tax Bands — Scotland](#2-income-tax-bands--scotland)
3. [Personal Allowance & the £100,000 Taper](#3-personal-allowance--the-100000-taper)
4. [National Insurance Contributions (Class 1 Employee)](#4-national-insurance-contributions-class-1-employee)
5. [Student Loan Repayments](#5-student-loan-repayments)
6. [Pension Contributions & Tax Relief](#6-pension-contributions--tax-relief)
7. [PAYE Mechanics — Pay Periods & Cumulative vs W1/M1](#7-paye-mechanics--pay-periods--cumulative-vs-w1m1)
8. [Tax Codes](#8-tax-codes)
9. [Marriage Allowance](#9-marriage-allowance)
10. [Blind Person's Allowance](#10-blind-persons-allowance)
11. [Dividend Tax](#11-dividend-tax)
12. [Capital Gains Tax](#12-capital-gains-tax)
13. [Worked Examples](#13-worked-examples)
14. [Known Edge Cases & Developer Gotchas](#14-known-edge-cases--developer-gotchas)
15. [2026/27 Outlook](#15-202627-outlook)

---

## 1. Income Tax Bands — England, Wales & Northern Ireland

### 1.1 Rates and Thresholds (2025/26)

> **Important note on band expressions:** HMRC publishes "band widths" (e.g. basic rate band = £37,700), but also publishes the cumulative income thresholds. The table below uses **total income** thresholds, which is what a calculator works with.

| Band | Total Income Range | Rate | Notes |
|------|--------------------|------|-------|
| Personal Allowance | £0 – £12,570 | 0% | Standard; see taper at £100k |
| Basic Rate | £12,571 – £50,270 | 20% | Band width = £37,700 |
| Higher Rate | £50,271 – £125,140 | 40% | |
| Additional Rate | Over £125,140 | 45% | PA fully withdrawn here |

**Source:** https://www.gov.uk/income-tax-rates (retrieved 2026-03-28)

### 1.2 Key Figures

- Personal Allowance: **£12,570**
- Basic Rate Band (width): **£37,700** (i.e. £12,571 to £50,270)
- Higher Rate threshold: **£50,270**
- Additional Rate threshold: **£125,140**

### 1.3 Calculation Formula

```
taxable_income = gross_income - personal_allowance - pension_contributions_net_pay

if taxable_income <= 0:
    income_tax = 0
else:
    basic_rate_band   = min(taxable_income, 37700)
    higher_rate_band  = max(0, min(taxable_income - 37700, 125140 - 12570 - 37700))
    additional_band   = max(0, taxable_income - (125140 - 12570))

    income_tax = (basic_rate_band * 0.20)
               + (higher_rate_band * 0.40)
               + (additional_band * 0.45)
```

> **Note:** When the personal allowance is tapered (income > £100,000), substitute the reduced personal allowance in place of £12,570. See Section 3.

---

## 2. Income Tax Bands — Scotland

Scottish residents pay Scottish Income Tax (set by the Scottish Parliament) on non-savings, non-dividend income. Class 1 NICs are still calculated using UK-wide rates. The Scottish Personal Allowance is the same as England/Wales (£12,570), but withdrawn at £125,140 identically.

### 2.1 Scottish Rates and Thresholds (2025/26)

| Band | Total Income Range | Rate |
|------|--------------------|------|
| Personal Allowance | £0 – £12,570 | 0% |
| Starter Rate | £12,571 – £15,397 | 19% |
| Basic Rate | £15,398 – £27,491 | 20% |
| Intermediate Rate | £27,492 – £43,662 | 21% |
| Higher Rate | £43,663 – £75,000 | 42% |
| Advanced Rate | £75,001 – £125,140 | 45% |
| Top Rate | Over £125,140 | 48% |

**Source:** https://www.gov.uk/scottish-income-tax (retrieved 2026-03-28)

### 2.2 Scottish Band Widths (for calculation logic)

| Band | Width | Notes |
|------|-------|-------|
| Starter | £2,827 | £12,571 to £15,397 |
| Basic | £12,094 | £15,398 to £27,491 |
| Intermediate | £16,171 | £27,492 to £43,662 |
| Higher | £31,338 | £43,663 to £75,000 |
| Advanced | £50,140 | £75,001 to £125,140 |
| Top | Unlimited | Over £125,140 |

### 2.3 Scottish Calculation Formula

```
taxable_income = gross_income - personal_allowance  # (reduced if >£100k taper applies)

starter_band       = min(taxable_income,        2827)
basic_band         = min(max(taxable_income -  2827, 0), 12094)
intermediate_band  = min(max(taxable_income - 14921, 0), 16171)
higher_band        = min(max(taxable_income - 31092, 0), 31338)
advanced_band      = min(max(taxable_income - 62430, 0), 50140)
top_band           = max(taxable_income - 112570, 0)

income_tax = (starter_band      * 0.19)
           + (basic_band        * 0.20)
           + (intermediate_band * 0.21)
           + (higher_band       * 0.42)
           + (advanced_band     * 0.45)
           + (top_band          * 0.48)
```

> The Scottish Personal Allowance taper at £100,000 works identically to the rest of the UK (see Section 3).

### 2.4 Scottish Tax Code Prefix

Tax codes for Scottish taxpayers are prefixed with **S** (e.g. S1257L, SBR, SD0). Payroll software uses this prefix to apply Scottish rates.

### 2.5 Developer Note — Residency Determination

The calculator must ask for (or accept) a residency flag: **"Are you a Scottish taxpayer?"** Scottish taxpayer status is based on where the individual lives (main home), not where they work. There is no HMRC API to look this up — it must be a user-supplied input.

---

## 3. Personal Allowance & the £100,000 Taper

### 3.1 Standard Personal Allowance

- **2025/26:** £12,570
- This is frozen at £12,570 until at least April 2028 (previously announced freeze)

### 3.2 The £100,000 Taper Rule

For adjusted net income above £100,000, the personal allowance is reduced by £1 for every £2 of income above £100,000.

**Formula:**
```
if gross_income <= 100000:
    personal_allowance = 12570

elif gross_income >= 125140:
    personal_allowance = 0

else:
    reduction = floor((gross_income - 100000) / 2)
    personal_allowance = max(0, 12570 - reduction)
```

**Key values:**
- Taper begins: £100,000
- Taper ends (PA = £0): £125,140
- The £125,140 threshold is not arbitrary — it is the exact point at which £12,570 × 2 = £25,140 of excess income zeroes out the £12,570 PA

### 3.3 The 60% Effective Tax Rate Trap

In the taper zone (£100,000 – £125,140), the effective marginal tax rate is **60%**, not 40%.

**Why:**
- Every extra £2 earned is taxed at 40% higher rate = £0.80 tax
- That same £2 of income also withdraws £1 of personal allowance, which was sheltering income at 20% = additional £0.20 tax
- Total: £1.00 tax on £2.00 income = **50% effective rate** on the income itself, but HMRC describes it as 60% because the previously untaxed allowance is now being taxed

More precisely:
- For every £1 earned in the taper zone, you lose £0.50 of PA
- That £0.50 of previously tax-free income becomes taxable at 40% = £0.20 additional tax
- Plus the £1 earned itself is taxed at 40% = £0.40
- Total tax per £1 = £0.60 → **60% marginal rate**

**Developer note:** This is critical for correct display of marginal rates. A calculator showing an effective rate chart must correctly model this band.

### 3.4 Pension Contribution Interaction

Pension contributions under a **net pay arrangement** reduce adjusted net income, which can partially or fully pull the taxpayer out of the taper zone. This is a significant planning consideration to surface in the calculator.

```
adjusted_net_income = gross_salary - net_pay_pension_contributions
personal_allowance  = taper_formula(adjusted_net_income)
```

---

## 4. National Insurance Contributions (Class 1 Employee)

### 4.1 Thresholds (2025/26)

| Threshold | Weekly | Monthly | Annual |
|-----------|--------|---------|--------|
| Lower Earnings Limit (LEL) | £125 | £542 | £6,500 |
| Primary Threshold (PT) | £242 | £1,048 | £12,570 |
| Upper Earnings Limit (UEL) | £967 | £4,189 | £50,270 |

**Sources:**
- https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026 (retrieved 2026-03-28)
- https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions (retrieved 2026-03-28)

### 4.2 Employee NIC Rates (Category A — the standard category)

| Earnings Range | Rate |
|----------------|------|
| Up to PT (£12,570/year) | 0% |
| PT to UEL (£12,570 – £50,270/year) | 8% |
| Above UEL (over £50,270/year) | 2% |

> The LEL (£6,500) is the threshold below which NICs are not credited — no contributions are due and no contributions are earned. Earnings between LEL and PT are notionally credited (so pension entitlement accrues) but no actual NIC is paid.

### 4.3 NIC Calculation Formula (Annual)

```
if annual_earnings <= 12570:
    employee_nic = 0

elif annual_earnings <= 50270:
    employee_nic = (annual_earnings - 12570) * 0.08

else:
    employee_nic = (50270 - 12570) * 0.08
               + (annual_earnings - 50270) * 0.02
    # = 37700 * 0.08 + (excess) * 0.02
    # = 3016 + (excess) * 0.02
```

### 4.4 NIC Calculation — Monthly (PAYE)

NIC is calculated on a **per-period non-cumulative basis** (unlike income tax which can be cumulative). Each pay period is assessed independently.

```
# Monthly calculation
monthly_PT  = 1048   # £12,570 / 12
monthly_UEL = 4189   # £50,270 / 12

if monthly_earnings <= monthly_PT:
    monthly_nic = 0
elif monthly_earnings <= monthly_UEL:
    monthly_nic = (monthly_earnings - monthly_PT) * 0.08
else:
    monthly_nic = (monthly_UEL - monthly_PT) * 0.08
               + (monthly_earnings - monthly_UEL) * 0.02
```

### 4.5 Other NIC Categories

| Category Letter | Who it applies to | Special treatment |
|-----------------|-------------------|-------------------|
| A | Most employees | Standard rates above |
| B | Married women with reduced rate election | 1.85% between PT-UEL, 2% above |
| C | State pension age employees | NIL — no employee NIC |
| H | Apprentices under 25 | Standard employee rates; employer gets 0% up to UST |
| M | Employees under 21 | Standard employee rates; employer gets 0% up to UST |
| J | Deferred NIC (second job) | 2% on all earnings above PT |
| Z | Under 21 with deferment | 2% on all earnings above PT |

> For a salary calculator, **Category A** is the default. The calculator should ideally allow category selection, or at minimum flag Category C for pension-age employees.

### 4.6 Key Coincidence: PT = Personal Allowance

The NIC Primary Threshold (£12,570) was deliberately aligned with the Income Tax Personal Allowance (£12,570) in April 2022, meaning no employee pays NIC before they also pay income tax (at standard rates). This is not guaranteed to remain aligned in future years — **do not hard-code a relationship between them**.

---

## 5. Student Loan Repayments

### 5.1 Plan Thresholds and Rates (2025/26)

| Plan | Annual Threshold | Monthly Threshold | Weekly Threshold | Repayment Rate |
|------|-----------------|-------------------|------------------|----------------|
| Plan 1 | £26,065 | £2,172 | £501 | 9% |
| Plan 2 | £28,470 | £2,373 | £548 | 9% |
| Plan 4 (Scotland) | £32,745 | £2,729 | £630 | 9% |
| Plan 5 | £25,000 | £2,083 | £480 | 9% |
| Postgraduate Loan | £21,000 | £1,750 | £404 | 6% |

**Sources:**
- https://www.gov.uk/repaying-your-student-loan/what-you-pay (retrieved 2026-03-28)
- https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026 (retrieved 2026-03-28)

> **Note:** Plan 5 threshold of £25,000 is from GOV.UK student loan guidance. The official employer thresholds document (HMRC PAYE guidance) does not yet list Plan 5 separately in all employer-facing publications, as Plan 5 borrowers are recent graduates (courses from August 2023). Verify annually.

### 5.2 Repayment Calculation Formula

```
# Applies to Plans 1, 2, 4, 5
repayment = max(0, annual_income - threshold) * 0.09

# Postgraduate Loan
pg_repayment = max(0, annual_income - 21000) * 0.06
```

**Monthly calculation:**
```
monthly_repayment = max(0, monthly_income - monthly_threshold) * rate
```

### 5.3 Which Plan Determines the Threshold

A borrower may hold multiple loans simultaneously. The most common combination is Plan 2 + Postgraduate Loan. The rules are:

- **Plans 1, 2, 4, 5 are mutually exclusive** — a borrower is on only one undergraduate plan
- **Postgraduate Loan is additional** — a borrower can have both an undergraduate plan AND a Postgraduate Loan running concurrently
- Both deductions are taken independently; they do not interact with each other

### 5.4 Plan Identification Guide

| Plan | Who is on it |
|------|-------------|
| Plan 1 | Students who started before 1 September 2012 (England/Wales); all Northern Ireland undergraduate students |
| Plan 2 | Students who started on/after 1 September 2012 in England/Wales (before August 2023) |
| Plan 4 | Scottish undergraduate students (managed by SAAS) |
| Plan 5 | English students starting undergraduate courses from August 2023 onwards |
| Postgraduate | Students with a Postgraduate Master's or Doctoral loan |

### 5.5 Developer Notes

- Student loan deductions are taken from **gross pay** (not gross less pension or other deductions)
- Unlike income tax, repayments are calculated on **total earnings including bonuses** in the pay period
- Do NOT apply a "cumulative" method — each period is assessed on that period's pay independently
- If a borrower's total income for the year does not exceed the threshold, any over-deducted amounts are refunded via Self Assessment

---

## 6. Pension Contributions & Tax Relief

### 6.1 Auto-Enrolment Minimum Contribution Rates (from April 2019)

| Contributor | Minimum Rate | Basis |
|-------------|--------------|-------|
| Employee | 5% | On qualifying earnings |
| Employer | 3% | On qualifying earnings |
| Total | 8% | |

**Source:** https://www.gov.uk/workplace-pensions/what-you-employer-and-the-government-pay (retrieved 2026-03-28)

### 6.2 Qualifying Earnings Band

Contributions (under the qualifying earnings method) are calculated only on earnings within the band:

| | Annual | Monthly | Weekly |
|-|--------|---------|--------|
| Lower limit | £6,240 | £520 | £120 |
| Upper limit | £50,270 | £4,189 | £967 |

```
qualifying_earnings = min(gross_salary, 50270) - min(gross_salary, 6240)
qualifying_earnings = max(0, qualifying_earnings)

employee_pension = qualifying_earnings * 0.05
employer_pension = qualifying_earnings * 0.03
```

> The upper limit of qualifying earnings (£50,270) coincides with the UEL for NIC and the higher rate tax threshold — this is deliberate policy alignment.

### 6.3 Relief at Source vs Net Pay Arrangement

This is one of the most important implementation distinctions for a salary calculator.

#### Net Pay Arrangement
- The employee contributes from **pre-tax gross pay**
- The pension contribution is deducted **before PAYE income tax is calculated**
- The employee receives full tax relief at their marginal rate automatically
- **Effect on calculator:** Subtract employee pension contribution from gross pay before computing taxable income

```
taxable_income = gross_salary - employee_pension_contribution  # net pay only
income_tax     = calculate_income_tax(taxable_income)
```

#### Relief at Source (RAS)
- The employee contributes from **net (post-tax) pay**
- HMRC sends basic rate tax relief (20%) directly to the pension provider
- Higher/additional rate taxpayers must claim extra relief via Self Assessment
- **Effect on calculator:** Do NOT subtract the pension contribution from gross pay for income tax purposes; the employee has already paid tax on that money
- The pension provider grosses up the contribution: a £80 employee contribution becomes £100 in the pension (including £20 basic rate relief)

```
taxable_income = gross_salary  # full gross — no deduction for RAS pension
income_tax     = calculate_income_tax(taxable_income)
# Take-home = gross - income_tax - NIC - (employee_pension_net_contribution)
```

#### Practical Default

Most large employer auto-enrolment schemes use **net pay arrangement**. NEST (the government's default pension) uses **relief at source**. The calculator should allow the user to select, or default to net pay arrangement with a note.

### 6.4 Pension & the £100,000 Taper

Under a **net pay arrangement**, pension contributions reduce adjusted net income. A salary of £110,000 with a £15,000 net pay pension contribution brings adjusted net income to £95,000 — below the taper threshold — restoring the full £12,570 personal allowance. This is a significant tax planning point worth surfacing in the calculator.

### 6.5 Annual Allowance

The pension annual allowance (the maximum that can be contributed to pensions with tax relief) is £60,000 for 2025/26. This is not typically relevant for a standard salary calculator, but should be flagged if the calculator allows custom pension contribution input above this threshold.

---

## 7. PAYE Mechanics — Pay Periods & Cumulative vs W1/M1

### 7.1 Overview of PAYE

PAYE (Pay As You Earn) is the mechanism by which income tax and NIC are collected through the payroll throughout the year. Employers calculate and deduct the correct amount each pay period using the employee's tax code.

### 7.2 Cumulative Method (Standard)

The standard PAYE method is **cumulative** — it keeps a running total of pay and tax from the start of the tax year, adjusting each period so that the total tax deducted to date is always correct for the income received to date.

**Step-by-step calculation (cumulative, month N):**

```
1. total_pay_to_date      = sum of gross pay for periods 1..N
2. free_pay_to_date       = (annual_personal_allowance / 12) * N
3. taxable_pay_to_date    = total_pay_to_date - free_pay_to_date
4. tax_due_to_date        = income_tax_on(taxable_pay_to_date)
5. tax_deducted_to_date   = sum of tax deducted in periods 1..(N-1)
6. tax_this_period        = tax_due_to_date - tax_deducted_to_date
```

This means a pay rise in Month 8, or a refund following reduced pay, is automatically corrected. The employee always ends the year having paid exactly the right amount.

**Free pay per period:**
```
monthly_free_pay = annual_personal_allowance / 12   # e.g. £12,570 / 12 = £1,047.50
weekly_free_pay  = annual_personal_allowance / 52   # e.g. £12,570 / 52 = £241.73...
```

HMRC truncates (not rounds) the free pay tables to pence. For calculation software, use standard rounding.

### 7.3 Week 1 / Month 1 Basis (Emergency / Non-Cumulative)

When an employee has a W1/M1 tax code suffix (e.g. **1257L W1** or **1257L M1**), each pay period is calculated independently as if it were the first period of the year. There is no carry-forward of prior pay or tax.

```
# Month 1 basis — treat as standalone
free_pay_this_period  = annual_personal_allowance / 12
taxable_pay           = gross_pay_this_period - free_pay_this_period
income_tax            = income_tax_on(taxable_pay)  # on this period only
# Do NOT subtract previously deducted tax
```

**When W1/M1 is used:**
- New employee who has not provided a P45
- Emergency tax code issued (0T W1 or 1257L M1 typically)
- HMRC instruction to use non-cumulative basis

**Developer note:** W1/M1 codes produce the correct result for that period but may not yield the exact right cumulative total. HMRC reconciles at year end. A salary calculator showing take-home pay should default to the cumulative method unless the user specifies W1/M1.

### 7.4 Simplification for a Salary Calculator (Annual Income Mode)

A salary calculator projecting **annual take-home** from an annual salary input does not need to simulate period-by-period PAYE. Instead:

```
1. Apply the personal allowance (and any taper) to get taxable_income
2. Apply rate bands to taxable_income to get annual_income_tax
3. Calculate annual_NIC on gross salary
4. Calculate annual_student_loan_repayment if applicable
5. Deduct pension contribution (employee's share)
6. take_home = gross_salary - annual_income_tax - annual_NIC
              - student_loan_repayment - employee_pension_contribution
```

Monthly take-home = annual take-home / 12
Weekly take-home = annual take-home / 52

---

## 8. Tax Codes

### 8.1 How Tax Codes Work

A tax code is an alphanumeric code issued by HMRC that tells an employer how much tax-free pay to give an employee each period. The numeric part represents the total annual tax-free income ÷ 10.

**Standard code for 2025/26: 1257L**
- Numbers: 1257 → £12,570 personal allowance (drop the last digit, add a zero: 1257 × 10 = £12,570)
- Letter: L → standard personal allowance entitlement

### 8.2 Suffix Letters

| Letter | Meaning | Tax effect |
|--------|---------|------------|
| L | Standard Personal Allowance | Normal PA applied |
| M | Received Marriage Allowance transfer (+10% of PA = +£1,260) | PA = £13,830 |
| N | Transferred Marriage Allowance away (-10% of PA = -£1,260) | PA = £11,310 |
| T | HMRC needs further information; used for complex cases | Numeric allowance applied |
| S | Scottish taxpayer | Apply Scottish rates |
| C | Welsh taxpayer | Apply Welsh rates (same as England 2025/26) |
| K | Negative allowance (untaxed income exceeds PA) | Adds to pay before tax |
| NT | No tax | 0% on all income |
| BR | Basic rate — all income taxed at 20% | No PA; 20% flat |
| D0 | Higher rate — all income taxed at 40% | No PA; 40% flat |
| D1 | Additional rate — all income taxed at 45% | No PA; 45% flat |
| 0T | Zero personal allowance | No PA; tax at all bands |

### 8.3 Prefix Letters

| Prefix | Meaning |
|--------|---------|
| S | Scottish income tax rates apply (e.g. S1257L) |
| C | Welsh income tax rates apply (e.g. C1257L) |
| K | Negative allowance (used as suffix AND prefix in some representations) |

### 8.4 Deriving Free Pay from a Numeric Tax Code

```
annual_free_pay = (numeric_part * 10)
# e.g. code 1100L → free pay = £11,000/year
# e.g. code 1257L → free pay = £12,570/year
# e.g. code 1383L (Marriage Allowance receiver) → free pay = £13,830/year
```

### 8.5 K Codes (Negative Allowance)

A K code means the employee has untaxed income (e.g. company car benefit, state pension) that exceeds their Personal Allowance. Instead of subtracting free pay, the code **adds** to the taxable pay.

```
# K code: taxable_pay = gross_pay + (additional_pay_to_date)
# additional_pay = (numeric_part * 10) / 12  [for monthly]
```

**Cap:** The tax deducted under a K code cannot exceed 50% of gross pay for that period (the "50% overriding limit").

### 8.6 Default for Calculator

A salary calculator should default to code **1257L** (cumulative). The calculator may optionally accept a custom tax code input to model different situations.

---

## 9. Marriage Allowance

### 9.1 Overview

Marriage Allowance allows a lower-earning spouse or civil partner to transfer **£1,260** (10% of the Personal Allowance) to the higher-earning partner.

**Source:** https://www.gov.uk/marriage-allowance (retrieved 2026-03-28)

### 9.2 Eligibility

- Must be married or in a civil partnership (cohabiting couples are **not** eligible)
- The transferring partner's income must be below their Personal Allowance (£12,570) or they pay no income tax (not including savings starter rate)
- The receiving partner must be a basic rate taxpayer: income between £12,571 and £50,270 (£43,662 in Scotland)
- Cannot be used if the receiving partner is a higher rate taxpayer

### 9.3 Calculation Effect

| Partner | Effect |
|---------|--------|
| Transferring partner (code suffix N) | PA reduced to £11,310 → may start paying some income tax |
| Receiving partner (code suffix M) | PA increased to £13,830 → tax saving of £252/year |

```
# Receiving partner (code M):
personal_allowance = 12570 + 1260 = 13830
annual_tax_saving  = 1260 * 0.20 = £252

# Transferring partner (code N):
personal_allowance = 12570 - 1260 = 11310
```

### 9.4 Developer Implementation

- Provide a checkbox: "Receive Marriage Allowance transfer?"
- If checked, set personal allowance to £13,830 (code M equivalent)
- Tax saving display: £252/year

---

## 10. Blind Person's Allowance

### 10.1 Amount (2025/26)

**Blind Person's Allowance: £3,130**

**Source:** https://www.gov.uk/blind-persons-allowance (retrieved 2026-03-28)

### 10.2 How It Works

The allowance is **added to** the Personal Allowance, not a separate deduction.

```
# If blind person's allowance claimed:
effective_personal_allowance = standard_PA + 3130
# e.g. 12570 + 3130 = 15700 total tax-free income
```

If the individual cannot use their own BPA (income too low), the unused portion can be transferred to their spouse or civil partner.

### 10.3 Taper Interaction

The taper at £100,000 applies to the **combined** effective personal allowance. For a registered blind individual:
- Their effective PA = £15,700
- The taper would therefore zero out at: £100,000 + (£15,700 × 2) = £131,400

---

## 11. Dividend Tax

### 11.1 Overview

Dividends are taxed at special reduced rates. They are not subject to National Insurance. They sit on top of other income when determining which rate band applies.

### 11.2 Dividend Allowance

**Dividend Allowance (2025/26): £500**

This is a nil-rate allowance: the first £500 of dividend income is taxed at 0%, but it still counts towards total income and can affect which rate band other income falls into.

**Source:** https://www.gov.uk/tax-on-dividends (retrieved 2026-03-28)

> **Important history:** The allowance was cut from £2,000 (2022/23) → £1,000 (2023/24) → £500 (2024/25 onwards). The 2025/26 allowance remains £500.

### 11.3 Dividend Tax Rates (2025/26)

| Taxpayer Band | Dividend Rate |
|---------------|--------------|
| Basic rate taxpayer | 8.75% |
| Higher rate taxpayer | 33.75% |
| Additional rate taxpayer | 39.35% |

### 11.4 Calculation Logic — Band Stacking

Dividends are treated as the **top slice** of income. The rate applied depends on which band the dividend falls into after adding all other income.

```
# Step 1: Calculate taxable non-dividend income
non_dividend_taxable = gross_salary + other_income - personal_allowance

# Step 2: Identify remaining basic rate band
basic_rate_band_remaining = max(0, 37700 - non_dividend_taxable)

# Step 3: Apply dividend allowance
dividend_taxable = max(0, total_dividends - 500)  # after £500 allowance

# Step 4: Calculate dividend tax
basic_rate_dividends   = min(dividend_taxable, basic_rate_band_remaining)
higher_rate_dividends  = min(max(0, dividend_taxable - basic_rate_band_remaining),
                             125140 - 12570 - 37700 - max(0, non_dividend_taxable - 37700))
additional_dividends   = max(0, dividend_taxable - basic_rate_band_remaining
                                                  - higher_rate_dividends)

dividend_tax = (basic_rate_dividends   * 0.0875)
             + (higher_rate_dividends  * 0.3375)
             + (additional_dividends   * 0.3935)
```

### 11.5 Developer Recommendation

For a salary/employment income calculator, dividend tax may be out of scope for the minimum viable product. Consider adding it as an optional advanced input. If included, it requires a "band stacking" implementation because dividends must always be treated as the top slice.

---

## 12. Capital Gains Tax

### 12.1 Overview

Capital Gains Tax (CGT) applies to gains on disposal of assets. It is NOT a payroll deduction — it is reported and paid via Self Assessment. For a salary calculator, CGT is largely out of scope, but is documented here for completeness.

### 12.2 Annual Exempt Amount (2025/26)

**£3,000**

**Source:** https://www.gov.uk/capital-gains-tax/rates (retrieved 2026-03-28)

> **History:** The exempt amount was cut sharply: £12,300 (2022/23) → £6,000 (2023/24) → £3,000 (2024/25 onwards). It remains at £3,000 for 2025/26.

### 12.3 CGT Rates (2025/26)

For disposals on or after 6 April 2025:

| Asset Type | Basic Rate Taxpayer | Higher/Additional Rate Taxpayer |
|------------|--------------------|---------------------------------|
| Residential property | 18% | 24% |
| Other assets (shares, etc.) | 18% | 24% |
| Carried interest | 32% | 32% |

> **Note:** From 6 April 2025, the previously different rates for residential property (18%/28%) and other assets (10%/20%) were unified — both now use 18% and 24%. This was a significant change from the Autumn Budget 2024.

### 12.4 Band Interaction

CGT uses up the basic rate band that is not already used by income. If a basic rate taxpayer's income uses all of the £37,700 basic rate band, all gains are taxed at 24%.

```
basic_rate_band_remaining = max(0, 37700 - taxable_income)
gains_in_basic_band   = min(taxable_gains, basic_rate_band_remaining)
gains_in_higher_band  = max(0, taxable_gains - basic_rate_band_remaining)

cgt = (gains_in_basic_band  * 0.18)
    + (gains_in_higher_band * 0.24)
```

### 12.5 Developer Note

CGT is not typically included in a salary/payroll calculator. Flag it as out of scope or provide a separate, clearly labelled CGT module.

---

## 13. Worked Examples

### Example 1: £50,000 Salary (England, Plan 2 Student Loan, Net Pay Pension 5%)

**Inputs:**
- Gross salary: £50,000
- Pension: 5% net pay arrangement = £2,500/year
- Student loan: Plan 2

**Step 1 — Pension deduction (net pay)**
```
pension_contribution = 50000 * 0.05 = £2,500
adjusted_gross       = 50000 - 2500 = £47,500
```

**Step 2 — Personal Allowance**
```
income = £47,500 (below £100,000 → no taper)
personal_allowance = £12,570
taxable_income     = 47500 - 12570 = £34,930
```

**Step 3 — Income Tax**
```
All taxable income (£34,930) falls in basic rate band (≤ £37,700)
income_tax = 34930 * 0.20 = £6,986.00
```

**Step 4 — National Insurance**
```
NIC = (50000 - 12570) * 0.08 = 37430 * 0.08 = £2,994.40
(no UEL breach: £50,000 < £50,270)
```

**Step 5 — Student Loan Plan 2**
```
repayment = (50000 - 28470) * 0.09 = 21530 * 0.09 = £1,937.70
```

**Step 6 — Take-home**
```
take_home = 50000 - 6986.00 - 2994.40 - 1937.70 - 2500.00
          = £35,581.90/year
          = £2,965.16/month
```

---

### Example 2: £120,000 Salary (England, No Pension, No Student Loan)

This example demonstrates the personal allowance taper and the 60% effective rate zone.

**Inputs:**
- Gross salary: £120,000
- No pension contributions
- No student loan

**Step 1 — Personal Allowance Taper**
```
income = £120,000 (above £100,000)
excess_above_100k  = 120000 - 100000 = £20,000
pa_reduction       = 20000 / 2       = £10,000
personal_allowance = 12570 - 10000   = £2,570
```

**Step 2 — Taxable Income**
```
taxable_income = 120000 - 2570 = £117,430
```

**Step 3 — Income Tax**
```
Basic rate band   : £37,700  × 20% = £7,540.00
Higher rate band  : (117430 - 37700) × 40%
                  = £79,730 × 40%  = £31,892.00
(All taxable income is within higher rate;
 additional rate kicks in at £125,140 which is not reached here
 because taxable income = £117,430 < £112,570 + £37,700 = £112,570...
 wait — let's be precise:)
```

Actually let me recalculate precisely:
```
taxable_income = £117,430

Band analysis (taxable income, not gross income):
  Basic rate:     £37,700       (taxable £0 to £37,700)
  Higher rate:    £117,430 - £37,700 = £79,730

income_tax = (37700 * 0.20) + (79730 * 0.40)
           = 7540 + 31892
           = £39,432.00
```

**Step 4 — National Insurance**
```
Between PT and UEL: (50270 - 12570) * 0.08 = 37700 * 0.08 = £3,016.00
Above UEL:         (120000 - 50270) * 0.02 = 69730 * 0.02 = £1,394.60
Total NIC = 3016 + 1394.60 = £4,410.60
```

**Step 5 — Take-home**
```
take_home = 120000 - 39432.00 - 4410.60
          = £76,157.40/year
          = £6,346.45/month
```

**Effective marginal rate in taper zone:**
If salary increases from £120,000 to £122,000 (+£2,000):
- Additional tax on £2,000 at 40%: £800
- Additional NIC on £2,000 at 2%: £40
- PA further reduced by £1,000 → extra £1,000 taxable at 40%: £400
- Total additional tax: £1,200 on £2,000 = **60% effective marginal income tax rate** (62% including NIC)

---

### Example 3: £75,000 Salary (Scotland)

**Inputs:**
- Gross salary: £75,000
- Scotland resident
- No pension, no student loan

**Step 1 — Personal Allowance**
```
income = £75,000 (below £100,000 → no taper)
personal_allowance = £12,570
taxable_income     = 75000 - 12570 = £62,430
```

**Step 2 — Scottish Income Tax**
```
Starter rate  : £2,827  × 19% = £537.13
Basic rate    : £12,094 × 20% = £2,418.80
Intermediate  : £16,171 × 21% = £3,395.91
Higher rate   : £62,430 - £31,092 = £31,338 × 42% = £13,161.96

income_tax = 537.13 + 2418.80 + 3395.91 + 13161.96 = £19,513.80
```

**Step 3 — National Insurance (UK-wide)**
```
Between PT and UEL: (50270 - 12570) * 0.08 = £3,016.00
Above UEL:         (75000 - 50270) * 0.02  = £494.60
Total NIC = £3,510.60
```

**Step 4 — Take-home**
```
take_home = 75000 - 19513.80 - 3510.60
          = £51,975.60/year
          = £4,331.30/month
```

**Comparison — same salary in England:**
```
taxable_income = 75000 - 12570 = £62,430
Basic rate:    £37,700 × 20%  = £7,540.00
Higher rate:   £24,730 × 40%  = £9,892.00
England tax = £17,432.00

Scottish taxpayer pays £19,513.80 − £17,432.00 = £2,081.80 more income tax
```

---

## 14. Known Edge Cases & Developer Gotchas

### 14.1 Personal Allowance Taper Precision

The taper formula produces a personal allowance that should be used as-is (not rounded to nearest £10 or £100). HMRC rounds to the nearest £1 in their calculations.

```
# Correct:
reduction = floor((income - 100000) / 2)
pa = max(0, 12570 - reduction)

# Wrong (many implementations incorrectly do):
pa = max(0, 12570 - ((income - 100000) / 2))  # uses floating point untruncated
```

### 14.2 NIC Upper Earnings Limit = Income Tax Higher Rate Threshold

Both sit at £50,270 annual. This means the UEL is reached exactly when higher rate income tax begins. This is policy-aligned but not legally guaranteed. Do not hard-code one to equal the other — retrieve them independently.

### 14.3 Scottish PA Taper — Different Additional Rate Threshold

In Scotland, the Top Rate begins at **£125,140**, which is where the personal allowance also reaches zero. This means a Scottish taxpayer's taper zone operates the same way (£100,000 – £125,140) but the effective marginal rate in the taper zone is different:

```
# In Scotland, income in the taper zone (£100k – £125,140)
# is taxed at the Advanced Rate of 45% (not 40%)
# Personal allowance withdrawal at £1 per £2 = 22.5% hidden marginal uplift
# Effective Scottish marginal rate in taper zone = 45% + (22.5% × 45%) = 45% + (0.5 × 45%) = 67.5%
```

This is an important difference from England's 60% trap — Scotland's taper zone has a higher effective marginal rate.

### 14.4 Pension Contribution Reduces NIC Base? No

Pension contributions under **net pay arrangement** reduce the income tax base but do **NOT** reduce the NIC base. NIC is calculated on gross pay regardless of pension contributions.

```
# Income tax base: gross - pension (net pay)
# NIC base:        gross (always — pension does not reduce NIC)
```

### 14.5 Salary Sacrifice IS Different

If the employer operates a **salary sacrifice** pension scheme (not the same as net pay arrangement), the pension contribution is restructured as a reduction in salary before any PAYE or NIC. In this case:

```
effective_gross = gross_salary - salary_sacrifice_pension
income_tax = calculate_tax(effective_gross)
nic        = calculate_nic(effective_gross)  # NIC IS reduced here
```

This is the key distinction: salary sacrifice reduces NIC; net pay arrangement does not.

### 14.6 Bonus / Irregular Pay and Student Loans

Student loan deductions in a payroll period are based on the **actual gross pay that period**, not annualised pay. A £10,000 bonus in a single month will trigger a large student loan deduction in that month, even if annual salary is below the threshold. This is correct PAYE behaviour.

For an **annual income calculator**, use annual salary to compute annual student loan deduction — this smooths out the periodic volatility.

### 14.7 Welsh Income Tax

Welsh rates (C prefix in tax codes) are currently the same as England rates for 2025/26. The Welsh Parliament has chosen not to vary rates from the UK default. Do not omit the flag — it may diverge in future years.

### 14.8 NIC and State Pension Age

Employees at or above State Pension Age (currently 66) pay **no employee NIC** (Category C). The calculator should ask for this flag or year of birth.

### 14.9 Marriage Allowance and Scottish Taxpayers

Scottish taxpayers can receive Marriage Allowance but the income limit for the receiving partner is £43,662 (Scotland's higher rate threshold), not £50,270.

### 14.10 Multiple Jobs / Multiple Income Sources

A PAYE calculator for a single employment is straightforward. Multiple income sources introduce complexity:
- Second employer typically uses BR (basic rate, 20%) with no personal allowance
- Or the allowance is split via HMRC instruction
- The calculator should flag that it calculates for a single employment and direct to Self Assessment for multiple income scenarios

### 14.11 The Starter Rate for Savings (£5,000 at 0%)

This is sometimes confused with the income tax personal allowance. It is a **separate 0% band** for savings income only, available if non-savings income is below £17,570 (PA + savings starter rate band). It is not typically relevant for an employment income calculator.

---

## 15. 2026/27 Outlook

### 15.1 Income Tax Thresholds — Freeze Continues

The personal allowance (£12,570) and higher rate threshold (£50,270) are frozen until **April 2028** at the earliest, under the policy announced in Autumn Statement 2022 and confirmed through subsequent budgets. No changes are expected for 2026/27 on these thresholds.

### 15.2 NIC Thresholds

No changes to employee NIC thresholds have been announced for 2026/27 as of March 2026. The PT (£12,570) remains aligned with the income tax PA.

### 15.3 Scottish Rates

The Scottish Budget for 2025/26 made changes to some bands. 2026/27 Scottish rates will be set by the Scottish Parliament in their Budget (typically December–January). Monitor: https://www.gov.scot/topics/finance/budgets/

### 15.4 Student Loan Thresholds

Thresholds are typically uprated annually in April. 2026/27 thresholds will be confirmed by DfE/SLC around February–March 2026. The calculator should treat these as a configurable parameter, not a hard-coded constant.

### 15.5 Pension Auto-Enrolment

There are no announced changes to auto-enrolment minimum contribution rates (8% total) for 2026/27. However, the government has signalled a future intention to expand auto-enrolment to 18-year-olds and remove the lower qualifying earnings limit (£6,240 threshold). No implementation date confirmed.

---

## Appendix A: Quick Reference — 2025/26 Key Numbers

| Parameter | Value |
|-----------|-------|
| Personal Allowance | £12,570 |
| Basic Rate Band (width) | £37,700 |
| Higher Rate threshold | £50,270 |
| Additional Rate threshold | £125,140 |
| PA taper starts | £100,000 |
| PA taper ends | £125,140 |
| Basic rate | 20% |
| Higher rate | 40% |
| Additional rate | 45% |
| NIC Primary Threshold | £12,570/year |
| NIC Upper Earnings Limit | £50,270/year |
| NIC rate (PT–UEL) | 8% |
| NIC rate (above UEL) | 2% |
| Student Loan Plan 1 threshold | £26,065 |
| Student Loan Plan 2 threshold | £28,470 |
| Student Loan Plan 4 threshold | £32,745 |
| Student Loan Plan 5 threshold | £25,000 |
| Student Loan Postgraduate threshold | £21,000 |
| Plans 1–5 repayment rate | 9% |
| Postgraduate Loan repayment rate | 6% |
| Marriage Allowance transfer | £1,260 |
| Blind Person's Allowance | £3,130 |
| Dividend Allowance | £500 |
| Dividend basic rate | 8.75% |
| Dividend higher rate | 33.75% |
| Dividend additional rate | 39.35% |
| CGT Annual Exempt Amount | £3,000 |
| CGT basic rate | 18% |
| CGT higher rate | 24% |
| Auto-enrolment employee min | 5% |
| Auto-enrolment employer min | 3% |
| Qualifying earnings lower limit | £6,240 |
| Qualifying earnings upper limit | £50,270 |

---

## Appendix B: Scottish Income Tax — 2025/26 Quick Reference

| Band | From | To | Rate | Band width |
|------|------|----|------|-----------|
| Personal Allowance | £0 | £12,570 | 0% | £12,570 |
| Starter | £12,571 | £15,397 | 19% | £2,827 |
| Basic | £15,398 | £27,491 | 20% | £12,094 |
| Intermediate | £27,492 | £43,662 | 21% | £16,171 |
| Higher | £43,663 | £75,000 | 42% | £31,338 |
| Advanced | £75,001 | £125,140 | 45% | £50,140 |
| Top | £125,141 | — | 48% | — |

---

*This document is prepared by Sarah (Taxation Expert Agent) for developer use on the ExpatCalc salary calculator project. It reflects regulations as of the 2025/26 tax year. Tax rules change annually — verify thresholds at the start of each new tax year against the sources listed in the Regulatory Sources section above. This document does not constitute professional tax or legal advice.*
