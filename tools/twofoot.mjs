/* Two blades on the ice, and whether the model is telling the truth about them.

   A pose used to hold one blade. `skate` was the only thing that said so, and
   every renderer and checker asked the same question the same way — `which ===
   pose.skate` — which reads "is this the skating foot" and silently means "is
   this foot on the ice at all". Those were the same question until 30/08/2026
   and are not any more. This file is what stops them drifting.

   Five assertions. The first three run anywhere; the fourth needs the rig to
   round-trip through poseAt; the fifth needs BIS's own document.

   1  THE REFERENCE BLADE AGREES WITH THE ICE. `skate` names a foot that is on
      the ice, and an airborne pose has no blade down at all. A second blade
      declared on a jump would otherwise draw a tracing under a skater in mid-air.
      PER FRAME its other half, since 20/09/2026: `skate` names the blade the
      TRACING is built from and no longer implies a contact at all, so the claim
      worth making between two keys is that a reference blade which is off the ice
      is one that is changing hands.

   2  A FOOT ON THE ICE IS ON THE ICE, AND A FREE FOOT IS NOT. Within 3 cm and
      at least 5 cm respectively. Blade or pick: a pick that is not touching is not
      a pick, and the teeth reach the ice or they do not — the existing poses sit at 0-2 and 10-117, so
      there is a real gap between them and nothing has to be nudged to pass.
      This is the assertion model.md asked for: the lunge "would have passed
      every checker with the trailing foot lifted 30 cm", and authoring a second
      blade at free-foot height is the same cheat in the other direction.

   PER KEYFRAME IS NOT PER FRAME, AND THIS FILE HAD BEEN BITTEN BY IT TWICE BEFORE
   ANYONE COUNTED. 1 and 2 both read `move.keys`, and both were false between two of
   them. The clearance bound: every keyframe cleared at twice the 5 cm and the feet
   reached 1.23 cm on the waltz and 0.01 on the change of foot. The on-the-ice bound:
   every keyframe passed at nought to two centimetres and a blade CLAIMED on the ice
   was drawn 29.99 cm above it for six frames of the waltz and 15.99 for thirty-three
   of the change of foot, with the tracing built from it. Same file, same shape,
   `freefoot.mjs`'s old fault twice over.

   THEY GO PER FRAME TOGETHER, and that is not tidiness. Both were per keyframe for
   the same reason and settling one would have opened the same argument twice: a foot
   being put down HAS to cross the 5 cm band, so the clearance bound cannot go per
   frame until the model can say which feet are changing hands — and a foot changing
   hands is exactly what assertion 1 had been calling on the ice. `arrivalOf` answers
   both, and `poseAt` writes a declared absence of contact onto an arriving or
   departing foot. docs/model.md, *What `skate` names*.

   3  TWO BLADES DOWN SIT A LEG'S WIDTH APART. Between 5 and 70 cm. A second
      blade left where the free foot was is the likeliest authoring slip and it
      is invisible in a side view.

   4  EVERY BLADE ON THE ICE SHARES ONE LOBESENSE, PER FRAME. Both blades are on
      one circle, so they share a lobe. Measured through poseAt rather than off
      the keyframes, because the renderer reads poseAt and a per-foot field left
      out of its interpolation would make a second blade vanish everywhere except
      in the authoring — which is precisely how the LH/RH override was discarded
      for four sessions.

   5  THE DERIVED PAIR IS THE PAIR BRITISH ICE SKATING NAMES. Skills 1's slalom
      writes its two-foot power changes as pairs — RFI & LFO, RFO & LFI, LBI &
      RBO, LBO & RBI. secondFoot() derives the partner from the first blade and
      the second foot's direction, and must reproduce every pair in the document.
      This is the only assertion here with an independent source: the other four
      check the model against itself.

   Assertion 5 needs the BIS PDFs in sources/bis/ and pdftotext on the path, both
   absent from a clean clone, so it skips with a notice — the same call
   syllabus.mjs makes and for the same reason.

   Mutation counts, per break: air 8, float 91, apart 85, sense 963, bis 4,
   carry 39, dip 3192, stray 13294. `carry` is the one to read: thirty-nine is the
   six waltz frames and the thirty-three of the change of foot that were drawn as a
   blade on the ice while being up to 29.99 cm above it, and it is the count this
   file could not produce until 20/09/2026 because it had no per-frame assertion to
   produce it with.

       node tools/twofoot.mjs
       node tools/twofoot.mjs --break=air|float|apart|sense|bis|carry|dip|stray|shared|drift|yaw
*/
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './_rig.mjs';
import { MOVES } from '../src/lib/moves.js';
import { lobeSense, secondFoot, label } from '../src/lib/skating.js';
import { onIceOf, edgeOf, dirOf, edgesDown, runnersDown, contactsDown, buildPath, poseAt, CLEAR,
         trackRuns, trackedAt, TRACK_AGREE } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
/* CLEAR MOVED TO rig-math.js ON 20/09/2026 and is imported. It became load-bearing in
   the model that day — it is the height over which an arriving boot's direction blends
   toward its contact — and a checker's constant the renderer depends on is two
   expressions of one fact. NEAR happens to be five as well and is a different claim,
   about two blades a leg's width apart, so it stays here. */
const ON_ICE = 3, NEAR = 5, FAR = 70;

let bad = 0;
const fail = m => { bad++; console.error(`  x ${m}`); };
const where = (id, k) => `${id} t=${k.t.toFixed(2)} — "${k.ph}"`;

console.log(`two blades on the ice${BREAK ? `, broken on purpose: ${BREAK}` : ''}\n`);

/* A broken copy rather than an edit in place: the assertions must run against
   the same objects the renderer would get, and a mutated MOVES would leak into
   the frame pass below. */
const brk = k => {
  const o = { ...k, L: { ...k.L }, R: { ...k.R } };
  const other = o.skate === 'L' ? 'R' : 'L';
  if (BREAK === 'air' && !o.skate) o.L.onIce = 'blade';
  if (BREAK === 'float' && o.skate) o[other] = { ...o[other], onIce: 'blade' };
  if (BREAK === 'apart' && o.skate) o[other] = { ...o[other], onIce: 'blade', z: 0, t: o[o.skate].t, n: o[o.skate].n };
  return o;
};

/* ── 1, 2, 3: the keyframes ──────────────────────────────────────────── */
let keys = 0, twoFoot = 0;
for (const [id, m] of Object.entries(MOVES))
  for (const raw of m.keys) {
    const k = BREAK ? brk(raw) : raw;
    keys++;
    const down = edgesDown(k), touching = contactsDown(k);

    /* RUNNERS for this one: the claim is that the reference foot is on the ice at
       all, and since 19/09/2026 it may be there as a skid — both blades of a
       hockey stop are. Asking edgesDown would call every two-foot stop airborne. */
    if (k.skate && !runnersDown(k).includes(k.skate))
      fail(`${where(id, k)}: skate is ${k.skate}, which is not on the ice`);
    /* Any contact, not just a blade. A pick jabbed into the ice under a skater in
       mid-air is the same lie as a second blade there, and reads worse. */
    /* ON A PICK ALONE — 04/10/2026, Session 32, the bunny hop. Its landing stands on the
       right toe pick and nothing else for a tenth of a second, so the pose has no blade
       to name as `skate` and is not airborne either. Allowed only where every contact is
       a PINNED pick: a pick bearing the skater while the skater travels has to stay
       where it went in, and the pin is what makes it (rig-math.js, pinRuns). A blade,
       a skid or an unpinned pick under a pose with no reference blade still fails. */
    const pickAlone = touching.length && touching.every(w => onIceOf(k, w) === 'pick' && k[w].pin);
    if (!k.skate && touching.length && !pickAlone)
      fail(`${where(id, k)}: airborne, but ${touching.join(' and ')} claims contact with the ice`);

    for (const w of ['L', 'R']) {
      const z = k[w].z, on = onIceOf(k, w);
      if (on) {
        if (Math.abs(z) > ON_ICE)
          fail(`${where(id, k)}: ${w} is on the ice at z=${z} — more than ${ON_ICE} cm above it`);
      } else if (k.skate && z < CLEAR) {
        fail(`${where(id, k)}: ${w} is ${z} cm up and not marked on the ice — say it is touching or lift it`);
      }
    }

    /* Deliberately BLADES and not contacts. The 5-70 cm bound is about two blades
       on one circle, a leg's width apart; a picking foot is reaching behind and
       belongs at neither end of that range. What holds a pick honest is its height
       above the ice, checked above, and reach.mjs. */
    if (down.length === 2) {
      twoFoot++;
      const [a, b] = down.map(w => k[w]);
      const d = Math.hypot(a.t - b.t, a.n - b.n, a.z - b.z);
      if (d < NEAR || d > FAR)
        fail(`${where(id, k)}: the two blades are ${d.toFixed(0)} cm apart, outside ${NEAR}-${FAR}`);
    }
  }

/* ── 3b: EVERY AUTHORED PER-FOOT FIELD SURVIVES poseAt ───────────────────
   This file's header already says the round trip is what it is for, and assertion
   4 tested it for one field — onIce — by needing it. That is a test by side
   effect, and it caught nothing when `yaw` and `edge` were added to a foot on
   19/09/2026 and left out of `lpP`: the push was authored turned thirty-five
   degrees, every keyframe checker agreed, and every frame the renderer drew ran
   true. It was looked at, and passed, because two boots in different places look
   different whether or not one is turned.

   So the round trip is now asserted directly and by NAME, over whatever the
   keyframe actually carries. A field added tomorrow and forgotten in `lpP` fails
   here on the first run rather than in a picture nobody can read.

   Interpolated quantities are checked at the keyframe's own t, where the
   interpolation is an identity; states are checked across the span they hold. */
const FOOT_FIELDS = ['onIce', 'dir', 'edge', 'yaw', 'pitch', 'point', 'pin'];
let carried = 0;
for (const [id, m] of Object.entries(MOVES))
  for (const k of m.keys)
    for (const w of ['L', 'R']) {
      const authored = k[w];
      if (!authored) continue;
      const got = poseAt(m, k.t)[w];
      for (const f of FOOT_FIELDS) {
        if (authored[f] === undefined) continue;
        carried++;
        const a = authored[f], b = got && got[f];
        /* A TRACKED FOOT'S YAW IS THE TRACK'S, read back off its own line, and the key's
           number is held to it by section 6 within TRACK_AGREE rather than here. */
        const tol = got && got.track && f === 'yaw' ? TRACK_AGREE : 1e-6;
        const same = typeof a === 'number' ? Math.abs(a - (b ?? NaN)) < tol : a === b;
        if (!same)
          fail(`${where(id, k)}: the ${w} foot's ${f} is ${JSON.stringify(a)} in the keyframe ` +
            `and ${JSON.stringify(b)} after poseAt — lpP is dropping it`);
      }
    }

/* ── 4: the ice, and one lobe, every frame, through poseAt ───────────── */

/* THE BREAKS FOR THE PER-FRAME HALVES OF 1 AND 2, and `carry` is the fault this file
   was written against, restored. Before 20/09/2026 `onIceOf` answered "on the ice" for
   anything the pose named `skate`, and the pose carries `skate` from the left key —
   so deleting the declared absence `poseAt` now writes is the old reading exactly,
   not an invented mutation. Its count is the historical record of the hole. */
const brkPose = pose => {
  if (BREAK === 'carry')
    for (const w of ['L', 'R']) { const f = pose[w]; if (f && f.onIce === null) delete f.onIce; }
  if (BREAK === 'dip')
    for (const w of ['L', 'R']) { const f = pose[w]; if (f && !onIceOf(pose, w) && !f.arrival) f.z = Math.min(f.z, 1); }
  if (BREAK === 'stray') {
    const w = pose.skate;
    if (w && onIceOf(pose, w) && !pose[w].arrival) pose[w] = { ...pose[w], onIce: null };
  }
  return pose;
};

let frames = 0, twoFootFrames = 0, handoverFrames = 0, trackedFrames = 0;
for (const [id, m] of Object.entries(MOVES)) {
  const path = buildPath(m);
  for (let i = 0; i < path.length; i++) {
    const pose = brkPose(poseAt(m, i / (path.length - 1)));
    frames++;
    const at = `${id} f=${(i / (path.length - 1)).toFixed(3)}`;

    /* 2, PER FRAME. The same two bounds as the keyframe pass above, with one
       exception that had to be built before it could be written: a foot that is
       changing hands is crossing the band on purpose. Nobody steps onto a foot that
       teleports from five centimetres to contact, so asserting the clearance per
       frame without the exception would assert something false. Above CLEAR the
       exception does not bite, so a foot dropped thirty centimetres in one span is
       excused by nothing. */
    for (const w of ['L', 'R']) {
      const f = pose[w];
      if (!f) continue;
      const on = onIceOf(pose, w);
      if (f.arrival) handoverFrames++;
      if (on) {
        if (Math.abs(f.z) > ON_ICE)
          fail(`${at}: ${w} is claimed ${on} at z=${f.z.toFixed(2)} — more than ${ON_ICE} cm above the ice`);
      } else if (f.z < CLEAR && !f.arrival) {
        fail(`${at}: ${w} is ${f.z.toFixed(2)} cm up, free, and not changing hands — ` +
          `say it is touching, lift it, or let the keys either side say it is a handover`);
      }
    }

    /* 1, PER FRAME. Not "the reference blade is on the ice" — since 20/09/2026 it is
       not required to be, because `skate` names the blade the tracing is built from
       and a tracing has to be rooted somewhere continuously while a contact does not.
       What it may not be is off the ice for a stretch nobody declared: that is the
       carry outliving the contact, which is what drew thirty centimetres of air as a
       blade on the ice. */
    if (pose.skate && !onIceOf(pose, pose.skate) && !pose[pose.skate].arrival)
      fail(`${at}: the tracing is built from ${pose.skate}, which is off the ice ` +
        `at z=${pose[pose.skate].z.toFixed(2)} and is not changing hands`);

    /* Edges: the assertion below is that two blades share a lobe sense, and a
       skid has no edge to take a sense from. */
    const down = edgesDown(pose);
    if (down.length < 2) continue;
    twoFootFrames++;
    /* A blade on its own circle is on its own lobe by construction: that is what a
       track is. Its claim is held in section 6, against the line it draws. */
    if (down.some(w => pose[w].track)) { trackedFrames++; continue; }
    const senses = down.map(w => (BREAK === 'sense' && w !== pose.skate ? -1 : 1) *
      lobeSense(w, edgeOf(pose, w), dirOf(pose, w)));
    if (senses[0] !== senses[1])
      fail(`${id} f=${(i / (path.length - 1)).toFixed(3)}: ` +
        down.map((w, j) => `${w}${dirOf(pose, w)}${edgeOf(pose, w)} (${senses[j] > 0 ? '+1' : '-1'})`).join(' and ') +
        ' are on two different lobes, so they cannot be on one circle');
  }
}

/* ── 6: a blade on its own circle ─────────────────────────────────────
   04/10/2026, Session 33. rig-math.js, *a second blade on its own circle*. A track
   takes a second blade out of assertion 4 — the swizzle's two inside edges are on two
   lobes and must be — so this is what it answers to instead, and all three claims come
   from the line the renderer draws, not from the track that made it:

     a  THE KEYS SAY WHERE THE BLADE IS. Inside a track the keys' t, n and yaw do not
        place the foot, so they may not disagree with it by more than TRACK_AGREE.
     b  THE EDGE IS THE WAY THE LINE TURNS. The blade's contact in the world, rebuilt
        from poseAt per frame, turns frame to frame; wherever it turns by more than
        BEND, the sense of the turn is the lobeSense of the edge edgeOf reports. Where
        the edge is a flat the blade does not turn while it travels.
     c  THE BLADE POINTS ALONG ITS LINE. A gripping blade travels along itself, so the
        boot's heading and the direction its contact moves agree within ALONG, wherever
        it moves more than MOVES_BY. The pivot is where it does not move.

       --break=shared   the derived edge, as though the blades shared a circle ... 952
       --break=drift    every tracked key's t moved 3 cm ............................ 72
       --break=yaw      every tracked foot's yaw read as nought ...................... 826 */
const BEND = 0.05, ALONG = 4, MOVES_BY = 0.2;
let trackKeys = 0, trackLine = 0;
for (const [id, m] of Object.entries(MOVES)) {
  const runs = trackRuns(m);
  if (!runs.length) continue;
  const path = buildPath(m), n = path.length;
  for (const r of runs) {
    for (const k of m.keys) {
      if (k.t < r.from || k.t > r.to) continue;
      trackKeys++;
      const q = k[r.foot], g = trackedAt(r, k.t), dt = BREAK === 'drift' ? 3 : 0;
      const off = Math.max(Math.abs(q.t + dt - g.t), Math.abs(q.n - g.n), Math.abs((q.yaw || 0) - g.yaw));
      if (off > TRACK_AGREE)
        fail(`${where(id, k)}: ${r.foot}'s key says t ${q.t + dt}, n ${q.n}, yaw ${q.yaw}, and its track ` +
          `puts it at t ${g.t.toFixed(2)}, n ${g.n.toFixed(2)}, yaw ${g.yaw.toFixed(2)}`);
    }
    const w = r.foot, world = [];
    for (let i = 0; i < n; i++) {
      const tt = i / (n - 1), pose = poseAt(m, tt), p = path[i], q = pose[w];
      const T = [Math.cos(p.th), Math.sin(p.th)], N = [-Math.sin(p.th), Math.cos(p.th)];
      const hx = p.x - T[0]*(p.ot || 0) - N[0]*(p.on || 0), hy = p.y - T[1]*(p.ot || 0) - N[1]*(p.on || 0);
      const yaw = BREAK === 'yaw' ? 0 : (q.yaw || 0);
      world.push({ x: hx + T[0]*q.t + N[0]*q.n, y: hy + T[1]*q.t + N[1]*q.n, tt, pose,
                   head: p.th - yaw * Math.PI / 180, on: tt >= r.from && tt <= r.to });
    }
    for (let i = 1; i < n - 1; i++) {
      const a = world[i - 1], b = world[i], c = world[i + 1];
      if (!a.on || !c.on || onIceOf(b.pose, w) !== 'blade') continue;
      trackLine++;
      const at = `${id} f=${b.tt.toFixed(3)}`;
      const d1 = [b.x - a.x, b.y - a.y], d2 = [c.x - b.x, c.y - b.y];
      const l1 = Math.hypot(...d1), l2 = Math.hypot(...d2);
      if (l1 < MOVES_BY || l2 < MOVES_BY) continue;            // turning where it stands
      const bend = Math.atan2(d1[0]*d2[1] - d1[1]*d2[0], d1[0]*d2[0] + d1[1]*d2[1]) * 180 / Math.PI;
      const pose = b.pose;
      const edge = BREAK === 'shared'
        ? secondFoot({ foot: pose.skate, edge: pose.edge, dir: pose.dir }, dirOf(pose, w)).edge
        : edgeOf(pose, w);
      if (edge === 'O' || edge === 'I') {
        if (Math.abs(bend) > BEND && -Math.sign(bend) !== lobeSense(w, edge, dirOf(pose, w)))
          fail(`${at}: ${w} is reported on ${w}${dirOf(pose, w)}${edge}, and the line it draws turns ` +
            `${bend > 0 ? 'clockwise' : 'anticlockwise'} — that edge turns the other way`);
      } else if (Math.abs(bend) > BEND)
        fail(`${at}: ${w} is flat and its line turns ${bend.toFixed(2)}° in a frame`);
      /* The direction of travel: the chord through the frame. Backwards, the boot
         points the other way along it, and the heading here is the travel's. */
      const mv = Math.atan2(c.y - a.y, c.x - a.x);
      let diff = (mv - b.head) * 180 / Math.PI;
      diff = ((diff + 180) % 360 + 360) % 360 - 180;
      if (Math.abs(diff) > ALONG)
        fail(`${at}: ${w} is gripping and points ${diff.toFixed(1)}° off the line its contact is cutting`);
    }
  }
}

/* ── 5: against British Ice Skating's own pairs ──────────────────────── */
const BIS = join(ROOT, 'sources/bis');
const files = ['Skills 1.pdf', 'Skills 1-2026-10.pdf'].map(f => join(BIS, f)).filter(existsSync);
let pairs = 0;
if (!files.length) {
  console.log('  (Skills 1 not present — assertion 5 skipped)');
} else {
  const seen = new Set();
  for (const f of files) {
    let text = '';
    try { text = execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }); }
    catch { continue; }
    const flat = text.replace(/\s+/g, ' ');
    for (const m of flat.matchAll(/\(?\d*\)?\s*([LR][FB][OI])\s*&\s*([LR][FB][OI])\s+two[\s-]?foot/gi)) {
      const key = `${m[1]} ${m[2]}`.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      pairs++;
      const [f1, d1, e1] = m[1].toUpperCase();
      const want = m[2].toUpperCase();
      const got = label(secondFoot({ foot: f1, edge: e1, dir: d1 },
        BREAK === 'bis' ? (d1 === 'F' ? 'B' : 'F') : d1));
      if (got !== want)
        fail(`BIS writes "${m[1]} & ${m[2]} two-foot power change", but the model derives ` +
          `${m[1]}'s partner as ${got}`);
    }
  }
  if (!pairs) fail('no two-foot pairs found in Skills 1 — the extraction has stopped matching');
}

/* ── report ──────────────────────────────────────────────────────────── */
console.log(`  ${keys} keyframes, ${twoFoot} with two blades down`);
console.log(`  ${carried} authored per-foot fields, every one of them surviving poseAt`);
console.log(`  ${frames} frames, ${twoFootFrames} with two blades down, ${handoverFrames} foot-frames changing hands`);
console.log(`  ${pairs} two-foot pairs read out of British Ice Skating's Skills 1`);
console.log(`  ${trackKeys} keys on a second blade's own track agreeing with it, ${trackLine} frames of its line ` +
  `turning with its edge and running along its boot, ${trackedFrames} two-blade frames on two circles`);
console.log(bad
  ? `\n${bad} failure${bad === 1 ? '' : 's'}`
  : '\nevery contact claimed with the ice is touching it, every free foot is clear\n' +
    'or changing hands, every tracing is drawn from a blade on the ice, and both\n' +
    'blades of every two-foot pose are on one lobe, or each on its own line and turning with its edge');
process.exit(bad ? 1 : 0);
