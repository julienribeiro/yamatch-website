# Hero participant V2 — décisions d’implémentation

Date : 17 octobre 2026. Les documents `../README.md`, `../SPEC.md`, maquettes et JPG sont conservés comme dossier de passation initial. Les décisions suivantes, confirmées ensuite par le founder, priment leurs indications contradictoires.

## Décisions acceptées

- **D1 :** carrousel normal sous le hero, sans remontée du téléphone actif. `script.js` initialise `--scroll: 0px`, `--active-scale: 1` et `data-horizontal-ready="true"`. La machine de gestes de `carousel.js` est conservée.
- **D2 :** header fixe, logo à gauche et navigation à droite, réunis dans une seule pill qui occupe la largeur disponible au scroll. `.hero-header.is-condensed` s’active après 30 px ; `pageshow` resynchronise son état. Le logo reste un lien `#top`.
- **D3 :** cartes décoratives conservées ; ticket, score d’exemple et phase finale sur desktop/tablette, score seul sur mobile. Elles sont masquées aux lecteurs d’écran.
- **Suppression demandée :** « Compose ton équipe, il y a match. » et toute réassurance du hero (« App gratuite », « Paiement sécurisé par Stripe », « Apple Pay & Google Pay »), y compris la version mobile condensée. Le H1 reste inchangé.

## Écarts intentionnels aux cibles initiales

Les JPG montrent encore le sous-titre et la réassurance retirés : leur absence et la nouvelle répartition verticale ne sont pas des régressions. Le header fixe avec pill commune remplace le header statique recommandé initialement. Le lien organisateur reste visible sur tablette, conformément au §3.2 de la SPEC, même si sa maquette le masque. La variante desktop sans cartes est écartée par D3.

Les règles et tokens actuels sont documentés dans [WEBSITE_ARCHITECTURE.md](../../../WEBSITE_ARCHITECTURE.md). Les captures et le rapport de validation accompagnent la livraison ; la présence de ce document ne vaut pas verdict de validation.

## Ajustements de revue

Les cibles de navigation mesurent au minimum 44 × 44 px. Les ancres FAQ et parcours réservent la hauteur du header plus 16 px afin de rester visibles sous la pill. Le petit texte Google Play est blanc opaque ; celui de l’App Store reste noir sur lime. Le rapport séparé `VALIDATION.md` est établi par le reviewer après ses vérifications.
