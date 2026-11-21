/* ===========================================================
   Basma IYY : baromètre de dons + bloc "Soutenir ce projet".

   Ce que fait ce fichier :
   1. Affiche un baromètre dans tout élément <div data-barometre="global">
      ou <div data-barometre="forage-puits"> (identifiant du projet).
   2. Remplit automatiquement tout <div class="project-support"
      data-project="forage-puits"> avec le bloc "Soutenir ce projet".
   3. Sur la page don.html : si l'adresse contient ?projet=forage-puits,
      affiche un bandeau "Vous soutenez ce projet" avec la communication
      à indiquer dans le virement.

   Les chiffres viennent du fichier data/dons.json. Le baromètre se
   rafraîchit tout seul toutes les 60 secondes. Pour l'automatiser
   vraiment, il suffit de changer DATA_URL (voir ci-dessous).
   Pour prévisualiser le design avec des chiffres d'exemple :
   ajoute ?demo à l'adresse de n'importe quelle page.
   =========================================================== */
(function () {
  var script = document.querySelector('script[src$="js/dons.js"]');
  if (!script) return;
  var root = script.src.replace(/js\/dons\.js.*$/, '');

  // ---------- À MODIFIER ICI ----------
  // Aujourd'hui : un fichier du site, que tu modifies à la main.
  // Plus tard : l'adresse d'une source en ligne qui renvoie le même format
  // (Google Sheet publié, fonction Netlify, Mollie, Stripe, etc.).
  var DATA_URL = root + 'data/dons.json';
  var REFRESH_MS = 60000;
  // Coordonnées utilisées pour le QR code de virement (norme EPC, lue par la
  // plupart des applications bancaires). IBAN sans espaces.
  var BENEFICIAIRE = 'Basma IYY ASBL';
  var IBAN = 'BE43363185789901';
  // -------------------------------------

  /*PROJETS_START*/
  var PROJETS = {};
  /*PROJETS_END*/

  var DEMO = location.search.indexOf('demo') > -1;
  var DEMO_DATA = {
    maj: new Date().toISOString().slice(0, 10),
    global: { objectif: 5000, collecte: 1850 },
    projets: {}
  };
  Object.keys(PROJETS).forEach(function (slug, i) {
    DEMO_DATA.projets[slug] = { objectif: 2000, collecte: 300 + i * 110 };
  });

  var data = null;

  function euros(n) {
    try {
      return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
    } catch (e) { return Math.round(n) + ' \u20ac'; }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function entryFor(key) {
    if (!data) return null;
    var e = key === 'global' ? data.global : (data.projets || {})[key];
    if (!e || e.collecte === null || e.collecte === undefined) return null;
    return e;
  }

  function renderBarometers() {
    var els = document.querySelectorAll('[data-barometre]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-barometre');
      var e = entryFor(key);
      if (!e) { el.innerHTML = ''; continue; }

      var label = el.getAttribute('data-label') || (key === 'global' ? 'Notre collecte' : 'Collecte pour ce projet');
      var hasGoal = e.objectif && e.objectif > 0;
      var pct = hasGoal ? Math.min(100, Math.round(e.collecte / e.objectif * 100)) : 0;
      var maj = formatDate(data.maj);

      var html = '<div class="baro">' +
        '<div class="baro-top"><span class="baro-label">' + esc(label) + (DEMO ? '<span class="baro-demo">Aper\u00e7u</span>' : '') + '</span>' +
        (hasGoal ? '<span class="baro-pct">' + pct + '\u00a0%</span>' : '') + '</div>' +
        (hasGoal
          ? '<div class="baro-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="' + esc(label) + '"><span class="baro-fill" data-pct="' + pct + '"></span></div>' +
            '<p class="baro-meta"><b>' + euros(e.collecte) + '</b> r\u00e9colt\u00e9s sur ' + euros(e.objectif) + '</p>'
          : '<p class="baro-meta"><b>' + euros(e.collecte) + '</b> r\u00e9colt\u00e9s</p>') +
        (maj ? '<p class="baro-maj">Mis \u00e0 jour le ' + esc(maj) + '</p>' : '') +
        '</div>';

      var wasRendered = !!el.querySelector('.baro');
      el.innerHTML = html;
      var fill = el.querySelector('.baro-fill');
      if (fill) {
        var target = fill.getAttribute('data-pct') + '%';
        if (wasRendered) { fill.style.width = target; }
        else { requestAnimationFrame(function (f, t) { return function () { requestAnimationFrame(function () { f.style.width = t; }); }; }(fill, target)); }
      }
    }
  }

  function copyText(text, btn) {
    function done() {
      var old = btn.textContent;
      btn.textContent = 'Copi\u00e9';
      setTimeout(function () { btn.textContent = old; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  function refFor(slug) { return 'Projet : ' + PROJETS[slug]; }

  function bindCopy(scope) {
    var btns = scope.querySelectorAll('.copy-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        copyText(this.getAttribute('data-copy'), this);
      });
    }
  }

  // 1) Blocs "Soutenir ce projet" sur les pages projets
  function buildProjectBlocks() {
    var blocks = document.querySelectorAll('.project-support[data-project]');
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var slug = b.getAttribute('data-project');
      if (!PROJETS[slug]) continue;
      var ref = refFor(slug);
      b.innerHTML =
        '<h3>Soutenir ce projet</h3>' +
        '<p>Vous pouvez choisir de soutenir directement \u00ab\u00a0' + esc(PROJETS[slug]) + '\u00a0\u00bb.</p>' +
        '<div data-barometre="' + esc(slug) + '"></div>' +
        '<ol class="support-steps">' +
          '<li>Faites un virement vers le compte de Basma IYY (coordonn\u00e9es et QR code sur la page don).</li>' +
          '<li>Indiquez en communication : <span class="support-ref">' + esc(ref) + '</span>' +
          '<button type="button" class="copy-btn" data-copy="' + esc(ref) + '">Copier</button></li>' +
        '</ol>' +
        '<a class="btn btn-primary" href="' + root + 'don.html?projet=' + encodeURIComponent(slug) + '">Voir les coordonn\u00e9es bancaires</a>';
      bindCopy(b);
    }
  }

  // Ordre d'affichage dans la liste déroulante de don.html (comme projets.html)
  /*ORDRE_START*/
  var ORDRE = [];
  /*ORDRE_END*/

  // 2) Page don.html : liste "Je souhaite soutenir" + communication du virement
  function buildDonSelect() {
    var sel = document.getElementById('don-projet');
    if (!sel) return false;
    ORDRE.forEach(function (slug) {
      var o = document.createElement('option');
      o.value = slug; o.textContent = PROJETS[slug];
      sel.appendChild(o);
    });
    var m = location.search.match(/[?&]projet=([^&]+)/);
    if (m && PROJETS[decodeURIComponent(m[1])]) sel.value = decodeURIComponent(m[1]);
    var comm = document.getElementById('don-communication');
    var baro = document.getElementById('don-baro');
    function update() {
      var slug = sel.value;
      var ref = slug ? refFor(slug) : 'Don Basma IYY';
      if (comm) {
        comm.innerHTML = '<span class="support-ref">' + esc(ref) + '</span>' +
          '<button type="button" class="copy-btn" data-copy="' + esc(ref) + '">Copier</button>';
        bindCopy(comm);
      }
      if (baro) { baro.setAttribute('data-barometre', slug || 'none'); renderBarometers(); }
      refreshQR();
    }
    sel.addEventListener('change', update);
    update();
    return true;
  }

  // ---------- QR code de virement (montant + communication préremplis) ----------
  var donState = { amount: 0 };
  var qrOrig = null;
  var qrLoading = null;

  function loadQR(cb) {
    if (window.qrcode) { cb(); return; }
    if (qrLoading) { qrLoading.push(cb); return; }
    qrLoading = [cb];
    var s = document.createElement('script');
    s.src = root + 'js/qr.js';
    s.onload = function () { var q = qrLoading; qrLoading = null; q.forEach(function (f) { f(); }); };
    s.onerror = function () { qrLoading = null; };
    document.head.appendChild(s);
  }

  function ascii(t) {
    return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2019\u2018]/g, "'");
  }

  function epcPayload(amount, ref) {
    return ['BCD', '002', '1', 'SCT', '', BENEFICIAIRE, IBAN,
            amount > 0 ? 'EUR' + amount.toFixed(2) : '', '', '', ascii(ref).slice(0, 140)].join('\n');
  }

  function refreshQR() {
    var card = document.querySelector('.qr-card');
    if (!card) return;
    var img = card.querySelector('img');
    var p = card.querySelector('p');
    if (!img) return;
    if (!qrOrig) qrOrig = { src: img.getAttribute('src'), alt: img.getAttribute('alt'), text: p ? p.textContent : '' };
    var sel = document.getElementById('don-projet');
    var slug = sel ? sel.value : '';
    var amount = donState.amount;
    if (!(amount > 0) && !slug) {
      img.setAttribute('src', qrOrig.src); img.setAttribute('alt', qrOrig.alt);
      if (p) p.textContent = qrOrig.text;
      return;
    }
    loadQR(function () {
      try {
        var q = window.qrcode(0, 'M');
        q.addData(epcPayload(amount, slug ? refFor(slug) : 'Don Basma IYY'));
        q.make();
        var svg = q.createSvgTag({ cellSize: 6, margin: 4, scalable: true });
        img.setAttribute('src', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
        img.setAttribute('alt', 'QR code de virement pr\u00e9rempli');
        if (p) p.textContent = amount > 0
          ? 'Montant et communication pr\u00e9remplis : scannez avec l\u2019application de votre banque, v\u00e9rifiez, puis confirmez le virement.'
          : 'Communication pr\u00e9remplie : scannez avec l\u2019application de votre banque, il ne reste qu\u2019\u00e0 indiquer le montant.';
      } catch (e) { /* on garde le QR code habituel */ }
    });
  }

  // 2b) Page don.html : montants proposés (10, 20, 50 euros ou autre)
  function buildAmounts() {
    var choice = document.querySelector('.don-choice');
    if (!choice) return;
    var dl = document.querySelector('.bank-box dl');

    var st = document.createElement('style');
    st.textContent =
      '.don-amounts{margin:36px 0 0;max-width:560px}' +
      '.don-amounts-title{margin:0 0 8px;font-weight:800}' +
      '.don-chips{display:flex;flex-wrap:wrap;gap:10px}' +
      '.don-chip{padding:11px 22px;border:2px solid var(--border);border-radius:999px;background:var(--white);color:var(--ink);font-family:var(--font-body);font-weight:800;font-size:1rem;cursor:pointer}' +
      '.don-chip:hover{border-color:var(--pink-dark)}' +
      '.don-chip[aria-pressed="true"]{background:var(--pink-dark);border-color:var(--pink-dark);color:var(--white)}' +
      '#don-autre{display:none;margin-top:12px;width:180px;padding:11px 14px;border:2px solid var(--border);border-radius:14px;font-family:var(--font-body);font-size:1rem}' +
      '.don-amounts-note{margin:10px 0 0;font-size:.9rem;color:var(--ink-soft)}';
    document.head.appendChild(st);

    var montants = [10, 20, 50];
    var wrap = document.createElement('div');
    wrap.className = 'don-amounts';
    wrap.innerHTML =
      '<p class="don-amounts-title">Je choisis un montant</p>' +
      '<div class="don-chips">' +
        montants.map(function (m) { return '<button type="button" class="don-chip" data-amount="' + m + '" aria-pressed="false">' + m + '\u00a0\u20ac</button>'; }).join('') +
        '<button type="button" class="don-chip" data-amount="autre" aria-pressed="false">Autre montant</button>' +
      '</div>' +
      '<input id="don-autre" type="number" min="1" step="1" inputmode="numeric" placeholder="Montant en \u20ac" aria-label="Autre montant en euros">' +
      '<p class="don-amounts-note" id="don-amounts-note" hidden>Le QR code ci-dessous est mis à jour avec ce montant. Sinon, reportez-le dans votre virement.</p>';
    choice.parentNode.insertBefore(wrap, choice);

    var dt = null, dd = null;
    if (dl) {
      dt = document.createElement('dt'); dt.textContent = 'Montant'; dt.hidden = true;
      dd = document.createElement('dd'); dd.id = 'don-montant'; dd.hidden = true;
      dl.appendChild(dt); dl.appendChild(dd);
    }
    var chips = wrap.querySelectorAll('.don-chip');
    var autre = document.getElementById('don-autre');
    var note = document.getElementById('don-amounts-note');

    function show(n) {
      var ok = n > 0;
      note.hidden = !ok;
      if (dt) { dt.hidden = !ok; dd.hidden = !ok; if (ok) dd.textContent = euros(n); }
      donState.amount = ok ? Math.round(n * 100) / 100 : 0;
      refreshQR();
    }
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function () {
        for (var j = 0; j < chips.length; j++) chips[j].setAttribute('aria-pressed', chips[j] === this ? 'true' : 'false');
        var a = this.getAttribute('data-amount');
        if (a === 'autre') {
          autre.style.display = 'block'; autre.focus(); show(parseFloat(autre.value) || 0);
        } else {
          autre.style.display = 'none'; show(parseFloat(a));
        }
      });
    }
    autre.addEventListener('input', function () { show(parseFloat(autre.value) || 0); });
  }

  // 3) Bandeau sur la page don.html quand on arrive depuis un projet
  function buildDonBanner() {
    var m = location.search.match(/[?&]projet=([^&]+)/);
    if (!m) return;
    var slug = decodeURIComponent(m[1]);
    if (!PROJETS[slug]) return;
    var host = document.querySelector('section.block .wrap');
    if (!host) return;
    var ref = refFor(slug);
    var div = document.createElement('div');
    div.className = 'don-banner';
    div.innerHTML =
      '<p><b>Vous souhaitez soutenir \u00ab\u00a0' + esc(PROJETS[slug]) + '\u00a0\u00bb.</b></p>' +
      '<p>Indiquez en communication du virement : <span class="support-ref">' + esc(ref) + '</span>' +
      '<button type="button" class="copy-btn" data-copy="' + esc(ref) + '">Copier</button></p>' +
      '<div data-barometre="' + esc(slug) + '"></div>';
    host.insertBefore(div, host.firstChild);
    bindCopy(div);
  }

  function load() {
    if (DEMO) { data = DEMO_DATA; renderBarometers(); return; }
    fetch(DATA_URL + (DATA_URL.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { data = j; renderBarometers(); })
      .catch(function () { /* en cas d'erreur, on garde l'affichage précédent */ });
  }

  function init() {
    buildProjectBlocks();
    if (buildDonSelect()) buildAmounts(); else buildDonBanner();
    load();
    if (!DEMO) setInterval(load, REFRESH_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
