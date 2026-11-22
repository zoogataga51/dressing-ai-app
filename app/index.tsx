import { Redirect } from 'expo-router';
import { useStore } from '@/state/AppStore';

/** Point d'entrée : inscription si c'est la première fois, sinon le look du jour. */
export default function Index() {
  const { profile } = useStore();
  return <Redirect href={profile.onboarded ? '/(tabs)' : '/onboarding'} />;
}
