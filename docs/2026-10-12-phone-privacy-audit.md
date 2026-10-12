# Audit téléphone / stores — 12 octobre 2026

Audit documentaire et code, aucune déclaration console ni publication effectuée.
Source : worktree production-readiness-20261012 ; lot en cours de gel/CI non modifié.

## Constats

- PrivacyInfo.xcprivacy déclare déjà Phone Number, lié à l’utilisateur, App Functionality, sans tracking. Pas de nouvelle permission de lecture SMS ou carnet d’adresses Android. Le code OTP est saisi dans l’app ; Twilio est appelé par l’Edge.
- Téléphone de participation privé lié au compte. +33 vérifié par SMS ; international déclaré sans prétendre une vérification. Exposition aux seuls organisateurs autorisés pour participants confirmés/roster, jusqu’à J+30 inclus Europe/Paris, retrait d’accès à J+31 00:00. Ce délai n’efface pas le téléphone du compte.
- Twilio reçoit numéro destinataire, code personnalisé, identifiant technique challenge_id, langue et état technique de vérification. Aucun nom ni identifiant de compte transmis par cet adaptateur. Code brut non stocké en SQL ; empreinte protégée et tentatives conservées temporairement.
- Expiration OTP : 10 minutes. Nettoyage quotidien des challenges expirés depuis plus de 24 h, limites d’envoi/essai inactives depuis plus de 48 h ; jobs de retour de succès terminés depuis plus de 30 jours purgés. Ces délais locaux ne prouvent pas la conservation Twilio.
- La politique locale décrit encore principalement les téléphones de coéquipiers et ne nomme pas Twilio. La grille Play porte explicitement un avertissement du 9 octobre : ancienne ligne Optional/invitation-KYC non validée pour ce flux. Google Play Console n’a pas été inspectée. L’orchestrateur a vérifié App Store Connect le 12 octobre à 12:33 Paris : Phone Number déjà publié, App Functionality, lié à l’identité, aucun tracking affiché pour ce type ; URL de politique correcte. iOS 1.0.18 apparaît Prête pour distribution. Aucune modification console effectuée. La lecture web de la politique publique a échoué : aucune conformité live déduite.

## Texte concret à intégrer à la politique et à son miroir public

« Téléphone de contact de participation : nous conservons le numéro que vous renseignez, son pays et son état de vérification. Pour les numéros français, un code à durée limitée est envoyé par SMS via Twilio Verify. Les numéros internationaux peuvent être déclarés sans être présentés comme vérifiés. Ces informations servent à vérifier votre contact et à permettre les échanges pratiques liés aux tournois. »

« Les organisateurs autorisés peuvent consulter le téléphone des participants confirmés et des membres concernés de leur équipe jusqu’à la fin du trentième jour suivant le tournoi, heure de Paris. Cet accès cesse ensuite. Le numéro reste dans votre compte jusqu’à son remplacement ou à la suppression effective du compte ; cette limite d’accès n’est pas une suppression à trente jours. »

Ajouter Twilio à la table prestataires : envoi et vérification SMS ; numéro destinataire, code temporaire, identifiant technique de demande et état de vérification. Confirmer les clauses de traitement, régions, transferts et durées du compte Twilio réellement utilisé avant de publier ces précisions contractuelles. Ne pas inventer une résidence UE ou une durée fournisseur.

## Déclarations préparées

Apple : Contact Info → Phone Number collecté, lié au compte, App Functionality, pas de tracking. Le manifeste local correspond déjà ; contrôler App Privacy séparément. Pas de catégorie Contacts/SMS du téléphone à ajouter sur la seule base de ce flux.

Google : Personal info → Phone number collecté, non éphémère, App functionality et Account management si le formulaire offre cette finalité. Le parcours d’inscription activé conditionne l’accès à une fonctionnalité : ne plus décrire Optional « seulement invitation/KYC ». Examiner l’obligation par parcours et le partage organisateur ; Twilio prestataire peut relever de l’exception service provider seulement si les conditions correspondantes sont satisfaites. Ne pas reconduire Shared=No sans justification du transfert aux organisateurs. Le formulaire final doit refléter le comportement actif, pas seulement le pilote global OFF.

Notes reviewer proposées : « Le téléphone de participation est saisi par l’utilisateur. Un numéro français est vérifié par code SMS ; les numéros internationaux sont identifiés comme déclarés. Aucun accès au carnet d’adresses ni lecture des SMS n’est demandé. Les organisateurs autorisés accèdent aux contacts de leurs participants jusqu’à J+30 inclus. » Ajouter le compte et le scénario reviewer séparément sans secret dans la doc publique.

## Limites / décision

GO code permissions/manifeste pour recette TestFlight ciblée ; pas de preuve de métadonnées store ou de politique live à jour. Avant ouverture globale PROD et soumission publique : politique/mirror et déclarations console à aligner, clauses Twilio à confirmer, recette SMS ciblée à achever. Aucune autorisation de publication publique App Store déduite.

Sources officielles consultées le 12 octobre :
- https://developer.apple.com/app-store/app-privacy-details/
- https://support.google.com/googleplay/android-developer/answer/10787469

Le manifeste ne remplace pas les réponses console. Les exceptions de partage Google doivent être justifiées par le traitement réel et ses conditions contractuelles.

## Current State Summary

- Page légale autonome, `website/politique-confidentialite/index.html`, titre unique et sections 2/4/5 conservés.
- Dernière révision source précédente : 26 septembre 2026 ; nouveau texte daté du 12 octobre.
- Aucun sélecteur, style, script, lien canonique, navigation ou donnée d’environnement modifié.
- Le texte ajouté distingue contact du compte, accès organisateur et traitements techniques du prestataire.
- Le miroir Markdown est préparé dans un worktree Yamatch distinct du lot backend en CI.

## Verified safety greps

- `rg legal-page docs/WEBSITE_ARCHITECTURE.md` : pages légales documentées lignes 180–192.
- `rg legal-page-section website/styles.css` : composants légaux existants lignes 3544 et suivantes.
- `rg legal-page website/script.js website/carousel.js` : aucune dépendance JavaScript.
- Diff source : uniquement politique HTML et note documentaire, aucun CSS/JS.
- Parser HTML : nesting PASS ; suite website : 15 tests PASS ; diffcheck PASS.
- Ces contrôles ne prouvent ni publication web ni acceptation store. Revue indépendante avant commit/publication.
