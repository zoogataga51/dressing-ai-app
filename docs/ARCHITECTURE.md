# Architecture et décisions

## Stack

- **Expo (React Native) + Expo Router** : une seule base de code pour iPhone et Android.
- **Reanimated** : toutes les animations (cartes qui glissent, apparitions en cascade, appuis).
- **Supabase** : comptes, base PostgreSQL, stockage des photos, fonctions serveur.
- **RevenueCat** (à venir) : abonnements, essai gratuit, codes promo.
- **Open-Meteo** : météo sans clé. Gratuit en non-commercial ; prévoir l'offre payante au lancement.

## Identité visuelle : « le magazine du matin »

Tout est dans `src/theme/tokens.ts`. Aucun code couleur ne doit être écrit en dur dans
un écran (sauf l'en-tête cobalt du paywall, volontairement fixe). Changer le design =
modifier ce fichier.

- Fond papier `#F6F3EE`, encre `#15151C`
- Cobalt `#2B44C6` (principal), corail `#FF5A3C` (accent), jaune beurre `#F6D867` (badges)
- Syne pour les titres, Inter pour le texte
- Stickers légèrement penchés = signature visuelle
- Carte du look teintée par la couleur dominante des vêtements (`outfitTint`)
- Animations courtes (160 à 420 ms) : le matin, personne ne veut attendre

## Parcours

1. `onboarding/index` : accueil → `onboarding/connexion` (e-mail + code à 6 chiffres, ou lien de l'e-mail),
   « J'ai déjà un compte », ou « Mode démo » (garde-robe d'exemple, rien n'est envoyé)
2. `onboarding/questionnaire` : une question par écran (`src/data/questionnaire.ts`)
3. `onboarding/duels` : 10 duels de looks → styles préférés (`src/data/duels.ts`)
4. `ajout?onboarding=1` : 10 premières pièces, puis premier look
5. Onglets

## Comptes et synchronisation

- `src/state/AuthStore.tsx` : session Supabase Auth (code e-mail via `signInWithOtp` / `verifyOtp`,
  lien `dressingai://connexion` ou `exp://…/--/connexion` dans Expo Go), mode démo.
- `src/state/AppStore.tsx` : copie locale par compte (`dressing-ai:state:<id>`), démo dans `dressing-ai:state:v1`.
  Un nouveau compte démarre avec une garde-robe vide.
- `src/lib/sync.ts` : chaque changement part dans une file d'attente (gardée sur le téléphone) puis vers la base ;
  au démarrage : on vide la file, puis on recharge tout depuis la base (la base fait foi).
  Photos : `garments/<id utilisateur>/<id vêtement>.jpg`, affichées par liens temporaires (30 jours).
  Vêtement supprimé = archivé (l'historique garde ses pièces). Looks portés = table `outfits` (statut `worn`).
- `supabase/functions/delete-account` : suppression définitive (photos + compte, cascade en base).
- E-mails de connexion : le serveur d'envoi gratuit de Supabase n'accepte que les membres de l'équipe et
  2 e-mails/heure, et interdit de personnaliser le modèle (donc pas de code dans l'e-mail, seulement le lien).
  Avant la bêta : brancher un SMTP (nom de domaine + Resend gratuit), puis mettre `{{ .Token }}` dans les modèles.

## Génération des looks (branchée le 2026-11-23)

- **IA** : `supabase/functions/generate-outfits` → Gemini 3.5 Flash (repli Flash-Lite). Règles du styliste,
  résumé du profil et contrôle qualité dans `supabase/functions/_shared/outfits.ts` : toute tenue incomplète,
  avec une pièce inventée, inadaptée à la météo ou incohérente en formalité est refusée.
- Cache : même humeur le même jour → mêmes looks (aucun coût). Plafond : 4 générations par jour et par personne.
- « Pas pour moi » → statut `disliked`, rappelé à l'IA les jours suivants. Pièces portées depuis moins de 3 jours
  mises de côté (sauf petite garde-robe).
- **Secours** : moteur par règles du téléphone (`src/lib/outfitEngine.ts`), utilisé en démo, hors ligne, si l'IA
  échoue ou dépasse 15 s.
- **Banc d'essai** : `NODE_USE_ENV_PROXY=1 node --experimental-strip-types scripts/looks-lab/run.ts <modèle>`
  (garde-robes de test dans `scripts/looks-lab/wardrobes.ts`).
- **Coût** : chaque appel est tracé dans `events` (`name = 'ai_call'`, modèle, jetons, coût en €).
  Mesuré le 2026-11-23 : ~0,08 c€ par photo (Flash-Lite), 0,4 à 0,8 c€ par génération de looks (Flash).

## Photos et détourage

`analyze-garment` : la photo part dans le bucket privé, puis Gemini 3.5 Flash-Lite renvoie type, couleur (liste
fixe + teinte réelle), coupe, matière, motif, saisons, chaleur, formalité. L'utilisateur valide ou corrige.

**Détourage — décision** : sur le téléphone, gratuit (iOS Vision « détourer le sujet », Android ML Kit Subject
Segmentation), via un module natif quand on passera aux builds de développement (étape 9) : impossible dans Expo
Go. Les modèles d'image de Gemini sont payants (refusés sur l'offre gratuite) et remove.bg coûte ~0,20 € l'image.
En attendant, la photo recadrée carrée sert d'image.

Les images des duels seront **générées par IA** à partir des `imagePrompt` (aucune photo Pinterest ni personne
réelle) : nécessite l'offre payante de Gemini (~0,04 € l'image, ~2 € pour les 40 images).

## Données et RGPD

- Toutes les tables ont la sécurité par ligne (RLS) : chacun ne voit que ses données.
- Photos dans un bucket privé, rangées par utilisateur.
- Suppression du compte = suppression en cascade de toutes les données.
- Table `events` pour les indicateurs de l'exit (rétention, conversion, abandon par étape).

## Prochaines étapes techniques

1. Créer le projet Supabase, exécuter `supabase/migrations/0001_init.sql`, remplir `.env`.
2. Brancher l'authentification (e-mail, Apple, Google) sur l'écran d'accueil.
3. Synchroniser `src/state/AppStore.tsx` avec Supabase.
4. ~~Choisir l'IA, brancher `generate-outfits` et l'analyse des photos~~ (fait).
5. Notifications du matin (Expo Notifications).
6. RevenueCat.
