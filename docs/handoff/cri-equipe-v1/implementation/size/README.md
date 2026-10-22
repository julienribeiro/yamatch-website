# Photos Shouts agrandies

Les quatre photos utilisent désormais le ratio 9:15.7 au lieu de 9:14, soit environ 12,1 % de hauteur supplémentaire à largeur identique.

| Viewport | Avant (largeur × hauteur) | Après |
|---|---|---|
| 1440 | 337,5 × 525 | 337,5 × 588,75 |
| 820 | 308,8 × 480,34 | 308,8 × 538,67 |
| 390 | 252 × 392 | 252 × 439,59 |

Validation : 30/30 tests et build complet PASS. Les mesures à 320, 390, 768, 820, 1024, 1440 et 1920 px confirment l’absence de débordement horizontal de page. Toutes les photos sont décodées avant capture. Largeurs, gouttières, décalage desktop de 36 px et écart au CTA restent identiques. Le cadrage conserve object-fit:cover et les positions existantes.

Les rectangles du paragraphe incliné incluent de l’espace vide et peuvent dépasser la carte d’environ 1,6 px ; les rectangles des textes eux-mêmes restent entièrement dans les cartes (preuve CSS spécialiste : [glyph-bounds.json](after/glyph-bounds.json)). Aucune phrase n’est rognée.

[Mesures avant](before/geometry.json) · [Mesures après](after/geometry.json). Captures de section disponibles dans les deux dossiers ; header fixe et QR masqués uniquement pour la capture.

Revue indépendante : PASS final reçu le 22 octobre 2026, aucun finding. Livraison sur PR 37 uniquement, sans déploiement en production.
