/**
 * Notification du matin : programmée sur le téléphone (pas besoin de serveur).
 * Plus tard, le serveur pourra envoyer le vrai nom du look du jour ; en attendant,
 * on envoie une accroche + un conseil mode qui change chaque jour.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export async function scheduleMorningNotification(time: string, firstName?: string): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('morning', { name: 'Look du matin', importance: Notifications.AndroidImportance.DEFAULT });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [hour, minute] = time.split(':').map(Number);
  const day = new Date().getDate();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: firstName ? `Bonjour ${firstName} !` : 'Bonjour !',
      body: `${HOOKS[day % HOOKS.length]} ${TIPS[day % TIPS.length]}`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'morning' },
  });
  return true;
}
