/* The offline promise has two halves, and the first version of the service worker
   kept only one of them.

   1. A page already visited must still open with the network gone. That is the
      whole point — a cold rink with no signal.
   2. A page that has changed must reach a reader who has visited before. The
      original worker was cache-first with a fixed cache name and no
      revalidation, so the first copy anyone loaded was the copy they kept for
      ever. A coach's correction would never have arrived.

   This asserts both, against the real built site.

   Needs Playwright, so it is not in `npm run check`.

       npm run build && node tools/offline.mjs
*/

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { browser, serveDist, ROOT } from './_rig.mjs';

const PAGE = '/elements/lfo/';
const MARKER = '<!--offline-check-marker-->';
const file = join(ROOT, 'dist', 'elements', 'lfo', 'index.html');

const srv = await serveDist();
const b = await browser();
const ctx = await b.newContext({ serviceWorkers: 'allow' });
const page = await ctx.newPage();
let failures = 0;
const fail = m => { failures++; console.error(`  ✗ ${m}`); };

const original = await readFile(file, 'utf8');

try {
  console.log('offline behaviour (against the built site)\n');

  /* The built pages only register a worker in a production build, which is what
     dist/ is — but say so plainly if the registration is missing, because the
     rest of this check would then pass for the wrong reason. */
  await page.goto(`${srv.origin}${PAGE}`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const registered = await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistrations()).length > 0);
  if (!registered) { fail('no service worker registered by the built site'); }
  else console.log('  worker registered');

  /* The navigation that installs a worker is not itself controlled by it, so the
     page is not in the cache until the next visit. Reload once online before
     pulling the plug, or this checks nothing. */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);

  // 1. still there with the network gone
  await ctx.setOffline(true);
  try {
    await page.reload({ waitUntil: 'load' });
    const offlineTitle = await page.title();
    if (!/Left forward outside edge/.test(offlineTitle)) fail(`offline reload lost the page (title: ${offlineTitle})`);
    else console.log('  opens with the network gone');
  } catch {
    /* A failure here is a result, not a crash. Reporting it as an exception hides
       it behind a stack trace. */
    fail('offline reload failed outright — nothing was cached');
  }
  await ctx.setOffline(false);

  // 2. a changed page reaches a reader who has been before
  await writeFile(file, original.replace('</body>', `${MARKER}</body>`));
  /* Stale-while-revalidate hands back the cached copy first and fetches behind
     it, so the change lands on the visit after the one that noticed it. Two
     reloads is the honest expectation, not one. */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  await page.reload({ waitUntil: 'load' });
  const html = await page.content();
  if (!html.includes('offline-check-marker')) fail('a changed page never reached a returning reader — the cache is pinning content');
  else console.log('  a changed page reaches a returning reader');
} finally {
  await writeFile(file, original);
  await b.close();
  srv.close();
}

if (failures) { console.error(`\n${failures} offline check(s) failed`); process.exit(1); }
console.log('\noffline works, and does not pin stale content');
