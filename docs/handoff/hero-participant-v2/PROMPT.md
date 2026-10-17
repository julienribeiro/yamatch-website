# Prompt à donner à l'agent IA

À coller tel quel dans une session Claude Code ouverte sur
`julienribeiro/yamatch-website`. Remplacer d'abord les trois lignes D1 à D3
par les décisions du founder.

```text
Implémente la refonte du hero participant de la page d'accueil (website/index.html, section.hero), validée par le founder.

Le dossier de passation est sur la branche `claude/intelligent-gates-tdhv16`, dans `docs/handoff/hero-participant-v2/`. L'écran de l'app codé en HTML/CSS est dans `docs/handoff/app-screens/`.

Avant toute action :
1. Récupère cette branche et pars de son état actuel (git fetch origin claude/intelligent-gates-tdhv16).
2. Lis en entier CLAUDE.md, puis docs/handoff/hero-participant-v2/README.md et SPEC.md, puis docs/handoff/app-screens/README.md.
3. Regarde les rendus cibles dans docs/handoff/hero-participant-v2/visuals/ (desktop-1440.jpg, tablette-820.jpg, mobile-390.jpg et desktop-1440-sans-cartes.jpg), ainsi que docs/handoff/app-screens/compare/discovery.png.
4. Les maquettes de référence sont dans hero-participant-v2/mockup/. Ne copie pas leurs styles inline : passe par les tokens :root et les sections 7.x de styles.css.

Décisions du founder (SPEC.md §8) :
- D1 (téléphone du carrousel qui remonte sous le hero) : [GARDER LE DÉFAUT RECOMMANDÉ / AUTRE : …]
- D2 (wordmark fixe et centré → à gauche dans un header) : [GARDER LE DÉFAUT RECOMMANDÉ / AUTRE : …]
- D3 (cartes flottantes décoratives, score d'exemple) : [GARDER LES CARTES / VERSION SANS CARTES]

Points impératifs :
- Le téléphone est l'écran HTML/CSS docs/handoff/app-screens/screens/discovery.html, collé tel quel dans un cadre .ym-phone-slot / .ym-phone (SPEC.md §5 bis). Aucun <img> ni <picture> de capture. Ses styles vont dans un nouveau fichier website/app-screens.css, chargé après styles.min.css. Il est partagé avec « Comment ça marche » V2 s'il existe déjà : complète-le, ne le duplique pas.
- Garde exactement les textes du SPEC.md §4. Le H1 ne change pas.

Façon de travailler :
- Tu es orchestrateur, comme le demande CLAUDE.md. Commence par « Analysis: » puis « Delegation: », et délègue selon le plan du SPEC.md §9 :
  - html-expert pour index.html ;
  - css-expert pour styles.css et app-screens.css ;
  - js-expert pour script.js, selon D1 et D2 ;
  - website-reviewer pour la revue ;
  - doc-keeper pour docs/WEBSITE_ARCHITECTURE.md.
- Donne aux spécialistes les noms de classes du SPEC.md §5 pour qu'ils restent cohérents entre eux.
- Ne modifie ni la page 404, ni la page organisateur, ni styles.min.css.

Validation avant de rendre la main :
- npm run build:css et npm test passent.
- Captures Playwright à 1440×900, 820×1180 et 390×844, comparées aux images de visuals/.
- Tous les critères du SPEC.md §10 sont vérifiés un par un. Liste ceux qui ne passent pas, avec la raison.
- website-reviewer rend un verdict PASS.

Livraison :
- Commit sur la branche claude/intelligent-gates-tdhv16, puis push.
- Pas de merge sur main : un push sur main publie le site en production.
- Ouvre une PR en draft, avec les captures avant/après et le résultat des critères du §10.
```

Si l'outil utilisé n'a pas les agents spécialisés du dépôt, retirer la partie
« Façon de travailler » et demander à l'agent de faire le travail lui-même, en
respectant les mêmes fichiers et les mêmes contraintes.
