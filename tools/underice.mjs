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
 *   --break=sink   every free foot dropped 20 cm ......... 20 runs, deepest 14.4 cm
 *   --break=flat   every free foot set to z 0 ............ 30 runs, deepest 17.0 cm
 *   --break=blind  the on-ice exemption removed .......... 66 runs over 24,384 glyphs
 *
 * Against 9 runs over 6,490 glyphs clean, on 20/09/2026. The third is the exemption
 * asserted from the other side: an exemption that excuses a pose and holds nothing to
 * account is this repository's oldest hole, so `--break=blind` shows it is carrying
 * 17,894 glyphs and 57 further runs rather than hiding the file's whole job.
 *
 * A FOURTH MUTATION WAS TRIED AND THROWN AWAY, because it is worth knowing why. Pointing
 * every free foot to ANKLE_MAX took the count DOWN, from 9 to 6. Plantarflexion drives
 * the blade wherever the shin already points — it lifts the toe on a spiral and drives it
 * at the ice on a landing, which is the table `npm run ankle` prints — so on these poses
 * it lifts more boots out than it buries. A mutation that reduces the count has not
 * broken anything, and recording it as though it had would be the decoration this
 * repository keeps warning about.
 *
 *     npm run underice
 *     node tools/underice.mjs --break=sink|flat|blind
 *
 * OUT OF THE `check` CHAIN, BESIDE `drift`, AND THIS IS A DEBT RATHER THAN A DESIGN.
 * Two runs survive: the waltz jump's landing, where the boot is driven at the ice by
 * the shin and pointing the foot makes it worse rather than better, and the change of
 * foot, where the free foot is at z 0 at the instant it is about to become the skating
 * foot — the step-over this rig does not draw, arriving for the third time after
 * twoFoot and toePick. Neither is a pose anybody is ready to move. A report nobody
 * runs is a checker that quietly stops working, so this belongs in the chain the day
 * those two are settled, with an exemption list holding them from both sides the way
 * drawn.mjs holds its undrawable pages.
 */
import { MOVES } from '../src/lib/moves.js';
import { onIceOf } from '../src/lib/rig-math.js';
import { rigFor, findAll } from './_dom.mjs';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];

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
    bad++;
    console.log(`  UNDER ${id.padEnd(16)} ${r.view.padEnd(4)} ${r.w}  ${r.cm.toFixed(1).padStart(5)} cm below at f=${r.at.toFixed(3)}` +
                `   (${r.n} frame${r.n === 1 ? '' : 's'} from f=${r.from.toFixed(3)} to f=${r.to.toFixed(3)})`);
    runs.delete(key);
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

console.log(`\n${glyphs} boot glyphs across ${views} views that draw an ice line`);
if (worst) console.log(`deepest ${worst.cm.toFixed(1)} cm below, ${worst.id} ${worst.w} at f=${worst.f.toFixed(3)}`);
console.log(bad ? `\n${bad} run${bad === 1 ? '' : 's'} of frames with a boot drawn into the ice`
                : '\nno boot that is off the ice is drawn below it');
process.exit(bad ? 1 : 0);
