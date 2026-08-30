/* A free boot hanging near-vertical reads as a ballet point, which a stiff skating
   boot cannot do. The leg's own angle contributes most of it, so a steep boot means
   the free foot is authored too low — hanging rather than extended.

   PER FRAME, not per keyframe. It read keyframes only until 29/08/2026, which is
   the same gap lean.mjs was rewritten to close two sessions earlier: the rig
   interpolates, and the worst frame of a movement is almost never one of the
   frames it was authored at. The waltz jump's free boot passes every keyframe at
   55.8° and reaches 88.4° between two of them.

   What this measures is a property of the LEG, not of the foot, and its own name
   has been wrong about that. bootDir fixes the boot at exactly ANKLE_FREE to the
   shin by construction, so "the boot holds the ankle square" is not a claim this
   file could ever falsify. Boot angle from level is what it reports, and where a
   pose exceeds the limit the fix is the leg — raise or extend the foot. Do not
   move the constant to quiet it: ANKLE_FREE and the 60° limit are a coach's call,
   and Session 05 measured that no value of ANKLE_FREE helps all four held
   positions at once.

       node tools/freefoot.mjs
*/
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, bootDir, buildPath, poseAt, onIceOf } from '../src/lib/rig-math.js';

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

console.log(`\n${glyphs} free-boot frames measured`);
console.log(bad
  ? `${bad} stretch${bad === 1 ? '' : 'es'} of frames too steep — raise or extend the foot, not the constant`
  : 'every free boot sits at a plausible angle, in every frame');
process.exit(bad ? 1 : 0);
