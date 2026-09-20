/* A BOOT THAT IS NOT ON THE ICE IS NOT DRAWN BELOW IT.
 *
 * The expectation comes from outside the model and outside the sport: a foot in the
 * air is above the ground. Nothing in the rig knows that, and until today nothing
 * checked it — which is how the guide has twice shipped a boot buried in the ice.
 * Session 15 drew half a boot underneath it in the rear view of the picked pose, with
 * all seventeen checkers green, and it was caught by looking. The drag, on 20/09/2026,
 * was blocked partly by the same thing: as a free foot its boot finishes 7 to 11 cm
 * below the surface at every reach, and no checker could say so.
 *
 * WHY freefoot.mjs DOES NOT ALREADY COVER IT. That file limits the boot's ANGLE, at
 * 60 degrees from level, and the angle is only half of where a boot ends up. A boot is
 * about 30 cm long, so one pointed at the limit reaches some 14 cm below the marker it
 * hangs from — fine at knee height and buried at ten centimetres. The fault is the
 * angle and the HEIGHT together, and neither number alone can see it.
 *
 * MEASURED OFF THE REAL RENDER TREE, not off the pose. `_dom.mjs` runs viewProfile for
 * real, so this reads the glyph that ships: every point of every shape under a
 * `[data-boot]`, through the transforms the renderer actually wrote. That matters
 * because the class of fault this exists for is a DRAWING fault — Session 15's was a
 * plan glyph that failed to pivot about its contact, which no amount of correct pose
 * data would have saved. A checker recomputing bootDir would have passed it.
 *
 * WHERE THE ICE IS COMES FROM THE MARKUP. `data-ice` was added to the ground line for
 * this, rather than keeping a second copy of `GROUND` here. Same argument that put
 * `data-boot` on the boots. The views it judges are therefore the ones that DRAW an
 * ice line, found rather than named: the top view is a plan and has none.
 *
 * WHAT IT DOES NOT COVER, AND THE REASON IS HONEST. A boot that IS on the ice reaches
 * a few centimetres below the line as drawn, because the glyph is a boot around a
 * blade and the blade's contact is what sits on the surface. How deep that should be
 * is a drawing choice and not a physical claim, so there is no threshold here to set
 * that would not be invented. Session 15's own fault lives in that gap: the contact
 * was on the ice and the footprint was centred on it. Holding a contacting glyph to
 * something needs a different expectation — the deepest point of a boot resting flat,
 * derived from the glyph rather than from the poses — and it is not in this file.
 * What IS here is exact and needs no tolerance, which is why it is what got written.
 *
 * Broken on purpose:
 *
 *   --break=sink    every free foot dropped 20 cm ........ 18, deepest 12.5 cm
 *   --break=flat    every free foot set to z 0 ........... 30, deepest 17.0 cm
 *   --break=blind   the on-ice exemption removed ......... 67 over 26,952 glyphs
 *   --break=deeper  both arrivals declared at nought ..... 2
 *   --break=stale   a move declared that does not dip .... 1
 *
 * Against 0 problems and 2 declared arrivals over 6,490 glyphs clean, on 20/09/2026.
 * RE-MEASURED after the waltz jump's free feet were set to NEUTRAL that afternoon:
 * sink was 20 and blind 66 when nine runs were outstanding.
 *
 * `--break=blind` is the on-ice exemption asserted from the other side: an exemption
 * that excuses a pose and holds nothing to account is this repository's oldest hole,
 * so it shows that exemption carrying 20,462 glyphs and 67 runs rather than hiding
 * the file's whole job. `--break=deeper` and `--break=stale` do the same for the
 * arrivals below, one in each direction.
 *
 * A FOURTH MUTATION WAS TRIED AND THROWN AWAY, because it is worth knowing why. Pointing
 * every free foot to ANKLE_MAX took the count DOWN, from 9 to 6. Plantarflexion drives
 * the blade wherever the shin already points — it lifts the toe on a spiral and drives it
 * at the ice on a landing, which is the table `npm run ankle` prints — so on these poses
 * it lifts more boots out than it buries. A mutation that reduces the count has not
 * broken anything, and recording it as though it had would be the decoration this
 * repository keeps warning about.
 *
 *     npm run check:underice
 *     node tools/underice.mjs --break=sink|flat|blind
 *
 * IN THE `check` CHAIN SINCE 20/09/2026, and the debt it was parked beside `drift`
 * for is paid. It reported nine runs on the day it was written. Five were the waltz
 * jump, and they were not a pose nobody was ready to move — they were a pose nobody
 * had asked a coach about. Martyn: landing a waltz jump the free foot is not pointed,
 * it is pushed back and NEUTRAL, which is what leaves the skater able to step forward
 * onto it or spike the toe in for the next element; and through the move it is neutral
 * too, where it provides the momentum. `ANKLE_POINT`'s 10° was never neutral, and
 * rig-math.js says against it in as many words: *Verified against a coach: NO.*
 * `NEUTRAL` on this move's free feet closed four of the five outright, including 2.0 cm
 * over 25 frames on the landing, and moved no foot a millimetre.
 *
 * The two that remain turned out to be ONE fault with two instances, which is what made
 * an exemption list worth writing rather than arguing over twice. Both are a free foot
 * in the last frames before it takes the weight — the step-over this rig does not draw,
 * after twoFoot and toePick. `handover` below declares them, from both sides, the way
 * drawn.mjs holds its undrawable pages.
 */
import { MOVES } from '../src/lib/moves.js';
import { onIceOf } from '../src/lib/rig-math.js';
import { rigFor, findAll } from './_dom.mjs';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];

/* THE ONE CASE A FREE BOOT MAY TOUCH THE ICE, DECLARED RATHER THAN SKIPPED.
 *
 * A free foot in the last frames before it takes the weight is arriving ON the ice,
 * so the thing this file measures — a boot that is not on the ice drawn below it —
 * is not quite what is happening. The pose is mid-handover, and the handover itself
 * is the step-over this rig does not draw, after twoFoot and toePick.
 *
 * TWO INSTANCES, ONE FAULT, and that is what made this list worth writing rather
 * than arguing over twice. Both are now in the change of foot, one at each end of its
 * transfer: the right foot arrives for one frame at f=0.502, taking the weight at the
 * key t=0.50366 — *Change of foot - stepping over onto the right* — and the left foot
 * leaves for two frames at f=0.361 to 0.364, having had it at t=0.36. The waltz jump's
 * arrival was the third and is gone: an arriving foot is neutral rather than pointed,
 * which a coach settled on 20/09/2026, and the frame cleared the ice on its own. Same
 * shape, same reason, opposite directions.
 *
 * ASSERTED FROM BOTH SIDES, because an exemption that only excuses is this
 * repository's oldest hole and this file's own header says so:
 *
 *   - a declared run that goes DEEPER than its recorded depth fails, so the pose
 *     cannot quietly get worse under cover of being named;
 *   - a declared run that DISAPPEARS fails, so when the step-over is modelled the
 *     entry has to be deleted rather than left lying;
 *   - a run outside the declared window, or on the other foot, is not excused at
 *     all.
 *
 * THE DEPTHS ARE MEASURED, NOT CHOSEN. There is no principled tolerance available
 * here — the header already explains why a contacting glyph's depth is a drawing
 * choice rather than a physical claim, and inventing a number would be the clamp
 * this repository keeps warning about. So each entry records what it actually is,
 * to a tenth of a centimetre, with a tenth of room for interpolation jitter. That
 * makes the entry falsifiable in both directions, which a round tolerance would not.
 *
 * THE WINDOWS ARE A CLAIM TOO — spin.mjs's lesson. Each runs from the key where the
 * foot is last unambiguously in the air to the key where it takes the weight, so a
 * boot dipping EARLIER than the handover is not covered by any of this. */
/* DEPARTURES TOO, SINCE 20/09/2026, and the entry below is the first one. Until that
 * day a departing foot never reached this file at all: onIceOf answered "on the ice"
 * for anything the pose named `skate`, and the pose carries `skate` from the left key,
 * so a blade that had left the ice went on being claimed down for the whole span. Now
 * that `skate` names only the blade the tracing is built from, the frames just after a
 * foot leaves are free frames like any other, and the first of them sits on the ice
 * line for the same reason the last frames before an arrival do — the interpolation out
 * of a key whose foot is at z 0. One fault, two directions, one list. */
const handover = {
  changeFootSpin: [
    { foot: 'R', from: 0.49, to: 0.51, cm: 0,
      why: 'the one frame where the arriving right foot is at z 0 and has not '
         + 'yet taken the weight — the boot glyph sitting on the ice at contact' },
    { foot: 'L', from: 0.35, to: 0.37, cm: 0,
      why: 'the two frames after the departing left foot leaves the ice at t=0.36, '
         + 'the boot glyph still on the line it has just come off' },
  ],
};
const JITTER = 0.1;                                  // cm, one tenth, for interpolation
const declared = new Set();

/* ─── the smallest transform algebra that reads this renderer's own strings ───
   Only the four functions body-frame.js emits. An unhandled one throws rather
   than being skipped, because silently ignoring a transform would move a glyph
   and report it clean — the failure this checker exists to catch, committed by
   the checker itself. */
const mul = (m, n) => [
  m[0]*n[0] + m[2]*n[1], m[1]*n[0] + m[3]*n[1],
  m[0]*n[2] + m[2]*n[3], m[1]*n[2] + m[3]*n[3],
  m[0]*n[4] + m[2]*n[5] + m[4], m[1]*n[4] + m[3]*n[5] + m[5],
];
function parse(t) {
  let m = [1, 0, 0, 1, 0, 0];
  if (!t) return m;
  for (const [, fn, args] of t.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const a = args.trim().split(/[\s,]+/).map(Number);
    if (fn === 'translate')   m = mul(m, [1, 0, 0, 1, a[0] || 0, a[1] || 0]);
    else if (fn === 'scale')  m = mul(m, [a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0]);
    else if (fn === 'matrix') m = mul(m, a);
    else if (fn === 'rotate') {
      const r = (a[0] || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      m = mul(m, [c, s, -s, c, 0, 0]);
    } else throw new Error(`underice.mjs cannot read transform "${fn}" — teach it, do not skip it`);
  }
  return m;
}

/* Every point a shape puts on the page, in its own local frame. A quadratic never
   leaves the hull of its control points, so taking the control points is an upper
   bound on the curve and cannot miss a dip. Stroke width is deliberately NOT added:
   the claim is about the boot, not about the ink around it. */
function* pts(n) {
  const A = n.attrs, v = k => Number(A[k] || 0);
  if (n.tagName === 'line') { yield [v('x1'), v('y1')]; yield [v('x2'), v('y2')]; }
  else if (n.tagName === 'circle')
    for (const [dx, dy] of [[0, v('r')], [0, -v('r')], [v('r'), 0], [-v('r'), 0]])
      yield [v('cx') + dx, v('cy') + dy];
  else if (n.tagName === 'rect') {
    const x = v('x'), y = v('y'), w = v('width'), h = v('height');
    yield [x, y]; yield [x + w, y]; yield [x, y + h]; yield [x + w, y + h];
  } else if (n.tagName === 'path' && A.d) {
    const ns = (A.d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
    for (let i = 0; i + 1 < ns.length; i += 2) yield [ns[i], ns[i + 1]];
  }
}
function lowest(n, m) {
  const here = mul(m, parse(n.attrs.transform));
  let lo = -Infinity;
  for (const [x, y] of pts(n)) lo = Math.max(lo, here[1]*x + here[3]*y + here[5]);
  for (const c of n.children) lo = Math.max(lo, lowest(c, here));
  return lo;
}

/* ─── the mutations ─────────────────────────────────────────────────────────── */
/* The staleness side, broken drawn.mjs's way: declare a move that does not dip.
   Lifting the declared feet was tried first and does NOT clear them — the dip comes
   from interpolating INTO the on-ice key, so the last free frame is adjacent to a
   foot at z 0 whatever height the key before it is authored at. That is the fault
   these entries describe, restated: the handover is the thing the rig cannot draw,
   and no free-foot height escapes it. So the mutation tests the ASSERTION, which is
   what it is for, rather than moving a pose to see what happens. */
/* The DEEPER side, and getting here took two failed attempts that are worth keeping,
   because between them they say what these numbers actually are.

   --break=sink does not reach the branch: dropping every free foot 20 cm pushes the
   declared runs OUT of their windows, so they arrive as ordinary failures and the
   comparison is never entered.

   Dropping the declared moves' free feet by ONE centimetre keeps them in the window
   and does not move the depths at all — 0.3 and 1.2, unchanged — while opening a new
   ordinary run on the waltz landing. Pointing those same feet to ANKLE_MAX moves the
   waltz's declared frame from 0.3 to 0.4, inside the tenth of jitter, and leaves the
   change of foot at 1.2 while burying four other stretches of the waltz.

   SO THE DECLARED DEPTH IS NOT AN AUTHORING CHOICE. It is a property of the handover:
   the last free frame is adjacent to a key whose foot is at z 0, and the interpolation
   into that key sets the number whatever the free foot is doing. That is the same
   sentence these entries already carry — the step-over is the thing the rig cannot
   draw — arriving from the other direction, and it means no pose mutation can deepen
   them by much. A checker cannot be shown to work by a mutation that does not move it.

   So the branch is broken drawn.mjs's way, like --break=stale below: the DECLARATION
   is made wrong rather than the pose. Every entry is made to claim a depth no run can
   be shallower than, and every run must then report itself deeper. MINUS ONE and not
   nought since 20/09/2026: the departure entry's measured depth IS nought, so zeroing
   the declarations stopped breaking it the day it was added — a mutation that has
   quietly become a no-op on one of its cases is a mutation that is no longer testing
   it. */
if (BREAK === 'deeper')
  for (const exs of Object.values(handover)) for (const ex of exs) ex.cm = -1;

if (BREAK === 'stale')
  handover.spiral = [{ foot: 'R', from: 0, to: 1, cm: 5,
                       why: 'a deliberately stale declaration' }];

if (BREAK === 'sink' || BREAK === 'flat')
  for (const m of Object.values(MOVES))
    for (const k of m.keys)
      for (const w of ['L', 'R']) {
        if (!k[w] || onIceOf(k, w) || k.skate === w) continue;
        k[w] = { ...k[w], z: BREAK === 'sink' ? Math.max(0, k[w].z - 20) : 0 };
      }

console.log('free boots against the ice line, every frame of every view that draws one' +
            (BREAK ? `   [--break=${BREAK}]` : '') + '\n');

let bad = 0, glyphs = 0, views = 0, worst = null;
for (const id of Object.keys(MOVES)) {
  const { rig, byView } = rigFor(id);
  /* Report a run of bad frames once, at its worst — freefoot.mjs's shape, and for
     its reason: a checker nobody can read the output of is not a checker. */
  const runs = new Map();
  const flush = key => {
    const r = runs.get(key);
    if (!r) return;
    runs.delete(key);
    const where = `${r.cm.toFixed(1).padStart(5)} cm below at f=${r.at.toFixed(3)}` +
                  `   (${r.n} frame${r.n === 1 ? '' : 's'} from f=${r.from.toFixed(3)} to f=${r.to.toFixed(3)})`;
    /* The window and the foot decide whether this is a declared case at all. A run
       outside either is an ordinary failure, which is the point of naming them. */
    const ex = (handover[id] || []).find(e => r.w === e.foot && r.from >= e.from && r.to <= e.to);
    if (ex) {
      declared.add(ex);
      if (r.cm > ex.cm + JITTER) {
        bad++;
        console.log(`  DEEPER ${id.padEnd(16)} ${r.view.padEnd(4)} ${r.w}  ${where}`);
        console.log(`         declared at ${ex.cm.toFixed(1)} cm — the pose got worse under cover of being named`);
      } else {
        console.log(`  handover ${id.padEnd(15)} ${r.view.padEnd(4)} ${r.w}  ${where}`);
      }
      return;
    }
    bad++;
    console.log(`  UNDER ${id.padEnd(16)} ${r.view.padEnd(4)} ${r.w}  ${where}`);
  };

  for (let i = 0; i < rig.frames; i++) {
    rig.seek(i);
    const f = i / (rig.frames - 1);
    for (const [view, svg] of Object.entries(byView)) {
      const ice = findAll(svg, n => n.attrs['data-ice'] !== undefined)[0];
      if (!ice) continue;                         // a plan view has no ice line to be under
      if (i === 0) views++;
      const iceY = Number(ice.attrs.y1);
      /* THE SCALE IS READ BACK OUT OF THE VIEW rather than recomputed. The boot
         holder carries `scale(S)` and S is the view's own pixels per centimetre, so
         one glyph tells this file what a centimetre is and the answer is in the units
         a person can act on. */
      for (const b of findAll(svg, n => n.attrs['data-boot'] !== undefined)) {
        const role = b.attrs['data-boot'], w = b.attrs['data-foot'];
        if (role !== 'free' && BREAK !== 'blind') continue;
        glyphs++;
        const s = parse(b.attrs.transform)[3] || 1;         // px per cm in this view
        const cm = (lowest(b, [1, 0, 0, 1, 0, 0]) - iceY) / s;
        const key = view + w;
        if (cm > 0) {
          const r = runs.get(key) || { view, w, cm, at: f, from: f, to: f, n: 0 };
          if (cm > r.cm) { r.cm = cm; r.at = f; }
          r.to = f; r.n++;
          runs.set(key, r);
          if (!worst || cm > worst.cm) worst = { id, view, w, cm, f };
        } else flush(key);
      }
    }
  }
  for (const key of [...runs.keys()]) flush(key);
}

/* The other side of the exemption. drawn.mjs's rule, word for word: an entry that
   no longer describes anything is the list lying about the model. */
for (const [id, exs] of Object.entries(handover))
  for (const ex of exs)
    if (!declared.has(ex)) {
      bad++;
      console.log(`  STALE  ${id.padEnd(16)} ${ex.foot} clears the ice now, and handover still declares it`);
      console.log(`         ("${ex.why}") — delete the entry`);
    }

console.log(`\n${glyphs} boot glyphs across ${views} views that draw an ice line`);
if (worst) console.log(`deepest ${worst.cm.toFixed(1)} cm below, ${worst.id} ${worst.w} at f=${worst.f.toFixed(3)}`);
console.log(bad ? `\n${bad} problem${bad === 1 ? '' : 's'}`
                : `\nno boot that is off the ice is drawn below it, except the ` +
                  `${Object.values(handover).flat().length} declared handovers, which are where and how deep they say`);
process.exit(bad ? 1 : 0);
