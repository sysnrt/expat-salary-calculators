# Answers for David — UK Calculator Implementation
**From:** Sarah (Taxation Expert)
**Date:** 2026-03-28
**Re:** UK Income Tax Calculator — Clarifications (Q1–Q10)

---

## Q1 — Pension: Salary Sacrifice Display

**DECISION: Confirm option (a) — show original contract gross with sacrifice as a labelled deduction.**

**Justification:**

Option (a) is correct. A user's "gross salary" is the figure in their employment contract — the amount their employer agreed to pay them. Salary sacrifice is a contractual arrangement that reduces the amount PAYE operates on, but the user's frame of reference is always their pre-sacrifice gross. Showing the post-sacrifice figure as the headline would be confusing to anyone who knows their contract salary but does not understand what salary sacrifice does mechanically.

HMRC themselves describe salary sacrifice as a "contractual reduction" to the gross (see HMRC Employment Income Manual EIM42750). The pre-sacrifice gross is the starting point; the sacrifice appears as a named reduction line. This mirrors how payslips are typically presented for salary sacrifice schemes.

**Implementation note:** The deduction line should be labelled clearly, e.g. "Salary sacrifice (pension)" and the post-sacrifice figure (the effective gross on which PAYE and NIC are calculated) should also be shown as a sub-total before tax. This makes the NIC saving from salary sacrifice visible to the user, which is one of the primary reasons employees choose that method.

---

## Q2 — Dividend Tax: Optional Field in MVP

**DECISION: YES — including dividend tax as a collapsed optional advanced input is the correct approach.**

**Justification:**

My research document (§11.5) explicitly states dividend tax is "out of scope for the minimum viable product" but recommends adding it as an optional advanced input if it is included at all. Your implementation matches this recommendation precisely: collapsed by default, optional, with correct band-stacking logic per §11.4.

This is the right balance. The majority of users of a salary/PAYE calculator will have no dividend income. Hiding it by default avoids cluttering the primary UI. Making it available serves the meaningful minority who have both employment income and dividends — a common scenario for contractor-directors and those with investment portfolios.

**Implementation note:** Ensure the collapsed section is clearly labelled (e.g. "Dividend income (optional)") and that when expanded it carries a brief explanation that dividends are taxed at special rates and sit on top of employment income. The band-stacking logic must not be omitted — dividend tax cannot be calculated correctly without knowing where dividends land relative to the basic/higher/additional rate bands.

---

## Q3 — Capital Gains Tax: Informational Display Only

**DECISION: YES — an informational-only CGT display is the correct approach. Do NOT add CGT computation.**

**Justification:**

CGT is not a payroll deduction. It is reported and paid via Self Assessment on disposal of assets. Including it in a salary/PAYE calculator would be misleading — users could incorrectly conflate their employment income tax position with their CGT position, which is calculated entirely separately and depends on asset disposal dates, acquisition costs, reliefs (BADR, PPR, etc.) and other factors beyond salary.

Your approach — showing the £3,000 AEA and the 18%/24% rates as reference information only, with no inputs or computed CGT liability — is exactly right. It is genuinely useful for a user to see these figures in context (e.g. to understand the interaction between their income and which CGT rate they would face), without the calculator purporting to calculate a tax it cannot correctly model from salary inputs alone.

**Implementation note:** The informational display should carry a clear note such as: "Capital Gains Tax is not a payroll deduction and is not included in your take-home calculation. Gains are reported via Self Assessment. See HMRC guidance: https://www.gov.uk/capital-gains-tax/rates"

---

## Q4 — NIC Category Selection: Subset Sufficient?

**DECISION: YES — your implementation is sufficient for launch. Category B should NOT be added at this stage.**

**Justification:**

Your implementation covers:
- **Category A** (default) — covers the vast majority of employees
- **Category C** (State Pension age toggle) — essential, as these employees pay zero NIC and the difference is material

The omitted categories are correct omissions for a salary calculator:

- **Category B** (married women's reduced rate election): This is a genuine legacy rate — the election was closed to new entrants in 1977. The number of women still paying under it is a small and shrinking cohort of employees who started before 1977. My research document (§4.5) lists it for completeness but it is not a realistic user selection. Do not add it at MVP.
- **Categories J and Z** (deferral): These require a formal HMRC CA2700 deferral notice. A user would not self-identify their category — their employer is told by HMRC. Not appropriate for a self-service calculator.
- **Categories H and M** (apprentices/under-21): The employee rates are standard (same as Category A). These only differ for the employer. Your calculator is employee-facing, so there is no computational difference to model.

**If you add Category B in a future version**, the rate is 1.85% between PT and UEL (vs. 8% for Category A), with 2% above UEL the same as Category A. Use HMRC NIC table B for the precise rates (https://www.gov.uk/national-insurance-rates-letters).

---

## Q5 — Tax Code Coverage: Sufficient for Launch?

**DECISION: YES — your tax code coverage is sufficient. W1/M1 and C prefix are correctly excluded.**

**Justification:**

Your implemented set covers every code a user is realistically likely to self-report:

- Standard numeric codes (1257L etc.) — the default for virtually all employees
- S prefix — essential for Scottish taxpayers
- M and N suffix — Marriage Allowance, correctly implemented
- BR, D0, D1 — emergency/secondary employment codes, common enough to warrant inclusion
- 0T — zero allowance, used in various scenarios
- NT — rare but valid
- K codes — needed for anyone with company benefits or state pension alongside employment

**On W1/M1:** Your reasoning is correct. An annual salary calculator operates on the cumulative method by definition — it projects a full year's liability from an annual salary input. W1/M1 is a per-period flag that tells a payroll system to treat each month as independent. It has no meaningful equivalent in an annual calculator. Do not implement it; your existing note explaining this is sufficient.

**On C prefix (Welsh):** Your reasoning is also correct. Welsh income tax rates are identical to England rates for 2025/26 (§14.7). A C prefix would produce exactly the same output as the equivalent L/M/N code. However, I recommend adding a placeholder for it — not as a separate computation, but as accepted input that is silently mapped to the England/Wales rates with a note: "Welsh income tax rates are the same as England for 2025/26." This future-proofs the code for any year when Wales diverges.

**One gap to be aware of:** The SD0 and SD1 codes (Scottish higher and additional rate with no personal allowance) are not mentioned. If you are parsing the S prefix generically and then applying the parsed code (D0, D1, BR) without the Scottish rates, verify that SD0 is correctly applying Scottish 42% (not England 40%) and SD1 is applying Scottish 48% (not England 45%).

---

## Q6 — Marriage Allowance: Warn or Hard-Block at Scottish Threshold?

**DECISION: WARN only — do NOT hard-block. Your current implementation is correct.**

**Justification:**

The calculator cannot verify the user's eligibility with certainty. A salary calculator inputs a gross salary figure, but Marriage Allowance eligibility depends on the receiving partner's **adjusted net income** (i.e. after pension contributions and other adjustments), not their gross salary. A Scottish employee on £45,000 gross with a large net pay pension contribution could have an adjusted net income below £43,662, making them legitimately eligible.

Blocking based on gross salary would produce false negatives — incorrectly preventing valid claims. This would mislead the user and is not defensible from a regulatory standpoint.

The warning approach is correct: display a message such as "Your gross salary exceeds the Scottish higher rate threshold of £43,662. Marriage Allowance eligibility requires your adjusted net income to be at or below this threshold. Please verify your eligibility at https://www.gov.uk/marriage-allowance before relying on this calculation."

**Source:** HMRC Marriage Allowance guidance, https://www.gov.uk/marriage-allowance (eligibility conditions — "your partner's income must be over their Personal Allowance but under the higher rate Income Tax threshold").

---

## Q7 — Pension Annual Allowance: Warn or Cap at £60,000?

**DECISION: WARN only — do NOT cap. Your current implementation is correct.**

**Justification:**

Your reasoning is correct. The £60,000 annual allowance is a tax relief limit, not a contribution limit. Individuals with unused allowance from the previous three tax years can carry it forward under HMRC's carry-forward rules (subject to conditions). Capping the calculator at £60,000 would incorrectly understate the take-home pay of a user legitimately contributing above this level under carry-forward.

Furthermore, the correct adjusted figure for the annual allowance test is the individual's total pension input amount across all pension schemes — something the calculator cannot know from salary and contribution rate alone. The carry-forward calculation requires knowledge of three prior years' allowances and inputs, which is entirely outside the scope of a salary calculator.

**Implementation note:** The warning should state clearly: "Your calculated pension contribution (£X) exceeds the standard annual allowance of £60,000. Tax relief above this amount is normally subject to an Annual Allowance Charge unless carry-forward from previous years applies. See HMRC guidance: https://www.gov.uk/guidance/pension-annual-allowance — please verify your position with a financial adviser." Do not cap; do not block; do warn.

---

## Q8 — Blind Person's Allowance + Marriage Allowance: Combined Taper

**DECISION: YES — your combined calculation is correct. £100,000 + (£16,960 × 2) = £133,920 is the correct taper zero-out point.**

**Justification:**

There are no ordering rules that separate BPA from MA in the taper calculation. The taper operates on the total effective personal allowance — the full tax-free amount available to that individual. Both BPA and Marriage Allowance adjustment are simply additive to the PA before the taper formula is applied.

For the receiving partner with both BPA and MA:
```
effective_PA = £12,570 (standard) + £3,130 (BPA) + £1,260 (MA received) = £16,960
taper_zero_out = £100,000 + (£16,960 × 2) = £133,920
```

At exactly £133,920 adjusted net income, the effective PA is zero:
```
reduction = floor((133920 - 100000) / 2) = floor(33920 / 2) = 16960
effective_PA_after_taper = 16960 - 16960 = 0   ✓
```

**Source:** HMRC Income Tax Personal Allowance taper rules, https://www.gov.uk/income-tax-rates and HMRC Blind Person's Allowance, https://www.gov.uk/blind-persons-allowance. Neither source creates a sequencing distinction between different PA components for taper purposes.

**Important edge case:** The Marriage Allowance transfer is only valid if the receiving partner is a basic rate taxpayer (income below £50,270, or £43,662 for Scotland). A user with income in the £100,000+ taper zone would not be eligible to receive Marriage Allowance in the first place — they are a higher rate taxpayer. Your implementation should prevent or warn when both MA receipt and a taper-zone salary are simultaneously selected, since that combination is ineligible by definition. This is a separate issue from the combined BPA + MA arithmetic, which is correct as implemented.

---

## Q9 — Postgraduate Loan Stacking with Undergraduate Plans

**DECISION: YES — your implementation is correct. The separate undergraduate plan selector plus postgraduate loan toggle is the correct UI pattern.**

**Justification:**

As documented in §5.3 of my research document, Plans 1, 2, 4, and 5 are mutually exclusive (a borrower is on exactly one undergraduate plan), but the Postgraduate Loan runs independently and simultaneously with whichever undergraduate plan applies. Both deductions are calculated independently on gross income and do not interact.

Your UI correctly models this: one selector for the undergraduate plan (selecting exactly one of Plans 1/2/4/5, or none) plus a separate toggle for the Postgraduate Loan. This mirrors the actual loan structure.

**Implementation note:** One clarification on the plan selector — "None" must be a valid selection (a user may have no student loan at all, or may have finished repaying). Ensure the plan selector does not default to a plan without the user actively choosing one. Defaulting to Plan 2 would over-calculate deductions for the many users who have no loan.

**Source:** https://www.gov.uk/repaying-your-student-loan/what-you-pay

---

## Q10 — Display: Annual vs Monthly as Primary View

**DECISION: Annual primary with monthly shown below is correct for a UK audience.**

**Justification:**

UK PAYE is an annual system. Gross salary is stated and thought of in annual terms (the job advertisement, the employment contract, the P60 — all annual). UK employees think about and describe their earnings annually. The phrase "I earn £45,000" is how a UK employee describes their salary; Portuguese and other European employees are more likely to think in monthly terms.

Your implementation (annual primary, monthly shown prominently below) is consistent with how HMRC presents tax liability (on an annual basis) and how UK payroll software typically reports. It also avoids the confusion caused by the UK having 12 monthly payments but annual thresholds — a monthly-primary display requires the user to mentally reconstruct the annual picture to check the income tax calculation.

**Implementation note:** Monthly figures should be shown as annual ÷ 12 (i.e. equal monthly amounts), which is the standard PAYE assumption. If the calculator also supports weekly pay, weekly = annual ÷ 52. Do not use actual calendar months (which vary) — HMRC PAYE uses standardised monthly/weekly periods.

---

## Summary Table

| Q | Decision | Action Required |
|---|----------|----------------|
| Q1 | Confirm option (a) — pre-sacrifice gross as headline | Add post-sacrifice sub-total line to make NIC saving visible |
| Q2 | Include dividend tax as optional collapsed field — correct | Ensure band-stacking logic is present; add explanatory label |
| Q3 | Informational CGT display only — correct | Add a note directing users to HMRC CGT guidance |
| Q4 | Category A + C sufficient for launch; omit B, J, Z, H, M | No change needed; note B rate if adding in future |
| Q5 | Tax code coverage sufficient; W1/M1 and C correctly excluded | Add placeholder for C prefix; verify SD0/SD1 Scottish rates |
| Q6 | Warn only — do not hard-block MA at Scottish threshold | Warning text should reference adjusted net income, not gross |
| Q7 | Warn only — do not cap pension at £60,000 | Warning must reference carry-forward and advise professional advice |
| Q8 | Combined BPA + MA taper calculation correct | Add validation: MA receipt + taper-zone salary is ineligible combination |
| Q9 | Separate plan selector + postgraduate toggle — correct | Ensure "None" is valid/default selection for plan selector |
| Q10 | Annual primary, monthly secondary — correct for UK | Monthly = annual / 12; flag this assumption to the user |

---

*— Sarah (Taxation Expert Agent)*
*All HMRC source references verified against official publications as of 2026-03-28.*
*This document does not constitute professional tax or legal advice.*
