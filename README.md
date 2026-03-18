# Les Fous du Volant - Saison 3

Frontend React du site de la saison 3 des Fous du Volant.

## Statut

- Stack actuelle : React + Vite + Supabase
- Hébergement actuel : Cloudflare Pages
- Projet Cloudflare Pages : `les-fous-du-volant-3`
- Auth Twitch via Supabase : en place
- Module `Résultats` : en place
- Saisie admin des résultats : en place
- Déploiement reproductible via `wrangler` local : en place

## Stack technique

- React 19
- Vite
- React Router 7
- Sass (SCSS)
- Supabase Auth (Twitch)
- Supabase Postgres
- Cloudflare Pages
- Wrangler

## Prérequis

- Node.js 20+
- npm
- Projet Supabase configuré avec le provider Twitch activé
- Projet Cloudflare Pages créé

## Installation

```bash
npm install
```

## Configuration locale

Créer un fichier `.env.local` à la racine :

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Ne jamais exposer de clé `secret` ou `service_role` côté frontend.

## Développement local

```bash
npm run dev
```

Le port local peut varier selon l'environnement Vite. L'URL locale utilisée doit être autorisée dans `Supabase > Authentication > URL Configuration`.

## Scripts npm

- `npm run dev` : serveur de développement Vite
- `npm run build` : build production
- `npm run preview` : prévisualisation locale du build
- `npm run lint` : lint ESLint
- `npm run deploy:cloudflare` : build local puis déploiement production sur Cloudflare Pages
- `npm run deploy:cloudflare:preview` : build local puis déploiement preview sur la branche `preview`

## Authentification

- Connexion utilisateur via Twitch OAuth, portée par Supabase Auth
- Synchronisation des profils dans `profiles`
- Gestion des permissions métier via Supabase
- Le super-admin est défini en base, pas côté frontend

## Base de données

Scripts SQL versionnés :

- `supabase/sql/001_initial_schema.sql`
- `supabase/sql/002_results_schema.sql`

Données actuellement branchées sur Supabase :

- profils utilisateurs
- permissions / capacités
- calendrier des circuits révélés
- pilotes
- écuries
- résultats GP

## Déploiement Cloudflare

### Première utilisation de Wrangler

```bash
npx wrangler login
```

### Déploiement production

```bash
npm run deploy:cloudflare
```

### Déploiement preview

```bash
npm run deploy:cloudflare:preview
```

Le projet utilise `wrangler` installé localement dans les dépendances de développement, pour éviter les téléchargements implicites au moment du déploiement.

## Routes internes principales

- `/drivers`
- `/calendar`
- `/circuits`
- `/results`
- `/multi-twitch`
- `/lobby-setup`
- `/admin/permissions`
- `/contact`
- `/credits`

## Structure du projet

- `src/components/sections` : sections/pages
- `src/components/ui` : composants UI réutilisables
- `src/data` : données frontend statiques
- `src/utils` : clients API, helpers, résolution d'assets
- `src/assets` : images, icônes, drapeaux locaux, médias
- `supabase/sql` : scripts SQL de structure et de migration

## Décisions techniques importantes

- Le shell applicatif reste chargé immédiatement, les pages sont lazy-loadées par route.
- Les drapeaux ne dépendent plus de `flag-icons` : ils sont stockés localement dans `src/assets/images/flags`.
- Le module `Résultats` a été découpé par responsabilités : vues, tableaux partagés, cellules, onglets, admin.
- Les styles doivent rester hors JSX ; seules les classes et la structure restent dans les composants.
- Les media queries servent aux changements de layout ; tailles, espacements et typographies doivent privilégier `clamp(...)`.

## Variables Cloudflare Pages

Variables frontend à configurer côté Cloudflare :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Sécurité

- Ne jamais commiter de secrets, tokens ou clés privées
- Les droits d'écriture doivent être protégés côté Supabase par les policies et les capacités métier

## Qualité UI

- Tous les textes affichés dans l'interface doivent conserver les accents français corrects et un encodage UTF-8 propre.
- Cette règle vaut aussi pour les boutons, titres, labels, messages, info-bulles, `aria-label` et `alt`.
