# Dressing AI

Application mobile (iPhone et Android) qui propose chaque matin 1 à 3 looks composés
uniquement avec les vêtements de l'utilisateur, selon la météo, son humeur et son style.

## Tester l'appli sur ton téléphone

1. Installe **Expo Go** sur ton téléphone (App Store ou Google Play).
2. Sur ton PC, dans le dossier du projet :
   ```
   npm install
   npx expo start
   ```
3. Scanne le QR code affiché avec l'appareil photo (iPhone) ou avec Expo Go (Android).

L'appli tourne en **mode démo** tant que Supabase n'est pas branché : une garde-robe
et un historique d'exemple sont pré-remplis, tout reste sur le téléphone.
Pour recommencer l'inscription : Profil → Supprimer mon compte.

## Organisation du code

| Dossier | Contenu |
|---|---|
| `app/` | Les écrans (Expo Router : un fichier = un écran) |
| `app/(tabs)/` | Les 4 onglets : Aujourd'hui, Garde-robe, Historique, Profil |
| `app/onboarding/` | Inscription : accueil, questionnaire, duels de looks |
| `src/theme/` | **Toute l'identité visuelle** (couleurs, polices, animations) |
| `src/components/` | Composants réutilisables (boutons, stickers, cartes…) |
| `src/data/` | Questionnaire, duels, données de démo |
| `src/lib/` | Moteur de looks, météo, IA, Supabase |
| `src/state/` | État de l'appli (garde-robe, profil, historique) |
| `supabase/` | Base de données (SQL) et fonctions serveur |
| `docs/` | Architecture et décisions |

Détails : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
