# Questions for Sarah — France 2026 Calculator

**Date:** 2026-03-29
**From:** David (developer)
**Re:** SPEC-FRANCE-NET-SALARY-2026.md clarifications

---

## Questions About the Specification

### Q1: Quick-Calculation Constants — Two Different Sets Provided

The spec provides two different sets of quick-calculation constants for the income tax bareme:

**First set (Section 4.2):**
```
Bracket 2: Q x 0.11 - 1,276.00
Bracket 3: Q x 0.30 - 6,897.01
Bracket 4: Q x 0.41 - 16,200.48
Bracket 5: Q x 0.45 - 23,477.16
```

**Second "verified" set (also Section 4.2):**
```
Bracket 2: Q x 0.11 - 1,276.00
Bracket 3: Q x 0.30 - 6,896.01
Bracket 4: Q x 0.41 - 16,199.48
Bracket 5: Q x 0.45 - 23,476.16
```

The second set is labeled "verified" and includes boundary verifications that check out. I plan to use the **second (verified) set** since it passes boundary checks. Please confirm this is correct.

### Q2: CET Base — Total Gross or Capped at 8x PMSS?

Section 2.2 says CET (0.14%) applies to "Total gross (T1 + T2)" and then Section 3.2 says:
> "Some interpretations apply CET only to the T1+T2 base (up to 8x PMSS)"
> "For simplicity: cet = MIN(gross_monthly, 8 * PMSS) * 0.0014"

In the worked examples (Example C, monthly gross 6,666.67), CET is calculated as:
```
CET = 6,666.67 x 0.14% = 9.33
```
This applies CET to the full gross (not capped at 8x PMSS), which matches because 6,666.67 < 8x PMSS (32,040).

**For salaries above 8x PMSS (32,040/month)**, should CET apply to:
- (a) the full gross salary (no cap), OR
- (b) MIN(gross, 8 x PMSS)?

The spec suggests (b) for simplicity, but the contribution table says "Total gross (T1 + T2)". Please clarify.

### Q3: Worked Example A — PAS Bracket Boundary

In Example A, the spec initially says net imposable of 2,050.72 "falls in bracket 2,060-2,169 = 3.5%" but then immediately corrects itself: "Actually 2,050.72 < 2,060, so it falls in bracket 1,928-2,059 = 2.9%".

The final calculation uses 2.9%, which seems correct. Just confirming this self-correction in the spec is intentional and the 2.9% is the right answer.

### Q4: Widowed Person — Parts Calculation for 3+ Children

Section 5.1 gives a table for widowed persons with children:
| Children | Parts |
|----------|-------|
| 1 | 2.5 |
| 2 | 3.0 |
| 3 | 4.0 |
| 4 | 5.0 |

But there's no general formula like there is for married/single. Should the formula for widowed (with children) be:
```
parts = 2 + 0.5 + 0.5 + (N-2) x 1.0   (same as married)
```
i.e., widowed keeps the full 2 base parts from the deceased spouse?

### Q5: Parent Isole Plafonnement — First Child Cap of 4,262 EUR

Section 6.2 says the parent isole first child half-part has a cap of 4,262 EUR. But the first child for a parent isole gives a FULL part (not a half-part) — it's described as "1.0 part" because of the bonus half-part.

So for plafonnement calculation of a parent isole with 1 child (2.0 parts, base = 1.0):
- The additional 1 part beyond base = 2 half-parts
- Is the cap 4,262 EUR for the FIRST half-part (the parent isole bonus) and 1,807 EUR for the second half-part (the child's normal half-part)?
- Or is 4,262 EUR the combined cap for both half-parts of the first child?

### Q6: Employer Contributions — Should We Show Total Employer Cost?

The spec lists employer contributions in Section 2.5, but the "Developer Implementation Notes" (Section 12.2) don't explicitly mention showing "total employer cost" as an output, though the other calculators (Ireland, Portugal) do show it.

Should we calculate and display:
- Total monthly employer cost (gross + employer contributions)?
- If yes, which employer contributions should be included? The accident du travail rate is "variable by industry" — should we use a default value, or exclude it?

### Q7: Meal Vouchers and Mutuelle — Priority for Initial Release

Section 10 describes several optional features:
- Meal vouchers (tickets restaurant)
- Mutuelle (complementary health insurance)
- Transport allowance
- 13th month salary

The spec says 13th month should be a toggle. For the **initial release**, which of these should be implemented?
- 13th month: seems clearly requested (Section 10.1)
- Meal vouchers: "optional" per spec
- Mutuelle: "can be included as an optional deduction input"
- Transport: typically not included in gross, so perhaps just informational

My recommendation is to implement **13th month** and **cadre/non-cadre toggle** for V1, and defer meal vouchers, mutuelle, and transport to V2. Does that align with expectations?

### Q8: APEC Contribution for Cadres — Rate Confirmation

Section 2.2 lists APEC at 0.024% for cadres on up to 4x PMSS. Is this the correct employee rate for 2026? Some sources show 0.024% total split 40/60 employer/employee, which would make the employee rate 0.0144%. Please confirm 0.024% is the employee-only rate.

### Q9: Non-Resident Rate — 5.50% Assurance Maladie

Section 2.2 mentions a 5.50% employee health contribution for non-residents. Should the calculator include a "non-resident" toggle, or can we defer this to a later version?

### Q10: Rounding of Annual Income Tax

Section 12.4 says annual income tax should be rounded "to nearest whole euro (as per French tax rules)." Is this a round-half-up convention, or banker's rounding? The impots.gouv.fr simulator appears to use truncation (floor) for the final tax. Please clarify.

---

**Summary:**
- **Blocking questions** (need answer before implementation): Q1, Q2
- **Important but can proceed with assumptions**: Q3, Q4, Q5, Q6, Q8, Q10
- **Scope/priority questions**: Q7, Q9

My assumptions if no answer received:
- Q1: Use the verified (second) set of constants
- Q2: Cap CET at 8x PMSS (the simpler interpretation)
- Q3: 2.9% is correct
- Q4: Widowed formula = same as married (2 base parts)
- Q5: Parent isole first child = 4,262 for the bonus half-part + 1,807 for the child's normal half-part
- Q6: Show employer cost using all rates except accident du travail
- Q8: Use 0.024% as employee APEC rate
- Q9: Defer non-resident to V2
- Q10: Use Math.round() (standard rounding to nearest euro)
