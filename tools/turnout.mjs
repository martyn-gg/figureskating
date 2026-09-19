/* HOW FAR A BLADE ON THE ICE POINTS OFF THE WAY THE PELVIS FACES, and whether a
   hip can do it.

   `bootDir` gained a per-foot `yaw` on 19/09/2026 so that a planted blade could
   point somewhere other than along its own line — which is what a PUSH is, and
   what the guide could not draw. A free number in a pose file is the shape this
   repository keeps getting caught by: `pitch` had MAX_BLADE_PITCH, `point` had
   ANKLE_MAX, and until each of those was asserted the number was a description
   waiting to be believed. This is the third of them.

   WHAT IS MEASURED. The boot's heading minus the pelvis's, in plan — both are
   already angles in this model, so no vectors are needed and there is nothing to
   get backwards about a cross product. Which way round counts as OUTWARD comes
   from the foot: turning the left toe anticlockwise takes it away from the
   midline, and the right toe clockwise. So it mirrors for free, which is the
   property the whole guide is built on.

   THE ALLOWANCE IS ASYMMETRIC AND THE SCARCE DIRECTION IS INWARD — HIP_OUT 40,
   HIP_IN 20, both weight-bearing figures. See rig-math.js for where they come
   from and why the free-leg numbers would be the wrong ones.

   BLADES ONLY, AND THIS IS A REAL LIMIT rather than tidiness. Reading the boot's
   heading against the pelvis is only hip rotation while the leg is somewhere near
   under the skater. Extend the leg behind and a toe pointing away from the body
   is hip EXTENSION with a pointed ankle, and the plan angle reads as a hundred and
   fifty degrees of rotation that nobody is doing — `toePick`'s pick does exactly
   that. The same failure shape as shin.mjs measuring lean against world up at
   eighty degrees of pitch. A pick takes its direction from the reach and never
   reads `yaw`, so excluding it is honest rather than convenient; a free foot is
   not on the ice at all.

   AND YAW ON THE REFERENCE BLADE IS REFUSED. The reference blade is pinned to the
   path, and the path IS its tracing — so a reference blade turned off its own line
   is claiming to skid, and a skid leaves a scrape rather than a line. The guide has
   no mark for a scrape and lean.mjs would still be asserting that the blade leans
   over a biting edge it no longer has. That is a separate piece of work
   (docs/model.md, "A blade that is not travelling along itself"), and until it
   exists, saying so out loud beats drawing a tracing that is a lie.

   Broken on purpose. The first mutation is worth keeping in mind when reading the
   counts: there is only ONE second blade in the whole file that is not a pick, so a
   mutation aimed at second blades has almost nothing to land on, and the three feet
   it reports are three keyframes of `twoFoot`. The reference-blade mutation reaches
   every move, which is the asymmetry the pose data has and not a fault in either.

     --break=in     30 degrees of toe-in on every second blade ....  3 feet reported
     --break=ref    12 degrees of yaw on every reference blade .... 37 feet reported

       node tools/turnout.mjs
       node tools/turnout.mjs --break=in|ref
*/
import { MOVES } from '../src/lib/moves.js';
import { HIP_OUT, HIP_IN, bladesDown, dirOf } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const wrap = a => { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; };

let bad = 0, feet = 0, turned = 0, worst = { out: 0 }, worstIn = { in: 0 };
console.log(`blade heading against the pelvis (a weight-bearing hip gives ${HIP_OUT}° out, ${HIP_IN}° in)\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    for (const w of bladesDown(k)) {
      const q = k[w];
      let yaw = q.yaw || 0;
      if (BREAK === 'in' && w !== k.skate) yaw = w === 'L' ? -30 : 30;   // toes IN, past the 20
      if (BREAK === 'ref' && w === k.skate) yaw = 12;
      feet++;
      if (yaw) turned++;

      /* A yaw on the reference blade is a claim that the tracing is not the blade. */
      if (yaw && w === k.skate) {
        bad++;
        console.log(`  TRACING ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  the reference blade is yawed ${yaw}°, ` +
          `which says it skids —\n          and its tracing is drawn as a clean line along the path`);
        continue;
      }

      const heading = (dirOf(k, w) === 'F' ? 0 : 180) + yaw;
      const turn = wrap(heading - k.hipYaw);
      const out = (w === 'L' ? 1 : -1) * turn;          // + = away from the midline
      if (out > worst.out) worst = { out, key, w, t: k.t };
      if (-out > worstIn.in) worstIn = { in: -out, key, w, t: k.t };

      if (out > HIP_OUT + 1e-9) {
        bad++;
        console.log(`  OUT     ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  ${out.toFixed(0)}° of turnout, ` +
          `and a weight-bearing hip gives ${HIP_OUT}°`);
      } else if (-out > HIP_IN + 1e-9) {
        bad++;
        console.log(`  IN      ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  ${(-out).toFixed(0)}° of toe-in, ` +
          `and a weight-bearing hip gives only ${HIP_IN}° —\n          turn the pelvis and widen the stance rather than twisting the foot off it`);
      }
    }

console.log(`\n${feet} blades on the ice across ${Object.keys(MOVES).length} moves, ${turned} of them turned off the tracing`);
console.log(`furthest out ${worst.out.toFixed(0)}°${worst.key ? ` (${worst.key} ${worst.w})` : ''}, ` +
  `furthest in ${worstIn.in.toFixed(0)}°${worstIn.key ? ` (${worstIn.key} ${worstIn.w})` : ''}`);
console.log(bad
  ? `\n${bad} foot${bad === 1 ? '' : ' positions'} the hip cannot make`
  : 'every blade on the ice points somewhere its hip can put it, and only the pushing feet are turned at all');
process.exit(bad ? 1 : 0);
