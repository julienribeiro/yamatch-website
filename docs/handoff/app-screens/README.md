# Écrans de l'app codés en HTML/CSS

Copies conformes, en HTML/CSS, des écrans de l'app Flutter Yamatch. Le site
marketing les affiche à la place des captures PNG : texte net à toutes les
tailles, pas de flou de compression, et facile à mettre à jour quand l'app
change.

Ce dossier est **partagé** par les passations `hero-participant-v2` et
`comment-ca-marche-v2`.

## Écrans

| Nom | Capture d'origine | Contenu | Utilisé par |
|---|---|---|---|
| `discovery` | `website/assets/screens/screen_1.png` | Accueil « Prochains tournois » | hero |
| `tournament` | `screen_2.png` | Fiche tournoi avant paiement | comment ça marche, étape 01 |
| `confirmation` | `screen_3.png` | Réservation confirmée | comment ça marche, étape 02 |
| `ranking` | `screen_4.png` | Suivre mon tournoi › Rang | comment ça marche, étape 03 |

`compare/<nom>.png` montre l'original et la version codée côte à côte.

## Structure

```
app-screens/
├── css/app-tokens.css     tokens AppColors / AppFontSizes de l'app (variables --ym-*), polices
├── css/phone-frame.css    cadre iPhone, status bar, Dynamic Island, mise à l'échelle
├── screens/_statusbar.html bloc status bar à recopier en tête d'écran
├── screens/<nom>.html     fragment de l'écran (racine .ym-app.ym-screen.ym-screen--<nom>)
├── screens/<nom>.css      styles de l'écran, tous préfixés .ym-screen--<nom>
├── preview/<nom>.html     écran seul dans son cadre (généré)
├── compare/<nom>.png      original vs codé (généré)
└── tools/
    ├── build-previews.mjs    génère preview/
    ├── compare.mjs           génère compare/
    ├── assemble-mockups.mjs  insère les écrans dans ../*/mockup/src/*.html → ../*/mockup/*.html
    └── render-visuals.mjs    régénère ../*/visuals/*.jpg
```

## Contrat d'un écran

- Taille logique **390 × 844 pt** (iPhone 14/15). Le cadre `.ym-phone` fait
  414 × 868 px.
- Pour l'afficher plus petit, utiliser `.ym-phone-slot` avec
  `--ym-phone-scale`. Le slot réserve la place réelle, la mise en page
  interne ne change pas.
- **Contenu** : ce que montre la capture d'origine. **Style** : le code
  Flutter (`yamatch/lib/...`, `AppColors`, `AppFontSizes`, `AppTheme`).
- Texte réel, Roboto pour les titres, Inter pour le corps. Icônes en SVG
  inline. Aucune ressource externe, aucun JavaScript, aucun élément
  interactif : c'est une illustration.
- Sur le site, le cadre complet porte `aria-hidden="true"`. Son conteneur
  porte `role="img"` et un `aria-label` qui décrit l'écran.
- CSS isolé : chaque sélecteur commence par `.ym-screen--<nom>`, les
  classes internes ont un préfixe propre à l'écran. Aucun risque de
  collision avec `styles.css`.

## Commandes

```bash
cd docs/handoff/app-screens
node tools/build-previews.mjs        # écrans seuls → preview/
node tools/compare.mjs [nom]         # original vs codé → compare/
node tools/assemble-mockups.mjs      # écrans → maquettes des passations
node tools/render-visuals.mjs        # maquettes → visuals/*.jpg
```

Ces outils utilisent Playwright. Ils cherchent `require('playwright')`, puis
`/opt/node-tools/node_modules/playwright`. La variable `CHROMIUM_PATH` permet
d'indiquer un autre Chromium.

## Intégration dans `website/`

Voir le §« Écrans codés » de chaque `SPEC.md`. En résumé :

1. Copier `css/app-tokens.css`, `css/phone-frame.css` et les `screens/*.css`
   utiles dans un fichier `website/app-screens.css`. Corriger les chemins
   des polices en `fonts/…`. Ce fichier est chargé après `styles.min.css`,
   en dehors de `build:css`, comme `organisateur/hero-organisateur.css`.
2. Coller le fragment HTML de l'écran dans `index.html`, à l'endroit du
   `<picture>`.
3. Le passer dans `build:css` est possible, mais il faut alors vérifier que
   lightningcss conserve bien les variables.

## Mettre à jour un écran quand l'app change

Refaire une capture, la placer dans `website/assets/screens/`, modifier
`screens/<nom>.html` et `.css`, lancer `compare.mjs` jusqu'à obtenir un
rendu identique, puis `assemble-mockups.mjs` et `render-visuals.mjs`.
