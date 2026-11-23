# Passation — à lire en premier par toute nouvelle session de Claude

Dernière mise à jour : 2026-11-23 (session cloud d'origine). Lire ensuite `CLAUDE.md`, `docs/ARCHITECTURE.md`,
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
- Identité « magazine du matin » : fond papier #F6F3EE, cobalt #2B44C6, corail #FF5A3C, jaune beurre #F6D867,
  Syne (titres) + Inter (texte), stickers penchés, cartes teintées par les vêtements, mode sombre.
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
Interface complète (onglets, inscription, ajout photo, fiche vêtement, historique, profil, abonnement), thème,
notifications locales, météo Open-Meteo, moteur de looks par règles, schéma Supabase + RLS, fonction serveur
generate-outfits (prompt prêt, appel au modèle à brancher), journal partagé. Testé sur iPhone : tout fonctionne.

## À faire (dans l'ordre)
1. Questionnaire et duels adaptés au rayon (Homme : pas de robes, talons, ballerines, voile ; « Les deux » : tout).
2. Connexion Supabase Auth (e-mail à code en priorité ; Apple et Google quand les comptes payants existeront).
3. Synchronisation AppStore ↔ Supabase (profil, réponses, duels, vêtements, historique, photos dans le bucket).
   Garde-robe vide pour un vrai compte ; données de démo seulement hors connexion.
4. Fonctions serveur analyze-garment (vision) et generate-outfits branchées sur Gemini, avec repli sur les règles.
   Détourage des photos : choisir une solution (coût !).
5. Tests qualité/coût des looks, objectif < 0,50 € par utilisateur et par mois.
6. Images des duels générées. 7. RevenueCat + paywall réel. 8. Politique de confidentialité / CGU (RGPD).
9. Préparation bêta (TestFlight, test interne Google), puis stores.
