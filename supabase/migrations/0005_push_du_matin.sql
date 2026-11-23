-- Dressing AI : notification du matin envoyée par le serveur avec le nom du look (2026-11-23)
-- push_token existe depuis 0001 ; on retient le jour du dernier envoi pour n'envoyer qu'une fois par jour.
alter table public.profiles add column if not exists last_push_on date;
