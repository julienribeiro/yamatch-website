# Prompt à donner à l'agent IA

À coller dans une session Claude Code ouverte sur
`julienribeiro/yamatch-website`. Avant de l'envoyer, déposer les vraies stories
dans `website/assets/stories/` (voir `SPEC.md` §3) et compléter la liste
entre crochets.

```text
Ajoute la section de preuve sociale « Vu dans les stories » à la page d'accueil (website/index.html), validée par le founder. Elle se place entre « Comment ça marche » (#how-it-works) et les tournois publics (#derniers-tournois).

Tout est sur la branche `claude/intelligent-gates-tdhv16`. Le hero V2 et « Comment ça marche » V2 y sont déjà implémentés, et la section tournois peut l'être aussi. Pars de l'état actuel de la branche et ne modifie pas les autres sections.

Avant toute action :
1. Récupère la branche (git fetch origin claude/intelligent-gates-tdhv16 && git checkout claude/intelligent-gates-tdhv16 && git pull).
2. Lis en entier CLAUDE.md, docs/handoff/README.md, docs/handoff/stories-v2/README.md et SPEC.md, puis docs/WEBSITE_ARCHITECTURE.md.
3. Regarde les rendus cibles dans docs/handoff/stories-v2/visuals/ et les maquettes dans stories-v2/mockup/. Ne copie pas leurs styles inline : passe par des tokens :root et une nouvelle sous-section de styles.css.

RÈGLE ABSOLUE : aucun contenu inventé. Les textes entre crochets des maquettes ne doivent jamais apparaître dans le site. N'utilise que les stories réelles listées ci-dessous, avec leurs fichiers dans website/assets/stories/.

Stories réelles fournies (accord écrit obtenu) :
[COLLER ICI, une ligne par story : fichier média · texte alternatif · Prénom N. · rôle · phrase · avatar éventuel · lien Instagram éventuel · mise en avant oui/non]
[S'il y en a moins de 3 : implémente la section avec l'attribut hidden, sans aucune story dans le DOM, et crée website/assets/stories/README.md qui décrit les fichiers attendus.]

Décisions du founder (SPEC §8) :
- S2 (lien vers le post Instagram d'origine) : [OUI SI FOURNI (DÉFAUT) / NON]
- S3 (place) : entre « Comment ça marche » et les tournois publics.
- S4 (lien dans le header) : [NON (DÉFAUT) / OUI]

Ce qu'il faut livrer (détails dans le SPEC §4 à §7) :
- Bloc gris clair arrondi avec le terrain de volley en filigrane très discret, badge « Ils jouent sur Yamatch », H2 Frick « VU DANS / LES STORIES » (surligné lime), pill « @yamatch_app » vers https://www.instagram.com/yamatch_app/.
- Rail horizontal de stories 9:16 avec scroll-snap, qui déborde jusqu'au bord droit du bloc, focusable au clavier.
- Story : média plein cadre, barres de progression décoratives, avatar et prénom, pastille lime du rôle, phrase en Frick, bordure lime sur la story mise en avant.
- Vidéos seulement si fournies : muted, loop, playsinline, poster, lecture uniquement à l'écran, bouton pause, rien en mouvement réduit.
- id="temoignages", marge d'ancre adaptée au header fixe.

Façon de travailler :
- Tu es orchestrateur, comme le demande CLAUDE.md. Commence par « Analysis: » puis « Delegation: », et délègue selon le SPEC §9 :
  - html-expert pour index.html ;
  - css-expert pour styles.css ;
  - js-expert pour script.js, seulement s'il y a des vidéos ;
  - website-reviewer pour la revue ;
  - doc-keeper pour docs/WEBSITE_ARCHITECTURE.md.
- Ne modifie pas styles.min.css.

Validation avant de rendre la main :
- npm run build:css et npm test passent.
- Captures Playwright de la section à 1440, 820 et 390 px, comparées aux images de visuals/. Captures de la page complète avant/après : les autres sections sont inchangées.
- grep : aucun « [ » de placeholder ni texte fictif dans la section.
- Tous les critères du SPEC §10 sont vérifiés un par un. Liste ceux qui ne passent pas, avec la raison.
- website-reviewer rend un verdict PASS.
- Dépose les captures et un court rapport dans docs/handoff/stories-v2/implementation/.

Livraison :
- Commit sur la branche claude/intelligent-gates-tdhv16, puis push.
- Pas de merge sur main : un push sur main publie le site en production.
- Mets à jour la PR en draft de la branche (ou ouvre-en une), avec les captures et le résultat des critères.
```
