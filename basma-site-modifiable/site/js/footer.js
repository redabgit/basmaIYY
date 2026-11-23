/* ===========================================================
   Pied de page commun à toutes les pages de Basma IYY.
   Pour changer le numéro, l'e-mail, les réseaux ou le QR code :
   modifie UNIQUEMENT les lignes ci-dessous, ça s'applique partout.
   =========================================================== */
(function () {
  var script = document.querySelector('script[src$="js/footer.js"]');
  var footer = document.getElementById('contact');
  if (!script || !footer) return;

  // Racine du site (fonctionne depuis /, /projets/ et /evenements/)
  var root = script.src.replace(/js\/footer\.js.*$/, '');

  // ---------- À MODIFIER ICI ----------
  var PHONE_DISPLAY = '0466 47 52 23';
  var PHONE_LINK    = '+32466475223';
  var EMAIL         = 'basmaiyy1@gmail.com';
  var COMPANY_NO    = 'BE 1033.037.429';
  var QR_IMAGE      = 'images/qr-don.png';   // QR code de don (virement SEPA)
  var FACEBOOK      = 'https://www.facebook.com/iyy.basma';
  var INSTAGRAM     = 'https://www.instagram.com/association.basma_iyy';
  var TIKTOK        = 'https://www.tiktok.com/@basma_iyy';
  // -------------------------------------

  footer.innerHTML =
    '<div class="wrap footer-grid">' +
      '<div class="cols">' +
        '<div>' +
          '<h4>Basma IYY</h4>' +
          '<ul><li>ASBL, Belgique</li><li>' + COMPANY_NO + '</li></ul>' +
        '</div>' +
        '<div>' +
          '<h4>Contact</h4>' +
          '<ul>' +
            '<li><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></li>' +
            '<li><a href="tel:' + PHONE_LINK + '">' + PHONE_DISPLAY + '</a></li>' +
            '<li><a href="' + FACEBOOK + '" target="_blank" rel="noopener">Facebook</a> · ' +
                '<a href="' + INSTAGRAM + '" target="_blank" rel="noopener">Instagram</a> · ' +
                '<a href="' + TIKTOK + '" target="_blank" rel="noopener">TikTok</a></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="footer-donate">' +
        '<div class="qr-box"><img src="' + root + QR_IMAGE + '" alt="QR code pour faire un don par virement" width="124" height="124" loading="lazy"></div>' +
        '<div>' +
          '<h4>Faire un don</h4>' +
          '<p>Scannez avec l\u2019application de votre banque.</p>' +
          '<a class="btn btn-primary btn-small" href="' + root + 'don.html">Voir les coordonn\u00e9es</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">\u00a9 2026 Basma IYY</div>' +
    '</div>';

  /* ===========================================================
     Traduction automatique (GTranslate) : français / néerlandais / arabe
     Pour retirer la traduction : supprimer tout ce bloc, jusqu'à la fin.
     =========================================================== */
  // Ce qui ne doit JAMAIS être traduit : IBAN, communication du virement, nom de l'association
  function protect() {
    var els = document.querySelectorAll('.bank-box dl, .support-ref, .brand, .qr-card img, .don-chip');
    for (var i = 0; i < els.length; i++) {
      els[i].setAttribute('translate', 'no');
      els[i].classList.add('notranslate');
    }
  }
  protect();
  if (window.MutationObserver) new MutationObserver(protect).observe(document.body, { childList: true, subtree: true });

  var wrap = document.createElement('div');
  wrap.id = 'gtranslate_wrapper';
  wrap.className = 'notranslate';
  wrap.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:9999;background:#fff;border:1px solid #e4d6cf;border-radius:12px;padding:6px 8px;box-shadow:0 6px 18px rgba(0,0,0,.15)';
  document.body.appendChild(wrap);
  window.gtranslateSettings = {
    default_language: 'fr',
    languages: ['fr', 'nl', 'ar'],
    wrapper_selector: '#gtranslate_wrapper'
  };
  var gt = document.createElement('script');
  gt.src = 'https://cdn.gtranslate.net/widgets/latest/dropdown.js';
  gt.defer = true;
  document.body.appendChild(gt);
})();
