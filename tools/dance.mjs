/* THE PATTERN DANCES HOLD TOGETHER — 03/10/2026, Session 26, with the first five.

   Every step list in src/data/elements with a `dance` block is read off a dance diagram
   by eye, which is the step most likely to go wrong, so this asserts what a diagram
   cannot get wrong if it was read right:

   1  THE STEPS ARE NUMBERED 1 TO N with none missing or repeated.
   2  THE FEET ALTERNATE. Every step in a pattern dance is a change of foot, including
      from the last step back round to the first, because the pattern repeats.
   3  THE BEATS COME TO WHOLE BARS, from the dance's own meter.
   4  A CHANGE OF EDGE is written with both letters and carries two counts, and nothing
      else does.

   And it REPORTS, without failing, every step whose `how` names an element the guide
   has but whose model lands on a different edge from the one the dance writes. That is
   the guide's model and a governing body disagreeing, and it is information, not a
   misread: the forward cross steps behind in the Rhythm Blues and the Fiesta Tango
   change edge, where the guide's crossed step behind, taken from British Ice Skating's
   backward ones, holds it.

   AND THE MEASURED PATTERNS (src/data/patterns, drawn by components/DancePattern.astro),
   added the same day. A pattern is traced off a diagram stroke by stroke, and the
   step each stroke is filed under is the thing most likely to slip by one. So each
   pattern must have exactly the dance's steps, in order; consecutive steps must meet
   (a gap of more than 1.5 m is a stroke filed under the wrong step); every point
   must be on the ice; the edge each stroke's label names on the diagram must be the
   edge the step list gives; and where the diagram prints a beat numeral beside a
   step (U.S. Figure Skating's do), it must be that step's beats. The last two hold
   the diagram against a step list typed separately from it.

   Broken on purpose:
     --break=foot     step 2 of the first dance onto the wrong foot ...... 3 (both its neighbours,
                      and the diagram's label for it)
     --break=beat     one beat added to the first step of every dance ... the dances, and the
                      patterns whose diagrams print beats
     --break=pattern  the first pattern's step labels moved along by one . every edge that differs

       node tools/dance.mjs
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { stepLink, totalBeats, patternBeats, expectedBeats, rowBeats, edgeOfCode } from '../src/lib/dance.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'elements');
const PAT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'patterns');
const patterns = Object.fromEntries(readdirSync(PAT).filter(f => f.endsWith('.json'))
  .map(f => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(PAT, f), 'utf8'))]));
let drawn = 0, firstPattern = true;
/* The coordinates of an SVG path's "M x y" and every later point, in order. */
const pathPoints = d => [...d.matchAll(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g)].map(m => [+m[1], +m[2]]);
/* "XB-LFI", "RFI-Pr", "RFOI" → "LFI", "RFI", "RFOI": foot, direction, edge or edges. */
const bareEdge = c => (/[LR][FB](?:OI|IO|O|I)/.exec(c || '') || [''])[0];
const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const PER_BAR = { '3/4': 3, '4/4': 4, '2/4': 2, '6/8': 6 };

let bad = 0, dances = 0, steps = 0, timed = 0;
const fail = m => { bad++; console.log(`  x ${m}`); };
const notes = [];
let first = true;
for (const f of readdirSync(DIR).filter(f => f.endsWith('.md')).sort()) {
  const fm = (/^---\n([\s\S]*?)\n---/.exec(readFileSync(join(DIR, f), 'utf8')) || [])[1];
  const d = fm && yaml.load(fm);
  if (!d || !d.dance) continue;
  const id = f.replace(/\.md$/, ''), D = d.dance;
  dances++;
  if (D.chart) {
    /* A CHART is the rulebook's notation, so it is held to what notation cannot get
       wrong: the step numbers run 1 to N in order, with a letter only where a step is
       split (35a, 35b), and the beats come to whole bars and to the timing chart. */
    const R = D.chart.map(r => ({ ...r }));
    if (BREAK === 'beat') R[0].beats = R[0].beats + '+1';
    steps += R.length;
    let want = 1;
    for (const r of R) {
      const m = /^(\d+)([a-z]?)$/.exec(String(r.n));
      if (!m) { fail(`${id}: step "${r.n}" is not a number with an optional letter`); continue; }
      const k = Number(m[1]);
      if (k === want) want++;
      else if (!(m[2] && k === want - 1)) fail(`${id}: step ${r.n} where ${want} was next`);
      if (!D.sameSteps && !r.follow && !r.lead) fail(`${id}: step ${r.n} has neither partner's step`);
    }
    d.dance = { ...D, chart: R };
  } else {
    const S = D.steps.map(s => ({ ...s }));
    if (BREAK === 'foot' && first) S[1].edge = S[0].edge[0] + S[1].edge.slice(1);
    if (BREAK === 'beat') S[0].beats = (Array.isArray(S[0].beats) ? S[0].beats[0] : S[0].beats) + 1;
    first = false; steps += S.length;
    S.forEach((s, i) => { if (s.n !== i + 1) fail(`${id}: step ${i + 1} is numbered ${s.n}`); });
    S.forEach((s, i) => {
      const prev = S[(i - 1 + S.length) % S.length];
      if (prev.edge[0] === s.edge[0])
        fail(`${id}: steps ${prev.n} and ${s.n} are both on the ${s.edge[0] === 'L' ? 'left' : 'right'} foot`);
      const two = s.edge.length === 4, split = Array.isArray(s.beats);
      if (two !== split) fail(`${id}: step ${s.n} (${s.edge}) ${two ? 'changes edge and gives one count' : 'gives two counts on one edge'}`);
    });
    S.forEach((s, i) => {
      const ln = stepLink(S, i);
      if (ln && ln.disagrees) notes.push(`${id} step ${s.n}: ${s.how} from ${ln.from} is ${s.edge} in the dance, ${ln.disagrees} in the guide's model`);
    });
    d.dance = { ...D, steps: S };
  }
  const beats = patternBeats(d.dance), per = PER_BAR[D.meter];
  if (Math.abs(beats / per - Math.round(beats / per)) > 1e-9) fail(`${id}: ${beats} beats is not a whole number of ${D.meter} bars`);
  /* THE TIMING CHART, which nobody read the steps from. One pattern at this tempo
     should take this many seconds; a step list that misses or doubles a step lands
     a bar or more away from it. */
  const ex = expectedBeats(D);
  if (ex) { timed++;
    if (Math.abs(beats - ex.beats) > ex.slack)
      fail(`${id}: ${beats} beats, where ${D.patternSeconds} s at ${D.bpm} a minute is ${ex.beats.toFixed(1)}`); }
  const S = d.dance.steps || d.dance.chart;
  const P = patterns[id];
  if (P) { drawn++;
    let st = P.steps.map(x => ({ ...x }));
    if (BREAK === 'pattern' && firstPattern) st = st.map((x, i) => ({ ...x, label: st[(i + 1) % st.length].label }));
    firstPattern = false;
    if (st.length !== S.length) fail(`${id}: the pattern has ${st.length} steps and the dance ${S.length}`);
    st.forEach((x, i) => { if (S[i] && String(S[i].n) !== x.n) fail(`${id}: pattern step ${i + 1} is numbered ${x.n}, the dance's ${S[i].n}`); });
    const pts = st.map(x => pathPoints(x.d));
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i].at(-1), b = pts[i + 1][0], g = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (g > 1.5) fail(`${id}: steps ${st[i].n} and ${st[i + 1].n} are ${g.toFixed(1)} m apart on the drawing`);
    }
    for (const [i, q] of pts.entries())
      if (q.some(([x, y]) => Math.abs(x) > 30 || Math.abs(y) > 15)) fail(`${id}: step ${st[i].n} leaves the ice`);
    st.forEach((x, i) => {
      const row = S[i]; if (!row) return;
      const mine = bareEdge(row.edge || row.lead || row.follow), theirs = bareEdge(x.label);
      if (mine !== theirs) fail(`${id}: step ${x.n} is ${theirs} on the diagram and ${mine} in the step list`);
    });
    for (const [n, v] of (P.check && P.check.beats) || []) {
      const i = S.findIndex(r => String(r.n) === n); if (i < 0) continue;
      const r = S[i];
      const b = D.chart ? rowBeats(r) : (Array.isArray(r.beats) ? r.beats.reduce((a, c) => a + c, 0) : r.beats);
      if (b !== v) fail(`${id}: step ${n} has ${b} beats in the step list and ${v} printed beside it on the diagram`);
    }
  }
  console.log(`  ${bad ? '  ' : 'ok'} ${id.padEnd(20)} ${String(S.length).padStart(2)} steps, ${beats} beats in ${D.meter}${ex ? `, timing chart ${ex.beats.toFixed(1)}` : ''}`);
}

if (notes.length) {
  console.log(`\n${notes.length} step${notes.length === 1 ? '' : 's'} where the dance and the guide's model disagree, reported:`);
  for (const n of notes) console.log(`  ${n}`);
}
console.log(bad
  ? `\n${bad} problem${bad === 1 ? '' : 's'} in the step lists`
  : `\n${dances} pattern dances, ${steps} steps: numbered in order, whole bars, ${timed} of them against the timing chart,\nand the step lists alternating feet. ${drawn} patterns measured onto the rink, each step joined to the next,\non the ice, on the edge its diagram names and, where the diagram prints them, on its beats`);
process.exit(bad ? 1 : 0);
