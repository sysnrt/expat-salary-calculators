# [SPEC DOCUMENT — BELGIUM NET SALARY 2026]

**Compiled:** 2026-03-20
**Tax Year:** Income Year 2026 (Assessment Year 2027)
**Purpose:** Single source of truth for implementing belgium.html net salary calculator

---

## 1. RSZ/ONSS Social Security Contributions

### Formula
- **Employee contribution rate:** 13.07% of gross salary
- Applied to the full gross remuneration (no cap on employee contributions)
- Formula: `RSZ_employee = gross_monthly × 0.1307`

### Employer Contribution (informational)
- White-collar employees: ~27% of gross salary
- As of 1 July 2025: employer contributions capped at €85,000 gross per employee per quarter (employee contributions NOT affected by this cap)

### Special RSZ Reduction (Werkbonus / Bonus à l'emploi)
- Low-wage workers receive a reduction on the 13.07% employee contribution
- The work bonus appears as a reduction on the employee's payslip (e.g., ~€115.17/month for qualifying low incomes — Securex 2026 example)
- [UNVERIFIED — exact 2026 thresholds and phase-out amounts for the werkbonus need manual check against Annex III]

### RSZ-Exempt Income Components
- Meal vouchers (employer contribution up to €8.91): exempt from RSZ
- Eco vouchers (up to €250/year): exempt from RSZ
- Public transport commuting reimbursement: exempt from RSZ
- Company car: not subject to RSZ (only the solidarity contribution applies)

### Sources
- [PwC Tax Summaries — Belgium Individual Other Taxes](https://taxsummaries.pwc.com/belgium/individual/other-taxes)
- [KPMG — Belgium New Cap on Social Security Contributions](https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-184.html)
- [Liedekerke — Remuneration in Belgium 2025-2026](https://liedekerke.com/en/insights/remuneration-in-belgium-what-has-changed-and-what-to-expect)
- [Securex — Bedrijfsvoorheffing 2026](https://www.securex.be/nl/lex4you/werkgever/nieuws/nieuwe-regels-bedrijfsvoorheffing-voor-2026-40ec0964b78d053e5fc7e243df8d4f0a)

---

## 2. Professional Withholding Tax (Bedrijfsvoorheffing / Précompte professionnel)

### Calculation Method
Since 2023, Belgium uses a **"sleutelformule" (key formula)** rather than fixed scale tables. The withholding tax rises proportionally using a sliding scale. The formula is defined in **Annex III** of the Royal Decree (KB/WIB92), published 29 December 2025 for income from 1 January 2026.

### Simplified Monthly Calculation Steps
1. **Gross monthly salary** (bruto maandloon)
2. **Deduct RSZ:** gross × 13.07% = RSZ contribution
3. **Taxable base:** gross − RSZ
4. **Deduct flat-rate professional expenses:** 30% of taxable base, capped at €5,930/year (≈ €494.17/month)
5. **Apply annual tax brackets** (prorated monthly):

| Bracket | Annual Income (€) | Monthly Equivalent (€) | Rate |
|---------|-------------------|----------------------|------|
| 1 | 0 – 16,720 | 0 – 1,393.33 | 25% |
| 2 | 16,720 – 29,510 | 1,393.33 – 2,459.17 | 40% |
| 3 | 29,510 – 51,070 | 2,459.17 – 4,255.83 | 45% |
| 4 | > 51,070 | > 4,255.83 | 50% |

6. **Subtract tax-free allowance benefit:** €11,180 × 25% ÷ 12 = €232.92/month
7. **Subtract reductions for dependents** (see table below)
8. **Add municipal surcharge** (aanvullende gemeentebelasting): default 7% of the withholding tax

### Taxpayer Categories
- **Category 1 (Alleenstaande / Isolé):** Single person, or married/cohabiting with both partners earning normal income
- **Category 2 (Gehuwd / Marié):** Married or legal cohabitant where spouse has no or low income (below €4,100 net/year threshold for marital quotient)
- **Category 3:** Not directly used in withholding; applies to cross-border workers (rarely used)

### Marital Quotient (Huwelijksquotiënt)
- When one spouse has no or very low income, up to 30% of the higher earner's income is attributed to the lower-earning spouse (max €13,460)
- This effectively lowers the withholding tax for the earning spouse
- Threshold: spouse net income must be below €4,100/year (AJ 2026)

### Reductions for Dependent Children (Annual Amounts — Withholding Tax)

| Dependent Children | Annual Reduction (€) | Monthly Reduction (€) |
|-------------------|---------------------|----------------------|
| 1 | 540 | 45.00 |
| 2 | 1,476 | 123.00 |
| 3 | 3,912 | 326.00 |
| 4 | 6,804 | 567.00 |
| 5 | 9,972 | 831.00 |
| 6 | 13,140 | 1,095.00 |
| 7 | 16,524 | 1,377.00 |
| 8 | 19,908 | 1,659.00 |
| > 8 | +3,216/child | +268.00/child |

**Note:** These are the withholding tax reductions applied on the payslip. They may differ slightly from the final annual PIT child allowances.
[UNVERIFIED — These amounts appear to be from 2025 ACLVB data. The 2026 indexed amounts may be slightly higher. The 2026 Annex III was not directly accessible for exact verification.]

### Other Withholding Reductions (Annual)
- Single person: €144/year (€12/month)
- Single parent with dependent children: €540/year (€45/month)
- Elderly/disabled dependent parent (65+): €1,728/year (€144/month)

### Sources
- [FOD Financiën — Bedrijfsvoorheffing Berekening](https://financien.belgium.be/nl/ondernemingen/personeel_en_loon/bedrijfsvoorheffing/berekening)
- [ACLVB — Bedrijfsvoorheffing](https://www.aclvb.be/nl/bedrijfsvoorheffing)
- [Securex — Bedrijfsvoorheffing 2026](https://www.securex.be/nl/lex4you/werkgever/nieuws/nieuwe-regels-bedrijfsvoorheffing-voor-2026-40ec0964b78d053e5fc7e243df8d4f0a)
- [FPS Finance — Tax Rates](https://fin.belgium.be/en/private-individuals/tax-return/income/tax-rates)

---

## 3. Personal Income Tax (PB/IPP) — Annual Estimate

### Tax Brackets — Income Year 2026 (Assessment Year 2027)

| Taxable Income (€) | Rate |
|---------------------|------|
| 0 – 16,720 | 25% |
| 16,720 – 29,510 | 40% |
| 29,510 – 51,070 | 45% |
| > 51,070 | 50% |

### Personal Tax-Free Allowance (Belastingvrije som / Quotité exemptée)
- **Basic amount:** €11,180 (IY 2026 / AJ 2027)
- Tax benefit: €11,180 × 25% = **€2,795 annual tax reduction**

### Increases to Tax-Free Allowance for Dependent Children (IY 2026 / AJ 2027)

| Children | Increase (€) | Cumulative Total (€) |
|----------|-------------|---------------------|
| 1st child | ~2,030 | ~2,030 |
| 2nd child | ~3,200 | ~5,230 |
| 3rd child | ~6,490 | ~11,720 |
| 4th child | ~7,200 | ~18,920 |
| Each additional | ~7,200 | +7,200 |

**Note on 2026 Reform:** The tax reform law (voted December 2025) gradually increases the child allowance from €1,980 to €2,650 for the first child by 2029. For AJ 2027, the first child supplement rises to approximately €2,030–€2,130.
[UNVERIFIED — The exact AJ 2027 indexed amounts for children are not yet officially published in a consolidated table. Values above are interpolated from the reform trajectory and 2026 Annex III references.]

### Additional Allowances
- **Child under 3 years** (no childcare expenses claimed): +€740
- **Disabled child:** counts as 2 children in the scale
- **Disabled dependent (other):** +€1,980
- **Single parent supplement:** +€1,980 (max income €24,390; phase-out from €19,250)

### Professional Expenses Deduction
- **Flat-rate:** 30% of gross professional income after RSZ, capped at €5,930/year
- Or actual documented expenses (whichever is higher)

### Municipal Surcharge (Aanvullende gemeentebelasting)
- Range: 0% to 9% of federal PIT
- Average: ~7%
- Non-residents: flat 7%

### Sources
- [FPS Finance — Tax Rates (official)](https://fin.belgium.be/en/private-individuals/tax-return/income/tax-rates)
- [Accountable — Tax Brackets Belgium 2026](https://www.accountable.eu/en-be/blog/progressive-tax-brackets/)
- [PwC Tax Summaries — Belgium Individual Deductions](https://taxsummaries.pwc.com/belgium/individual/deductions)
- [Practicali — Geïndexeerde bedragen AJ 2026](https://www.practicali.be/blog/geindexeerde-bedragen-aj-2026)
- [Dexxter — Tax Benefit of Dependent Children](https://dexxter.be/en/tax-benefit-of-dependent-children-for-self-employed-parents/)

---

## 4. Special Tax Regimes

### 4A. Expat Tax Regime (BBSI — Bijzonder Belastingstelsel voor Inkomende / Régime spécial d'imposition)

**Post-2022 new regime, updated by Law of 18 December 2025 (Easter Agreement):**

#### Conditions
- Recruited directly from abroad or assigned to a Belgian entity
- Minimum gross annual salary: **€70,000** (reduced from €75,000, retroactive to 1 Jan 2025)
- Must not have been a Belgian tax resident or have lived within 150 km of the Belgian border in the 5 years preceding assignment
- Application within 3 months of starting Belgian activity

#### Cost-of-Living Allowance
- **Tax-exempt allowance:** up to **35% of gross remuneration** (increased from 30%)
- **Cap:** the €90,000 annual cap has been **abolished**
- Covers recurring expatriation costs: housing differential, cost of living, etc.

#### Social Security Treatment (CRITICAL DIFFERENCE)
- First **30%** of allowance: exempt from BOTH tax AND social security
- The additional **5%** (30% → 35%): exempt from tax but **SUBJECT to social security contributions**
- This is because the social security Royal Decree still references the 2022 tax legislation (30% cap + €90,000 ceiling)

#### Duration
- Maximum **5 years** (with possible extension to 8 years for certain profiles)
- [UNVERIFIED — some sources mention 5 years, others 7 or 8. The post-reform duration should be verified against the December 2025 law text.]

#### Calculation for Calculator
```
expat_taxable = gross_salary × (1 - 0.35)
RSZ_base = gross_salary - (gross_salary × 0.30)  // only first 30% is RSZ-exempt
RSZ_employee = RSZ_base × 0.1307
```

### 4B. Researcher/Academic Regime
- Partial exemption from withholding tax for employers of qualifying researchers
- This is an **employer-side** benefit (exemption from forwarding part of withholding tax)
- Does NOT directly change the employee's net salary calculation
- Qualifying: researchers with a PhD or MSc in specific STEM fields
- Employer keeps up to 80% of withholding tax for qualifying researchers
- **For the calculator:** This regime primarily affects employer cost, not employee net pay. Implementation should note this distinction.
- [UNVERIFIED — The 80% rate and qualifying conditions for 2026 need verification against the latest legislation.]

### 4C. Cross-Border Workers
- Not a separate regime for the calculator
- Relevant only for workers living in France, Netherlands, Luxembourg, or Germany
- Subject to bilateral tax treaties
- **For the calculator:** Display a note that cross-border situations require individual analysis; not calculated.

### Sources
- [EY — No Changes for Social Security to Belgian Expatriate Tax Regime](https://www.ey.com/en_be/technical/tax/tax-alerts/2026/no-changes-for-social-security-to-belgian-expatriate-tax-regime)
- [VisaHQ — Belgium Boosts Expat Tax Regime](https://www.visahq.com/news/2025-12-24/be/belgium-boosts-expat-tax-regime-higher-allowance-and-lower-salary-threshold-take-retroactive-effect/)
- [Andersen — Important Changes to the Belgian Expatriate Tax Regime](https://be.andersen.com/en/news/important-changes-to-the-belgian-expatriate-tax-regime)
- [KPMG — Flash Alert 2026-031](https://kpmg.com/xx/en/our-insights/gms-flash-alert/2026/flash-alert-2026-031.html)

---

## 5. Benefits & Deductions Table

### 5A. Meal Vouchers (Maaltijdcheques / Chèques-repas)

| Property | Value |
|----------|-------|
| Maximum total value per voucher | **€10.00** (from 1 Jan 2026) |
| Maximum employer contribution | **€8.91** |
| Minimum employee contribution | **€1.09** |
| RSZ treatment | Exempt (if conditions met) |
| Tax treatment | Exempt for employee; employer deduction €4.00/voucher (if max €8.91 contribution) |
| Typical vouchers per month | 20 (one per effective working day) |
| Net salary impact | Employee contribution deducted from net pay |

**Sources:** [Partena Professional](https://www.partena-professional.be/en/our-insights/infoflashes/final-go-ahead-meal-vouchers-worth-10-eur-2026), [Vandelanotte](https://www.vandelanotte.be/en/news/increase-in-maximum-value-of-meal-vouchers-from-2026)

### 5B. Eco Vouchers (Ecocheques / Éco-chèques)

| Property | Value |
|----------|-------|
| Maximum annual amount | **€250** |
| RSZ treatment | Exempt |
| Tax treatment | Exempt for employee |
| Status | Still valid for 2026; planned gradual abolition at unspecified future date |

**Sources:** [ProPay](https://www.propay.be/eco-vouchers/?lan=en), [Vandelanotte](https://www.vandelanotte.be/en/news/increase-in-maximum-value-of-meal-vouchers-from-2026)

### 5C. Company Car — Benefit in Kind (VAA / ATN)

**BIK Formula:**
```
BIK_annual = catalogue_value × age_coefficient × (6/7) × CO2_percentage
```

**CO2 Percentage:**
```
Diesel:        5.5% + (actual_CO2 - 58) × 0.1%
Petrol/LPG:    5.5% + (actual_CO2 - 70) × 0.1%
Electric:      4% (flat minimum)
```

**CO2 percentage bounds:** minimum 4%, maximum 18%

**Age Coefficient (Depreciation):**

| Vehicle Age | Coefficient |
|------------|------------|
| 0–12 months | 100% |
| 13–24 months | 94% |
| 25–36 months | 88% |
| 37–48 months | 82% |
| 49–60 months | 76% |
| 61+ months | 70% |

**Minimum annual BIK:** €1,690 (2026)

**CO2 Solidarity Contribution (employer cost):**
- For cars ordered from 1 July 2023: multiplied by **4** in 2026
- Indexation coefficient 2026: **1.6291**

**Tax treatment of BIK:**
- Added to taxable income for withholding tax calculation
- Employee pays tax on the BIK amount but does NOT pay RSZ on it
- The own contribution (eigen bijdrage) paid by the employee reduces the BIK

**Sources:** [Securex](https://www.securex.be/en/lex4you/self-employed/news/company-cars-and-the-reference-co2-emission-rate-for-2026), [Mbrella](https://www.mbrella.eu/company-car-fiscality), [Grant Thornton](https://www.grantthornton.be/en/the-field/articles-and-publications/Direct-tax/calculate-your-benefit-in-kind-for-income-year-20252/)

### 5D. Group Insurance (Groepsverzekering / Assurance groupe)

| Property | Value |
|----------|-------|
| Employee contribution | Tax reduction of 30% on contributions |
| Employer premium | Subject to 8.86% special social security contribution |
| RSZ on employee contribution | Exempt |
| Payslip impact | Employee contribution deducted from net pay |

### 5E. Hospitalization Insurance (Hospitalisatieverzekering)

| Property | Value |
|----------|-------|
| Employee contribution | Usually small (varies by employer) |
| RSZ treatment | Exempt (employer-funded portion is benefit in kind but exempt under certain conditions) |
| Tax treatment | Not taxable as BIK if collective plan for all employees |

### 5F. Commuting Reimbursement (Woon-werkverkeer)

**Public Transport:**
- Employer must reimburse at least **70.48%** of train subscription cost (as of Feb 2026)
- Other public transport (bus/tram/metro): 71.8% of price or equivalent train rate
- **100% tax-exempt** for the employee (all public transport reimbursements)

**Own Car:**
- No legal obligation to reimburse (sector CBA may apply)
- Tax-free mileage allowance: **€0.4326/km** (Q1 2026)
- Annual indexed rate: **€0.4449/km** (1 July 2025 – 30 June 2026)
- Alternative: flat annual exemption of **€500** (2026)

**Bicycle:**
- Tax-free allowance: **€0.35/km** (max 40 km round trip)
- [UNVERIFIED — the 2026 bicycle allowance rate should be verified; it may have been indexed.]

**Sources:** [Securex](https://www.securex.be/en/lex4you/employer/news/new-mileage-allowance-with-quarterly-indexing-starting-from-1-january-2026), [Mbrella](https://www.mbrella.eu/blog/mileage-allowance), [Rydoo](https://www.rydoo.com/compliance/belgium/belgian-mileage/)

### 5G. Holiday Pay (Vakantiegeld / Pécule de vacances)

**White-collar employees (bedienden/employés):**
- **Single holiday pay (enkel vakantiegeld):** Normal salary during vacation days
- **Double holiday pay (dubbel vakantiegeld):** **92%** of gross monthly salary, paid in May/June
- Accrued based on previous calendar year's work
- Full year = 20 legal vacation days + double holiday pay

**Tax treatment of double holiday pay:**
- Subject to 13.07% RSZ on a special base
- Special withholding tax rate applies (higher than normal monthly rate)

**Blue-collar workers (arbeiders/ouvriers):**
- Paid by holiday fund (RJV/ONVA), not directly by employer
- Employer contributes 15.84% to the fund

**For the calculator:** Include double holiday pay as an annual bonus = gross_monthly × 0.92

**Sources:** [Vandelanotte](https://www.vandelanotte.be/en/news/annual-holiday-pay-in-belgium-what-for-whom-and-how-much), [PwC Legal](https://www.pwclegal.be/en/news/double-holiday-pay-for-white-collar-workers---a-recap---news---p.html)

---

## 6. Child Benefit by Region (Kinderbijslag / Allocations familiales)

**IMPORTANT:** Child benefit is **NOT** part of the salary. It is a separate government payment. Display in a clearly separated section.

### 6A. Flanders — Groeipakket (Valid from September 2025, indexed)

**Basic Monthly Amount:**
- **€184.62** per child (flat rate, regardless of birth order)

**Starting Amount (one-time birth/adoption grant):**
- **€1,269.25**

**School Bonus (Annual, paid in August):**

| Age | Amount (€) |
|-----|-----------|
| 0–4 | 23.07 |
| 5–11 | 40.38 |
| 12–17 | 57.68 |
| 18–25 | 69.22 |

**Social Supplement (Monthly, income-dependent):**

| Family Size | Income < €40,701.59 | Income €40,701.59 – €47,485.19 |
|------------|---------------------|-------------------------------|
| 1–2 children | €73.68/child | €37.31/child |
| 3+ children | €108.29/child | €85.22/child |

(For 3+ children, the higher income threshold extends to €76,560.64)

**Orphan Allowance:** Semi-orphan: €147.71/month; Full orphan: €184.61/month

**Care Allowance (disability):** €93.18 – €621.18+/month depending on assessment

**Sources:** [Groeipakket.be — Amounts](https://www.groeipakket.be/en/amounts), [Groeipakket.be — Basic Amount](https://www.groeipakket.be/en/benefits-Groeipakket/basic-amount), [KidsLife](https://www.kidslife.be/en/groeipakket)

### 6B. Wallonia — FAMIWAL / AVIQ

**Basic Monthly Amounts:**

*Children born from 2020 onwards:*
- Under 18: **€196.57**/child
- From 18: **€209.25**/child

*Children born before 2020:*
- 1st child: €121.50
- 2nd child: €224.82
- 3rd+ children: €335.66

**Age Supplements (Monthly — children born before 2020):**

| Age | 1st Child (€) | Subsequent (€) |
|-----|---------------|----------------|
| 6–11 | 21.17 | 42.21 |
| 12–17 | 32.23 | 64.50 |
| 18–24 | 37.15 | 82.01 |

**School Bonus (Annual, July):**
- Range: €25.36 – €101.46 depending on age (children born 2020+)
- Range: €26.92 – €148.60 depending on age (children born before 2020)

**Social Supplement Income Thresholds:**
- Threshold 1: €34,000.47
- Threshold 2: €54,867.79
- Amounts: €6.73 – €69.75/child/month depending on income and family size

**Birth Allowance:** €1,367.72 (2026, indexed +2%)

**Sources:** [KidsLife — Barème Wallonie](https://www.kidslife.be/en/allocations-familiales/bareme-wallonie), [Wallonie.be](https://www.wallonie.be/en/demarches/benefit-family-allowances-wallonia)

### 6C. Brussels — Famiris / Iriscare

**Basic Monthly Amounts (from 1 March 2026, +2% indexation):**

*Children born after 1/12/2019:*

| Age | Amount (€/month) |
|-----|-----------------|
| 0–11 | 190.23 |
| 12–17 | 202.91 |
| 18–24 (no higher ed) | 202.91 |
| 18–24 (higher ed) | 215.59 |

*Children born before 1/12/2019:*

| Age | Amount (€/month) |
|-----|-----------------|
| 0–11 | 177.55 |
| 12–17 | 190.23 |
| 18–24 | 190.23–202.91 |

**Annual Age-Related Supplement (August):**

| Age | Amount (€) |
|-----|-----------|
| 0–5 | 25.36 |
| 6–11 | 38.05 |
| 12–17 | 63.41 |
| 18–24 (higher ed) | 101.46 |

**Social Supplement (Monthly):**

| Household Income | 1 Child | 2 Children | 3+ Children |
|-----------------|---------|-----------|-------------|
| < €40,586.52 (single parent, 0-11) | 50.73 | 101.46 | 164.87 |
| < €40,586.52 (cohabit, 0-11) | 50.73 | 88.77 | 139.50 |
| €40,586.52 – €58,915.92 | 0.00 | 31.71 | 91.31 |
| > €58,915.92 | 0.00 | 0.00 | 0.00 |

**Birth/Adoption Grant:**
- 1st child: €1,395.02
- Subsequent children: €634.10

**Orphan Supplement:** +50% (one parent) or +100% (both parents) of base rate

**Sources:** [Famiris — Child Benefit Rates](https://famiris.brussels/en/faq/payments-amounts-of-child-benefits/child-benefit-rates/), [Parentia — Brussels](https://www.parentia.be/en/brussels/child-benefit)

---

## 7. Uncertainties & Flagged Items

| # | Item | Status | Impact |
|---|------|--------|--------|
| 1 | **Werkbonus exact 2026 thresholds** — The low-wage RSZ reduction thresholds and phase-out amounts for 2026 were not found in an official published table | [UNVERIFIED — manual check required] | Medium — affects low-income employees |
| 2 | **Bedrijfsvoorheffing dependent child reductions** — The monthly reduction amounts (€45, €123, €326, etc.) are from the ACLVB 2025 table. The 2026 indexed amounts from Annex III could not be directly accessed | [UNVERIFIED — manual check required] | Medium — amounts likely indexed slightly upward for 2026 |
| 3 | **PIT child allowance AJ 2027 exact amounts** — The 2026 tax reform gradually increases child allowances. The exact indexed amounts for AJ 2027 (IY 2026) are interpolated, not confirmed from an official consolidated table | [UNVERIFIED — manual check required] | Medium — first child supplement could be €1,980 (pre-reform) or €2,030–€2,130 (post-reform) |
| 4 | **Expat regime duration** — Sources vary between 5 years and 8 years maximum | [UNVERIFIED — manual check required] | Low — informational only |
| 5 | **Researcher regime 80% rate** — The withholding tax exemption percentage for qualifying researchers needs confirmation for 2026 | [UNVERIFIED — manual check required] | Low — this is an employer-side benefit |
| 6 | **Bicycle commuting allowance 2026 rate** — €0.35/km is the commonly cited rate but may have been indexed | [UNVERIFIED — manual check required] | Low — optional benefit |
| 7 | **Wallonia social supplement exact amounts per child** — Only ranges were found (€6.73–€69.75); a full breakdown per child rank and income tier was not available | [UNVERIFIED — manual check required] | Medium — affects Wallonia child benefit display |
| 8 | **Group insurance / hospitalization employee contribution** — These are employer-specific amounts; no standard national amount exists | N/A — varies by employer | Low — user inputs their own contribution |
| 9 | **CO2 percentage floor (4%) and ceiling (18%)** for company car BIK — The minimum 4% is confirmed (electric vehicles); the 18% max is commonly cited but not found in an official 2026 source | [UNVERIFIED — manual check required] | Low — only affects extreme CO2 values |
| 10 | **Holiday pay special withholding rate** — The exact withholding rate on double holiday pay for 2026 was not found | [UNVERIFIED — manual check required] | Medium — affects annual estimate |

---

## Summary Statistics
- **Tax rules documented:** 15+ (RSZ, BV brackets, PIT brackets, municipal tax, marital quotient, single parent, expat regime, researcher regime, work bonus, holiday pay withholding, BIK formula, CO2 reference rates, age depreciation, solidarity contribution, flat-rate expenses)
- **Benefit types documented:** 7 (meal vouchers, eco vouchers, company car BIK, group insurance, hospitalization insurance, commuting reimbursement, holiday pay)
- **Child benefit systems documented:** 3 (Flanders Groeipakket, Wallonia FAMIWAL, Brussels Famiris/Iriscare)
- **Unverified items:** 10 (listed above with impact assessment)

---

✅ **CHECKPOINT 1: Full [SPEC DOCUMENT] output complete. Awaiting confirmation to proceed to Phase 2.**
