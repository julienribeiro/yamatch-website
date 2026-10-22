# Prompt — section tournois « Mois géants » V3 et page tournoi

À coller dans une session Claude Code ouverte sur
`julienribeiro/yamatch-website`, après avoir rempli les lignes de décision
entre crochets.

```text
Implémente la refonte de la section des tournois publics de la page d'accueil (website/index.html, section.showcase#derniers-tournois, variante participant) et de la page publique d'un tournoi (website/tournament/), validée par le founder le 22/10/2026 : calendrier horizontal « Mois géants », sans cadre, tournois joués en billets à tête blanche, bouton unique « Voir le tournoi » vers une page dédiée par tournoi.

Avant toute action :
1. Pars de `main` à jour sur la branche de travail indiquée par la session.
2. Lis en entier CLAUDE.md, docs/handoff/tournois-calendrier-v3/README.md et SPEC.md, puis docs/WEBSITE_ARCHITECTURE.md (§ Public tournament rails et la page tournoi).
3. Ouvre la maquette docs/handoff/tournois-calendrier-v3/mockup/calendrier-et-page-tournoi.html et regarde les rendus de visuals/. Les données sont des exemples. Le sélecteur « 1 / 3 / 6 tournois » de la maquette est un outil d'aperçu à ne pas implémenter. Ne copie pas les styles inline : passe par les tokens :root et §10.7 de styles.css.

Décisions du founder (SPEC.md §7) :
- D1 (rond « + » de la carte création) : [GARDÉ (DÉFAUT) / RETIRÉ]
- D2 (mois à venir vides affichés) : [JUSQU'À MOIS EN COURS + 2 (DÉFAUT) / AUTRE : …]
- D3 (inscrits et podium sur la page tournoi) : [SANS, « Jusqu’à N équipes » (DÉFAUT) / RPC get_public_tournament déjà déployée → l'utiliser]

Ce qu'il faut livrer (détails dans le SPEC) :
- Section sans aucun cadre (plus de fond gris, terrain SVG, rayon ni bandeau « Ça s’est joué »), en-tête conservé.
- Rail horizontal découpé par mois, nom du mois en très grand (Frick incliné) : passé en contour gris, en cours plein, à venir en contour noir. Compteur par mois, repère vertical « Aujourd’hui », case « Aucun tournoi en … » pour les mois à venir vides, carte création en dernier, barre de progression.
- Au chargement, le mois en cours est aligné au début du rail.
- Billets : balisage et CSS d'appTicket() conservés ; plus de rond à chevron ; bouton « Voir le tournoi » partout vers /tournament/?id=… (lime si ouvert avec de la place, blanc sinon) ; tournois joués avec la tête blanche (« N équipes · Terminé »).
- Page tournoi refondue (SPEC §4) : bandeau, infos pratiques, description, équipements, organisateur, panneau d'inscription ou « Tournoi terminé ». Deep link, rebond 404 et ids testés conservés.

Interdits :
- Ne change ni la RPC get_public_showcase, ni la validation, ni le cache, ni le chargement différé, ni le mode ?showcase=demo.
- Ne demande jamais à Supabase organizer_phone, organizer_email, organizer_instagram, lat, lng ni de donnée de participant.
- La variante organizer (/organisateur/) doit rester strictement identique.
- Ne touche ni au hero, ni à « Comment ça marche », ni aux stories, ni à la FAQ et son parallax, ni au carrousel, ni à la 404. Ne modifie pas styles.min.css à la main (npm run build:css).

Façon de travailler :
- Tu es orchestrateur, comme le demande CLAUDE.md. Commence par « Analysis: » puis « Delegation: », et délègue selon le SPEC §8 : html-expert, js-expert, css-expert, website-reviewer, doc-keeper.
- Chaque spécialiste commence son rapport par « Current State Summary » et « Verified safety greps ».

Validation avant de rendre la main :
- npm run build:css, npm test et npm run build passent.
- Requête anonyme sur la PROD pour vérifier chaque colonne ajoutée au select de la page tournoi (SPEC §4.2).
- Captures Playwright de la section avec ?showcase=demo à 1440, 820 et 390 px, mois en cours aligné puis rail défilé au début, comparées à visuals/. Ajuste temporairement les données de démo pour vérifier : aucun tournoi joué, aucun à venir, mois vides, passage d'année, puis remets-les comme avant.
- Captures de la page tournoi (à venir, complet, joué, annulé, introuvable) à 1440 et 390 px.
- Captures de /organisateur/ avant/après : identique.
- Tous les critères du SPEC §9 vérifiés un par un. Liste ceux qui ne passent pas, avec la raison.
- website-reviewer rend un verdict PASS.
- Dépose les captures et un court rapport dans docs/handoff/tournois-calendrier-v3/implementation/.

Livraison :
- Commit puis push sur la branche de travail.
- Pas de merge sur main : un push sur main publie le site en production.
- Ouvre une PR en draft avec les captures avant/après et le résultat des critères.
```

Si l'outil utilisé n'a pas les agents spécialisés du dépôt, retirer la partie
« Façon de travailler » et demander à l'agent de faire le travail lui-même,
en respectant les mêmes fichiers et les mêmes contraintes.
