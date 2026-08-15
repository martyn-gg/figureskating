/* Every keyframe of a move, side by side. This is the tool that catches sequence
   errors: individual frames always look plausible, and only the whole element
   laid out together shows a leg on the wrong side of the body.

   node tools/contact-sheet.mjs [move] [outDir] [views]
*/
import { resolve, join } from 'node:path';
import { browser, serveDist, openRig, seekRig } from './_rig.mjs';
import { MOVES } from '../src/lib/moves.js';

const moveId = process.argv[2] ?? 'waltz';
const outDir = resolve(process.argv[3] ?? '.');
const views = (process.argv[4] ?? 'side').split(',');
const move = MOVES[moveId];
if (!move) { console.error(`unknown move: ${moveId}. Try: ${Object.keys(MOVES).join(', ')}`); process.exit(2); }

const site = await serveDist();
const b = await browser();
const p = await b.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
await p.emulateMedia({ colorScheme: 'light' });
await openRig(p, { origin: site.origin, move: moveId, views });

for (const [i, k] of move.keys.entries()) {
  await seekRig(p, k.t);
  await p.waitForTimeout(70);
  await p.locator('.bf-card').first().screenshot({ path: join(outDir, `sheet-${moveId}-${String(i).padStart(2, '0')}.png`) });
  console.log(`${k.t.toFixed(2)}  ${k.ph}`);
}
console.log(`\n${move.keys.length} frames written to ${outDir}`);
await b.close();
site.close();
