// Outils communs aux fonctions serveur : identification de l'appelant, réponses, suivi du coût IA.
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

export async function caller(req: Request, admin: SupabaseClient): Promise<User | null> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}

/** Nombre d'appels IA de ce type aujourd'hui (pour plafonner le coût par personne). */
export async function callsToday(admin: SupabaseClient, userId: string, fn: string): Promise<number> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await admin.from('events').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('name', 'ai_call').eq('props->>fn', fn).gte('created_at', since.toISOString());
  return count ?? 0;
}

/** Trace de chaque appel IA : modèle, jetons, coût, durée (indicateur « coût IA par utilisateur »). */
export async function logAiCall(admin: SupabaseClient, userId: string, props: Record<string, unknown>): Promise<void> {
  await admin.from('events').insert({ user_id: userId, name: 'ai_call', props });
}
