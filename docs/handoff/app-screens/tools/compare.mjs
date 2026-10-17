// Capture chaque écran codé et le place à côté de la capture PNG d'origine.
// Usage : node tools/compare.mjs [nom]   → compare/<nom>.png
// Playwright : /opt/node-tools/node_modules/playwright (ou `npm i -D playwright`).
import { createRequire } from 'node:module';
import { writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = resolve(root, '../../../website/assets/screens');
const MAP = { discovery: 1, tournament: 2, confirmation: 3, ranking: 4 };
const only = process.argv[2];
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const browser = await pw.chromium.launch({ executablePath: exe }).catch(() => pw.chromium.launch());
for (const [name, n] of Object.entries(MAP)) {
  if (only && only !== name) continue;
  const page = await browser.newPage({ viewport: { width: 460, height: 920 }, deviceScaleFactor: 2 });
  try { await page.goto(pathToFileURL(join(root, 'preview', name + '.html')).href); }
  catch { console.log('absent : ' + name); await page.close(); continue; }
  await page.evaluate(() => document.fonts.ready);
  const shot = await page.locator('.ym-phone').screenshot();
  await page.close();
  const cmp = await browser.newPage({ viewport: { width: 940, height: 940 } });
  const tmp = join(root, 'compare', '_tmp.html');
  writeFileSync(tmp, `<body style="margin:0;display:flex;gap:20px;padding:20px;background:#fff;font:600 14px sans-serif">
    <figure style="margin:0"><figcaption>Original (PNG app)</figcaption><img src="${pathToFileURL(join(site, 'screen_' + n + '.png')).href}" style="height:868px"></figure>
    <figure style="margin:0"><figcaption>Écran codé</figcaption><img src="data:image/png;base64,${shot.toString('base64')}" style="height:868px"></figure></body>`);
  await cmp.goto(pathToFileURL(tmp).href);
  await cmp.waitForTimeout(300);
  await cmp.screenshot({ path: join(root, 'compare', name + '.png'), fullPage: true });
  await cmp.close();
  unlinkSync(tmp);
  console.log('compare/' + name + '.png');
}
await browser.close();
