/* ══════════════════════════════════════════════════════════
   ExpatCalc — Main Entry Point
   React root, hash router setup, route definitions.
   ══════════════════════════════════════════════════════════ */

import { React, ReactDOM, html, HashRouter, Routes, Route, Link, useParams } from './deps.js';
import { AppProvider } from './store.js';
import Shell from '../components/Shell.js';
import COUNTRIES from '../countries/registry.js';

// ── Placeholder pages (will be replaced in Phase 2+) ──

function HomePage() {
  return html`
    <div class="animate-fade-in-up">
      <div class="page-header">
        <h1>Expat Salary Calculators</h1>
        <p class="subtitle">Choose a country to calculate your net salary, taxes, and employer costs for 2026.</p>
      </div>
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
          </${Link}>
        `)}
      </div>
    </div>
  `;
}

function CountryPage() {
  const { countryId } = useParams();
  const country = COUNTRIES.find(c => c.id === countryId);

  if (!country) {
    return html`
      <div class="placeholder-page">
        <div class="icon">🔍</div>
        <h2>Country not found</h2>
        <p>The country "${countryId}" doesn't exist yet.</p>
        <${Link} to="/" style=${{ color: 'var(--accent)', fontWeight: 600 }}>← Back to Dashboard</${Link}>
      </div>
    `;
  }

  return html`
    <div class="animate-fade-in-up" data-country=${country.id}>
      <div class="page-header">
        <h1>${country.flag} ${country.name} Salary Calculator</h1>
        <p class="subtitle">${country.localName} · ${country.currency} · Tax year 2026</p>
      </div>
      <div class="placeholder-page" style=${{ minHeight: '40vh' }}>
        <div class="icon">🚧</div>
        <h2>Coming in Phase 2</h2>
        <p>The ${country.name} calculator will be migrated here from the legacy HTML version.</p>
      </div>
    </div>
  `;
}

function ComparePage() {
  return html`
    <div class="animate-fade-in-up">
      <div class="page-header">
        <h1>Compare Countries</h1>
        <p class="subtitle">Side-by-side salary comparison across multiple countries.</p>
      </div>
      <div class="placeholder-page" style=${{ minHeight: '40vh' }}>
        <div class="icon">📊</div>
        <h2>Coming in Phase 5</h2>
        <p>The country comparison dashboard will be built after all calculators are migrated.</p>
      </div>
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
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(html`<${App} />`);

console.log('✓ ExpatCalc React app mounted');
