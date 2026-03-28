# Questions for Sarah — Ireland 2026 Calculator

**Date:** 2026-03-28
**From:** David (developer)

Sarah, I was asked to implement the Ireland 2026 calculator. Your documentation file at
`Ireland/ireland_tax_documentation.md` does not exist yet, so I implemented based on the
requirements provided in the task description and my knowledge of Irish tax rules for 2026.

Please review the following assumptions and open questions:

---

## 1. Income Tax — Standard Rate Cut-Off Points (SRCOP)

I used the following 2026 SRCOP values (per Budget 2026 announcements):

| Marital Status | Standard Rate Band (20%) |
|---|---|
| Single / Widowed (no dep. children) | EUR 44,000 |
| Married couple (one income) | EUR 53,000 |
| Married couple (two incomes) | EUR 53,000 total, max EUR 44,000 transferable per spouse |
| One-parent family | EUR 48,000 |

**Q1a:** Are these the correct 2026 SRCOP values? Budget 2026 increased the single band from EUR 42,000 to EUR 44,000. Please confirm.

**Q1b:** For married couples with two incomes, is the maximum transferable band still EUR 31,000 (i.e., EUR 53,000 - EUR 22,000 minimum for lower earner) or did this change?

**Q1c:** I have implemented a simplified two-income married model where the user enters their own salary and we assume the standard rate band is capped at EUR 44,000 for their portion. Is this acceptable, or should we model the spouse's income?

---

## 2. Tax Credits

I used the following 2026 tax credit values:

| Credit | Annual Amount |
|---|---|
| Personal Tax Credit (Single) | EUR 1,875 |
| Personal Tax Credit (Married) | EUR 3,750 |
| PAYE Tax Credit | EUR 1,875 |
| Single Person Child Carer Credit (SPCCC) | EUR 1,750 |
| Home Carer Tax Credit | EUR 1,800 |
| Rent Tax Credit | EUR 1,000 (single) / EUR 2,000 (married) |

**Q2a:** Please confirm these 2026 values. Budget 2026 increased the personal and PAYE credits from EUR 1,875 (2025 value). If 2026 is the same as 2025 for these, please confirm.

**Q2b:** The Home Carer Credit — is the 2026 value EUR 1,800 or has it changed? And the income limit for the home carer (EUR 7,200 threshold with taper)?

**Q2c:** The Rent Tax Credit — is it EUR 1,000/EUR 2,000 for 2026? Are there age conditions (under 55/over 55)?

---

## 3. USC (Universal Social Charge)

I used the following 2026 USC bands:

| Band | Rate |
|---|---|
| First EUR 12,012 | 0.5% |
| EUR 12,012.01 – EUR 25,760 | 2% |
| EUR 25,760.01 – EUR 70,044 | 4% |
| Above EUR 70,044 | 8% |

**Q3a:** Are these the correct 2026 USC bands? Budget 2026 may have widened the 2% band.

**Q3b:** USC exemption threshold: I used EUR 13,000 (total income). Is this still the correct threshold for 2026?

**Q3c:** Reduced USC rates for medical card holders / over 70s with income under EUR 60,000:
- 0.5% on first EUR 12,012
- 2% on the remainder
Is this correct for 2026?

**Q3d:** Does the 11% surcharge on self-employment income above EUR 100,000 apply? I have NOT implemented this as it seems out of scope for an employment salary calculator.

---

## 4. PRSI (Pay-Related Social Insurance)

**Q4a:** Class A employee PRSI rate — I understand there is a mid-year rate change in 2026:
- 4.2% from 1 January to 30 September 2026
- 4.35% from 1 October 2026 onwards

Is this correct? I've implemented a blended annual rate: (4.2% x 39/52) + (4.35% x 13/52) = approx 4.2375%.

**Q4b:** The PRSI tapered credit: for weekly income between EUR 352.01 and EUR 424, the credit is EUR 12 reduced by 1/6 of income above EUR 352.01. Please confirm the 2026 values.

**Q4c:** The EUR 352/week exemption cliff — below EUR 352/week (EUR 18,304/year), no employee PRSI is due at all. Above EUR 352/week, PRSI applies to ALL earnings from EUR 0 (not just the excess). Is this still the case for 2026?

**Q4d:** Employer PRSI: I used 11.05% (Class A1, most employees earning above EUR 441/week). For employees earning EUR 441/week or below, the rate is 8.8%. Please confirm 2026 rates and thresholds.

---

## 5. Pension Relief

**Q5a:** Age-related percentage limits for tax relief on pension contributions:
- Under 30: 15%
- 30-39: 20%
- 40-49: 25%
- 50-54: 30%
- 55-59: 35%
- 60 and over: 40%

Are these still correct for 2026?

**Q5b:** The earnings cap for pension relief: I used EUR 115,000. Is this correct for 2026?

**Q5c:** Pension contributions reduce the income tax base but NOT the USC or PRSI base. Correct?

---

## 6. Missing Documentation

The file `Ireland/ireland_tax_documentation.md` was referenced but does not exist. Could you please create your full documentation for Ireland 2026 tax rules so I can verify my implementation against it?

---

## Summary of Implementation

Based on the requirements provided, I have implemented:
- Income tax at 20%/40% for all marital statuses
- Full tax credits (Personal, PAYE, SPCCC, Home Carer, Rent)
- USC with 4 bands, EUR 13,000 exemption, and reduced rates option
- PRSI Class A with tapered credit, EUR 352/week cliff, blended 2026 rate
- Employer PRSI (11.05% / 8.8% split)
- Pension relief with age-related limits and EUR 115,000 cap
- Net pay calculation with monthly/annual views
