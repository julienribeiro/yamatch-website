# Yamatch website

Vanilla HTML / CSS / JS marketing one-pager. **No build step.**

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
├── script.js           # Vanilla IIFE — toast, CTA handler, scroll-driven phone animation
├── wordmark.svg        # Yamatch wordmark (also inlined in index.html for currentColor support)
├── fonts/              # Frick 0.3 (display title) — OFL-licensed, see fonts/OFL.txt
├── balls/              # Sport ball PNGs (currently unused; were used by the prior bouncing animation)
└── .refs/              # Visual references (gitignored — drop screenshots/mockups here for Claude to see)
```

## Visual references workflow

When you want to share a screenshot or mockup with Claude during iteration, drop it in `website/.refs/` instead of pasting `/var/folders/.../TemporaryItems/...` paths. The folder is gitignored so refs never end up in commits, but they persist across reboots and Claude knows to look there.

## Design conventions

The hero follows a Lydia-inspired pattern with deliberate structural decisions captured in `.claude/agents/website-expert.md`. Before making structural changes (card width, hero sticky behavior, font stack, etc.), read that file — many alternatives have been tried and rejected.
