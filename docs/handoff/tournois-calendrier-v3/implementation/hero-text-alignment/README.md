# Alignement des sections sur le texte du hero

Le retrait commun inclut maintenant la marge extérieure du hero et son padding de contenu : `--home-section-gutter: calc(var(--hero-gutter) + var(--hero-copy-pad))`. HOW, Shouts, calendrier, FAQ et footer partagent cette ligne de contenu, symétriquement à droite. Le titre mobile centré reste centré dans son propre bloc ; la référence est son conteneur de texte.

| Viewport | Marge gauche et droite des contenus |
|---|---:|
| 1920 | 104 px |
| 1440 | 96 px |
| 820 | 65 px |
| 390 | 40 px |
| 320 | 40 px |

Les rails du calendrier continuent de x0 au bord droit du viewport. Les flèches clavier déplacent le rail de 40 px et mettent à jour la progression sur les cinq formats. Aucun débordement horizontal de page. Le titre calendrier est adapté sous 360 px pour garder sa pill dans la largeur disponible ; à 320 px elle occupe x41,72–276,23 dans le contenu x40–280. Audit CSS : textes Shouts et badges contenus à 320/350/359/360/390, téléphones HOW contenus.

30/30 tests et build complet PASS. Captures showcase320 et Shouts390 inspectées visuellement. Comparaison404 : aucun changement de style calculé ou de pixels. Comparaison organisateur : aucun changement de styles calculés aux trois formats ; pixels identiques à 1440/820. À 390, les 87410 pixels différents sont exactement le bruit observé entre deux captures consécutives de la version après (contenu animé), avec les mêmes propriétés calculées. Les deux versions utilisent le même build CSS.

- [Géométrie avant](before/geometry.json) / [après](after/geometry.json)
- [Clavier et progression](after/calendar-keyboard.json)
- Captures de section et pages complètes dans before/ et after/. Header fixe et QR masqués uniquement pour les captures de section.

Revue indépendante : PASS final reçu le 22 octobre 2026, aucun finding. Branche `codex/hero-text-alignment`, base `2a0a4cc`. Pas de déploiement en production.
