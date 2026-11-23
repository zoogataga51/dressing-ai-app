import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
// Usage : node scripts/e2e/scenario.mjs <dossier de travail> <photo.jpg>
const S = process.argv[2];
const PHOTO = process.argv[3];
const jwt = readFileSync(`${S}/.jwt`, 'utf8');
const sb = createClient('https://syitvnkpdzeapvvekbzk.supabase.co', 'sb_publishable_jbXF_1Zg6xY6QnuTzgw4Lw_Bcd1x7zd', {
  global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false } });
const uid = '33333333-3333-4333-8333-333333333333';
const log = (...a) => console.log(...a);

const up = await sb.storage.from('garments').upload(`${uid}/a1.jpg`, readFileSync(PHOTO), { contentType: 'image/jpeg', upsert: true });
log('1. envoi photo :', up.error?.message ?? 'OK');
const bad = await sb.storage.from('garments').upload(`autre-utilisateur/x.jpg`, readFileSync(PHOTO), { contentType: 'image/jpeg' });
log('   envoi dans le dossier d’un autre (doit échouer) :', bad.error ? 'refusé ✔' : 'ACCEPTÉ ✘');
let t = Date.now();
const an = await sb.functions.invoke('analyze-garment', { body: { path: `${uid}/a1.jpg` } });
log('2. analyse :', Date.now() - t, 'ms', JSON.stringify(an.data ?? an.error?.message));
const hack = await sb.functions.invoke('analyze-garment', { body: { path: `autre/a1.jpg` } });
log('   analyse photo d’un autre (doit échouer) :', hack.error ? 'refusé ✔' : 'ACCEPTÉ ✘');

const G = (category, subtype, label, color_name, warmth = 2, formality = 2, seasons = ['spring', 'summer', 'autumn', 'winter'], fit = 'regular') =>
  ({ id: crypto.randomUUID(), user_id: uid, category, subtype, label, color_name, color_hex: '#888888', fit, seasons, warmth, formality, pattern: 'Uni' });
const items = [G('top', 'T-shirt', 'T-shirt blanc', 'Blanc', 1, 1), G('top', 'Pull', 'Pull marine', 'Marine', 3, 2, ['autumn', 'winter']),
  G('top', 'Chemise', 'Chemise oxford bleue', 'Bleu', 1, 2), G('bottom', 'Jean', 'Jean brut', 'Bleu jean', 2, 1), G('bottom', 'Chino', 'Chino beige', 'Beige'),
  G('outer', 'Manteau', 'Manteau gris', 'Gris', 3, 3, ['autumn', 'winter']), G('outer', 'Veste', 'Veste en jean', 'Bleu jean', 2, 1, ['spring', 'autumn']),
  G('shoes', 'Baskets', 'Baskets blanches', 'Blanc', 2, 1), G('shoes', 'Derbies', 'Derbies marron', 'Marron', 2, 3)];
const ins = await sb.from('garments').insert(items);
log('3. garde-robe :', ins.error?.message ?? `${items.length} pièces OK`);
const pr = await sb.from('profiles').update({ first_name: 'Test', answers: { wardrobe: ['men'], image: ['elegant'] }, styles: ['classic'], onboarded_at: new Date().toISOString() }).eq('id', uid);
log('   profil :', pr.error?.message ?? 'OK');

const weather = { city: 'Paris', tempC: 9, minC: 6, maxC: 13, condition: 'cloud' };
const date = new Date().toISOString().slice(0, 10);
t = Date.now();
const gen = await sb.functions.invoke('generate-outfits', { body: { mood: 'free', weather, date } });
log('4. looks :', Date.now() - t, 'ms');
const byId = new Map(items.map((g) => [g.id, g.label]));
for (const o of gen.data?.outfits ?? []) log(`   ✔ ${o.name} : ${o.garment_ids.map((i) => byId.get(i)).join(' + ')} — ${o.tip}`);
if (!gen.data?.outfits?.length) log('   ', JSON.stringify(gen.data ?? gen.error?.message));
t = Date.now();
const again = await sb.functions.invoke('generate-outfits', { body: { mood: 'free', weather, date } });
log('5. même humeur, 2e fois :', Date.now() - t, 'ms, cache =', again.data?.cached, ', looks =', again.data?.outfits?.length);
const worn = await sb.from('outfits').update({ status: 'worn' }).eq('id', gen.data?.outfits?.[0]?.id ?? '00000000-0000-0000-0000-000000000000').select('id');
log('6. look porté :', worn.error?.message ?? `${worn.data.length} ligne`);
const ev = await sb.from('events').insert({ user_id: uid, name: 'app_open', props: {} });
log('7. indicateur :', ev.error?.message ?? 'OK');
const del = await sb.functions.invoke('delete-account', { method: 'POST' });
log('8. suppression du compte :', JSON.stringify(del.data ?? del.error?.message));
