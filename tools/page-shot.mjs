/* Screenshot built pages from dist/, at a phone width by default — because that is
   how the guide is actually read. Pages are shot from the served build, never from a
   dev server, so what you look at is what ships.

       node tools/page-shot.mjs out/ elements/ elements/lfo/ elements/rbi-counter/
       node tools/page-shot.mjs out/ --width 900 elements/

   Needs Playwright, which is deliberately not a dependency. */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { browser, serveDist } from './_rig.mjs';

const argv = process.argv.slice(2);
const wi = argv.indexOf('--width');
const width = wi === -1 ? 414 : Number(argv[wi + 1]);
if (wi !== -1) argv.splice(wi, 2);

const [outDir, ...paths] = argv;
if (!outDir || paths.length === 0) {
  console.error('usage: node tools/page-shot.mjs <out-dir> [--width N] <path> [path...]');
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });
const srv = await serveDist();
const b = await browser();
const page = await b.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });

for (const p of paths) {
  const clean = p.replace(/^\/|\/$/g, '');
  await page.goto(`${srv.origin}/${clean}${clean ? '/' : ''}`, { waitUntil: 'load' });
  /* The edge diagram animates. Pause it and park it mid-turn, which is the frame
     worth looking at, so successive runs are comparable. */
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    for (const fig of document.querySelectorAll('.diagram')) {
      const s = fig.querySelector('[data-scrub]');
      if (!s) continue;
      fig.querySelector('[data-play]')?.click();
      s.value = String(Math.round(Number(s.max) * 0.55));
      s.dispatchEvent(new Event('input'));
    }
  });
  await page.waitForTimeout(300);
  const file = join(outDir, `${(clean || 'home').replace(/\//g, '_')}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
}

await b.close();
srv.close();
