/* A skater on an edge leans into the circle, and the blade is therefore on the
   OUTSIDE of the lobe — out from under the body, not under it. That single fact
   is what the lateral offset in the pose data mostly is: at hipZ 86 and n 18 the
   skater is leaning 11.8°, which is a decent forward outside edge and nothing to
   do with which side of the body the foot is on.

   It is worth asserting because the alternative is reading a lateral offset off a
   keyframe and calling the feet crossed, which is exactly what happened at frame
   60 of the waltz jump. n is not "which foot"; n is mostly lean.

   Two independent routes to the same claim, because either alone can be talked
   out of:

     TRACK   the lobe curves toward its centre, and lobeSense says which side that
             is. The blade must sit on the far side of the hip from the centre.
     BODY    the edge letter says which side of the boot bites — outside of the
             left foot is its left side — and a skater leans over the biting edge.
             Measured against hipYaw, so it survives the skater facing backwards,
             which is precisely where the track route stops being intuitive.

   They use different inputs (lobeSense and the path; the edge letter and hipYaw)
   and must agree on every frame. A pose that satisfies one and not the other is a
   pose where the body and the tracing disagree about which way it is falling.

   BOTH ROUTES RUN ON EVERY BLADE ON THE ICE, not only the reference one. This is
   the assertion that was expected to have to be scoped out when a pose learned to
   hold two blades, and it does not: a skater cannot lean two ways at once, and
   they do not have to. British Ice Skating's own two-foot pairs are RFI & LFO and
   RFO & LFI — one foot outside, the other inside — and the outside of the left
   foot and the inside of the right foot are BOTH the skater's left side. So the
   two blades bite on one side, the body leans over that side, and both routes are
   satisfied by one lean. The same holds for a spread eagle, where the feet oppose
   in direction rather than in edge. The generalisation makes this file stronger
   rather than weaker: it now says every blade on the ice leans the same way.

       node tools/lean.mjs
       node tools/lean.mjs --break    # put the outward-leaning waltz landing back
*/

import { MOVES } from '../src/lib/moves.js';
import { lobeSense } from '../src/lib/skating.js';
import { lateral, poseAt, edgeOf, dirOf, edgesDown, onIceOf } from '../src/lib/rig-math.js';

const BREAK = process.argv.includes('--break');
const FRAMES = 320;

/* Which side of the boot bites: the outside of the left foot is the left side of
   it, the outside of the right foot the right side. +1 = the skater's right. */
const bitingSide = (foot, edge) => ((foot === 'L') === (edge === 'O')) ? -1 : +1;

let bad = 0, checked = 0, routes = 0, skids = 0;
const fail = m => { bad++; console.error(`  x ${m}`); };

console.log(`lean, ${BREAK ? 'with the old waltz landing put back' : 'as authored'}\n`);

for (const [id, move] of Object.entries(MOVES)) {
  let worstTrack = null, worstBody = null, n = 0;

  for (let i = 0; i < FRAMES; i++) {
    const pose = poseAt(move, i / (FRAMES - 1));
    if (!pose.skate) continue;                      // airborne: no edge to lean on

    /* EDGES, and deliberately not every runner. Both routes below are claims
       about a BITING EDGE — which side of the blade is down and which way the
       skater has fallen over it — and a skidding blade has neither: it is flat,
       because a blade on a real edge grips and stops skidding. An exemption can
       only excuse a pose, so the counter-assertion is below: a skid must BE flat. */
    for (const w of edgesDown(pose)) {
      const q = { ...pose[w] };
      if (BREAK && id === 'waltz' && pose.dir === 'B') q.n = -q.n;
      n++; checked++;
      const edge = edgeOf(pose, w), dir = dirOf(pose, w);

      /* TRACK. k = -lobeSense/radius, and an arc of curvature k turns toward
         sign(k) x n — so the centre is on the sign(-lobeSense) side and the blade
         must be on the other one. Which lands on: sign(blade n) === lobeSense. */
      const want = lobeSense(w, edge, dir);
      if (Math.sign(q.n) !== want)
        worstTrack = worstTrack && Math.abs(worstTrack.n) > Math.abs(q.n) ? worstTrack
          : { t: i / (FRAMES - 1), n: q.n, want, w, ph: pose.ph };

      /* BODY. The vector from blade to hip, projected onto the skater's right —
         which is where hipYaw earns its place. Leaning right is positive, and the
         skater leans over whichever edge is biting. */
      const R = lateral(pose.hipYaw);
      const toHip = [-q.t, -q.n];
      const rightward = toHip[0] * R[0] + toHip[1] * R[1];
      const side = bitingSide(w, edge);
      if (Math.sign(rightward) !== side)
        worstBody = worstBody && Math.abs(worstBody.lean) > Math.abs(rightward) ? worstBody
          : { t: i / (FRAMES - 1), lean: rightward, side, w, ph: pose.ph };
    }

    /* SKIDS ARE COUNTED AND NOT JUDGED HERE, and where the judging went is the
       point. A skid rides an edge — a T-stop is unanimously on the trailing
       blade's outside edge — so the obvious exemption, "it has no edge", is wrong.
       What it has no part of is either claim this file makes: the TRACK route puts
       the blade on the far side of the hip from a lobe centre, and a skidding blade
       is across the lobe rather than on it; the BODY route says the skater has
       fallen over the biting edge, and in a T-stop the weight stays on the GLIDING
       foot while the trailing ankle turns out under almost none of it.

       An exemption can only excuse a pose, so the assertion that holds a skid to
       something lives in turnout.mjs, where the yaw does: a skid must be turned off
       its own line past SKID_MIN_YAW, and must name the edge it rides. Written up
       in rig-math.js, including the flat-blade version of this that was reasoned
       out first and is wrong. */
    for (const w of ['L', 'R']) if (onIceOf(pose, w) === 'skid') skids++;
  }

  routes += 2;
  const tag = `${id.padEnd(13)} ${String(n).padStart(4)} blade-frames on an edge`;
  if (!worstTrack && !worstBody) { console.log(`  ok   ${tag}`); continue; }
  console.log(`  BAD  ${tag}`);
  if (worstTrack)
    fail(`${id} leans out of its own lobe: at t=${worstTrack.t.toFixed(2)} the ${worstTrack.w} blade is at ` +
      `n=${worstTrack.n.toFixed(1)}, and a lobe of sense ${worstTrack.want > 0 ? '+1' : '-1'} ` +
      `puts its centre on the other side — "${worstTrack.ph}"`);
  if (worstBody)
    fail(`${id} leans off its own edge: at t=${worstBody.t.toFixed(2)} the body is ` +
      `${worstBody.lean > 0 ? 'right' : 'left'} of the ${worstBody.w} blade by ${Math.abs(worstBody.lean).toFixed(1)} cm, ` +
      `but the biting edge is on the skater's ${worstBody.side > 0 ? 'right' : 'left'} — "${worstBody.ph}"`);
}

console.log(bad
  ? `\n${bad} of ${routes} claims failed over ${checked} blade-frames on an edge and ${skids} skidding`
  : `\n${checked} blade-frames on an edge, every blade leaning into its circle and over its edge` +
    (skids ? `,\nand ${skids} skidding frames left to turnout.mjs, which is where their claim is` : ''));
process.exit(bad ? 1 : 0);
