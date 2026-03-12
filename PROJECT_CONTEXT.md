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
- **Classement / Résultats** (prévu): stockage des résultats (GP + général) sur Firebase, interface de saisie/modif, accès protégé.
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
- Auth Twitch fonctionnelle en **dev** et en **prod** (login + affichage avatar/username + déconnexion).

## Choix actés (infrastructure)
- Hébergement: **Netlify** (sans domaine personnalisé pour le moment).
- Auth: **Twitch OAuth** avec fonctions serverless Netlify.
- BDD: **Firebase (Firestore)** acté.
  - Pas de migration BDD prévue à moyen terme.
  - App Twitch: **Les Fous du Volant – Saison 3**
  - Redirect URLs prévues:
    - Production: `https://les-fous-du-volant.netlify.app/api/auth/twitch/callback`
    - Local (HTTPS): `https://localhost:8888/api/auth/twitch/callback`
  - Flow: Authorization Code + refresh token.

## Points à retenir (contexte assistant)
- Objectif à court terme: publier en ligne + préparer la partie Classement.
- Le repo GitHub contient le code brut; un build est nécessaire pour déployer.
- On avance étape par étape, sans traiter plusieurs sujets en parallèle sauf dépendance.
- Dev local pour l’auth: **utiliser `netlify dev`** (HTTPS local + functions).
- Certificats locaux: générés avec mkcert dans `dev-certs/`.
- Choix BDD verrouillé: Firebase uniquement.

## BDD / Résultats (à structurer)
### Essentiel (confirmé)
- Résultats des 12 GP, avec 2 courses par GP (sprint + course).
- Classements individuels + points (barème sprint / course propre au tournoi).
- Classement écuries (2 pilotes par écurie).
- Meilleur tour sprint + course (+1 point, sans condition de top 10).
- Gestion des statuts par pilote: DNF, ABS, DSQ, bug/déconnexion.
- Sanctions de commission (post‑course): disqualification, retrait de points, déclassement, pénalité temps.
- Données pilotes/écuries: pseudo, numéro, équipe, chaîne Twitch, tags utiles.
- Interface d’édition sécurisée (au début admin seul, puis permissions ciblées).

### Envisagé / à confirmer
- Stockage des positions de grille (qualifs).
- Stockage des temps/écarts pour faciliter les sanctions.
- Choix “brut + calcul client” vs “pré‑calcul + stockage”.

### Volumétrie estimée
- Saisie manuelle après chaque GP, puis corrections ponctuelles.
- Lecture majoritaire (faible trafic): ~200 personnes x 20 visites/mois (estimation haute).

## Schéma grossier (JS vs BDD)
### Données plutôt JS (stables, rarement modifiées)
- Liste des GP statiques (12 manches, dates, labels).
- Métadonnées visuelles stables (noms de sections, textes statiques, assets fixes).

### Données plutôt BDD (évolutives, éditables)
- Révélation GP (`GP_REVEALED`) en source de vérité Firestore.
- Pilotes (identité, pseudo Twitch, numéro, statut actif/inactif).
- Écuries et affectations pilote <-> écurie.
- Sessions de GP (sprint/course) et classements.
- Statuts de résultat (DNF, ABS, DSQ, bug/déco).
- Points calculés et/ou points bruts selon stratégie retenue.
- Sanctions de commission et leur impact (points, places, temps, DSQ).

### Cas à anticiper (pas encore détaillés)
- Départ d'un pilote en cours de saison.
- Arrivée d'un pilote remplaçant en cours de saison.
- Changement d'écurie en cours de saison.
- Conservation de l'historique: un résultat passé doit rester lié au pilote/écurie du moment.

### Capacités visées du schéma
- Saisir un résultat brut de session puis recalculer les classements.
- Appliquer une sanction a posteriori sans casser l'historique.
- Afficher plusieurs vues: par course, par GP, classement général pilotes, classement écuries.
- Ouvrir plus tard un module d'édition à permissions ciblées sans refaire le modèle.
- Pas de fallback local sur la revelation GP: si la BDD/API est indisponible, afficher un etat d'erreur dedie.
