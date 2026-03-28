/* ══════════════════════════════════════════════════════════
   ExpatCalc — Ireland Configuration & Tax Computation
   Tax Year: 2026 (1 January – 31 December 2026)

   Irish income tax system components:
     1. Income Tax (IT) — 20% standard / 40% higher rate
     2. USC (Universal Social Charge) — progressive surcharge
     3. PRSI (Pay-Related Social Insurance) — employee + employer
     4. Tax Credits — reduce final IT liability (non-refundable)
     5. Pension relief — reduces IT base only (not USC/PRSI)

   Sources:
   - Sarah's tax documentation: Ireland/ireland_tax_documentation.md
   - Revenue.ie: https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/
   - Budget 2026 announcements
   ══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — INCOME TAX RATES AND BANDS
// Ireland uses a two-rate system: 20% (standard) and 40% (higher).
// The Standard Rate Cut-Off Point (SRCOP) determines where the 40% rate begins.
// SRCOP varies by marital status. Budget 2026 raised the single band to €44,000.
// Ref: Ireland/ireland_tax_documentation.md §3
// ─────────────────────────────────────────────────────────────────────────────

const IT_STANDARD_RATE = 0.20;  // 20% — standard rate on income up to SRCOP
const IT_HIGHER_RATE   = 0.40;  // 40% — higher rate on income above SRCOP

// Standard Rate Cut-Off Points (SRCOP) by marital status — annual amounts
// These are the thresholds below which income is taxed at 20%.
// Above the SRCOP, income is taxed at 40%.
const SRCOP = {
  single:           44000,  // Single person — Budget 2026
  marriedOneIncome: 53000,  // Married couple, one income — both spouses' SRCOP pooled
  marriedTwoIncomes: 44000, // Married couple, two incomes — per-spouse max (simplified model)
  oneParent:       48000,  // One-parent family (single person with qualifying child)
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — TAX CREDITS
// Tax credits reduce the final income tax liability (not taxable income).
// They are non-refundable: cannot reduce IT below zero.
// Ref: Ireland/ireland_tax_documentation.md §4
// ─────────────────────────────────────────────────────────────────────────────

// Personal Tax Credit — varies by status
const PERSONAL_CREDIT_SINGLE   = 2000;  // Single person — 2026
const PERSONAL_CREDIT_MARRIED  = 4000;  // Married couple — 2026 (double the single credit)
const PERSONAL_CREDIT_ONE_PARENT = 2000; // One-parent family gets single personal credit

// PAYE Tax Credit — available to all PAYE employees
const PAYE_CREDIT = 2000;  // 2026 value

// Single Person Child Carer Credit (SPCCC) — for primary carers
// Only one parent can claim this per child. Available to single/widowed/separated.
const SPCCC_CREDIT = 1900;  // 2026 value

// Home Carer Tax Credit — for married couples where one spouse works in the home
// Subject to the home carer having income not exceeding €7,200 (full credit)
// Tapered above €7,200 — credit reduced by 50% of excess over €7,200
// Fully withdrawn when home carer's income reaches €10,800
const HOME_CARER_CREDIT = 1950;         // 2026 value
const HOME_CARER_INCOME_LIMIT = 7200;   // income threshold for full credit
const HOME_CARER_TAPER_RATE = 0.50;     // credit reduced by 50% of excess

// Rent Tax Credit — for tenants in private rented accommodation
// Different amounts for singles vs. married couples
const RENT_CREDIT_SINGLE  = 1000;  // 2026 value for single/widowed
const RENT_CREDIT_MARRIED = 2000;  // 2026 value for married couple
// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — USC (Universal Social Charge)
// A progressive charge on gross income (before pension deductions).
// Key features:
//   - Exemption: total income ≤ €13,000 = no USC at all
//   - 4 standard bands: 0.5%, 2%, 3%, 8%
//   - Reduced rates available for medical card holders / over 70s with income ≤ €60,000
// Pension contributions do NOT reduce the USC base — it applies to gross income.
// Ref: Ireland/ireland_tax_documentation.md §5
// ─────────────────────────────────────────────────────────────────────────────

// USC exemption threshold — total income at or below this = zero USC
const USC_EXEMPTION_THRESHOLD = 13000;  // 2026
// Standard USC bands and rates — applied cumulatively (marginal)
const USC_BANDS = [
  { limit: 12012,    rate: 0.005 },  // 0.5% on first €12,012
  { limit: 28700,    rate: 0.02  },  // 2.0% on €12,012.01 – €28,700 (increased in Budget 2026)
  { limit: 70044,    rate: 0.03  },  // 3.0% on €28,700.01 – €70,044
  { limit: Infinity, rate: 0.08  },  // 8.0% on balance above €70,044
];

// Reduced USC rates — for medical card holders or persons aged 70+ with income ≤ €60,000
// Only two effective bands: 0.5% on first €12,012, 2% on the remainder
const USC_REDUCED_INCOME_LIMIT = 60000; // reduced rates only if total income ≤ this
const USC_REDUCED_BANDS = [
  { limit: 12012,    rate: 0.005 },  // 0.5% on first €12,012
  { limit: Infinity, rate: 0.02  },  // 2.0% on all income above €12,012
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — PRSI (Pay-Related Social Insurance) — Employee
// Class A employee contributions. Key features:
//   - Exemption cliff at €352/week (€18,304/year): below = no PRSI
//   - Above €352/week, PRSI applies to ALL earnings from €0 (not just excess)
//   - Tapered credit for weekly income €352.01 – €424 smooths the cliff
//   - Split-year rate change in 2026: 4.2% before Oct, 4.35% from Oct
//   - We use a blended annual rate for simplicity
// Ref: Ireland/ireland_tax_documentation.md §6
// ─────────────────────────────────────────────────────────────────────────────

// PRSI exemption cliff — weekly threshold. Below this: zero PRSI.
// At or above: PRSI applies to ALL earnings (not just excess over threshold).
const PRSI_WEEKLY_EXEMPTION = 352;  // €352/week// Annual equivalent for the exemption check
const PRSI_ANNUAL_EXEMPTION = PRSI_WEEKLY_EXEMPTION * 52;  // €18,304

// PRSI employee rates — 2026 split-year change// Jan–Sep 2026 (39 weeks): 4.2%
// Oct–Dec 2026 (13 weeks): 4.35%
// Blended annual rate: (4.2% × 39 + 4.35% × 13) / 52 = 4.2375%
const PRSI_RATE_JAN_SEP = 0.042;   // 4.2% — Jan–Sep 2026
const PRSI_RATE_OCT_DEC = 0.0435;  // 4.35% — Oct–Dec 2026
const PRSI_WEEKS_JAN_SEP = 39;     // weeks in Jan–Sep (39 out of 52)
const PRSI_WEEKS_OCT_DEC = 13;     // weeks in Oct–Dec
const PRSI_BLENDED_RATE = (PRSI_RATE_JAN_SEP * PRSI_WEEKS_JAN_SEP
                         + PRSI_RATE_OCT_DEC * PRSI_WEEKS_OCT_DEC) / 52;
// = (0.042 × 39 + 0.0435 × 13) / 52 = 0.042375 ≈ 4.2375%

// PRSI tapered credit — smooths the cliff between €352 and €424/week
// Credit = €12/week minus (1/6 × (weekly income - €352.01))
// Applied as annual values in computePRSI().
const PRSI_CREDIT_MAX = 12;              // €12/week maximum credit
const PRSI_CREDIT_TAPER_START = 352.01;  // credit begins tapering here (weekly)
const PRSI_CREDIT_TAPER_END = 424;       // credit fully withdrawn above this (weekly)
// At €424/week: credit = €12 - (1/6 × (424 - 352.01)) = €12 - €12.00 = €0

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — PRSI — Employer
// Class A employer PRSI has two rates depending on employee weekly earnings:
//   - ≤ €552/week: 9.0% (Jan-Sep) / 9.15% (Oct-Dec) — blended ≈ 9.0375%
//   - > €552/week: 11.25% (Jan-Sep) / 11.40% (Oct-Dec) — blended ≈ 11.2875%
// Employer PRSI applies to ALL employee earnings (no threshold exemption for employer).
// ─────────────────────────────────────────────────────────────────────────────

// Employer PRSI also has split-year rates in 2026:
// Jan-Sep: 9.0% (≤€552/wk) / 11.25% (>€552/wk)
// Oct-Dec: 9.15% (≤€552/wk) / 11.40% (>€552/wk)
// Blended annual rates:
const EMPLOYER_PRSI_LOW_RATE = (0.09 * 39 + 0.0915 * 13) / 52;    // ≈ 9.0375%
const EMPLOYER_PRSI_HIGH_RATE = (0.1125 * 39 + 0.1140 * 13) / 52; // ≈ 11.2875%
const EMPLOYER_PRSI_WEEKLY_THRESHOLD = 552; // weekly threshold for rate selection

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PENSION CONTRIBUTION RELIEF
// Tax relief on employee pension contributions (occupational / PRSA):
//   - Relief given at marginal rate (i.e., reduces income tax base)
//   - Does NOT reduce USC or PRSI base — those apply to gross income
//   - Subject to age-related percentage limits on gross salary
//   - Subject to an overall earnings cap of €115,000
// Ref: Ireland/ireland_tax_documentation.md §7
// ─────────────────────────────────────────────────────────────────────────────

// Age-related percentage limits for pension contribution relief// The maximum % of gross salary that qualifies for income tax relief.
const PENSION_AGE_LIMITS = [
  { maxAge: 29, rate: 0.15 },  // under 30: 15%
  { maxAge: 39, rate: 0.20 },  // 30–39: 20%
  { maxAge: 49, rate: 0.25 },  // 40–49: 25%
  { maxAge: 54, rate: 0.30 },  // 50–54: 30%
  { maxAge: 59, rate: 0.35 },  // 55–59: 35%
  { maxAge: Infinity, rate: 0.40 },  // 60+: 40%
];

// Earnings cap for pension relief — contributions above this % of cap get no relief
const PENSION_EARNINGS_CAP = 115000;  // €115,000
// ─────────────────────────────────────────────────────────────────────────────
// USC COMPUTATION
// Calculates USC on gross annual income using marginal bands.
// USC applies to total gross income — pension contributions do NOT reduce it.
// If total income ≤ €13,000, USC is zero (full exemption).
//
// @param {number} grossIncome - annual gross income (before any deductions)
// @param {boolean} reducedRates - true if medical card holder / 70+ with income ≤ €60,000
// @returns {number} Annual USC amount in EUR
// ─────────────────────────────────────────────────────────────────────────────
function computeUSC(grossIncome, reducedRates = false) {
  // USC exemption: if total income is at or below €13,000, no USC is charged
  if (grossIncome <= USC_EXEMPTION_THRESHOLD) {
    return 0;
  }

  // Select the appropriate band table
  // Reduced rates only apply if income ≤ €60,000 AND the flag is set
  const bands = (reducedRates && grossIncome <= USC_REDUCED_INCOME_LIMIT)
    ? USC_REDUCED_BANDS
    : USC_BANDS;

  let totalUSC = 0;
  let remainingIncome = grossIncome;
  let previousLimit = 0;

  // Apply each band cumulatively (marginal rate system)
  for (const band of bands) {
    // Width of this band
    const bandWidth = band.limit - previousLimit;

    // Amount of income falling within this band
    const incomeInBand = Math.min(remainingIncome, bandWidth);

    if (incomeInBand <= 0) break;

    totalUSC += incomeInBand * band.rate;
    remainingIncome -= incomeInBand;
    previousLimit = band.limit;
  }

  return Math.round(totalUSC * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRSI EMPLOYEE COMPUTATION
// Calculates Class A employee PRSI on annual gross income.
//
// Key mechanics:
// 1. Below €352/week (€18,304/year): ZERO PRSI (exemption cliff)
// 2. Above €352/week: PRSI applies to ALL earnings (from €0, not just excess)
// 3. Tapered credit smooths the cliff for weekly income €352.01 – €424
// 4. 2026 uses a blended annual rate: 4.2375% (split-year Jan–Sep/Oct–Dec)
//
// Pension contributions do NOT reduce the PRSI base.
//
// @param {number} annualGross - annual gross income
// @returns {{ prsi: number, credit: number, grossPRSI: number }}
//   prsi: net PRSI payable; credit: tapered credit applied; grossPRSI: before credit
// ─────────────────────────────────────────────────────────────────────────────
function computePRSI(annualGross) {
  // Convert to weekly for threshold checks
  const weeklyGross = annualGross / 52;

  // Below €352/week exemption cliff: no PRSI at all
  if (weeklyGross <= PRSI_WEEKLY_EXEMPTION) {
    return { prsi: 0, credit: 0, grossPRSI: 0 };
  }

  // PRSI applies to ALL earnings (from €0) once above the €352/week cliff
  // Using blended annual rate (4.2375%) for 2026 split-year
  const grossPRSI = annualGross * PRSI_BLENDED_RATE;

  // Tapered credit for weekly income between €352.01 and €424
  // Credit = €12/week - (1/6 × (weekly income - €352.01))
  // Annualised: multiply weekly credit by 52
  let weeklyCredit = 0;
  if (weeklyGross <= PRSI_CREDIT_TAPER_END) {
    // Within the taper zone — calculate the weekly credit
    weeklyCredit = PRSI_CREDIT_MAX - (1 / 6) * (weeklyGross - PRSI_CREDIT_TAPER_START);
    weeklyCredit = Math.max(0, weeklyCredit); // floor at zero
  }
  // Above €424/week: no credit (weeklyCredit remains 0)

  const annualCredit = weeklyCredit * 52;
  const netPRSI = Math.max(0, grossPRSI - annualCredit);

  return {
    prsi: Math.round(netPRSI * 100) / 100,
    credit: Math.round(annualCredit * 100) / 100,
    grossPRSI: Math.round(grossPRSI * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYER PRSI COMPUTATION
// Employer PRSI rate depends on the employee's weekly earnings:
//   - ≤ €552/week: blended ≈ 9.0375% (9.0% Jan-Sep / 9.15% Oct-Dec)
//   - > €552/week: blended ≈ 11.2875% (11.25% Jan-Sep / 11.40% Oct-Dec)
// Applied to total employee earnings (no exemption cliff for employer).
//
// @param {number} annualGross - annual gross employee salary
// @returns {number} Annual employer PRSI amount in EUR
// ─────────────────────────────────────────────────────────────────────────────
function computeEmployerPRSI(annualGross) {
  const weeklyGross = annualGross / 52;

  // Select rate based on weekly earnings threshold
  const rate = (weeklyGross <= EMPLOYER_PRSI_WEEKLY_THRESHOLD)
    ? EMPLOYER_PRSI_LOW_RATE
    : EMPLOYER_PRSI_HIGH_RATE;

  return Math.round(annualGross * rate * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// INCOME TAX COMPUTATION
// Two-rate system: 20% (standard) on income up to SRCOP, 40% on the remainder.
// Tax credits are subtracted from the gross tax to give the net IT liability.
// Tax credits cannot reduce IT below zero (non-refundable).
//
// @param {number} taxableIncome - annual income after pension relief deduction
// @param {number} srcop - Standard Rate Cut-Off Point for this marital status
// @param {number} totalCredits - total annual tax credits
// @returns {{ grossTax: number, netTax: number, standardRateTax: number, higherRateTax: number }}
// ─────────────────────────────────────────────────────────────────────────────
function computeIncomeTax(taxableIncome, srcop, totalCredits) {
  if (taxableIncome <= 0) {
    return { grossTax: 0, netTax: 0, standardRateTax: 0, higherRateTax: 0 };
  }

  // Income taxed at the standard rate (20%): up to the SRCOP
  const incomeAtStandardRate = Math.min(taxableIncome, srcop);
  const standardRateTax = incomeAtStandardRate * IT_STANDARD_RATE;

  // Income taxed at the higher rate (40%): everything above the SRCOP
  const incomeAtHigherRate = Math.max(0, taxableIncome - srcop);
  const higherRateTax = incomeAtHigherRate * IT_HIGHER_RATE;

  // Gross tax before credits
  const grossTax = standardRateTax + higherRateTax;

  // Apply tax credits — non-refundable (cannot reduce below zero)
  const netTax = Math.max(0, grossTax - totalCredits);

  return {
    grossTax: Math.round(grossTax * 100) / 100,
    netTax: Math.round(netTax * 100) / 100,
    standardRateTax: Math.round(standardRateTax * 100) / 100,
    higherRateTax: Math.round(higherRateTax * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PENSION RELIEF COMPUTATION
// Calculates the maximum pension contribution eligible for income tax relief.
// Relief is given at the marginal rate (reduces the IT base).
// Subject to:
//   1. Age-related percentage limit on gross salary
//   2. Earnings cap of €115,000
// Does NOT reduce USC or PRSI base — only income tax.
//
// @param {number} annualGross - annual gross salary
// @param {number} pensionPct - employee pension contribution as % of gross
// @param {number} age - employee's age for age-related limits
// @returns {{ contribution: number, relievable: number, exceeds: boolean }}
// ─────────────────────────────────────────────────────────────────────────────
function computePensionRelief(annualGross, pensionPct, age) {
  // Actual employee pension contribution
  const contribution = annualGross * (pensionPct / 100);

  if (contribution <= 0) {
    return { contribution: 0, relievable: 0, exceeds: false };
  }

  // Determine age-related percentage limit
  let ageLimit = 0.15; // default: under 30
  for (const bracket of PENSION_AGE_LIMITS) {
    if (age <= bracket.maxAge) {
      ageLimit = bracket.rate;
      break;
    }
  }

  // The relievable salary base is capped at €115,000
  const cappedSalary = Math.min(annualGross, PENSION_EARNINGS_CAP);

  // Maximum relievable contribution = age-limit % of capped salary
  const maxRelievable = cappedSalary * ageLimit;

  // Actual relievable amount is the lesser of contribution and max
  const relievable = Math.min(contribution, maxRelievable);

  // Flag if the actual contribution exceeds the relievable limit
  const exceeds = contribution > maxRelievable;

  return {
    contribution: Math.round(contribution * 100) / 100,
    relievable: Math.round(relievable * 100) / 100,
    exceeds,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BREAKDOWN FUNCTION
// Orchestrates all Irish tax computations for a given monthly gross salary.
//
// @param {number} gross - monthly gross salary in EUR
// @param {object} opts - user-selected options from the UI
// @returns {object} Full breakdown consumed by UI rendering methods
// ─────────────────────────────────────────────────────────────────────────────
function computeBreakdown(gross, opts) {
  const {
    maritalStatus,    // 'single' | 'marriedOneIncome' | 'marriedTwoIncomes' | 'oneParent'
    uscReduced,       // boolean: medical card holder / 70+ with income ≤ €60k
    claimSPCCC,       // boolean: claiming Single Person Child Carer Credit
    claimHomeCarer,   // boolean: claiming Home Carer Tax Credit
    claimRentCredit,  // boolean: claiming Rent Tax Credit
    pensionPct,       // number: employee pension contribution as % of gross
    age,              // number: employee age (for pension relief limits)
  } = opts;

  // ── Annual gross ──
  const annualGross = gross * 12;

  // ── Determine the Standard Rate Cut-Off Point for this marital status ──
  const srcop = SRCOP[maritalStatus] || SRCOP.single;

  // ── Pension relief — reduces IT base only (NOT USC/PRSI) ──
  const pensionPctNum = Number(pensionPct) || 0;
  const ageNum = Number(age) || 30;
  const pension = computePensionRelief(annualGross, pensionPctNum, ageNum);

  // Taxable income for income tax = gross minus relievable pension contribution
  const taxableIncomeForIT = Math.max(0, annualGross - pension.relievable);

  // ── Tax credits — accumulate all applicable credits ──
  let totalCredits = 0;

  // Personal Tax Credit — depends on marital status
  if (maritalStatus === 'marriedOneIncome' || maritalStatus === 'marriedTwoIncomes') {
    totalCredits += PERSONAL_CREDIT_MARRIED;
  } else {
    totalCredits += PERSONAL_CREDIT_SINGLE;
  }

  // PAYE Tax Credit — available to all PAYE employees
  // Capped at lower of €2,000 or 20% of PAYE income (relevant if income < €10,000)
  totalCredits += Math.min(PAYE_CREDIT, annualGross * 0.20);

  // SPCCC — Single Person Child Carer Credit (only for single/one-parent)
  if (claimSPCCC && (maritalStatus === 'single' || maritalStatus === 'oneParent')) {
    totalCredits += SPCCC_CREDIT;
  }

  // Home Carer Credit — only for married couples with one income
  // In this simplified model, we assume the home carer has zero income (full credit)
  // A more complete implementation would ask for the home carer's income and taper
  if (claimHomeCarer && maritalStatus === 'marriedOneIncome') {
    totalCredits += HOME_CARER_CREDIT;
  }

  // Rent Tax Credit — different amounts for single vs married
  if (claimRentCredit) {
    if (maritalStatus === 'marriedOneIncome' || maritalStatus === 'marriedTwoIncomes') {
      totalCredits += RENT_CREDIT_MARRIED;
    } else {
      totalCredits += RENT_CREDIT_SINGLE;
    }
  }

  // ── Income Tax ──
  const incomeTax = computeIncomeTax(taxableIncomeForIT, srcop, totalCredits);
  const annualIT = incomeTax.netTax;

  // ── USC — applies to gross income (NOT reduced by pension contributions) ──
  const annualUSC = computeUSC(annualGross, uscReduced);

  // ── PRSI — applies to gross income (NOT reduced by pension contributions) ──
  const prsiResult = computePRSI(annualGross);
  const annualPRSI = prsiResult.prsi;

  // ── Employer PRSI ──
  const annualEmployerPRSI = computeEmployerPRSI(annualGross);

  // ── Annual totals ──
  const annualTotalDeductions = annualIT + annualUSC + annualPRSI + pension.contribution;
  const annualNetSalary = annualGross - annualTotalDeductions;

  // ── Monthly figures ──
  const monthlyIT   = annualIT / 12;
  const monthlyUSC  = annualUSC / 12;
  const monthlyPRSI = annualPRSI / 12;
  const monthlyPension = pension.contribution / 12;
  const monthlyTotalDeductions = monthlyIT + monthlyUSC + monthlyPRSI + monthlyPension;
  const monthlyNet = gross - monthlyTotalDeductions;

  // ── Employer cost ──
  const annualEmployerCost = annualGross + annualEmployerPRSI;
  const monthlyEmployerCost = annualEmployerCost / 12;

  // ── Effective rates (as % of gross — useful headline figures) ──
  const effectiveITRate = annualGross > 0 ? (annualIT / annualGross) * 100 : 0;
  const effectiveUSCRate = annualGross > 0 ? (annualUSC / annualGross) * 100 : 0;
  const effectivePRSIRate = annualGross > 0 ? (annualPRSI / annualGross) * 100 : 0;
  const overallEffectiveRate = annualGross > 0
    ? ((annualIT + annualUSC + annualPRSI) / annualGross) * 100
    : 0;

  return {
    // ── Core monthly figures ──
    gross,                        // monthly gross salary input
    monthlyIT,                    // monthly income tax (after credits)
    monthlyUSC,                   // monthly USC
    monthlyPRSI,                  // monthly employee PRSI
    monthlyPension,               // monthly pension contribution
    monthlyTotalDeductions,       // monthly total deductions
    monthlyNet,                   // monthly net take-home

    // ── Annual figures ──
    annualGross,
    annualIT,
    annualUSC,
    annualPRSI,
    annualPRSICredit: prsiResult.credit,   // tapered PRSI credit applied
    annualPRSIGross: prsiResult.grossPRSI, // PRSI before credit
    annualPension: pension.contribution,
    annualPensionRelievable: pension.relievable,
    pensionExceedsLimit: pension.exceeds,
    annualTotalDeductions,
    annualNetSalary,
    annualEmployerPRSI,
    annualEmployerCost,

    // ── Tax calculation details ──
    srcop,                         // Standard Rate Cut-Off Point used
    taxableIncomeForIT,            // income subject to IT (after pension relief)
    totalCredits,                  // total tax credits applied
    grossTax: incomeTax.grossTax,  // IT before credits
    standardRateTax: incomeTax.standardRateTax,  // IT at 20%
    higherRateTax: incomeTax.higherRateTax,      // IT at 40%

    // ── Effective rates ──
    effectiveITRate,
    effectiveUSCRate,
    effectivePRSIRate,
    overallEffectiveRate,

    // ── Flags ──
    maritalStatus,
    uscReduced: !!uscReduced,
    prsiExempt: annualGross <= PRSI_ANNUAL_EXEMPTION,  // below €352/week cliff
    inPRSITaperZone: (annualGross / 52) > PRSI_WEEKLY_EXEMPTION
                  && (annualGross / 52) <= PRSI_CREDIT_TAPER_END,

    // ── Generic summary fields consumed by shared components ──
    // These field names must match what CalculatorPage / DonutChart / etc. expect
    totalTaxes:          monthlyIT,
    totalSocialSecurity: monthlyUSC + monthlyPRSI,
    netSalary:           monthlyNet,
    totalDeductions:     monthlyTotalDeductions,
    annualNetSalary:     annualNetSalary,
    totalEmployerCost:   monthlyEmployerCost,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY CONFIG OBJECT
// This is the shape all country modules must export — consumed by CalculatorPage
// and other shared components via the lazy loader in main.js.
// ─────────────────────────────────────────────────────────────────────────────
const ireland = {
  id: 'ireland',
  name: 'Ireland',
  localName: 'Éire',
  flag: '🇮🇪',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'en-IE',
  accentColor: '#169B62',       // Irish green
  accentSecondary: '#FF883E',   // Irish orange

  // Salary range: €1,500/month (approx min wage) to €20,000/month (top earners)
  salaryRange: { min: 1500, max: 20000, step: 100, default: 4000 },

  // ── Options UI schema ──
  // Defines all user-configurable inputs rendered by SalaryInput.js
  options: [
    // ── Marital Status ──
    {
      id: 'maritalStatus',
      type: 'select',
      label: 'Marital Status',
      sublabel: 'Affects your Standard Rate Cut-Off Point and personal tax credit',
      choices: [
        { value: 'single',            label: 'Single' },
        { value: 'marriedOneIncome',  label: 'Married (one income)' },
        { value: 'marriedTwoIncomes', label: 'Married (two incomes)' },
        { value: 'oneParent',         label: 'One-parent family' },
      ],
    },

    // ── Age (for pension relief limits) ──
    {
      id: 'age',
      type: 'number',
      label: 'Age',
      sublabel: 'Used for age-related pension contribution relief limits',
      min: 18, max: 75, step: 1,
    },

    // ── Pension ──
    {
      id: 'pensionPct',
      type: 'number',
      label: 'Pension contribution (%)',
      sublabel: 'Employee contribution as % of gross — reduces income tax base only (not USC/PRSI)',
      min: 0, max: 40, step: 0.5,
    },

    // ── USC reduced rates ──
    {
      id: 'uscReduced',
      type: 'toggle',
      label: 'Reduced USC rates',
      sublabel: 'Medical card holder or aged 70+ with total income ≤ €60,000',
    },

    // ── Tax Credits ──
    {
      id: 'claimSPCCC',
      type: 'toggle',
      label: 'Single Person Child Carer Credit',
      sublabel: 'Primary carer of a qualifying child — €1,900/year',
      showWhen: ctx => ctx.maritalStatus === 'single' || ctx.maritalStatus === 'oneParent',
    },
    {
      id: 'claimHomeCarer',
      type: 'toggle',
      label: 'Home Carer Tax Credit',
      sublabel: 'Married couple where one spouse cares for dependants at home — €1,950/year',
      showWhen: ctx => ctx.maritalStatus === 'marriedOneIncome',
    },
    {
      id: 'claimRentCredit',
      type: 'toggle',
      label: 'Rent Tax Credit',
      sublabel: 'Renting private accommodation — €1,000/year (single) or €2,000/year (married)',
    },
  ],

  // ── Default option values ──
  defaultOptions() {
    return {
      maritalStatus: 'single',
      age: 30,
      pensionPct: 0,
      uscReduced: false,
      claimSPCCC: false,
      claimHomeCarer: false,
      claimRentCredit: false,
    };
  },

  // ── Main computation entry point ──
  computeBreakdown(gross, opts) {
    return computeBreakdown(gross, opts);
  },

  // ── Reverse calculation: find gross given target monthly net ──
  reverseFromNet(targetNet, opts) {
    let lo = 0, hi = targetNet * 4; // conservative upper bound
    for (let i = 0; i < 60; i++) {
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
  getDonutSegments(breakdown) {
    const segments = [
      { label: 'Net Take-home',   value: Math.max(0, breakdown.monthlyNet), color: '#059669' },
      { label: 'Income Tax',      value: breakdown.monthlyIT,               color: '#e94560' },
      { label: 'USC',             value: breakdown.monthlyUSC,              color: '#f59e0b' },
      { label: 'PRSI',            value: breakdown.monthlyPRSI,             color: '#3b82f6' },
    ];
    if (breakdown.monthlyPension > 0) {
      segments.push({ label: 'Pension', value: breakdown.monthlyPension, color: '#8b5cf6' });
    }
    return segments.filter(s => s.value > 0);
  },

  // ── Breakdown rows for the detailed deductions table ──
  getBreakdownRows(breakdown) {
    const rows = [];
    const r = breakdown;

    rows.push({ label: 'Monthly Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    // ── Income Tax section ──
    rows.push({ type: 'section', label: 'Income Tax (IT)' });

    // Show the SRCOP for context
    rows.push({
      label: `Standard Rate Band (20%): €${r.srcop.toLocaleString()}`,
      amount: r.standardRateTax / 12,
      type: 'deduction',
    });

    if (r.higherRateTax > 0) {
      rows.push({
        label: 'Higher Rate (40%)',
        amount: r.higherRateTax / 12,
        type: 'deduction',
      });
    }

    // Show tax credits as a benefit
    rows.push({
      label: `Tax Credits (€${r.totalCredits.toLocaleString()}/year)`,
      amount: r.totalCredits / 12,
      type: 'benefit',
      icon: '🏷️',
    });

    rows.push({ label: 'Income Tax (net of credits)', amount: r.monthlyIT, type: 'deduction' });

    // ── USC section ──
    rows.push({ type: 'section', label: 'Universal Social Charge (USC)' });
    if (r.annualGross <= USC_EXEMPTION_THRESHOLD) {
      rows.push({
        label: 'USC exempt — income ≤ €13,000',
        amount: 0,
        type: 'benefit',
        icon: '✅',
      });
    } else {
      if (r.uscReduced) {
        rows.push({
          label: 'USC (reduced rates — medical card / 70+)',
          amount: r.monthlyUSC,
          type: 'deduction',
        });
      } else {
        rows.push({ label: 'USC', amount: r.monthlyUSC, type: 'deduction' });
      }
    }

    // ── PRSI section ──
    rows.push({ type: 'section', label: 'PRSI (Employee — Class A)' });
    if (r.prsiExempt) {
      rows.push({
        label: 'PRSI exempt — income below €352/week',
        amount: 0,
        type: 'benefit',
        icon: '✅',
      });
    } else {
      rows.push({
        label: `PRSI (blended 4.24% for 2026)`,
        amount: r.monthlyPRSI,
        type: 'deduction',
      });
      if (r.inPRSITaperZone) {
        rows.push({
          label: '⚠ PRSI tapered credit applied (income €352–€424/week zone)',
          amount: null,
          type: 'note',
        });
      }
    }

    // ── Pension section (if applicable) ──
    if (r.monthlyPension > 0) {
      rows.push({ type: 'section', label: 'Pension Contribution' });
      rows.push({
        label: 'Employee Pension',
        amount: r.monthlyPension,
        type: 'deduction',
      });

      // Show relievable vs actual if they differ
      if (r.pensionExceedsLimit) {
        rows.push({
          label: `⚠ Only €${r.annualPensionRelievable.toLocaleString()}/year qualifies for tax relief (age/cap limit)`,
          amount: null,
          type: 'note',
        });
      }
    }

    // ── Totals ──
    rows.push({
      label: 'Total Deductions',
      amount: r.monthlyTotalDeductions,
      type: 'subtotal deduction',
      icon: '📌',
    });
    rows.push({
      label: 'Monthly Net Take-home',
      amount: r.monthlyNet,
      type: 'subtotal net',
      icon: '✅',
    });

    return rows;
  },

  // ── Employer cost bars (for employer view) ──
  getEmployerBars(breakdown) {
    const r = breakdown;
    const weeklyGross = r.annualGross / 52;
    const employerPRSIRate = weeklyGross <= EMPLOYER_PRSI_WEEKLY_THRESHOLD
      ? `${(EMPLOYER_PRSI_LOW_RATE * 100).toFixed(1)}%`
      : `${(EMPLOYER_PRSI_HIGH_RATE * 100).toFixed(2)}%`;

    return [
      { label: 'Gross Salary',                    value: r.gross,                       color: '#3b82f6' },
      { label: `Employer PRSI (${employerPRSIRate})`, value: r.annualEmployerPRSI / 12, color: '#8b5cf6' },
    ];
  },

  // ── Annual summary chart segments ──
  getAnnualSegments(breakdown) {
    const segments = [
      { label: 'Net Take-home',    value: breakdown.annualNetSalary,    color: '#059669' },
      { label: 'Income Tax',       value: breakdown.annualIT,           color: '#e94560' },
      { label: 'USC',              value: breakdown.annualUSC,          color: '#f59e0b' },
      { label: 'PRSI (Employee)',  value: breakdown.annualPRSI,         color: '#3b82f6' },
      { label: 'PRSI (Employer)',  value: breakdown.annualEmployerPRSI, color: '#8b5cf6' },
    ];
    if (breakdown.annualPension > 0) {
      segments.push({ label: 'Pension', value: breakdown.annualPension, color: '#a78bfa' });
    }
    return segments.filter(s => s.value > 0);
  },
};

export default ireland;
