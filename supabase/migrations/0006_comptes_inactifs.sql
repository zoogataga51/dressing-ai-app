-- Dressing AI : suppression des comptes inactifs (politique de confidentialité, accord du fondateur le 2026-11-23)
-- Date de l'e-mail d'avertissement envoyé avant suppression.
alter table public.profiles add column if not exists inactivity_warned_at timestamptz;

-- Dernière activité de chaque compte : dernier « app_open » enregistré, sinon dernière connexion, sinon création.
create or replace function public.last_activity_per_user()
returns table (user_id uuid, email text, is_anonymous boolean, last_active timestamptz, warned_at timestamptz)
language sql security definer set search_path = public, auth as $$
  select u.id, u.email, coalesce(u.is_anonymous, false),
         greatest(u.created_at, coalesce(u.last_sign_in_at, u.created_at), coalesce(max(e.created_at), u.created_at)),
         p.inactivity_warned_at
  from auth.users u
  left join public.events e on e.user_id = u.id and e.name = 'app_open'
  left join public.profiles p on p.id = u.id
  group by u.id, u.email, u.is_anonymous, u.created_at, u.last_sign_in_at, p.inactivity_warned_at;
$$;
-- Réservée au serveur (clé service) : personne d'autre ne peut lister les comptes.
revoke all on function public.last_activity_per_user() from public, anon, authenticated;
