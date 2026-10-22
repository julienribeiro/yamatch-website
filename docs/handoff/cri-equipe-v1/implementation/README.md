# « Ça crie sur le terrain » — validation

22/10/2026 · branche `codex/cri-equipe-v1`, base `f2d100c0d5895b1b1448447366acf566d80ccc5a` · non déployé. La branche calendrier V3 reste séparée.

La section est placée après HOW et avant Stories masquées. M1–M4 : photos provisoires existantes, CTA `download/`, aucun lien ajouté au header, aucun JavaScript. Les phrases sont illustratives, sans attribution de témoignages. Revue indépendante finale **PASS le 22/10/2026**, dans les sept catégories ; les neuf critères ci-dessous sont validés, avec les adaptations et limites documentées.

## Critères SPEC §9

| # | Critère | Résultat / preuve |
|---|---|---|
| 1 | Conformité 1440/820/390 | Vérifié visuellement face aux références : [desktop](after/section-1440.png), [tablette](after/section-820.png), [mobile](after/section-390.png). Deux adaptations justifiées ci-dessous : verre sombre et taille des phrases plafonnée |
| 2 | Textes exacts, sans attribution | Vérifié dans HTML : badge, H2, introduction, quatre phrases/pastilles, espaces insécables et CTA conformes ; aucun nom ajouté |
| 3 | Desktop quatre colonnes, décalage, CTA | Quatre cartes 9:14, paires décalées de 36 px ; espace réservé sous le rail et CTA sans collision. [Mesures](after/interaction-qa.json) |
| 4 | Rail natif tablette/mobile | Snap obligatoire, cartes 40 % / 72 %, sans décalage. ArrowRight défile de 0→308 à 820 px et 0→264 à 390 px ; première carte à la gouttière. Focus lime 3 px mesuré après stabilisation |
| 5 | Tokens, §10.8, ancre | Tokens `--shouts-*` dans `:root`, aucune couleur brute dans les règles ajoutées ; table des matières et sous-section 10.8, Stories renumérotées 10.9 ; `#moments` ajouté au calcul de marge d’ancre |
| 6 | Aucun JS ni minifié manuel | `script.js` et `carousel.js` inchangés ; `styles.min.css` seulement régénéré par `npm run build:css`, ignoré par Git |
| 7 | Sections/pages existantes préservées | Hauteurs/états de toutes les anciennes sections d’accueil identiques aux trois formats, insertion décale seulement la suite. Stories restent masquées. 404 identiques pixel pour pixel aux trois formats. Organisateur : mêmes 1255 nœuds et zéro différence de styles calculés aux trois formats ; détails de stabilité ci-dessous |
| 8 | Build CSS et tests | **15/15 tests PASS**, `npm run build:css` PASS et build complet PASS avec l’empreinte publique Android déjà requise injectée depuis `config/play-app-signing-sha256.json` |
| 9 | Architecture synchronisée | [Architecture](../../../WEBSITE_ARCHITECTURE.md) : arbre DOM, ordre des sections, ancres, tokens, responsive, photos provisoires et adaptations d’accessibilité documentés |

## Géométrie, accessibilité et adaptations

[QA interaction](after/interaction-qa.json) : aucun défilement horizontal de la page à 320/360/390/768/820/1024/1440/1920 ; phrases et pastilles contenues dans leurs cartes. Un H2 dans la section, quatre paragraphes illustratifs, CTA d’au moins 48 px ; photos lazy/async avec dimensions et descriptions, avatars décoratifs. Avec mouvement réduit, le survol n’applique aucun zoom ; la règle globale donne une transition résiduelle de 0,01 ms. Le contour de focus devient bien lime après le délai de peinture (100 ms dans la mesure).

La maquette utilisait du verre blanc à 14 %, insuffisant au-dessus d’une photo claire. Le verre sombre à 62 % garantit **5,761:1** pour les petits textes blancs sur un fond photo blanc (calcul du spécialiste CSS). Les phrases respectent leurs deux lignes et l’inclinaison ; la taille est plafonnée par la largeur réelle de chaque carte pour éviter le rognage à 320 px. Le spécialiste CSS mesure **4,544:1** au pire cas lime/dégradé sur photo blanche, au-dessus des 3:1 requis pour ces grands textes. Ces adaptations sont décrites dans l’architecture.

## Comparaison des pages existantes

[Baseline](before/baseline.json), [mesures après](after/fullpage-qa.json). Captures complètes avant/après à 1440/820/390 pour l’accueil, l’organisateur et la 404. Les captures de section masquent uniquement le QR fixe pendant la prise de vue pour comparer aux références ; les pages complètes gardent le QR réel. Toutes les images sont décodées avant capture. Date figée au 22/10/2026, fuseau Europe/Paris, mouvement réduit, `?showcase=demo` explicite et réseau externe bloqué.

Les captures organisateur prises dans des sessions séparées ne sont pas toutes identiques, malgré des dimensions égales. Une comparaison isolée de la base Git exportée et de l’état final dans le **même navigateur** vérifie les 1255 nœuds : **zéro différence de style calculé** aux trois largeurs. Les captures 1440/820 sont alors identiques ; la 390 était identique dans la première comparaison. Des captures répétées de l’état final présentent elles-mêmes un bruit de raster/transitoire (17 à 487 pixels selon le format). On ne revendique donc pas une égalité binaire permanente des images dynamiques. [Preuve d’isolation et de stabilité](after/organisateur-stability-qa.json), [premier comparatif pixels](after/organisateur-pixel-diff.json). Aucun fichier organisateur ni aucune règle qui le cible n’a changé.

## Captures

- Accueil : [avant desktop](before/home-1440-full.png) / [après desktop](after/home-1440-full.png), [avant mobile](before/home-390-full.png) / [après mobile](after/home-390-full.png).
- Organisateur : [avant desktop](before/organisateur-1440-full.png) / [après desktop](after/organisateur-1440-full.png).
- 404 : [avant](before/404-1440-full.png) / [après](after/404-1440-full.png).

Le remplacement des photos provisoires par les quatre photos dédiées du brief reste un travail ultérieur, conformément à M1. Cette validation ne constitue pas une publication en production.
