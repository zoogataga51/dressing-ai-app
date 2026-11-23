-- Dressing AI : synchronisation de l'appli (2026-11-23)
--
-- 1. L'appli enregistre elle-même les looks portés quand ils viennent du moteur par règles
--    (hors ligne ou en secours de l'IA). Elle ne peut créer que SES looks, en source « rules »,
--    sans coût IA (le coût est réservé à la fonction serveur).
-- 2. Remplacement d'une photo déjà envoyée (même chemin) autorisé pour son propriétaire.

create policy "looks : ajout perso (règles)" on public.outfits for insert
  with check (auth.uid() = user_id and source = 'rules' and ai_cost_eur is null);

create policy "looks : suppression perso" on public.outfits for delete
  using (auth.uid() = user_id);

create policy "photos : remplacement perso" on storage.objects for update
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
