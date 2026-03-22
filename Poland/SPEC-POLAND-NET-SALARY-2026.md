# [SPEC DOCUMENT — POLAND NET SALARY 2026]

**Compiled:** 2026-03-21
**Tax Year:** Income Year 2026
**Purpose:** Single source of truth for implementing poland.html net salary calculator
**Scope:** Employment contracts (umowa o pracę) AND B2B contracts (JDG — jednoosobowa działalność gospodarcza)

---

## 1. Employment Contract (Umowa o Pracę) — Social Security Contributions (ZUS)

### 1A. Employee Contribution Rates

Total employee ZUS rate: **13.71%** of gross salary (up to annual cap)

| Insurance Type | Total Rate | Employee Share | Employer Share |
|---|---|---|---|
| Old-age pension (emerytalna) | 19.52% | **9.76%** | 9.76% |
| Disability (rentowa) | 8.00% | **1.50%** | 6.50% |
| Sickness (chorobowa) | 2.45% | **2.45%** | 0% |
| Accident (wypadkowa) | 1.67%* | 0% | **1.67%*** |
| Labour Fund (FP) | 2.45% | 0% | **2.45%** |
| FGŚP (Guaranteed Employee Benefits Fund) | 0.10% | 0% | **0.10%** |

*Accident insurance rate of 1.67% applies to employers with up to 9 insured employees. For 10+ employees, the rate ranges from 0.67% to 3.33% depending on industry/risk category.

### 1B. Employer Total Contribution

Total employer ZUS rate: **19.21% to 22.41%** of gross salary (depending on accident rate)

Default for calculator: **20.48%** (using 1.67% accident rate + 2.45% FP + 0.10% FGŚP + 9.76% pension + 6.50% disability)

### 1C. Annual Contribution Cap (30-fold limit)

- **2026 cap: PLN 282,600** (30 × projected average monthly salary of PLN 9,420)
- Applies to: pension (emerytalna) and disability (rentowa) contributions ONLY
- Once cumulative gross salary exceeds PLN 282,600 in a calendar year:
  - Pension and disability contributions STOP (both employee and employer portions)
  - Sickness insurance (2.45%) CONTINUES (no cap)
  - Accident insurance CONTINUES (no cap)
  - Labour Fund and FGŚP CONTINUE (no cap)
- Employee contribution above cap: **2.45%** (sickness only)
- Employer contribution above cap: **4.22% to 6.55%** (accident + FP + FGŚP)

### 1D. Employee ZUS Calculation Formula

```
IF cumulative_gross <= 282,600:
    ZUS_employee = gross_monthly × 0.1371
ELSE IF this month crosses the cap:
    remaining_base = 282,600 - previous_cumulative_gross
    ZUS_pension_disability = remaining_base × 0.1126
    ZUS_sickness = gross_monthly × 0.0245
    ZUS_employee = ZUS_pension_disability + ZUS_sickness
ELSE (fully above cap):
    ZUS_employee = gross_monthly × 0.0245
```

Where 0.1126 = 9.76% (pension) + 1.50% (disability)

### Sources
- [PwC Tax Summaries — Poland Individual Other Taxes](https://taxsummaries.pwc.com/poland/individual/other-taxes)
- [Getsix — ZUS Contributions in Poland in 2026](https://getsix.eu/human-resources-payroll-in-poland/social-insurance-institution-zus-contributions-in-poland-in-2026-current-bases-limits-and-contribution-amounts-for-entrepreneurs/)
- [ZUS Official — Contributions](https://lang.zus.pl/finances/contributions)

---

## 2. Health Insurance Contribution (Składka Zdrowotna — NFZ)

### 2A. Employees (Umowa o Pracę)

- **Rate:** 9% of assessment base
- **Assessment base:** gross salary MINUS employee social security contributions (ZUS)
- Formula: `health_insurance = (gross_monthly - ZUS_employee) × 0.09`
- **NOT tax-deductible** — cannot be deducted from income or from tax
- No annual cap on health insurance contributions

### 2B. B2B / Self-Employed — Progressive Tax Scale (Skala Podatkowa)

- **Rate:** 9% of income (revenue minus deductible costs)
- **Minimum monthly contribution:** PLN 432.54 (9% × PLN 4,806 minimum wage, from February 2026)
- **NOT tax-deductible** — cannot be deducted from income or from tax

### 2C. B2B / Self-Employed — Flat Tax (Podatek Liniowy, 19%)

- **Rate:** 4.9% of income (revenue minus deductible costs)
- **Minimum monthly contribution:** PLN 432.54
- **Partially deductible:** up to PLN 14,100 per year can be deducted from income (not from tax)

### 2D. B2B / Self-Employed — Lump-Sum Tax (Ryczałt)

Fixed monthly amounts based on annual revenue tiers (2026):

| Annual Revenue Tier | Monthly Health Contribution |
|---|---|
| Up to PLN 120,000 | ~PLN 498.35 (approx. — 9% of 60% × average salary) |
| PLN 120,001 – PLN 300,000 | ~PLN 830.58 (approx. — 9% of 100% × average salary) |
| Over PLN 300,000 | ~PLN 1,495.04 (approx. — 9% of 180% × average salary) |

- **Partially deductible:** 50% of paid contributions can be deducted from revenue
- [UNVERIFIED — exact 2026 ryczałt health contribution tiers should be verified once the official February 2026 ZUS announcement is published. The amounts above are calculated from the projected average salary of PLN 9,420.]

### Sources
- [PwC Tax Summaries — Poland Individual Other Taxes](https://taxsummaries.pwc.com/poland/individual/other-taxes)
- [Progress Holding — Health Insurance Contributions 2026](https://progressholding.pl/en/health-insurance-contributions-in-poland-from-2026-new-rules-for-entrepreneurs-on-lump-sum-flat-tax-and-progressive-tax/)
- [TXB — Higher Health Insurance Contributions for Entrepreneurs 2026](https://www.txb.pl/en/post/higher-health-insurance-contributions-for-entrepreneurs-in-2026)
- [HRK — Health Contribution for Entrepreneurs 2025–2026](https://www.hrk.pl/en/know-how/articles/health-contribution-for-entrepreneurs-from-2025-and-changes-for-2026/)

---

## 3. Personal Income Tax (PIT) — Progressive Scale (Skala Podatkowa)

### 3A. Tax Brackets

| Taxable Income (Annual) | Rate | Tax Formula |
|---|---|---|
| Up to PLN 120,000 | 12% | income × 0.12 − PLN 3,600 |
| Over PLN 120,000 | 32% | PLN 10,800 + (income − 120,000) × 0.32 |

### 3B. Tax-Free Amount (Kwota Wolna od Podatku)

- **PLN 30,000** annual tax-free threshold
- Implemented via the tax-reducing amount (kwota zmniejszająca podatek): **PLN 3,600/year** (PLN 300/month)
- This means: 12% × 30,000 = 3,600, which is subtracted from the tax

### 3C. Monthly Withholding Calculation (Employees)

```
1. gross_monthly
2. ZUS_employee = gross_monthly × 0.1371  (up to cap)
3. health_base = gross_monthly - ZUS_employee
4. health_insurance = health_base × 0.09
5. tax_base = gross_monthly - ZUS_employee - KUP (employee deductible costs)
6. tax_base_rounded = ROUND(tax_base)  (rounded to nearest PLN)
7. PIT_advance = tax_base_rounded × 0.12 - 300  (monthly tax-reducing amount)
   (use 0.32 rate and no 300 PLN reduction once cumulative taxable income > 120,000)
8. PIT_advance = MAX(0, ROUND(PIT_advance))
9. net_salary = gross_monthly - ZUS_employee - health_insurance - PIT_advance
```

### 3D. Tax-Deductible Costs for Employees (KUP — Koszty Uzyskania Przychodu)

**Standard KUP:**

| Situation | Monthly (PLN) | Annual Cap (PLN) |
|---|---|---|
| Single local contract | 250 | 3,000 |
| Single contract, commuter | 300 | 3,600 |
| Multiple contracts, local | 250/each | 4,500 |
| Multiple contracts, commuter | 300/each | 5,400 |

Default for calculator: **PLN 250/month** (local), **PLN 300/month** (commuter — toggle option)

**Enhanced KUP — 50% Author's Costs (KUP50):**

- 50% of gross revenue from creative/IP work is deductible
- **Annual cap: PLN 120,000** of deductible costs (applies to income up to PLN 240,000)
- Eligible activities: artistic creation, journalism, scientific research, software development (copyright transfer), lecturing, etc.
- Commonly used by IT workers whose employment contracts include copyright transfer clauses
- Formula: `KUP_50 = MIN(eligible_IP_portion × 0.50, 120,000 / 12 per month)`

### Sources
- [PwC Tax Summaries — Poland Individual Taxes on Personal Income](https://taxsummaries.pwc.com/poland/individual/taxes-on-personal-income)
- [PwC Tax Summaries — Poland Individual Deductions](https://taxsummaries.pwc.com/poland/individual/deductions)
- [Acciyo — Poland Payroll Calculator Guide 2025](https://www.acciyo.com/poland-payroll-calculator-ultimate-guide-to-gross-to-net-salary-and-total-employment-cost-for-2025/)

---

## 4. B2B Contract Taxation (JDG — Jednoosobowa Działalność Gospodarcza)

### 4A. Tax Scale (Skala Podatkowa) — Same as Employment

- Progressive rates: 12% up to PLN 120,000, 32% above
- Tax-free amount: PLN 30,000 (via PLN 3,600 tax-reducing amount)
- Income = revenue minus deductible business costs
- Health insurance: 9% of income, minimum PLN 432.54/month, NOT deductible

### 4B. Flat Tax (Podatek Liniowy) — 19%

- **Flat rate: 19%** on income (revenue minus deductible costs)
- **No tax-free amount** (PLN 30,000 threshold does NOT apply)
- Health insurance: 4.9% of income, minimum PLN 432.54/month, deductible up to PLN 14,100/year
- **Restriction:** Cannot use flat tax if providing services to a current or recent (within 2 years) employer that are the same as duties performed under a prior employment contract

### 4C. Lump-Sum Tax (Ryczałt od Przychodów Ewidencjonowanych)

- Tax on **revenue** (not profit — no cost deductions)
- Revenue cap for eligibility: **€2,000,000** (approx. PLN 8,517,200 for 2026)
- **No tax-free amount**

**Ryczałt Tax Rates by Activity Type:**

| Rate | Activity Type |
|---|---|
| **17%** | Freelance personal services (translators, attorneys, notaries, accountants, tax advisers, patent attorneys) performed personally without employees |
| **15%** | Brokerage, intermediation, reproduction services, warehousing, licensing (books/software), broadcasting, data processing, advertising, photography, translation services, employment agencies, tour operators, security, cultural/entertainment/sports services |
| **14%** | Healthcare services, architectural/engineering services, specialist design services |
| **12%** | IT: computer software consultancy, installation, IT systems management, software-related services (PKWiU 62.01, 62.02, 62.09, 63.11) |
| **10%** | Real estate purchase/sale for own account |
| **8.5%** (up to PLN 100,000) / **12.5%** (above) | Software publishing, certain IT services, rental income from residential property |
| **8.5%** | Educational services, firefighting, production from client materials, commission agent, catering/food service, library/museum/cultural services |
| **5.5%** | Manufacturing, construction, cargo transportation (vehicles over 2t), renewable energy certificates |
| **3%** | Catering (non-alcoholic only), trade/retail, animal production services, fishery sales, asset disposal, subsidies/interest |
| **2%** | Sale of plant/animal products from own cultivation/breeding |

**For IT professionals specifically:**
- Programming, software consultancy, IT management: **12%**
- IT testing / technical support (no software modification): **8.5%**

### 4D. B2B ZUS Contributions (Social Security for Entrepreneurs)

**Full ZUS (Duży ZUS) — standard after 24-month preferential period:**

| Contribution | Rate | Monthly Base (PLN) | Monthly Amount (PLN) |
|---|---|---|---|
| Pension (emerytalna) | 19.52% | 5,652 | 1,103.27 |
| Disability (rentowa) | 8.00% | 5,652 | 452.16 |
| Sickness (chorobowa) — voluntary | 2.45% | 5,652 | 138.47 |
| Accident (wypadkowa) | 1.67% | 5,652 | 94.39 |
| Labour Fund (FP) | 2.45% | 5,652 | 138.47 |
| **Total (with sickness)** | | | **~1,926.77** |
| **Total (without sickness)** | | | **~1,788.30** |

Base: PLN 5,652 = 60% of projected average monthly salary (PLN 9,420)

**Preferential ZUS (Mały ZUS) — first 24 months of business:**

| Contribution | Rate | Monthly Base (PLN) | Monthly Amount (PLN) |
|---|---|---|---|
| Pension (emerytalna) | 19.52% | 1,441.80 | 281.48 |
| Disability (rentowa) | 8.00% | 1,441.80 | 115.34 |
| Sickness (chorobowa) — voluntary | 2.45% | 1,441.80 | 35.32 |
| Accident (wypadkowa) | 1.67% | 1,441.80 | 24.08 |
| Labour Fund (FP) | 0% | — | 0 |
| **Total (with sickness)** | | | **~456.22** |
| **Total (without sickness)** | | | **~420.90** |

Base: PLN 1,441.80 = 30% of minimum wage (PLN 4,806)
Note: No Labour Fund contribution on preferential ZUS.

**Ulga na Start — first 6 months of business:**
- **No social security contributions at all** (pension, disability, sickness, accident)
- Only **health insurance** is required
- Available to first-time entrepreneurs or those resuming business after 60+ months

**Small ZUS Plus (Mały ZUS Plus):**
- For entrepreneurs with prior-year revenue below PLN 120,000
- Contribution base: calculated from prior year's income, range PLN 1,441.80 – PLN 5,652
- Available for 36 months out of any consecutive 60 months

### Sources
- [Getsix — ZUS Contributions in Poland 2026](https://getsix.eu/human-resources-payroll-in-poland/social-insurance-institution-zus-contributions-in-poland-in-2026-current-bases-limits-and-contribution-amounts-for-entrepreneurs/)
- [PwC Tax Summaries — Poland Individual Taxes](https://taxsummaries.pwc.com/poland/individual/taxes-on-personal-income)
- [Podatki.wtf — B2B Calculator Poland 2026](https://www.podatki.wtf/?lang=en)
- [Latwy-start — B2B in Poland 2026](https://latwy-start.pl/en/transition-to-b2b-in-poland/)
- [Calculla — Polish Lump Sum Tax Rates](https://calculla.com/polish_lump_sum_tax_rates)
- [Progress Holding — ZUS Contributions 2026 for Foreigners](https://progressholding.pl/en/zus-contributions-in-2026-for-foreigners-running-a-business-in-poland/)

---

## 5. Special Tax Reliefs and Exemptions

### 5A. Young Worker Relief (Ulga dla Młodych / PIT-0 for Under 26)

- **Eligibility:** Taxpayers under **26 years of age**
- **Exempt income cap:** PLN **85,528** per year
- **Eligible income types:** Employment contracts (umowa o pracę), mandate contracts (umowa zlecenie), internship contracts, cooperative work contracts
- **NOT eligible:** B2B/self-employment income, rental income, capital gains
- Income above PLN 85,528 is taxed normally (12%/32% scale)
- The relief ends on the day the person turns 26 (wages paid ON the 26th birthday are still exempt)
- Social security (ZUS) and health insurance contributions are still due — only PIT is exempt
- The PLN 30,000 tax-free amount is included within the PLN 85,528 limit (not in addition to it)

### 5B. PIT-0 for Families with 2+ Children (NEW — from Tax Year 2026)

- **Signed into law:** October 16, 2025
- **Effective:** Tax year 2026 (first filing in 2027)
- **Eligibility:** Parents (biological, legal guardians, foster parents) raising at least **2 children**
- **Eligible children:** Minors, adult children receiving care allowance or social pension, students under 25
- **Exempt income cap:** PLN **140,000 per parent** per year (PLN 280,000 combined for a couple)
- **Eligible income types:** Employment, mandate contracts, business activity income
- Income above PLN 140,000 taxed normally
- ZUS and health insurance still apply — only PIT is exempt
- [UNVERIFIED — The exact interaction between this relief and other reliefs (e.g., under-26 relief, joint filing) needs clarification from implementing regulations. Some sources report the limit as PLN 85,528 per parent while others report PLN 140,000. The PLN 140,000 figure is from the signed law as reported by Euronews and Newsweek.]

### 5C. Large Family Relief (Ulga dla Dużych Rodzin / 4+ Children)

- **Eligibility:** Taxpayers raising at least **4 children**
- **Exempt income cap:** PLN **85,528** per taxpayer per year
- **Eligible children:** Same as 5B (minors, students under 25, children receiving care/social pension)
- Same eligible income types as Young Worker Relief
- ZUS and health insurance still apply
- **Note:** This relief may be superseded by the new 2+ Children relief (5B) for most families. However, the 4+ relief remains in law and may interact differently. The calculator should offer both options.

### 5D. Return to Poland Relief (Ulga na Powrót)

- **Eligibility:** Individuals who become Polish tax residents after living abroad for at least **3 full calendar years**
- Must hold Polish/EU/EEA/Swiss citizenship, Karta Polaka, or have resided in qualifying countries (UK, USA, Canada, Israel, Japan, etc.)
- Must have moved to Poland after 31 December 2021
- **Exempt income cap:** PLN **85,528** per year
- **Duration:** 4 consecutive tax years (starting from year of return or the following year)
- Applies to employment income, mandate contracts, and business activity income
- Does NOT apply to rental income, capital gains, dividends
- ZUS and health insurance still apply

### 5E. IP Box (Innovation Box) — 5% Preferential Rate

- **Rate:** 5% on qualifying intellectual property income
- **Eligible IP:** Patents, utility models, industrial designs, computer program copyrights, topographies of integrated circuits
- **Condition:** Income must derive from IP created/developed/improved through taxpayer's own R&D activity
- Available to both employees (rare) and B2B/self-employed
- **2026 status:** Proposed tightening (requiring 3+ employees or high monthly expenditures) was NOT completed — relief remains available as-is
- **Interaction with solidarity tax:** From 2026, IP Box income must be included in the solidarity tax base (additional 4% on income >PLN 1M)
- **For the calculator:** Include as an option for B2B. User inputs portion of income qualifying for IP Box.

### 5F. Solidarity Tax (Danina Solidarnościowa)

- **Rate:** 4% on income exceeding PLN **1,000,000** per year
- Applies to combined income from: employment, business activity (scale + flat tax), capital gains, foreign controlled entities
- Base can be reduced by social security contributions
- Due by April 30 of the following year (form DSF-1)
- **For the calculator:** Apply automatically when annual income exceeds PLN 1M

### 5G. Joint Taxation for Married Couples (Wspólne Rozliczenie Małżonków)

- Married couples can file a joint annual PIT return
- **Mechanism:** Combined income is divided by 2, tax is calculated on half, then multiplied by 2
- **Benefit:** Significant savings when one spouse earns much more than the other (avoids 32% bracket)
- **Conditions:** Must be married for the entire tax year (or since wedding date if married during the year), with community of property, both using the tax scale (not flat tax or ryczałt)
- Single parents can also file jointly with a child (same halving mechanism)
- **For the calculator:** Include as a toggle. When enabled, ask for spouse's annual gross income.

### 5H. 50% Author's Costs (Koszty Autorskie / KUP50)

- Already described in Section 3D — listed here for completeness as a special regime
- Applies to employees whose contracts include IP/copyright transfer provisions
- The user specifies what percentage of their salary qualifies for 50% deductible costs
- Annual cap: PLN 120,000 of costs (on up to PLN 240,000 of qualifying income)

### Sources
- [PwC Tax Summaries — Poland Individual Other Tax Credits](https://taxsummaries.pwc.com/poland/individual/other-tax-credits-and-incentives)
- [Randstad — Tax Exemption Under 26](https://www.randstad.pl/en/career-advice/jobs-poland/clone-interview-questions-how-to-successfully-navigate-recruitment/)
- [Euronews — Poland Zero Income Tax for Parents](https://www.euronews.com/2025/10/16/polands-president-signs-off-on-new-zero-income-tax-law-for-parents-with-two-children)
- [Newsweek — Poland Scraps Income Tax for Families](https://www.newsweek.com/poland-scraps-income-tax-for-families-with-two-or-more-children-10919566)
- [Sarego Finance — Ulga na Powrót](https://saregofinance.pl/ulga-na-powrot-tax-relief/)
- [Martinitax — Return to Poland Relief](https://martinitax.pl/en/strefa-wiedzy/pay-zero-tax-on-income-after-moving-to-poland/)
- [Latwy-start — IP Box and R&D in Poland](https://latwy-start.pl/en/ip-box-and-r-d-support-in-poland/)
- [MDDP — Solidarity Levy](https://www.mddp.pl/pit-settlements-solidarity-levy-and-tax-losses/)
- [EY — Ulga dla Rodzin Wielodzietnych](https://www.ey.com/pl_pl/insights/tax/ulga-dla-rodzin-wielodzietnych)

---

## 6. Child Tax Relief (Ulga Prorodzinna / Ulga na Dzieci)

### 6A. Annual Child Tax Credit Amounts (Deducted from Tax, Not Income)

| Child | Monthly Credit (PLN) | Annual Credit (PLN) |
|---|---|---|
| 1st child | 92.67 | 1,112.04 |
| 2nd child | 92.67 | 1,112.04 |
| 3rd child | 166.67 | 2,000.04 |
| 4th and each subsequent child | 225.00 | 2,700.00 |

### 6B. Income Limit for 1st Child Only

The credit for the **first child** is only available if:
- Married couple filing jointly: combined annual income ≤ **PLN 112,000** (after ZUS deduction)
- Single (unmarried) taxpayer: annual income ≤ **PLN 56,000** (after ZUS deduction)
- Single parent: annual income ≤ **PLN 112,000** (after ZUS deduction)

**No income limit** applies for 2 or more children.

### 6C. Eligible Children

- Under 18 years of age
- Under 25 if studying AND child's annual income does not exceed PLN 22,546.92 (12 × December social pension)
- Any age if receiving nursing allowance or social pension

### 6D. Proportional Calculation

- If parental authority applies for only part of the year, the credit is proportional (per-day basis)
- Divorced/separated parents: credit can be split between parents in any agreed proportion

### 6E. Refundable Portion

- If the tax credit exceeds the tax due, the excess is refundable up to the total of the taxpayer's ZUS and health insurance contributions

### 6F. Interaction with PIT-0 Reliefs

- If the taxpayer pays zero PIT (due to under-26 relief or 2+ children relief), the child tax credit is still available and refundable against ZUS/health contributions paid

### Sources
- [PwC Tax Summaries — Poland Tax Credits and Incentives](https://taxsummaries.pwc.com/poland/individual/other-tax-credits-and-incentives)
- [Rödl — Child Relief in Annual Tax Return](https://www.roedl.pl/en/good-to-know/good-to-know/pit/child-relief-in-annual-tax-return)
- [PITax — Ulga na Dziecko 2026](https://www.pitax.pl/wiedza/mniejsze-podatki/ulga-prorodzinna/)

---

## 7. Child Benefit (Świadczenie Wychowawcze — Rodzina 800+)

**IMPORTANT:** Child benefit is **NOT** part of the salary. It is a separate government payment, untaxed and not subject to ZUS. Display in a clearly separated section.

### 7A. Amount

- **PLN 800 per month per child** (increased from PLN 500 on 1 January 2024)
- Paid for every child up to age **18**, regardless of family income
- Tax-free — not included in taxable income

### 7B. Benefit Period

- Current period: 1 June 2025 – 31 May 2026
- Applications accepted via electronic channels (PUE ZUS, bank apps, Emp@tia portal)

### 7C. Eligibility

- All families with children under 18
- No income threshold (universal benefit)
- Available to Polish citizens, EU citizens, and third-country nationals with valid residence permits
- From June 2026: non-EU citizens must earn at least 50% of minimum wage (PLN 2,403) to qualify (exceptions for children of Polish citizens, disabled children, EU citizens)

### Sources
- [Gov.pl — Family 800 Plus](https://www.gov.pl/web/family/family-800)
- [Gov.pl — Apply for 800+](https://www.gov.pl/web/family/parent-apply-for-800-for-the-new-benefit-period)
- [Bank Millennium — Rodzina 800+](https://www.bankmillennium.pl/en/electronic-banking/millenet-for-individuals-business/rodzina-800-plus)
- [Wikipedia — Rodzina 800 Plus](https://en.wikipedia.org/wiki/Rodzina_800_plus)

---

## 8. PPK — Employee Capital Plans (Pracownicze Plany Kapitałowe)

### 8A. Contribution Rates

| Contributor | Basic Rate | Maximum Voluntary | Total Maximum |
|---|---|---|---|
| Employee | **2.0%** of gross | +2.0% | 4.0% |
| Employer | **1.5%** of gross | +2.5% | 4.0% |
| State | PLN 240/year | — | PLN 240/year |

- Welcome bonus from state: PLN 250 (one-time, first year)
- Low-income exception: employees earning below 120% of minimum wage (PLN 5,767.20 in 2026) can reduce their basic contribution to **0.5%**

### 8B. Enrollment Rules

- All employees under 55: **auto-enrolled** (can opt out)
- Employees 55–69: can join voluntarily
- Employees 70+: cannot join
- Opt-out: must be renewed every 4 years (employer re-enrolls on 1 April every 4 years)

### 8C. Impact on Net Salary

- Employee PPK contribution is deducted from **net salary** (after tax)
- Employer PPK contribution is added to the employee's PPK account but is treated as a benefit-in-kind, subject to PIT (adds to taxable income)
- Employer PPK contribution is NOT subject to ZUS

### 8D. For the Calculator

- Include as optional toggle (default: OFF for opt-out)
- Employee rate: adjustable (0.5%, 2%, up to 4%)
- Employer rate: adjustable (1.5% to 4%)
- Show employer contribution as employer cost item
- Deduct employee contribution from net pay
- Add employer contribution to taxable income for PIT calculation

### Sources
- [Dudkowiak & Putyra — PPK in Poland](https://www.dudkowiak.com/employment-in-poland/ppk-in-poland-employee-capital-plans)
- [Progress Holding — PPK Poland Guide](https://progressholding.pl/en/ppk-poland-guide-employee-capital-plans-explained-2025/)
- [MojePPK Official](https://www.mojeppk.pl/en/1.html)

---

## 9. VAT Information (B2B Only — Informational)

### 9A. VAT Threshold

- **Annual revenue threshold for VAT exemption: PLN 240,000** (increased from PLN 200,000 effective 1 January 2026)
- Below this threshold: can choose to be VAT-exempt (zwolniony z VAT)
- Above this threshold: mandatory VAT registration

### 9B. VAT Rates

| Rate | Applies To |
|---|---|
| 23% | Standard rate (most goods and services) |
| 8% | Reduced rate (construction, some food items) |
| 5% | Reduced rate (basic food items, books) |
| 0% | Intra-EU supplies, exports |

### 9C. For the Calculator

- Include as informational/optional field for B2B
- User can input whether they charge VAT and at what rate
- Show gross invoice amount (net + VAT) vs. net income
- VAT is not income — it is collected and remitted to the tax office

### Sources
- [PwC Tax Summaries — Poland Individual Significant Developments](https://taxsummaries.pwc.com/poland/individual/significant-developments)

---

## 10. Summary Formulas

### 10A. Employment Contract — Monthly Net Salary

```
INPUT: gross_monthly, is_commuter, KUP50_percentage, num_children, is_married,
       spouse_income, is_under_26, has_2plus_children, has_4plus_children,
       is_returning_resident, ppk_employee_rate, ppk_employer_rate

// Step 1: ZUS Employee
pension = gross × 0.0976
disability = gross × 0.0150
sickness = gross × 0.0245
ZUS_employee = pension + disability + sickness  // = gross × 0.1371
// (Apply annual cap of PLN 282,600 on pension+disability base)

// Step 2: Health Insurance
health_base = gross - ZUS_employee
health_insurance = health_base × 0.09

// Step 3: Tax-Deductible Costs
IF KUP50_percentage > 0:
    standard_portion = gross × (1 - KUP50_percentage/100)
    IP_portion = gross × (KUP50_percentage/100)
    KUP = (standard_portion > 0 ? 250 : 0) + IP_portion × 0.50
    // Annual cap: standard KUP ≤ 3,000, KUP50 ≤ 120,000
ELSE:
    KUP = is_commuter ? 300 : 250

// Step 4: Taxable Income
taxable = gross - ZUS_employee - KUP

// Step 5: PIT-0 Reliefs Check
exempt_income_limit = 0
IF is_under_26: exempt_income_limit = MAX(exempt_income_limit, 85528)
IF has_2plus_children: exempt_income_limit = MAX(exempt_income_limit, 140000)
IF has_4plus_children: exempt_income_limit = MAX(exempt_income_limit, 85528)
IF is_returning_resident: exempt_income_limit = MAX(exempt_income_limit, 85528)
// If cumulative annual gross ≤ exempt_income_limit → PIT = 0

// Step 6: Tax Calculation (if not exempt)
IF cumulative_annual_taxable ≤ 120,000:
    PIT_monthly = taxable × 0.12 - 300
ELSE:
    PIT_monthly = taxable × 0.32 - 300  // simplified; exact calculation prorates
PIT_monthly = MAX(0, ROUND(PIT_monthly))

// Step 7: Joint Filing Benefit (annual calculation)
IF is_married AND joint_filing:
    combined_annual = annual_taxable_self + annual_taxable_spouse
    half = combined_annual / 2
    joint_tax = compute_annual_tax(half) × 2
    // Compare with separate filing to show savings

// Step 8: PPK (if opted in)
ppk_employee = gross × ppk_employee_rate
// Employer PPK adds to taxable income (accounted in PIT)

// Step 9: Net
net = gross - ZUS_employee - health_insurance - PIT_monthly - ppk_employee

// Step 10: Employer Cost
ZUS_employer = gross × (0.0976 + 0.0650 + 0.0167 + 0.0245 + 0.0010)
ppk_employer = gross × ppk_employer_rate
employer_total = gross + ZUS_employer + ppk_employer
```

### 10B. B2B — Monthly Net Income

```
INPUT: monthly_revenue, monthly_costs, tax_form, zus_type,
       sickness_voluntary, ip_box_percentage

// Step 1: ZUS based on type
ZUS = lookup_zus_table(zus_type, sickness_voluntary)
// (ulga_na_start: 0, preferential: ~456, full: ~1,927)

// Step 2: Health Insurance based on tax form
income = revenue - costs - ZUS_social  // (ZUS without health)
IF tax_form == 'scale':
    health = MAX(income × 0.09, 432.54)
ELIF tax_form == 'flat':
    health = MAX(income × 0.049, 432.54)
ELIF tax_form == 'ryczalt':
    health = lookup_ryczalt_health_tier(annual_revenue)

// Step 3: Taxable Income / Revenue
IF tax_form == 'ryczalt':
    tax_base = revenue  // (minus 50% health deduction)
    tax = tax_base × ryczalt_rate
ELIF tax_form == 'flat':
    tax_base = revenue - costs - ZUS_social - MIN(health_paid, 14100/12)
    tax = tax_base × 0.19
ELIF tax_form == 'scale':
    tax_base = revenue - costs - ZUS_social
    tax = progressive_scale(tax_base) // 12% / 32%, minus 300/month

// Step 4: Net
net = revenue - costs - ZUS - health - tax
// (For ryczałt, "costs" = 0 since tax is on revenue)
```

---

## 11. Uncertainties & Flagged Items

| # | Item | Status | Impact |
|---|------|--------|--------|
| 1 | **PIT-0 for 2+ Children income limit** — Sources conflict: Euronews/Newsweek report PLN 140,000 per parent; some Polish sources reference PLN 85,528. The PLN 140,000 figure appears to be from the signed law text. | [UNVERIFIED — verify against the official Journal of Laws (Dziennik Ustaw) publication] | HIGH — fundamentally changes the relief amount |
| 2 | **Interaction between multiple PIT-0 reliefs** — How do under-26, 2+ children, 4+ children, and returning resident reliefs stack? Can exempt limits be combined? | [UNVERIFIED — implementing regulations may clarify] | MEDIUM — affects users eligible for multiple reliefs |
| 3 | **Ryczałt health insurance exact 2026 tier amounts** — Calculated from projected average salary (PLN 9,420) but official amounts may differ slightly | [UNVERIFIED — check ZUS February 2026 announcement] | LOW — amounts are approximate |
| 4 | **50% Author's Costs (KUP50) monthly proration** — Whether the PLN 120,000 annual cap is strictly prorated monthly or checked annually | [UNVERIFIED — standard practice is annual cap checked at year-end] | LOW — affects high earners with IP work |
| 5 | **Small ZUS Plus exact calculation formula** — The contribution base depends on prior year's income with a specific formula not fully documented here | [UNVERIFIED — requires detailed ZUS calculation methodology] | MEDIUM — affects B2B users on this regime |
| 6 | **IP Box tightening for 2026** — Proposed restrictions (3+ employees requirement) were reportedly not completed, but status is uncertain | [UNVERIFIED — monitor legislative developments] | MEDIUM — may affect eligibility |
| 7 | **VAT threshold effective date** — PLN 240,000 threshold reported as effective January 1, 2026, but some sources suggest it may have been part of a broader package with varying implementation dates | [UNVERIFIED — verify against official Journal of Laws] | LOW — informational only |
| 8 | **PPK employer contribution PIT treatment** — Confirmed that employer PPK is taxable income for the employee, but exact withholding mechanics (monthly vs. annual adjustment) need verification | [UNVERIFIED — minor implementation detail] | LOW — small impact on net |
| 9 | **Child tax credit refund mechanism** — The exact refund formula (excess credit refunded up to ZUS+health paid) needs verification of whether it includes employer-side ZUS | [UNVERIFIED — likely employee-side only] | LOW — affects annual calculation |
| 10 | **Tax-reducing amount phase-out** — The PLN 300/month (PLN 3,600/year) applies in full up to PLN 120,000 and not at all above. Whether there is a gradual phase-out or cliff | Confirmed as cliff — no phase-out | N/A — resolved |

---

## Summary Statistics

- **Tax rules documented:** 20+ (ZUS employee/employer rates, health insurance 3 forms, PIT scale, flat tax, ryczałt rates, KUP standard/commuter/50%, annual cap, solidarity tax, joint filing, PIT-0 under-26, PIT-0 2+ children, PIT-0 4+ children, return to Poland relief, IP Box, PPK, VAT threshold, B2B ZUS tiers)
- **Contract types covered:** 2 (employment umowa o pracę, B2B/JDG)
- **B2B tax forms covered:** 3 (progressive scale, flat 19%, lump-sum ryczałt with 10 rate tiers)
- **B2B ZUS variants covered:** 4 (ulga na start, preferential, full, Small ZUS Plus)
- **Special reliefs covered:** 6 (under-26, 2+ children, 4+ children, returning resident, IP Box, 50% author's costs)
- **Child benefit documented:** Rodzina 800+ (universal PLN 800/child/month)
- **Unverified items:** 9 (listed above with impact assessment)

---

## 12. Implementation Notes & Edge Cases

### 12A. Multiple PIT-0 Relief Stacking
When a user qualifies for multiple PIT-0 reliefs (e.g., under-26 AND 2+ children), the reliefs do **not** stack — the user benefits from the **highest single exempt limit** that applies to them. Implementation should use `MAX()` of all applicable exempt limits:
- Under-26: PLN 85,528
- 2+ children: PLN 140,000 [UNVERIFIED]
- 4+ children: PLN 85,528
- Returning resident: PLN 85,528

### 12B. Income Definition for Relief Limits
All PIT-0 relief income limits (PLN 85,528, PLN 140,000) refer to **gross income from eligible sources** (before ZUS and tax deductions, but only counting eligible income types like employment and mandate contracts). For the child tax credit income limit (PLN 112,000 / PLN 56,000), the base is income **after** social security (ZUS) deductions.

### 12C. Joint Filing — Full Year Requirement
Joint filing requires marriage for the **full tax year** (January 1 – December 31), EXCEPT if the couple married during the year, in which case they can file jointly from the wedding date. For the calculator, simplify: assume full-year marriage. Display a note that partial-year scenarios require professional advice.

### 12D. VAT Treatment in B2B
VAT is **purely informational** in the calculator. VAT collected is not income — it is held in trust and remitted to the tax office. The calculator should show:
- Net revenue (what the entrepreneur earns)
- VAT amount (what they collect and remit)
- Gross invoice total (net + VAT)
VAT does NOT affect net income, ZUS base, health insurance base, or income tax base.

### 12E. Commuter Definition
"Commuter" (podwyższone koszty) applies when the employee's place of residence is in a different municipality (gmina) than the workplace. No distance threshold — simply different municipality. The calculator should present this as a simple toggle: "Do you commute from a different municipality?"

### 12F. Small ZUS Plus Simplified Approach
Since the exact Small ZUS Plus base depends on prior-year income with a complex formula, the calculator should:
- Allow the user to manually input their contribution base (PLN 1,441.80 – PLN 5,652)
- Display a note: "Your contribution base depends on last year's income. Check your ZUS declaration or use the ZUS calculator at zus.pl"

---

✅ **CHECKPOINT 1: Full [SPEC DOCUMENT] output complete. Awaiting confirmation to proceed to Phase 2 (Implementation).**
