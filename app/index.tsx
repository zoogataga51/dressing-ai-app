import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { useAuth } from '@/state/AuthStore';
import { useStore } from '@/state/AppStore';

/**
 * Point d'entrée :
 *  - connecté ou en démo, profil terminé → look du jour ;
 *  - connecté ou en démo, profil à faire → questionnaire ;
 *  - sinon → accueil (création de compte).
 */
export default function Index() {
  const { userId, demo } = useAuth();
  const { profile } = useStore();
  useEffect(() => { track('app_open'); }, []);
  if (!userId && !demo) return <Redirect href="/onboarding" />;
  return <Redirect href={profile.onboarded ? '/(tabs)' : '/onboarding/questionnaire'} />;
}
