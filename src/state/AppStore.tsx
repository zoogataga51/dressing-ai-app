/**
 * État de l'appli : profil, garde-robe, historique.
 *
 * - Avec un compte : copie sur le téléphone (pour que tout soit instantané, même hors ligne)
 *   et synchronisation avec Supabase (src/lib/sync.ts). La base fait foi.
 *   Un nouveau compte commence avec une garde-robe vide.
 * - En mode démo (sans compte) : tout reste sur le téléphone, avec une garde-robe d'exemple.
 *
 * Les écrans n'ont pas à savoir dans quel mode on est : ils appellent les mêmes actions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MOCK_HISTORY, MOCK_WARDROBE } from '@/data/mock';
import { localDate } from '@/lib/date';
import { enqueue, flush, pullAll, type Op } from '@/lib/sync';
import type { Garment, HistoryEntry, Mood, Outfit } from '@/types';
import { useAuth } from './AuthStore';

export type StyleAnswers = Record<string, string[]>; // id de question → ids des réponses
export type DuelChoice = { duelId: string; picked: 'a' | 'b' | 'none' };

export type Profile = {
  firstName: string;
  city: string;
  notificationTime: string; // « 07:30 »
  onboarded: boolean;
  onboardedAt?: string;
  answers: StyleAnswers;
  duels: DuelChoice[];
  trialStartedAt?: string;
  /** Fin de l'abonnement Premium (tenu à jour par le serveur, jamais envoyé par l'appli). */
  premiumUntil?: string;
};

type State = { profile: Profile; wardrobe: Garment[]; history: HistoryEntry[] };

type Store = State & {
  ready: boolean;
  /** Compte dont les données ont été rechargées depuis la base (null tant que ce n'est pas fait). */
  syncedUserId: string | null;
  setAnswers: (answers: StyleAnswers) => void;
  setDuels: (duels: DuelChoice[]) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: () => void;
  addGarment: (g: Garment) => void;
  updateGarment: (id: string, patch: Partial<Garment>) => void;
  removeGarment: (id: string) => void;
  wearOutfit: (outfit: Outfit, mood: Mood, tempC: number) => void;
  /** Recharge depuis la base (tirer pour rafraîchir, retour dans l'appli). */
  refresh: () => Promise<void>;
  /** Efface les données de ce téléphone (déconnexion, suppression du compte, fin de la démo). */
  resetAll: () => Promise<void>;
};

const DEMO_KEY = 'dressing-ai:state:v1';
const accountKey = (userId: string) => `dressing-ai:state:${userId}`;

const emptyProfile: Profile = { firstName: '', city: 'Paris', notificationTime: '07:30', onboarded: false, answers: {}, duels: [] };
const demoState: State = { profile: emptyProfile, wardrobe: MOCK_WARDROBE, history: MOCK_HISTORY };
const accountState: State = { profile: emptyProfile, wardrobe: [], history: [] };

/** Identifiant unique (format attendu par la base). */
export const newId = () => Crypto.randomUUID();

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const userId = auth.userId;
  const key = userId ? accountKey(userId) : DEMO_KEY;

  const [state, setState] = useState<State>(userId ? accountState : demoState);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const pull = useCallback(async (uid: string) => {
    try {
      const sent = await flush(uid); // d'abord nos changements en attente…
      if (!sent) return;              // …sinon on garderait des données plus anciennes que les nôtres
      const remote = await pullAll(uid);
      setState((s) => ({ profile: { ...s.profile, ...remote.profile }, wardrobe: remote.wardrobe, history: remote.history }));
    } catch {
      // Hors ligne : on garde la copie du téléphone.
    } finally {
      setSyncedUserId(uid);
    }
  }, []);

  // Changement de compte (connexion, déconnexion, mode démo) : on charge les bonnes données.
  useEffect(() => {
    if (!auth.ready) return;
    let alive = true;
    setLoadedKey(null);
    setSyncedUserId(null);
    AsyncStorage.getItem(key)
      .catch(() => null)
      .then((raw) => {
        if (!alive) return;
        const base = userId ? accountState : demoState;
        let local: Partial<State> = {};
        try { local = raw ? JSON.parse(raw) : {}; } catch { /* copie abîmée : on repart de zéro */ }
        setState({ ...base, ...local, profile: { ...base.profile, ...local.profile } });
        setLoadedKey(key);
        setBooted(true);
        if (userId) pull(userId);
      });
    return () => { alive = false; };
  }, [auth.ready, key, userId, pull]);

  // Copie sur le téléphone à chaque changement.
  useEffect(() => {
    if (loadedKey === key) AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  }, [state, key, loadedKey]);

  const send = useCallback((op: Op) => { if (userId) enqueue(userId, op).catch(() => {}); }, [userId]);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    const profile = { ...stateRef.current.profile, ...patch };
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
    send({ t: 'profile', profile });
  }, [send]);

  const store = useMemo<Store>(() => ({
    ...state,
    ready: booted && auth.ready,
    syncedUserId,
    setAnswers: (answers) => patchProfile({ answers }),
    setDuels: (duels) => {
      patchProfile({ duels });
      send({ t: 'duels', duels });
    },
    updateProfile: patchProfile,
    completeOnboarding: () => {
      const now = new Date().toISOString();
      const p = stateRef.current.profile;
      // Refaire le questionnaire ne relance pas l'essai gratuit.
      patchProfile({ onboarded: true, onboardedAt: p.onboardedAt ?? now, trialStartedAt: p.trialStartedAt ?? now });
    },
    addGarment: (g) => {
      setState((s) => ({ ...s, wardrobe: [g, ...s.wardrobe] }));
      send({ t: 'garment', garment: g });
    },
    updateGarment: (id, patch) => {
      const current = stateRef.current.wardrobe.find((g) => g.id === id);
      setState((s) => ({ ...s, wardrobe: s.wardrobe.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
      if (current) send({ t: 'garment', garment: { ...current, ...patch } });
    },
    removeGarment: (id) => {
      setState((s) => ({ ...s, wardrobe: s.wardrobe.filter((g) => g.id !== id) }));
      send({ t: 'garmentDelete', id });
    },
    wearOutfit: (outfit, mood, tempC) => {
      const today = localDate();
      const entry: HistoryEntry = { date: today, outfit, mood, tempC };
      const ids = new Set(outfit.garmentIds);
      setState((s) => ({
        ...s,
        history: [entry, ...s.history.filter((h) => h.date !== today)],
        wardrobe: s.wardrobe.map((g) => (ids.has(g.id) ? { ...g, lastWornAt: today, wearCount: g.wearCount + 1 } : g)),
      }));
      send({ t: 'worn', entry, rowId: newId() });
    },
    refresh: async () => { if (userId) await pull(userId); },
    resetAll: async () => {
      await AsyncStorage.removeItem(key).catch(() => {});
      setState(userId ? accountState : demoState);
    },
  }), [state, booted, auth.ready, syncedUserId, patchProfile, send, userId, pull, key]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore doit être utilisé dans <AppStoreProvider>');
  return ctx;
}
