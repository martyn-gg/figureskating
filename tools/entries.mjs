/* EVERY ENTRANCE ARRIVES WHERE ITS ELEMENT STARTS — 04/10/2026, Session 34.

   docs/model.md, "Entrances and exits". An entrance is its own run of path and keys,
   joined to an element's core at the core's first key; the default entrance is the one
   the move was written with, and a second is `<id>@<entrance>` in MOVES. What could go
   wrong is the join, so that is what this holds, from outside the code that makes it:

   1. EVERY ENTRANCE NAMED EXISTS. Each element in ENTRIES has a move, its entrance ids
      are unique, and every variant after the first is built.
   2. THE TWO HALVES ARE ONE MOVEMENT. A built variant's entrance was written to arrive on
      some foot, edge, direction and facing (its last key, dropped at the join); the core's
      first key must agree on the first three exactly and on facing within FACING degrees,
      once whole turns are taken out. The arrival is read off the SOURCE move's key on the
      boundary, not off anything withEntry recorded.
   3. THE SPLICE IS EXACT. Every authored move with a default entrance is cut at its join
      and put back together with withEntry; the keys must come back identical (t within
      1e-9, every other field equal) and the path the same segments in the same
      proportions. If this holds, a variant built the same way is the two halves and
      nothing else.
   4. EVERY JUMP AND SPIN WITH A BODY HAS AN ENTRANCE, OR IS DECLARED. `waiting` names the
      ones that do not yet and what each waits on; a declared move that gains an entrance
      fails, so the list cannot go stale.
   5. EVERY JUMP AND SPIN ENDS ON AN EXIT: its last segment is on the ice and its last key
      has a skating foot.

   Broken on purpose (each restored after):
       --break=edge     every built entrance read as arriving on the other edge .. 7 entrances
       --break=facing   the core's first key turned 90 degrees ................... 7 entrances
       --break=splice   withEntry's rebuilt keys shifted one frame ............... 102 keys, 6 moves
       --break=stale    the Salchow declared as waiting .......................... 1

       node tools/entries.mjs [--break=edge|facing|splice|stale] */
import { MOVES, ENTRIES, CORES, sliceMove, withEntry, boundsOf } from '../src/lib/moves.js';
import { readFile, readdir } from 'node:fs/promises';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const FACING = 20;
let bad = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { bad++; console.log('  FAIL ' + msg); } };

/* Jumps and spins with a body, from the element pages themselves. */
const pages = [];
for (const f of await readdir('src/data/elements')) {
  const txt = await readFile(`src/data/elements/${f}`, 'utf8');
  const kind = /^kind:\s*(\w+)/m.exec(txt)?.[1], rig = /^rig:\s*(\w+)/m.exec(txt)?.[1];
  if ((kind === 'jump' || kind === 'spin') && rig) pages.push({ f, kind, rig });
}
/* move → what its entrance waits on. Remove a line when the entrance is drawn. */
const waiting = {
  waltz:       'a step forward onto LFO from a back edge, or back crossovers: the rig has neither',
  axel:        'a step forward onto LFO from a back edge, or back crossovers: the rig has neither',
  doubleAxel:  'the Axel\'s',
  lutz:        'back crossovers into the corner: the rig has no crossover',
  doubleLutz:  'the Lutz\'s',
  backSpin:    'a standing pivot wound up, or a step and a three turn onto RBO',
  twoFootSpin: 'a standstill wind-up: the spin starts gliding and has nowhere to wind from',
  camelSpin:   'the free leg rising straight from low behind to above the hip: this rig bends the knee on the way (moves.js)',
};
if (BREAK === 'stale') waiting.salchow = 'broken on purpose';

console.log('1. every entrance named exists');
for (const [id, E] of Object.entries(ENTRIES)) {
  ok(MOVES[id], `${id} is in ENTRIES and not in MOVES`);
  const ids = E.list.map(v => v.id);
  ok(new Set(ids).size === ids.length, `${id}: entrance ids repeat (${ids})`);
  for (const v of E.list.slice(1)) ok(MOVES[`${id}@${v.id}`], `${id}@${v.id} is named and not built`);
}

/* And the other way: nothing in MOVES calls itself an entrance that ENTRIES does not name,
   since rig-names.mjs lets an `@` move borrow its element's page. */
for (const key of Object.keys(MOVES).filter(k => k.includes('@'))) {
  const [id, v] = key.split('@');
  ok(ENTRIES[id]?.list.some(x => x.id === v), `${key} is in MOVES and ENTRIES does not name it`);
}

console.log('2. every built entrance arrives where its core starts');
let variants = 0;
for (const [id, E] of Object.entries(ENTRIES)) for (const [i, v] of E.list.entries()) {
  /* A built entrance: any after the first, or a first that was built rather than authored
     (the spins'). */
  const m = MOVES[i ? `${id}@${v.id}` : id]; if (!m || !v.from || !m.entrance) continue;
  variants++;
  const [src, j] = v.from, S = MOVES[src], tb = boundsOf(S)[j];
  const arrive = { ...S.keys.find(k => Math.abs(k.t - tb) < 1e-6) };
  if (BREAK === 'edge') arrive.edge = arrive.edge === 'O' ? 'I' : 'O';
  /* The element's first key: in the variant, or (a spin that keeps its entrance's key at the
     join) the spin as it stood, in CORES. */
  const at = m.entrance.at, first = { ...(CORES[id]?.keys[0] ?? m.keys.find(k => Math.abs(k.t - at) < 1e-6)) };
  if (BREAK === 'facing') first.hipYaw += 90;
  ok(arrive.skate !== undefined && first.skate !== undefined, `${id}@${v.id}: no key on the join`);
  ok(arrive.skate === first.skate && arrive.edge === first.edge && arrive.dir === first.dir,
    `${id}@${v.id}: the entrance arrives on ${arrive.skate}${arrive.dir}${arrive.edge}, the element starts on ${first.skate}${first.dir}${first.edge}`);
  const d = ((arrive.hipYaw - first.hipYaw) % 360 + 540) % 360 - 180;
  ok(Math.abs(d) <= FACING, `${id}@${v.id}: the entrance arrives facing ${arrive.hipYaw}, the element starts at ${first.hipYaw} (${d.toFixed(0)} apart)`);
}

console.log('3. the splice is exact');
let rebuilt = 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [id, E] of Object.entries(ENTRIES)) {
  const m = MOVES[id]; if (!m || !E.join || m.entrance) continue;
  rebuilt++;
  const r = withEntry(sliceMove(m, 0, E.join), sliceMove(m, E.join), m.name, m.note);
  const shift = BREAK === 'splice' ? 1 / 320 : 0;
  ok(r.keys.length === m.keys.length, `${id}: ${r.keys.length} keys rebuilt from ${m.keys.length}`);
  r.keys.forEach((k, i) => {
    const o = m.keys[i]; if (!o) return;
    const { t: tk, ...rk } = k, { t: to, ...ro } = o;
    ok(Math.abs(tk + shift - to) < 1e-9 && same(rk, ro), `${id}: key ${i} (${o.ph}) does not come back as written`);
  });
  const b1 = boundsOf(r), b0 = boundsOf(m);
  ok(b1.length === b0.length && b1.every((x, i) => Math.abs(x - b0[i]) < 1e-9)
     && r.path.every((g, i) => g.kind === m.path[i].kind && g.sweep === m.path[i].sweep && g.turn === m.path[i].turn),
     `${id}: the path does not come back as written`);
}

console.log('4. every jump and spin with a body has an entrance, or says why not');
for (const p of pages) {
  const has = !!ENTRIES[p.rig];
  if (waiting[p.rig]) ok(!has, `${p.rig} is declared as waiting (${waiting[p.rig]}) and has an entrance: remove the line`);
  else ok(has, `${p.rig} (${p.f}) has no entrance and is not declared`);
}

console.log('5. every jump and spin ends on an exit');
for (const p of pages) {
  const m = MOVES[p.rig], last = m.path[m.path.length - 1], k = m.keys[m.keys.length - 1];
  ok(last.kind === 'arc' && k.skate, `${p.rig}: ends ${last.kind} with ${k.skate ? 'a' : 'no'} skating foot`);
}

const w = Object.keys(waiting).length;
if (bad) { console.log(`\n${bad} of ${checks} checks failed`); process.exit(1); }
console.log(`${pages.length} jump and spin pages, ${Object.keys(ENTRIES).length} with an entrance, ${w} declared waiting; ` +
  `${variants} built entrances arrive where their element starts; ${rebuilt} authored entrances splice back exactly: ${checks} checks, 0 failed`);
