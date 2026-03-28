/* ══════════════════════════════════════════════════════════
   ExpatCalc — Netherlands Configuration & Tax Computation
   2026 tax rules: Loonheffing, Heffingskortingen, 30% Ruling
   ══════════════════════════════════════════════════════════ */

// ── Bracket rates (loonheffing = income tax + social premiums combined) ──
const BRACKET_1_CEILING = 38883;
const BRACKET_2_CEILING = 78426;
const BRACKET_1_RATE     = 0.3575;   // 35.75% = 8.10% tax + 27.65% premiums
const BRACKET_2_RATE     = 0.3756;   // 37.56% pure income tax
const BRACKET_3_RATE     = 0.4950;   // 49.50% pure income tax
const BRACKET_1_RATE_AOW = 0.1785;   // 17.85% = 8.10% tax + 9.75% premiums (no AOW)

// ── Social premiums component (for display split) ──
const PREMIUMS_COMBINED  = 0.2765;   // AOW 17.90% + ANW 0.10% + WLZ 9.65%
const PREMIUMS_AOW_AGE   = 0.0975;   // ANW 0.10% + WLZ 9.65%
const PREMIUMS_CEILING   = 38883;

// ── Algemene heffingskorting ──
const AHK_MAX            = 3115;
const AHK_MAX_AOW        = 1556;
const AHK_PHASEOUT_START = 29736;
const AHK_PHASEOUT_RATE  = 0.06398;
const AHK_PHASEOUT_RATE_AOW = 0.03195;
const AHK_ZERO           = 78426;

// ── Arbeidskorting ──
const AK_T1 = 11965;  const AK_T2 = 25845;  const AK_T3 = 45592;  const AK_T4 = 132920;
const AK_R1 = 0.08324; const AK_R2 = 0.31009; const AK_R3 = 0.01950; const AK_PO = 0.06510;
const AK_B1 = 996;     const AK_B2 = 5300;    const AK_MAX = 5685;
// AOW age
const AK_R1_AOW = 0.04156; const AK_R2_AOW = 0.15483; const AK_R3_AOW = 0.00974; const AK_PO_AOW = 0.03250;
const AK_B1_AOW = 498;     const AK_B2_AOW = 2647;    const AK_MAX_AOW = 2840;

// ── 30% ruling ──
const RULING_TAXFREE_PCT  = 0.30;
const RULING_SALARY_CAP   = 246000;

// ── Kinderbijslag 2025 (SVB — H2 quarterly rates → monthly) ──
const KB_0_5   = 291.49 / 3;    // ~97.16/month  (age 0-5)
const KB_6_11  = 353.95 / 3;    // ~117.98/month (age 6-11)
const KB_12_17 = 416.41 / 3;    // ~138.80/month (age 12-17)

// ── Employer premiums ──
const ZVW_EMPLOYER_RATE = 0.0610;
const WW_LOW_RATE       = 0.0274;
const AOF_RATE          = 0.0763;
const UFO_RATE          = 0.0068;
const ER_CEILING        = 79409;

// ── Holiday allowance ──
const VAKANTIEGELD_RATE = 0.08;

// ── Heffingskorting helpers ──
function calcAHK(income, isAOW) {
  const max  = isAOW ? AHK_MAX_AOW : AHK_MAX;
  const rate = isAOW ? AHK_PHASEOUT_RATE_AOW : AHK_PHASEOUT_RATE;
  if (income <= AHK_PHASEOUT_START) return max;
  if (income >= AHK_ZERO) return 0;
  return Math.max(0, max - rate * (income - AHK_PHASEOUT_START));
}

function calcAK(income, isAOW) {
  if (isAOW) {
    if (income <= AK_T1) return AK_R1_AOW * income;
    if (income <= AK_T2) return AK_B1_AOW + AK_R2_AOW * (income - AK_T1);
    if (income <= AK_T3) return AK_B2_AOW + AK_R3_AOW * (income - AK_T2);
    if (income <= AK_T4) return Math.max(0, AK_MAX_AOW - AK_PO_AOW * (income - AK_T3));
    return 0;
  }
  if (income <= AK_T1) return AK_R1 * income;
  if (income <= AK_T2) return AK_B1 + AK_R2 * (income - AK_T1);
  if (income <= AK_T3) return AK_B2 + AK_R3 * (income - AK_T2);
  if (income <= AK_T4) return Math.max(0, AK_MAX - AK_PO * (income - AK_T3));
  return 0;
}

// ── Country config ──
const netherlands = {
  id: 'netherlands',
  name: 'Netherlands',
  localName: 'Nederland',
  flag: '🇳🇱',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'nl-NL',
  accentColor: '#f36c21',
  accentSecondary: '#21468b',
  supportedLangs: ['en', 'nl'],

  salaryRange: { min: 500, max: 15000, step: 50, default: 4000 },

  options: [
    { id: 'ruling30', type: 'toggle', label: '30% Ruling', sublabel: '30% of salary paid tax-free (expat benefit)' },
    { id: 'aowAge', type: 'toggle', label: 'AOW age (67+)', sublabel: 'Reduced social premiums — no AOW contribution' },
    { id: 'vakantiegeldIncluded', type: 'toggle', label: 'Holiday allowance included', sublabel: '8% vakantiegeld already included in gross' },
    { id: 'children05', type: 'counter', label: 'Children age 0-5', sublabel: 'Kinderbijslag: ~97/month each', min: 0, max: 10 },
    { id: 'children611', type: 'counter', label: 'Children age 6-11', sublabel: 'Kinderbijslag: ~118/month each', min: 0, max: 10 },
    { id: 'children1217', type: 'counter', label: 'Children age 12-17', sublabel: 'Kinderbijslag: ~139/month each', min: 0, max: 10 },
  ],

  defaultOptions() {
    return {
      ruling30: false,
      aowAge: false,
      vakantiegeldIncluded: false,
      children05: 0,
      children611: 0,
      children1217: 0,
    };
  },

  /**
   * Core computation — pure function.
   * @param {number} gross - Monthly gross salary
   * @param {object} opts - Option values from defaultOptions()
   * @returns {object} Full breakdown
   */
  computeBreakdown(gross, opts) {
    const { ruling30, aowAge, vakantiegeldIncluded, children05, children611, children1217 } = opts;

    // Step 1 — Annual gross
    // When vakantiegeld is NOT included, the 8% is a separate entitlement paid on top.
    // For monthly payroll tax purposes, we calculate on the base salary (12x monthly).
    // The vakantiegeld is taxed separately when paid out (bijzonder tarief).
    // When vakantiegeld IS included, the gross already contains the 8% reserve.
    const annualGross = gross * 12;

    // Step 2 — 30% ruling
    let taxableIncome;
    let taxFreeRuling = 0;
    if (ruling30) {
      const cappedSalary = Math.min(annualGross, RULING_SALARY_CAP);
      taxFreeRuling = cappedSalary * RULING_TAXFREE_PCT;
      taxableIncome = annualGross - taxFreeRuling;
    } else {
      taxableIncome = annualGross;
    }

    // Step 3 — Loonheffing on taxable income (bracket rates)
    const b1Rate = aowAge ? BRACKET_1_RATE_AOW : BRACKET_1_RATE;
    const b1Inc  = Math.min(taxableIncome, BRACKET_1_CEILING);
    const b2Inc  = Math.max(0, Math.min(taxableIncome, BRACKET_2_CEILING) - BRACKET_1_CEILING);
    const b3Inc  = Math.max(0, taxableIncome - BRACKET_2_CEILING);
    const lhBefore = b1Inc * b1Rate + b2Inc * BRACKET_2_RATE + b3Inc * BRACKET_3_RATE;

    // Step 4 — Social premiums component (for display)
    const premRate = aowAge ? PREMIUMS_AOW_AGE : PREMIUMS_COMBINED;
    const premBase = Math.min(taxableIncome, PREMIUMS_CEILING);
    const premiums = premBase * premRate;
    const incomeTaxBefore = lhBefore - premiums;

    // Step 5 — Heffingskortingen
    const ahk = calcAHK(taxableIncome, aowAge);
    const ak  = calcAK(taxableIncome, aowAge);
    const totalCredits = ahk + ak;

    // Step 6 — Net loonheffing
    const netLH = Math.max(0, lhBefore - totalCredits);

    // Step 7 — Display split into tax and premiums
    const netIncomeTax = Math.max(0, incomeTaxBefore - totalCredits);
    const netPremiums  = netLH - netIncomeTax;

    // Step 8 — Net
    const netAnnual  = annualGross - netLH;
    const netSalary  = netAnnual / 12;

    // Step 9 — Kinderbijslag
    const kbMonthly = children05 * KB_0_5 + children611 * KB_6_11 + children1217 * KB_12_17;

    // Step 10 — Vakantiegeld display (informational)
    const monthlyVakantiegeld = vakantiegeldIncluded ? 0 : gross * VAKANTIEGELD_RATE;

    // Employer costs
    const erBase = Math.min(annualGross, ER_CEILING);
    const erZvw  = erBase * ZVW_EMPLOYER_RATE / 12;
    const erWW   = erBase * WW_LOW_RATE       / 12;
    const erAof  = erBase * AOF_RATE          / 12;
    const erUfo  = erBase * UFO_RATE          / 12;
    const totalErSS = erZvw + erWW + erAof + erUfo;
    const totalEmployerCost = gross + totalErSS;

    const totalDeductions = netLH / 12;

    return {
      gross,
      annualGross,
      taxableIncome,
      taxFreeRuling: taxFreeRuling / 12,
      hasRuling: ruling30,
      monthlyTax: netIncomeTax / 12,
      monthlyPremiums: netPremiums / 12,
      totalMonthlyTax: netLH / 12,
      monthlyAHK: ahk / 12,
      monthlyAK: ak / 12,
      lhBeforeMonthly: lhBefore / 12,
      incomeTaxBeforeMonthly: incomeTaxBefore / 12,
      premiumsMonthly: premiums / 12,
      totalEmpSS: netPremiums / 12,
      erZvw, erWW, erAof, erUfo,
      totalErSS,
      totalDeductions,
      netSalary,
      netAnnual,
      totalEmployerCost,
      kbMonthly,
      monthlyVakantiegeld,
      annualTax: netIncomeTax,
      annualPremiums: netPremiums,
      // Generic summary fields for ResultPanel
      totalTaxes: netIncomeTax / 12,
      totalSocialSecurity: netPremiums / 12,
      stateBenefit: kbMonthly,
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
      { label: 'Net Salary',      value: Math.max(0, breakdown.netSalary),      color: '#059669' },
      { label: 'Income Tax',      value: Math.max(0, breakdown.monthlyTax),     color: '#AE1C28' },
      { label: 'Social Premiums', value: Math.max(0, breakdown.monthlyPremiums),color: '#003DA5' },
    ];
    if (breakdown.taxFreeRuling > 0) {
      segments.push({ label: '30% Tax-Free', value: breakdown.taxFreeRuling, color: '#10b981' });
    }
    return segments.filter(s => s.value > 0);
  },

  getBreakdownRows(breakdown) {
    const r = breakdown;
    const rows = [];

    rows.push({ label: 'Gross Monthly Salary', amount: r.gross, type: 'subtotal', icon: '💰' });

    if (r.hasRuling && r.taxFreeRuling > 0) {
      rows.push({ type: 'section', label: '30% Ruling' });
      rows.push({ label: '30% Tax-Free Allowance', amount: r.taxFreeRuling, type: 'benefit', icon: '🌍' });
      rows.push({ label: 'Taxable Portion (70%)', amount: r.taxableIncome / 12, type: 'subtotal' });
    }

    rows.push({ type: 'section', label: 'Loonheffing (before credits)' });
    rows.push({ label: 'Income Tax', amount: r.incomeTaxBeforeMonthly, type: 'deduction' });
    rows.push({ label: 'Social Premiums (AOW/ANW/WLZ)', amount: r.premiumsMonthly, type: 'deduction' });

    rows.push({ type: 'section', label: 'Tax Credits (Heffingskortingen)' });
    rows.push({ label: 'General Tax Credit (AHK)', amount: r.monthlyAHK, type: 'benefit', icon: '🎯' });
    rows.push({ label: 'Employment Tax Credit (AK)', amount: r.monthlyAK, type: 'benefit', icon: '💼' });

    rows.push({ label: 'Net Loonheffing', amount: r.totalMonthlyTax, type: 'subtotal deduction', icon: '📌' });
    rows.push({ label: 'Net Monthly Salary', amount: r.netSalary, type: 'subtotal net', icon: '✅' });

    if (r.monthlyVakantiegeld > 0) {
      rows.push({ type: 'section', label: 'Holiday Allowance' });
      rows.push({ label: 'Vakantiegeld (8%, paid separately)', amount: r.monthlyVakantiegeld, type: 'detail', icon: '🏖️' });
    }

    if (r.kbMonthly > 0) {
      rows.push({ type: 'section', label: 'State Benefits' });
      rows.push({ label: 'Kinderbijslag (Child Benefit)', amount: r.kbMonthly, type: 'benefit', icon: '👶' });
      rows.push({ label: 'Net + Kinderbijslag', amount: r.netSalary + r.kbMonthly, type: 'subtotal net', icon: '💚' });
    }

    return rows;
  },

  getEmployerBars(breakdown) {
    return [
      { label: 'Gross Salary', value: breakdown.gross, color: '#003DA5' },
      { label: 'Zvw (Healthcare) 6.10%', value: breakdown.erZvw, color: '#AE1C28' },
      { label: 'WW (Unemployment) 2.74%', value: breakdown.erWW, color: '#8b5cf6' },
      { label: 'Aof (Disability) 7.63%', value: breakdown.erAof, color: '#6366f1' },
      { label: 'Ufo 0.68%', value: breakdown.erUfo, color: '#a78bfa' },
    ];
  },

  getAnnualSegments(breakdown) {
    return [
      { label: 'Net',          value: breakdown.netAnnual,            color: '#059669' },
      { label: 'Income Tax',   value: breakdown.annualTax,            color: '#AE1C28' },
      { label: 'Premiums',     value: breakdown.annualPremiums,       color: '#003DA5' },
      { label: 'Employer SS',  value: breakdown.totalErSS * 12,      color: '#8b5cf6' },
    ];
  },
};

export default netherlands;
