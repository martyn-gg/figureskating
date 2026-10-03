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
   (a gap of more than 2.5 m is a stroke filed under the wrong step; the diagrams leave up to about 2 m at a change of foot); every point
   must be on the ice; the edge each stroke's label names on the diagram must be the
   edge the step list gives; and where the diagram prints a beat numeral beside a
   step (U.S. Figure Skating's do), it must be that step's beats. The last two hold
   the diagram against a step list typed separately from it. A hop or a toe pick,
   which the diagrams mark without a tracing, may be a point and nothing else may.

   AND THE TWO PARTNERS' TOTALS. Where the partners skate different steps, each
   partner's steps, each lasting until that partner's next one, come to the
   pattern's beats. The diagram's beat numerals found the case that needs it: the
   Tango Romantica's 35a and 35b, where the chart gives the lead 2 and 4 beats and
   the follow 1+3 and 1, and the step list had kept only the follow's. `leadBeats`
   now carries the lead's, and this keeps it adding up with the rows round it.

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
let drawn = 0, follows = 0, firstPattern = true;
/* Points along an SVG path of M, L and C commands: the ends of each piece and, on a
   curve, points along it, so the control points (which lie off the line) are not
   mistaken for where the skater goes. */
const pathPoints = d => {
  const out = []; let cur = null;
  for (const [, cmd, args] of d.matchAll(/([MLC])([^MLC]*)/g)) {
    const v = args.trim().split(/[\s,]+/).map(Number);
    if (cmd === 'M' || cmd === 'L') { cur = [v[0], v[1]]; out.push(cur); }
    else {
      const [x1, y1, x2, y2, x, y] = v, [x0, y0] = cur;
      for (let t = 0.1; t <= 1.0001; t += 0.1) {
        const u = 1 - t;
        out.push([u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x, u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y]);
      }
      cur = [x, y];
    }
  }
  return out;
};
/* "XB-LFI", "RFI-Pr", "RFOI" → "LFI", "RFI", "RFOI": foot, direction, edge or edges. */
const bareEdge = c => (/[LR][FB](?:OI|IO|O|I)/.exec(c || '') || [''])[0];
const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const PER_BAR = { '3/4': 3, '4/4': 4, '2/4': 2, '6/8': 6 };

let bad = 0, dances = 0, steps = 0, timed = 0;
const fail = m => { bad++; console.log(`  x ${m}`); };
/* How long one partner's step under chart row i lasts: the lead's own count where
   the chart gives one, else the row's count and every row after it that gives only
   the other partner a step (19b while the lead holds 19a). */
const partnerBeats = (S, i, who) => {
  const r = S[i];
  if (who === 'lead' && r.leadBeats) return rowBeats({ beats: r.leadBeats });
  let b = rowBeats(r);
  for (let j = i + 1; j < S.length && !S[j][who] && !(who === 'follow' && S[j].leadBeats); j++) b += rowBeats(S[j]);
  return b;
};
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
  /* BOTH PARTNERS DANCE THE WHOLE PATTERN: the lead's steps and the follow's,
     each lasting as partnerBeats says, come to the same number of beats. */
  if (D.chart && !D.sameSteps) for (const who of ['lead', 'follow']) {
    const t = S.reduce((a, r, i) => a + (r[who] ? partnerBeats(S, i, who) : 0), 0);
    if (Math.abs(t - beats) > 1e-9) fail(`${id}: the ${who}'s steps come to ${t} beats and the pattern to ${beats}`);
  }
  const P = patterns[id];
  /* Each layer draws one partner: the lead always, and the follow where the follow's
     steps were read too. A layer's steps are the chart rows that give its partner a
     step: where the chart splits a number (19a, 19b) because one partner takes two
     steps to the other's one, the other partner's layer has only the first. */
  const layer = (who, steps, check) => {
    const Sd = D.chart ? S.filter(r => r[who]) : S;
    const tag = who === 'lead' ? '' : ` (${who})`;
    let st = steps.map(x => ({ ...x }));
    if (BREAK === 'pattern' && firstPattern) st = st.map((x, i) => ({ ...x, label: st[(i + 1) % st.length].label }));
    firstPattern = false;
    if (st.length !== Sd.length) fail(`${id}${tag}: the pattern has ${st.length} steps and the step list ${Sd.length}`);
    st.forEach((x, i) => { if (Sd[i] && String(Sd[i].n) !== x.n) fail(`${id}${tag}: pattern step ${i + 1} is numbered ${x.n}, the dance's ${Sd[i].n}`); });
    /* A hop or a toe pick has no tracing on the diagram, only a mark: the pattern
       carries it as a point, and only a step that is one may be one. */
    const pts = st.map(x => x.point ? [x.point] : pathPoints(x.d));
    st.forEach((x, i) => {
      const row = Sd[i];
      if (x.point && row && !/hop|pick/i.test(row[who] || row.lead || '') && !['0', 'and'].includes(String(row.beats)))
        fail(`${id}${tag}: step ${x.n} is drawn as a point, and ${row[who] || row.lead} is not a hop or a toe pick`);
    });
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i].at(-1), b = pts[i + 1][0], g = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (g > 2.5) fail(`${id}${tag}: steps ${st[i].n} and ${st[i + 1].n} are ${g.toFixed(1)} m apart on the drawing`);
    }
    for (const [i, q] of pts.entries())
      if (q.some(([x, y]) => Math.abs(x) > 30.3 || Math.abs(y) > 15.3)) fail(`${id}${tag}: step ${st[i].n} leaves the ice`);
    st.forEach((x, i) => {
      const row = Sd[i]; if (!row) return;
      /* A chart cell can hold two steps on one count ("LFO XF-RFI"), and the diagram
         labels whichever it draws; a label that names no edge (a slalom, a flat)
         has nothing to hold. */
      const all = c => (c || '').match(/[LR][FB](?:OI|IO|O|I)/g) || [];
      const mine = all(row.edge || row[who] || row.lead), theirs = bareEdge(x.label);
      if (theirs && !mine.includes(theirs)) fail(`${id}${tag}: step ${x.n} is ${theirs} on the diagram and ${mine.join(' ')} in the step list`);
    });
    for (const [n, v] of (check && check.beats) || []) {
      const i = S.findIndex(r => String(r.n) === n); if (i < 0) continue;
      const r = S[i];
      /* A partner's step lasts until that partner's next step: through any rows
         after it that give only the other partner a step (19b while the lead holds
         19a). */
      const b = D.chart ? partnerBeats(S, i, who) : (Array.isArray(r.beats) ? r.beats.reduce((a, c) => a + c, 0) : r.beats);
      if (b !== v) fail(`${id}${tag}: step ${n} has ${b} beats in the step list and ${v} printed beside it on the diagram`);
    }
  };
  if (P) { drawn++;
    layer('lead', P.steps, P.check);
    if (P.follow) { follows++; layer('follow', P.follow.steps, P.follow.check); }
  }
  console.log(`  ${bad ? '  ' : 'ok'} ${id.padEnd(20)} ${String(S.length).padStart(2)} steps, ${beats} beats in ${D.meter}${ex ? `, timing chart ${ex.beats.toFixed(1)}` : ''}`);
}

if (notes.length) {
  console.log(`\n${notes.length} step${notes.length === 1 ? '' : 's'} where the dance and the guide's model disagree, reported:`);
  for (const n of notes) console.log(`  ${n}`);
}
console.log(bad
  ? `\n${bad} problem${bad === 1 ? '' : 's'} in the step lists`
  : `\n${dances} pattern dances, ${steps} steps: numbered in order, whole bars, ${timed} of them against the timing chart,\nand the step lists alternating feet. ${drawn} patterns measured onto the rink (${follows} with the follow's steps too), each step joined to the next,\non the ice, on the edge its diagram names and, where the diagram prints them, on its beats`);
process.exit(bad ? 1 : 0);
