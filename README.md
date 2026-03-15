# Les Fous du Volant - Saison 3

Frontend React pour le site de la saison 3 des Fous du Volant, avec authentification Twitch et données persistées via Supabase.

## Statut

- Stack applicative actuelle : React + Vite + Supabase
- Déploiement cible : Cloudflare Pages
- Projet Cloudflare Pages créé : `les-fous-du-volant-3`

## Stack technique

- React 19
- Vite
- React Router 7
- Sass (SCSS)
- Supabase Auth (Twitch)
- Supabase Postgres
- Cloudflare Pages
- flag-icons

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
- Gestion des permissions métier via Supabase (`profiles`, `capabilities`, `user_capabilities`)
- Le super-admin est défini en base et non par le frontend

## Base de données

Le schéma SQL initial de migration se trouve dans :

- `supabase/sql/001_initial_schema.sql`

Les données actuellement branchées sur Supabase sont :

- profils utilisateurs
- permissions / capacités
- calendrier des circuits révélés
- pilotes
- écuries

## Déploiement Cloudflare

### Première utilisation de Wrangler

Se connecter une fois à Cloudflare :

```bash
npx wrangler login
```

### Déploiement production

```bash
npm run deploy:cloudflare
```

Cette commande :

1. lance le build Vite
2. déploie le dossier `dist` sur le projet Pages `les-fous-du-volant-3`

### Déploiement preview

```bash
npm run deploy:cloudflare:preview
```

## Routes internes

- `/calendar`
- `/admin/permissions`

## Structure du projet

- `src/components/sections` : sections/pages
- `src/components/ui` : composants réutilisables
- `src/data` : données frontend statiques
- `src/utils` : clients et helpers applicatifs
- `supabase/sql` : scripts SQL de structure et de migration

## Sécurité

- Ne jamais commiter de secrets, tokens ou clés privées
- Les droits d'écriture doivent être protégés côté Supabase par les policies et les capacités métier

## Variables Cloudflare Pages

Variables frontend à configurer côté Cloudflare :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
