import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { useStore } from '@/state/AppStore';

/** Point d'entrée : inscription si c'est la première fois, sinon le look du jour. */
export default function Index() {
  const { profile } = useStore();
  useEffect(() => { track('app_open'); }, []);
  return <Redirect href={profile.onboarded ? '/(tabs)' : '/onboarding'} />;
}
