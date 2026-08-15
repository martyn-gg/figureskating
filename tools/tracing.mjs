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
  const { frames, turnIdx, stepped } = buildTrace({ entry: s, turn: turnKey });
  const name = `${label(s)} ${turnKey}`;

  const inSense = iceSense(frames, 0, turnIdx);
  const outSense = iceSense(frames, turnIdx + (stepped ? 1 : 0), frames.length - 1);
  if (inSense !== lobeSense(s.foot, s.edge, s.dir)) fail(`${name}: entry lobe curves the wrong way`);
  if (outSense !== lobeSense(x.foot, x.edge, x.dir)) fail(`${name}: exit lobe curves the wrong way`);
  if ((inSense === outSense) !== lobeContinues(s, turnKey))
    fail(`${name}: drawn lobes ${inSense === outSense ? 'continue' : 'reverse'}, model says the opposite`);

  if (t.changesFoot) {
    /* Nothing pivots, so nothing may be drawn pivoting. The two tracings must be
       separate blades: a real gap at the step, and the boot must change foot. */
    if (!stepped) { fail(`${name}: two-foot turn drawn as a one-foot turn`); continue; }
    const gap = Math.hypot(frames[turnIdx + 1].x - frames[turnIdx].x,
                           frames[turnIdx + 1].y - frames[turnIdx].y);
    if (gap < 5) fail(`${name}: no visible step — the two blades are ${gap.toFixed(1)} apart`);
    if (frames[turnIdx].state.foot === frames[turnIdx + 1].state.foot)
      fail(`${name}: the same foot on both sides of a change of foot`);
    if (frames[turnIdx + 1].state.dir === frames[turnIdx].state.dir)
      fail(`${name}: direction of travel not reversed at the step`);
    continue;
  }

  if (stepped) fail(`${name}: one-foot turn drawn with a step in it`);

  /* The cusp points into the circle when the skater rotates into it and out of
     it when they do not. That is the entire visible difference between a three
     turn and a bracket, so it gets asserted rather than eyeballed. */
  const p = frames[turnIdx - 1];
  const k = -lobeSense(s.foot, s.edge, s.dir) / 120;
  const cx = p.x - Math.sin(p.th) / k, cy = p.y + Math.cos(p.th) / k;
  const apex = frames[turnIdx];
  const r = Math.hypot(apex.x - cx, apex.y - cy);
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
    if (marks[n].stepped !== !!t.changesFoot)
      fail(`${name}: turn ${n + 1} (${chain[n]}) drawn as a ${marks[n].stepped ? 'step' : 'pivot'}`);
    if (label(states[n + 1]) !== label(exitState(states[n], chain[n])))
      fail(`${name}: turn ${n + 1} lands on the wrong edge`);

    const a = n === 0 ? 0 : marks[n - 1].idx + (marks[n - 1].stepped ? 1 : 0);
    const seg = iceSense(frames, a, marks[n].idx);
    if (seg !== lobeSense(states[n].foot, states[n].edge, states[n].dir))
      fail(`${name}: the lobe into turn ${n + 1} curves the wrong way`);
  }
  const last = marks.at(-1);
  const tail = iceSense(frames, last.idx + (last.stepped ? 1 : 0), frames.length - 1);
  const x = states.at(-1);
  if (tail !== lobeSense(x.foot, x.edge, x.dir)) fail(`${name}: the exit lobe curves the wrong way`);

  /* Marks must run in order along the tracing, or the animation would rotate the
     skater through a turn it has not reached yet. */
  for (let n = 1; n < marks.length; n++)
    if (marks[n].idx <= marks[n - 1].idx) fail(`${name}: turn ${n + 1} is drawn before turn ${n}`);
}

if (failures) { console.error(`\n${failures} tracing check(s) failed`); process.exit(1); }
console.log('every tracing curves the way the model says, and every cusp points the right way');
