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
     6. the snowplough as authored over the middle of the blades this session (kept as a
        fixture since Session 34 moved its feet), reads
        within 1.5 cm of them.

   Broken on purpose (each restored after, _to_delete/s32/mutate.sh): the trunk's
   centre at 0.9 of its length instead of 0.5 fails 3 and 6; the head 20 cm below the
   shoulders instead of above fails 3; the shares left unnormalised fails 1;
   contactAlongOf's sign flipped in legOf fails 5. The left and right hands swapped
   in segmentsOf PASSES: the forearm's mass sits mostly toward the hand, which is
   authored, so which shoulder the arm hangs from barely moves the centre. Known and
   left; it is the renderer's arms, not this file's, that would show it. */
import { MOVES } from '../src/lib/moves.js';
import { poseAt, cuspAt, D2R } from '../src/lib/rig-math.js';
import { SEGMENTS, TOTAL, segmentsOf, massCentre, balanceOf, legOf } from '../src/lib/mass.js';

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

/* Session 34 moved the snowplough's feet 7 cm ahead, to sit back against the stop (Martyn's
   stop target, below). The expectation keeps the pose it was written against: the feet 8 cm
   ahead of the hip, as authored on 04/10/2026 in Session 32. */
const SP32 = { ...MOVES.snowplough, keys: MOVES.snowplough.keys.map(k => ({ ...k, L: { ...k.L, t: 8 }, R: { ...k.R, t: 8 } })) };
const sp = SP32.keys.map(k => balanceOf(poseAt(SP32, k.t)).along);
ok(sp.every(a => Math.abs(a) <= 1.5), `6. the Session 32 snowplough over the middle of its blades (${sp.map(a => a.toFixed(1)).join(', ')} cm)`);

if (bad) { console.log(`\n${bad} expectations of the mass model broken`); process.exit(1); }

/* PHASE TARGETS — 04/10/2026, Session 33. Martyn's, set phase by phase as moves are
   written; the first family is the one-foot turns. Each family names its moves and, per
   phase, a band for `along` (the mass against the blade's contact, + toward the toe) and
   for `onBlade` (where the contact is on the blade, + forward of the middle, blade ±13).

   THE PHASES ARE READ OFF THE MOVE, not authored a second time: the turn is the cusp
   window (cuspAt), the entry is everything before it, and the exit is everything from
   the first key after the window. Between the window and that key the blade rocks back
   from the front of the rocker to the middle, and only `along` is held there.

   NOT `along` INSIDE THE WINDOW. The blade turns square across the circle at the apex,
   so a distance measured along the blade there is the lean across the circle (the
   bracket reads −19.7 at the apex for that reason), not a fore-aft balance.

   Broken on purpose: --break=turns puts the turns' old poses' numbers back by moving
   every skating blade 6 cm ahead of the hip at every key (the entry glides read 5 to 8
   behind before today): 4768 frame-quantities out. --break=rock flattens the blade
   through the cusp: 352.

   Session 34 added the jumps, every spin but the sit (declared in CANNOT), and the stops,
   with Martyn's targets, and a toe take-off's own route. --break=turns now moves every family
   it reaches: 8086. --break=pick reads the mass half a support back toward the skating blade: 56,
   every frame on one. */
const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const TURN_IDS = ['threeTurn', 'lfiThree', 'lboThree', 'lbiThree', 'lfoBracket', 'lfiBracket', 'lboBracket', 'lbiBracket',
  'rfoThree', 'rfiThree', 'rboThree', 'rbiThree', 'rfoBracket', 'rfiBracket', 'rboBracket', 'rbiBracket'];
/* Each family says how its frames divide into phases, read off the move. */
const NF = 320;
const turnPhases = mv => {
  const inWin = [];
  for (let i = 0; i < NF; i++) inWin.push(!!cuspAt(mv, i / (NF - 1)));
  const wEnd = inWin.lastIndexOf(true) / (NF - 1);
  /* The key at the window's far edge is the turn's last pose, so the exit starts at the one after it. */
  const exitFrom = (mv.keys.find(k => k.t > wEnd + 2 / (NF - 1)) || { t: 1 }).t;
  return i => inWin[i] ? 'turn' : inWin.indexOf(true) > i ? 'entry' : i / (NF - 1) < exitFrom ? 'settle' : 'exit';
};
/* A spin's held phase is every segment that claims a position or a wind-up (spin.mjs's
   own definition of centred); the rest is the edge in and the edge out. */
const spinPhases = mv => {
  const spans = mv.path.map(g => g.span ?? 1), sum = spans.reduce((a, b) => a + b, 0);
  let c = 0; const ends = spans.map(x => (c += x) / sum);
  /* An entrance (moves.js ENTRIES, Session 34) is its own phase: the Salchow's edge and three
     turn, held where the Salchow is. */
  const into = mv.entrance?.at ?? 0;
  return i => { const t = i / (NF - 1), j = ends.findIndex(e => t <= e + 1e-9);
    if (t < into - 1e-9) return 'entrance';
    const g = mv.path[Math.max(0, j)]; return g.position || g.windup ? 'held' : 'edge'; };
};
const TARGETS = [
  { family: 'one-foot turns', ids: TURN_IDS, phases: turnPhases,
    entry: { along: [-2, 2] }, turn: { onBlade: [4, 8] }, settle: { along: [-2, 2] },
    exit: { along: [-2, 2], onBlade: [-3, 0] } },
  /* Martyn, Session 33: a centred spin on the front of the rocker, +6 to +10, the mass
     over the contact; and every glide, on any move, the mass over the contact ±2. */
  { family: 'spins', ids: ['backSpin', 'uprightSpin', 'changeFootSpin'], phases: spinPhases,
    held: { along: [-2, 2], onBlade: [6, 10] }, edge: { along: [-2, 2] }, entrance: {} },
  { family: 'glides', ids: ['powerCoePulls'], phases: () => () => 'glide',
    glide: { along: [-2, 2] } },
  /* The half jumps: the glide into the pick and the glide out of the landing. Between the
     first key with a foot on a pick and the first key after the last one, the skater is
     vaulting, in the air or landing, and nothing is held. */
  { family: 'half jumps', ids: ['halfFlip', 'tapToeJump'], phases: mv => {
      const picked = mv.keys.filter(k => ['L', 'R'].some(w => k[w] && k[w].onIce === 'pick'));
      const from = picked[0].t, last = picked[picked.length - 1].t;
      const to = (mv.keys.find(k => k.t > last + 1e-9) || { t: 1 }).t;
      return i => { const t = i / (NF - 1); return t < from || t >= to ? 'glide' : 'vault'; };
    }, glide: { along: [-2, 2] }, vault: {} },
];
/* THE JUMPS — Martyn, 04/10/2026, Session 34. Phases come off the keys: the take-off edge is
   the path segment before the flight's line; on it the skater GLIDES until the key before
   the first one with the hip 4 cm lower (the knee starting to bend), then LOADS (no
   target: the knee bend and the swing). TAKEOFF runs from the last key on the ice before
   the flight to the flight. The LANDING is from touchdown to the key after the deepest
   one, where the check holds; from there to the end is the EXIT. A pick on the ice is
   held by its own route below (the mass between the pick and the skating blade); the
   entrance before the take-off edge is not in this family. */
const jumpPhases = mv => {
  const K = mv.keys, a = K.findIndex(k => k.skate === null), land = K.findIndex((k, i) => i > a && k.skate);
  let deep = land; for (let i = land; i < K.length; i++) if (K[i].hipZ < K[deep].hipZ) deep = i;
  const tOff = K[a].t, tDrive = K[a - 1].t, tLand = K[land].t, tCheck = K[Math.min(deep + 1, K.length - 1)].t;
  const spans = mv.path.map(g => g.span), sum = spans.reduce((x, y) => x + y, 0);
  let c = 0; const b = [0, ...spans.map(x => (c += x) / sum)];
  const segStart = b[mv.path.findIndex(g => g.kind === 'line') - 1];
  const on = K.filter(k => k.t >= segStart - 1e-9 && k.t < tDrive);
  const bi = on.findIndex(k => k.hipZ <= on[0].hipZ - 4), glideTo = bi > 0 ? on[bi - 1].t : segStart;
  const picked = (i) => { const p = poseAt(mv, i / (NF - 1)); return ['L', 'R'].some(w => p[w].onIce === 'pick' || (p[w].pin && p[w].z <= 0.5)); };
  return i => { const t = i / (NF - 1);
    if (t < segStart - 1e-9) return 'entrance';
    if (t <= glideTo + 1e-9) return 'glide';
    if (t < tDrive) return 'load';
    if (t < tOff) return picked(i) ? 'vault' : 'takeoff';
    if (t < tLand) return 'air';
    if (Math.abs(t - tLand) < 1 / (NF - 1)) return 'touchdown';
    if (t < tCheck) return 'landing';
    return 'exit'; };
};
const JUMP_IDS = ['waltz', 'salchow', 'toeLoop', 'loop', 'flip', 'lutz', 'axel', 'loop@three',
  'doubleSalchow', 'doubleToeLoop', 'doubleLoop', 'doubleFlip', 'doubleLutz', 'doubleAxel', 'doubleLoop@three'];
TARGETS.push({ family: 'jumps', ids: JUMP_IDS, phases: jumpPhases,
  glide: { along: [-2, 2] }, load: {}, takeoff: { onBlade: [4, 8] }, vault: {}, air: {},
  touchdown: { onBlade: [0, 20] }, landing: {}, exit: { along: [-2, 2], onBlade: [-3, 0] }, entrance: {} });

/* THE STOPS — Martyn, Session 34: through the brake, the mass 3 to 8 cm behind the braking
   contact, against the direction of travel. All three are held at the braking instant, so
   every frame is the brake. Two feet down: from the midpoint of the contacts. The hockey
   stop does not draw (drawn.mjs). */
TARGETS.push({ family: 'stops', ids: ['snowplough', 'ploughBack', 'tStop'], phases: () => () => 'brake',
  brake: { behind: [3, 8] } });

/* DECLARED, NOT SKIPPED: moves this rig cannot put inside a family's targets, each with the
   reason, and each asserted to be outside them still, so the list cannot go stale. */
const CANNOT = {
  /* Session 34. A sit in this rig has its hip 34 cm behind the blade because shin.mjs will
     not lean the shin past the boot's 28° (docs/model.md, spins), and the mass follows the
     hip: 16 to 22 cm toward the heel. Putting it over the blade needs the blade 17 cm behind
     the hip, a shin at 84°, or the shoulders 70 cm forward. The combination's sit is the
     same sit. */
  sitSpin: 'spins', combinationSpin: 'spins',
  /* Session 34. The camel's mass is 6 to 14 cm toward the toe in the held position, the
     torso out over the leg further than the free leg balances it. The blade solved under the
     mass is 13 to 16 cm in front of the hip, the spin's axis goes with it, the hip and the
     free leg orbit wider, and the free boot then slides 7% of the view a frame at the camel's
     rate (continuity.mjs, 5). Balanced at a slower rate, or with the free leg further back,
     both of which change what the page says; left for Martyn. */
  camelSpin: 'spins',
};
const mutate = (m) => {
  if (!BREAK) return m;
  return { ...m, keys: m.keys.map(k => { const w = k.skate, q = k[w]; if (!w) return k;
    const dirSign = k.dir === 'F' ? 1 : -1;
    if (BREAK === 'turns') return { ...k, [w]: { ...q, t: q.t + 6 * dirSign } };
    if (BREAK === 'rock' && q.pitch > 1) return { ...k, [w]: { ...q, pitch: 0 } };
    return k; }) };
};
let phaseFrames = 0, phaseBad = 0;
for (const T of TARGETS) {
  for (const id of T.ids) {
    const mv = mutate(MOVES[id]);
    if (!MOVES[id]) { bad++; console.log(`  FAIL ${T.family}: ${id} is not a move`); continue; }
    const phaseOf = T.phases(mv);
    let worst = null;
    for (let i = 0; i < NF; i++) {
      const t = i / (NF - 1), pose = poseAt(mv, t), b = balanceOf(pose);
      if (!b) continue;
      const ph = phaseOf(i), want = T[ph];
      phaseFrames++;
      for (const [q, [lo, hi]] of Object.entries(want)) {
        /* `behind`: the mass's offset against the direction of travel, so a stop going
           backwards is held to the same words as one going forwards. */
        const v = q === 'along' ? b.along : q === 'behind' ? -b.along * (pose.dir === 'B' ? -1 : 1) : b.contactOnBlade;
        if (v < lo - 1e-9 || v > hi + 1e-9) {
          const off = v < lo ? lo - v : v - hi;
          if (!worst || off > worst.off) worst = { off, t, ph, q, v, lo, hi };
          phaseBad++;
        }
      }
    }
    if (worst) { bad++; console.log(`  FAIL ${id}: at t=${worst.t.toFixed(3)} (${worst.ph}) ${worst.q} is ` +
      `${worst.v.toFixed(1)} cm, wanted ${worst.lo} to ${worst.hi}`); }
    else if (!quiet) console.log(`  ok   ${id} inside its targets on every frame`);
  }
}
for (const [id, fam] of Object.entries(CANNOT)) {
  const T = TARGETS.find(x => x.family === fam), mv = MOVES[id], phaseOf = T.phases(mv);
  let out = 0;
  for (let i = 0; i < NF; i++) { const b = balanceOf(poseAt(mv, i / (NF - 1))); if (!b || b.feet === 'LR') continue;
    const want = T[phaseOf(i)] || {};
    for (const [q, [lo, hi]] of Object.entries(want)) { const v = q === 'along' ? b.along : b.contactOnBlade; if (v < lo || v > hi) out++; } }
  if (!out) { bad++; console.log(`  STALE ${id} is declared unable to meet the ${fam} targets and now meets them: remove it from CANNOT`); }
  else if (!quiet) console.log(`  ok   ${id} declared outside the ${fam} targets, and is (${out} frame-quantities)`);
}

/* A TOE TAKE-OFF: the mass between the pick and the skating blade (Martyn, Session 34). The
   share of the way from the skating blade's contact to the pick, along the line between them,
   is strictly between 0 and 1 on every frame with both down. */
let pickFrames = 0;
for (const id of JUMP_IDS) {
  const mv = MOVES[id];
  for (let i = 0; i < NF; i++) {
    const p = poseAt(mv, i / (NF - 1)), pk = ['L', 'R'].find(w => p[w].onIce === 'pick');
    if (!pk || !p.skate || p.skate === pk) continue;
    const c = massCentre(p), a = legOf(p, p.skate).contact, q = p[pk];
    const d = [q.t - a.t, q.n - a.n], u = ((c.t - a.t) * d[0] + (c.n - a.n) * d[1]) / (d[0] ** 2 + d[1] ** 2);
    const v = BREAK === 'pick' ? u - 0.5 : u;
    pickFrames++;
    if (!(v > 0 && v < 1)) { phaseBad++; if (!bad++ || !quiet) console.log(`  FAIL ${id}: at t=${(i / (NF - 1)).toFixed(3)} the mass is ${v.toFixed(2)} of the way from the blade to the pick`); }
  }
}
if (bad) { console.log(`\n${phaseBad} frame-quantities outside a phase target`); process.exit(1); }
if (quiet) { console.log(`the mass model holds its six expectations, and ${phaseFrames} frames of ` +
  `${TARGETS.reduce((a, T) => a + T.ids.length, 0)} moves sit inside their phase targets, and on ${pickFrames} frames on a pick the mass is between the pick and the blade`); process.exit(0); }

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
  `${m.filter(x => x < -5).length} behind, ${m.filter(x => x > 5).length} ahead. Targets set for the families above; everything else is reported.`);
