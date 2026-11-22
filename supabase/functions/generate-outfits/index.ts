// Fonction serveur (Supabase Edge Function, Deno) : compose les 3 looks du jour avec l'IA.
//
// Pourquoi côté serveur : la clé de l'API d'IA reste secrète, on contrôle le coût,
// et on garde une trace de chaque look proposé (table `outfits`).
//
// Variables à définir dans Supabase (Edge Functions > Secrets) :
//   AI_API_KEY      clé du fournisseur d'IA retenu après les tests de qualité et de coût
//   AI_MODEL        nom du modèle
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournies automatiquement.
//
// État : prête à brancher. Le choix du fournisseur se fera pendant la bêta (tests qualité/coût).

import { createClient } from 'jsr:@supabase/supabase-js@2';

type Garment = {
  id: string; category: string; subtype: string; label: string; color_name: string; color_hex: string;
  fit: string; material: string | null; seasons: string[]; warmth: number; formality: number; pattern: string | null;
};

const SYSTEM_PROMPT = `Tu es un styliste personnel exigeant. Tu composes des tenues UNIQUEMENT avec les vêtements fournis.
Règles impératives :
- Tenue complète : un haut + un bas, OU une robe ; toujours des chaussures ; une veste ou un manteau si la température est sous 16 °C ou s'il pleut ; un accessoire seulement s'il apporte quelque chose.
- Respecte strictement les préférences de couverture de la personne (jamais d'exception).
- Couleurs : au maximum une couleur forte par tenue, le reste en neutres ou en camaïeu ; évite les couleurs que la personne n'aime pas.
- Coupes : équilibre les volumes (ample en haut → plus ajusté en bas, et inversement), sauf si la personne aime l'oversize total.
- Météo : la chaleur des pièces doit correspondre à la température ; rien de léger sous 10 °C.
- N'utilise aucune pièce portée ces 3 derniers jours.
- Respecte l'humeur du jour et le style de la personne ; un des trois looks peut être un peu plus audacieux si elle l'accepte.
- Les 3 looks doivent être nettement différents entre eux.
- Donne à chaque look un nom court et chic (2 à 3 mots), une phrase d'ambiance, et un conseil concret de styliste (comment le porter).
Réponds UNIQUEMENT en JSON valide, au format :
{"outfits":[{"name":"","vibe":"","tip":"","garment_ids":["…"]}]}`;

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: { user } } = await admin.auth.getUser(auth.replace('Bearer ', ''));
  if (!user) return new Response('Non autorisé', { status: 401 });

  const { mood = 'free', weather } = await req.json();
  const [{ data: profile }, { data: garments }, { data: worn }] = await Promise.all([
    admin.from('profiles').select('answers, styles').eq('id', user.id).single(),
    admin.from('garments').select('*').eq('user_id', user.id).eq('archived', false),
    admin.from('wear_history').select('garment_id, for_date').eq('user_id', user.id)
      .gte('for_date', new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10)),
  ]);

  const recent = new Set((worn ?? []).map((w) => w.garment_id));
  const available = ((garments ?? []) as Garment[]).filter((g) => !recent.has(g.id));
  // Liste compacte = moins de texte envoyé = moins cher.
  const wardrobe = available.map((g) =>
    `${g.id} | ${g.category} | ${g.label} | ${g.color_name} | coupe ${g.fit} | chaleur ${g.warmth}/3 | habillé ${g.formality}/3${g.pattern ? ` | ${g.pattern}` : ''}`).join('\n');

  const userPrompt = `Profil : ${JSON.stringify({ styles: profile?.styles, reponses: profile?.answers })}
Météo : ${JSON.stringify(weather)}
Humeur du jour : ${mood}
Garde-robe disponible (id | catégorie | nom | couleur | …) :
${wardrobe}`;

  const apiKey = Deno.env.get('AI_API_KEY');
  if (!apiKey) return new Response(JSON.stringify({ error: 'IA non configurée' }), { status: 503 });

  // Appel au fournisseur d'IA : à brancher après les tests (voir docs/ARCHITECTURE.md, « Choix de l'IA »).
  const result = await callModel(apiKey, Deno.env.get('AI_MODEL') ?? '', SYSTEM_PROMPT, userPrompt);
  const ids = new Set(available.map((g) => g.id));
  const outfits = (result.outfits ?? [])
    .filter((o: { garment_ids: string[] }) => o.garment_ids?.length && o.garment_ids.every((id) => ids.has(id))) // jamais de pièce inventée
    .slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);
  await admin.from('outfits').insert(outfits.map((o: { name: string; vibe: string; tip: string; garment_ids: string[] }, i: number) => ({
    user_id: user.id, for_date: today, position: i + 1, name: o.name, vibe: o.vibe, tip: o.tip,
    mood, weather, garment_ids: o.garment_ids, source: 'ai',
  })));

  return new Response(JSON.stringify({ outfits }), { headers: { 'Content-Type': 'application/json' } });
});

async function callModel(_apiKey: string, _model: string, _system: string, _user: string): Promise<{ outfits?: unknown[] }> {
  throw new Error('Fournisseur d’IA à brancher (étape 4 du plan).');
}
