/* ══════════════════════════════════════════════════════════
   ExpatCalc — ComparisonView Component
   Side-by-side salary comparison across multiple countries.
   Select 2-4 countries, set a gross salary, see net/tax/employer
   costs compared in a unified view.
   ══════════════════════════════════════════════════════════ */

import { html, React, useSearchParams } from '../app/deps.js';
import { formatNumber, formatPercent } from '../app/utils.js';
import COUNTRIES from '../countries/registry.js';

const { useState, useEffect, useMemo, useCallback } = React;

// Lazy-load country configs (same pattern as main.js)
const configCache = {};
async function loadConfig(id) {
  if (configCache[id]) return configCache[id];
  try {
    const mod = await import(`../countries/${id}.js`);
    configCache[id] = mod.default;
    return mod.default;
  } catch (e) {
    console.warn(`Failed to load config for ${id}`, e);
    return null;
  }
}

// Bar component for visual comparison
function CompareBar({ value, max, color, label }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return html`
    <div class="compare-bar-group">
      <div class="compare-bar-track">
        <div class="compare-bar-fill" style=${{ width: pct + '%', background: color }}>
          <span class="compare-bar-value num">${formatNumber(value)}</span>
        </div>
      </div>
    </div>
  `;
}

export default function ComparisonView() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL state
  const initialCountries = (searchParams.get('countries') || '').split(',').filter(id => COUNTRIES.some(c => c.id === id));
  const initialGross = parseInt(searchParams.get('gross')) || 4000;
  const initialCurrency = searchParams.get('currency') || 'EUR';

  const [selected, setSelected] = useState(initialCountries.length >= 2 ? initialCountries : []);
  const [grossInput, setGrossInput] = useState(initialGross);
  const [currency] = useState(initialCurrency);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(false);

  // Sync URL when state changes
  useEffect(() => {
    if (selected.length >= 2) {
      setSearchParams({
        countries: selected.join(','),
        gross: String(grossInput),
        currency,
      }, { replace: true });
    }
  }, [selected, grossInput, currency]);

  // Load configs for selected countries
  useEffect(() => {
    if (selected.length === 0) return;
    setLoading(true);
    Promise.all(selected.map(id => loadConfig(id))).then(results => {
      const map = {};
      results.forEach((cfg, i) => {
        if (cfg) map[selected[i]] = cfg;
      });
      setConfigs(map);
      setLoading(false);
    });
  }, [selected.join(',')]);

  // Compute breakdowns for all selected countries
  const results = useMemo(() => {
    if (Object.keys(configs).length === 0) return [];
    return selected.map(id => {
      const cfg = configs[id];
      if (!cfg) return null;
      const meta = COUNTRIES.find(c => c.id === id);

      // Convert gross from EUR to local currency if needed
      let localGross = grossInput;
      // For comparison, we use EUR as the common base
      // Countries with EUR use the value directly
      // Non-EUR countries: we'd need exchange rates, but for simplicity
      // the comparison uses each country's native salary range
      // The user sets a EUR gross and we compute with that

      const breakdown = cfg.computeBreakdown(localGross, cfg.defaultOptions());
      return {
        id,
        name: meta.name,
        flag: meta.flag,
        currency: cfg.currency,
        accentColor: meta.accentColor,
        gross: breakdown.gross,
        net: breakdown.netSalary,
        totalDeductions: breakdown.totalDeductions,
        totalTaxes: breakdown.totalTaxes,
        totalSS: breakdown.totalSocialSecurity,
        employerCost: breakdown.totalEmployerCost,
        stateBenefit: breakdown.stateBenefit || 0,
        netPct: breakdown.gross > 0 ? (breakdown.netSalary / breakdown.gross * 100) : 0,
        taxPct: breakdown.gross > 0 ? (breakdown.totalTaxes / breakdown.gross * 100) : 0,
      };
    }).filter(Boolean);
  }, [configs, selected, grossInput]);

  const toggleCountry = useCallback((id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, id];
    });
  }, []);

  // Max values for bar scaling
  const maxNet = Math.max(...results.map(r => r.net), 1);
  const maxGross = Math.max(...results.map(r => r.gross), 1);
  const maxEmployer = Math.max(...results.map(r => r.employerCost), 1);

  return html`
    <div class="comparison-page">
      <!-- Country selector -->
      <div class="card compare-selector-card">
        <div class="card-header">
          <div class="card-icon blue">🔀</div>
          <div class="card-title">Select Countries to Compare</div>
          <span class="compare-hint">${selected.length}/4 selected</span>
        </div>
        <div class="compare-country-chips">
          ${COUNTRIES.map(c => html`
            <button
              key=${c.id}
              class="compare-chip ${selected.includes(c.id) ? 'active' : ''} ${selected.length >= 4 && !selected.includes(c.id) ? 'disabled' : ''}"
              onClick=${() => toggleCountry(c.id)}
              style=${selected.includes(c.id) ? { '--chip-accent': c.accentColor } : {}}
            >
              <span class="compare-chip-flag">${c.flag}</span>
              <span class="compare-chip-name">${c.name}</span>
              <span class="compare-chip-currency">${c.currency}</span>
            </button>
          `)}
        </div>
      </div>

      ${selected.length >= 2 && html`
        <!-- Gross salary input -->
        <div class="card compare-gross-card">
          <div class="card-header">
            <div class="card-icon green">💰</div>
            <div class="card-title">Monthly Gross Salary</div>
          </div>
          <div class="compare-gross-input-row">
            <input
              type="range"
              min="500"
              max="15000"
              step="100"
              value=${grossInput}
              onInput=${e => setGrossInput(parseInt(e.target.value))}
              class="salary-slider"
            />
            <div class="compare-gross-display">
              <input
                type="text"
                class="salary-text-input"
                value=${formatNumber(grossInput)}
                onChange=${e => {
                  const v = parseInt(e.target.value.replace(/\s/g, ''));
                  if (!isNaN(v) && v >= 500 && v <= 15000) setGrossInput(v);
                }}
              />
              <span class="compare-gross-currency">${currency}/month</span>
            </div>
          </div>
        </div>
      `}

      ${selected.length < 2 && html`
        <div class="compare-empty-state">
          <div class="compare-empty-icon">📊</div>
          <h3>Select at least 2 countries to compare</h3>
          <p>Click on country chips above to start comparing salary breakdowns side by side.</p>
        </div>
      `}

      ${loading && selected.length >= 2 && html`
        <div class="compare-empty-state">
          <div class="compare-empty-icon">⏳</div>
          <h3>Loading calculators...</h3>
        </div>
      `}

      ${!loading && results.length >= 2 && html`
        <!-- Results comparison -->
        <div class="compare-results">
          <!-- Net salary comparison -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon green">💵</div>
              <div class="card-title">Net Monthly Salary</div>
            </div>
            <div class="compare-bars">
              ${results.map(r => html`
                <div key=${r.id} class="compare-row">
                  <div class="compare-row-label">
                    <span class="compare-row-flag">${r.flag}</span>
                    <span>${r.name}</span>
                    <span class="compare-row-pct num">${formatPercent(r.netPct, 0)} net</span>
                  </div>
                  <${CompareBar}
                    value=${r.net}
                    max=${maxGross}
                    color=${r.accentColor}
                    label=${r.currency}
                  />
                </div>
              `)}
            </div>
          </div>

          <!-- Tax comparison -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon red">🏛️</div>
              <div class="card-title">Total Taxes</div>
            </div>
            <div class="compare-bars">
              ${results.map(r => html`
                <div key=${r.id} class="compare-row">
                  <div class="compare-row-label">
                    <span class="compare-row-flag">${r.flag}</span>
                    <span>${r.name}</span>
                    <span class="compare-row-pct num">${formatPercent(r.taxPct, 0)}</span>
                  </div>
                  <${CompareBar}
                    value=${r.totalTaxes}
                    max=${maxGross}
                    color="#ef4444"
                  />
                </div>
              `)}
            </div>
          </div>

          <!-- Social security comparison -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon blue">🛡️</div>
              <div class="card-title">Employee Social Security</div>
            </div>
            <div class="compare-bars">
              ${results.map(r => html`
                <div key=${r.id} class="compare-row">
                  <div class="compare-row-label">
                    <span class="compare-row-flag">${r.flag}</span>
                    <span>${r.name}</span>
                  </div>
                  <${CompareBar}
                    value=${r.totalSS}
                    max=${maxGross}
                    color="#3b82f6"
                  />
                </div>
              `)}
            </div>
          </div>

          <!-- Employer cost comparison -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon amber">🏢</div>
              <div class="card-title">Total Employer Cost</div>
            </div>
            <div class="compare-bars">
              ${results.map(r => html`
                <div key=${r.id} class="compare-row">
                  <div class="compare-row-label">
                    <span class="compare-row-flag">${r.flag}</span>
                    <span>${r.name}</span>
                  </div>
                  <${CompareBar}
                    value=${r.employerCost}
                    max=${maxEmployer}
                    color="#f59e0b"
                  />
                </div>
              `)}
            </div>
          </div>

          <!-- Summary table -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon purple">📋</div>
              <div class="card-title">Summary Table</div>
            </div>
            <div class="compare-table-wrap">
              <table class="compare-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th class="num">Gross</th>
                    <th class="num">Net Salary</th>
                    <th class="num">Net %</th>
                    <th class="num">Taxes</th>
                    <th class="num">Social Sec.</th>
                    <th class="num">Employer Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${results.map(r => html`
                    <tr key=${r.id}>
                      <td>${r.flag} ${r.name}</td>
                      <td class="num">${formatNumber(r.gross)}</td>
                      <td class="num green">${formatNumber(r.net)}</td>
                      <td class="num green">${formatPercent(r.netPct, 1)}</td>
                      <td class="num red">${formatNumber(r.totalTaxes)}</td>
                      <td class="num blue">${formatNumber(r.totalSS)}</td>
                      <td class="num amber">${formatNumber(r.employerCost)}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
