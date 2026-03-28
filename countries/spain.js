/* ══════════════════════════════════════════════════════════
   ExpatCalc — Spain Configuration & Tax Computation
   2026 tax rules: IRPF, Seguridad Social, Beckham Law
   ══════════════════════════════════════════════════════════ */

// ── IRPF brackets (combined state + typical regional) ──
const IRPF_BRACKETS = [
  { limit: 12450,    rate: 0.19 },
  { limit: 20200,    rate: 0.24 },
  { limit: 35200,    rate: 0.30 },
  { limit: 60000,    rate: 0.37 },
  { limit: 300000,   rate: 0.45 },
  { limit: Infinity, rate: 0.47 },
];

// ── Social Security 2026 — Employee ──
const SS_COMMON_EE       = 0.0470;
const SS_UNEMP_PERM_EE   = 0.0155;
const SS_UNEMP_TEMP_EE   = 0.0160;
const SS_TRAINING_EE     = 0.0010;
const SS_MEI_EE          = 0.0015;

// ── Social Security 2026 — Employer ──
const SS_COMMON_ER       = 0.2360;
const SS_UNEMP_PERM_ER   = 0.0550;
const SS_UNEMP_TEMP_ER   = 0.0670;
const SS_TRAINING_ER     = 0.0060;
const SS_FOGASA_ER       = 0.0020;
const SS_MEI_ER          = 0.0075;
const SS_ACCIDENTS_ER    = 0.0150;

// ── Contribution bases ──
const SS_MAX_BASE = 5101.20;
const SS_MIN_BASE = 1424.50;

// ── Solidarity tiers (above max base) ──
const SOLIDARITY_TIERS = [
  { limit: 5611.32,  eeRate: 0.0019, erRate: 0.0096 },
  { limit: 7651.80,  eeRate: 0.0021, erRate: 0.0104 },
  { limit: Infinity, eeRate: 0.0024, erRate: 0.0122 },
];

// ── Personal & family minimums ──
const MINIMO_PERSONAL    = 5550;
const MINIMO_PERSONAL_65 = 1150;
const MINIMO_PERSONAL_75 = 1400;
const GASTOS_DEDUCIBLES  = 2000;

// ── Reducción por rendimientos del trabajo ──
const REDUCCION_TIER1_MAX   = 7302;
const REDUCCION_TIER1_LIMIT = 14852;
const REDUCCION_TIER2_LIMIT = 17673.52;
const REDUCCION_TIER3_LIMIT = 19747.50;

// ── Children minimums (annual) ──
const CHILD_MINIMUMS     = [2400, 2700, 4000, 4500];
const CHILD_UNDER_3_EXTRA = 2800;

// ── Beckham Law ──
const BECKHAM_RATE       = 0.24;
const BECKHAM_THRESHOLD  = 600000;
const BECKHAM_EXCESS_RATE = 0.47;

// ── Helper: progressive IRPF ──
function computeIRPF(taxableBase) {
  let tax = 0, prevLimit = 0;
  for (const bracket of IRPF_BRACKETS) {
    if (taxableBase <= prevLimit) break;
    const base = Math.min(taxableBase, bracket.limit) - prevLimit;
    tax += base * bracket.rate;
    prevLimit = bracket.limit;
  }
  return Math.max(0, tax);
}

// ── Helper: reducción por rendimientos del trabajo ──
function computeReduccion(netEmploymentIncome) {
  if (netEmploymentIncome <= REDUCCION_TIER1_LIMIT) return REDUCCION_TIER1_MAX;
  if (netEmploymentIncome <= REDUCCION_TIER2_LIMIT) return Math.max(0, 7302 - 1.75 * (netEmploymentIncome - 14852));
  if (netEmploymentIncome <= REDUCCION_TIER3_LIMIT) return Math.max(0, 2364.34 - 1.14 * (netEmploymentIncome - 17673.52));
  return 0;
}

// ── Helper: employee SS ──
function computeEmployeeSS(monthlyBase, isTemp) {
  const base = Math.max(SS_MIN_BASE, Math.min(monthlyBase, SS_MAX_BASE));
  const common = base * SS_COMMON_EE;
  const unemployment = base * (isTemp ? SS_UNEMP_TEMP_EE : SS_UNEMP_PERM_EE);
  const training = base * SS_TRAINING_EE;
  const mei = base * SS_MEI_EE;

  let solidarity = 0;
  if (monthlyBase > SS_MAX_BASE) {
    let prev = SS_MAX_BASE;
    for (const tier of SOLIDARITY_TIERS) {
      if (monthlyBase <= prev) break;
      const excess = Math.min(monthlyBase, tier.limit) - prev;
      solidarity += excess * tier.eeRate;
      prev = tier.limit;
    }
  }

  return { common, unemployment, training, mei, solidarity, total: common + unemployment + training + mei + solidarity, base };
}

// ── Helper: employer SS ──
function computeEmployerSS(monthlyBase, isTemp) {
  const base = Math.max(SS_MIN_BASE, Math.min(monthlyBase, SS_MAX_BASE));
  const common = base * SS_COMMON_ER;
  const unemployment = base * (isTemp ? SS_UNEMP_TEMP_ER : SS_UNEMP_PERM_ER);
  const training = base * SS_TRAINING_ER;
  const fogasa = base * SS_FOGASA_ER;
  const mei = base * SS_MEI_ER;
  const accidents = base * SS_ACCIDENTS_ER;

  let solidarity = 0;
  if (monthlyBase > SS_MAX_BASE) {
    let prev = SS_MAX_BASE;
    for (const tier of SOLIDARITY_TIERS) {
      if (monthlyBase <= prev) break;
      const excess = Math.min(monthlyBase, tier.limit) - prev;
      solidarity += excess * tier.erRate;
      prev = tier.limit;
    }
  }

  return { common, unemployment, training, fogasa, mei, accidents, solidarity, total: common + unemployment + training + fogasa + mei + accidents + solidarity, base };
}

// ── Helper: mínimos personales y familiares ──
function computeMinimos(over65, over75, children, childrenU3) {
  let minimo = MINIMO_PERSONAL;
  if (over65) {
    minimo += MINIMO_PERSONAL_65;
    if (over75) minimo += MINIMO_PERSONAL_75;
  }
  let childMinimo = 0;
  for (let i = 0; i < children; i++) {
    childMinimo += CHILD_MINIMUMS[Math.min(i, CHILD_MINIMUMS.length - 1)];
  }
  childMinimo += childrenU3 * CHILD_UNDER_3_EXTRA;
  return { personal: minimo, family: childMinimo, total: minimo + childMinimo };
}

// ── Country config ──
const spain = {
  id: 'spain',
  name: 'Spain',
  localName: 'España',
  flag: '🇪🇸',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'es-ES',
  accentColor: '#c60b1e',
  accentSecondary: '#ffc400',
  supportedLangs: ['en', 'es'],

  salaryRange: { min: 500, max: 15000, step: 50, default: 3000 },

  options: [
    {
      id: 'numPayments', type: 'select', label: 'Number of payments',
      sublabel: '14 pagas: includes extra pay in June & December',
      choices: [
        { value: '14', label: '14 payments' },
        { value: '12', label: '12 payments' },
      ],
    },
    {
      id: 'contractType', type: 'select', label: 'Contract Type',
      choices: [
        { value: 'permanent', label: 'Permanent (indefinido)' },
        { value: 'temporary', label: 'Temporary (temporal)' },
      ],
    },
    {
      id: 'familyStatus', type: 'select', label: 'Filing Status',
      choices: [
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married (joint filing)' },
      ],
    },
    { id: 'beckham', type: 'toggle', label: 'Beckham Law', sublabel: 'Flat 24% IRPF for qualifying expats (up to €600k)' },
    { id: 'ceutaMelilla', type: 'toggle', label: 'Ceuta / Melilla', sublabel: '60% IRPF deduction for residents' },
    { id: 'over65', type: 'toggle', label: 'Over 65', sublabel: 'Additional personal minimum (+€1,150/yr)' },
    { id: 'over75', type: 'toggle', label: 'Over 75', sublabel: 'Extra personal minimum (+€1,400/yr)', showWhen: ctx => ctx.over65 },
    { id: 'children', type: 'counter', label: 'Number of children', min: 0, max: 10 },
    { id: 'childrenU3', type: 'counter', label: 'Children under 3', sublabel: 'Extra €2,800/yr minimum per child', min: 0, max: 10, dependsOn: 'children', showWhen: 'children' },
  ],

  defaultOptions() {
    return {
      numPayments: '14',
      contractType: 'permanent',
      familyStatus: 'single',
      beckham: false,
      ceutaMelilla: false,
      over65: false,
      over75: false,
      children: 0,
      childrenU3: 0,
    };
  },

  computeBreakdown(gross, opts) {
    const {
      numPayments, contractType, familyStatus, beckham, ceutaMelilla,
      over65, over75, children, childrenU3,
    } = opts;

    const numPays = parseInt(numPayments);
    const isTemp = contractType === 'temporary';
    const annualGross = gross * numPays;

    // Employee SS — prorated base for 14-pay
    const ssMonthlyBase = gross * numPays / 12;
    const eeSS = computeEmployeeSS(ssMonthlyBase, isTemp);
    const annualEeSS = eeSS.total * 12;

    // Net employment income
    const netEmploymentIncome = annualGross - annualEeSS - GASTOS_DEDUCIBLES;

    // Reducción por rendimientos del trabajo
    const reduccion = computeReduccion(Math.max(0, netEmploymentIncome));

    // Base imponible
    let baseImponible = Math.max(0, netEmploymentIncome - reduccion);
    if (familyStatus === 'married') {
      baseImponible = Math.max(0, baseImponible - 3400);
    }

    // Mínimos
    const minimos = computeMinimos(over65, over75, children, childrenU3);

    // IRPF
    let annualIRPF;
    if (beckham) {
      if (annualGross <= BECKHAM_THRESHOLD) {
        annualIRPF = annualGross * BECKHAM_RATE;
      } else {
        annualIRPF = BECKHAM_THRESHOLD * BECKHAM_RATE + (annualGross - BECKHAM_THRESHOLD) * BECKHAM_EXCESS_RATE;
      }
    } else {
      annualIRPF = Math.max(0, computeIRPF(baseImponible) - computeIRPF(minimos.total));
    }

    // Ceuta/Melilla deduction
    if (ceutaMelilla) {
      annualIRPF *= 0.40;
    }

    // Monthly values
    const monthlyIRPF = annualIRPF / numPays;
    const monthlyDeductions = monthlyIRPF + eeSS.total;
    const netSalary = gross - monthlyDeductions;

    // Extra pay (14-pay: has IRPF but no SS)
    const extraPayIRPF = numPays === 14 ? monthlyIRPF : 0;
    const extraPayNet = numPays === 14 ? (gross - extraPayIRPF) : 0;

    // Employer contributions
    const erSS = computeEmployerSS(ssMonthlyBase, isTemp);
    const totalEmployerCost = gross + erSS.total;

    return {
      gross,
      monthlyIRPF,
      eeSS,
      totalDeductions: monthlyDeductions,
      netSalary,
      erSS,
      totalEmployerCost,
      numPays,
      extraPayNet,
      annualGross,
      annualIRPF,
      annualEeSS,
      baseImponible,
      minimos,
      reduccion,
      beckham,
      // Generic summary fields
      totalTaxes: monthlyIRPF,
      totalSocialSecurity: eeSS.total,
      stateBenefit: 0,
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
      { label: 'IRPF',             value: breakdown.monthlyIRPF,            color: '#e94560' },
      { label: 'Social Security',  value: breakdown.eeSS.total,             color: '#3b82f6' },
    ].filter(s => s.value > 0);
  },

  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    // IRPF
    rows.push({ type: 'section', label: r.beckham ? 'Income Tax — Beckham Law' : 'Income Tax (IRPF)' });
    rows.push({ label: r.beckham ? 'IRPF — Beckham Law (24%)' : 'IRPF (withholding)', amount: r.monthlyIRPF, type: 'deduction' });

    // SS
    rows.push({ type: 'section', label: 'Social Security (Employee)' });
    rows.push({ label: 'Common Contingencies 4.70%', amount: r.eeSS.common, type: 'deduction' });
    rows.push({ label: 'Unemployment', amount: r.eeSS.unemployment, type: 'deduction' });
    rows.push({ label: 'Vocational Training 0.10%', amount: r.eeSS.training, type: 'deduction' });
    rows.push({ label: 'MEI 0.15%', amount: r.eeSS.mei, type: 'deduction' });
    if (r.eeSS.solidarity > 0) {
      rows.push({ label: 'Solidarity Contribution', amount: r.eeSS.solidarity, type: 'deduction' });
    }

    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Net Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    if (r.numPays === 14) {
      rows.push({ type: 'section', label: 'Extra Payments (June & December)' });
      rows.push({ label: 'Net Extra Payment', amount: r.extraPayNet, type: 'benefit', icon: '🎁' });
    }

    return rows;
  },

  getEmployerBars(breakdown) {
    const r = breakdown;
    return [
      { label: 'Gross Salary', value: r.gross, color: '#3b82f6' },
      { label: 'Common Contingencies 23.60%', value: r.erSS.common, color: '#8b5cf6' },
      { label: 'Unemployment', value: r.erSS.unemployment, color: '#ec4899' },
      { label: 'Other (Training, FOGASA, MEI, Accidents)', value: r.erSS.training + r.erSS.fogasa + r.erSS.mei + r.erSS.accidents + r.erSS.solidarity, color: '#f59e0b' },
    ];
  },

  getAnnualSegments(breakdown) {
    const r = breakdown;
    return [
      { label: 'Net',            value: r.netSalary * r.numPays,  color: '#059669' },
      { label: 'IRPF',           value: r.annualIRPF,             color: '#e94560' },
      { label: 'SS (Employee)',   value: r.annualEeSS,             color: '#3b82f6' },
      { label: 'SS (Employer)',   value: r.erSS.total * r.numPays, color: '#8b5cf6' },
    ];
  },
};

export default spain;
