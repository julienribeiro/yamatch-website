# Tournois de la plateforme V2 — implémentation

Date : 18 octobre 2026. Le nouveau rendu concerne uniquement la variante participant de `#derniers-tournois` ; le rail organisateur garde son rendu historique.

La section « Ça smash près de chez toi » présente un fond gris clair avec terrain décoratif, jusqu’à cinq tickets à venir puis la carte HTML statique « Ton prochain tournoi ». Jusqu’à neuf tournois passés alimentent « Ça s’est joué ». La création seule n’affiche pas une section sans données valides ; avec seulement des tournois passés, création et bandeau restent visibles.

La RPC, la validation, le cache de session de dix minutes, le chargement différé et les données du mode démo restent inchangés. `appTicket()` et le ticker servent uniquement le participant ; `ticket()` et `wireRailNav()` restent utilisés par l’organisateur. Aucun prix ou palette individuelle n’est inventé. En démo, les boutons de tournoi sont des spans inertes au même aspect, afin de ne pas ouvrir des identifiants fictifs ; la carte création conserve son vrai lien organisateur.

Le bandeau boucle en 40 secondes, avec seconde copie masquée aux lecteurs d’écran. Survol et focus le mettent en pause. Avec réduction de mouvement, la duplication disparaît et le défilement devient manuel. L’ancre réserve la hauteur du header fixe plus 16 px.

[Architecture et contrats](../../../WEBSITE_ARCHITECTURE.md) documente le DOM, les états et les tokens. Le reviewer fournit séparément les captures et le rapport de validation : cette note ne constitue pas un verdict PASS.

Ajustement d’accessibilité : les statuts « Complet » et « Inscriptions closes » utilisent le blanc à 90 % (`--tp-white-90`) plutôt que les 80 % de la maquette, dont le contraste sur le dégradé était insuffisant. Le rapport de validation consigne la mesure après correction.
