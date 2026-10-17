// Insère les écrans codés dans les maquettes.
// Pour chaque <dossier>/mockup/src/*.html de docs/handoff, remplace
//   <!--SCREEN:<nom>:<échelle>-->  par le cadre iPhone + le fragment screens/<nom>.html
//   <!--SCREEN-STYLES-->           par les <link> CSS nécessaires
// et écrit <dossier>/mockup/<fichier>.html.
// Usage : node docs/handoff/app-screens/tools/assemble-mockups.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const appScreens = join(dirname(fileURLToPath(import.meta.url)), '..');
const handoff = join(appScreens, '..');
for (const folder of readdirSync(handoff)) {
  const srcDir = join(handoff, folder, 'mockup', 'src');
  if (!existsSync(srcDir)) continue;
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.html'))) {
    let html = readFileSync(join(srcDir, f), 'utf8');
    const used = new Set();
    html = html.replace(/<!--SCREEN:([a-z-]+):([\d.]+)-->/g, (_, name, scale) => {
      const frag = join(appScreens, 'screens', name + '.html');
      if (!existsSync(frag)) throw new Error(`écran manquant : ${name} (${folder}/${f})`);
      used.add(name);
      return `<div class="ym-phone-slot" style="--ym-phone-scale:${scale}" aria-hidden="true"><div class="ym-phone">\n${readFileSync(frag, 'utf8').trim()}\n</div></div>`;
    });
    const links = ['css/app-tokens.css', 'css/phone-frame.css', ...[...used].map((n) => `screens/${n}.css`)]
      .map((p) => `<link rel="stylesheet" href="../../app-screens/${p}">`).join('\n');
    html = html.replace('<!--SCREEN-STYLES-->', links);
    writeFileSync(join(handoff, folder, 'mockup', f), html);
    console.log(`${folder}/mockup/${f} ← ${[...used].join(', ') || 'aucun écran'}`);
  }
}
