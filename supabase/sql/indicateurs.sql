-- Indicateurs de Dressing AI (bêta puis exit). À lancer dans le SQL Editor de Supabase, ou par Claude via l'API.
-- Les comptes de test (e-mails en « exemple.invalid ») n'existent plus après les tests : rien à filtrer.

-- 1. Entonnoir d'inscription : combien de personnes atteignent chaque étape (30 derniers jours).
select name, props->>'step' as etape, count(distinct user_id) as personnes
from events
where name in ('auth_done', 'onboarding_question', 'onboarding_duel', 'onboarding_done', 'garment_added')
  and created_at > now() - interval '30 days'
group by 1, 2 order by 1, nullif(props->>'step', '')::int nulls first;

-- 2. Matins actifs par personne et par semaine (objectif bêta : plusieurs matins par semaine).
select user_id, date_trunc('week', created_at)::date as semaine,
       count(distinct created_at::date) filter (where extract(hour from created_at at time zone 'Europe/Paris') between 5 and 11) as matins_actifs
from events where name = 'app_open' and user_id is not null
group by 1, 2 order by 2 desc, 3 desc;

-- 3. Rétention J7 et J30 (personne revenue au moins une fois ce jour-là ou après).
with first as (select id as user_id, created_at::date as j0 from profiles),
opens as (select distinct user_id, created_at::date as d from events where name = 'app_open' and user_id is not null)
select count(*) as inscrits,
       round(100.0 * count(*) filter (where exists (select 1 from opens o where o.user_id = f.user_id and o.d >= f.j0 + 7)) / nullif(count(*), 0), 1) as retention_j7_pct,
       round(100.0 * count(*) filter (where exists (select 1 from opens o where o.user_id = f.user_id and o.d >= f.j0 + 30)) / nullif(count(*), 0), 1) as retention_j30_pct
from first f;

-- 4. Qualité des looks : portés vs refusés, par source (IA ou règles).
select source, status, count(*) from outfits group by 1, 2 order by 1, 2;

-- 5. Coût IA par utilisateur et par mois (objectif < 0,50 €).
select date_trunc('month', created_at)::date as mois, props->>'fn' as fonction,
       count(*) as appels, round(sum((props->>'cost_eur')::numeric), 4) as cout_eur,
       round(sum((props->>'cost_eur')::numeric) / nullif(count(distinct user_id), 0), 4) as cout_par_utilisateur_eur
from events where name = 'ai_call' and props ? 'cost_eur'
group by 1, 2 order by 1 desc, 2;

-- 6. Abonnements : conversion essai → abonné, et MRR approximatif (via le webhook RevenueCat).
select count(*) filter (where premium_until > now()) as abonnes_actifs,
       count(*) filter (where trial_started_at is not null) as essais_commences,
       round(100.0 * count(*) filter (where premium_until is not null) / nullif(count(*) filter (where trial_started_at < now() - interval '7 days'), 0), 1) as conversion_pct
from profiles;
