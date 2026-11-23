/**
 * Synchronisation entre le téléphone et Supabase.
 *
 * Principe : l'appli modifie d'abord ses données sur le téléphone (tout reste instantané),
 * puis envoie chaque changement à la base. Si le réseau manque, le changement attend dans
 * une file (gardée sur le téléphone) et part à la prochaine occasion.
 *
 * Au démarrage, on vide la file puis on recharge tout depuis la base : la base fait foi.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import type { DuelChoice, Profile } from '@/state/AppStore';
import type { Garment, HistoryEntry, Mood, Season } from '@/types';
import { supabase } from './supabase';

const BUCKET = 'garments';
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 30; // liens de photos valables 30 jours

// ───────────────────────── Conversions appli ↔ base ─────────────────────────

type ProfileRow = {
  first_name: string | null; city: string | null; notification_time: string | null; answers: Record<string, string[]> | null;
  styles: string[] | null; onboarded_at: string | null; trial_started_at: string | null; premium_until?: string | null;
};

type GarmentRow = {
  id: string; user_id: string; category: Garment['category']; subtype: string; label: string; color_name: string; color_hex: string;
  fit: Garment['fit']; material: string | null; seasons: string[]; warmth: number; formality: number;
  pattern?: string | null; photo_path?: string | null; cutout_path?: string | null; archived?: boolean; created_at?: string;
};

type OutfitRow = {
  id: string; user_id: string; for_date: string; position: number; name: string; vibe: string | null; tip: string | null;
  mood: string; weather: { tempC?: number } | null; garment_ids: string[]; source: 'ai' | 'rules'; status: string;
};

export function profileToRow(p: Profile): ProfileRow {
  return {
    first_name: p.firstName || null,
    city: p.city || null,
    notification_time: p.notificationTime,
    answers: p.answers,
    styles: p.answers['styles'] ?? [],
    onboarded_at: p.onboarded ? p.onboardedAt ?? new Date().toISOString() : null,
    trial_started_at: p.trialStartedAt ?? null,
  };
}

function rowToProfile(r: ProfileRow, duels: DuelChoice[]): Partial<Profile> {
  const answers = { ...(r.answers ?? {}) };
  if (r.styles?.length) answers['styles'] = r.styles;
  return {
    firstName: r.first_name ?? '',
    city: r.city ?? 'Paris',
    notificationTime: (r.notification_time ?? '07:30').slice(0, 5),
    answers,
    duels,
    onboarded: !!r.onboarded_at,
    onboardedAt: r.onboarded_at ?? undefined,
    trialStartedAt: r.trial_started_at ?? undefined,
    premiumUntil: r.premium_until ?? undefined,
  };
}

function garmentToRow(g: Garment, userId: string): GarmentRow {
  return {
    id: g.id, user_id: userId, category: g.category, subtype: g.subtype, label: g.label, color_name: g.colorName, color_hex: g.colorHex,
    fit: g.fit, material: g.material || null, seasons: g.seasons, warmth: g.warmth, formality: g.formality, pattern: g.pattern ?? null,
    // Chemins des photos envoyés seulement s'ils sont connus : une modification ne doit jamais les effacer.
    ...(g.photoPath ? { photo_path: g.photoPath } : {}),
    ...(g.cutoutPath ? { cutout_path: g.cutoutPath } : {}),
  };
}

function rowToGarment(r: GarmentRow): Garment {
  return {
    id: r.id, category: r.category, subtype: r.subtype, label: r.label, colorName: r.color_name, colorHex: r.color_hex,
    fit: r.fit, material: r.material ?? '', pattern: r.pattern ?? undefined, seasons: r.seasons as Season[], warmth: r.warmth as Garment['warmth'],
    formality: r.formality as Garment['formality'], photoPath: r.photo_path ?? undefined, cutoutPath: r.cutout_path ?? undefined,
    wearCount: 0,
  };
}

function rowToHistory(r: OutfitRow): HistoryEntry {
  return {
    date: r.for_date,
    mood: r.mood as Mood,
    tempC: r.weather?.tempC ?? 0,
    outfit: { id: r.id, name: r.name, vibe: r.vibe ?? '', tip: r.tip ?? undefined, garmentIds: r.garment_ids, source: r.source },
  };
}

// ───────────────────────── Lecture depuis la base ─────────────────────────

export type RemoteSnapshot = { profile: Partial<Profile>; wardrobe: Garment[]; history: HistoryEntry[] };

/** Recharge tout le compte depuis la base. Lève une erreur si le réseau manque. */
export async function pullAll(userId: string): Promise<RemoteSnapshot> {
  if (!supabase) throw new Error('Supabase indisponible');
  const [p, g, d, o] = await Promise.all([
    supabase.from('profiles').select('first_name, city, notification_time, answers, styles, onboarded_at, trial_started_at, premium_until').eq('id', userId).maybeSingle(),
    supabase.from('garments').select('*').eq('archived', false).order('created_at', { ascending: false }),
    supabase.from('duel_choices').select('duel_id, picked'),
    supabase.from('outfits').select('*').eq('status', 'worn').order('for_date', { ascending: false }).limit(400),
  ]);
  for (const r of [p, g, d, o]) if (r.error) throw r.error;

  const duels: DuelChoice[] = (d.data ?? []).map((x) => ({ duelId: x.duel_id, picked: x.picked }));
  const history = ((o.data ?? []) as OutfitRow[]).map(rowToHistory);
  const wardrobe = ((g.data ?? []) as GarmentRow[]).map(rowToGarment);

  // Nombre de fois porté et dernière fois, déduits de l'historique.
  const worn = new Map<string, { count: number; last: string }>();
  for (const h of history) for (const id of h.outfit.garmentIds) {
    const w = worn.get(id);
    worn.set(id, { count: (w?.count ?? 0) + 1, last: w && w.last > h.date ? w.last : h.date });
  }
  for (const item of wardrobe) {
    const w = worn.get(item.id);
    if (w) { item.wearCount = w.count; item.lastWornAt = w.last; }
  }

  // Liens temporaires vers les photos (bucket privé).
  const paths = wardrobe.map((x) => x.cutoutPath ?? x.photoPath).filter((x): x is string => !!x);
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    const byPath = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path ?? '', s.signedUrl] as const));
    for (const item of wardrobe) {
      const path = item.cutoutPath ?? item.photoPath;
      if (path && byPath.has(path)) item.imageUrl = byPath.get(path) ?? undefined;
    }
  }

  const profile = p.data ? rowToProfile(p.data as ProfileRow, duels) : { duels };
  return { profile, wardrobe, history };
}

// ───────────────────────── Envoi vers la base (file d'attente) ─────────────────────────

export type Op =
  | { t: 'profile'; profile: Profile }
  | { t: 'garment'; garment: Garment }
  | { t: 'garmentDelete'; id: string }
  | { t: 'duels'; duels: DuelChoice[] }
  | { t: 'worn'; entry: HistoryEntry; rowId: string };

type QueuedOp = Op & { tries: number };

const queueKey = (userId: string) => `dressing-ai:queue:${userId}`;
const MAX_TRIES = 6;

/** Clé qui permet de ne garder que la dernière version d'un même changement. */
function opKey(op: Op): string {
  switch (op.t) {
    case 'profile': return 'profile';
    case 'duels': return 'duels';
    case 'garment': return `garment:${op.garment.id}`;
    case 'garmentDelete': return `garment:${op.id}`;
    case 'worn': return `worn:${op.entry.date}`;
  }
}

async function readQueue(userId: string): Promise<QueuedOp[]> {
  try { return JSON.parse((await AsyncStorage.getItem(queueKey(userId))) ?? '[]'); } catch { return []; }
}
const writeQueue = (userId: string, q: QueuedOp[]) => AsyncStorage.setItem(queueKey(userId), JSON.stringify(q)).catch(() => {});

/** Envoie une photo locale dans le bucket privé : garments/<utilisateur>/<vêtement>.jpg */
export async function uploadPhoto(userId: string, garmentId: string, localUri: string): Promise<string> {
  if (!supabase) throw new Error('Supabase indisponible');
  const path = `${userId}/${garmentId}.jpg`;
  const bytes = await new File(localUri).arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

const isLocalFile = (uri?: string) => !!uri && (uri.startsWith('file:') || uri.startsWith('ph:') || uri.startsWith('content:'));

async function run(userId: string, op: Op): Promise<void> {
  if (!supabase) throw new Error('Supabase indisponible');
  const sb = supabase;
  const check = ({ error }: { error: unknown }) => { if (error) throw error; };
  switch (op.t) {
    case 'profile':
      check(await sb.from('profiles').update({ ...profileToRow(op.profile), updated_at: new Date().toISOString() }).eq('id', userId));
      return;
    case 'garment': {
      const g = { ...op.garment };
      if (!g.photoPath && isLocalFile(g.imageUrl)) {
        try { g.photoPath = await uploadPhoto(userId, g.id, g.imageUrl!); } catch { /* photo perdue : on garde la fiche */ }
      }
      check(await sb.from('garments').upsert(garmentToRow(g, userId)));
      return;
    }
    case 'garmentDelete':
      // Archivé plutôt que supprimé : l'historique des looks garde ses pièces.
      check(await sb.from('garments').update({ archived: true }).eq('id', op.id));
      return;
    case 'duels':
      check(await sb.from('duel_choices').delete().eq('user_id', userId));
      if (op.duels.length) {
        check(await sb.from('duel_choices').insert(op.duels.map((c) => ({ user_id: userId, duel_id: c.duelId, picked: c.picked }))));
      }
      return;
    case 'worn': {
      const e = op.entry;
      // Un seul look porté par jour : on remet les autres looks IA du jour en « proposé », on retire l'ancien look « règles ».
      check(await sb.from('outfits').update({ status: 'proposed' }).eq('for_date', e.date).eq('status', 'worn').eq('source', 'ai'));
      check(await sb.from('outfits').delete().eq('for_date', e.date).eq('status', 'worn').eq('source', 'rules'));
      if (e.outfit.source === 'ai' && isUuid(e.outfit.id)) {
        check(await sb.from('outfits').update({ status: 'worn' }).eq('id', e.outfit.id));
        return;
      }
      const row: OutfitRow = {
        id: op.rowId, user_id: userId, for_date: e.date, position: 1, name: e.outfit.name, vibe: e.outfit.vibe || null,
        tip: e.outfit.tip ?? null, mood: e.mood, weather: { tempC: e.tempC }, garment_ids: e.outfit.garmentIds, source: 'rules', status: 'worn',
      };
      check(await sb.from('outfits').insert(row));
    }
  }
}

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

let flushing: Promise<boolean> | null = null;

/** Envoie la file d'attente. Renvoie true si tout est parti. */
export function flush(userId: string): Promise<boolean> {
  if (flushing) return flushing;
  flushing = (async () => {
    let q = await readQueue(userId);
    while (q.length) {
      const [op, ...rest] = q;
      try {
        await run(userId, op);
        q = rest;
      } catch {
        op.tries += 1;
        q = op.tries >= MAX_TRIES ? rest : [op, ...rest];
        await writeQueue(userId, q);
        if (op.tries < MAX_TRIES) return false; // réseau absent : on réessaiera plus tard
        continue;
      }
      await writeQueue(userId, q);
    }
    return true;
  })().finally(() => { flushing = null; });
  return flushing;
}

/** Ajoute un changement à la file (en remplaçant une version plus ancienne du même) puis l'envoie. */
export async function enqueue(userId: string, op: Op): Promise<void> {
  if (flushing) await flushing.catch(() => false);
  const key = opKey(op);
  const q = (await readQueue(userId)).filter((x) => opKey(x) !== key);
  q.push({ ...op, tries: 0 });
  await writeQueue(userId, q);
  flush(userId).catch(() => {});
}
