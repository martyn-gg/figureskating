/* Shared plumbing for the tools. Paths resolve relative to the repository, never
   to whoever's machine wrote them. */
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname } from 'node:path';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* The base path lived as the literal '/figureskating' in two tools, which was
   fine right up until the site got its own domain and the base became '/'. Read
   it from the one file that decides it instead — a checker that has the base
   wrong reports on paths the site does not serve. Normalised without a trailing
   slash, so `BASE + '/x'` is right for both '' and '/figureskating'. */
export const BASE = (await import('../astro.config.mjs')).default.base
  ?.replace(/\/+$/, '') ?? '';
export const stripBase = p => (BASE && p.startsWith(BASE)) ? p.slice(BASE.length) || '/' : p;

/* Playwright is not a dependency of the site — the browser download is far too
   heavy to inflict on anyone who only wants to build pages. Screenshot tools ask
   for it politely instead of exploding. */
export async function browser() {
  let pw;
  try { pw = await import('playwright'); }
  catch {
    console.error('This tool needs Playwright, which is not installed by default:\n' +
      '  npm install --no-save playwright && npx playwright install chromium\n');
    process.exit(2);
  }
  const exe = process.env.CHROMIUM_PATH;         // set in sandboxes with a preinstalled build
  return (pw.chromium ?? pw.default.chromium).launch(exe ? { executablePath: exe } : {});
}

/* Serve dist/ so the tools look at what actually ships, not at a separate copy
   of the rig that could drift from it. Run `npm run build` first. */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
                '.json': 'application/json', '.webmanifest': 'application/manifest+json',
                '.svg': 'image/svg+xml', '.png': 'image/png' };
export async function serveDist() {
  const DIST = join(ROOT, 'dist');
  await readFile(join(DIST, 'index.html')).catch(() => {
    console.error('No dist/ found — run `npm run build` first.\n');
    process.exit(2);
  });
  const server = createServer(async (req, res) => {
    let p = join(DIST, stripBase(decodeURIComponent(req.url.split('?')[0])));
    try {
      let body;
      try { body = await readFile(p); }
      catch { p = join(p, 'index.html'); body = await readFile(p); }
      res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise(r => server.listen(0, r));
  return { origin: `http://localhost:${server.address().port}${BASE}`, close: () => server.close() };
}

/* Load the rig explorer, select a move, pause, and choose which views to show. */
export async function openRig(page, { origin, move = 'waltz', views = ['top', 'side', 'rear'] }) {
  await page.goto(`${origin}/rig/`);
  await page.waitForTimeout(450);
  await page.evaluate(([m, v]) => {
    for (const b of document.querySelectorAll('.rig-pick button')) if (b.dataset.move === m) b.click();
    document.getElementById('rig-play').click();                      // pause
    for (const box of document.querySelectorAll('[data-view]'))
      if (box.checked !== v.includes(box.dataset.view)) box.click();
  }, [move, views]);
  await page.waitForTimeout(350);
}

export const seekRig = (page, t) => page.evaluate(f => {
  const s = document.getElementById('rig-scrub');
  s.value = String(Math.round(Number(s.max) * f));
  s.dispatchEvent(new Event('input'));
}, t);
