/* ══════════════════════════════════════════════════════════
   ExpatCalc — EmployerCostBars Component
   Horizontal bar chart for employer-side costs
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';
import { formatNumber } from '../app/utils.js';

export default React.memo(function EmployerCostBars({ bars, total, currency }) {
  const max = total > 0 ? total : 1;

  return html`
    <div class="card">
      <div class="card-header">
        <div class="card-icon amber">🏢</div>
        <div class="card-title">Employer Cost</div>
      </div>
      <div class="employer-total">
        Total: <strong class="num">${formatNumber(total)} ${currency}</strong>
      </div>
      <div class="employer-bars">
        ${bars.map((item, i) => {
          const w = (item.value / max * 100);
          return html`
            <div key=${i} class="bar-group">
              <div class="bar-label">${item.label}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  style=${{ width: w + '%', background: item.color }}
                >
                  <span class="bar-value num">${formatNumber(item.value)} ${currency}</span>
                </div>
              </div>
            </div>
          `;
        })}
      </div>
    </div>
  `;
});
