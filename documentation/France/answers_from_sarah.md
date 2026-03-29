# Answers from Sarah -- France 2026 Calculator

**Date:** 2026-03-29
**From:** Sarah (taxation expert)
**To:** David (developer)
**Re:** Responses to questions_for_sarah.md

---

## Q1: Quick-Calculation Constants -- Which Set to Use

**Answer: Use the SECOND (verified) set. David's assumption is CORRECT.**

I have independently re-derived all four constants from the official 2026 brackets published by service-public.gouv.fr (tranches et taux 2026, verified 2026-02-20):

| Bracket | Threshold | Correct Constant | First Set (WRONG) | Verified Set (CORRECT) |
|---------|-----------|------------------|--------------------|------------------------|
| 2 | 11,600 | 1,276.00 | 1,276.00 | 1,276.00 |
| 3 | 29,579 | 6,896.01 | 6,897.01 | 6,896.01 |
| 4 | 84,577 | 16,199.48 | 16,200.48 | 16,199.48 |
| 5 | 181,917 | 23,476.16 | 23,477.16 | 23,476.16 |

**Derivation (for audit trail):**

- K2: 11,600 x 0.11 = 1,276.00
- K3: Tax at Q=29,579 via bracket 2 = 29,579 x 0.11 - 1,276.00 = 1,977.69; then K3 = 29,579 x 0.30 - 1,977.69 = 8,873.70 - 1,977.69 = **6,896.01**
- K4: Tax at Q=84,577 via bracket 3 = 84,577 x 0.30 - 6,896.01 = 18,477.09; then K4 = 84,577 x 0.41 - 18,477.09 = 34,676.57 - 18,477.09 = **16,199.48**
- K5: Tax at Q=181,917 via bracket 4 = 181,917 x 0.41 - 16,199.48 = 58,386.49; then K5 = 181,917 x 0.45 - 58,386.49 = 81,862.65 - 58,386.49 = **23,476.16**

The first set in the spec contained rounding errors of +1.00 EUR in brackets 3, 4, and 5. The verified set is mathematically exact and passes all boundary continuity checks.

**Use these formulas:**
```
Bracket 1 (Q <= 11,600):       tax = 0
Bracket 2 (Q <= 29,579):       tax = Q x 0.11 - 1,276.00
Bracket 3 (Q <= 84,577):       tax = Q x 0.30 - 6,896.01
Bracket 4 (Q <= 181,917):      tax = Q x 0.41 - 16,199.48
Bracket 5 (Q > 181,917):       tax = Q x 0.45 - 23,476.16
```

**Source:** [Service-public.fr -- Bareme IR 2026](https://www.service-public.gouv.fr/particuliers/vosdroits/F1419)

---

## Q2: CET Base -- Total Gross or Capped at 8x PMSS?

**Answer: CET is calculated on T1 + T2, which means it is effectively CAPPED at 8x PMSS (32,040 EUR/month). David's assumption to cap is CORRECT.**

The CET (Contribution d'Equilibre Technique) at 0.35% total (0.14% employee / 0.21% employer) applies "sur la tranche 1 et sur la tranche 2" per the AGIRC-ARRCO ANI (Accord National Interprofessionnel). The AGIRC-ARRCO regime only defines T1 (0 to 1x PMSS) and T2 (1x to 8x PMSS). There is no "T3" -- any salary above 8x PMSS is outside the AGIRC-ARRCO regime entirely.

Therefore:
- CET only triggers when gross salary exceeds 1x PMSS (strictly greater than 4,005 EUR/month)
- When triggered, it applies on T1 + T2 combined = MIN(gross, 8 x PMSS)
- For salaries above 8x PMSS (32,040 EUR/month), CET is capped at: 32,040 x 0.0014 = 44.86 EUR/month (employee share)

**Implementation:**
```
if (gross_monthly > PMSS) {
    cet_employee = MIN(gross_monthly, 8 * PMSS) * 0.0014;
} else {
    cet_employee = 0;
}
```

Note: In the worked Example C (gross 6,666.67), the spec shows CET = 6,666.67 x 0.14% = 9.33. This is correct because 6,666.67 < 8 x PMSS, so the cap does not bite. The formula `MIN(gross, 8 * PMSS) * 0.0014` produces the same result in this case.

**Sources:**
- [AGIRC-ARRCO -- Calcul des cotisations](https://www.agirc-arrco.fr/entreprises/mon-entreprise/calculer-et-declarer/le-calcul-des-cotisations-de-retraite-complementaire/)
- [PayFit -- Cotisation CET](https://payfit.com/fr/fiches-pratiques/cotisation-cet/)
- [LégiSocial -- Cotisations AGIRC-ARRCO 2026](https://www.legisocial.fr/reperes-sociaux/cotisations-agirc-arrco-2026.html)

---

## Q3: Worked Example A -- PAS Bracket Boundary

**Answer: 2.9% is CORRECT. David's reading is correct.**

The net imposable is 2,050.72 EUR. Looking at the May 2026 neutral grid:
- Bracket 1,928 -- 2,059: rate = 2.9%
- Bracket 2,060 -- 2,169: rate = 3.5%

Since 2,050.72 < 2,060, the correct bracket is 1,928--2,059 at **2.9%**.

The self-correction in the spec was intentional -- I initially looked at the wrong bracket, then corrected myself. The final calculation using 2.9% is authoritative.

PAS = 2,050.72 x 2.9% = **59.47 EUR** (confirmed).

**Source:** [BOFiP -- Grilles taux par defaut PAS](https://bofip.impots.gouv.fr/bofip/11255-PGP.html/identifiant=BOI-BAREME-000037-20250410)

---

## Q4: Widowed Person -- Parts Calculation

**Answer: David's assumption is CORRECT. Widowed with children uses the same parts as married.**

Per service-public.gouv.fr (page F35127, verified 2026-02-20), a widowed person with at least one dependent child retains the same quotient familial as during the marriage. The parts table is:

| Children | Parts | Breakdown |
|----------|-------|-----------|
| 0 | 1.0 | (No children = same as single) |
| 1 | 2.5 | 2 base + 0.5 |
| 2 | 3.0 | 2 base + 0.5 + 0.5 |
| 3 | 4.0 | 2 base + 0.5 + 0.5 + 1.0 |
| 4 | 5.0 | 2 base + 0.5 + 0.5 + 1.0 + 1.0 |
| N (N>=3) | 2 + 0.5 + 0.5 + (N-2) x 1.0 | Same formula as married |

The formula is identical to married/PACS: base of 2 parts, +0.5 for each of the first two children, +1.0 for each subsequent child.

**Plafonnement specificity for widowed:** The tax advantage from the additional spouse part (the extra 1 part that distinguishes widowed-with-children from single-parent) is capped at **5,625 EUR**. This is composed of the standard 3,614 EUR (2 half-parts x 1,807 EUR) plus a supplementary reduction of 2,011 EUR specific to widowed persons.

**Important implementation note:** For plafonnement purposes, when computing `tax_without_QF` for a widowed person with children, you use base_parts = 1 (not 2), because the "extra" 1 part from the deceased spouse is itself subject to the 5,625 EUR cap. This is a subtle but critical distinction from the married case.

Actually, let me clarify the plafonnement logic more precisely:
- A widowed person with N children has the same total parts as a married couple with N children
- But the "base" for plafonnement is 1 part (single person), not 2
- The benefit of the additional parts (total_parts - 1) is capped as follows:
  - The spouse's part (1.0 additional part = 2 half-parts): capped at 5,625 EUR total
  - The children's half-parts: capped at 1,807 EUR each (standard)

For the calculator, if you are not implementing widowed as a separate status, this can be deferred. If you do implement it, the plafonnement calculation requires special handling.

**Source:** [Service-public.gouv.fr -- Quotient familial personne veuve](https://www.service-public.gouv.fr/particuliers/vosdroits/F35127)

---

## Q5: Parent Isole Plafonnement -- First Child Cap

**Answer: The 4,262 EUR is for the ENTIRE first child's full part combined. David's assumption was WRONG.**

David assumed: 4,262 EUR for the parent isole bonus half-part + 1,807 EUR for the child's normal half-part = 6,069 EUR total for first child.

The correct rule per service-public.gouv.fr (page F35120): **"L'avantage fiscal est limite a 4 262 EUR pour la part entiere accordee pour votre 1er enfant a charge."**

This means 4,262 EUR is the **combined cap for the entire full part** (both the standard child half-part and the parent isole bonus half-part together). It is NOT 4,262 + 1,807.

**For a parent isole with 1 child (2.0 parts, base = 1.0):**
- Additional parts beyond base = 1.0 part = 2 half-parts
- Max benefit = **4,262 EUR** (total, for the combined full part of the first child)

**For a parent isole with 2 children (2.5 parts, base = 1.0):**
- First child: 1.0 full part, capped at 4,262 EUR
- Second child: 0.5 half-part, capped at 1,807 EUR
- Max benefit = 4,262 + 1,807 = **6,069 EUR**

**For a parent isole with 3 children (3.5 parts, base = 1.0):**
- First child: 1.0 full part, capped at 4,262 EUR
- Second child: 0.5 half-part, capped at 1,807 EUR
- Third child: 1.0 full part (= 2 half-parts), capped at 2 x 1,807 = 3,614 EUR
- Max benefit = 4,262 + 1,807 + 3,614 = **9,683 EUR**

**Implementation:**
```javascript
function getMaxQFBenefit(status, numChildren, isParentIsole) {
    if (status === 'married' || status === 'pacs') {
        // All children use standard 1,807 per half-part
        let halfParts = getAdditionalHalfParts(numChildren); // 1+1+2+2+...
        return halfParts * 1807;
    }
    if (isParentIsole && numChildren >= 1) {
        // First child full part = 4,262 combined
        let maxBenefit = 4262;
        if (numChildren >= 2) maxBenefit += 1807; // 2nd child = 0.5 part
        for (let i = 3; i <= numChildren; i++) {
            maxBenefit += 2 * 1807; // 3rd+ child = 1.0 part = 2 half-parts
        }
        return maxBenefit;
    }
    // Single (not parent isole) with children -- standard rules
    // ...
}
```

**Source:** [Service-public.gouv.fr -- Quotient familial parent isole](https://www.service-public.gouv.fr/particuliers/vosdroits/F35120)

---

## Q6: Employer Contributions -- Show Total Employer Cost?

**Answer: YES, show the total employer cost. Exclude accident du travail or use a sensible default.**

This is consistent with how the other country calculators in this project work (Ireland, Portugal, UK all show employer cost). For the France calculator:

**Include these employer contributions:**

| Contribution | Employer Rate | Base |
|---|---|---|
| Assurance maladie | 7.00% (reduced rate*) | Total gross |
| Solidarite autonomie (CSA) | 0.30% | Total gross |
| Vieillesse plafonnee | 8.55% | Up to PMSS |
| Vieillesse deplafonnee | 2.11% | Total gross |
| Allocations familiales | 3.45% (reduced rate*) | Total gross |
| Assurance chomage | 4.00% | Up to 4x PMSS |
| AGS | 0.25% | Up to 4x PMSS |
| FNAL | 0.10% | Up to PMSS |
| Dialogue social | 0.016% | Total gross |
| AGIRC-ARRCO T1 | 4.72% | Up to PMSS |
| AGIRC-ARRCO T2 | 12.95% | PMSS to 8x PMSS |
| CEG T1 | 1.29% | Up to PMSS |
| CEG T2 | 1.62% | PMSS to 8x PMSS |
| CET (employer) | 0.21% | T1+T2 (if salary > PMSS) |

*The reduced rates for assurance maladie (7% instead of 13%) and allocations familiales (3.45% instead of 5.25%) apply to salaries up to 2.5x SMIC. For simplicity, use the reduced rates as the default since most salaries fall in this range. If you want to be precise, the full rate kicks in above approximately 54,691 EUR annual gross (2.5 x 12 x 1,823.03).

**Exclude:** Accident du travail (AT/MP) -- this varies from 0.5% to over 7% by industry sector. It would be misleading to pick a default. Show a note like "Excludes accident du travail contribution (variable by industry, typically 1-3%)".

**Also exclude:** FNAL >= 50 employees variant (0.50% on total gross). Use the < 50 employees rate (0.10% on PMSS) as default, or offer a toggle.

**Output:** Display "Total employer cost = Gross + employer contributions" as a summary line.

**Source:** [URSSAF -- Taux cotisations secteur prive](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html)

---

## Q7: Meal Vouchers, Mutuelle, Transport -- Priority for Initial Release

**Answer: David's recommendation is CORRECT. Implement 13th month toggle and cadre/non-cadre for V1.**

**V1 scope (implement now):**
1. **13th month toggle** -- straightforward: when enabled, annual gross = monthly x 13, display monthly as annual / 12 or show that month 13 is a bonus. Treat as regular salary for all contributions/tax.
2. **Cadre/non-cadre toggle** -- this controls whether APEC (0.024% employee) applies. Simple conditional.

**V2 scope (defer):**
- Meal vouchers (tickets restaurant) -- adds UI complexity with face value, employer share %, working days inputs
- Mutuelle -- highly variable by employer, hard to set meaningful defaults
- Transport -- does not affect gross-to-net calculation, purely informational
- Alsace-Moselle -- low priority given the target audience (expats)

This prioritization is sound. The 13th month and cadre toggles have the most material impact on the net salary figure and are the most commonly relevant for expats evaluating French compensation packages.

---

## Q8: APEC Contribution -- Employee Rate Confirmation

**Answer: 0.024% is CORRECT as the employee rate. David's assumption is CORRECT.**

The APEC contribution total is 0.06%, split as follows:
- **Employee (part salariale):** 0.024%
- **Employer (part patronale):** 0.036%

This applies only to cadres (management-level employees), on salary up to 4x PMSS (16,020 EUR/month in 2026).

The 40/60 split David mentioned is the split for AGIRC-ARRCO T1/T2 contributions, not APEC. APEC has its own specific split. The employee rate of 0.024% is confirmed for 2026.

**Implementation:**
```
if (isCadre) {
    apec_employee = MIN(gross_monthly, 4 * PMSS) * 0.00024;
}
```

**Source:** [LégiSocial -- Cotisations AGIRC-ARRCO 2026](https://www.legisocial.fr/reperes-sociaux/cotisations-agirc-arrco-2026.html)

---

## Q9: Non-Resident Rate -- Defer to V2?

**Answer: YES, defer non-resident to V2. David's recommendation is CORRECT.**

The 5.50% assurance maladie employee contribution for non-residents is a niche case. The vast majority of employees working in France are tax-resident in France (they live there). Non-residents who work in France but are tax-resident elsewhere are an uncommon edge case, and the tax treatment is significantly more complex (different PAS grid for DOM-TOM, potential treaty implications, etc.).

For V1, assume all users are metropolitan France tax residents. Add a note in the calculator's limitations section: "This calculator assumes French tax residency. Non-residents may be subject to a 5.50% employee health contribution and different withholding rules."

---

## Q10: Rounding of Annual Income Tax

**Answer: Use standard rounding (round half-up). David's assumption to use Math.round() is CORRECT.**

Per Article 1657 of the Code General des Impots (CGI), the rule is:

> "Les bases des impositions de toute nature sont arrondies a l'euro le plus proche ; la fraction d'euro egale a 0,50 est comptee pour 1."

Translation: Tax bases are rounded to the nearest euro; a fraction equal to 0.50 is counted as 1 (i.e., rounds up).

This applies to:
- The tax base (revenu imposable)
- The tax amount itself (impot brut, after decote, final tax)
- All intermediate corrections (deductions, credits, reductions)

**In JavaScript:** `Math.round()` implements this correctly. `Math.round(0.5)` returns 1, which matches the CGI rule. Note that JavaScript's `Math.round()` does round 0.5 up (it rounds to positive infinity for the 0.5 case), so it is compliant.

**Important:** This is NOT truncation/floor. The impots.gouv.fr simulator may appear to truncate in some cases because of intermediate rounding steps, but the legal rule per Article 1657 CGI is round-half-up to the nearest euro.

**Additional rule from Article 1657:** Income tax assessments below 61 EUR (before any tax credit imputation) are not collected. You may want to implement this as: if final annual tax < 61, display 0.

**Sources:**
- [BOFiP -- BOI-IR-LIQ-20-20-40 (Article 1657 application)](https://bofip.impots.gouv.fr/bofip/2496-PGP.html/identifiant=BOI-IR-LIQ-20-20-40-20180704)
- [Legifrance -- Article 1657 CGI](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051219510)

---

## Summary Table

| Question | David's Assumption | Verdict | Action Required |
|----------|-------------------|---------|-----------------|
| Q1: Quick-calc constants | Use verified (2nd) set | CORRECT | Use verified set |
| Q2: CET base | Cap at 8x PMSS | CORRECT | `MIN(gross, 8*PMSS) * 0.0014` |
| Q3: Example A PAS rate | 2.9% | CORRECT | No change needed |
| Q4: Widowed parts | Same as married formula | CORRECT | Note plafonnement difference |
| Q5: Parent isole cap | 4,262 + 1,807 split | **WRONG** | 4,262 is combined cap for full part |
| Q6: Show employer cost | Include all except AT | CORRECT | Use reduced maladie/AF rates as default |
| Q7: V1 scope | 13th month + cadre only | CORRECT | Defer meal/mutuelle/transport |
| Q8: APEC employee rate | 0.024% | CORRECT | Confirmed |
| Q9: Non-resident | Defer to V2 | CORRECT | Add limitation note |
| Q10: Rounding | Math.round() | CORRECT | Round half-up per Art. 1657 CGI |

---

## Critical Correction: Q5

The only answer where David's assumption was incorrect is **Q5 (parent isole plafonnement)**. This is a **Major** severity issue if not corrected, as it would overstate the maximum QF benefit for parent isole by 1,807 EUR for the first child case.

**Wrong:** max_benefit_first_child = 4,262 (bonus half-part) + 1,807 (child half-part) = 6,069
**Correct:** max_benefit_first_child = 4,262 (entire full part combined)

Please update the plafonnement logic accordingly before finalizing the calculator.

---

**Regulatory sources consulted for these answers:**
- [Service-public.gouv.fr -- Bareme IR 2026 (F1419)](https://www.service-public.gouv.fr/particuliers/vosdroits/F1419)
- [Service-public.gouv.fr -- Quotient familial parent isole (F35120)](https://www.service-public.gouv.fr/particuliers/vosdroits/F35120)
- [Service-public.gouv.fr -- Quotient familial veuve (F35127)](https://www.service-public.gouv.fr/particuliers/vosdroits/F35127)
- [AGIRC-ARRCO -- Calcul des cotisations](https://www.agirc-arrco.fr/entreprises/mon-entreprise/calculer-et-declarer/le-calcul-des-cotisations-de-retraite-complementaire/)
- [LégiSocial -- Cotisations AGIRC-ARRCO 2026](https://www.legisocial.fr/reperes-sociaux/cotisations-agirc-arrco-2026.html)
- [BOFiP -- PAS neutral grids (BOI-BAREME-000037)](https://bofip.impots.gouv.fr/bofip/11255-PGP.html/identifiant=BOI-BAREME-000037-20250410)
- [BOFiP -- Rounding rules (BOI-IR-LIQ-20-20-40)](https://bofip.impots.gouv.fr/bofip/2496-PGP.html/identifiant=BOI-IR-LIQ-20-20-40-20180704)
- [Legifrance -- Article 1657 CGI](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000051219510)
- [URSSAF -- Taux cotisations secteur prive](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html)
- [PayFit -- Cotisation CET](https://payfit.com/fr/fiches-pratiques/cotisation-cet/)
