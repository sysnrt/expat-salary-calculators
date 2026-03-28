# Phase 3 Migration Gaps — Legacy HTML vs New Country Configs

This document tracks what is **missing** from each new `countries/*.js` config compared to its legacy HTML calculator. Items are grouped into **computation gaps** (missing tax logic/options) and **shared UI gaps** (features that were in every legacy page but are now the responsibility of the shared SPA shell).

---

## Shared UI Gaps (applies to ALL countries)

These features existed in every legacy HTML page. They are not country-config concerns — they belong in the shared SPA components and will be addressed in later phases.

| Feature | Legacy | New SPA Status |
|---|---|---|
| What-if buttons (+10%, +20%, +1K, +2K, Min Wage) | Per-page JS | Not yet built |
| Calculation mode tabs (From Gross / From Net / From Employer Cost) | Per-page tabs | `reverseFromNet()` and `reverseFromTotal()` exist on configs; UI not wired |
| Net vs Gross curve chart (canvas) | Per-page canvas | Not yet built |
| Effective Tax Rate curve chart (canvas) | Per-page canvas | Not yet built |
| Annual bar chart (stacked SVG/canvas) | Per-page SVG | Not yet built |
| Saved calculation history (localStorage) | Per-page JS | Not yet built |
| Multi-language UI (data-* attribute system) | Per-page translations | Not yet built; `supportedLangs` declared on each config |
| Animated odometer for net salary display | Per-page JS | Not yet built |

---

## Hungary

**Computation gaps:** None — full feature parity on tax logic.

All options (under25, newlywed, motherUnder30, mother4plus, children, beneficiaryChildren, singleParent, disabledChild) are present. SZJA 15%, TB 18.5%, Szocho 13%, family benefit splitting all match.

---

## Germany

**Computation gaps:**

| Missing Feature | Description | Priority |
|---|---|---|
| Bonus / Sonderzahlungen | Legacy supports 13th/14th month salary and holiday pay with §39b Abs.3 annual-table bonus taxation method | Medium |
| Joint taxation (Zusammenveranlagung) | Legacy allows two-partner household calculation with separate incomes and Ehegattensplitting income splitting. New config handles Class III/V individually but not full joint mode with partner salary input | Medium |

---

## Netherlands

**Computation gaps:**

| Missing Feature | Description | Priority |
|---|---|---|
| 30% Ruling salary norm eligibility check | Legacy shows dynamic eligibility messages (qualifies / below norm / too low) based on `RULING_SALARY_NORM = €46,660` and `RULING_SALARY_NORM_YOUNG = €35,468` for under-30 with master's degree | Low |

---

## Portugal

**Computation gaps:** None — full feature parity on tax logic.

IRS brackets with parcela, IFICI/NHR 20%, quociente conjugal, minimo de existencia, solidarity surcharge, dependent deduction, SS 11%/23.75%, 14 payments, meal allowance (card vs cash), Abono de Familia all match.

---

## Spain

**Computation gaps:** None — full feature parity on tax logic.

6-bracket IRPF, Beckham Law, Ceuta/Melilla deduction, full SS with solidarity tiers, reduccion por rendimientos, minimo personal y familiar, 14/12 payment system all match.

---

## Belgium

**Computation gaps:**

| Missing Feature | Description | Priority |
|---|---|---|
| Company Car BIK | CO2-based benefit-in-kind calculation with fuel type, catalogue value, vehicle age depreciation brackets | High |
| Meal Vouchers | Toggle + configurable daily rate and quantity per month, employee/employer split | High |
| Eco Vouchers | €250/year tax-free benefit | Low |
| Commuting/Transport benefit | Commute type (public/car/bicycle), one-way distance, tax-free reimbursement rates | Medium |
| Group Insurance | Toggle + monthly contribution amount, deducted from net | Medium |
| Hospitalization Insurance | Toggle + monthly contribution amount, deducted from net | Low |
| Researcher Regime | Special tax regime option (in addition to Expat/BBSI) | Low |
| Child age group breakdown | Separate inputs for 0-5, 6-11, 12-17, 18-24 with different benefit rates per region | Medium |

Belgium has the **largest gap** — the legacy calculator had extensive fringe benefit modeling (company car, meal/eco vouchers, commuting, insurances) that are not yet in the new config.

---

## Slovakia

**Computation gaps:** None — full feature parity on tax logic.

All features match: 4-bracket progressive tax, social + health insurance with caps, NCZD with pensioner/annual phase-out, tax bonus on children with percentage cap and high-income reduction, spouse NCZD, Pillar III, child benefit.

Note: Legacy had a `childBenefitToggle` to show/hide the state benefit display — this is a UI concern, not a computation gap.

---

## Poland

**No legacy HTML calculator existed.** Built from spec document (`SPEC-POLAND-NET-SALARY-2026.md`).

**Spec features NOT yet implemented:**

| Missing Feature | Description | Priority |
|---|---|---|
| B2B / Self-employed mode | Full JDG calculation with 3 tax options (progressive, flat 19%, ryczalt), different ZUS bases, different health insurance rates | High |
| ZUS annual cap mid-year crossing | Calculator uses flat monthly rate; should track cumulative gross and split month when crossing PLN 282,600 cap | Medium |
| PIT-0 for families 2+ children | New 2026 relief: PLN 140,000/parent exempt (signed Oct 2025) | Medium |
| Large family relief (4+ children) | PLN 85,528/year exempt per taxpayer | Low |
| Return to Poland relief | PLN 85,528/year exempt for 4 years after moving back | Low |
| IP Box (5% rate) | 5% preferential rate on qualifying IP income | Low |
| PPK employer BIK effect | Employer PPK contribution should add to taxable income for PIT | Low |
| VAT informational section | B2B VAT threshold (PLN 240,000) and rate display | Low (B2B only) |

---

## Summary

| Country | Computation Gaps | Severity |
|---|---|---|
| Hungary | None | Complete |
| Germany | Bonus taxation, Joint household | Medium |
| Netherlands | 30% ruling eligibility display | Low |
| Portugal | None | Complete |
| Spain | None | Complete |
| Belgium | Company car, meal/eco vouchers, commuting, insurances, researcher regime, child age groups | High |
| Slovakia | None | Complete |
| Poland | B2B mode, ZUS cap crossing, family reliefs | High (but employment mode works) |
