# Journal du projet

Chaque session de Claude ajoute ici ce qu'elle a fait, pour que les autres sessions soient au courant.
Format : `## AAAA-MM-JJ HH:MM — [cloud|PC] titre`, puis quelques lignes.

## 2026-11-22 04:50 — [cloud] Nuit de développement
Version de base de l'interface terminée et poussée sur main : thème, onglets, inscription (questionnaire + duels),
ajout photo, fiche vêtement, historique, profil, abonnement, notifications, météo Open-Meteo, schéma Supabase.
IA, détourage et paiement encore simulés. Rien n'a encore été testé sur un vrai téléphone.

## 2026-11-22 21:35 — [cloud] Prochaine étape
Le fondateur installe Git sur son PC (Windows), puis la session PC clone le dépôt dans Documents\dressing-ai-app,
fait `npm install` et `npx expo start` pour le premier test dans Expo Go. Noter ici les erreurs rencontrées.

## 2026-11-22 21:39 — [PC] Installation sur le PC du fondateur
Git 2.56.1 installé (winget), Node v24.15.0, npm 11.12.1. Dépôt cloné dans Documents\dressing-ai-app.
`npm install` OK : 531 paquets en 3 min, aucune erreur.

## 2026-11-22 21:41 — [PC] Expo démarré
`npx expo start` OK : Metro tourne, QR code affiché (exp://10.188.149.49:8081, mode Expo Go). Expo a mis à jour tsconfig.json#include.
Git n'a pas d'identité (user.name/email) sur ce PC : journal pas encore commité. Test sur téléphone : en attente.

## 2026-11-22 22:28 — [PC] Git configuré
Identité Git réglée sur ce PC (nom zoogataga51, e-mail masqué GitHub noreply). Le journal peut maintenant être commité depuis le PC.
À noter : Expo a retiré `.expo/types/**/*.ts` et `expo-env.d.ts` de tsconfig.json#include au démarrage ; changement laissé non commité, à vérifier.

## 2026-11-22 22:32 — [PC] Échec du mode tunnel
`npx expo start --tunnel` échoue : « Couldn't create a signed tunnel URL… You're not logged in to your Expo account ». Expo propose `npx expo login` ou `--tunnel ngrok`. Choix du fondateur en attente.

## 2026-11-22 22:38 — [PC] Mode tunnel OK
Fondateur connecté à son compte Expo (`npx expo login`, via le navigateur). `npx expo start --tunnel` marche : QR code en exps://…on.expo.app,
utilisable même si le téléphone n'est pas sur le même Wi-Fi que le PC. Test sur téléphone : en attente.

## 2026-11-23 01:40 — [cloud] Projet Supabase créé par le fondateur
Projet `dressing-ai` (org « Dressing AI », compte dressing.ai.app@outlook.com, région Europe). URL et clé publishable
ajoutées dans src/lib/supabase.ts. Vue wear_history passée en security_invoker (sinon elle contournait la RLS).
Prochaine étape : exécuter supabase/migrations/0001_init.sql dans le SQL Editor.

## 2026-11-23 01:43 — [cloud] Base Supabase créée
Le fondateur a exécuté supabase/migrations/0001_init.sql dans le SQL Editor : « Success. No rows returned ».
Tables, RLS et bucket `garments` en place. Ne pas relancer ce fichier (les futures migrations iront dans 0002_…).
