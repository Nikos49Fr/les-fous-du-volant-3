# PROJECT_CONTEXT

## Rôle

Mémoire de travail durable du projet.
On y garde les décisions techniques et produit encore utiles entre conversations.
On retire les détails de réglage ponctuels qui n'ont plus de valeur opérationnelle.

## État actuel

- Frontend : React + Vite.
- Routing : React Router 7.
- Auth : Supabase Auth avec Twitch.
- Base de données : Supabase Postgres.
- Hébergement : Cloudflare Pages.
- Déploiement : build local + upload Cloudflare via Wrangler.
- Permissions Supabase en place avec panel admin fonctionnel.
- Calendrier Supabase en place avec édition admin.
- Résultats publics + saisie admin des GP en place.
- Module Multi-Twitch en place et utilisable.
- Gestion du cycle de vie des pilotes en place (`draft`, `active`, `abandoned`).
- Section `Participants` refondue :
  - onglet `Pilotes` avec cards individuelles, bio et lien Twitch
  - onglet `Écuries` avec cards roster
  - onglets `Casteurs` et `Staff` avec liens Twitch directs
- Open Graph / Twitter Card configurés dans `index.html`.
- Favicons servis depuis `public/favicon` et `public/site.webmanifest`.

## Variables d'environnement frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Aucune clé `service_role` ou autre secret ne doit entrer dans le frontend.

## Auth et profils

- Les utilisateurs sont synchronisés dans `profiles` à la connexion.
- Le login Twitch via Supabase doit revenir sur l'URL exacte en cours pour préserver le contexte, notamment sur `Multi-Twitch`.
- Champs utiles de `profiles` :
  - `id`
  - `provider`
  - `provider_user_id`
  - `provider_login`
  - `display_name`
  - `avatar_url`
  - `is_super_admin`
- `provider_login` = login Twitch.
- `display_name` = nom d'affichage Twitch.

## Permissions

### Modèle

- Modèle par capacités, extensible.
- Capacités actuellement utilisées :
  - `admin.permissions.manage`
  - `calendar.write`
  - `results.write`
  - `multi_twitch.test_channels.view`
- Le super-admin a tous les droits par défaut.
- Les droits du super-admin ne sont pas modifiables via le site, sauf l'exception explicitement autorisée pour `multi_twitch.test_channels.view`.
- La sécurité réelle repose sur Supabase, pas sur le masquage frontend.

### Admin permissions

- Route : `/admin/permissions`
- Accès réservé au super-admin.
- La page est organisée en onglets.
- Blocs métier actuels :
  - gestion des capacités utilisateur
  - gestion des pilotes
  - liaison manuelle pilote / profil Twitch

## Schéma SQL versionné

- `supabase/sql/001_initial_schema.sql`
- `supabase/sql/002_results_schema.sql`
- `supabase/sql/003_multi_twitch_live_snapshot.sql`
- `supabase/sql/004_driver_management.sql`
- `supabase/sql/005_driver_bio.sql`

## Tables principales

- `profiles`
- `capabilities`
- `user_capabilities`
- `teams`
- `drivers`
- `calendar_settings`
- `result_sessions`
- `result_entries`
- `multi_twitch_live_snapshot`

## Calendar

- Ligne Supabase : `calendar_settings.id = 'season3'`.
- Champ principal : `revealed`.
- Le calendrier reste la source de vérité pour les GP révélés.

## Résultats GP

### Données métier

- 12 GP affichés côté produit.
- 4 sessions par GP :
  - `sprint_qualifying`
  - `sprint`
  - `race_qualifying`
  - `race`
- Les temps complets ne sont pas gérés.
- Le meilleur tour est une donnée métier.
- Statuts métier :
  - `DNS`
  - `DNF`
  - `ABS`
  - `DSQ`

### Saisie admin

- La saisie se fait dans un onglet dédié de `Résultats`.
- La saisie partielle est autorisée.
- L'effacement d'un GP passe par une modale de confirmation.

### Affichage public

- `Tournoi` et `Par course` sont deux onglets distincts.
- Le rendu `Tournoi` est considéré stable.
- Le rendu `Par course` a ses propres variantes SCSS ; les changements doivent rester ciblés.
- Par défaut, l'onglet `Par course` se positionne sur le dernier GP ayant des résultats disponibles.

### Architecture frontend Results

Le dossier `src/components/sections/Results` est découpé par responsabilités :

- `config/`
- `tabs/`
- `tournament/`
- `gp/`
- `shared/cells/`
- `shared/table/`
- composants admin dans le dossier racine `Results`

Règles validées :

- pas de CSS inline dans le JSX
- classes uniquement dans le JSX
- styles dans les fichiers SCSS
- media queries réservées aux changements de layout
- tailles, marges, paddings et gaps via `clamp(...)` quand pertinent

## Participants / pilotes

- Les drapeaux sont stockés localement dans `src/assets/images/flags`.
- Le composant partagé est `src/components/ui/Flag/Flag.jsx`.
- Les images de pilotes restent gérées manuellement dans les assets.
- Les bios pilotes sont éditées manuellement dans l'admin.
- Les cards pilotes affichent :
  - photo pilote
  - nom + numéro
  - voiture, logo et nom d'écurie
  - bio tronquée avec tooltip natif sur hover
  - lien Twitch si disponible
- Les pilotes actifs sont affichés en premier.
- Les pilotes inactifs sont listés ensuite sous un sous-titre dédié.
- Les cards écuries n'affichent pour l'instant que les pilotes actifs.

## Multi-Twitch

- On privilégie les embeds officiels Twitch pour la vidéo et le chat.
- La détection des chaînes live passe par Supabase Edge Functions, jamais directement depuis le frontend public.
- Le refresh live repose sur un snapshot BDD relu par le frontend.
- La configuration locale Multi-Twitch est persistée dans `localStorage`.
- Le thème du chat Twitch (`light` / `dark`) est piloté côté frontend avec fallback initial sur `prefers-color-scheme`, puis persistance locale.
- Le paramètre `darkpopout` est utilisé pour le chat sombre.
- Les chaînes Twitch de test restent surveillées par l'Edge Function, mais leur affichage frontend est piloté uniquement par la permission `multi_twitch.test_channels.view`.
- Le module Multi-Twitch est découpé en sous-composants dédiés ; `MultiTwitch.scss` ne doit garder que le layout global.

## Déploiement Cloudflare

- Projet Pages : `les-fous-du-volant-3`
- Connexion initiale : `npx wrangler login`
- Déploiement production : `npm run deploy:cloudflare`
- Déploiement preview : `npm run deploy:cloudflare:preview`
- Le mode retenu est le build local puis upload explicite.

## Règles de collaboration

- Un sujet à la fois sauf dépendance technique explicite.
- Si dépendance : détailler les impacts avant implémentation.
- Ne pas faire de changement structurel hors scope demandé.
- Mettre à jour `PROJECT_CONTEXT.md` après toute décision durable.
- Tous les textes affichables doivent rester en UTF-8 propre.
- Factoriser le SCSS dès qu'un motif se répète de façon pertinente.

## Workflow Git

- `main` doit rester la branche déployable propre.
- Les grosses features se font sur branche dédiée.
- Les micro-corrections prod se font depuis `main` ou une branche courte dédiée, puis sont reportées vers la branche feature si nécessaire.
- Si une branche feature est trop avancée pour un patch urgent, on tranche au cas par cas avant d'agir.
- Workflow recommandé :
  - développement sur branche feature
  - commit local
  - publication de la branche distante
  - fusion vers `main` seulement quand la feature est jugée publiable

## Branche de travail actuelle

- Branche actuelle : `feature/driver-management`
- Statut : feature terminée localement, prête à être publiée puis fusionnée vers `main`.

## Cadrage verrouillé - driver management

### Règles métier

- Les points du championnat sont attachés au pilote, jamais au baquet.
- Un nouveau pilote démarre toujours à `0` point.
- L'historique des courses doit toujours afficher le pilote réel ayant couru à la date d'origine.
- Il n'existe pas de notion métier distincte de `remplaçant` : un nouveau pilote est simplement un nouveau pilote.

### Cycle de vie d'un pilote

- États utiles :
  - `draft`
  - `active`
  - `abandoned`
- Un nouveau pilote est créé en brouillon puis activé ensuite.
- Un abandon est historisé via le `dernier GP disputé`.
- Libellé UI retenu : `A abandonné après ce GP`.
- L'abandon prend effet à partir du GP suivant.
- Un pilote abandonné reste dans le classement général avec ses points acquis.
- Sa contribution aux points écurie reste aussi acquise.
- Chaque pilote dispose aussi d'un champ `bio` éditable côté admin.

### Cas particuliers

- `Shankara` sera traité manuellement après coup.
- On ne complexifie pas le modèle pour ce cas particulier.

### Saisie admin des résultats

- Un pilote abandonné n'apparaît plus dans les listes de saisie à partir du GP suivant son dernier GP disputé.
- Il reste sélectionnable pour les GP précédents afin de permettre des corrections historiques.
- Un nouveau pilote n'apparaît dans la saisie admin qu'à partir de son GP d'entrée.
- Dans l'admin de gestion des pilotes, les sélecteurs de GP doivent afficher les GP réels actuellement révélés du calendrier du tournoi, pas le catalogue brut des 24 circuits potentiels.

### Portée de la branche

- Livré sur cette branche :
  - modèle de données des pilotes
  - panneau admin de gestion des pilotes
  - adaptation de la saisie admin des résultats
  - logique publique minimale côté résultats pour rester cohérente
  - refonte publique de la section `Participants`
- Hors scope de cette branche :
  - section `Commission`
  - tagging visuel public plus détaillé des abandons dans toutes les vues résultats
