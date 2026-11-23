/**
 * Connexion à Supabase (comptes, base de données, photos).
 *
 * Les deux valeurs viennent du fichier `.env` (voir `.env.example`). La clé « anon » peut
 * être dans l'appli : la sécurité est assurée par les règles RLS de la base.
 * Tant qu'elles sont vides, l'appli tourne en mode démo, 100 % sur le téléphone.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Valeurs publiques du projet (sans danger : la sécurité est assurée par les règles RLS).
// Un fichier `.env` peut les remplacer (ex. projet de test).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://syitvnkpdzeapvvekbzk.supabase.co';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_jbXF_1Zg6xY6QnuTzgw4Lw_Bcd1x7zd';

export const SUPABASE_ENABLED = url.length > 0 && anonKey.length > 0;

export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(url, anonKey, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;
