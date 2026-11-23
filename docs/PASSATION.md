# Passation — à lire en premier par toute nouvelle session de Claude

Dernière mise à jour : 2026-11-23 (2e session cloud : étapes 1 à 9 faites sauf blocages listés plus bas). Lire ensuite `CLAUDE.md`, `docs/ARCHITECTURE.md`,
puis les dernières entrées de `docs/JOURNAL.md`.

## Le projet et la relation avec le fondateur
- Dressing AI : appli mobile (Expo / React Native, iPhone + Android) qui propose chaque matin 1 à 3 looks composés
  UNIQUEMENT avec les vêtements de l'utilisateur, selon la météo, l'humeur et son style. Lancement en France, en français.
- Le fondateur est étudiant, ne code pas, budget très serré. Claude est son associé à part entière : il décide seul
  quand c'est utile, parle franchement, développe l'appli.
- Consigne permanente du fondateur : TRAVAILLER AU MAXIMUM, sans attendre de confirmation. Seule limite acceptée :
  la limite d'utilisation de Claude ; quand elle tombe, reprendre dès qu'elle se recharge (send_later). Ne demander
  au fondateur que pour : paiements, décisions irréversibles (suppression de données), tests sur son téléphone.
- Le fondateur testera à la fin : ne pas le solliciter pour des tests intermédiaires.
- La qualité des looks est LA priorité du produit.
- Références : cahier des charges https://claude.ai/artifact/R5mVWdzoDkdpM5kowqS1pJ ,
  maquettes https://claude.ai/artifact/H8si7cDLcVxrX9ynnXUt3s

## Décisions validées
- Identité « magazine du matin », palette choisie par le fondateur le 2026-11-23 : fond papier #F5F2EE, bleu nuit
  #1F2B4D (principal), vert kaki #8C9C7E (accent), sable #F4DDAE (badges), encre #141A2B ; titres en DM Serif
  Display + texte en Inter ; stickers penchés, cartes teintées par les vêtements, mode sombre bleu nuit.
  (Ancienne identité cobalt/corail/Syne abandonnée : le fondateur n'aimait pas les couleurs ni la police large.)
- Animations partout mais courtes ; jamais de barre de défilement visible.
- Inscription : questionnaire (src/data/questionnaire.ts) puis 10 duels de looks (src/data/duels.ts) qui déduisent
  le style ; pas de note sur 10. L'inscription sera raccourcie après la bêta selon les abandons mesurés.
- Images des duels : générées par IA à partir des `imagePrompt` (jamais de photos Pinterest / personnes réelles).
- Abonnement 6,99 €/mois ou 39,99 €/an, essai 7 jours, codes promo influenceurs (RevenueCat, plus tard).
- Paiement Apple (99 $) et Google (25 $) : le fondateur paiera quand l'appli sera finalisée (nécessaire pour la bêta).
  Google : nouveau compte perso = 12 testeurs pendant 14 jours avant publication.

## Comptes et services
- E-mail du projet : dressing.ai.app@outlook.com (Gmail impossible : numéro saturé).
- GitHub : zoogataga51/dressing-ai-app (privé), branche main. Ancien dépôt « dressing-ai » abandonné : l'ignorer.
- Expo : compte moha.del51. Test via Expo Go en mode tunnel (`npx expo start --tunnel`).
- Supabase : projet `dressing-ai`, URL et clé publishable dans src/lib/supabase.ts. Migration 0001 exécutée
  (ne pas la relancer ; nouvelles migrations = 0002_…). Secret GEMINI_API_KEY déjà ajouté aux Edge Functions.
- IA : Gemini (offre gratuite, compte Google perso du fondateur) pour le développement. OpenAI : carte refusée,
  à revoir. Avant le lancement : offre payante obligatoire (photos des utilisateurs, RGPD).
- PC du fondateur (Windows) : dépôt cloné dans Documents\dressing-ai-app, clé Gemini dans .env.local.

## Environnement cloud « Dressing AI » (à partir du 2026-11-23)
- Accès Internet complet. Secrets réseau injectés par un proxy (Claude ne voit jamais les clés) :
  - `api.supabase.com` : en-tête `Authorization: Bearer <jeton>` (jeton « claude-cloud », accès complet limité au
    projet dressing-ai). Utiliser l'API Management directement (curl) : SQL via
    `POST /v1/projects/syitvnkpdzeapvvekbzk/database/query`, déploiement des Edge Functions via l'API.
    La CLI Supabase exige une variable SUPABASE_ACCESS_TOKEN : si elle refuse, passer par l'API.
  - `generativelanguage.googleapis.com` : en-tête `x-goog-api-key` (clé du projet Google « dressing-ai »,
    format récent commençant par « AQ. » ; si l'appel échoue, le signaler au fondateur avec la correction exacte).
- Référence du projet Supabase : syitvnkpdzeapvvekbzk.
- La session sur le PC du fondateur n'est plus nécessaire pour le réseau. Cette session cloud est désormais
  l'unique interlocutrice du fondateur pour le développement.
- Pour les tests sur téléphone, privilégier une solution qui ne demande pas le PC (EAS Update / build de
  développement via le compte Expo moha.del51, si possible sans paiement).

## Retours du fondateur à traiter
- (Traité le 2026-11-23) Questionnaire adapté au rayon.

## Fait
Interface complète, thème, notifications locales, météo, schéma Supabase + RLS, journal partagé (session 1).
Session 2 (2026-11-23), tout testé (tsc, export iOS, tests SQL, tests de bout en bout, test navigateur) :
- Questionnaire et duels adaptés au rayon. Connexion e-mail (code 6 chiffres ou lien), mode démo, déconnexion,
  suppression du compte (fonction delete-account), export des données.
- Synchronisation complète avec Supabase (file d'attente hors ligne, src/lib/sync.ts). Migrations 0002 à 0004 exécutées.
- IA branchée : analyze-garment (photos) et generate-outfits (looks), Gemini 3.5 Flash-Lite + seconde chance,
  contrôle qualité serveur, « Pas pour moi », looks préparés avant le réveil (morning-looks + pg_cron).
  Banc d'essai scripts/looks-lab (16 profils), test e2e scripts/e2e/run.sh. Coût ≈ 0,05 €/utilisateur/mois.
- Abonnement : essai de 7 jours protégé côté serveur, écran « Essai terminé », RevenueCat prêt (inactif sans clés),
  webhook revenuecat-webhook. CGU + confidentialité (src/data/legal.ts, docs/legal/).
- Bêta : icône, eas.json, docs/BETA.md (fiches stores, confidentialité), supabase/sql/indicateurs.sql.

## Bloqué — décisions ou paiements du fondateur (voir le récap du 2026-11-23)
1. Nom de domaine dressingai.fr (choisi, libre le 2026-11-23, ~7 €/an) + Resend gratuit : sans serveur d'e-mail, Supabase n'envoie qu'un lien (pas de code),
   seulement aux membres de l'équipe, 2 par heure. Bloquant pour la bêta.
2. Offre payante Gemini : obligatoire avant les photos de vrais testeurs (RGPD), lève les quotas (Flash-Lite
   15/min, Flash 20/jour), permet de générer les images des duels (~2 €) et de retester Flash.
3. (Fait le 2026-11-23) Inscription sans e-mail activée avec l'accord du fondateur.
4. (Décidé) Essai sans carte pour la bêta ; on retranche au lancement avec les chiffres de conversion.
5. Champs [entre crochets] de src/data/legal.ts (nom, adresse, médiateur de la consommation).
6. Jeton Expo (compte moha.del51) en secret de l'environnement → builds EAS et mises à jour testables sans PC.
7. Suppression automatique des comptes inactifs depuis 2 ans (promise dans la politique) : à programmer, avec accord.

## À faire (dans l'ordre)
1. Débloquer les points ci-dessus, puis : modèles d'e-mail avec {{ .Token }}, images des duels, RevenueCat.
2. Détourage sur le téléphone (module natif iOS Vision / Android ML Kit) dans un build de développement.
3. Notification du matin avec le nom du look préparé (push Expo, nécessite le projet EAS).
4. Bêta (TestFlight, test fermé Google 12 testeurs × 14 jours), mesure avec supabase/sql/indicateurs.sql.
5. Raccourcir l'inscription selon les abandons mesurés ; stores ; acquisition.
