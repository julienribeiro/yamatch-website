# « Comment ça marche » V2 — dossier de passation

Refonte de la section `section.how-quest#how-it-works` de la page d'accueil,
dans le style du hero V2. Maquette validée par le founder le 17/10/2026.
Le code du site n'est **pas** encore modifié.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `PROMPT.md` | Prompt prêt à coller pour lancer l'agent IA. |
| `SPEC.md` | **Instructions pour les agents** : existant, design cible, contenus, écrans codés, tokens, mouvement, décisions, délégation, critères d'acceptation. |
| `mockup/desktop.html`, `mockup/mobile.html` | Maquettes de référence assemblées (écrans de l'app codés inclus). |
| `mockup/src/*.html` | Sources des maquettes. Les commentaires `SCREEN:` y sont remplacés par les écrans codés. |
| `visuals/desktop-1440.jpg` | Rendu cible desktop. |
| `visuals/tablette-820.jpg` | Rendu à 820 px (cartes empilées). |
| `visuals/mobile-390.jpg` | Rendu cible mobile, pleine hauteur. |
| `../app-screens/` | Écrans de l'app en HTML/CSS (partagés avec le hero). Voir son README. |

## Ouvrir les maquettes

```bash
npx --yes live-server@1.2.2 . --port=8001
# http://localhost:8001/docs/handoff/comment-ca-marche-v2/mockup/desktop.html
```

Après avoir modifié une source ou un écran :

```bash
node docs/handoff/app-screens/tools/assemble-mockups.mjs
node docs/handoff/app-screens/tools/render-visuals.mjs
```
