// shots.mjs: screenshot pages at several viewport sizes.
//   node scripts/shots.mjs [--out DIR] [--size WxH ...] [--el SELECTOR] [--name NAME] <url> [<url> ...]
// Defaults: --out .shots, sizes 1366x768 1920x1080 2560x1440 390x844. Files are <name>-<W>x<H>.png, where the name
// comes from the URL path (and hash) unless --name is given; with --name, one URL and one size, the file is NAME.png.
// --el captures only that element (e.g. the deck canvas: --el "#deck-frame" --size 1920x1144 gives 1920x1080).
// Playwright: set PLAYWRIGHT_PATH to a folder (or its package.json) whose node_modules holds playwright;
// without it, playwright is resolved from this script's folder upwards.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const pw = process.env.PLAYWRIGHT_PATH;
const req = createRequire(pw ? (pw.endsWith('.json') ? path.resolve(pw) : path.resolve(pw, 'package.json')) : import.meta.url);
let chromium;
try { ({ chromium } = req('playwright')); } catch {
  console.error('playwright not found; set PLAYWRIGHT_PATH to a folder whose node_modules holds it'); process.exit(2);
}

const args = process.argv.slice(2), urls = [], sizes = [];
let out = '.shots', el = null, name = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') out = args[++i];
  else if (a === '--size') sizes.push(args[++i]);
  else if (a === '--el') el = args[++i];
  else if (a === '--name') name = args[++i];
  else urls.push(a);
}
if (!urls.length) { console.error('usage: node scripts/shots.mjs [--out DIR] [--size WxH ...] [--el SELECTOR] [--name NAME] <url> ...'); process.exit(2); }
if (!sizes.length) sizes.push('1366x768', '1920x1080', '2560x1440', '390x844');
mkdirSync(out, { recursive: true });

const slug = (u) => {
  const x = new URL(u), p = x.pathname.replace(/index\.html$/, '').replace(/\.html$/, '').split('/').filter(Boolean).slice(-2).join('-');
  return (p || 'root') + (x.hash.length > 1 ? '-' + x.hash.slice(1).replace(/[^\w-]+/g, '_').slice(0, 40) : '');
};

const browser = await chromium.launch();
for (const url of urls) {
  for (const s of sizes) {
    const [width, height] = s.split('x').map(Number);
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }); } catch { await page.goto(url, { waitUntil: 'load' }); }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const file = path.join(out, name && urls.length === 1 && sizes.length === 1 ? `${name}.png` : `${name || slug(url)}-${s}.png`);
    if (el) await page.locator(el).first().screenshot({ path: file });
    else await page.screenshot({ path: file });
    console.log(path.resolve(file));
    await ctx.close();
  }
}
await browser.close();
