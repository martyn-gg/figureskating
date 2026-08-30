/* A spin, against the ISU's own definition of one.
 *
 * The expectation here comes from outside the thing it judges, which is the whole
 * point: ISU Technical Panel Handbook, Single Skating 2026-27, published 15/07/2026
 * and held in sources/isu/. Its definitions of the three basic positions are
 * geometry rather than prose, so the rig can be measured against them directly:
 *
 *   camel     free leg backwards with the knee higher than the hip level
 *   sit       the upper part of the skating leg at least parallel to the ice
 *   upright   any position with skating leg extended or slightly bent
 *             which is not a camel position
 *
 * and, separately: "a spin with less than three rotations is considered as a
 * skating movement and not a spin".
 *
 * WHICH MOVES ARE SPINS IS DERIVED, NOT DECLARED. A spin is a path that closes on
 * itself — one arc, no straights, at least a full turn — which is the far side of
 * the boundary tracing.mjs already asserts from the other direction: British Ice
 * Skating's twizzle disqualifier, "if the travelling stops it becomes a Solo Spin",
 * is the advance going to zero. What a move DOES declare is which basic position it
 * claims, because that is a claim about the pose and this file is what tests it.
 *
 * Per frame, not per keyframe. freefoot.mjs was per keyframe for four sessions and
 * missed 28° of error between two of them; a position claimed at the last keyframe
 * and lost between it and the one before is exactly the same failure.
 *
 * Broken on purpose before it was trusted:
 *
 *   camel's free foot 10 cm lower .................... 102 of 321 held frames
 *   sit spin's hip raised to 60 cm ................... 197 of 321 held frames
 *   upright authored as a camel ...................... 321 of 321 held frames
 *   camel's free foot forward instead of back ........ 321 of 321 held frames
 *   sweep 1080 -> 720 (two revolutions) ..............   1 move
 *   sit spin's position claim removed ................   1 move
 *
 * The fourth of those is why "backwards" is tested and not only the knee height:
 * without it the mutation passed, and a leg held forward and high is not a camel,
 * it is most of a Y-spin.
 *
 * WHAT THIS FILE DOES NOT ASSERT, and why. The path's centre of curvature is the
 * spin axis — it sits square off the blade at exactly `radius`, so placing the body
 * relative to the blade places it relative to the axis, and the distance from any
 * marker to that axis is the circle that marker sweeps every revolution. Those
 * numbers are printed below. They are not asserted, because whether the axis is
 * where the skater actually balances is a question about mass, and this rig has
 * markers and no mass. A sit spin's hip sits a third of a metre behind the axis and
 * is balanced by the free leg reaching the other way; the model cannot see that and
 * should not pretend to.
 */
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, bootDir, ankleOf, poseAt } from '../src/lib/rig-math.js';
import { lobeSense } from '../src/lib/skating.js';

const SAMPLES = 320;
const MIN_REVOLUTIONS = 3;          // ISU: fewer is a skating movement, not a spin
const MIN_IN_POSITION = 2;          // ISU: two revolutions in a position, without interruption

/** One arc, no straights, at least a full turn — a path that closes on itself. */
const isSpin = m => m.path.length === 1 && m.path[0].kind === 'arc' && m.path[0].sweep >= 360;

const kneeOf = (pose, which) => {
  const q = pose[which], hip = { t: 0, n: 0, z: pose.hipZ };
  const k0 = twoBone(hip, q, THIGH, SHIN, anterior(pose.hipYaw));
  const bd = bootDir(pose, which, k0, q, which === pose.skate);
  const an = ankleOf(q, bd, [k0.t - q.t, k0.n - q.n, k0.z - q.z]);
  return twoBone(hip, an, THIGH, SHIN, anterior(pose.hipYaw));
};

const freeOf = p => (p.skate === 'L' ? 'R' : 'L');

/* "backwards" is body-relative and not track-relative, which on a backward spin is
   the opposite sign. Getting that wrong is invisible in a still and obvious on a
   contact sheet — the same trap moves.js opens with. */
const behind = (p, w) => {
  const A = anterior(p.hipYaw);
  return -(p[w].t * A[0] + p[w].n * A[1]) > 0;
};

/* The ISU's three definitions, one function each, reading the rig and nothing else.
   The handbook does not quantify "slightly bent", so upright is tested as the two
   things it is not: not folded to a sit, and not a camel. */
const ISU = {
  camel:   p => behind(p, freeOf(p)) && kneeOf(p, freeOf(p)).z > p.hipZ,
  sit:     p => kneeOf(p, p.skate).z >= p.hipZ,
  upright: p => kneeOf(p, p.skate).z < p.hipZ && !ISU.camel(p),
};
const SAYS = {
  camel:   'free leg backwards with the knee higher than the hip level',
  sit:     'the upper part of the skating leg at least parallel to the ice',
  upright: 'skating leg extended or slightly bent, and not a camel',
};

let bad = 0, spins = 0, frames = 0;
console.log('spins, against the ISU Technical Panel Handbook 2026-27\n');

for (const [id, m] of Object.entries(MOVES)) {
  if (!isSpin(m)) continue;
  spins++;
  const seg = m.path[0], revs = seg.sweep / 360;

  if (revs < MIN_REVOLUTIONS) {
    bad++;
    console.log(`  UNDER  ${id}  ${revs} revolutions — the ISU counts fewer than ${MIN_REVOLUTIONS} as a skating movement`);
  }

  const claim = m.position;
  if (!claim) {
    bad++;
    console.log(`  UNSAID ${id}  is a spin and names no basic position`);
  } else if (!ISU[claim]) {
    bad++;
    console.log(`  UNKNOWN ${id}  claims "${claim}", which is not one of the three basic positions`);
  } else {
    /* HOW LONG THE POSITION MUST HOLD COMES FROM THE HANDBOOK TOO, and taking it
       from the keyframes instead was this file's first bug. "The minimum number of
       revolutions required in a position is two (2) without interruption" — so on a
       three-revolution spin the claim is about the last two thirds of the clock,
       not about the last keyframe. Reading it off the last keyframe made `from` 1.0
       on every move here and sampled a single instant 321 times, which is a checker
       that cannot see a position being lost. */
    const from = 1 - MIN_IN_POSITION / revs;
    let over = 0, first = null;
    for (let i = 0; i <= SAMPLES; i++) {
      const t = from + (1 - from) * (i / SAMPLES);
      const pose = poseAt(m, t);
      frames++;
      if (!ISU[claim](pose)) { over++; if (first === null) first = t; }
    }
    if (over) {
      bad++;
      console.log(`  NOT A ${claim.toUpperCase()}  ${id}  ${over} of ${SAMPLES + 1} held frames fail from f=${first.toFixed(3)}`);
      console.log(`         ISU: ${SAYS[claim]}`);
    }
  }

  /* Reported, not asserted — see the header. */
  const held = m.keys[m.keys.length - 1], blade = held[held.skate];
  const ls = lobeSense(seg.foot, seg.edge, seg.dir);
  const cn = blade.n - ls * m.radius, ct = blade.t;
  const orbit = p => Math.hypot(p.t - ct, p.n - cn);
  const free = freeOf(held);
  console.log(`  ${(m.position ?? '?').padEnd(8)} ${id.padEnd(12)} ${revs} revolutions, radius ${m.radius} cm` +
    `  ·  each revolution the hip sweeps ${orbit({t:0,n:0}).toFixed(0)} cm, ` +
    `the shoulders ${orbit(held.sh).toFixed(0)}, the free foot ${orbit(held[free]).toFixed(0)}`);
}

console.log(`\n${spins} spins, ${frames} held frames measured`);
console.log(bad
  ? `\n${bad} claim${bad === 1 ? '' : 's'} the ISU's definition does not support`
  : "every spin turns at least three times and holds the basic position it claims");
process.exit(bad ? 1 : 0);
