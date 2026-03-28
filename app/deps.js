/* ══════════════════════════════════════════════════════════
   ExpatCalc — Dependency Re-exports
   All external libraries loaded via esm.sh (ESM CDN).
   This is the single point of truth for external imports.
   ══════════════════════════════════════════════════════════ */

// These are resolved via the import map defined in index.html
export { default as React } from 'react';
export * as ReactDOM from 'react-dom/client';
export { default as htm } from 'htm';

import React from 'react';
import htm from 'htm';

// HTM bound to React.createElement — use html`` instead of JSX
export const html = htm.bind(React.createElement);

// React Router
export {
  HashRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
