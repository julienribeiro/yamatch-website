# REVIEW RESULT: PASS — hero participant avec écran codé

Revue du 17 octobre 2026, baseline `72d397c`. Ce rapport remplace le verdict historique limité à la SPEC initiale : la SPEC actuelle du hero, incluant son §5 bis et son critère 11, est désormais couverte. La section « Comment ça marche » n’est pas encore modifiée dans cette phase.

## Pre-flight compliance

PASS. Rapports **Current State Summary** et **Verified safety greps** reçus pour HTML, styles du hero, stylesheet des écrans et correction des SVG sources. Les auteurs ont vérifié leurs consommateurs, l’absence de dépendance JS au type de `.hero-phone`, les 48 classes entrantes et les 16 SVG décoratifs. Les rapports docs et l’audit JS sans changement sont également reçus. Lectures reviewer : architecture, fichiers modifiés, sources discovery, passations et visuels actuels.

## Critères SPEC §10

| # | Critère | Résultat et preuve |
|---|---|---|
| 1 | Rendu 1440 / 820 / 390 | PASS : captures `coded-after/home-*.png`, comparées aux cibles actuelles. Écran codé, composition et proportions conformes. Écarts autorisés : header fixe partagé, sous-titre et réassurance supprimés ; QR préexistant conservé. Le clipping arrondi du téléphone et de son ombre a été renforcé après découverte d’un débordement aux coins mobiles. |
| 2 | Aucun scroll horizontal | PASS : chacune des 1601 largeurs entières de 320 à 1920 testée ; racine sans débordement, scrollX reste 0 après tentative de défilement horizontal. |
| 3 | H1 exact | PASS : « Ton prochain tournoi t’attend », inchangé, unique. |
| 4 | Contraste | PASS pour les textes et commandes du hero : couleurs, fonds et positions du bloc texte inchangés depuis les mesures du premier audit (Google Play minimum 5,78:1 à 320 px, paragraphes ≥ 7,52:1). Le téléphone est une illustration fidèle au fragment source, masquée aux technologies d’assistance ; ses textes internes reproduisent l’écran de référence et ne sont pas des commandes de la page. |
| 5 | Cibles / clavier / focus | PASS : nav et logo ≥ 44 × 44 px, stores 56 px desktop/tablette et 50 px mobile. Ordre et focus lime préservés. Aucun élément interactif dans le téléphone ; son rôle n’ajoute aucune étape de tabulation. |
| 6 | Reduced motion | PASS : zéro animation calculée dans le hero sous reduce ; les nouvelles classes n’introduisent aucune animation autonome. |
| 7 | Tokens | PASS : couleurs, polices, tailles et rayons du nouveau fichier via tokens `--ym-*` ; aucune couleur brute hors `:root`. Tous les tokens consommés sont définis. Nouvelles échelles du hero en tokens `:root`, styles scoped en §7.7. Les exceptions historiques du CSS partagé ne sont pas introduites ici. |
| 8 | 404 / organisateur | PASS : 404 identique pixel aux trois tailles. Organisateur identique visuellement ; différence moyenne par canal ≤ 0,027 sur 255, maximum 4 sur 255. Sources de ces pages inchangées ; stylesheet des écrans chargé uniquement par l’accueil. |
| 9 | Carrousel | PASS : D1 normal et gate prêt conservés, swipe synthétique 1 → 2 et snap au centre 194,9998 px pour viewport 390 px, y compris reduced motion. Boutons dédiés et commandes clavier : N/A préexistants, aucun contrôle supprimé. |
| 10 | Build / tests | PASS : `npm run build:css`, `npm test` (15 tests) et `git diff --check`. Le nouveau fichier est servi directement, hors minification, conformément à la SPEC. |
| 11 | Écran codé / LCP / CLS | PASS pour l’intégration : zéro image de capture dans `.hero-phone`, fragment discovery exact, slot réservé à environ 360 × 754,812 px desktop/tablette et 230 × 482,25 px mobile, cadre logique 414 × 868. Photo toujours préchargée et LCP. Sur trois essais locaux par taille : médianes avant → après 196 → 184 ms, 200 → 208 ms, 184 → 200 ms ; CLS nul sur les 18 essais. Variations ≤ une frame, sans dégradation matérielle établie ; ce test local ne garantit pas les performances de production. Données `evidence/coded-lcp.json`. |
| 12 | Architecture | PASS : DOM codé, source exacte, accessibilité, slot, échelles, fichier CSS hors build et historique documentés. |

## Renderer et isolation

Le fragment discovery intégré est identique à sa source après ajout mécanique des attributs décoratifs sur les 16 SVG. La feuille charge uniquement les tokens, le cadre et discovery. Les chemins de polices sont locaux. La comparaison de l’écran isolé avec sa preview confirme la même composition et la même typographie ; le paragraphe organisateur reste blanc, 14 px / 20 px. Différence raster moyenne 0,24 par canal sur 255, principalement arrière-plan autour des coins arrondis et rendu sous-pixel ; aucune dérive de disposition observée.

Arbre accessible Playwright du téléphone : une seule image nommée « Aperçu de l’app Yamatch — accueil de découverte des tournois ». Aucun lien, bouton, input ou tabindex dans ses descendants. Aucun pageerror aux trois tailles.

How et FAQ restent inchangés pendant cette phase. Captures de section `coded-before/` et `coded-after/` : géométrie identique ; faibles différences ponctuelles liées au parallax/rotor animé. Leurs fichiers et leur logique n’ont pas été modifiés. Les captures précédentes `before/` et `after/` restent historiques ; les dossiers `coded-*` constituent la comparaison pertinente pour cette phase.

## Critical Issues

Aucun problème bloquant restant. Le débordement de l’ombre aux coins mobiles a été corrigé par un clip arrondi limité à la carte photo, sans modifier les autres pages.

## Minor Issues / limites

Aucune nouvelle anomalie constatée. Validation Chromium locale, gestes synthétiques et inspection visuelle ; aucune campagne physique multi-appareils. Les boutons et commandes clavier dédiés du carousel restent absents comme auparavant. La SPEC conserve certains textes retirés sur demande utilisateur : ces suppressions restent des adaptations autorisées.

## Architecture doc drift

OK. Documentation synchronisée ; aucune dérive bloquante.

## Summary Table

| Check | Status |
|---|---|
| Pre-flight compliance | PASS |
| HTML structure | PASS |
| CSS / design tokens | PASS |
| JavaScript | PASS — aucun changement nécessaire |
| Accessibility | PASS dans le périmètre modifié |
| SEO / metadata | PASS — préservés |
| Copy and language | PASS — fragment source fidèle |
| Architecture doc sync | PASS |
