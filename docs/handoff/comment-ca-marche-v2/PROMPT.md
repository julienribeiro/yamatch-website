# Prompt à donner à l'agent IA

À coller tel quel dans une session Claude Code ouverte sur
`julienribeiro/yamatch-website`. Remplacer d'abord les trois lignes E1 à E3
par les décisions du founder.

```text
Implémente la refonte de la section « Comment ça marche » de la page d'accueil (website/index.html, section.how-quest#how-it-works), validée par le founder.

Le dossier de passation est sur la branche `claude/intelligent-gates-tdhv16`, dans `docs/handoff/comment-ca-marche-v2/`. Les écrans de l'app codés en HTML/CSS sont dans `docs/handoff/app-screens/`.

Avant toute action :
1. Récupère cette branche et pars de son état actuel (git fetch origin claude/intelligent-gates-tdhv16).
2. Lis en entier CLAUDE.md, puis docs/handoff/comment-ca-marche-v2/README.md et SPEC.md, puis docs/handoff/app-screens/README.md.
3. Regarde les rendus cibles dans docs/handoff/comment-ca-marche-v2/visuals/ (desktop-1440.jpg, tablette-820.jpg, mobile-390.jpg) et les comparaisons écran par écran dans docs/handoff/app-screens/compare/.
4. Les maquettes de référence sont dans comment-ca-marche-v2/mockup/. Ne copie pas leurs styles inline : passe par les tokens :root et la section §10 de styles.css.

Décisions du founder (SPEC.md §8) :
- E1 (supprimer les 2 cartes parallax de la section, garder celles de la FAQ) : [GARDER LE DÉFAUT RECOMMANDÉ / AUTRE : …]
- E2 (bandeau « Prêt à jouer ? » avec boutons stores) : [GARDER / RETIRER]
- E3 (écrans de l'app codés en HTML, pas de PNG) : écrans codés.

Points impératifs :
- Les trois téléphones sont les écrans HTML/CSS de docs/handoff/app-screens/screens/ (tournament, confirmation, ranking), collés tels quels dans un cadre .ym-phone-slot / .ym-phone. Aucun <img> de capture. Leurs styles vont dans un nouveau fichier website/app-screens.css, chargé après styles.min.css. Il est partagé avec le hero V2 s'il existe déjà : complète-le, ne le duplique pas.
- Conserve l'ancre #how-it-works, l'id howQuestTitle et les textes des trois étapes, mot pour mot. Les nouveaux textes sont ceux du SPEC.md §4, et aucun autre.
- Ne casse pas les cartes flottantes et le parallax de la FAQ.

Façon de travailler :
- Tu es orchestrateur, comme le demande CLAUDE.md. Commence par « Analysis: » puis « Delegation: », et délègue selon le plan du SPEC.md §9 :
  - html-expert pour index.html ;
  - css-expert pour styles.css et app-screens.css ;
  - js-expert pour script.js ;
  - website-reviewer pour la revue ;
  - doc-keeper pour docs/WEBSITE_ARCHITECTURE.md.
- Ne modifie ni la page 404, ni la page organisateur, ni styles.min.css.

Validation avant de rendre la main :
- npm run build:css et npm test passent.
- Captures Playwright à 1440×1180, 820×1180 et 390×844 (pleine page), comparées aux images de visuals/.
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
