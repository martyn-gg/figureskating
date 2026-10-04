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
 * And for the jump combinations (Session 28, 04/10/2026), the same both ways:
 *
 *   5. every kind:combo page names two jumps and a count that comboAt accepts, so its
 *      second jump takes off where its first lands; its name and ISU code are comboAt's,
 *      and its prerequisites are the two jumps' pages;
 *   6. every combination in ALL_COMBOS has exactly one page;
 *   7. a combination is drawn exactly when moves.js has a rig for its two jumps, and that
 *      rig is the two jumps' rigs joined: the first's keys unchanged up to its deepest
 *      landing key, the second's from its deepest key before the takeoff, a whole number
 *      of turns round, every key's pose otherwise the jump's own.
 *
 * Assertion 4 is what keeps doubleOf honest. A double that landed 359 or 361 degrees
 * further round would land facing slightly the wrong way, and nothing else here looks.
 *
 *   node tools/jumps.mjs
 *   node tools/jumps.mjs --break=name    double pages named as singles: fails 6
 *   node tools/jumps.mjs --break=turn    doubles a turn and a degree round: fails 32 checks
 *   node tools/jumps.mjs --break=combo   every second jump read as a flip: fails 104 (52 pages, 52 combinations unpaged)
 *   node tools/jumps.mjs --break=join    second jumps a degree further round: fails 132
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { ALL_JUMPS, ALL_COMBOS, comboAt, jumpAt, JUMPS, label } from '../src/lib/skating.js';
import { MOVES } from '../src/lib/moves.js';

const brk = (process.argv.find(a => a.startsWith('--break=')) || '').slice(8);
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'elements');
let bad = 0, checks = 0;
const fail = m => { bad++; if (bad <= 30) console.log(`  x ${m}`); };

const all = readdirSync(DIR).filter(f => f.endsWith('.md')).map(f => {
  const fm = yaml.load(readFileSync(join(DIR, f), 'utf8').split(/^---$/m)[1]);
  return { id: f.replace(/\.md$/, ''), ...fm };
});
const pages = all.filter(p => p.kind === 'jump');
const combos = all.filter(p => p.kind === 'combo');

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
    ['landing', label(j.landing), label(m.landing)],
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

/* 5 and 6: the combination pages against comboAt. */
const seenC = new Map();
const pageOfJump = j => pages.find(q => q.jump?.of === j.key && (q.jump.count ?? 1) === j.count);
for (const p of combos) {
  const c0 = p.combo || {};
  const count = c0.count ?? 1;
  const second = brk === 'combo' ? 'flip' : c0.second;
  checks++;
  let c;
  try { c = comboAt(c0.first, second, count, c0.third ?? null); } catch (e) { fail(`${p.id}: ${e.message}`); continue; }
  const want = [
    ['name', p.name, c.name],
    ['ISU code', (p.aliases || []).find(a => a.includes('+')) ?? null, c.code],
    ['prerequisites', (p.prerequisites || []).join(', '), c.jumps.map(j => pageOfJump(j)?.id).join(', ')],
  ];
  for (const [what, got, exp] of want) { checks++; if (got !== exp) fail(`${p.id}: ${what} is ${got}, the model says ${exp}`); }
  if (seenC.has(c.key)) fail(`${p.id}: a second page for ${c.name} (first: ${seenC.get(c.key)})`);
  seenC.set(c.key, p.id);
}
for (const c of ALL_COMBOS) { checks++; if (!seenC.has(c.key)) fail(`no page for ${c.name}`); }

/* 7: the combination rigs. The rig name is derived the way gen-derived.mjs derives it,
   from the jumps' rigs; the expectation of WHICH combinations are drawn comes from
   moves.js, not from the pages. */
let comboRigs = 0;
const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
const rigOfJump = j => (j.count === 2 ? `double${cap(j.key)}` : j.key);
for (const p of combos) {
  const c0 = p.combo || {};
  let c; try { c = comboAt(c0.first, c0.second, c0.count ?? 1, c0.third ?? null); } catch { continue; }
  /* No three-jump combination is drawn: the Euler has no rig. */
  if (c.third) { checks++; if (p.rig) fail(`${p.id}: drawn, but the Euler has no rig`); continue; }
  const A = MOVES[rigOfJump(c.first)], B = MOVES[rigOfJump(c.second)];
  const name = `${rigOfJump(c.first)}${cap(rigOfJump(c.second))}`;
  checks++;
  if (Boolean(MOVES[name]) !== Boolean(p.rig) || (p.rig && p.rig !== name)) {
    fail(`${p.id}: rig is ${p.rig ?? 'none'}, moves.js ${MOVES[name] ? `has ${name}` : `has no ${name}`}`);
    continue;
  }
  if (!p.rig) continue;
  if (!A || !B) { fail(`${p.id}: drawn, but ${!A ? c.first.name : c.second.name} has no rig of its own`); continue; }
  comboRigs++;
  const M = MOVES[name], { land, bend, turn } = M.combo;
  const t2 = brk === 'join' ? turn + 1 : turn;
  checks++;
  if (turn % 360 !== 0) fail(`${p.id}: the second jump is ${turn} degrees round, not a whole number of turns`);
  const nb = B.keys.length - bend;
  checks++;
  if (M.keys.length !== land + 1 + 2 + nb) { fail(`${p.id}: ${M.keys.length} keys, expected ${land + 1 + 2 + nb}`); continue; }
  const same = (k, j, off, where) => {
    for (const f of ['hipZ', 'hipYaw', 'shYaw', 'skate', 'edge', 'dir']) {
      checks++;
      const exp = (f === 'hipYaw' || f === 'shYaw') ? j[f] + off : j[f];
      const got = (f === 'hipYaw' || f === 'shYaw') && off ? k[f] - (t2 - turn) : k[f];
      if (got !== exp) fail(`${p.id} ${where}: ${f} ${got}, the jump's ${exp}`);
    }
    for (const w of ['L', 'R', 'sh']) for (const q of ['t', 'n', 'z']) {
      checks++;
      if (k[w]?.[q] !== j[w]?.[q]) fail(`${p.id} ${where}: ${w}.${q} ${k[w]?.[q]}, the jump's ${j[w]?.[q]}`);
    }
  };
  for (let i = 0; i <= land; i++) same(M.keys[i], A.keys[i], 0, `key ${i} (first jump)`);
  for (let i = 0; i < nb; i++) same(M.keys[land + 3 + i], B.keys[bend + i], turn, `key ${land + 3 + i} (second jump)`);
  /* The clock: every key later than the one before it. */
  for (let i = 1; i < M.keys.length; i++) { checks++; if (!(M.keys[i].t > M.keys[i - 1].t)) fail(`${p.id} key ${i}: t ${M.keys[i].t} not after ${M.keys[i - 1].t}`); }
}

console.log(`${combos.length} combination pages, ${ALL_COMBOS.length} in the model, ${comboRigs} drawn from their jumps' rigs`);
console.log(`${pages.length} jump pages, ${ALL_JUMPS.length} jumps in the model, ${rigs} doubles drawn against their singles: ` +
  `${checks} checks, ${bad} failed`);
process.exit(bad ? 1 : 0);
