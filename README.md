# Les Fous du Volant — Saison 3
Site vitrine du tournoi **Les Fous du Volant**, saison 3, sur le jeu **F1 25**.

## Contexte projet (résumé)
- Site orienté contenu, design déjà défini (header, home, calendrier).
- Les sections sont des pages, les composants `ui` sont réutilisables.
- Les assets (brand, fonts, images, vidéos) sont gérés localement.

## Stack
- Vite + React 19 (ES modules)
- React Router 7
- Sass (SCSS)
- `flag-icons` pour les drapeaux

## Démarrage
1. `npm install`
2. `npm run dev`

Note: pour l’auth Twitch en local (functions + HTTPS), utiliser `netlify dev`.

## Scripts
- `npm run dev`: serveur de dev Vite
- `npm run build`: build prod
- `npm run preview`: preview du build
- `npm run lint`: ESLint

## Conventions de code
- Un composant = un dossier, avec `Component.jsx` + `Component.scss`.
- Import du style local en premier dans chaque composant.
- Nommage **PascalCase** pour dossiers/fichiers de composants.
- Classes CSS en BEM-ish: `bloc`, `bloc__element`, `bloc__element--modifier`.
- Nommage fréquent en parties `xxx-yyy-zzz` pour les blocs ou éléments.
- Les sections utilisent `className="app-section app-<section>"`.
- Les textes sont en français.

## Styles (Sass)
- Utiliser **l’imbrication SCSS avec `&`** pour les éléments et modificateurs.
- Exemples:
```
.bloc {
  &__element {
    &--modifier {}
  }
}
```
- Variables globales: `src/styles/_variables.scss`.
- Mixins: `src/styles/_mixins.scss`.
- Fonts: `src/styles/_fonts.scss`.
- Reset: `src/styles/_reset.scss`.

## Routing
Déclaré dans `src/App.jsx` via `BrowserRouter` + `Routes`.

## Données et logique
- Données statiques dans `src/data/`.
- Helpers dans `src/utils/` (ex: gestion calendrier GP).
- Source BDD actée: Firebase Firestore (la révélation des GP est prévue côté BDD, pas en source JS finale).

## Assets
- Centralisés dans `src/assets/`.
- Résolution dynamique possible via `src/utils/assetResolver.js`.
