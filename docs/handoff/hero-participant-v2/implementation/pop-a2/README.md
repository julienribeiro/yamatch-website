# Hero Pop A2 — ticket détaché et jauge illustrative

Date : 18 octobre 2026. Périmètre : première carte discovery et sa jauge uniquement ; le H1 droit, la source Flutter actuelle et les autres sections restent inchangés.

L’original reste masqué dans le téléphone, au-dessus d’un emplacement pointillé de 353 × 281 px à (18, 218). Sa copie `aria-hidden` utilise la pose desktop `translate(-70px,-36px) rotate(-7deg) scale(1.2)` et une translation mobile réduite. Les ombres et paramètres sont tokenisés dans `styles.css`, consommés par `app-screens.css`. L’illustration conserve son libellé accessible ; aucun contrôle du téléphone n’est interactif.

La séquence unique ajoute une inscription toutes les 1,4 s, de 27/36 à 33/36 ; les places restantes passent de 9 à 3 et la largeur de jauge suit le ratio avec transition de 600 ms. Elle démarre dès l’intersection de `section.hero` (seuil 0, téléphone en repli si la section est absente ; démarrage immédiat sans IntersectionObserver), conserve le temps restant lorsqu’un onglet est masqué et nettoie ses ressources à la fin. Reduced motion affiche immédiatement 33 ; sans JavaScript, le compteur initial 27 reste visible. Ce sont des données illustratives, sans appel réseau ni `aria-live`.

Le reviewer établit séparément les captures et le verdict de validation. Ce document décrit le comportement implémenté sans anticiper ce verdict. [Architecture](../../../../WEBSITE_ARCHITECTURE.md).
