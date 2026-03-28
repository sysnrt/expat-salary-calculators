/* ══════════════════════════════════════════════════════════
   ExpatCalc — Poland Configuration & Tax Computation
   2026 tax rules: PIT (12/32%), ZUS 13.71%, Health 9%,
   KUP, Kwota wolna, PPK, Child tax credit, Rodzina 800+,
   Under-26 relief, 50% Author's costs, Joint filing
   ══════════════════════════════════════════════════════════ */

// ── PIT brackets (annual) ──
const PIT_THRESHOLD = 120000;
const PIT_RATE_1 = 0.12;
const PIT_RATE_2 = 0.32;
const TAX_REDUCING_ANNUAL = 3600; // kwota zmniejszająca podatek
const TAX_REDUCING_MONTHLY = 300;

// ── Tax-free amount ──
const TAX_FREE_AMOUNT = 30000;

// ── Employee ZUS rates ──
const ZUS_PENSION_EE  = 0.0976;
const ZUS_DISABILITY_EE = 0.015;
const ZUS_SICKNESS_EE = 0.0245;
const ZUS_TOTAL_EE = 0.1371;
const ZUS_PENSION_DISABILITY_EE = 0.1126; // pension + disability combined

// ── Employer ZUS rates ──
const ZUS_PENSION_ER    = 0.0976;
const ZUS_DISABILITY_ER = 0.065;
const ZUS_ACCIDENT_ER   = 0.0167;
const ZUS_LABOUR_FUND   = 0.0245;
const ZUS_FGSP          = 0.001;

// ── Annual contribution cap (30-fold) ──
const ZUS_ANNUAL_CAP = 282600;

// ── Health insurance ──
const HEALTH_RATE = 0.09;

// ── KUP (employee deductible costs) ──
const KUP_LOCAL = 250;
const KUP_COMMUTER = 300;
const KUP_50_ANNUAL_CAP = 120000; // annual cap on 50% author's costs

// ── Under-26 relief ──
const UNDER_26_CAP = 85528;

// ── Child tax credit (annual) ──
const CHILD_CREDIT = [1112.04, 1112.04, 2000.04, 2700];
// 1st, 2nd = 1112.04; 3rd = 2000.04; 4th+ = 2700 each

// ── Income limit for 1st child credit ──
const CHILD_1_INCOME_LIMIT_JOINT = 112000;
const CHILD_1_INCOME_LIMIT_SINGLE = 56000;

// ── Rodzina 800+ ──
const CHILD_BENEFIT_MONTHLY = 800;

// ── PPK rates ──
const PPK_EE_BASIC = 0.02;
const PPK_ER_BASIC = 0.015;

// ── Solidarity tax ──
const SOLIDARITY_THRESHOLD = 1000000;
const SOLIDARITY_RATE = 0.04;

// ── Helper: compute annual PIT (progressive scale) ──
function computeAnnualPIT(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax;
  if (taxableIncome <= PIT_THRESHOLD) {
    tax = taxableIncome * PIT_RATE_1 - TAX_REDUCING_ANNUAL;
  } else {
    tax = PIT_THRESHOLD * PIT_RATE_1 - TAX_REDUCING_ANNUAL
        + (taxableIncome - PIT_THRESHOLD) * PIT_RATE_2;
  }
  return Math.max(0, tax);
}

// ── Helper: compute child tax credit (annual) ──
function computeChildCredit(numChildren, annualIncome, filingStatus) {
  if (numChildren <= 0) return 0;

  // Income limit only applies if exactly 1 child
  if (numChildren === 1) {
    const limit = (filingStatus === 'single') ? CHILD_1_INCOME_LIMIT_SINGLE : CHILD_1_INCOME_LIMIT_JOINT;
    if (annualIncome > limit) return 0;
  }

  let credit = 0;
  for (let i = 0; i < numChildren; i++) {
    if (i < 3) {
      credit += CHILD_CREDIT[Math.min(i, CHILD_CREDIT.length - 1)];
    } else {
      credit += CHILD_CREDIT[3]; // 4th+ = 2700 each
    }
  }
  return credit;
}

// ── Country config ──
const poland = {
  id: 'poland',
  name: 'Poland',
  localName: 'Polska',
  flag: '🇵🇱',
  currency: 'PLN',
  currencySymbol: 'zł',
  locale: 'pl-PL',
  accentColor: '#dc143c',
  accentSecondary: '#ffffff',
  supportedLangs: ['en', 'pl'],

  salaryRange: { min: 4666, max: 50000, step: 100, default: 9000 },

  options: [
    {
      id: 'filingStatus', type: 'select', label: 'Filing Status',
      choices: [
        { value: 'single', label: 'Single' },
        { value: 'married', label: 'Married (joint filing)' },
        { value: 'singleParent', label: 'Single Parent' },
      ],
    },
    {
      id: 'spouseIncome', type: 'number', label: 'Spouse annual gross (PLN)',
      sublabel: 'For joint filing — halves combined taxable income',
      min: 0, max: 1000000, step: 1000,
      showWhen: ctx => ctx.filingStatus === 'married',
    },
    { id: 'commuter', type: 'toggle', label: 'Commuter', sublabel: 'Higher deductible costs (PLN 300/mo instead of 250)' },
    {
      id: 'kup50', type: 'toggle', label: '50% Author\'s Costs (KUP50)',
      sublabel: 'For IP/copyright work — cap PLN 120k/yr deductible costs',
    },
    {
      id: 'kup50pct', type: 'number', label: 'IP portion of salary (%)',
      sublabel: 'Percentage of gross qualifying for 50% deduction',
      min: 0, max: 100, step: 5,
      showWhen: ctx => ctx.kup50,
    },
    { id: 'under26', type: 'toggle', label: 'Under 26 (PIT-0)', sublabel: 'Tax exempt up to PLN 85,528/year' },
    { id: 'ppk', type: 'toggle', label: 'PPK (Employee Capital Plan)', sublabel: 'Employee 2% + Employer 1.5% of gross' },
    { id: 'children', type: 'counter', label: 'Children (tax credit)', sublabel: 'Ulga prorodzinna — deducted from tax', min: 0, max: 10 },
    { id: 'childrenU18', type: 'counter', label: 'Children under 18 (800+)', sublabel: 'Rodzina 800+ — PLN 800/month per child', min: 0, max: 10 },
  ],

  defaultOptions() {
    return {
      filingStatus: 'single',
      spouseIncome: 0,
      commuter: false,
      kup50: false,
      kup50pct: 80,
      under26: false,
      ppk: false,
      children: 0,
      childrenU18: 0,
    };
  },

  computeBreakdown(gross, opts) {
    const {
      filingStatus, spouseIncome, commuter, kup50, kup50pct,
      under26, ppk, children, childrenU18,
    } = opts;

    const annualGross = gross * 12;

    // 1. Employee ZUS (assume below annual cap for monthly view)
    // For simplicity in monthly calculator, apply full rate
    // Cap effect shown in annual view
    const zusEmployee = gross * ZUS_TOTAL_EE;
    const zusPension = gross * ZUS_PENSION_EE;
    const zusDisability = gross * ZUS_DISABILITY_EE;
    const zusSickness = gross * ZUS_SICKNESS_EE;

    // 2. Health insurance (on base after ZUS)
    const healthBase = gross - zusEmployee;
    const healthInsurance = healthBase * HEALTH_RATE;

    // 3. KUP (deductible costs)
    const kupBase = commuter ? KUP_COMMUTER : KUP_LOCAL;
    let kup = kupBase;

    // 50% Author's costs
    let kup50Amount = 0;
    if (kup50 && kup50pct > 0) {
      const ipPortion = gross * (kup50pct / 100);
      const monthlyCap = KUP_50_ANNUAL_CAP / 12;
      kup50Amount = Math.min(ipPortion * 0.50, monthlyCap);
      // KUP50 replaces standard KUP for the IP portion
      const nonIpPortion = gross - ipPortion;
      kup = (nonIpPortion > 0 ? kupBase : 0) + kup50Amount;
    }

    // 4. Tax base (monthly)
    const taxBase = Math.max(0, gross - zusEmployee - kup);
    const taxBaseRounded = Math.round(taxBase);

    // 5. Annual taxable income for rate determination
    const annualZUS = zusEmployee * 12;
    const annualKUP = kup * 12;
    let annualTaxableIncome = Math.max(0, annualGross - annualZUS - annualKUP);

    // 6. Joint filing (split income)
    let jointDivisor = 1;
    if (filingStatus === 'married') {
      // Spouse income: compute their ZUS too (approximate)
      const spouseMonthly = spouseIncome / 12;
      const spouseZUS = spouseMonthly * ZUS_TOTAL_EE;
      const spouseAnnualKUP = kupBase * 12; // assume standard KUP for spouse
      const spouseTaxable = Math.max(0, spouseIncome - spouseZUS * 12 - spouseAnnualKUP);
      annualTaxableIncome = annualTaxableIncome + spouseTaxable;
      jointDivisor = 2;
    } else if (filingStatus === 'singleParent' && children > 0) {
      jointDivisor = 2;
    }

    // 7. Under-26 relief
    let under26Exempt = 0;
    if (under26) {
      under26Exempt = Math.min(annualGross, UNDER_26_CAP);
    }

    // 8. Annual PIT
    let annualPIT;
    if (under26 && annualGross <= UNDER_26_CAP) {
      // Fully exempt
      annualPIT = 0;
    } else {
      let effectiveTaxableIncome = annualTaxableIncome;
      if (under26) {
        // Only income above cap is taxable
        const taxableGross = annualGross - UNDER_26_CAP;
        effectiveTaxableIncome = Math.max(0, taxableGross - annualZUS * (taxableGross / annualGross) - annualKUP);
      }

      const perPerson = effectiveTaxableIncome / jointDivisor;
      annualPIT = computeAnnualPIT(perPerson) * jointDivisor;
    }

    // 9. Child tax credit
    const childCredit = computeChildCredit(children, annualTaxableIncome / jointDivisor, filingStatus);
    annualPIT = Math.max(0, annualPIT - childCredit);

    // 10. Solidarity tax (>1M PLN)
    let solidarityTax = 0;
    if (annualTaxableIncome > SOLIDARITY_THRESHOLD) {
      solidarityTax = (annualTaxableIncome - SOLIDARITY_THRESHOLD) * SOLIDARITY_RATE;
    }

    // 11. Monthly PIT advance
    const monthlyPIT = Math.max(0, Math.round((annualPIT + solidarityTax) / 12));

    // 12. PPK
    const ppkEmployee = ppk ? gross * PPK_EE_BASIC : 0;
    const ppkEmployer = ppk ? gross * PPK_ER_BASIC : 0;
    // PPK employer contribution adds to taxable income for PIT
    // (simplified: not included in the monthly PIT calc above for simplicity)

    // 13. Total deductions & net
    const totalDeductions = zusEmployee + healthInsurance + monthlyPIT;
    const netBeforePPK = gross - totalDeductions;
    const netSalary = netBeforePPK - ppkEmployee;

    // 14. Employer costs
    const erPension = gross * ZUS_PENSION_ER;
    const erDisability = gross * ZUS_DISABILITY_ER;
    const erAccident = gross * ZUS_ACCIDENT_ER;
    const erLabourFund = gross * ZUS_LABOUR_FUND;
    const erFGSP = gross * ZUS_FGSP;
    const totalErZUS = erPension + erDisability + erAccident + erLabourFund + erFGSP;
    const totalEmployerCost = gross + totalErZUS + ppkEmployer;

    // 15. Child benefit (Rodzina 800+)
    const childBenefit = childrenU18 * CHILD_BENEFIT_MONTHLY;

    return {
      gross,
      // Employee ZUS
      zusPension, zusDisability, zusSickness, zusEmployee,
      // Health
      healthBase, healthInsurance,
      // Tax
      kup, kup50Amount, taxBaseRounded,
      monthlyPIT, annualPIT, annualTaxableIncome,
      childCredit, solidarityTax,
      under26, under26Exempt,
      // Totals
      totalDeductions, netBeforePPK, netSalary,
      // PPK
      ppkEmployee, ppkEmployer,
      // Employer
      erPension, erDisability, erAccident, erLabourFund, erFGSP,
      totalErZUS, totalEmployerCost,
      // Benefits
      childBenefit,
      // Generic summary fields
      totalTaxes: monthlyPIT,
      totalSocialSecurity: zusEmployee + healthInsurance,
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
      { label: 'Net Salary',        value: Math.max(0, breakdown.netSalary), color: '#059669' },
      { label: 'Income Tax (PIT)',   value: breakdown.monthlyPIT,             color: '#e94560' },
      { label: 'ZUS (Social)',       value: breakdown.zusEmployee,            color: '#3b82f6' },
      { label: 'Health Insurance',   value: breakdown.healthInsurance,        color: '#8b5cf6' },
    ];
    if (breakdown.ppkEmployee > 0) {
      segments.push({ label: 'PPK (Employee)', value: breakdown.ppkEmployee, color: '#f59e0b' });
    }
    return segments.filter(s => s.value > 0);
  },

  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    // ZUS
    rows.push({ type: 'section', label: 'Social Security (ZUS — Employee)' });
    rows.push({ label: 'Pension (emerytalna) 9.76%', amount: r.zusPension, type: 'deduction' });
    rows.push({ label: 'Disability (rentowa) 1.50%', amount: r.zusDisability, type: 'deduction' });
    rows.push({ label: 'Sickness (chorobowa) 2.45%', amount: r.zusSickness, type: 'deduction' });

    // Health
    rows.push({ type: 'section', label: 'Health Insurance (NFZ)' });
    rows.push({ label: 'Health Insurance 9%', amount: r.healthInsurance, type: 'deduction' });

    // Tax
    rows.push({ type: 'section', label: r.under26 ? 'Income Tax (PIT-0 Under 26)' : 'Income Tax (PIT)' });
    if (r.kup > 0) {
      rows.push({ label: r.kup50Amount > 0 ? '↳ Deductible Costs (incl. KUP50)' : '↳ Deductible Costs (KUP)', amount: r.kup, type: 'benefit' });
    }
    rows.push({ label: 'Monthly PIT Advance', amount: r.monthlyPIT, type: 'deduction' });
    if (r.childCredit > 0) {
      rows.push({ label: '↳ Child Tax Credit (annual)', amount: r.childCredit / 12, type: 'benefit' });
    }

    rows.push({ label: 'Total Deductions', amount: r.totalDeductions, type: 'subtotal deduction', icon: '📌' });

    if (r.ppkEmployee > 0) {
      rows.push({ type: 'section', label: 'PPK (Employee Capital Plan)' });
      rows.push({ label: 'PPK Employee 2%', amount: r.ppkEmployee, type: 'deduction' });
    }

    rows.push({ label: 'Net Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    if (r.childBenefit > 0) {
      rows.push({ type: 'section', label: 'State Benefit' });
      rows.push({ label: 'Rodzina 800+ (per child)', amount: r.childBenefit, type: 'benefit', icon: '👶' });
      rows.push({ label: 'Net + 800+', amount: r.netSalary + r.childBenefit, type: 'subtotal net', icon: '💚' });
    }

    return rows;
  },

  getEmployerBars(breakdown) {
    const r = breakdown;
    const bars = [
      { label: 'Gross Salary', value: r.gross, color: '#3b82f6' },
      { label: 'Pension + Disability', value: r.erPension + r.erDisability, color: '#8b5cf6' },
      { label: 'Accident 1.67%', value: r.erAccident, color: '#ec4899' },
      { label: 'Labour Fund + FGŚP', value: r.erLabourFund + r.erFGSP, color: '#f59e0b' },
    ];
    if (r.ppkEmployer > 0) {
      bars.push({ label: 'PPK Employer 1.5%', value: r.ppkEmployer, color: '#10b981' });
    }
    return bars;
  },

  getAnnualSegments(breakdown) {
    const r = breakdown;
    return [
      { label: 'Net',             value: r.netSalary * 12,                          color: '#059669' },
      { label: 'PIT',             value: r.monthlyPIT * 12,                         color: '#e94560' },
      { label: 'ZUS + Health (Empl.)', value: (r.zusEmployee + r.healthInsurance) * 12, color: '#3b82f6' },
      { label: 'ZUS (Employer)',   value: r.totalErZUS * 12,                         color: '#8b5cf6' },
    ];
  },
};

export default poland;
