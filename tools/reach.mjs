/* Every foot must be within the leg's reach, measured to the ankle inside the
   boot — not to the blade. Out of reach means the leg visibly detaches. */
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, bootDir, ankleOf } from '../src/lib/rig-math.js';

const REACH = THIGH + SHIN;
let bad = 0;
console.log(`hip → ankle distance against a ${REACH} cm leg\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    for (const w of ['L', 'R']) {
      const q = k[w], skating = k.skate === w;
      const k0 = twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, anterior(k.hipYaw));
      const an = ankleOf(q, bootDir(k, w, k0, q, skating));
      const d = Math.hypot(an.t, an.n, an.z - k.hipZ);
      if (d > REACH) {
        bad++;
        console.log(`  OVER  ${key.padEnd(7)} t=${k.t.toFixed(2)} ${w}${skating ? '*' : ' '}  ` +
          `${d.toFixed(0)}cm = ${(100 * d / REACH).toFixed(0)}%   blade(${q.t},${q.n},${q.z})`);
      }
    }

console.log(bad ? `\n${bad} feet beyond reach — the leg would detach from the boot` : 'all feet within reach');
process.exit(bad ? 1 : 0);
