# Hero participant V2 — décisions d’implémentation

Date : 17 octobre 2026. Cette étape livre le hero participant avec son écran discovery codé, conformément au §5 bis de la SPEC actualisée, et conserve les décisions complémentaires du founder ci-dessous.

## Écran codé — phase hero

Le téléphone du hero reprend le fragment `docs/handoff/app-screens/screens/discovery.html` dans `.hero-phone[role="img"]`, avec un libellé français. Le slot `.ym-phone-slot[aria-hidden="true"]` contient le cadre et le fragment illustratif ; les contrôles dessinés dans l’écran ne sont pas interactifs. Les corrections de SVG décoratifs sont effectuées dans le fragment source avant copie.

`website/app-screens.css`, chargé après `styles.min.css` et servi hors `build:css`, contient les tokens `--ym-*`, le cadre et les styles discovery. Les polices Inter/Roboto utilisent les fichiers locaux `fonts/`. Le cadre de 414 × 868 px contient un écran de 390 × 844 px ; le slot réserve ses dimensions après échelle (.8696 desktop/tablette, .5556 mobile, soit environ 360/230 px de largeur). Le téléphone n’utilise plus de capture PNG/WebP/AVIF ; la photo de fond conserve ses préchargements.

La première livraison reposait sur `e0f733e` et une image `screen_1`. La demande distante de téléphone HTML/CSS, reçue lors de la synchronisation des commits `236b294`/`f8f886d`, est désormais implémentée dans cette phase. Les résultats de validation antérieurs ne valent pas validation automatique de ce nouveau rendu : le reviewer vérifie cette étape séparément. La refonte « Comment ça marche » n’appartient pas à cette phase hero.

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
