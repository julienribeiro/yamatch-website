# Médias des stories Yamatch

Aucune story réelle n’est fournie dans cette livraison. Le dossier ne contient aucun média et la section reste `hidden`, sans story ni requête de média. **Moins de trois stories réelles validées : ne pas activer la section ni ajouter de contenu fictif au DOM.**

## Éléments requis pour chaque story

| Élément | Format attendu |
|---|---|
| Image | `story-NN.webp`, ratio 9:16, 720 × 1280 recommandé, ≤ 150 Ko |
| Vidéo optionnelle | `story-NN.mp4`, H.264, ≤ 1,5 Mo, ≤ 10 s, sans son utile ; image WebP correspondante obligatoire comme poster |
| Texte alternatif | Description courte et réelle du média |
| Identité affichée | Prénom et initiale du nom, sans nom complet |
| Rôle | Capitaine, Joueuse, Joueur, Arbitre, Organisateur ou Organisatrice |
| Phrase | Citation réelle, 60 caractères maximum, sans guillemets |
| Avatar optionnel | `story-NN-avatar.webp`, 96 × 96 ; sinon rond lime plein |
| Lien optionnel | URL du post Instagram d’origine, si fournie |
| Mise en avant | Une seule story au maximum, avec bordure lime |

Chaque personne, média et citation doit être réel. Obtenir l’accord écrit pour l’image et la citation, ainsi que les droits de l’auteur du média repris. Conserver ces justificatifs dans un espace privé approprié, pas dans ce dossier servi publiquement. Les emplacements entre crochets des maquettes ne sont pas du contenu publiable.

## Activation future

Après réception et validation d’au moins trois stories, intégrer uniquement les contenus validés, avec les dimensions, descriptions et chargement différé des images. Le lien de post est optionnel et doit avoir un nom accessible explicite. L’activation nécessite une revue visuelle et d’accessibilité avec les vrais médias.

Aucun contrôleur vidéo n’est livré aujourd’hui. Avant toute intégration vidéo, implémenter les exigences du [SPEC §5](../../../docs/handoff/stories-v2/SPEC.md) : `muted loop playsinline preload="none"`, poster, bouton pause/lecture 44 × 44, visibilité à 60 % minimum pour l’autoplay, pause hors écran, une seule vidéo active et aucune lecture automatique en reduced motion. Sans JavaScript, seul le poster doit apparaître.
