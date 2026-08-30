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

   AND IT NOW CHECKS THE PICK, WHICH IS THE SAME NUMBER READ BACKWARDS —
   30/08/2026. A free foot authors its ankle angle and the boot's direction
   follows; a picked foot authors the boot's direction — pitch, on the ice — and
   the ANKLE ANGLE follows, as whatever the shin and that direction leave between
   them. Same boot, same allowance, so the same assertion: 0 to ANKLE_MAX,
   whichever way round the quantity was derived.

   This is the only place ANKLE_MAX bites on a pose rather than on a number
   somebody typed, and it turned out to decide the shape of the only picked pose
   in the file. What a picked boot can be pitched to is set almost entirely by how
   low the hip is, and `npm run ankle` prints it as three bands rather than a slope:
   89° from a hip of 62 down, NOTHING legal between 64 and 76, and only 4 to 12° at a
   standing height — barely past the 3.5° a blade already has. The only way to tilt
   the boot further with the toe on the ice is to tilt the whole leg, and the only way
   to do that is to sink. Which is what a skater does before they pick. Broken on purpose: the picked pose's hip raised 20 cm, 3 feet; an
   ankle angle written onto a picked foot, 3 feet; a keyframe authored at point 45,
   1 foot.

   The 60° limit is still a coach's call and so is ANKLE_MAX. What changed is that
   there is now something to author instead of a constant to move: `npm run ankle`
   shows every existing pose has slack it is not using, because nobody could
   choose. Session 05's "no value helps all four positions at once" was never a
   fact about the value.

       node tools/freefoot.mjs
       node tools/freefoot.mjs --break=point|standing
*/
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, D2R, ANKLE_MAX, anterior, twoBone, bootDir, ankleOf, buildPath, poseAt,
         onIceOf, contactsDown } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
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
      /* A foot ON THE ICE is not a free foot, whether or not it is the reference
         blade and whether it is on a blade or on its pick. Asking `pose.skate === w`
         would measure the second blade of a two-foot position against the free-boot
         limit and report a pointe on a foot that is flat on the ice; asking
         `=== 'blade'` would do the same to a picked foot, which IS pointed steeply
         past this limit, deliberately, because that is what a pick is. */
      if (onIceOf(pose, w)) { flush(); continue; }
      glyphs++;
      const q = pose[w];
      const kn = twoBone({ t: 0, n: 0, z: pose.hipZ }, q, THIGH, SHIN, anterior(pose.hipYaw));
      const bd = bootDir(pose, w, kn, q);
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

/* 2. Every PICKED foot's implied ankle angle is inside what the boot allows.

      Read off the keyframes for the same reason as assertion 3 below: the numbers
      that decide it — the foot's position and its pitch — are authored, and a
      frame between two legal keys is a leg passing through legal positions.

      The angle is recovered the way bootDir's free branch builds it: the boot
      direction resolved against the shin. That is the model's own definition of an
      ankle angle rather than a second one invented here, which is what keeps this
      an assertion about the boot and not about this file's arithmetic. */
let steep = 0, picks = 0;
for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys) {
    const hipZ = BREAK === 'standing' ? k.hipZ + 20 : k.hipZ;
    for (const w of contactsDown(k)) {
      if (onIceOf(k, w) !== 'pick') continue;
      picks++;
      const q = k[w];
      const kn = twoBone({ t: 0, n: 0, z: hipZ }, q, THIGH, SHIN, anterior(k.hipYaw));
      const bd = bootDir(k, w, kn, q);
      const s = [q.t - kn.t, q.n - kn.n, q.z - kn.z], sl = Math.hypot(...s) || 1;
      const ankle = Math.asin(Math.max(-1, Math.min(1,
        (bd[0] * s[0] + bd[1] * s[1] + bd[2] * s[2]) / sl))) / D2R;
      if (ankle < 0 || ankle > ANKLE_MAX) {
        steep++;
        console.log(`  ANKLE  ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  the pose leaves ${ankle.toFixed(1)}° ` +
          `between shin and boot — the boot allows 0 to ${ANKLE_MAX}°. Sink the hip or bring the pick in.`);
      }
    }
  }

/* 3. Every authored point is inside what the boot allows. Read off the KEYFRAMES,
      not the interpolated poses: an out-of-range number is an authoring mistake and
      interpolation between two legal keys can never make one. */
let outOfRange = 0, authored = 0;
for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    for (const w of ['L', 'R']) {
      /* --break=point writes an ankle angle onto a picked foot, which is the
         mistake the assertion exists to catch: a number that is carried,
         interpolated and never read. */
      const q = BREAK === 'point' && onIceOf(k, w) === 'pick' ? { ...k[w], point: 12 } : k[w];
      if (!q || q.point === undefined) continue;
      /* And nobody writes one on a picked foot. A planted boot takes its
            direction from the travel direction, so an ankle angle authored here is
            carried, interpolated and then ignored — a number in the file that
            changes nothing, which is the shape of every silent failure in this
            repository. Cheaper to forbid than to explain. */
      if (onIceOf(k, w) === 'pick') {
        outOfRange++;
        console.log(`  IGNORED ${key.padEnd(12)} ${w} t=${k.t.toFixed(2)}  point ${q.point}° on a picked foot — a planted boot takes its direction from the tracing, so this is never read`);
        continue;
      }
      authored++;
      if (q.point < 0 || q.point > ANKLE_MAX) {
        outOfRange++;
        console.log(`  BEYOND ${key.padEnd(13)} ${w} t=${k.t.toFixed(2)}  point ${q.point}° — the boot allows ${ANKLE_MAX}°, and bootDir would clamp it silently`);
      }
    }

console.log(`\n${glyphs} free-boot frames measured, ${authored} authored ankle angles, ${picks} picked feet`);
console.log(bad
  ? `${bad} stretch${bad === 1 ? '' : 'es'} of frames too steep — raise or extend the foot, not the constant`
  : 'every free boot sits at a plausible angle, in every frame');
if (steep) console.log(`${steep} picked ${steep === 1 ? 'foot whose pose asks' : 'feet whose poses ask'} the boot for an ankle it has not got`);
if (outOfRange) console.log(`${outOfRange} authored ankle angle${outOfRange === 1 ? '' : 's'} the model would not read as written`);
if (!bad && !steep && !outOfRange && picks)
  console.log(`every picked foot's ankle is inside the ${ANKLE_MAX}° the boot allows`);
process.exit(bad || steep || outOfRange ? 1 : 0);
