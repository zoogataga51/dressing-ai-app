// Fonction serveur : suppression définitive du compte (droit à l'effacement, RGPD).
//
// 1. vérifie qui appelle (jeton de connexion) ;
// 2. efface toutes ses photos du bucket « garments » ;
// 3. supprime l'utilisateur : la base efface en cascade profil, vêtements, looks, duels.
//    Les indicateurs (table events) sont anonymisés (user_id → null), pas supprimés.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: cors });

  // Photos : on liste par paquets de 1000 et on supprime.
  const bucket = admin.storage.from('garments');
  for (;;) {
    const { data: files, error } = await bucket.list(user.id, { limit: 1000 });
    if (error) return new Response(JSON.stringify({ error: 'Photos' }), { status: 500, headers: cors });
    if (!files?.length) break;
    const { error: delError } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
    if (delError) return new Response(JSON.stringify({ error: 'Photos' }), { status: 500, headers: cors });
    if (files.length < 1000) break;
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return new Response(JSON.stringify({ error: 'Compte' }), { status: 500, headers: cors });
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
