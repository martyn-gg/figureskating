/* A skating boot is stiff. If a pose needs more than about 28° of shin lean, the
   foot is in the wrong place under the hip — the ankle is not the problem. */
import { MOVES } from '../src/lib/moves.js';
import { D2R, THIGH, SHIN, anterior, twoBone, bootDir, ankleOf, bladesDown, onIceOf } from '../src/lib/rig-math.js';

const LIMIT = 28;
let bad = 0;
console.log(`shin lean inside the boot (a stiff boot allows about ${LIMIT}°)\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    /* Every leg with a BLADE on the ice: the boot is just as stiff on the second
       one, and a two-foot position is where a shin is likeliest to be over.

       DELIBERATELY NOT A PICK, and this was tried the other way first. The lean
       measured here is the shin against a boot up-axis built from world up, which
       is what "lean inside the boot" means while the boot is near flat — and a
       picked boot is pitched forty degrees or more, where that vector stops being
       the boot's axis at all and the number stops meaning anything. Take the boot's
       real up-axis instead and it comes from the knee, one iteration from the shin
       being measured, so the angle collapses towards an identity. What a pick
       genuinely constrains is its ANKLE angle, and freefoot.mjs asserts that. */
    for (const w of bladesDown(k)) {
    const q = k[w];
    const bd = bootDir(k, w, twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, anterior(k.hipYaw)), q);
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
      console.log(`  OVER  ${key.padEnd(9)} t=${k.t.toFixed(2)} ${w} ${onIceOf(k, w)}  ${lean.toFixed(0)}°`);
    }
  }

console.log(bad ? `\n${bad} shins beyond what the boot allows` : 'all shins inside the boot');
process.exit(bad ? 1 : 0);
