/* ══════════════════════════════════════════════════════════
   ExpatCalc — Belgium Configuration & Tax Computation
   2026 tax rules: Bedrijfsvoorheffing, RSZ, Werkbonus,
   Commune tax, Expat regime (BBSI)
   ══════════════════════════════════════════════════════════ */

// ── Tax brackets (Bedrijfsvoorheffing, monthly) ──
const BRACKET_1_CEILING = 1393.33;
const BRACKET_2_CEILING = 2459.17;
const BRACKET_3_CEILING = 4255.83;
const BRACKET_1_RATE = 0.25;
const BRACKET_2_RATE = 0.40;
const BRACKET_3_RATE = 0.45;
const BRACKET_4_RATE = 0.50;

// ── RSZ rates ──
const RSZ_EMPLOYEE_RATE = 0.1307;
const RSZ_EMPLOYER_RATE = 0.27;

// ── Tax-free allowance (annual) ──
const TAX_FREE_ALLOWANCE_BASE = 11180;

// ── Child tax allowances (cumulative annual) ──
const CHILD_TAX_ALLOWANCES = [0, 2030, 5230, 11720, 18920];

// ── Withholding tax reductions for dependent children (monthly) ──
const CHILD_TAX_REDUCTIONS_MONTHLY = [0, 45, 123, 326, 567, 831, 1095, 1377, 1659];

// ── Werkbonus ──
const WERKBONUS_MAX = 235.42;
const WERKBONUS_THRESHOLD_LOW = 2080.42;
const WERKBONUS_THRESHOLD_HIGH = 3199.16;

// ── Expat regime (BBSI) ──
const EXPAT_TAXFREE_PCT = 0.35;
const EXPAT_RSXEMPT_PCT = 0.30;

// ── Child benefits (monthly base amounts) ──
const FLANDERS_BASE = 184.62;
const WALLONIA_BASE = 196.57;
const BRUSSELS_BASE = 190.23;

// ── Helper: compute tax on monthly taxable income ──
function computeMonthlyTax(taxableIncome) {
  const brackets = [
    { limit: BRACKET_1_CEILING, rate: BRACKET_1_RATE },
    { limit: BRACKET_2_CEILING, rate: BRACKET_2_RATE },
    { limit: BRACKET_3_CEILING, rate: BRACKET_3_RATE },
    { limit: Infinity, rate: BRACKET_4_RATE },
  ];
  let tax = 0, remaining = Math.max(0, taxableIncome), prevLimit = 0;
  for (const b of brackets) {
    const inBracket = Math.min(remaining, b.limit - prevLimit);
    if (inBracket <= 0) break;
    tax += inBracket * b.rate;
    remaining -= inBracket;
    prevLimit = b.limit;
  }
  return tax;
}

// ── Country config ──
const belgium = {
  id: 'belgium',
  name: 'Belgium',
  localName: 'België',
  flag: '🇧🇪',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'fr-BE',
  accentColor: '#fdda25',
  accentSecondary: '#000000',
  supportedLangs: ['en', 'nl', 'fr'],

  salaryRange: { min: 500, max: 15000, step: 50, default: 4000 },

  options: [
    {
      id: 'maritalStatus', type: 'select', label: 'Marital Status',
      choices: [
        { value: 'single', label: 'Single' },
        { value: 'single-parent', label: 'Single Parent' },
        { value: 'married', label: 'Married' },
      ],
    },
    {
      id: 'spouseIncome', type: 'select', label: 'Spouse Income',
      sublabel: 'Affects marital quotient',
      choices: [
        { value: 'normal', label: 'Normal income (no quotient)' },
        { value: 'low', label: 'Low / no income' },
      ],
      showWhen: ctx => ctx.maritalStatus === 'married',
    },
    {
      id: 'specialRegime', type: 'select', label: 'Special Tax Regime',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'expat', label: 'Expat Regime (BBSI) — 35% tax-free' },
      ],
    },
    {
      id: 'communeTaxRate', type: 'number', label: 'Municipal surcharge (%)',
      sublabel: 'Commune tax on withholding (avg. 7%)',
      min: 0, max: 15, step: 0.5,
    },
    { id: 'disabled', type: 'toggle', label: 'Disabled', sublabel: 'Additional tax-free allowance (+€1,980/yr)' },
    { id: 'children', type: 'counter', label: 'Number of children', min: 0, max: 10 },
    {
      id: 'childRegion', type: 'select', label: 'Region (child benefit)',
      sublabel: 'Determines Groeipakket/FAMIWAL/Famiris rates',
      choices: [
        { value: 'flanders', label: 'Flanders (€184.62/child)' },
        { value: 'wallonia', label: 'Wallonia (€196.57/child)' },
        { value: 'brussels', label: 'Brussels (~€190/child)' },
      ],
      showWhen: 'children',
    },
  ],

  defaultOptions() {
    return {
      maritalStatus: 'single',
      spouseIncome: 'normal',
      specialRegime: 'none',
      communeTaxRate: 7,
      disabled: false,
      children: 0,
      childRegion: 'flanders',
    };
  },

  computeBreakdown(gross, opts) {
    const {
      maritalStatus, spouseIncome, specialRegime, communeTaxRate,
      disabled, children, childRegion,
    } = opts;

    // 1. RSZ employee contribution
    let rszBase = gross;
    let expatAllowance = 0;

    if (specialRegime === 'expat') {
      expatAllowance = gross * EXPAT_TAXFREE_PCT;
      rszBase = gross * (1 - EXPAT_RSXEMPT_PCT);
    }

    const rszContribution = rszBase * RSZ_EMPLOYEE_RATE;

    // 2. Werkbonus (RSZ reduction for low wages)
    let werkbonus = 0;
    if (gross <= WERKBONUS_THRESHOLD_LOW) {
      werkbonus = Math.min(WERKBONUS_MAX, rszContribution);
    } else if (gross < WERKBONUS_THRESHOLD_HIGH) {
      const phaseOut = (WERKBONUS_THRESHOLD_HIGH - gross) / (WERKBONUS_THRESHOLD_HIGH - WERKBONUS_THRESHOLD_LOW);
      werkbonus = Math.min(WERKBONUS_MAX * phaseOut, rszContribution);
    }
    const netRsz = rszContribution - werkbonus;

    // 3. Taxable base (after RSZ)
    let taxableBase = gross - rszContribution;

    // 4. Professional expenses (30% flat rate, capped at €5,930/yr)
    const flatExpenses = Math.min(taxableBase * 12 * 0.30, 5930) / 12;

    // 5. Taxable income
    let taxableIncome = taxableBase - flatExpenses;
    if (specialRegime === 'expat') {
      taxableIncome -= (expatAllowance - gross * EXPAT_RSXEMPT_PCT);
    }

    // 6. Base tax (brackets)
    const baseTax = computeMonthlyTax(taxableIncome);

    // 7. Tax-free allowance
    let taxFreeAllowance = TAX_FREE_ALLOWANCE_BASE / 12;
    if (children > 0) {
      if (children <= 4) {
        taxFreeAllowance += CHILD_TAX_ALLOWANCES[children] / 12;
      } else {
        taxFreeAllowance += CHILD_TAX_ALLOWANCES[4] / 12 + (children - 4) * (7200 / 12);
      }
    }
    if (maritalStatus === 'single-parent') {
      taxFreeAllowance += 1980 / 12;
    }
    if (disabled) {
      taxFreeAllowance += 1980 / 12;
    }
    const taxFreeReduction = taxFreeAllowance * BRACKET_1_RATE;

    // 8. Marital quotient
    let maritalReduction = 0;
    if (maritalStatus === 'married' && spouseIncome !== 'normal') {
      const attribution = Math.min(taxableIncome * 0.30 * 12, 13460) / 12;
      maritalReduction = attribution * BRACKET_1_RATE;
    }

    // 9. Child tax reductions
    let childTaxReduction = 0;
    if (children > 0 && children <= CHILD_TAX_REDUCTIONS_MONTHLY.length - 1) {
      childTaxReduction = CHILD_TAX_REDUCTIONS_MONTHLY[children] / 12;
    } else if (children > CHILD_TAX_REDUCTIONS_MONTHLY.length - 1) {
      const base = CHILD_TAX_REDUCTIONS_MONTHLY[CHILD_TAX_REDUCTIONS_MONTHLY.length - 1];
      childTaxReduction = (base + (children - (CHILD_TAX_REDUCTIONS_MONTHLY.length - 1)) * 268) / 12;
    }

    // 10. Net withholding tax
    const withholdingTax = Math.max(0, baseTax - taxFreeReduction - maritalReduction - childTaxReduction);

    // 11. Municipal surcharge
    const communeTax = withholdingTax * (communeTaxRate / 100);
    const totalWithholding = withholdingTax + communeTax;

    // 12. Net salary
    const totalDeductions = netRsz + totalWithholding;
    const netSalary = gross - totalDeductions;

    // 13. Employer costs
    const erRsz = gross * RSZ_EMPLOYER_RATE;
    const totalEmployerCost = gross + erRsz;

    // 14. Child benefit (simplified — flat per child by region)
    let childBenefit = 0;
    if (children > 0) {
      const rates = { flanders: FLANDERS_BASE, wallonia: WALLONIA_BASE, brussels: BRUSSELS_BASE };
      childBenefit = children * (rates[childRegion] || FLANDERS_BASE);
    }

    return {
      gross,
      taxableIncome,
      rszContribution,
      werkbonus,
      netRsz,
      baseTax,
      taxFreeReduction,
      maritalReduction,
      childTaxReduction,
      withholdingTax,
      communeTax,
      totalWithholding,
      totalDeductions,
      netSalary,
      erRsz,
      totalEmployerCost,
      childBenefit,
      expatAllowance,
      // Generic summary fields
      totalTaxes: totalWithholding,
      totalSocialSecurity: netRsz,
      stateBenefit: childBenefit,
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
    const segments = [
      { label: 'Net Salary',       value: Math.max(0, breakdown.netSalary), color: '#059669' },
      { label: 'Withholding Tax',   value: breakdown.totalWithholding,      color: '#e94560' },
      { label: 'RSZ (Social Sec.)', value: breakdown.netRsz,               color: '#3b82f6' },
    ];
    if (breakdown.expatAllowance > 0) {
      segments.push({ label: 'Expat Tax-Free', value: breakdown.expatAllowance, color: '#10b981' });
    }
    return segments.filter(s => s.value > 0);
  },

  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    // RSZ
    rows.push({ type: 'section', label: 'Social Security (RSZ)' });
    rows.push({ label: 'RSZ Contribution 13.07%', amount: r.rszContribution, type: 'deduction' });
    if (r.werkbonus > 0) {
      rows.push({ label: '↳ Werkbonus (RSZ reduction)', amount: r.werkbonus, type: 'benefit' });
    }
    rows.push({ label: 'Net RSZ', amount: r.netRsz, type: 'deduction' });

    // Withholding tax
    rows.push({ type: 'section', label: 'Withholding Tax (Bedrijfsvoorheffing)' });
    rows.push({ label: 'Base Tax (brackets)', amount: r.baseTax, type: 'deduction' });
    if (r.taxFreeReduction > 0) {
      rows.push({ label: '↳ Tax-Free Allowance', amount: r.taxFreeReduction, type: 'benefit' });
    }
    if (r.maritalReduction > 0) {
      rows.push({ label: '↳ Marital Quotient', amount: r.maritalReduction, type: 'benefit' });
    }
    if (r.childTaxReduction > 0) {
      rows.push({ label: '↳ Child Tax Reduction', amount: r.childTaxReduction, type: 'benefit' });
    }
    rows.push({ label: 'Net Withholding Tax', amount: r.withholdingTax, type: 'deduction' });
    if (r.communeTax > 0) {
      rows.push({ label: 'Municipal Surcharge', amount: r.communeTax, type: 'deduction' });
    }

    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Net Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    if (r.childBenefit > 0) {
      rows.push({ type: 'section', label: 'State Benefit' });
      rows.push({ label: 'Child Benefit (Groeipakket)', amount: r.childBenefit, type: 'benefit', icon: '👶' });
      rows.push({ label: 'Net + Child Benefit', amount: r.netSalary + r.childBenefit, type: 'subtotal net', icon: '💚' });
    }

    return rows;
  },

  getEmployerBars(breakdown) {
    return [
      { label: 'Gross Salary', value: breakdown.gross, color: '#3b82f6' },
      { label: 'Employer RSZ 27%', value: breakdown.erRsz, color: '#8b5cf6' },
    ];
  },

  getAnnualSegments(breakdown) {
    return [
      { label: 'Net',              value: breakdown.netSalary * 12,        color: '#059669' },
      { label: 'Withholding Tax',  value: breakdown.totalWithholding * 12, color: '#e94560' },
      { label: 'RSZ (Employee)',   value: breakdown.netRsz * 12,           color: '#3b82f6' },
      { label: 'RSZ (Employer)',   value: breakdown.erRsz * 12,            color: '#8b5cf6' },
    ];
  },
};

export default belgium;
