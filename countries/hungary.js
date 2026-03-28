/* ══════════════════════════════════════════════════════════
   ExpatCalc — Hungary Configuration & Tax Computation
   2026 tax rules: SZJA 15%, TB 18.5%, Szocho 13%
   ══════════════════════════════════════════════════════════ */

// ── Tax constants ──
const SZJA_RATE = 0.15;
const TB_RATE = 0.185;
const TB_PENSION = 0.10;
const TB_HEALTH = 0.085;
const SZOCHO_RATE = 0.13;
const UNDER25_LIMIT = 715765;
const NEWLYWED_BASE = 33335;
const DISABLED_EXTRA_BASE = 66670;

const FAMILY_BASE_REDUCTION = {
  1: 133340,
  2: 266660,
  3: 440000, // per dependent for 3+
};

const CSALADI_POTLEK = {
  twoParent:    { 1: 12200, 2: 13300, 3: 16000 },
  singleParent: { 1: 13700, 2: 14800, 3: 17000 },
  disabled: 23300,
};

// ── Country config ──
const hungary = {
  id: 'hungary',
  name: 'Hungary',
  localName: 'Magyarország',
  flag: '🇭🇺',
  currency: 'HUF',
  currencySymbol: 'Ft',
  locale: 'hu-HU',
  accentColor: '#c8a44e',
  accentSecondary: '#8b1a3a',
  supportedLangs: ['en', 'hu'],

  salaryRange: { min: 100000, max: 5000000, step: 10000, default: 500000 },

  options: [
    { id: 'under25',       type: 'toggle', label: 'Under 25 tax exemption',    sublabel: 'PIT exemption up to 715,765 HUF/month' },
    { id: 'newlywed',      type: 'toggle', label: 'Newlywed (first marriage)',  sublabel: '33,335 HUF/month tax base reduction, max 24 months' },
    { id: 'motherUnder30', type: 'toggle', label: 'Mother under 30',           sublabel: 'Full PIT exemption (no limit, from 2026)' },
    { id: 'mother4plus',   type: 'toggle', label: 'Mother with 4+ children',   sublabel: 'Full PIT exemption regardless of age' },
    { id: 'children',      type: 'counter', label: 'Number of dependents (children)', min: 0, max: 10 },
    { id: 'beneficiaryChildren', type: 'counter', label: 'Beneficiary dependents', sublabel: 'Children qualifying for the benefit', min: 0, max: 10, dependsOn: 'children' },
    { id: 'singleParent',  type: 'toggle', label: 'Single parent',             showWhen: 'children' },
    { id: 'disabledChild', type: 'toggle', label: 'Disabled child',            showWhen: 'children' },
  ],

  defaultOptions() {
    return {
      under25: false,
      newlywed: false,
      motherUnder30: false,
      mother4plus: false,
      children: 0,
      beneficiaryChildren: 0,
      singleParent: false,
      disabledChild: false,
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
      under25, newlywed, motherUnder30, mother4plus,
      children, beneficiaryChildren, singleParent, disabledChild,
    } = opts;

    // === SZJA calculation ===
    let szjaBase = gross;
    const szjaReductions = {};

    // Under-25 exemption
    let under25Benefit = 0;
    if (under25) {
      under25Benefit = Math.min(gross, UNDER25_LIMIT);
      szjaBase -= under25Benefit;
      szjaReductions.under25 = under25Benefit;
    }

    // Mother under 30 — full exemption, no limit from 2026
    let motherUnder30Benefit = 0;
    if (motherUnder30 && children > 0) {
      motherUnder30Benefit = szjaBase;
      szjaBase = 0;
      szjaReductions.motherUnder30 = motherUnder30Benefit;
    }

    // Mother 4+ children — full exemption
    let mother4plusBenefit = 0;
    if (mother4plus && !motherUnder30) {
      mother4plusBenefit = szjaBase;
      szjaBase = 0;
      szjaReductions.mother4plus = mother4plusBenefit;
    }

    // Newlywed allowance
    let newlywedBenefit = 0;
    if (newlywed) {
      newlywedBenefit = Math.min(NEWLYWED_BASE, szjaBase);
      szjaBase -= newlywedBenefit;
      szjaReductions.newlywed = newlywedBenefit;
    }

    // Family tax base reduction
    let familyBaseReduction = 0;
    if (children > 0 && beneficiaryChildren > 0) {
      const rateKey = Math.min(children, 3);
      const perDependent = FAMILY_BASE_REDUCTION[rateKey];
      familyBaseReduction = perDependent * beneficiaryChildren;
      if (disabledChild) {
        familyBaseReduction += DISABLED_EXTRA_BASE * beneficiaryChildren;
      }
    }

    // Family benefit first reduces SZJA base
    const familyBaseUsedOnSzja = Math.min(familyBaseReduction, szjaBase);
    szjaBase -= familyBaseUsedOnSzja;

    const szja = Math.max(0, szjaBase * SZJA_RATE);

    // Remaining family benefit reduces TB
    const familyBaseRemaining = familyBaseReduction - familyBaseUsedOnSzja;
    const familyTbReduction = familyBaseRemaining > 0 ? familyBaseRemaining * SZJA_RATE : 0;
    const familyTaxBenefitTotal = familyBaseUsedOnSzja * SZJA_RATE + familyTbReduction;

    // === TB (Social Security) ===
    const tbGross = gross * TB_RATE;
    const tbActual = Math.max(0, tbGross - familyTbReduction);
    let tbPension = gross * TB_PENSION;
    let tbHealth = gross * TB_HEALTH;

    if (familyTbReduction > 0) {
      const tbReductionRatio = tbActual / tbGross;
      tbPension = tbPension * tbReductionRatio;
      tbHealth = tbActual - tbPension;
    }

    // === NET ===
    const totalDeductions = szja + tbActual;
    const netSalary = gross - totalDeductions;

    // === EMPLOYER COSTS ===
    const szocho = gross * SZOCHO_RATE;
    const totalEmployerCost = gross + szocho;

    // === CSALÁDI PÓTLÉK ===
    let csaladipotlek = 0;
    if (children > 0) {
      const parentType = singleParent ? 'singleParent' : 'twoParent';
      if (disabledChild) {
        csaladipotlek = CSALADI_POTLEK.disabled * children;
      } else {
        const key = Math.min(children, 3);
        csaladipotlek = CSALADI_POTLEK[parentType][key] * children;
      }
    }

    return {
      gross,
      szja,
      szjaBase: Math.max(0, szjaBase),
      szjaReductions,
      tbActual,
      tbPension,
      tbHealth,
      tbGross,
      familyBaseReduction,
      familyBaseUsedOnSzja,
      familyTbReduction,
      familyTaxBenefitTotal,
      under25Benefit,
      newlywedBenefit: newlywed ? newlywedBenefit : 0,
      totalDeductions,
      netSalary,
      szocho,
      totalEmployerCost,
      csaladipotlek,
      motherExempt: motherUnder30 || mother4plus,
      // Generic summary fields for ResultPanel
      totalTaxes: szja,
      totalSocialSecurity: tbActual,
      stateBenefit: csaladipotlek,
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
    return [
      { label: 'Net Salary',    value: breakdown.netSalary, color: '#10b981' },
      { label: 'PIT (SZJA)',    value: breakdown.szja,      color: '#ef4444' },
      { label: 'Pension',       value: breakdown.tbPension, color: '#3b82f6' },
      { label: 'Health Ins.',   value: breakdown.tbHealth,  color: '#8b5cf6' },
    ];
  },

  /**
   * Get breakdown table rows for display.
   */
  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });
    rows.push({ type: 'section', label: 'Employee Deductions' });

    // SZJA
    rows.push({ label: 'PIT (personal income tax) 15%', amount: r.szja, type: 'deduction' });

    if (r.szjaReductions.under25) {
      rows.push({ label: '↳ Under-25 benefit', amount: Math.round(r.szjaReductions.under25 * SZJA_RATE), type: 'benefit' });
    }
    if (r.szjaReductions.motherUnder30) {
      rows.push({ label: '↳ Mother under-30 benefit', amount: Math.round(r.szjaReductions.motherUnder30 * SZJA_RATE), type: 'benefit' });
    }
    if (r.szjaReductions.mother4plus) {
      rows.push({ label: '↳ Mother 4+ children benefit', amount: Math.round(r.szjaReductions.mother4plus * SZJA_RATE), type: 'benefit' });
    }
    if (r.newlywedBenefit > 0) {
      rows.push({ label: '↳ Newlywed benefit', amount: Math.round(r.newlywedBenefit * SZJA_RATE), type: 'benefit' });
    }
    if (r.familyBaseUsedOnSzja > 0) {
      rows.push({ label: '↳ Family tax benefit (PIT)', amount: Math.round(r.familyBaseUsedOnSzja * SZJA_RATE), type: 'benefit' });
    }

    // TB
    const tbEffRate = r.gross > 0 ? (r.tbActual / r.gross * 100).toFixed(2) : '18.50';
    const tbPensionRate = r.gross > 0 ? (r.tbPension / r.gross * 100).toFixed(2) : '10.00';
    const tbHealthRate = r.gross > 0 ? (r.tbHealth / r.gross * 100).toFixed(2) : '8.50';

    rows.push({ label: `Social Security ${tbEffRate}%`, amount: r.tbActual, type: 'deduction' });
    rows.push({ label: `↳ Pension ${tbPensionRate}%`, amount: r.tbPension, type: 'detail' });
    rows.push({ label: `↳ Health insurance ${tbHealthRate}%`, amount: r.tbHealth, type: 'detail' });

    if (r.familyTbReduction > 0) {
      rows.push({ label: '↳ Family benefit TB reduction', amount: r.familyTbReduction, type: 'benefit' });
    }

    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Net Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    if (r.csaladipotlek > 0) {
      rows.push({ type: 'section', label: 'State Benefit' });
      rows.push({ label: 'Family Allowance', amount: r.csaladipotlek, type: 'benefit', icon: '👶' });
      rows.push({ label: 'Net + Family Allowance', amount: r.netSalary + r.csaladipotlek, type: 'subtotal net', icon: '💚' });
    }

    return rows;
  },

  /**
   * Get employer cost bar items.
   */
  getEmployerBars(breakdown) {
    return [
      { label: 'Gross Salary', value: breakdown.gross, color: '#3b82f6' },
      { label: 'Social Contribution Tax (Szocho) 13%', value: breakdown.szocho, color: '#f59e0b' },
    ];
  },

  /**
   * Get annual bar segments.
   */
  getAnnualSegments(breakdown) {
    return [
      { label: 'Net',             value: breakdown.netSalary * 12,  color: '#10b981' },
      { label: 'PIT (SZJA)',      value: breakdown.szja * 12,       color: '#ef4444' },
      { label: 'Social Security', value: breakdown.tbActual * 12,   color: '#3b82f6' },
      { label: 'Szocho',          value: breakdown.szocho * 12,     color: '#f59e0b' },
    ];
  },
};

export default hungary;
