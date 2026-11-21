/* Génère le site à partir du dossier content/ (modifié via /admin).
   Lancé automatiquement par Netlify à chaque modification : node build.js */
const fs = require('fs'), path = require('path');
const ROOT = __dirname, DIST = path.join(ROOT, 'dist');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const wr = (p, s) => { const f = path.join(DIST, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const loadDir = (d) => fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.json'))
  .map((f) => Object.assign(JSON.parse(rd(d + '/' + f)), { slug: f.replace(/\.json$/, '') })) : [];
const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
const imgPath = (p, root) => !p ? '' : (/^https?:/.test(p) ? p : root + String(p).replace(/^\/+/, ''));
const byOrder = (a, b) => (a.ordre || 999) - (b.ordre || 999);

function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copy(s, d) : fs.copyFileSync(s, d);
  }
}

// ---------- vidéos (on colle simplement le lien Instagram ou TikTok)
function videoHtml(url, title, small) {
  url = (url || '').trim();
  const style = small ? 'width:100%; max-width:400px; height:550px; border:none;' : 'width:100%; height:700px; border:none;';
  const wrap = small ? ' style="display:flex; justify-content:center;"' : '';
  let m;
  if ((m = url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/))) {
    return `    <div class="detail-video"${wrap}>\n      <iframe src="https://www.instagram.com/${m[1]}/${m[2]}/embed" style="${style}" allow="fullscreen" title="Vidéo Instagram - ${esc(title)}"></iframe>\n    </div>`;
  }
  if ((m = url.match(/tiktok\.com\/.*video\/(\d+)/))) {
    return `    <div class="detail-video"${wrap}>\n      <iframe src="https://www.tiktok.com/player/v1/${m[1]}" style="${style}" allow="fullscreen" title="Vidéo TikTok - ${esc(title)}"></iframe>\n    </div>`;
  }
  if (/\.(mp4|webm)$/i.test(url)) {
    return `    <div class="detail-video"><video controls playsinline style="width:100%;max-height:700px"><source src="${esc(url)}"></video></div>`;
  }
  return '    <div class="detail-video">\n      <span class="tag">▶ Vidéo à venir</span>\n    </div>';
}
const paras = (t) => String(t || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  .map((p) => `    <p class="detail-text">${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');
const fact = (k, v) => (v ? `      <div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '');

const SCRIPTS_SUB = '<script async src="//www.instagram.com/embed.js"></script>\n<script src="../js/dons.js" defer></script>\n<script src="../js/footer.js" defer></script>';
const SCRIPTS_EVT = '<script async src="//www.instagram.com/embed.js"></script>\n<script src="../js/footer.js" defer></script>';
const head = (title, desc) => fill(rd('templates/_head.html'), { root: '../', page_title: esc(title) + ' · Basma IYY', page_desc: esc(desc) });
const foot = (scripts) => fill(rd('templates/_foot.html'), { scripts });
const firstSentence = (t) => (String(t || '').split(/\n\s*\n/)[0] || '').slice(0, 200);

// ---------- 0. fichiers statiques
fs.rmSync(DIST, { recursive: true, force: true });
copy(path.join(ROOT, 'site'), DIST);

// ---------- 1. projets
const CATS = [['Humanitaire', 'humanitaire'], ['Autonomie', 'autonomie'], ['Éducation', 'education'], ['Solidarité', 'solidarite']];
const projets = loadDir('content/projets').sort(byOrder);
for (const p of projets) {
  const html = fill(rd('templates/projet.html'), {
    head: head(p.title, firstSentence(p.texte)), foot: foot(SCRIPTS_SUB), root: '../', slug: p.slug,
    categorie: esc(p.categorie), title: esc(p.title),
    sous_titre: p.a_venir ? '<p>Prochainement</p>' : (p.sous_titre ? `<p>${esc(p.sous_titre)}</p>` : ''),
    video: videoHtml(p.video, p.title, false), paragraphes: paras(p.texte),
    facts: [fact('Objectif', p.objectif), fact('Bénéficiaires', p.beneficiaires || 'À compléter'), fact('Résultats', p.resultats || (p.a_venir ? 'Projet à venir' : 'À compléter'))].filter(Boolean).join('\n'),
    boutique: p.lien_boutique ? '    <p style="margin-top:28px;"><a href="../boutique.html#tapis" class="btn btn-outline btn-small">Découvrir les tapis à la boutique</a></p>\n' : '',
  });
  wr(`projets/${p.slug}.html`, html);
}
const visibles = projets.filter((p) => p.afficher !== false);
let jump = '', cats = '';
for (const [label, cls] of CATS) {
  const list = visibles.filter((p) => p.categorie === label);
  if (!list.length) continue;
  jump += `      <a href="#cat-${cls}">${label}</a>\n`;
  cats += `    <div class="project-category cat-${cls}" id="cat-${cls}">
      <div class="project-category-head">
        <h3>${label}</h3>
        <span class="count">${list.length} projet${list.length > 1 ? 's' : ''}</span>
      </div>
      <div class="projects-grid">
${list.map((p) => `      <a href="projets/${p.slug}.html" class="video-card">
        <div class="video-thumb">
          <img src="${esc(imgPath(p.miniature, ''))}" alt="${esc(p.legende || p.title)}" loading="lazy">
          <span class="play-icon">▶</span>
        </div>
        <div class="video-caption">${esc(p.legende || p.title)}${p.a_venir ? '<span class="soon-tag">Prochainement</span>' : ''}</div>
      </a>`).join('\n')}
      </div>
    </div>

`;
}
wr('projets.html', fill(rd('templates/projets.html'), { page_desc: "Les projets menés par Basma IYY : aide humanitaire, autonomisation, éducation et solidarité.", jumpnav: jump.trimEnd(), categories: cats }));

// ---------- 2. dons.js : liste des projets
const js = path.join(DIST, 'js/dons.js');
let d = fs.readFileSync(js, 'utf8');
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
d = d.replace(/\/\*PROJETS_START\*\/[\s\S]*?\/\*PROJETS_END\*\//, '/*PROJETS_START*/\n  var PROJETS = {\n' + projets.map((p) => `    ${q(p.slug)}: ${q(p.title)}`).join(',\n') + '\n  };\n  /*PROJETS_END*/');
d = d.replace(/\/\*ORDRE_START\*\/[\s\S]*?\/\*ORDRE_END\*\//, '/*ORDRE_START*/\n  var ORDRE = [' + visibles.map((p) => q(p.slug)).join(', ') + '];\n  /*ORDRE_END*/');
fs.writeFileSync(js, d);

// ---------- 3. data/dons.json (depuis content/dons.json)
const dons = JSON.parse(rd('content/dons.json'));
const n = (v) => (v === '' || v === undefined || v === null || isNaN(Number(v)) ? null : Number(v));
const out = { maj: dons.maj, global: { objectif: n(dons.global_objectif), collecte: n(dons.global_collecte) }, projets: {} };
projets.forEach((p) => { out.projets[p.slug] = { objectif: null, collecte: null }; });
(dons.projets || []).forEach((e) => { if (e.projet) out.projets[e.projet] = { objectif: n(e.objectif), collecte: n(e.collecte) }; });
wr('data/dons.json', JSON.stringify(out, null, 2));

// ---------- 4. boutique
const produits = loadDir('content/boutique').sort(byOrder);
const card = (p) => {
  const img = p.photo ? `<img src="${esc(imgPath(p.photo, ''))}" alt="${esc(p.nom)}" loading="lazy" onerror="this.remove()">` : '';
  const subj = encodeURIComponent(p.nom);
  return `        <article class="product-card">
          <div class="product-photo">${img}<span class="tag">${esc(p.nom)}</span></div>
          <div class="product-body">
            <h3>${esc(p.nom)}</h3>
            ${p.description ? `<p>${esc(p.description)}</p>` : ''}
            ${p.prix ? `<span class="product-price">${esc(p.prix)}</span>` : ''}
            <a class="product-ask" href="mailto:basmaiyy11@gmail.com?subject=${subj}">Me renseigner sur cet article</a>
          </div>
        </article>`;
};
const soon = (txt) => `        <article class="product-card">
          <div class="product-photo"><span class="tag">Photo à venir</span></div>
          <div class="product-body">
            <h3>Bientôt disponible</h3>
            <p>${txt}</p>
          </div>
        </article>`;
const grid = (cat, txt) => { const l = produits.filter((p) => p.categorie === cat); return l.length ? l.map(card).join('\n') : soon(txt); };
wr('boutique.html', fill(rd('templates/boutique.html'), {
  grid_tapis: grid('tapis', 'Nos tapis seront présentés ici.'),
  grid_tshirts: grid('tshirts', 'Nos t-shirts seront présentés ici.'),
  grid_cabas: grid('cabas', 'Nos sacs cabas seront présentés ici.'),
}));

// ---------- 5. événements
const evts = loadDir('content/evenements').sort(byOrder);
for (const e of evts) {
  wr(`evenements/${e.slug}.html`, fill(rd('templates/evenement.html'), {
    head: head(e.title, firstSentence(e.texte)), foot: foot(SCRIPTS_EVT), root: '../', title: esc(e.title),
    sous_titre: e.sous_titre ? `<p>${esc(e.sous_titre)}</p>` : '',
    video: videoHtml(e.video, e.title, true), paragraphes: paras(e.texte),
    facts: [fact('Lieu', e.lieu), fact('Date', e.date), fact('Résultats', e.resultats)].filter(Boolean).join('\n'),
  }));
}
wr('actualites.html', fill(rd('templates/actualites.html'), {
  events: evts.map((e) => `      <a href="evenements/${e.slug}.html" class="video-card">
        <div class="video-thumb">
          <img src="${esc(imgPath(e.miniature, ''))}" alt="${esc(e.title)}" loading="lazy">
          <span class="play-icon">▶</span>
        </div>
        <div class="video-caption">${esc(e.legende || e.title)}</div>
      </a>`).join('\n\n'),
}));

// ---------- 6. accueil
const a = JSON.parse(rd('content/accueil.json'));
const bySlug = Object.fromEntries(projets.map((p) => [p.slug, p]));
wr('index.html', fill(rd('templates/index.html'), {
  hero_texte: esc(a.hero_texte),
  stats: (a.chiffres || []).map((c) => `    <div class="stat"><b>${esc(c.chiffre)}</b><span>${esc(c.libelle)}</span></div>`).join('\n'),
  moments: (a.moments || []).filter((m) => bySlug[m.projet]).map((m) => `      <a class="moment" href="projets/${m.projet}.html"><img src="${esc(imgPath(m.image, ''))}" alt="" loading="lazy"><span class="moment-cap">${esc(m.legende || bySlug[m.projet].title)}</span></a>`).join('\n'),
  boutique_titre: esc(a.boutique_titre), boutique_texte: esc(a.boutique_texte),
}));

// ---------- 7. espace d'administration
copy(path.join(ROOT, 'admin'), path.join(DIST, 'admin'));
console.log(`OK : ${projets.length} projets, ${produits.length} articles, ${evts.length} événements`);
