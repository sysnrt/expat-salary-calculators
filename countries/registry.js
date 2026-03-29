/* ══════════════════════════════════════════════════════════
   ExpatCalc — Country Registry
   Master list of all supported countries.
   Adding a new country = adding an entry here + creating
   a countries/<id>.js config file.
   ══════════════════════════════════════════════════════════ */

const COUNTRIES = [
  {
    id: 'belgium',
    name: 'Belgium',
    localName: 'België',
    flag: '🇧🇪',
    currency: 'EUR',
    locale: 'fr-BE',
    accentColor: '#fdda25',
    accentSecondary: '#000000',
  },
  {
    // France — 2026 tax year (Revenus 2025 / Imposition 2026)
    // Social contributions, PAS withholding, barème progressif with quotient familial
    id: 'france',
    name: 'France',
    localName: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    locale: 'fr-FR',
    accentColor: '#002395',      // French blue (Tricolore)
    accentSecondary: '#ED2939',  // French red (Tricolore)
  },
  {
    id: 'germany',
    name: 'Germany',
    localName: 'Deutschland',
    flag: '🇩🇪',
    currency: 'EUR',
    locale: 'de-DE',
    accentColor: '#dd1100',
    accentSecondary: '#ffcc00',
  },
  {
    // Ireland — 2026 tax year
    // Income tax (IT), USC, PRSI, tax credits, pension relief
    id: 'ireland',
    name: 'Ireland',
    localName: 'Éire',
    flag: '🇮🇪',
    currency: 'EUR',
    locale: 'en-IE',
    accentColor: '#169B62',      // Irish green
    accentSecondary: '#FF883E',  // Irish orange
  },
  {
    id: 'hungary',
    name: 'Hungary',
    localName: 'Magyarország',
    flag: '🇭🇺',
    currency: 'HUF',
    locale: 'hu-HU',
    accentColor: '#c8a44e',
    accentSecondary: '#8b1a3a',
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    localName: 'Nederland',
    flag: '🇳🇱',
    currency: 'EUR',
    locale: 'nl-NL',
    accentColor: '#f36c21',
    accentSecondary: '#21468b',
  },
  {
    id: 'poland',
    name: 'Poland',
    localName: 'Polska',
    flag: '🇵🇱',
    currency: 'PLN',
    locale: 'pl-PL',
    accentColor: '#dc143c',
    accentSecondary: '#ffffff',
  },
  {
    id: 'portugal',
    name: 'Portugal',
    localName: 'Portugal',
    flag: '🇵🇹',
    currency: 'EUR',
    locale: 'pt-PT',
    accentColor: '#006600',
    accentSecondary: '#ff0000',
  },
  {
    id: 'slovakia',
    name: 'Slovakia',
    localName: 'Slovensko',
    flag: '🇸🇰',
    currency: 'EUR',
    locale: 'sk-SK',
    accentColor: '#0b4ea2',
    accentSecondary: '#ee1c25',
  },
  {
    id: 'spain',
    name: 'Spain',
    localName: 'España',
    flag: '🇪🇸',
    currency: 'EUR',
    locale: 'es-ES',
    accentColor: '#c60b1e',
    accentSecondary: '#ffc400',
  },
  {
    // United Kingdom — 2025/26 tax year
    // Income tax, NIC, student loans, pension, Marriage Allowance, BPA, dividends
    id: 'uk',
    name: 'United Kingdom',
    localName: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    locale: 'en-GB',
    accentColor: '#012169',      // Union Flag navy
    accentSecondary: '#C8102E',  // Union Flag red
  },
];

export default COUNTRIES;

/**
 * Find a country config by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getCountry(id) {
  return COUNTRIES.find(c => c.id === id);
}
