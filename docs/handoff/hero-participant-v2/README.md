# Hero participant V2 — dossier de passation

Refonte visuelle de la section hero de la page d'accueil participant
(`website/index.html`, `section.hero`). La maquette est validée par le
founder le 17/10/2026. Le code du site n'est **pas** encore modifié.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `SPEC.md` | **Instructions pour les agents** : périmètre, design cible, tokens, contenus, responsive, accessibilité, contraintes, plan de délégation, critères d'acceptation. À lire en entier avant d'écrire du code. |
| `mockup/desktop.html` | Maquette de référence desktop (ouvrable dans un navigateur, assets du site en chemins relatifs). |
| `mockup/mobile.html` | Maquette de référence mobile (390 × 844). |
| `visuals/desktop-1440.jpg` | Rendu cible desktop, 1440 × 900 (@2x). |
| `visuals/desktop-1440-sans-cartes.jpg` | Même rendu sans les cartes flottantes (variante de repli). |
| `visuals/tablette-820.jpg` | Rendu à 820 px : colonnes empilées. |
| `visuals/mobile-390.jpg` | Rendu cible mobile, 390 × 844 (@2x). |

## Ouvrir les maquettes

```bash
npx --yes live-server@1.2.2 . --port=8001
# puis http://localhost:8001/docs/handoff/hero-participant-v2/mockup/desktop.html
```

Ou directement en `file://` : les chemins relatifs pointent vers
`website/assets/` et `website/fonts/`.

> Les maquettes utilisent des styles inline pour rester lisibles. **Ne pas
> les copier telles quelles** : l'implémentation passe par les tokens `:root`
> et les sections 7.x de `website/styles.css` (voir `SPEC.md` §6).

## Comment utiliser ce dossier (agents IA)

1. L'orchestrateur lit `CLAUDE.md` du dépôt, puis `SPEC.md`.
2. Il délègue selon le plan du `SPEC.md` §9 (`html-expert`, `css-expert`,
   `js-expert`, puis `website-reviewer` et `doc-keeper`).
3. Chaque agent compare son rendu aux fichiers de `visuals/` aux mêmes
   largeurs (1440, 820, 390).
4. La tâche est terminée quand tous les critères du `SPEC.md` §10 sont
   remplis.
