/* ══════════════════════════════════════════════════════════
   ExpatCalc — Shared JavaScript
   Dropdown close, odometer animation, what-if shortcuts,
   chart scrubber, and save/history system.
   Each country page still defines its own calculate(),
   computeForGross(), render*(), etc.
   ══════════════════════════════════════════════════════════ */

// ══════ CLOSE DROPDOWN ON OUTSIDE CLICK ══════
document.addEventListener('click', function(e) {
  var btn = document.querySelector('.nav-country-btn');
  var dd  = document.getElementById('navDropdown');
  if (btn && dd && !btn.contains(e.target) && !dd.contains(e.target)) {
    btn.classList.remove('open');
    dd.classList.remove('show');
  }
});

// ══════ ODOMETER ANIMATION ══════
(function() {
  var odoTargets = {};
  window.animateOdometer = function(el, newValue, prefix, suffix) {
    prefix = prefix || '';
    suffix = suffix || '';
    var key = el.id || el.getAttribute('data-odo-key') || Math.random().toString();
    if (!el.getAttribute('data-odo-key')) el.setAttribute('data-odo-key', key);
    var oldValue = odoTargets[key] !== undefined ? odoTargets[key] : newValue;
    odoTargets[key] = newValue;
    if (oldValue === newValue && el.getAttribute('data-odo-init')) return;
    el.setAttribute('data-odo-init', '1');
    var startTime = performance.now();
    var duration = 350;
    function step(now) {
      var t = Math.min((now - startTime) / duration, 1);
      var ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
      var current = Math.round(oldValue + (newValue - oldValue) * ease);
      el.textContent = prefix + current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
})();

// ══════ WHAT-IF SHORTCUTS ══════
(function() {
  var bar = document.getElementById('whatifBar');
  if (!bar) return;
  bar.addEventListener('click', function(e) {
    var btn = e.target.closest('.whatif-btn');
    if (!btn) return;
    var slider = document.getElementById('salarySlider');
    var input  = document.getElementById('salaryInput');
    if (!slider || !input) return;
    var current = parseInt(input.value.replace(/\s/g,'')) || 0;
    var action  = btn.dataset.whatif;
    if      (action === 'raise10')  current = Math.round(current * 1.1);
    else if (action === 'raise20')  current = Math.round(current * 1.2);
    else if (action === 'bonus1k')  current = current + 1000;
    else if (action === 'bonus2k')  current = current + 2000;
    else if (action === 'min')      current = parseInt(slider.min);
    current = Math.max(parseInt(slider.min), Math.min(parseInt(slider.max), current));
    slider.value = current;
    input.value  = current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (typeof updateFromSlider === 'function') updateFromSlider();
    else if (typeof updateFromInput === 'function') updateFromInput();
    else slider.dispatchEvent(new Event('input'));
  });
})();

// ══════ CHART SCRUBBER (hover tooltip) ══════
(function() {
  function setupScrubber(canvasId, computeFn, formatFn) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    // Wrap canvas if not already wrapped
    var wrapper = canvas.parentElement;
    if (!wrapper.classList.contains('chart-wrapper')) {
      wrapper = document.createElement('div');
      wrapper.className = 'chart-wrapper';
      canvas.parentElement.insertBefore(wrapper, canvas);
      wrapper.appendChild(canvas);
    }
    // Create tooltip
    var tooltip = wrapper.querySelector('.chart-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      wrapper.appendChild(tooltip);
    }
    // Create scrub line canvas overlay
    var overlayCanvas = wrapper.querySelector('.scrub-overlay');
    if (!overlayCanvas) {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'scrub-overlay';
      overlayCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
      wrapper.appendChild(overlayCanvas);
    }

    var rafId = null;
    canvas.addEventListener('mousemove', function(e) {
      if (rafId) return; // throttle to 1 per frame
      rafId = requestAnimationFrame(function() {
        rafId = null;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var W = rect.width;
        var pad = { left: 70, right: 24, top: 20, bottom: 50 };
        if (canvasId.includes('taxRate') || canvasId.includes('TaxRate') || canvasId.includes('taxrate')) {
          pad.left = 55;
        }
        var plotW = W - pad.left - pad.right;
        var relX  = x - pad.left;
        if (relX < 0 || relX > plotW) {
          tooltip.classList.remove('visible');
          var octx = overlayCanvas.getContext('2d');
          overlayCanvas.width  = rect.width  * (window.devicePixelRatio||1);
          overlayCanvas.height = rect.height * (window.devicePixelRatio||1);
          octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          return;
        }
        var pct = relX / plotW;
        var minG = 500, maxG = 12000;
        var grossAtMouse = minG + (maxG - minG) * pct;

        var data = computeFn(grossAtMouse);
        tooltip.innerHTML = formatFn(grossAtMouse, data);
        tooltip.classList.add('visible');

        // Position tooltip
        var tW = tooltip.offsetWidth;
        var tLeft = x + 16;
        if (tLeft + tW > W - 10) tLeft = x - tW - 16;
        tooltip.style.left = tLeft + 'px';
        tooltip.style.top  = '20px';

        // Draw scrub line
        var dpr = window.devicePixelRatio || 1;
        overlayCanvas.width  = rect.width  * dpr;
        overlayCanvas.height = rect.height * dpr;
        var octx2 = overlayCanvas.getContext('2d');
        octx2.scale(dpr, dpr);
        octx2.clearRect(0, 0, rect.width, rect.height);
        octx2.strokeStyle = 'rgba(255,255,255,0.3)';
        octx2.lineWidth = 1;
        octx2.setLineDash([4, 3]);
        octx2.beginPath();
        octx2.moveTo(x, pad.top);
        octx2.lineTo(x, rect.height - pad.bottom);
        octx2.stroke();
      });
    });

    canvas.addEventListener('mouseleave', function() {
      tooltip.classList.remove('visible');
      var octx = overlayCanvas.getContext('2d');
      octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    });
  }

  // Hook scrubbers after a short delay to let the page compute
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (typeof computeForGross !== 'function' && typeof computeBreakdownForGross !== 'function') return;
      var computeFn = typeof computeForGross === 'function' ? computeForGross : computeBreakdownForGross;

      // Detect currency symbol from the page
      var currSym = '\u20AC'; // default €
      var netEl = document.getElementById('netAmount');
      if (netEl) {
        var txt = netEl.textContent || '';
        if (txt.indexOf('Ft') !== -1) currSym = 'Ft';
      }

      var fmt2 = function(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

      // Net vs Gross chart
      setupScrubber('netVsGrossChart', function(g) {
        return computeFn(g);
      }, function(g, d) {
        return '<div class="tt-row"><div class="tt-dot" style="background:#3b82f6"></div><span class="tt-label">Gross:</span><span class="tt-value">' + fmt2(g) + ' ' + currSym + '</span></div>' +
               '<div class="tt-row"><div class="tt-dot" style="background:#2ecc71"></div><span class="tt-label">Net:</span><span class="tt-value">' + fmt2(d.net) + ' ' + currSym + '</span></div>' +
               '<div class="tt-row"><div class="tt-dot" style="background:#e94560"></div><span class="tt-label">Deductions:</span><span class="tt-value">' + fmt2(d.deductions) + ' ' + currSym + '</span></div>';
      });

      // Tax rate chart
      setupScrubber('taxRateChart', function(g) {
        var w = computeFn(g);
        var effRate = g > 0 ? (w.deductions / g * 100) : 0;
        var delta = 100;
        var wPlus = computeFn(g + delta);
        var margRate = ((wPlus.deductions - w.deductions) / delta) * 100;
        return { effRate: effRate, margRate: Math.max(0, margRate) };
      }, function(g, d) {
        return '<div class="tt-row"><div class="tt-dot" style="background:#3b82f6"></div><span class="tt-label">Gross:</span><span class="tt-value">' + fmt2(g) + ' ' + currSym + '</span></div>' +
               '<div class="tt-row"><div class="tt-dot" style="background:#f1c40f"></div><span class="tt-label">Effective:</span><span class="tt-value">' + d.effRate.toFixed(1) + '%</span></div>' +
               '<div class="tt-row"><div class="tt-dot" style="background:#E87722"></div><span class="tt-label">Marginal:</span><span class="tt-value">' + d.margRate.toFixed(1) + '%</span></div>';
      });
    }, 500);
  });
})();

// ══════ SAVE & HISTORY SYSTEM (sessionStorage) ══════
(function() {
  var STORAGE_KEY = 'expatcalc_history';
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Map page filenames to flag emojis
  var pageFlags = {
    'hungary.html':     '\uD83C\uDDED\uD83C\uDDFA',
    'germany.html':     '\uD83C\uDDE9\uD83C\uDDEA',
    'netherlands.html': '\uD83C\uDDF3\uD83C\uDDF1',
    'portugal.html':    '\uD83C\uDDF5\uD83C\uDDF9',
    'spain.html':       '\uD83C\uDDEA\uD83C\uDDF8',
    'belgium.html':     '\uD83C\uDDE7\uD83C\uDDEA',
    'slovakia.html':    '\uD83C\uDDF8\uD83C\uDDF0'
  };

  function getHistory() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e) { return []; }
  }

  function saveHistory(arr) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 50))); }
    catch(e) {}
  }

  window.saveCalculation = function() {
    var grossEl = document.getElementById('salaryInput');
    var netEl   = document.getElementById('netAmount');
    if (!grossEl || !netEl) return;
    var gross   = grossEl.value.replace(/\s/g, '');
    var netText = netEl.textContent.replace(/[^0-9]/g, '');
    var entry = {
      id:        Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      page:      currentPage,
      country:   document.title.split('|')[0].trim(),
      gross:     parseInt(gross) || 0,
      net:       parseInt(netText) || 0,
      timestamp: new Date().toISOString()
    };
    var arr = getHistory();
    arr.unshift(entry);
    saveHistory(arr);
    renderHistory();
    // Flash button
    var btn = document.getElementById('saveCalcBtn');
    if (btn) {
      var origText = btn.innerHTML;
      btn.innerHTML = '<span>\u2705</span> Saved!';
      btn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
      setTimeout(function() {
        btn.innerHTML = origText;
        btn.style.background = '';
      }, 1200);
    }
  };

  window.renderHistory = function() {
    var list = document.getElementById('historyList');
    if (!list) return;
    var arr    = getHistory();
    var search = (document.getElementById('historySearch') || {}).value || '';
    search = search.toLowerCase().trim();
    var filtered = arr;
    if (search) {
      filtered = arr.filter(function(e) {
        return (e.country||'').toLowerCase().includes(search) ||
               e.gross.toString().includes(search) ||
               e.net.toString().includes(search) ||
               (e.page||'').toLowerCase().includes(search);
      });
    }
    if (filtered.length === 0) {
      list.innerHTML = '<div class="history-empty">' +
        (search ? 'No matching calculations found.' : 'No saved calculations yet. Use the button above to save one.') +
        '</div>';
      return;
    }
    var fmt3 = function(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var html = '';
    filtered.forEach(function(e) {
      var d = new Date(e.timestamp);
      var timeStr = d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      var dateStr = d.toLocaleDateString([], { month:'short', day:'numeric' });
      var pageFlag = pageFlags[e.page] || '';
      html += '<div class="history-item" data-entry-id="' + e.id + '" onclick="loadCalculation(\'' + e.id + '\',\'' + e.page + '\',' + e.gross + ')">';
      html += '<span style="font-size:1.1rem">' + pageFlag + '</span>';
      html += '<span class="hi-gross">' + fmt3(e.gross) + ' \u20AC</span>';
      html += '<span class="hi-arrow">\u2192</span>';
      html += '<span class="hi-net">'   + fmt3(e.net)   + ' \u20AC</span>';
      html += '<span class="hi-time">'  + dateStr + ' ' + timeStr + '</span>';
      html += '<button class="hi-delete" onclick="event.stopPropagation();deleteCalculation(\'' + e.id + '\')">\u2715</button>';
      html += '</div>';
    });
    list.innerHTML = html;
  };

  window.loadCalculation = function(id, page, gross) {
    if (page !== currentPage) {
      window.location.href = page + '?gross=' + gross;
      return;
    }
    var slider = document.getElementById('salarySlider');
    var input  = document.getElementById('salaryInput');
    if (slider && input) {
      var clamped = Math.max(parseInt(slider.min), Math.min(parseInt(slider.max), gross));
      slider.value = clamped;
      input.value  = clamped.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      if (typeof updateFromSlider === 'function') updateFromSlider();
      else slider.dispatchEvent(new Event('input'));
    }
  };

  window.deleteCalculation = function(id) {
    var arr = getHistory().filter(function(e) { return e.id !== id; });
    saveHistory(arr);
    renderHistory();
  };

  // Load from URL param
  window.addEventListener('DOMContentLoaded', function() {
    var params = new URLSearchParams(window.location.search);
    var grossParam = params.get('gross');
    if (grossParam) {
      var g = parseInt(grossParam);
      if (g && !isNaN(g)) {
        setTimeout(function() { loadCalculation(null, currentPage, g); }, 200);
      }
    }
    renderHistory();
  });
})();
