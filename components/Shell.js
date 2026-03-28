/* ══════════════════════════════════════════════════════════
   ExpatCalc — App Shell Component
   Wraps Sidebar + Topbar + Content area.
   Handles mobile sidebar overlay and keyboard shortcuts.
   ══════════════════════════════════════════════════════════ */

import { html, React, useNavigate, useLocation } from '../app/deps.js';
import { useApp } from '../app/store.js';
import COUNTRIES from '../countries/registry.js';
import Sidebar from './Sidebar.js';
import Topbar from './Topbar.js';

const { useState, useEffect, useCallback } = React;

export default function Shell({ children }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Ignore when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      const key = e.key;

      // ? — show keyboard shortcuts help
      if (key === '?') {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Escape — close help panel or sidebar
      if (key === 'Escape') {
        if (showHelp) { setShowHelp(false); return; }
        if (state.sidebarOpen) { dispatch({ type: 'CLOSE_SIDEBAR' }); return; }
        return;
      }

      // d — toggle dark mode
      if (key === 'd' && !e.ctrlKey && !e.metaKey) {
        dispatch({ type: 'TOGGLE_DARK_MODE' });
        return;
      }

      // h — go home
      if (key === 'h' && !e.ctrlKey && !e.metaKey) {
        navigate('/');
        return;
      }

      // c — go to compare
      if (key === 'c' && !e.ctrlKey && !e.metaKey) {
        navigate('/compare');
        return;
      }

      // Arrow left/right — switch between countries
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        const path = location.pathname.replace('/', '');
        const currentIdx = COUNTRIES.findIndex(c => c.id === path);
        if (currentIdx === -1) return; // not on a country page

        let nextIdx;
        if (key === 'ArrowLeft') {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : COUNTRIES.length - 1;
        } else {
          nextIdx = currentIdx < COUNTRIES.length - 1 ? currentIdx + 1 : 0;
        }
        navigate('/' + COUNTRIES[nextIdx].id);
        return;
      }

      // 1-8 — jump to country by index
      const num = parseInt(key);
      if (num >= 1 && num <= COUNTRIES.length) {
        navigate('/' + COUNTRIES[num - 1].id);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname, showHelp, state.sidebarOpen, dispatch]);

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

      <!-- Keyboard shortcuts help -->
      ${showHelp && html`
        <div class="kbd-help-overlay" onClick=${(e) => { if (e.target === e.currentTarget) setShowHelp(false); }}>
          <div class="kbd-help-panel">
            <h3>Keyboard Shortcuts</h3>
            <div class="kbd-help-list">
              <div class="kbd-help-row">
                <span>Show this help</span>
                <span class="kbd-key">?</span>
              </div>
              <div class="kbd-help-row">
                <span>Go home</span>
                <span class="kbd-key">H</span>
              </div>
              <div class="kbd-help-row">
                <span>Compare countries</span>
                <span class="kbd-key">C</span>
              </div>
              <div class="kbd-help-row">
                <span>Toggle dark mode</span>
                <span class="kbd-key">D</span>
              </div>
              <div class="kbd-help-row">
                <span>Previous / next country</span>
                <div>
                  <span class="kbd-key">\u2190</span>
                  <span style=${{ margin: '0 4px' }}>/</span>
                  <span class="kbd-key">\u2192</span>
                </div>
              </div>
              <div class="kbd-help-row">
                <span>Jump to country 1–${COUNTRIES.length}</span>
                <div>
                  <span class="kbd-key">1</span>
                  <span style=${{ margin: '0 2px' }}>–</span>
                  <span class="kbd-key">${COUNTRIES.length}</span>
                </div>
              </div>
              <div class="kbd-help-row">
                <span>Close / dismiss</span>
                <span class="kbd-key">Esc</span>
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
