/**
 * Compte de l'utilisateur (Supabase Auth).
 *
 * Connexion par e-mail : on envoie un code à 6 chiffres (et un lien dans le même e-mail).
 * L'utilisateur recopie le code, ou touche le lien sur son téléphone : les deux marchent.
 *
 * Mode démo : sans compte, l'appli tourne avec une garde-robe d'exemple, 100 % sur le téléphone.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type Result = { ok: true } | { ok: false; message: string };

type Auth = {
  ready: boolean;
  session: Session | null;
  userId: string | null;
  email: string | null;
  /** Mode démo choisi (pas de compte, données d'exemple). */
  demo: boolean;
  setDemo: (on: boolean) => void;
  sendCode: (email: string) => Promise<Result>;
  verifyCode: (email: string, code: string) => Promise<Result>;
  signOut: () => Promise<void>;
};

const DEMO_KEY = 'dressing-ai:demo';
const AuthContext = createContext<Auth | null>(null);

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

/** Traduit les erreurs de Supabase Auth en phrases simples. */
function frenchError(message: string | undefined, status?: number): string {
  const m = (message ?? '').toLowerCase();
  if (status === 429 || m.includes('rate limit') || m.includes('security purposes')) {
    const s = m.match(/after (\d+) seconds?/);
    return s ? `Patiente ${s[1]} secondes avant de redemander un code.` : 'Trop de demandes d’un coup. Réessaie dans quelques minutes.';
  }
  if (m.includes('expired') || (m.includes('invalid') && m.includes('token'))) return 'Ce code est incorrect ou a expiré. Vérifie-le ou demande-en un nouveau.';
  if (m.includes('invalid') && m.includes('email')) return 'Cette adresse e-mail ne semble pas valide.';
  if (m.includes('signups not allowed')) return 'Les inscriptions sont fermées pour le moment.';
  if (m.includes('network') || m.includes('fetch')) return 'Pas de connexion Internet. Vérifie ton réseau et réessaie.';
  return 'Petit souci de notre côté. Réessaie dans un instant.';
}

/** Récupère la session depuis le lien de l'e-mail (dressingai://connexion#access_token=…). */
async function sessionFromUrl(url: string): Promise<void> {
  if (!supabase || !url.includes('connexion')) return;
  const [, query = ''] = url.split('?');
  const [, fragment = ''] = url.split('#');
  const params = new URLSearchParams(`${query.split('#')[0]}&${fragment}`);
  const code = params.get('code');
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) await supabase.auth.setSession({ access_token, refresh_token });
  else if (code) await supabase.auth.exchangeCodeForSession(code);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demo, setDemoState] = useState(false);
  const [ready, setReady] = useState(false);
  const url = Linking.useURL();

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase ? supabase.auth.getSession().then(({ data }) => data.session).catch(() => null) : Promise.resolve(null),
      AsyncStorage.getItem(DEMO_KEY).catch(() => null),
    ]).then(([s, d]) => {
      if (!alive) return;
      setSession(s);
      setDemoState(d === '1');
      setReady(true);
    });
    const sub = supabase?.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => { alive = false; sub?.data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (url) sessionFromUrl(url).catch(() => {}); }, [url]);

  const setDemo = useCallback((on: boolean) => {
    setDemoState(on);
    AsyncStorage.setItem(DEMO_KEY, on ? '1' : '0').catch(() => {});
  }, []);

  const value = useMemo<Auth>(() => ({
    ready,
    session,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
    demo: demo && !session,
    setDemo,
    sendCode: async (email) => {
      if (!supabase) return { ok: false, message: 'La connexion n’est pas disponible.' };
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true, emailRedirectTo: Linking.createURL('connexion') },
      });
      return error ? { ok: false, message: frenchError(error.message, error.status) } : { ok: true };
    },
    verifyCode: async (email, code) => {
      if (!supabase) return { ok: false, message: 'La connexion n’est pas disponible.' };
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      if (error) return { ok: false, message: frenchError(error.message, error.status) };
      setDemo(false);
      return { ok: true };
    },
    signOut: async () => {
      await supabase?.auth.signOut().catch(() => {});
      setSession(null);
      setDemo(false);
    },
  }), [ready, session, demo, setDemo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
