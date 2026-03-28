/* ══════════════════════════════════════════════════════════
   ExpatCalc — Portugal Configuration & Tax Computation
   2026 tax rules: IRS brackets, SS 11%, IFICI flat 20%

   Meal allowance (subsídio de refeição) logic:
   - Legal basis: CIRS Art. 2(3)(b)(2); Art. 46 Código Contributivo
   - 2026 exempt limits: €6.15/day (cash), €10.46/day (card/voucher)
   - Source: Portaria n.º 51-B/2026/1, 30 Jan 2026
   - Only the daily excess above the exempt limit is taxable.
   - The taxable excess is added to the SS base and withholding base.
   ══════════════════════════════════════════════════════════ */

// ── IRS tax brackets 2026 ──
const BRACKETS = [
  { limit: 8342,      rate: 0.1250, parcela: 0 },
  { limit: 12587,     rate: 0.1570, parcela: 266.94 },
  { limit: 17838,     rate: 0.2120, parcela: 959.26 },
  { limit: 23089,     rate: 0.2410, parcela: 1476.45 },
  { limit: 29397,     rate: 0.3110, parcela: 3092.77 },
  { limit: 43090,     rate: 0.3490, parcela: 4209.94 },
  { limit: 46566,     rate: 0.4310, parcela: 7743.27 },
  { limit: 86634,     rate: 0.4460, parcela: 8441.48 },
  { limit: Infinity,  rate: 0.4800, parcela: 11387.17 },
];

// ── Social security ──
const SS_EMPLOYEE = 0.11;
const SS_EMPLOYER = 0.2375;

// ── Deductions & minimums ──
const SPECIFIC_DEDUCTION = 4587.09;
const MINIMO_EXISTENCIA  = 12880;

// ── Meal allowance (subsídio de refeição) ──
// Source: Portaria n.º 51-B/2026/1, de 30 de janeiro de 2026 (effective 1 Jan 2026)
// CIRS Art. 2(3)(b)(2): the daily exempt limit for card/voucher is cash limit × 1.70.
// Only the portion exceeding the daily exempt limit is taxable Category A income.
const MEAL_WORKING_DAYS_DEFAULT = 22;   // Standard Portuguese convention; configurable via UI
const MEAL_TAX_FREE_CASH        = 6.15; // €/day — public sector reference value (Portaria 51-B/2026/1)
const MEAL_TAX_FREE_CARD        = 10.46; // €/day — €6.15 × 1.70 = €10.455 ≈ €10.46 (CIRS Art. 2(3)(b)(2))

// ── Abono de Família (child benefit) ──
const ABONO_PER_CHILD = 42.07;

// ── IRS annual bracket calculation (CIRS Art. 68) ──
// Used for the final annual tax liability view only, not for payslip withholding.
// Applies a cascade of marginal rates on annual taxable income (after SS and specific deduction).
function computeIRS(taxableIncome) {
  for (let i = 0; i < BRACKETS.length; i++) {
    if (taxableIncome <= BRACKETS[i].limit) {
      return Math.max(0, taxableIncome * BRACKETS[i].rate - BRACKETS[i].parcela);
    }
  }
  const last = BRACKETS[BRACKETS.length - 1];
  return Math.max(0, taxableIncome * last.rate - last.parcela);
}

// ── IRS withholding tables 2026 — Continente, Categoria A ──────────────────
// Source: Despacho n.º 233-A/2026, 5 January 2026
// Formula: retenção = remuneração_mensal_bruta × taxa − parcela_a_abater
//          (result floored at zero; cannot produce negative withholding)
//
// Applied directly to MONTHLY GROSS SALARY — not to taxable income after deductions.
// This is the employer payslip withholding amount, matching the AT payslip simulator.
//
// Table I — Não casado (single) or married two earners, no dependents
// The bottom two brackets use a formula-based parcela (income-tapering mechanism to
// avoid a sharp cliff at the withholding threshold).  All other brackets use fixed parcelas.
//
// CRITICAL: Use parcela €823.40 for the €5,547–€20,221 bracket.
// Several secondary sources (Montepio etc.) incorrectly quote €893.75 — that value does
// NOT reproduce the AT's own reference output.  Confirmed correct value: €823.40.
// Verification: €7,000 × 44.95% − €823.40 = €2,323.10 ✓ (matches AT simulator exactly)
//
// Per-dependent additional deduction: €21.43/month per dependent (2026).
// Source: Despacho n.º 233-A/2026, Table I footnote.
const WITHHOLDING_TABLE_SINGLE_NO_DEP = [
  // limit        rate      parcela    notes
  { limit:   920, rate: 0.0000, parcela: 0       }, // below threshold → zero withholding
  // Next two brackets: formula-based parcela (tapering mechanism, CIRS Art. 99-C)
  // Bracket: up to €1,042  — formula: 12.50% × 2.60 × (1,273.85 − R)
  // Bracket: up to €1,108  — formula: 15.70% × 1.35 × (1,554.83 − R)
  // These are handled inline in computeWithholdingRetencao() below.
  { limit:  1042, rate: null,   parcela: null    }, // sentinel — see formula handling below
  { limit:  1108, rate: null,   parcela: null    }, // sentinel — see formula handling below
  { limit:  1154, rate: 0.1570, parcela:   94.71 },
  { limit:  1212, rate: 0.2120, parcela:  158.18 },
  { limit:  1819, rate: 0.2410, parcela:  193.33 },
  { limit:  2119, rate: 0.3110, parcela:  320.66 },
  { limit:  2499, rate: 0.3490, parcela:  401.19 },
  { limit:  3305, rate: 0.3836, parcela:  487.66 },
  { limit:  5547, rate: 0.3969, parcela:  531.62 },
  { limit: 20221, rate: 0.4495, parcela:  823.40 }, // ← €7,000/month falls here
  { limit: Infinity, rate: 0.4717, parcela: 1272.31 },
];

// Per-dependent monthly deduction applied after the table formula (2026)
// Source: Despacho n.º 233-A/2026, Table I
const WITHHOLDING_PER_DEPENDENT = 21.43;

/**
 * Computes the monthly IRS withholding (retenção na fonte) using the official
 * AT withholding table formula from Despacho n.º 233-A/2026.
 *
 * Formula: retenção = monthlyGross × taxa − parcela_a_abater − (PER_DEP × dependents)
 * Result is clamped to zero (cannot be negative).
 *
 * @param {number} monthlyGross   - Monthly gross salary (remuneração mensal bruta), €
 * @param {number} [dependents=0] - Number of qualifying dependents
 * @returns {number} Monthly withholding amount in €, rounded to 2 decimal places
 *
 * Source: Despacho n.º 233-A/2026; CIRS Art. 99-C
 */
function computeWithholdingRetencao(monthlyGross, dependents = 0) {
  let grossTax;

  if (monthlyGross <= 920) {
    // Below withholding threshold — no withholding due
    grossTax = 0;

  } else if (monthlyGross <= 1042) {
    // Formula-based tapering bracket (up to €1,042)
    // Source formula: taxa = 12.50%, parcela = 12.50% × 2.60 × (1,273.85 − R)
    // Expanded: grossTax = R × 0.1250 − 0.325 × (1273.85 − R) = 0.450R − 414.00
    // This taper smooths the transition from zero withholding at the threshold.
    grossTax = monthlyGross * 0.1250 - 0.325 * (1273.85 - monthlyGross);

  } else if (monthlyGross <= 1108) {
    // Formula-based tapering bracket (up to €1,108)
    // Source formula: taxa = 15.70%, parcela = 15.70% × 1.35 × (1,554.83 − R)
    // Expanded: grossTax = R × 0.1570 − 0.2120 × (1554.83 − R) = 0.3690R − 329.62
    grossTax = monthlyGross * 0.1570 - 0.2120 * (1554.83 - monthlyGross);

  } else {
    // Fixed parcela brackets — standard formula: grossTax = R × taxa − parcela
    const band = WITHHOLDING_TABLE_SINGLE_NO_DEP.find(b => monthlyGross <= b.limit && b.rate !== null);
    if (!band) {
      // Fallback: should not be reached given Infinity sentinel in table
      return 0;
    }
    grossTax = monthlyGross * band.rate - band.parcela;
  }

  // Apply per-dependent deduction and clamp to zero
  const retencao = grossTax - WITHHOLDING_PER_DEPENDENT * dependents;
  return Math.max(0, Math.round(retencao * 100) / 100);
}

// ── Country config ──
const portugal = {
  id: 'portugal',
  name: 'Portugal',
  localName: 'Portugal',
  flag: '🇵🇹',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'pt-PT',
  accentColor: '#006600',
  accentSecondary: '#ff0000',
  supportedLangs: ['en', 'pt'],

  salaryRange: { min: 500, max: 15000, step: 50, default: 2000 },

  options: [
    {
      id: 'maritalStatus', type: 'select', label: 'Marital Status',
      choices: [
        { value: 'single', label: 'Single' },
        { value: 'married2', label: 'Married (2 earners)' },
        { value: 'married1', label: 'Married (sole earner)' },
      ],
    },
    // NHR (Non-Habitual Resident) regime ended for new applicants in January 2024.
    // It was replaced by IFICI — Incentivo Fiscal à Investigação Científica e Inovação
    // (created by Lei n.º 21/2023, continued under the 2026 State Budget).
    // The flat 20% rate for qualifying individuals is unchanged under IFICI.
    { id: 'ifici', type: 'toggle', label: 'IFICI regime', sublabel: 'Flat 20% IRS rate for qualifying expats (replaces NHR from Jan 2024)' },
    { id: 'mealAllowance', type: 'toggle', label: 'Meal Allowance', sublabel: 'Subsídio de refeição' },
    {
      id: 'mealType', type: 'select', label: 'Meal payment type',
      sublabel: 'Card: tax-free up to €10.46/day · Cash: up to €6.15/day',
      choices: [
        { value: 'card', label: 'Meal Card' },
        { value: 'cash', label: 'Cash' },
      ],
      showWhen: ctx => ctx.mealAllowance,
    },
    {
      id: 'mealValue', type: 'number', label: 'Daily meal value (€)',
      sublabel: 'Amount received per working day',
      min: 0, max: 30, step: 0.5,
      showWhen: ctx => ctx.mealAllowance,
    },
    {
      // Working days per month determines the monthly meal total.
      // Standard Portuguese convention is 22 days; some contracts use 20.
      id: 'mealWorkingDays', type: 'number', label: 'Working days per month',
      sublabel: 'Standard is 22 days (adjust if contract differs)',
      min: 1, max: 31, step: 1,
      showWhen: ctx => ctx.mealAllowance,
    },
    { id: 'dependents', type: 'counter', label: 'Dependents (IRS deduction)', sublabel: '€600/year per dependent', min: 0, max: 10 },
    { id: 'children', type: 'counter', label: 'Children (Abono de Família)', sublabel: '€42.07/month per child', min: 0, max: 10 },
    {
      id: 'paymentsPerYear', type: 'select', label: 'Salary payments per year',
      sublabel: '14 = holiday + Christmas bonus · 13 = one bonus · 12 = no bonuses',
      choices: [
        { value: '14', label: '14 payments (standard)' },
        { value: '13', label: '13 payments' },
        { value: '12', label: '12 payments' },
      ],
    },
  ],

  defaultOptions() {
    return {
      maritalStatus: 'single',
      ifici: false,
      mealAllowance: false,
      mealType: 'card',
      mealValue: 8,
      mealWorkingDays: MEAL_WORKING_DAYS_DEFAULT, // 22 — standard Portuguese convention
      dependents: 0,
      children: 0,
      paymentsPerYear: '14',
    };
  },

  computeBreakdown(gross, opts) {
    const {
      maritalStatus, ifici,
      mealAllowance, mealType, mealValue,
      dependents, children,
    } = opts;
    const paymentsPerYear = Number(opts.paymentsPerYear) || 14;

    // Resolve working days — user-configurable, default 22 (standard Portuguese convention).
    // This controls both the monthly meal total and the exempt/taxable split.
    const workingDays = Number(opts.mealWorkingDays) || MEAL_WORKING_DAYS_DEFAULT;

    // ── Annual gross (salary only; meal allowance is a separate benefit paid each month) ──
    const annualGross = gross * paymentsPerYear;

    // ─────────────────────────────────────────────────────────────────────────────
    // MEAL ALLOWANCE (subsídio de refeição)
    // Legal basis: CIRS Art. 2(3)(b)(2); Art. 46 Código Contributivo
    //
    // Only the portion of the daily meal value that exceeds the exempt daily limit
    // is treated as taxable Category A income.  The exempt portion is excluded from
    // both IRS and Social Security bases entirely.
    //
    // Exempt daily limits 2026 (Portaria n.º 51-B/2026/1, effective 1 Jan 2026):
    //   Cash:        €6.15/day
    //   Card/voucher: €10.46/day  (= €6.15 × 1.70, per CIRS Art. 2(3)(b)(2))
    // ─────────────────────────────────────────────────────────────────────────────

    // Daily meal value: zero when meal allowance is disabled
    const dailyMealValue = mealAllowance ? (Number(mealValue) || 0) : 0;

    // Select the correct exempt daily limit based on payment method
    const mealExemptDailyLimit = (mealType === 'card') ? MEAL_TAX_FREE_CARD : MEAL_TAX_FREE_CASH;

    // Daily taxable excess — the part above the exempt threshold (CIRS Art. 2(3)(b)(2))
    const dailyMealTaxable = Math.max(0, dailyMealValue - mealExemptDailyLimit);

    // Daily exempt portion — capped at the exempt limit (can't exceed actual daily value)
    const dailyMealExempt = Math.min(dailyMealValue, mealExemptDailyLimit);

    // Monthly totals — scale by number of working days in the month
    const monthlyMealTotal    = dailyMealValue  * workingDays; // gross meal received
    const monthlyMealTaxFree  = dailyMealExempt * workingDays; // excluded from IRS and SS
    const monthlyMealTaxable  = dailyMealTaxable * workingDays; // added to IRS and SS bases

    // ─────────────────────────────────────────────────────────────────────────────
    // SOCIAL SECURITY (monthly payslip)
    // The taxable meal excess "acresce ao salário" (is added to salary) for SS purposes.
    // Art. 46 Código Contributivo — the exempt portion is fully excluded from TSU.
    // ─────────────────────────────────────────────────────────────────────────────

    // SS base = monthly gross salary + any taxable meal excess
    const monthlySsBase = gross + monthlyMealTaxable;
    const monthlySS     = monthlySsBase * SS_EMPLOYEE; // employee TSU: 11%
    const employerSS    = monthlySsBase * SS_EMPLOYER; // employer TSU: 23.75%

    // ─────────────────────────────────────────────────────────────────────────────
    // ANNUAL IRS LIABILITY (CIRS Art. 68 brackets)
    // Used for the annual overview display, not the payslip withholding figure.
    // Annual SS base mirrors the monthly logic but applied over paymentsPerYear.
    // The taxable meal excess is annualised over 12 calendar months (it is paid
    // every working month regardless of the number of salary payments per year).
    // ─────────────────────────────────────────────────────────────────────────────

    const annualSS = annualGross * SS_EMPLOYEE + monthlyMealTaxable * 12 * SS_EMPLOYEE;

    // Taxable income for annual IRS — includes annualised taxable meal excess
    const taxableIncome = Math.max(
      0,
      annualGross
      + (monthlyMealTaxable * 12)  // annualised taxable meal excess (CIRS Art. 2(3)(b)(2))
      - annualSS
      - SPECIFIC_DEDUCTION
    );

    // Mínimo de existência guard — IRS is zero if net-of-SS income is below the minimum
    const netAfterSS = annualGross - annualSS;
    const divisor = (maritalStatus === 'married1') ? 2 : 1;

    let annualIRS = 0;
    if (netAfterSS > MINIMO_EXISTENCIA) {
      if (ifici) {
        // IFICI flat rate (replaces NHR from Jan 2024) — Lei n.º 21/2023
        annualIRS = taxableIncome * 0.20;
      } else {
        const splitIncome = taxableIncome / divisor;
        annualIRS = computeIRS(splitIncome) * divisor;
        annualIRS = Math.min(annualIRS, netAfterSS - MINIMO_EXISTENCIA);
      }
      // Solidarity surcharge (Art. 68-A CIRS): 2.5% on €80k–€250k, 5% above €250k
      if (!ifici && taxableIncome > 80000) {
        const soliBase1 = Math.min(taxableIncome, 250000) - 80000;
        annualIRS += soliBase1 * 0.025;
        if (taxableIncome > 250000) annualIRS += (taxableIncome - 250000) * 0.05;
      }
      // Dependent deduction: €600/year per dependent (CIRS Art. 78-A)
      const dependentCredit = dependents * 600;
      annualIRS = Math.max(0, annualIRS - dependentCredit);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // MONTHLY IRS WITHHOLDING (retenção na fonte)
    // Source: Despacho n.º 233-A/2026, Table I (Continente, Categoria A)
    // Formula: retenção = remuneração_mensal_bruta × taxa − parcela_a_abater
    //
    // The withholding base is the monthly gross salary PLUS any taxable meal excess.
    // Per operational guidance (Cambragest, OCC): the taxable meal excess "acresce ao
    // salário e outros abonos para efeitos do cálculo da taxa de retenção de IRS".
    // Legal basis: CIRS Art. 2(3)(b)(2); confirmed by AT payslip guidance.
    //
    // When monthlyMealTaxable is zero (meal is within the exempt threshold, or no meal
    // allowance), the withholding base equals gross and behaviour is unchanged.
    //
    // For 14-payment (duodécimos) salaries, the subsidy duodécimos are withheld
    // autonomously at their own bracket (CIRS Art. 99-C) and typically produce zero
    // withholding at the subsidy fragment level — so total monthly withholding equals
    // the table result on the regular monthly gross + meal taxable excess.
    //
    // Reference: Despacho n.º 233-A/2026; CIRS Art. 99-C
    // ─────────────────────────────────────────────────────────────────────────────

    const withholdingBase = gross + monthlyMealTaxable; // gross + taxable meal excess
    const monthlyIRS = computeWithholdingRetencao(withholdingBase, dependents);

    // ── Monthly net and employer cost ──
    const totalDeductions  = monthlyIRS + monthlySS;
    const netSalary        = gross - totalDeductions; // net salary from gross only (meal is additive)
    const totalEmployerCost = gross + employerSS;

    // Abono de Família (child benefit): state transfer, not employer cost
    const abono = children * ABONO_PER_CHILD;

    // ─────────────────────────────────────────────────────────────────────────────
    // ANNUAL NET SALARY
    // Includes the full meal allowance received (both exempt and taxable portions),
    // because the meal benefit is real income regardless of its tax classification.
    // Deducts annual SS (on the corrected base) and annual IRS liability.
    // ─────────────────────────────────────────────────────────────────────────────
    const annualMealTotal  = monthlyMealTotal * 12; // total meal income over 12 calendar months
    const annualNetSalary  = annualGross + annualMealTotal - annualSS - annualIRS;

    return {
      gross,
      monthlyIRS,
      monthlySS,
      totalDeductions,
      netSalary,
      employerSS,
      totalEmployerCost,
      // Meal allowance breakdown (monthly)
      monthlyMeal:         monthlyMealTotal,
      monthlyMealTaxFree:  monthlyMealTaxFree,
      monthlyMealTaxable:  monthlyMealTaxable,
      // Annual figures
      annualGross,
      annualIRS,
      annualSS,
      annualMealTotal,
      taxableIncome,
      abono,
      // Generic summary fields consumed by shared components
      totalTaxes:            monthlyIRS,
      totalSocialSecurity:   monthlySS,
      stateBenefit:          abono,
      annualNetSalary,
      annualEmployerCost:    totalEmployerCost * paymentsPerYear,
    };
  },

  reverseFromNet(targetNet, opts) {
    let lo = 0, hi = targetNet * 3;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const r = this.computeBreakdown(mid, opts);
      if (r.netSalary < targetNet) lo = mid;
      else hi = mid;
    }
    return Math.round((lo + hi) / 2);
  },

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

  getDonutSegments(breakdown) {
    return [
      { label: 'Net Salary',       value: Math.max(0, breakdown.netSalary), color: '#059669' },
      { label: 'Income Tax (IRS)', value: breakdown.monthlyIRS,             color: '#e94560' },
      { label: 'Social Security',  value: breakdown.monthlySS,              color: '#3b82f6' },
    ].filter(s => s.value > 0);
  },

  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    rows.push({ type: 'section', label: 'Taxes' });
    rows.push({ label: 'Income Tax (IRS)', amount: r.monthlyIRS, type: 'deduction' });

    rows.push({ type: 'section', label: 'Social Security (Employee)' });
    rows.push({ label: 'Social Security 11%', amount: r.monthlySS, type: 'deduction' });

    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Net Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    // ── Meal allowance display ──────────────────────────────────────────────────
    // When the daily value is fully within the exempt threshold the entire monthly
    // meal amount is tax-free.  When it exceeds the threshold we split the display
    // into an exempt line and a taxable-excess line so the user can see exactly
    // how the CIRS Art. 2(3)(b)(2) split applies to their situation.
    if (r.monthlyMeal > 0) {
      if (r.monthlyMealTaxable > 0) {
        // Meal allowance straddles the exempt threshold — show both portions
        rows.push({ type: 'section', label: 'Meal Allowance (subsídio de refeição)' });
        rows.push({ label: 'Meal Allowance (exempt)', amount: r.monthlyMealTaxFree, type: 'benefit', icon: '🍽️' });
        // The taxable excess is added to the IRS and SS bases (not an additional
        // deduction here — it is already factored into monthlyIRS and monthlySS above).
        rows.push({ label: 'Meal Allowance (taxable)', amount: r.monthlyMealTaxable, type: 'benefit taxable', icon: '⚠️' });
      } else {
        // Entire meal allowance is within the exempt threshold — fully tax-free
        rows.push({ type: 'section', label: 'Meal Allowance (subsídio de refeição)' });
        rows.push({ label: 'Meal Allowance (tax-free)', amount: r.monthlyMeal, type: 'benefit', icon: '🍽️' });
      }
    }

    if (r.abono > 0) {
      rows.push({ type: 'section', label: 'State Benefit' });
      rows.push({ label: 'Abono de Família', amount: r.abono, type: 'benefit', icon: '👶' });
      rows.push({ label: 'Net + Child Benefit', amount: r.netSalary + r.abono, type: 'subtotal net', icon: '💚' });
    }

    return rows;
  },

  getEmployerBars(breakdown) {
    return [
      { label: 'Gross Salary', value: breakdown.gross, color: '#3b82f6' },
      { label: 'Employer Social Security 23.75%', value: breakdown.employerSS, color: '#8b5cf6' },
    ];
  },

  getAnnualSegments(breakdown) {
    return [
      { label: 'Net',             value: breakdown.annualNetSalary,      color: '#059669' },
      { label: 'IRS',             value: breakdown.annualIRS,            color: '#e94560' },
      { label: 'SS (Employee)',   value: breakdown.annualSS,             color: '#3b82f6' },
      { label: 'SS (Employer)',   value: breakdown.annualEmployerCost - breakdown.annualGross, color: '#8b5cf6' },
    ];
  },
};

export default portugal;
