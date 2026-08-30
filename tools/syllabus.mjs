/* The syllabus half, asserted against the governing body's own documents.

   The element half of this repository is derived from three flags and checked
   against itself. The syllabus half is transcribed from PDFs, which is a
   different kind of risk: nothing in it is derivable, so the only defence is to
   put the claim back next to the source and compare.

   1  EVERY REFERENCE RESOLVES. Each exercise names a test that exists and
      elements that exist; each test's exercises are numbered 1..N with no gap
      and no duplicate.

   2  A TEST WITH EXERCISES CARRIES NO ELEMENT LIST OF ITS OWN. The test's
      elements are the union of its exercises', derived at render time. Two lists
      of the same thing is this repository's recurring failure and the answer is
      always to keep one.

   3  THE GENERATION FLAG MATCHES THE DOCUMENTS. `syllabus: current` must be
      absent from the October PDF, `october2026` absent from the current one, and
      `both` present in each. Read straight out of `sources/bis/` with pdftotext,
      so a flag cannot quietly disagree with the paper it came from.

   5  EVERY MOVEMENT THE DOCUMENT NAMES HAS AN ELEMENT OF THAT KIND. Assertion 4 works
      on edge codes, so it only sees an element whose entry or exit the document writes
      down — and a turn reached through another turn sits at a DERIVED edge the paper
      never names. Dropping the 2½ twizzle from Skills 7 exercise 3 passed assertion 4
      cleanly, because its entry is a counter's exit. So this reads the other thing the
      documents contain: their words for the movements. Weaker than 4, and blind to a
      dropped mirror, but it catches a kind of element left out altogether.

   4  EVERY EDGE THE EXERCISE NAMES IS REACHABLE FROM THE ELEMENTS LISTED. BIS
      writes its sequences as edge codes — LFO, XF-RBI, RFI. Each of those must be
      the entry or the exit of something in the exercise's element list, or be
      named in notCovered. This is the assertion with teeth: it is what catches an
      element left off a list, which is the failure mode of transcription and the
      one thing nobody notices by reading.

      Exits come from `exitState`, so the check runs through the model rather than
      around it — an element's exit is never written down anywhere for this to
      read.

   Needs the BIS PDFs in sources/bis/ and pdftotext on the path. Both are absent
   from a clean clone (sources/ is gitignored), so assertions 3 and 4 skip with a
   notice rather than failing — a checker that fails for want of a document nobody
   is allowed to redistribute would just get switched off.

       node tools/syllabus.mjs
*/
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './_rig.mjs';
import { ALL_TURNS, CLUSTERS, TWIZZLES, exitState, label } from '../src/lib/skating.js';

const DATA = join(ROOT, 'src/data');
const BIS = join(ROOT, 'sources/bis');

/* ── the content, parsed off the frontmatter without a build ─────────── */
const front = p => {
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(p, 'utf8'));
  return m ? m[1] : '';
};
const scalar = (f, k) => (new RegExp(`^${k}:\\s*(.+)$`, 'm').exec(f) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const list = (f, k) => {
  const inline = new RegExp(`^${k}:\\s*\\[(.*?)\\]`, 'm').exec(f);
  if (inline) return inline[1].split(',').map(s => s.trim()).filter(Boolean);
  const block = new RegExp(`^${k}:\\s*\\n((?:\\s+-\\s.*\\n?)+)`, 'm').exec(f);
  return block ? block[1].split('\n').filter(l => /^\s+-\s/.test(l)).map(l => l.replace(/^\s+-\s/, '').trim()) : [];
};
const ids = d => readdirSync(join(DATA, d)).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));

const elementIds = new Set(ids('elements'));
const testIds = new Set(ids('tests'));
let bad = 0, skipped = [];
const fail = (...a) => { bad++; console.log('  ' + a.join(' ')); };

/* A LIST KEY WITH NOTHING UNDER IT IS NOT AN EMPTY LIST, IT IS NULL — and Astro's
   schema rejects the file while every tool here reads it as empty, because this
   file parses frontmatter with regexes rather than YAML. It happened on 30/08/2026:
   removing the last notCovered line from four exercises left a bare `notCovered:`,
   syllabus.mjs passed, and the build failed on the Mac. The build is the only real
   YAML validator in the chain and it is the one step that cannot run in the bridge
   VM, so the gap is worth one explicit assertion rather than a compensating routine.

   `key: []` is the empty list. A bare key is a mistake. */
const emptyKey = (f, id) => {
  const lines = f.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^([a-zA-Z]+):\s*$/.exec(lines[i]);
    if (m && !/^\s+\S/.test(lines[i + 1] ?? ''))
      fail(`YAML   ${id}  \`${m[1]}:\` has nothing under it — write \`${m[1]}: []\`, ` +
        `or the content schema rejects the file while every tool here reads it as empty`);
  }
};

const exercises = ids('exercises').map(id => {
  const f = front(join(DATA, 'exercises', `${id}.md`));
  emptyKey(f, id);
  return { id, f, test: scalar(f, 'test'), order: Number(scalar(f, 'order')),
           syllabus: scalar(f, 'syllabus'), name: scalar(f, 'name'),
           elements: list(f, 'elements'), notCovered: list(f, 'notCovered') };
});


/* ── 1 — references and numbering ─────────────────────────────────────── */
for (const x of exercises) {
  if (!testIds.has(x.test)) fail(`REF    ${x.id}  names a test that does not exist: ${x.test}`);
  for (const e of x.elements) if (!elementIds.has(e)) fail(`REF    ${x.id}  unknown element: ${e}`);
  if (!x.elements.length) fail(`REF    ${x.id}  lists no elements at all`);
  if (!['current', 'october2026', 'both'].includes(x.syllabus)) fail(`REF    ${x.id}  bad syllabus flag: ${x.syllabus}`);
}
const byTest = {};
for (const x of exercises) (byTest[x.test] ??= []).push(x);
for (const [t, xs] of Object.entries(byTest)) {
  const orders = xs.map(x => x.order).sort((a, b) => a - b);
  const want = orders.map((_, i) => i + 1);
  if (orders.join() !== want.join()) fail(`ORDER  ${t}  exercises numbered ${orders.join(',')} — expected ${want.join(',')}`);
}

/* ── 2 — a test with exercises keeps no list of its own ───────────────── */
for (const t of testIds) {
  const f = front(join(DATA, 'tests', `${t}.md`));
  const own = list(f, 'elements');
  if (byTest[t]?.length && own.length)
    fail(`DUP    ${t}  has ${byTest[t].length} exercises AND its own list of ${own.length} elements`);
}

/* ── the source documents, if they are here ───────────────────────────── */
const pdf = p => {
  try { return execFileSync('pdftotext', ['-layout', p, '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }); }
  catch { return null; }
};
const norm = s => s.replace(/[ \t]+/g, ' ').replace(/[–—]/g, '-');

/* Every exercise heading in a document, with its body.

   Skills 1–7 head each exercise `EXERCISE n - NAME`. Skills 8 heads its three sections
   `SKILLS 8 - SECTION n`, and the October document's 2A page comes out of pdftotext with
   the heading overprinted on itself — `SKILLS88--SECTION SKILLS SECTION22A`. So a section
   heading is recognised by SECTION followed by a digit anywhere in the line and keyed as
   `SECTION n`, dropping the A/B suffix: 2A and 2B are two published versions of the same
   section, the guide holds one entry for it, and its body is the two of them concatenated
   so assertion 4 sees every edge either version names. Bodies under a repeated key are
   appended rather than overwritten, which also absorbs the `Section 2 (1)RFO…` line that
   opens the body of the very section it sits in. */
function sections(txt) {
  const out = {}; let name = null, cur = [];
  const start = n => {
    if (name) out[name] = out[name] ? `${out[name]} ${cur.join(' ')}` : cur.join(' ');
    name = n; cur = [];
  };
  for (const raw of norm(txt).split('\n')) {
    const l = raw.trim();
    if (/^EXERCISE\s/.test(l)) { start(l.replace(/\s+/g, ' ')); continue; }
    const sec = /SECTION\s*(\d)/.exec(l);
    if (sec) { start(`SECTION ${sec[1]}`); continue; }
    if (name) cur.push(l);
  }
  if (name) out[name] = out[name] ? `${out[name]} ${cur.join(' ')}` : cur.join(' ');
  return out;
}
const key = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* The turn vocabulary, for assertion 5.

   Assertion 4 works on edge codes, so it only ever sees an element whose entry or exit
   the document actually writes down. That is most of them and it is not all of them: a
   turn reached through another turn sits at a DERIVED edge the document never names, and
   assertion 4 is blind to it by construction. Dropping the 2½ twizzle from Skills 7
   exercise 3 passed cleanly, because its entry is a counter's exit and the paper only
   writes the counter's entry.

   So this reads the other thing the documents contain: the names. Each pattern is BIS's
   own word for a movement, mapped to the model keys that would satisfy it. Order matters
   where one name contains another — triple before double before plain.

   It is a weaker claim than assertion 4 and deliberately so: it asks whether the exercise
   lists *any* element of that kind, not whether it lists the right ones. A dropped mirror
   at a derived edge still gets past it. Catching that would mean parsing their whole
   sequence into states, which is a different and much larger tool. */
/* A key is satisfied by a single element carrying it OR by a cluster containing it.
   The first draft checked `e.turn` alone for everything but the three turns, and the
   six pairings added on 30/08/2026 broke it immediately: a counter-2½-twizzle carries
   its twizzle in `turns`, not in `turn`, so the checker reported an exercise that had
   just been made more complete than it was before. */
const has = (e, k) => e.turn === k || e.turns.includes(k);

const VOCAB = [
  [/\btriple 3[- ]?turn/i,   'a triple 3-turn',   e => e.turns.filter(t => t === 'three').length >= 3],
  [/\bdouble 3[- ]?turn/i,   'a double 3-turn',   e => e.turns.filter(t => t === 'three').length === 2],
  /* BIS write "3 turn"; this guide writes "three turn", because style.md says use the
     rink's words in prose. So the gap escape has to accept both spellings or a line that
     honestly names the gap gets reported as a missing element. */
  [/\b3[- ]?turn/i,          'a 3-turn',          e => has(e, 'three'),
                                                   /\b(?:3|three)[- ]turn/i],
  [/\bbracket/i,             'a bracket',         e => has(e, 'bracket')],
  [/\brocker/i,              'a rocker',          e => has(e, 'rocker')],
  [/\bcounter/i,             'a counter',         e => has(e, 'counter')],
  [/\bmohawk/i,              'a mohawk',          e => has(e, 'mohawk')],
  [/\bchoctaw/i,             'a choctaw',         e => has(e, 'choctaw')],
  [/twizzle\s*2\s*½/i,       'a 2½ twizzle',      e => has(e, 'twizzle25')],
  [/twizzle\s*1\s*½|1\s*½\s*twizzle/i, 'a 1½ twizzle', e => has(e, 'twizzle15')],
  [/\bdouble twizzle/i,      'a double twizzle',  e => has(e, 'twizzle2')],
  [/\btwizzle/i,             'a twizzle',         e => /^twizzle/.test(e.turn || '') || e.turns.some(t => /^twizzle/.test(t))],
  [/\bslip chasse/i,         'a slip chassé',     e => has(e, 'slipchasse')],
  [/\bchasse/i,              'a chassé',          e => has(e, 'chasse') || has(e, 'slipchasse')],
  [/\bcross roll/i,          'a cross roll',      e => has(e, 'crossroll')],
  [/\bXB-/,                  'a crossed step behind', e => has(e, 'crossbehind')],
  [/\bloop\b/i,              'a loop',            e => has(e, 'loop')],
  [/change of edge/i,         'a change of edge',  e => has(e, 'coe')],
];

/* An element id parsed back into what the model says it is. The id is the only thing
   this file has — it does not build the site — and the id is enough, because a derived
   element's id ends in its own turn key. */
const asTurn = id => {
  const m = /^[lr][fb][oi]-(.+)$/.exec(id);
  const rest = m ? m[1] : null;
  if (!rest) return { turn: null, turns: [] };
  if (ALL_TURNS[rest]) return { turn: rest, turns: [] };
  const combo = CLUSTERS[rest];
  if (combo) return { turn: null, turns: combo.turns };
  const tw = Object.keys(TWIZZLE_BY_SLUG).find(k => rest === TWIZZLE_BY_SLUG[k]);
  return { turn: tw ?? null, turns: [] };
};

/* Twizzle ids spell the count out, so the slug has to come back to a key. Built from
   TWIZZLES rather than typed, so a new count cannot be missed here. */
const TWIZZLE_BY_SLUG = Object.fromEntries(Object.keys(TWIZZLES).map(k => [k,
  k === 'twizzle' ? 'twizzle'
  : k === 'twizzle2' ? 'double-twizzle'
  : `${{ '1.5': 'one-and-a-half', '2.5': 'two-and-a-half' }[String(TWIZZLES[k].rotations)]}-twizzle`]));

/* 1b — EVERY ELEMENT'S PREREQUISITES RESOLVE.

   Astro logs a dangling content reference as an error and BUILDS ANYWAY, so a page
   pointing at an element that does not exist passes `npm run check` in silence and
   the broken link never reaches the HTML for links.mjs to find. It happened on
   30/08/2026: four bracket-cross roll clusters named a cross roll from an inside
   edge, which is not a thing, and it surfaced only when the dev server was
   restarted after two and a half hours.

   A cluster is only real if every element in it is real from the state it starts
   at. gen-derived.mjs refuses to write one that is not; this is the assertion that
   would have caught it either way. */
for (const id of ids('elements')) {
  const f = front(join(DATA, 'elements', `${id}.md`));
  for (const r of list(f, 'prerequisites'))
    if (!elementIds.has(r))
      fail(`PREREQ ${id}  names "${r}" as a prerequisite and no such element exists`);
}

/* ── 3 and 4, per test ────────────────────────────────────────────────── */
for (const [t, xs] of Object.entries(byTest)) {
  const level = (/^bis-skills-(\d)$/.exec(t) || [])[1];
  if (!level) continue;
  const now = existsSync(join(BIS, `Skills ${level}.pdf`)) && pdf(join(BIS, `Skills ${level}.pdf`));
  const oct = existsSync(join(BIS, `Skills ${level}-2026-10.pdf`)) && pdf(join(BIS, `Skills ${level}-2026-10.pdf`));
  if (!now || !oct) { skipped.push(`Skills ${level}`); continue; }
  const S = { current: sections(now), october2026: sections(oct) };
  const has = (gen, x) => Object.keys(S[gen]).some(h => key(h).includes(key(x.name)));
  const bodyIn = (gen, x) => Object.entries(S[gen]).find(([h]) => key(h).includes(key(x.name)))?.[1] ?? '';

  for (const x of xs) {
    /* 3 — the flag against the paper */
    const inNow = has('current', x), inOct = has('october2026', x);
    const want = { current: [true, false], october2026: [false, true], both: [true, true] }[x.syllabus];
    if (want && (inNow !== want[0] || inOct !== want[1]))
      fail(`GEN    ${x.id}  flagged "${x.syllabus}" but the documents say ` +
        `current=${inNow}, october=${inOct}`);

    /* 4 — every edge code named is reachable from the elements listed */
    const body = (x.syllabus === 'current' ? bodyIn('current', x) : bodyIn('october2026', x));
    const written = new Set((body.match(/\b[LR][FB][OI]\b/g) || []));
    const reach = new Set();
    for (const e of x.elements) {
      const m = /^([lr])([fb])([oi])(?:-(.+))?$/.exec(e);
      if (!m) continue;                                    // spiral, extended-edge, teapot…
      const entry = { foot: m[1].toUpperCase(), dir: m[2].toUpperCase(), edge: m[3].toUpperCase() };
      reach.add(label(entry));
      const turn = m[4];
      if (turn && ALL_TURNS[turn]) reach.add(label(exitState(entry, turn)));
    }
    const missing = [...written].filter(c => !reach.has(c));
    if (missing.length)
      fail(`EDGE   ${x.id}  the document names ${missing.join(', ')} — not reachable from ` +
        `any element listed (${[...reach].sort().join(' ') || 'none'})`);

    /* 5 — every movement the document NAMES has an element of that kind listed, or is
       named as a gap. Weaker than 4 and blind to a dropped mirror; see VOCAB above.

       READ THE SEQUENCE, NOT THE WHOLE PAGE. The first draft matched against the entire
       exercise block and reported three exercises that were already right: Skills 1's
       learning objectives offer "3 turn or mohawk" as an entry the skater chooses, and
       Skills 3 exercise 6 lists "introduction to a double twizzle" as an objective of an
       exercise that is a 1½. An objective is a statement of purpose, not a requirement to
       skate something. So the body is cut to the numbered steps: each `(n)` marker and
       everything up to the next one, which keeps mid-sequence asides like "then an optional
       turn to backwards (3 turn or Mohawk)" and drops the column above them. */
    const parsed = x.elements.map(asTurn);
    const gaps = x.notCovered.join(' ');
    const seq = (body.match(/\(\d+[a-z]?\)[\s\S]*?(?=\(\d+[a-z]?\)|$)/g) || []).join(' ');
    let seen = '';
    for (const [re, what, ok, gapRe] of VOCAB) {
      if (!re.test(seq) || seen.includes(what)) continue;
      seen += what;
      if (parsed.some(ok)) continue;
      if ((gapRe ?? re).test(gaps)) continue;            // named as a gap: honest
      fail(`WORD   ${x.id}  the document asks for ${what} and the exercise lists no ` +
        `element of that kind, nor names it in notCovered`);
    }
  }
}

/* ── report ───────────────────────────────────────────────────────────── */
const n = exercises.length;
console.log(`\n${n} exercise${n === 1 ? '' : 's'} across ${Object.keys(byTest).length} test` +
  `${Object.keys(byTest).length === 1 ? '' : 's'}, ` +
  `${exercises.reduce((a, x) => a + x.elements.length, 0)} element references`);
if (skipped.length)
  console.log(`(${skipped.join(', ')}: source documents not present — assertions 3 and 4 skipped)`);
console.log(bad
  ? `\n${bad} problem${bad === 1 ? '' : 's'}`
  : '\nevery reference resolves, every prerequisite exists, no test duplicates its\n' +
    'exercises\' elements,\n' +
    'every generation flag matches the document it came from, every edge the documents\n' +
    'name is reachable from the elements the exercise lists, and every movement they\n' +
    'name has an element of that kind listed or is named as a gap');
process.exit(bad ? 1 : 0);
