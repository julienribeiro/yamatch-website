# Prompt — section « Ça crie sur le terrain »

À coller dans Codex (ou toute session d'agent de code) ouverte sur
`julienribeiro/yamatch-website`, après avoir remplacé les lignes de
décision entre crochets.

```text
Implémente une nouvelle section de la page d'accueil du site Yamatch : « Ça crie sur le terrain » (direction « B — Le cri d'équipe », validée par le founder). Elle montre de vraies scènes de tournoi avec des humains : quatre photos verticales, chacune avec une phrase de joueur criée en Frick lime incliné.

Avant toute action :
1. Pars de l'état à jour de main dans une nouvelle branche (ne travaille jamais directement sur main : un push sur main publie le site en production).
2. Lis en entier docs/handoff/cri-equipe-v1/README.md et SPEC.md, puis CLAUDE.md (conventions du dépôt) et docs/WEBSITE_ARCHITECTURE.md (sections Hero, How-quest, Public tournament rails, Stories).
3. Regarde les rendus cibles dans docs/handoff/cri-equipe-v1/visuals/ (desktop-1440, tablette-820, mobile-390) et la maquette docs/handoff/cri-equipe-v1/mockup/section.html. Ne copie pas les styles de la maquette tels quels : passe par des tokens --shouts-* dans :root et une sous-section 10.8 de website/styles.css.

Décisions du founder (SPEC.md §8) :
- M1 (photos) : [PHOTOS PROVISOIRES DU SPEC §2 (DÉFAUT) / PHOTOS DÉFINITIVES FOURNIES dans website/assets/moments/]
- M2 (cible du CTA) : [download/ (DÉFAUT) / AUTRE : …]
- M3 (lien dans le header) : [NON (DÉFAUT) / OUI]

Ce qu'il faut livrer (détails dans le SPEC) :
- Dans website/index.html, juste après section.how-quest#how-it-works et avant section.stories#temoignages (masquée), la section section.shouts#moments du SPEC §5, avec les textes exacts du §2 et les textes alternatifs du §5.
- Dans website/styles.css : tokens du §6, sous-section « 10.8 Shouts » (et table des matières), design desktop/tablette/mobile du §4, marge d'ancre de #moments sous le header fixe.
- Mise à jour de docs/WEBSITE_ARCHITECTURE.md.

Interdits :
- Aucun JavaScript : ne modifie pas script.js ni carousel.js.
- Ne modifie pas styles.min.css (sortie de build ignorée par git).
- Ne touche ni au hero, ni à « Comment ça marche », ni aux stories, ni aux tournois, ni à la FAQ et son parallax, ni à la 404, ni à la page organisateur.
- Aucun prénom, nom d'équipe ou citation attribuée : les phrases sont illustratives.
- Aucun hex en dur hors de :root.

Validation avant de rendre la main :
- npm run build:css et npm test passent.
- Captures Playwright de la section à 1440, 820 et 390 px, comparées aux images de visuals/. Captures de la page complète avant/après : les autres sections sont inchangées. Aucun défilement horizontal de 320 à 1920 px.
- Tous les critères du SPEC §9 vérifiés un par un. Liste ceux qui ne passent pas, avec la raison.
- Dépose les captures et un court rapport dans docs/handoff/cri-equipe-v1/implementation/.

Livraison :
- Commit et push sur ta branche, puis ouvre une PR en draft vers main avec les captures et le résultat des critères.
- Pas de merge sur main sans GO du founder.
```
