// Génère preview/<nom>.html (écran seul dans le cadre iPhone, échelle 1).
// Usage : node tools/build-previews.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const f of readdirSync(join(root, 'screens'))) {
  if (!f.endsWith('.html') || f.startsWith('_')) continue;
  const name = f.slice(0, -5);
  const css = existsSync(join(root, 'screens', name + '.css'))
    ? `<link rel="stylesheet" href="../screens/${name}.css">` : '';
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Écran codé — ${name}</title>
<link rel="stylesheet" href="../css/app-tokens.css">
<link rel="stylesheet" href="../css/phone-frame.css">
${css}
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#E9EBEF;padding:24px}</style>
</head><body>
<div class="ym-phone">
${readFileSync(join(root, 'screens', f), 'utf8')}
</div>
</body></html>
`;
  writeFileSync(join(root, 'preview', name + '.html'), html);
  console.log('preview/' + name + '.html');
}
