# Photographie du hero participant

## Provenance

Création le 15 octobre 2026 avec le **tool intégré ImageGen**, sans API/CLI de génération. Photographie synthétique, destinée au fond du hero de la page d’accueil. Les références servent à la dynamique sportive et à l’ambiance ; les personnes et la scène générées ne sont pas présentées comme une photographie documentaire réelle.

Références utilisateur, inspectées visuellement avant génération :
- `/Users/julien/Desktop/Capture d’écran 2026-10-15 à 22.39.35.png` : mécanique de l’attaque, angle au bord du terrain.
- `/Users/julien/Desktop/Capture d’écran 2026-10-15 à 22.39.19.png` : ambiance sombre, lumière verte retenue.
- `/Users/julien/Desktop/Capture d’écran 2026-10-15 à 22.39.41.png` : action au filet et disposition des équipes.

## Fichiers

Dans `website/assets/hero-volley/` :
- `hero-volley-mixed.png` : source finale paysage, 1672 × 941.
- `hero-volley-mixed.webp` : livraison paysage, 81 254 octets.
- `hero-volley-mixed-mobile.png` : source portrait, 1122 × 1402.
- `hero-volley-mixed-mobile.webp` : livraison portrait, 120 802 octets.
- `hero-volley-mixed-close.png` : premier cadrage conservé pour comparaison, non utilisé par la page.

Les WebP sont encodés avec `cwebp -q 85 -m 6`, sans retouche ni traitement de couleur supplémentaire. Les PNG sont copiés sans modification depuis la sortie ImageGen.

## Contrôle visuel

Une femme attaque face à un homme et une femme au contre, avec un seul ballon et un filet séparant les deux côtés. La lumière du gymnase reste sombre et légèrement olive, avec peau et tissus naturels. Le paysage ménage une partie haute sombre pour le titre ; le portrait conserve les trois personnages dans un format plus étroit. Le hero garde son texte et son téléphone superposés : leur visibilité masque donc nécessairement une partie de la photo, particulièrement sur mobile. Les marques discrètes éventuellement générées sur le matériel ne correspondent pas à un placement de marque intentionnel.

## Prompt initial exact

```text
Use case: photorealistic-natural.
Asset type: responsive website hero background photograph, widescreen landscape 16:9, high resolution.
Input images: image 1 is a reference for believable volleyball spike mechanics and sideline camera perspective; image 2 is a reference ONLY for dark indoor arena atmosphere with restrained green light; image 3 is a reference for real match energy, net geometry and opposing teams. Create a NEW scene with different anonymous adult players; do not reproduce faces, brands, text, university insignia or watermarks.
Primary request: an extremely realistic sports press photograph of a mixed-gender indoor volleyball rally: ONE adult woman on the near side jumping to spike a single volleyball, and ONE adult man plus ONE adult woman on the far side jumping together to block. Show the net unambiguously BETWEEN the attacker and the two blockers. The attacker is left of center and the two blockers right of center, bodies naturally overlapping only where physically possible. Three main athletes only, extras limited to distant spectators.
Scene: authentic local competitive indoor gymnasium, dark deep olive spectator stands, worn sport floor, a regulation taut volleyball net, unbranded white net tape, imperfect real venue.
Composition: wider sideline three-quarter sports-camera perspective, eye level slightly below net. All three athletes and the single ball lie inside the central 65 percent of the image. Athlete heads around mid-height, raised hands and ball just above them; upper third predominantly dark out-of-focus gym architecture suitable for website heading. Full action readable within lower two thirds. Avoid massive foreground body; limbs naturally framed. The woman attacker wears off-white and charcoal kit with understated lime piping, the opposing man and woman wear dark olive / charcoal with subtle lime trim. Natural tied-back hair and practical kneepads, no fashion posing.
Lighting: real overhead gym lights, underexposed dark background but readable athletes; muted yellow-green/olive shadows connect subtly to a lime brand palette, natural believable skin tones maintained. Not a neon spectacle. Textured skin with pores and sweat, fabric folds, stray hair, mild sensor grain, realistic depth of field. High-shutter professional sports photography, 1/1000s, 85mm telephoto feel.
Critical anatomy and physics: one ball clearly separate from hands and just leaving the woman's attacking palm; realistic human proportions, coherent jumping bodies, each athlete exactly two arms and two legs, each visible hand anatomically credible five fingers, blockers' palms above net facing the attack, no bent or fused fingers, no floating extra hands. At peak jump players' upper chests close to net tape, not waist at tape. Natural candid effortful facial expressions.
No text or graphic overlays, no brand logos, no watermarks. Avoid CGI, illustration, polished 3D, beauty retouching, waxy skin, cloned faces, overly perfect smiles, fake bloom, cinematic smoke, heavy color wash, conspicuous impossible anatomy. Deliver one coherent extremely realistic photograph.
```

## Recadrage paysage exact

Entrée : premier rendu généré `hero-volley-mixed-close.png`.

```text
Use case: photorealistic-natural. Reframe the supplied generated volleyball photograph for a widescreen 16:9 website hero background. Preserve the exact credible photographic realism, same 3 adult athletes (one attacking woman left on near court, one blocking man and one blocking woman on far court right), same single volleyball, same natural skin, realistic fingers, subtle olive/lime uniforms, single net separating opponents, dark real indoor gym. ONLY change framing and spatial composition: pull camera back and tilt up to include much more dark empty gym above the rally. The TOP 40 PERCENT OF THE FRAME must be dark empty gym wall/stands with no athletes/hands/ball; the entire sporting action should begin around 43% down from top. Attacking woman upper body approximately x30%, ball at x42%, two blockers around x65 and x77%, all at 50–75% image height, lower bodies in bottom. This is a website photograph behind centered white title above and a center-bottom phone mockup: keep center x46–57% mostly empty net/background; physically plausible opposing athletes spaced naturally. Do not alter anatomy into impossible proportions. Natural high-shutter press photo with mild grain, unbranded kits, no text or logos, dark olive venue. Do not add typographic text or any UI. Keep natural exposure, dark upper area, realistic uncluttered gym. Widescreen 16:9.
```

## Variante portrait exacte

Entrée : premier rendu généré `hero-volley-mixed-close.png`.

```text
Use case: photorealistic-natural. Responsive mobile variant of supplied generated volleyball photograph. Preserve photographic realism and same moment: one adult woman attacker on left near side, one man and one woman blocking on right far side, one real volleyball near attacker's extended palm, regulation net between opposing sides, natural anatomy. Recompose as PORTRAIT 4:5 frame, the three actors must all fit inside width together, all heads and hands visible. Upper 30 percent dark uncluttered gym architecture, athletes and ball mainly between 35 and 70 percent height, net across around 60 percent height, gym floor and lower legs at bottom. Camera farther back to fit three players in portrait. Keep same dark olive indoor gym, warm natural skin, unbranded white/charcoal attacker kit and dark kits with very subtle lime trim for blockers. Natural high-shutter press photography, fabric wrinkles, skin pores, slight grain, no illustration, no airbrushing, no cinematic artificial lighting, no neon glow. Accurate hands with five fingers each, no duplicated limbs or faces, coherent anatomy, single net and ball. Do not add text, UI, words or logos. The image is portrait for a responsive website background.
```
