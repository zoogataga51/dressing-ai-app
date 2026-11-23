// Test d'affichage dans un navigateur (parcours démo complet, profil Homme) avec captures d'écran.
// 1. EXPO_OFFLINE=1 npx expo install react-dom react-native-web   (temporaire : remettre package.json ensuite)
// 2. CI=1 EXPO_OFFLINE=1 npx expo start --web --port 8099
// 3. node scripts/smoke-web/smoke.js <dossier des captures>  → « Aucune erreur » attendu (hors avertissements web)
const { chromium } = require('playwright');
(async () => {
  const S = process.argv[2] ?? '.'; // dossier où ranger les captures
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGE: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 300)); });
  const shot = async (n) => page.screenshot({ path: `${S}/web_${n}.png` });
  await page.addInitScript(() => { const st = () => { const s = document.createElement('style'); s.textContent = '#error-toast{display:none!important}'; document.head.appendChild(s); }; document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', st) : st(); });
  const click = async (t) => { await page.getByText(t, { exact: false }).last().click(); await page.waitForTimeout(900); };
  await page.goto('http://localhost:8099', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(3000); await shot('1_accueil');
  await click('J’ai déjà un compte'); await shot('2_connexion');
  await page.goBack(); await page.waitForTimeout(800);
  await click('Mode démo'); await page.waitForTimeout(1500); await shot('3_questionnaire');
  // Prénom
  await page.locator('input').last().click(); await page.keyboard.type('Léa'); await click('Continuer');
  await click('Homme'); await page.waitForTimeout(600); await shot('4_ville');
  await page.waitForTimeout(800); console.log('inputs', await page.locator('input').count()); await page.locator('input').last().click(); await page.keyboard.press('Control+A'); await page.keyboard.type('Lyon'); await page.waitForTimeout(300); await click('Continuer');
  // Semaine (multi) → continuer ; on avance en choisissant la 1re option à chaque fois
  for (let i = 0; i < 20; i++) {
    const body = await page.locator('body').innerText();
    if (body.includes('Lequel tu porterais')) break;
    if (body.includes('Tu as des préférences de couverture')) await shot('5_couverture_homme');
    if (body.includes('Les chaussures que tu portes')) await shot('6_chaussures_homme');
    await page.waitForTimeout(600);
    const opts = page.locator('[role="checkbox"]');
    const checked = await page.locator('[role="checkbox"][aria-checked="true"]').count();
    if ((await opts.count()) && !checked) { await opts.first().click(); await page.waitForTimeout(700); }
    const btn = page.getByText(/^(Continuer|Passer|Passer aux duels de looks)$/);
    if (await btn.count()) { await btn.last().click({ timeout: 3000 }).catch(() => console.log('bouton bloqué :', body.split('\n').slice(0, 4).join(' | '))); }
    await page.waitForTimeout(700);
  }
  await shot('7_duels');
  for (let i = 0; i < 10; i++) { await page.locator('[aria-label^="Je préfère"]').first().click().catch(() => {}); await page.waitForTimeout(900); }
  await shot('8_profil_style');
  await click('Ajouter mes vêtements'); await page.waitForTimeout(1000); await shot('9_ajout');
  await page.goto('http://localhost:8099/', { waitUntil: 'networkidle' }); await page.waitForTimeout(3500); await shot('10_aujourdhui');
  await page.goto('http://localhost:8099/profil', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); await shot('11_profil');
  await page.goto('http://localhost:8099/abonnement', { waitUntil: 'networkidle' }); await page.waitForTimeout(2500); await shot('12_abonnement');
  await page.goto('http://localhost:8099/legal/confidentialite', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000); await shot('13_confidentialite');
  console.log(errors.length ? [...new Set(errors)].join('\n') : 'Aucune erreur');
  await browser.close();
})();
