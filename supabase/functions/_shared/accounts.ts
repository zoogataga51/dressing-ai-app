// Suppression complète d'un compte : photos du bucket « garments », puis l'utilisateur
// (la base efface en cascade profil, vêtements, looks, duels ; les indicateurs sont anonymisés).
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export async function deleteUserCompletely(admin: SupabaseClient, userId: string): Promise<{ ok: boolean; step?: string; detail?: string }> {
  const bucket = admin.storage.from('garments');
  for (;;) {
    const { data: files, error } = await bucket.list(userId, { limit: 1000 });
    if (error) return { ok: false, step: 'photos', detail: error.message };
    if (!files?.length) break;
    const { error: delError } = await bucket.remove(files.map((f) => `${userId}/${f.name}`));
    if (delError) return { ok: false, step: 'photos' };
    if (files.length < 1000) break;
  }
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error ? { ok: false, step: 'compte', detail: error.message } : { ok: true };
}
