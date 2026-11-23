/**
 * Textes juridiques affichés dans l'appli (Profil, paywall) et exportés en Markdown pour le site
 * (scripts/export-legal.ts → docs/legal/). Rédigés pour la France (RGPD, Code de la consommation).
 *
 * ⚠️ À COMPLÉTER AVANT LA PUBLICATION : les champs entre crochets [ … ] (identité de l'éditeur, adresse,
 * SIRET une fois la micro-entreprise créée, médiateur de la consommation). À faire relire si possible.
 */

export type LegalDoc = { id: 'cgu' | 'confidentialite'; title: string; updated: string; sections: { title: string; body: string[] }[] };

const EDITOR = '[Prénom Nom du fondateur], [adresse postale]';
const CONTACT = 'dressing.ai.app@outlook.com';

export const PRIVACY: LegalDoc = {
  id: 'confidentialite',
  title: 'Politique de confidentialité',
  updated: '23 novembre 2026',
  sections: [
    { title: 'En bref', body: [
      'Tes données servent à une seule chose : composer tes looks. On ne les vend pas, on ne fait pas de publicité, et tu peux tout effacer en un geste depuis le Profil.',
    ] },
    { title: 'Qui est responsable de tes données ?', body: [
      `Dressing AI est édité par ${EDITOR}. Pour toute question sur tes données : ${CONTACT}.`,
    ] },
    { title: 'Ce qu’on collecte', body: [
      '- Ton compte : ton adresse e-mail (pour la connexion par code).',
      '- Ton profil de style : prénom, ville, réponses au questionnaire et choix des duels de looks.',
      '- Ta garde-robe : les photos de tes vêtements et leur description (type, couleur, coupe, matière, saison).',
      '- Ton utilisation : looks proposés, portés ou refusés, humeur choisie, et des statistiques d’usage (ouverture de l’appli, étapes de l’inscription).',
      '- Ton abonnement : son statut et sa date de fin. Le paiement lui-même est géré par Apple ou Google : on ne voit jamais ta carte bancaire.',
    ] },
    { title: 'Données sensibles', body: [
      'Certaines réponses facultatives, comme « Je porte le voile » ou des préférences de couverture, peuvent révéler tes convictions religieuses. Tu n’es jamais obligé·e de les donner.',
      'Si tu les indiques, tu consens explicitement à ce qu’on les utilise uniquement pour respecter ces préférences dans tes looks. Elles ne sont ni partagées, ni utilisées à d’autres fins. Tu peux les retirer à tout moment en refaisant le questionnaire, ou tout effacer en supprimant ton compte.',
    ] },
    { title: 'Pourquoi, et sur quelle base', body: [
      '- Fournir le service (compte, garde-robe, looks du jour, abonnement) : exécution du contrat.',
      '- Respecter tes préférences sensibles : ton consentement explicite.',
      '- La notification du matin : ton consentement (réglable dans les réglages du téléphone).',
      '- Améliorer l’appli et mesurer son fonctionnement (statistiques internes) : notre intérêt légitime.',
    ] },
    { title: 'L’intelligence artificielle', body: [
      'Pour reconnaître tes vêtements et composer tes looks, la photo d’un vêtement ou la liste de ta garde-robe est envoyée à l’IA Gemini de Google, via nos serveurs. Google agit comme sous-traitant : il ne réutilise pas ces données pour entraîner ses modèles. Ta clé de connexion et ton e-mail ne sont jamais envoyés à l’IA.',
      'Les looks sont des suggestions : c’est toujours toi qui choisis ce que tu portes.',
      'Conseil : photographie tes vêtements seuls, sans personne dessus.',
    ] },
    { title: 'Qui y a accès', body: [
      'Personne d’autre que toi et nous. Nos prestataires techniques, liés par contrat, traitent les données uniquement pour notre compte :',
      '- Supabase (hébergement de la base de données et des photos, serveurs en Union européenne).',
      '- Google (IA Gemini, reconnaissance des vêtements et composition des looks).',
      '- RevenueCat, Apple et Google (gestion de l’abonnement).',
      '- Open-Meteo (météo : seul le nom de ta ville est envoyé).',
      'Certains de ces prestataires peuvent traiter des données hors de l’Union européenne ; ces transferts sont encadrés par les garanties prévues par le RGPD (clauses contractuelles types de la Commission européenne ou Data Privacy Framework).',
    ] },
    { title: 'Combien de temps', body: [
      '- Tant que ton compte existe. Si tu le supprimes, tout est effacé immédiatement : profil, vêtements, photos, historique.',
      '- Compte inactif pendant 2 ans : il est supprimé, après un e-mail de prévenance.',
      '- Les statistiques d’usage sont anonymisées à la suppression du compte.',
    ] },
    { title: 'Tes droits', body: [
      'Tu peux accéder à tes données, les corriger, les effacer, en demander une copie (portabilité), t’opposer à un traitement, limiter son usage ou retirer ton consentement à tout moment.',
      `- Effacer ton compte : Profil > Supprimer mon compte.`,
      `- Pour tout le reste : écris à ${CONTACT}. Réponse sous un mois maximum.`,
      '- Si tu penses que tes droits ne sont pas respectés, tu peux saisir la CNIL (cnil.fr).',
    ] },
    { title: 'Âge minimum', body: [
      'Dressing AI s’adresse aux personnes de 15 ans et plus. En dessous, l’accord d’un parent est nécessaire.',
    ] },
    { title: 'Sécurité', body: [
      'Les échanges sont chiffrés. Chaque personne n’a accès qu’à ses propres données (règles de sécurité de la base), et les photos sont stockées dans un espace privé.',
    ] },
    { title: 'Modifications', body: [
      'Si cette politique change de façon importante, on te prévient dans l’appli avant que le changement s’applique.',
    ] },
  ],
};

export const TERMS: LegalDoc = {
  id: 'cgu',
  title: 'Conditions d’utilisation',
  updated: '23 novembre 2026',
  sections: [
    { title: 'Éditeur', body: [
      `Dressing AI est édité par ${EDITOR} [, micro-entreprise, SIRET …]. Contact : ${CONTACT}.`,
      'Hébergement : Supabase Inc., serveurs situés dans l’Union européenne.',
    ] },
    { title: 'Le service', body: [
      'Dressing AI propose chaque jour des tenues composées avec les vêtements que tu as ajoutés, en tenant compte de la météo, de ton humeur et de ton style. Les tenues sont des suggestions générées en partie par une intelligence artificielle : elles peuvent parfois être imparfaites.',
    ] },
    { title: 'Ton compte', body: [
      'Tu crées ton compte avec ton adresse e-mail. Tu es responsable de l’accès à cette adresse. Un compte est personnel. Tu peux le supprimer à tout moment depuis le Profil.',
    ] },
    { title: 'Essai gratuit et abonnement', body: [
      '- À l’inscription, tu profites de 7 jours d’essai gratuit, sans moyen de paiement.',
      '- Ensuite, les looks du jour nécessitent l’abonnement Premium : 6,99 € par mois ou 39,99 € par an (prix TTC en France, susceptibles d’évoluer : tu en serais prévenu·e).',
      '- Le paiement est réalisé par l’App Store (Apple) ou Google Play, selon leurs conditions. L’abonnement se renouvelle automatiquement, sauf résiliation au moins 24 heures avant la fin de la période en cours, dans les réglages de ton compte Apple ou Google.',
      '- Sans abonnement, tu gardes l’accès à ta garde-robe ; seuls les looks du jour s’arrêtent.',
      '- Codes promo : un code donne une réduction sur l’abonnement selon les conditions indiquées lors de son utilisation.',
    ] },
    { title: 'Droit de rétractation et remboursements', body: [
      'L’abonnement donne accès immédiatement au service. En le souscrivant pendant ou après l’essai, tu demandes son exécution immédiate et tu reconnais que ton droit de rétractation ne s’applique plus une fois le service commencé (article L221-28 du Code de la consommation). Les demandes de remboursement se font auprès d’Apple ou de Google, selon leurs règles.',
    ] },
    { title: 'Tes photos et tes contenus', body: [
      'Tes photos restent à toi. Tu nous autorises seulement à les stocker et à les analyser pour faire fonctionner le service, pendant la durée de ton compte. Tu t’engages à n’ajouter que des photos de vêtements, sans contenu illicite, et sans photographier d’autres personnes sans leur accord.',
    ] },
    { title: 'Bon usage', body: [
      'Il est interdit de détourner le service (tentative d’accès aux données d’autrui, extraction automatisée, revente, contournement de l’abonnement). En cas d’abus, le compte peut être suspendu après avertissement, sauf urgence.',
    ] },
    { title: 'Responsabilité', body: [
      'On fait de notre mieux pour que le service soit disponible et utile, sans pouvoir garantir l’absence de panne. Les conseils de style et la météo sont donnés à titre indicatif. Rien dans ces conditions ne limite les droits que la loi t’accorde en tant que consommateur.',
    ] },
    { title: 'Évolution des conditions', body: [
      'Ces conditions peuvent évoluer. En cas de changement important, tu en es informé·e dans l’appli au moins 30 jours avant ; tu peux alors résilier sans frais.',
    ] },
    { title: 'Litiges', body: [
      `Ces conditions sont soumises au droit français. En cas de souci, écris-nous d’abord à ${CONTACT} : on cherchera une solution ensemble. Tu peux aussi recourir gratuitement au médiateur de la consommation : [nom et site du médiateur]. À défaut d’accord, les tribunaux compétents sont ceux prévus par la loi.`,
    ] },
  ],
};

export const LEGAL_DOCS = { cgu: TERMS, confidentialite: PRIVACY } as const;
