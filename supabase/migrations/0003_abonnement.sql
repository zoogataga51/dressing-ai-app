-- Dressing AI : abonnement et protection de l'essai gratuit (2026-11-23)
--
-- premium_until : fin de l'abonnement en cours (mis à jour par la fonction revenuecat-webhook).
-- Règle : l'appli ne peut PAS modifier elle-même ces champs, ni relancer son essai gratuit.

alter table public.profiles
  add column if not exists premium_until timestamptz,
  add column if not exists premium_product text;

create or replace function public.protect_profile_billing() returns trigger
language plpgsql as $$
begin
  -- La clé serveur (fonctions, webhook) peut tout modifier.
  if coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  new.premium_until := old.premium_until;
  new.premium_product := old.premium_product;
  -- L'essai démarre une seule fois : impossible de le repousser.
  if old.trial_started_at is not null then
    new.trial_started_at := old.trial_started_at;
  elsif new.trial_started_at is not null and new.trial_started_at > now() + interval '1 minute' then
    new.trial_started_at := now();
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_billing on public.profiles;
create trigger protect_profile_billing before update on public.profiles
  for each row execute function public.protect_profile_billing();
