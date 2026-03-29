/* ══════════════════════════════════════════════════════════
   ExpatCalc — EuropeMap Component
   Interactive SVG Europe map with clickable countries.
   Loads europe-map.svg, highlights available countries,
   tooltips on hover, navigates on click.
   ══════════════════════════════════════════════════════════ */

import { html, React, useNavigate } from '../app/deps.js';
import { useApp } from '../app/store.js';
import COUNTRIES from '../countries/registry.js';

const { useState, useEffect, useRef, useCallback } = React;

// ISO-3 code → country registry id mapping
const ISO3_TO_ID = {
  HUN: 'hungary',
  DEU: 'germany',
  NLD: 'netherlands',
  PRT: 'portugal',
  ESP: 'spain',
  BEL: 'belgium',
  SVK: 'slovakia',
  POL: 'poland',
  GBR: 'uk',      // United Kingdom — 2025/26 income tax calculator added
  IRL: 'ireland',  // Ireland — 2026 income tax, USC, PRSI calculator
  FRA: 'france',   // France — 2026 social contributions, PAS, barème progressif
};

// Map multi-part countries: when one code is hovered, highlight all related codes
const MULTI_PART_COUNTRIES = {
  CYP: ['CYP', 'CYN'],  // Cyprus + Northern Cyprus
  CYN: ['CYP', 'CYN'],  // Northern Cyprus + Cyprus
};

// Coming-soon countries: EU, EEA, Switzerland, Ukraine, and the Balkans only.
// Countries outside these regions (Russia, Belarus, Turkey, Moldova, Andorra, Monaco) get no tooltip.
const OTHER_COUNTRIES = {
  // EU
  NOR: 'Norway', SWE: 'Sweden', FIN: 'Finland', DNK: 'Denmark',
  AUT: 'Austria', CZE: 'Czech Republic',
  ITA: 'Italy', SVN: 'Slovenia', HRV: 'Croatia', GRC: 'Greece',
  BGR: 'Bulgaria', ROU: 'Romania', LTU: 'Lithuania', LVA: 'Latvia',
  EST: 'Estonia', LUX: 'Luxembourg', MLT: 'Malta', CYP: 'Cyprus',
  // EEA (non-EU)
  ISL: 'Iceland',
  // Switzerland
  CHE: 'Switzerland',
  // Ukraine
  UKR: 'Ukraine',
  // Balkans (non-EU)
  BIH: 'Bosnia & Herzegovina', SRB: 'Serbia', MNE: 'Montenegro',
  MKD: 'North Macedonia', ALB: 'Albania', XKX: 'Kosovo',
};

export default function EuropeMap() {
  const wrapperRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [svgHtml, setSvgHtml] = useState('');
  const [tooltip, setTooltip] = useState({ text: '', visible: false, x: 0, y: 0 });
  const navigate = useNavigate();
  const { state } = useApp();

  // Load SVG content
  useEffect(() => {
    fetch('europe-map.svg')
      .then(r => r.text())
      .then(svgText => {
        // Parse and mark available countries
        const temp = document.createElement('div');
        temp.innerHTML = svgText;
        const svgEl = temp.querySelector('svg');
        if (!svgEl) return;

        // Strip inline fill/stroke styles from country paths so CSS can control them
        svgEl.querySelectorAll('.region').forEach(path => {
          const s = path.style;
          s.removeProperty('fill');
          s.removeProperty('fill-opacity');
          s.removeProperty('stroke');
          s.removeProperty('stroke-width');
          s.removeProperty('stroke-opacity');
        });

        // Add region-available class to available countries
        Object.keys(ISO3_TO_ID).forEach(code => {
          const paths = svgEl.querySelectorAll('.region.' + code);
          paths.forEach(path => {
            path.classList.add('region-available');
          });
        });

        // Get modified SVG HTML
        setSvgHtml(svgEl.outerHTML);
        setLoaded(true);
      })
      .catch(err => console.error('Failed to load europe-map.svg:', err));
  }, []);

  // Stable ref for navigate so event handlers don't go stale
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Setup interactivity via event delegation (survives innerHTML re-renders)
  useEffect(() => {
    if (!loaded || !wrapperRef.current) return;
    const wrapper = wrapperRef.current;

    function getRegionPath(target) {
      // Walk up from target to find a .region element or a group with country ID (gXXX)
      let el = target;
      while (el && el !== wrapper) {
        if (el.classList && el.classList.contains('region')) return el;
        // Also match groups with IDs like gCYP, gFRA, etc.
        if (el.id && el.id.match(/^g[A-Z]{3}$/)) return el;
        el = el.parentElement;
      }
      return null;
    }

    function getCode(regionEl) {
      let code = null;
      // Try to extract from classes (for .region elements)
      if (regionEl.classList) {
        regionEl.classList.forEach(cls => {
          if (cls !== 'region' && cls !== 'region-available' && cls.length === 3 && /^[A-Z]{3}$/.test(cls)) {
            code = cls;
          }
        });
      }
      // Try to extract from ID (for g-prefixed groups like gCYP)
      if (!code && regionEl.id && regionEl.id.match(/^g([A-Z]{3})$/)) {
        code = RegExp.$1;
      }
      return code;
    }

    function handleMouseOver(e) {
      const regionEl = getRegionPath(e.target);
      if (!regionEl) return;
      const code = getCode(regionEl);
      if (!code) return;

      const isAvailable = ISO3_TO_ID[code];
      let name;
      if (isAvailable) {
        const country = COUNTRIES.find(c => c.id === ISO3_TO_ID[code]);
        name = country ? `${country.flag} ${country.name}` : code;
      } else if (OTHER_COUNTRIES[code]) {
        name = OTHER_COUNTRIES[code] + ' — Coming soon';
      } else {
        return;
      }

      // Only highlight available countries with the blue glow effect
      if (isAvailable) {
        const codesToHighlight = MULTI_PART_COUNTRIES[code] ? MULTI_PART_COUNTRIES[code] : [code];

        codesToHighlight.forEach(c => {
          // For available countries: find .region elements with the code class
          wrapper.querySelectorAll('.region.' + c).forEach(path => {
            path.classList.add('region-map-hover');
          });
          // For coming-soon countries: find the gXXX group and highlight its paths
          const groupEl = document.getElementById('g' + c);
          if (groupEl) {
            groupEl.querySelectorAll('path').forEach(path => {
              path.classList.add('region-map-hover');
            });
          }
        });
      }

      const rect = wrapper.getBoundingClientRect();
      setTooltip({
        text: name,
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    function handleMouseMove(e) {
      const rect = wrapper.getBoundingClientRect();
      setTooltip(prev => prev.visible ? ({
        ...prev,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }) : prev);
    }

    function handleMouseOut(e) {
      const regionEl = getRegionPath(e.target);
      if (!regionEl) return;
      // Only hide if we're leaving the region (not moving between child elements)
      const related = e.relatedTarget;
      if (related && regionEl.contains(related)) return;

      const code = getCode(regionEl);
      if (code) {
        const isAvailable = ISO3_TO_ID[code];
        // Only remove highlight if the country was available (and thus was highlighted)
        if (isAvailable) {
          const codesToUnhighlight = MULTI_PART_COUNTRIES[code] ? MULTI_PART_COUNTRIES[code] : [code];

          codesToUnhighlight.forEach(c => {
            wrapper.querySelectorAll('.region.' + c).forEach(path => {
              path.classList.remove('region-map-hover');
            });
            // Also remove from coming-soon country groups
            const groupEl = document.getElementById('g' + c);
            if (groupEl) {
              groupEl.querySelectorAll('path').forEach(path => {
                path.classList.remove('region-map-hover');
              });
            }
          });
        }
      }

      setTooltip(prev => ({ ...prev, visible: false }));
    }

    function handleClick(e) {
      const regionEl = getRegionPath(e.target);
      if (!regionEl) return;
      const code = getCode(regionEl);
      if (code && ISO3_TO_ID[code]) {
        navigateRef.current('/' + ISO3_TO_ID[code]);
      }
    }

    wrapper.addEventListener('mouseover', handleMouseOver);
    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseout', handleMouseOut);
    wrapper.addEventListener('click', handleClick);

    return () => {
      wrapper.removeEventListener('mouseover', handleMouseOver);
      wrapper.removeEventListener('mousemove', handleMouseMove);
      wrapper.removeEventListener('mouseout', handleMouseOut);
      wrapper.removeEventListener('click', handleClick);
    };
  }, [loaded]);

  // Highlight country on sidebar hover
  useEffect(() => {
    if (!loaded || !wrapperRef.current) return;
    const wrapper = wrapperRef.current;

    // Clear previous highlights
    wrapper.querySelectorAll('.region-sidebar-hover').forEach(el => {
      el.classList.remove('region-sidebar-hover');
    });

    if (!state.hoveredCountry) return;

    // Find the ISO3 code(s) for this country id
    Object.entries(ISO3_TO_ID).forEach(([code, id]) => {
      if (id === state.hoveredCountry) {
        wrapper.querySelectorAll('.region.' + code).forEach(el => {
          el.classList.add('region-sidebar-hover');
        });
      }
    });
  }, [state.hoveredCountry, loaded]);

  return html`
    <div class="europe-map-card">
      <div class="europe-map-wrapper" ref=${wrapperRef}>
        <div
          class="europe-map-tooltip ${tooltip.visible ? 'visible' : ''}"
          style=${{
            left: tooltip.x + 'px',
            top: tooltip.y + 'px',
          }}
        >
          ${tooltip.text}
        </div>

        <!-- Compass rose -->
        <div class="europe-map-compass">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="var(--text-secondary)" stroke-width="1.2" opacity="0.4">
              <circle cx="50" cy="50" r="46"/>
              <circle cx="50" cy="50" r="40" opacity="0.5"/>
              <polygon points="50,6 54,42 50,36 46,42" fill="currentColor" stroke="none" opacity="0.6"/>
              <polygon points="50,94 54,58 50,64 46,58" fill="currentColor" stroke="none" opacity="0.3"/>
              <polygon points="6,50 42,46 36,50 42,54" fill="currentColor" stroke="none" opacity="0.3"/>
              <polygon points="94,50 58,46 64,50 58,54" fill="currentColor" stroke="none" opacity="0.3"/>
              <circle cx="50" cy="50" r="4" fill="currentColor" stroke="none" opacity="0.5"/>
              <circle cx="50" cy="50" r="2" fill="var(--bg-card)" stroke="none"/>
            </g>
            <text x="50" y="3" text-anchor="middle" font-size="7" fill="currentColor" opacity="0.5">N</text>
          </svg>
        </div>

        <div class="europe-map-container" dangerouslySetInnerHTML=${{ __html: svgHtml }} />
        ${!loaded && html`<div class="europe-map-loading">Loading map...</div>`}

        <div class="europe-map-legend">
          <span class="europe-map-legend-item">
            <span class="europe-map-dot available"></span> Available
          </span>
          <span class="europe-map-legend-item">
            <span class="europe-map-dot unavailable"></span> Coming soon
          </span>
        </div>
      </div>
    </div>
  `;
}
