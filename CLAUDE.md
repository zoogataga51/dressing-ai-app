# Consignes pour Claude (développement de Dressing AI)

- Langue : tout le texte visible par l'utilisateur est en français, tutoiement, ton chaleureux et chic.
- Le fondateur ne code pas : expliquer les choix en langage simple, sans jargon.
- Design : passer TOUJOURS par `useTheme()` et `src/theme/tokens.ts`, jamais de couleur en dur.
- Animations : Reanimated, durées de `motion` dans les tokens. Courtes et utiles.
- Jamais de barre de défilement visible (`showsHorizontalScrollIndicator={false}` etc.).
- Tout élément cliquable passe par `PressableScale` (appui animé + retour haptique).
- Vérifier avant chaque commit : `npx tsc --noEmit`, puis `EXPO_OFFLINE=1 npx expo export --platform ios --output-dir /tmp/export-test`.
- Installer les paquets natifs avec `EXPO_OFFLINE=1 npx expo install <paquet>` (versions compatibles Expo).
- Aucune clé secrète dans l'appli : les appels à l'IA passent par `supabase/functions`.
- Lire `docs/ARCHITECTURE.md` avant une modification importante.
