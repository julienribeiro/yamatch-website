# Tournois de la plateforme V2 — implémentation

Date : 18 octobre 2026. Le nouveau rendu concerne uniquement la variante participant de `#derniers-tournois` ; le rail organisateur garde son rendu historique.

La section « Ça smash près de chez toi » présente un fond gris clair avec terrain décoratif, jusqu’à cinq tickets à venir puis la carte HTML statique « Ton prochain tournoi ». Jusqu’à neuf tournois passés alimentent « Ça s’est joué ». La création seule n’affiche pas une section sans données valides ; avec seulement des tournois passés, création et bandeau restent visibles.

La RPC, la validation, le cache de session de dix minutes, le chargement différé et les données du mode démo restent inchangés. `appTicket()` et le ticker servent uniquement le participant ; `ticket()` et `wireRailNav()` restent utilisés par l’organisateur. Aucun prix ou palette individuelle n’est inventé. En démo, les boutons de tournoi sont des spans inertes au même aspect, afin de ne pas ouvrir des identifiants fictifs ; la carte création conserve son vrai lien organisateur.

Le bandeau boucle en 40 secondes, avec seconde copie masquée aux lecteurs d’écran. Survol et focus le mettent en pause. Avec réduction de mouvement, la duplication disparaît et le défilement devient manuel. L’ancre réserve la hauteur du header fixe plus 16 px.

[Architecture et contrats](../../../WEBSITE_ARCHITECTURE.md) documente le DOM, les états et les tokens. Le reviewer fournit séparément les captures et le rapport de validation : cette note ne constitue pas un verdict PASS.

Ajustement d’accessibilité : les statuts « Complet » et « Inscriptions closes » utilisent le blanc à 90 % (`--tp-white-90`) plutôt que les 80 % de la maquette, dont le contraste sur le dégradé était insuffisant. Le rapport de validation consigne la mesure après correction.

## Actualisation des tickets depuis l’app — 18 octobre 2026

Le rendu participant reprend désormais la géométrie des composants Flutter `tournament_card` et de leur fond, à `4f6d88fe`, dont les sources concernées correspondent à `origin/main`. La hauteur suit le contenu ; date de 72 px, titre Roboto de 22 px, métadonnées Inter de 14 px, chevron nu, perforation fine et pied avec action de 60 px remplacent le gabarit fixe initial. Le dégradé radial dépend des dimensions du ticket. Pour préserver le contraste du texte, le token `--tp-ticket-contrast-shade` ajoute un voile noir uniforme à 35 % sur les seuls en-têtes teal : cette adaptation d’accessibilité à la référence ne change ni la géométrie, ni les fonds lime de création ou noirs des inscriptions closes. Les bornes calculées sur le teal le plus clair sont de 4,623:1 pour le lime et 4,665:1 pour le blanc à 90 % ; la revue consigne la vérification finale. La carte de création partage cette géométrie et conserve son fond lime.

Cette actualisation conserve les données, villes, limites de cinq tournois à venir, modes démo et états complet/fermé/capacité inconnue. Les CTA restent « S’inscrire » sans prix ou « Voir le tournoi », selon l’état déjà validé. Les boutons de démo restent inertes ; le rail organisateur est inchangé. Les captures initiales du dossier représentent le rendu précédent : la revue du nouveau lot établit sa validation visuelle.
