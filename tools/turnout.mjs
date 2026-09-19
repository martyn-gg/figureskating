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

   AND IT IS NOT A CONSTANT, BECAUSE THE KNEE ADDS TO IT WHEN BENT. A straight
   knee is locked by its own condyles; a bent one gives up to another 18 degrees
   out and 25 in. So the limit is read per foot from how bent that leg is, which is
   why a skater pliés to find turnout — and why, before this term was in, the model
   forbade a right-angled T-stop outright: two feet at forty each is eighty, and a
   T is ninety.

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
     --break=true   every skid straightened to 4 degrees of yaw ...  3 feet reported

       node tools/turnout.mjs
       node tools/turnout.mjs --break=in|ref|true
*/
import { MOVES } from '../src/lib/moves.js';
import { HIP_OUT, HIP_IN, SKID_MIN_YAW, KNEE_TWIST_OUT, THIGH, SHIN, anterior,
         twoBone, bootDir, ankleOf, turnoutAllowed, kneeFlex,
         runnersDown, dirOf, onIceOf, edgeOf } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const wrap = a => { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; };

let bad = 0, feet = 0, turned = 0, worst = { out: 0 }, worstIn = { in: 0 };
console.log(`blade heading against the pelvis — a weight-bearing hip gives ${HIP_OUT}° out and ${HIP_IN}° in,\n` +
  `and a bent knee up to ${KNEE_TWIST_OUT}° more\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    /* Runners: a stop turns the foot further than a push does, and the hip is
       what has to do it either way. */
    for (const w of runnersDown(k)) {
      const q = k[w];
      let yaw = q.yaw || 0;
      if (BREAK === 'in' && w !== k.skate) yaw = w === 'L' ? -30 : 30;   // toes IN, past the 20
      if (BREAK === 'ref' && w === k.skate) yaw = 12;
      if (BREAK === 'true' && onIceOf(k, w) === 'skid') yaw = Math.sign(yaw) * 4;
      feet++;
      if (yaw) turned++;

      /* A SKID MUST BE TURNED, AND MUST SAY WHICH EDGE — the pick's assertion read
         back. blade.mjs holds a blade inside the rocker's pitch and a pick outside
         it, from both sides, because an exemption can only ever excuse a pose. A
         skid is exempt from lean.mjs, so this is what holds it to something: below
         SKID_MIN_YAW the blade is running along its own line like any other edge,
         and calling that a stop is a claim the geometry does not make.

         It does not separate a skid from a push, and is not trying to: a push is
         turned further than this and grips throughout. Whether a contact slips or
         holds is friction, which a rig of markers cannot see, which is exactly why
         the contact is declared. */
      if (onIceOf(k, w) === 'skid') {
        if (Math.abs(yaw) < SKID_MIN_YAW) {
          bad++;
          console.log(`  TRUE    ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  declared a skid and yawed only ` +
            `${Math.abs(yaw).toFixed(0)}° — below ${SKID_MIN_YAW}° it is running along its own line`);
        }
        if (!edgeOf(k, w)) {
          bad++;
          console.log(`  EDGE    ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  a skid rides an edge and this one ` +
            `names none — a T-stop is outside, and inside is the error coaches name`);
        }
      }

      /* A YAW ON THE REFERENCE BLADE IS A CLAIM THAT IT SKIDS, so it has to say so.
         The reference blade is pinned to the path and the path is its tracing:
         turned off its own line it is sliding, and the mark it leaves is a scrape
         rather than a clean curve. Since 19/09/2026 the tracing can draw one — but
         only when the pose declares the skid, because that is what tells the
         renderer to smear the mark instead of drawing a line that would be a lie. */
      if (yaw && w === k.skate && onIceOf(k, w) !== 'skid') {
        bad++;
        console.log(`  TRACING ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  the reference blade is yawed ${yaw}° ` +
          `and not declared a skid —\n          so its tracing draws as a clean line along a path it is sliding across`);
        continue;
      }

      const heading = (dirOf(k, w) === 'F' ? 0 : 180) + yaw;
      const turn = wrap(heading - k.hipYaw);
      const out = (w === 'L' ? 1 : -1) * turn;          // + = away from the midline
      if (out > worst.out) worst = { out, key, w, t: k.t };
      if (-out > worstIn.in) worstIn = { in: -out, key, w, t: k.t };

      /* How bent this knee is, and therefore how much the leg may turn. Read off
         the pose the way every other limit in this repository now is. */
      const fq = { ...q, yaw };
      const kk = { ...k, [w]: fq }, hip = { t: 0, n: 0, z: k.hipZ };
      const k0 = twoBone(hip, fq, THIGH, SHIN, anterior(k.hipYaw));
      const bd = bootDir(kk, w, k0, fq);
      const an = ankleOf(kk, w, bd, [k0.t - fq.t, k0.n - fq.n, k0.z - fq.z]);
      const d = Math.hypot(an.t, an.n, an.z - k.hipZ);
      const allow = turnoutAllowed(d), flex = kneeFlex(d);

      if (out > allow.out + 1e-9) {
        bad++;
        console.log(`  OUT     ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  ${out.toFixed(0)}° of turnout, and a leg ` +
          `bent ${flex.toFixed(0)}° gives ${allow.out.toFixed(0)}° —\n          bend the knee for more of it, or turn the pelvis`);
      } else if (-out > allow.in + 1e-9) {
        bad++;
        console.log(`  IN      ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  ${(-out).toFixed(0)}° of toe-in, and a leg ` +
          `bent ${flex.toFixed(0)}° gives only ${allow.in.toFixed(0)}° —\n          turn the pelvis and widen the stance rather than twisting the foot off it`);
      }
    }

console.log(`\n${feet} blades on the ice across ${Object.keys(MOVES).length} moves, ${turned} of them turned off the tracing`);
console.log(`furthest out ${worst.out.toFixed(0)}°${worst.key ? ` (${worst.key} ${worst.w})` : ''}, ` +
  `furthest in ${worstIn.in.toFixed(0)}°${worstIn.key ? ` (${worstIn.key} ${worstIn.w})` : ''}`);
console.log(bad
  ? `\n${bad} foot${bad === 1 ? '' : ' positions'} the hip cannot make`
  : 'every blade on the ice points somewhere its hip can put it, and only the pushing feet are turned at all');
process.exit(bad ? 1 : 0);
