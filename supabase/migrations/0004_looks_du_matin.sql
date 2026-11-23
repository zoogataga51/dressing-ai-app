-- Dressing AI : looks préparés avant le réveil (2026-11-23)
-- Toutes les 15 minutes, la base appelle la fonction morning-looks (voir supabase/functions/morning-looks).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Ville changée → coordonnées à recalculer (la fonction les retrouve et les garde).
create or replace function public.reset_city_coords() returns trigger
language plpgsql as $$
begin
  if new.city is distinct from old.city then
    new.latitude := null;
    new.longitude := null;
  end if;
  return new;
end $$;

drop trigger if exists reset_city_coords on public.profiles;
create trigger reset_city_coords before update on public.profiles
  for each row execute function public.reset_city_coords();

select cron.unschedule(jobid) from cron.job where jobname = 'looks-du-matin';
select cron.schedule('looks-du-matin', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://syitvnkpdzeapvvekbzk.supabase.co/functions/v1/morning-looks',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$$);
