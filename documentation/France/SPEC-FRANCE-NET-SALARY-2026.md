# [SPEC DOCUMENT -- FRANCE NET SALARY 2026]

**Compiled:** 2026-03-28
**Tax Year:** Revenus 2025 / Imposition 2026
**Applicable from:** 1 January 2026
**Purpose:** Single source of truth for implementing france.html net salary calculator

---

## Table of Contents

1. [Key Reference Values](#1-key-reference-values)
2. [Social Security Contributions (Cotisations Sociales Salariales)](#2-social-security-contributions-cotisations-sociales-salariales)
3. [Net Salary Calculation Flow](#3-net-salary-calculation-flow)
4. [Income Tax -- Bareme Progressif](#4-income-tax--bareme-progressif)
5. [Family Quotient (Quotient Familial)](#5-family-quotient-quotient-familial)
6. [Plafonnement du Quotient Familial](#6-plafonnement-du-quotient-familial)
7. [10% Standard Deduction (Deduction Forfaitaire)](#7-10-standard-deduction-deduction-forfaitaire)
8. [Decote Mechanism](#8-decote-mechanism)
9. [Withholding Tax -- Prelevement a la Source (PAS)](#9-withholding-tax--prelevement-a-la-source-pas)
10. [Special Considerations](#10-special-considerations)
11. [Worked Examples](#11-worked-examples)
12. [Developer Implementation Notes](#12-developer-implementation-notes)
13. [Regulatory Sources](#13-regulatory-sources)

---

## 1. Key Reference Values

| Parameter | 2026 Value | Notes |
|-----------|-----------|-------|
| **PASS (Plafond Annuel Securite Sociale)** | 48,060 EUR/year | Arrete du 22 dec 2025 |
| **PMSS (Plafond Mensuel)** | 4,005 EUR/month | = PASS / 12 |
| **PJSS (Plafond Journalier)** | 220 EUR/day | |
| **4x PASS (CSG abatement ceiling)** | 192,240 EUR/year | 16,020 EUR/month |
| **8x PMSS (AGIRC-ARRCO T2 ceiling)** | 32,040 EUR/month | 384,480 EUR/year |
| **SMIC brut horaire** | 12.02 EUR | +1.18% from 2025 |
| **SMIC brut mensuel (35h)** | 1,823.03 EUR | |
| **SMIC net mensuel** | ~1,443.11 EUR | Approx., varies by situation |
| **Inflation indexation (bareme IR)** | +0.9% | Loi de finances 2026 |
| **PASS revalorisation** | +2.0% | vs. 2025 (3,925 EUR/month) |

### Sources
- [Service-public.fr -- Plafond securite sociale 2026](https://www.service-public.gouv.fr/particuliers/actualites/A15386)
- [Legifrance -- Arrete du 22 decembre 2025](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451)
- [URSSAF -- Plafond annuel securite sociale](https://www.urssaf.fr/accueil/actualites/plafond-annuel-securite-sociale.html)
- [info.gouv.fr -- SMIC revalorise 2026](https://www.info.gouv.fr/actualite/le-smic-revalorise-au-1er-janvier-2026)

---

## 2. Social Security Contributions (Cotisations Sociales Salariales)

### 2.1 Overview

French employee social contributions are deducted from gross salary by the employer. They consist of:
- **URSSAF contributions** (health, pension, CSG/CRDS)
- **Unemployment insurance** (UNEDIC)
- **Supplementary pension** (AGIRC-ARRCO)

Total employee deductions typically represent **approximately 22-25%** of gross salary.

### 2.2 Complete Employee Contribution Table

#### URSSAF Contributions

| Contribution | Employee Rate | Base / Ceiling | Notes |
|---|---|---|---|
| **Assurance maladie (Health)** | 0% | Total gross | No employee contribution in metropolitan France |
| **Assurance maladie -- Alsace-Moselle** | 1.30% | Total gross | ONLY for departments 57, 67, 68 |
| **Assurance maladie -- Non-residents** | 5.50% | Total gross | ONLY for employees not tax-resident in France |
| **Assurance vieillesse plafonnee (Capped pension)** | 6.90% | Up to 1x PMSS (4,005 EUR/month) | Old-age basic pension |
| **Assurance vieillesse deplafonnee (Uncapped pension)** | 0.40% | Total gross (no ceiling) | Since 2026: employer rate is 2.11% |
| **CSG deductible** | 6.80% | 98.25% of gross (see 2.3) | Deductible from taxable income |
| **CSG non-deductible** | 2.40% | 98.25% of gross (see 2.3) | NOT deductible -- added to taxable income |
| **CRDS** | 0.50% | 98.25% of gross (see 2.3) | NOT deductible -- added to taxable income |

#### Unemployment Insurance

| Contribution | Employee Rate | Base / Ceiling | Notes |
|---|---|---|---|
| **Assurance chomage (Unemployment)** | 0% | Up to 4x PMSS (16,020 EUR/month) | Employee rate is 0% since Oct 2018; 4% is employer-only |
| **AGS (Garantie des salaires)** | 0% | Up to 4x PMSS (16,020 EUR/month) | 0.25% is employer-only |

**IMPORTANT:** Employees do NOT pay unemployment contributions in France. The 4% unemployment rate is entirely employer-paid. This is a common implementation error.

#### AGIRC-ARRCO Supplementary Pension

| Contribution | Employee Rate | Base / Ceiling | Notes |
|---|---|---|---|
| **Retraite complementaire -- Tranche 1** | 3.15% | Up to 1x PMSS (4,005 EUR/month) | Part of 7.87% total (40/60 split) |
| **Retraite complementaire -- Tranche 2** | 8.64% | From 1x to 8x PMSS (4,005 to 32,040 EUR/month) | Part of 21.59% total (40/60 split) |
| **CEG Tranche 1 (Contribution d'Equilibre General)** | 0.86% | Up to 1x PMSS (4,005 EUR/month) | Part of 2.15% total |
| **CEG Tranche 2** | 1.08% | From 1x to 8x PMSS (4,005 to 32,040 EUR/month) | Part of 2.70% total |
| **CET (Contribution d'Equilibre Technique)** | 0.14% | Total gross (T1 + T2) | Only if salary > 1x PMSS; part of 0.35% total |
| **APEC (cadres only)** | 0.024% | Up to 4x PMSS (16,020 EUR/month) | Only for management-level employees (cadres) |

### 2.3 CSG/CRDS Base Calculation (Assiette)

The CSG and CRDS are calculated on a special base:

```
IF gross_annual <= 4 x PASS (192,240 EUR):
    CSG_CRDS_base = gross_salary x 98.25%
ELSE:
    portion_under_4PASS = 4 x PASS
    portion_over_4PASS = gross_annual - 4 x PASS
    CSG_CRDS_base = (portion_under_4PASS x 98.25%) + (portion_over_4PASS x 100%)
```

**Monthly equivalent:** If monthly gross <= 16,020 EUR, the base is `gross x 0.9825`. Above that threshold, the excess is at 100%.

The 1.75% abatement represents a flat-rate deduction for professional expenses (frais professionnels) and applies only up to 4 annual ceilings.

### 2.4 Summary of Employee Rates (Standard Metropolitan Worker)

For a **standard non-cadre employee in metropolitan France** earning up to 1x PMSS (4,005 EUR/month):

| Contribution | Rate | Base |
|---|---|---|
| Vieillesse plafonnee | 6.90% | Gross (capped at PMSS) |
| Vieillesse deplafonnee | 0.40% | Total gross |
| CSG deductible | 6.80% | 98.25% of gross |
| CSG non-deductible | 2.40% | 98.25% of gross |
| CRDS | 0.50% | 98.25% of gross |
| AGIRC-ARRCO T1 | 3.15% | Gross (capped at PMSS) |
| CEG T1 | 0.86% | Gross (capped at PMSS) |
| **TOTAL (approx.)** | **~20.5-21%** | **of gross** |

For salaries exceeding 1x PMSS, additional T2 contributions apply on the portion above PMSS:

| Contribution | Rate | Base |
|---|---|---|
| AGIRC-ARRCO T2 | 8.64% | Gross from PMSS to 8x PMSS |
| CEG T2 | 1.08% | Gross from PMSS to 8x PMSS |
| CET (T1 + T2) | 0.14% | Total gross |

### 2.5 Employer Contributions (Informational -- Not Deducted from Employee)

| Contribution | Employer Rate | Base |
|---|---|---|
| Assurance maladie | 13.00% (or 7.00% reduced) | Total gross |
| Solidarite autonomie (CSA) | 0.30% | Total gross |
| Vieillesse plafonnee | 8.55% | Up to PMSS |
| Vieillesse deplafonnee | 2.11% | Total gross |
| Allocations familiales | 5.25% (or 3.45% reduced) | Total gross |
| Accident du travail | Variable by industry | Total gross |
| Assurance chomage | 4.00% | Up to 4x PMSS |
| AGS | 0.25% | Up to 4x PMSS |
| FNAL (< 50 employees) | 0.10% | Up to PMSS |
| FNAL (>= 50 employees) | 0.50% | Total gross |
| Dialogue social | 0.016% | Total gross |
| AGIRC-ARRCO T1 | 4.72% | Up to PMSS |
| AGIRC-ARRCO T2 | 12.95% | PMSS to 8x PMSS |
| CEG T1 | 1.29% | Up to PMSS |
| CEG T2 | 1.62% | PMSS to 8x PMSS |
| CET | 0.21% | Total (if salary > PMSS) |

### Sources
- [CLEISS -- Taux de cotisations securite sociale et chomage](https://www.cleiss.fr/docs/regimes/regime_france/an_a2.html)
- [URSSAF -- Taux de cotisations secteur prive](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html)
- [LégiSocial -- Cotisations AGIRC-ARRCO 2026](https://www.legisocial.fr/reperes-sociaux/cotisations-agirc-arrco-2026.html)
- [LégiSocial -- Taux cotisations sociales URSSAF 2026](https://www.legisocial.fr/reperes-sociaux/taux-cotisations-sociales-urssaf-2026.html)

---

## 3. Net Salary Calculation Flow

### 3.1 Step-by-Step Flow

```
STEP 1: GROSS ANNUAL SALARY (input)
         |
STEP 2: CALCULATE SOCIAL CONTRIBUTIONS
         |  -> URSSAF contributions (vieillesse, CSG/CRDS)
         |  -> AGIRC-ARRCO (T1, T2, CEG, CET)
         |
STEP 3: NET BEFORE TAX (Salaire net avant impot)
         = Gross - Total employee social contributions
         |
STEP 4: CALCULATE NET IMPOSABLE (Net taxable income)
         = Gross - Deductible contributions
         = Gross - (all social contributions EXCEPT non-deductible CSG + CRDS)
         OR equivalently:
         = Net before tax + Non-deductible CSG (2.40%) + CRDS (0.50%)
         |
STEP 5: WITHHOLDING TAX (Prelevement a la Source)
         = Net imposable x PAS rate (from neutral grid or personalised rate)
         |
STEP 6: NET AFTER TAX (Salaire net apres impot / Net a payer)
         = Net before tax - Withholding tax
```

### 3.2 Formulas

#### Monthly Social Contributions (salary <= PMSS)

```
// CSG/CRDS base
csg_crds_base = gross_monthly * 0.9825  // if gross <= 16,020 EUR

// URSSAF employee contributions
vieillesse_plafonnee = MIN(gross_monthly, PMSS) * 0.069
vieillesse_deplafonnee = gross_monthly * 0.004
csg_deductible = csg_crds_base * 0.068
csg_non_deductible = csg_crds_base * 0.024
crds = csg_crds_base * 0.005

// AGIRC-ARRCO (Tranche 1 only, since salary <= PMSS)
agirc_arrco_t1 = MIN(gross_monthly, PMSS) * 0.0315
ceg_t1 = MIN(gross_monthly, PMSS) * 0.0086
// CET does NOT apply if salary <= PMSS

total_employee_contributions = vieillesse_plafonnee + vieillesse_deplafonnee
    + csg_deductible + csg_non_deductible + crds
    + agirc_arrco_t1 + ceg_t1
```

#### Monthly Social Contributions (salary > PMSS)

```
// Additional Tranche 2 contributions on portion above PMSS
t2_base = MIN(gross_monthly, 8 * PMSS) - PMSS
         = MIN(gross_monthly, 32040) - 4005

agirc_arrco_t2 = t2_base * 0.0864
ceg_t2 = t2_base * 0.0108
cet = gross_monthly * 0.0014   // applies to ENTIRE salary when > PMSS

// CET applies on T1+T2 combined once salary exceeds PMSS
// Some interpretations apply CET only to the T1+T2 base (up to 8x PMSS)
// For simplicity: cet = MIN(gross_monthly, 8 * PMSS) * 0.0014

total_employee_contributions = [all T1 contributions above]
    + agirc_arrco_t2 + ceg_t2 + cet
```

#### Net Before Tax

```
net_before_tax = gross_monthly - total_employee_contributions
```

#### Net Imposable (Net Taxable for Withholding)

```
// Deductible contributions = all employee contributions MINUS the non-deductible parts
deductible_contributions = total_employee_contributions
    - csg_non_deductible    // 2.40% of 98.25% gross is NOT deductible
    - crds                  // 0.50% of 98.25% gross is NOT deductible

net_imposable = gross_monthly - deductible_contributions

// Equivalently:
net_imposable = net_before_tax + csg_non_deductible + crds
```

#### Withholding Tax (PAS)

```
pas_amount = net_imposable * pas_rate
net_after_tax = net_before_tax - pas_amount
```

The `pas_rate` comes from either:
- The employee's **personalised rate** (taux personnalise) communicated by the tax authority to the employer via DSN
- OR the **neutral/default rate** (taux neutre) from the grid in Section 9

### Sources
- [Service-public.fr -- CSG et CRDS sur les revenus d'activite](https://www.service-public.gouv.fr/particuliers/vosdroits/F2971)
- [fiche-paie.fr -- Prelevement a la source 2026](https://fiche-paie.fr/blog/prelevement-source-2026)

---

## 4. Income Tax -- Bareme Progressif

### 4.1 Tax Brackets for 2026 (Revenus 2025)

The bareme is revalued by **+0.9%** per the Loi de finances 2026 (promulgated 19 February 2026).

| Bracket | Taxable Income per Part (EUR) | Marginal Rate |
|---------|-------------------------------|---------------|
| 1 | 0 -- 11,600 | 0% |
| 2 | 11,601 -- 29,579 | 11% |
| 3 | 29,580 -- 84,577 | 30% |
| 4 | 84,578 -- 181,917 | 41% |
| 5 | Above 181,917 | 45% |

### 4.2 Quick-Calculation Formula (per part)

For a given quotient familial Q = Revenu net imposable / Nombre de parts:

```
IF Q <= 11,600:
    tax_per_part = 0

ELSE IF Q <= 29,579:
    tax_per_part = Q * 0.11 - 1,276.00

ELSE IF Q <= 84,577:
    tax_per_part = Q * 0.30 - 6,897.01

ELSE IF Q <= 181,917:
    tax_per_part = Q * 0.41 - 16,200.48

ELSE:
    tax_per_part = Q * 0.45 - 23,477.16
```

**Derivation of constants:**
- Bracket 2: 11,600 x 0.11 = 1,276.00
- Bracket 3: 1,276.00 + (29,579 - 11,600) x (0.30 - 0.11) = 1,276.00 + 17,979 x 0.19 = 1,276.00 + 3,416.01 = ... Actually let me recalculate:
  - At Q = 29,579: tax = (29,579 - 11,600) x 0.11 = 17,979 x 0.11 = 1,977.69
  - Formula: Q x 0.30 - K = 1,977.69 when Q = 29,579 => K = 29,579 x 0.30 - 1,977.69 = 8,873.70 - 1,977.69 = 6,896.01

Let me provide the **verified** quick-calculation constants:

```
Bracket 2: tax = Q x 0.11 - 1,276.00
Bracket 3: tax = Q x 0.30 - 6,896.01
Bracket 4: tax = Q x 0.41 - 16,199.48
Bracket 5: tax = Q x 0.45 - 23,476.16
```

**Verification at boundary Q = 29,579:**
- Bracket 2: 29,579 x 0.11 - 1,276.00 = 3,253.69 - 1,276.00 = 1,977.69
- Bracket 3: 29,579 x 0.30 - 6,896.01 = 8,873.70 - 6,896.01 = 1,977.69 (matches)

**Verification at boundary Q = 84,577:**
- Bracket 3: 84,577 x 0.30 - 6,896.01 = 25,373.10 - 6,896.01 = 18,477.09
- Bracket 4: 84,577 x 0.41 - 16,199.48 = 34,676.57 - 16,199.48 = 18,477.09 (matches)

**Verification at boundary Q = 181,917:**
- Bracket 4: 181,917 x 0.41 - 16,199.48 = 74,585.97 - 16,199.48 = 58,386.49
- Bracket 5: 181,917 x 0.45 - 23,476.16 = 81,862.65 - 23,476.16 = 58,386.49 (matches)

### 4.3 Total Tax Calculation

```
impot_brut = tax_per_part * nombre_de_parts
```

Then apply plafonnement (Section 6), decote (Section 8), and any reductions/credits.

### Sources
- [Service-public.fr -- Bareme impot sur le revenu](https://www.service-public.gouv.fr/particuliers/vosdroits/F1419)
- [Service-public.fr -- Tranches et taux 2026](https://www.service-public.gouv.fr/particuliers/actualites/A18045)
- [impots.gouv.fr -- Simulateur 2026](https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2026/complet/index.htm)

---

## 5. Family Quotient (Quotient Familial)

### 5.1 Number of Parts by Family Situation

#### Married or PACS Couples (Imposition Commune)

| Children | Parts |
|----------|-------|
| 0 | 2.0 |
| 1 | 2.5 |
| 2 | 3.0 |
| 3 | 4.0 |
| 4 | 5.0 |
| 5 | 6.0 |
| N (N >= 3) | 2 + 0.5 + 0.5 + (N-2) x 1.0 |

**Rule:** First two children = +0.5 part each. Third and subsequent children = +1.0 part each.

#### Single / Divorced / Separated (Living Alone with Dependents -- Parent Isole)

A "parent isole" is someone who lives alone (does not share a household with a partner) and has at least one dependent child.

| Children | Parts |
|----------|-------|
| 0 | 1.0 (not a parent isole) |
| 1 | 2.0 |
| 2 | 2.5 |
| 3 | 3.5 |
| 4 | 4.5 |
| N (N >= 3) | 1 + 1.0 + 0.5 + (N-2) x 1.0 |

**Rule:** First child gives a FULL part (not 0.5) because of the bonus half-part for single parents (case T on the declaration). Subsequent children follow normal rules.

#### Single / Divorced / Separated (NOT Living Alone -- Cohabiting with Dependents)

| Children | Parts |
|----------|-------|
| 0 | 1.0 |
| 1 | 1.5 |
| 2 | 2.0 |
| 3 | 3.0 |
| 4 | 4.0 |
| N (N >= 3) | 1 + 0.5 + 0.5 + (N-2) x 1.0 |

#### Widowed (with Dependent Children)

| Children | Parts |
|----------|-------|
| 1 | 2.5 |
| 2 | 3.0 |
| 3 | 4.0 |
| 4 | 5.0 |

**Rule:** Same as married couple -- the widowed person keeps the deceased spouse's part for the purpose of dependents.

#### Widowed (without Dependent Children)

- 1.0 part (same as single)

#### Single Person Who Previously Raised a Child Alone for 5+ Years

- 1.5 parts (bonus 0.5 part, case L on the declaration)

### 5.2 Additional Half-Parts (Demi-Parts Supplementaires)

These are added on top of the standard parts above:

| Situation | Additional Parts |
|-----------|-----------------|
| Taxpayer holds CMI-invalidite card | +0.5 |
| Spouse holds CMI-invalidite card | +0.5 |
| Dependent child holds CMI-invalidite card | +0.5 per child |
| Taxpayer receives pension for work accident (>= 40%) | +0.5 |
| Military disability / war victim pension (>= 40%) | +0.5 |
| Former combatant aged 74+ with veteran card | +0.5 |
| Widow of a former combatant who had the +0.5 | +0.5 |

### 5.3 Shared Custody (Garde Alternee / Residence Alternee)

When a child is in shared custody between two separate households, each parent gets **half** of the normal part increase:

| Normal increase | Shared custody increase per parent |
|-----------------|-----------------------------------|
| +0.5 (1st or 2nd child) | +0.25 |
| +1.0 (3rd+ child) | +0.50 |

**Example:** Single parent living alone, 2 children in shared custody:
- Normal: 2.5 parts. Shared: 1.0 + 0.5 + 0.25 + 0.25 = 2.0 parts per parent.

Wait -- let me clarify. For a parent isole with shared custody:
- 1 child shared: 1.0 + 0.5 (parent isole bonus halved) + 0.25 = 1.75 parts
- The rules get complex. The parent isole bonus half-part is also halved in shared custody.

**For the calculator:** Given the complexity, I recommend supporting only the most common scenarios initially:
1. Single person, no children (1 part)
2. Married/PACS couple, 0-5 children
3. Single parent (living alone), 1-5 children (full custody)

Shared custody and disability half-parts can be added later.

### Sources
- [Service-public.fr -- Quotient familial couple marie/pacse](https://www.service-public.gouv.fr/particuliers/vosdroits/F2705)
- [Service-public.fr -- Quotient familial personne en concubinage](https://www.service-public.gouv.fr/particuliers/vosdroits/F34088)
- [droit-finances.commentcamarche.com -- Quotient familial 2026](https://droit-finances.commentcamarche.com/impots/guide-impots/2599-quotient-familial-calcul-plafonnement-nombre-de-parts/)
- [corrigetonimpot.fr -- Quotient familial calcul](https://www.corrigetonimpot.fr/quotient-familial-calcul-nombre-part-impot/)

---

## 6. Plafonnement du Quotient Familial

### 6.1 What Is Plafonnement?

The quotient familial reduces the tax burden for families with children. However, the benefit is **capped** (plafonne). Each additional half-part beyond the base parts (1 for single, 2 for couple) can reduce your tax by at most a specified amount.

### 6.2 Cap Amounts for 2026

| Type of Half-Part | Maximum Benefit per Half-Part | Per Quarter-Part |
|---|---|---|
| **Standard child (full custody)** | 1,807 EUR | 904 EUR |
| **Parent isole -- first child** | 4,262 EUR | 2,131 EUR |
| **Parent isole -- subsequent children** | 1,807 EUR | 904 EUR |
| **Shared custody (per child, 1st/2nd)** | 2,131 EUR per parent | -- |
| **Former single parent (case L)** | 1,079 EUR | -- |
| **Disability / veteran half-part** | 3,608 EUR | -- |
| **Widowed with children (spouse's part)** | 5,625 EUR | -- |

### 6.3 How to Apply Plafonnement

The algorithm:

```
1. Calculate tax_with_QF:
   Q = revenu_net_imposable / nombre_de_parts
   tax_with_QF = apply_bareme(Q) * nombre_de_parts

2. Calculate tax_without_QF (using only base parts):
   base_parts = 1 (single) or 2 (couple)
   Q_base = revenu_net_imposable / base_parts
   tax_without_QF = apply_bareme(Q_base) * base_parts

3. QF_benefit = tax_without_QF - tax_with_QF

4. Calculate max_benefit:
   Sum up the cap for each additional half-part beyond base_parts
   (using the appropriate cap from the table above)

5. IF QF_benefit > max_benefit:
   final_tax_before_decote = tax_without_QF - max_benefit
   ELSE:
   final_tax_before_decote = tax_with_QF
```

### 6.4 Example: Plafonnement Check

Married couple (2 base parts) with 3 children (4 total parts):
- Additional parts: 4 - 2 = 2 parts = 4 half-parts
- Max benefit = 4 x 1,807 = 7,228 EUR
- If actual QF benefit exceeds 7,228 EUR, tax is capped at: `tax_2_parts - 7,228`

### Sources
- [service-public.fr -- Quotient familial](https://www.service-public.gouv.fr/particuliers/vosdroits/F1419)
- [droit-finances.commentcamarche.com -- Plafonnement 2026](https://droit-finances.commentcamarche.com/impots/guide-impots/2599-quotient-familial-calcul-plafonnement-nombre-de-parts/)

---

## 7. 10% Standard Deduction (Deduction Forfaitaire)

### 7.1 Overview

Employment income benefits from an automatic 10% deduction for professional expenses before the income tax bareme is applied. This applies to the **annual** net imposable employment income.

### 7.2 Parameters for 2026 (Revenus 2025)

| Parameter | Amount |
|-----------|--------|
| **Standard rate** | 10% of net imposable employment income |
| **Minimum deduction** | 509 EUR per household member with employment income |
| **Maximum deduction** | 14,555 EUR per household member with employment income |

### 7.3 Calculation

```
deduction_10pct = net_imposable_annual * 0.10
deduction_10pct = MAX(deduction_10pct, 509)    // floor
deduction_10pct = MIN(deduction_10pct, 14555)  // ceiling

revenu_net_imposable_after_deduction = net_imposable_annual - deduction_10pct
```

**Note:** The deduction is applied **per person earning employment income** in the household. For a married couple where both work, each gets their own 10% deduction applied to their respective employment income.

### 7.4 Alternative: Frais Reels (Actual Expenses)

Taxpayers can choose to deduct actual professional expenses instead of the 10% flat rate if it is more advantageous. For the calculator, implementing only the 10% standard deduction is sufficient.

### 7.5 Developer Note

The 10% deduction applies for the **annual income tax calculation** (which determines the effective tax rate). It does NOT directly appear in the monthly payslip withholding -- the PAS neutral grid already factors in an assumed 10% deduction.

### Sources
- [Service-public.fr -- Frais professionnels](https://www.service-public.gouv.fr/particuliers/vosdroits/F1989)
- [impots.gouv.fr -- Deduction forfaitaire de 10%](https://www.impots.gouv.fr/particulier/questions/comment-puis-je-beneficier-de-la-deduction-forfaitaire-de-10)

---

## 8. Decote Mechanism

### 8.1 Purpose

The decote is an automatic tax reduction for taxpayers whose gross income tax (impot brut, after plafonnement but before any reductions/credits) falls below certain thresholds. It ensures a progressive entry into taxation.

### 8.2 Thresholds and Formula for 2026

| Filing Status | Threshold (impot brut must be below) | Formula |
|---|---|---|
| **Single / Divorced / Widowed** | 1,982 EUR | decote = 897 - (impot_brut x 45.25%) |
| **Married / PACS (joint filing)** | 3,277 EUR | decote = 1,483 - (impot_brut x 45.25%) |

### 8.3 Application

```
IF filing_status == SINGLE:
    IF impot_brut < 1982:
        decote = 897 - (impot_brut * 0.4525)
        decote = MAX(decote, 0)  // cannot be negative
        impot_after_decote = impot_brut - decote
    ELSE:
        impot_after_decote = impot_brut  // no decote

ELSE IF filing_status == COUPLE:
    IF impot_brut < 3277:
        decote = 1483 - (impot_brut * 0.4525)
        decote = MAX(decote, 0)
        impot_after_decote = impot_brut - decote
    ELSE:
        impot_after_decote = impot_brut  // no decote
```

### 8.4 Example

Single person, impot brut = 1,000 EUR:
- decote = 897 - (1,000 x 0.4525) = 897 - 452.50 = 444.50 EUR
- impot after decote = 1,000 - 444.50 = **555.50 EUR**

Couple (joint), impot brut = 2,800 EUR:
- decote = 1,483 - (2,800 x 0.4525) = 1,483 - 1,267 = 216 EUR
- impot after decote = 2,800 - 216 = **2,584 EUR**

### 8.5 Edge Case: Decote Reduces Tax to Zero

If decote >= impot_brut, the tax is simply 0 EUR (no negative tax from decote).

### Sources
- [corrigetonimpot.fr -- Decote impot revenu 2026](https://www.corrigetonimpot.fr/decote-impot-revenu-calcul-declaration/)
- [l-expert-comptable.com -- Impot sur le revenu 2026](https://www.l-expert-comptable.com/a/532163-impot-sur-le-revenu-bareme.html)

---

## 9. Withholding Tax -- Prelevement a la Source (PAS)

### 9.1 How PAS Works

Since January 2019, France withholds income tax directly from salary. The employer deducts PAS from the employee's net imposable monthly salary.

**Three rate types exist:**
1. **Taux personnalise** -- communicated by the tax authority to the employer based on the employee's previous tax return. This is the most common.
2. **Taux individualise** -- for married couples who opt for separate rates.
3. **Taux neutre (par defaut)** -- used when no personalised rate is available (new employees, privacy opt-out, etc.).

**For the calculator:** We use the **taux neutre** grid, as we cannot know each user's personalised rate.

### 9.2 Neutral Rate Grid -- France Metropolitaine

#### Grid applicable from 1 May 2025 through 30 April 2026

This is the grid currently in force for most of the 2026 calendar year. It was established by the Loi de finances for 2025.

| Monthly Net Imposable (EUR) | Withholding Rate |
|---|---|
| Below 1,620 | 0% |
| 1,620 to 1,682 | 0.5% |
| 1,683 to 1,790 | 1.3% |
| 1,791 to 1,910 | 2.1% |
| 1,911 to 2,041 | 2.9% |
| 2,042 to 2,150 | 3.5% |
| 2,151 to 2,293 | 4.1% |
| 2,294 to 2,713 | 5.3% |
| 2,714 to 3,106 | 7.5% |
| 3,107 to 3,538 | 9.9% |
| 3,539 to 3,982 | 11.9% |
| 3,983 to 4,647 | 13.8% |
| 4,648 to 5,573 | 15.8% |
| 5,574 to 6,973 | 17.9% |
| 6,974 to 8,710 | 20% |
| 8,711 to 12,090 | 24% |
| 12,091 to 16,375 | 28% |
| 16,376 to 25,705 | 33% |
| 25,706 to 55,061 | 38% |
| 55,062 and above | 43% |

#### Grid applicable from 1 May 2026 (revalued +0.9%)

Established by the Loi de finances for 2026, Article 2 ter (CGI Art. 204 H).

| Monthly Net Imposable (EUR) | Withholding Rate |
|---|---|
| Below 1,635 | 0% |
| 1,635 to 1,697 | 0.5% |
| 1,698 to 1,806 | 1.3% |
| 1,807 to 1,927 | 2.1% |
| 1,928 to 2,059 | 2.9% |
| 2,060 to 2,169 | 3.5% |
| 2,170 to 2,314 | 4.1% |
| 2,315 to 2,737 | 5.3% |
| 2,738 to 3,134 | 7.5% |
| 3,135 to 3,570 | 9.9% |
| 3,571 to 4,018 | 11.9% |
| 4,019 to 4,689 | 13.8% |
| 4,690 to 5,623 | 15.8% |
| 5,624 to 7,036 | 17.9% |
| 7,037 to 8,788 | 20% |
| 8,789 to 12,199 | 24% |
| 12,200 to 16,522 | 28% |
| 16,523 to 25,936 | 33% |
| 25,937 to 55,557 | 38% |
| 55,558 and above | 43% |

### 9.3 Implementation Note: Which Grid to Use

**For the calculator, use the May 2026 grid** (the +0.9% revalued version). Rationale:
- The calculator shows an estimate of ongoing net salary, not a point-in-time January 2026 payslip
- The May 2026 grid will be in effect for the majority of the calendar year (May--December = 8 months)
- The thresholds are very close (differ by ~0.9%)

If you want to be precise, you can optionally allow toggling between the two grids.

### 9.4 PAS Calculation

```
pas_amount = ROUND(net_imposable_monthly * taux_neutre, 2)
```

The rate is determined by finding which bracket the `net_imposable_monthly` falls into.

### 9.5 Short-Term Contract Abatement

For CDD or interim contracts under 2 months where no personalised rate is available, an abatement of **748 EUR** (half SMIC net imposable) is applied to the net imposable before looking up the rate in the neutral grid:

```
net_imposable_for_grid = net_imposable_monthly - 748
IF net_imposable_for_grid < 0: net_imposable_for_grid = 0
taux = lookup_neutral_grid(net_imposable_for_grid)
pas_amount = net_imposable_monthly * taux  // apply rate to full amount
```

**For the calculator:** This is optional. Standard CDI employees do not use this abatement.

### Sources
- [BOFiP -- Grilles des taux par defaut (BOI-BAREME-000037)](https://bofip.impots.gouv.fr/bofip/11255-PGP.html/identifiant=BOI-BAREME-000037-20250410)
- [fiche-paie.fr -- Grille taux neutre 2026](https://fiche-paie.fr/blog/grille-taux-neutre-prelevement-source)
- [LégiSocial -- Bareme taux neutres 2026](https://www.legisocial.fr/actualites-sociales/7781-nouveau-bareme-taux-neutres-2026.html)
- [culture-rh.com -- Prelevement a la Source 2026](https://culture-rh.com/taux-prelevement-a-la-source-2026/)

---

## 10. Special Considerations

### 10.1 13th Month Salary (Treizieme Mois)

- **Not mandatory by law** in France, but very common in collective agreements (conventions collectives)
- When paid, it is treated as regular salary for social contribution and tax purposes
- Can be paid as a lump sum (usually December) or spread across 12 months
- **For the calculator:** Allow the user to toggle "13th month" on/off. If on:
  - Annual gross = monthly gross x 13
  - Monthly contributions calculated on the actual monthly amount paid
  - Or: spread the 13th month evenly (annual gross / 12 for monthly display)

### 10.2 Meal Vouchers (Tickets Restaurant)

| Parameter | 2026 Value |
|-----------|-----------|
| **Max employer contribution exempt from SS/tax** | 7.32 EUR per voucher per working day |
| **Employer share must be** | Between 50% and 60% of face value |
| **Implied face value range (for max exemption)** | 12.20 EUR to 14.64 EUR |

**Calculation:**
```
// If employer contribution <= 7.32 EUR and is between 50-60% of face value:
//   - Employer contribution is exempt from social security and income tax
//   - Employee contribution is deducted from net pay (not from gross)
// If employer contribution > 7.32 EUR:
//   - Excess is added to taxable income and subject to contributions

meal_voucher_employee_share = face_value - employer_contribution
// Deducted from net pay, not from gross
```

**For the calculator:** Meal vouchers are optional. If implemented:
- Input: number of working days per month (default 22), face value, employer share %
- The employee's share reduces net pay
- The employer's share (up to 7.32 EUR/day) is tax-free

### 10.3 Transport Allowance (Prime de Transport / Remboursement Transport)

| Type | Employer Obligation | Tax/SS Exemption |
|---|---|---|
| **Public transport subscription** | 50% reimbursement mandatory | Exempt up to 75% of cost |
| **Sustainable mobility (Forfait Mobilites Durables)** | Optional | Exempt up to 600 EUR/year |
| **Fuel / electric charging** | Optional | Exempt up to 600 EUR/year (max 300 EUR for fuel) |

**For the calculator:** Transport reimbursement is typically:
- Shown on the payslip but NOT included in gross salary
- Exempt from social contributions and income tax (within limits)
- Does not affect the net salary calculation from gross
- Can optionally be shown as an addition to net pay

### 10.4 Overtime (Heures Supplementaires)

Since 2019, overtime hours benefit from:
- **Employee:** Exemption from income tax up to 7,500 EUR/year (net imposable)
- **Employee:** Reduction of employee social contributions (approximately 11.31% deduction)

**For the calculator:** This is complex and optional. If not implementing overtime, note it as a limitation.

### 10.5 Mutuelle (Complementary Health Insurance)

- **Mandatory:** Employers must provide a group health insurance plan (mutuelle d'entreprise)
- **Minimum employer contribution:** 50% of the cost
- **Employee share:** Deducted from gross salary (before tax)
- **Employer share:** Exempt from social contributions (within limits)
- Typical employee cost: 30-60 EUR/month

**For the calculator:** Can be included as an optional deduction input. It reduces net pay but the employer portion is already factored into the gross.

### 10.6 Prevoyance (Supplementary Death/Disability Insurance)

- Mandatory for cadres (minimum 1.50% of Tranche 1 gross, employer-paid)
- Often also provided for non-cadres by convention collective
- Employee share (if any) is deducted from gross

### 10.7 Alsace-Moselle Supplementary Health Contribution

Employees working in departments 57 (Moselle), 67 (Bas-Rhin), or 68 (Haut-Rhin) pay an additional employee health insurance contribution of **1.30%** on total gross salary. This is due to the local social security regime inherited from German rule.

### Sources
- [Service-public.fr -- Titres-restaurant 2026](https://entreprendre.service-public.gouv.fr/actualites/A17989)
- [Pluxee -- Titres-restaurant 2026](https://www.pluxee.fr/blog/quels-sont-les-couts-lies-aux-titres-restaurant/)
- [Service-public.fr -- Remboursement frais transport](https://www.service-public.gouv.fr/particuliers/vosdroits/F19846)

---

## 11. Worked Examples

### 11.1 Example A: Single Person, 30,000 EUR Gross Annual, No Children

**Monthly gross:** 2,500.00 EUR

#### Step 1: Social Contributions (Monthly)

| Contribution | Base | Rate | Amount |
|---|---|---|---|
| Vieillesse plafonnee | 2,500.00 | 6.90% | 172.50 |
| Vieillesse deplafonnee | 2,500.00 | 0.40% | 10.00 |
| CSG deductible | 2,456.25 (= 2,500 x 98.25%) | 6.80% | 167.03 |
| CSG non-deductible | 2,456.25 | 2.40% | 58.95 |
| CRDS | 2,456.25 | 0.50% | 12.28 |
| AGIRC-ARRCO T1 | 2,500.00 | 3.15% | 78.75 |
| CEG T1 | 2,500.00 | 0.86% | 21.50 |
| CET | N/A (salary <= PMSS) | -- | 0.00 |
| **TOTAL** | | | **520.51** |

Note: No Tranche 2 contributions because salary (2,500) < PMSS (4,005).

#### Step 2: Net Before Tax

```
Net before tax = 2,500.00 - 520.51 = 1,979.49 EUR/month
```

#### Step 3: Net Imposable

```
Non-deductible CSG + CRDS = 58.95 + 12.28 = 71.23
Net imposable = 1,979.49 + 71.23 = 2,050.72 EUR/month
```

#### Step 4: PAS Withholding (using May 2026 neutral grid)

Net imposable of 2,050.72 EUR falls in bracket 2,060--2,169 = 3.5%
Actually 2,050.72 < 2,060, so it falls in bracket 1,928--2,059 = 2.9%

```
PAS = 2,050.72 x 2.9% = 59.47 EUR
```

#### Step 5: Net After Tax

```
Net after tax = 1,979.49 - 59.47 = 1,920.02 EUR/month
```

#### Annual Income Tax Check (for reference)

```
Annual net imposable = 2,050.72 x 12 = 24,608.64 EUR
10% deduction = 24,608.64 x 10% = 2,460.86 EUR (within min/max bounds)
Revenu fiscal de reference = 24,608.64 - 2,460.86 = 22,147.78 EUR

Parts = 1.0
Q = 22,147.78 / 1.0 = 22,147.78

Tax per part (bracket 2): 22,147.78 x 0.11 - 1,276.00 = 2,436.26 - 1,276.00 = 1,160.26
Total impot brut = 1,160.26 x 1.0 = 1,160.26

Decote check: 1,160.26 < 1,982 => applies
Decote = 897 - (1,160.26 x 0.4525) = 897 - 525.02 = 371.98
Impot after decote = 1,160.26 - 371.98 = 788.28 EUR/year
Effective rate = 788.28 / 24,608.64 = ~3.2%
```

---

### 11.2 Example B: Married Couple (1 Earner), 60,000 EUR Gross Annual, 2 Children

**Monthly gross:** 5,000.00 EUR

#### Step 1: Social Contributions (Monthly)

| Contribution | Base | Rate | Amount |
|---|---|---|---|
| Vieillesse plafonnee | 4,005.00 (capped) | 6.90% | 276.35 |
| Vieillesse deplafonnee | 5,000.00 | 0.40% | 20.00 |
| CSG deductible | 4,912.50 (= 5,000 x 98.25%) | 6.80% | 334.05 |
| CSG non-deductible | 4,912.50 | 2.40% | 117.90 |
| CRDS | 4,912.50 | 0.50% | 24.56 |
| AGIRC-ARRCO T1 | 4,005.00 | 3.15% | 126.16 |
| AGIRC-ARRCO T2 | 995.00 (= 5,000 - 4,005) | 8.64% | 85.97 |
| CEG T1 | 4,005.00 | 0.86% | 34.44 |
| CEG T2 | 995.00 | 1.08% | 10.75 |
| CET | 5,000.00 | 0.14% | 7.00 |
| **TOTAL** | | | **1,037.18** |

#### Step 2: Net Before Tax

```
Net before tax = 5,000.00 - 1,037.18 = 3,962.82 EUR/month
```

#### Step 3: Net Imposable

```
Non-deductible = 117.90 + 24.56 = 142.46
Net imposable = 3,962.82 + 142.46 = 4,105.28 EUR/month
```

#### Step 4: PAS Withholding (neutral grid)

Net imposable of 4,105.28 falls in bracket 4,019--4,689 = 13.8%

```
PAS = 4,105.28 x 13.8% = 566.53 EUR
```

**IMPORTANT NOTE:** The neutral grid does NOT account for family situation. A married person with children would have a much lower personalised rate. The neutral grid overstates the tax here. In practice, this person would receive a personalised rate of perhaps 5-8% from the tax authority.

#### Step 5: Net After Tax (with neutral grid -- overstated)

```
Net after tax = 3,962.82 - 566.53 = 3,396.29 EUR/month
```

#### Annual Income Tax (True Liability)

```
Annual net imposable = 4,105.28 x 12 = 49,263.36 EUR
10% deduction = 4,926.34 EUR
Revenu imposable = 49,263.36 - 4,926.34 = 44,337.02 EUR

Parts = 3.0 (married + 2 children)
Q = 44,337.02 / 3.0 = 14,779.01

Tax per part (bracket 2): 14,779.01 x 0.11 - 1,276.00 = 1,625.69 - 1,276.00 = 349.69
Total impot brut = 349.69 x 3.0 = 1,049.07

Plafonnement check:
  tax_2_parts: Q2 = 44,337.02 / 2 = 22,168.51
  tax_per_part_2 = 22,168.51 x 0.11 - 1,276.00 = 2,438.54 - 1,276.00 = 1,162.54
  tax_with_2_parts = 1,162.54 x 2 = 2,325.08
  QF benefit = 2,325.08 - 1,049.07 = 1,276.01
  Max benefit = 2 children x 2 half-parts x 1,807 = 3,614 EUR
  1,276.01 < 3,614 => NOT capped. OK.

Decote check: 1,049.07 < 3,277 (couple threshold) => applies
Decote = 1,483 - (1,049.07 x 0.4525) = 1,483 - 474.70 = 1,008.30
Impot after decote = 1,049.07 - 1,008.30 = 40.77 EUR/year

Effective annual rate: 40.77 / 49,263.36 = ~0.08%
Monthly equivalent: ~3.40 EUR/month
```

This illustrates why the personalised rate would be much lower than the neutral grid rate.

---

### 11.3 Example C: Single Person, 80,000 EUR Gross Annual, No Children

**Monthly gross:** 6,666.67 EUR

#### Step 1: Social Contributions (Monthly)

| Contribution | Base | Rate | Amount |
|---|---|---|---|
| Vieillesse plafonnee | 4,005.00 (capped) | 6.90% | 276.35 |
| Vieillesse deplafonnee | 6,666.67 | 0.40% | 26.67 |
| CSG deductible | 6,549.00 (= 6,666.67 x 98.25%) | 6.80% | 445.33 |
| CSG non-deductible | 6,549.00 | 2.40% | 157.18 |
| CRDS | 6,549.00 | 0.50% | 32.75 |
| AGIRC-ARRCO T1 | 4,005.00 | 3.15% | 126.16 |
| AGIRC-ARRCO T2 | 2,661.67 (= 6,666.67 - 4,005) | 8.64% | 229.97 |
| CEG T1 | 4,005.00 | 0.86% | 34.44 |
| CEG T2 | 2,661.67 | 1.08% | 28.75 |
| CET | 6,666.67 | 0.14% | 9.33 |
| **TOTAL** | | | **1,366.93** |

#### Step 2: Net Before Tax

```
Net before tax = 6,666.67 - 1,366.93 = 5,299.74 EUR/month
```

#### Step 3: Net Imposable

```
Non-deductible = 157.18 + 32.75 = 189.93
Net imposable = 5,299.74 + 189.93 = 5,489.67 EUR/month
```

#### Step 4: PAS (neutral grid, May 2026)

5,489.67 falls in bracket 4,690--5,623 = 15.8%

```
PAS = 5,489.67 x 15.8% = 867.37 EUR
```

#### Step 5: Net After Tax

```
Net after tax = 5,299.74 - 867.37 = 4,432.37 EUR/month
```

#### Annual Tax Check

```
Annual net imposable = 5,489.67 x 12 = 65,876.04 EUR
10% deduction = 6,587.60 EUR
Revenu imposable = 65,876.04 - 6,587.60 = 59,288.44 EUR

Parts = 1.0
Q = 59,288.44
Tax = 59,288.44 x 0.30 - 6,896.01 = 17,786.53 - 6,896.01 = 10,890.52 EUR

No decote (10,890.52 >> 1,982)
Effective rate: 10,890.52 / 65,876.04 = 16.5%
Monthly: 907.54 EUR
```

The neutral grid rate (15.8%) is close to the true effective rate (16.5%) for a single person with no children, which is expected.

---

## 12. Developer Implementation Notes

### 12.1 Calculator Inputs

| Input | Type | Default | Required |
|---|---|---|---|
| Annual gross salary | Number | -- | Yes |
| Filing status | Select: Single / Married-PACS / Divorced / Widowed | Single | Yes |
| Number of children | Number (0-10) | 0 | Yes |
| Parent isole (living alone) | Boolean | false | Only if Single/Divorced with children |
| Alsace-Moselle | Boolean | false | No |
| Cadre (management) | Boolean | false | No |
| 13th month | Boolean | false | No |

### 12.2 Calculator Outputs

| Output | Description |
|---|---|
| Monthly gross salary | Input / 12 (or / 13 if 13th month) |
| Total employee social contributions | Sum of all employee contributions |
| Net before tax (net a payer avant impot) | Gross - contributions |
| Net imposable | For PAS calculation |
| Withholding tax (PAS) | Net imposable x neutral rate |
| Net after tax (net a payer) | Net before tax - PAS |
| Annual income tax estimate | Full calculation with QF, decote, etc. |
| Effective tax rate | Annual tax / annual net imposable |

### 12.3 Calculation Order

```
1. Determine monthly gross (annual / 12 or / 13)
2. Calculate CSG/CRDS base (98.25% of gross, subject to 4x PASS ceiling)
3. Calculate each social contribution
4. Sum all employee contributions
5. Calculate net before tax
6. Calculate net imposable (net before tax + non-deductible CSG/CRDS)
7. Look up PAS neutral rate from grid
8. Calculate PAS amount
9. Calculate net after tax
10. (Optional) Calculate annual income tax liability with full QF/decote
```

### 12.4 Rounding

- Social contributions: round to 2 decimal places (EUR cents)
- PAS amount: round to nearest cent
- Income tax (annual): round to nearest whole euro (as per French tax rules)

### 12.5 Edge Cases to Handle

| Edge Case | Treatment |
|---|---|
| Salary = 0 | All outputs = 0 |
| Salary < SMIC | Still calculate normally; no minimum wage validation needed |
| Salary exactly at PMSS (4,005) | CET does NOT apply (only if salary > PMSS, strictly) |
| Salary at exactly a PAS bracket boundary | Use the lower bracket rate (the bracket ranges are inclusive of the lower bound) |
| Very high salary (> 8x PMSS) | T2 contributions cap at 8x PMSS; vieillesse plafonnee caps at 1x PMSS |
| Annual deduction at minimum (509 EUR) | Apply when 10% of annual income < 509 |
| Annual deduction at maximum (14,555 EUR) | Apply when 10% of annual income > 14,555 (income > 145,550) |
| Decote reduces tax below 0 | Tax = 0, not negative |
| QF plafonnement + decote interaction | Apply plafonnement FIRST, then decote on the result |

### 12.6 What This Calculator Does NOT Cover

- Actual professional expenses (frais reels) -- only the 10% standard deduction
- Capital gains or investment income
- Part-year residency
- Multiple employers
- Overtime exemptions
- Specific convention collective rules
- Prevoyance/mutuelle deductions (variable by employer)
- Non-metropolitan territories (DOM-TOM have different rates)

---

## 13. Regulatory Sources

### Official Government Sources

| Source | URL | Content |
|---|---|---|
| Service-public.fr -- Bareme IR 2026 | https://www.service-public.gouv.fr/particuliers/actualites/A18045 | Tax brackets |
| Service-public.fr -- Quotient familial | https://www.service-public.gouv.fr/particuliers/vosdroits/F1419 | QF calculation |
| Service-public.fr -- Quotient familial couple | https://www.service-public.gouv.fr/particuliers/vosdroits/F2705 | Parts for couples |
| Service-public.fr -- Frais professionnels | https://www.service-public.gouv.fr/particuliers/vosdroits/F1989 | 10% deduction |
| Service-public.fr -- CSG/CRDS | https://www.service-public.gouv.fr/particuliers/vosdroits/F2971 | CSG rates |
| Service-public.fr -- Transport | https://www.service-public.gouv.fr/particuliers/vosdroits/F19846 | Transport allowance |
| Service-public.fr -- PASS 2026 | https://www.service-public.gouv.fr/particuliers/actualites/A15386 | SS ceiling |
| impots.gouv.fr -- Simulateur 2026 | https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2026/complet/index.htm | Tax simulator |
| BOFiP -- PAS neutral grids | https://bofip.impots.gouv.fr/bofip/11255-PGP.html/identifiant=BOI-BAREME-000037-20250410 | Withholding grids |
| URSSAF -- Taux cotisations | https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html | SS contribution rates |
| URSSAF -- PASS 2026 | https://www.urssaf.fr/accueil/actualites/plafond-annuel-securite-sociale.html | SS ceiling |
| Legifrance -- Arrete PASS 2026 | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053143451 | Legal text |
| info.gouv.fr -- SMIC 2026 | https://www.info.gouv.fr/actualite/le-smic-revalorise-au-1er-janvier-2026 | Minimum wage |

### Secondary Sources (Cross-Verification)

| Source | URL | Content |
|---|---|---|
| CLEISS -- Contribution rates | https://www.cleiss.fr/docs/regimes/regime_france/an_a2.html | Complete rate table |
| LégiSocial -- AGIRC-ARRCO 2026 | https://www.legisocial.fr/reperes-sociaux/cotisations-agirc-arrco-2026.html | Pension rates |
| LégiSocial -- URSSAF 2026 | https://www.legisocial.fr/reperes-sociaux/taux-cotisations-sociales-urssaf-2026.html | SS rates |
| LégiSocial -- PAS neutral grid | https://www.legisocial.fr/actualites-sociales/7781-nouveau-bareme-taux-neutres-2026.html | Withholding grid |
| fiche-paie.fr -- PAS grid | https://fiche-paie.fr/blog/grille-taux-neutre-prelevement-source | Withholding grid |
| corrigetonimpot.fr -- Decote | https://www.corrigetonimpot.fr/decote-impot-revenu-calcul-declaration/ | Decote formula |
| droit-finances -- QF plafonnement | https://droit-finances.commentcamarche.com/impots/guide-impots/2599-quotient-familial-calcul-plafonnement-nombre-de-parts/ | QF caps |

---

## Appendix A: Quick-Reference Contribution Summary Card

For a **standard metropolitan non-cadre employee** earning **gross G per month**:

```
IF G <= 4,005 (PMSS):
    Employee contributions ~= G * 0.1095 + G * 0.9825 * 0.097
                           ~= G * 0.1095 + G * 0.09530
                           ~= G * 0.2048
    (approximately 20.5% of gross)

IF G > 4,005:
    Additional on (G - 4,005): +9.72% (AGIRC-ARRCO T2 + CEG T2)
    Plus CET on full G: +0.14%
```

## Appendix B: Annual Tax Calculation Pseudocode

```python
def calculate_annual_tax(annual_net_imposable, parts, filing_status):
    # Step 1: Apply 10% deduction
    deduction = annual_net_imposable * 0.10
    deduction = max(deduction, 509)
    deduction = min(deduction, 14555)
    revenu_imposable = annual_net_imposable - deduction

    # Step 2: Calculate tax with full quotient familial
    Q = revenu_imposable / parts
    tax_per_part = apply_bareme(Q)
    tax_with_qf = tax_per_part * parts

    # Step 3: Calculate tax with base parts only
    base_parts = 2 if filing_status in ['married', 'pacs'] else 1
    Q_base = revenu_imposable / base_parts
    tax_per_part_base = apply_bareme(Q_base)
    tax_without_qf = tax_per_part_base * base_parts

    # Step 4: Plafonnement
    qf_benefit = tax_without_qf - tax_with_qf
    additional_half_parts = (parts - base_parts) * 2  # count in half-parts

    # Simplified: assume all additional half-parts are standard children
    max_benefit = additional_half_parts * 1807
    # (For parent isole, first child cap is 4262 -- adjust accordingly)

    if qf_benefit > max_benefit:
        impot_brut = tax_without_qf - max_benefit
    else:
        impot_brut = tax_with_qf

    # Step 5: Decote
    if filing_status in ['married', 'pacs']:
        if impot_brut < 3277:
            decote = 1483 - impot_brut * 0.4525
            decote = max(decote, 0)
            impot_brut = impot_brut - decote
    else:
        if impot_brut < 1982:
            decote = 897 - impot_brut * 0.4525
            decote = max(decote, 0)
            impot_brut = impot_brut - decote

    # Step 6: Final tax (cannot be negative)
    return max(impot_brut, 0)


def apply_bareme(Q):
    if Q <= 11600:
        return 0
    elif Q <= 29579:
        return Q * 0.11 - 1276.00
    elif Q <= 84577:
        return Q * 0.30 - 6896.01
    elif Q <= 181917:
        return Q * 0.41 - 16199.48
    else:
        return Q * 0.45 - 23476.16
```

---

**END OF SPECIFICATION**

**Document Version:** 1.0
**Last Updated:** 2026-03-28
**Author:** Sarah (Taxation Expert Agent)
**Next Review:** When Loi de finances 2027 is published (expected late 2026 / early 2027)
