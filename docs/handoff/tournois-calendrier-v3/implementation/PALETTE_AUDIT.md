# Couleurs publiques des tournois — audit du 22/10/2026

## Source app et vérification publique

Le dépôt app a été lu sans modification au commit `49b1dfe1`. Les 18 paires sont définies dans `lib/features/tournament_creation/screens/tournament_creation_screen.dart:235–253`. Le helper commun `lib/shared/theme/tournament_card_background.dart:17–22` utilise un dégradé radial centré, rayon 1.5 ; le web conserve sa traduction `circle closest-side`, extrémité à 300 %.

L’audit anonyme PROD a confirmé HTTP 200 pour le tournoi publié Panthères 2026, id `cf5faa8c-117a-4b9a-a3f9-522045d7e578`, champ `gradient_colors` : `[4278190080,4288755383]`, soit `FF000000` → `FFA136B7`. Sa palette est donc **violet**, et non le preset fuchsia `FFE63FB7`. Cette paire détermine la couleur ; aucun test sur le titre ou identifiant n’est codé dans le produit.

| Slug web | Départ ARGB | Fin ARGB |
|---|---|---|
| teal | FF000000 | FF36B7AA |
| rose | FF030303 | FFB73652 |
| violet | FF000000 | FFA136B7 |
| foret | FF000000 | FF1F7A3F |
| ambre | FF000000 | FFE8A63A |
| ocean | FF030303 | FF3B6BB7 |
| cuivre | FF000000 | FFB7683A |
| citron | FF000000 | FF6CB73A |
| corail | FF000000 | FFF66A5A |
| menthe | FF000000 | FF3AB77B |
| saphir | FF000000 | FF3A55B7 |
| fuchsia | FF000000 | FFE63FB7 |
| emeraude | FF000000 | FF1FB763 |
| safran | FF000000 | FFE8C53A |
| lavande | FF000000 | FF9E82D2 |
| cerise | FF000000 | FFD12F5A |
| prune | FF000000 | FF8A3A8A |
| lagon | FF000000 | FF3ACFD5 |

## Contrat réseau et sécurité

- Accueil participant réel : un batch facultatif `GET /rest/v1/tournaments?select=id,gradient_colors&id=in.(…)` enrichit les seuls billets à venir déjà validés, avec `credentials: omit`, clé publique et délai maximal 5 secondes. Aucun appel pour la démo, l’organisateur ou les joués seuls.
- Page tournoi : `gradient_colors` devient la 21e colonne de son select public existant. Aucun accès aux contacts, coordonnées GPS ou participants.
- La RPC `get_public_showcase`, la normalisation, le cache, le chargement différé et les fixtures de démo restent identiques. Une erreur palette ne masque pas le calendrier et conserve ses liens.
- Une palette doit être un tableau de deux entiers ARGB opaques de 32 bits et correspondre exactement à une paire autorisée. Valeurs absentes, transparentes, inconnues, fractionnaires, chaînes ou contenu malveillant retombent sur le teal existant. Aucune couleur reçue n’est injectée comme CSS.
- L’attribut `data-tournament-theme` reçoit uniquement un slug connu. Les 18 gradients et toutes leurs couleurs sont des tokens `:root`. Un test compare les tables accueil/page, puis vérifie chaque preset.
- Les requêtes tardives ne ciblent que les nœuds capturés au départ : elles ne recolorent pas un nouveau rendu. Le timeout ignore aussi une réponse tardive même si l’abandon réseau n’est pas respecté.
- Billets joués blancs, billets clos non pleins noirs, pages terminées/annulées neutres : les exceptions d’état validées restent prioritaires sur la palette.

## Lisibilité et différence avec l’app

Les extrémités de couleur sont reprises exactement. Le voile noir global de **35 % déjà présent sur le web** est conservé : il s’agit donc d’une correspondance des palettes source, pas d’une promesse de pixels identiques avec Flutter.

L’audit des rectangles de texte du calendrier à 1440, 390 et 320 px sur les 18 presets compare le dégradé avec et sans ce voile. Sans voile, certains petits statuts échouent : safran 3.562:1 et lagon 3.910:1 sur desktop. Avec le voile existant, le minimum calculé est **6.644:1**. [Résultats calendrier](after/palette-contrast.json).

La page large place sa date et ses métadonnées plus près de l’extrémité lumineuse. Avec le seul voile global, leur texte à 90 % d’opacité atteint seulement 3.459:1 sur safran, 3.800:1 sur lagon et 4.139:1 sur ambre. Le correctif retenu préserve le dessin de la page : aucun fond ni panneau supplémentaire sous la date ou les métadonnées. Seules les palettes de page qui échouent reçoivent un voile renforcé, mesuré sur les textes et la pastille d’inscriptions closes. Panthères violet et le calendrier conservent le voile existant de 35 %. La page utilise ces paliers mesurés, déclarés dans les tokens `:root` `--td-theme-shade-*` :

| Voile noir page | Presets |
|---|---|
| 35 % existant | violet, rose, foret, ocean, cuivre, saphir, fuchsia, cerise, prune |
| 45 % | corail, lavande |
| 50 % | teal, citron, menthe, emeraude, et fallback sans palette reconnue |
| 55 % | ambre, lagon |
| 60 % | safran |

Le calcul final couvre 18 palettes × 3 largeurs (1440, 390, 320), petits textes de date, métadonnées et pastille « Inscriptions closes » avec son fond blanc à 20 %. L’opacité des ancêtres est composée et les coins des rectangles de texte sont pris en compte dans le radial. Le minimum final est **4.621:1** (lagon, pastille close), avec aucun nouveau fond derrière la date ou les métadonnées. [Contraste final page](after/page-palette-final-contrast.json), [comparaison des paliers](after/page-palette-shade-thresholds.json). Le champ `shade` de ces JSON représente le multiplicateur RGB restant : `0.65` correspond au voile noir de 35 %, `0.4` au voile de 60 %. Ces mesures analytiques des rectangles et couleurs ne sont pas une certification de tous les rendus matériels possibles.

## Vérifications

`npm test` : **30/30 PASS**, dont 9 tests calendrier, 11 page tournoi et 10 préexistants. Les nouveaux cas couvrent les 18 presets identiques, Panthères violet, les entrées malveillantes/inconnues, les états neutres, le batch minimal, l’absence de requête démo/organisateur, l’erreur réseau/HTTP, la réponse malformée, le timeout et le rendu devenu obsolète. `npm run build` passe avec l’empreinte publique Android versionnée injectée comme en CI.

Captures accueil : [Panthères 1440](after/palette-live-pantheres-1440.png), [Panthères 390](after/palette-live-pantheres-390.png), [plein 1440](after/palette-live-full-1440.png), [plein 390](after/palette-live-full-390.png). Captures page : [Panthères 1440](after/palette-page-pantheres-1440.png), [Panthères 390](after/palette-page-pantheres-390.png), [safran 1440](after/palette-page-safran-1440.png), [lagon 1440](after/palette-page-lagon-1440.png), [ambre 1440](after/palette-page-ambre-1440.png), [safran inscriptions closes](after/palette-page-safran-clos-1440.png). Les captures de page utilisent des champs publics simulés pour maîtriser les états ; la paire réelle de Panthères a été vérifiée séparément en anonyme. [Métriques des captures](after/palette-page-captures.json).
