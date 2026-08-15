/* A skating boot is stiff. If a pose needs more than about 28° of shin lean, the
   foot is in the wrong place under the hip — the ankle is not the problem. */
import { MOVES } from '../src/lib/moves.js';
import { D2R, THIGH, SHIN, anterior, twoBone, bootDir, ankleOf } from '../src/lib/rig-math.js';

const LIMIT = 28;
let bad = 0;
console.log(`shin lean inside the boot (a stiff boot allows about ${LIMIT}°)\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys) {
    if (!k.skate) continue;
    const q = k[k.skate];
    const bd = bootDir(k, k.skate, twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, anterior(k.hipYaw)), q, true);
    const up = [-bd[0] * bd[2], -bd[1] * bd[2], 1 - bd[2] * bd[2]];
    const ul = Math.hypot(...up) || 1;
    const u2 = up.map(c => c / ul);
    const k0 = twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, anterior(k.hipYaw));
    const an = ankleOf(q, bd, [k0.t-q.t, k0.n-q.n, k0.z-q.z]);
    const kn = twoBone({ t: 0, n: 0, z: k.hipZ }, an, THIGH, SHIN, anterior(k.hipYaw));
    const sv = [kn.t - an.t, kn.n - an.n, kn.z - an.z];
    const sl = Math.hypot(...sv) || 1;
    const dot = (sv[0] * u2[0] + sv[1] * u2[1] + sv[2] * u2[2]) / sl;
    const lean = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
    if (lean > LIMIT) {
      bad++;
      console.log(`  OVER  ${key.padEnd(7)} t=${k.t.toFixed(2)} ${k.skate}  ${lean.toFixed(0)}°`);
    }
  }

console.log(bad ? `\n${bad} shins beyond what the boot allows` : 'all shins inside the boot');
process.exit(bad ? 1 : 0);
