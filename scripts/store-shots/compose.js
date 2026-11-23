// Visuels des fiches stores à partir des captures brutes (capture.js).
// node scripts/store-shots/compose.js <dossier des captures> <dossier de sortie>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const SLIDES = [
  { shot: 'raw_4_humeur', title: 'Ton look du jour, prêt au réveil.', sub: 'Composé avec TES vêtements, selon la météo et ton humeur.', sticker: '3 looks chaque matin', dark: false },
  { shot: 'raw_5_garderobe', title: 'Ta garde-robe, dans ta poche.', sub: 'Une photo : l’IA reconnaît le type, la couleur et la saison.', sticker: 'Ajout en 1 photo', dark: true },
  { shot: 'raw_1_duel', title: 'Ton style, cerné en 3 minutes.', sub: 'Quelques questions et des duels de looks.', sticker: 'Sans prise de tête', dark: false },
  { shot: 'raw_6_historique', title: 'Porte tout. Pas toujours la même chose.', sub: 'L’appli fait tourner toute ta garde-robe.', sticker: 'Fini le « rien à me mettre »', dark: true },
  { shot: 'raw_0_accueil', title: '7 jours offerts.', sub: 'Sans carte bancaire. Ensuite 6,99 € par mois ou 39,99 € par an.', sticker: 'Essai gratuit', dark: true },
];
const html = (s, src, W, H) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@500;700&display=swap" rel="stylesheet">
<style>*{margin:0;box-sizing:border-box}body{width:${W}px;height:${H}px;overflow:hidden;background:${s.dark ? '#1F2B4D' : '#F5F2EE'};
color:${s.dark ? '#F5F2EE' : '#141A2B'};font-family:Inter,sans-serif;position:relative}
.t{position:absolute;left:${W * 0.08}px;right:${W * 0.08}px;top:${H * 0.05}px}
h1{font:400 ${W * 0.085}px/1.05 'DM Serif Display',serif;letter-spacing:-1px}
p{margin-top:${W * 0.025}px;font:500 ${W * 0.035}px/1.4 Inter;opacity:.8}
.k{position:absolute;right:${W * 0.07}px;top:${H * (H / W > 2.1 ? 0.235 : 0.255)}px;background:#8C9C7E;color:#141A2B;font:700 ${W * 0.03}px Inter;
padding:${W * 0.018}px ${W * 0.03}px;border-radius:${W * 0.03}px;transform:rotate(-4deg);z-index:2;box-shadow:0 10px 30px rgba(0,0,0,.18)}
img{position:absolute;left:50%;transform:translateX(-50%);top:${H * (H / W > 2.1 ? 0.27 : 0.29)}px;width:${W * (H / W > 2.1 ? 0.8 : 0.66)}px;border-radius:${W * 0.06}px;
box-shadow:0 30px 80px rgba(0,0,0,${s.dark ? 0.45 : 0.18});border:${W * 0.012}px solid ${s.dark ? '#2B3A63' : '#FFFFFF'}}</style></head>
<body><div class="t"><h1>${s.title}</h1><p>${s.sub}</p></div><div class="k">${s.sticker}</div><img src="data:image/png;base64,${fs.readFileSync(src).toString('base64')}"></body></html>`;
(async () => {
  const [IN, OUT] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const [name, W, H] of [['app-store', 1320, 2868], ['google-play', 1080, 2160]]) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    for (let i = 0; i < SLIDES.length; i++) {
      await p.setContent(html(SLIDES[i], path.resolve(IN, SLIDES[i].shot + '.png'), W, H), { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${OUT}/${name}-${i + 1}.png` });
    }
  }
  await b.close(); console.log('visuels ok');
})();
