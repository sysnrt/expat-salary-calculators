/* ══════════════════════════════════════════════════════════
   ExpatCalc — Portugal Configuration & Tax Computation
   2026 tax rules: IRS brackets, SS 11%, IFICI flat 20%
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

// ── Meal allowance ──
const MEAL_WORKING_DAYS    = 22;
const MEAL_TAX_FREE_CASH   = 6.15;
const MEAL_TAX_FREE_CARD   = 10.46;

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
      sublabel: 'Per working day (22 days/month)',
      min: 0, max: 30, step: 0.5,
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
      dependents: 0,
      children: 0,
      paymentsPerYear: '14',
    };
  },

  computeBreakdown(gross, opts) {
    const { maritalStatus, ifici, mealAllowance, mealType, mealValue, dependents, children } = opts;
    const paymentsPerYear = Number(opts.paymentsPerYear) || 14;

    const annualGross = gross * paymentsPerYear;
    const annualSS = annualGross * SS_EMPLOYEE;

    // Meal allowance
    const dailyMealValue = mealAllowance ? mealValue : 0;
    const taxFreeLimit = mealType === 'card' ? MEAL_TAX_FREE_CARD : MEAL_TAX_FREE_CASH;
    const dailyMealTaxable = Math.max(0, dailyMealValue - taxFreeLimit);
    const monthlyMealTaxable = dailyMealTaxable * MEAL_WORKING_DAYS;
    const monthlyMealTaxFree = Math.min(dailyMealValue, taxFreeLimit) * MEAL_WORKING_DAYS;
    const monthlyMeal = dailyMealValue * MEAL_WORKING_DAYS;

    // Taxable income
    const taxableIncome = Math.max(0, annualGross - annualSS - SPECIFIC_DEDUCTION + monthlyMealTaxable * 12);

    // Mínimo de existência
    const netAfterSS = annualGross - annualSS;
    const divisor = (maritalStatus === 'married1') ? 2 : 1;

    let annualIRS = 0;
    if (netAfterSS > MINIMO_EXISTENCIA) {
      if (ifici) {
        annualIRS = taxableIncome * 0.20;
      } else {
        const splitIncome = taxableIncome / divisor;
        annualIRS = computeIRS(splitIncome) * divisor;
        annualIRS = Math.min(annualIRS, netAfterSS - MINIMO_EXISTENCIA);
      }
      // Solidarity surcharge (Art. 68-A CIRS)
      if (!ifici && taxableIncome > 80000) {
        const soliBase1 = Math.min(taxableIncome, 250000) - 80000;
        annualIRS += soliBase1 * 0.025;
        if (taxableIncome > 250000) annualIRS += (taxableIncome - 250000) * 0.05;
      }
      // Dependent deduction
      const dependentCredit = dependents * 600;
      annualIRS = Math.max(0, annualIRS - dependentCredit);
    }

    const monthlySS = gross * SS_EMPLOYEE;                  // 11% on this month's gross payment

    // ── Monthly payslip withholding: AT withholding table formula ────────────────
    // Source: Despacho n.º 233-A/2026, Table I (Continente, Categoria A)
    // Formula: retenção = remuneração_mensal_bruta × taxa − parcela_a_abater
    //
    // The withholding table is applied directly to the MONTHLY GROSS SALARY, not to
    // the taxable income after deductions. This matches what appears on a Portuguese
    // payslip (recibo de vencimento) and the AT's own payslip simulator.
    //
    // For 14-payment (duodécimos) salaries under CIRS Art. 99-C:
    //   - The regular monthly salary component (e.g. €7,000) is withheld using the
    //     table directly on the full monthly gross.
    //   - The holiday/Christmas subsidy duodécimos (each = gross/12, e.g. €583.33)
    //     are withheld autonomously at their own bracket.  At €7,000/month gross, the
    //     €583.33 subsidy fragment falls into the ≤€1,819 bracket (24.10%, parcela
    //     €193.33): €583.33 × 24.10% − €193.33 = −€52.75 → clamped to €0.  So the
    //     autonomous subsidy withholding is zero and total monthly withholding equals
    //     the table result on the regular monthly gross alone.
    //
    // For 13-payment structure: same table logic applies to the monthly gross.
    // For 12-payment structure: no subsidy duodécimos exist; table on monthly gross.
    //
    // NOTE: annualIRS (computed above via CIRS Art. 68 brackets) is retained for the
    // annual liability view and annualNetSalary.  monthlyIRS below is the payslip figure.
    //
    // Reference: Despacho n.º 233-A/2026; CIRS Art. 99-C
    const monthlyIRS = computeWithholdingRetencao(gross, dependents);

    const totalDeductions = monthlyIRS + monthlySS;
    const netSalary = gross - totalDeductions;

    // Employer
    const employerSS = gross * SS_EMPLOYER;
    const totalEmployerCost = gross + employerSS;

    // Abono de Família
    const abono = children * ABONO_PER_CHILD;

    return {
      gross,
      monthlyIRS,
      monthlySS,
      totalDeductions,
      netSalary,
      employerSS,
      totalEmployerCost,
      monthlyMeal,
      monthlyMealTaxFree,
      monthlyMealTaxable,
      annualGross,
      annualIRS,
      annualSS,
      taxableIncome,
      abono,
      // Generic summary fields
      totalTaxes: monthlyIRS,
      totalSocialSecurity: monthlySS,
      stateBenefit: abono,
      annualNetSalary: annualGross - annualSS - annualIRS,
      annualEmployerCost: totalEmployerCost * paymentsPerYear,
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

    if (r.monthlyMeal > 0) {
      rows.push({ type: 'section', label: 'Tax-Free Benefit' });
      rows.push({ label: 'Meal Allowance', amount: r.monthlyMeal, type: 'benefit', icon: '🍽️' });
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
