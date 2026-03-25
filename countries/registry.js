/* ══════════════════════════════════════════════════════════
   ExpatCalc — Country Registry
   Master list of all supported countries.
   Adding a new country = adding an entry here + creating
   a countries/<id>.js config file.
   ══════════════════════════════════════════════════════════ */

const COUNTRIES = [
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
    id: 'poland',
    name: 'Poland',
    localName: 'Polska',
    flag: '🇵🇱',
    currency: 'PLN',
    locale: 'pl-PL',
    accentColor: '#dc143c',
    accentSecondary: '#ffffff',
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
