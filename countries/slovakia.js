/* ══════════════════════════════════════════════════════════
   ExpatCalc — Slovakia Configuration & Tax Computation
   2026 tax rules: Progressive income tax (19/25/30/35%),
   Social insurance 9.4%, Health insurance 5%,
   NČZD, Tax bonus on children, Child benefit, Spouse NČZD
   ══════════════════════════════════════════════════════════ */

// ── Životné minimum ──
const ZM = 284.13;

// ── Social insurance caps ──
const MAX_ASSESSMENT_BASE = 16764;

// ── Employee social insurance rates ──
const EE_SICKNESS     = 0.014;
const EE_OLD_AGE      = 0.04;
const EE_DISABILITY   = 0.03;
const EE_UNEMPLOYMENT = 0.01;

// ── Employer social insurance rates (capped) ──
const ER_SICKNESS     = 0.014;
const ER_OLD_AGE      = 0.14;
const ER_DISABILITY   = 0.03;
const ER_UNEMPLOYMENT = 0.005;
const ER_SUPPORT      = 0.005;
const ER_GUARANTEE    = 0.0025;
const ER_RESERVE      = 0.0475;
const ER_ACCIDENT     = 0.008; // UNCAPPED

// ── Health insurance rates ──
const HI_EE_STANDARD = 0.05;
const HI_EE_DISABLED = 0.025;
const HI_ER_STANDARD = 0.11;
const HI_ER_DISABLED = 0.055;

// ── Income tax brackets (annual thresholds) ──
const TAX_BRACKET_1_ANNUAL = 43983.32;
const TAX_BRACKET_2_ANNUAL = 60349.21;
const TAX_BRACKET_3_ANNUAL = 75010.32;
const TAX_RATE_1 = 0.19;
const TAX_RATE_2 = 0.25;
const TAX_RATE_3 = 0.30;
const TAX_RATE_4 = 0.35;

// ── NČZD on taxpayer ──
const NCZD_MONTHLY = 497.23;
const NCZD_ANNUAL = 5966.73;
const NCZD_THRESHOLD_ANNUAL = 26083.13;
const NCZD_ZERO_ANNUAL = 43983.32;
const NCZD_FORMULA_CONSTANT = 14661.11;

// ── NČZD on spouse ──
const NCZD_SPOUSE_ANNUAL = 5455.30;
const NCZD_SPOUSE_THRESHOLD = 43983.32;
const NCZD_SPOUSE_ZERO = 60349.20;
const NCZD_SPOUSE_FORMULA_CONST = 20116.40;

// ── Tax bonus on children ──
const BONUS_UNDER_15 = 100;
const BONUS_15_TO_17 = 50;
const BONUS_PCT_LIMITS = { 1: 0.29, 2: 0.36, 3: 0.43, 4: 0.50, 5: 0.57, 6: 0.64 };
const BONUS_HIGH_INCOME_THRESHOLD = 27432;

// ── Child benefit (state) ──
const CHILD_BENEFIT_MONTHLY = 60;

// ── Pillar III ──
const PILLAR3_MAX_ANNUAL = 180;

// ── Helper: progressive monthly tax ──
function computeMonthlyTax(monthlyTaxBase) {
  if (monthlyTaxBase <= 0) return 0;
  const b1Limit = TAX_BRACKET_1_ANNUAL / 12;
  const b2Limit = TAX_BRACKET_2_ANNUAL / 12;
  const b3Limit = TAX_BRACKET_3_ANNUAL / 12;

  let tax = 0, remaining = monthlyTaxBase;

  const inB1 = Math.min(remaining, b1Limit);
  tax += inB1 * TAX_RATE_1;
  remaining -= inB1;

  if (remaining > 0) {
    const inB2 = Math.min(remaining, b2Limit - b1Limit);
    tax += inB2 * TAX_RATE_2;
    remaining -= inB2;
  }
  if (remaining > 0) {
    const inB3 = Math.min(remaining, b3Limit - b2Limit);
    tax += inB3 * TAX_RATE_3;
    remaining -= inB3;
  }
  if (remaining > 0) {
    tax += remaining * TAX_RATE_4;
  }

  return Math.round(tax * 100) / 100;
}

// ── Helper: annual NČZD ──
function calcAnnualNCZD(annualTaxBase, isPensioner, monthlyPension) {
  let nczd = 0;
  if (annualTaxBase <= NCZD_THRESHOLD_ANNUAL) {
    nczd = NCZD_ANNUAL;
  } else if (annualTaxBase < NCZD_ZERO_ANNUAL) {
    nczd = Math.max(0, NCZD_FORMULA_CONSTANT - annualTaxBase / 3);
  }

  if (isPensioner) {
    nczd = Math.max(0, nczd - monthlyPension * 12);
  }

  return nczd;
}

// ── Helper: spouse NČZD ──
function calcSpouseNCZD(annualTaxBase, spouseIncome) {
  if (annualTaxBase <= NCZD_SPOUSE_THRESHOLD) {
    return Math.max(0, NCZD_SPOUSE_ANNUAL - spouseIncome);
  } else if (annualTaxBase < NCZD_SPOUSE_ZERO) {
    return Math.max(0, NCZD_SPOUSE_FORMULA_CONST - annualTaxBase / 3 - spouseIncome);
  }
  return 0;
}

// ── Helper: tax bonus on children ──
function calcTaxBonus(numU15, num15to17, monthlyPartialTaxBase) {
  const totalChildren = numU15 + num15to17;
  if (totalChildren === 0) return { bonus: 0, raw: 0, capped: false, reduced: false };

  const rawMonthlyBonus = numU15 * BONUS_UNDER_15 + num15to17 * BONUS_15_TO_17;

  const pctKey = Math.min(totalChildren, 6);
  const pctLimit = BONUS_PCT_LIMITS[pctKey] || 0.64;
  const percentageCap = monthlyPartialTaxBase * pctLimit;
  let bonus = Math.min(rawMonthlyBonus, percentageCap);
  const wasCapped = bonus < rawMonthlyBonus;

  const annualTaxBase = monthlyPartialTaxBase * 12;
  let wasReduced = false;
  if (annualTaxBase > BONUS_HIGH_INCOME_THRESHOLD) {
    const annualReductionPerChild = (annualTaxBase - BONUS_HIGH_INCOME_THRESHOLD) / 10;
    const monthlyReductionPerChild = annualReductionPerChild / 12;
    const totalReduction = monthlyReductionPerChild * totalChildren;
    const reducedBonus = Math.max(0, bonus - totalReduction);
    if (reducedBonus < bonus) wasReduced = true;
    bonus = reducedBonus;
  }

  return { bonus: Math.round(bonus * 100) / 100, raw: rawMonthlyBonus, capped: wasCapped, reduced: wasReduced };
}

// ── Country config ──
const slovakia = {
  id: 'slovakia',
  name: 'Slovakia',
  localName: 'Slovensko',
  flag: '🇸🇰',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'sk-SK',
  accentColor: '#0b4ea2',
  accentSecondary: '#ee1c25',
  supportedLangs: ['en', 'sk'],

  salaryRange: { min: 700, max: 15000, step: 50, default: 2000 },

  options: [
    { id: 'disability', type: 'toggle', label: 'Disability (ZŤP)', sublabel: 'Reduced health insurance rate (2.5% instead of 5%)' },
    { id: 'pensioner', type: 'toggle', label: 'Old-age pensioner', sublabel: 'Exempt from disability & unemployment insurance' },
    {
      id: 'monthlyPension', type: 'number', label: 'Monthly pension (€)',
      sublabel: 'Reduces NČZD tax-free allowance',
      min: 0, max: 3000, step: 10,
      showWhen: ctx => ctx.pensioner,
    },
    { id: 'pillar3', type: 'toggle', label: 'Supplementary pension (III. pillar)', sublabel: 'Annual tax deduction up to €180' },
    { id: 'married', type: 'toggle', label: 'Married' },
    {
      id: 'spouseNCZD', type: 'toggle', label: 'Spouse qualifies for NČZD',
      sublabel: 'Caring for child <3y, job seeker, ZŤP, or care allowance',
      showWhen: ctx => ctx.married,
    },
    {
      id: 'spouseIncome', type: 'number', label: 'Spouse annual income (€)',
      sublabel: 'Reduces spouse NČZD allowance',
      min: 0, max: 100000, step: 100,
      showWhen: ctx => ctx.married && ctx.spouseNCZD,
    },
    { id: 'childrenU15', type: 'counter', label: 'Children under 15', sublabel: 'Tax bonus €100/month per child', min: 0, max: 10 },
    { id: 'children15to17', type: 'counter', label: 'Children aged 15–17', sublabel: 'Tax bonus €50/month per child', min: 0, max: 10 },
  ],

  defaultOptions() {
    return {
      disability: false,
      pensioner: false,
      monthlyPension: 0,
      pillar3: false,
      married: false,
      spouseNCZD: false,
      spouseIncome: 0,
      childrenU15: 0,
      children15to17: 0,
    };
  },

  computeBreakdown(gross, opts) {
    const {
      disability, pensioner, monthlyPension, pillar3,
      married, spouseNCZD, spouseIncome,
      childrenU15, children15to17,
    } = opts;

    const totalChildren = childrenU15 + children15to17;
    const assessmentBase = Math.min(gross, MAX_ASSESSMENT_BASE);

    // 1. Employee social insurance
    const eeSickness = assessmentBase * EE_SICKNESS;
    const eeOldAge = assessmentBase * EE_OLD_AGE;
    const eeDisability = pensioner ? 0 : assessmentBase * EE_DISABILITY;
    const eeUnemployment = pensioner ? 0 : assessmentBase * EE_UNEMPLOYMENT;
    const totalEeSocial = eeSickness + eeOldAge + eeDisability + eeUnemployment;

    // 2. Employee health insurance (no cap)
    const hiRate = disability ? HI_EE_DISABLED : HI_EE_STANDARD;
    const eeHealth = gross * hiRate;

    // 3. Partial tax base
    const partialTaxBase = gross - totalEeSocial - eeHealth;

    // 4. NČZD (monthly payslip view)
    let monthlyNCZDValue = NCZD_MONTHLY;
    if (pensioner && monthlyPension >= NCZD_MONTHLY) {
      monthlyNCZDValue = 0;
    } else if (pensioner) {
      monthlyNCZDValue = Math.max(0, NCZD_MONTHLY - monthlyPension);
    }
    const annualPartialBase = partialTaxBase * 12;
    const annualNCZD = calcAnnualNCZD(annualPartialBase, pensioner, monthlyPension);
    const effectiveMonthlyNCZD = annualNCZD <= 0 ? 0 : monthlyNCZDValue;

    // 5. Taxable income
    const taxableIncome = Math.max(0, partialTaxBase - effectiveMonthlyNCZD);

    // 6. Income tax
    const monthlyTax = computeMonthlyTax(taxableIncome);

    // 7. Tax bonus on children
    const bonusResult = calcTaxBonus(childrenU15, children15to17, partialTaxBase);
    const taxBonus = bonusResult.bonus;

    // Tax after bonus (excess bonus still paid out)
    const taxAfterBonus = monthlyTax - taxBonus;
    const effectiveTax = Math.max(0, taxAfterBonus);
    const excessBonus = taxBonus > monthlyTax ? (taxBonus - monthlyTax) : 0;

    // 8. Total deductions & net
    const totalDeductions = totalEeSocial + eeHealth + effectiveTax;
    const netSalary = gross - totalDeductions + excessBonus;

    // 9. Employer social insurance
    const erSickness = assessmentBase * ER_SICKNESS;
    const erOldAge = assessmentBase * ER_OLD_AGE;
    const erDisability = pensioner ? 0 : assessmentBase * ER_DISABILITY;
    const erUnemployment = pensioner ? 0 : assessmentBase * ER_UNEMPLOYMENT;
    const erSupport = assessmentBase * ER_SUPPORT;
    const erGuarantee = assessmentBase * ER_GUARANTEE;
    const erReserve = assessmentBase * ER_RESERVE;
    const erAccident = gross * ER_ACCIDENT; // UNCAPPED
    const totalErSocialCapped = erSickness + erOldAge + erDisability + erUnemployment + erSupport + erGuarantee + erReserve;
    const totalErSocial = totalErSocialCapped + erAccident;

    // 10. Employer health insurance (no cap)
    const erHiRate = disability ? HI_ER_DISABLED : HI_ER_STANDARD;
    const erHealth = gross * erHiRate;

    const totalEmployerCost = gross + totalErSocial + erHealth;

    // 11. Child benefit (state)
    const childBenefit = totalChildren * CHILD_BENEFIT_MONTHLY;

    // 12. Spouse NČZD (annual, informational)
    const annualSpouseNCZD = (spouseNCZD && married) ? calcSpouseNCZD(annualPartialBase, spouseIncome) : 0;
    let spouseTaxSaving = 0;
    if (annualSpouseNCZD > 0) {
      const annualTaxable = annualPartialBase - annualNCZD;
      if (annualTaxable <= TAX_BRACKET_1_ANNUAL) spouseTaxSaving = annualSpouseNCZD * 0.19;
      else if (annualTaxable <= TAX_BRACKET_2_ANNUAL) spouseTaxSaving = annualSpouseNCZD * 0.25;
      else if (annualTaxable <= TAX_BRACKET_3_ANNUAL) spouseTaxSaving = annualSpouseNCZD * 0.30;
      else spouseTaxSaving = annualSpouseNCZD * 0.35;
    }

    // 13. Pillar III (annual, informational)
    let pillar3Saving = 0;
    if (pillar3) {
      const annualTaxable = annualPartialBase - annualNCZD;
      if (annualTaxable <= TAX_BRACKET_1_ANNUAL) pillar3Saving = PILLAR3_MAX_ANNUAL * 0.19;
      else if (annualTaxable <= TAX_BRACKET_2_ANNUAL) pillar3Saving = PILLAR3_MAX_ANNUAL * 0.25;
      else pillar3Saving = PILLAR3_MAX_ANNUAL * 0.30;
    }

    return {
      gross,
      // Employee social
      eeSickness, eeOldAge, eeDisability, eeUnemployment, totalEeSocial,
      // Employee health
      eeHealth,
      // Tax
      partialTaxBase, effectiveMonthlyNCZD, annualNCZD,
      taxableIncome, monthlyTax,
      taxBonus, taxBonusResult: bonusResult,
      taxAfterBonus, effectiveTax, excessBonus,
      // Totals
      totalDeductions, netSalary,
      // Employer
      erSickness, erOldAge, erDisability, erUnemployment,
      erSupport, erGuarantee, erReserve, erAccident,
      totalErSocial, totalErSocialCapped, erHealth,
      totalEmployerCost,
      // Benefits
      childBenefit, totalChildren,
      annualSpouseNCZD, spouseTaxSaving, pillar3Saving,
      // Generic summary fields
      totalTaxes: effectiveTax,
      totalSocialSecurity: totalEeSocial + eeHealth,
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
      { label: 'Income Tax',       value: breakdown.effectiveTax,           color: '#e94560' },
      { label: 'Social Insurance', value: breakdown.totalEeSocial,          color: '#3b82f6' },
      { label: 'Health Insurance', value: breakdown.eeHealth,               color: '#8b5cf6' },
    ];
    if (breakdown.excessBonus > 0) {
      segments.push({ label: 'Tax Bonus (excess)', value: breakdown.excessBonus, color: '#10b981' });
    }
    return segments.filter(s => s.value > 0);
  },

  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    // Social insurance
    rows.push({ type: 'section', label: 'Social Insurance (Employee)' });
    rows.push({ label: 'Sickness 1.4%', amount: r.eeSickness, type: 'deduction' });
    rows.push({ label: 'Old-age pension 4%', amount: r.eeOldAge, type: 'deduction' });
    if (r.eeDisability > 0) {
      rows.push({ label: 'Disability 3%', amount: r.eeDisability, type: 'deduction' });
    }
    if (r.eeUnemployment > 0) {
      rows.push({ label: 'Unemployment 1%', amount: r.eeUnemployment, type: 'deduction' });
    }

    // Health insurance
    rows.push({ type: 'section', label: 'Health Insurance (Employee)' });
    rows.push({ label: `Health Insurance ${r.eeHealth > 0 && r.gross > 0 ? Math.round(r.eeHealth / r.gross * 100 * 10) / 10 : 5}%`, amount: r.eeHealth, type: 'deduction' });

    // Taxes
    rows.push({ type: 'section', label: 'Income Tax' });
    if (r.effectiveMonthlyNCZD > 0) {
      rows.push({ label: '↳ Tax-free allowance (NČZD)', amount: r.effectiveMonthlyNCZD, type: 'benefit' });
    }
    rows.push({ label: 'Income Tax (progressive)', amount: r.monthlyTax, type: 'deduction' });
    if (r.taxBonus > 0) {
      rows.push({ label: '↳ Tax Bonus on Children', amount: r.taxBonus, type: 'benefit' });
      rows.push({ label: 'Tax after bonus', amount: Math.max(0, r.taxAfterBonus), type: 'deduction' });
    }

    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Net Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    if (r.childBenefit > 0) {
      rows.push({ type: 'section', label: 'State Benefit' });
      rows.push({ label: 'Child Benefit (state)', amount: r.childBenefit, type: 'benefit', icon: '👶' });
      rows.push({ label: 'Net + Child Benefit', amount: r.netSalary + r.childBenefit, type: 'subtotal net', icon: '💚' });
    }

    if (r.annualSpouseNCZD > 0) {
      rows.push({ type: 'section', label: 'Annual Adjustments' });
      rows.push({ label: 'Spouse NČZD (annual tax saving)', amount: r.spouseTaxSaving / 12, type: 'benefit' });
    }

    if (r.pillar3Saving > 0) {
      rows.push({ label: 'Pillar III (annual tax saving)', amount: r.pillar3Saving / 12, type: 'benefit' });
    }

    return rows;
  },

  getEmployerBars(breakdown) {
    const r = breakdown;
    return [
      { label: 'Gross Salary', value: r.gross, color: '#3b82f6' },
      { label: 'Social Insurance (capped)', value: r.totalErSocialCapped, color: '#8b5cf6' },
      { label: 'Accident Insurance', value: r.erAccident, color: '#ec4899' },
      { label: 'Health Insurance', value: r.erHealth, color: '#f59e0b' },
    ];
  },

  getAnnualSegments(breakdown) {
    const r = breakdown;
    return [
      { label: 'Net',             value: r.netSalary * 12,                     color: '#059669' },
      { label: 'Income Tax',      value: r.effectiveTax * 12,                  color: '#e94560' },
      { label: 'SS + HI (Empl.)', value: (r.totalEeSocial + r.eeHealth) * 12,  color: '#3b82f6' },
      { label: 'SS + HI (Employer)', value: (r.totalErSocial + r.erHealth) * 12, color: '#8b5cf6' },
    ];
  },
};

export default slovakia;
