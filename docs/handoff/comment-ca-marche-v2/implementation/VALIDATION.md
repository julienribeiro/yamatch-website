# REVIEW RESULT: PASS — Comment ça marche V2

Revue du 17 octobre 2026, baseline de code `8c4fffa` (hero déjà validé). Le hero a obtenu son verdict PASS avant cette phase. La section HOW suit la SPEC actuelle avec E1 confirmé (cartes intégrées, FAQ conservée) et E2 retiré (aucun bandeau final ni doublon de boutons stores).

## Pre-flight compliance

PASS. Les auteurs HTML, CSS, JS et stylesheet partagé ont fourni leurs **Current State Summary** et **Verified safety greps** : 130 classes HTML recherchées, contrats `.is-enhanced` / `.is-revealed` vérifiés des deux côtés, consommateurs des anciennes décorations contrôlés, 38/36/47 sélecteurs des trois écrans isolés. Les corrections de SVG dans les sources ne changent aucun autre octet. Le reviewer a relu les changements, sources, architecture et les trois cibles.

## Critères SPEC §10

| # | Critère | Verdict et preuve |
|---|---|---|
| 1 | Rendu 1440 / 820 / 390 | PASS : trois cartes sombre/lime/sombre, téléphones inclinés et recadrés, illustrations intégrées, en-tête et organiser conformes. Cartes de 640 px desktop/tablette, 560 px mobile. Bandeau absent selon E2. Nuance tablette : le token de titre prescrit `clamp(3rem,5.8vw,5.25rem)` donne 48 px à 820 px et une ligne, contrairement au 84 px sur deux lignes du JPG ; priorité au token explicite de la SPEC. Le badge animé de FAQ déborde légèrement dans la marge basse comme avant, sans masquer les cartes. |
| 2 | Trois écrans HTML/CSS | PASS : tournament, confirmation et ranking intégrés exactement depuis les fragments sources ; zéro image de capture ni élément interactif dans les téléphones. Comparaisons avec les previews à l’échelle logique : différences raster moyennes 0,061 / 0,081 / 0,034 par canal sur 255, sans dérive visuelle de disposition. Padding de tableau ranking restauré après identification du reset global. |
| 3 | Ancre / titres / ARIA | PASS : `#how-it-works`, `#howQuestTitle`, `aria-labelledby`, un H2 et trois H3 conservés ; descriptions des trois étapes inchangées. |
| 4 | Contraste | PASS pour les textes marketing : introduction 7,56:1 ; paragraphes sombres ≥ 9,62:1, lime ≥ 10,54:1 ; lien organisateur 17,75:1. Mesures aux largeurs 1440, 820, 390 et 320. Les écrans et cartes décoratifs reproduisent les illustrations validées et sont masqués aux technologies d’assistance. |
| 5 | Cibles / focus / tabulation | PASS : lien organisateur 294,7 × 52 px desktop/tablette, 234,8 × 44 px mobile ; focus clavier lime solide de 3 px. Seul lien interactif dans HOW. App Store et Google Play de fin de section : N/A, retirés explicitement avec E2. Aucun focus ajouté par les téléphones. |
| 6 | Lecture des illustrations | PASS : chaque téléphone expose une seule image avec l’aria-label exact de la SPEC ; descendants et cartes intégrées masqués. Les snapshots accessibles n’exposent ni les tables ni le faux paiement des écrans. |
| 7 | Mouvement / FAQ | PASS : apparition unique par IO, contenu visible sans JS, sans IO et sous reduced motion. Activation de reduce en cours de session révèle les trois cartes et neutralise le mouvement. FAQ : parallax mesuré de −13,44 à −0,50 px après scroll, accordion fonctionnel et `aria-expanded` synchronisé. Un seul wrapper parallax restant, celui de FAQ. |
| 8 | Tokens / isolation | PASS : nouvelles couleurs dans `:root`, styles des écrans via variables `--ym-*`, aucun token indéfini. Sources de polices locales. Les styles spécifiques de chaque écran restent préfixés ; le reset de tableau est limité à ranking. |
| 9 | Overflow | PASS : chacune des 1601 largeurs entières de 320 à 1920 vérifiée ; aucun défilement horizontal racine. À 320 px, le titre est ajusté à 40 px et le texte des cartes ne chevauche pas les téléphones. |
| 10 | Build / tests | PASS : `npm run build:css`, `npm test` (15 tests) et `git diff --check`. Les comportements UI sont vérifiés séparément par Playwright. |
| 11 | Architecture | PASS : cartes, DOM, quatre écrans partagés, tokens, IO, seuil 0,1, délais, échelles et FAQ seule propriétaire du parallax documentés. E1/E2 explicites. |

## Captures et méthode

- `before/how-{1440,820,390}.png` : section avant refonte.
- `after/how-{1440,820,390}.png` : section complète après défilement réel déclenchant les trois entrées. Pour éviter les artefacts d’assemblage de screenshot, le header fixe et le QR ont été masqués temporairement pendant cette capture uniquement ; aucun code de production modifié.
- `after/how-anchor-{1440,820,390}.png` : viewport réel à l’ancre, header et QR visibles.
- `after/hero-{1440,820,390}.png` : non-régression du hero. Mobile identique pixel ; desktop écart maximal 1/255 ; tablette 7/255, moyenne 0,035/255, correspondant au rendu sous-pixel.
- `evidence/` : mesures de contraste/overflow, snapshots accessibles, comportement et comparaison des écrans.

Chrome local via Playwright, DPR 1, polices chargées. Réseau des tournois publics bloqué pour stabiliser le contenu. Aucun pageerror aux quatre largeurs principales. La validation ne constitue pas une campagne physique multi-navigateurs.

## Critical Issues

Aucun problème bloquant restant. Le seul défaut renderer relevé, le padding de tableau ranking affecté par le reset global, est corrigé et recontrôlé.

## Minor Issues

Écart typographique tablette décrit au critère 1, conséquence du token prescrit. E2 retire volontairement le bandeau montré par les JPG. Aucun autre critère applicable en échec.

## Architecture doc drift

OK. Les anciennes descriptions sont explicitement historiques ; les comportements actifs sont synchronisés.

## Summary Table

| Check | Status |
|---|---|
| Pre-flight compliance | PASS |
| HTML structure | PASS |
| CSS / design tokens | PASS |
| JavaScript | PASS |
| Accessibility | PASS dans le périmètre modifié |
| SEO / metadata | PASS — préservés |
| Copy and language | PASS — textes source et décisions conservés |
| Architecture doc sync | PASS |
