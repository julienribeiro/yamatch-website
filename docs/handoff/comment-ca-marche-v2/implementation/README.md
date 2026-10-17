# Comment ça marche V2 — implémentation

Date : 17 octobre 2026. Cette phase suit la livraison du hero avec écran discovery codé. Les documents et JPG du dossier restent les références de passation ; les décisions founder suivantes priment leurs propositions.

- **E1 confirmé :** les anciennes cartes parallax équipe/score du parcours sont remplacées par des illustrations intégrées à leurs cartes d’étape. Le badge parallax de la FAQ est conservé. Les trois nouvelles décorations sont `aria-hidden` et visibles aussi sur mobile.
- **E2 confirmé :** aucun bandeau « Prêt à jouer ? », texte de gratuité ou doublon de boutons stores en fin de section. Cette différence aux JPG est intentionnelle.

Les trois articles conservent les textes participant et ajoutent les fragments codés `tournament`, `confirmation`, `ranking`, chacun dans une illustration `role="img"` nommée en français avec slot décoratif masqué. Les styles partagés sont dans `website/app-screens.css`, servis directement après le CSS généré ; aucune capture PNG de téléphone n’est utilisée dans ces cartes.

Les cartes sont visibles sans JavaScript. L’entrée progressive est activée seulement avec IntersectionObserver et sans réduction de mouvement : seuil .1, révélation unique, observation arrêtée après révélation ; un changement vers reduced motion révèle tout immédiatement. Les animations sont indépendantes du parallax FAQ et du carrousel.

L’état architectural, les tokens et les dimensions sont décrits dans [WEBSITE_ARCHITECTURE.md](../../../WEBSITE_ARCHITECTURE.md). Les captures et le rapport du reviewer établissent la validation ; cette note ne constitue pas un verdict PASS.
