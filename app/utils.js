/* ══════════════════════════════════════════════════════════
   ExpatCalc — Utility Helpers
   Currency formatting, number formatting, percentages
   ══════════════════════════════════════════════════════════ */

/**
 * Format a number with space-separated thousands.
 * @param {number} n
 * @returns {string}
 */
export function formatNumber(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Format a number as currency.
 * @param {number} n
 * @param {string} currency - Currency code (EUR, HUF, etc.)
 * @param {string} locale - Locale string
 * @returns {string}
 */
export function formatCurrency(n, currency = 'EUR', locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch (e) {
    // Fallback
    const symbols = { EUR: '€', HUF: 'Ft', PLN: 'zł', CZK: 'Kč', GBP: '£' };
    return formatNumber(n) + ' ' + (symbols[currency] || currency);
  }
}

/**
 * Format a percentage.
 * @param {number} n - Value between 0 and 100
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(n, decimals = 1) {
  return n.toFixed(decimals) + '%';
}

/**
 * Clamp a number between min and max.
 */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Generate a short unique ID.
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}
