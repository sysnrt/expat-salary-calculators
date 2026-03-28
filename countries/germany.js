/* ══════════════════════════════════════════════════════════
   ExpatCalc — Germany Configuration & Tax Computation
   2026 tax rules: §32a EStG, Social Security, Kindergeld
   ══════════════════════════════════════════════════════════ */

// ── Income tax §32a EStG 2026 ──
const GRUNDFREIBETRAG = 12348;
const ZONE2_UPPER = 17799;
const ZONE3_UPPER = 69878;
const ZONE4_UPPER = 277825;

// ── Social security rates (total = employee + employer) ──
const PENSION_RATE = 0.186;       // 9.3% each
const HEALTH_RATE = 0.146;        // 7.3% each
const UNEMPLOYMENT_RATE = 0.026;  // 1.3% each
const NURSING_BASE_RATE = 0.036;  // split depends on state

// ── Contribution ceilings (monthly) ──
const PENSION_CEIL = 8450;
const HEALTH_CEIL = 5812.50;

// ── Insolvency levy (U3) — employer only ──
const INSOLVENCY_RATE = 0.0015;

// ── Kindergeld ──
const KINDERGELD_PER_CHILD = 259;

// ── Kinderfreibetrag (annual, per child) ──
const KINDERFREIBETRAG = 9756;

// ── Soli ──
const SOLI_THRESHOLD_SINGLE = 19950;
const SOLI_THRESHOLD_JOINT = 39900;
const SOLI_RATE = 0.055;

// ── Bundesland data ──
const BUNDESLAND_LIST = [
  { value: 'BW', label: 'Baden-Württemberg' },
  { value: 'BY', label: 'Bayern' },
  { value: 'BE', label: 'Berlin' },
  { value: 'BB', label: 'Brandenburg' },
  { value: 'HB', label: 'Bremen' },
  { value: 'HH', label: 'Hamburg' },
  { value: 'HE', label: 'Hessen' },
  { value: 'MV', label: 'Mecklenburg-Vorpommern' },
  { value: 'NI', label: 'Niedersachsen' },
  { value: 'NW', label: 'Nordrhein-Westfalen' },
  { value: 'RP', label: 'Rheinland-Pfalz' },
  { value: 'SL', label: 'Saarland' },
  { value: 'SN', label: 'Sachsen' },
  { value: 'ST', label: 'Sachsen-Anhalt' },
  { value: 'SH', label: 'Schleswig-Holstein' },
  { value: 'TH', label: 'Thüringen' },
];

const SAXONY_STATES = ['SN'];
const CHURCH_8_STATES = ['BY', 'BW'];

// ── Tax class labels ──
const TAX_CLASS_OPTIONS = [
  { value: '1', label: 'Class I – Single' },
  { value: '2', label: 'Class II – Single Parent' },
  { value: '3', label: 'Class III – Married (higher earner)' },
  { value: '4', label: 'Class IV – Married (equal income)' },
  { value: '5', label: 'Class V – Married (lower earner)' },
];

// ── German income tax formula §32a EStG 2026 ──
function computeAnnualIncomeTax(zvE) {
  zvE = Math.floor(zvE);
  if (zvE <= GRUNDFREIBETRAG) return 0;
  if (zvE <= ZONE2_UPPER) {
    const y = (zvE - GRUNDFREIBETRAG) / 10000;
    return Math.floor((914.51 * y + 1400) * y);
  }
  if (zvE <= ZONE3_UPPER) {
    const z = (zvE - ZONE2_UPPER) / 10000;
    return Math.floor((173.10 * z + 2397) * z + 1034.87);
  }
  if (zvE <= ZONE4_UPPER) {
    return Math.floor(0.42 * zvE - 11135.63);
  }
  return Math.floor(0.45 * zvE - 19470.38);
}

// ── Soli ──
function computeSoli(annualTax, isJoint) {
  const threshold = isJoint ? SOLI_THRESHOLD_JOINT : SOLI_THRESHOLD_SINGLE;
  if (annualTax <= threshold) return 0;
  const fullSoli = annualTax * SOLI_RATE;
  const phaseIn = (annualTax - threshold) * 0.119;
  return Math.min(fullSoli, phaseIn);
}

// ── Country config ──
const germany = {
  id: 'germany',
  name: 'Germany',
  localName: 'Deutschland',
  flag: '🇩🇪',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'de-DE',
  accentColor: '#dd1100',
  accentSecondary: '#ffcc00',
  supportedLangs: ['en', 'de'],

  salaryRange: { min: 500, max: 15000, step: 50, default: 4000 },

  options: [
    {
      id: 'taxClass', type: 'select', label: 'Tax Class',
      sublabel: 'Steuerklasse',
      choices: TAX_CLASS_OPTIONS,
    },
    {
      id: 'bundesland', type: 'select', label: 'Federal State',
      sublabel: 'Bundesland',
      choices: BUNDESLAND_LIST,
    },
    { id: 'churchTax', type: 'toggle', label: 'Church Tax', sublabel: 'Auto: 8% (BY/BW) or 9% (other states)' },
    {
      id: 'healthType', type: 'select', label: 'Health Insurance',
      sublabel: 'Krankenversicherung',
      choices: [
        { value: 'statutory', label: 'Statutory (GKV)' },
        { value: 'private', label: 'Private (PKV)' },
      ],
    },
    {
      id: 'additionalHealth', type: 'number', label: 'Additional Health Contribution (%)',
      sublabel: 'Zusatzbeitrag — average 2.9% for 2026',
      min: 0, max: 5, step: 0.1, showWhen: ctx => ctx.healthType === 'statutory',
    },
    {
      id: 'pkvPremium', type: 'number', label: 'PKV Monthly Premium (€)',
      sublabel: 'Private health insurance premium',
      min: 0, max: 2000, step: 10, showWhen: ctx => ctx.healthType === 'private',
    },
    { id: 'children', type: 'counter', label: 'Number of children', min: 0, max: 10 },
    {
      id: 'childrenU25', type: 'counter', label: 'Children under 25',
      sublabel: 'Relevant for nursing care insurance',
      min: 0, max: 10, dependsOn: 'children', showWhen: 'children',
    },
  ],

  defaultOptions() {
    return {
      taxClass: '1',
      bundesland: 'NW',
      churchTax: false,
      healthType: 'statutory',
      additionalHealth: 2.9,
      pkvPremium: 400,
      children: 0,
      childrenU25: 0,
    };
  },

  /**
   * Core computation — pure function.
   * @param {number} gross - Monthly gross salary
   * @param {object} opts - Option values from defaultOptions()
   * @returns {object} Full breakdown
   */
  computeBreakdown(gross, opts) {
    const {
      taxClass, bundesland, churchTax, healthType,
      additionalHealth, pkvPremium, children, childrenU25,
    } = opts;

    const additionalHealthRate = additionalHealth / 100;
    const isSaxony = SAXONY_STATES.includes(bundesland);
    const churchRateVal = CHURCH_8_STATES.includes(bundesland) ? 0.08 : 0.09;
    const isJoint = taxClass === '3' || taxClass === '4';
    const isSplitting = taxClass === '3';
    const isClass5 = taxClass === '5';

    const annualGross = gross * 12;

    // ═══ SOCIAL SECURITY (Employee) ═══
    const pensionBase = Math.min(gross, PENSION_CEIL);
    const healthBase = Math.min(gross, HEALTH_CEIL);

    const empPension = pensionBase * PENSION_RATE / 2;
    const empUnemployment = pensionBase * UNEMPLOYMENT_RATE / 2;

    let empHealth;
    if (healthType === 'statutory') {
      empHealth = healthBase * (HEALTH_RATE / 2 + additionalHealthRate / 2);
    } else {
      empHealth = pkvPremium;
    }

    // Nursing care (employee)
    let empNursingRate;
    if (isSaxony) {
      empNursingRate = 0.023;
    } else {
      empNursingRate = NURSING_BASE_RATE / 2;
    }
    if (children === 0) {
      empNursingRate += 0.006;
    }
    if (childrenU25 >= 2) {
      const discount = Math.min(childrenU25 - 1, 4) * 0.0025;
      empNursingRate = Math.max(0, empNursingRate - discount);
    }
    const empNursing = healthBase * empNursingRate;
    const totalEmpSS = empPension + empHealth + empUnemployment + empNursing;

    // ═══ INCOME TAX ═══
    const werbungskosten = 1230;
    const sonderausgaben = 36;
    const vsp1Cap = taxClass === '3' ? 3000 : 1900;
    const alleinerziehendEntlastung = (taxClass === '2') ? (4260 + Math.max(0, children - 1) * 240) : 0;

    // Vorsorgepauschale (2026 reform: 12% rule abolished, TB4 unemployment added)
    function computeVSP(annGross, annPension, annHealth, annNursing, annUnemployment) {
      const healthDed = (healthType === 'statutory')
        ? annHealth * 0.96
        : Math.min(pkvPremium * 12, healthBase * (HEALTH_RATE / 2 + additionalHealthRate / 2) * 12) * 0.96;
      const tb2_tb3 = healthDed + annNursing;
      const remainingCap = Math.max(0, vsp1Cap - tb2_tb3);
      const tb4 = Math.min(annUnemployment || 0, remainingCap);
      return annPension + tb2_tb3 + tb4;
    }

    function computeZvE(annGross, vsp) {
      return Math.max(0, annGross - werbungskosten - sonderausgaben - vsp - alleinerziehendEntlastung);
    }

    function computeTaxForZvE(zvE) {
      if (isSplitting) return 2 * computeAnnualIncomeTax(zvE / 2);
      if (isClass5) return computeAnnualIncomeTax(zvE + GRUNDFREIBETRAG);
      return computeAnnualIncomeTax(zvE);
    }

    const vsp = computeVSP(annualGross, empPension * 12, empHealth * 12, empNursing * 12, empUnemployment * 12);
    const zvE = computeZvE(annualGross, vsp);

    // Kinderfreibetrag for Soli: Class V gets none
    const zvEForSoli = (children > 0 && !isClass5) ? Math.max(0, zvE - children * KINDERFREIBETRAG) : zvE;

    const annualTax = computeTaxForZvE(zvE);
    const monthlyTax = annualTax / 12;

    // Soli
    const annualTaxForSoli = computeTaxForZvE(zvEForSoli);
    const annualSoli = computeSoli(annualTaxForSoli, isJoint);
    const monthlySoli = annualSoli / 12;

    // Church tax
    let monthlyChurch = 0;
    if (churchTax) {
      monthlyChurch = annualTaxForSoli / 12 * churchRateVal;
    }

    const totalMonthlyTax = monthlyTax + monthlySoli + monthlyChurch;

    // ═══ NET ═══
    const totalDeductions = totalMonthlyTax + totalEmpSS;
    const netSalary = gross - totalDeductions;

    // ═══ EMPLOYER SIDE ═══
    const erPension = pensionBase * PENSION_RATE / 2;
    const erUnemployment = pensionBase * UNEMPLOYMENT_RATE / 2;
    const gkvEquivMax = healthBase * (HEALTH_RATE / 2 + additionalHealthRate / 2);
    const erHealth = (healthType === 'statutory') ? gkvEquivMax : Math.min(pkvPremium / 2, gkvEquivMax);
    const erNursingRate = isSaxony ? 0.013 : NURSING_BASE_RATE / 2;
    const erNursing = healthBase * erNursingRate;
    const erInsolvency = pensionBase * INSOLVENCY_RATE;
    const totalErSS = erPension + erHealth + erUnemployment + erNursing + erInsolvency;
    const totalEmployerCost = gross + totalErSS;

    // ═══ KINDERGELD ═══
    const kindergeld = children * KINDERGELD_PER_CHILD;

    return {
      gross,
      monthlyTax,
      monthlySoli,
      monthlyChurch,
      totalMonthlyTax,
      empPension,
      empHealth,
      empUnemployment,
      empNursing,
      totalEmpSS,
      erPension,
      erHealth,
      erUnemployment,
      erNursing,
      erInsolvency,
      totalErSS,
      totalDeductions,
      netSalary,
      totalEmployerCost,
      kindergeld,
      annualTax,
      annualSoli,
      vorsorgepauschale: vsp,
      // Generic summary fields for ResultPanel
      totalTaxes: totalMonthlyTax,
      totalSocialSecurity: totalEmpSS,
      stateBenefit: kindergeld,
    };
  },

  /**
   * Reverse calculate: find gross from target net.
   */
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

  /**
   * Reverse calculate: find gross from target total employer cost.
   */
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

  /**
   * Get donut chart segments for visualization.
   */
  getDonutSegments(breakdown) {
    const segments = [
      { label: 'Net Salary',       value: Math.max(0, breakdown.netSalary), color: '#059669' },
      { label: 'Income Tax',       value: breakdown.monthlyTax,             color: '#e94560' },
      { label: 'Soli + Church',    value: breakdown.monthlySoli + breakdown.monthlyChurch, color: '#f59e0b' },
      { label: 'Pension',          value: breakdown.empPension,             color: '#3b82f6' },
      { label: 'Health Ins.',      value: breakdown.empHealth,              color: '#8b5cf6' },
      { label: 'Unemployment + Care', value: breakdown.empUnemployment + breakdown.empNursing, color: '#6366f1' },
    ];
    return segments.filter(s => s.value > 0);
  },

  /**
   * Get breakdown table rows for display.
   */
  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    // Taxes section
    rows.push({ type: 'section', label: 'Taxes' });
    rows.push({ label: 'Income Tax (Lohnsteuer)', amount: r.monthlyTax, type: 'deduction' });
    rows.push({ label: 'Solidarity Surcharge', amount: r.monthlySoli, type: 'deduction' });
    if (r.monthlyChurch > 0) {
      rows.push({ label: 'Church Tax', amount: r.monthlyChurch, type: 'deduction' });
    }

    // Social security section
    rows.push({ type: 'section', label: 'Social Security (Employee)' });
    rows.push({ label: 'Pension Insurance 9.3%', amount: r.empPension, type: 'deduction' });
    rows.push({ label: 'Health Insurance', amount: r.empHealth, type: 'deduction' });
    rows.push({ label: 'Unemployment Ins. 1.3%', amount: r.empUnemployment, type: 'deduction' });
    rows.push({ label: 'Nursing Care Ins.', amount: r.empNursing, type: 'deduction' });

    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Net Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    if (r.kindergeld > 0) {
      rows.push({ type: 'section', label: 'State Benefit' });
      rows.push({ label: 'Child Benefit (Kindergeld)', amount: r.kindergeld, type: 'benefit', icon: '👶' });
      rows.push({ label: 'Net + Child Benefit', amount: r.netSalary + r.kindergeld, type: 'subtotal net', icon: '💚' });
    }

    return rows;
  },

  /**
   * Get employer cost bar items.
   */
  getEmployerBars(breakdown) {
    return [
      { label: 'Gross Salary', value: breakdown.gross, color: '#3b82f6' },
      { label: 'Employer Pension 9.3%', value: breakdown.erPension, color: '#0f3460' },
      { label: 'Employer Health Ins.', value: breakdown.erHealth, color: '#8b5cf6' },
      { label: 'Employer Unemployment 1.3%', value: breakdown.erUnemployment, color: '#6366f1' },
      { label: 'Employer Nursing Care', value: breakdown.erNursing, color: '#a78bfa' },
      { label: 'Insolvency Levy', value: breakdown.erInsolvency, color: '#c4b5fd' },
    ];
  },

  /**
   * Get annual bar segments.
   */
  getAnnualSegments(breakdown) {
    return [
      { label: 'Net',          value: breakdown.netSalary * 12,       color: '#059669' },
      { label: 'Taxes',        value: breakdown.totalMonthlyTax * 12, color: '#e94560' },
      { label: 'SS (Employee)', value: breakdown.totalEmpSS * 12,     color: '#3b82f6' },
      { label: 'SS (Employer)', value: breakdown.totalErSS * 12,      color: '#8b5cf6' },
    ];
  },
};

export default germany;
