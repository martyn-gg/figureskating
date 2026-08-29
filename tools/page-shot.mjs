/* Screenshot built pages from dist/, at a phone width by default — because that is
   how the guide is actually read. Pages are shot from the served build, never from a
   dev server, so what you look at is what ships.

       node tools/page-shot.mjs out/ elements/ elements/lfo/ elements/rbi-counter/
       node tools/page-shot.mjs out/ --width 900 elements/
       node tools/page-shot.mjs out/ --scheme dark elements/waltz-jump/

   The palette has two schemes, which makes it two designs; a shot of one is half a
   review. `--scheme` sets the emulated OS preference AND the explicit override, so
   the shot does not depend on which of the two paths the page happens to take, and
   the filename records it.

   Needs Playwright, which is deliberately not a dependency. */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { browser, serveDist } from './_rig.mjs';

const argv = process.argv.slice(2);
const arg = (flag, fallback) => {
  const i = argv.indexOf(flag);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const width = Number(arg('--width', 414));
const scheme = arg('--scheme', 'light');
if (!['light', 'dark'].includes(scheme)) {
  console.error(`--scheme must be light or dark, got ${scheme}`);
  process.exit(2);
}

const [outDir, ...paths] = argv;
if (!outDir || paths.length === 0) {
  console.error('usage: node tools/page-shot.mjs <out-dir> [--width N] <path> [path...]');
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });
const srv = await serveDist();
const b = await browser();
const page = await b.newPage({
  viewport: { width, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: scheme,
});
/* Belt and braces: the emulated preference above drives the media query, and this
   sets the stored choice the layout reads before first paint. Both agree, so the
   shot is the same either way the page resolves the scheme. */
await page.addInitScript(s => {
  try { localStorage.setItem('scheme', s); } catch (e) {}
}, scheme);

for (const p of paths) {
  const clean = p.replace(/^\/|\/$/g, '');
  await page.goto(`${srv.origin}/${clean}${clean ? '/' : ''}`, { waitUntil: 'load' });
  /* Both the edge diagrams and the rig animate, and both expose the same scrub
     input — so park every one of them by driving that, rather than by clicking
     play. Clicking play toggles, which depends on what state it was already in;
     the scrub handler pauses unconditionally. The old code looked for `.diagram`
     only, so rig pages were never parked at all and two runs of the same page
     came back on different frames.

     t=0.55 is mid-turn, the frame worth looking at, and the same every run. */
  await page.waitForTimeout(500);
  const parked = await page.evaluate(() => {
    const scrubs = document.querySelectorAll('[data-scrub]');
    for (const s of scrubs) {
      s.value = String(Math.round(Number(s.max) * 0.55));
      s.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return scrubs.length;
  });
  if (!parked) console.warn(`  no scrub found on ${clean || 'home'} — nothing to park`);
  await page.waitForTimeout(300);
  const file = join(outDir, `${(clean || 'home').replace(/\//g, '_')}-${scheme}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
}

await b.close();
srv.close();
