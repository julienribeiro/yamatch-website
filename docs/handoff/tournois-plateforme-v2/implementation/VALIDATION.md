# Validation — tournois de la plateforme V2

Date : 18 octobre 2026. Verdict **PASS** sur le SPEC §9 et la correction de contraste approuvée pendant la revue. Référence avant : commit `b920f1a`.

## Préflight

**Current State Summary**

- La section participant conserve `#derniers-tournois`, son titre identifié, ses hooks de données et son état initial `hidden`.
- Le rendu participant utilise une grille de tickets et une carte de création statique ; le rendu organisateur conserve le rail historique.
- `appTicket()` limite les tournois à venir à cinq ; le bandeau contient au plus neuf tournois passés et leurs doubles décoratifs.
- La validation des données, la RPC, le cache de dix minutes et la fixture démo sont inchangés.
- Les règles CSS nouvelles sont limitées à la variante participant ; les couleurs et les nouvelles constantes visuelles sont dans `:root`.
- Le hero, HOW et leurs écrans codés restent hors de cette modification.

**Verified safety greps et preuves**

Les auteurs HTML, CSS et JS ont fourni leurs Current State Summary et Verified safety greps : hooks `data-showcase-*`, classes `tp-*`, consommateurs organisateur et absence de dépendances hors section contrôlés. Le doc-keeper a fourni les mêmes éléments. La revue a confirmé l'identité du HTML avant la section (hors commentaire de section), du constructeur historique `ticket()` et du bloc validation/chargement/démo : [static.json](evidence/static.json).

## Critères du SPEC §9

| # | Critère | Résultat et preuve |
|---|---|---|
| 1 | Rendu démo conforme à 1440, 820 et 390 px | **PASS** — comparaison visuelle aux trois JPG : terrain gris, titre surligné, grille 3/2/1, tickets et bandeau conformes. La fixture existante comporte trois tournois, contre deux dans les maquettes : la hauteur et le nombre de rangées diffèrent normalement. Mention démo conservée. |
| 2 | Tickets app et quatre états | **PASS** — 281 px de haut, tête 175 px, découpe à 183 px, CTA 56 px. Ouvert : « 1 équipe restante » ; complet : teal et « Voir le tournoi » ; fermé non complet : noir ; sans capacité : pas de statut ni barre. Date UTC « 1 SEPT ». [États](after/states-real-1440.png), [mobile](after/states-real-390.png), [runtime](evidence/runtime.json). |
| 3 | Carte création toujours dernière | **PASS** — après insertion, avec données récentes seules et sans tournois à venir ; lien `organisateur/` conservé. Limite cinq tournois générés vérifiée par le spécialiste JS. |
| 4 | Bandeau, boucle, pause et mouvement réduit | **PASS** — animation linéaire 40 s et deux séquences de même largeur ; translation de 0 à −50 %. Pause constatée au survol et au focus. Doubles `aria-hidden`, sans cible interactive. Mouvement réduit : animation `none`, doubles `display:none`, défilement manuel `overflow-x:auto`. Sans passé, bandeau `hidden` et `display:none`, y compris en mouvement réduit. |
| 5 | Visibilité et contrat des données | **PASS** — aucune donnée valide : section masquée ; passé seul : création + bandeau ; à venir seuls : aucun bandeau. Validation/RPC/cache/démo identiques à la référence. `npm test` : **15/15 PASS**, exécuté par l'orchestrateur et le spécialiste JS. |
| 6 | Organisateur inchangé | **PASS** — page complète et section identiques pixel par pixel aux trois tailles dans la comparaison contrôlée à date figée. [Comparaison](evidence/controlled-comparison.json). |
| 7 | Sémantique, accessibilité et AA | **PASS** — un H2 dans la section, un H3 par ticket (quatre en démo), SVG et décorations cachés aux lecteurs d'écran. Liens réels `/tournament/?id=…`, nom accessible incluant le titre. CTA 56 px de haut ; focus noir 3 px à l'intérieur du masque. Bandeau focusable. Contraste minimum conservateur des textes sur les tickets : **4,88:1**, introduction environ **6,90:1**. [Contraste](evidence/contrast.json). |
| 8 | Aucun débordement horizontal 320–1920 px | **PASS** — **1 601 largeurs entières** testées, zéro débordement de la racine. [Runtime](evidence/runtime.json). |
| 9 | Tokens et compilation | **PASS** — nouvelles couleurs déclarées dans `:root`, rendu participant isolé. `npm run build:css`, `node --check website/script.js` et `git diff --check` passent (auteurs/orchestrateur ; diff vérifié également en revue). |
| 10 | Architecture à jour | **PASS** — section Public tournament rails actualisée : structure, limites, états, cache, démo, priorité complet/fermé, bandeau, mouvement réduit et tokens. |

**Critères non satisfaits : aucun.**

## Précisions validées

- Un tournoi complet garde le dégradé teal, même si les inscriptions sont fermées ; le statut « Complet » prend donc priorité pour le texte et la palette. Le noir concerne les tournois fermés non complets.
- Le blanc des statuts secondaires passe de 80 % dans le détail de la maquette à **90 %** pour satisfaire le critère AA. Avant correction, la borne conservative était 4,25:1 ; après correction, 4,88:1 au minimum parmi les tailles contrôlées. Ce changement a été approuvé par l'orchestrateur et documenté.
- Les CTA de tournois fictifs restent des éléments inertes `aria-disabled` en mode démo. Les vrais liens ont été contrôlés avec une fixture injectée uniquement dans le cache de la page de test. Aucun appel à un tournoi fictif n'a été suivi.
- Les captures `*-showcase-isolated.png` masquent temporairement le header, le QR et les décorations flottantes, descendants compris, uniquement pour rendre la comparaison lisible. Les captures complètes et les autres captures de section conservent les éléments réels.

## Captures

| Taille | Avant | Après isolé | Page complète après |
|---|---|---|---|
| 1440 × 900 | [Section](before/home-1440-showcase.png) | [Section](after/home-1440-showcase-isolated.png) | [Accueil](after/home-1440-full.png) |
| 820 × 1180 | [Section](before/home-820-showcase.png) | [Section](after/home-820-showcase-isolated.png) | [Accueil](after/home-820-full.png) |
| 390 × 844 | [Section](before/home-390-showcase.png) | [Section](after/home-390-showcase-isolated.png) | [Accueil](after/home-390-full.png) |

Autres cas : [sans passé](after/noPast-390.png), [passé seul](after/recentOnly-390.png). Captures initiales conservées dans `before/` ; captures finales dans `after/`.

## Non-régression et méthode

Chrome headless via Playwright ; polices locales chargées avant capture. Les références initiales ont été prises avant modification. Le changement de jour décale les dates relatives de démo : la comparaison organisateur décisive reconstruit `b920f1a` par interception des sources en mémoire, compile son CSS dans `/tmp`, et fige la date au 18 octobre 2026 à 12:00 UTC pour les deux versions. Aucune source du dépôt n'est remplacée. Voir `before-controlled/`, `after-controlled/` et [controlled-comparison.json](evidence/controlled-comparison.json).

- Organisateur : images complètes et section, **zéro pixel différent** aux trois tailles.
- HOW : **zéro pixel différent** aux trois tailles dans les captures initiales/finales.
- Hero : comparaison contrôlée identique à 820 et 390 px ; à 1440 px, écart moyen de 0,0081 par canal sur 255, sans modification de sa source ni déplacement de sa géométrie. La petite différence de rasterisation ne constitue pas une régression de mise en page.
- Des captures élémentaires du hero après un grand défilement montrent des couches absentes à cause du rendu de capture Chromium ; elles ne servent pas de preuve de non-régression. Les captures contrôlées prises directement en haut de page les remplacent pour cette vérification.
- Zéro erreur JavaScript dans les pages et fixtures contrôlées.

Les mesures de contraste utilisent une borne conservative : couleur du dégradé aux coins de la boîte de texte et composition du blanc semi-transparent. Les valeurs portent sur les couleurs déclarées, sans traiter l'anticrénelage des contours comme une couleur de texte. Aucun audit serveur ou publication en production n'est inclus.

## Synthèse de revue

| Catégorie | Verdict |
|---|---|
| Préflight | PASS |
| HTML | PASS |
| CSS et tokens | PASS |
| JavaScript | PASS |
| Accessibilité | PASS |
| SEO/métadonnées, hors section et inchangés | PASS |
| Copie française | PASS |
| Documentation | PASS |
