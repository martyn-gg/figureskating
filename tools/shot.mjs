/* One frame of the rig, from the built site. Reasoning about a 3D projection is
   unreliable; looking at it is not.

   node tools/shot.mjs [move] [fraction] [out.png] [views]
*/
import { resolve } from 'node:path';
import { browser, serveDist, openRig, seekRig } from './_rig.mjs';

const move = process.argv[2] ?? 'waltz';
const frac = Number(process.argv[3] ?? 0.2);
const out  = resolve(process.argv[4] ?? 'shot.png');
const views = (process.argv[5] ?? 'top,side,rear').split(',');

const site = await serveDist();
const b = await browser();
const p = await b.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
await p.emulateMedia({ colorScheme: 'light' });
await openRig(p, { origin: site.origin, move, views });
await seekRig(p, frac);
await p.waitForTimeout(150);
await p.locator('#rig-host').screenshot({ path: out });
console.log(`${out}  —  ${await p.locator('#rig-phase').textContent()}`);
await b.close();
site.close();
