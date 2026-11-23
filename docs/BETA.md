# Bêta et publication — mode d'emploi

Préparé le 2026-11-23. Ce qui est **déjà prêt** : icône, écran de démarrage, configuration des builds (`eas.json`),
textes des fiches, réponses aux questionnaires de confidentialité, CGU et politique de confidentialité.

## 1. Ce qu'il faut débloquer (dans l'ordre)

| # | Action | Qui | Coût | Pourquoi |
|---|---|---|---|---|
| 1 | Nom de domaine (ex. `dressingai.fr`) | Fondateur | ~10 €/an | E-mails de connexion à tout le monde, adresse pro, pages CGU/confidentialité publiques (exigées par les stores) |
| 2 | Compte Resend (gratuit, 3 000 e-mails/mois) + DNS du domaine | Claude guide | 0 € | Serveur d'e-mails : code à 6 chiffres dans l'e-mail, plus de limite à 2 e-mails/heure |
| 3 | Offre payante Gemini (facturation Google Cloud) | Fondateur | quelques centimes/mois en bêta | Obligatoire avant d'envoyer les photos de vrais testeurs (sur l'offre gratuite, Google peut réutiliser les données) ; lève les quotas ; images des duels |
| 4 | Compte Apple Developer | Fondateur | 99 $/an | TestFlight (iPhone) |
| 5 | Compte Google Play Console | Fondateur | 25 $ une fois | Test fermé Android (12 testeurs pendant 14 jours avant publication) |
| 6 | Compte RevenueCat (gratuit jusqu'à 2 500 $ de revenu mensuel) | Fondateur crée, Claude configure | 0 € | Abonnements |

## 2. Construire l'appli (Claude, depuis le cloud)

Il faut un jeton Expo (compte `moha.del51`) ajouté comme secret de l'environnement cloud, puis :

```bash
npx eas-cli init                       # crée le projet EAS (une seule fois)
npx eas-cli build -p ios --profile production
npx eas-cli submit -p ios              # envoi sur TestFlight
npx eas-cli build -p android --profile production
npx eas-cli submit -p android          # envoi en test fermé Google Play
```

Mises à jour sans repasser par les stores (corrections, textes) : `npx eas-cli update --channel production`.
Test intermédiaire sans PC : `npx eas-cli update --channel preview`, puis QR code dans Expo Go.

## 3. Recruter les testeurs

- iPhone : jusqu'à 100 testeurs internes / 10 000 externes via TestFlight (lien public possible après une courte relecture Apple).
- Android : **au moins 12 testeurs inscrits pendant 14 jours d'affilée** avant de pouvoir publier (compte perso récent).
  Recruter 15 à 20 personnes pour garder de la marge.
- Message type : « Je lance une appli qui te propose chaque matin ta tenue avec TES vêtements. Tu veux la tester
  gratuitement 2 semaines ? Il me faut juste ton e-mail (Apple ou Google). »
- Condition pour lancer (rappel) : la majorité utilise l'appli plusieurs matins par semaine et trouve les looks bons.

## 4. Ce qu'on mesure pendant la bêta (table `events`)

- Abandon à chaque étape de l'inscription (`onboarding_question`, `onboarding_duel`, `onboarding_done`).
- Nombre de pièces ajoutées (`garment_added`), délai avant le premier look.
- Matins actifs par semaine (`app_open`, `outfit_viewed`), looks portés / refusés (`outfit_worn`, `outfit_disliked`).
- Coût IA réel par utilisateur (`ai_call`, champ `cost_eur`).
- Requêtes prêtes dans `supabase/sql/indicateurs.sql`.

## 5. Fiche App Store (français)

- **Nom** : Dressing AI (30 caractères max) — vérifier la marque à l'INPI avant.
- **Sous-titre** : Ton look du jour, avec ta garde-robe
- **Mots-clés** (100 caractères) : tenue,garde-robe,style,mode,outfit,vêtements,styliste,look,dressing,météo,habiller
- **Texte promotionnel** : Chaque matin, 3 tenues pensées pour toi, avec les vêtements que tu as déjà. 7 jours offerts.
- **Description** :

  > Fini le « je n'ai rien à me mettre ».
  >
  > Dressing AI compose chaque matin 1 à 3 tenues avec TES vêtements, selon la météo de ta ville, ton humeur du jour
  > et ton style.
  >
  > • Photographie tes pièces : l'appli reconnaît le type, la couleur, la coupe et la saison.
  > • Réponds à quelques questions et départage des duels de looks : on cerne ton style en 3 minutes.
  > • Reçois tes looks au réveil, avec un conseil de styliste pour les porter.
  > • Choisis ton humeur : chic, décontracté, sportif, audacieux…
  > • L'appli évite de te proposer ce que tu as porté ces derniers jours et fait tourner toute ta garde-robe.
  > • Tes préférences sont toujours respectées (couverture, voile, couleurs que tu évites).
  >
  > Essai gratuit de 7 jours, sans carte bancaire. Ensuite, Premium : 6,99 € par mois ou 39,99 € par an.
  > Abonnement renouvelé automatiquement, annulable à tout moment dans les réglages de ton compte Apple.
  > Conditions : [URL]/cgu — Confidentialité : [URL]/confidentialite

- **Catégorie** : Style de vie (secondaire : Shopping)
- **Âge** : 4+ (pas de contenu sensible). **URL d'assistance** : [URL] ou mailto.
- **Captures** (6,7" et 6,5") : 1. Look du jour (carte teintée) · 2. Choix de l'humeur · 3. Ajout photo avec
  reconnaissance · 4. Garde-robe par catégories · 5. Duels de looks · 6. Historique. Titre en Syne sur fond papier.

## 6. Confidentialité de l'appli (App Store « App Privacy » / Google « Sécurité des données »)

| Donnée | Collectée | Liée à l'identité | Pistage | Usage |
|---|---|---|---|---|
| Adresse e-mail | Oui | Oui | Non | Fonctionnement de l'appli |
| Photos (vêtements) | Oui | Oui | Non | Fonctionnement de l'appli |
| Autre contenu (réponses au questionnaire, garde-robe) | Oui | Oui | Non | Fonctionnement, personnalisation |
| Achats (statut d'abonnement) | Oui | Oui | Non | Fonctionnement |
| Interactions dans l'appli (statistiques) | Oui | Oui | Non | Analyse, amélioration |
| Localisation précise | Non (seule la ville saisie est utilisée) | — | — | — |

Données chiffrées en transit : oui. Suppression possible par l'utilisateur : oui (dans l'appli). Aucun pistage, aucune publicité.

## 7. Avant de soumettre

- [ ] Compléter les champs [entre crochets] de `src/data/legal.ts` (nom, adresse, médiateur), puis
      `node --experimental-strip-types scripts/export-legal.ts` et mettre les pages en ligne.
- [ ] SMTP branché, modèles d'e-mail avec `{{ .Token }}` (voir ARCHITECTURE.md).
- [ ] Gemini en offre payante.
- [ ] Compte de démonstration pour la relecture Apple (e-mail + accès au code) ou mode démo mis en avant.
- [ ] Détourage sur le téléphone (module natif) testé dans un build de développement.
