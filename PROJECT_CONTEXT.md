# PROJECT_CONTEXT

## Contexte actuel (déjà fait)
- Design principal défini.
- Header, Accueil et Calendrier réalisés.
- Structure sections/pages et UI réutilisable en place.
- Styling SCSS avec imbrication via `&`.

## Intentions et règles de rédaction
- Utiliser souvent “prévu”, “envisagé”, “à confirmer”.
- Rien n’est figé, mais certaines pages/UI sont considérées stables tant qu’aucun besoin ne change.

## Priorités à venir (résumé)
- **Classement / Résultats** (prévu): stockage des résultats (GP + général), analyse BDD (Firebase envisagé) + limites, interface de saisie/modif, accès protégé.
- **Authentification** (prévu): connexion via Twitch pour tous les utilisateurs, gestion de permissions par nom Twitch.
- **Multi‑Twitch** (à confirmer): étude des possibilités/limites/impacts avant implémentation.
- **Réglages** (prévu): page statique tutorielle avec captures, retouches d’images, nommage/classes propres.
- **Pilotes** (prévu): page statique avec images, design soigné “vitrine”.
- **Hébergement** (à confirmer): alternatives à GitHub Pages, possibilité d’hébergement payant annuel.

## Règles de travail (priorisation)
- Ne traiter qu’un seul sujet à la fois, sauf dépendance explicite.
- Quand il y a dépendance, détailler les choix possibles et impacts entre solutions.

## Détails validés (à date)
- Auth Twitch obligatoire pour accéder aux sections protégées et aux menus d’édition.
- Permissions ciblées par noms Twitch, plutôt qu’un système de rôles génériques.
- Admin principal: accès total; possibilité future de co‑dev avec accès total.
- Permissions dédiées: saisie/modif des résultats; une permission spécifique pour la section Circuits (rédaction type blog).
- Résultats GP: données visées = classement sprint, classement course, meilleur tour, grille de départ, DNF/DQ, sanctions post‑course (commission), règles à préciser lors du dev.
- Saisie résultats: manuelle, avec UI drag & drop.
- Pilotes et Réglages: pages statiques, indépendantes, pas prioritaires.
- Hébergement: préférence Europe/France.

## Choix actés (infrastructure)
- Hébergement: **Netlify** (sans domaine personnalisé pour le moment).
- Auth: **Twitch OAuth** avec 2–3 fonctions serverless (acceptable).
- BDD: **Firebase (Firestore)** pressenti, **Supabase** reste à confirmer.
  - App Twitch: **Les Fous du Volant – Saison 3**
  - Redirect URLs prévues:
    - Production: `https://les-fous-du-volant.netlify.app/api/auth/twitch/callback`
    - Local: `http://localhost:5173/api/auth/twitch/callback`
  - Flow: Authorization Code + refresh token.

## Points à retenir (contexte assistant)
- Objectif à court terme: publier en ligne + préparer la partie Classement.
- Le repo GitHub contient le code brut; un build est nécessaire pour déployer.
- On avance étape par étape, sans traiter plusieurs sujets en parallèle sauf dépendance.
