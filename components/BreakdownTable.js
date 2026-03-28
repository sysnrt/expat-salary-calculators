/* ══════════════════════════════════════════════════════════
   ExpatCalc — BreakdownTable Component
   Itemized deduction table
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';
import { formatNumber } from '../app/utils.js';

export default React.memo(function BreakdownTable({ rows, currency }) {
  return html`
    <div class="card">
      <div class="card-header">
        <div class="card-icon blue">📋</div>
        <div class="card-title">Salary Breakdown</div>
      </div>
      <table class="breakdown-table">
        <tbody>
          ${rows.map((row, i) => {
            if (row.type === 'section') {
              return html`
                <tr key=${i} class="section-row">
                  <td colspan="2">${row.label}</td>
                </tr>
              `;
            }

            // 'note' rows: informational label only, no amount column (e.g. warnings)
            if (row.type === 'note') {
              return html`
                <tr key=${i} class="breakdown-row note-row">
                  <td class="row-label row-note" colspan="2">${row.label}</td>
                </tr>
              `;
            }

            const isDeduction = row.type?.includes('deduction');
            const isBenefit = row.type === 'benefit';
            const isSubtotal = row.type?.includes('subtotal');
            const isNet = row.type?.includes('net');
            const prefix = isBenefit ? '+' : isDeduction && !isSubtotal ? '−' : '';

            return html`
              <tr key=${i} class=${'breakdown-row ' + (row.type || '')}>
                <td class="row-label">
                  ${row.icon ? html`<span class="row-icon">${row.icon}</span>` : null}
                  ${row.label}
                </td>
                <td class="row-amount num">
                  ${prefix}${prefix ? ' ' : ''}${formatNumber(Math.abs(row.amount))} ${currency}
                </td>
              </tr>
            `;
          })}
        </tbody>
      </table>
    </div>
  `;
});
