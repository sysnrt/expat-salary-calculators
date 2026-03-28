/* ══════════════════════════════════════════════════════════
   ExpatCalc — DonutChart Component
   SVG-based donut chart for tax/contribution visualization
   (No external chart library needed — pure SVG)
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';
import { formatNumber } from '../app/utils.js';

export default React.memo(function DonutChart({ segments, total, centerLabel, centerSub, currency }) {
  const cx = 100, cy = 100, r1 = 85, r2 = 55;
  let startAngle = -Math.PI / 2;
  const safeTotal = total > 0 ? total : 1;

  const paths = segments.filter(s => s.value > 0).map((seg, i) => {
    const angle = (seg.value / safeTotal) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const largeArc = angle > Math.PI ? 1 : 0;

    const x1o = cx + r1 * Math.cos(startAngle);
    const y1o = cy + r1 * Math.sin(startAngle);
    const x2o = cx + r1 * Math.cos(endAngle);
    const y2o = cy + r1 * Math.sin(endAngle);
    const x1i = cx + r2 * Math.cos(endAngle);
    const y1i = cy + r2 * Math.sin(endAngle);
    const x2i = cx + r2 * Math.cos(startAngle);
    const y2i = cy + r2 * Math.sin(startAngle);

    const d = `M${x1o},${y1o} A${r1},${r1} 0 ${largeArc} 1 ${x2o},${y2o} L${x1i},${y1i} A${r2},${r2} 0 ${largeArc} 0 ${x2i},${y2i} Z`;
    startAngle = endAngle;

    return html`
      <path key=${i} d=${d} fill=${seg.color} opacity="0.85">
        <title>${seg.label}: ${formatNumber(seg.value)} ${currency}</title>
      </path>
    `;
  });

  return html`
    <div class="card">
      <div class="card-header">
        <div class="card-icon red">🍩</div>
        <div class="card-title">Tax Breakdown</div>
      </div>
      <div class="donut-container">
        <svg viewBox="0 0 200 200" class="donut-svg">
          ${paths}
          <text x=${cx} y=${cy - 6} text-anchor="middle" font-size="24" font-weight="800" fill="var(--accent)" class="donut-center-label">
            ${centerLabel}
          </text>
          <text x=${cx} y=${cy + 14} text-anchor="middle" font-size="10" fill="var(--text-secondary)" class="donut-center-sub">
            ${centerSub}
          </text>
        </svg>
      </div>
      <div class="donut-legend">
        ${segments.filter(s => s.value > 0).map((seg, i) => {
          const pct = total > 0 ? Math.round(seg.value / total * 100) : 0;
          return html`
            <div key=${i} class="legend-item">
              <div class="legend-color" style=${{ background: seg.color }} />
              <span class="legend-label">${seg.label} (${pct}%)</span>
              <span class="legend-value num">${formatNumber(seg.value)} ${currency}</span>
            </div>
          `;
        })}
      </div>
    </div>
  `;
});
