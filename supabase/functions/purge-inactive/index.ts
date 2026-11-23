// Fonction serveur quotidienne : comptes inactifs (politique de confidentialité, « Combien de temps »).
//
// - 23 mois sans activité, avec e-mail : e-mail d'avertissement (« ouvre l'appli pour garder ton compte »).
// - 30 jours après l'avertissement, toujours inactif : suppression complète (photos + compte).
// - Compte sans e-mail (inscription anonyme), 24 mois sans activité : suppression (impossible de prévenir).
// - Revenu entre-temps : l'avertissement est effacé, rien n'est supprimé.
// Jamais de suppression d'un compte avec e-mail sans avertissement réellement envoyé.
//
// Appelée chaque nuit par pg_cron (migration 0007). Déployée sans vérification de jeton : elle ne fait que ce que
// la règle prévoit, appelée une ou cent fois. Secret nécessaire pour les e-mails : RESEND_API_KEY (envoi seul).

import { deleteUserCompletely } from '../_shared/accounts.ts';
import { adminClient, json } from '../_shared/server.ts';

const DAY = 86_400_000;
const WARN_AFTER = 700 * DAY;      // ≈ 23 mois
const DELETE_AFTER_WARNING = 30 * DAY;
const ANON_DELETE_AFTER = 730 * DAY; // 24 mois
const MAX_PER_RUN = 200;

const mail = (firstName: string | null) => `<div style="font-family:Helvetica,Arial,sans-serif;color:#141A2B;background:#F5F2EE;padding:32px 16px">
<div style="max-width:440px;margin:0 auto;background:#fff;border-radius:24px;padding:28px">
<p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:2px;color:#1F2B4D">DRESSING AI</p>
<h1 style="margin:0 0 12px;font-size:24px">${firstName ? `${firstName}, tu` : 'Tu'} nous manques</h1>
<p style="font-size:15px;line-height:22px;color:#5D6170">Tu n’as pas ouvert Dressing AI depuis près de 2 ans. Comme promis dans notre politique de confidentialité,
ton compte (garde-robe, photos et historique) sera <b>supprimé dans 30 jours</b>.</p>
<p style="font-size:15px;line-height:22px;color:#5D6170">Pour le garder, il suffit d’ouvrir l’appli une fois. Sinon, tu n’as rien à faire.</p>
<p style="font-size:12px;color:#9497A3;margin-top:20px">Une question : contact@dressingai.fr</p></div></div>`;

Deno.serve(async () => {
  const admin = adminClient();
  const now = Date.now();
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const { data: rows, error } = await admin.rpc('last_activity_per_user');
  if (error) return json({ error: error.message }, 500);

  const report = { warned: 0, deleted: 0, reactivated: 0, skippedNoMailKey: 0, errors: 0, details: [] as string[] };
  let actions = 0;
  for (const r of rows ?? []) {
    if (actions >= MAX_PER_RUN) break;
    const idle = now - Date.parse(r.last_active);
    const warnedAt = r.warned_at ? Date.parse(r.warned_at) : null;

    // Revenu après l'avertissement : on oublie l'avertissement.
    if (warnedAt && Date.parse(r.last_active) > warnedAt) {
      await admin.from('profiles').update({ inactivity_warned_at: null }).eq('id', r.user_id);
      report.reactivated++; continue;
    }
    if (r.is_anonymous || !r.email) {
      if (idle >= ANON_DELETE_AFTER) {
        actions++;
        const d = await deleteUserCompletely(admin, r.user_id);
        if (d.ok) report.deleted++; else { report.errors++; report.details.push(`${d.step}: ${d.detail}`.slice(0, 120)); }
      }
      continue;
    }
    if (warnedAt && now - warnedAt >= DELETE_AFTER_WARNING) {
      actions++;
      const d = await deleteUserCompletely(admin, r.user_id);
      if (d.ok) report.deleted++; else { report.errors++; report.details.push(`${d.step}: ${d.detail}`.slice(0, 120)); }
      continue;
    }
    if (!warnedAt && idle >= WARN_AFTER) {
      if (!resendKey) { report.skippedNoMailKey++; continue; } // pas d'e-mail possible → pas de suppression
      actions++;
      const { data: p } = await admin.from('profiles').select('first_name').eq('id', r.user_id).maybeSingle();
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Dressing AI <noreply@dressingai.fr>', to: [r.email], subject: 'Ton compte Dressing AI va être supprimé', html: mail(p?.first_name ?? null) }),
      });
      if (res.ok) { await admin.from('profiles').update({ inactivity_warned_at: new Date().toISOString() }).eq('id', r.user_id); report.warned++; }
      else report.errors++;
    }
  }
  return json(report);
});
