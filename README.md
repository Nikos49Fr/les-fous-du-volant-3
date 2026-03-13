# Les Fous du Volant - Saison 3

Frontend React (Vite) avec backend serverless Netlify Functions, authentification Twitch et donnees Firebase Firestore.

## Stack technique

- React 19 + Vite
- React Router 7
- Sass (SCSS)
- Netlify Functions
- Twitch OAuth
- Firebase Firestore
- flag-icons

## Prerequis

- Node.js 20+
- npm
- Netlify CLI (`npm i -g netlify-cli`)
- Certificats HTTPS locaux (mkcert) pour OAuth Twitch en local

## Installation

```bash
npm install
```

## Configuration

Variables d'environnement requises (Netlify + local via `netlify dev`) :

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SUPER_ADMIN_TWITCH_ID`

## Demarrage development

Commande de dev a utiliser pour ce projet :

```bash
netlify dev
```

Pourquoi : ce mode lance le frontend + les fonctions `/api/*` + les cookies/session auth + le callback Twitch local HTTPS (`https://localhost:8888`).

## Scripts npm

- `npm run build` : build production
- `npm run preview` : preview local du build
- `npm run lint` : lint ESLint
- `npm run dev` : Vite seul (sans auth/API), reserve au debug UI ponctuel

## Endpoints API (Netlify Functions)

Auth Twitch :
- `GET /api/auth/twitch/login`
- `GET /api/auth/twitch/callback`
- `GET /api/auth/twitch/me`
- `POST /api/auth/twitch/logout`

Calendar :
- `GET /api/calendar/revealed`
- `POST /api/calendar/revealed` (admin uniquement)

Admin permissions :
- `GET /api/admin/permissions` (super-admin uniquement)
- `POST /api/admin/permissions` (super-admin uniquement)

## Route interne

- Panel permissions : `/admin/permissions` (super-admin)

## Structure projet

- `src/components/sections` : pages/sections
- `src/components/ui` : composants reutilisables
- `src/data` : donnees frontend
- `src/utils` : helpers + clients API
- `netlify/functions` : endpoints serverless

## Conventions de code

- 1 composant par dossier (`Component.jsx` + `Component.scss`)
- import du style local en premier
- composants en PascalCase
- classes CSS type BEM

## Securite

- Ne jamais commiter de secrets, tokens, ni cles de service account.
- Les permissions d'ecriture API sont controlees cote serveur (Twitch login + whitelist admin).

## Deploiement

- Plateforme : Netlify
