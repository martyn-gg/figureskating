/* A free boot hanging near-vertical reads as a ballet point, which a stiff skating
   boot cannot do. The leg's own angle contributes most of it, so a steep boot means
   the free foot is authored too low — hanging rather than extended. */
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, bootDir } from '../src/lib/rig-math.js';

const LIMIT = 60;
let bad = 0;
console.log(`free boot elevation (a boot past ${LIMIT}° from level looks like a pointe)\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    for (const w of ['L', 'R']) {
      if (k.skate === w) continue;
      const q = k[w];
      const kn = twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, anterior(k.hipYaw));
      const bd = bootDir(k, w, kn, q, false);
      const el = Math.asin(Math.max(-1, Math.min(1, bd[2]))) * 180 / Math.PI;
      if (Math.abs(el) > LIMIT) {
        bad++;
        console.log(`  STEEP ${key.padEnd(7)} t=${k.t.toFixed(2)} ${w}  ${el.toFixed(0).padStart(4)}°   ` +
          `foot(${q.t},${q.n},${q.z}) hip ${k.hipZ}`);
      }
    }

console.log(bad ? `\n${bad} free boots too steep — raise or extend the foot` : 'every free boot sits at a plausible angle');
process.exit(bad ? 1 : 0);
