# Prompt final — section « Tous les tournois de la plateforme »

Le hero V2 et « Comment ça marche » V2 sont déjà implémentés sur la branche
`claude/intelligent-gates-tdhv16`. Ce prompt lance la **dernière section**,
les tournois publics en version « terrain gris clair ».

À coller dans une session Claude Code ouverte sur
`julienribeiro/yamatch-website`, après avoir remplacé les lignes de décision
entre crochets.

```text
Implémente la refonte de la section des tournois publics de la page d'accueil (website/index.html, section.showcase#derniers-tournois, variante participant), validée par le founder : version « terrain gris clair ». Elle remplace « À l’affiche et déjà joués ».

Tout est sur la branche `claude/intelligent-gates-tdhv16`. Le hero V2 et « Comment ça marche » V2 y sont DÉJÀ implémentés : pars de cet état, ne les modifie pas et garde leur cohérence (header fixe, tokens, Frick incliné, lime).

Avant toute action :
1. Récupère la branche et pars de son état actuel (git fetch origin claude/intelligent-gates-tdhv16 && git checkout claude/intelligent-gates-tdhv16 && git pull).
2. Lis en entier CLAUDE.md, docs/handoff/README.md, docs/handoff/tournois-plateforme-v2/README.md et SPEC.md, puis docs/WEBSITE_ARCHITECTURE.md (sections Hero, How-quest, Public tournament rails) et les notes docs/handoff/*/implementation/README.md des deux sections déjà livrées.
3. Regarde les rendus cibles dans docs/handoff/tournois-plateforme-v2/visuals/ (desktop-1440, tablette-820, mobile-390) et les maquettes dans tournois-plateforme-v2/mockup/. Les données de démo sont des exemples. Ne copie pas les styles inline : passe par les tokens :root et §10.7 de styles.css.

Décisions du founder (SPEC.md §7) :
- T1 (nombre de tournois à venir) : [5 + CARTE CRÉATION (DÉFAUT) / AUTRE : …]
- T2 (prix dans le bouton des tickets) : [NON, « S’inscrire » (DÉFAUT) / OUI → lot backend séparé, hors de cette tâche]
- T3 (couleurs propres à chaque tournoi) : [DÉGRADÉ TEAL PAR DÉFAUT (DÉFAUT) / OUI → lot backend séparé, hors de cette tâche]

Ce qu'il faut livrer (détails dans le SPEC) :
- Bloc arrondi gris clair avec un terrain de volley en filigrane TRÈS discret (SVG décoratif, valeurs exactes du SPEC §3.1). En-tête : badge « Les tournois sur Yamatch », H2 Frick « ÇA SMASH » (surligné lime) / « PRÈS DE CHEZ TOI » (garde id="showcaseRailTitle"), introduction fun du SPEC §4.
- Tickets identiques au ticket de l'app (SPEC §3.2), avec les états ouvert, complet, inscriptions closes et sans capacité. Bouton « S’inscrire » lime, ou « Voir le tournoi » blanc.
- Carte statique « Ton prochain tournoi » toujours en dernier, avec le bouton « Créer mon tournoi → » vers organisateur/ (SPEC §3.3).
- Bandeau lime défilant « Ça s’est joué » pour les tournois passés (SPEC §3.4) : copie dupliquée aria-hidden, pause au survol et au focus, aucune animation en mouvement réduit.
- Plus de flèches précédent/suivant ni de lien « Tous les tournois dans l’app ». Marge d'ancre identique à #how-it-works et #faq, à cause du header fixe.
- Textes exactement ceux du SPEC §4.

Interdits :
- Ne change ni la RPC get_public_showcase, ni la validation, ni le cache, ni le chargement différé, ni le mode ?showcase=demo.
- La variante organizer (/organisateur/) doit rester strictement identique : isole le nouveau rendu (par ex. appTicket()) pour la variante participant.
- Ne touche ni au hero, ni à « Comment ça marche », ni à la FAQ et son parallax, ni au carrousel, ni à la 404. Ne modifie pas styles.min.css.

Façon de travailler :
- Tu es orchestrateur, comme le demande CLAUDE.md. Commence par « Analysis: » puis « Delegation: », et délègue selon le SPEC §8 :
  - html-expert pour index.html ;
  - js-expert pour script.js ;
  - css-expert pour styles.css ;
  - website-reviewer pour la revue ;
  - doc-keeper pour docs/WEBSITE_ARCHITECTURE.md.
- Chaque spécialiste commence son rapport par « Current State Summary » et « Verified safety greps ».

Validation avant de rendre la main :
- npm run build:css et npm test passent.
- Captures Playwright de la section avec ?showcase=demo à 1440, 820 et 390 px, comparées aux images de visuals/. Ajuste temporairement les données de démo pour vérifier les états complet, fermé, sans capacité et sans tournoi passé, puis remets-les comme avant.
- Captures de /organisateur/ et de la page d'accueil complète avant/après : organisateur identique, hero et « Comment ça marche » inchangés.
- Tous les critères du SPEC §9 sont vérifiés un par un. Liste ceux qui ne passent pas, avec la raison.
- website-reviewer rend un verdict PASS.
- Dépose les captures et un court rapport dans docs/handoff/tournois-plateforme-v2/implementation/, comme pour les deux sections déjà livrées.

Livraison :
- Commit sur la branche claude/intelligent-gates-tdhv16, puis push.
- Pas de merge sur main : un push sur main publie le site en production.
- Ouvre une PR en draft (ou mets à jour celle de la branche si elle existe), avec les captures avant/après et le résultat des critères.
```

Si l'outil utilisé n'a pas les agents spécialisés du dépôt, retirer la partie
« Façon de travailler » et demander à l'agent de faire le travail lui-même,
en respectant les mêmes fichiers et les mêmes contraintes.
