# Validation Stories V2 — livraison S1

**Verdict : PASS pour la livraison S1 masquée uniquement.** Date : 18 octobre 2026. Aucun contenu réel n'a été fourni ; ce verdict n'autorise pas l'affichage d'une section peuplée et ne valide aucun futur média.

## Préflight

Les spécialistes HTML et CSS ont fourni leurs **Current State Summary** et **Verified safety greps**. Ils ont identifié l'absence préalable de classes Stories, l'insertion entre HOW et tournois, les marges du header et les tokens réutilisables. Aucun contrôleur JavaScript n'est nécessaire : aucune vidéo n'est fournie. La documentation décrit cet état et les conditions d'activation.

La revue confirme : `#temoignages[hidden]`, rail vide, zéro `li`, `figure`, image, vidéo ou source média ; un H2 ; trois SVG décoratifs correctement masqués ; aucune référence de média fictif. Les nouvelles règles sont limitées à `.stories` et aux tokens `--stories-*` ; les fichiers JS, 404 et organisateur sont inchangés. `git diff --check` passe.

## Critères du SPEC §10

| # | Critère | Résultat |
|---|---|---|
| 1 | Aucun placeholder ou contenu fictif | **PASS** — aucun témoignage, identité, citation ni média inventé ; rail vide. |
| 2 | Rendu avec vraies stories, rail tactile/trackpad/clavier | **N/A : contenus absents.** Seuls fond, terrain, titre, lien Instagram et styles du rail vide ont été inspectés dans un aperçu temporaire local. Aucun défilement de cartes réelles n'est revendiqué. |
| 3 | S1 : hidden, aucune requête média | **PASS** — `display:none`, boîte 0 × 0 aux trois tailles ; zéro requête vers `/assets/stories/`, zéro média dans le DOM. |
| 4 | Images lazy, dimensions et CLS | **N/A pour les images : aucune image fournie.** La coquille masquée n'occupe aucune place et n'introduit aucun média ni changement de hauteur de page. Le CLS d'une future section peuplée reste à mesurer. |
| 5 | Vidéos, pause, visibilité, mouvement réduit | **N/A : aucune vidéo ni contrôleur vidéo livré.** Les exigences restent obligatoires avant toute intégration vidéo. |
| 6 | Sémantique et accessibilité | **PASS pour la coquille** : un H2, décorations `aria-hidden`/`focusable=false`, lien Instagram nommé, `noopener`, cible 48 px et focus lime 3 px. Contraste du CTA blanc sur #101828 : environ 17,75:1. **N/A** pour figure/alt réels et contraste du texte sur médias : à valider avec les contenus. |
| 7 | Autres sections et pages inchangées | **PASS** — jonction HOW → tournois identique pixel par pixel aux trois tailles ; accueil complet identique à 820 et 390 px. À 1440 px, différences limitées de rasterisation (maximum 10/255, moyenne 0,0043/255), dimensions identiques. HTML hors ajout préservé ; règles nouvelles exclusivement Stories ; JS, 404 et organisateur inchangés. |
| 8 | Aucun overflow horizontal 320–1920 | **PASS** — 1 601 largeurs entières testées dans l'état livré : zéro débordement. Aperçu vide également sans débordement aux trois tailles de référence. |
| 9 | Build, tests et documentation | **PASS** — `npm run build:css` et `npm test` (15/15) passent, exécutés par l'orchestrateur. Architecture synchronisée, formats et accords requis documentés dans `website/assets/stories/README.md`. |

**Aucun défaut bloquant pour S1.** Les points N/A ne sont pas considérés comme des validations de contenu futur.

## Captures et preuves

| Taille | Avant complet | Après complet | Jonction après | Aperçu vide local uniquement |
|---|---|---|---|---|
| 1440 × 900 | [Avant](before/home-1440-full.png) | [Après](after/home-1440-full.png) | [Jonction](after/junction-1440.png) | [Coquille](preview-empty-local-only/shell-1440.png) |
| 820 × 1180 | [Avant](before/home-820-full.png) | [Après](after/home-820-full.png) | [Jonction](after/junction-820.png) | [Coquille](preview-empty-local-only/shell-820.png) |
| 390 × 844 | [Avant](before/home-390-full.png) | [Après](after/home-390-full.png) | [Jonction](after/junction-390.png) | [Coquille](preview-empty-local-only/shell-390.png) |

[Audit DOM/réseau/focus/overflow](evidence/audit.json) · [Comparaison des images](evidence/comparison.json).

Chrome via Playwright, mode `?showcase=demo` pour les tournois uniquement, mouvement réduit, date figée au 18 octobre 2026 à 12:00 UTC. La référence inclut la barre pleine largeur, les trois effets radar et le retrait du score externe du hero.

Dans `preview-empty-local-only/`, `hidden` a été retiré uniquement dans la page de test en mémoire, puis rétabli. Aucun enfant n'a été ajouté au rail. Le header, le QR et les décorations flottantes ont été masqués uniquement pour ces captures. Ces images ne représentent pas l'état livré et ne doivent pas servir de preuve d'un rendu avec témoignages. Le code reste masqué ; aucun contenu fictif n'a été ajouté.

Avant activation : recevoir au moins trois stories réelles validées, leurs accords écrits et droits ; intégrer les médias et attributs réels ; contrôler les gestes, liens, contrastes sur médias, chargement et CLS ; implémenter et tester le contrôleur vidéo si des vidéos sont fournies.
