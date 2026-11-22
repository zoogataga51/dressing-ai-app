/**
 * État de l'appli, gardé sur le téléphone (AsyncStorage).
 *
 * Pour l'instant tout est local, avec des données de démo. Quand Supabase sera branché,
 * ces actions appelleront la base (voir src/lib/supabase.ts) sans que les écrans changent.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MOCK_HISTORY, MOCK_WARDROBE } from '@/data/mock';
import type { Garment, HistoryEntry, Mood, Outfit } from '@/types';

export type StyleAnswers = Record<string, string[]>; // id de question → ids des réponses
export type DuelChoice = { duelId: string; picked: 'a' | 'b' | 'none' };

export type Profile = {
  firstName: string;
  city: string;
  notificationTime: string; // « 07:30 »
  onboarded: boolean;
  answers: StyleAnswers;
  duels: DuelChoice[];
  trialStartedAt?: string;
};

type State = { profile: Profile; wardrobe: Garment[]; history: HistoryEntry[] };

type Store = State & {
  ready: boolean;
  setAnswers: (answers: StyleAnswers) => void;
  setDuels: (duels: DuelChoice[]) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: () => void;
  addGarment: (g: Garment) => void;
  updateGarment: (id: string, patch: Partial<Garment>) => void;
  removeGarment: (id: string) => void;
  wearOutfit: (outfit: Outfit, mood: Mood, tempC: number) => void;
  resetAll: () => Promise<void>;
};

const STORAGE_KEY = 'dressing-ai:state:v1';

const initialState: State = {
  profile: { firstName: '', city: 'Paris', notificationTime: '07:30', onboarded: false, answers: {}, duels: [] },
  // Démo : garde-robe et historique pré-remplis pour tester l'interface.
  wardrobe: MOCK_WARDROBE,
  history: MOCK_HISTORY,
};

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setState({ ...initialState, ...JSON.parse(raw) }); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const store = useMemo<Store>(() => ({
    ...state,
    ready,
    setAnswers: (answers) => patchProfile({ answers }),
    setDuels: (duels) => patchProfile({ duels }),
    updateProfile: patchProfile,
    completeOnboarding: () => patchProfile({ onboarded: true, trialStartedAt: new Date().toISOString() }),
    addGarment: (g) => setState((s) => ({ ...s, wardrobe: [g, ...s.wardrobe] })),
    updateGarment: (id, patch) => setState((s) => ({ ...s, wardrobe: s.wardrobe.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
    removeGarment: (id) => setState((s) => ({ ...s, wardrobe: s.wardrobe.filter((g) => g.id !== id) })),
    wearOutfit: (outfit, mood, tempC) => setState((s) => {
      const today = new Date().toISOString().slice(0, 10);
      const ids = new Set(outfit.garmentIds);
      return {
        ...s,
        history: [{ date: today, outfit, mood, tempC }, ...s.history.filter((h) => h.date !== today)],
        wardrobe: s.wardrobe.map((g) => (ids.has(g.id) ? { ...g, lastWornAt: today, wearCount: g.wearCount + 1 } : g)),
      };
    }),
    resetAll: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      setState(initialState);
    },
  }), [state, ready, patchProfile]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore doit être utilisé dans <AppStoreProvider>');
  return ctx;
}
