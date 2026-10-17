# REVIEW RESULT: PASS — hero participant V2

Revue du 17 octobre 2026 — Chromium/Chrome local via Playwright, DPR 1. Captures à 1440 × 900, 820 × 1180 et 390 × 844, polices chargées et animations d’entrée terminées. Données des tournois distants bloquées et date figée pour comparer les pages. Les captures avant/après se trouvent dans `before/` et `after/`.

## Pre-flight compliance

PASS. Les trois auteurs ont fourni leurs **Current State Summary** et **Verified safety greps**. HTML : header, titre, cartes et consommateurs JS ; CSS : sélecteurs du hero, tokens, shared title et consommateurs ; JS : header, gate du carousel, anciens writers de lift et variables CSS. Lecture préalable architecture, trois fichiers et mémoires confirmée par les auteurs. Le reviewer a lu les fichiers actuels, architecture, dossier de passation, maquettes et quatre cibles.

## Critères SPEC §10

| # | Critère | Résultat et preuve |
|---|---|---|
| 1 | Cibles 1440 / 820 / 390 | PASS avec décisions founder : split desktop, pile tablette, mobile centré, téléphone recadré et cartes. Suppression sous-titre/réassurance et header fixe partagé autorisés. La cible tablette couvre une hauteur plus grande que la capture demandée. Le widget QR préexistant est conservé. Comparaison visuelle, sans prétendre à une identité pixel avec les maquettes. |
| 2 | Aucun scroll horizontal 320–1920 | PASS : toutes les 1601 largeurs entières testées ; scrollWidth de la racine égal au viewport, scrollX reste 0 après scrollTo(100,0). La largeur interne du body inclut les sentinelles du carousel, correctement coupées par overflow:clip. |
| 3 | H1 exact | PASS : un seul H1, texte normalisé « Ton prochain tournoi t’attend » ; aucun ID dupliqué. |
| 4 | Contraste ≥ 4,5 | PASS : fond photographique mesuré sans glyphes, composition alpha et ratio WCAG sur les rectangles de texte. Google Play après correction blanc opaque : minima 9,38 desktop / 14,48 tablette / 5,87 mobile 390 / 5,78 mobile 320. Autres textes HTML : minima précédemment mesurés ≥ 5,98 ; paragraphes ≥ 7,52. Cartes décoratives : texte sombre/lime ou blanc sur surface sombre 78 %, borne conservatrice > 4,5. Détails finaux evidence/final-checks.json. |
| 5 | Cibles 44 / clavier / focus | PASS : largeur FAQ corrigée et mesurée 44 px, tous les liens visibles du hero ≥ 44 × 44. Tab : skip-link, logo, navigation, organisateur puis stores ; focus lime visible. Mobile : logo/organisateur 44 px, stores 50 px. |
| 6 | Reduced motion | PASS : aucune animation calculée dans le hero sous reduce, transitions neutralisées. Swipe et snap restent utilisables. |
| 7 | Tokens | PASS pour le changement : couleurs, tailles de police et rayons nouveaux dans :root, sections 7.x, pas de style inline ajouté. Les !important ajoutés servent uniquement à neutraliser le mouvement demandé. Les exceptions legacy hors périmètre ne sont pas introduites ici. |
| 8 | 404 / organisateur | PASS visuel : 404 identique pixel aux 3 tailles. Organisateur : différences moyennes absolues par canal 0,0267 / 0,0088 / 0,0054 sur 255, maximum 1 / 1 / 4 ; variations de rendu sous-pixel, aucune différence de structure. Sources de ces pages inchangées. |
| 9 | Carousel | PASS swipe/snap et gate D1 immédiat : geste tactile synthétique fait passer 1 → 2, centre 194,9998 px pour viewport 390 px ; même résultat reduced motion. Boutons et navigation clavier du carousel : N/A, absents avant cette refonte ; aucun contrôle existant supprimé. |
| 10 | Build / tests | PASS : npm run build:css et npm test, 15 tests réussis. Les tests npm concernent notamment les liens et tournois ; l’UI du hero est couverte par les vérifications Playwright ci-dessus. |
| 11 | LCP / dimensions | PASS local : photo reste préchargée et LCP ; téléphone possède width="1206" / height="2450". Médianes avant → après (3 essais/contextes frais) : desktop 208 → 196 ms, tablette 208 → 208 ms, mobile 212 → 188 ms. CLS médian 0 ; un essai tablette 0,00028. Aucun shift attribué au téléphone. Mesure locale sans ralentissement réseau/CPU, pas une garantie des performances de production. Données brutes evidence/lcp.json. |
| 12 | Architecture | PASS : structure, tokens, durées, z-index, header fixe, D1 et décisions founder documentés. Ancien lift explicitement historique. |

## Vérifications supplémentaires

L’ancre FAQ reste sous le header : top 99,5 px contre bottom 76 px à 820 px. Le header à 768 px contient tous ses liens sans collision. Les images conservent alt français, dimensions et draggable=false ; cartes décoratives aria-hidden. Meta, liens stores et preloads préservés. Aucun appel réseau ou dépendance ajouté. Les blocs JS nouveaux restent dans l’IIFE, null-checkés, scroll passif et écritures coalescées par requestAnimationFrame ; garde organisateur préservée.

## Limites et éléments préexistants

Les tests sont Chromium locaux, pas une campagne multi-navigateurs/appareils. Les trois captures vérifient les états de repos ; le header au scroll est également inspecté. Le carousel existant ne fournit pas de boutons ni de commandes clavier dédiées, et son live-follow tactile ne borne pas le delta à une slide : ces limites préexistantes n’ont pas été introduites ni modifiées. Le widget QR existant n’est pas dans les maquettes. Les couleurs propres au contenu des screenshots de téléphone ne sont pas du texte HTML à recolorer.

## Critical Issues (must fix)

Aucun problème bloquant restant. Les trois défauts trouvés pendant la revue (ancre masquée, FAQ trop étroite, contraste Google Play 320) sont corrigés et recontrôlés. Aucun critère applicable en échec ; adaptations autorisées et N/A préexistants explicités ci-dessus.

## Minor Issues (non-blocking)

Limites préexistantes du carousel indiquées plus haut ; aucune nouvelle anomalie constatée. Aucun pageerror aux quatre tailles finales.

## Architecture doc drift

OK — documentation synchronisée, y compris marges des ancres, cible 44 et contraste des stores.

## Summary Table

| Check | Status |
|---|---|
| Pre-flight compliance | PASS |
| HTML structure | PASS |
| CSS / design tokens | PASS |
| JavaScript | PASS |
| Accessibility | PASS dans le périmètre modifié ; limites préexistantes décrites |
| SEO / metadata | PASS |
| Copy and language | PASS, avec suppressions autorisées |
| Architecture doc sync | PASS |
