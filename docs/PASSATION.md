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

## État au 2026-11-23 (fin de journée) : tout ce qui dépend de Claude est fait
- Comptes et services en place : domaine dressingai.fr (OVH : DNS, hébergement gratuit avec le site, boîte
  contact@dressingai.fr), Resend (e-mails, SMTP Supabase), Gemini payant (prépaiement 5 €, sans recharge auto),
  Expo (organisation dressing-ai.com, robot claude-cloud, projet EAS 5acb6e9b…). Secrets réseau de l'environnement
  cloud : api.supabase.com, generativelanguage.googleapis.com, api.resend.com, api.expo.dev.
- Bêta testable sur iPhone sans PC : QR permanent docs/qr/expo-go-beta.png (canal EAS « preview »). Publier :
  `EXPO_TOKEN=proxy-injected npx eas-cli@27.11.0 update --channel preview --environment preview --platform ios --message "…" --non-interactive`.
- Identité : bleu nuit / kaki / sable, DM Serif Display (choix du fondateur). Visuels stores : docs/store/.
- Le fondateur teste quelques matins (notification du look comprise) ; Claude attend son signal pour Apple/Google.

## Petits restes facultatifs côté fondateur
1. Redéposer site/confidentialite.html sur OVH (FileZilla, dossier www) : phrase sur les comptes inactifs précisée.
2. Secret RESEND_API_KEY (clé Resend « Sending access ») dans Supabase > Edge Functions > Secrets, pour les e-mails
   d'avertissement avant suppression des comptes inactifs (premiers cas pas avant 2028 ; sans la clé, aucun compte
   avec e-mail n'est supprimé).

## À faire (dans l'ordre)
1. Retours des tests du fondateur → corrections publiées dans la journée.
2. Quand le fondateur paie Apple (99 $) et Google (25 $) : build de développement / production EAS (runtimeVersion à
   repasser en appVersion), détourage sur le téléphone (iOS Vision / ML Kit), TestFlight et test fermé Google
   (12 testeurs × 14 jours), fiches stores (docs/BETA.md, docs/store/).
3. Bêta : indicateurs (supabase/sql/indicateurs.sql), raccourcir l'inscription selon les abandons.
4. Lancement payant : micro-entreprise (adresse perso du fondateur dans les CGU, SIRET), RevenueCat + produits,
   médiateur, puis acquisition.
