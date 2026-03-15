# PROJECT_CONTEXT

## Rôle

Mémoire de travail du projet pour garder les décisions, contraintes et priorités entre conversations.

## État actuel

- Auth Twitch migrée vers Supabase Auth.
- Permissions migrées vers Supabase (`profiles`, `capabilities`, `user_capabilities`).
- Calendar migré vers Supabase (`calendar_settings`).
- Le panel admin des permissions fonctionne localement.
- Le mode de développement courant est `npm run dev`.
- Le déploiement Cloudflare Pages n'est pas encore configuré.

## Choix techniques verrouillés

- Frontend : React + Vite.
- Auth : Supabase Auth avec Twitch.
- Base de données : Supabase Postgres.
- Déploiement cible : Cloudflare Pages.
- Région Supabase actuelle : Paris (`eu-west-3`).
- Pas de dépendance résiduelle à Netlify ou Firebase dans le code applicatif.

## Variables d'environnement frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Aucune clé `secret` ou `service_role` ne doit être injectée dans le frontend.

## Auth et profils

- Les utilisateurs sont synchronisés dans `profiles` à la connexion.
- Données utiles de profil :
  - `id`
  - `provider`
  - `provider_user_id`
  - `provider_login`
  - `display_name`
  - `avatar_url`
  - `is_super_admin`
- `provider_login` correspond au login Twitch.
- `display_name` correspond au nom d'affichage Twitch avec sa casse.

## Permissions - vision validée

- Modèle par capacités, évolutif.
- Capacités initiales validées :
  - `admin.permissions.manage`
  - `calendar.write`
- Le super-admin a tous les droits par défaut.
- Les droits du super-admin ne sont modifiables via aucune interface du site.
- Le backend logique de sécurité repose sur Supabase (RLS + vérifications applicatives), pas sur le frontend.

## Schéma SQL actuellement posé

### Tables en place

- `profiles`
- `capabilities`
- `user_capabilities`
- `teams`
- `drivers`
- `calendar_settings`

### Scripts SQL versionnés

- `supabase/sql/001_initial_schema.sql`

## Calendar

- Ligne Supabase : `calendar_settings.id = 'season3'`.
- Champ principal : `revealed` (tableau de 12 entiers `0..24`).
  - index = slot GP saison côté UI
  - valeur = id circuit (`0` = circuit non révélé)
- Métadonnées conservées :
  - `updated_at`
  - `updated_by`
- Pas de fallback local statique pour les données dynamiques.

## Panel admin permissions

- Route frontend : `/admin/permissions`.
- Visibilité réservée au super-admin.
- Le panel permet :
  - de lister les utilisateurs enregistrés
  - d'afficher les capacités connues
  - d'ajouter une capacité côté UI
  - d'activer ou désactiver une capacité par utilisateur
- Le backend reste source de vérité.

## Priorités produit

1. Finaliser la migration d'hébergement vers Cloudflare Pages.
2. Structurer les données du module Résultats.
3. Construire la saisie des résultats GP.
4. Étendre ensuite les permissions par fonctionnalité.

## Résultats GP - besoins confirmés

- 12 GP, chacun avec sprint + course.
- Classement pilotes + classement écuries.
- Statuts : `ABS`, `DNF`, `DSQ`, `DC`.
- Barèmes custom sprint/course + meilleur tour.
- Sanctions post-course : retrait de points, déclassement, pénalité de temps, disqualification, bannissement.
- Qualifs distinctes pour sprint et course.
- Possibilité de saisir le temps du vainqueur et les écarts.
- Pour un `DNF`, conservation du tour d'abandon envisagée dès le départ.

## Contrat métier validé - résultats

### Users

- `users` au sens métier ne doivent pas structurer les résultats.
- L'identité applicative passe par `profiles`, mais les résultats ne doivent pas dépendre de l'utilisateur connecté.

### Drivers

- Collection logique cible : `drivers/{driverId}`.
- Champs validés :
  - `displayName`
  - `linkedTwitchId`
  - `racingNumber`
  - `teamId`
  - `isStreamer`
  - `isActive`
- Le nom affiché d'un pilote est son pseudo Twitch courant.

### Teams

- Collection logique cible : `teams/{teamId}`.
- Champs validés :
  - `name`
  - `shortName`
  - `colorKey`
  - `logoKey`

### Points rules

- Collection logique cible : `pointsRules/{ruleSetId}`.
- Règles distinctes pour `sprint` et `race`.
- Barème prévu jusqu'à la 20e place.
- Statuts standardisés à conserver :
  - `ABS`
  - `DNF`
  - `DSQ`
  - `DC`
- Le bonus meilleur tour reste séparé du barème de position.

### GP et sessions

- Collection logique cible : `gps/{gpId}`.
- La révélation des circuits reste gérée uniquement par `calendar_settings`.
- Chaque GP contient 4 sessions métier :
  - `sprint-qualifying`
  - `sprint`
  - `race-qualifying`
  - `race`
- Collection logique cible : `gps/{gpId}/sessions/{sessionId}`.
- Champs attendus :
  - `sessionType`
  - `pointsType` (`none`, `sprint`, `race`)
  - `status`

### Entries de session

- Collection logique cible : `gps/{gpId}/sessions/{sessionId}/entries/{driverId}`.
- Champs à anticiper :
  - `driverId`
  - `classificationType`
  - `rank`
  - `bestTime`
  - `gapToLeader`
  - `dnfLap`
  - `gridPenaltyPlaces`
  - `notes`
- Règles de structure :
  - `classificationType` est la source principale d'état métier
  - `rank` sert au classement officiel quand le pilote est classé
  - pas de duplication de statut métier dans des champs booléens parallèles
  - `gridPenaltyPlaces` n'est autorisé que pour une pénalité native du jeu en qualification
  - les sanctions humaines ne vivent pas dans l'entry brute

### Sanctions

- Les sanctions ne doivent pas écraser destructivement le résultat brut saisi après la course.
- Collection logique cible : `sanctions/{sanctionId}`.
- Portée à anticiper :
  - `session`
  - `gp`
  - `season`
- Types à anticiper :
  - `time_penalty`
  - `position_drop`
  - `points_deduction`
  - `disqualification`
  - `ban`

## Hypothèses de charge hautes

- 20 à 100 utilisateurs authentifiés par mois.
- Environ 1 000 consultations mensuelles sur la partie Résultats.
- Écritures faibles, concentrées autour des GP et de l'administration.

## Direction technique validée

- Supabase reste la solution retenue pour l'auth, la base et les permissions.
- Cloudflare Pages reste la cible d'hébergement retenue.
- Les écritures directes depuis le frontend sont acceptées, à condition d'être protégées côté Supabase.
- Le modèle relationnel est considéré plus naturel pour le projet que l'ancien modèle Firestore.

## Prochaines étapes

1. Configurer le projet Cloudflare Pages.
2. Injecter les variables d'environnement Supabase côté Cloudflare.
3. Valider le build Vite en préproduction hébergée.
4. Nettoyer ensuite les derniers éléments de configuration historiques inutiles.

## Règles de collaboration

- Un sujet à la fois sauf dépendance technique explicite.
- Si dépendance : détailler les impacts avant implémentation.
- Ne pas faire de changements structurels hors scope demandé.
- Tous les textes UI affichés en français doivent garder les accents corrects.

## Déploiement Cloudflare - procédure courante

- Projet Pages actuel : les-fous-du-volant-3.
- Mode retenu : Direct Upload via Wrangler après build local.
- Commande de connexion initiale : 
px wrangler login.
- Commande de déploiement production : 
pm run deploy:cloudflare.
- Commande de déploiement preview : 
pm run deploy:cloudflare:preview.
- On évite le build distant par intégration Git pour garder un contrôle total du déploiement et limiter les surprises de plateforme.

