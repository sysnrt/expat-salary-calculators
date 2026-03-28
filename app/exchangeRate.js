/* ══════════════════════════════════════════════════════════
   ExpatCalc — Exchange Rate Service
   Fetches EUR exchange rates from Frankfurter API (ECB data).
   Caches in localStorage, refreshes daily.
   ══════════════════════════════════════════════════════════ */

const CACHE_KEY = 'expatcalc_fx_rates';
const API_URL = 'https://api.frankfurter.app/latest?from=EUR&to=HUF,PLN';

let ratesCache = null; // { HUF: 408.5, PLN: 4.28, fetchedDate: '2026-03-27' }

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.rates && parsed.fetchedDate) return parsed;
  } catch (e) { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

export async function fetchExchangeRates() {
  // Return module cache if fresh (same day)
  if (ratesCache && ratesCache.fetchedDate === todayStr()) {
    return ratesCache.rates;
  }

  // Check localStorage
  const stored = loadFromStorage();
  if (stored && stored.fetchedDate === todayStr()) {
    ratesCache = stored;
    return stored.rates;
  }

  // Fetch from API
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // API returns { base: 'EUR', date: '...', rates: { HUF: 408.5, PLN: 4.28 } }
    const cacheEntry = { rates: data.rates, fetchedDate: todayStr() };
    ratesCache = cacheEntry;
    saveToStorage(cacheEntry);
    return data.rates;
  } catch (e) {
    console.warn('Exchange rate fetch failed:', e);
    // Fall back to stale cache if available
    if (stored && stored.rates) {
      ratesCache = stored;
      return stored.rates;
    }
    return null;
  }
}

export function getRate(currency) {
  if (!ratesCache || !ratesCache.rates) return null;
  return ratesCache.rates[currency] || null;
}
