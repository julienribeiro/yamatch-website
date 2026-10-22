# Calendrier V3 et page tournoi — validation

22/10/2026 · branche `claude/beautiful-meitner-4wzp5k` · **draft, non déployé**.

Implémentation et vérifications techniques terminées : **25/25 tests, build CSS et build complet réussis**. Revue indépendante finale **PASS le 22/10/2026**, sur les sept catégories du reviewer, après correction du contraste et du retour à la ligne des villes longues. La réserve D3 reste documentée : le statut complet et les compteurs de la page tournoi nécessitent un lot backend séparé. Livraison en PR draft, sans déploiement.

## Limite D3

La page lit uniquement des colonnes publiques de `tournaments`. Elle ne connaît ni le nombre d’inscrits, ni les places restantes, ni le podium. Elle affiche « Jusqu’à N équipes » sans jauge. `is_closed` signifie clôture manuelle du tournoi, jamais « Complet ». L’état complet de la maquette ne peut donc pas être reproduit avec ce contrat anonyme ; une RPC publique dédiée relève d’un lot backend séparé. Le calendrier dispose, lui, des compteurs fournis par `get_public_showcase`.

Les 14 colonnes ajoutées ont été vérifiées individuellement HTTP 200 en anonyme sur la PROD, id publié `cf5faa8c-117a-4b9a-a3f9-522045d7e578` (preuve renouvelée en lecture seule : [14 réponses HTTP 200, une ligne chacune](after/public-columns-anonymous-qa.json), sans valeurs enregistrées). Aucune colonne contact/GPS ni donnée de participant n’est sélectionnée. La clôture est documentée dans le dépôt app par `supabase/migrations/20260522220000_enrich_tournaments_full_schema.sql:108–111` (« organizer explicitly closed the tournament early ») ; `lib/models/tournament.dart:637` définit séparément `bool isFull(int registered) => registered >= maxTeams`. Ces deux sources ont été relues pendant la validation.

## Matrice SPEC §9

« Vérifié » décrit les preuves techniques obtenues ; la revue indépendante finale est PASS dans le périmètre frontend, avec réserve D3 explicite au critère 10.

| # | Critère | Résultat et preuve |
|---|---|---|
| 1 | Démo conforme 1440/820/390 | Rendus produits et inspectés par spécialiste CSS : [1440](after/home-1440-initial.png), [820](after/home-820-initial.png), [390](after/home-390-initial.png). Comparaison indépendante aux références validée |
| 2 | Sans cadre/fond/terrain/ticker | Vérifié dans DOM/CSS et captures : section transparente, aucun SVG terrain ni ticker participant |
| 3 | Styles mois, position initiale, accès passé | Vérifié : [géométrie](after/calendar-layout-qa.json), [passé desktop](after/home-1440-past.png), [mobile](after/home-390-past.png), tests calendrier ; initial currentLeft = railLeft + padding |
| 4 | Billets joués blancs, équipes/Terminé | Vérifié par captures passé et test calendrier « classement vient des listes » ; zéro équipe omis |
| 5 | CTA unique, route, palette | Vérifié par tests calendrier : 9 joués + 6 à venir, H4, un CTA, plein/clos secondaires et démo inerte ; plus de rond à chevron généré, plus création préservé |
| 6 | Repère Aujourd’hui | Vérifié par tests et [scénarios](after/calendar-scenarios-qa.json), Europe/Paris, entre listes jouées/à venir ; absent si aucun mois courant |
| 7 | Mois vides et création finale | Vérifié sur quatre scénarios à 1440/390 : sans joués, sans à venir, mois vides, passage d’année ; `creationLast:true` partout, [fin du rail](after/home-1440-end.png) |
| 8 | Masquage vide, RPC/cache/démo | Tests calendrier PASS pour vide/invalide/exception, nettoyage et démo ; transport/RPC/cache inchangés à la comparaison source |
| 9 | Organisateur identique | [Avant](before/organisateur-1440-section.png) / [après](after/organisateur-1440-section.png) : sections 1440/390 et full 1440 identiques selon comparaison SHA du spécialiste ; full 390 même hauteur 4181 px, seulement 10 pixels à ±1/255 |
| 10 | Page à venir/complet/joué, erreurs et deep link | **Vérifié avec réserve D3 : complet non observable.** [À venir](after/page-tournoi-a-venir-1440.png), [joué](after/page-tournoi-termine-1440.png), [capacité inconnue](after/page-tournoi-complet-capacite-inconnue-390.png), [annulé](after/page-tournoi-annule-390.png). 9 tests page PASS ; [16 mesures/captures](after/page-tournament-qa.json) couvrent aussi clos, invalide, introuvable et erreur. `joinTournament` identique à HEAD selon spécialiste |
| 11 | Aucune donnée contact/GPS | Select explicite contrôlé, test détails publics PASS ; aucun champ contact/GPS/participant. [Lecture anonyme des 14 ajouts HTTP 200](after/public-columns-anonymous-qa.json), sans conservation des valeurs |
| 12 | Aucun débordement page 320–1920 | Vérifié dans [scénarios](after/calendar-scenarios-qa.json) aux largeurs 320/360/390/768/820/1024/1440/1920 ; `scrollWidth` égale largeur. Page tournoi 1440/390 vérifiée séparément et [textes longs à 320/820/1024/1920](after/page-tournament-long-text-qa.json), y compris ville sans espaces : aucun débordement ni contenu rogné après contrainte et retour à la ligne de `.td-meta` |
| 13 | Hiérarchie/focus/contraste/cibles/mouvement réduit | H4 sous H3/H2, H1 page unique, cibles page 44/60 px et aucun overflow dans [QA page](after/page-tournament-qa.json). Focus rail 3 px et flèche clavier 610→650 vérifiés par CSS ; captures en mouvement réduit. **Revue finale PASS** : contour des mois passés porté à .55 (token dédié), séparateurs décoratifs conservés à .22 ; libellé organisateur assombri avec `--tp-intro-ink`. Captures calendrier/page régénérées après correctifs ; textes longs de ville contraints par `max-width:100%`, `min-width:0` et `overflow-wrap:anywhere` sur `.td-meta` |
| 14 | Tokens, build:css, tests, build | **Vérifié : 25/25 tests** (6 calendrier + 9 page + 10 existants), `npm run build:css` et `npm run build` PASS. Tokens nouveaux dans `:root` ; styles page sans CSS inline. Variable Android existante nécessaire au build, voir ci-dessous |
| 15 | Architecture synchronisée | [Contrats V3 documentés](../../../WEBSITE_ARCHITECTURE.md), contrats V2 historiques conservés ; vérification indépendante finale PASS |

## Reproduire la validation

```sh
npm test
npm run build:css
node -e 'const fs=require("node:fs"),cp=require("node:child_process");const policy=JSON.parse(fs.readFileSync("config/play-app-signing-sha256.json","utf8"));const run=cp.spawnSync("npm",["run","build"],{stdio:"inherit",env:{...process.env,PLAY_APP_SIGNING_SHA256:policy.sha256CertFingerprints[0]}});process.exit(run.status ?? 1)'
```

`PLAY_APP_SIGNING_SHA256` est l’empreinte publique de certificat déjà requise par la politique Android et injectée par la CI. L’échec sans cette variable est la garde préexistante, pas une régression V3. `assetlinks.json` reste identique ; `styles.min.css`, généré et ignoré par Git, ne doit pas être commité.

Les scénarios navigateur remplacent temporairement la réponse HTTP de `demoPayload` en mémoire, sans modifier `script.js` : les SHA avant/après identiques figurent dans [calendar-scenarios-qa.json](after/calendar-scenarios-qa.json). Les captures de référence et après utilisent une date contrôlée, Europe/Paris et mouvement réduit. Elles ne prouvent pas un déploiement.

## Captures pour revue

- Accueil desktop : [avant](before/home-1440-section.png), [après](after/home-1440-initial.png), [mois passés](after/home-1440-past.png).
- Accueil mobile : [avant](before/home-390-section.png), [après](after/home-390-initial.png).
- Page tournoi : [avant desktop](before/tournoi-1440-full.png), [après desktop](after/page-tournoi-a-venir-1440.png), [après mobile](after/page-tournoi-a-venir-390.png).
- Organisateur mobile : [avant](before/organisateur-390-section.png), [après](after/organisateur-390-section.png).

Écart d’intégration documenté : marge externe `--tp-calendar-next-section-gap:144px` (0 mobile) pour préserver la décoration FAQ sans modifier son contrôleur ni le padding interne du calendrier. Le contraste des mois passés et du libellé organisateur a été corrigé ; la revue finale est PASS et la réserve D3 reste explicitement documentée.
