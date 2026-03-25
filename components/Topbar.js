/* ══════════════════════════════════════════════════════════
   ExpatCalc — Topbar Component
   Breadcrumb, dark mode toggle, language switcher
   ══════════════════════════════════════════════════════════ */

import { html, React, useLocation, Link } from '../app/deps.js';
import { useApp } from '../app/store.js';
import { getCountry } from '../countries/registry.js';

const { useMemo } = React;

// Sun icon
function SunIcon() {
  return html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  `;
}

// Moon icon
function MoonIcon() {
  return html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;
}

export default function Topbar() {
  const { state, dispatch } = useApp();
  const location = useLocation();

  // Build breadcrumb from current path
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      return { label: 'Dashboard', flag: null };
    }
    const countryId = path.replace('/', '');
    const country = getCountry(countryId);
    if (country) {
      return { label: country.name, flag: country.flag };
    }
    if (countryId === 'compare') {
      return { label: 'Compare Countries', flag: null };
    }
    return { label: countryId, flag: null };
  }, [location.pathname]);

  return html`
    <header class="topbar">
      <!-- Hamburger (mobile only) -->
      <button
        class="topbar-hamburger"
        onClick=${() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <!-- Breadcrumb -->
      <div class="topbar-breadcrumb">
        <${Link} to="/" style=${{ color: 'inherit', textDecoration: 'none' }}>ExpatCalc<//>
        <span class="separator">/</span>
        ${breadcrumb.flag && html`<span>${breadcrumb.flag}</span>`}
        <span class="current">${breadcrumb.label}</span>
      </div>

      <!-- Actions -->
      <div class="topbar-actions">
        <!-- Dark mode toggle -->
        <button
          class="topbar-btn"
          onClick=${() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
          aria-label=${state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title=${state.darkMode ? 'Light mode' : 'Dark mode'}
        >
          ${state.darkMode ? html`<${SunIcon} />` : html`<${MoonIcon} />`}
        </button>

        <!-- Compare link -->
        <${Link} to="/compare" class="topbar-btn">
          Compare
        </${Link}>
      </div>
    </header>
  `;
}
