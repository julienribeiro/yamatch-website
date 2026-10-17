# SPEC — Hero participant V2

> Statut : maquette validée par le founder le 17/10/2026, **non implémentée**.
> Cible : `website/index.html` (`section.hero`) + `website/styles.css` §7
> (+ `website/script.js` selon la décision D1).
> Référence visuelle : `visuals/*.jpg` · maquettes : `mockup/*.html`.

## 1. Objectif

Rendre le hero de la page d'accueil participant plus lisible et plus
« produit », sans changer l'identité : même photo volley, même titre Frick
incliné, mêmes boutons stores, même lime `#D7FF00`. Le hero doit dire en un
coup d'œil **ce qu'est Yamatch** (trouver, réserver, suivre ses matchs) et
**montrer l'app**.

## 2. Ce qui existe aujourd'hui (à lire avant de coder)

| Élément | Où | Notes |
|---|---|---|
| Structure hero | `website/index.html` ~l. 240-285 | `section.hero` > `button.wordmark.wordmark-link` (fixe, centré) + `.hero-card.hero-card--photo` > `.hero-card-inner` > `h1.hero-title` / `p.hero-subtitle` / `.hero-buttons` (2 × `a.btn-glass`) |
| Styles | `website/styles.css` §7.2 à §7.6 (~l. 600-900) | Photo peinte sur `.hero-card::before` ; `clip-path` piloté par `--card-shrink` |
| Couplage scroll | `website/script.js` ~l. 55-300 | `computeBaseLift()` mesure la position des boutons du hero pour faire remonter le téléphone actif du carrousel (`--scroll`) ; `--card-shrink` rétrécit la carte ; `.wordmark.is-condensed` après 30 px |
| Carrousel | `section.screens-rail` juste après le hero | Slide active (screen_2) remontée sous le hero via `--scroll` |
| Doc | `docs/WEBSITE_ARCHITECTURE.md` § « Hero », « Design tokens » | À mettre à jour (doc-keeper) |
| Partage | `.hero-card` est aussi utilisé par la 404 et la page organisateur | **Ne pas les casser** : toute nouveauté passe par `.hero-card--photo` ou de nouvelles classes |

## 3. Design cible

### 3.1 Desktop (≥ 1024 px) — `visuals/desktop-1440.jpg`

```
┌ header (hors carte) ─────────────────────────────────────────────┐
│ YAMATCH (wordmark, gauche)      Comment ça marche · FAQ · [T'es organisateur ? →] │
└──────────────────────────────────────────────────────────────────┘
┌ .hero-card--photo (radius 40, min-height ≈ 100svh − header − marges) ┐
│  colonne texte (≈ 57 %)              │  colonne visuel (≈ 43 %)      │
│  [● Volleyball · d'autres sports…]   │   ticket flottant (haut-gauche)│
│  TON PROCHAIN                         │   téléphone screen_1 incliné   │
│  TOURNOI T'ATTEND (lime)              │   −4°, coupé par le bas carte  │
│  Compose ton équipe, il y a match.    │   carte score lime (droite)    │
│  Trouve un tournoi près de chez toi…  │   pastille « phase finale »    │
│  [App Store lime] [Google Play verre] │                                │
│  ✓ App gratuite ✓ Stripe ✓ Wallets    │                                │
└─────────────────────────────────────────────────────────────────────┘
```

- Texte **aligné à gauche**, centré verticalement dans sa colonne.
- Dégradé de lisibilité **horizontal** (sombre à gauche) + assombrissement en
  bas, au lieu du dégradé vertical actuel.
- Le téléphone **sort par le bas** de la carte (débord coupé par
  `overflow: hidden`).

### 3.2 Tablette (768-1023 px) — `visuals/tablette-820.jpg`

Colonnes empilées : texte en haut, visuel dessous (hauteur visuel ≈ 520 px).
Titre ≈ 56 px. **Le lien organisateur reste visible** (la maquette le masque
sous 900 px : ne pas reproduire ce point).

### 3.3 Mobile (≤ 767 px) — `visuals/mobile-390.jpg`

- Header : wordmark à gauche, pill « Organisateur → » à droite (les liens
  « Comment ça marche » / « FAQ » disparaissent).
- Carte centrée, texte centré, titre sur 3 lignes (« TON PROCHAIN / TOURNOI /
  T'ATTEND »), ~46 px à 390 px.
- Pas de paragraphe secondaire (« Trouve un tournoi… ») ; ligne de
  réassurance condensée en une phrase.
- Boutons stores côte à côte, largeur égale (`flex: 1 1 0`), hauteur 50 px.
- Téléphone en bas, coupé par la carte ; une seule carte flottante (score).
- Image : `hero-volley-mixed-mobile.webp` (déjà servie aujourd'hui).
- Respecter les tokens `--mobile-hero-card-margin` (axe inline) et
  `--mobile-hero-card-margin-block` (axe bloc) : **ne pas les fusionner**.

## 4. Contenus (copie exacte, français, registre « tu »)

| Élément | Texte |
|---|---|
| Lien nav 1 | `Comment ça marche` → `#how-it-works` |
| Lien nav 2 | `FAQ` → `#faq` |
| Pill organisateur desktop | `T’es organisateur ?` + flèche `→` lime → `organisateur/` |
| Pill organisateur mobile | `Organisateur` + `→` |
| Badge au-dessus du titre | `Volleyball · d’autres sports arrivent` |
| H1 (**inchangé**, baseline sport-agnostique) | `Ton prochain tournoi t’attend`. Seul `t’attend` est en lime via un `<span>` |
| Sous-titre | `Compose ton équipe, il y a match.` |
| Paragraphe (desktop/tablette) | `Trouve un tournoi près de chez toi, réserve ta place en quelques secondes et suis tes matchs en direct le jour J.` |
| Boutons | inchangés (`Télécharger sur` / `App Store`, `Google Play`) |
| Réassurance desktop | `App gratuite` · `Paiement sécurisé par Stripe` · `Apple Pay & Google Pay` |
| Réassurance mobile | `Gratuite · Paiement sécurisé Stripe · Apple Pay & Google Pay` |
| Carte ticket | `17` / `MAI` · `Tournoi de la jeunesse` · `Milly-la-Forêt · 52 km` · `27/36 inscrits` · `9 équipes restantes` (repris de la capture screen_1) |
| Carte score | pastille `En cours` · `Match 3 · Terrain 2` · `21 – 18` (tiret demi-cadratin U+2013) |
| Pastille | icône trophée + `Ton équipe passe en phase finale` |

Toutes ces affirmations sont déjà présentes dans la FAQ du site. N'en ajouter
aucune autre (pas de chiffres, pas d'avis inventés). Libellé d'état :
toujours « En cours », jamais « Live » ni « Direct ».

## 5. Structure HTML proposée

Garder les classes existantes et ajouter des éléments. Exemple (à adapter par
`html-expert`) :

```html
<section class="hero">
  <header class="hero-header">
    <!-- wordmark : voir décision D2 -->
    <nav class="hero-nav" aria-label="Navigation principale">
      <a class="hero-nav-link" href="#how-it-works">Comment ça marche</a>
      <a class="hero-nav-link" href="#faq">FAQ</a>
      <a class="hero-nav-cta" href="organisateur/">
        <span class="hero-nav-cta-long">T’es organisateur&nbsp;?</span>
        <span class="hero-nav-cta-short">Organisateur</span>
        <span aria-hidden="true">→</span></a>
    </nav>
  </header>
  <div class="hero-card hero-card--photo">
    <div class="hero-card-inner hero-card-inner--split">
      <div class="hero-copy">
        <p class="hero-eyebrow"><span class="hero-eyebrow-dot" aria-hidden="true"></span>Volleyball · d’autres sports arrivent</p>
        <h1 class="hero-title"><span class="hero-title-slant">Ton prochain<br class="br-mobile-only"> tournoi <span class="hero-title-accent">t’attend</span></span></h1>
        <p class="hero-subtitle">Compose ton équipe, il y a match.</p>
        <p class="hero-lede">Trouve un tournoi près de chez toi, …</p>
        <div class="hero-buttons"><!-- 2 × a.btn-glass existants, data-cta conservés --></div>
        <ul class="hero-trust">…3 × li avec icône check SVG aria-hidden…</ul>
      </div>
      <div class="hero-visual">
        <picture><!-- screen_1 avif/webp/png, width/height, alt descriptif --></picture>
        <div class="hero-floats" aria-hidden="true">
          <div class="hero-float hero-float--ticket">…</div>
          <div class="hero-float hero-float--score">…</div>
          <div class="hero-float hero-float--badge">…</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- Un seul `h1`. Le commentaire « NOTE COPYWRITING » au-dessus du H1 est à
  conserver.
- Les cartes flottantes sont **décoratives** (`aria-hidden="true"`) : elles
  illustrent l'app, le téléphone porte l'`alt`.
- Téléphone : `<picture>` avec `assets/screens/screen_1.avif|webp|png`,
  `width="1206" height="2450"`, `alt="Aperçu de l’app Yamatch — accueil de
  découverte des tournois"`, `decoding="async"`, `draggable="false"`.
- Liens stores : garder `data-cta`, `target="_blank" rel="noopener"`,
  `aria-label`.

## 6. Design tokens (à ajouter dans `:root`, aucune valeur brute ailleurs)

| Token | Valeur | Usage |
|---|---|---|
| `--hero-photo-shade-side` | `linear-gradient(90deg, rgba(5,9,5,.88) 0%, rgba(5,9,5,.62) 38%, rgba(5,9,5,.12) 68%, rgba(5,9,5,.30) 100%)` | Lisibilité colonne texte (≥ 1024 px) |
| `--hero-photo-shade-bottom` | `linear-gradient(180deg, rgba(5,9,5,0) 55%, rgba(5,9,5,.65) 100%)` | Assombrit le bas (téléphone) |
| `--hero-photo-shade-mobile` | `linear-gradient(180deg, rgba(5,9,5,.82) 0%, rgba(5,9,5,.55) 40%, rgba(5,9,5,.15) 62%, rgba(5,9,5,.55) 100%)` | ≤ 1023 px |
| `--hero-ink-muted` | `rgba(255,255,255,.80)` | Paragraphe, réassurance, « Télécharger sur » |
| `--hero-glass-bg` | `rgba(255,255,255,.12)` | Badge, bouton Google Play |
| `--hero-glass-bg-hover` | `rgba(255,255,255,.20)` | Hover Google Play |
| `--hero-glass-border` | `rgba(255,255,255,.22)` | Bordure du badge (le bouton garde `--hero-photo-button-border` à .32) |
| `--hero-float-surface` | `rgba(16,24,40,.78)` | Carte ticket (+ `backdrop-filter: blur(14px)`) |
| `--hero-float-border` | `rgba(255,255,255,.16)` | Carte ticket |
| `--hero-float-shadow` | `0 18px 40px rgba(0,0,0,.45)` | Cartes flottantes |
| `--hero-phone-shadow` | `drop-shadow(0 40px 60px rgba(0,0,0,.55))` | Téléphone (`filter`) |
| `--hero-store-height` | `56px` (mobile `50px`) | Boutons stores |
| `--hero-title-size` | `clamp(2.875rem, 6.4vw, 5.75rem)` | 46 px → 92 px |

Réutiliser l'existant : `--color-accent`, `--color-text-primary`,
`--color-text-white`, `--radius-pill`, `--font-body`, famille `'Frick 0.3'`,
`--hero-photo-surface`, `--hero-photo-button-border`, `--page-pad`.

### Valeurs clés de la maquette

| Élément | Desktop | Mobile |
|---|---|---|
| Rayon carte | 40 px (`clamp(24px, 3vw, 40px)` existant) | 28 px |
| Padding colonne texte | 72 px haut / 64 bas, `clamp(24px, 5vw, 80px)` côtés | 36 px haut, 20 px côtés |
| Gap vertical texte | 28 px | 18 px |
| Titre | 92 px, `line-height .92`, majuscules, `skewX(-12deg)` (span existant) | 46 px |
| Badge | 14 px / 600, padding `8px 14px 8px 10px`, point 8 px lime + halo `0 0 0 4px rgba(215,255,0,.22)` | 12 px |
| Sous-titre | 22 px / 600 | 16 px / 500 |
| Paragraphe | 17 px / 400, `line-height 1.55`, max 46ch | masqué |
| Bouton App Store | fond `--color-accent`, texte noir, 56 px, pill | 50 px |
| Bouton Google Play | fond `--hero-glass-bg`, bordure `--hero-photo-button-border`, texte blanc | 50 px |
| Téléphone | 360 px de large, `rotate(-4deg)`, `bottom: -150px` | 230 px, `rotate(-3deg)` |
| Carte ticket | 272 px, radius 20, `rotate(-2deg)`, en haut à gauche du téléphone | masquée |
| Carte score | 220 px, fond lime, texte noir, score en Frick 34 px, `rotate(3deg)` | ~24 px, `rotate(4deg)` |
| Pastille phase finale | fond blanc, texte `--color-text-primary`, 13 px / 600 | masquée |

## 7. Mouvement

- Garder `cardEntrance` et `titleEntrance` (titre, sous-titre, boutons
  décalés comme aujourd'hui) ; ajouter `titleEntrance` décalé sur badge,
  paragraphe et réassurance.
- Téléphone : entrée par le bas (translateY 40 px → 0, 600 ms, après les
  boutons).
- Cartes flottantes : entrée en fondu décalée (ticket, score, pastille), puis
  flottement très léger optionnel (`translateY ±6px`, 6 s, ease-in-out).
- **`prefers-reduced-motion: reduce`** : aucune animation (la règle globale
  existante doit couvrir les nouvelles classes ; vérifier).
- Hover boutons : `translateY(-1px)` + transition existante `--transition`.

## 8. Décisions à trancher (founder) — défauts recommandés

| # | Question | Défaut recommandé |
|---|---|---|
| D1 | Le carrousel faisait remonter un téléphone (screen_2) sous le hero. Avec un téléphone **dans** le hero, on en aurait deux. | Désactiver la remontée de la slide active (`--scroll` = 0, `computeBaseLift` neutralisé sur l'accueil) ; le carrousel devient un rail normal sous le hero. Garder `--card-shrink` seulement s'il reste joli, sinon le retirer proprement (JS + CSS + doc). |
| D2 | Wordmark : aujourd'hui fixe et centré, avec pill condensée au scroll. La maquette le place à gauche dans un header. | Header statique (non fixe) ; wordmark en lien `href="#top"` à gauche. Si on veut garder un repère au scroll, conserver la pill condensée fixe uniquement après 30 px. `js-expert` vérifie que `script.js` ne casse pas si `.wordmark` change (garde `if (wordmark)`). Page organisateur : inchangée. |
| D3 | Cartes flottantes : données d'exemple (score inventé). | Les garder comme illustration décorative. Variante sans cartes : `visuals/desktop-1440-sans-cartes.jpg`. |

Si une décision n'est pas confirmée, l'orchestrateur **demande au founder**
avant d'implémenter la partie concernée, et implémente le reste.

## 9. Plan de délégation (respecter `CLAUDE.md` du dépôt)

L'orchestrateur n'écrit pas de code. Chaque spécialiste commence son rapport
par **Current State Summary** et **Verified safety greps** (sinon FAIL du
reviewer).

1. **`html-expert`** — `website/index.html` uniquement : header + nav,
   nouvelle structure du hero (§5), contenus exacts (§4), `<picture>` du
   téléphone, `aria-hidden` des cartes, préchargement de screen_1 si utile.
   JSON-LD, meta et `title` inchangés.
2. **`css-expert`** — `website/styles.css` uniquement : tokens (§6) dans
   `:root`, sections 7.x (nouvelle sous-section « 7.7 hero split + visuel +
   cartes flottantes »), responsive (§3), mouvement (§7). Ne pas toucher
   `styles.min.css` (généré). Vérifier que la 404 et `organisateur/` ne
   changent pas.
3. **`js-expert`** — `website/script.js` uniquement, selon D1/D2 :
   neutraliser la remontée du carrousel et adapter le wordmark, sans casser
   `carousel.js` ni le snap horizontal.
4. **`website-reviewer`** — revue 7 catégories + comparaison visuelle aux
   rendus `visuals/` (1440, 820, 390).
5. **`doc-keeper`** — `docs/WEBSITE_ARCHITECTURE.md` : arbre DOM du hero,
   nouveaux tokens, couplage scroll mis à jour. Ajouter une ligne d'historique
   datée.

Étapes 1 et 2 peuvent avancer en parallèle une fois les noms de classes
fixés par l'orchestrateur (reprendre ceux du §5).

## 10. Critères d'acceptation

- [ ] Rendu conforme aux images de `visuals/` à 1440, 820 et 390 px
      (écarts de quelques px tolérés, pas de différence de structure).
- [ ] Aucun défilement horizontal de 320 px à 1920 px.
- [ ] Le H1 garde exactement le texte « Ton prochain tournoi t’attend ».
- [ ] Contraste ≥ 4.5:1 pour tout texte < 24 px (blanc 80 % sur photo
      assombrie, noir sur lime).
- [ ] Toutes les cibles cliquables ≥ 44 px ; navigation clavier complète
      avec focus lime visible (nav, boutons stores).
- [ ] `prefers-reduced-motion` : aucune animation dans le hero.
- [ ] Aucune couleur brute hors `:root` ; aucune taille de police magique non
      tokenisée si un token équivalent existe.
- [ ] 404 et page organisateur visuellement identiques à avant.
- [ ] Carrousel : swipe, snap et boutons fonctionnent (D1 appliquée).
- [ ] `npm run build:css` et `npm test` passent.
- [ ] LCP non dégradé : la photo reste préchargée ; le téléphone a
      `width`/`height` (pas de layout shift).
- [ ] `docs/WEBSITE_ARCHITECTURE.md` à jour.

### Vérification visuelle (Playwright déjà installé)

```bash
npm run dev   # http://localhost:8000
# capturer 1440×900, 820×1180, 390×844 et comparer à docs/handoff/hero-participant-v2/visuals/
```

## 11. Hors périmètre

- Le reste de la page (« Comment ça marche », tournois publics, FAQ, footer).
- La page organisateur (`website/organisateur/`) et son hero.
- Toute nouvelle image ou police (tout est déjà dans `website/assets` et
  `website/fonts`).
- Publication : un push sur `main` déploie le site. **Pas de merge sans GO
  du founder.**
