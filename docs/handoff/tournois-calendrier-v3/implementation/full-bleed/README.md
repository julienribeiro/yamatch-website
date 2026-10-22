# Rail participant jusqu’aux bords de l’écran

22/10/2026 · `codex/tournament-rail-full-bleed` · base `3e570a1` · non déployé.

Le calendrier conserve son alignement initial, ses dimensions de billets et son en-tête, mais son conteneur de défilement s’étend jusqu’aux bords de l’écran sur tablette et desktop. Les bandes latérales de 16/24 px ne rognent plus les billets pendant le défilement. Mobile conserve son comportement existant.

| Largeur | Rail avant | Rail après | Gouttière interne après |
|---|---|---|---|
| 1440 | x24 à1416 | x0 à1440 | 88,8 px |
| 820 | x16 à804 | x0 à820 | 52,9 px |
| 390 | x0 à390 | x0 à390 | 16 px, inchangé |

[Mesures avant](before/geometry.json), [après](after/geometry.json). Aucun débordement horizontal de page dans ces captures. La variante organisateur garde exactement les mêmes dimensions, positions et paramètres de rail aux trois formats. Ses images complètes peuvent varier entre prises indépendantes à cause des éléments dynamiques ; [différences pixels](after/organisateur-pixels.json) conservées pour transparence, sans prétendre à une identité binaire permanente. Ses fichiers et ses règles ne sont pas modifiés.

La modification est limitée aux tokens et règles CSS participant à partir de 768 px. Aucun HTML, JavaScript, contrôleur de défilement, palette ou état de billet n’est changé. Le padding et le scroll-padding utilisent la même gouttière calculée, ainsi que l’en-tête, la barre de progression et le bandeau démo.

Validation : **30/30 tests**, build CSS et build complet PASS avec l’empreinte publique Android existante. Revue indépendante finale **PASS le 22/10/2026**. Aucun push sur `main` ni déploiement.

## Captures

| Avant | Après |
|---|---|
| [Desktop](before/home-1440-scrolled-viewport.png) | [Desktop](after/home-1440-scrolled-viewport.png) |
| [Tablette](before/home-820-scrolled-viewport.png) | [Tablette](after/home-820-scrolled-viewport.png) |
| [Mobile](before/home-390-scrolled-viewport.png) | [Mobile](after/home-390-scrolled-viewport.png) |

Date figée au 22/10/2026, Europe/Paris, mouvement réduit, mode démo explicite. Le QR fixe est masqué uniquement pendant les captures du calendrier pour faciliter la comparaison ; son code reste inchangé.
