/* WHERE THE MASS IS, every move — Session 32, 04/10/2026.

   Two halves. The first ASSERTS THE MASS MODEL (src/lib/mass.js) against
   expectations that do not come from it, and fails the chain if any break. The
   second REPORTS every move's fore-aft balance and asserts nothing about poses yet:
   where the mass should sit differs by phase (over the middle of the blade on a
   glide, forward toward the rocker's front for turns and spins, behind the feet in
   a braking stop), and those targets are Martyn's to set. Poses get fixed against
   this as the undrawables are written and the work expands out from them.

       npm run balance            # the tests, then the table
       node tools/balance.mjs --quiet    # the tests only (what check:balance runs)

   The model's expectations, each from outside the model:
     1. shares sum to one after normalising.
     2. a figure symmetric about its midline has its mass on the midline.
     3. standing upright, the centre is at 0.54 to 0.57 of stature (stature from
        the shoulders, less the skate), and above the hip joint.
     4. moving the shoulders forward moves the mass forward by between the trunk-and-
        head share alone and that share plus the arms (the hands stay where authored).
     5. a level blade's contact is its middle; a pitched one's is ROCKER·sin(pitch)
        forward of it, written out here rather than imported.
     6. the snowplough, authored over the middle of the blades this session, reads
        within 1.5 cm of them.

   Broken on purpose (each restored after, _to_delete/s32/mutate.sh): the trunk's
   centre at 0.9 of its length instead of 0.5 fails 3 and 6; the head 20 cm below the
   shoulders instead of above fails 3; the shares left unnormalised fails 1;
   contactAlongOf's sign flipped in legOf fails 5. The left and right hands swapped
   in segmentsOf PASSES: the forearm's mass sits mostly toward the hand, which is
   authored, so which shoulder the arm hangs from barely moves the centre. Known and
   left; it is the renderer's arms, not this file's, that would show it. */
import { MOVES } from '../src/lib/moves.js';
import { poseAt, D2R } from '../src/lib/rig-math.js';
import { SEGMENTS, TOTAL, segmentsOf, massCentre, balanceOf } from '../src/lib/mass.js';

const quiet = process.argv.includes('--quiet');
let bad = 0;
const ok = (cond, msg) => { if (!cond) { bad++; console.log('  FAIL ' + msg); } else if (!quiet) console.log('  ok   ' + msg); };

/* A figure standing still on both blades, feet under the hips, arms out a little. */
const stand = (over = {}) => ({ hipZ: 97, hipYaw: 0, shYaw: 0, sh: { t: 0, n: 0, z: 150 },
  L: { t: 0, n: -10, z: 0, pitch: 0, onIce: 'blade' }, R: { t: 0, n: 10, z: 0, pitch: 0, onIce: 'blade' },
  LH: { t: 0, n: -45, z: 100 }, RH: { t: 0, n: 45, z: 100 }, skate: 'L', edge: 'I', dir: 'F', ...over });
const mirror = p => { const f = q => q && { ...q, n: -q.n };
  return { ...p, sh: f(p.sh), L: f(p.R), R: f(p.L), LH: f(p.RH), RH: f(p.LH), skate: p.skate === 'L' ? 'R' : 'L' }; };

console.log('the mass model');
const sum = segmentsOf(stand()).reduce((s, x) => s + x.m, 0);
ok(Math.abs(sum - 1) < 1e-9, `1. shares sum to one (${sum.toFixed(6)})`);

const c0 = massCentre(stand());
/* On the midline across, and NOT at t = 0 fore and aft: knees face forward and
   elbows back, and the ankle sits behind the blade's middle, so a figure with every
   authored point at t = 0 is not fore-aft symmetric. The first draft asserted t = 0
   too and was wrong about the body, not the code. */
ok(Math.abs(c0.n) < 1e-9, `2. symmetric figure on its midline (n ${c0.n.toFixed(3)})`);
const oneArm = stand({ LH: { t: 30, n: -60, z: 150 } }), cm = massCentre(oneArm), cmm = massCentre(mirror(oneArm));
ok(Math.abs(cm.n + cmm.n) < 1e-6 && Math.abs(cm.t - cmm.t) < 1e-6 && cm.n < 0,
  `2. the left arm raised and out, against its mirror (n ${cm.n.toFixed(2)} / ${cmm.n.toFixed(2)})`);

/* Stature from the shoulders: the acromion is 0.818 of stature (Drillis and Contini,
   as Winter tabulates it), measured from the floor, and the floor here is the ice
   less the skate: the rig's ankle is ANKLE_UP above the contact where a bare ankle is
   0.039 of stature above the floor, about 8 cm of boot sole and blade between them.
   An adult's centre of mass stands at 0.54 to 0.57 of stature. */
const SKATE = 8, H = (stand().sh.z - SKATE) / 0.818, frac = (c0.z - SKATE) / H;
ok(frac >= 0.54 && frac <= 0.57 && c0.z > stand().hipZ,
  `3. standing, the centre is at ${frac.toFixed(3)} of stature, ${(c0.z - stand().hipZ).toFixed(1)} cm above the hip joint (expect 0.54 to 0.57, above it)`);

const d = 6, shifted = massCentre(stand({ sh: { t: d, n: 0, z: 150 - 0.3 } }));
const lo = (SEGMENTS.trunk[0] * SEGMENTS.trunk[1] + SEGMENTS.head[0]) / TOTAL * d;
const hi = lo + 2 * (SEGMENTS.upperArm[0] + SEGMENTS.foreHand[0]) / TOTAL * d;
const moved = shifted.t - c0.t;
ok(moved >= lo - 0.05 && moved <= hi + 0.05, `4. shoulders ${d} cm forward move the mass ${moved.toFixed(2)} cm (expect ${lo.toFixed(2)} to ${hi.toFixed(2)})`);

const one = (pitch) => stand({ R: { t: 0, n: 10, z: 30, pitch: 0 }, L: { t: 0, n: -10, z: 0, pitch, onIce: 'blade' } });
const b0 = balanceOf(one(0)), b2 = balanceOf(one(2));
const want = 213 * Math.sin(2 * D2R);
ok(Math.abs(b0.contactOnBlade) < 1e-6, `5. level blade: contact at its middle (${b0.contactOnBlade.toFixed(3)})`);
ok(Math.abs(b2.contactOnBlade - want) < 0.3, `5. blade pitched 2°: contact ${b2.contactOnBlade.toFixed(2)} cm forward (expect ${want.toFixed(2)})`);

const sp = MOVES.snowplough.keys.map(k => balanceOf(poseAt(MOVES.snowplough, k.t)).along);
ok(sp.every(a => Math.abs(a) <= 1.5), `6. snowplough over the middle of its blades (${sp.map(a => a.toFixed(1)).join(', ')} cm)`);

if (bad) { console.log(`\n${bad} expectations of the mass model broken`); process.exit(1); }
if (quiet) { console.log('the mass model holds its six expectations'); process.exit(0); }

/* THE REPORT. Every move sampled at N instants through poseAt (pins included), frames
   with no runner down skipped. Nothing here fails. */
const N = 61, rows = [];
for (const [id, mv] of Object.entries(MOVES)) {
  const one = [], two = [], onb = [], acr = [];
  for (let i = 0; i < N; i++) {
    const b = balanceOf(poseAt(mv, i / (N - 1)));
    if (!b) continue;
    if (b.feet === 'LR') { two.push(b.along); acr.push(b.across); } else { one.push(b.along); onb.push(b.contactOnBlade); }
  }
  const all = one.concat(two);
  if (!all.length) continue;
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
  rows.push({ id, n: all.length, min: Math.min(...all), mean: mean(all), max: Math.max(...all),
    onb: mean(onb), acr: mean(acr), share: two.length / all.length });
}
rows.sort((a, b) => a.mean - b.mean);
const f = (x, w = 5) => (Number.isNaN(x) ? '—' : x.toFixed(0)).padStart(w);
console.log(`\nfore-aft balance, every move: the mass against the contact (one blade) or the middle of both (two),\n` +
  `cm, + toward the toe; "on blade" is where a single contact sits on its blade (+ forward of the middle, blade ±13)\n`);
console.log('move'.padEnd(28) + 'frames   min  mean   max  on blade  two-foot');
for (const r of rows)
  console.log(r.id.padEnd(28) + String(r.n).padStart(6) + f(r.min, 6) + f(r.mean, 6) + f(r.max, 6) + f(r.onb, 10) +
    (r.share ? `  ${(r.share * 100).toFixed(0)}%` : ''));
const m = rows.map(r => r.mean);
console.log(`\n${rows.length} moves: ${m.filter(x => Math.abs(x) <= 5).length} within 5 cm on average, ` +
  `${m.filter(x => x < -5).length} behind, ${m.filter(x => x > 5).length} ahead. Targets not set; nothing asserted.`);
