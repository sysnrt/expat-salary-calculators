/* ══════════════════════════════════════════════════════════
   ExpatCalc — Dynamic Navigation
   Reads data-page attribute from <body> and injects the
   top bar + sidebar with the correct "active" states.
   To add a new country, just add an entry to COUNTRIES below.
   ══════════════════════════════════════════════════════════ */

(function() {
  // ── Master country list (single source of truth) ──
  var COUNTRIES = [
    { id: 'index',       file: 'index.html',       flag: '\uD83C\uDFE0', name: 'Home',        local: 'Home' },
    { id: 'hungary',     file: 'Hungary/hungary.html',     flag: '\uD83C\uDDED\uD83C\uDDFA', name: 'Hungary',     local: 'Magyarorsz\u00E1g' },
    { id: 'germany',     file: 'Germany/germany.html',     flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'Germany',     local: 'Deutschland' },
    { id: 'netherlands', file: 'Netherlands/netherlands.html', flag: '\uD83C\uDDF3\uD83C\uDDF1', name: 'Netherlands', local: 'Nederland' },
    { id: 'portugal',    file: 'Portugal/portugal.html',    flag: '\uD83C\uDDF5\uD83C\uDDF9', name: 'Portugal',    local: 'Portugal' },
    { id: 'spain',       file: 'Spain/spain.html',       flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'Spain',       local: 'Espa\u00F1a' },
    { id: 'belgium',     file: 'Belgium/belgium.html',     flag: '\uD83C\uDDE7\uD83C\uDDEA', name: 'Belgium',     local: 'Belgi\u00EB' },
    { id: 'slovakia',    file: 'Slovakia/slovakia.html',    flag: '\uD83C\uDDF8\uD83C\uDDF0', name: 'Slovakia',    local: 'Slovensko' }
  ];

  var currentPage = document.body.getAttribute('data-page') || 'index';
  var current = COUNTRIES.find(function(c) { return c.id === currentPage; }) || COUNTRIES[0];

  // ── Determine if we're in a subfolder and adjust path prefix ──
  var isInSubfolder = currentPage !== 'index';
  var pathPrefix = isInSubfolder ? '../' : '';

  // ── Globe SVG icon ──
  var globeSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>';

  // ── Build dropdown links ──
  var dropdownHtml = '';
  var sidebarLinksHtml = '';
  COUNTRIES.forEach(function(c) {
    var isActive = c.id === currentPage ? ' class="active"' : '';
    var localLabel = c.id === 'index'
      ? '<small style="opacity:0.5;font-size:0.78rem">Home</small>'
      : '<small style="opacity:0.5;font-size:0.78rem">' + c.local + '</small>';
    var href = pathPrefix + c.file;
    dropdownHtml += '<a href="' + href + '"' + isActive + '>' +
      '<span class="flag-emoji">' + c.flag + '</span>' +
      '<span class="country-name">' + c.name + '<br>' + localLabel + '</span>' +
      '<span class="arrow">\u203A</span></a>';

    var sidebarActive = c.id === currentPage ? ' class="active"' : '';
    sidebarLinksHtml += '<a href="' + href + '"' + sidebarActive + '>' +
      '<span class="flag-emoji">' + c.flag + '</span><span>' + c.name + '</span></a>';
  });

  // ── Topbar ──
  var navHtml =
    '<nav class="global-topbar">' +
      '<button class="hamburger-btn" aria-label="Open menu">\u2630</button>' +
      '<a href="' + pathPrefix + 'index.html" class="nav-brand">' + globeSvg + ' ExpatCalc</a>' +
      '<div class="nav-country-switcher">' +
        '<button class="nav-country-btn" aria-label="Switch country">' +
          current.flag + ' <span class="country-label-text">' + current.name + '</span> <span class="chevron">\u25BE</span>' +
        '</button>' +
        '<div class="nav-dropdown" id="navDropdown">' + dropdownHtml + '</div>' +
      '</div>' +
    '</nav>';

  // ── Sidebar ──
  var sidebarHtml =
    '<div class="sidebar-overlay"></div>' +
    '<div class="sidebar-drawer">' +
      '<div class="sidebar-header">' +
        '<h3>ExpatCalc 2026</h3>' +
        '<button class="sidebar-close" aria-label="Close menu">\u2715</button>' +
      '</div>' +
      '<nav class="sidebar-nav">' + sidebarLinksHtml + '</nav>' +
    '</div>';

  // ── Inject into DOM ──
  var container = document.createElement('div');
  container.innerHTML = navHtml + sidebarHtml;
  // Insert at the very beginning of <body>
  if (document.body.firstChild) {
    document.body.insertBefore(container, document.body.firstChild);
  } else {
    document.body.appendChild(container);
  }
  // Unwrap (move children out of the wrapper div)
  while (container.firstChild) {
    document.body.insertBefore(container.firstChild, container);
  }
  container.remove();

  // ── Wire up event listeners ──
  var hamburger  = document.querySelector('.hamburger-btn');
  var overlay    = document.querySelector('.sidebar-overlay');
  var drawer     = document.querySelector('.sidebar-drawer');
  var closeBtn   = document.querySelector('.sidebar-close');
  var countryBtn = document.querySelector('.nav-country-btn');

  function openSidebar()  { drawer.classList.add('open'); overlay.classList.add('show'); }
  function closeSidebar() { drawer.classList.remove('open'); overlay.classList.remove('show'); }

  if (hamburger) hamburger.addEventListener('click', openSidebar);
  if (overlay)   overlay.addEventListener('click', closeSidebar);
  if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);

  if (countryBtn) {
    countryBtn.addEventListener('click', function() {
      this.classList.toggle('open');
      document.getElementById('navDropdown').classList.toggle('show');
    });
  }
})();
