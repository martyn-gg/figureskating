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

   Broken on purpose:
     --break=foot   step 2 of the first dance onto the wrong foot ...... 2 (both its neighbours)
     --break=beat   one beat added to the first step of every dance ... 5 (one per dance)

       node tools/dance.mjs
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { stepLink, totalBeats } from '../src/lib/dance.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'elements');
const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const PER_BAR = { '3/4': 3, '4/4': 4, '2/4': 2, '6/8': 6 };

let bad = 0, dances = 0, steps = 0;
const fail = m => { bad++; console.log(`  x ${m}`); };
const notes = [];
let first = true;
for (const f of readdirSync(DIR).filter(f => f.endsWith('.md')).sort()) {
  const fm = (/^---\n([\s\S]*?)\n---/.exec(readFileSync(join(DIR, f), 'utf8')) || [])[1];
  const d = fm && yaml.load(fm);
  if (!d || !d.dance) continue;
  const id = f.replace(/\.md$/, ''), S = d.dance.steps.map(s => ({ ...s }));
  if (BREAK === 'foot' && first) S[1].edge = S[0].edge[0] + S[1].edge.slice(1);
  if (BREAK === 'beat') S[0].beats = (Array.isArray(S[0].beats) ? S[0].beats[0] : S[0].beats) + 1;
  first = false; dances++; steps += S.length;

  S.forEach((s, i) => { if (s.n !== i + 1) fail(`${id}: step ${i + 1} is numbered ${s.n}`); });
  S.forEach((s, i) => {
    const prev = S[(i - 1 + S.length) % S.length];
    if (prev.edge[0] === s.edge[0])
      fail(`${id}: steps ${prev.n} and ${s.n} are both on the ${s.edge[0] === 'L' ? 'left' : 'right'} foot`);
    const two = s.edge.length === 4, split = Array.isArray(s.beats);
    if (two !== split) fail(`${id}: step ${s.n} (${s.edge}) ${two ? 'changes edge and gives one count' : 'gives two counts on one edge'}`);
  });
  const beats = totalBeats(S), per = PER_BAR[d.dance.meter];
  if (beats % per) fail(`${id}: ${beats} beats is not a whole number of ${d.dance.meter} bars`);
  S.forEach((s, i) => {
    const ln = stepLink(S, i);
    if (ln && ln.disagrees) notes.push(`${id} step ${s.n}: ${s.how} from ${ln.from} is ${s.edge} in the dance, ${ln.disagrees} in the guide's model`);
  });
  console.log(`  ${bad ? '  ' : 'ok'} ${id.padEnd(16)} ${String(S.length).padStart(2)} steps, ${beats} beats in ${d.dance.meter}`);
}

if (notes.length) {
  console.log(`\n${notes.length} step${notes.length === 1 ? '' : 's'} where the dance and the guide's model disagree, reported:`);
  for (const n of notes) console.log(`  ${n}`);
}
console.log(bad
  ? `\n${bad} problem${bad === 1 ? '' : 's'} in the step lists`
  : `\n${dances} pattern dances, ${steps} steps: numbered in order, alternating feet, whole bars`);
process.exit(bad ? 1 : 0);
