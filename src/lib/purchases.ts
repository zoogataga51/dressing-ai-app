/**
 * Paiement des abonnements via RevenueCat (App Store et Google Play).
 *
 * État : prêt, mais inactif tant que les comptes développeur Apple/Google et RevenueCat n'existent pas.
 * Pour l'activer : créer les produits dans les stores (mensuel 6,99 €, annuel 39,99 €), un « entitlement »
 * nommé `premium` et une « offering » par défaut dans RevenueCat, puis renseigner dans `.env` :
 *   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…
 * (clés publiques, sans danger dans l'appli). Le webhook RevenueCat → supabase/functions/revenuecat-webhook
 * tient à jour `profiles.premium_until`, que le serveur vérifie avant de composer les looks.
 *
 * Dans Expo Go, les achats sont impossibles : l'appli affiche les prix de référence.
 */
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

const KEY = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const IN_EXPO_GO = Constants.executionEnvironment === 'storeClient';
export const PURCHASES_ENABLED = !!KEY && !IN_EXPO_GO;
const ENTITLEMENT = 'premium';

export type Plan = { id: 'year' | 'month'; price: string; pkg?: PurchasesPackage };
export type PurchaseResult = { ok: true; premiumUntil: string | null } | { ok: false; cancelled?: boolean; message: string };

let configuredFor: string | null | undefined;

/** À appeler quand le compte change : RevenueCat rattache les achats à l'identifiant Supabase. */
export async function setupPurchases(userId: string | null): Promise<void> {
  if (!PURCHASES_ENABLED || configuredFor === userId) return;
  try {
    if (configuredFor === undefined) Purchases.configure({ apiKey: KEY!, appUserID: userId ?? undefined });
    else if (userId) await Purchases.logIn(userId);
    else await Purchases.logOut();
    configuredFor = userId;
  } catch { /* les achats resteront indisponibles */ }
}

/** Prix réels des stores (dans la devise de la personne), ou prix de référence. */
export async function getPlans(): Promise<Plan[]> {
  const fallback: Plan[] = [{ id: 'year', price: '39,99 €' }, { id: 'month', price: '6,99 €' }];
  if (!PURCHASES_ENABLED) return fallback;
  try {
    const current = (await Purchases.getOfferings()).current;
    const year = current?.annual; const month = current?.monthly;
    if (!year || !month) return fallback;
    return [{ id: 'year', price: year.product.priceString, pkg: year }, { id: 'month', price: month.product.priceString, pkg: month }];
  } catch {
    return fallback;
  }
}

const expiry = (info: { entitlements: { active: Record<string, { expirationDate: string | null }> } }) =>
  info.entitlements.active[ENTITLEMENT] ? info.entitlements.active[ENTITLEMENT].expirationDate ?? '2999-01-01T00:00:00Z' : null;

export async function buy(plan: Plan): Promise<PurchaseResult> {
  if (!PURCHASES_ENABLED || !plan.pkg) return { ok: false, message: 'Le paiement sera activé à la sortie sur l’App Store et Google Play.' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    const until = expiry(customerInfo);
    return until ? { ok: true, premiumUntil: until } : { ok: false, message: 'Paiement reçu mais pas encore confirmé. Réessaie dans un instant.' };
  } catch (e) {
    const cancelled = !!(e as { userCancelled?: boolean }).userCancelled;
    return { ok: false, cancelled, message: cancelled ? '' : 'Le paiement n’a pas abouti. Aucun montant n’a été prélevé.' };
  }
}

export async function restore(): Promise<PurchaseResult> {
  if (!PURCHASES_ENABLED) return { ok: false, message: 'La restauration sera disponible à la sortie sur les stores.' };
  try {
    const until = expiry(await Purchases.restorePurchases());
    return until ? { ok: true, premiumUntil: until } : { ok: false, message: 'Aucun abonnement trouvé sur ce compte Apple ou Google.' };
  } catch {
    return { ok: false, message: 'Impossible de vérifier tes achats pour le moment.' };
  }
}

/** Codes promo des influenceurs : codes d'offre Apple, ou codes promo Google Play. */
export async function redeemCode(): Promise<boolean> {
  if (!PURCHASES_ENABLED) return false;
  if (Platform.OS === 'ios') { await Purchases.presentCodeRedemptionSheet().catch(() => {}); return true; }
  await Linking.openURL('https://play.google.com/redeem').catch(() => {});
  return true;
}
