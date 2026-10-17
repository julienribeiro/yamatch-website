# SPEC — « Vu dans les stories » (preuve sociale)

> Statut : maquette validée par le founder le 17/10/2026, **non implémentée**.
> Nouvelle section de la page d'accueil, entre « Comment ça marche »
> (`#how-it-works`) et les tournois publics (`#derniers-tournois`).
> Cible : `website/index.html`, `website/styles.css` (nouvelle sous-section
> après §10), `website/script.js` (vidéos uniquement).
> Référence visuelle : `visuals/*.jpg` · maquettes : `mockup/*.html`.

## 1. Objectif

Montrer de vrais joueurs, capitaines, arbitres et organisateurs, au format
qu'ils utilisent déjà : des **stories Instagram** en 9:16, qu'on fait défiler
horizontalement. Même langage visuel que les autres sections : fond gris
clair, terrain en filigrane, titre Frick incliné avec surlignage lime.

## 2. Règle absolue : aucun contenu inventé

- Chaque story = une **vraie personne**, une **vraie photo ou vidéo**, une
  **vraie phrase**, avec son **accord écrit** (droit à l'image et à la
  citation). Les droits sur les médias repris d'Instagram doivent être
  obtenus auprès de leur auteur.
- Les maquettes contiennent des emplacements entre crochets
  (`[Prénom N.]`, `[Phrase courte et punchy, réelle]`, `[Photo ou vidéo
  réelle]`). **Ils ne doivent jamais être publiés.**
- Moins de 3 stories réelles fournies → la section est livrée avec
  l'attribut `hidden`, sans aucun contenu fictif dans le DOM, et ne s'affiche
  pas (décision S1).

## 3. Contenu attendu par story (fourni par le founder)

| Champ | Format |
|---|---|
| Média | Image `website/assets/stories/story-NN.webp`, 9:16, 720 × 1280 recommandé, ≤ 150 Ko. Option vidéo `story-NN.mp4` (H.264, ≤ 1,5 Mo, ≤ 10 s, sans son utile) **avec** l'image comme `poster` |
| Texte alternatif | Description courte du média (« Une équipe célèbre sa victoire sous le filet ») |
| Prénom N. | Prénom et initiale du nom, sans nom complet |
| Rôle | `Capitaine`, `Joueuse`, `Joueur`, `Arbitre`, `Organisateur`, `Organisatrice` |
| Phrase | 60 caractères max, réelle, sans guillemets |
| Avatar | Optionnel : `story-NN-avatar.webp` 96 × 96 ; à défaut, rond lime plein |
| Lien | Optionnel : URL du post Instagram d'origine |
| Mise en avant | Une seule story peut être mise en avant (bordure lime) |

Un fichier `website/assets/stories/README.md` (créé par l'agent) rappelle ces
formats et la règle d'accord écrit.

## 4. Design cible

### 4.1 Desktop (≥ 1024 px) — `visuals/desktop-1440.jpg`

- **Bloc** : carte arrondie 40 px, largeur max 1392 px, marges 24 px, fond
  `#F3F4F6` (`--color-light-gray`), `overflow: hidden`, padding
  64 / `clamp(24px, 4.5vw, 72px)` / 40 px.
- **Terrain en filigrane** : SVG décoratif, `aria-hidden`, en position
  absolue, `preserveAspectRatio="xMidYMid slice"`. Rectangle et filet
  vertical, traits `rgba(16,24,40,.045)` 2,5 px, filet `rgba(16,24,40,.09)`
  3 px (mêmes valeurs que la section tournois « terrain gris clair »).
  Si le rail le masque partiellement (rendu des conteneurs de défilement),
  c'est acceptable.
- **En-tête** (flex, aligné en bas, `space-between`) :
  - à gauche : badge blanc bordé `#E0E0E0` (point noir, halo lime) « Ils
    jouent sur Yamatch », puis le H2 Frick incliné 76 px, en majuscules,
    noir : « VU DANS » / « **LES STORIES** » surligné lime ;
  - à droite : pill `#101828` 48 px avec l'icône Instagram en SVG et le texte
    « @yamatch_app », lien `https://www.instagram.com/yamatch_app/`
    (`target="_blank" rel="noopener"`, nom accessible « Yamatch sur
    Instagram (nouvel onglet) »).
- **Rail** : `ul` en grille, `grid-auto-flow: column`, colonnes de 250 px,
  gap 16 px, `overflow-x: auto`, `scroll-snap-type: x mandatory`, barre de
  défilement masquée. Il **déborde jusqu'au bord droit du bloc** :
  `margin-right` négatif égal au padding horizontal du bloc, et
  `padding-right` équivalent, pour que la dernière story soit coupée par le
  bord arrondi. Rail focusable (`tabindex="0"`, `aria-label` « Stories des
  joueurs et organisateurs ») pour le défilement au clavier.
- **Story** (`figure`, 250 × 444, rayon 24 px, `overflow: hidden`, ombre
  `0 18px 40px rgba(16,24,40,.18)`, bordure 3 px transparente, ou **lime**
  pour la story mise en avant) :
  - média plein cadre, `object-fit: cover` ;
  - en haut, à 12 px : 3 barres de progression de 3 px (la 1re blanche, les
    autres blanc 40 %), décoratives ;
  - en dessous : avatar 30 px (bord blanc 2 px) et « Prénom N. » 13 px / 700
    blanc ;
  - en bas, un dégradé `transparent → rgba(0,0,0,.85)` avec la pastille
    lime du rôle (11 px / 700, texte noir), puis la phrase en
    `blockquote`, Frick 22 px majuscules, `skewX(-8deg)`, blanc.

### 4.2 Tablette (768-1023 px) — `visuals/tablette-820.jpg`

Mêmes dimensions de story. L'en-tête passe en colonne si besoin. Environ
trois stories visibles, plus une qui dépasse.

### 4.3 Mobile (≤ 767 px) — `visuals/mobile-390.jpg`

- Gouttière `--mobile-hero-card-margin`, rayon du bloc 28 px, padding
  40 / 16 / 24 px.
- H2 44 px. La pill Instagram passe sous le titre.
- Stories 220 × 390, gap 12 px. Le rail déborde de 16 px à droite.
- Terrain en filigrane vertical : rectangle haut et filet horizontal (voir
  `mockup/mobile.html`).

## 5. Vidéos (optionnelles)

- `<video muted loop playsinline preload="none" poster="story-NN.webp">`,
  sans `controls` visibles, et un **bouton pause/lecture** 44 × 44 en haut à
  droite de la story (WCAG 2.2.2 : tout mouvement de plus de 5 s doit pouvoir
  être arrêté).
- Lecture automatique **uniquement** quand la story est visible à 60 % ou
  plus (IntersectionObserver), et pause dès qu'elle sort de l'écran.
  Une seule vidéo joue à la fois.
- `prefers-reduced-motion: reduce` : aucune lecture automatique, le poster
  reste affiché, et le bouton lance la lecture à la demande.
- Sans JavaScript : poster seul, aucune erreur.

## 6. Structure HTML proposée

```html
<section class="stories" id="temoignages" aria-labelledby="storiesTitle">
  <div class="stories-band">
    <svg class="stories-court" aria-hidden="true" …>…</svg>
    <div class="stories-head">
      <div>
        <p class="stories-eyebrow"><span aria-hidden="true"></span>Ils jouent sur Yamatch</p>
        <h2 id="storiesTitle" class="stories-title"><span>Vu dans<br><mark>les stories</mark></span></h2>
      </div>
      <a class="stories-insta" href="https://www.instagram.com/yamatch_app/" target="_blank" rel="noopener" aria-label="Yamatch sur Instagram (nouvel onglet)">…@yamatch_app</a>
    </div>
    <ul class="stories-rail" tabindex="0" aria-label="Stories des joueurs et organisateurs">
      <li>
        <figure class="story [story--featured]">
          <img src="assets/stories/story-01.webp" alt="…" width="720" height="1280" loading="lazy" decoding="async">
          <!-- ou <video …> + <button class="story-toggle" aria-label="Mettre en pause">… -->
          <span class="story-progress" aria-hidden="true"><span></span><span></span><span></span></span>
          <span class="story-author"><img|span class="story-avatar" …>Prénom N.</span>
          <figcaption>
            <span class="story-role">Capitaine</span>
            <blockquote class="story-quote">…</blockquote>
          </figcaption>
        </figure>
      </li>
    </ul>
  </div>
</section>
```

`<mark>` stylé comme le surlignage lime existant. Un seul `h2`.

## 7. Tokens (dans `:root`)

| Token | Valeur |
|---|---|
| `--stories-band-bg` | `var(--color-light-gray)` |
| `--stories-court-line` / `--stories-court-net` | réutiliser `--tp-court-line` / `--tp-court-net` si la section tournois est livrée, sinon `rgba(16,24,40,.045)` / `rgba(16,24,40,.09)` |
| `--stories-card-w` / `--stories-card-h` | `250px` / `444px` (mobile `220px` / `390px`) |
| `--stories-card-radius` | `24px` (mobile `22px`) |
| `--stories-shade` | `linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.85))` |
| `--stories-placeholder` | `#2E333A`, fond affiché tant que l'image n'est pas chargée |

## 8. Décisions à trancher (founder) — défauts recommandés

| # | Question | Défaut recommandé |
|---|---|---|
| S1 | Contenus réels disponibles ? | Si moins de 3 stories validées : section livrée `hidden`, sans contenu fictif |
| S2 | Lien vers le post Instagram d'origine sur chaque story ? | Oui si fourni : la story entière devient un lien avec un nom accessible explicite |
| S3 | Place dans la page | Entre « Comment ça marche » et les tournois publics |
| S4 | Lien « Ils jouent sur Yamatch » dans le header ? | Non |

## 9. Plan de délégation (respecter `CLAUDE.md`)

Chaque spécialiste commence par **Current State Summary** et **Verified
safety greps**.

1. **`html-expert`** — `index.html` : section `#temoignages` après
   `#how-it-works` (§6), stories réelles fournies ou section `hidden` (S1),
   attributs `width`, `height`, `alt` et `loading="lazy"`.
2. **`css-expert`** — `styles.css` : tokens (§7), nouvelle sous-section
   « 10.x Stories » (bloc, terrain, rail débordant, story, responsive §4).
   Ajouter `#temoignages` aux marges d'ancre du header fixe.
3. **`js-expert`** — `script.js` : uniquement si au moins une vidéo est
   fournie (§5). Sinon, aucun JS.
4. **`website-reviewer`** — revue 7 catégories + comparaison aux `visuals/`.
5. **`doc-keeper`** — `docs/WEBSITE_ARCHITECTURE.md` : arbre DOM, tokens,
   règle « aucun contenu inventé ».

## 10. Critères d'acceptation

- [ ] Aucun texte entre crochets ni contenu fictif dans `index.html`.
- [ ] Avec du contenu réel : rendu conforme à `visuals/` à 1440, 820 et
      390 px ; rail qui déborde à droite, défilement tactile, trackpad et
      clavier (focus visible sur le rail).
- [ ] Sans contenu (S1) : section `hidden`, aucune requête de média.
- [ ] Images en lazy loading et dimensionnées, sans layout shift, CLS non
      dégradé.
- [ ] Vidéos : lecture seulement à l'écran, bouton pause, aucune lecture
      automatique en mouvement réduit, une seule vidéo à la fois.
- [ ] Un seul h2 ; chaque story est une `figure` avec un `alt` réel ; les
      décorations sont `aria-hidden` ; contraste AA du texte sur le dégradé.
- [ ] Hero, « Comment ça marche », tournois, FAQ, 404 et organisateur
      inchangés.
- [ ] Pas de défilement horizontal de la page de 320 à 1920 px.
- [ ] `npm run build:css` et `npm test` passent ; doc à jour.

## 11. Hors périmètre

Intégration d'un flux Instagram automatique (API Meta), collecte des
contenus, page organisateur. **Pas de merge sur `main` sans GO du founder.**
