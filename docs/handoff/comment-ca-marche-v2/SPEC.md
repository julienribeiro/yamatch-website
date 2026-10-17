# SPEC — « Comment ça marche » V2

> Statut : maquette validée par le founder le 17/10/2026, **non implémentée**.
> Cible : `website/index.html` (`section.how-quest#how-it-works`) +
> `website/styles.css` §10 (+ `website/script.js` pour les cartes parallax).
> Référence visuelle : `visuals/*.jpg` · maquettes : `mockup/*.html` ·
> écrans codés : `../app-screens/`.
> Section voisine : le hero V2 (`../hero-participant-v2/SPEC.md`), même
> langage visuel. Les deux peuvent être livrés séparément.

## 1. Objectif

Reprendre les trois étapes actuelles (Recherche, Inscription, Le jour J) dans
le style du hero V2 : grandes cartes sombres ou lime, titre Frick incliné, un
**vrai écran de l'app** par étape, et une conversion en fin de section
(« Prêt à jouer ? » avec les boutons stores).

## 2. Ce qui existe aujourd'hui (à lire avant de coder)

| Élément | Où | Notes |
|---|---|---|
| Section | `website/index.html` ~l. 390-475 | `section.how-quest#how-it-works` > `.how-quest-inner` > `.how-quest-header` (eyebrow « Parcours », `h2#howQuestTitle`, `p.quest-organiser-link`) + `.quest-steps` (3 × `article.quest-step` : numéro, tag, h3, texte) |
| Cartes flottantes | même section, 2 × `.floating-card-parallax` (`data-card-id="3"` équipe, `"2"` scoreboard) | Parallax piloté par `script.js` (~l. 630-710, `data-parallax-speed`, `--parallax-y`). D'autres cartes flottantes vivent dans `.faq` : **ne pas y toucher** |
| Styles | `website/styles.css` §10.1 à §10.5 (~l. 1240-1600) | Grille éditoriale à 3 colonnes séparées par des filets |
| Doc | `docs/WEBSITE_ARCHITECTURE.md` § « How-quest » | À mettre à jour |
| Ancre | `#how-it-works` | Utilisée par le hero V2 et le sitemap : **à conserver** |

## 3. Design cible

### 3.1 Desktop (≥ 1024 px) — `visuals/desktop-1440.jpg`

- **En-tête** sur deux colonnes, alignées en bas :
  - à gauche : badge « Parcours · 3 étapes » (fond `--color-light-gray`,
    point noir avec halo lime), H2 Frick incliné 84 px « COMMENT ÇA
    MARCHE » où « ça marche » est **surligné en lime** (fond lime, texte
    noir), puis une phrase d'introduction ;
  - à droite : la pill sombre « T'es organisateur ? C'est par ici → »,
    avec la flèche en lime.
- **Trois cartes** en grille (`repeat(3, minmax(0,1fr))`, gap 20 px),
  rayon 32 px, hauteur minimale 640 px, `overflow: hidden` :
  - 01 et 03 : fond sombre « ticket » (dégradé `#2A2A2A → #1A1A1A → #000`
    et halo lime en haut à droite, déjà disponible en tokens
    `--showcase-ticket-bg` et `--showcase-ticket-glow`) ;
  - 02 : fond `--color-accent`, texte noir ;
  - haut de carte : numéro Frick 56 px incliné (lime sur fond sombre, noir
    sur lime), pill d'étiquette à droite, titre 30 px / 700, texte
    16 px ;
  - bas de carte : **écran de l'app codé** (largeur 270 px, échelle
    0,6522), légèrement penché (−3°, +3°, −3°) et coupé par le bas de la
    carte ;
  - une carte flottante décorative par étape, qui chevauche le téléphone.
- **Bandeau de fin** sombre, rayon 32 px : « PRÊT À **JOUER** ? » en Frick
  (« jouer » en lime), « Télécharge Yamatch, c'est gratuit. », puis les
  deux boutons stores au même style que le hero V2 (App Store lime plein,
  Google Play en verre).

### 3.2 Tablette (768-1023 px) — `visuals/tablette-820.jpg`

Cartes empilées sur une colonne, en-tête et bandeau de fin empilés. Les
cartes gardent 640 px de haut ; le téléphone peut être un peu plus grand si
la largeur le permet (facultatif).

### 3.3 Mobile (≤ 767 px) — `visuals/mobile-390.jpg`

- Gouttière 16 px (respecter `--mobile-hero-card-margin` : utiliser ce token
  plutôt qu'un 16 px en dur).
- H2 48 px sur deux lignes : « COMMENT » / « ÇA MARCHE » (surligné).
- Pill organisateur sous l'introduction, alignée à gauche.
- Cartes de 560 px de haut, rayon 28 px, téléphone à 210 px (échelle
  0,5072).
- Bandeau de fin centré, boutons côte à côte de même largeur (50 px de
  haut).

## 4. Contenus (copie exacte, français, registre « tu »)

| Élément | Texte | Statut |
|---|---|---|
| Badge | `Parcours · 3 étapes` | nouveau |
| H2 | `Comment ça marche` (garder `id="howQuestTitle"`) | inchangé |
| Introduction | `De la recherche au tableau final, tout se passe dans l’app. Trois étapes, et tu n’as plus qu’à jouer.` | nouveau |
| Lien organisateur | `T’es organisateur ? C’est par ici →` → `organisateur/` | inchangé |
| Étape 01 | tag `Recherche` · titre `Trouve un tournoi` · texte actuel inchangé | inchangé |
| Étape 02 | tag `Inscription` · titre `Inscris ton équipe` · texte actuel inchangé | inchangé |
| Étape 03 | tag `Le jour J` · titre `Place au jeu` · texte actuel inchangé | inchangé |
| Carte flottante 01 | icône pin + `Autour de toi` | nouveau |
| Carte flottante 02 | `MON ÉQUIPE · 4/4` + avatars Léa, Tom, Sami, `MOI` | reprise de la carte actuelle |
| Carte flottante 03 | `MATCH 2 · POULE`, `MON ÉQUIPE 25`, `TEAM RIVAL 17`, pill `Victoire` avec **icône trophée SVG** (plus d'emoji 🏆) | reprise de la carte actuelle |
| Bandeau | `Prêt à jouer ?` · `Télécharge Yamatch, c’est gratuit.` · boutons stores | nouveau |

Les textes « nouveau » ont été validés avec la maquette. N'ajouter aucune
autre affirmation (pas de chiffres, pas d'avis).

## 5. Écrans codés (pas d'images PNG)

Les téléphones ne sont **pas** des captures : ce sont les écrans HTML/CSS de
`../app-screens/` (copies conformes de l'app Flutter).

| Étape | Écran | Description pour `aria-label` |
|---|---|---|
| 01 | `tournament` | `Aperçu de l’app — fiche d’un tournoi avec date, lieu et places restantes` |
| 02 | `confirmation` | `Aperçu de l’app — réservation confirmée et association de l’équipe` |
| 03 | `ranking` | `Aperçu de l’app — classement du tournoi en direct` |

Intégration (voir aussi `../app-screens/README.md`) :

```html
<div class="quest-step-phone" role="img" aria-label="Aperçu de l’app — …">
  <div class="ym-phone-slot" aria-hidden="true">       <!-- --ym-phone-scale réglé en CSS par breakpoint -->
    <div class="ym-phone">
      <!-- coller ici le contenu exact de app-screens/screens/tournament.html -->
    </div>
  </div>
</div>
```

- Charger `website/app-screens.css` (tokens + cadre + écrans utilisés), en
  le partageant avec le hero V2 s'il est déjà livré. Les polices `Inter` et
  `Roboto` sont déjà servies par `website/fonts/`.
- Régler `--ym-phone-scale` en CSS (`.quest-step-phone .ym-phone-slot`) :
  0,6522 sur desktop et tablette, 0,5072 sur mobile.
- **Ne pas modifier le markup des écrans** dans `index.html`. Toute
  correction se fait dans `app-screens/screens/*`, puis on recolle.
- Les écrans contiennent beaucoup de texte : vérifier que le `aria-hidden`
  est bien sur le cadre, pour que les lecteurs d'écran ne lisent que
  l'`aria-label`.

## 6. Design tokens

Réutiliser ceux du hero V2 s'ils existent déjà (`--hero-ink-muted`,
`--hero-glass-bg`, `--hero-float-shadow`, etc.). Sinon, les créer en suivant
ses noms (`../hero-participant-v2/SPEC.md` §6). À ajouter pour cette
section :

| Token | Valeur | Usage |
|---|---|---|
| `--how-card-radius` | `32px` (mobile `28px`) | Cartes et bandeau |
| `--how-card-min-height` | `640px` (mobile `560px`) | Cartes |
| `--how-card-dark-bg` | `var(--showcase-ticket-glow), var(--showcase-ticket-bg)` | Cartes 01, 03, bandeau |
| `--how-ink-muted-dark` | `rgba(255,255,255,.78)` | Texte sur carte sombre |
| `--how-ink-muted-lime` | `rgba(0,0,0,.78)` | Texte sur carte lime |
| `--how-intro-ink` | `#4A5565` | Introduction sur fond blanc (contraste AA) |
| `--how-title-size` | `clamp(3rem, 5.8vw, 5.25rem)` | H2, de 48 à 84 px |
| `--how-numeral-size` | `clamp(2.75rem, 3.9vw, 3.5rem)` | Numéros 01 à 03 |

## 7. Mouvement

- Au scroll (IntersectionObserver déjà présent ou CSS
  `animation-timeline` si supporté, sinon rien) : entrée des cartes en
  fondu et montée de 24 px, décalées de 80 ms ; téléphone avec 120 ms de
  retard supplémentaire.
- Cartes flottantes : plus de parallax. Les deux `.floating-card-parallax`
  de cette section **sont supprimées** : leur contenu passe dans les
  cartes d'étape. Vérifier que `script.js` fonctionne toujours avec les
  cartes restantes de la FAQ (`querySelectorAll` → aucun index en dur).
- `prefers-reduced-motion` : aucune animation.

## 8. Décisions à trancher (founder) — défauts recommandés

| # | Question | Défaut recommandé |
|---|---|---|
| E1 | Supprimer les deux cartes parallax de la section (équipe, scoreboard) au profit des cartes intégrées aux étapes ? | Oui. Garder celles de la FAQ. |
| E2 | Bandeau « Prêt à jouer ? » : il double les boutons du hero. | Le garder, c'est le dernier appel à l'action avant les tournois publics et la FAQ. |
| E3 | Écrans codés ou PNG ? | Écrans codés (demande founder du 17/10). Les PNG restent dans `assets/screens/` pour le carrousel tant qu'il existe. |

## 9. Plan de délégation (respecter `CLAUDE.md` du dépôt)

Chaque spécialiste commence par **Current State Summary** et **Verified
safety greps**.

1. **`html-expert`** — `index.html` : nouvelle structure de la section
   (`ol` de 3 `li` ou 3 `article`, au choix, avec un seul h2 et trois h3),
   badge, introduction, cartes flottantes (`aria-hidden`), écrans codés
   collés depuis `app-screens/screens/*.html`, bandeau de fin avec les
   liens stores (`data-cta="app-store-how"` / `"play-store-how"`, même URL,
   `target="_blank" rel="noopener"`). Suppression des deux
   `.floating-card-parallax` de la section. Ajout de
   `<link rel="stylesheet" href="app-screens.css">` après `styles.min.css`
   si absent.
2. **`css-expert`** — `styles.css` §10 : tokens (§6), réécriture de 10.1 à
   10.5 pour le nouveau design, responsive, mouvement ; création de
   `website/app-screens.css` à partir de `../app-screens/css/*` et des
   `screens/*.css` utilisés (chemins des polices corrigés). Ne pas casser
   §10.5 « floating cards », toujours utilisé par la FAQ.
3. **`js-expert`** — `script.js` : vérifier le parallax avec deux cartes
   en moins, ajouter si besoin l'entrée au scroll (§7), en respectant
   `reduceMotion`.
4. **`website-reviewer`** — revue 7 catégories + comparaison aux
   `visuals/` (1440, 820, 390).
5. **`doc-keeper`** — `docs/WEBSITE_ARCHITECTURE.md` § « How-quest » +
   tokens + nouveau fichier `app-screens.css` (section « Production
   build » : servi en dehors de `build:css`).

## 10. Critères d'acceptation

- [ ] Rendu conforme à `visuals/` à 1440, 820 et 390 px.
- [ ] Les trois téléphones sont des écrans HTML/CSS (aucun `<img>` de
      capture), identiques à `../app-screens/preview/*.html`.
- [ ] Ancre `#how-it-works`, `id="howQuestTitle"` et `aria-labelledby`
      conservés ; un seul h2, trois h3.
- [ ] Contraste ≥ 4.5:1 sur tous les textes (introduction `#4A5565` sur
      blanc, texte 78 % sur sombre ou lime).
- [ ] Cibles ≥ 44 px, focus lime visible sur les liens, ordre de tabulation :
      lien organisateur → App Store → Google Play.
- [ ] Les lecteurs d'écran ne lisent ni le contenu des écrans ni les cartes
      flottantes, seulement les `aria-label`.
- [ ] `prefers-reduced-motion` respecté. Le parallax de la FAQ fonctionne
      toujours.
- [ ] Aucune couleur brute hors `:root` dans `styles.css`. `app-screens.css`
      n'utilise que ses variables `--ym-*`.
- [ ] Pas de défilement horizontal de 320 à 1920 px.
- [ ] `npm run build:css` et `npm test` passent.
- [ ] `docs/WEBSITE_ARCHITECTURE.md` à jour.

## 11. Hors périmètre

Hero (voir sa propre passation), carrousel d'écrans, tournois publics, FAQ,
footer, page organisateur. **Pas de merge sur `main` sans GO du founder** :
un push sur `main` publie le site.
