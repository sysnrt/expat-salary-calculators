/* ══════════════════════════════════════════════════════════
   ExpatCalc — HistoryPanel Component
   Save/load calculation history from localStorage.
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';
import { useApp } from '../app/store.js';
import { formatNumber } from '../app/utils.js';

const { useState, useCallback } = React;

const STORAGE_KEY = 'expatcalc_history';

// Load history from localStorage
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Save history to localStorage
export function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) { /* quota exceeded — silently fail */ }
}

export default function HistoryPanel({ country, breakdown, salary, calcMode, options }) {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = useCallback(() => {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      ts: Date.now(),
      countryId: country.id,
      countryName: country.name,
      countryFlag: country.flag,
      currency: country.currency,
      salary,
      calcMode,
      gross: breakdown.gross,
      net: breakdown.netSalary,
      employerCost: breakdown.totalEmployerCost,
    };

    dispatch({ type: 'ADD_HISTORY', payload: entry });

    // Persist
    const updated = [entry, ...state.history].slice(0, 50);
    saveHistory(updated);

    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  }, [country, breakdown, salary, calcMode, state.history, dispatch]);

  const handleRemove = useCallback((id) => {
    dispatch({ type: 'REMOVE_HISTORY', payload: id });
    const updated = state.history.filter(h => h.id !== id);
    saveHistory(updated);
  }, [state.history, dispatch]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
    saveHistory([]);
  }, [dispatch]);

  // Filter by search
  const filtered = state.history.filter(h => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.countryName.toLowerCase().includes(q)
      || String(h.gross).includes(q)
      || String(h.net).includes(q);
  });

  return html`
    <div class="card history-panel">
      <div class="card-header">
        <div class="card-icon green">💾</div>
        <div class="card-title">Saved Calculations</div>
        <button
          class="history-save-btn ${justSaved ? 'saved' : ''}"
          onClick=${handleSave}
          disabled=${justSaved}
        >
          ${justSaved ? '✓ Saved' : '💾 Save Current'}
        </button>
      </div>

      ${state.history.length > 0 && html`
        <div class="history-controls">
          <input
            type="text"
            class="history-search"
            placeholder="Search saved..."
            value=${search}
            onInput=${e => setSearch(e.target.value)}
          />
          ${state.history.length > 1 && html`
            <button class="history-clear-btn" onClick=${handleClear}>Clear All</button>
          `}
        </div>
      `}

      <div class="history-list">
        ${filtered.length === 0 && state.history.length === 0 && html`
          <div class="history-empty">
            No saved calculations yet. Use the button above to save your current calculation.
          </div>
        `}
        ${filtered.length === 0 && state.history.length > 0 && html`
          <div class="history-empty">No results matching "${search}"</div>
        `}
        ${filtered.map(h => html`
          <div class="history-item" key=${h.id}>
            <div class="history-item-left">
              <span class="history-flag">${h.countryFlag}</span>
              <div class="history-item-info">
                <div class="history-item-country">${h.countryName}</div>
                <div class="history-item-detail">
                  Gross: ${formatNumber(h.gross)} ${h.currency} → Net: ${formatNumber(h.net)} ${h.currency}
                </div>
                <div class="history-item-date">${new Date(h.ts).toLocaleDateString()}</div>
              </div>
            </div>
            <button
              class="history-remove-btn"
              onClick=${() => handleRemove(h.id)}
              title="Remove"
            >×</button>
          </div>
        `)}
      </div>
    </div>
  `;
}
