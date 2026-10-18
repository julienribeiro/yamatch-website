# Validation LED douce — PASS

Revue ciblée du 18 octobre 2026. Préflight CSS démontré : Current State Summary et Verified safety greps reçus.

- Trois badges concernés uniquement : Volleyball, Parcours et Tournois ; points décoratifs aria-hidden conservés.
- Cycle 2,4 s ease-in-out : à 0 ms, scale 1,15, accent et halo 10 px / 3 px / alpha 0,65 ; à 1 200 ms, scale 0,8, olive #3D4A12 et ombre transparente nulle.
- Web Animations API : animations mises en pause et currentTime fixé à 0 ou 1 200 ms. Douze captures des trois badges à 1440 et 390 px ; contrôle supplémentaire à 820 px.
- Géométrie des neuf badges strictement identique entre les deux phases ; dimensions de layout des points préservées.
- Mouvement réduit activé dynamiquement : animation none, scale 1, accent et halo 8 px / 2 px / alpha 0,5 aux trois formats.
- Ancien radar, ses tokens et son pseudo-élément retirés ; aucun nouveau JavaScript.
- Documentation synchronisée ; build CSS, syntaxe JS et diff check PASS auteur, npm test 15/15 PASS orchestrateur.

Captures recadrées sur chaque badge. Header et QR masqués temporairement dans le navigateur uniquement. Tournois chargé avec ?showcase=demo. Aucune modification de code réalisée par la revue. Mesures détaillées dans [evidence.json](evidence.json).

Aucun critère non passant.
