# « Tous les tournois de la plateforme » V2 — dossier de passation

Refonte de la section `section.showcase#derniers-tournois` de la page
d'accueil (anciennement « À l’affiche et déjà joués »). Version retenue :
**terrain gris clair**. Maquette validée par le founder le 17/10/2026. Le
code du site n'est **pas** encore modifié.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `PROMPT.md` | Prompt prêt à coller pour lancer l'agent IA, pour cette section seule. |
| `SPEC.md` | **Instructions pour les agents** : existant, design cible (ticket de l'app, carte création, bandeau défilant), contenus, logique JS, tokens, décisions, délégation, critères d'acceptation. |
| `mockup/desktop.html`, `mockup/mobile.html` | Maquettes de référence statiques, avec des données d'exemple. |
| `visuals/desktop-1440.jpg` | Rendu cible desktop. |
| `visuals/tablette-820.jpg` | Rendu à 820 px (2 colonnes). |
| `visuals/mobile-390.jpg` | Rendu cible mobile, pleine hauteur. |

Les maquettes sont autonomes, seules les polices sont chargées depuis
`website/fonts/`. Le ticket reprend les mesures de l'écran codé
`../app-screens/screens/discovery.html`.

## Ouvrir les maquettes

```bash
npx --yes live-server@1.2.2 . --port=8001
# http://localhost:8001/docs/handoff/tournois-plateforme-v2/mockup/desktop.html
```

Captures : `node docs/handoff/app-screens/tools/render-visuals.mjs`.
