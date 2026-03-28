# Questions for Sarah — UK Calculator Implementation
**From:** David (Developer)
**Date:** 2026-03-28
**Re:** UK Income Tax Calculator — Clarifications Needed Before / During Implementation

---

## Q1 — Pension: Default Method and Salary Sacrifice UI

**Section reference:** Sarah's doc §6.3 (Relief at Source vs Net Pay), §14.5 (Salary Sacrifice)

Sarah's document describes three pension contribution methods:
1. **Net Pay Arrangement** — pension deducted before income tax (but NOT before NIC)
2. **Relief at Source (RAS)** — pension from post-tax pay; HMRC tops up to pension provider
3. **Salary Sacrifice** — reduces effective gross for BOTH income tax AND NIC

I have implemented all three as selectable options. However, I have a question about the UI default:

Sarah's document recommends defaulting to "net pay arrangement with a note." For the **salary sacrifice** display, should the UI show:
- (a) The pre-sacrifice gross as "gross salary" and sacrifice as a deduction line, or
- (b) The post-sacrifice effective gross as the headline figure (since PAYE operates on this)?

Currently implemented as (a) — showing original gross with sacrifice as a labelled deduction — as this is clearer for users who know their contract gross.

**Decision needed:** Please confirm option (a) is correct, or advise alternative presentation.

---

## Q2 — Dividend Tax: Include or Exclude from MVP?

**Section reference:** Sarah's doc §11.5 (Developer Recommendation)

Sarah's document says dividend tax "may be out of scope for the minimum viable product" and recommends adding it as an optional advanced input.

I have implemented dividend income as an optional advanced input (collapsed by default). The band-stacking logic is implemented per §11.4.

**Confirmation needed:** Is including dividend tax as an optional field acceptable? Or should it be deferred entirely to a later version?

---

## Q3 — Capital Gains Tax: Module Scope

**Section reference:** Sarah's doc §12.5 (Developer Note)

Sarah's document states CGT "is not typically included in a salary/payroll calculator" and suggests flagging it as out-of-scope or providing a separate CGT module.

I have included a CGT informational display only (shows the £3,000 AEA and the 18%/24% rates as a reference, but does NOT compute CGT on any gain). There is no CGT input field.

**Confirmation needed:** Is this the correct approach, or should CGT be excluded entirely from this version?

---

## Q4 — NIC Category Selection

**Section reference:** Sarah's doc §4.5 (Other NIC Categories)

Sarah documents multiple NIC categories (A, B, C, H, M, J, Z). The document notes: "the calculator should ideally allow category selection, or at minimum flag Category C for pension-age employees."

I have implemented:
- **Category A** as the default (standard rates)
- A **"State Pension age"** toggle which switches to Category C (zero NIC)
- I have NOT implemented Category B (married women's reduced rate — very rare, legacy election), J, Z (deferral — requires HMRC notice), H, M (employer relief only; employee rates are standard)

**Confirmation needed:** Is this subset sufficient? Should Category B (reduced rate 1.85% PT–UEL) be included? It is theoretically still available but extremely rare in practice.

---

## Q5 — Tax Code Input: Which Special Codes to Support

**Section reference:** Sarah's doc §8.2 (Suffix Letters)

I have implemented tax code parsing for:
- Standard numeric codes (e.g., 1257L) — extracts annual free pay as numeric × 10
- S prefix (Scottish rates)
- M suffix (Marriage Allowance receiver — PA = £13,830)
- N suffix (Marriage Allowance transferred — PA = £11,310)
- BR (all income taxed at 20%, no PA)
- D0 (all income at 40%, no PA)
- D1 (all income at 45%, no PA)
- 0T (zero PA, tax at all bands)
- NT (no tax)
- K codes (negative allowance — adds to taxable pay)

I have NOT implemented:
- W1/M1 suffix — the document explains this is a period-basis flag irrelevant to an annual calculator (§7.3 and §7.4); an annual calculator always uses the cumulative method equivalent
- C prefix (Welsh — same rates as England per §14.7, so it would make no practical difference to the output)

**Confirmation needed:** Is this tax code coverage sufficient for launch? Any codes I should prioritise adding?

---

## Q6 — Marriage Allowance: Scottish Higher Rate Threshold

**Section reference:** Sarah's doc §9.2 (Eligibility), §14.9 (MA and Scottish Taxpayers)

Sarah's document notes (§14.9): "Scottish taxpayers can receive Marriage Allowance but the income limit for the receiving partner is £43,662 (Scotland's higher rate threshold), not £50,270."

I have implemented this correctly: when Scotland is selected, the Marriage Allowance eligibility check uses £43,662 rather than £50,270 for the receiving partner cap. However, the current implementation only warns the user if they appear to be a higher rate taxpayer — it does not hard-block the option, as it's the user's responsibility to confirm eligibility.

**Confirmation needed:** Should the calculator hard-block Marriage Allowance if the salary exceeds the Scottish threshold, or just display a warning?

---

## Q7 — Pension Annual Allowance Warning at £60,000

**Section reference:** Sarah's doc §6.5 (Annual Allowance)

Sarah documents the pension annual allowance is £60,000 for 2025/26. The calculator allows free-text percentage entry for pension contributions.

At high salaries (e.g., £200,000 at 40% = £80,000 pension), the contribution exceeds the annual allowance. I currently display a warning when the calculated annual pension contribution exceeds £60,000, but do NOT cap the calculation.

**Confirmation needed:** Should the calculator cap pension contributions at £60,000, or just warn and allow the user to override? (Some users may have carry-forward allowance from prior years, so capping without explanation could be misleading.)

---

## Q8 — Blind Person's Allowance + PA Taper Interaction

**Section reference:** Sarah's doc §10.3

Sarah's document states: "The taper at £100,000 applies to the combined effective personal allowance. For a registered blind individual, their effective PA = £15,700, and the taper would zero out at £100,000 + (£15,700 × 2) = £131,400."

I have implemented this correctly in code. However, I want to confirm: when both BPA and Marriage Allowance are claimed simultaneously, is the combined effective PA:
- £12,570 (standard) + £3,130 (BPA) + £1,260 (MA transfer) = £16,960

And would the taper zero-out point therefore be £100,000 + (£16,960 × 2) = £133,920?

**Confirmation needed:** Is this the correct combined calculation, or are there ordering rules (e.g., BPA is applied after the taper calculation)?

---

## Q9 — Postgraduate Loan: Can It Stack With Undergraduate Plans?

**Section reference:** Sarah's doc §5.3

Sarah confirms: "a borrower can have both an undergraduate plan AND a Postgraduate Loan running concurrently" and "both deductions are taken independently."

I have implemented this correctly. Just confirming: should the calculator UI allow the user to select BOTH an undergraduate plan (1/2/4/5) AND the postgraduate loan simultaneously? Currently the UI does this via a separate toggle for the postgraduate loan alongside the plan selector.

**Confirmation needed:** Correct implementation?

---

## Q10 — Display: Annual vs Monthly Net

The Portugal calculator shows monthly figures as the primary view. For UK users, should this also default to:
- (a) Monthly (salary / 12 basis), or
- (b) Annual (the natural view for UK PAYE which operates on annual income)?

I have implemented annual as primary with monthly prominently shown below. This aligns with UK payslip thinking (PAYE is annual, payslips show monthly).

**Confirmation needed:** Is annual primary the right default, or do you prefer monthly as the headline?

---

*End of questions. Implementation is complete pending these clarifications. All tax logic is implemented and commented per Sarah's research document.*

*— David*
