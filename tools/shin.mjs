/* A skating boot is stiff. If a pose needs more than about 28° of shin lean, the
   foot is in the wrong place under the hip — the ankle is not the problem.

   FORWARD IS NOT ACROSS — split 04/10/2026, Session 32. The limit was one cone of
   28° round the boot's up-axis, so a shin leaning over the toe and one leaning
   across the boot were held to the same number. A boot is built to flex forward
   (the lacing, the cut of the cuff) and to resist rolling, so the forward side of
   the cone is now FORWARD and everything else stays at LIMIT: an ellipse in the
   boot's frame, forward lean against FORWARD and across lean against LIMIT. A
   shin leaning back or straight across reads exactly what it read before; only
   lean with a forward part gains, and only up to four degrees.

   It was the snowplough that found it. With the body over the middle of the blade
   (where a skater balances) a lower hip leans the shin forward and nowhere else,
   and the single cone stopped it at a hip of 93 with the knees bent 25°. FORWARD is
   deliberately modest: the guide's deepest poses are starter moves and stops.
   Verified against a coach or a boot maker: NO.

   Broken on purpose: FORWARD back to 28 fails the snowplough on 6 legs (3 keys,
   both feet); the two limits swapped in bootFill fails the same 6. Nothing else
   in the guide leans forward past 28, which is why nothing else moved. */
import { MOVES } from '../src/lib/moves.js';
import { D2R, THIGH, SHIN, anterior, twoBone, kneeFace, bootDir, ankleOf, runnersDown, onIceOf } from '../src/lib/rig-math.js';

export const LIMIT = 28;      // across the boot, and backwards over the heel
export const FORWARD = 32;    // over the toe, where a boot is made to flex

/* How full the boot is: 1 is at the limit. Forward lean is read against FORWARD,
   across against LIMIT; lean with no forward part is the old cone exactly. */
export function bootFill({ forward, across, lean }) {
  if (forward <= 0) return lean / LIMIT;
  return Math.hypot(forward / FORWARD, across / LIMIT);
}

/* THE MEASUREMENT, exported so tools/knee.mjs can sweep it rather than re-derive
   it — Session 31. `face` is where the knee points; it defaults to the model's own
   rule, and the sweep passes the alternatives it is comparing. */
export function shinLean(k, w, face = kneeFace(k, w)) {
  return shinInBoot(k, w, face).lean;
}

/* The same shin in the boot's own frame: how much of the lean is FORWARD over the
   toe (what a boot's flex is built for) and how much is ACROSS it. */
export function shinInBoot(k, w, face = kneeFace(k, w)) {
  const q = k[w], hip = { t: 0, n: 0, z: k.hipZ };
  const bd = bootDir(k, w, twoBone(hip, q, THIGH, SHIN, face), q);
  const up = [-bd[0] * bd[2], -bd[1] * bd[2], 1 - bd[2] * bd[2]];
  const ul = Math.hypot(...up) || 1;
  const u2 = up.map(c => c / ul);
  const k0 = twoBone(hip, q, THIGH, SHIN, face);
  const an = ankleOf(k, w, bd, [k0.t-q.t, k0.n-q.n, k0.z-q.z]);
  const kn = twoBone(hip, an, THIGH, SHIN, face);
  const sv = [kn.t - an.t, kn.n - an.n, kn.z - an.z];
  const sl = Math.hypot(...sv) || 1;
  const dot = (sv[0] * u2[0] + sv[1] * u2[1] + sv[2] * u2[2]) / sl;
  const lat = [bd[1] * u2[2] - bd[2] * u2[1], bd[2] * u2[0] - bd[0] * u2[2], bd[0] * u2[1] - bd[1] * u2[0]];
  const fwd = (sv[0] * bd[0] + sv[1] * bd[1] + sv[2] * bd[2]) / sl;
  const across = (sv[0] * lat[0] + sv[1] * lat[1] + sv[2] * lat[2]) / sl;
  const deg = x => Math.atan2(x, dot) * 180 / Math.PI;
  return { lean: Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI,
           forward: deg(fwd), across: deg(across) };
}

/* Run as a checker only when invoked, so the measurement can be imported. */
if (import.meta.url === `file://${process.argv[1]}`) {
let bad = 0;
console.log(`shin lean inside the boot (about ${FORWARD}° forward over the toe, ${LIMIT}° across or back)\n`);

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
    /* RUNNERS, NOT EDGES — 19/09/2026. A skidding blade is flat and has no biting
       edge, but the leg above it is in the same stiff boot and leans the same way,
       so the limit this file exists for applies unchanged. Picks are still out,
       for the reason written above. */
    for (const w of runnersDown(k)) {
    const s = shinInBoot(k, w);
    if (bootFill(s) > 1 + 1e-9) {
      bad++;
      console.log(`  OVER  ${key.padEnd(9)} t=${k.t.toFixed(2)} ${w} ${onIceOf(k, w)}  ${s.lean.toFixed(0)}° ` +
        `(${s.forward.toFixed(0)}° forward against ${FORWARD}, ${s.across.toFixed(0)}° across against ${LIMIT})`);
    }
  }

console.log(bad ? `\n${bad} shins beyond what the boot allows` : 'all shins inside the boot');
process.exit(bad ? 1 : 0);
}
