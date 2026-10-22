# Photos et textes des moments

Quatre images générées dédiées remplacent les visuels réutilisés. Les scènes montrent des jeunes adultes réunis autour du volley : inscription, match, finale et souvenir d’équipe. La [provenance et les prompts](../../../../../website/assets/moments/README.md) sont conservés avec les assets.

Les phrases utilisent Inter 800, la casse courante et une inclinaison de −6°. Les dimensions des cartes, le ratio 9:15.7, les marges, le décalage desktop et le CTA restent identiques à la base 7249874.

Validation : 30/30 tests et build complet PASS. QA à 320/390/768/820/1024/1440/1920 px : aucun débordement de page, aucune phrase rognée selon les rectangles des glyphes, toutes les photos décodées et dimensions HTML conformes à leurs dimensions naturelles (941 × 1672). Les quatre WebP pèsent chacun moins de 180 Ko ; loading=lazy et decoding=async sont conservés. Captures 1440 et 390 inspectées visuellement : sujets lisibles, cadrage et CTA cohérents.

[Mesures avant](before/geometry.json) · [Mesures après](after/geometry.json) · [Poids et validation](after/validation.json). Captures dans before/ et after/ ; header fixe et QR masqués uniquement pendant les captures de section.

Revue indépendante : PASS final reçu le 22 octobre 2026. Livraison prévue dans PR37, sans déploiement en production.
