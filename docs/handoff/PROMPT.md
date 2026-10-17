# Prompt final — refonte de la page d'accueil (3 sections)

À coller tel quel dans une session Claude Code ouverte sur
`julienribeiro/yamatch-website`. Remplacer d'abord les lignes de décision
entre crochets. Les prompts d'une seule section se trouvent dans
`*/PROMPT.md`.

```text
Implémente la refonte de trois sections de la page d'accueil (website/index.html), validée par le founder :
1. le hero participant (section.hero) ;
2. « Comment ça marche » (section.how-quest#how-it-works) ;
3. les tournois publics, version « terrain gris clair » (section.showcase#derniers-tournois, variante participant).

Tout est sur la branche `claude/intelligent-gates-tdhv16`, dans `docs/handoff/` :
- hero-participant-v2/ : passation du hero ;
- comment-ca-marche-v2/ : passation de « Comment ça marche » ;
- tournois-plateforme-v2/ : passation des tournois publics ;
- app-screens/ : écrans de l'app codés en HTML/CSS, utilisés par le hero et « Comment ça marche ».

Avant toute action :
1. Récupère cette branche et pars de son état actuel (git fetch origin claude/intelligent-gates-tdhv16).
2. Lis en entier CLAUDE.md, docs/handoff/README.md, puis le README et le SPEC de app-screens/ et de chaque section, et docs/WEBSITE_ARCHITECTURE.md (sections Hero, How-quest, Public tournament rails).
3. Regarde les rendus cibles dans */visuals/ (1440, 820 et 390 px) et les comparaisons dans app-screens/compare/.
4. Les maquettes de référence sont dans */mockup/. Ne copie pas leurs styles inline : passe par les tokens :root et les sections 7.x, 10.x et 10.7 de styles.css.

Décisions du founder (§8 de chaque SPEC, §7 pour les tournois) :
- D1 (téléphone du carrousel qui remonte sous le hero) : [GARDER LE DÉFAUT RECOMMANDÉ / AUTRE : …]
- D2 (wordmark fixe et centré → à gauche dans un header) : [GARDER LE DÉFAUT RECOMMANDÉ / AUTRE : …]
- D3 (cartes flottantes du hero) : [GARDER LES CARTES / VERSION SANS CARTES]
- E1 (supprimer les 2 cartes parallax de « Comment ça marche », garder celles de la FAQ) : [GARDER LE DÉFAUT RECOMMANDÉ / AUTRE : …]
- E2 (bandeau « Prêt à jouer ? » en fin de « Comment ça marche ») : [GARDER / RETIRER]
- T1 (nombre de tournois à venir) : [5 + CARTE CRÉATION (DÉFAUT) / AUTRE : …]
- T2 (prix dans le bouton des tickets) : [NON, « S’inscrire » (DÉFAUT) / OUI → lot backend séparé]
- T3 (couleurs propres à chaque tournoi) : [DÉGRADÉ TEAL PAR DÉFAUT (DÉFAUT) / OUI → lot backend séparé]

Points impératifs :
- Les téléphones du hero et de « Comment ça marche » sont les écrans HTML/CSS de docs/handoff/app-screens/screens/ (discovery ; tournament, confirmation, ranking), collés tels quels dans un cadre .ym-phone-slot / .ym-phone. Aucun <img> ni <picture> de capture. Leurs styles vont dans UN SEUL nouveau fichier website/app-screens.css, chargé après styles.min.css, en dehors de build:css, avec les chemins des polices corrigés en fonts/…. Le cadre porte aria-hidden="true", et son conteneur porte role="img" avec l'aria-label des SPEC.
- Les tickets de la section tournois reproduisent le ticket de l'app (SPEC tournois §3.2). La carte « Ton prochain tournoi » est toujours en dernier. Les tournois passés défilent dans le bandeau lime « Ça s’est joué ».
- Garde exactement les textes des SPEC (§4 de chacune). Ne change pas le H1 du hero, l'ancre #how-it-works ni les id howQuestTitle et showcaseRailTitle.
- Ne change ni la RPC des tournois, ni la validation, ni le cache, ni le mode ?showcase=demo.
- Ne casse ni la FAQ et son parallax, ni le carrousel, ni la page 404, ni la page organisateur (sa variante de rail doit rester identique). Ne modifie pas styles.min.css.

Façon de travailler :
- Tu es orchestrateur, comme le demande CLAUDE.md. Commence par « Analysis: » puis « Delegation: », et délègue selon les plans des SPEC :
  - html-expert pour index.html ;
  - css-expert pour styles.css et app-screens.css ;
  - js-expert pour script.js ;
  - website-reviewer pour la revue ;
  - doc-keeper pour docs/WEBSITE_ARCHITECTURE.md.
- Une section à la fois, dans l'ordre hero → « Comment ça marche » → tournois. Chacune est validée par website-reviewer avant de passer à la suivante.

Validation avant de rendre la main :
- npm run build:css et npm test passent.
- Captures Playwright de chaque section à 1440, 820 et 390 px (tournois avec ?showcase=demo), comparées aux images de */visuals/. Capture de /organisateur/ avant/après, qui doit être identique.
- Tous les critères d'acceptation des trois SPEC sont vérifiés un par un. Liste ceux qui ne passent pas, avec la raison.
- website-reviewer rend un verdict PASS pour chaque section.

Livraison :
- Un commit par section sur la branche claude/intelligent-gates-tdhv16, puis push.
- Pas de merge sur main : un push sur main publie le site en production.
- Ouvre une PR en draft, avec les captures avant/après et le résultat des critères.
```

Si l'outil utilisé n'a pas les agents spécialisés du dépôt, retirer la partie
« Façon de travailler » et demander à l'agent de faire le travail lui-même,
en respectant les mêmes fichiers et les mêmes contraintes.
