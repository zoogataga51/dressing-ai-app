// Génère le petit site public dressingai.fr (accueil, CGU, confidentialité) à partir de src/data/legal.ts.
// node --experimental-strip-types scripts/build-site.ts  → dossier site/ à déposer dans « www » de l'hébergement OVH.
import { mkdirSync, writeFileSync } from 'node:fs';
import { PRIVACY, TERMS, type LegalDoc } from '../src/data/legal.ts';

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const page = (title: string, body: string, description: string) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Syne:wght@700;800&display=swap" rel="stylesheet">
<style>
:root{--paper:#F6F3EE;--ink:#15151C;--muted:#5F5B53;--cobalt:#2B44C6;--coral:#FF5A3C;--card:#FFFDF9}
@media (prefers-color-scheme:dark){:root{--paper:#121218;--ink:#F3F0EA;--muted:#ADA79C;--cobalt:#6F84F0;--card:#1C1C24}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Inter,system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:32px 20px 64px}a{color:var(--cobalt)}
.brand{font:800 14px Syne,sans-serif;letter-spacing:2px;text-transform:uppercase;color:var(--cobalt);text-decoration:none}
h1{font:800 clamp(32px,7vw,52px)/1.05 Syne,sans-serif;letter-spacing:-.5px;margin:28px 0 12px}
h2{font:700 20px/1.3 Syne,sans-serif;color:var(--cobalt);margin:32px 0 8px}
.muted{color:var(--muted)}.sticker{display:inline-block;background:var(--coral);color:#15151C;font:800 14px Syne,sans-serif;padding:8px 14px;border-radius:14px;transform:rotate(-3deg)}
.card{background:var(--card);border-radius:24px;padding:24px;margin-top:24px}footer{margin-top:48px;font-size:14px}footer a{margin-right:16px}
ul{padding-left:20px}
</style></head><body><main>
<a class="brand" href="/">Dressing AI</a>
${body}
<footer class="muted"><a href="/">Accueil</a><a href="/cgu.html">Conditions d’utilisation</a><a href="/confidentialite.html">Confidentialité</a></footer>
</main></body></html>
`;

function legal(d: LegalDoc): string {
  const sections = d.sections.map((s) => {
    const items: string[] = [];
    let list: string[] = [];
    const flush = () => { if (list.length) { items.push(`<ul>${list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`); list = []; } };
    for (const p of s.body) { if (p.startsWith('- ')) list.push(p.slice(2)); else { flush(); items.push(`<p>${esc(p)}</p>`); } }
    flush();
    return `<h2>${esc(s.title)}</h2>${items.join('')}`;
  }).join('\n');
  return page(`${d.title} · Dressing AI`, `<h1>${esc(d.title)}</h1><p class="muted">Mise à jour : ${esc(d.updated)}</p>${sections}`, d.title);
}

const home = page('Dressing AI · Ton look du jour, avec tes vêtements', `
<h1>Ton look du jour, pensé avec tes vêtements.</h1>
<p class="muted" style="font-size:18px">Chaque matin, des tenues composées avec ta garde-robe, la météo de ta ville et ton humeur. Fini le « je n’ai rien à me mettre ».</p>
<span class="sticker">Bientôt sur iPhone et Android</span>
<div class="card">
<h2 style="margin-top:0">Comment ça marche</h2>
<ul><li>Tu photographies tes vêtements : l’appli reconnaît le type, la couleur et la saison.</li>
<li>Quelques questions et des duels de looks pour cerner ton style.</li>
<li>Chaque matin, 1 à 3 tenues prêtes, avec un conseil de styliste.</li></ul>
</div>
<p style="margin-top:24px">Une question ? Écris-nous : <a href="mailto:dressing.ai.app@outlook.com">dressing.ai.app@outlook.com</a></p>
`, 'Chaque matin, des tenues composées avec ta garde-robe, la météo et ton humeur.');

mkdirSync('site', { recursive: true });
writeFileSync('site/index.html', home);
writeFileSync('site/cgu.html', legal(TERMS));
writeFileSync('site/confidentialite.html', legal(PRIVACY));
console.log('site/ : index.html, cgu.html, confidentialite.html');
