/* ══════════════════════════════════════════════════════════
   ExpatCalc — CalculatorPage Component
   Generic calculator page: reads a country config and
   renders SalaryInput, ResultPanel, BreakdownTable, DonutChart,
   EmployerCostBars.
   ══════════════════════════════════════════════════════════ */

import { html, React, useSearchParams } from '../app/deps.js';
import SalaryInput from './SalaryInput.js';
import ResultPanel from './ResultPanel.js';
import BreakdownTable from './BreakdownTable.js';
import DonutChart from './DonutChart.js';
import EmployerCostBars from './EmployerCostBars.js';
import HistoryPanel from './HistoryPanel.js';
import { fetchExchangeRates, getRate } from '../app/exchangeRate.js';
import { formatNumber } from '../app/utils.js';

const { useState, useMemo, useCallback, useEffect, useRef } = React;

// Parse URL search params into initial state
function parseUrlState(searchParams, country) {
  const defaults = country.defaultOptions();
  const salary = parseInt(searchParams.get('gross')) || country.salaryRange.default;
  const calcMode = ['gross', 'net', 'total'].includes(searchParams.get('mode')) ? searchParams.get('mode') : 'gross';

  // Parse options from URL
  const opts = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const val = searchParams.get(key);
    if (val === null) continue;
    if (typeof defaults[key] === 'boolean') {
      opts[key] = val === '1' || val === 'true';
    } else if (typeof defaults[key] === 'number') {
      const n = parseFloat(val);
      if (!isNaN(n)) opts[key] = n;
    } else {
      opts[key] = val;
    }
  }

  return { salary, calcMode, opts };
}

export default function CalculatorPage({ country }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialState = useRef(parseUrlState(searchParams, country));

  const [salary, setSalary] = useState(initialState.current.salary);
  const [calcMode, setCalcMode] = useState(initialState.current.calcMode);
  const [options, setOptions] = useState(initialState.current.opts);

  // Currency toggle state
  const [displayCurrency, setDisplayCurrency] = useState(country.currency);
  const [exchangeRate, setExchangeRate] = useState(null);

  // Sync state to URL (debounced)
  const urlTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      const params = { gross: String(salary), mode: calcMode };
      const defaults = country.defaultOptions();
      for (const [key, val] of Object.entries(options)) {
        if (val !== defaults[key]) {
          params[key] = typeof val === 'boolean' ? (val ? '1' : '0') : String(val);
        }
      }
      setSearchParams(params, { replace: true });
    }, 300);
    return () => clearTimeout(urlTimerRef.current);
  }, [salary, calcMode, options, country.id]);

  // Reset state when country changes
  useEffect(() => {
    // On country change, check if URL has state for the new country
    const urlState = parseUrlState(searchParams, country);
    const hasUrlState = searchParams.has('gross');
    setSalary(hasUrlState ? urlState.salary : country.salaryRange.default);
    setCalcMode(hasUrlState ? urlState.calcMode : 'gross');
    setOptions(hasUrlState ? urlState.opts : country.defaultOptions());
    setDisplayCurrency(country.currency);
    setExchangeRate(null);

    if (country.currency !== 'EUR') {
      fetchExchangeRates().then(rates => {
        if (rates && rates[country.currency]) {
          setExchangeRate(rates[country.currency]);
        }
      });
    }
  }, [country.id]);

  // Sync dependent options when parent options change
  const handleOptionChange = useCallback((id, value) => {
    setOptions(prev => {
      const next = { ...prev, [id]: value };

      if (id === 'children') {
        if (value === 0) {
          // Reset all child-dependent options
          if ('beneficiaryChildren' in next) { next.beneficiaryChildren = 0; }
          if ('singleParent' in next) { next.singleParent = false; }
          if ('disabledChild' in next) { next.disabledChild = false; }
          if ('childrenU25' in next) { next.childrenU25 = 0; }
        } else {
          // Clamp dependent counters
          if ('beneficiaryChildren' in next) {
            if (next.beneficiaryChildren > value) {
              next.beneficiaryChildren = value;
            } else if (prev.children < value && prev.beneficiaryChildren === prev.children) {
              next.beneficiaryChildren = value;
            }
          }
          if ('childrenU25' in next) {
            if (prev.children < value) {
              // Auto-increment childrenU25 when adding children
              next.childrenU25 = value;
            } else if (next.childrenU25 > value) {
              next.childrenU25 = value;
            }
          }
        }
      }
      if (id === 'beneficiaryChildren') {
        next.beneficiaryChildren = Math.min(value, next.children);
      }
      if (id === 'childrenU25') {
        next.childrenU25 = Math.min(value, next.children);
      }
      return next;
    });
  }, []);

  // Compute the effective gross based on calc mode
  const gross = useMemo(() => {
    if (calcMode === 'gross') return salary;
    if (calcMode === 'net') return country.reverseFromNet(salary, options);
    if (calcMode === 'total') return country.reverseFromTotal(salary, options);
    return salary;
  }, [salary, calcMode, options, country]);

  // Compute full breakdown
  const breakdown = useMemo(() => {
    return country.computeBreakdown(gross, options);
  }, [gross, options, country]);

  // Chart data
  const donutSegments = useMemo(() => country.getDonutSegments(breakdown), [breakdown, country]);
  const breakdownRows = useMemo(() => country.getBreakdownRows(breakdown), [breakdown, country]);
  const employerBars = useMemo(() => country.getEmployerBars(breakdown), [breakdown, country]);
  const netPct = breakdown.gross > 0 ? Math.round(breakdown.netSalary / breakdown.gross * 100) : 0;

  // Currency conversion helpers
  const isEurMode = displayCurrency === 'EUR' && exchangeRate != null;
  const convert = useCallback(
    (amount) => isEurMode ? amount / exchangeRate : amount,
    [isEurMode, exchangeRate]
  );

  const showToggle = country.currency !== 'EUR' && exchangeRate != null;
  const activeCurrency = isEurMode ? 'EUR' : country.currency;

  // Convert display data
  const displayBreakdown = useMemo(() => {
    if (!isEurMode) return breakdown;
    const converted = {};
    for (const [key, val] of Object.entries(breakdown)) {
      if (typeof val === 'number') {
        converted[key] = val / exchangeRate;
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        const inner = {};
        for (const [k2, v2] of Object.entries(val)) {
          inner[k2] = typeof v2 === 'number' ? v2 / exchangeRate : v2;
        }
        converted[key] = inner;
      } else {
        converted[key] = val;
      }
    }
    return converted;
  }, [breakdown, isEurMode, exchangeRate]);

  const displayDonut = useMemo(() =>
    isEurMode ? donutSegments.map(s => ({ ...s, value: convert(s.value) })) : donutSegments,
    [donutSegments, isEurMode, convert]
  );

  const displayRows = useMemo(() =>
    isEurMode ? breakdownRows.map(r => r.type === 'section' ? r : { ...r, amount: convert(r.amount) }) : breakdownRows,
    [breakdownRows, isEurMode, convert]
  );

  const displayBars = useMemo(() =>
    isEurMode ? employerBars.map(b => ({ ...b, value: convert(b.value) })) : employerBars,
    [employerBars, isEurMode, convert]
  );

  // Set country accent CSS custom properties
  useEffect(() => {
    document.documentElement.style.setProperty('--country-accent', country.accentColor);
    document.documentElement.style.setProperty('--country-accent-hover', country.accentSecondary);
  }, [country]);

  return html`
    <div data-country=${country.id}>
      <div class="page-header">
        <h1>${country.flag} ${country.name} Salary Calculator</h1>
        <p class="subtitle">${country.localName} · ${country.currency} · Tax year 2026</p>
        ${showToggle && html`
          <div class="currency-toggle-wrap">
            <div class="currency-toggle">
              <button
                class="currency-toggle-btn ${displayCurrency === country.currency ? 'active' : ''}"
                onClick=${() => setDisplayCurrency(country.currency)}
              >${country.currency}</button>
              <button
                class="currency-toggle-btn ${displayCurrency === 'EUR' ? 'active' : ''}"
                onClick=${() => setDisplayCurrency('EUR')}
              >EUR</button>
            </div>
            <span class="currency-rate-info">1 EUR = ${formatNumber(exchangeRate)} ${country.currency}</span>
          </div>
        `}
      </div>

      <div class="calc-grid">
        <!-- Left column: inputs (always in local currency) -->
        <div>
          <${SalaryInput}
            country=${country}
            salary=${salary}
            calcMode=${calcMode}
            options=${options}
            onSalaryChange=${setSalary}
            onCalcModeChange=${setCalcMode}
            onOptionChange=${handleOptionChange}
          />
        </div>

        <!-- Right column: results -->
        <div>
          <${ResultPanel}
            breakdown=${displayBreakdown}
            country=${country}
            displayCurrency=${activeCurrency}
          />
        </div>

        <!-- Full width: charts and breakdown -->
        <div class="full-width">
          <div class="charts-row">
            <${DonutChart}
              segments=${displayDonut}
              total=${convert(breakdown.gross)}
              centerLabel=${netPct + '%'}
              centerSub="net ratio"
              currency=${activeCurrency}
            />
            <${EmployerCostBars}
              bars=${displayBars}
              total=${convert(breakdown.totalEmployerCost)}
              currency=${activeCurrency}
            />
          </div>
        </div>

        <div class="full-width">
          <${BreakdownTable}
            rows=${displayRows}
            currency=${activeCurrency}
          />
        </div>

        <div class="full-width">
          <${HistoryPanel}
            country=${country}
            breakdown=${breakdown}
            salary=${salary}
            calcMode=${calcMode}
            options=${options}
          />
        </div>
      </div>
    </div>
  `;
}
