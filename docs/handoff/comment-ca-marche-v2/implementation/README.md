# Comment ça marche V2 — implémentation

Date : 17 octobre 2026. Cette phase suit la livraison du hero avec écran discovery codé. Les documents et JPG du dossier restent les références de passation ; les décisions founder suivantes priment leurs propositions.

- **E1 confirmé :** les anciennes cartes parallax équipe/score du parcours sont remplacées par des illustrations intégrées à leurs cartes d’étape. Le badge parallax de la FAQ est conservé. Les trois nouvelles décorations sont `aria-hidden` et visibles aussi sur mobile.
- **E2 confirmé :** aucun bandeau « Prêt à jouer ? », texte de gratuité ou doublon de boutons stores en fin de section. Cette différence aux JPG est intentionnelle.

Les trois articles conservent les textes participant et ajoutent les fragments codés `tournament`, `confirmation`, `ranking`, chacun dans une illustration `role="img"` nommée en français avec slot décoratif masqué. Les styles partagés sont dans `website/app-screens.css`, servis directement après le CSS généré ; aucune capture PNG de téléphone n’est utilisée dans ces cartes.

Les cartes sont visibles sans JavaScript. L’entrée progressive est activée seulement avec IntersectionObserver et sans réduction de mouvement : seuil .1, révélation unique, observation arrêtée après révélation ; un changement vers reduced motion révèle tout immédiatement. Les animations sont indépendantes du parallax FAQ ; le carrousel de captures a depuis été retiré de la page.

L’état architectural, les tokens et les dimensions sont décrits dans [WEBSITE_ARCHITECTURE.md](../../../WEBSITE_ARCHITECTURE.md). Les captures et le rapport du reviewer établissent la validation ; cette note ne constitue pas un verdict PASS.

## Actualisation des écrans — 18 octobre 2026

Les trois illustrations suivent désormais les composants Flutter du checkout `website-captures-20261015` à `4f6d88fe` ; les neuf fichiers de référence correspondent à `origin/main` à `c2fc0c42`. Avec discovery dans le hero, les quatre écrans codés utilisent cette référence applicative. Les fragments et JPG de passation restent historiques : les trois écrans HOW ne sont plus des copies exactes de leurs fragments initiaux.

- **Tournoi :** prix et menu à trois points dans l’en-tête ; prix/disponibilité séparés de « Payer » dans le pied. L’ancienne mention d’annulation à 48 h est supprimée.
- **Confirmation :** composition `SuccessScreen` sur fond lime, coche de 84 px, « INSCRIPTION CONFIRMÉE », « Rendez-vous sur le terrain ! », résumé sombre avec « Place réservée », puis « Inviter mon équipe » et « Voir mes tournois à venir ». L’ancien recto/verso du ticket, toast et détails de paiement/annulation sont retirés.
- **Classement :** nom du tournoi, « Suivre mon tournoi », onglets QG/Matchs/Classement, filtres Tableau général/Par poule et identité avec « Niveau non renseigné ». Les huit lignes illustratives existantes sont conservées ; les colonnes de points et de forme récente restent hors du cadre visible sans valeurs fabriquées.

Les cadres, échelles, textes des étapes et wrappers accessibles sont conservés. Les commandes dessinées restent décoratives et ne déclenchent aucune réservation ou navigation. Le hero Pop A2 et sa jauge ne sont pas modifiés par cette actualisation. Les nouvelles captures et la revue de ce lot doivent établir sa validation ; le verdict des rendus historiques ne vaut pas pour ces nouveaux écrans.
