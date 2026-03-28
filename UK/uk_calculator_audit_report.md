# AUDIT REPORT — UK Income Tax Calculator (uk.js)

**Auditor:** John (IT Auditor)
**Date:** 2026-03-28
**File audited:** `countries/uk.js`
**Tax year:** 2025/26 (6 April 2025 – 5 April 2026)
**Reference documents:** `UK/uk_income_tax_research.md` (Sarah, 2026-03-28), `UK/answers_from_sarah.md` (Sarah, 2026-03-28)
**Integration files reviewed:** `countries/registry.js`, `components/EuropeMap.js`, `components/SalaryInput.js`, `components/BreakdownTable.js`

**Status: REQUIRES FIXES**

---

## SUMMARY

The UK income tax calculator (`uk.js`) is a well-structured and generally thorough implementation covering income tax, NIC, student loans, pension contributions, Marriage Allowance, Blind Person's Allowance, dividend tax, and tax code parsing. The vast majority of tax calculation logic is correct. All constants (bands, rates, thresholds) match the reference documentation exactly. The three primary worked examples from Sarah's research verify correctly with one important exception noted below.

Two calculation bugs were found, both in `computePersonalAllowance`. The first is a Critical defect: an early-return guard at `adjustedNetIncome >= ADDITIONAL_RATE_THRESHOLD` causes the function to return zero for incomes between £125,140 and the actual BPA/MA taper zero-out points, incorrectly overstating tax for a specific category of taxpayers. The second is a High issue: the tax code parser assigns English flat rates to the Scottish SD0 and SD1 codes, undertaxing Scottish secondary employment taxpayers by up to £3,000/year. Two Medium issues were also found relating to a missing MA-in-taper-zone ineligibility warning and an inaccurate marginal rate note for Scottish taper zone taxpayers. Additionally, Sarah's worked Example 2 in the research document contains an arithmetic error (the code's computation is correct; the research document is wrong).

---

## ISSUES FOUND

---

### Issue #1

- **Severity:** Critical
- **Location:** `computePersonalAllowance()`, lines 258–263
- **Description:** The function contains an early-return guard at `if (adjustedNetIncome >= ADDITIONAL_RATE_THRESHOLD) return 0`. This guard was clearly intended to short-circuit the standard case where the Personal Allowance has been fully withdrawn (at £125,140 for a standard taxpayer). However, when Blind Person's Allowance (BPA) and/or Marriage Allowance (MA) are active, the effective personal allowance is larger than the standard £12,570, and the correct taper zero-out point is higher than £125,140. The early return fires before the formula can run, forcing the PA to zero too soon.

  Specific confirmed impacts:
  - **BPA only (£3,130):** Correct zero-out is at £131,400 (`£100,000 + (£15,700 × 2)`). The code returns PA = 0 for all income ≥ £125,140, even though the correct PA at £125,140 should be £3,130, at £128,000 should be £1,700, and so on. The taxpayer is overtaxed by up to £1,408/year in the £125,140–£131,400 range.
  - **BPA + MA combined (£16,960 effective PA):** Per Sarah's Q8 answer, correct zero-out is at £133,920. The code returns 0 from £125,140 onwards, overtaxing by up to £3,392/year in the £125,140–£133,920 range.
  - The standard case (no BPA, no MA) is **unaffected**: `Math.max(0, 12570 - reduction)` naturally reaches zero at £125,140 and the early return only coincidentally fires at the right boundary.

- **Impact:** Any BPA or MA receiver with income above £125,140 will see an inflated income tax figure. For a registered blind taxpayer earning £128,000, the annual income tax overstatement is approximately £680. The affected population is small (BPA claimants are rare) but the calculation is materially wrong for them. This also contradicts the documented correctness claim in the code comment at lines 260–264 which acknowledges BPA taper runs higher but asserts `Math.max handles it` — that reasoning is incorrect because the early return fires before Math.max can act.

- **Recommendation:** Remove the early return at `>= ADDITIONAL_RATE_THRESHOLD` entirely. The formula's `Math.max(0, basePA - reduction)` already handles the clamp to zero correctly for all cases. The corrected function body after the `<= PA_TAPER_START` check should be:

  ```javascript
  const reduction = Math.floor((adjustedNetIncome - PA_TAPER_START) / 2);
  return Math.max(0, basePA - reduction);
  ```

  This single change fixes all BPA and BPA+MA cases while leaving the standard case output identical.

---

### Issue #2

- **Severity:** High
- **Location:** `parseTaxCode()`, lines 401–413
- **Description:** The SD0 and SD1 tax codes are assigned incorrect flat rates. The code assigns `HIGHER_RATE` (40%) to SD0 and `ADDITIONAL_RATE` (45%) to SD1. Both are wrong. Per Sarah's research document (§2.1, §8.2) and Sarah's Q5 answer:
  - SD0 is the Scottish equivalent of D0 — it taxes all income at the Scottish **Higher** rate, which is 42% (not 40%).
  - SD1 is the Scottish equivalent of D1 — it taxes all income at the Scottish **Top** rate, which is 48% (not 45%).

  The code correctly sets `isScottish = true` for both codes and correctly strips the S prefix when routing to the Scottish rate function, but the `flatRate` is set before the `computeScottishIncomeTax` path is reached. The flat-rate branch (`parsed.flatRate !== null`) takes priority and uses the wrong rates.

- **Impact:** Scottish secondary employment taxpayers with SD0 or SD1 codes will be undertaxed by 2 percentage points (SD0) or 3 percentage points (SD1) respectively on their entire income. At £100,000 gross this represents an understatement of £2,000/year (SD0) or £3,000/year (SD1). Users relying on these calculations could underprovide for their tax liability.

- **Recommendation:** In `parseTaxCode()`, change the SD0 and SD1 flat rate assignments:

  ```javascript
  // SD0: Scottish higher rate (42%), not England higher rate (40%)
  if (code === 'D0' || code === 'CD0') {
    result.flatRate = HIGHER_RATE;
    result.effectivePA = 0;
    return result;
  }
  if (code === 'SD0') {
    result.flatRate = SCOT_HIGHER_RATE;  // 42%, not 40%
    result.effectivePA = 0;
    result.isScottish = true;
    return result;
  }
  // SD1: Scottish top rate (48%), not England additional rate (45%)
  if (code === 'D1' || code === 'CD1') {
    result.flatRate = ADDITIONAL_RATE;
    result.effectivePA = 0;
    return result;
  }
  if (code === 'SD1') {
    result.flatRate = SCOT_TOP_RATE;  // 48%, not 45%
    result.effectivePA = 0;
    result.isScottish = true;
    return result;
  }
  ```

---

### Issue #3

- **Severity:** Medium
- **Location:** `getBreakdownRows()` — no location; feature is absent
- **Description:** There is no warning emitted when the user simultaneously enables `marriageAllowanceReceiver = true` and has income in the taper zone (above £100,000). Sarah's Q8 answer explicitly requires this:

  > "Your implementation should prevent or warn when both MA receipt and a taper-zone salary are simultaneously selected, since that combination is ineligible by definition."

  The reason: Marriage Allowance may only be received by a basic rate taxpayer. A taxpayer in the taper zone (£100,000+) is a higher rate taxpayer and is therefore ineligible to receive the MA transfer. The code currently calculates the MA-augmented PA silently even when the combination is invalid.

  Note: the constant `SCOT_MARRIAGE_ALLOWANCE_CAP = 43662` is defined at line 79 and the code comment at line 77–79 documents the rule, but neither the computation nor the display layer uses this constant to emit any warning.

- **Impact:** Users could incorrectly model a £252/year tax saving that HMRC would not permit. The overtaxed figure is modest individually but the silent failure to flag the invalid input is a quality and trust issue.

- **Recommendation:** In `getBreakdownRows()`, after the taper zone note row, add a conditional warning:

  ```javascript
  if (r.inTaperZone && opts.marriageAllowanceReceiver) {
    rows.push({
      label: 'Warning: Marriage Allowance cannot be received by a higher rate taxpayer. Income above £100,000 (or £43,662 for Scottish taxpayers) makes you ineligible. Remove this option or verify your adjusted net income is at or below the threshold.',
      amount: null,
      type: 'note',
    });
  }
  ```

  Alternatively, `computeBreakdown` can expose a `maIneligibilityWarning` boolean in the returned object, and `getBreakdownRows` renders it conditionally.

---

### Issue #4

- **Severity:** Medium
- **Location:** `getBreakdownRows()`, lines 894–900; `computeBreakdown()`, line 676
- **Description:** The taper zone warning note reads `"60% effective marginal rate"` for all taper-zone taxpayers regardless of residency. For Scottish taxpayers in the taper zone, the correct effective marginal rate is approximately **67.5%**, not 60%, because the Advanced Rate (45%) rather than the English higher rate (40%) applies in the taper zone.

  Sarah's research document §14.3 explicitly documents this distinction:

  > "In Scotland, income in the taper zone (£100k–£125,140) is taxed at the Advanced Rate of 45% (not 40%). Personal allowance withdrawal at £1 per £2 = 22.5% hidden marginal uplift. Effective Scottish marginal rate in taper zone = 67.5%."

  The `inTaperZone` flag (line 676) is correctly set for all taxpayers, but it does not distinguish Scottish from English residency, and the message hardcodes 60%.

- **Impact:** Scottish taxpayers in the taper zone are shown an inaccurate marginal rate figure. This is a display error, not a calculation error (the underlying computation correctly applies Scottish rates), but it could mislead a Scottish taxpayer assessing the tax planning implications of taking additional income.

- **Recommendation:** Make the warning message residency-aware:

  ```javascript
  if (r.inTaperZone) {
    const taperMarginalRate = r.scottish ? '67.5%' : '60%';
    rows.push({
      label: `Warning: PA taper active (income £100k–£125,140 — ${taperMarginalRate} effective marginal income tax rate)`,
      amount: null,
      type: 'note',
    });
  }
  ```

---

### Issue #5

- **Severity:** Low
- **Location:** `computeBreakdown()`, lines 469–488; `computeBreakdown()` generally
- **Description:** No input validation is performed on the `gross` parameter. The function accepts negative values, `NaN`, `null`, `undefined`, and non-numeric strings without error. While the `Number()` coercion used for `dividendIncome` and `pensionPct` does provide partial safety for those specific fields, `gross` itself is used raw. A negative gross value propagates to `annualGross = gross * 12`, which flows into the pension, NIC, and income tax calculations unchecked. `computeNIC` and `computeEnglandWalesNITax` do return 0 for negative inputs (their `<= 0` guards protect them), but `annualTakeHome` can become nonsensical for extreme inputs, and `reverseFromNet` uses `targetNet * 4` as an initial upper bound which would be wrong for a zero or negative target.

- **Impact:** Unlikely to affect typical usage (the slider and input fields constrain values in the UI), but a future API caller or test harness passing malformed data would receive silently wrong output with no error surface.

- **Recommendation:** Add a guard at the top of `computeBreakdown`:

  ```javascript
  function computeBreakdown(gross, opts) {
    if (!isFinite(gross) || gross < 0) {
      throw new RangeError(`computeBreakdown: gross must be a non-negative finite number, got ${gross}`);
    }
    // ... rest of function
  ```

  At minimum, normalise with `const safeGross = Math.max(0, Number(gross) || 0)` if throwing is not acceptable.

---

### Issue #6

- **Severity:** Low
- **Location:** `computeBreakdown()`, lines 542–566
- **Description:** When a custom tax code is in use, `parseTaxCode` is called twice: once at line 525 for the PA value, and again at lines 543/549 for the rate/Scottish flag. This double-parse is harmless but wasteful and creates a subtle risk: if `parseTaxCode` has any state-dependent or input-dependent side effects in a future refactor, the two calls could diverge. The parsed result from line 525 is already in scope and should be reused.

- **Impact:** No current functional impact. Maintainability risk.

- **Recommendation:** Hoist `parseTaxCode` to a single call before the `effectivePA` block and reuse the `parsed` object in the income tax branch:

  ```javascript
  const parsed = (useCustomTaxCode && customTaxCode)
    ? parseTaxCode(customTaxCode, scottish)
    : null;
  effectivePA = parsed ? (parsed.effectivePA !== null ? parsed.effectivePA : PERSONAL_ALLOWANCE) : computePersonalAllowance(...);
  // then use `parsed` in the income tax branch below
  ```

---

### Issue #7

- **Severity:** Low
- **Location:** `defaultOptions()`, line 814; comments in pension section
- **Description:** The default `pensionMethod` is `'netPay'` with `pensionPct` defaulting to 5%. This means every new user who visits the UK calculator will see their salary calculated with a 5% net pay pension deduction applied, which reduces their income tax figure. Users who have no pension or a different percentage will see an immediately incorrect result until they adjust the options.

  Sarah's Q6 guidance (auto-enrolment context) does confirm that net pay arrangement is the most common scheme for large employers. However, the auto-enrolment minimum is a floor — many employees contribute different amounts. A user who does not change the default will see a take-home figure that assumes a pension they may not have.

- **Impact:** First-impression accuracy: users without a pension, or on relief at source, or contributing at a different rate, will see a misleading headline figure before they have touched any options. While not a tax error per se, it undermines user trust and is contrary to Sarah's Q9 note: "Ensure the plan selector does not default to a plan without the user actively choosing one."

- **Recommendation:** Default `pensionMethod` to `'none'` and `pensionPct` to `0`. If the design intent is to prompt pension entry, consider showing the pension row as the first suggested option to configure rather than pre-populating it. The pension section is shown/hidden by the `showWhen` condition on `pensionPct`, which correctly gates on `pensionMethod !== 'none'`, so changing the default to `'none'` would cleanly suppress the pension contribution display for new users.

---

### Issue #8

- **Severity:** Informational
- **Location:** `UK/uk_income_tax_research.md`, Example 2 (§13, lines ~793–813)
- **Description:** Sarah's worked Example 2 (£120,000 salary, no options) contains an arithmetic error in the income tax calculation. Sarah's example shows:

  > `income_tax = (37700 * 0.20) + (79730 * 0.40) = 7540 + 31892 = £39,432`

  This is incorrect. At £120,000 gross with a tapered PA of £2,570, taxable income is £117,430. The additional rate threshold in taxable income terms is £112,570 (= £125,140 − £12,570). Since £117,430 > £112,570, a slice of £4,860 falls in the additional rate band and is taxed at 45%, not 40%. The correct calculation is:

  ```
  Basic rate band    : £37,700 × 20% = £7,540.00
  Higher rate band   : £74,870 × 40% = £29,948.00
  Additional rate    :  £4,860 × 45% =  £2,187.00
  Income tax total   :               = £39,675.00
  ```

  The **code is correct**. The code's `computeEnglandWalesNITax` correctly applies the additional rate to the £4,860 slice. Sarah's example missed this band. The downstream take-home figure in Sarah's example (£76,157.40) is also wrong as a result.

- **Impact:** The code produces the right number. However, a developer or reviewer cross-checking the code against Sarah's example would incorrectly conclude the code has a bug. This creates a future maintenance trap.

- **Recommendation:** Flag this error to Sarah for correction in the research document. The corrected Example 2 take-home figures are:
  - Annual income tax: **£39,675.00** (not £39,432.00)
  - Annual NIC: £4,410.60 (unchanged — NIC on full £120,000 is correct)
  - Annual take-home: **£75,914.40** (not £76,157.40)
  - Monthly take-home: **£6,326.20** (not £6,346.45)

---

### Issue #9

- **Severity:** Informational
- **Location:** Lines 617–624 — employer NIC block with inline comment
- **Description:** The code includes an inline comment directed at this auditor: `"NOTE TO JOHN: These employer NIC rates were added based on Sarah's reference to HMRC employer thresholds. Q: Should we verify employer NIC rate 15% vs 13.8%?"`. The employer NIC rate of 15% from April 2025 (with Secondary Threshold reduced to £5,000) is consistent with the Autumn Budget 2024 announcement and is correct for 2025/26. The previous rate was 13.8% with a £9,100 ST. The current implementation is accurate.

  However, this comment should not remain in production code. It is a development-time note that should either be resolved with a source citation or removed.

- **Impact:** No calculation impact. Code cleanliness issue.

- **Recommendation:** Replace the comment with a proper source citation:

  ```javascript
  // Employer NIC rate: 15% from 6 April 2025 (increased from 13.8%; ST reduced from £9,100 to £5,000)
  // Source: HMRC Autumn Budget 2024; https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026
  ```

---

### Issue #10

- **Severity:** Informational
- **Location:** `computePersonalAllowance()`, lines 258–264
- **Description:** The comment block at lines 260–264 contains a reasoning error that, while the code happens to work for the standard case, documents incorrect logic:

  > `// Note: with BPA, the actual zero point is higher — but HMRC still tapers only the standard PA portion to zero, BPA is removed separately. Sarah §10.3 shows the BPA taper zero-out is at £100,000 + (£15,700 × 2) = £131,400.`

  This comment is partially correct (£131,400 is the correct BPA-only zero-out) but then concludes: `// For clarity, we let the formula run and clamp at 0 (Math.max handles it).` This claim is factually wrong — the early return at line 259 prevents `Math.max` from ever running for BPA/MA cases above £125,140. This comment appears to have been written assuming the early return was not there, or was written to justify a design that is actually buggy (as documented in Issue #1).

- **Impact:** Misleading comment that contradicts the code's actual behaviour. Risk that a future developer reads the comment, trusts its reasoning, and does not fix Issue #1.

- **Recommendation:** After fixing Issue #1 (removing the early return), update this comment to accurately describe the corrected behaviour.

---

## EDGE CASE TEST RESULTS

All calculations were verified by replicating the exact function logic in Python. The NIC computation, Scottish income tax, dividend tax, and student loan functions all pass boundary and standard tests.

| Test Case | Input | Expected Output | Actual Output | Pass/Fail |
|-----------|-------|-----------------|---------------|-----------|
| Zero income (England) | gross=0, no options | incomeTax=0, NIC=0, takeHome=0 | incomeTax=0, NIC=0 | Pass |
| Exactly at PT (NIC) | gross=12,570 | NIC=0 | NIC=0 | Pass |
| One above PT (NIC) | gross=12,571 | NIC=0.08 | NIC=0.08 | Pass |
| Exactly at UEL (NIC) | gross=50,270 | NIC=3,016.00 | NIC=3,016.00 | Pass |
| One above UEL (NIC) | gross=50,271 | NIC=3,016.02 | NIC=3,016.02 | Pass |
| Taper boundary | gross=125,139, no BPA/MA | PA=1 | PA=1 | Pass |
| Taper boundary | gross=125,140, no BPA/MA | PA=0 | PA=0 | Pass |
| Above threshold | gross=150,000 | PA=0, additionalBand applied | Correct | Pass |
| BPA taper — at 125,140 | gross=125,140, BPA=true | PA should be 3,130 | PA=0 (BUG) | **FAIL** |
| BPA taper — at 128,000 | gross=128,000, BPA=true | PA should be 1,700 | PA=0 (BUG) | **FAIL** |
| BPA taper — zero-out at 131,400 | gross=131,400, BPA=true | PA=0 | PA=0 | Pass |
| BPA+MA taper — at 133,919 | gross=133,919, BPA+MA | PA should be 1 | PA=0 (BUG) | **FAIL** |
| BPA+MA taper — zero-out at 133,920 | gross=133,920, BPA+MA | PA=0 | PA=0 | Pass |
| Scottish taper zero-out | gross=125,140, Scottish | PA=0 | PA=0 | Pass |
| SD0 rate | code=SD0, gross=100,000 | income tax=42,000 | income tax=40,000 (BUG) | **FAIL** |
| SD1 rate | code=SD1, gross=100,000 | income tax=48,000 | income tax=45,000 (BUG) | **FAIL** |
| Dividend allowance boundary | dividends=500 | divTax=0 | divTax=0 | Pass |
| Dividend allowance +£1 | dividends=501 | divTax=0.0875 | divTax=0.0875 | Pass |
| Dividend band stacking | salary=49,770, divs=10,000 | basic+higher split correct | Correct | Pass |
| Student loan Plan 2 boundary | gross=28,470 | slRepayment=0 | slRepayment=0 | Pass |
| Student loan Plan 2 above | gross=28,471 | slRepayment=0.09 | slRepayment=0.09 | Pass |
| Salary sacrifice NIC base | gross=50,000, 10% sacrifice | nicBase=45,000 | nicBase=45,000 | Pass |
| Net pay NIC base | gross=50,000, 10% net pay | nicBase=50,000 | nicBase=50,000 | Pass |
| State Pension Age (no NIC) | statePensionAge=true | NIC=0 | NIC=0 | Pass |
| MA receiver (standard) | gross=40,000, MA=true | PA=13,830 | PA=13,830 | Pass |
| MA receiver in taper zone | gross=110,000, MA=true | Warning shown | No warning (MISS) | **FAIL** |
| Scottish taper note | scottish=true, gross=110,000 | Note shows 67.5% | Note shows 60% (WRONG) | **FAIL** |
| Worked Example 1 (£50,000) | gross=50,000, Plan2, 5% pension | takeHome=£35,581.90/yr | £35,581.90/yr | Pass |
| Worked Example 2 (£120,000) | gross=120,000, no options | incomeTax=£39,675.00 (code correct; Sarah's doc has error showing £39,432) | £39,675.00 | Pass (code) / Note (doc error) |
| Worked Example 3 (£75,000 Scotland) | gross=75,000, Scottish | takeHome=£51,975.60/yr | £51,975.60/yr | Pass |
| NT code (no tax) | code=NT | incomeTax=0 | incomeTax=0 | Pass |
| K code 50% cap | K code, high addition | tax capped at 50% gross | Correctly capped | Pass |
| 0T code | code=0T | PA=0, bands apply | Correct | Pass |
| C prefix (Welsh) | code=C1257L | Same as England rates | Same as England | Pass |
| S prefix (Scottish) | code=S1257L | Scottish rates | Scottish rates | Pass |

---

## SARAH'S Q1–Q10 FEEDBACK COMPLIANCE

Sarah's Q&A document specifies 10 implementation decisions. Compliance was checked for each:

| Q | Sarah's Decision | Implementation | Compliant? |
|---|-----------------|----------------|------------|
| Q1 | Show pre-sacrifice gross as headline; sacrifice as labelled deduction with post-sacrifice subtotal | Pension section shows employee contribution as deduction. NIC saving is implicitly visible via the separate NIC line. The "post-sacrifice sub-total showing NIC base" is not explicitly labelled. | Partial — NIC saving is visible but the post-sacrifice sub-total line is not explicitly rendered as Sarah suggested |
| Q2 | Dividend tax as collapsed optional advanced input with band-stacking | Implemented as `dividendIncome` number input; `computeDividendTax` correctly stacks dividends on top of salary | Compliant |
| Q3 | Informational CGT display only; no CGT computation | CGT constants defined (reference only); no CGT input or output field. No CGT informational block is rendered to the user. | Partial — CGT constants exist but no informational display was found; Sarah's action item asks for a note directing users to HMRC CGT guidance |
| Q4 | Category A + C sufficient; omit B, J, Z, H, M | `statePensionAge` toggle maps to Category C (zero NIC). Category A is the default. No other categories present. | Compliant |
| Q5 | Sufficient coverage; add C prefix placeholder; verify SD0/SD1 Scottish rates | C prefix accepted and mapped to England rates. SD0/SD1 rates incorrect (Issue #2). | Non-compliant on SD0/SD1 |
| Q6 | Warn only at Scottish MA threshold; do not hard-block | `SCOT_MARRIAGE_ALLOWANCE_CAP` constant defined but no warning is emitted when a Scottish taxpayer with income above £43,662 enables MA. | Non-compliant — warning not implemented |
| Q7 | Warn when pension exceeds £60,000 annual allowance | `pensionExceedsAnnualAllowance` boolean computed and shown as note row in breakdown | Compliant |
| Q8 | BPA+MA combined taper correct (£133,920); warn MA+taper ineligibility | BPA+MA combined calculation is arithmetically correct in the formula (confirmed) but the early return bug (Issue #1) corrupts the result for incomes £125,140–£133,920. MA+taper ineligibility warning absent (Issue #3). | Non-compliant on both counts |
| Q9 | Separate undergraduate plan selector + postgraduate toggle; None must be valid default | Plan selector defaults to 'none'; `hasPostgrad` toggle available; undergraduate plans correctly listed | Compliant |
| Q10 | Annual primary, monthly secondary; monthly = annual ÷ 12 | Annual figures are primary; monthly figures shown as annual/12 | Compliant |

**Compliance summary:** 6 of 10 fully compliant. 2 partially compliant. 2 non-compliant.

---

## RECOMMENDATIONS SUMMARY

### Critical (fix before release)

1. **Issue #1 — BPA/MA taper early return bug:** Remove the `if (adjustedNetIncome >= ADDITIONAL_RATE_THRESHOLD) return 0` guard from `computePersonalAllowance`. The downstream `Math.max(0, ...)` clamp is sufficient for all cases.

### High (fix before release)

2. **Issue #2 — SD0/SD1 flat rates wrong:** SD0 must use `SCOT_HIGHER_RATE` (0.42); SD1 must use `SCOT_TOP_RATE` (0.48). Separate the SD0/SD1 cases from D0/D1 in the `parseTaxCode` function.

### Medium (fix before release — Sarah's explicit action items)

3. **Issue #3 — MA+taper ineligibility warning absent:** Add a warning row in `getBreakdownRows` when `marriageAllowanceReceiver` is true and income is in the taper zone (or above Scottish higher rate threshold for Scottish taxpayers). `SCOT_MARRIAGE_ALLOWANCE_CAP` constant is already defined — use it.

4. **Issue #4 — Scottish taper marginal rate note inaccurate:** Change the taper warning message to display 67.5% for Scottish taxpayers and 60% for all others. The `r.scottish` flag is available in `getBreakdownRows`.

### Low (address before release)

5. **Issue #5 — No input validation on gross:** Add a guard against negative, NaN, or non-finite gross values at the top of `computeBreakdown`.

6. **Issue #6 — Double call to `parseTaxCode`:** Refactor to call `parseTaxCode` once and reuse the result object.

7. **Issue #7 — Default pension method pre-populates:** Change `defaultOptions()` to `pensionMethod: 'none'` and `pensionPct: 0` so users start from an unmodified gross.

### Informational

8. **Issue #8 — Sarah's Example 2 arithmetic error:** Report to Sarah for correction in the research document. Code is correct; document is wrong.

9. **Issue #9 — Inline "NOTE TO JOHN" comment:** Replace with a proper source citation and remove the open question.

10. **Issue #10 — Misleading comment in `computePersonalAllowance`:** Update after fixing Issue #1 to accurately describe the corrected behaviour.

---

## FOLLOW-UP ITEMS

This is the first audit of `uk.js`. No prior audit issues are carried forward. All issues above are new findings from this session.

**Action required before next review:**

- Developer to address Issues #1–#4 (Critical, High, and Medium severity) and confirm fixes.
- Sarah to issue a correction to `uk_income_tax_research.md` for the Example 2 income tax arithmetic (£39,432 should be £39,675; take-home £76,157.40 should be £75,914.40).
- A re-audit of `computePersonalAllowance` after the Issue #1 fix should include a full sweep of the BPA and BPA+MA taper range (£125,140 to £133,920) to confirm the fix is clean.

---

*— John (IT Auditor)*
*All findings verified against source code (`uk.js`), Sarah's research document (`uk_income_tax_research.md`), and Sarah's Q&A document (`answers_from_sarah.md`), all dated 2026-03-28.*
*Calculation test cases were executed using an independent Python replication of all uk.js functions.*
*This report does not constitute professional tax or legal advice.*
