/* JUMPS — 04/10/2026, with the doubles.
 *
 * A jump page writes out what skating.js's jumpAt(of, count) already knows: its name,
 * takeoff, landing, pick and rotations. Two copies of a fact is this repository's
 * recurring failure, so this holds every page to the model, and the model to the pages:
 *
 *   1. every kind:jump page names a jump (`of`) and a count the model holds;
 *   2. its name, takeoff, landing, assisted and rotations are jumpAt(of, count)'s;
 *   3. every jump at every count the model holds has exactly one page;
 *   4. a double's rig is its single's with one more turn: up to the blade leaving the ice
 *      it is the single, key for key, and from touchdown on every key is the single's
 *      a whole turn (360 degrees) further round, hips and shoulders both.
 *
 * Assertion 4 is what keeps doubleOf honest. A double that landed 359 or 361 degrees
 * further round would land facing slightly the wrong way, and nothing else here looks.
 *
 *   node tools/jumps.mjs
 *   node tools/jumps.mjs --break=name    double pages named as singles: fails 6
 *   node tools/jumps.mjs --break=turn    doubles a turn and a degree round: fails 32 checks
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { ALL_JUMPS, jumpAt, JUMPS, label } from '../src/lib/skating.js';
import { MOVES } from '../src/lib/moves.js';

const brk = (process.argv.find(a => a.startsWith('--break=')) || '').slice(8);
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'elements');
let bad = 0, checks = 0;
const fail = m => { bad++; if (bad <= 30) console.log(`  x ${m}`); };

const pages = readdirSync(DIR).filter(f => f.endsWith('.md')).map(f => {
  const fm = yaml.load(readFileSync(join(DIR, f), 'utf8').split(/^---$/m)[1]);
  return { id: f.replace(/\.md$/, ''), ...fm };
}).filter(p => p.kind === 'jump');

const seen = new Map();
for (const p of pages) {
  const j = p.jump || {};
  const count = j.count ?? 1;
  checks++;
  if (!JUMPS[j.of]) { fail(`${p.id}: names no jump in JUMPS (of: ${j.of})`); continue; }
  let m;
  try { m = jumpAt(j.of, count); } catch (e) { fail(`${p.id}: ${e.message}`); continue; }
  const name = brk === 'name' && count === 2 ? JUMPS[j.of].name : p.name;
  const want = [
    ['name', name, m.name],
    ['takeoff', label(j.takeoff), label(m.takeoff)],
    ['landing', label(j.landing), 'RBO'],
    ['assisted', j.assisted, m.assisted],
    ['rotations', j.rotations, m.rotations],
  ];
  for (const [what, got, exp] of want) { checks++; if (got !== exp) fail(`${p.id}: ${what} is ${got}, the model says ${exp}`); }
  const key = `${j.of}@${count}`;
  if (seen.has(key)) fail(`${p.id}: a second page for ${m.name} (first: ${seen.get(key)})`);
  seen.set(key, p.id);
}
for (const m of ALL_JUMPS) { checks++; if (!seen.has(`${m.key}@${m.count}`)) fail(`no page for ${m.name}`); }

/* 4: each double's rig against its single's. */
let rigs = 0;
for (const p of pages.filter(p => (p.jump?.count ?? 1) === 2 && p.rig)) {
  const single = pages.find(q => q.jump?.of === p.jump.of && (q.jump.count ?? 1) === 1);
  const D = MOVES[p.rig], S = single && MOVES[single.rig];
  if (!D || !S) { fail(`${p.id}: rig ${p.rig} or its single's rig is missing`); continue; }
  rigs++;
  if (D.keys.length !== S.keys.length) { fail(`${p.id}: ${D.keys.length} keys against the single's ${S.keys.length}`); continue; }
  const first = S.keys.findIndex(k => k.skate === null), down = S.keys.findIndex((k, i) => i > first && k.skate !== null);
  const turn = brk === 'turn' ? 361 : 360;
  D.keys.forEach((k, i) => {
    const s = S.keys[i];
    for (const f of ['hipYaw', 'shYaw']) {
      checks++;
      const exp = i <= first ? s[f] : i >= down ? s[f] + 360 : null;
      const got = i >= down ? k[f] - (turn - 360) : k[f];
      if (exp !== null && Math.abs(got - exp) > 1e-9) fail(`${p.id} key ${i} (t ${k.t}): ${f} ${got}, the single's ${s[f]}${i >= down ? ' + 360' : ''}`);
      if (exp === null && !(got > D.keys[i - 1][f] - 1e-9)) fail(`${p.id} key ${i}: ${f} turns backwards in the air`);
    }
  });
}

console.log(`${pages.length} jump pages, ${ALL_JUMPS.length} jumps in the model, ${rigs} doubles drawn against their singles: ` +
  `${checks} checks, ${bad} failed`);
process.exit(bad ? 1 : 0);
