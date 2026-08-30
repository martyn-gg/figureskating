/* Nothing drawn may jump. The thirteenth checker, 30/08/2026.

   WHY IT EXISTS. Martyn, watching the waltz jump: "the top-down view sees the free
   boot rotate a couple of times towards the end of the animation without visible
   reason." That was true, it was a real fault, and NOTHING IN THE REPOSITORY COULD
   HAVE FOUND IT. Every checker here asserts a property of one frame — is the blade
   on the ice, is the shin inside the boot, does the lobe curve the right way — and
   a glyph that is correct in every frame and wrong between them passes all of them.

   The rig interpolates smoothly. `poseAt` smoothsteps between keyframes, so every
   quantity the renderer draws is a continuous function of the clock, and anything
   that jumps between adjacent frames is one of three things:

     - a degenerate projection: a direction taken from a 3D vector that is pointing
       at the camera, so its projected heading is noise. This is the repository's
       most-repeated bug — the end-on boot roll collapse, the side-on 2x2 going
       singular, and now the top-down heading.
     - a branch change: the renderer switching between the side-on and end-on boot
       glyph, or a foot landing and its direction changing rule. Legitimate, and
       reported rather than failed, because it is a design question how visible a
       switch should be.
     - a pose fault: the authored keyframes asking for a motion nothing physical
       could make.

   The first and third are bugs. This file finds all three and says which.

   WHAT IT ASSERTS, on every frame of every move in all three views:

   1  A DRAWN GLYPH'S ORIENTATION MOVES SMOOTHLY, within a view and within a branch.
   2  A DRAWN GLYPH'S POSITION MOVES SMOOTHLY.
   3  THE BOOT'S OWN 3D DIRECTION MOVES SMOOTHLY, except across a landing or a
      takeoff, where bootDir changes rule by construction — along the tracing for a
      PLANTED foot, off the shin for a free one — and a step in the drawn direction
      is expected. That one is bounded separately and more loosely. The rule changes
      at a pick going in and coming out for exactly the same reason it changes at a
      landing, so the test is "is this foot on the ice", not "is it on a blade": ask
      the narrow question and a pick reads as a landing that never happened, and the
      real change of rule beside it goes unbounded.

   WHAT IT REPORTS RATHER THAN FAILING:

   - branch flips per move and view, because a boot that genuinely turns end-on has
     to switch glyph somewhere and the question is how often, not whether.
   - a NEAR-TIE is now between two of THREE glyphs. Since 30/08/2026 the choice is
     made by which of the boot's three orthonormal axes points most at the camera,
     so a tie means the boot is at an oblique angle where no single flat glyph is
     wholly honest. That is a property of drawing a solid with three orthogonal
     views, not a fault, and it is why this reports rather than fails.
   - frames spent in a DEGENERATE ZONE: the top-down heading taken from a boot
     direction with almost no horizontal part, and the profile branch chosen on a
     near-tie between what is in the view plane and what points at the camera. Those
     are the frames where the picture is least trustworthy, and until 30/08/2026
     nobody knew how many there were.

   The bounds are set from the data with room, not tuned to pass. Before the waltz
   jump's free leg was fixed the top-down heading moved 155 degrees between two
   adjacent frames; the loosest bound here is 30.

       node tools/continuity.mjs
       node tools/continuity.mjs --verbose
*/
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, bootDir, ankleOf, buildPath, poseAt, onIceOf } from '../src/lib/rig-math.js';

const unit = v => { const l = Math.hypot(...v) || 1; return v.map(c => c / l); };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
import { rigFor, findAll } from './_dom.mjs';

const VERBOSE = process.argv.includes('--verbose');

/* Degrees of orientation change allowed between adjacent frames. The body turns
   half a revolution in about a tenth of the waltz jump's clock, which is 6 degrees
   a frame, so a glyph carried through that turn moves fast legitimately. */
const SPIN = 30;
/* Same, across a landing or takeoff, where bootDir changes rule. */
const SPIN_LANDING = 95;
/* Fraction of the view a glyph may travel between adjacent frames. */
const SLIDE = 0.06;
/* Below these, a projection is not carrying a direction — it is carrying noise. */
const FLAT_HORIZ = 0.15;      // top view: horizontal part of the boot direction
const TIE = 0.08;             // profile: |in-plane − toward-camera|

const dAng = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const num = (s, re) => { const m = re.exec(s || ''); return m ? m.slice(1).map(Number) : null; };

let bad = 0, checked = 0;
const fail = m => { bad++; console.error(`  x ${m}`); };
const flips = [], zones = [];

for (const [key, m] of Object.entries(MOVES)) {
  const path = buildPath(m);

  /* ── the three views, read off the markup the renderer actually produced ── */
  for (const view of ['top', 'side', 'rear']) {
    const { rig, byView } = rigFor(key, [view]);
    const svg = byView[view];
    const prev = {};
    let flipCount = 0, tieFrames = 0, flatFrames = 0;

    for (let i = 0; i < rig.frames; i++) {
      rig.seek(i);
      const pose = poseAt(m, i / (rig.frames - 1));
      for (const g of findAll(svg, n => n.attrs['data-boot'])) {
        const foot = g.attrs['data-foot'];
        const t = g.attrs.transform || '';
        let orient = null, branch = 'top', pos = null;

        if (view === 'top') {
          const r = num(t, /rotate\(([-\d.]+)\)/);
          const p = num(t, /translate\(([-\d.]+) ([-\d.]+)\)/);
          orient = r ? r[0] : null; pos = p;
          const h = Number(g.attrs['data-horiz']);
          if (h < FLAT_HORIZ) flatFrames++;
        } else {
          const p = num(t, /translate\(([-\d.]+) ([-\d.]+)\)/);
          pos = p;
          /* End-on carries data-roll; side-on carries a 2x2. Which one is drawn is
             the branch, and reading it off the markup means this cannot disagree
             with the renderer about which was chosen. */
          /* Three glyphs, three markers. End-on carries data-roll, the plan view
             carries data-plan, and the profile carries neither — all three put a
             2x2 or a rotate on the child, so orientation is comparable across
             them, but WHICH was drawn has to be read rather than inferred, or a
             switch between two of them looks like a glyph spinning. */
          const kid = g.children[0];
          const end = g.children.find(c => c.attrs['data-roll'] !== undefined);
          if (end) { branch = 'end'; orient = Number(end.attrs['data-roll']); }
          else if (kid && kid.attrs['data-plan'] !== undefined) {
            branch = `plan-${kid.attrs['data-plan']}`;
            const mx = num(kid.attrs.transform, /matrix\(([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)/);
            if (mx) orient = Math.atan2(mx[1], mx[0]) * 180 / Math.PI;
          } else {
            const mx = num(kid?.attrs?.transform, /matrix\(([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)/);
            if (mx) { branch = 'side'; orient = Math.atan2(mx[1], mx[0]) * 180 / Math.PI; }
          }
          /* How close the glyph choice was to a tie, recomputed from the model so it
             is not read back out of the thing being judged. Since 30/08/2026 the
             choice is three-way — the boot's three axes are orthonormal, so their
             camera components square to one and the glyph is the view down
             whichever is largest. A tie is two of them within TIE of each other. */
          const q = pose[foot], down = onIceOf(pose, foot) != null;
          const kn = twoBone({ t: 0, n: 0, z: pose.hipZ }, q, THIGH, SHIN, anterior(pose.hipYaw));
          const bd = bootDir(pose, foot, kn, q);
          const ank = ankleOf(q, bd, [kn.t - q.t, kn.n - q.n, kn.z - q.z]);
          const toA = [ank.t - q.t, ank.n - q.n, ank.z - q.z];
          const f3 = unit(bd);
          const dp = toA[0]*f3[0] + toA[1]*f3[1] + toA[2]*f3[2];
          const u3 = unit([toA[0]-dp*f3[0], toA[1]-dp*f3[1], toA[2]-dp*f3[2]]);
          const lat = unit(cross(f3, u3));
          const cam = v => view === 'side' ? v[1] : -v[0];
          const a = [Math.abs(cam(f3)), Math.abs(cam(u3)), Math.abs(cam(lat))].sort((x, y) => y - x);
          if (a[0] - a[1] < TIE) tieFrames++;
        }

        const k = `${view}:${foot}`, p = prev[k];
        const landing = p && p.down !== (onIceOf(pose, foot) != null);
        if (p && orient !== null && p.orient !== null) {
          checked++;
          const d = dAng(orient, p.orient);
          if (p.branch !== branch) flipCount++;
          else if (d > (landing ? SPIN_LANDING : SPIN))
            fail(`${key} ${view} ${foot}: the glyph turns ${d.toFixed(0)}° between frames ` +
              `${i - 1} and ${i}${landing ? ' (across a landing)' : ''} — nothing drawn may jump`);
        }
        if (p && pos && p.pos) {
          const box = num(svg.attrs.viewBox, /0 0 ([\d.]+) ([\d.]+)/) || [400, 400];
          const travel = Math.hypot(pos[0] - p.pos[0], pos[1] - p.pos[1]) / Math.max(...box);
          if (travel > SLIDE)
            fail(`${key} ${view} ${foot}: the glyph slides ${(travel * 100).toFixed(0)}% of the ` +
              `view between frames ${i - 1} and ${i}`);
        }
        prev[k] = { orient, pos, branch, down: onIceOf(pose, foot) != null };
      }
    }
    if (flipCount) flips.push(`${key} ${view}: ${flipCount}`);
    if (tieFrames || flatFrames)
      zones.push(`${key} ${view}: ${tieFrames || flatFrames} frames ${view === 'top' ? 'with almost no horizontal heading' : 'on a near-tie between two of the three glyphs'}`);
  }

  /* ── 3: the boot's own direction, in 3D, before any view touches it ── */
  for (const w of ['L', 'R']) {
    let p = null;
    for (let i = 0; i < path.length; i++) {
      const pose = poseAt(m, i / (path.length - 1));
      const q = pose[w], down = onIceOf(pose, w) != null;
      const kn = twoBone({ t: 0, n: 0, z: pose.hipZ }, q, THIGH, SHIN, anterior(pose.hipYaw));
      const bd = bootDir(pose, w, kn, q);
      if (p) {
        const a = Math.acos(Math.max(-1, Math.min(1, bd[0] * p.bd[0] + bd[1] * p.bd[1] + bd[2] * p.bd[2]))) * 180 / Math.PI;
        const rule = p.down !== down;
        if (a > (rule ? SPIN_LANDING : SPIN))
          fail(`${key} ${w}: the boot's 3D direction turns ${a.toFixed(0)}° between frames ` +
            `${i - 1} and ${i}${rule ? ' (bootDir changes rule at a landing)' : ''}`);
      }
      p = { bd, down };
    }
  }
}

console.log(`\n${checked} adjacent-frame comparisons across ${Object.keys(MOVES).length} moves, three views`);
if (flips.length) console.log(`  glyph switched between two of the three views: ${flips.join(', ')}`);
if (zones.length && VERBOSE) for (const z of zones) console.log(`  ${z}`);
else if (zones.length) console.log(`  ${zones.length} view-move pairs spend frames in a degenerate zone (--verbose to list)`);
console.log(bad
  ? `\n${bad} discontinuit${bad === 1 ? 'y' : 'ies'} — a glyph that jumps is a projection that has degenerated, or a pose nothing could skate`
  : 'nothing drawn jumps: every glyph turns and travels smoothly between frames');
process.exit(bad ? 1 : 0);
