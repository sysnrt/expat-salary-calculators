/* ══════════════════════════════════════════════════════════
   ExpatCalc — App Shell Component
   Wraps Sidebar + Topbar + Content area.
   Handles mobile sidebar overlay.
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';
import { useApp } from '../app/store.js';
import Sidebar from './Sidebar.js';
import Topbar from './Topbar.js';

export default function Shell({ children }) {
  const { state, dispatch } = useApp();

  return html`
    <div class="app-shell">
      <!-- Sidebar -->
      <${Sidebar} />

      <!-- Mobile overlay -->
      <div
        class=${'sidebar-overlay' + (state.sidebarOpen ? ' show' : '')}
        onClick=${() => dispatch({ type: 'CLOSE_SIDEBAR' })}
      />

      <!-- Topbar -->
      <${Topbar} />

      <!-- Content -->
      <main class="content-area">
        <div class="content-inner">
          ${children}
        </div>
      </main>
    </div>
  `;
}
