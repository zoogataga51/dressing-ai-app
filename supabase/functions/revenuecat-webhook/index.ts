// Fonction serveur : RevenueCat prévient ici à chaque achat, renouvellement, annulation ou expiration.
//
// - Met à jour profiles.premium_until (vérifié par generate-outfits avant de composer les looks).
// - Garde une trace de chaque événement dans `events` (MRR, conversion essai → abonné, churn : indicateurs de l'exit).
//
// Réglage (le jour où RevenueCat est créé) : secret REVENUECAT_WEBHOOK_SECRET dans les Edge Functions, et dans
// RevenueCat > Integrations > Webhooks : URL https://<projet>.supabase.co/functions/v1/revenuecat-webhook,
// en-tête Authorization = « Bearer <le même secret> ». Déployée SANS vérification de jeton Supabase (verify_jwt false) :
// c'est le secret partagé qui protège l'accès.

import { adminClient, json } from '../_shared/server.ts';

const GRANT = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'Non configuré' }, 503);
  if (req.headers.get('Authorization') !== `Bearer ${secret}`) return json({ error: 'Non autorisé' }, 401);

  const { event } = await req.json().catch(() => ({ event: null }));
  if (!event?.type) return json({ error: 'Événement invalide' }, 400);
  if (event.type === 'TEST') return json({ ok: true });

  // On rattache les achats à l'identifiant Supabase (Purchases.logIn(userId) dans l'appli).
  const ids: string[] = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].filter((x) => typeof x === 'string' && UUID.test(x));
  const userId = ids[0];
  if (!userId) return json({ ok: true, ignored: 'utilisateur anonyme' });

  const admin = adminClient();
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
  if (GRANT.has(event.type)) {
    await admin.from('profiles').update({ premium_until: expiresAt ?? '2999-01-01T00:00:00Z', premium_product: event.product_id ?? null }).eq('id', userId);
  } else if (event.type === 'EXPIRATION') {
    await admin.from('profiles').update({ premium_until: expiresAt ?? new Date().toISOString() }).eq('id', userId);
  }
  // CANCELLATION et BILLING_ISSUE : l'accès continue jusqu'à la date d'expiration, rien à changer.

  await admin.from('events').insert({
    user_id: userId, name: 'subscription_event',
    props: {
      type: event.type, product: event.product_id, period: event.period_type, store: event.store, price: event.price,
      price_local: event.price_in_purchased_currency, currency: event.currency, country: event.country_code,
      offer_code: event.offer_code ?? null, expires_at: expiresAt, environment: event.environment,
    },
  });
  return json({ ok: true });
});
