/* ══════════════════════════════════════════════════════════
   ExpatCalc — App Store (React Context + useReducer)
   Shared state: language, dark mode, comparison, history
   ══════════════════════════════════════════════════════════ */

import { html, React } from './deps.js';

const { createContext, useContext, useReducer, useEffect } = React;

// ── Initial state ──
const initialState = {
  language: 'en',
  darkMode: false,
  sidebarOpen: false,          // mobile sidebar
  comparison: { countries: [], gross: 0 },
  history: [],
  settings: {
    animationsEnabled: true,
  },
};

// ── Load persisted preferences ──
function loadPersistedState() {
  try {
    const lang = localStorage.getItem('expatcalc_lang') || 'en';
    const dark = localStorage.getItem('expatcalc_dark') === 'true';
    let history = [];
    try {
      const raw = localStorage.getItem('expatcalc_history');
      if (raw) history = JSON.parse(raw);
    } catch (e) {}
    return { language: lang, darkMode: dark, history };
  } catch (e) {
    return {};
  }
}

// ── Reducer ──
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_DARK_MODE':
      return { ...state, darkMode: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false };
    case 'SET_COMPARISON':
      return { ...state, comparison: action.payload };
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history].slice(0, 50) };
    case 'REMOVE_HISTORY':
      return { ...state, history: state.history.filter(h => h.id !== action.payload) };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    default:
      return state;
  }
}

// ── Context ──
const AppContext = createContext(null);

// ── Provider component ──
export function AppProvider({ children }) {
  const persisted = loadPersistedState();
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    ...persisted,
  });

  // Persist language preference
  useEffect(() => {
    try { localStorage.setItem('expatcalc_lang', state.language); } catch (e) {}
  }, [state.language]);

  // Persist & apply dark mode
  useEffect(() => {
    try { localStorage.setItem('expatcalc_dark', String(state.darkMode)); } catch (e) {}
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
  }, [state.darkMode]);

  return html`
    <${AppContext.Provider} value=${{ state, dispatch }}>
      ${children}
    </${AppContext.Provider}>
  `;
}

// ── Hook ──
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
