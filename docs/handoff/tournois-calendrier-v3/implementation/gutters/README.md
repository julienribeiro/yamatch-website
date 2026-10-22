# Marges communes à la page d’accueil

22/10/2026 · branche `codex/tournament-rail-full-bleed` · PR #37 · non déployé.

Le bord du hero sert de référence aux contenus HOW, Shouts, calendrier, FAQ et footer. `--home-section-gutter` reprend `--hero-gutter` : 24 px sur desktop/tablette, et la marge mobile existante (20 px aux largeurs testées). Les rails Shouts et calendrier conservent un défilement jusqu’aux bords de l’écran ; seul leur alignement initial utilise cette marge.

## Mesures

| Largeur | Hero | HOW | Shouts | Calendrier | FAQ | Footer | Rail calendrier |
|---|---|---|---|---|---|---|---|
| 1920 | 24 | 24 | 24 | 24 | 24 | 24 | 0–1920 |
| 1440 | 24 | 24 | 24 | 24 | 24 | 24 | 0–1440 |
| 820 | 24 | 24 | 24 | 24 | 24 | 24 | 0–820 |
| 390 | 20 | 20 | 20 | 20 | 20 | 20 | 0–390 |
| 320 | 20 | 20 | 20 | 20 | 20 | 20 | 0–320 |

Positions de contenu en pixels depuis le bord gauche. HOW et Shouts : en-tête et première carte. Calendrier : en-tête et padding ; la position initiale du groupe du mois diffère de moins de 0,27 px à cause de l’arrondi du scroll. [Avant](before/geometry.json), [après](after/geometry.json). Aucun débordement horizontal de page aux cinq formats.

Le changement retire les plafonds externes qui recentraient certaines sections sur les écrans larges. Les cartes HOW et Shouts occupent donc plus de largeur à 1920 px. Les fonds restent pleine largeur ; les espacements internes aux cartes et la logique JavaScript restent inchangés. Les adaptations sont limitées à la homepage par `body:not(.org-page):not(.error-page):has(.hero-header)`.

## Vérifications

- **30/30 tests**, build CSS et build complet PASS. L’empreinte publique Android existante est injectée depuis la configuration comme en CI.
- Aucun changement de HTML, JavaScript, données de tournois ou palette.
- Organisateur : 1255 nœuds, zéro différence de styles calculés et zéro différence de pixels avant/après aux trois largeurs 1440/820/390 dans une comparaison isolée ; léger bruit entre captures répétées documenté dans [la preuve](after/organisateur-stability-qa.json).
- 404 : 57 nœuds, zéro différence de style ou pixel aux trois formats : [preuve](after/404-stability-qa.json).
- Revue indépendante finale **PASS le 22/10/2026**, bords gauche/droit vérifiés aux cinq formats.

## Captures

Les dossiers `before/` et `after/` contiennent chaque section à 1440/820/390/1920, plus 320 après, et les pages complètes. Le header fixe et le QR sont masqués **uniquement pour les captures de section** ; les pages complètes gardent le rendu réel. Date figée au 22/10/2026, Europe/Paris, mouvement réduit, démo explicite.

- Shouts 1920 : [avant](before/shouts-1920.png) / [après](after/shouts-1920.png).
- Calendrier 1440 : [avant](before/showcase-1440.png) / [après](after/showcase-1440.png).
- FAQ mobile : [avant](before/faq-390.png) / [après](after/faq-390.png).
- Page entière 1440 : [avant](before/home-1440-full.png) / [après](after/home-1440-full.png).

Ce rapport complète la correction de rail pleine largeur de [full-bleed](../full-bleed/README.md), dont la géométrie initiale est conservée comme historique avant harmonisation.
