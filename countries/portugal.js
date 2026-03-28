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

// ── IRS calculation ──
function computeIRS(taxableIncome) {
  for (let i = 0; i < BRACKETS.length; i++) {
    if (taxableIncome <= BRACKETS[i].limit) {
      return Math.max(0, taxableIncome * BRACKETS[i].rate - BRACKETS[i].parcela);
    }
  }
  const last = BRACKETS[BRACKETS.length - 1];
  return Math.max(0, taxableIncome * last.rate - last.parcela);
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

    // ── Duodécimos withholding method (CIRS Art. 99-B) ──────────────────────────
    // Under Portuguese law, employers paying 14 salaries (holiday + Christmas bonus)
    // must use the "duodécimos" (twelfths) method: the IRS on all bonus months is
    // spread evenly across the 12 regular monthly paycheques. This means each of the
    // 12 regular months bears 1/12 of the FULL annual IRS liability.
    //
    // This is the method used by the AT's own payslip simulator (at.gov.pt/simuladores)
    // and is what appears on a Portuguese payslip (recibo de vencimento).
    //
    // For 13 or 12-payment structures, we continue to divide by the actual number of
    // payment periods, since the duodécimos rule is specific to the 14-payment regime.
    //
    // Reference: CIRS Art. 99-B; Portaria de retenção na fonte (AT, 2026)
    const withholdingDivisor = (paymentsPerYear === 14) ? 12 : paymentsPerYear;
    const monthlyIRS = annualIRS / withholdingDivisor;

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
