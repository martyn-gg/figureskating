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
 * skating movement and not a spin"; "the minimum number of revolutions required
 * in a position is two (2) without interruption"; "the change of foot in any
 * spin must be preceded and followed by a spin position with at least three (3)
 * revolutions"; and for a combination, "a minimum of two different basic
 * positions with 2 revolutions in each of these positions anywhere within the
 * spin".
 *
 * REWRITTEN 19/09/2026, when the spins got entrances, exits and a change of foot.
 *
 * WHICH MOVES ARE SPINS IS DERIVED, NOT DECLARED. A spin is a path that closes on
 * itself: every segment an arc, every arc curving the same way, and at least a
 * full turn in total. That is the far side of the boundary tracing.mjs already
 * asserts from the other direction - British Ice Skating's twizzle disqualifier,
 * "if the travelling stops it becomes a Solo Spin", is the advance going to zero.
 *
 * The old test was `path.length === 1`, which was true of every spin in the file
 * on the day it was written and would have gone on being true right up until it
 * silently stopped checking the first spin with an entrance. That is the shape of
 * fault this repository has shipped four times - a description of something that
 * changed - so the definition now names the property rather than the count. It
 * was verified against the file before being loosened: the looser test catches
 * exactly the same moves the strict one did, and nothing else.
 *
 * WHAT A SEGMENT SAYS. `position` names a basic position the skater is holding
 * through it, and segments that claim none are the entrance, the changes between
 * positions, the step-over and the exit. `windup: true` marks the final wind-up,
 * which the handbook exempts by name from counting as another position.
 *
 * CENTRED, EXACTLY. The blade's lateral offset from the hip equals the path
 * radius; then the hip sits at the centre of curvature and stops travelling.
 * Asserted on every segment that claims a position or a wind-up, and asserted
 * NOT to hold on the first segment of the entrance - because an exemption can
 * only excuse a pose, and a spin whose entrance was already centred would have
 * no entrance. Only the lateral half is judged: a sit spin's fold carries the
 * hip a third of a metre behind the blade, balanced by the free leg reaching
 * forward, and whether that balances is a question about mass. This rig has
 * markers and no mass. That distance is printed, not asserted.
 *
 * Per frame, not per keyframe. freefoot.mjs was per keyframe for four sessions
 * and missed 28 degrees of error between two of them.
 *
 * Broken on purpose before it was trusted. Counts are moves reported:
 *
 *   --break=flat      every segment's radius set to the move's ............ 5
 *   --break=nocentre  the centred blade offset moved 4 cm off the radius ... 5
 *   --break=short     the change of foot's second side cut to 2 revs ....... 1
 *   --break=onepos    the combination's sit and upright relabelled camel .... 7
 *   --break=windup    the final wind-up relabelled as a position ........... 4
 *   --break=foot      the pose's skate held on the left through the change .. 1
 *   --break=entered   the entrance's first segment centred .................. 5
 *
 * The camel/sit/upright position mutations from the first version of this file
 * still apply and still report; they are listed in git history rather than here,
 * because the numbers moved when the spins gained entrances and a stale count in
 * a header is worse than no count.
 */
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, bootDir, ankleOf, poseAt } from '../src/lib/rig-math.js';
import { lobeSense } from '../src/lib/skating.js';

const BREAK = (process.argv.find(a => a.startsWith('--break')) || '').split('=')[1] || null;

/* Segments are sampled HALF-OPEN, [from, to). The boundary frame belongs to the
   segment starting there, and sampling it at both ends reported the change of
   foot as one frame of disagreement between the pose and the path when the two
   in fact change together. A checker artefact reported as a fault is worse than
   no checker, because it teaches you to discount it. */
const SAMPLES_PER_SEG = 120;
const sampleAt = (s, i) => s.from + (s.to - s.from) * (i / SAMPLES_PER_SEG);
const MIN_REVOLUTIONS = 3;       // ISU: fewer is a skating movement, not a spin
const MIN_IN_POSITION = 2;       // ISU: two revolutions in a position, without interruption
const MIN_EITHER_SIDE = 3;       // ISU: three each side of a change of foot
const CENTRED_CM = 1.0;          // how near the radius the lateral offset must sit
const TRAVELLING_CM = 8;         // how far off it must be before the spin has started

/* THE MUTATIONS, applied to a copy of the path before anything reads it. Each
   one is a fault this file is supposed to catch, so each one must make it fail;
   a checker that has never failed is a decoration. */
function mutated(m) {
  if (!BREAK || ['flat', 'nocentre', 'foot', 'entered'].includes(BREAK)) return m;
  const path = m.path.map(s => ({ ...s }));
  if (BREAK === 'windup') path.forEach(s => { if (s.windup) s.position = 'upright'; });
  if (BREAK === 'short') {
    /* cut everything after a change of foot down to two revolutions */
    const feet = path.map(s => s.foot);
    const at = feet.findIndex((f, i) => i && f !== feet[i - 1]);
    if (at > 0) path.slice(at).forEach(s => { if (s.position) s.sweep = 720 / path.slice(at).filter(g => g.position).length; });
  }
  if (BREAK === 'onepos') path.forEach(s => { if (s.position) s.position = 'camel'; });
  return { ...m, path };
}

/* Every segment an arc, all curving the same way, at least a full turn. */
const isSpin = m => m.path.every(s => s.kind === 'arc')
  && new Set(m.path.map(s => lobeSense(s.foot, s.edge, s.dir))).size === 1
  && m.path.reduce((a, s) => a + s.sweep, 0) >= 360;

const kneeOf = (pose, which) => {
  const q = pose[which], hip = { t: 0, n: 0, z: pose.hipZ };
  const k0 = twoBone(hip, q, THIGH, SHIN, anterior(pose.hipYaw));
  const bd = bootDir(pose, which, k0, q);
  const an = ankleOf(pose, which, bd, [k0.t - q.t, k0.n - q.n, k0.z - q.z]);
  return twoBone(hip, an, THIGH, SHIN, anterior(pose.hipYaw));
};

const freeOf = p => (p.skate === 'L' ? 'R' : 'L');

/* "backwards" is body-relative and not track-relative, which on a backward spin is
   the opposite sign. Getting that wrong is invisible in a still and obvious on a
   contact sheet - the same trap moves.js opens with. */
const behind = (p, w) => {
  const A = anterior(p.hipYaw);
  return -(p[w].t * A[0] + p[w].n * A[1]) > 0;
};

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

/* The segments a move's clock is divided into, each with the fraction of the
   clock it occupies. Spans are relative and buildPath normalises them, so this
   normalises them the same way rather than assuming they are already fractions.
   Reading it from the move is the point: a checker that recomputed the layout
   from sweeps would be a second opinion about where the segments are. */
function layout(m) {
  const spans = m.path.map(s => s.span ?? 1 / m.path.length);
  const sum = spans.reduce((a, b) => a + b, 0);
  let c = 0;
  return m.path.map((seg, i) => {
    const from = c / sum; c += spans[i];
    return { seg, i, from, to: c / sum, revs: seg.sweep / 360,
             radius: BREAK === 'flat' ? m.radius : (seg.radius ?? m.radius) };
  });
}

/* Contiguous runs of the same claimed position, so a position held across two
   segments counts once and counts its whole length. */
function runs(segs) {
  const out = [];
  for (const s of segs) {
    const pos = s.seg.position ?? null;
    const last = out[out.length - 1];
    if (last && last.pos === pos) { last.revs += s.revs; last.segs.push(s); }
    else out.push({ pos, revs: s.revs, segs: [s] });
  }
  return out;
}

let bad = 0, spins = 0, frames = 0;
console.log(`spins, against the ISU Technical Panel Handbook 2026-27${BREAK ? `  [--break=${BREAK}]` : ''}\n`);

for (const [id, m] of Object.entries(MOVES)) {
  if (!isSpin(m)) continue;
  spins++;
  const segs = layout(mutated(m));
  const totalRevs = segs.reduce((a, s) => a + s.revs, 0);
  const fail = msg => { bad++; console.log(`  ${msg}`); };

  if (totalRevs < MIN_REVOLUTIONS)
    fail(`UNDER    ${id}  ${totalRevs.toFixed(2)} revolutions - the ISU counts fewer than ${MIN_REVOLUTIONS} as a skating movement`);

  /* ── the positions it claims ─────────────────────────────────────────── */
  const claimed = runs(segs).filter(r => r.pos);
  if (!claimed.length) fail(`UNSAID   ${id}  is a spin and names no basic position`);
  for (const r of claimed) {
    if (!ISU[r.pos]) { fail(`UNKNOWN  ${id}  claims "${r.pos}", which is not one of the three basic positions`); continue; }
    if (r.revs + 1e-9 < MIN_IN_POSITION)
      fail(`BRIEF    ${id}  holds ${r.pos} for ${r.revs.toFixed(2)} revolutions - the ISU asks ${MIN_IN_POSITION}`);
    let over = 0, first = null;
    for (const s of r.segs) for (let i = 0; i < SAMPLES_PER_SEG; i++) {
      const t = sampleAt(s, i);
      const pose = poseAt(m, t); frames++;
      if (!ISU[r.pos](pose)) { over++; if (first === null) first = t; }
    }
    if (over) {
      fail(`NOT A ${r.pos.toUpperCase()}  ${id}  ${over} held frames fail from f=${first.toFixed(3)}`);
      console.log(`           ISU: ${SAYS[r.pos]}`);
    }
  }

  /* ── a combination: two different basic positions, two revolutions each ── */
  const distinct = [...new Set(claimed.filter(r => r.revs + 1e-9 >= MIN_IN_POSITION).map(r => r.pos))];
  const isCombination = /combination/i.test(id);
  if (isCombination && distinct.length < 2)
    fail(`NOT A COMBINATION  ${id}  holds ${distinct.length} basic position(s) for ${MIN_IN_POSITION} revolutions; the ISU asks 2 different ones`);

  /* ── a change of foot: three revolutions either side of it ──────────────── */
  const feet = segs.map(s => s.seg.foot);
  const changes = feet.reduce((a, f, i) => (i && f !== feet[i - 1] ? [...a, i] : a), []);
  for (const at of changes) {
    const before = segs.slice(0, at).filter(s => s.seg.position).reduce((a, s) => a + s.revs, 0);
    const after  = segs.slice(at).filter(s => s.seg.position).reduce((a, s) => a + s.revs, 0);
    if (before + 1e-9 < MIN_EITHER_SIDE || after + 1e-9 < MIN_EITHER_SIDE)
      fail(`CHANGE   ${id}  ${before.toFixed(2)} revolutions before the change of foot and ${after.toFixed(2)} after - the ISU asks ${MIN_EITHER_SIDE} either side`);
  }

  /* ── the blade the pose rides is the blade the tracing is drawn from ────── */
  let mismatched = 0;
  for (const s of segs) for (let i = 0; i < SAMPLES_PER_SEG; i++) {
    const t = sampleAt(s, i);
    const pose = poseAt(m, t);
    const skate = BREAK === 'foot' ? 'L' : pose.skate;
    if (skate !== s.seg.foot) mismatched++;
  }
  if (mismatched)
    fail(`FOOT     ${id}  ${mismatched} frames where the pose's skating foot is not the foot the path segment is drawn from`);

  /* ── centred, and not centred before it starts ──────────────────────────── */
  const offOf = (s, t) => {
    const pose = poseAt(m, t);
    const n = pose[pose.skate].n + (BREAK === 'nocentre' ? 4 : 0);
    return Math.abs(n - s.radius);
  };
  let loose = 0, worst = 0;
  for (const s of segs.filter(s => s.seg.position || s.seg.windup))
    for (let i = 0; i < SAMPLES_PER_SEG; i++) {
      const off = offOf(s, sampleAt(s, i));
      if (off > CENTRED_CM) { loose++; worst = Math.max(worst, off); }
    }
  if (loose)
    fail(`ADRIFT   ${id}  ${loose} frames of a held position where the blade's lateral offset is up to ${worst.toFixed(1)} cm off the path radius - the hip is not on the axis`);

  const first = segs[0];
  const entryOff = BREAK === 'entered'
    ? 0
    : Math.max(offOf(first, first.from), offOf(first, sampleAt(first, SAMPLES_PER_SEG - 1)));
  if (entryOff < TRAVELLING_CM)
    fail(`NO ENTRY ${id}  the first segment is already centred to ${entryOff.toFixed(1)} cm - a spin that begins centred has no entrance`);

  /* ── reported, not asserted: what each marker's circle costs ───────────── */
  const held = segs.filter(s => s.seg.position).pop() ?? segs[segs.length - 1];
  const pose = poseAt(m, (held.from + held.to) / 2);
  const blade = pose[pose.skate];
  const ls = lobeSense(held.seg.foot, held.seg.edge, held.seg.dir);
  const cn = blade.n - ls * held.radius, ct = blade.t;
  const orbit = p => Math.hypot(p.t - ct, p.n - cn);
  const free = freeOf(pose);
  const rates = segs.map(s => s.seg.rate).filter(Boolean);
  console.log(`  ${id.padEnd(16)} ${totalRevs.toFixed(2)} revolutions, ${claimed.map(r => `${r.pos} x${r.revs.toFixed(2)}`).join(' + ') || 'no position'}`);
  console.log(`  ${''.padEnd(16)} ${rates.length ? `${Math.min(...rates)}-${Math.max(...rates)} rev/s` : 'one rate'}` +
    `  ·  in the held position the hip sweeps ${orbit({ t: 0, n: 0 }).toFixed(0)} cm each revolution, ` +
    `the shoulders ${orbit(pose.sh).toFixed(0)}, the free foot ${orbit(pose[free]).toFixed(0)}`);
}

console.log(`\n${spins} spins, ${frames} held frames measured`);
console.log(bad
  ? `\n${bad} claim${bad === 1 ? '' : 's'} the ISU's definition does not support`
  : 'every spin turns at least three times, holds the positions it claims,\nstarts off its axis and is centred on it by the time it claims one');
process.exit(bad ? 1 : 0);
