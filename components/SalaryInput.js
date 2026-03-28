/* ══════════════════════════════════════════════════════════
   ExpatCalc — SalaryInput Component
   Gross salary slider + text input + calc mode tabs + options
   ══════════════════════════════════════════════════════════ */

import { html, React } from '../app/deps.js';
import { formatNumber } from '../app/utils.js';

const { useState, useEffect, useCallback } = React;

function OptionSelect({ option, value, onChange }) {
  return html`
    <div class="option-row">
      <div class="option-info">
        <div class="option-label">${option.label}</div>
        ${option.sublabel && html`<div class="option-sublabel">${option.sublabel}</div>`}
      </div>
      <select
        class="option-select"
        value=${value}
        onChange=${(e) => onChange(option.id, e.target.value)}
      >
        ${option.choices.map(c => html`
          <option key=${c.value} value=${c.value}>${c.label}</option>
        `)}
      </select>
    </div>
  `;
}

function OptionNumber({ option, value, onChange }) {
  return html`
    <div class="option-row">
      <div class="option-info">
        <div class="option-label">${option.label}</div>
        ${option.sublabel && html`<div class="option-sublabel">${option.sublabel}</div>`}
      </div>
      <input
        type="number"
        class="option-number-input"
        value=${value}
        min=${option.min}
        max=${option.max}
        step=${option.step || 1}
        onChange=${(e) => onChange(option.id, parseFloat(e.target.value) || 0)}
      />
    </div>
  `;
}

function OptionToggle({ option, value, onChange, disabled }) {
  return html`
    <div class="option-row ${disabled ? 'option-disabled' : ''}">
      <div class="option-info">
        <div class="option-label">${option.label}</div>
        ${option.sublabel && html`<div class="option-sublabel">${option.sublabel}</div>`}
      </div>
      <label class="toggle">
        <input
          type="checkbox"
          checked=${value}
          disabled=${disabled}
          onChange=${(e) => onChange(option.id, e.target.checked)}
        />
        <span class="toggle-slider" />
      </label>
    </div>
  `;
}

function OptionText({ option, value, onChange }) {
  return html`
    <div class="option-row">
      <div class="option-info">
        <div class="option-label">${option.label}</div>
        ${option.sublabel && html`<div class="option-sublabel">${option.sublabel}</div>`}
      </div>
      <input
        type="text"
        class="option-text-input"
        value=${value || ''}
        placeholder=${option.placeholder || ''}
        onInput=${(e) => onChange(option.id, e.target.value)}
        style=${{ width: '100px', textTransform: 'uppercase' }}
      />
    </div>
  `;
}

function OptionCounter({ option, value, onChange, max }) {
  const effectiveMax = max != null ? max : (option.max || 10);
  return html`
    <div class="option-row">
      <div class="option-info">
        <div class="option-label">${option.label}</div>
        ${option.sublabel && html`<div class="option-sublabel">${option.sublabel}</div>`}
      </div>
      <div class="counter-control">
        <button
          class="counter-btn"
          onClick=${() => onChange(option.id, Math.max(option.min || 0, value - 1))}
          disabled=${value <= (option.min || 0)}
        >-</button>
        <span class="counter-value">${value}</span>
        <button
          class="counter-btn"
          onClick=${() => onChange(option.id, Math.min(effectiveMax, value + 1))}
          disabled=${value >= effectiveMax}
        >+</button>
      </div>
    </div>
  `;
}

export default function SalaryInput({ country, salary, calcMode, options, onSalaryChange, onCalcModeChange, onOptionChange }) {
  const range = country.salaryRange;

  const [sliderValue, setSliderValue] = useState(salary);

  useEffect(() => {
    setSliderValue(salary);
  }, [salary]);

  const handleSliderInput = useCallback((e) => {
    setSliderValue(parseInt(e.target.value));
  }, []);

  const handleSliderCommit = useCallback((e) => {
    onSalaryChange(parseInt(e.target.value));
  }, [onSalaryChange]);

  const handleInputChange = useCallback((e) => {
    const raw = e.target.value.replace(/\s/g, '');
    const v = parseInt(raw) || 0;
    onSalaryChange(v);
  }, [onSalaryChange]);

  const handleInputBlur = useCallback((e) => {
    const raw = e.target.value.replace(/\s/g, '');
    const v = parseInt(raw) || 0;
    const clamped = Math.max(range.min, Math.min(v, range.max * 2));
    onSalaryChange(clamped);
  }, [onSalaryChange, range]);

  // Check visibility of an option based on its showWhen condition
  const isVisible = (opt) => {
    if (!opt.showWhen) return true;
    if (typeof opt.showWhen === 'function') return opt.showWhen(options);
    // String: show when that option is truthy/> 0
    return !!options[opt.showWhen];
  };

  // Categorize options for card grouping
  const personalOptions = country.options.filter(o =>
    (o.type === 'toggle' || o.type === 'select' || o.type === 'number') && !o.showWhen && o.id !== 'children' && !o.dependsOn
  );
  const conditionalOptions = country.options.filter(o =>
    (o.type === 'toggle' || o.type === 'select' || o.type === 'number') && o.showWhen && o.id !== 'children' && !o.dependsOn
  );
  const counterOptions = country.options.filter(o => o.type === 'counter');
  const conditionalCounters = country.options.filter(o => o.type === 'counter' && o.showWhen);
  const familyToggles = country.options.filter(o => o.type === 'toggle' && o.showWhen === 'children');

  // Render a single option based on type
  const renderOption = (opt) => {
    if (!isVisible(opt)) return null;
    if (opt.type === 'select') return html`<${OptionSelect} key=${opt.id} option=${opt} value=${options[opt.id]} onChange=${onOptionChange} />`;
    if (opt.type === 'number') return html`<${OptionNumber} key=${opt.id} option=${opt} value=${options[opt.id]} onChange=${onOptionChange} />`;
    if (opt.type === 'toggle') return html`<${OptionToggle} key=${opt.id} option=${opt} value=${options[opt.id]} onChange=${onOptionChange} />`;
    if (opt.type === 'counter') return html`<${OptionCounter} key=${opt.id} option=${opt} value=${options[opt.id]} onChange=${onOptionChange} max=${opt.dependsOn ? options[opt.dependsOn] : undefined} />`;
    if (opt.type === 'text') return html`<${OptionText} key=${opt.id} option=${opt} value=${options[opt.id]} onChange=${onOptionChange} />`;
    return null;
  };

  // All non-counter personal options (including conditional selects/numbers like health sub-fields)
  const allPersonalOpts = [...personalOptions, ...conditionalOptions];

  return html`
    <div class="calc-inputs">
      <!-- Salary Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-icon orange">💰</div>
          <div class="card-title">Gross Salary</div>
        </div>

        <div class="salary-display num">
          ${formatNumber(sliderValue)} <span class="salary-currency">${country.currency}/month</span>
        </div>

        <input
          type="range"
          class="salary-slider"
          min=${range.min}
          max=${range.max}
          step=${range.step}
          value=${Math.min(sliderValue, range.max)}
          onInput=${handleSliderInput}
          onMouseUp=${handleSliderCommit}
          onTouchEnd=${handleSliderCommit}
        />
        <div class="range-labels">
          <span>${formatNumber(range.min)}</span>
          <span>${formatNumber(range.max)}</span>
        </div>

        <div class="salary-input-wrapper">
          <input
            type="text"
            class="salary-text-input"
            value=${formatNumber(salary)}
            onInput=${handleInputChange}
            onBlur=${handleInputBlur}
            placeholder="Enter amount..."
          />
        </div>

        <div class="calc-mode-tabs">
          ${['gross', 'net', 'total'].map(mode => html`
            <button
              key=${mode}
              class=${'calc-mode-tab' + (calcMode === mode ? ' active' : '')}
              onClick=${() => onCalcModeChange(mode)}
            >
              ${mode === 'gross' ? 'From Gross' : mode === 'net' ? 'From Net' : 'From Total Cost'}
            </button>
          `)}
        </div>
      </div>

      <!-- Personal Options Card -->
      ${allPersonalOpts.length > 0 && html`
        <div class="card">
          <div class="card-header">
            <div class="card-icon purple">👤</div>
            <div class="card-title">Personal Details</div>
          </div>
          ${allPersonalOpts.map(renderOption)}
        </div>
      `}

      <!-- Family Options Card -->
      ${counterOptions.length > 0 && html`
        <div class="card">
          <div class="card-header">
            <div class="card-icon green">👨‍👩‍👧‍👦</div>
            <div class="card-title">Family Benefits</div>
          </div>
          ${counterOptions.map(renderOption)}
          ${familyToggles.map(renderOption)}
        </div>
      `}
    </div>
  `;
}
