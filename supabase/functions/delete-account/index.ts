// Fonction serveur : suppression définitive du compte, à la demande de la personne (droit à l'effacement, RGPD).
// Vérifie qui appelle (jeton de connexion), puis efface photos et compte (../_shared/accounts.ts).

import { deleteUserCompletely } from '../_shared/accounts.ts';
import { adminClient, caller, cors, json } from '../_shared/server.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = adminClient();
  const user = await caller(req, admin);
  if (!user) return json({ error: 'Non autorisé' }, 401);
  const r = await deleteUserCompletely(admin, user.id);
  return r.ok ? json({ ok: true }) : json({ error: r.step }, 500);
});
