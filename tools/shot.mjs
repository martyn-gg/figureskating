/* One screenshot of the body-frame rig at a given point in a move.
   Reasoning about a 3D projection is unreliable; looking at it is not.

   node tools/shot.mjs [fraction] [out.png] [rig.html]
*/
import { resolve } from 'node:path';
import { ROOT, browser } from './_rig.mjs';

const frac = Number(process.argv[2] ?? 0.2);
const out  = resolve(process.argv[3] ?? 'shot.png');
const rig  = resolve(ROOT, process.argv[4] ?? 'prototypes/body-frame.html');

const b = await browser();
const p = await b.newPage({ viewport: { width: 1240, height: 1400 }, deviceScaleFactor: 2 });
await p.emulateMedia({ colorScheme: 'light' });
await p.goto('file://' + rig);
await p.waitForTimeout(400);

await p.evaluate(() => document.getElementById('play').click());      // pause
await p.evaluate(f => {
  const s = document.getElementById('scrub');
  s.value = Math.round(Number(s.max) * f);
  s.dispatchEvent(new Event('input'));
}, frac);
await p.waitForTimeout(200);

await p.locator('#views').screenshot({ path: out });
console.log(`${out}  —  ${await p.locator('#phase').textContent()}`);
await b.close();
