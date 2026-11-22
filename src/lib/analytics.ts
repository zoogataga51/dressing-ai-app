/**
 * Suivi des événements clés, pour les indicateurs de l'exit :
 * rétention J7/J30, conversion essai → abonné, abandon à chaque étape de l'inscription,
 * looks portés, etc.
 *
 * Aujourd'hui : gardés sur le téléphone (les 500 derniers). Quand Supabase sera branché,
 * ils seront envoyés dans la table `events` (voir supabase/migrations/0001_init.sql).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type EventName =
  | 'app_open'
  | 'onboarding_question'
  | 'onboarding_duel'
  | 'onboarding_done'
  | 'garment_added'
  | 'garment_edited'
  | 'garment_removed'
  | 'outfit_viewed'
  | 'outfit_worn'
  | 'mood_changed'
  | 'paywall_view'
  | 'notification_time_set';

type Event = { name: EventName; props: Record<string, unknown>; at: string };

const KEY = 'dressing-ai:events';
const MAX = 500;

export function track(name: EventName, props: Record<string, unknown> = {}): void {
  const event: Event = { name, props, at: new Date().toISOString() };
  if (supabase) {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) supabase?.from('events').insert({ user_id: data.user.id, name, props }).then(() => {});
    }).catch(() => {});
  }
  AsyncStorage.getItem(KEY)
    .then((raw) => {
      const list: Event[] = raw ? JSON.parse(raw) : [];
      list.push(event);
      return AsyncStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
    })
    .catch(() => {});
}

export async function getEvents(): Promise<Event[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
