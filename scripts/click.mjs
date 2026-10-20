// click.mjs: click every control on the given pages and report what broke.
//   node scripts/click.mjs <url> [<url> ...]
// Each control is clicked on a freshly loaded page (the URL as given), so one click never hides another's effect.
// A control is DEAD when clicking it changes nothing: not the URL, the DOM, form state, focus, nor opens a window
// or a download. A control already on (checked radio, selected tab, pressed button) may do nothing. Links are not
// followed: each href must answer HTTP 200. Console errors, page errors and failed requests are reported per page.
// Exit code 1 when any page has an error, a dead or unclickable control, or a broken link.
// Playwright: set PLAYWRIGHT_PATH to a folder (or its package.json) whose node_modules holds playwright;
// without it, playwright is resolved from this script's folder upwards.
import { createRequire } from 'node:module';
import path from 'node:path';

const pw = process.env.PLAYWRIGHT_PATH;
const req = createRequire(pw ? (pw.endsWith('.json') ? path.resolve(pw) : path.resolve(pw, 'package.json')) : import.meta.url);
let chromium;
try { ({ chromium } = req('playwright')); } catch {
  console.error('playwright not found; set PLAYWRIGHT_PATH to a folder whose node_modules holds it'); process.exit(2);
}

const urls = process.argv.slice(2);
if (!urls.length) { console.error('usage: node scripts/click.mjs <url> [<url> ...]'); process.exit(2); }

const SEL = 'button, a[href], [role=tab], [role=button], input:not([type=hidden]), select, textarea, summary';
const SETTLE = 400;

// everything a click can change, as one string
const snapshot = () => {
  const form = [...document.querySelectorAll('input, select, textarea')].map((e) => (e.type === 'checkbox' || e.type === 'radio' ? (e.checked ? 1 : 0) : e.value)).join('|');
  const a = document.activeElement;
  return [location.href, document.body.innerHTML, form, a && (a.matches('input, select, textarea') ? a.outerHTML : '')].join('\u0001');
};

async function load(page, url) {
  // via a blank page, so a URL that differs only in its hash still loads afresh
  await page.goto('about:blank');
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }); } catch { await page.goto(url, { waitUntil: 'load' }); }
  await page.waitForTimeout(200);
}

async function run(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const errors = [];
  let popups = 0, downloads = 0;
  const watch = (page) => {
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) errors.push(`request failed: ${r.url()} ${r.failure()?.errorText || ''}`); });
    page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
    page.on('download', () => { downloads++; });
  };
  const page = await ctx.newPage();
  watch(page);
  ctx.on('page', (p) => { popups++; p.close().catch(() => {}); });
  await load(page, url);
  const total = await page.locator(SEL).count();
  const res = { url, total, tested: 0, hidden: 0, on: 0, links: 0, dead: [], blocked: [], badLinks: [], errors };

  for (let i = 0; i < total; i++) {
    if (i) await load(page, url);
    const el = page.locator(SEL).nth(i);
    const info = await el.evaluate((e) => {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      const lab = e.closest('label') || (e.id && document.querySelector(`label[for="${e.id}"]`));
      const shown = (x) => { const b = x.getBoundingClientRect(), s = getComputedStyle(x); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      return {
        name: (e.getAttribute('aria-label') || e.textContent || (lab && lab.textContent) || e.name || e.id || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 60),
        tag: e.tagName.toLowerCase(), href: e.tagName === 'A' ? e.href : null, disabled: !!e.disabled,
        visible: (r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden]')) || !!(lab && shown(lab)),
        on: (e.type === 'radio' && e.checked) || e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-pressed') === 'true' || e.hasAttribute('aria-current')
      };
    });
    const id = `${info.tag} "${info.name}"`;
    if (info.disabled || !info.visible) { res.hidden++; continue; }
    if (info.href) {
      res.links++;
      const r = await page.request.get(info.href.split('#')[0]).catch((e) => ({ status: () => e.message }));
      if (r.status() !== 200) res.badLinks.push(`${id} -> ${info.href} (${r.status()})`);
      continue;
    }
    res.tested++;
    const before = await page.evaluate(snapshot), p0 = popups, d0 = downloads;
    try { await el.click({ timeout: 3000 }); } catch {
      // a visually hidden input is clicked through its label, as a person would
      try { await el.locator('xpath=ancestor::label[1]').click({ timeout: 2000 }); } catch (e) { res.blocked.push(`${id}: ${e.message.split('\n')[0]}`); continue; }
    }
    await page.waitForTimeout(SETTLE);
    const after = await page.evaluate(snapshot).catch(() => 'navigated');
    if (after === before && popups === p0 && downloads === d0) {
      if (info.on) res.on++; else res.dead.push(id);
    }
  }
  await ctx.close();
  return res;
}

const browser = await chromium.launch();
let bad = 0;
for (const url of urls) {
  const r = await run(browser, url);
  const n = r.errors.length + r.dead.length + r.blocked.length + r.badLinks.length;
  bad += n;
  console.log(`\n${n ? 'FAIL' : 'ok  '} ${r.url}`);
  console.log(`  controls ${r.total}: clicked ${r.tested}, links ${r.links}, hidden or disabled ${r.hidden}, already on ${r.on}`);
  for (const [k, list] of [['error', r.errors], ['dead', r.dead], ['unclickable', r.blocked], ['broken link', r.badLinks]]) list.forEach((x) => console.log(`  ${k}: ${x}`));
}
await browser.close();
console.log(`\n${bad ? bad + ' problem(s)' : 'all pages clean'}`);
process.exit(bad ? 1 : 0);
