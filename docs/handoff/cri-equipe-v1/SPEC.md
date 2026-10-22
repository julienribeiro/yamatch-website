# SPEC — « Ça crie sur le terrain » (scènes de tournoi)

> Statut : direction « B — Le cri d'équipe » validée par le founder le
> 22/10/2026, **non implémentée**.
> Nouvelle section de la page d'accueil, juste après « Comment ça marche »
> (`section.how-quest#how-it-works`) et avant la section stories masquée
> (`section.stories#temoignages[hidden]`).
> Cibles : `website/index.html` et `website/styles.css` (nouvelle
> sous-section **10.8** après 10.7). **Aucun JavaScript.**
> Référence visuelle : `visuals/*.jpg` · maquette : `mockup/section.html`.

## 1. Objectif

Donner envie en montrant de **vrais humains** en plein tournoi. Chaque photo
porte une phrase très courte, criée comme sur le terrain, qui résume ce
qu'on vit avec l'app : s'inscrire, jouer les points chauds, aller en finale,
partager sa victoire. C'est une rupture visuelle volontaire : bande sombre,
photos verticales, texte lime énorme.

## 2. Contenu (textes exacts)

- Badge : **Le jour J**
- H2 : **Ça crie** + surlignage lime **sur le terrain**
- Introduction : **Les vrais moments d’un tournoi amateur. Yamatch gère
  l’orga, toi tu gardes ta voix pour ça.**
- CTA : **Trouver mon tournoi →**, vers `download/` (page de redirection
  vers les stores, la même cible que le QR code).

| # | Phrase criée (majuscules en CSS) | Pastille de contexte | Photo provisoire |
|---|---|---|---|
| 1 | On est inscrits&nbsp;! | Inscription validée | `assets/organisateurs/02-partage-paiement-v2.webp` (1086×1448) |
| 2 | Balle de match&nbsp;! | Set 3 · 14–13 | `assets/hero-volley/hero-volley-mixed-mobile.webp` (1122×1402), `object-position: 35% 50%` |
| 3 | On est en finale&nbsp;! | Demi-finale gagnée | `assets/organisateurs/04-poules-v2.webp` (1086×1448) |
| 4 | Trop belle, celle-là&nbsp;! | Story publiée ↗ (flèche `aria-hidden`) | `assets/organisateurs/07-classement-v2.webp` (1086×1448) |

Règles :
- Apostrophes typographiques, espace insécable avant « ! », `<br>` dans
  chaque phrase comme dans la maquette (2 lignes).
- Les avatars des pastilles réutilisent `assets/avatar-team-1/2/3.jpg`
  (104×104), décoratifs (`alt=""`).
- Phrases et pastilles sont **illustratives**, pas des témoignages :
  **aucun prénom, nom d'équipe ou citation attribuée**. Les témoignages
  réels relèvent de la section stories (`docs/handoff/stories-v2/`).

## 3. Photos définitives (brief, à fournir par le founder)

Les photos provisoires sont déjà utilisées ailleurs sur le site. Prévoir
4 photos dédiées, portrait **3:4 minimum** (cadrage final 9:14),
1086×1448 recommandé, WebP ≤ 180 Ko, sujets dans les **deux tiers
hauts** (le tiers bas reçoit la phrase) :

1. Une équipe qui découvre sur un téléphone qu'elle est inscrite (joie, groupe).
2. Une action intense au filet (attaque, contre, plongeon).
3. Une équipe qui exulte après une demi-finale.
4. Une photo de victoire, coupe ou médailles, prise comme pour une story.

Droit à l'image : accord écrit des personnes reconnaissables. Nommer les
fichiers `website/assets/moments/moment-01.webp` … `moment-04.webp`. Tant
qu'elles ne sont pas fournies, garder les photos provisoires (décision M1).

## 4. Design cible

### 4.1 Desktop (≥ 1024 px) — `visuals/desktop-1440.jpg`

- **Bande** pleine largeur, fond `#0c100b` (réutiliser
  `--hero-photo-surface`), texte blanc. Padding vertical
  `clamp(64px, 8vw, 112px)` en haut et `clamp(56px, 7vw, 96px)` en bas,
  gouttière latérale alignée sur les sections voisines. Conteneur intérieur
  de 1200 px max, centré (`--container-max`). `overflow-x: clip`.
- **En-tête** : flex, `space-between`, aligné en bas, gap 32 px.
  - À gauche : badge pilule fond `rgba(255,255,255,.1)`, point lime 8 px,
    600 13 px. Puis H2 `.section-title` en blanc, `span.title-pill` lime
    avec texte **noir**.
  - À droite : introduction 17 px, `rgba(255,255,255,.7)`, 360 px max.
- **Rail** : grille 4 colonnes, gap 14 px, marge haute 40 px. Réserver
  36 px sous le rail pour le décalage des cartes paires.
- **Carte** (`li.shout`) : `aspect-ratio: 9/14`, rayon 28 px, `overflow:
  hidden`. Les cartes **paires** sont décalées de 36 px vers le bas.
  - Photo en `object-fit: cover` sur toute la carte.
  - Dégradé bas : `linear-gradient(180deg, rgba(5,9,5,.1) 30%, rgba(5,9,5,.9) 100%)`.
  - Pastille de contexte en haut à gauche (18 px) : verre
    `rgba(255,255,255,.14)`, `backdrop-filter: blur(12px)`, bordure 1 px
    `rgba(255,255,255,.16)`, pilule, 600 12 px, avatar rond 24 px,
    gap 8 px, padding `5px 12px 5px 5px`.
  - Phrase en bas à gauche (18 px à gauche, 14 px à droite, 22 px en bas) :
    `'Frick 0.3'`, majuscules, lime `--color-accent`, `line-height: .88`,
    `skewX(-12deg)` avec `transform-origin: left bottom` (même inclinaison
    que `.hero-title-slant`), taille `clamp(30px, 2.9vw, 42px)`, ombre
    `0 6px 24px rgba(0,0,0,.35)`.
  - Survol, sur appareil avec pointeur seulement (`@media (hover: hover)`) :
    zoom de la photo à 1.04 en 500 ms, `cubic-bezier(.2,.8,.2,1)`.
- **CTA** centré, 36 px sous le rail : pilule lime, texte noir 700,
  padding `14px 22px`. Survol et `:focus-visible` cohérents avec les
  boutons lime du site.

### 4.2 Tablette (768–1023 px) — `visuals/tablette-820.jpg`

- L'en-tête reste sur deux colonnes.
- Le rail devient un **carrousel horizontal natif** : `display: flex`,
  `overflow-x: auto`, `scroll-snap-type: x mandatory`,
  `scroll-padding-inline` égal à la gouttière, débordement jusqu'aux bords
  (marge négative de la gouttière + padding égal), barre de défilement
  masquée. Cartes `flex: 0 0 40%`, `scroll-snap-align: start`, gap 12 px,
  **sans décalage** des cartes paires. Phrase en 40 px.

### 4.3 Mobile (< 768 px) — `visuals/mobile-390.jpg`

- En-tête empilé : introduction sous le titre (14 px d'écart).
- Carrousel identique à la tablette, cartes `flex: 0 0 72%`, phrase en
  46 px, gouttière `--mobile-hero-card-margin`.
- CTA 20 px sous le rail.

## 5. Structure HTML

Un commentaire HTML au-dessus de la section, dans le style des voisines,
rappelle que les photos sont provisoires et que les textes sont
illustratifs.

```html
<section class="shouts" id="moments" aria-labelledby="shoutsTitle">
  <div class="shouts-inner">
    <div class="shouts-header">
      <div class="shouts-copy">
        <span class="shouts-eyebrow"><span class="shouts-eyebrow-dot" aria-hidden="true"></span>Le jour J</span>
        <h2 id="shoutsTitle" class="shouts-title section-title">Ça crie <span class="title-pill">sur le terrain</span></h2>
      </div>
      <p class="shouts-lede">Les vrais moments d’un tournoi amateur. Yamatch gère l’orga, toi tu gardes ta voix pour ça.</p>
    </div>
    <ul class="shouts-rail" tabindex="0" aria-label="Moments forts d’un tournoi">
      <li class="shout">
        <img class="shout-photo" src="assets/organisateurs/02-partage-paiement-v2.webp" alt="Un groupe d’amis assis sur le sable regarde ensemble un téléphone" width="1086" height="1448" loading="lazy" decoding="async">
        <span class="shout-context"><img class="shout-context-avatar" src="assets/avatar-team-1.jpg" alt="" width="104" height="104" loading="lazy" decoding="async">Inscription validée</span>
        <p class="shout-quote">On est<br> inscrits&nbsp;!</p>
      </li>
      <!-- … 3 autres li.shout, cf. §2 et mockup/section.html (alt inclus) -->
    </ul>
    <div class="shouts-cta"><a class="shouts-cta-link" href="download/">Trouver mon tournoi <span aria-hidden="true">→</span></a></div>
  </div>
</section>
```

Textes alternatifs (photos provisoires) :
1. Un groupe d’amis assis sur le sable regarde ensemble un téléphone
2. Une joueuse attaque au-dessus du filet face à deux contreurs
3. Une joueuse en sweat gris consulte une tablette au bord des terrains de beach-volley
4. Une équipe mixte éclate de rire dans un gymnase, l’un d’eux brandit un trophée

À réécrire avec les photos définitives.

## 6. Tokens (dans `:root`)

Aucun hex en dur hors de `:root`.

| Token | Valeur |
|---|---|
| `--shouts-bg` | `var(--hero-photo-surface)` |
| `--shouts-ink-muted` | `rgba(255,255,255,.7)` |
| `--shouts-eyebrow-bg` | `rgba(255,255,255,.1)` |
| `--shouts-glass-bg` / `--shouts-glass-border` | `rgba(255,255,255,.14)` / `rgba(255,255,255,.16)` |
| `--shouts-scrim` | `linear-gradient(180deg, rgba(5,9,5,.1) 30%, rgba(5,9,5,.9) 100%)` |
| `--shouts-card-radius` | `28px` |
| `--shouts-stagger` | `36px` |
| `--shouts-quote-size` | `clamp(30px, 2.9vw, 42px)` (tablette `40px`, mobile `46px`) |
| `--shouts-quote-shadow` | `0 6px 24px rgba(0,0,0,.35)` |

Ajouter **10.8 Shouts** à la table des matières en tête de `styles.css`.
Ajouter `#moments` aux règles de marge d'ancre du header fixe
(`scroll-margin-top: calc(var(--hero-header-space) + 16px)`, comme
`#how-it-works`, `#faq`, `.stories`).

## 7. Accessibilité et performance

- Un seul `h2` ; ordre des titres préservé.
- Rail focusable (`tabindex="0"`, `aria-label`) avec un `:focus-visible`
  lime visible ; défilement clavier, tactile et trackpad.
- Avatars et flèches décoratifs : `alt=""` / `aria-hidden`.
- Contraste AA du lime sur le dégradé, et du blanc sur la pastille verre.
- Images en `loading="lazy"`, `decoding="async"`, `width`/`height` réels :
  pas de layout shift.
- `prefers-reduced-motion` : aucun zoom ni transition (vérifier que la
  règle globale existante le couvre).
- Pas de défilement horizontal de la page de 320 à 1920 px.

## 8. Décisions à trancher (founder) — défauts recommandés

| # | Question | Défaut recommandé |
|---|---|---|
| M1 | Photos définitives disponibles ? | Non : livrer avec les photos provisoires (§2), à remplacer ensuite |
| M2 | Cible du CTA | `download/` (redirection vers les stores) |
| M3 | Lien dans la navigation du header ? | Non |
| M4 | Place dans la page | Juste après « Comment ça marche » |

## 9. Critères d'acceptation

- [ ] Rendu conforme à `visuals/` à 1440, 820 et 390 px.
- [ ] Textes exactement ceux du §2 ; aucun prénom, nom d'équipe ni
      citation attribuée.
- [ ] Desktop : 4 colonnes, cartes paires décalées, sans collision avec le CTA.
- [ ] Tablette et mobile : carrousel natif à snap, première carte alignée
      sur la gouttière, débordement à droite, sans décalage.
- [ ] Tokens uniquement, aucun hex hors `:root` ; sous-section 10.8 et
      table des matières à jour ; `#moments` avec marge d'ancre.
- [ ] Aucune modification de `script.js` ni de `styles.min.css`.
- [ ] Hero, « Comment ça marche », stories masquées, tournois, FAQ, 404 et
      page organisateur inchangés (captures avant/après de la page complète).
- [ ] `npm run build:css` et `npm test` passent.
- [ ] `docs/WEBSITE_ARCHITECTURE.md` mis à jour (arbre DOM, ancres, tokens,
      photos provisoires).

## 10. Hors périmètre

Production des photos définitives, vidéo, animations au défilement, page
organisateur. **Pas de merge sur `main` sans GO du founder** : un push sur
`main` publie le site en production.
