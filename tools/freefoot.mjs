/* A free boot hanging near-vertical reads as a ballet point, which a stiff skating
   boot cannot do. The leg's own angle contributes most of it, so a steep boot means
   the free foot is authored too low — hanging rather than extended.

   PER FRAME, not per keyframe. It read keyframes only until 29/08/2026, which is
   the same gap lean.mjs was rewritten to close two sessions earlier: the rig
   interpolates, and the worst frame of a movement is almost never one of the
   frames it was authored at. The waltz jump's free boot passes every keyframe at
   55.8° and reaches 88.4° between two of them.

   Boot angle from level is mostly a property of the LEG, not of the foot, and this
   file's name has always been a little wrong about that. Where a pose exceeds the
   limit the first thing to try is still the leg — raise or extend the foot.

   IT NOW ALSO CHECKS THE FOOT — 30/08/2026. Until then bootDir fixed the boot at
   exactly ANKLE_FREE to the shin by construction, so "the boot holds the ankle
   square" was a claim this file could not falsify, which Session 05 said out loud.
   The ankle is authored per foot now: `point` on a keyframe, in degrees, and
   bootDir clamps it to ANKLE_MAX. A clamp is a silent correction of somebody's
   number — the same shape as the featured filter that absorbed the twizzles, and
   as the loop that discarded an authored hand under a comment promising it worked.
   So the clamp stays, defensively, and assertion 2 below says nobody is relying on
   it. Broken on purpose: one keyframe authored at point 45 → 1 foot reported.

   The 60° limit is still a coach's call and so is ANKLE_MAX. What changed is that
   there is now something to author instead of a constant to move: `npm run ankle`
   shows every existing pose has slack it is not using, because nobody could
   choose. Session 05's "no value helps all four positions at once" was never a
   fact about the value.

       node tools/freefoot.mjs
*/
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, ANKLE_MAX, anterior, twoBone, bootDir, buildPath, poseAt, onIceOf } from '../src/lib/rig-math.js';

const LIMIT = 60;
let bad = 0, glyphs = 0;
console.log(`free boot elevation, every frame (a boot past ${LIMIT}° from level looks like a pointe)\n`);

for (const [key, m] of Object.entries(MOVES)) {
  const path = buildPath(m);
  /* Report a run of bad frames once, at its worst, rather than three hundred
     times: a checker nobody can read the output of is not a checker. */
  let run = null;
  const flush = () => {
    if (!run) return;
    bad++;
    console.log(`  STEEP ${key.padEnd(13)} ${run.w}  ${run.el.toFixed(1).padStart(6)}° at f=${run.at.toFixed(3)}` +
      `   (${run.n} frame${run.n === 1 ? '' : 's'} from f=${run.from.toFixed(3)} to f=${run.to.toFixed(3)})`);
    run = null;
  };

  for (const w of ['L', 'R']) {
    for (let i = 0; i < path.length; i++) {
      const f = i / (path.length - 1);
      const pose = poseAt(m, f);
      /* A foot with a blade on the ice is not a free foot, whether or not it
         is the reference blade. Asking `pose.skate === w` would measure the
         second blade of a two-foot position against the free-boot limit and
         report a pointe on a foot that is flat on the ice. */
      if (onIceOf(pose, w) === 'blade') { flush(); continue; }
      glyphs++;
      const q = pose[w];
      const kn = twoBone({ t: 0, n: 0, z: pose.hipZ }, q, THIGH, SHIN, anterior(pose.hipYaw));
      const bd = bootDir(pose, w, kn, q, false);
      const el = Math.asin(Math.max(-1, Math.min(1, bd[2]))) * 180 / Math.PI;
      if (Math.abs(el) > LIMIT) {
        if (!run) run = { w, el, at: f, from: f, to: f, n: 0 };
        if (Math.abs(el) > Math.abs(run.el)) { run.el = el; run.at = f; }
        run.to = f; run.n++;
      } else flush();
    }
    flush();
  }
}

/* 2. Every authored point is inside what the boot allows. Read off the KEYFRAMES,
      not the interpolated poses: an out-of-range number is an authoring mistake and
      interpolation between two legal keys can never make one. */
let outOfRange = 0, authored = 0;
for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    for (const w of ['L', 'R']) {
      const q = k[w];
      if (!q || q.point === undefined) continue;
      authored++;
      if (q.point < 0 || q.point > ANKLE_MAX) {
        outOfRange++;
        console.log(`  BEYOND ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  point ${q.point}° — the boot allows ${ANKLE_MAX}°, and bootDir would clamp it silently`);
      }
    }

console.log(`\n${glyphs} free-boot frames measured, ${authored} authored ankle angles`);
console.log(bad
  ? `${bad} stretch${bad === 1 ? '' : 'es'} of frames too steep — raise or extend the foot, not the constant`
  : 'every free boot sits at a plausible angle, in every frame');
if (outOfRange) console.log(`${outOfRange} ankle angle${outOfRange === 1 ? '' : 's'} past what the boot allows`);
process.exit(bad || outOfRange ? 1 : 0);
