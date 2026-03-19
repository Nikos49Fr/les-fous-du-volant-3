# PROJECT_CONTEXT

## Rôle

Mémoire de travail du projet pour garder les décisions, contraintes et priorités entre conversations.

## État actuel

- Auth Twitch migrée vers Supabase Auth et validée.
- Permissions migrées vers Supabase et panel admin fonctionnel.
- Calendar migré vers Supabase et panel d'édition fonctionnel.
- Hébergement migré vers Cloudflare Pages et validé.
- Déploiement CLI Cloudflare via `wrangler` local validé.
- Module `Résultats` public en place.
- Saisie admin des résultats GP en place.
- Drapeaux migrés depuis `flag-icons` vers des SVG locaux.

## Choix techniques verrouillés

- Frontend : React + Vite.
- Routing : React Router 7.
- Auth : Supabase Auth avec Twitch.
- Base de données : Supabase Postgres.
- Hébergement : Cloudflare Pages.
- Déploiement : build local + upload Cloudflare via Wrangler.
- Pas de dépendance résiduelle à Netlify, Firebase ou `flag-icons` dans le code applicatif.
- Le shell applicatif reste chargé immédiatement ; les pages sont lazy-loadées par route.

## Variables d'environnement frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Aucune clé `secret` ou `service_role` ne doit être injectée dans le frontend.

## Auth et profils

- Les utilisateurs sont synchronisés dans `profiles` à la connexion.
- Champs utiles de `profiles` :
  - `id`
  - `provider`
  - `provider_user_id`
  - `provider_login`
  - `display_name`
  - `avatar_url`
  - `is_super_admin`
- `provider_login` correspond au login Twitch.
- `display_name` correspond au nom d'affichage Twitch avec sa casse.

## Permissions

### Modèle validé

- Modèle par capacités, extensible.
- Capacités actuellement utilisées :
  - `admin.permissions.manage`
  - `calendar.write`
- Le super-admin a tous les droits par défaut.
- Les droits du super-admin ne sont modifiables via aucune interface du site.
- La sécurité réelle repose sur Supabase, pas sur le masquage frontend.

### Admin permissions

- Route : `/admin/permissions`
- Accès réservé au super-admin.
- La page est organisée en onglets.
- Deux blocs métier actuels :
  - gestion des capacités utilisateur
  - liaison manuelle entre un pilote et un profil Twitch
- La liaison pilote/profil remplit `drivers.linked_user_id`.
- Le tri ou l'affichage dans cette page ne doit pas être modifié hors besoin explicite.

## Schéma SQL en place

### Scripts versionnés

- `supabase/sql/001_initial_schema.sql`
- `supabase/sql/002_results_schema.sql`

### Tables principales actuellement utilisées

- `profiles`
- `capabilities`
- `user_capabilities`
- `teams`
- `drivers`
- `calendar_settings`
- tables liées aux résultats GP introduites par `002_results_schema.sql`

## Calendar

- Ligne Supabase : `calendar_settings.id = 'season3'`.
- Champ principal : `revealed`.
- Le calendrier reste la source de vérité pour les GP révélés.
- Le panneau d'édition ouvre une modale locale avec sélection de circuit.

## Résultats GP

### Données métier validées

- 12 GP affichés actuellement côté produit, 24 potentiels au total côté assets drapeaux.
- Chaque GP contient 4 sessions :
  - `sprint_qualifying`
  - `sprint`
  - `race_qualifying`
  - `race`
- Les temps complets ne sont pas gérés.
- Le meilleur tour est géré comme donnée métier, mais son affichage public peut évoluer.
- Les statuts métier utilisés sont :
  - `DNS`
  - `DNF`
  - `ABS`
  - `DSQ`

### Saisie admin des résultats

- La saisie n'est plus une modale : c'est un onglet dédié dans `Résultats`.
- La barre supérieure `Résultats` fonctionne en onglets.
- La barre interne de saisie contient :
  - onglets de session
  - sélecteur de GP
  - actions `Effacer` / `Sauvegarder`
- L'effacement d'un GP passe par une modale de confirmation avec maintien du bouton `Oui` pendant 2,5 secondes.
- La saisie partielle est autorisée.

### Affichage public des résultats

- `Tournoi` et `Par course` sont deux onglets distincts.
- Le rendu `Tournoi` est considéré stable : ne pas le casser lors des ajustements `Par course`.
- Le rendu `Par course` a ses propres variantes SCSS ; les changements doivent rester ciblés.
- Le carrousel de GP n'affiche qu'un GP actif à la fois.
- Par défaut, l'onglet `Par course` se positionne sur le dernier GP ayant des résultats disponibles en mémoire locale.

### Architecture frontend de Results

Le dossier `src/components/sections/Results` est découpé par responsabilités :

- `config/` : structure des colonnes
- `tabs/` : barre d'onglets principale
- `tournament/` : vue `Tournoi`
- `gp/` : vue `Par course`
- `shared/cells/` : cellules spécialisées
- `shared/table/` : table partagée et son SCSS
- composants admin spécifiques dans le dossier racine `Results`

Règles validées :

- pas de CSS inline dans le JSX
- classes seulement dans le JSX
- styles dans les fichiers SCSS
- media queries réservées aux changements de layout
- tailles, marges, paddings et gaps à privilégier via `clamp(...)`

## Assets drapeaux

- Les drapeaux sont stockés localement dans `src/assets/images/flags`.
- Le composant partagé est `src/components/ui/Flag/Flag.jsx`.
- À réutiliser pour tout nouvel affichage de drapeau, notamment dans `Circuits`.

## Performances et build

- Les pages sont lazy-loadées pour réduire le bundle initial.
- `wrangler` est installé localement pour éviter les téléchargements implicites au déploiement.
- Le gros poste restant côté assets est désormais constitué des SVG/medias réels, pas d'une dépendance CSS globale de drapeaux.

## Déploiement Cloudflare - procédure courante

- Projet Pages : `les-fous-du-volant-3`
- Connexion initiale : `npx wrangler login`
- Déploiement production : `npm run deploy:cloudflare`
- Déploiement preview : `npm run deploy:cloudflare:preview`
- Le mode retenu est le build local puis upload explicite, pas le build distant Git.

## Règles de collaboration

- Un sujet à la fois sauf dépendance technique explicite.
- Si dépendance : détailler les impacts avant implémentation.
- Ne pas faire de changements structurels hors scope demandé.
- Mettre à jour `PROJECT_CONTEXT.md` et `README.md` après toute décision technique globale ou durable.
- Tous les textes affichables doivent rester en UTF-8 propre avec accents français corrects.
- Cette règle vaut aussi pour les `aria-label`, `alt`, info-bulles et messages de fallback.
- Factoriser le SCSS avec des mixins dès qu'un motif visuel ou une logique de style se répète de façon pertinente.
