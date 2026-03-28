/* ══════════════════════════════════════════════════════════
   ExpatCalc — Main Entry Point
   React root, hash router setup, route definitions.
   ══════════════════════════════════════════════════════════ */

console.log('main.js: starting to load');

import { React, ReactDOM, html, HashRouter, Routes, Route, Link, useParams } from './deps.js';
console.log('main.js: imported deps');

import { AppProvider } from './store.js';
console.log('main.js: imported store');

import Shell from '../components/Shell.js';
console.log('main.js: imported Shell');

import CalculatorPage from '../components/CalculatorPage.js';
console.log('main.js: imported CalculatorPage');

import EuropeMap from '../components/EuropeMap.js';
console.log('main.js: imported EuropeMap');

import ComparisonView from '../components/ComparisonView.js';
console.log('main.js: imported ComparisonView');

import COUNTRIES from '../countries/registry.js';
console.log('main.js: imported COUNTRIES');

const { useState, useEffect } = React;

// ── Country config loader (lazy) ──
const countryConfigs = {};

async function loadCountryConfig(id) {
  if (countryConfigs[id]) return countryConfigs[id];
  try {
    const mod = await import(`../countries/${id}.js`);
    countryConfigs[id] = mod.default;
    return mod.default;
  } catch (e) {
    console.warn(`Country config not found: ${id}`, e);
    return null;
  }
}

// ── Pages ──

function HomePage() {
  return html`
    <div class="route-transition">
      <div class="homepage-hero">
        <h1>Expat Salary Calculators</h1>
        <p class="subtitle">Calculate your net salary, taxes, and employer costs across Europe — updated for 2026 tax rules.</p>
        <div class="homepage-stats">
          <div class="homepage-stat">
            <div class="homepage-stat-value">${COUNTRIES.length}</div>
            <div class="homepage-stat-label">Countries</div>
          </div>
          <div class="homepage-stat">
            <div class="homepage-stat-value">2026</div>
            <div class="homepage-stat-label">Tax Year</div>
          </div>
          <div class="homepage-stat">
            <div class="homepage-stat-value">3</div>
            <div class="homepage-stat-label">Calc Modes</div>
          </div>
        </div>
      </div>

      <${EuropeMap} />

      <div class="country-grid">
        ${COUNTRIES.map(country => html`
          <${Link}
            key=${country.id}
            to=${'/' + country.id}
            class="country-card"
            style=${{ '--card-accent': country.accentColor }}
          >
            <span class="flag">${country.flag}</span>
            <span class="name">${country.name}</span>
            <span class="local-name">${country.localName}</span>
            <span class="currency-badge">${country.currency}</span>
          </${Link}>
        `)}
      </div>
    </div>
  `;
}

function CountryPage() {
  const { countryId } = useParams();
  const countryMeta = COUNTRIES.find(c => c.id === countryId);
  const [countryConfig, setCountryConfig] = useState(countryConfigs[countryId] || null);
  const [loading, setLoading] = useState(!countryConfigs[countryId]);

  useEffect(() => {
    let cancelled = false;
    if (countryConfigs[countryId]) {
      setCountryConfig(countryConfigs[countryId]);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadCountryConfig(countryId).then(cfg => {
      if (!cancelled) {
        setCountryConfig(cfg);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [countryId]);

  if (!countryMeta) {
    return html`
      <div class="placeholder-page">
        <div class="icon">🔍</div>
        <h2>Country not found</h2>
        <p>The country "${countryId}" doesn't exist yet.</p>
        <${Link} to="/" style=${{ color: 'var(--accent)', fontWeight: 600 }}>← Back to Dashboard</${Link}>
      </div>
    `;
  }

  if (loading) {
    return html`
      <div class="route-transition" data-country=${countryId}>
        <div class="page-header">
          <h1>${countryMeta.flag} ${countryMeta.name} Salary Calculator</h1>
          <p class="subtitle">${countryMeta.localName} · ${countryMeta.currency} · Tax year 2026</p>
        </div>
        <div class="placeholder-page" style=${{ minHeight: '40vh' }}>
          <div class="icon">⏳</div>
          <h2>Loading calculator...</h2>
        </div>
      </div>
    `;
  }

  if (!countryConfig) {
    return html`
      <div class="route-transition" data-country=${countryId}>
        <div class="page-header">
          <h1>${countryMeta.flag} ${countryMeta.name} Salary Calculator</h1>
          <p class="subtitle">${countryMeta.localName} · ${countryMeta.currency} · Tax year 2026</p>
        </div>
        <div class="placeholder-page" style=${{ minHeight: '40vh' }}>
          <div class="icon">🚧</div>
          <h2>Coming Soon</h2>
          <p>The ${countryMeta.name} calculator is being migrated to the new system.</p>
        </div>
      </div>
    `;
  }

  return html`<div class="route-transition" key=${countryId}><${CalculatorPage} country=${countryConfig} /></div>`;
}

function ComparePage() {
  return html`
    <div class="route-transition">
      <div class="page-header">
        <h1>Compare Countries</h1>
        <p class="subtitle">Side-by-side salary comparison across multiple countries.</p>
      </div>
      <${ComparisonView} />
    </div>
  `;
}

// ── App root ──

function App() {
  return html`
    <${AppProvider}>
      <${HashRouter}>
        <${Shell}>
          <${Routes}>
            <${Route} path="/" element=${html`<${HomePage} />`} />
            <${Route} path="/compare" element=${html`<${ComparePage} />`} />
            <${Route} path="/:countryId" element=${html`<${CountryPage} />`} />
          </${Routes}>
        </${Shell}>
      </${HashRouter}>
    </${AppProvider}>
  `;
}

// ── Mount ──
try {
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('App element #app not found in DOM');

  const root = ReactDOM.createRoot(appEl);
  root.render(html`<${App} />`);

  console.log('✓ ExpatCalc React app mounted');
} catch (err) {
  console.error('MOUNT ERROR:', err);
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.innerHTML = '<div style="text-align:center;max-width:600px;padding:2rem"><div style="font-size:1.5rem;margin-bottom:0.5rem">⚠️ Mount Error</div><pre style="text-align:left;background:#fee;padding:1rem;border-radius:8px;overflow-x:auto;font-size:0.8rem;color:#c00">' + err.message + '\n\nStack: ' + err.stack + '</pre></div>';
  }
}
