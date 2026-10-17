// Régénère les captures de référence (visuals/) de chaque dossier de passation.
// Usage : node docs/handoff/app-screens/tools/render-visuals.mjs
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const handoff = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JOBS = [
  ['hero-participant-v2', 'desktop.html', 1440, 900, 'desktop-1440.jpg'],
  ['hero-participant-v2', 'desktop.html', 1440, 900, 'desktop-1440-sans-cartes.jpg', '.yh-visual > div:not(.mk-phone){display:none!important}'],
  ['hero-participant-v2', 'desktop.html', 820, 1180, 'tablette-820.jpg'],
  ['hero-participant-v2', 'mobile.html', 390, 844, 'mobile-390.jpg'],
  ['comment-ca-marche-v2', 'desktop.html', 1440, 1180, 'desktop-1440.jpg'],
  ['comment-ca-marche-v2', 'desktop.html', 820, 1180, 'tablette-820.jpg'],
  ['comment-ca-marche-v2', 'mobile.html', 390, 844, 'mobile-390.jpg'],
  ['tournois-plateforme-v2', 'desktop.html', 1440, 900, 'desktop-1440.jpg'],
  ['tournois-plateforme-v2', 'desktop.html', 820, 1180, 'tablette-820.jpg'],
  ['tournois-plateforme-v2', 'mobile.html', 390, 844, 'mobile-390.jpg'],
  ['stories-v2', 'desktop.html', 1440, 900, 'desktop-1440.jpg'],
  ['stories-v2', 'desktop.html', 820, 1000, 'tablette-820.jpg'],
  ['stories-v2', 'mobile.html', 390, 844, 'mobile-390.jpg'],
];
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const browser = await pw.chromium.launch({ executablePath: exe }).catch(() => pw.chromium.launch());
for (const [folder, file, w, h, out, css, motion] of JOBS) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: motion || 'no-preference' });
  await page.goto(pathToFileURL(join(handoff, folder, 'mockup', file)).href);
  if (css) await page.addStyleTag({ content: css });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(handoff, folder, 'visuals', out), fullPage: true, type: 'jpeg', quality: 84 });
  await page.close();
  console.log(`${folder}/visuals/${out}`);
}
await browser.close();
