/* ══════════════════════════════════════════════════════════
   ExpatCalc — ResultPanel Component
   Net salary hero number + summary stat boxes
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';
import { formatNumber } from '../app/utils.js';
import AnimatedNumber from './AnimatedNumber.js';

export default React.memo(function ResultPanel({ breakdown, country, displayCurrency }) {
  const r = breakdown;
  const currency = displayCurrency || country.currency;
  const netPct = r.gross > 0 ? Math.round(r.netSalary / r.gross * 100) : 0;

  return html`
    <div class="result-panel">
      <!-- Hero net salary -->
      <div class="result-hero">
        <div class="result-hero-label">Net Monthly Salary</div>
        <div class="result-hero-amount num"><${AnimatedNumber} value=${r.netSalary} format=${v => formatNumber(v)} /> <span class="result-currency">${currency}</span></div>
        <div class="result-hero-sub">
          ${netPct}% of gross salary · Gross: ${formatNumber(r.gross)} ${currency}
        </div>
      </div>

      <!-- Summary boxes -->
      <div class="summary-grid">
        <div class="summary-box green">
          <div class="summary-label">Net Salary</div>
          <div class="summary-value num">${formatNumber(r.netSalary)}</div>
        </div>
        <div class="summary-box red">
          <div class="summary-label">Total Deductions</div>
          <div class="summary-value num">${formatNumber(r.totalDeductions)}</div>
        </div>
        <div class="summary-box blue">
          <div class="summary-label">Employer Cost</div>
          <div class="summary-value num">${formatNumber(r.totalEmployerCost)}</div>
        </div>
        <div class="summary-box purple">
          <div class="summary-label">State Benefit</div>
          <div class="summary-value num">${formatNumber(r.stateBenefit || 0)}</div>
        </div>
      </div>

      <!-- Annual overview -->
      ${ (() => {
        const annualNet          = r.annualNetSalary    ?? r.netSalary           * 12;
        const annualTaxes        = r.annualIRS          ?? r.totalTaxes          * 12;
        const annualSocialSec    = r.annualSS           ?? r.totalSocialSecurity  * 12;
        const annualEmployerCost = r.annualEmployerCost ?? r.totalEmployerCost    * 12;
        return html`
        <div class="card annual-card">
          <div class="card-header">
            <div class="card-icon teal">📅</div>
            <div class="card-title">Annual Overview</div>
          </div>
          <div class="annual-grid">
            <div class="annual-item">
              <div class="annual-label">Annual Net</div>
              <div class="annual-value num green">${formatNumber(annualNet)} ${currency}</div>
            </div>
            <div class="annual-item">
              <div class="annual-label">Annual Taxes</div>
              <div class="annual-value num red">${formatNumber(annualTaxes)} ${currency}</div>
            </div>
            <div class="annual-item">
              <div class="annual-label">Annual Social Security</div>
              <div class="annual-value num blue">${formatNumber(annualSocialSec)} ${currency}</div>
            </div>
            <div class="annual-item">
              <div class="annual-label">Annual Employer Cost</div>
              <div class="annual-value num amber">${formatNumber(annualEmployerCost)} ${currency}</div>
            </div>
          </div>
        </div>`;
      })() }
    </div>
  `;
});
