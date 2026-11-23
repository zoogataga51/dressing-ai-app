/**
 * Droit aux looks du jour : essai gratuit de 7 jours (sans carte), puis abonnement Premium.
 * Fin de l'essai sans abonnement : la garde-robe reste, mais plus de looks.
 * La même règle est appliquée par le serveur (supabase/functions/generate-outfits) : la vraie barrière est là.
 */
import type { Profile } from '@/state/AppStore';

export const TRIAL_DAYS = 7;
const DAY = 86_400_000;

export type Access = { state: 'premium' | 'trial' | 'expired'; daysLeft: number; trialEndsAt: Date | null };

export function getAccess(p: Pick<Profile, 'trialStartedAt' | 'premiumUntil'>, now = Date.now()): Access {
  if (p.premiumUntil && Date.parse(p.premiumUntil) > now) return { state: 'premium', daysLeft: 0, trialEndsAt: null };
  if (!p.trialStartedAt) return { state: 'trial', daysLeft: TRIAL_DAYS, trialEndsAt: null };
  const end = new Date(Date.parse(p.trialStartedAt) + TRIAL_DAYS * DAY);
  const left = Math.ceil((end.getTime() - now) / DAY);
  return left > 0 ? { state: 'trial', daysLeft: left, trialEndsAt: end } : { state: 'expired', daysLeft: 0, trialEndsAt: end };
}
