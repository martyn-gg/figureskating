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

   2  A FOOT ON THE ICE IS ON THE ICE, AND A FREE FOOT IS NOT. Within 3 cm and
      at least 5 cm respectively. Blade or pick: a pick that is not touching is not
      a pick, and the teeth reach the ice or they do not — the existing poses sit at 0-2 and 10-117, so
      there is a real gap between them and nothing has to be nudged to pass.
      This is the assertion model.md asked for: the lunge "would have passed
      every checker with the trailing foot lifted 30 cm", and authoring a second
      blade at free-foot height is the same cheat in the other direction.

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

       node tools/twofoot.mjs
       node tools/twofoot.mjs --break=air|float|apart|sense|bis
*/
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './_rig.mjs';
import { MOVES } from '../src/lib/moves.js';
import { lobeSense, secondFoot, label } from '../src/lib/skating.js';
import { onIceOf, edgeOf, dirOf, bladesDown, contactsDown, buildPath, poseAt } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const ON_ICE = 3, CLEAR = 5, NEAR = 5, FAR = 70;

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
    const down = bladesDown(k), touching = contactsDown(k);

    if (k.skate && !down.includes(k.skate))
      fail(`${where(id, k)}: skate is ${k.skate}, which is not on the ice`);
    /* Any contact, not just a blade. A pick jabbed into the ice under a skater in
       mid-air is the same lie as a second blade there, and reads worse. */
    if (!k.skate && touching.length)
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

/* ── 4: one lobe, every frame, through poseAt ────────────────────────── */
let frames = 0, twoFootFrames = 0;
for (const [id, m] of Object.entries(MOVES)) {
  const path = buildPath(m);
  for (let i = 0; i < path.length; i++) {
    const pose = poseAt(m, i / (path.length - 1));
    frames++;
    const down = bladesDown(pose);
    if (down.length < 2) continue;
    twoFootFrames++;
    const senses = down.map(w => (BREAK === 'sense' && w !== pose.skate ? -1 : 1) *
      lobeSense(w, edgeOf(pose, w), dirOf(pose, w)));
    if (senses[0] !== senses[1])
      fail(`${id} f=${(i / (path.length - 1)).toFixed(3)}: ` +
        down.map((w, j) => `${w}${dirOf(pose, w)}${edgeOf(pose, w)} (${senses[j] > 0 ? '+1' : '-1'})`).join(' and ') +
        ' are on two different lobes, so they cannot be on one circle');
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
console.log(`  ${frames} frames, ${twoFootFrames} with two blades down`);
console.log(`  ${pairs} two-foot pairs read out of British Ice Skating's Skills 1`);
console.log(bad
  ? `\n${bad} failure${bad === 1 ? '' : 's'}`
  : '\nevery contact claimed with the ice is touching it, every free foot is clear,\n' +
    'and both blades of every two-foot pose are on one lobe');
process.exit(bad ? 1 : 0);
