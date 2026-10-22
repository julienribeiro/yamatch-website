# « Ça crie sur le terrain » — dossier de passation

Nouvelle section de la page d'accueil qui montre de **vraies scènes de
tournoi avec des humains**, pour que le visiteur se projette dans l'app.
Quatre photos verticales, chacune avec une phrase de joueur criée en Frick
lime incliné. Elle se place juste après « Comment ça marche »
(`#how-it-works`). Direction « B — Le cri d'équipe », validée par le
founder le 22/10/2026, **non implémentée**.

Les photos de la maquette sont **provisoires** : elles réutilisent des
images déjà présentes sur le site (hero et page organisateur). Voir
`SPEC.md` §3 pour le brief des photos définitives.

| Fichier | Rôle |
|---|---|
| `PROMPT.md` | Prompt prêt à coller dans Codex (ou tout agent de code). |
| `SPEC.md` | Instructions : contenu, design, HTML, tokens, responsive, accessibilité, décisions, critères d'acceptation. |
| `mockup/section.html` | Maquette de référence (desktop, tablette et mobile dans le même fichier, via media queries). À ouvrir depuis un serveur lancé à la racine du dépôt. |
| `visuals/desktop-1440.jpg`, `tablette-820.jpg`, `mobile-390.jpg` | Captures de référence de la maquette. |

Ouvrir la maquette :

```bash
npx --yes http-server . -p 8000
# puis http://localhost:8000/docs/handoff/cri-equipe-v1/mockup/section.html
```
