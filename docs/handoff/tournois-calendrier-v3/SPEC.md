# SPEC — Tournois « Mois géants » V3 et page tournoi

Destinataires : agents IA travaillant sur `julienribeiro/yamatch-website`
(orchestrateur + `html-expert`, `css-expert`, `js-expert`,
`website-reviewer`, `doc-keeper`). Lire aussi `CLAUDE.md` et
`docs/WEBSITE_ARCHITECTURE.md` § « Public tournament rails ».

Les valeurs visuelles exactes sont dans `mockup/calendrier-et-page-tournoi.html`.
Les captures de `visuals/` sont la référence de rendu. Les données de la
maquette sont des exemples.

---

## 1. Objectif

1. Transformer la section des tournois publics de la page d'accueil en
   **calendrier horizontal par mois** : tournois joués à gauche, mois en
   cours, tournois à venir à droite, chaque mois titré par son nom en très
   grand.
2. Retirer **tout cadre** autour de la section.
3. Afficher les tournois joués **au même format de billet**, tête blanche.
4. Remplacer le pied de billet par **un seul bouton « Voir le tournoi »**,
   qui mène à la **page du tournoi**, elle-même refondue pour présenter ses
   informations.

## 2. Existant (état de `main`, commit `be242c7`)

| Couche | Emplacement | Contenu |
|---|---|---|
| HTML | `website/index.html`, `section.showcase.tp-band#derniers-tournois[data-showcase-variant="participant"]` (~l. 746-800) | SVG terrain ×2, `.tp-content[data-showcase-rail-block]` → `header.tp-header` (badge, `h2#showcaseRailTitle`, intro) + `ol.tp-cards[data-showcase-rail]` avec la carte création statique `li[data-showcase-create]` ; `.tp-ticker` « Ça s’est joué » avec `ul[data-showcase-ticker]` |
| JS | `website/script.js`, dernière IIFE (~l. 1078+) : `normalizePayload()`, `loadModel()`, `appTicket()` (~l. 1491), `renderTicker()` (~l. 1559), `render()` (~l. 1669), `hideSection()`, `start()`, `init()` | RPC `get_public_showcase`, validation, cache `sessionStorage` 10 min, chargement à l'approche, mode `?showcase=demo` |
| CSS | `website/styles.css` §10.7 « Participant V2 » (~l. 2865-2930) + tokens `--tp-*` dans `:root` (~l. 256-294) | Bande grise arrondie, terrain, billets, bandeau défilant |
| Page tournoi | `website/tournament/index.html` (CSS et JS inline) | Lit `tournaments` en anonyme, affiche titre, critères, prix, bouton « Ouvrir dans Yamatch » (deep link + repli store), états introuvable / invalide / erreur / annulé |
| Tests | `test/tournament-page.test.mjs`, `scripts/validate-tournament-config.mjs` | Exécutent le script inline de la page tournoi et vérifient l'URL/clé PROD |
| Organisateur | `website/organisateur/index.html` variante `organizer`, rendue par `ticket()` | **Hors périmètre, doit rester identique** |

Données de la RPC (déjà normalisées par `normalizeTournament`) :

| Liste | Max | Champs |
|---|---|---|
| `upcoming` | 6 (`MAX_UPCOMING`) | `id`, `title`, `date` (AAAA-MM-JJ), `city?`, `organizerName?`, `organizerLogoUrl?`, `teamsCount`, `maxTeams?`, `playersPerTeam?`, `registrationsOpen` |
| `recent` (joués) | 9 (`MAX_RECENT`) | idem sans `registrationsOpen` |

La RPC est maintenue dans le dépôt de l'app
(`yamatch/supabase/migrations/20261015214227_public_showcase.sql`). **Ne pas
la modifier dans ce lot.**

## 3. Section calendrier — design cible

Référence : `visuals/calendrier-*.jpg`.

### 3.1 Conteneur, sans cadre

- Plus de fond gris, de halo, de bordure, de rayon ni de terrain SVG : retirer
  `svg.tp-court--desktop`, `svg.tp-court--mobile` et le style de bande
  (`background`, `border-radius`, `overflow: hidden`, `width: calc(100% - 48px)`).
- La section se pose sur le fond blanc de la page, largeur max 1392 px
  centrée, `padding-block: 56px 24px` (mobile 32 px en haut), espacement
  vertical interne 32 px.
- Garder `id="derniers-tournois"`, `data-showcase`,
  `data-showcase-variant="participant"`, `hidden`, `aria-labelledby` et la
  marge d'ancre `scroll-margin-top: calc(var(--hero-header-space) + 16px)`.
- Le bandeau lime « Ça s’est joué » **disparaît** : les tournois joués sont
  dans le calendrier.

### 3.2 En-tête

Grille 2 colonnes (1,1fr / 0,9fr, gap 64 px, alignée en bas), une colonne
sous 1024 px, gouttière `--tp-content-pad`.

- Badge : pastille **gris clair** (`--color-light-gray`, plus de bordure car
  plus de fond gris derrière), point **noir** 8 px, « Les tournois sur Yamatch ».
- H2 inchangé : `h2#showcaseRailTitle.section-title` « Ça smash
  <span class="title-pill">près de chez toi</span> ».
- Intro inchangée, à droite en desktop : « Des tournois qui se remplissent,
  des équipes qui se chambrent et des smashs qui claquent. Choisis ton
  terrain, ramène ta team. »

### 3.3 Rail par mois

- Un conteneur défilant horizontalement (`overflow-x: auto`,
  `overscroll-behavior-x: contain`, barre de défilement masquée,
  `scroll-snap-type: x proximity`, `scroll-padding-inline: --tp-content-pad`),
  focusable (`tabindex="0"`) avec `aria-label="Tournois par mois"`.
- Mobile (< 768 px) : le rail **déborde jusqu'aux bords de l'écran**
  (`margin-inline: -16px; padding-inline: 16px`) ; la page ne doit jamais
  défiler horizontalement.
- Un **groupe par mois** (`scroll-snap-align: start`), séparé du suivant par
  un trait vertical pointillé `1px dashed var(--color-divider)` et 28 px de
  part et d'autre. Pas de trait après le dernier.
- **Titre du mois** : nom complet en français (« Octobre »), police Frick
  0.3, majuscules, `skewX(-11deg)`, `clamp(3rem, 6vw, 5.25rem)` (3rem mobile),
  interligne .9, `padding-inline: .14em .1em` et 6 px de retrait pour que
  l'inclinaison ne soit jamais rognée.
  - Mois passé : contour seul, `-webkit-text-stroke: 1.5px rgba(16,24,40,.22)`, remplissage transparent.
  - Mois en cours : plein `--color-text-primary`.
  - Mois à venir : contour seul `--color-text-primary`.
- À droite du titre (ligne de base) : compteur 13 px gras gris, « 1 tournoi »
  / « N tournois » / « Rien encore ». Pour le mois en cours : pastille lime
  « Ce mois-ci · N tournois ».
- Sous le titre, les billets du mois en ligne (gap 16 px, alignés en bas),
  largeur fixe **340 px** (`min(300px, 80vw)` sur mobile), triés par date.
- **Repère « Aujourd’hui »** dans le mois en cours, entre les tournois joués
  et ceux à venir : trait vertical noir de 2 px sur toute la hauteur des
  billets (marges 44 px avant, 20 px après), étiquette noire texte lime
  « Aujourd’hui · 22 » écrite **à la verticale** le long du trait, à sa
  gauche (`writing-mode: vertical-rl; rotate: 180deg`).
- **Mois à venir sans tournoi** (jusqu'à mois en cours + 2 au minimum) :
  case 240 px (200 px mobile), pointillés 2 px, rayon 24 px, texte gras
  « Aucun tournoi en décembre pour l’instant. » et bouton lime « Créer le
  premier → » vers `organisateur/`.
- Les mois **passés sans tournoi** ne sont pas affichés.
- La **carte création** « Ton prochain tournoi » est le dernier élément du
  dernier mois.
- Sous le rail : **barre de progression** décorative (`aria-hidden`), 4 px,
  fond `--color-light-gray`, curseur noir dont largeur = part visible et
  position = défilement.

### 3.4 Position au chargement

Au premier rendu, faire défiler le rail pour que **le mois en cours soit
aligné au début** (les mois passés restent accessibles à gauche). Sans mois
en cours (aucun tournoi ce mois et aucun à venir), aligner le premier mois à
venir, sinon rester au début. `scrollLeft` direct, jamais d'animation.

### 3.5 Billets

Le billet garde **exactement** le balisage et le CSS d'`appTicket()` (§10.7),
avec ces seuls changements :

1. **Pied** : le rond `span.tp-expand` (chevron bas) n'est plus rendu sur les
   billets générés. Le bouton occupe toute la largeur.
2. **Bouton** : toujours « Voir le tournoi », lien `/tournament/?id=<id>`
   (texte masqué ` : <titre>` conservé). Lime quand les inscriptions sont
   ouvertes et qu'il reste de la place, blanc (`.is-secondary`) sinon et pour
   tous les tournois joués. En mode démo : `span[aria-disabled="true"]`
   comme aujourd'hui.
3. **Tournoi joué** (liste `recent`), classe `.is-past` :
   - tête **blanche** (`--color-text-white`) au lieu du dégradé, texte
     `--color-text-primary`, contour intérieur `inset 0 0 0 1px var(--color-divider)` ;
   - cadre de date `rgba(16,24,40,.22)`, mois et méta en `--color-medium-gray` ;
   - compteur « N équipes » (omis si 0), statut « Terminé » précédé d'un
     trophée 14 px (`aria-hidden`), en `--color-text-primary` ;
   - barre de progression : fond `--color-light-gray`, remplissage plein
     `--color-text-primary` ;
   - pied et bouton inchangés (fond `#1A1A1A`, bouton blanc).
4. Tournois à venir : états ouvert / complet / inscriptions closes / sans
   capacité **identiques à aujourd'hui**.
5. La **carte création** reste identique (rond « + » compris, voir D1).

## 4. Page tournoi — design cible

Référence : `visuals/page-tournoi-*.jpg`. Refonte de
`website/tournament/index.html` (même URL `/tournament/?id=<id>`, même
rebond `404.html`, même smart deep link).

### 4.1 Structure

1. Lien « ← Tous les tournois » (pastille grise, ≥ 44 px) vers
   `/#derniers-tournois`.
2. **Bandeau** arrondi 32 px : cadre de date 116 px (84 px mobile), pastille
   d'état, H1 Roboto 700 `clamp(2rem, 4.4vw, 3.5rem)`, ligne « Ville •
   N×N • Genre », nom du mois en très grand (Frick, contour seul) en
   filigrane `aria-hidden` en bas à droite.
   - À venir : fond = dégradé du billet (`--tp-ticket-contrast-shade`,
     `--tp-ticket-head`), texte blanc ; pastille lime « Inscriptions
     ouvertes » ou translucide « Complet » / « Inscriptions closes ».
   - Joué : fond `--color-light-gray`, texte foncé, pastille noire
     « Terminé » avec trophée.
   - Annulé : fond `--color-light-gray`, pastille « Tournoi annulé »
     (conserver `#tournamentCancelledNote`).
3. Corps en 2 colonnes (1fr / 360 px, gap 32 px ; 1 colonne sous 1024 px) :
   - **Infos pratiques** : liste `dl` en 2 colonnes (1 en mobile), chaque
     ligne = icône 40 px sur fond gris + libellé gris + valeur grasse.
     Lignes : Date (« Samedi 24 octobre 2026 »), Coup d’envoi (« 9 h 00 »),
     Lieu, Format (« 4×4 · Mixte »), Niveau, Prix par équipe. Une ligne
     sans donnée est **omise**.
   - **Le tournoi** : description de l'organisateur (texte brut), puis les
     équipements en pastilles grises.
   - Bloc « Organisé par » + nom de l'organisateur (avatar à initiales).
   - **Panneau** noir (sticky en desktop), rayon 28 px :
     - à venir, places libres : « Réserve ta place », prix en Frick lime,
       compteur et barre de remplissage, bouton lime **« S’inscrire dans
       l’app »** ;
     - complet / closes : « Ce tournoi affiche complet » (ou « Inscriptions
       closes »), bouton blanc ;
     - joué : « Tournoi terminé », « N équipes ont joué », phrase « Le
       classement final se consulte dans l’app Yamatch. », bouton lime « Voir
       les prochains tournois » → `/#derniers-tournois` ;
     - mention « L’inscription et le paiement se font dans l’app Yamatch,
       disponible sur iPhone et Android. » + lien « Télécharger Yamatch »
       (`/download/`).
4. Le bouton d'inscription garde le comportement actuel de `#openInApp`
   (`joinTournament()` : schéma de l'app puis repli store). Le libellé
   change, l'id et la logique restent.
5. États existants à conserver : chargement (squelettes), lien invalide,
   introuvable, erreur réseau avec « Réessayer », annulé.

### 4.2 Données de la page

La page lit déjà `GET /rest/v1/tournaments?id=eq.<id>` en anonyme (RLS :
tout tournoi dont `status <> 'draft'`). Étendre le `select` **uniquement**
avec des colonnes publiques :

| Affichage | Colonnes | Format |
|---|---|---|
| Date, mois | `date` | « Samedi 24 octobre 2026 », mois en filigrane |
| Coup d’envoi | `start_time` (`HH:MM:SS`) | « 9 h 00 » ; ligne omise si null |
| Lieu | `address`, sinon `location` | texte |
| Ville du bandeau | `location` | texte |
| Format | `players_per_team`, `gender` | « 4×4 · Mixte » |
| Niveau | `levels` (text[]) | `loisir`→Loisir, `departemental`→Départemental, `regional`→Régional, `preNational`→Pré-National, `national`→National, dans cet ordre, joints par « · » ; valeur inconnue ignorée |
| Prix | `price_per_team`, `is_free` | `formatPrice()` existant ; `is_free` → « Gratuit » |
| Capacité | `max_teams` | « Jusqu’à N équipes » si le nombre d'inscrits est inconnu |
| Description | `description` | texte brut, `textContent`, lignes vides conservées |
| Équipements | `terrain`, `has_buvette`, `has_accessible_parking`, `has_prizes` | pastilles « Indoor » / « Outdoor » / « Beach », « Buvette », « Parking accessible », « Lots à gagner » |
| Organisateur | `organizer_name` | texte ; bloc omis si vide |
| État | `status`, `registrations_closed`, `is_closed` | voir 4.1 ; `status = 'finished'` ou date passée → joué |

**Interdits** : ne jamais sélectionner `organizer_phone`, `organizer_email`,
`organizer_instagram`, `lat`, `lng` ni aucune donnée de participant (audit
téléphone du 12/10/2026). Toujours insérer le texte avec `textContent`.

Avant de coder, vérifier en anonyme que chaque colonne répond (HTTP 200) sur
la PROD avec un id publié réel ; une colonne absente se retire du `select`
et sa ligne est omise.

**Nombre d'équipes inscrites et ouverture des inscriptions** : non lisibles
en anonyme depuis `tournaments`. Voir décision D3.

## 5. Logique JS (section)

- `normalizePayload()`, cache, chargement à l'approche, timeout, mode démo :
  **inchangés**.
- `render()` participant : construire les mois à partir de
  `model.recent` (joués) et `model.upcoming` (à venir). Afficher **tous** les
  tournois valides reçus (≤ 9 joués, ≤ 6 à venir) ; `MAX_UPCOMING_V2` ne
  s'applique plus à cette variante.
- Le **classement joué / à venir vient de la liste**, jamais de l'horloge du
  visiteur. Le mois en cours et le chiffre de « Aujourd’hui · 22 » se
  calculent en **Europe/Paris**. Les mois des tournois se lisent en UTC
  depuis `date` (comme `formatDate`).
- Plage de mois : du mois du plus ancien tournoi joué jusqu'au plus tardif
  entre le dernier mois à venir et mois en cours + 2. Gérer le passage
  d'année (« Janvier » après « Décembre »).
- Visibilité inchangée : section visible dès 1 billet valide, cachée sinon ;
  la carte création seule ne la rend jamais visible ; exception de rendu →
  section cachée et vidée ; événement `yamatch:showcase-layout` émis comme
  aujourd'hui.
- La carte création statique (`[data-showcase-create]`) est déplacée dans le
  dernier mois au rendu (ou clonée), sans perdre son lien.
- Barre de progression : écoute `scroll` passive + `resize`, mise à jour par
  `requestAnimationFrame`.
- Supprimer `renderTicker()` et le code du bandeau devenus inutiles côté
  participant ; `hideSection()` ne doit plus dépendre de `.tp-ticker`.
- Variante `organizer` : `ticket()`, `gauge()`, `wireRailNav()`
  **intacts**.

## 6. Accessibilité

- Un seul H2. Chaque mois = groupe `role="group"` (ou `li`) avec
  `aria-labelledby` vers son titre de mois (H3) ; les titres de billets
  passent en H4 sans changement visuel.
- Rail focusable avec contour visible ; les flèches du clavier le font
  défiler nativement. Aucun bouton précédent/suivant.
- Titres de mois en contour : vérifier le contraste du mois passé ; le
  compteur à côté porte l'information en texte normal.
- Repère « Aujourd’hui » lisible par les lecteurs d'écran (texte réel, pas
  un pseudo-élément).
- Cibles ≥ 44 px, `prefers-reduced-motion` : aucun défilement animé.
- Page tournoi : un H1, sections avec H2, icônes `aria-hidden`, `dl/dt/dd`.

## 7. Décisions du founder — défauts recommandés

| # | Question | Défaut recommandé |
|---|---|---|
| D1 | La carte création garde-t-elle son rond « + » ? | Oui, seul le rond à chevron des billets est retiré |
| D2 | Combien de mois à venir vides montrer ? | Jusqu'à mois en cours + 2 |
| D3 | Nombre d'inscrits, places restantes et podium sur la page tournoi ? | Lot backend séparé dans `yamatch/supabase` : RPC publique `get_public_tournament(p_id)` (mêmes règles que `get_public_showcase`). En attendant, la page affiche « Jusqu’à N équipes » sans barre, et « Tournoi terminé » sans podium |
| D4 | Une page tournoi pour les tournois joués ? | Oui, même URL, état « Terminé » |
| D5 | Page organisateur | Inchangée, hors périmètre |

## 8. Plan de délégation (respecter `CLAUDE.md`)

Chaque spécialiste commence par **Current State Summary** et **Verified
safety greps**.

1. **`html-expert`** — `index.html` : retirer les SVG terrain et le bandeau
   `.tp-ticker` ; garder l'en-tête ; remplacer `ol.tp-cards` par le
   conteneur du rail (attributs `data-showcase-rail-block` /
   `data-showcase-rail` conservés) + la barre de progression ; garder la carte
   création statique. `tournament/index.html` : nouvelle structure §4 en
   **conservant les ids** testés (`tournamentTitle`, `tournamentBody`,
   `tournamentCancelledNote`, `tournamentPriceWrap`, `tournamentPrice`,
   `openInApp`, `retryTournament`).
2. **`js-expert`** — `script.js` : rendu par mois (§5), billets §3.5,
   position initiale §3.4, barre de progression. `tournament/index.html`
   (script inline) : `select` étendu §4.2, formats, états, libellés.
3. **`css-expert`** — `styles.css` §10.7 : suppression de la bande, rail,
   mois, repère, case vide, progression, `.is-past`, pied sans rond ;
   tokens nouveaux dans `:root`. Styles de la page tournoi (dans sa feuille
   inline actuelle ou `styles.css`, selon l'existant). Puis
   `npm run build:css`.
4. **`website-reviewer`** — revue 7 catégories + comparaison aux `visuals/`
   avec `?showcase=demo`.
5. **`doc-keeper`** — `docs/WEBSITE_ARCHITECTURE.md` § « Public tournament
   rails » et page tournoi ; `docs/handoff/README.md` (statut).

## 9. Critères d'acceptation

- [ ] Avec `?showcase=demo`, section conforme aux `visuals/` à 1440, 820 et
      390 px (données différentes, même structure, même style).
- [ ] Aucun cadre, fond gris, terrain ni bandeau défilant.
- [ ] Mois passés, en cours et à venir dans le bon style ; mois en cours
      aligné au chargement ; mois passés atteignables à gauche.
- [ ] Billets joués à tête blanche, « N équipes · Terminé ».
- [ ] Aucun rond à chevron ; « Voir le tournoi » sur chaque billet, vers
      `/tournament/?id=…` ; lime seulement si ouvert avec de la place.
- [ ] Repère « Aujourd’hui » placé entre joués et à venir du mois en cours.
- [ ] Case « Aucun tournoi en … » pour les mois à venir vides ; carte création
      en dernier.
- [ ] Section cachée sans donnée valide ; RPC, cache, démo inchangés.
- [ ] Page organisateur identique avant/après (captures).
- [ ] Page tournoi conforme aux `visuals/page-tournoi-*` pour à venir,
      complet et joué ; états introuvable, invalide, erreur, annulé
      vérifiés ; deep link inchangé.
- [ ] Aucune colonne de contact ni coordonnée GPS demandée à Supabase.
- [ ] Pas de défilement horizontal de la page de 320 à 1920 px.
- [ ] Un H1 (page) / un H2 (section), focus visible, contraste AA, cibles
      ≥ 44 px, mouvement réduit respecté.
- [ ] Aucune couleur brute hors `:root` ; `npm run build:css`, `npm test`
      et `npm run build` passent ; tests de la page tournoi adaptés si
      besoin, jamais affaiblis.
- [ ] `docs/WEBSITE_ARCHITECTURE.md` à jour.

## 10. Hors périmètre

RPC et migrations (D3), page organisateur, autres sections de l'accueil,
app mobile. **Pas de merge sur `main` sans GO du founder** : un push sur
`main` publie le site en production.
