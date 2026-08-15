/* The tracing must curve the way the model says it does.

   The derived tier is forty elements produced from one sign rule, so a single
   flipped sign would be wrong forty times over and look plausible every time —
   a curve on a screen is a curve either way round. This checks the picture
   against the rule for every combination there is, in ice coordinates.

   Screen y points down; the ice does not. That flip lives in edge-diagram.js and
   is the exact thing most likely to be got backwards, so it is asserted here
   rather than reasoned about.

       node tools/tracing.mjs
*/

import { buildTrace } from '../src/lib/edge-diagram.js';
import { lobeSense, label, exitState, lobeContinues, ALL_TURNS } from '../src/lib/skating.js';

const FEET = ['L', 'R'], DIRS = ['F', 'B'], EDGES = ['O', 'I'];
const STATES = FEET.flatMap(foot => DIRS.flatMap(dir => EDGES.map(edge => ({ foot, edge, dir }))));

let failures = 0;
const fail = m => { failures++; console.error(`  ✗ ${m}`); };

/* Heading over a run of frames, unwrapped. Positive dth is anticlockwise on
   screen, which is clockwise on the ice — hence the negation. */
function iceSense(frames, a, b) {
  let dth = 0;
  for (let i = a + 1; i <= b; i++) {
    let d = frames[i].th - frames[i - 1].th;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    dth += d;
  }
  if (Math.abs(dth) < 1e-6) return 0;
  return -Math.sign(dth);
}

/* Where the entry arc would end if nothing were drawn at the join. Recomputed here
   from the geometry rather than read back from the renderer — a checker that asks
   the thing it is checking is not checking anything. */
const RADIUS = 120, SPAN = 96 * Math.PI / 180, CUSP = 15;
function idealJoin(state) {
  const k = -lobeSense(state.foot, state.edge, state.dir) / RADIUS;
  const L = SPAN * RADIUS;
  return { x: Math.sin(k * L) / k, y: -(Math.cos(k * L) - 1) / k };
}

const COMBINATIONS = STATES.length * (1 + Object.keys(ALL_TURNS).length + 8);
console.log(`tracing direction (the picture against the rule, all ${COMBINATIONS} combinations)\n`);

for (const s of STATES) {
  const { frames } = buildTrace({ entry: s, turn: null });
  const want = lobeSense(s.foot, s.edge, s.dir);
  const got = iceSense(frames, 0, frames.length - 1);
  if (got !== want) fail(`${label(s)} traces ${got > 0 ? 'anticlockwise' : 'clockwise'}, model says ${want > 0 ? 'anticlockwise' : 'clockwise'}`);
}

for (const s of STATES) for (const turnKey of Object.keys(ALL_TURNS)) {
  const t = ALL_TURNS[turnKey];
  const x = exitState(s, turnKey);
  const { frames, marks } = buildTrace({ entry: s, turn: turnKey });
  const m = marks[0];
  const name = `${label(s)} ${turnKey}`;

  const inSense = iceSense(frames, 0, m.idx);
  const outSense = iceSense(frames, m.after, frames.length - 1);
  if (inSense !== lobeSense(s.foot, s.edge, s.dir)) fail(`${name}: entry lobe curves the wrong way`);
  if (outSense !== lobeSense(x.foot, x.edge, x.dir)) fail(`${name}: exit lobe curves the wrong way`);
  if ((inSense === outSense) !== lobeContinues(s, turnKey))
    fail(`${name}: drawn lobes ${inSense === outSense ? 'continue' : 'reverse'}, model says the opposite`);

  /* Direction of travel is the line between a turn and a transition, so it is
     asserted rather than assumed. */
  const reversed = frames[m.after].state.dir !== frames[m.idx].state.dir;
  if (reversed !== (t.reversesDir !== false))
    fail(`${name}: direction ${reversed ? 'reverses' : 'holds'}, model says the opposite`);

  const gap = Math.hypot(frames[m.idx + 1].x - frames[m.idx].x, frames[m.idx + 1].y - frames[m.idx].y);
  /* How far the join has been pulled off the plain arc. A cusp is a displacement;
     a roll, a loop and a step are not. */
  const ideal = idealJoin(s);
  const pulled = Math.hypot(frames[m.idx].x - ideal.x, frames[m.idx].y - ideal.y);

  if (t.join === 'step') {
    /* Nothing pivots, so nothing may be drawn pivoting: a real break, and the
       other foot on the far side of it. */
    if (!m.stepped) { fail(`${name}: drawn without a step`); continue; }
    if (gap < 5) fail(`${name}: no visible step — the blades are ${gap.toFixed(1)} apart`);
    if (frames[m.idx].state.foot === frames[m.after].state.foot)
      fail(`${name}: the same foot on both sides of a change of foot`);
    continue;
  }

  if (m.stepped) fail(`${name}: one-foot element drawn with a step in it`);

  if (t.join === 'roll') {
    /* A change of edge has nothing to see at the join. A gap or a kink here would
       be drawing a turn that is not being done. */
    if (gap > 3) fail(`${name}: a change of edge should not break the tracing (gap ${gap.toFixed(1)})`);
    if (pulled > 2) fail(`${name}: a cusp has been drawn on a change of edge (${pulled.toFixed(1)} off the arc)`);
    let dth = frames[m.idx + 1].th - frames[m.idx].th;
    while (dth > Math.PI) dth -= 2 * Math.PI;
    while (dth < -Math.PI) dth += 2 * Math.PI;
    if (Math.abs(dth) > 0.05) fail(`${name}: heading jumps ${(dth * 180 / Math.PI).toFixed(1)}° at the roll`);
    continue;
  }

  if (t.join === 'loop') {
    /* The loop must actually close: a full turn in the lobe's own direction,
       ending where it began. */
    let dth = 0;
    for (let i = m.loopFrom + 1; i <= m.loopTo; i++) {
      let d = frames[i].th - frames[i - 1].th;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      dth += d;
    }
    if (Math.abs(Math.abs(dth) - 2 * Math.PI) > 0.05)
      fail(`${name}: the loop turns ${(dth * 180 / Math.PI).toFixed(0)}°, not a full circle`);
    if (-Math.sign(dth) !== lobeSense(s.foot, s.edge, s.dir))
      fail(`${name}: the loop curves against its own lobe`);
    const back = Math.hypot(frames[m.loopTo].x - frames[m.loopFrom - 1].x,
                            frames[m.loopTo].y - frames[m.loopFrom - 1].y);
    if (back > 2) fail(`${name}: the loop does not close (${back.toFixed(1)} out)`);
    if (pulled > 2) fail(`${name}: a cusp has been drawn on a loop (${pulled.toFixed(1)} off the arc)`);
    continue;
  }

  /* The cusp points into the circle when the skater rotates into it and out of
     it when they do not. That is the entire visible difference between a three
     turn and a bracket, so it gets asserted rather than eyeballed. */
  const p = frames[m.idx - 1];
  const k = -lobeSense(s.foot, s.edge, s.dir) / 120;
  const cx = p.x - Math.sin(p.th) / k, cy = p.y + Math.cos(p.th) / k;
  const apex = frames[m.idx];
  const r = Math.hypot(apex.x - cx, apex.y - cy);
  if (Math.abs(pulled - CUSP) > 1)
    fail(`${name}: cusp is ${pulled.toFixed(1)} deep, should be about ${CUSP}`);
  const inward = r < Math.abs(1 / k);
  if (inward !== t.rotatesInto)
    fail(`${name}: cusp points ${inward ? 'into' : 'out of'} the circle, should be the other way`);
}

/* Combinations chain the same rule, so the drawing must chain with it: one mark per
   turn, in order, each with the right kind of join and the right lobe after it. A
   cluster that quietly drew two turns where three were asked for would look entirely
   plausible. */
const CHAINS = [
  ['three', 'three'], ['three', 'mohawk'], ['rocker', 'counter'], ['bracket', 'counter'],
  ['counter', 'three'], ['counter', 'mohawk'], ['rocker', 'choctaw'],
  ['choctaw', 'three', 'rocker'],
];

for (const s of STATES) for (const chain of CHAINS) {
  const { frames, marks, states } = buildTrace({ entry: s, turns: chain });
  const name = `${label(s)} ${chain.join('-')}`;

  if (marks.length !== chain.length) {
    fail(`${name}: ${marks.length} turns drawn, ${chain.length} asked for`); continue;
  }
  if (states.length !== chain.length + 1) { fail(`${name}: wrong number of states`); continue; }

  for (let n = 0; n < chain.length; n++) {
    const t = ALL_TURNS[chain[n]];
    if (marks[n].stepped !== (t.join === 'step'))
      fail(`${name}: turn ${n + 1} (${chain[n]}) drawn as a ${marks[n].stepped ? 'step' : 'pivot'}`);
    if (label(states[n + 1]) !== label(exitState(states[n], chain[n])))
      fail(`${name}: turn ${n + 1} lands on the wrong edge`);

    const a = n === 0 ? 0 : marks[n - 1].after;
    const seg = iceSense(frames, a, marks[n].idx);
    if (seg !== lobeSense(states[n].foot, states[n].edge, states[n].dir))
      fail(`${name}: the lobe into turn ${n + 1} curves the wrong way`);
  }
  const last = marks.at(-1);
  const tail = iceSense(frames, last.after, frames.length - 1);
  const x = states.at(-1);
  if (tail !== lobeSense(x.foot, x.edge, x.dir)) fail(`${name}: the exit lobe curves the wrong way`);

  /* Marks must run in order along the tracing, or the animation would rotate the
     skater through a turn it has not reached yet. */
  for (let n = 1; n < marks.length; n++)
    if (marks[n].idx <= marks[n - 1].idx) fail(`${name}: turn ${n + 1} is drawn before turn ${n}`);
}

if (failures) { console.error(`\n${failures} tracing check(s) failed`); process.exit(1); }
console.log('every tracing curves the way the model says, and every cusp points the right way');
