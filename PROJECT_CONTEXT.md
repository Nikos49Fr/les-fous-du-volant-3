# PROJECT_CONTEXT

## Role

Memoire de travail du projet pour garder les decisions, contraintes et priorites entre conversations.

## Etat actuel

- Design principal en place.
- Header, Home et Calendar implementes.
- Auth Twitch fonctionnelle en local et en production.
- Firestore connecte.
- Calendar est la premiere section migree vers stockage persistant.
- Registre `users/{twitchId}` alimente automatiquement lors du callback Twitch.

## Choix techniques verrouilles

- Hebergement: Netlify.
- Base de donnees: Firebase Firestore.
- Auth: Twitch OAuth via Netlify Functions.
- Region ciblee: Europe/France.
- Dev local complet: `netlify dev` (pas `npm run dev` seul).

## Direction architecture

- Firestore est la couche de persistance de tout le projet dynamique (pas uniquement Calendar).
- Calendar est un bootstrap technique pour les futures sections (resultats, sanctions, predictions, etc.).
- Pas de fallback statique local pour les donnees dynamiques venant de la BDD.

## Permissions - vision validee

- Modele par capacites (capability-based), evolutif.
- Les capacites sont ajoutees au fur et a mesure des sections.
- Capacite initiale validee pour Calendar: `calendar.write`.
- Capacite d'administration permissions fixee: `admin.permissions.manage`.

### Garde-fou critique

- Le super-admin a les permissions totales par defaut.
- Les permissions du super-admin ne sont modifiables via aucune interface du site.
- Protection obligatoire cote serveur (pas seulement cote UI).
- Source super-admin technique: `SUPER_ADMIN_TWITCH_ID` (env var serveur).

## Registre utilisateurs (auth)

- Le site enregistre les utilisateurs authentifies au premier login.
- Donnees visees: `twitchId`, `login`, `displayName`, `profileImageUrl`, `firstLoginAt`, `lastLoginAt`.
- Attribution des droits manuelle via panel admin.
- Stockage de `profileImageUrl` en BDD accepte (cout faible, panel plus simple).

## Schema Firestore permissions valide

1. `users/{twitchId}`
- `twitchId`
- `login`
- `displayName`
- `profileImageUrl`
- `firstLoginAt`
- `lastLoginAt`
- `isSuperAdmin` (true uniquement pour le compte super-admin)

2. `users/{twitchId}/capabilities/{capabilityId}`
- doc id = capacite (`calendar.write`, `results.write`, etc.)
- `enabled`
- `createdAt`
- `createdBy` (twitchId admin)
- `updatedAt`
- `updatedBy` (twitchId admin)

Notes:
- Pas de collection d'audit separee pour le moment.
- Audit minimal = derniere modification stockee dans le document de capacite.

## Ecart actuel a corriger

- L'ecriture Calendar est encore controlee par whitelist login admin simple.
- Ce modele est transitoire et doit evoluer vers verification de capacites reutilisable.

## Module Calendar actuel (prod)

- Document Firestore: `calendar/season3`.
- Champ principal: `revealed` (12 entiers `0..24`).
  - index = slot GP saison (1..12 cote UI)
  - valeur = id circuit (`0` = non revele)
- Metadonnees stockees:
  - `updatedAt`
  - `updatedBy.login`
  - `updatedBy.twitchId`

## API en place

- `GET /api/calendar/revealed` -> retourne `revealed` + signal d'edition
- `POST /api/calendar/revealed` -> endpoint protege + validation payload
- `GET /api/admin/permissions` -> liste users + capacites (super-admin uniquement)
- `POST /api/admin/permissions` -> attribue/retire une capacite (super-admin uniquement)

## Couche auth serveur partagee

- Helpers centralises dans `netlify/functions/_twitch-auth.js`.
- Verification de capacites disponible via `hasCapability(twitchId, capabilityId)`.
- Helper event-level disponible via `canCurrentUser(event, capabilityId)`.
- Regle super-admin appliquee dans cette couche (`isSuperAdmin === true` -> acces autorise).
- Calendar API migree sur verification de capacite `calendar.write` (plus de check whitelist login).
- `ADMIN_TWITCH_LOGINS` n'est plus utilise.

## Plan de refonte permissions (valide)

1. [Fait] Ajouter registre utilisateurs alimente automatiquement a la connexion.
2. [Fait] Implementer couche serveur partagee de verification de capacites.
3. [Fait] Implementer garde-fou super-admin non modifiable via interface (couche serveur).
4. [Fait] Migrer Calendar de whitelist admin vers `calendar.write`.
5. [Fait] Ajouter endpoints admin pour lister utilisateurs et attribuer/retirer des capacites.
6. [Fait] Construire section/panel admin de gestion des droits.

## Panel admin permissions

- Route frontend: `/admin/permissions`.
- Interface disponible uniquement pour usage super-admin (lien "Admin" visible en footer une fois connecte).
- L'UI permet:
  - lister les utilisateurs enregistres (`users`)
  - afficher les capacites existantes
  - ajouter une colonne de capacite (id custom)
  - activer/desactiver une capacite par utilisateur via case a cocher
- Le backend reste source de verite (protection super-admin et validation).

## Priorites produit

1. Systeme resultats/classements (modele + saisie + affichage).
2. Refonte permissions feature-level (pre-requis pour extension propre).
3. Sections secondaires (Multi-Twitch, Circuits, Reglages, Pilotes).

## Resultats GP - besoins confirmes

- 12 GP, chacun sprint + course.
- Classement pilotes + classement ecuries.
- Statuts: DNF, ABS, DSQ, bug/deconnexion.
- Baremes custom (sprint/course) + meilleur tour (+1, sans contrainte top 10).
- Sanctions post-course: retrait points, declassement, penalite temps, disqualification.
- Saisie manuelle securisee.

## Resultats GP - a confirmer

- Niveau de detail temps/ecarts stockes.
- Integration qualifs/grille de depart.
- Strategie de calcul:
  - calcul a la lecture depuis donnees brutes, ou
  - pre-calcul au write et stockage agrege.

## Hypotheses de charge (hautes)

- ~200 utilisateurs.
- ~20 visites/mois/utilisateur.
- Ecritures faibles (cycle GP + ajustements ponctuels).

## Regles de collaboration

- Un sujet a la fois sauf dependance technique explicite.
- Si dependance: detailler impacts avant implementation.
- Ne pas faire de changements structurels hors scope demande.
- Tous les textes UI affiches en francais doivent garder les accents corrects (pas de version sans accents).
