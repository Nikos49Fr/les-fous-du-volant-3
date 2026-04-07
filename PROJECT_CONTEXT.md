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
- Métadonnées Open Graph / Twitter Card configurées dans `index.html` avec image publique `public/brand/les-fous-du-volant-oc.webp`.
- Favicons publics servis depuis `public/favicon` et `public/site.webmanifest`.

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
- Le login Twitch via Supabase doit renvoyer l'utilisateur sur l'URL exacte en cours pour préserver le contexte d'usage, notamment sur `Multi-Twitch`.
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
- Pour la détection Multi-Twitch, si `drivers.linked_user_id` n'est pas renseigné, le fallback de login doit privilégier `drivers.display_name`, puis seulement `drivers.id`, car certains `id` historiques ont perdu des underscores finaux.

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

## Projection Multi-Twitch

- Pour préserver au mieux le comportement Twitch natif, privilégier les embeds officiels Twitch pour la vidéo et le chat.
- La détection des chaînes live doit passer par Supabase Edge Functions, jamais directement depuis le frontend public.
- Le modèle retenu pour la détection live est un snapshot en base relu par le frontend, avec une Edge Function `refresh-multi-twitch-live` qui seule décide d'interroger Twitch au maximum une fois par tranche de 60 secondes.
- Le refresh manuel Multi-Twitch contourne la fenêtre auto de 60 secondes, mais reste limité à une relance maximale toutes les 15 secondes.
- Le snapshot live est stocké dans `public.multi_twitch_live_snapshot`.
- La fonction métier de coordination SQL est `public.claim_multi_twitch_live_refresh(...)`.
- La configuration locale Multi-Twitch (POV sélectionnées, panneaux, réglages audio) est persistée dans `localStorage` pour restaurer l'interface lors d'un retour sur la page.
- Le réglage de volume réutilisable est factorisé dans `src/components/ui/VolumeControl/VolumeControl.jsx` pour servir à la fois au contrôle global et aux futurs contrôles individuels par POV.
- Le composant `VolumeControl` porte sa largeur via `--app-volume-control-width` sur sa racine ; le `range` interne reste en `width: 100%` pour garder un réglage simple par contexte.
- Les POV Multi-Twitch disposent maintenant aussi d'un `VolumeControl` individuel dans leur en-tête.
- La barre de contrôle au-dessus du stage a été retirée ; le pilotage audio global vit désormais en bas du panneau gauche.
- La zone audio du panneau gauche est découpée en sous-composants dédiés et contient :
  - un `Master volume`
  - un bouton `Mute all` / `Unmute all`
  - une liste radio des POV sélectionnées pour désigner la POV master à écouter
- La zone audio expose aussi une info-bulle d'aide dédiée au fonctionnement du mix audio.
- Le contrôle audio global applique le mix principal sur les POV sélectionnées :
  - POV master au volume `Master volume`
  - autres POV à `1%`
- Le bouton `Mute all` coupe toutes les POV sélectionnées et `Unmute all` restaure les volumes exacts mémorisés juste avant la coupure.
- La section `MultiTwitch` est maintenant découpée par responsabilités avec SCSS locaux par zone :
  - shell partagé pour les panneaux
  - roster séparé
  - stage/POV séparé
  - chat séparé
  - les sous-composants dédiés doivent porter leur propre style local, `MultiTwitch.scss` ne gardant que le placement global
- Un mode de test temporaire ajoute des chaînes Twitch mockées à la détection live via un flag dans `src/components/sections/MultiTwitch/MultiTwitch.jsx` et `supabase/functions/refresh-multi-twitch-live/index.ts`.
- Si ce mode de test n'est plus utile, il faut retirer le flag et la liste de chaînes dans les deux fichiers en même temps.
- Le modèle cible le plus simple est :
  - colonne gauche : sélection des chaînes actives
  - centre : embeds vidéo Twitch officiels
  - droite : un seul chat Twitch officiel, commutable entre les POV affichées
- Le tchat Multi-Twitch doit rester basé sur l'embed officiel Twitch par iframe, pas sur un tchat custom.
- Les chaînes Twitch de test Multi-Twitch restent surveillées par l'Edge Function, mais leur affichage frontend est désormais piloté par la permission utilisateur `multi_twitch.test_channels.view`.
- Cette permission est exposée dans l'admin comme les autres capacités et constitue l'unique exception modifiable sur un profil super-admin.
- Le thème du tchat Multi-Twitch est piloté côté frontend (`light` / `dark`) avec fallback initial sur `prefers-color-scheme`, puis persistance dans `localStorage`.
- Le thème sombre du tchat Twitch repose sur le paramètre d'iframe `darkpopout`.
- Le nombre de POV Multi-Twitch autorisées à l'écran dépend de la largeur viewport via des seuils simplifiés :
  - `< 560px` : `1 POV`
  - `< 769px` : `2 POV`
  - `< 1024px` : `4 POV`
  - `>= 1024px` : `6 POV`
- En cas de réduction de largeur, les POV excédentaires restent sélectionnées en mémoire mais seules les POV autorisées sont affichées ; un message discret indique le nombre de POV masquées.
- Les POV du stage utilisent un cadre interne gardant un ratio vidéo `4:3`; la barre de titre reste hors ratio et s'ajoute au-dessus.
- L'ordre des POV sélectionnées est réordonnable directement dans le stage par drag-and-drop HTML5 ; cet ordre reste la source de vérité partagée pour la grille, la liste radio audio et le carrousel de tchat.
- Les embeds vidéo Twitch doivent conserver un identifiant de montage stable basé sur `entry.id`.
- La grille de POV doit conserver un ordre DOM stable pendant le drag-and-drop et ne faire varier que l'ordre visuel (`order`) afin d'éviter le rechargement du player déplacé.
- La synchronisation audio des players Twitch est pilotée par prop (`volumePercent`) et doit être rejouée sur l'événement `READY` du player pour éviter les POV visuellement non rechargées mais audio encore mutées au retour ou après réordonnancement.
- Éviter par défaut la construction d'un chat custom multi-chaînes, plus coûteux en auth, modération et maintenance.
- La route `/multi-twitch` pointe de nouveau vers le module `MultiTwitch`; le wrapper `MultiTwitchWip` reste disponible si un masquage temporaire doit être réactivé plus tard.

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
- Stratégie Git planifiée après la mise en prod de `Multi-Twitch` :
  - `main` doit redevenir la branche déployable propre
  - les futures grosses features se feront sur branche dédiée
  - les micro-corrections prod se feront depuis `main` ou une branche courte dédiée, puis seront reportées vers la branche feature si nécessaire
- Tant que `Multi-Twitch` n'est pas livré en prod, on continue exceptionnellement sur l'état courant sans introduire de branche Git supplémentaire.
