# Tournois « Mois géants » V3 — dossier de passation

Refonte de la section `section.showcase#derniers-tournois` de la page
d'accueil (variante `participant`, titre « Ça smash près de chez toi ») et de
la page publique d'un tournoi (`website/tournament/`). Version retenue par le
founder le 22/10/2026 : **calendrier horizontal découpé par mois géants**,
**sans cadre**, tournois joués en **billets à tête blanche**, bouton unique
**« Voir le tournoi »** vers une **page dédiée par tournoi**.

Elle remplace la version V2 « terrain gris clair » (`../tournois-plateforme-v2/`),
aujourd'hui en production sur `main`. Le code du site n'est **pas** encore
modifié.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `PROMPT.md` | Prompt prêt à coller pour lancer l'agent IA. |
| `SPEC.md` | **Instructions pour les agents** : existant, design cible, données, logique, page tournoi, décisions, délégation, critères d'acceptation. |
| `mockup/calendrier-et-page-tournoi.html` | Maquette de référence (section + page tournoi), données d'exemple. `#t-<id>` ouvre une page tournoi, `#calendrier` revient. |
| `visuals/calendrier-desktop-1440.jpg` | Section à l'ouverture (mois en cours aligné à gauche). |
| `visuals/calendrier-desktop-1440-mois-passes.jpg` | Section défilée au début : mois passés, billets blancs. |
| `visuals/calendrier-tablette-820.jpg`, `visuals/calendrier-mobile-390.jpg` | Section en tablette et mobile. |
| `visuals/page-tournoi-a-venir-desktop-1440.jpg` | Page d'un tournoi à venir avec places restantes. |
| `visuals/page-tournoi-complet-mobile-390.jpg` | Page d'un tournoi complet, mobile. |
| `visuals/page-tournoi-termine-desktop-1440.jpg` | Page d'un tournoi joué. |

La barre grise en haut de la maquette (sélecteur « 1 / 3 / 6 tournois ») et
la note en bas sont des outils d'aperçu : **ne pas les implémenter**.

## Ouvrir la maquette

```bash
npx --yes live-server@1.2.2 . --port=8001
# http://localhost:8001/docs/handoff/tournois-calendrier-v3/mockup/calendrier-et-page-tournoi.html
```

La maquette charge les polices depuis `website/fonts/` (chemin relatif) ;
l'ouvrir depuis la racine du dépôt. Version interactive publiée (privée tant
qu'elle n'est pas partagée) : https://claude.ai/artifact/GfHxVhYHYd8kys4mXpEKCh
