/* ══════════════════════════════════════════════════════════
   ExpatCalc — Sidebar Component
   Persistent sidebar with country list and settings links.
   ══════════════════════════════════════════════════════════ */

import { html, React, NavLink } from '../app/deps.js';
import { useApp } from '../app/store.js';
import COUNTRIES from '../countries/registry.js';

// Globe SVG icon
function GlobeIcon() {
  return html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
         stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
    </svg>
  `;
}

// Settings gear icon
function SettingsIcon() {
  return html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  `;
}

// Compare icon
function CompareIcon() {
  return html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1"/>
      <rect x="14" y="3" width="7" height="18" rx="1"/>
    </svg>
  `;
}

export default function Sidebar() {
  const { state, dispatch } = useApp();

  const closeSidebar = () => dispatch({ type: 'CLOSE_SIDEBAR' });

  return html`
    <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}">
      <!-- Brand -->
      <div class="sidebar-brand">
        <${GlobeIcon} />
        <span class="sidebar-brand-text">ExpatCalc</span>
        <span class="sidebar-brand-year">2026</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Home</div>
        <${NavLink}
          to="/"
          end=${true}
          className=${({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          onClick=${closeSidebar}
        >
          <span class="flag">🏠</span>
          <span class="link-label">Dashboard</span>
        </${NavLink}>

        <div class="sidebar-section-label">Countries</div>
        ${COUNTRIES.map(country => html`
          <${NavLink}
            key=${country.id}
            to=${'/' + country.id}
            className=${({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            onClick=${closeSidebar}
          >
            <span class="flag">${country.flag}</span>
            <div>
              <div class="link-label">${country.name}</div>
              <div class="link-local">${country.localName}</div>
            </div>
          </${NavLink}>
        `)}
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <${NavLink}
          to="/compare"
          className=${({ isActive }) => 'sidebar-footer-link' + (isActive ? ' active' : '')}
          onClick=${closeSidebar}
        >
          <${CompareIcon} />
          <span>Compare Countries</span>
        </${NavLink}>
      </div>
    </aside>
  `;
}
