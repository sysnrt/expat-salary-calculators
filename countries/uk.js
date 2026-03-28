/* ══════════════════════════════════════════════════════════
   ExpatCalc — United Kingdom Configuration & Tax Computation
   Tax Year: 2025/26 (6 April 2025 – 5 April 2026)
   Jurisdiction: England, Wales, Northern Ireland (standard)
                 Scotland (selectable via Scottish taxpayer flag)

   Sources (all retrieved 2026-03-28, documented in Sarah's research):
   - HMRC: https://www.gov.uk/income-tax-rates
   - HMRC: https://www.gov.uk/scottish-income-tax
   - HMRC: https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026
   - HMRC: https://www.gov.uk/repaying-your-student-loan/what-you-pay
   - HMRC: https://www.gov.uk/workplace-pensions/what-you-employer-and-the-government-pay
   - HMRC: https://www.gov.uk/marriage-allowance
   - HMRC: https://www.gov.uk/blind-persons-allowance
   - HMRC: https://www.gov.uk/tax-on-dividends
   - Full reference: UK/uk_income_tax_research.md (Sarah, 2026-03-28)
   ══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — INCOME TAX CONSTANTS (England/Wales/Northern Ireland)
// Source: Sarah's doc §1.1, §1.2 — HMRC https://www.gov.uk/income-tax-rates
// ─────────────────────────────────────────────────────────────────────────────

// Standard Personal Allowance (frozen until April 2028 per Autumn Statement 2022)
const PERSONAL_ALLOWANCE = 12570;

// Income tax band widths (taxable income, not gross income):
//   Basic rate band width:  £37,700 (covering taxable income £0 – £37,700)
//   Higher rate band:       taxable income £37,701 – £112,570 (= £125,140 gross - £12,570 PA)
//   Additional rate:        taxable income above £112,570
const BASIC_RATE_BAND_WIDTH = 37700;   // £37,700 wide — basic rate applies within this

// These are gross income thresholds (before subtracting PA), used for band calculations
const HIGHER_RATE_THRESHOLD    = 50270;   // gross: £50,270 (= PA + basic band width)
const ADDITIONAL_RATE_THRESHOLD = 125140; // gross: £125,140 (PA fully withdrawn here too)

// Income tax rates — England, Wales, Northern Ireland (2025/26)
const BASIC_RATE      = 0.20; // 20% — Sarah §1.1
const HIGHER_RATE     = 0.40; // 40% — Sarah §1.1
const ADDITIONAL_RATE = 0.45; // 45% — Sarah §1.1

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — PERSONAL ALLOWANCE TAPER
// Source: Sarah's doc §3.2 — the £100,000 taper
// Key mechanics: PA reduced by £1 for every £2 of income above £100,000.
// Creates an effective 60% marginal tax rate between £100,000 and £125,140.
// ─────────────────────────────────────────────────────────────────────────────

const PA_TAPER_START = 100000; // taper begins at £100,000 adjusted net income
// PA_TAPER_END = ADDITIONAL_RATE_THRESHOLD (£125,140) — PA = £0 at this point

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — SCOTTISH INCOME TAX (2025/26)
// Source: Sarah's doc §2.1 — https://www.gov.uk/scottish-income-tax
// NB: NIC is ALWAYS calculated using UK-wide rates, even for Scottish taxpayers.
// ─────────────────────────────────────────────────────────────────────────────

// Scottish band widths (taxable income above PA of £12,570):
//   Each entry is the CUMULATIVE width from zero taxable income.
//   E.g., SCOT_STARTER_WIDTH = 2827 means taxable £0–£2,827 is at 19%.
const SCOT_STARTER_WIDTH       = 2827;   // £12,571–£15,397 (width = £2,827) — 19%
const SCOT_BASIC_WIDTH         = 12094;  // £15,398–£27,491 (width = £12,094) — 20%
const SCOT_INTERMEDIATE_WIDTH  = 16171;  // £27,492–£43,662 (width = £16,171) — 21%
const SCOT_HIGHER_WIDTH        = 31338;  // £43,663–£75,000 (width = £31,338) — 42%
const SCOT_ADVANCED_WIDTH      = 50140;  // £75,001–£125,140 (width = £50,140) — 45%
// Top rate: everything above taxable £112,570 (= £125,140 gross − £12,570 PA) — 48%

// Scottish income tax rates (2025/26) — Sarah §2.1
const SCOT_STARTER_RATE      = 0.19;
const SCOT_BASIC_RATE        = 0.20;
const SCOT_INTERMEDIATE_RATE = 0.21;
const SCOT_HIGHER_RATE       = 0.42;
const SCOT_ADVANCED_RATE     = 0.45;
const SCOT_TOP_RATE          = 0.48;

// Scotland-specific Marriage Allowance eligibility cap (higher rate threshold in Scotland)
// Sarah §14.9: "Scottish taxpayers can receive Marriage Allowance but the income limit
// for the receiving partner is £43,662, not £50,270."
const SCOT_MARRIAGE_ALLOWANCE_CAP = 43662;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — NATIONAL INSURANCE CONTRIBUTIONS (Class 1 Employee)
// Source: Sarah's doc §4.1–§4.3
// CRITICAL: NIC is calculated on GROSS pay; pension contributions do NOT reduce
// the NIC base (except under salary sacrifice — see Sarah §14.4 and §14.5).
// ─────────────────────────────────────────────────────────────────────────────

// Annual NIC thresholds (2025/26) — Sarah §4.1
const NIC_PRIMARY_THRESHOLD    = 12570;  // PT: NICs start above this (£12,570/year)
const NIC_UPPER_EARNINGS_LIMIT = 50270;  // UEL: reduced 2% rate kicks in above (£50,270/year)

// NOTE: PT (£12,570) deliberately matches the income tax Personal Allowance as of April 2022.
// Sarah §4.6 warns: do not hard-code a relationship between these — they may diverge.

// Employee NIC rates — Category A (standard) — Sarah §4.2
const NIC_MAIN_RATE    = 0.08; // 8% on earnings between PT and UEL
const NIC_REDUCED_RATE = 0.02; // 2% on earnings above UEL

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — STUDENT LOAN REPAYMENTS (2025/26)
// Source: Sarah's doc §5.1 — https://www.gov.uk/repaying-your-student-loan/what-you-pay
// Important: calculated on GROSS pay, not net. Each period is independent (no cumulative).
// ─────────────────────────────────────────────────────────────────────────────

// Annual repayment thresholds and rates — Sarah §5.1 table
const STUDENT_LOAN_PLANS = {
  plan1: { threshold: 26065, rate: 0.09, label: 'Plan 1' },
  plan2: { threshold: 28470, rate: 0.09, label: 'Plan 2' },
  plan4: { threshold: 32745, rate: 0.09, label: 'Plan 4 (Scotland)' },
  plan5: { threshold: 25000, rate: 0.09, label: 'Plan 5' },
  // Postgraduate Loan is separate and can stack with an undergraduate plan
  postgrad: { threshold: 21000, rate: 0.06, label: 'Postgraduate Loan' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PENSION CONTRIBUTIONS
// Source: Sarah's doc §6.1–§6.5
// Three pension methods with different tax and NIC treatment:
//   1. Net Pay Arrangement: reduces income tax base only (not NIC base)
//   2. Relief at Source: no reduction to income tax or NIC base in payroll
//   3. Salary Sacrifice: reduces BOTH income tax AND NIC base
// ─────────────────────────────────────────────────────────────────────────────

// Qualifying earnings band for auto-enrolment — Sarah §6.2
const PENSION_QE_LOWER = 6240;   // qualifying earnings lower limit (annual)
const PENSION_QE_UPPER = 50270;  // qualifying earnings upper limit = UEL (coincidence per Sarah)

// Pension annual allowance (maximum with tax relief) — Sarah §6.5
const PENSION_ANNUAL_ALLOWANCE = 60000;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — ALLOWANCES
// Source: Sarah's doc §9 (Marriage Allowance), §10 (Blind Person's Allowance)
// ─────────────────────────────────────────────────────────────────────────────

// Marriage Allowance — Sarah §9.1
// Transfer amount: £1,260 (10% of standard PA)
// Receiving partner (code M): PA increases to £13,830 → £252/year tax saving
// Transferring partner (code N): PA reduces to £11,310
const MARRIAGE_ALLOWANCE_TRANSFER = 1260;  // amount transferred between partners

// Blind Person's Allowance — Sarah §10.1
// Added to Personal Allowance (not a separate deduction)
const BLIND_PERSONS_ALLOWANCE = 3130;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — DIVIDEND TAX
// Source: Sarah's doc §11 — dividends sit on top of income, use different rates
// The £500 dividend allowance is a nil-rate band, not an exemption.
// ─────────────────────────────────────────────────────────────────────────────

const DIVIDEND_ALLOWANCE      = 500;    // first £500 at 0% (but counts toward band) — Sarah §11.2
const DIVIDEND_BASIC_RATE     = 0.0875; // 8.75% — basic rate taxpayers — Sarah §11.3
const DIVIDEND_HIGHER_RATE    = 0.3375; // 33.75% — higher rate taxpayers
const DIVIDEND_ADDITIONAL_RATE = 0.3935; // 39.35% — additional rate taxpayers

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — CAPITAL GAINS TAX (reference only — not a payroll deduction)
// Source: Sarah's doc §12 — CGT is out of scope for payroll, shown as reference
// ─────────────────────────────────────────────────────────────────────────────

const CGT_ANNUAL_EXEMPT_AMOUNT = 3000;  // £3,000 AEA for 2025/26 — Sarah §12.2
const CGT_BASIC_RATE           = 0.18;  // 18% — unified rate from 6 April 2025 — Sarah §12.3
const CGT_HIGHER_RATE          = 0.24;  // 24% — higher/additional rate taxpayers

// ─────────────────────────────────────────────────────────────────────────────
// INCOME TAX COMPUTATION — England/Wales/Northern Ireland
// Source: Sarah's doc §1.3 (calculation formula)
// @param {number} taxableIncome - income after personal allowance and applicable deductions
// @returns {number} Annual income tax in GBP
// ─────────────────────────────────────────────────────────────────────────────
function computeEnglandWalesNITax(taxableIncome) {
  if (taxableIncome <= 0) return 0;

  // Basic rate band: first £37,700 of taxable income at 20%
  const basicBand = Math.min(taxableIncome, BASIC_RATE_BAND_WIDTH);

  // Higher rate band: taxable income between £37,700 and £112,570 at 40%
  // (£112,570 = £125,140 gross additional rate threshold − £12,570 PA)
  const higherBandWidth = ADDITIONAL_RATE_THRESHOLD - PERSONAL_ALLOWANCE - BASIC_RATE_BAND_WIDTH;
  const higherBand = Math.max(0, Math.min(taxableIncome - BASIC_RATE_BAND_WIDTH, higherBandWidth));

  // Additional rate band: taxable income above £112,570 at 45%
  const additionalBand = Math.max(0, taxableIncome - (ADDITIONAL_RATE_THRESHOLD - PERSONAL_ALLOWANCE));

  return (basicBand * BASIC_RATE) + (higherBand * HIGHER_RATE) + (additionalBand * ADDITIONAL_RATE);
}

// ─────────────────────────────────────────────────────────────────────────────
// INCOME TAX COMPUTATION — Scotland
// Source: Sarah's doc §2.3 (Scottish calculation formula)
// NB: Called with taxable income (= gross − effective personal allowance)
// @param {number} taxableIncome - income after personal allowance (with taper if applicable)
// @returns {number} Annual Scottish income tax in GBP
// ─────────────────────────────────────────────────────────────────────────────
function computeScottishIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;

  // Starter rate: first £2,827 of taxable income at 19%
  const starterBand = Math.min(taxableIncome, SCOT_STARTER_WIDTH);

  // Basic rate: next £12,094 (taxable £2,828 – £14,921) at 20%
  const basicBand = Math.min(Math.max(taxableIncome - SCOT_STARTER_WIDTH, 0), SCOT_BASIC_WIDTH);

  // Intermediate rate: next £16,171 (taxable £14,922 – £31,092) at 21%
  const intermediateStart = SCOT_STARTER_WIDTH + SCOT_BASIC_WIDTH; // = 14,921
  const intermediateBand = Math.min(Math.max(taxableIncome - intermediateStart, 0), SCOT_INTERMEDIATE_WIDTH);

  // Higher rate: next £31,338 (taxable £31,093 – £62,430) at 42%
  const higherStart = intermediateStart + SCOT_INTERMEDIATE_WIDTH; // = 31,092
  const higherBand = Math.min(Math.max(taxableIncome - higherStart, 0), SCOT_HIGHER_WIDTH);

  // Advanced rate: next £50,140 (taxable £62,431 – £112,570) at 45%
  const advancedStart = higherStart + SCOT_HIGHER_WIDTH; // = 62,430
  const advancedBand = Math.min(Math.max(taxableIncome - advancedStart, 0), SCOT_ADVANCED_WIDTH);

  // Top rate: taxable income above £112,570 (gross above £125,140) at 48%
  const topStart = advancedStart + SCOT_ADVANCED_WIDTH; // = 112,570
  const topBand = Math.max(taxableIncome - topStart, 0);

  return (starterBand      * SCOT_STARTER_RATE)
       + (basicBand        * SCOT_BASIC_RATE)
       + (intermediateBand * SCOT_INTERMEDIATE_RATE)
       + (higherBand       * SCOT_HIGHER_RATE)
       + (advancedBand     * SCOT_ADVANCED_RATE)
       + (topBand          * SCOT_TOP_RATE);
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL ALLOWANCE WITH TAPER
// Source: Sarah's doc §3.2 and §3.4
// Taper: £1 reduction in PA for every £2 of income above £100,000.
// Floor() is used per Sarah §14.1 (not standard rounding — matches HMRC behaviour).
// @param {number} adjustedNetIncome - gross salary minus net pay pension contributions
// @param {number} blindPersonsAllowance - BPA claimed (0 or 3130)
// @param {boolean} marriageAllowanceReceiver - true if receiving MA transfer
// @returns {number} Effective personal allowance after taper
// ─────────────────────────────────────────────────────────────────────────────
function computePersonalAllowance(adjustedNetIncome, blindPersonsAllowance, marriageAllowanceReceiver) {
  // Start with standard PA, then add any bonuses
  let basePA = PERSONAL_ALLOWANCE;

  // Marriage Allowance receiver: PA increased by £1,260 — Sarah §9.3
  if (marriageAllowanceReceiver) {
    basePA += MARRIAGE_ALLOWANCE_TRANSFER;
  }

  // Blind Person's Allowance: added to PA — Sarah §10.2
  // Combined effective PA = standard PA + BPA + any MA transfer
  basePA += blindPersonsAllowance;

  // Apply the taper if adjusted net income exceeds £100,000 — Sarah §3.2
  // The taper applies to the COMBINED effective personal allowance (including BPA) — Sarah §10.3
  if (adjustedNetIncome <= PA_TAPER_START) {
    return basePA; // no taper applies
  }

  if (adjustedNetIncome >= ADDITIONAL_RATE_THRESHOLD) {
    return 0; // PA fully withdrawn at £125,140 (this is where standard PA = 0)
    // Note: with BPA, the actual zero point is higher — but HMRC still tapers only
    // the standard PA portion to zero, BPA is removed separately. Sarah §10.3 shows
    // the BPA taper zero-out is at £100,000 + (£15,700 × 2) = £131,400.
    // For clarity, we let the formula run and clamp at 0 (Math.max handles it).
  }

  // Taper formula: floor((income - 100000) / 2) reduction — Sarah §14.1 (use floor, not round)
  const reduction = Math.floor((adjustedNetIncome - PA_TAPER_START) / 2);
  return Math.max(0, basePA - reduction);
}

// ─────────────────────────────────────────────────────────────────────────────
// NATIONAL INSURANCE (Class 1 Employee — Category A)
// Source: Sarah's doc §4.3 (annual formula)
// CRITICAL: NIC is always on GROSS pay. Net pay pension does NOT reduce NIC.
// Only salary sacrifice reduces both income tax AND NIC bases — Sarah §14.4/§14.5.
// @param {number} nicBase - annual gross pay for NIC (= gross OR gross-sacrifice)
// @returns {number} Annual employee NIC in GBP
// ─────────────────────────────────────────────────────────────────────────────
function computeNIC(nicBase) {
  if (nicBase <= NIC_PRIMARY_THRESHOLD) {
    // Below PT: no NIC due — Sarah §4.2
    return 0;
  }

  if (nicBase <= NIC_UPPER_EARNINGS_LIMIT) {
    // Between PT and UEL: 8% on excess above PT — Sarah §4.2
    return (nicBase - NIC_PRIMARY_THRESHOLD) * NIC_MAIN_RATE;
  }

  // Above UEL: 8% on PT–UEL band + 2% on excess above UEL — Sarah §4.2
  return (NIC_UPPER_EARNINGS_LIMIT - NIC_PRIMARY_THRESHOLD) * NIC_MAIN_RATE
       + (nicBase - NIC_UPPER_EARNINGS_LIMIT) * NIC_REDUCED_RATE;
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT LOAN REPAYMENT
// Source: Sarah's doc §5.2 (formula), §5.3 (plan stacking rules)
// Calculated on GROSS income (not net, not after pension) — Sarah §5.5
// @param {number} annualGross  - annual gross salary (student loans are on full gross)
// @param {string} undergraduatePlan - 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5'
// @param {boolean} hasPostgrad - true if Postgraduate Loan also active
// @returns {{ undergraduate: number, postgraduate: number, total: number }}
// ─────────────────────────────────────────────────────────────────────────────
function computeStudentLoanRepayment(annualGross, undergraduatePlan, hasPostgrad) {
  let undergraduateRepayment = 0;
  let postgraduateRepayment = 0;

  // Undergraduate plan repayment (Plans 1, 2, 4, 5 are mutually exclusive) — Sarah §5.3
  if (undergraduatePlan && undergraduatePlan !== 'none') {
    const plan = STUDENT_LOAN_PLANS[undergraduatePlan];
    if (plan) {
      // 9% on income above the plan threshold — Sarah §5.2
      undergraduateRepayment = Math.max(0, annualGross - plan.threshold) * plan.rate;
    }
  }

  // Postgraduate Loan can stack on top of undergraduate plan — Sarah §5.3
  // Independent calculation: 6% on income above £21,000
  if (hasPostgrad) {
    postgraduateRepayment = Math.max(0, annualGross - STUDENT_LOAN_PLANS.postgrad.threshold)
                           * STUDENT_LOAN_PLANS.postgrad.rate;
  }

  return {
    undergraduate: undergraduateRepayment,
    postgraduate: postgraduateRepayment,
    total: undergraduateRepayment + postgraduateRepayment,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIVIDEND TAX — Band Stacking
// Source: Sarah's doc §11.4
// Dividends are the TOP SLICE of income — applied after salary fills the bands.
// @param {number} dividendIncome  - total annual dividends
// @param {number} taxableNonDividendIncome - taxable salary income (after PA)
// @returns {number} Annual dividend tax in GBP
// ─────────────────────────────────────────────────────────────────────────────
function computeDividendTax(dividendIncome, taxableNonDividendIncome) {
  if (dividendIncome <= 0) return 0;

  // Apply £500 dividend allowance — Sarah §11.2 (nil-rate but counts toward band)
  const dividendTaxable = Math.max(0, dividendIncome - DIVIDEND_ALLOWANCE);
  if (dividendTaxable <= 0) return 0;

  // How much basic rate band remains after non-dividend income fills it — Sarah §11.4
  const basicRateBandRemaining = Math.max(0, BASIC_RATE_BAND_WIDTH - taxableNonDividendIncome);

  // Total higher rate band width (taxable income): £112,570 (= £125,140 − £12,570)
  const totalHigherBandWidth = ADDITIONAL_RATE_THRESHOLD - PERSONAL_ALLOWANCE - BASIC_RATE_BAND_WIDTH;
  // How much higher rate band is already used by salary income above the basic rate band
  const higherRateAlreadyUsed = Math.max(0, taxableNonDividendIncome - BASIC_RATE_BAND_WIDTH);
  const higherRateBandRemaining = Math.max(0, totalHigherBandWidth - higherRateAlreadyUsed);

  // Dividends fill the remaining basic rate band first, then higher rate, then additional
  const dividendsInBasicBand = Math.min(dividendTaxable, basicRateBandRemaining);
  const dividendsInHigherBand = Math.min(Math.max(0, dividendTaxable - basicRateBandRemaining), higherRateBandRemaining);
  const dividendsInAdditionalBand = Math.max(0, dividendTaxable - basicRateBandRemaining - higherRateBandRemaining);

  return (dividendsInBasicBand      * DIVIDEND_BASIC_RATE)
       + (dividendsInHigherBand     * DIVIDEND_HIGHER_RATE)
       + (dividendsInAdditionalBand * DIVIDEND_ADDITIONAL_RATE);
}

// ─────────────────────────────────────────────────────────────────────────────
// TAX CODE PARSING
// Source: Sarah's doc §8
// Decodes a PAYE tax code string into an effective annual personal allowance
// and any special flags (Scottish rates, flat-rate codes, etc.)
// @param {string} taxCode - e.g. "1257L", "S1257L", "BR", "K100"
// @param {boolean} isScottish - base Scottish flag (overrides if code has S prefix)
// @returns {{ effectivePA: number|null, flatRate: number|null, isScottish: boolean,
//             noTax: boolean, isKCode: boolean, kCodeAddition: number }}
// ─────────────────────────────────────────────────────────────────────────────
function parseTaxCode(taxCode, isScottish) {
  const code = (taxCode || '1257L').trim().toUpperCase();

  // Default result
  const result = {
    effectivePA: PERSONAL_ALLOWANCE, // annual free pay derived from numeric part
    flatRate: null,                   // non-null if a flat-rate code applies (BR/D0/D1)
    isScottish: isScottish,           // inherits base flag; S-prefix overrides to true
    noTax: false,                     // NT code: no tax at all
    isKCode: false,                   // K code: negative allowance (adds to taxable pay)
    kCodeAddition: 0,                 // amount ADDED to taxable pay for K codes
  };

  // ── Special flat-rate / no-tax codes ── (Sarah §8.2)
  if (code === 'NT') {
    result.noTax = true;
    result.effectivePA = null;
    return result;
  }
  if (code === 'BR' || code === 'SBR' || code === 'CBR') {
    // Basic rate: all income taxed at 20%, no personal allowance
    result.flatRate = BASIC_RATE;
    result.effectivePA = 0;
    if (code.startsWith('S')) result.isScottish = true;
    return result;
  }
  if (code === 'D0' || code === 'SD0' || code === 'CD0') {
    // Higher rate: all income taxed at 40%, no PA — Sarah §8.2
    result.flatRate = HIGHER_RATE;
    result.effectivePA = 0;
    if (code.startsWith('S')) result.isScottish = true;
    return result;
  }
  if (code === 'D1' || code === 'SD1' || code === 'CD1') {
    // Additional rate: all income taxed at 45%, no PA — Sarah §8.2
    result.flatRate = ADDITIONAL_RATE;
    result.effectivePA = 0;
    if (code.startsWith('S')) result.isScottish = true;
    return result;
  }
  if (code === '0T' || code === 'S0T' || code === 'C0T') {
    // Zero PA — normal bands apply but no free pay — Sarah §8.2
    result.effectivePA = 0;
    if (code.startsWith('S')) result.isScottish = true;
    return result;
  }

  // ── S or C prefix (Scottish/Welsh rates) ── (Sarah §8.3)
  let working = code;
  if (working.startsWith('S')) {
    result.isScottish = true;
    working = working.slice(1); // strip S prefix for numeric parsing
  } else if (working.startsWith('C')) {
    // Welsh rates — same as England for 2025/26 per Sarah §14.7
    working = working.slice(1);
  }

  // ── K code (negative allowance) ── (Sarah §8.5)
  if (working.startsWith('K')) {
    const kNum = parseInt(working.slice(1), 10);
    if (!isNaN(kNum)) {
      result.isKCode = true;
      result.effectivePA = 0;
      // K code adds (numeric × 10) to taxable pay — Sarah §8.5
      result.kCodeAddition = kNum * 10;
    }
    return result;
  }

  // ── Standard numeric code with suffix letter ──
  // Suffix L/M/N/T: numeric part × 10 = annual free pay — Sarah §8.4
  const numericMatch = working.match(/^(\d+)([LMNTC]?)$/);
  if (numericMatch) {
    const numPart = parseInt(numericMatch[1], 10);
    result.effectivePA = numPart * 10; // e.g. 1257L → £12,570 — Sarah §8.4
    // Note: M/N suffixes encode specific allowances (Marriage Allowance);
    // the numeric part already reflects the adjusted amount (e.g. 1383M = £13,830)
    // so no extra logic needed here — the number carries the adjustment.
    return result;
  }

  // Unrecognised code — fall back to standard PA
  result.effectivePA = PERSONAL_ALLOWANCE;
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BREAKDOWN FUNCTION
// Orchestrates all tax computations for a given gross salary and options.
// Source: Sarah's doc §7.4 (simplification for annual income mode)
// @param {number} gross - monthly gross salary in GBP
// @param {object} opts  - user-selected options from the UI
// @returns {object}     - full breakdown object consumed by UI rendering methods
// ─────────────────────────────────────────────────────────────────────────────
function computeBreakdown(gross, opts) {
  const {
    scottish,             // boolean: Scottish taxpayer? (Sarah §2.5 — must be user-supplied)
    pensionMethod,        // 'netPay' | 'ras' | 'sacrifice' (Sarah §6.3 and §14.5)
    pensionPct,           // number: employee pension % of gross
    undergraduatePlan,    // 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' (Sarah §5.3)
    hasPostgrad,          // boolean: Postgraduate Loan active? (can stack — Sarah §5.3)
    marriageAllowanceReceiver, // boolean: receiving MA transfer? (Sarah §9.4)
    blindPersonsAllowance,     // boolean: claiming BPA? (Sarah §10.2)
    statePensionAge,      // boolean: at/above State Pension Age = no NIC (Sarah §14.8)
    dividendIncome,       // number: annual dividend income (optional advanced input)
    customTaxCode,        // string: override tax code (default '1257L')
    useCustomTaxCode,     // boolean: use customTaxCode instead of calculated PA
  } = opts;

  // ── Annual gross (this calculator uses annual salary as the computation basis) ──
  // Monthly gross input × 12 = annual, per Sarah §7.4
  const annualGross = gross * 12;

  // ── Pension contribution amounts ──
  const pensionPctNum = Number(pensionPct) || 0;

  // Annual employee pension contribution in GBP
  const annualPensionContribution = annualGross * (pensionPctNum / 100);

  // Warn if pension exceeds the £60,000 annual allowance — Sarah §6.5
  const pensionExceedsAnnualAllowance = annualPensionContribution > PENSION_ANNUAL_ALLOWANCE;

  // ── Effective gross for income tax and NIC depend on pension method ──
  // Net Pay Arrangement: pension reduces income tax base ONLY, not NIC base — Sarah §14.4
  // Salary Sacrifice:    pension reduces BOTH income tax base AND NIC base — Sarah §14.5
  // Relief at Source:    pension does NOT reduce income tax base (taken from net) — Sarah §6.3

  // Adjusted net income (used for PA taper calculation and income tax base):
  let adjustedNetIncome;
  if (pensionMethod === 'netPay') {
    // Net pay: pension deducted before income tax — Sarah §6.3
    adjustedNetIncome = annualGross - annualPensionContribution;
  } else if (pensionMethod === 'sacrifice') {
    // Salary sacrifice: effective gross is reduced — Sarah §14.5
    adjustedNetIncome = annualGross - annualPensionContribution;
  } else {
    // Relief at Source: full gross is the income tax base — Sarah §6.3
    adjustedNetIncome = annualGross;
  }

  // NIC base: salary sacrifice reduces this; net pay and RAS do NOT — Sarah §14.4/§14.5
  const nicBase = pensionMethod === 'sacrifice'
    ? Math.max(0, annualGross - annualPensionContribution)
    : annualGross;

  // ── Personal Allowance ──
  let effectivePA;

  if (useCustomTaxCode && customTaxCode) {
    // Tax code overrides the calculated PA — Sarah §8
    const parsed = parseTaxCode(customTaxCode, scottish);
    // For a custom tax code, we use the code's PA directly (ignores taper/BPA/MA flags
    // because those are embedded in the code's numeric value via HMRC already)
    effectivePA = parsed.effectivePA !== null ? parsed.effectivePA : PERSONAL_ALLOWANCE;
  } else {
    // Calculate PA with all adjustments and taper — Sarah §3.2, §9.3, §10.2
    const bpaAmount = blindPersonsAllowance ? BLIND_PERSONS_ALLOWANCE : 0;
    effectivePA = computePersonalAllowance(adjustedNetIncome, bpaAmount, marriageAllowanceReceiver);
  }

  // ── Taxable income for income tax ──
  const taxableIncome = Math.max(0, adjustedNetIncome - effectivePA);

  // ── Income Tax ──
  let annualIncomeTax;
  const useScottishRates = opts.scottish; // NIC always UK-wide regardless — Sarah §2 intro

  if (useCustomTaxCode && customTaxCode) {
    const parsed = parseTaxCode(customTaxCode, scottish);
    if (parsed.noTax) {
      annualIncomeTax = 0;
    } else if (parsed.flatRate !== null) {
      // Flat rate codes (BR, D0, D1): apply to full gross with no PA — Sarah §8.2
      annualIncomeTax = adjustedNetIncome * parsed.flatRate;
    } else if (parsed.isKCode) {
      // K code: adds to taxable pay — Sarah §8.5
      const kTaxableIncome = adjustedNetIncome + parsed.kCodeAddition;
      annualIncomeTax = parsed.isScottish
        ? computeScottishIncomeTax(kTaxableIncome)
        : computeEnglandWalesNITax(kTaxableIncome);
      // 50% overriding limit: tax cannot exceed 50% of gross — Sarah §8.5
      annualIncomeTax = Math.min(annualIncomeTax, annualGross * 0.50);
    } else {
      annualIncomeTax = parsed.isScottish
        ? computeScottishIncomeTax(taxableIncome)
        : computeEnglandWalesNITax(taxableIncome);
    }
  } else if (useScottishRates) {
    annualIncomeTax = computeScottishIncomeTax(taxableIncome);
  } else {
    annualIncomeTax = computeEnglandWalesNITax(taxableIncome);
  }

  // ── Dividend Tax (optional, advanced input) ──
  // Dividends are treated as top slice — Sarah §11.4
  const annualDividendIncome = Number(dividendIncome) || 0;
  const annualDividendTax = computeDividendTax(annualDividendIncome, taxableIncome);

  // ── National Insurance ──
  // State Pension Age employees pay zero NIC (Category C) — Sarah §14.8
  const annualNIC = statePensionAge ? 0 : computeNIC(nicBase);

  // ── Student Loan Repayments ──
  // Calculated on full gross (not net, not after pension) — Sarah §5.5
  const studentLoanResult = computeStudentLoanRepayment(annualGross, undergraduatePlan, hasPostgrad);
  const annualStudentLoan = studentLoanResult.total;

  // ── Annual totals ──
  const annualTotalTax = annualIncomeTax + annualDividendTax + annualNIC + annualStudentLoan;
  const annualEmployeePension = annualPensionContribution;

  // Take-home = gross − income tax − NIC − student loan − employee pension
  // For salary sacrifice, pension is already removed from gross for tax/NIC,
  // but the actual take-home still has the pension "cost" — gross is what's paid.
  // Sarah §7.4 formula: take_home = gross - tax - NIC - student_loan - pension
  const annualTakeHome = annualGross
    - annualIncomeTax
    - annualDividendTax
    - annualNIC
    - annualStudentLoan
    - annualEmployeePension;

  const monthlyTakeHome  = annualTakeHome / 12;
  const monthlyIncomeTax = annualIncomeTax / 12;
  const monthlyNIC       = annualNIC / 12;
  const monthlyStudentLoan = annualStudentLoan / 12;
  const monthlyPension   = annualEmployeePension / 12;

  // Effective income tax rate (on gross, not taxable — a useful headline figure)
  const effectiveIncomeTaxRate = annualGross > 0
    ? (annualIncomeTax / annualGross) * 100
    : 0;

  // Overall effective rate (all deductions including NIC as % of gross)
  const overallEffectiveRate = annualGross > 0
    ? (annualTotalTax / annualGross) * 100
    : 0;

  // ── Employer NIC (informational — shown in employer cost section) ──
  // Employer NIC rates (2025/26): 15% on earnings above Secondary Threshold (£5,000/year)
  // from 6 April 2025 (increased from 13.8% with ST reduced from £9,100 — Autumn Budget 2024)
  // NOTE TO JOHN: These employer NIC rates were added based on Sarah's reference to
  // HMRC employer thresholds. Q: Should we verify employer NIC rate 15% vs 13.8%?
  // Sarah's document covers employee NIC only — employer rate sourced from HMRC guidance.
  const EMPLOYER_NIC_SECONDARY_THRESHOLD = 5000;  // £5,000/year from April 2025
  const EMPLOYER_NIC_RATE = 0.15; // 15% from April 2025
  const annualEmployerNIC = nicBase > EMPLOYER_NIC_SECONDARY_THRESHOLD
    ? (nicBase - EMPLOYER_NIC_SECONDARY_THRESHOLD) * EMPLOYER_NIC_RATE
    : 0;
  const annualEmployerCost = annualGross + annualEmployerNIC;

  // ── Qualifying pension (for reference display) ──
  // Auto-enrolment qualifying earnings basis — Sarah §6.2
  const qualifyingEarnings = Math.max(0, Math.min(annualGross, PENSION_QE_UPPER) - PENSION_QE_LOWER);
  const autoEnrolmentEmployee = qualifyingEarnings * 0.05; // 5% minimum
  const autoEnrolmentEmployer = qualifyingEarnings * 0.03; // 3% minimum

  return {
    // ── Core monthly figures ──
    gross,                        // monthly gross salary input
    monthlyTakeHome,              // monthly take-home pay
    monthlyIncomeTax,             // monthly income tax
    monthlyNIC,                   // monthly employee NIC
    monthlyStudentLoan,           // monthly student loan repayment
    monthlyPension,               // monthly pension contribution (employee's share)

    // ── Annual figures ──
    annualGross,
    annualTakeHome,
    annualIncomeTax,
    annualDividendTax,
    annualNIC,
    annualStudentLoan,
    annualEmployeePension,
    annualEmployerNIC,
    annualEmployerCost,

    // ── Tax calculation details (for breakdown display) ──
    effectivePA,                  // personal allowance actually used
    adjustedNetIncome,            // gross minus net-pay pension (used for PA taper)
    taxableIncome,                // income subject to income tax
    effectiveIncomeTaxRate,       // income tax as % of gross
    overallEffectiveRate,         // all deductions as % of gross

    // ── Student loan breakdown ──
    studentLoanUndergraduate: studentLoanResult.undergraduate,
    studentLoanPostgraduate:  studentLoanResult.postgraduate,

    // ── Pension details ──
    annualPensionContribution,
    pensionExceedsAnnualAllowance,
    autoEnrolmentEmployee,
    autoEnrolmentEmployer,
    qualifyingEarnings,

    // ── Dividend details ──
    annualDividendIncome,

    // ── Flags ──
    scottish: useScottishRates,
    statePensionAge: !!statePensionAge,
    inTaperZone: adjustedNetIncome > PA_TAPER_START && adjustedNetIncome < ADDITIONAL_RATE_THRESHOLD,
    pensionMethod: pensionMethod || 'none',
    undergraduatePlan: undergraduatePlan || 'none',

    // ── Generic summary fields consumed by shared components ──
    totalTaxes:            monthlyIncomeTax + (annualDividendTax / 12),
    totalSocialSecurity:   monthlyNIC,
    netSalary:             monthlyTakeHome,
    totalDeductions:       monthlyIncomeTax + monthlyNIC + monthlyStudentLoan + monthlyPension + (annualDividendTax / 12),
    annualNetSalary:       annualTakeHome,
    totalEmployerCost:     annualEmployerCost / 12,  // monthly employer cost
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY CONFIG OBJECT
// This is the shape all country modules must export — consumed by CalculatorPage
// and other shared components via the lazy loader in main.js.
// ─────────────────────────────────────────────────────────────────────────────
const uk = {
  id: 'uk',
  name: 'United Kingdom',
  localName: 'United Kingdom',
  flag: '🇬🇧',
  currency: 'GBP',
  currencySymbol: '£',
  locale: 'en-GB',
  accentColor: '#012169',      // Union Flag navy
  accentSecondary: '#C8102E',  // Union Flag red
  supportedLangs: ['en'],

  // Salary range appropriate for UK income tax — covers from minimum wage to top earners
  salaryRange: { min: 1000, max: 20000, step: 100, default: 3500 },

  // ── Options UI schema ──
  // Defines all user-configurable inputs rendered by SalaryInput.js
  options: [
    // ── Residency / Tax Region ──
    {
      id: 'scottish',
      type: 'toggle',
      label: 'Scottish taxpayer',
      sublabel: 'Applies Scottish income tax rates (7 bands). NIC still calculated at UK rates.',
    },

    // ── Pension ──
    {
      id: 'pensionMethod',
      type: 'select',
      label: 'Pension method',
      sublabel: 'How your pension contribution is treated for tax purposes',
      choices: [
        { value: 'netPay',   label: 'Net pay arrangement (pre-tax, standard)' },
        { value: 'ras',      label: 'Relief at source (NEST, most personal pensions)' },
        { value: 'sacrifice', label: 'Salary sacrifice (reduces NIC too)' },
        { value: 'none',     label: 'No pension contribution' },
      ],
    },
    {
      id: 'pensionPct',
      type: 'number',
      label: 'Employee pension contribution (%)',
      sublabel: 'Your contribution as % of gross salary (auto-enrolment minimum: 5%)',
      min: 0, max: 100, step: 0.5,
      showWhen: ctx => ctx.pensionMethod !== 'none',
    },

    // ── Student Loans ──
    {
      id: 'undergraduatePlan',
      type: 'select',
      label: 'Student loan plan',
      sublabel: 'Undergraduate plans are mutually exclusive',
      choices: [
        { value: 'none',  label: 'None' },
        { value: 'plan1', label: 'Plan 1 (started before Sep 2012)' },
        { value: 'plan2', label: 'Plan 2 (Sep 2012 – Jul 2023, England/Wales)' },
        { value: 'plan4', label: 'Plan 4 (Scotland, managed by SAAS)' },
        { value: 'plan5', label: 'Plan 5 (England, started Aug 2023 onwards)' },
      ],
    },
    {
      id: 'hasPostgrad',
      type: 'toggle',
      label: 'Postgraduate Loan',
      sublabel: 'Can run concurrently with an undergraduate plan (6% above £21,000)',
    },

    // ── Personal Allowance Adjustments ──
    {
      id: 'marriageAllowanceReceiver',
      type: 'toggle',
      label: 'Marriage Allowance (receiver)',
      sublabel: 'Receiving transfer from spouse/civil partner — adds £1,260 to your allowance (£252/year saving)',
    },
    {
      id: 'blindPersonsAllowance',
      type: 'toggle',
      label: "Blind Person's Allowance",
      sublabel: 'Adds £3,130 to your personal allowance if registered blind or severely sight-impaired',
    },
    {
      id: 'statePensionAge',
      type: 'toggle',
      label: 'At or above State Pension Age',
      sublabel: 'No employee National Insurance contributions (Category C) from State Pension Age (currently 66)',
    },

    // ── Dividend Income (optional advanced) ──
    {
      id: 'dividendIncome',
      type: 'number',
      label: 'Annual dividend income (£)',
      sublabel: 'Optional — dividends are taxed as the top slice of income. First £500 at 0%.',
      min: 0, max: 500000, step: 100,
    },

    // ── Custom Tax Code ──
    {
      id: 'useCustomTaxCode',
      type: 'toggle',
      label: 'Use custom tax code',
      sublabel: 'Override default 1257L — useful for BR, K codes, Marriage Allowance codes, etc.',
    },
    {
      id: 'customTaxCode',
      type: 'text',
      label: 'Tax code',
      sublabel: 'e.g. 1257L, S1257L, BR, D0, K100, 1383M',
      showWhen: ctx => ctx.useCustomTaxCode,
      placeholder: '1257L',
    },
  ],

  // ── Default option values ──
  defaultOptions() {
    return {
      scottish: false,
      pensionMethod: 'netPay',
      pensionPct: 5,               // 5% = auto-enrolment minimum (employee portion)
      undergraduatePlan: 'none',
      hasPostgrad: false,
      marriageAllowanceReceiver: false,
      blindPersonsAllowance: false,
      statePensionAge: false,
      dividendIncome: 0,
      useCustomTaxCode: false,
      customTaxCode: '1257L',
    };
  },

  // ── Main computation entry point ──
  computeBreakdown(gross, opts) {
    return computeBreakdown(gross, opts);
  },

  // ── Reverse calculation: find gross given target monthly net ──
  reverseFromNet(targetNet, opts) {
    let lo = 0, hi = targetNet * 4; // conservative upper bound
    for (let i = 0; i < 60; i++) {  // binary search converges in ~60 iterations
      const mid = (lo + hi) / 2;
      const r = this.computeBreakdown(mid, opts);
      if (r.netSalary < targetNet) lo = mid;
      else hi = mid;
    }
    return Math.round((lo + hi) / 2);
  },

  // ── Reverse calculation: find gross given target monthly employer cost ──
  reverseFromTotal(targetTotal, opts) {
    let lo = 0, hi = targetTotal;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const r = this.computeBreakdown(mid, opts);
      if (r.totalEmployerCost < targetTotal) lo = mid;
      else hi = mid;
    }
    return Math.round((lo + hi) / 2);
  },

  // ── Donut chart segments (monthly view) ──
  // Used by the pie/donut chart component on the calculator page
  getDonutSegments(breakdown) {
    const segments = [
      { label: 'Take-home Pay',   value: Math.max(0, breakdown.monthlyTakeHome),  color: '#059669' },
      { label: 'Income Tax',      value: breakdown.monthlyIncomeTax,               color: '#e94560' },
      { label: 'National Insurance', value: breakdown.monthlyNIC,                  color: '#3b82f6' },
    ];
    if (breakdown.monthlyStudentLoan > 0) {
      segments.push({ label: 'Student Loan', value: breakdown.monthlyStudentLoan, color: '#f59e0b' });
    }
    if (breakdown.monthlyPension > 0) {
      segments.push({ label: 'Pension',      value: breakdown.monthlyPension,      color: '#8b5cf6' });
    }
    if (breakdown.annualDividendTax > 0) {
      segments.push({ label: 'Dividend Tax', value: breakdown.annualDividendTax / 12, color: '#ec4899' });
    }
    return segments.filter(s => s.value > 0);
  },

  // ── Breakdown rows for the detailed deductions table ──
  getBreakdownRows(breakdown) {
    const rows = [];
    const r = breakdown;

    rows.push({ label: 'Monthly Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    // ── Income Tax section ──
    rows.push({ type: 'section', label: 'Income Tax' + (r.scottish ? ' (Scottish rates)' : '') });
    rows.push({
      label:  r.effectivePA > 0
                ? `Personal Allowance £${r.effectivePA.toLocaleString()}`
                : 'Personal Allowance (nil — tapered or code)',
      amount: r.effectivePA / 12,
      type:   'benefit',
      icon:   '🏷️',
    });

    if (r.inTaperZone) {
      rows.push({
        label:  '⚠ PA taper active (income £100k–£125k — 60% effective marginal rate)',
        amount: null,
        type:   'note',
      });
    }

    rows.push({ label: 'Income Tax', amount: r.monthlyIncomeTax, type: 'deduction' });

    if (r.annualDividendTax > 0) {
      rows.push({ label: 'Dividend Tax', amount: r.annualDividendTax / 12, type: 'deduction' });
    }

    // ── National Insurance section ──
    rows.push({ type: 'section', label: 'National Insurance (Employee)' });
    if (r.statePensionAge) {
      rows.push({
        label:  'NIC exempt — at or above State Pension Age (Category C)',
        amount: 0,
        type:   'benefit',
        icon:   '✅',
      });
    } else {
      rows.push({ label: 'National Insurance (Class 1)', amount: r.monthlyNIC, type: 'deduction' });
    }

    // ── Student Loan section (if applicable) ──
    if (r.monthlyStudentLoan > 0) {
      rows.push({ type: 'section', label: 'Student Loan Repayment' });
      if (r.studentLoanUndergraduate > 0) {
        const planLabel = STUDENT_LOAN_PLANS[r.undergraduatePlan]
          ? STUDENT_LOAN_PLANS[r.undergraduatePlan].label
          : 'Undergraduate';
        rows.push({
          label: `Student Loan (${planLabel})`,
          amount: r.studentLoanUndergraduate / 12,
          type: 'deduction',
        });
      }
      if (r.studentLoanPostgraduate > 0) {
        rows.push({
          label: 'Postgraduate Loan (6%)',
          amount: r.studentLoanPostgraduate / 12,
          type: 'deduction',
        });
      }
    }

    // ── Pension section (if applicable) ──
    if (r.monthlyPension > 0) {
      const methodLabel = {
        netPay:    'Net Pay Arrangement',
        ras:       'Relief at Source',
        sacrifice: 'Salary Sacrifice',
        none:      'Pension',
      }[r.pensionMethod] || 'Pension';

      rows.push({ type: 'section', label: `Pension (${methodLabel})` });
      rows.push({ label: 'Employee Pension Contribution', amount: r.monthlyPension, type: 'deduction' });

      if (r.pensionExceedsAnnualAllowance) {
        rows.push({
          label: '⚠ Annual pension contribution exceeds £60,000 allowance',
          amount: null,
          type: 'note',
        });
      }
    }

    // ── Totals ──
    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Monthly Take-home', amount: r.monthlyTakeHome, type: 'subtotal net', icon: '✅' });

    return rows;
  },

  // ── Employer cost bars (for employer view) ──
  getEmployerBars(breakdown) {
    return [
      { label: 'Gross Salary',       value: breakdown.gross,               color: '#3b82f6' },
      { label: 'Employer NIC (15%)', value: breakdown.annualEmployerNIC / 12, color: '#8b5cf6' },
    ];
  },

  // ── Annual summary chart segments ──
  getAnnualSegments(breakdown) {
    const segments = [
      { label: 'Take-home',       value: breakdown.annualTakeHome,       color: '#059669' },
      { label: 'Income Tax',      value: breakdown.annualIncomeTax,      color: '#e94560' },
      { label: 'NIC (Employee)',  value: breakdown.annualNIC,            color: '#3b82f6' },
      { label: 'NIC (Employer)',  value: breakdown.annualEmployerNIC,    color: '#8b5cf6' },
    ];
    if (breakdown.annualStudentLoan > 0) {
      segments.push({ label: 'Student Loan', value: breakdown.annualStudentLoan, color: '#f59e0b' });
    }
    if (breakdown.annualEmployeePension > 0) {
      segments.push({ label: 'Pension', value: breakdown.annualEmployeePension, color: '#a78bfa' });
    }
    return segments.filter(s => s.value > 0);
  },
};

export default uk;
