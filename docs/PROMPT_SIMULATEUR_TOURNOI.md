# 🎮 PROMPT — Simulateur de tournoi Yamatch

> **Document destiné aux agents Claude travaillant sur l'application Yamatch (Flutter).**
> Ce fichier est le **contrat d'implémentation** de la fonctionnalité « Simulateur de tournoi ».
> Il fait autorité sur toute interprétation. En cas de conflit avec une habitude de code, c'est ce
> document qui gagne — sauf pour les conventions techniques du repo app, qui restent souveraines.

---

## 0. PROMPT DE LANCEMENT (à copier-coller tel quel à l'agent orchestrateur)

```
Tu vas implémenter la fonctionnalité « Simulateur de tournoi » dans l'application Yamatch.

La spécification complète et non négociable se trouve dans docs/PROMPT_SIMULATEUR_TOURNOI.md.
Lis-la INTÉGRALEMENT avant toute action.

Contraintes de méthode :
1. PHASE 0 obligatoire — reconnaissance du code existant (§9). Tu ne produis AUCUNE ligne de code
   tant que la cartographie n'est pas rendue et validée. Tu ne devines JAMAIS un nom de fichier,
   de modèle, de route ou de collection : tu le lis dans le code.
2. Tu découpes le travail en lots (§10) et tu délègues chaque lot à l'agent spécialiste approprié.
3. Chaque agent rend un rapport au format §11 (Current State Summary + Verified safety greps).
   Un rapport sans ces deux sections est rejeté et le lot est relancé.
4. Aucun lot n'est « done » sans les critères d'acceptation §12 vérifiés un par un, preuves à l'appui.
5. Règle d'or : le simulateur RÉUTILISE le code réel. Tout fork/duplication de la logique métier
   (génération de poules, calcul de classement, moteur de matchs) est un échec de conception.
   Si tu es tenté de dupliquer, remonte-le comme blocage au lieu de le faire.

Livrable final : la feature complète, testée, derrière un feature flag, sur la branche dédiée.
```

---

## 1. Contexte produit & problème à résoudre

**Le problème.** Un organisateur qui découvre Yamatch ne peut pas se projeter : pour comprendre ce que
l'app fait, il doit créer un vrai tournoi, inviter de vraies équipes, attendre de vraies inscriptions.
Le coût d'entrée est trop élevé, et l'organisateur non encore validé est bloqué avant même d'avoir
pu juger de la valeur du produit.

**La solution.** Un **simulateur** : un bac à sable qui rejoue **à l'identique** le parcours réel
(création → configuration → équipes → poules → matchs → arbitrage → classement → clôture), avec un
jeu de données généré automatiquement, et sans aucun effet de bord vers l'extérieur.

**Objectif mesurable.** L'organisateur doit pouvoir, en moins de 2 minutes et sans aucune saisie de
données réelles, arriver à un tournoi complet avec des équipes, des poules et des matchs arbitrables.

**Public visé.** TOUS les organisateurs, **validés ou non validés**. C'est un point central : le
simulateur est précisément l'outil qui permet à un organisateur non validé de comprendre le produit
pendant que sa validation est en cours.

---

## 2. Vocabulaire (à utiliser tel quel dans le code et les commits)

| Terme | Définition |
|---|---|
| **Simulation** | Un tournoi dont le champ `isSimulation` vaut `true`. |
| **Tournoi réel** | Tout tournoi dont `isSimulation` vaut `false` ou est absent. |
| **Slot** | Une place d'équipe attendue dans le tournoi (= `expectedTeamsCount` défini à la création). |
| **Équipe test** | Équipe générée automatiquement, nommée `Team Test 1️⃣`, avec ses joueurs. |
| **Joueur libre** | Joueur test généré **sans équipe associée**, en attente de regroupement. |
| **Régénération** | Action de créer une nouvelle simulation, qui **détruit** la précédente. |
| **Effet de bord externe** | Toute action qui produit un signal hors de l'app pour l'utilisateur courant : email, SMS, push vers un tiers, lien public, QR code, webhook, export partageable. |

---

## 3. Périmètre

### 3.1 DANS le périmètre (à livrer)

1. Point d'entrée dédié : carte + bouton **« Créer un tournoi avec le simulateur »**.
2. Flow de création de tournoi **identique** au réel, à l'exception des règles §5.
3. Auto-remplissage du tournoi à la création (§6).
4. Parcours complet post-création : configuration, gestion des équipes et des joueurs libres,
   génération des poules, génération des matchs, gestion des présences, arbitrage / saisie des
   scores, phases finales, classement final, clôture du tournoi.
5. Unicité et cycle de vie de la simulation (§7).
6. Blocage strict de tous les effets de bord externes (§5.3).
7. Identification visuelle permanente du mode simulation (§8).
8. Isolation des données de simulation dans toutes les lectures agrégées (§5.4).
9. Règles de sécurité backend (§4.4).
10. Tests (§12) et instrumentation analytics (§13).

### 3.2 HORS périmètre (ne pas faire, même si ça paraît une bonne idée)

- ❌ Onboarding/tutoriel guidé pas-à-pas superposé au simulateur (autre chantier).
- ❌ Simulation multi-joueurs / partagée entre plusieurs organisateurs.
- ❌ Conversion d'une simulation en tournoi réel (« promouvoir ma simulation »).
- ❌ Auto-remplissage automatique des scores (voir §14 — backlog P2).
- ❌ Refonte du flow de création réel « au passage ».
- ❌ Toute modification du flow réel qui ne serait pas strictement nécessaire au support du flag.

> **Si un lot t'oblige à modifier le flow réel au-delà de l'ajout du flag et des garde-fous, tu
> t'arrêtes et tu remontes la question. Tu ne décides pas seul d'élargir le périmètre.**

---

## 4. Architecture & modèle de données

### 4.1 Décision d'architecture (arbitrée, non rediscutable)

**La simulation vit dans le backend, dans les mêmes collections/tables que les tournois réels, avec
un champ discriminant `isSimulation: true`.**

Justification : c'est la seule option qui garantit que le simulateur exerce **exactement le même code**
que le produit réel (mêmes repositories, mêmes règles de poules, même moteur de matchs, même calcul
de classement). Une sandbox locale divergerait au premier changement métier et le simulateur mentirait
à l'utilisateur.

**Corollaire, à traiter comme une dette payée d'avance :** puisque les données cohabitent, **chaque
lecture agrégée doit être auditée et filtrée** (§5.4). C'est le coût de cette décision, il est
assumé, il doit être payé intégralement — un oubli de filtre est un bug bloquant.

### 4.2 Champs à ajouter

Sur le modèle **Tournoi** :

| Champ | Type | Défaut | Rôle |
|---|---|---|---|
| `isSimulation` | `bool` | `false` | Discriminant principal. **Non modifiable après création.** |
| `simulationCreatedAt` | `timestamp?` | `null` | Horodatage de génération, sert au TTL (§7.4). |
| `simulationSeed` | `string?` | `null` | Graine de génération, pour reproductibilité et debug. |

Sur les modèles **Équipe** et **Joueur** générés :

| Champ | Type | Rôle |
|---|---|---|
| `isSimulated` | `bool` | `true` pour toute entité générée par le simulateur. |

> Règles impératives :
> - Le champ s'appelle **`isSimulation`** sur le tournoi et **`isSimulated`** sur les entités filles.
>   Ne change pas ces noms.
> - Les champs sont **optionnels/nullable en lecture** avec un défaut `false`, pour que les documents
>   existants en base restent valides sans migration.
> - `isSimulation` est **immuable** : aucun chemin de code, aucune règle backend ne doit permettre de
>   passer un tournoi de `true` à `false` ou l'inverse.

### 4.3 Sérialisation

- `toJson` / `fromJson` (ou l'équivalent du repo) doivent gérer l'absence du champ → `false`.
- Ajoute un test unitaire de désérialisation d'un document **sans** le champ.
- Si le repo utilise de la génération de code (freezed / json_serializable), régénère avec l'outillage
  du repo, **jamais à la main**.

### 4.4 Sécurité backend

Écris/adapte les règles de sécurité (Firestore rules, RLS, ou middleware selon le backend réel) :

1. Un utilisateur ne peut créer un tournoi avec `isSimulation: true` que **pour lui-même**
   (`organizerId == auth.uid`).
2. Un tournoi `isSimulation: true` est **lisible uniquement par son organisateur**. Aucun accès
   public, aucun accès par lien, aucun accès invité.
3. `isSimulation` ne peut jamais être modifié après création (`resource.data.isSimulation ==
   request.resource.data.isSimulation`).
4. Un utilisateur ne peut posséder **qu'un seul** tournoi `isSimulation: true` non supprimé. Si le
   backend ne permet pas cette contrainte déclarativement, elle est appliquée côté service **et**
   vérifiée par une fonction serveur / un test d'intégration.
5. Aucune fonction cloud d'envoi (email, push, SMS, webhook) ne doit se déclencher sur un document
   dont `isSimulation == true`. **Audite tous les triggers existants** et ajoute le garde en tête de
   chaque handler.

---

## 5. Règles fonctionnelles

Chaque règle est identifiée. Cite l'identifiant dans les commits, les tests et les PR.

### 5.1 Accès

| ID | Règle |
|---|---|
| **RF-01** | Le point d'entrée du simulateur est visible pour **tout** compte organisateur, **quel que soit son statut de validation** (validé, en attente, refusé). |
| **RF-02** | Le gate de validation organisateur est contourné **uniquement** sur le chemin simulation. Le flow de création réel conserve son gate **inchangé**. |
| **RF-03** | Le simulateur n'est **pas** accessible aux comptes joueur/participant qui ne sont pas organisateurs. |
| **RF-04** | La fonctionnalité entière est derrière un feature flag `simulator_enabled` (défaut : `true` en dev, piloté à distance en prod si le repo dispose d'un mécanisme de remote config ; sinon constante compilée documentée). |

### 5.2 Création

| ID | Règle |
|---|---|
| **RF-10** | Le flow de création simulé réutilise **les mêmes écrans, les mêmes widgets et le même validateur** que le flow réel. Aucun écran dupliqué. |
| **RF-11** | **La date du tournoi est verrouillée sur la date du jour.** Le champ est affiché, rempli, **désactivé** (non éditable, non focusable), avec le texte d'aide : « Date fixée à aujourd'hui en mode simulation ». Le sélecteur de date ne s'ouvre pas. |
| **RF-12** | Si le flow réel comporte une heure de début, une date de fin ou une deadline d'inscription, elles sont **dérivées de la date du jour** et verrouillées de la même manière (heure de début = prochaine heure ronde, date de fin = aujourd'hui, deadline = maintenant). |
| **RF-13** | Tous les autres paramètres restent **librement éditables** : nom, sport/discipline, format, nombre d'équipes attendues, taille des équipes, nombre de terrains, durée des matchs, règles de score, etc. |
| **RF-14** | Le nom par défaut proposé est **« Tournoi de démonstration »**, modifiable par l'organisateur. |
| **RF-15** | À la validation du formulaire, le tournoi est créé avec `isSimulation: true` **et** l'auto-remplissage §6 s'exécute dans la même opération logique. L'utilisateur ne doit jamais voir un tournoi simulé vide. |
| **RF-16** | L'auto-remplissage est **atomique du point de vue de l'utilisateur** : en cas d'échec partiel, on nettoie et on affiche une erreur ; on ne laisse pas une simulation à moitié peuplée. |

### 5.3 Interdits (effets de bord externes)

| ID | Règle |
|---|---|
| **RF-20** | **Partage désactivé** : bouton/menu de partage, copie de lien, lien public, QR code, deep link partageable. Les contrôles sont **visibles mais désactivés**, avec un tooltip/snackbar : « Indisponible en mode simulation ». |
| **RF-21** | **Invitations désactivées** : invitation d'équipe, de joueur, d'arbitre, de co-organisateur — par email, SMS, lien, ou in-app. |
| **RF-22** | **Aucune notification sortante** vers un tiers : push, email transactionnel, SMS, webhook. Les notifications **locales à l'organisateur lui-même** restent autorisées si elles existent (ex. rappel in-app). |
| **RF-23** | **Aucune inscription externe** : personne d'autre que l'organisateur ne peut rejoindre, s'inscrire ou consulter une simulation. |
| **RF-24** | **Exports désactivés** en v1 (PDF, CSV, image de tableau). Contrôles visibles + désactivés + message. |
| **RF-25** | Le tournoi simulé **n'apparaît jamais** dans les listes publiques, la recherche, les tournois à proximité, les recommandations, ni dans aucun flux visible par un autre utilisateur. |
| **RF-26** | La simulation **ne consomme aucun quota** (nombre de tournois autorisés, limites d'abonnement) et **ne déclenche aucun parcours de paiement**. |
| **RF-27** | **Défense en profondeur, non négociable** : chaque interdit est appliqué à **trois** niveaux — (a) UI désactivée, (b) garde dans le service/use-case qui `throw` ou retourne une erreur explicite, (c) règle backend. Une seule des trois couches ne suffit pas. |

### 5.4 Isolation des données

| ID | Règle |
|---|---|
| **RF-30** | **Audite exhaustivement** toutes les requêtes qui listent, comptent ou agrègent des tournois, équipes ou joueurs, et ajoute le filtre `isSimulation != true`. Cible minimale à vérifier : listes publiques, recherche, statistiques organisateur, statistiques joueur, historique, classements globaux, badges/trophées, compteurs de la page profil, tableaux de bord admin, exports analytics. |
| **RF-31** | **Seule exception** : la section **« Organisés »** de l'organisateur propriétaire, où la simulation apparaît avec son badge (§8.3). |
| **RF-32** | Les joueurs et équipes générés ne doivent **jamais** apparaître dans un annuaire, une recherche de joueurs, une suggestion d'équipe, ou une statistique de joueur réel. |
| **RF-33** | Livre le résultat de l'audit RF-30 sous forme de **tableau exhaustif** (fichier:ligne → requête → filtre ajouté → oui/non). Une requête non filtrée volontairement doit être justifiée ligne par ligne. |

### 5.5 Parcours post-création

| ID | Règle |
|---|---|
| **RF-40** | L'organisateur peut **modifier les équipes générées** : renommer, supprimer, ajouter une équipe, déplacer un joueur. |
| **RF-41** | L'organisateur peut **regrouper les joueurs libres** en équipes, exactement comme dans le flow réel. |
| **RF-42** | **Génération des poules** : identique au réel, aucune règle assouplie. |
| **RF-43** | **Génération des matchs** : identique au réel (terrains, créneaux, rotations). |
| **RF-44** | **Gestion des présences** : l'organisateur peut basculer la présence d'une équipe ou d'un joueur, avec les mêmes conséquences que dans le réel (forfait, recalcul, etc.). |
| **RF-45** | **Arbitrage / saisie des scores** : identique au réel, y compris la validation des scores et la correction a posteriori. |
| **RF-46** | **Phases finales, classement final et clôture** : identiques au réel. La simulation va **jusqu'au bout du cycle de vie**. |
| **RF-47** | Un tournoi simulé **clôturé** reste consultable jusqu'à la prochaine régénération ou l'expiration du TTL (§7.4). |

---

## 6. Génération du jeu de données

### 6.1 Algorithme (déterministe à partir de `simulationSeed`)

Entrées : `expectedTeamsCount` (N, saisi par l'organisateur), `playersPerTeam` (P, issu de la config
du tournoi ; si le format n'en définit pas, utiliser la valeur par défaut du sport concerné telle
qu'elle existe déjà dans le code — **ne pas inventer une constante**).

```
teamsToGenerate    = max(1, round(N * 0.8))
if (teamsToGenerate == N && N >= 2) teamsToGenerate = N - 1   // garantit ≥ 1 slot de joueurs libres
remainingSlots     = N - teamsToGenerate
freePlayersCount   = remainingSlots * P
```

Exemples à reprendre **tels quels** en tests unitaires :

| N (équipes attendues) | P | Équipes générées | Slots restants | Joueurs libres |
|---|---|---|---|---|
| 1 | 5 | 1 | 0 | 0 |
| 2 | 5 | 1 | 1 | 5 |
| 4 | 5 | 3 | 1 | 5 |
| 5 | 5 | 4 | 1 | 5 |
| 8 | 4 | 6 | 2 | 8 |
| 10 | 5 | 8 | 2 | 10 |
| 12 | 6 | 10 | 2 | 12 |
| 16 | 4 | 13 | 3 | 12 |
| 20 | 5 | 16 | 4 | 20 |

### 6.2 Nommage des équipes

Format : `Team Test ` + numéro en **emoji keycap**, à partir de 1.

```
1 → 1️⃣   2 → 2️⃣   3 → 3️⃣   4 → 4️⃣   5 → 5️⃣
6 → 6️⃣   7 → 7️⃣   8 → 8️⃣   9 → 9️⃣   10 → 🔟
11 et au-delà → concaténation des keycaps : 11 → 1️⃣1️⃣, 12 → 1️⃣2️⃣, 20 → 2️⃣0️⃣
```

> - Le keycap est la séquence `chiffre + U+FE0F + U+20E3`. `🔟` est le caractère unique `U+1F51F`.
> - Écris une fonction utilitaire pure `keycapNumber(int n) → String` **testée unitairement**
>   sur les valeurs 1, 9, 10, 11, 20, 99.
> - Vérifie le rendu réel sur device iOS **et** Android : si un keycap composé casse le layout
>   (troncature, hauteur de ligne), remonte-le — ne change pas la convention de ton propre chef.

### 6.3 Nommage des joueurs

- Joueurs d'une équipe : `Joueur Test {i}` où `i` est l'index global croissant sur tout le tournoi
  (pas de remise à zéro par équipe), afin qu'aucun homonyme n'existe.
- Joueurs libres : même convention, en continuant la numérotation après les joueurs en équipe.
- Renseigne les champs obligatoires du modèle joueur avec des valeurs neutres et évidemment fictives.
  **Aucune donnée personnelle plausible** : pas d'email réel, pas de numéro de téléphone au format
  valide, pas de photo. Utilise le domaine réservé `@example.invalid` si un email est requis.
- Les joueurs générés **ne sont pas** des comptes utilisateurs : ils ne doivent créer aucune entrée
  dans la table/collection des utilisateurs, ni consommer de place d'authentification.

### 6.4 Répartition dans les équipes

- Chaque équipe test générée est **complète** : exactement `P` joueurs.
- Si le format autorise des remplaçants, ne pas en générer en v1.
- Les joueurs libres sont créés **sans `teamId`**, dans l'état exact qu'a un joueur réel inscrit
  individuellement et non encore rattaché — **relis le code pour identifier cet état, ne le
  suppose pas**.

### 6.5 Performance

- La génération doit s'exécuter en **écritures groupées** (batch/transaction), pas en boucle de
  requêtes unitaires.
- Cible : **< 3 s** pour N = 20, P = 6 (≈ 16 équipes + 100 joueurs) sur une connexion normale.
- Affiche un état de chargement explicite pendant la génération : « Génération de votre tournoi de
  démonstration… ».
- Si le backend impose une limite de taille de batch, découpe en lots successifs **en conservant la
  garantie de nettoyage RF-16** en cas d'échec en cours de route.

---

## 7. Cycle de vie & unicité

| ID | Règle |
|---|---|
| **RF-50** | Un organisateur ne possède **au plus une** simulation à la fois. |
| **RF-51** | Lancer une nouvelle simulation alors qu'une existe affiche une **confirmation explicite** avant toute destruction (§8.4). |
| **RF-52** | Après confirmation, l'ancienne simulation est **supprimée intégralement** : tournoi, équipes, joueurs, poules, matchs, scores, classements, médias, et toute entité fille. Aucun orphelin. |
| **RF-53** | L'ordre des opérations est **suppression complète puis création**. Il ne doit jamais exister deux simulations simultanées, même transitoirement. |
| **RF-54** | Si la suppression échoue, la création **n'a pas lieu** et l'erreur est affichée. |
| **RF-55** | L'organisateur peut supprimer sa simulation manuellement sans en recréer une, depuis la section « Organisés ». |
| **RF-56** | **TTL** : une simulation dont `simulationCreatedAt` date de plus de **30 jours** est purgée automatiquement (job serveur si le backend le permet, sinon nettoyage opportuniste au démarrage de l'app côté organisateur propriétaire). Documente la stratégie retenue. |

> **Point d'attention (cascade).** Identifie dans le code **toutes** les entités filles d'un tournoi
> avant d'écrire la suppression. Livre la liste dans ton rapport. Une suppression incomplète laisse
> des données fantômes en base qui pollueront les agrégats — c'est un défaut bloquant, pas un détail.

---

## 8. UI / UX & copies françaises

Toutes les chaînes passent par le système de traduction du repo s'il existe. **Aucune chaîne en dur**
si le projet est internationalisé. Français comme langue source.

### 8.1 Point d'entrée

Sur l'écran d'accueil organisateur (ou l'écran listant les tournois organisés), une **carte dédiée**,
visuellement distincte de l'action principale « Créer un tournoi », et **secondaire** par rapport à
elle (elle ne doit pas concurrencer le vrai parcours) :

- **Titre :** `Créer un tournoi avec le simulateur`
- **Sous-titre :** `Testez Yamatch de A à Z avec un tournoi de démonstration pré-rempli. Aucune invitation ne sera envoyée.`
- **Icône :** cohérente avec le design system existant (piste : sciences/labo, manette, ou baguette magique — choisis dans l'iconographie déjà utilisée, n'introduis pas une nouvelle famille d'icônes).
- **Affichage renforcé pour l'organisateur non validé** : la carte est mise en avant, accompagnée de
  `Votre compte est en cours de validation — découvrez dès maintenant Yamatch avec le simulateur.`

### 8.2 Pendant le flow de création

- Bandeau persistant en haut de l'écran : `Mode simulation`
- Champ date : désactivé, aide `Date fixée à aujourd'hui en mode simulation`
- Bouton de validation final : `Générer mon tournoi de démonstration`

### 8.3 Sur le tournoi simulé

- **Badge permanent** `SIMULATION` sur la carte du tournoi dans « Organisés », **et** dans l'en-tête
  du détail du tournoi. Le badge doit être lisible en un coup d'œil : jamais l'utilisateur ne doit se
  demander s'il regarde un vrai tournoi.
- Bandeau informatif, refermable par session mais **jamais définitivement** :
  `Ceci est un tournoi de démonstration. Les invitations et le partage sont désactivés.`
- Contrôles interdits (§5.3) : **visibles et désactivés** (jamais masqués — l'organisateur doit voir
  qu'ils existent dans le vrai produit), avec au tap le message
  `Indisponible en mode simulation.`

### 8.4 Régénération

Dialogue de confirmation :

- **Titre :** `Remplacer votre simulation ?`
- **Corps :** `Vous avez déjà un tournoi de démonstration. En créer un nouveau supprimera définitivement le précédent, ainsi que ses équipes, ses poules et ses matchs.`
- **Actions :** `Annuler` (par défaut) / `Remplacer` (style destructif)

### 8.5 États & erreurs

| Situation | Message |
|---|---|
| Génération en cours | `Génération de votre tournoi de démonstration…` |
| Échec de génération | `La génération a échoué. Aucun tournoi n'a été créé. Réessayez.` |
| Échec de suppression | `Impossible de supprimer la simulation précédente. Réessayez.` |
| Action interdite | `Indisponible en mode simulation.` |
| Feature flag off | Point d'entrée totalement absent (pas de placeholder, pas de message). |

### 8.6 Accessibilité

- Le badge `SIMULATION` a un label sémantique lisible par lecteur d'écran.
- Les contrôles désactivés exposent leur raison de désactivation à l'API d'accessibilité.
- Les emojis keycap des noms d'équipes ne doivent pas rendre le nom illisible en synthèse vocale :
  vérifie l'annonce et, si elle est catastrophique, fournis un label alternatif
  (`Team Test 1`) sans changer le nom affiché.

---

## 9. PHASE 0 — Reconnaissance obligatoire (aucun code avant)

Avant toute implémentation, produis une **cartographie** du code existant. Ne devine rien : chaque
affirmation est accompagnée d'un `fichier:ligne`.

Réponds explicitement à ces questions :

1. **Modèle Tournoi** : où est-il défini ? Quels sont ses champs ? Y a-t-il de la génération de code ?
2. **Flow de création réel** : quels écrans, dans quel ordre, quel state management, quel objet
   intermédiaire porte le formulaire ?
3. **Gate de validation organisateur** : où est-il implémenté, comment se teste le statut ?
4. **Modèles Équipe et Joueur** : quels champs obligatoires ? Comment est représenté un joueur
   inscrit **non rattaché à une équipe** ?
5. **Couche d'accès aux données** : repositories, services, backend réel (Firestore ? Supabase ?
   API maison ?), écritures groupées disponibles ?
6. **Génération des poules / des matchs** : où vit la logique, est-elle pure ou couplée à l'UI ?
7. **Partage, invitations, notifications** : liste **exhaustive** des points de sortie externes
   (méthodes, triggers serveur, deep links).
8. **Requêtes agrégées** : liste **exhaustive** des endroits listant/comptant/agrégeant des tournois,
   équipes ou joueurs (cible de RF-30).
9. **Entités filles d'un tournoi** : liste exhaustive, pour la suppression en cascade (RF-52).
10. **Feature flags** : mécanisme existant ? Sinon, quelle est la convention du repo ?
11. **Tests** : frameworks utilisés, où vivent les tests, comment on les lance.
12. **i18n** : mécanisme de traduction, où ajouter les chaînes.

**Livrable Phase 0 :** un document de cartographie + une **proposition de découpage révisée** si la
réalité du code contredit le découpage §10. Le découpage §10 est une hypothèse ; la réalité du code
fait foi. Signale les écarts au lieu de forcer le plan.

---

## 10. Découpage en lots

Chaque lot est autonome, testable, et livré avec ses tests. Les dépendances sont strictes.

| Lot | Contenu | Dépend de |
|---|---|---|
| **L0** | Cartographie Phase 0 (§9) | — |
| **L1** | Modèle & sérialisation : `isSimulation`, `simulationCreatedAt`, `simulationSeed`, `isSimulated` + tests de rétrocompatibilité | L0 |
| **L2** | Feature flag `simulator_enabled` | L0 |
| **L3** | Générateur de données : fonctions **pures** (`keycapNumber`, calcul 80/20, fabriques d'équipes et de joueurs) + tests unitaires exhaustifs sur la table §6.1 | L1 |
| **L4** | Service de simulation : création atomique, unicité, suppression en cascade, TTL | L1, L3 |
| **L5** | Flow de création : verrouillage de la date (RF-11/12), réutilisation des écrans réels, branchement du service | L4 |
| **L6** | Point d'entrée UI : carte + copies + contournement du gate de validation (RF-01/02) | L2, L5 |
| **L7** | Garde-fous : blocage partage / invitations / notifications / exports, aux 3 niveaux (RF-27) | L4 |
| **L8** | Isolation des lectures : audit RF-30 + filtres + tableau de restitution RF-33 | L1 |
| **L9** | Identité visuelle : badges, bandeaux, états désactivés, accessibilité | L5, L7 |
| **L10** | Règles de sécurité backend + gardes sur les triggers serveur (§4.4) | L1 |
| **L11** | Analytics (§13) | L5 |
| **L12** | Tests d'intégration bout-en-bout (§12.3) + campagne QA manuelle (§12.4) | tous |

**Parallélisation possible :** L1/L2 en parallèle ; puis L3, L8, L10 en parallèle ; L7 et L9 en
parallèle une fois L4 livré.

---

## 11. Protocole de rapport des agents (NON NÉGOCIABLE)

Chaque agent commence son rapport par ces deux sections, explicitement titrées. Un rapport sans elles
est **rejeté** et le lot est relancé.

### 1. Current State Summary
5 à 10 lignes prouvant que l'agent a **lu** le code concerné : fichiers, numéros de ligne, noms de
constantes, structure réelle. Aucune généralité, aucune paraphrase du prompt.

### 2. Verified safety greps
La sortie brute des `grep` prouvant que le changement ne casse rien ailleurs : usages de la méthode
modifiée, autres appelants, autres implémentations de l'interface, etc. Commandes visibles, sorties
visibles.

Puis :

### 3. Changements effectués
Liste `fichier:ligne` → ce qui a changé → pourquoi, en citant les identifiants de règles (RF-xx).

### 4. Tests
Commandes lancées + sortie. Un test qui échoue est signalé, jamais masqué.

### 5. Risques & questions ouvertes
Ce que l'agent n'a pas pu vérifier, ce qu'il a dû supposer, ce qui mérite un arbitrage produit.

---

## 12. Critères d'acceptation

### 12.1 Tests unitaires (obligatoires)

- `keycapNumber` : 1, 9, 10, 11, 20, 99.
- Calcul 80/20 : **toutes** les lignes de la table §6.1.
- Numérotation globale des joueurs : aucun doublon de nom sur N = 20.
- Désérialisation d'un tournoi **sans** le champ `isSimulation` → `false`.
- Immutabilité de `isSimulation` : toute tentative de modification échoue.

### 12.2 Tests de service

- Créer une simulation quand aucune n'existe → 1 simulation, équipes et joueurs conformes.
- Créer une simulation quand une existe → l'ancienne et **toutes** ses entités filles sont
  supprimées ; exactement 1 simulation subsiste.
- Échec de suppression → aucune nouvelle simulation créée.
- Échec en cours de génération → aucune donnée résiduelle (RF-16).
- Chaque action interdite (§5.3) appelée au niveau service → erreur explicite.

### 12.3 Tests d'intégration bout-en-bout

Scénario complet, à faire passer en vert :

```
Étant donné un organisateur NON VALIDÉ connecté
Quand il ouvre l'accueil
Alors il voit la carte « Créer un tournoi avec le simulateur »

Quand il la tape et remplit le formulaire avec 10 équipes de 5 joueurs
Alors le champ date est désactivé et vaut la date du jour
Et le tournoi est créé avec isSimulation = true
Et il contient 8 équipes « Team Test 1️⃣ » à « Team Test 8️⃣ » de 5 joueurs chacune
Et il contient 10 joueurs libres sans équipe

Quand il génère les poules puis les matchs
Alors les poules et les matchs sont créés selon les règles réelles

Quand il marque une équipe absente et saisit les scores
Alors le classement se met à jour comme dans un tournoi réel

Quand il termine le tournoi
Alors le classement final est affiché

Quand il tente de partager ou d'inviter
Alors les contrôles sont désactivés et affichent « Indisponible en mode simulation. »

Quand il relance une simulation et confirme
Alors l'ancienne a disparu et une seule simulation figure dans « Organisés »
```

### 12.4 QA manuelle

- Rendu des emojis keycap sur iOS et Android, en clair et en sombre, avec grande taille de police.
- Aucune notification reçue sur un second appareil/compte pendant toute la simulation.
- Le tournoi simulé est introuvable depuis un autre compte (recherche, lien direct, listes).
- Les statistiques de l'organisateur sont **inchangées** avant/après simulation (RF-30).
- Mode hors-ligne : comportement acceptable, pas de crash, pas de simulation à moitié créée.

### 12.5 Definition of Done

- [ ] Toutes les règles RF-xx implémentées ou explicitement listées comme non faites, avec raison.
- [ ] Tableau d'audit RF-33 livré et complet.
- [ ] Liste exhaustive des entités filles supprimées en cascade, livrée.
- [ ] Tests §12.1 → §12.3 verts, sorties dans le rapport.
- [ ] QA §12.4 exécutée, résultats consignés.
- [ ] Règles backend déployées **et** testées (une tentative d'accès interdite est refusée).
- [ ] Aucune duplication de logique métier (poules, matchs, classement).
- [ ] Aucune chaîne en dur si le projet est i18n.
- [ ] Documentation d'architecture du repo app mise à jour.
- [ ] Feature flag opérationnel, coupure vérifiée dans les deux sens.

---

## 13. Analytics

Événements à émettre (adapte le nommage à la convention existante du repo, **ne l'invente pas**) :

| Événement | Propriétés |
|---|---|
| `simulator_entry_viewed` | `organizer_status` (validated / pending / rejected) |
| `simulator_creation_started` | `organizer_status` |
| `simulator_creation_completed` | `expected_teams`, `players_per_team`, `teams_generated`, `free_players`, `duration_ms` |
| `simulator_creation_failed` | `error_code`, `step` |
| `simulator_regenerated` | `previous_age_days` |
| `simulator_blocked_action` | `action` (share / invite / export) |
| `simulator_milestone_reached` | `milestone` (pools / matches / first_score / finals / closed) |
| `simulator_deleted` | `reason` (manual / regenerate / ttl) |

Le dernier événement est le plus important : il mesure **jusqu'où** les organisateurs vont dans le
simulateur, donc la valeur réelle de la fonctionnalité.

---

## 14. Backlog post-v1 (ne pas implémenter maintenant)

- **P2** — Bouton « Remplir les scores automatiquement » pour sauter à la fin du tournoi.
- **P2** — Réglage du ratio équipes / joueurs libres avant génération.
- **P2** — Plusieurs simulations simultanées.
- **P3** — Jeux de données thématiques par sport (noms d'équipes crédibles).
- **P3** — Conversion d'une simulation en tournoi réel.
- **P3** — Onboarding guidé superposé au simulateur.

---

## 15. Pièges connus — à lire avant de coder

1. **Ne duplique pas la logique métier.** Si tu crées un `SimulationPoolGenerator`, tu as échoué :
   le simulateur doit exercer le générateur de poules réel. Le seul code spécifique légitime est
   la **génération du jeu de données**, les **garde-fous**, et l'**habillage UI**.
2. **N'oublie pas un point de sortie externe.** Un trigger serveur oublié enverra de vrais emails à
   des adresses fictives — ou pire, cassera la délivrabilité du domaine. Fais l'inventaire par grep,
   pas de mémoire.
3. **N'oublie pas un filtre d'agrégat.** Un compteur « 12 tournois organisés » qui inclut les
   simulations décrédibilise le produit entier.
4. **Ne masque pas les boutons interdits, désactive-les.** L'organisateur doit voir ce que le vrai
   produit sait faire — c'est tout l'objet du simulateur.
5. **Ne laisse jamais deux simulations coexister**, même une seconde. Supprime **puis** crée.
6. **Ne rends pas `isSimulation` modifiable.** Un tournoi simulé promu en réel produirait des
   données corrompues indétectables.
7. **Ne t'arrête pas à la création.** La valeur est dans l'arbitrage et le classement final : c'est
   là que l'organisateur comprend ce qu'il achète.
