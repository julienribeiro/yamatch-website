# Pop A2 — validation

Date : 18 octobre 2026. **Verdict final : PASS.** Référence : snapshot local `/tmp/pop-a2-before`, capturé avant Pop A2 et incluant les ajustements antérieurs non encore commités. Architecture et README synchronisés, y compris l’observateur du hero au seuil 0.

## Préflight

Les quatre auteurs HTML, CSS partagé, CSS des écrans et JS ont fourni **Current State Summary** et **Verified safety greps**. Les preuves couvrent les trois hooks de jauge uniques, le relief séparé, les consommateurs des nouveaux tokens, les règles limitées au hero, les mesures du scroll existant et l'absence de modifications des écrans HOW. Les rapports de doc-keeper ont également été reçus.

## Critères demandés

| Critère | Résultat |
|---|---|
| Pose desktop/tablette exacte | **PASS** — `translate(-70px,-36px) rotate(-7deg) scale(1.2)` dans le repère logique du téléphone, origine centrale. Matrice Chrome confirmée aux deux tailles. Aucun ajustement intermédiaire n'a été nécessaire à 1024 px. |
| Double ombre exacte | **PASS** — `drop-shadow(0 34px 40px rgba(0,0,0,.55))` puis `drop-shadow(0 0 30px rgba(215,255,0,.22))`, confirmées en styles calculés. |
| Original masqué et emplacement conservé | **PASS** — original présent avec `visibility:hidden`, silhouette à (18,218), 353 × 281, rayon 24, fond rgba(16,24,40,.08), bordure 2 px pointillée rgba(16,24,40,.25). |
| Copie décorative accessible | **PASS** — copie explicitement `aria-hidden`, illustration globale toujours dotée de son libellé français inchangé ; chiffres sans `aria-live`, aucune nouvelle cible interactive. |
| Adaptation mobile | **PASS** — translation réduite à (−18,−18), rotation et échelle conservées ; carte contenue dans la largeur de l'écran aux tailles inspectées. |
| Absence d'overflow et de collision | **PASS** — 1 601 largeurs entières, de 320 à 1920 px : zéro débordement horizontal et zéro intersection entre le polygone réel de la carte inclinée et les rectangles des lignes du H1, du paragraphe ou des deux boutons. Vérification visuelle complémentaire à 320, 390, 820, 1024, 1280, 1440 et 1920. |
| Compteur 27 → 33 | **PASS** — six pas de +1 espacés de 1 400 ms, puis arrêt à 33/36 ; jamais « Complet ». Captures initiales à 27 et finales à 33 aux trois tailles. |
| Restants et remplissage | **PASS** — 9 → 3 équipes restantes ; branche singulière présente pour la valeur 1, non atteinte par cette séquence. Largeur finale 91,6667 %, initiale sans JS 75 %. |
| Transition de jauge | **PASS** — largeur seule, 600 ms `cubic-bezier(.2,.8,.2,1)` mesurée dans Chrome. |
| Départ visible et exécution unique | **PASS** — IntersectionObserver sur `section.hero`, seuil 0, départ sur `isIntersecting`, puis déconnexion ; téléphone uniquement en secours si le hero manque. Pas de redémarrage après la fin. |
| Pause en onglet caché | **PASS** — harness VM exécutant le bloc JS réel : pause après 700 ms, conservation des 700 ms restantes, reprise sans remise à zéro. Un seul timeout actif et nettoyage des écouteurs/observateur à la fin. |
| Mouvement réduit | **PASS** — état final 33 immédiat au chargement ou lors d'un changement de préférence ; aucun timer de progression et transition calculée à 0 s. Pose statique Pop A2 conservée. |
| Sans JavaScript | **PASS** — navigateur avec JS désactivé : 27/36, 9 restantes et remplissage 234,75/313 px, soit 75 %. |
| Autres éléments inchangés | **PASS** — HTML après le hero identique au snapshot ; comparaison HOW, tournois et FAQ aux trois tailles sans changement de géométrie. Détails ci-dessous. |
| Build et tests | **PASS** — `npm run build:css`, `npm test` 15/15, syntaxe JS passent (auteurs/orchestrateur). `git diff --check` et harness de jauge repassés en revue. |

Aucun critère non satisfait.

## Captures

| Taille | Avant | Initial 27 | Final 33 | Mouvement réduit |
|---|---|---|---|---|
| 1440 × 900 | [Avant](before/hero-1440.png) | [Initial](after-initial/hero-1440.png) | [Final](after-final/hero-1440.png) | [Réduit](reduced/hero-1440.png) |
| 820 × 1180 | [Avant](before/hero-820.png) | [Initial](after-initial/hero-820.png) | [Final](after-final/hero-820.png) | [Réduit](reduced/hero-820.png) |
| 390 × 844 | [Avant](before/hero-390.png) | [Initial](after-initial/hero-390.png) | [Final](after-final/hero-390.png) | [Réduit](reduced/hero-390.png) |

Contrôles supplémentaires : [320 px](reduced/hero-320.png), [1024 px](reduced/hero-1024.png), [1280 px](reduced/hero-1280.png), [1920 px](reduced/hero-1920.png).

## Preuves et méthode

- [Navigateur : matrices, ombres, compteur, transition, géométrie](evidence/browser.json).
- [Sans JavaScript](evidence/no-js.json).
- [Harness VM : pause, reprise, fin, cleanup et reduced motion](evidence/gauge-vm.txt).
- [Comparaison des autres sections](evidence/regression.json).

Chrome via Playwright, polices chargées. L'horloge de test est maîtrisée pour capturer 27 puis 33 ; les animations d'entrée préexistantes sont terminées uniquement pour la capture. Le test du compteur utilise le bloc réel extrait de `script.js`, sans réécriture de l'implémentation. L'absence d'erreurs JavaScript est constatée aux trois tailles.

La vérification géométrique utilise le rectangle réel 353 × 281 transformé (échelle de téléphone, rotation du téléphone et rotation Pop A2), puis un test de séparation des polygones contre les rectangles des lignes de texte. Une simple intersection des boîtes englobantes à 1024 px serait un faux positif : le coin vide de la boîte inclinée n'est pas la carte. Les captures confirment l'absence de recouvrement des glyphes et CTA. Les ombres décoratives ne sont pas traitées comme une surface opaque de carte.

Les comparaisons de non-régression utilisent les sources sauvegardées avant Pop A2, servies par interception locale, pas le HEAD Git. Date figée au 18 octobre 2026 à 12:00 UTC et mode démo des tournois. Header, QR et décoration FAQ sont masqués uniquement dans les captures de comparaison des sections. HOW et FAQ sont identiques pixel par pixel aux trois tailles ; tournois également à 1440 et 820 px. À 390 px, l'écart moyen est de 0,000028 par canal sur 255, sans différence de dimensions : rasterisation négligeable. Les captures sont dans `regression-before/` et `regression-after/`.

La jauge reste une animation illustrative du hero, sans lecture ni modification de données de tournoi réelles.
