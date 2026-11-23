// Fonction serveur : reconnaît un vêtement sur une photo (type, couleur, coupe, matière, saisons…).
//
// L'appli envoie d'abord la photo dans le bucket privé « garments » (garments/<utilisateur>/<id>.jpg),
// puis appelle cette fonction avec { path }. La réponse est une proposition : l'utilisateur valide ou corrige.
// Modèle : Gemini 3.5 Flash-Lite (≈ 0,08 centime par photo), repli sur Gemini 3.5 Flash si saturé.

import { geminiJsonWithFallback } from '../_shared/gemini.ts';
import { cleanAnalysis, GARMENT_SCHEMA, GARMENT_SYSTEM, type GarmentAnalysis } from '../_shared/garment.ts';
import { adminClient, caller, callsToday, cors, json, logAiCall } from '../_shared/server.ts';

const MAX_PER_DAY = 80;          // largement assez pour remplir une garde-robe en une soirée
const MAX_BYTES = 6 * 1024 * 1024;
const MODELS = (Deno.env.get('GEMINI_VISION_MODELS') ?? 'gemini-3.5-flash-lite,gemini-3.5-flash').split(',');

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = adminClient();
  const user = await caller(req, admin);
  if (!user) return json({ error: 'Non autorisé' }, 401);

  const { path } = await req.json().catch(() => ({}));
  if (typeof path !== 'string' || !path.startsWith(`${user.id}/`) || path.includes('..')) return json({ error: 'Photo invalide' }, 400);
  if ((await callsToday(admin, user.id, 'analyze-garment')) >= MAX_PER_DAY) return json({ error: 'Limite du jour atteinte' }, 429);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'IA non configurée' }, 503);

  const { data: file, error } = await admin.storage.from('garments').download(path);
  if (error || !file) return json({ error: 'Photo introuvable' }, 404);
  if (file.size > MAX_BYTES) return json({ error: 'Photo trop lourde' }, 413);
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const r = await geminiJsonWithFallback<GarmentAnalysis>(MODELS, {
      apiKey,
      system: GARMENT_SYSTEM,
      schema: GARMENT_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.2,
      thinking: 'low',
      parts: [{ inline_data: { mime_type: file.type || 'image/jpeg', data: toBase64(bytes) } }, { text: 'Analyse ce vêtement.' }],
    });
    await logAiCall(admin, user.id, { fn: 'analyze-garment', model: r.model, tokens_in: r.tokensIn, tokens_out: r.tokensOut, cost_eur: r.costEur, ms: r.ms });
    return json({ analysis: cleanAnalysis(r.data), model: r.model });
  } catch (e) {
    await logAiCall(admin, user.id, { fn: 'analyze-garment', error: String(e).slice(0, 200) });
    return json({ error: 'Analyse impossible' }, 502);
  }
});
