/**
 * Notification du matin.
 *
 * - Avec un compte : le téléphone donne son adresse de notification (jeton Expo) au serveur. Chaque matin, à
 *   l'heure choisie, la fonction morning-looks envoie le NOM du look préparé dans la nuit
 *   (« Ton look du jour : Camel et bordeaux »).
 * - Sans compte (démo) ou si le jeton est indisponible : rappel programmé sur le téléphone, avec une accroche
 *   et un conseil mode qui changent chaque jour.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const HOOKS = [
  'Tes 3 looks du jour sont prêts ✦',
  'Café, et on choisit ta tenue ?',
  'Ton styliste a bossé cette nuit : 3 looks t’attendent.',
  'La météo est tombée, tes looks aussi.',
];

const TIPS = [
  'Astuce : une seule couleur forte par tenue, le reste en neutres.',
  'Astuce : rentre ton haut devant pour une silhouette plus nette.',
  'Astuce : assortis chaussures et ceinture.',
  'Astuce : retrousse tes manches, ça change tout.',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Jeton Expo du téléphone, ou null (simulateur, refus, réseau…). */
async function pushToken(): Promise<string | null> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return null;
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

async function scheduleLocal(time: string, firstName?: string): Promise<void> {
  const [hour, minute] = time.split(':').map(Number);
  const day = new Date().getDate();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: firstName ? `Bonjour ${firstName} !` : 'Bonjour !',
      body: `${HOOKS[day % HOOKS.length]} ${TIPS[day % TIPS.length]}`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'morning' },
  });
}

/**
 * Active la notification du matin à l'heure choisie. Renvoie false si la personne a refusé les notifications.
 * `userId` : compte connecté (le serveur enverra le vrai look) ; null en démo.
 */
export async function scheduleMorningNotification(time: string, firstName?: string, userId?: string | null): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('morning', { name: 'Look du matin', importance: Notifications.AndroidImportance.DEFAULT });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  const token = userId && supabase ? await pushToken() : null;
  if (token && userId && supabase) {
    const { error } = await supabase.from('profiles').update({ push_token: token, notification_time: time }).eq('id', userId);
    if (!error) return true; // le serveur prend le relais, pas de doublon local
  }
  await scheduleLocal(time, firstName);
  return true;
}
