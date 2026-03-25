# ExpatCalc React Redesign Plan

## Overview

Rebuild ExpatCalc from a collection of standalone HTML pages into a unified React single-page application with a modern dashboard aesthetic — while keeping it deployable as static files (no server, no build step required in production).

---

## 1. Technology Stack

### Core
- **React 18** via CDN (`react`, `react-dom`)
- **HTM** (tagged template alternative to JSX — no Babel/build step needed, runs natively in the browser)
- **React Router** (hash-based routing via CDN, so `index.html#/hungary` works from static files)

### Styling
- **CSS Modules pattern** via a single `styles.css` with BEM-like naming, or inline styles in components
- **CSS custom properties** for theming (light/dark mode, per-country accent colors)
- **No Tailwind** (requires a build step) — instead, a hand-crafted design system in CSS

### Charts
- **Recharts** via CDN (React-native charting, replaces current canvas-based charts)
- Alternatively: **Chart.js with react-chartjs-2** if Recharts CDN proves tricky

### Why this works without a build step
HTM lets you write JSX-like syntax as tagged template literals. Instead of `<div className="card">` needing Babel, you write `html\`<div class="card">\`` — same readability, zero compilation. React, ReactDOM, React Router, and Recharts are all available as UMD/ESM bundles from CDNs like esm.sh or unpkg.

---

## 2. File Structure (New)

```
expatcalc/
├── index.html                  ← Single entry point (loads React app)
├── styles/
│   ├── design-system.css       ← Colors, typography, spacing tokens
│   ├── components.css          ← Component-level styles (cards, inputs, charts)
│   ├── dashboard.css           ← Dashboard layout (sidebar, grid, panels)
│   └── countries.css           ← Per-country accent color overrides
├── app/
│   ├── main.js                 ← App entry: React root, router setup
│   ├── store.js                ← Shared state (React Context for settings, language, history)
│   └── utils.js                ← Formatting helpers (currency, percentages, number formatting)
├── components/
│   ├── Shell.js                ← App shell: sidebar + topbar + content area
│   ├── Sidebar.js              ← Persistent sidebar with country list, search, settings
│   ├── Topbar.js               ← Breadcrumb, language switcher, dark mode toggle
│   ├── CountryCard.js          ← Homepage card for each country (flag, name, quick stats)
│   ├── SalaryInput.js          ← Gross salary slider + input + mode tabs (gross/net)
│   ├── ResultPanel.js          ← Net salary hero number with odometer animation
│   ├── BreakdownTable.js       ← Itemized deduction table
│   ├── DonutChart.js           ← Tax/contribution donut visualization
│   ├── CurveChart.js           ← Net-vs-gross and effective-tax-rate line charts
│   ├── EmployerCostBars.js     ← Horizontal bar chart for employer-side costs
│   ├── AnnualOverview.js       ← Annual summary with segmented bar + stat boxes
│   ├── ComparisonView.js       ← NEW: Side-by-side country comparison dashboard
│   ├── HistoryPanel.js         ← Save/load calculation history (localStorage)
│   └── OptionToggle.js         ← Reusable toggle/select for tax options
├── countries/
│   ├── registry.js             ← Master country list (replaces nav.js COUNTRIES array)
│   ├── hungary.js              ← Hungary: config + computeBreakdown() + country-specific options
│   ├── germany.js              ← Germany: config + computeBreakdown()
│   ├── netherlands.js          ← Netherlands: config + computeBreakdown()
│   ├── portugal.js             ← Portugal: config + computeBreakdown()
│   ├── spain.js                ← Spain: config + computeBreakdown()
│   ├── belgium.js              ← Belgium: config + computeBreakdown()
│   ├── slovakia.js             ← Slovakia: config + computeBreakdown()
│   └── poland.js               ← Poland: config + computeBreakdown()
├── assets/
│   ├── europe-map.svg          ← Existing map (kept, used in homepage)
│   └── icons/                  ← Small SVG icons for the UI
└── legacy/                     ← Archive of current HTML files (for reference during migration)
```

---

## 3. Architecture Design

### 3.1 Single-Page App with Hash Routing

Instead of separate HTML files per country, one `index.html` loads the React app. Routes like `#/hungary`, `#/germany` render the appropriate calculator. This means:
- One shared layout (sidebar always visible)
- Instant country switching (no page reload)
- Shared state persists across navigation (language, dark mode, comparison selections)

### 3.2 Country as Configuration

Each country file (`countries/hungary.js`) exports a **config object**, not an HTML page. This is the biggest architectural win:

```js
// countries/hungary.js
export default {
  id: 'hungary',
  name: 'Hungary',
  localName: 'Magyarország',
  flag: '🇭🇺',
  currency: 'HUF',
  locale: 'hu-HU',
  accentColor: '#c8a44e',
  accentSecondary: '#8b1a3a',
  supportedLangs: ['en', 'hu'],

  // Tax configuration
  salaryRange: { min: 100000, max: 5000000, step: 10000, default: 600000 },

  options: [
    { id: 'under25', type: 'toggle', label: 'Under 25 tax exemption' },
    { id: 'newlyMarried', type: 'toggle', label: 'Newly married tax credit' },
    { id: 'children', type: 'stepper', label: 'Number of children', min: 0, max: 6 },
  ],

  // The actual computation — pure function, easy to test
  computeBreakdown(gross, options) {
    // ... all tax logic lives here
    return { net, incomeTax, socialSecurity, employerCost, items: [...] }
  },

  // Optional: country-specific result cards
  extraCards: [
    { id: 'familyBenefit', label: 'Family Tax Benefit (SZJA kedvezmény)', render: (breakdown) => ... }
  ]
}
```

**Adding a new country = creating one config file + registering it.** No HTML, no CSS, no copy-pasting templates.

### 3.3 State Management (React Context)

A lightweight context provider wraps the app:

```
AppContext
├── language: 'en' | 'hu' | 'de' | ...
├── darkMode: true/false
├── history: saved calculations[]
├── comparison: { countries: [], gross: number }  ← for comparison view
└── settings: { currency display, animation prefs }
```

No Redux needed — Context + useReducer is sufficient for this scale.

---

## 4. Visual Design: Dashboard Aesthetic

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│  [≡]  ExpatCalc          [EN ▾]  [🌙]  [Compare]        │  ← Topbar
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  🏠 Home   │   ┌─────────────┐  ┌─────────────────────┐ │
│            │   │  Gross      │  │  Net Salary          │ │
│  🇭🇺 Hungary│   │  Salary     │  │  ████████ €2,847    │ │
│  🇩🇪 Germany│   │  Input      │  │                     │ │
│  🇳🇱 Nether.│   │  ┄┄┄┄┄┄┄┄  │  │  Summary boxes      │ │
│  🇵🇹 Portugal│  │  Options    │  │  ┌───┐┌───┐┌───┐   │ │
│  🇪🇸 Spain  │   │  ┄┄┄┄┄┄┄┄  │  │  │   ││   ││   │   │ │
│  🇧🇪 Belgium│   │  Family     │  │  └───┘└───┘└───┘   │ │
│  🇸🇰 Slovakia│  └─────────────┘  └─────────────────────┘ │
│  🇵🇱 Poland │   ┌──────────────────────────────────────┐ │
│            │   │  Charts: Donut │ Curve │ Employer     │ │
│  ──────    │   └──────────────────────────────────────┘ │
│  ⚙ Settings│   ┌──────────────────────────────────────┐ │
│  📊 Compare│   │  Breakdown Table                      │ │
│            │   └──────────────────────────────────────┘ │
└────────────┴─────────────────────────────────────────────┘
```

**Key layout principles:**
- Persistent left sidebar (collapsible on mobile → hamburger)
- Content area uses a **responsive grid**: 2-column on desktop (inputs left, results right), single column on mobile
- Cards with subtle shadows, rounded corners (12px), consistent padding
- Data-first: numbers are large and prominent, labels are secondary

### 4.2 Color System

```css
/* Design tokens */
--gray-50: #f9fafb;     --gray-900: #111827;
--blue-500: #3b82f6;    --blue-600: #2563eb;
--green-500: #10b981;   --red-500: #ef4444;
--purple-500: #8b5cf6;

/* Semantic tokens */
--bg-primary: var(--gray-50);          /* Light mode */
--bg-card: #ffffff;
--bg-sidebar: #1e293b;                 /* Dark sidebar always */
--text-primary: var(--gray-900);
--text-secondary: #6b7280;
--border: #e5e7eb;
--accent: var(--country-accent, var(--blue-500));  /* Country-driven */

/* Dark mode overrides */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --border: #334155;
}
```

Each country sets `--country-accent` and `--country-accent-secondary`, which tint the result panel, chart colors, and active states. This gives each country a distinct feel without separate stylesheets.

### 4.3 Typography

- **Headings**: Inter or Plus Jakarta Sans (clean, geometric, dashboard-friendly)
- **Body/numbers**: System font stack for speed, or Inter
- **Large numbers** (net salary): Tabular numerals, 2.5rem+, semi-bold
- **Labels**: 0.75rem, uppercase tracking, muted color

### 4.4 Component Styling Details

**Cards**: White (light) or slate-800 (dark), 1px border, 12px radius, 24px padding, subtle shadow on hover

**Inputs**: Clean bordered inputs, custom-styled range sliders with the country accent color, segmented controls for tabs (gross/net mode)

**Charts**: Muted color palettes, subtle gridlines, smooth animations on data change, tooltips on hover

**Tables**: Alternating row shading, sticky header, right-aligned numbers with tabular figures

**Sidebar**: Dark background always (even in light mode), country flags as visual anchors, active state with left accent border + subtle background

---

## 5. New Features (Enabled by React)

### 5.1 Country Comparison View
Side-by-side comparison of 2-4 countries at the same gross salary. Shows net salary, tax rate, and employer cost in a unified table + overlaid charts. This is impossible with the current per-page architecture but trivial with shared state.

### 5.2 Dark Mode
Toggle between light and dark themes. Persisted in localStorage. The current site is dark-only; this gives users a choice.

### 5.3 Instant Country Switching
Click a country in the sidebar → results update instantly (no page load). The salary input value carries over, so you can quickly see "what would I earn in Germany vs. Hungary at the same gross?"

### 5.4 Better Mobile Experience
The current site works on mobile but the sidebar/nav is clunky. The new design uses a proper responsive shell: sidebar collapses to a bottom sheet or hamburger drawer, inputs stack vertically, charts resize gracefully.

### 5.5 URL-Driven State
Hash routes encode the current view: `#/hungary?gross=600000&children=2`. Shareable, bookmarkable, and supports browser back/forward.

---

## 6. Migration Strategy (Phased)

### Phase 1: Foundation (Estimated: 1-2 sessions)
1. Set up `index.html` with CDN imports (React, ReactDOM, HTM, React Router)
2. Create the design system CSS (tokens, base styles)
3. Build the Shell, Sidebar, and Topbar components
4. Implement hash routing with placeholder pages
5. **Milestone**: App shell renders, you can navigate between empty country pages

### Phase 2: Core Calculator (Estimated: 2-3 sessions)
1. Extract computation logic from Hungary (the most feature-rich calculator) into `countries/hungary.js`
2. Build the shared calculator components: SalaryInput, ResultPanel, BreakdownTable, DonutChart
3. Wire up the generic `CalculatorPage` that reads a country config and renders the right components
4. Verify Hungary matches the current output exactly
5. **Milestone**: Hungary calculator fully working in React

### Phase 3: All Countries (Estimated: 2-3 sessions)
1. Extract computation logic from each remaining country into config files
2. Test each country against the current HTML versions to ensure accuracy
3. Handle country-specific quirks (Germany's tax classes, Belgium's regions, etc.) via the `options` config pattern
4. **Milestone**: All 8 countries working, feature parity with current site

### Phase 4: Homepage & Polish (Estimated: 1-2 sessions)
1. Redesign the homepage: interactive Europe map + country cards grid
2. Implement dark mode toggle + persistence
3. Add smooth transitions between routes
4. Odometer animation for the net salary number
5. History system (save/load from localStorage)
6. **Milestone**: Visually polished, all features working

### Phase 5: New Features (Estimated: 1-2 sessions)
1. Build the ComparisonView (multi-country side-by-side)
2. URL state encoding (shareable links)
3. Keyboard shortcuts (arrow keys to switch countries, etc.)
4. Performance pass: lazy-load country configs, optimize chart rendering
5. **Milestone**: Ship-ready

---

## 7. Key Design Decisions & Trade-offs

| Decision | Choice | Why |
|---|---|---|
| No build step | HTM + CDN imports | User requires static file deployment. HTM gives JSX-like DX without Babel. |
| Hash routing (not browser history) | `#/country` | Works with `file://` protocol — no server needed |
| CSS custom properties (not CSS-in-JS) | Single CSS file with tokens | No runtime cost, works without build tools, easy to theme |
| Recharts (not D3 directly) | React-native charts | Declarative, works with React state, less boilerplate than D3 |
| Context API (not Redux/Zustand) | React built-in | App state is simple enough; no external dependency needed |
| Country-as-config pattern | Config objects with compute functions | Decouples UI from tax logic; adding a country = one file |

---

## 8. Risk Mitigation

**Risk: CDN dependency**
All CDN scripts should have `integrity` hashes and a local fallback copy in `assets/vendor/` for offline use.

**Risk: HTM unfamiliarity**
HTM syntax is 95% identical to JSX. Main difference: use `class` not `className`, and template literals instead of curly braces for expressions. A quick reference comment at the top of each file will help.

**Risk: Computation accuracy during migration**
Each country's `computeBreakdown()` should be extracted as-is from the current HTML and wrapped in a test harness. Run known input/output pairs to verify no regressions.

**Risk: Performance with no code-splitting**
The entire app loads at once since there's no build step. Mitigate by: keeping country configs lightweight (just data + functions), lazy-loading charts only when scrolled into view, and using `React.memo` on expensive components.

---

## 9. What Stays the Same

- **All tax computation logic** — extracted but not rewritten
- **europe-map.svg** — reused on the homepage
- **localStorage history system** — same concept, cleaner implementation
- **Language support** — same translations, now driven by Context
- **The essence of each country's visual identity** — accent colors preserved as CSS custom properties
