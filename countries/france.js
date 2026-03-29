/* ══════════════════════════════════════════════════════════
   ExpatCalc — France Configuration & Tax Computation
   Tax Year: 2026 (Revenus 2025 / Imposition 2026)

   French net salary calculation components:
     1. Social Security Contributions (cotisations sociales salariales)
        - URSSAF: vieillesse plafonnée/déplafonnée, CSG, CRDS
        - AGIRC-ARRCO: T1/T2 supplementary pension, CEG, CET
        - APEC (cadres only)
     2. Net Before Tax (salaire net avant impôt)
     3. Net Imposable (salaire net imposable)
     4. Withholding Tax — PAS (prélèvement à la source) via neutral grid
     5. Annual Income Tax — barème progressif with quotient familial,
        plafonnement, and décote

   Sources:
   - Sarah's spec: documentation/France/SPEC-FRANCE-NET-SALARY-2026.md
   - URSSAF taux cotisations: https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html
   - Service-public.fr barème IR: https://www.service-public.gouv.fr/particuliers/actualites/A18045
   - BOFiP PAS grids: https://bofip.impots.gouv.fr/bofip/11255-PGP.html/identifiant=BOI-BAREME-000037-20250410
   ══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — PLAFONDS (CEILINGS)
// The Social Security ceiling (PASS/PMSS) is the cornerstone of French payroll.
// Many contributions are capped at 1x, 4x, or 8x PMSS.
// Ref: Arrêté du 22 décembre 2025 — PASS 2026 = 48,060 EUR/year
// ─────────────────────────────────────────────────────────────────────────────

const PASS  = 48060;              // Plafond Annuel Sécurité Sociale — annual ceiling
const PMSS  = 4005;               // Plafond Mensuel = PASS / 12
const PMSS_4X = 16020;            // 4x PMSS — CSG/CRDS abatement ceiling (monthly)
const PMSS_8X = 32040;            // 8x PMSS — AGIRC-ARRCO Tranche 2 ceiling (monthly)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — EMPLOYEE SOCIAL CONTRIBUTION RATES
// French employee contributions deducted from gross salary by the employer.
// Ref: SPEC §2.2, CLEISS taux de cotisations, LégiSocial 2026
// ─────────────────────────────────────────────────────────────────────────────

// -- URSSAF contributions --

// Assurance vieillesse plafonnée (capped old-age pension)
// Applies to gross up to 1x PMSS (4,005 EUR/month)
const VIEILLESSE_PLAFONNEE_RATE = 0.069;    // 6.90%

// Assurance vieillesse déplafonnée (uncapped old-age pension)
// Applies to total gross (no ceiling)
const VIEILLESSE_DEPLAFONNEE_RATE = 0.004;  // 0.40%

// CSG déductible — deductible from taxable income
// Applied on 98.25% of gross (the "assiette CSG") up to 4x PASS annually
const CSG_DEDUCTIBLE_RATE = 0.068;          // 6.80%

// CSG non-déductible — NOT deductible from taxable income
// Same base as CSG déductible (98.25% of gross)
const CSG_NON_DEDUCTIBLE_RATE = 0.024;      // 2.40%

// CRDS — NOT deductible from taxable income
// Same base as CSG (98.25% of gross)
const CRDS_RATE = 0.005;                    // 0.50%

// CSG/CRDS base: 98.25% abatement (1.75% for frais professionnels)
// This abatement only applies up to 4x PASS annually (192,240 EUR)
// Above 4x PASS, CSG/CRDS applies at 100% of gross
const CSG_CRDS_ABATEMENT = 0.9825;          // 98.25%

// Alsace-Moselle supplementary health contribution
// ONLY for departments 57 (Moselle), 67 (Bas-Rhin), 68 (Haut-Rhin)
// Ref: SPEC §10.7
const ALSACE_MOSELLE_RATE = 0.013;           // 1.30% on total gross

// -- AGIRC-ARRCO supplementary pension --

// Tranche 1: up to 1x PMSS (first 4,005 EUR/month)
const AGIRC_ARRCO_T1_RATE = 0.0315;         // 3.15% (40% of 7.87% total)
const CEG_T1_RATE = 0.0086;                 // 0.86% (part of 2.15% total)

// Tranche 2: from 1x to 8x PMSS (4,005 to 32,040 EUR/month)
const AGIRC_ARRCO_T2_RATE = 0.0864;         // 8.64% (40% of 21.59% total)
const CEG_T2_RATE = 0.0108;                 // 1.08% (part of 2.70% total)

// CET (Contribution d'Équilibre Technique)
// Only applies when salary exceeds 1x PMSS (strictly greater)
// Applied to T1+T2 base, effectively capped at 8x PMSS (no T3 in AGIRC-ARRCO)
const CET_RATE = 0.0014;                    // 0.14% (part of 0.35% total)

// APEC — cadres only, on up to 4x PMSS
// 0.06% total split: 0.024% employee / 0.036% employer
const APEC_RATE = 0.00024;                  // 0.024%

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — EMPLOYER CONTRIBUTION RATES
// These are NOT deducted from the employee's pay; shown for total cost display.
// Ref: SPEC §2.5
// ─────────────────────────────────────────────────────────────────────────────

const EMPLOYER_MALADIE_RATE_REDUCED = 0.07;  // 7.00% reduced rate (up to 2.5x SMIC)
const EMPLOYER_MALADIE_RATE_FULL = 0.13;     // 13.00% full rate (above 2.5x SMIC)
const EMPLOYER_SMIC_MONTHLY = 1823.03;       // 2026 SMIC mensuel brut (for threshold calc)
const EMPLOYER_CSA_RATE = 0.003;             // 0.30% Solidarité autonomie
const EMPLOYER_VIEILLESSE_PLAFONNEE = 0.0855; // 8.55% on gross up to PMSS
const EMPLOYER_VIEILLESSE_DEPLAFONNEE = 0.0211; // 2.11% on total gross
const EMPLOYER_ALLOC_FAM_RATE_REDUCED = 0.0345; // 3.45% reduced rate (up to 3.5x SMIC)
const EMPLOYER_ALLOC_FAM_RATE_FULL = 0.0525;   // 5.25% full rate (above 3.5x SMIC)
const EMPLOYER_CHOMAGE_RATE = 0.04;          // 4.00% on up to 4x PMSS
const EMPLOYER_AGS_RATE = 0.0025;            // 0.25% on up to 4x PMSS
const EMPLOYER_FNAL_RATE = 0.001;            // 0.10% on up to PMSS (< 50 employees default)
const EMPLOYER_DIALOGUE_SOCIAL = 0.00016;    // 0.016% on total gross
const EMPLOYER_AGIRC_T1_RATE = 0.0472;       // 4.72% up to PMSS
const EMPLOYER_AGIRC_T2_RATE = 0.1295;       // 12.95% PMSS to 8x PMSS
const EMPLOYER_CEG_T1_RATE = 0.0129;         // 1.29% up to PMSS
const EMPLOYER_CEG_T2_RATE = 0.0162;         // 1.62% PMSS to 8x PMSS
const EMPLOYER_CET_RATE = 0.0021;            // 0.21% (if salary > PMSS)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — INCOME TAX BARÈME PROGRESSIF (2026, revenus 2025)
// Revalued by +0.9% per Loi de finances 2026
// These brackets apply per "part" of quotient familial
// Ref: SPEC §4.1, Service-public.fr barème IR 2026
// ─────────────────────────────────────────────────────────────────────────────

const TAX_BRACKETS = [
  { limit: 11600,   rate: 0.00 },  // 0% on first 11,600 EUR per part
  { limit: 29579,   rate: 0.11 },  // 11% on 11,601 – 29,579 EUR per part
  { limit: 84577,   rate: 0.30 },  // 30% on 29,580 – 84,577 EUR per part
  { limit: 181917,  rate: 0.41 },  // 41% on 84,578 – 181,917 EUR per part
  { limit: Infinity, rate: 0.45 }, // 45% above 181,917 EUR per part
];

// Quick-calculation constants (verified set from SPEC §4.2)
// tax_per_part = Q * rate - constant
// These allow computing tax per part without iterating brackets.
const QUICK_CALC_CONSTANTS = [
  { maxQ: 11600,    rate: 0.00, constant: 0 },
  { maxQ: 29579,    rate: 0.11, constant: 1276.00 },
  { maxQ: 84577,    rate: 0.30, constant: 6896.01 },
  { maxQ: 181917,   rate: 0.41, constant: 16199.48 },
  { maxQ: Infinity, rate: 0.45, constant: 23476.16 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — 10% STANDARD DEDUCTION (Déduction forfaitaire)
// Applied to annual net imposable before income tax barème
// Ref: SPEC §7, Service-public.fr frais professionnels
// ─────────────────────────────────────────────────────────────────────────────

const DEDUCTION_10PCT_RATE = 0.10;        // 10% of net imposable
const DEDUCTION_10PCT_MIN = 509;          // Minimum deduction per earner
const DEDUCTION_10PCT_MAX = 14555;        // Maximum deduction per earner

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — DÉCOTE (Low-Income Tax Reduction)
// Automatically reduces tax for taxpayers whose impôt brut is below a threshold
// Ref: SPEC §8, corrigetonimpot.fr
// ─────────────────────────────────────────────────────────────────────────────

const DECOTE_SINGLE_THRESHOLD = 1982;     // impôt brut must be below this for single
const DECOTE_SINGLE_CONSTANT = 897;       // décote = 897 - (impôt brut × 45.25%)
const DECOTE_COUPLE_THRESHOLD = 3277;     // impôt brut must be below this for couple
const DECOTE_COUPLE_CONSTANT = 1483;      // décote = 1,483 - (impôt brut × 45.25%)
const DECOTE_RATE = 0.4525;              // 45.25% multiplier

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — PLAFONNEMENT DU QUOTIENT FAMILIAL
// Caps the tax benefit from additional family parts
// Ref: SPEC §6, Service-public.fr
// ─────────────────────────────────────────────────────────────────────────────

// Maximum tax reduction per half-part beyond base parts
const QF_CAP_STANDARD_HALF_PART = 1807;       // Standard child (full custody)
const QF_CAP_PARENT_ISOLE_FIRST = 4262;       // Parent isolé — first child's entire full part (combined cap)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — PAS NEUTRAL RATE GRID (Prélèvement à la Source)
// Grid applicable from 1 May 2026 (revalued +0.9%)
// Used because the calculator cannot know the employee's personalised rate.
// The grid maps monthly net imposable ranges to withholding rates.
// Ref: SPEC §9.2, BOFiP BOI-BAREME-000037, Loi de finances 2026
// ─────────────────────────────────────────────────────────────────────────────

const PAS_NEUTRAL_GRID = [
  { upperLimit: 1634,    rate: 0.00 },    // Below 1,635: 0%
  { upperLimit: 1697,    rate: 0.005 },   // 1,635 – 1,697: 0.5%
  { upperLimit: 1806,    rate: 0.013 },   // 1,698 – 1,806: 1.3%
  { upperLimit: 1927,    rate: 0.021 },   // 1,807 – 1,927: 2.1%
  { upperLimit: 2059,    rate: 0.029 },   // 1,928 – 2,059: 2.9%
  { upperLimit: 2169,    rate: 0.035 },   // 2,060 – 2,169: 3.5%
  { upperLimit: 2314,    rate: 0.041 },   // 2,170 – 2,314: 4.1%
  { upperLimit: 2737,    rate: 0.053 },   // 2,315 – 2,737: 5.3%
  { upperLimit: 3134,    rate: 0.075 },   // 2,738 – 3,134: 7.5%
  { upperLimit: 3570,    rate: 0.099 },   // 3,135 – 3,570: 9.9%
  { upperLimit: 4018,    rate: 0.119 },   // 3,571 – 4,018: 11.9%
  { upperLimit: 4689,    rate: 0.138 },   // 4,019 – 4,689: 13.8%
  { upperLimit: 5623,    rate: 0.158 },   // 4,690 – 5,623: 15.8%
  { upperLimit: 7036,    rate: 0.179 },   // 5,624 – 7,036: 17.9%
  { upperLimit: 8788,    rate: 0.20 },    // 7,037 – 8,788: 20%
  { upperLimit: 12199,   rate: 0.24 },    // 8,789 – 12,199: 24%
  { upperLimit: 16522,   rate: 0.28 },    // 12,200 – 16,522: 28%
  { upperLimit: 25936,   rate: 0.33 },    // 16,523 – 25,936: 33%
  { upperLimit: 55557,   rate: 0.38 },    // 25,937 – 55,557: 38%
  { upperLimit: Infinity, rate: 0.43 },   // 55,558 and above: 43%
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — FAMILY QUOTIENT (Quotient Familial) — Parts Calculation
// The number of "parts" determines how taxable income is divided for
// progressive bracket application. More parts = lower effective rate.
// Ref: SPEC §5, Service-public.fr quotient familial
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the number of fiscal parts (quotient familial) based on
 * family situation and number of children.
 *
 * @param {string} filingStatus - 'single' | 'married' | 'parentIsole'
 * @param {number} children - number of dependent children (0–10)
 * @returns {number} Number of fiscal parts
 */
function computeParts(filingStatus, children) {
  const n = Math.max(0, Math.min(children, 10)); // clamp 0-10

  if (filingStatus === 'married') {
    // Married/PACS: base 2 parts
    // First 2 children: +0.5 each, 3rd+: +1.0 each
    // Ref: SPEC §5.1 — Married or PACS Couples
    if (n === 0) return 2.0;
    if (n === 1) return 2.5;
    if (n === 2) return 3.0;
    // 3+ children: 2 + 0.5 + 0.5 + (n-2) * 1.0
    return 2 + 0.5 + 0.5 + (n - 2) * 1.0;
  }

  if (filingStatus === 'parentIsole') {
    // Single parent living alone with dependent children
    // First child gives a FULL part (not 0.5) due to parent isolé bonus
    // Ref: SPEC §5.1 — Parent Isolé
    if (n === 0) return 1.0; // Not actually a parent isolé if no children
    if (n === 1) return 2.0;
    if (n === 2) return 2.5;
    // 3+ children: 1 + 1.0 + 0.5 + (n-2) * 1.0
    return 1 + 1.0 + 0.5 + (n - 2) * 1.0;
  }

  // Single / divorced / separated (not parent isolé)
  // Base: 1 part. Children: first 2 = +0.5 each, 3rd+ = +1.0 each
  // Ref: SPEC §5.1 — Single (NOT Living Alone / Cohabiting with Dependents)
  if (n === 0) return 1.0;
  if (n === 1) return 1.5;
  if (n === 2) return 2.0;
  // 3+ children: 1 + 0.5 + 0.5 + (n-2) * 1.0
  return 1 + 0.5 + 0.5 + (n - 2) * 1.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — CSG/CRDS BASE CALCULATION
// CSG and CRDS are computed on a special base:
//   - 98.25% of gross for the portion up to 4x PASS annually (192,240 EUR)
//   - 100% of gross for the portion exceeding 4x PASS
// Ref: SPEC §2.3, Service-public.fr CSG/CRDS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the CSG/CRDS base for a given monthly gross salary.
 * The 1.75% abatement (frais professionnels) applies only up to 4x PMSS monthly.
 *
 * @param {number} monthlyGross - monthly gross salary in EUR
 * @returns {number} The CSG/CRDS assessment base for the month
 */
function computeCsgCrdsBase(monthlyGross) {
  if (monthlyGross <= PMSS_4X) {
    // Entire salary qualifies for the 1.75% abatement
    return monthlyGross * CSG_CRDS_ABATEMENT;
  }

  // Portion up to 4x PMSS gets the abatement; excess portion at 100%
  const portionUnder4x = PMSS_4X * CSG_CRDS_ABATEMENT;
  const portionOver4x = monthlyGross - PMSS_4X;
  return portionUnder4x + portionOver4x;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — SOCIAL CONTRIBUTIONS COMPUTATION
// Calculates all employee social security contributions from monthly gross.
//
// @param {number} monthlyGross - monthly gross salary in EUR
// @param {object} opts - { isCadre: boolean, isAlsaceMoselle: boolean }
// @returns {object} Detailed breakdown of each contribution
// ─────────────────────────────────────────────────────────────────────────────

function computeSocialContributions(monthlyGross, opts) {
  const { isCadre = false, isAlsaceMoselle = false } = opts;

  // -- CSG/CRDS base (98.25% of gross, subject to 4x PMSS rule) --
  const csgCrdsBase = computeCsgCrdsBase(monthlyGross);

  // -- URSSAF contributions --

  // Vieillesse plafonnée: 6.90% on gross capped at 1x PMSS
  const vieillessePlafonnee = Math.min(monthlyGross, PMSS) * VIEILLESSE_PLAFONNEE_RATE;

  // Vieillesse déplafonnée: 0.40% on total gross (no ceiling)
  const vieillesseDeplafonnee = monthlyGross * VIEILLESSE_DEPLAFONNEE_RATE;

  // CSG déductible: 6.80% on CSG/CRDS base
  const csgDeductible = csgCrdsBase * CSG_DEDUCTIBLE_RATE;

  // CSG non-déductible: 2.40% on CSG/CRDS base
  // This portion is NOT deductible from taxable income
  const csgNonDeductible = csgCrdsBase * CSG_NON_DEDUCTIBLE_RATE;

  // CRDS: 0.50% on CSG/CRDS base
  // This is NOT deductible from taxable income
  const crds = csgCrdsBase * CRDS_RATE;

  // Alsace-Moselle supplementary health: 1.30% on total gross
  // Only applies to employees in departments 57, 67, 68
  const alsaceMoselle = isAlsaceMoselle ? (monthlyGross * ALSACE_MOSELLE_RATE) : 0;

  // -- AGIRC-ARRCO supplementary pension --

  // Tranche 1: applies to gross up to 1x PMSS
  const t1Base = Math.min(monthlyGross, PMSS);
  const agircArrcoT1 = t1Base * AGIRC_ARRCO_T1_RATE;
  const cegT1 = t1Base * CEG_T1_RATE;

  // Tranche 2: applies to gross between 1x PMSS and 8x PMSS
  // Only if salary exceeds 1x PMSS
  let agircArrcoT2 = 0;
  let cegT2 = 0;
  let cet = 0;
  let apec = 0;

  if (monthlyGross > PMSS) {
    // T2 base: the portion from 1x PMSS up to 8x PMSS
    const t2Base = Math.min(monthlyGross, PMSS_8X) - PMSS;
    agircArrcoT2 = t2Base * AGIRC_ARRCO_T2_RATE;
    cegT2 = t2Base * CEG_T2_RATE;

    // CET: 0.14% on gross capped at 8x PMSS
    // Only applies when salary strictly exceeds 1x PMSS
    // Ref: SPEC §2.2 — CET applies to "Total gross (T1 + T2)"
    // Using MIN(gross, 8x PMSS) per SPEC §3.2 recommendation
    const cetBase = Math.min(monthlyGross, PMSS_8X);
    cet = cetBase * CET_RATE;
  }

  // APEC: 0.024% on gross up to 4x PMSS — cadres only
  if (isCadre) {
    apec = Math.min(monthlyGross, PMSS_4X) * APEC_RATE;
  }

  // -- Total employee contributions --
  const totalContributions = round2(
    vieillessePlafonnee + vieillesseDeplafonnee +
    csgDeductible + csgNonDeductible + crds +
    alsaceMoselle +
    agircArrcoT1 + agircArrcoT2 +
    cegT1 + cegT2 +
    cet + apec
  );

  // -- Non-deductible contributions (needed for net imposable calculation) --
  // CSG non-déductible + CRDS are NOT deductible from taxable income
  const nonDeductibleContributions = round2(csgNonDeductible + crds);

  // -- Deductible contributions (for net imposable) --
  const deductibleContributions = round2(totalContributions - nonDeductibleContributions);

  return {
    // Individual contribution amounts (all rounded to 2dp)
    vieillessePlafonnee: round2(vieillessePlafonnee),
    vieillesseDeplafonnee: round2(vieillesseDeplafonnee),
    csgDeductible: round2(csgDeductible),
    csgNonDeductible: round2(csgNonDeductible),
    crds: round2(crds),
    alsaceMoselle: round2(alsaceMoselle),
    agircArrcoT1: round2(agircArrcoT1),
    agircArrcoT2: round2(agircArrcoT2),
    cegT1: round2(cegT1),
    cegT2: round2(cegT2),
    cet: round2(cet),
    apec: round2(apec),
    csgCrdsBase: round2(csgCrdsBase),

    // Totals
    totalContributions,
    nonDeductibleContributions,
    deductibleContributions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — EMPLOYER CONTRIBUTIONS COMPUTATION
// Calculates total employer social security cost (not deducted from employee).
// Used to display the total employer cost.
// Note: Accident du travail rate varies by industry and is excluded.
// Ref: SPEC §2.5
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate total monthly employer social contributions.
 *
 * @param {number} monthlyGross - monthly gross salary in EUR
 * @param {boolean} isCadre - whether the employee is a cadre
 * @returns {number} Total monthly employer contributions
 */
function computeEmployerContributions(monthlyGross, isCadre) {
  // Assurance maladie: 7% reduced (up to 2.5x SMIC) or 13% full (above)
  const smicThreshold25 = EMPLOYER_SMIC_MONTHLY * 2.5;
  const maladieRate = monthlyGross <= smicThreshold25
    ? EMPLOYER_MALADIE_RATE_REDUCED : EMPLOYER_MALADIE_RATE_FULL;
  const maladie = monthlyGross * maladieRate;

  // CSA (solidarité autonomie): 0.30% on total gross
  const csa = monthlyGross * EMPLOYER_CSA_RATE;

  // Vieillesse plafonnée: 8.55% on gross up to PMSS
  const vieillessePlaf = Math.min(monthlyGross, PMSS) * EMPLOYER_VIEILLESSE_PLAFONNEE;

  // Vieillesse déplafonnée: 2.11% on total gross
  const vieillesseDepl = monthlyGross * EMPLOYER_VIEILLESSE_DEPLAFONNEE;

  // Allocations familiales: 3.45% reduced (up to 3.5x SMIC) or 5.25% full (above)
  const smicThreshold35 = EMPLOYER_SMIC_MONTHLY * 3.5;
  const allocFamRate = monthlyGross <= smicThreshold35
    ? EMPLOYER_ALLOC_FAM_RATE_REDUCED : EMPLOYER_ALLOC_FAM_RATE_FULL;
  const allocFam = monthlyGross * allocFamRate;

  // Assurance chômage: 4.00% on gross up to 4x PMSS
  const chomage = Math.min(monthlyGross, PMSS_4X) * EMPLOYER_CHOMAGE_RATE;

  // AGS: 0.25% on gross up to 4x PMSS
  const ags = Math.min(monthlyGross, PMSS_4X) * EMPLOYER_AGS_RATE;

  // FNAL: 0.10% on gross up to PMSS (< 50 employees default)
  const fnal = Math.min(monthlyGross, PMSS) * EMPLOYER_FNAL_RATE;

  // Dialogue social: 0.016% on total gross
  const dialogueSocial = monthlyGross * EMPLOYER_DIALOGUE_SOCIAL;

  // AGIRC-ARRCO employer T1: 4.72% on gross up to PMSS
  const agircT1 = Math.min(monthlyGross, PMSS) * EMPLOYER_AGIRC_T1_RATE;

  // AGIRC-ARRCO employer T2: 12.95% on PMSS to 8x PMSS
  let agircT2 = 0;
  let cegT2 = 0;
  let cetEmp = 0;
  if (monthlyGross > PMSS) {
    const t2Base = Math.min(monthlyGross, PMSS_8X) - PMSS;
    agircT2 = t2Base * EMPLOYER_AGIRC_T2_RATE;
    cegT2 = t2Base * EMPLOYER_CEG_T2_RATE;
    cetEmp = Math.min(monthlyGross, PMSS_8X) * EMPLOYER_CET_RATE;
  }

  // CEG employer T1: 1.29% on gross up to PMSS
  const cegT1 = Math.min(monthlyGross, PMSS) * EMPLOYER_CEG_T1_RATE;

  // APEC employer: 0.036% on up to 4x PMSS — cadres only
  const apecEmp = isCadre ? Math.min(monthlyGross, PMSS_4X) * 0.00036 : 0;

  const total = maladie + csa + vieillessePlaf + vieillesseDepl +
    allocFam + chomage + ags + fnal + dialogueSocial +
    agircT1 + agircT2 + cegT1 + cegT2 + cetEmp + apecEmp;

  return round2(total);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13 — PAS (PRÉLÈVEMENT À LA SOURCE) LOOKUP
// Determines the neutral withholding rate based on monthly net imposable.
// Ref: SPEC §9.2 — May 2026 grid (revalued +0.9%)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up the PAS neutral withholding rate for a given monthly net imposable.
 * Uses the May 2026 grid (the revalued version in effect for most of the year).
 *
 * @param {number} monthlyNetImposable - monthly net imposable salary in EUR
 * @returns {number} The withholding rate as a decimal (e.g. 0.029 for 2.9%)
 */
function lookupPASRate(monthlyNetImposable) {
  // Edge case: no salary, no tax
  if (monthlyNetImposable <= 0) return 0;

  // Walk through the grid brackets — return the rate for the first bracket
  // whose upper limit is >= the net imposable
  // Ref: SPEC §12.5 — "Use the lower bracket rate" at boundaries
  for (const bracket of PAS_NEUTRAL_GRID) {
    if (monthlyNetImposable <= bracket.upperLimit) {
      return bracket.rate;
    }
  }

  // Should not reach here (last bracket is Infinity), but safety fallback
  return PAS_NEUTRAL_GRID[PAS_NEUTRAL_GRID.length - 1].rate;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 14 — ANNUAL INCOME TAX COMPUTATION (Barème Progressif)
// Full annual tax computation including:
//   - 10% standard deduction
//   - Quotient familial (dividing by parts)
//   - Barème progressif application
//   - Plafonnement du quotient familial
//   - Décote for low-income taxpayers
// Ref: SPEC §4, §6, §7, §8, Appendix B
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply the barème progressif to a given quotient (income per part).
 * Uses the verified quick-calculation constants.
 *
 * @param {number} quotient - taxable income per part (Q)
 * @returns {number} Tax per part
 */
function applyBareme(quotient) {
  if (quotient <= 0) return 0;

  for (const bracket of QUICK_CALC_CONSTANTS) {
    if (quotient <= bracket.maxQ) {
      return Math.max(0, quotient * bracket.rate - bracket.constant);
    }
  }

  // Fallback for extremely high incomes (should be caught by Infinity bracket)
  const last = QUICK_CALC_CONSTANTS[QUICK_CALC_CONSTANTS.length - 1];
  return quotient * last.rate - last.constant;
}

/**
 * Calculate the full annual income tax liability.
 *
 * @param {number} annualNetImposable - annual net imposable salary
 * @param {number} parts - quotient familial parts
 * @param {string} filingStatus - 'single' | 'married' | 'parentIsole'
 * @param {number} children - number of children (for plafonnement)
 * @returns {object} Detailed annual tax breakdown
 */
function computeAnnualIncomeTax(annualNetImposable, parts, filingStatus, children) {
  // Step 1: Apply 10% standard deduction (déduction forfaitaire)
  // Clamped between minimum (509 EUR) and maximum (14,555 EUR)
  // Ref: SPEC §7
  let deduction10pct = annualNetImposable * DEDUCTION_10PCT_RATE;
  deduction10pct = Math.max(deduction10pct, DEDUCTION_10PCT_MIN);
  deduction10pct = Math.min(deduction10pct, DEDUCTION_10PCT_MAX);
  const revenuImposable = Math.max(0, annualNetImposable - deduction10pct);

  // Step 2: Calculate tax WITH full quotient familial
  const quotientFull = revenuImposable / parts;
  const taxPerPartFull = applyBareme(quotientFull);
  const taxWithQF = taxPerPartFull * parts;

  // Step 3: Calculate tax WITHOUT QF benefit (base parts only)
  // Base parts: 1 for single, 2 for married
  const baseParts = (filingStatus === 'married') ? 2 : 1;
  const quotientBase = revenuImposable / baseParts;
  const taxPerPartBase = applyBareme(quotientBase);
  const taxWithoutQF = taxPerPartBase * baseParts;

  // Step 4: Plafonnement — cap the QF benefit
  // Ref: SPEC §6
  const qfBenefit = taxWithoutQF - taxWithQF;

  // Calculate the maximum allowed benefit based on additional half-parts
  const additionalHalfParts = (parts - baseParts) * 2; // count in half-parts
  let maxBenefit = 0;

  if (filingStatus === 'parentIsole' && children >= 1) {
    // Parent isolé: first child's entire full part (standard half + bonus half)
    // is capped at 4,262 EUR combined — NOT 4,262 + 1,807 separately.
    // Ref: service-public.gouv.fr F35120: "L'avantage fiscal est limité à
    // 4 262 EUR pour la part entière accordée pour votre 1er enfant à charge."
    maxBenefit = QF_CAP_PARENT_ISOLE_FIRST; // first child: 4,262 EUR total
    if (children >= 2) {
      // Second child = +0.5 part = 1 half-part at standard cap
      maxBenefit += QF_CAP_STANDARD_HALF_PART;
    }
    if (children >= 3) {
      // 3rd+ children = +1.0 part each = 2 half-parts each at standard cap
      maxBenefit += (children - 2) * 2 * QF_CAP_STANDARD_HALF_PART;
    }
  } else {
    // Standard case: all additional half-parts capped at 1,807 EUR each
    maxBenefit = additionalHalfParts * QF_CAP_STANDARD_HALF_PART;
  }

  // Apply the cap: if benefit exceeds max, use capped amount
  let impotBrut;
  let isPlafonne = false;
  if (qfBenefit > maxBenefit && maxBenefit > 0) {
    impotBrut = taxWithoutQF - maxBenefit;
    isPlafonne = true;
  } else {
    impotBrut = taxWithQF;
  }
  impotBrut = Math.max(0, impotBrut);

  // Step 5: Décote — automatic reduction for low tax amounts
  // Ref: SPEC §8
  let decoteAmount = 0;
  const isCouple = (filingStatus === 'married');
  const decoteThreshold = isCouple ? DECOTE_COUPLE_THRESHOLD : DECOTE_SINGLE_THRESHOLD;
  const decoteConstant = isCouple ? DECOTE_COUPLE_CONSTANT : DECOTE_SINGLE_CONSTANT;

  if (impotBrut > 0 && impotBrut < decoteThreshold) {
    decoteAmount = decoteConstant - (impotBrut * DECOTE_RATE);
    decoteAmount = Math.max(0, decoteAmount); // cannot be negative
  }

  // Step 6: Final tax after décote (cannot be negative)
  // Ref: SPEC §12.4 — round annual tax to nearest whole euro
  // Article 1657 CGI: tax below 61 EUR is not collected
  const impotAfterDecote = Math.max(0, Math.round(impotBrut - decoteAmount));
  const impotFinal = impotAfterDecote < 61 ? 0 : impotAfterDecote;

  // Effective annual tax rate (on net imposable, not gross)
  const effectiveAnnualRate = annualNetImposable > 0
    ? (impotFinal / annualNetImposable) * 100
    : 0;

  return {
    deduction10pct: round2(deduction10pct),
    revenuImposable: round2(revenuImposable),
    parts,
    quotientFull: round2(quotientFull),
    taxWithQF: round2(taxWithQF),
    taxWithoutQF: round2(taxWithoutQF),
    qfBenefit: round2(qfBenefit),
    maxBenefit: round2(maxBenefit),
    isPlafonne,
    impotBrut: round2(impotBrut),
    decoteAmount: round2(decoteAmount),
    impotFinal,
    effectiveAnnualRate: round2(effectiveAnnualRate),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 15 — UTILITY: ROUNDING
// All monetary amounts rounded to 2 decimal places (EUR cents).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Round a number to 2 decimal places.
 * @param {number} n
 * @returns {number}
 */
function round2(n) {
  return Math.round(n * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 16 — MAIN BREAKDOWN FUNCTION
// Orchestrates all French salary computations for a given monthly gross salary.
// Called by the shared CalculatorPage component.
//
// @param {number} gross - monthly gross salary in EUR
// @param {object} opts - user-selected options from the UI
// @returns {object} Full breakdown consumed by UI rendering methods
// ─────────────────────────────────────────────────────────────────────────────

function computeBreakdown(gross, opts) {
  // Guard against invalid input
  if (!Number.isFinite(gross) || gross < 0) {
    return {
      gross: 0,
      inputGross: gross,
      monthlyContributions: 0,
      monthlyNetBeforeTax: 0,
      monthlyNetImposable: 0,
      monthlyPAS: 0,
      monthlyNetAfterTax: 0,
      annualGross: 0,
      annualContributions: 0,
      annualNetBeforeTax: 0,
      annualNetImposable: 0,
      annualPAS: 0,
      annualNetAfterTax: 0,
      annualTax: { impotFinal: 0, effectiveAnnualRate: 0 },
      totalTaxes: 0,
      totalSocialSecurity: 0,
      netSalary: 0,
      totalDeductions: 0,
      annualNetSalary: 0,
      totalEmployerCost: 0,
    };
  }

  const {
    filingStatus,       // 'single' | 'married' | 'parentIsole'
    children,           // number of dependent children (0–10)
    isCadre,            // boolean: management-level employee (APEC)
    isAlsaceMoselle,    // boolean: departments 57, 67, 68
    has13thMonth,       // boolean: 13th month salary
  } = opts;

  // ── Determine months divisor for display ──
  // If 13th month: annual = monthly input × 13, but we display monthly as annual/12
  const annualGross = has13thMonth ? gross * 13 : gross * 12;
  // The actual monthly gross for contribution calculation
  // With 13th month, each month still pays contributions on that month's gross
  // We calculate based on the standard monthly amount for consistency
  const monthlyGross = annualGross / 12;

  // ── Social contributions ──
  const contributions = computeSocialContributions(monthlyGross, {
    isCadre: !!isCadre,
    isAlsaceMoselle: !!isAlsaceMoselle,
  });

  // ── Net before tax (salaire net avant impôt) ──
  // Gross minus all employee social contributions
  const monthlyNetBeforeTax = round2(monthlyGross - contributions.totalContributions);

  // ── Net imposable (salaire net imposable) ──
  // Net before tax PLUS non-deductible CSG and CRDS
  // (because those amounts are not deductible from taxable income)
  // Equivalently: gross - deductible contributions
  // Ref: SPEC §3.1 Step 4, §3.2
  const monthlyNetImposable = round2(monthlyNetBeforeTax + contributions.nonDeductibleContributions);

  // ── PAS withholding tax (prélèvement à la source) ──
  const pasRate = lookupPASRate(monthlyNetImposable);
  const monthlyPAS = round2(monthlyNetImposable * pasRate);

  // ── Net after tax (salaire net après impôt / net à payer) ──
  const monthlyNetAfterTax = round2(monthlyNetBeforeTax - monthlyPAS);

  // ── Annual figures ──
  const annualNetImposable = round2(monthlyNetImposable * 12);
  const annualContributions = round2(contributions.totalContributions * 12);
  const annualNetBeforeTax = round2(monthlyNetBeforeTax * 12);
  const annualPAS = round2(monthlyPAS * 12);
  const annualNetAfterTax = round2(monthlyNetAfterTax * 12);

  // ── Quotient familial parts ──
  const childrenNum = Number(children) || 0;
  const parts = computeParts(filingStatus || 'single', childrenNum);

  // ── Annual income tax (full barème progressif calculation) ──
  // This gives the "true" annual tax liability, which differs from PAS
  // because the neutral grid doesn't account for family situation.
  const annualTax = computeAnnualIncomeTax(
    annualNetImposable, parts, filingStatus || 'single', childrenNum
  );

  // ── Employer contributions ──
  const monthlyEmployerContributions = computeEmployerContributions(monthlyGross, !!isCadre);
  const monthlyEmployerCost = round2(monthlyGross + monthlyEmployerContributions);
  const annualEmployerContributions = round2(monthlyEmployerContributions * 12);
  const annualEmployerCost = round2(monthlyEmployerCost * 12);

  // ── Effective rates (as % of gross) ──
  const effectiveSocialRate = monthlyGross > 0
    ? (contributions.totalContributions / monthlyGross) * 100 : 0;
  const effectivePASRate = monthlyGross > 0
    ? (monthlyPAS / monthlyGross) * 100 : 0;
  const overallEffectiveRate = monthlyGross > 0
    ? ((contributions.totalContributions + monthlyPAS) / monthlyGross) * 100 : 0;

  return {
    // ── Core monthly figures ──
    gross: monthlyGross,                          // monthly gross (possibly spread 13th month)
    inputGross: gross,                            // original user input
    monthlyContributions: contributions.totalContributions,
    monthlyNetBeforeTax,
    monthlyNetImposable,
    monthlyPAS,
    monthlyNetAfterTax,

    // ── Social contribution detail ──
    contributions,

    // ── PAS detail ──
    pasRate,
    pasRatePct: round2(pasRate * 100),

    // ── Annual figures ──
    annualGross,
    annualContributions,
    annualNetBeforeTax,
    annualNetImposable,
    annualPAS,
    annualNetAfterTax,

    // ── Annual income tax (barème progressif) ──
    annualTax,

    // ── Employer cost ──
    monthlyEmployerContributions,
    monthlyEmployerCost,
    annualEmployerContributions,
    annualEmployerCost,

    // ── Effective rates ──
    effectiveSocialRate: round2(effectiveSocialRate),
    effectivePASRate: round2(effectivePASRate),
    overallEffectiveRate: round2(overallEffectiveRate),

    // ── Quotient familial ──
    parts,

    // ── Flags ──
    filingStatus: filingStatus || 'single',
    isCadre: !!isCadre,
    isAlsaceMoselle: !!isAlsaceMoselle,
    has13thMonth: !!has13thMonth,

    // ── Generic summary fields consumed by shared components ──
    // These field names must match what CalculatorPage / DonutChart / etc. expect
    totalTaxes:          monthlyPAS,
    totalSocialSecurity: contributions.totalContributions,
    netSalary:           monthlyNetAfterTax,
    totalDeductions:     round2(contributions.totalContributions + monthlyPAS),
    annualNetSalary:     annualNetAfterTax,
    totalEmployerCost:   monthlyEmployerCost,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 17 — COUNTRY CONFIG OBJECT
// This is the shape all country modules must export — consumed by CalculatorPage
// and other shared components via the lazy loader in main.js.
// ─────────────────────────────────────────────────────────────────────────────

const france = {
  id: 'france',
  name: 'France',
  localName: 'France',
  flag: '\u{1F1EB}\u{1F1F7}',  // French flag emoji
  currency: 'EUR',
  currencySymbol: '\u20AC',     // Euro sign
  locale: 'fr-FR',
  accentColor: '#002395',       // French blue (Tricolore)
  accentSecondary: '#ED2939',   // French red (Tricolore)

  // Salary range: 1,500 EUR (near SMIC) to 25,000 EUR/month (high earners)
  salaryRange: { min: 1500, max: 25000, step: 100, default: 3000 },

  // ── Options UI schema ──
  // Defines all user-configurable inputs rendered by SalaryInput.js
  options: [
    // ── Filing Status ──
    {
      id: 'filingStatus',
      type: 'select',
      label: 'Filing Status',
      sublabel: 'Affects quotient familial (number of tax parts) and d\u00e9cote threshold',
      choices: [
        { value: 'single',       label: 'Single / Divorced / Separated' },
        { value: 'married',      label: 'Married / PACS (joint filing)' },
        { value: 'parentIsole',  label: 'Single parent (living alone with children)' },
      ],
    },

    // ── Number of Children ──
    {
      id: 'children',
      type: 'number',
      label: 'Dependent children',
      sublabel: 'Increases your quotient familial parts, reducing income tax',
      min: 0, max: 10, step: 1,
    },

    // ── Cadre (management status) ──
    {
      id: 'isCadre',
      type: 'toggle',
      label: 'Cadre (management)',
      sublabel: 'Adds APEC contribution (0.024%) on salary up to 4\u00d7 PMSS',
    },

    // ── 13th Month ──
    {
      id: 'has13thMonth',
      type: 'toggle',
      label: '13th month salary',
      sublabel: 'Annual gross = monthly \u00d7 13, spread evenly for display',
    },

    // ── Alsace-Moselle ──
    {
      id: 'isAlsaceMoselle',
      type: 'toggle',
      label: 'Alsace-Moselle (depts 57/67/68)',
      sublabel: 'Additional 1.30% employee health insurance contribution',
    },
  ],

  // ── Default option values ──
  defaultOptions() {
    return {
      filingStatus: 'single',
      children: 0,
      isCadre: false,
      has13thMonth: false,
      isAlsaceMoselle: false,
    };
  },

  // ── Main computation entry point ──
  computeBreakdown(gross, opts) {
    return computeBreakdown(gross, opts);
  },

  // ── Reverse calculation: find gross given target monthly net ──
  reverseFromNet(targetNet, opts) {
    let lo = 0, hi = targetNet * 4; // conservative upper bound
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const r = this.computeBreakdown(mid, opts);
      if (r.netSalary < targetNet) lo = mid;
      else hi = mid;
    }
    return Math.round((lo + hi) / 2);
  },

  // ── Reverse calculation: find gross given target monthly employer cost ──
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

  // ── Donut chart segments (monthly view) ──
  getDonutSegments(breakdown) {
    const segments = [
      { label: 'Net Take-home',          value: Math.max(0, breakdown.monthlyNetAfterTax), color: '#059669' },
      { label: 'Social Contributions',   value: breakdown.monthlyContributions,            color: '#3b82f6' },
      { label: 'Withholding Tax (PAS)',   value: breakdown.monthlyPAS,                     color: '#e94560' },
    ];
    return segments.filter(s => s.value > 0);
  },

  // ── Breakdown rows for the detailed deductions table ──
  getBreakdownRows(breakdown) {
    const rows = [];
    const r = breakdown;
    const c = r.contributions;

    rows.push({ label: 'Monthly Gross Salary', amount: r.gross, type: 'subtotal', icon: '\uD83D\uDCB0' });

    // Show 13th month info if active
    if (r.has13thMonth) {
      rows.push({
        label: `13th month: input \u20AC${r.inputGross.toLocaleString()}/mo \u00d7 13 = \u20AC${r.annualGross.toLocaleString()}/yr, spread over 12`,
        amount: null,
        type: 'note',
      });
    }

    // ── URSSAF section ──
    rows.push({ type: 'section', label: 'URSSAF Contributions' });

    rows.push({
      label: `Vieillesse plafonn\u00e9e (6.90%, capped at \u20AC${PMSS.toLocaleString()})`,
      amount: c.vieillessePlafonnee,
      type: 'deduction',
    });
    rows.push({
      label: 'Vieillesse d\u00e9plafonn\u00e9e (0.40%)',
      amount: c.vieillesseDeplafonnee,
      type: 'deduction',
    });
    rows.push({
      label: 'CSG d\u00e9ductible (6.80%)',
      amount: c.csgDeductible,
      type: 'deduction',
    });
    rows.push({
      label: 'CSG non-d\u00e9ductible (2.40%)',
      amount: c.csgNonDeductible,
      type: 'deduction',
    });
    rows.push({
      label: 'CRDS (0.50%)',
      amount: c.crds,
      type: 'deduction',
    });

    // Alsace-Moselle supplementary health
    if (r.isAlsaceMoselle) {
      rows.push({
        label: 'Alsace-Moselle health (1.30%)',
        amount: c.alsaceMoselle,
        type: 'deduction',
      });
    }

    // ── AGIRC-ARRCO section ──
    rows.push({ type: 'section', label: 'AGIRC-ARRCO Supplementary Pension' });

    rows.push({
      label: `Retraite T1 (3.15%, up to \u20AC${PMSS.toLocaleString()})`,
      amount: c.agircArrcoT1,
      type: 'deduction',
    });
    rows.push({
      label: `CEG T1 (0.86%)`,
      amount: c.cegT1,
      type: 'deduction',
    });

    // T2 contributions only appear when salary > PMSS
    if (c.agircArrcoT2 > 0) {
      rows.push({
        label: `Retraite T2 (8.64%, \u20AC${PMSS.toLocaleString()}\u2013\u20AC${PMSS_8X.toLocaleString()})`,
        amount: c.agircArrcoT2,
        type: 'deduction',
      });
      rows.push({
        label: 'CEG T2 (1.08%)',
        amount: c.cegT2,
        type: 'deduction',
      });
      rows.push({
        label: 'CET (0.14%)',
        amount: c.cet,
        type: 'deduction',
      });
    }

    // APEC for cadres
    if (r.isCadre && c.apec > 0) {
      rows.push({
        label: 'APEC cadres (0.024%)',
        amount: c.apec,
        type: 'deduction',
      });
    }

    // ── Subtotals ──
    rows.push({
      label: 'Total Social Contributions',
      amount: r.monthlyContributions,
      type: 'subtotal deduction',
      icon: '\uD83D\uDCCC',
    });

    rows.push({
      label: 'Net Before Tax (net avant imp\u00f4t)',
      amount: r.monthlyNetBeforeTax,
      type: 'subtotal',
    });

    // ── PAS section ──
    rows.push({ type: 'section', label: 'Withholding Tax (Pr\u00e9l\u00e8vement \u00e0 la Source)' });

    rows.push({
      label: `Net imposable: \u20AC${r.monthlyNetImposable.toLocaleString()}`,
      amount: null,
      type: 'note',
    });
    rows.push({
      label: `PAS neutral rate: ${r.pasRatePct}%`,
      amount: r.monthlyPAS,
      type: 'deduction',
    });

    // ── Final net ──
    rows.push({
      label: 'Total Deductions (contributions + PAS)',
      amount: r.totalDeductions,
      type: 'subtotal deduction',
      icon: '\uD83D\uDCCC',
    });
    rows.push({
      label: 'Monthly Net After Tax (net \u00e0 payer)',
      amount: r.monthlyNetAfterTax,
      type: 'subtotal net',
      icon: '\u2705',
    });

    // ── Annual income tax info (barème progressif) ──
    if (r.annualTax) {
      rows.push({ type: 'section', label: 'Annual Income Tax Estimate (bar\u00e8me progressif)' });
      rows.push({
        label: `Quotient familial: ${r.parts} part${r.parts > 1 ? 's' : ''} (${r.filingStatus}, ${r.annualTax.quotientFull > 0 ? '\u20AC' + r.annualTax.quotientFull.toLocaleString() + '/part' : ''})`,
        amount: null,
        type: 'note',
      });
      rows.push({
        label: `10% deduction: \u20AC${r.annualTax.deduction10pct.toLocaleString()}`,
        amount: null,
        type: 'note',
      });
      if (r.annualTax.isPlafonne) {
        rows.push({
          label: '\u26A0 Quotient familial benefit is capped (plafonn\u00e9)',
          amount: null,
          type: 'note',
        });
      }
      if (r.annualTax.decoteAmount > 0) {
        rows.push({
          label: `D\u00e9cote applied: \u2212\u20AC${r.annualTax.decoteAmount.toLocaleString()}`,
          amount: null,
          type: 'note',
        });
      }
      rows.push({
        label: `Annual income tax: \u20AC${r.annualTax.impotFinal.toLocaleString()}/year (effective ${r.annualTax.effectiveAnnualRate}%)`,
        amount: null,
        type: 'note',
      });

      // Note about neutral grid vs actual tax
      if (r.parts > 1) {
        rows.push({
          label: '\u2139\uFE0F The PAS neutral rate does not account for family situation. Your actual personalised rate would likely be lower.',
          amount: null,
          type: 'note',
        });
      }
    }

    return rows;
  },

  // ── Employer cost bars (for employer view) ──
  getEmployerBars(breakdown) {
    const r = breakdown;
    return [
      { label: 'Gross Salary',             value: r.gross,                       color: '#3b82f6' },
      { label: 'Employer Contributions',   value: r.monthlyEmployerContributions, color: '#8b5cf6' },
    ];
  },

  // ── Annual summary chart segments ──
  getAnnualSegments(breakdown) {
    const segments = [
      { label: 'Net Take-home',            value: breakdown.annualNetAfterTax,         color: '#059669' },
      { label: 'Social Contributions',     value: breakdown.annualContributions,       color: '#3b82f6' },
      { label: 'Withholding Tax (PAS)',     value: breakdown.annualPAS,                color: '#e94560' },
      { label: 'Employer Contributions',   value: breakdown.annualEmployerContributions, color: '#8b5cf6' },
    ];
    return segments.filter(s => s.value > 0);
  },
};

export default france;
