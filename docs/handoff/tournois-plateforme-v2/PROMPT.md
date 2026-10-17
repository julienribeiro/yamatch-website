# Prompt à donner à l'agent IA

À coller dans une session Claude Code ouverte sur
`julienribeiro/yamatch-website`, pour cette section seule. Le prompt global
des trois sections se trouve dans `../PROMPT.md`.

```text
Implémente la refonte de la section des tournois publics de la page d'accueil (website/index.html, section.showcase#derniers-tournois, variante participant), validée par le founder : version « terrain gris clair ».

Le dossier de passation est sur la branche `claude/intelligent-gates-tdhv16`, dans `docs/handoff/tournois-plateforme-v2/`.

Avant toute action :
1. Récupère cette branche et pars de son état actuel (git fetch origin claude/intelligent-gates-tdhv16).
2. Lis en entier CLAUDE.md, docs/handoff/tournois-plateforme-v2/README.md et SPEC.md, puis la section « Public tournament rails » de docs/WEBSITE_ARCHITECTURE.md.
3. Regarde les rendus cibles dans tournois-plateforme-v2/visuals/ (1440, 820, 390) et les maquettes dans mockup/. Ne copie pas leurs styles inline : passe par les tokens :root et §10.7 de styles.css.

Décisions du founder (SPEC.md §7) :
- T1 (nombre de tournois à venir) : [5 + CARTE CRÉATION (DÉFAUT) / AUTRE : …]
- T2 (prix dans le bouton) : [NON, « S’inscrire » (DÉFAUT) / OUI → lot backend séparé]
- T3 (couleurs propres à chaque tournoi) : [DÉGRADÉ TEAL PAR DÉFAUT (DÉFAUT) / OUI → lot backend séparé]

Points impératifs :
- Les tickets reproduisent le ticket de l'app (SPEC §3.2), avec les états ouvert, complet, fermé et sans capacité. La carte « Ton prochain tournoi » est statique et toujours en dernier (lien organisateur/). Les tournois passés défilent dans le bandeau lime « Ça s’est joué » (SPEC §3.4), sans animation en mouvement réduit.
- Garde exactement les textes du SPEC §4.
- Ne change ni la RPC, ni la validation, ni le cache, ni le chargement différé, ni le mode ?showcase=demo.
- La variante organizer (page /organisateur/) doit rester strictement identique.

Façon de travailler :
- Tu es orchestrateur, comme le demande CLAUDE.md. Commence par « Analysis: » puis « Delegation: », et délègue selon le SPEC §8 :
  - html-expert pour index.html ;
  - js-expert pour script.js ;
  - css-expert pour styles.css ;
  - website-reviewer pour la revue ;
  - doc-keeper pour docs/WEBSITE_ARCHITECTURE.md.
- Ne modifie pas styles.min.css.

Validation avant de rendre la main :
- npm run build:css et npm test passent.
- Captures Playwright de la section avec ?showcase=demo à 1440, 820 et 390 px, comparées à visuals/, et capture de /organisateur/ avant/après (identique).
- Tous les critères du SPEC §9 sont vérifiés un par un. Liste ceux qui ne passent pas, avec la raison.
- website-reviewer rend un verdict PASS.

Livraison :
- Commit sur la branche claude/intelligent-gates-tdhv16, puis push.
- Pas de merge sur main : un push sur main publie le site en production.
- Ouvre une PR en draft, avec les captures avant/après et le résultat des critères.
```
