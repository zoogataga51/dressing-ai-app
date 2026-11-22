-- Dressing AI : schéma initial de la base (Supabase / PostgreSQL)
--
-- Règle de sécurité : chaque utilisateur ne voit et ne modifie QUE ses propres données
-- (Row Level Security activée sur toutes les tables).

-- ───────────────────────── Profils ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  city text default 'Paris',
  latitude double precision,
  longitude double precision,
  timezone text default 'Europe/Paris',
  notification_time time default '07:30',
  push_token text,
  answers jsonb not null default '{}'::jsonb,      -- réponses au questionnaire
  styles text[] not null default '{}',             -- styles déduits des duels
  onboarded_at timestamptz,
  trial_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Création automatique du profil à l'inscription.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Duels de looks ─────────────────────────
create table public.duel_choices (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  duel_id text not null,
  picked text not null check (picked in ('a', 'b', 'none')),
  created_at timestamptz not null default now(),
  unique (user_id, duel_id)
);

-- ───────────────────────── Vêtements ─────────────────────────
create type public.garment_category as enum ('top', 'bottom', 'dress', 'outer', 'shoes', 'accessory');

create table public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category public.garment_category not null,
  subtype text not null,
  label text not null,
  color_name text not null,
  color_hex text not null,
  fit text not null default 'regular' check (fit in ('slim', 'regular', 'loose', 'oversize')),
  material text,
  seasons text[] not null default '{}',
  warmth smallint not null default 2 check (warmth between 1 and 3),
  formality smallint not null default 2 check (formality between 1 and 3),
  pattern text,                                     -- uni, rayé, à carreaux…
  photo_path text,                                  -- photo d'origine (Storage)
  cutout_path text,                                 -- photo détourée (Storage)
  ai_confidence real,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index garments_user_idx on public.garments (user_id) where not archived;

-- ───────────────────────── Looks proposés ─────────────────────────
create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  for_date date not null,
  position smallint not null,                       -- 1, 2 ou 3 dans la journée
  name text not null,
  vibe text,
  tip text,
  mood text not null default 'free',
  weather jsonb,                                    -- météo utilisée pour composer
  garment_ids uuid[] not null,
  source text not null default 'ai' check (source in ('ai', 'rules')),
  ai_cost_eur numeric(10, 5),                       -- suivi du coût IA par utilisateur
  status text not null default 'proposed' check (status in ('proposed', 'worn', 'skipped', 'disliked')),
  created_at timestamptz not null default now()
);
create index outfits_user_date_idx on public.outfits (user_id, for_date desc);

-- Pièces réellement portées (pour éviter les répétitions et nourrir l'apprentissage).
create view public.wear_history as
  select o.user_id, o.for_date, unnest(o.garment_ids) as garment_id
  from public.outfits o where o.status = 'worn';

-- ───────────────────────── Indicateurs (préparation de l'exit) ─────────────────────────
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,                               -- ex. onboarding_step, outfit_worn, paywall_view
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_name_date_idx on public.events (name, created_at desc);

-- ───────────────────────── Sécurité (RLS) ─────────────────────────
alter table public.profiles enable row level security;
alter table public.duel_choices enable row level security;
alter table public.garments enable row level security;
alter table public.outfits enable row level security;
alter table public.events enable row level security;

create policy "profil : lecture perso" on public.profiles for select using (auth.uid() = id);
create policy "profil : modif perso" on public.profiles for update using (auth.uid() = id);

create policy "duels : perso" on public.duel_choices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vêtements : perso" on public.garments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "looks : lecture perso" on public.outfits for select using (auth.uid() = user_id);
create policy "looks : statut perso" on public.outfits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "événements : écriture perso" on public.events for insert with check (auth.uid() = user_id);
-- Les looks sont créés par la fonction serveur (clé service), pas par l'appli.

-- ───────────────────────── Stockage des photos ─────────────────────────
insert into storage.buckets (id, name, public) values ('garments', 'garments', false)
  on conflict (id) do nothing;

-- Chemin imposé : garments/<id utilisateur>/<fichier>
create policy "photos : lecture perso" on storage.objects for select
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos : ajout perso" on storage.objects for insert
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos : suppression perso" on storage.objects for delete
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────────────────── RGPD : suppression du compte ─────────────────────────
-- Supprimer l'utilisateur dans auth.users efface en cascade profil, vêtements, looks et choix.
-- Les photos du bucket sont supprimées par la fonction serveur « delete-account ».
