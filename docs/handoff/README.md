# Dossiers de passation — refonte de la page d'accueil

Maquettes validées par le founder le 17/10/2026. Les implémentations se font
sur des branches de travail. La V3 calendrier/page tournoi est en cours de validation
sur `claude/beautiful-meitner-4wzp5k` ; ce lot est **draft, non déployé**.

| Dossier | Section | Statut |
|---|---|---|
| `hero-participant-v2/` | Hero participant (`section.hero`) | Implémenté sur la branche, voir `implementation/` |
| `comment-ca-marche-v2/` | « Comment ça marche » (`#how-it-works`) | Implémenté sur la branche, voir `implementation/` |
| `tournois-plateforme-v2/` | Tournois publics (`#derniers-tournois`), version terrain gris clair | Validé, **à implémenter** |
| `tournois-calendrier-v3/` | Tournois publics (`#derniers-tournois`) en calendrier « Mois géants » sans cadre + page tournoi (`/tournament/`) — remplace la V2 | Implémenté en draft sur `claude/beautiful-meitner-4wzp5k`, validation en cours ; [rapport et limite D3](tournois-calendrier-v3/implementation/README.md) |
| `stories-v2/` | Preuve sociale « Vu dans les stories » (`#temoignages`), entre « Comment ça marche » et les tournois | Validé, **à implémenter** (contenus réels requis) |
| `app-screens/` | Écrans de l'app codés en HTML/CSS (kit partagé) | 4 écrans prêts |

**Prochaines étapes** : terminer la validation V3 avant décision de publication, puis
`stories-v2/PROMPT.md` (preuve sociale, dès que les vraies stories sont
disponibles). Les deux s'appuient sur le hero et « Comment ça marche » déjà
livrés sur la branche.

Chaque dossier contient un `README.md`, un `SPEC.md` (instructions et
critères d'acceptation), des maquettes HTML (`mockup/`) et des captures de
référence (`visuals/`).

Maquette interactive complète (canevas, toutes les propositions) :
https://claude.ai/artifact/9jBd4gVCPqLHyhd7A3wUiS. Ce lien est privé tant qu'il
n'a pas été partagé.
