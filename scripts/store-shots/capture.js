// Captures brutes de l'appli pour les fiches App Store / Google Play (mode démo, profil Femme).
// Prérequis : appli lancée en web (voir scripts/smoke-web/smoke.js). Usage : node scripts/store-shots/capture.js <dossier>
const { chromium } = require('playwright');
(async () => {
  const OUT = process.argv[2] ?? '.';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
  await page.addInitScript(() => { const st = () => { const s = document.createElement('style'); s.textContent = '#error-toast{display:none!important}'; document.head.appendChild(s); }; document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', st) : st(); });
  const shot = (n) => page.screenshot({ path: `${OUT}/raw_${n}.png` });
  const click = async (t) => { await page.getByText(t, { exact: false }).last().click(); await page.waitForTimeout(900); };
  await page.goto('http://localhost:8099', { waitUntil: 'networkidle', timeout: 120000 }); await page.waitForTimeout(2500);
  await shot('0_accueil');
  await click('Mode démo'); await page.waitForTimeout(1200);
  await page.locator('input').last().click(); await page.keyboard.type('Léa'); await click('Continuer');
  await click('Femme'); await page.waitForTimeout(900);
  await page.locator('input').last().click(); await page.keyboard.press('Control+A'); await page.keyboard.type('Lyon'); await page.waitForTimeout(300); await click('Continuer');
  for (let i = 0; i < 22; i++) {
    const body = await page.locator('body').innerText();
    if (body.includes('Lequel tu porterais')) break;
    await page.waitForTimeout(600);
    const checked = await page.locator('[role="checkbox"][aria-checked="true"]').count();
    const opts = page.locator('[role="checkbox"]');
    if ((await opts.count()) && !checked) { await opts.first().click(); await page.waitForTimeout(700); }
    const btn = page.getByText(/^(Continuer|Passer|Passer aux duels de looks)$/);
    if (await btn.count()) await btn.last().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(1500); await shot('1_duel');
  for (let i = 0; i < 10; i++) { await page.locator('[aria-label^="Je préfère"]').first().click().catch(() => {}); await page.waitForTimeout(900); }
  await page.waitForTimeout(1200); await shot('2_style');
  await click('Ajouter mes vêtements'); await page.waitForTimeout(1500);
  await page.goto('http://localhost:8099/', { waitUntil: 'networkidle' }); await page.waitForTimeout(3500); await shot('3_aujourdhui');
  await page.getByText('Chic', { exact: true }).first().click().catch(() => {}); await page.waitForTimeout(1500); await shot('4_humeur');
  await page.goto('http://localhost:8099/garde-robe', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); await shot('5_garderobe');
  await page.goto('http://localhost:8099/historique', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); await shot('6_historique');
  await browser.close(); console.log('captures ok');
})();
