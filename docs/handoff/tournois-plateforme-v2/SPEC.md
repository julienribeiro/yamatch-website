# SPEC — « Tous les tournois de la plateforme » V2 (terrain gris clair)

> Statut : maquette validée par le founder le 17/10/2026, **non implémentée**.
> Remplace la section « À l’affiche et déjà joués » de la page d'accueil.
> Cible : `website/index.html` (`section.showcase#derniers-tournois`,
> variante `participant`), `website/styles.css` §10.7 et `website/script.js`
> (IIFE du rail public).
> Référence visuelle : `visuals/*.jpg` · maquettes : `mockup/*.html`.
> Même langage visuel que le hero V2 et « Comment ça marche » V2.

## 1. Objectif

Annoncer les tournois de la plateforme sur un ton fun, avec des **cartes
identiques au ticket de l'app**. Une dernière carte invite à créer son propre
tournoi, et un bandeau défilant lime montre les tournois qui viennent de se
jouer. Fond gris clair, avec un terrain de volley dessiné en filigrane.

## 2. Ce qui existe aujourd'hui (à lire avant de coder)

| Élément | Où | Notes |
|---|---|---|
| Section participant | `website/index.html` ~l. 476-492 | `section.showcase#derniers-tournois[data-showcase][data-showcase-variant="participant"][hidden]` > `.showcase-block` > en-tête (`h2#showcaseRailTitle` « À l’affiche et déjà joués », flèches) + `ul#showcaseRail.showcase-rail` vide, rempli par JS |
| Section organisateur | `website/organisateur/index.html` ~l. 220 | Même composant, variante `organizer` (« Les derniers tournois », tournois passés seulement). **Hors périmètre, ne doit pas changer** |
| JS | `website/script.js` ~l. 1140-1672 (dernière IIFE) | RPC `get_public_showcase`, cache `sessionStorage` 10 min, chargement à l'approche (IntersectionObserver), validation stricte, `ticket()`, `gauge()`, `render()`, `wireRailNav()`, mode `?showcase=demo` |
| CSS | `website/styles.css` §10.7 (~l. 2476+) | Rail natif en scroll-snap, tickets sombres, tokens `--showcase-*` |
| Doc | `docs/WEBSITE_ARCHITECTURE.md` § « Public tournament rails » | Contrat données, visibilité et cache à **conserver** |

Données disponibles par tournoi (déjà normalisées par le JS) : `id`, `title`,
`date` (AAAA-MM-JJ), `city?`, `organizerName?`, `organizerLogoUrl?`,
`teamsCount`, `maxTeams?`, `playersPerTeam?`, `registrationsOpen` (à venir
uniquement). **Ni le prix, ni la palette de couleurs du tournoi, ni l'heure ne
sont transmis.**

## 3. Design cible

### 3.1 Desktop (≥ 1024 px) — `visuals/desktop-1440.jpg`

- **Bloc** : carte arrondie à 40 px, largeur max 1392 px, marges 24 px, fond
  `--color-light-gray` (#F3F4F6) avec un léger halo blanc en haut
  (`radial-gradient(60% 50% at 50% 0%, rgba(255,255,255,.9), transparent 70%)`),
  `overflow: hidden`.
- **Terrain en filigrane** : SVG décoratif (`aria-hidden="true"`,
  `pointer-events: none`) en `position: absolute; inset: 0`, avec
  `preserveAspectRatio="xMidYMid slice"`. Il contient le rectangle du
  terrain, le filet central (ligne verticale qui dépasse un peu) et les deux
  lignes des 3 m. Traits `rgba(16,24,40,.045)` de 2,5 px, filet
  `rgba(16,24,40,.09)` de 3 px. **Très discret : c'est une texture, pas un
  dessin.** Valeurs exactes dans `mockup/desktop.html`.
- **En-tête** (aligné à gauche, padding 64 / 72 px) :
  - badge blanc bordé `#E0E0E0` : point noir avec halo lime, texte « Les
    tournois sur Yamatch » ;
  - H2 Frick incliné (`skewX(-12deg)`), 76 px, majuscules, noir :
    « **ÇA SMASH** » surligné en lime (fond lime, rayon .08em), puis
    retour à la ligne et « PRÈS DE CHEZ TOI » ;
  - introduction 18 px `#4A5565`.
- **Cartes** : grille 3 colonnes, gap 20 px. Ce sont les tournois à venir,
  puis **toujours** la carte « Ton prochain tournoi » en dernier.
- **Bandeau défilant** en pied de bloc, pleine largeur, fond lime : pastille
  noire fixe à gauche « Ça s’est joué » (texte lime), puis les tournois passés
  qui défilent en boucle.

### 3.2 Carte tournoi = ticket de l'app

Copie du `TournamentCard` de l'app (mêmes mesures que l'écran codé
`../app-screens/screens/discovery.html`, classes `ym-disc-ticket*`) :

| Zone | Contenu et style |
|---|---|
| Carte | 281 px de haut, rayon 24 px, encoches de 9 px à 183 px du haut (masque radial des deux côtés) |
| En-tête (175 px) | Fond `radial-gradient(circle 300px at 50% 50%, #000, #36B7AA)` = palette par défaut de l'app (`Tournament.gradientColors`). **Tournoi aux inscriptions fermées : aplat `#000`** (`neutralTerminalBackground`). Complet : garde le dégradé |
| Date | Carré 69 × 69, bordure 2 px blanc 30 %, rayon 17 px. Jour Roboto 700 30 px (« 25 », « 1 » sans zéro), mois 14 px en majuscules abrégé (« OCT », « NOV ») |
| Titre / lieu | Titre Roboto 700 22 px, 2 lignes max (`line-clamp`). Ligne « Ville • N×N » 14 px blanc 90 %. Lieu ou format absent : on l'omet |
| Chevron | Rond 24 px blanc 20 % en haut à droite, décoratif |
| Inscriptions | « 14/16 inscrits » à gauche ; à droite, en lime 700 avec point : « 2 équipes restantes » (« 1 équipe restante »). Complet : « Complet », blanc 80 %. Inscriptions fermées : « Inscriptions closes », blanc 80 %. Sans capacité (`maxTeams` null) : « N inscrits », sans statut ni barre |
| Barre | 6 px, piste blanc 20 %, remplissage `teamsCount / maxTeams` (même dégradé blanc que l'app) |
| Découpe | 16 px, pointillés blanc 20 % (6 px / 4 px) |
| Pied | Fond `#1A1A1A`, rond 54 px noir avec chevron bas (décoratif), puis la pill 56 px Roboto 700 18 px. Ouvert : lime « S’inscrire ». Complet ou fermé : blanche « Voir le tournoi ». Lien `/tournament/?id=…`, nom accessible complété par le titre (texte masqué ` : <titre>`) |

### 3.3 Carte « Ton prochain tournoi » (toujours en dernier)

Même gabarit de ticket, avec :
- en-tête **lime**, texte noir ;
- carré en pointillés noir 40 % avec un « + » ;
- titre « Ton prochain tournoi » et sous-titre « Organisé par toi » ;
- « 0/16 inscrits » avec « ● À toi de jouer » en noir 700, et une barre vide
  (piste noire 15 %) ;
- pied : rond noir avec un « + » lime, puis la pill blanche « Créer mon
  tournoi → », qui pointe vers `organisateur/`.

Cette carte est statique, en HTML (pas générée par le JS). Le JS insère les
tickets **avant** elle.

### 3.4 Bandeau « Ça s’est joué »

- `role="region"` avec `aria-label="Tournois déjà joués"`, fond lime, padding
  18 px. La pastille fixe est positionnée en absolu, avec un dégradé de fond
  lime qui masque le défilement en dessous. Le contenu commence après elle
  (`padding-left` ≈ 196 px desktop, 150 px mobile).
- Chaque élément : titre Frick incliné 26 px en majuscules, puis « Ville ·
  11 oct. · 18 équipes » (Inter 600 16 px), puis une icône trophée SVG.
  Champ absent : on l'omet, ainsi que son séparateur. 0 équipe : on omet le
  compteur.
- Boucle : la liste est rendue deux fois. La seconde copie porte
  `aria-hidden="true"`. Animation `translateX(0 → -50%)` linéaire,
  40 s, infinie, en pause au survol **et au focus** (`:focus-within`).
- **`prefers-reduced-motion: reduce`** : pas d'animation, copie dupliquée
  masquée, bandeau défilable à la main (`overflow-x: auto`).
- Aucun tournoi passé : le bandeau n'est pas rendu.

### 3.5 Tablette (768-1023 px) — `visuals/tablette-820.jpg`

Grille de cartes sur 2 colonnes. La carte « Ton prochain tournoi » peut
rester seule sur sa ligne. Titre H2 environ 60 px.

### 3.6 Mobile (≤ 767 px) — `visuals/mobile-390.jpg`

- Gouttière `--mobile-hero-card-margin`, rayon du bloc 28 px, padding
  40 / 16 px.
- H2 40 px sur trois lignes : « ÇA SMASH » / « PRÈS DE » / « CHEZ TOI ».
- Cartes sur une colonne, gap 16 px.
- Terrain en filigrane **vertical** : rectangle haut, filet horizontal au
  milieu, lignes des 3 m (voir `mockup/mobile.html`).
- Bandeau : titre 22 px.

## 4. Contenus (copie exacte, registre « tu »)

| Élément | Texte |
|---|---|
| Badge | `Les tournois sur Yamatch` |
| H2 (garder `id="showcaseRailTitle"`) | `Ça smash près de chez toi` (« Ça smash » surligné) |
| Introduction | `Des tournois qui se remplissent, des équipes qui se chambrent et des smashs qui claquent. Choisis ton terrain, ramène ta team.` |
| CTA ticket ouvert / complet ou fermé | `S’inscrire` / `Voir le tournoi` |
| Statuts | `N équipes restantes` · `1 équipe restante` · `Complet` · `Inscriptions closes` |
| Carte création | `Ton prochain tournoi` · `Organisé par toi` · `0/16 inscrits` · `À toi de jouer` · `Créer mon tournoi →` |
| Bandeau | pastille `Ça s’est joué` · `aria-label` `Tournois déjà joués` |

Le mode démo (`?showcase=demo`) garde sa mention « Aperçu démo — données
fictives, non publiées ». Supprimés de la section : les flèches
précédent/suivant et le lien « Tous les tournois dans l’app ».

## 5. Données et logique (JS)

- **Ne changer ni la RPC, ni la validation, ni le cache, ni le chargement
  différé, ni le mode démo.**
- **Visibilité** : la section s'affiche dès qu'il y a au moins un tournoi
  valide, à venir ou passé. Sinon, elle reste `hidden`, comme aujourd'hui. La
  carte création ne suffit pas à elle seule à afficher la section.
- **Tournois à venir** : ordre du serveur, au plus `MAX_UPCOMING_V2` (défaut
  **5**, donc 6 cases avec la carte création, soit 2 rangées desktop ; voir
  T1). Aucun tournoi à venir : seule la carte création reste dans la grille.
- **Tournois passés** : au plus 9, dans le bandeau.
- Date du ticket : jour et mois via `Intl` en UTC, mois abrégé en majuscules
  sans point (« OCT », « NOV », « SEPT. » → `SEPT`).
- Lieu : `city • N×N` (`playersPerTeam`).
- **Variante `organizer`** : garder le rendu actuel (`ticket()` historique).
  Isoler le nouveau rendu dans une fonction dédiée, par exemple
  `appTicket()`, appelée seulement pour la variante `participant`.
- Les flèches et `wireRailNav()` ne servent plus côté participant : ne pas
  les appeler pour cette variante (ils restent pour `organizer`).
- Texte inséré via `textContent` uniquement (règle existante).

## 6. Tokens (dans `:root`, aucune valeur brute ailleurs)

| Token | Valeur |
|---|---|
| `--tp-band-bg` | `var(--color-light-gray)` |
| `--tp-band-glow` | `radial-gradient(60% 50% at 50% 0%, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 70%)` |
| `--tp-court-line` / `--tp-court-net` | `rgba(16,24,40,.045)` / `rgba(16,24,40,.09)` |
| `--tp-radius` | `40px` (mobile `28px`) |
| `--tp-title-size` | `clamp(2.5rem, 5.3vw, 4.75rem)` |
| `--tp-intro-ink` | `#4A5565` |
| `--tp-ticket-head` | `radial-gradient(circle 300px at 50% 50%, #000 0%, #36B7AA 100%)` |
| `--tp-ticket-head-closed` | `#000` |
| `--tp-ticket-foot` | `#1A1A1A` |
| `--tp-ticket-height` / `--tp-ticket-notch-y` | `281px` / `183px` |
| `--tp-ticker-duration` | `40s` |

Réutiliser `--color-accent`, `--radius-pill`, `--font-body` et les familles
Frick / Roboto déjà servies.

## 7. Décisions à trancher (founder) — défauts recommandés

| # | Question | Défaut recommandé |
|---|---|---|
| T1 | Combien de tournois à venir ? | 5 au plus, avec la carte création, soit 2 rangées desktop |
| T2 | Prix dans le bouton, comme l'app (« Payer • 45 €/éq. ») ? | Non pour l'instant, « S’inscrire ». Le prix n'est pas dans la RPC publique : à ajouter côté app (`yamatch/supabase`) dans un lot séparé si souhaité |
| T3 | Couleurs propres à chaque tournoi ? | Dégradé teal par défaut. La palette n'est pas dans la RPC : même remarque que T2 |
| T4 | La page organisateur adopte-t-elle aussi ce design ? | Non, hors périmètre |

## 8. Plan de délégation (respecter `CLAUDE.md`)

Chaque spécialiste commence par **Current State Summary** et **Verified
safety greps**.

1. **`html-expert`** — `index.html` : nouvelle structure de
   `section.showcase` côté participant. On garde l'id
   `derniers-tournois`, `data-showcase`, `data-showcase-variant`, `hidden`,
   `data-showcase-rail-block` et `data-showcase-rail`. On ajoute le SVG du
   terrain, l'en-tête (§4), le conteneur des cartes (`ol`), la carte
   création statique en dernier `li`, le bandeau (`role="region"`) avec sa
   pastille et un `ul` vide `data-showcase-ticker`. On retire les flèches.
2. **`js-expert`** — `script.js` : `appTicket()` (§3.2), insertion avant la
   carte création, rendu du bandeau dupliqué (§3.4), règles de visibilité
   (§5), variante `organizer` intacte, `reduceMotion` respecté.
3. **`css-expert`** — `styles.css` §10.7 : tokens (§6), bloc, terrain,
   ticket, carte création, bandeau et animation, responsive (§3.5, §3.6).
   La variante `organizer` garde ses styles actuels.
4. **`website-reviewer`** — revue 7 catégories + comparaison aux `visuals/`
   en mode `?showcase=demo`.
5. **`doc-keeper`** — `docs/WEBSITE_ARCHITECTURE.md` § « Public tournament
   rails » : nouveau rendu participant, bandeau, carte création, tokens.

## 9. Critères d'acceptation

- [ ] Avec `?showcase=demo`, rendu conforme à `visuals/` à 1440, 820 et
      390 px (données différentes, même structure et même style).
- [ ] Tickets identiques au ticket de l'app (§3.2), états ouvert, complet,
      fermé et sans capacité vérifiés avec des données de démo ajustées.
- [ ] Carte « Ton prochain tournoi » toujours en dernier, lien vers
      `organisateur/`.
- [ ] Bandeau : boucle fluide, pause au survol et au focus, copie dupliquée
      `aria-hidden`, aucune animation en mouvement réduit.
- [ ] Section masquée sans aucune donnée valide ; RPC, cache et démo
      inchangés (`npm test` passe).
- [ ] Page organisateur visuellement identique à avant.
- [ ] Un seul h2 ; un h3 par carte ; terrain et décorations `aria-hidden` ;
      cibles ≥ 44 px ; focus visible ; contraste AA (intro `#4A5565` sur
      `#F3F4F6` = 6,9:1).
- [ ] Pas de défilement horizontal de la page de 320 à 1920 px (le bandeau
      est rogné par son bloc).
- [ ] Aucune couleur brute hors `:root`. `npm run build:css` passe.
- [ ] `docs/WEBSITE_ARCHITECTURE.md` à jour.

## 10. Hors périmètre

RPC et données serveur (T2, T3), page organisateur, autres sections. **Pas
de merge sur `main` sans GO du founder** : un push sur `main` publie le site.
