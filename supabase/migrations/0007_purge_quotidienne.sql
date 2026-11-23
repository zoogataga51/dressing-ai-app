-- Dressing AI : vérification quotidienne des comptes inactifs (3 h 17, heure du serveur).
select cron.unschedule(jobid) from cron.job where jobname = 'comptes-inactifs';
select cron.schedule('comptes-inactifs', '17 3 * * *', $$
  select net.http_post(
    url := 'https://syitvnkpdzeapvvekbzk.supabase.co/functions/v1/purge-inactive',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
$$);
