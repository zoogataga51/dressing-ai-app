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

## 2026-11-23 02:55 — [cloud] Passation écrite
docs/PASSATION.md créé : contexte, décisions, comptes, état et ordre de travail. Le fondateur crée un environnement
cloud avec accès Internet (Supabase, Gemini, Expo) pour que Claude travaille sans relais par le PC.

## 2026-11-23 — [cloud] Accès réseau vérifié
Gemini OK via secret réseau : gemini-3.5-flash et gemini-3.5-flash-lite répondent ; gemini-2.5-* refusés
(« plus disponible pour les nouveaux utilisateurs ») → utiliser la famille 3.5. Supabase Management API OK
(SQL sur syitvnkpdzeapvvekbzk : 6 tables présentes). Début de la liste « À faire » de la passation.

## 2026-11-23 — [cloud] Questionnaire adapté au rayon (retour du fondateur)
Options filtrées selon le rayon : Homme ne voit plus voile, talons, ballerines, robe, décolleté ; libellés accordés
(Élégante / Élégant, « Élégant·e » pour Les deux). Réponses nettoyées si le rayon change. Duels « Les deux » :
alternance femme/homme. tsc + export iOS OK.

## 2026-11-23 — [cloud] Connexion par e-mail et synchronisation Supabase
Écran connexion (code 6 chiffres ou lien), mode démo, déconnexion, suppression du compte (fonction
delete-account déployée via l'API). Données synchronisées avec file d'attente hors ligne ; nouveau compte =
garde-robe vide. Migration 0002 exécutée (looks « rules » insérables par l'appli, remplacement de photo).
RLS testée en SQL (2 faux comptes, transaction annulée) : chacun ne voit que ses données. Réglages Auth : code
6 chiffres, 15 min, liens dressingai:// et exp:// autorisés. BLOCAGE : modèles d'e-mail non modifiables sans SMTP
perso (offre gratuite) → l'e-mail contient un lien, pas de code ; envoi limité aux membres de l'équipe, 2/h.

## 2026-11-23 — [cloud] IA branchée (photos + looks)
analyze-garment (Gemini 3.5 Flash-Lite, ~0,08 c€/photo) et generate-outfits (Gemini 3.5 Flash, repli Flash-Lite,
0,4–0,8 c€/génération, cache par humeur, 4/jour max, contrôle qualité serveur) déployées via l'API. Test de bout en
bout avec un compte temporaire (créé en SQL, supprimé via delete-account) : tout OK, coûts tracés dans events.
Appli : vraie analyse à l'ajout, looks IA avec écran d'attente, « Pas pour moi », secours par règles.
Détourage : sur le téléphone (gratuit) au passage aux builds de dev ; modèles d'image Gemini = payants (refusés).

## 2026-11-23 — [cloud] Tests qualité/coût des looks (étape 5)
Banc d'essai scripts/looks-lab (16 profils : voilée, qamis, bureau, étudiant, street, colorée…). Flash : meilleur
style mais 20 requêtes/jour sur l'offre gratuite et souvent saturé. Retenu : 3.5 Flash-Lite qui propose 4 tenues +
seconde chance si < 3 valides → 15/16 profils avec 3 looks, 0,11 c€, 1,9 s. Corrigé : qamis/abaya sur pantalon
acceptés, mélange chic/décontracté accepté, noms avec accents. Prod : looks en ~4 s. Test e2e : scripts/e2e/run.sh.

## 2026-11-23 — [cloud] Abonnement (étape 7) et textes juridiques (étape 8)
Migration 0003 : premium_until + déclencheur qui empêche l'appli de modifier son statut Premium ou de repousser
son essai (testé en SQL). generate-outfits refuse les looks après 7 jours sans Premium ; l'appli affiche « Essai
terminé ». RevenueCat installé (inactif tant qu'il n'y a pas de clés ; mode aperçu dans Expo Go), paywall avec prix
des stores, restauration, codes promo. Fonction revenuecat-webhook déployée (inactive sans secret). CGU et
politique de confidentialité (RGPD, données sensibles « voile » avec consentement explicite) dans l'appli et
docs/legal/. Export des données (portabilité) dans le Profil. Champs [entre crochets] à compléter par le fondateur.
