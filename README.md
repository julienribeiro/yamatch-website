# Yamatch website

Vanilla HTML / CSS / JS marketing one-pager. Le build de production minifie le CSS et génère les associations natives vérifiées.

## Production build

```bash
PLAY_APP_SIGNING_SHA256='07:5D:03:FF:1F:34:9D:72:4F:48:A9:62:5D:BB:8F:3F:53:D6:B8:80:56:6C:87:43:1C:4E:EB:7B:11:A3:9B:13' npm run build
```

La production utilise l'empreinte SHA-256 du **certificat Play App Signing** fournie par le fichier JSON Digital Asset Links officiel de Play Console. Elle figure dans `config/play-app-signing-sha256.json` et dans la variable GitHub `PLAY_APP_SIGNING_SHA256`; le build exige leur égalité exacte. La clé d'upload connue reste explicitement rejetée.

Le mode pending fail-closed reste disponible pour une révocation : allowlist vide et variable absente produisent uniquement `assetlinks.json = []`. Une allowlist active sans variable, une empreinte invalide, non autorisée ou rejetée arrête le build.

Les PR construisent d'abord l'état de production courant (pending ou actif), puis vérifient séparément le futur contrat actif avec la fixture sous `test/fixtures/`, `NODE_ENV=test` et un output temporaire. Le générateur refuse cette surcharge en mode production.

## Local development

```bash
cd website
npm run dev
```

Opens a live-reloading server at **<http://localhost:8000>**. Edit any file in `website/`, save, the browser reloads automatically.

`npm run start` does the same but auto-opens your browser. `npm run preview` is the same as `start` (here for clarity).

> First run downloads live-server (~5 MB, cached under `~/.npm/_npx/`). Subsequent runs start in ~1 s.

## Layout

```
website/
├── index.html          # Single-page hero + footer
├── styles.css          # All styles (no preprocessor)
├── script.js           # Vanilla IIFE — toast scaffolding, wordmark/wave behaviour, scroll-driven phone animation, how-quest editorial, QR widget, floating-card parallax
├── wordmark.svg        # Yamatch wordmark (also inlined in index.html for currentColor support)
├── fonts/              # Frick 0.3 (display title) — OFL-licensed, see fonts/OFL.txt
├── balls/              # Sport ball PNGs (currently unused; were used by the prior bouncing animation)
└── .refs/              # Visual references (gitignored — drop screenshots/mockups here for Claude to see)
```

## Visual references workflow

When you want to share a screenshot or mockup with Claude during iteration, drop it in `website/.refs/` instead of pasting `/var/folders/.../TemporaryItems/...` paths. The folder is gitignored so refs never end up in commits, but they persist across reboots and Claude knows to look there.

## Design conventions

The hero follows a Lydia-inspired pattern with deliberate structural decisions captured in `.claude/agents/website-expert.md`. Before making structural changes (card width, hero sticky behavior, font stack, etc.), read that file — many alternatives have been tried and rejected.
