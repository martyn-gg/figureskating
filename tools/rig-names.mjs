/* A `rig:` NAMES A REAL MOVE, AND EVERY MOVE IS PUBLISHED OR DECLARED — 20/09/2026.

   `rig:` has been `z.string().optional()` since it was added, with nothing anywhere
   checking that the string names anything at all. Eighteen pages carry one and all
   eighteen are right today, so this begins life as a tripwire — and Session 19 found
   two tripwires in this repository that had already fired unread, which is why the bar
   for wiring one into the build rather than into a page is now very low.

   IT IS NOT ONLY A TRIPWIRE. `BodyFrame.astro` wraps its whole figure in `{m && (...)}`,
   so a `rig:` that names nothing renders NOTHING: no figure, no warning, no build
   failure. `drawn.mjs` catches that only on a page whose sole picture is the rig. On any
   page that also has an `entry` or a `trace`, the EdgeDiagram keeps drawing and the rig
   goes missing in silence — which is drawn.mjs's own confession, one field along:
   "every rigged page until today also had an entry edge and therefore an EdgeDiagram
   to find". A pattern that has never met a case has never been tested in it.

   THE EXPECTATION COMES FROM THE MODEL, NOT FROM THE CONTENT. What moves exist is
   `Object.keys(MOVES)`, imported from moves.js; what the pages claim is read off the
   frontmatter without a build. Neither side knows about the other today, and that is
   precisely the fault.

   ASSERTED FROM BOTH SIDES, because an exemption that only excuses is the hole this
   repository keeps finding in its own checkers. A page may not name a move that does
   not exist; and a move that exists must be named by a page, or be declared in
   `unpublished` below WITH its reason — and a declared move that gains a page FAILS,
   because then the reason has gone stale and the list is lying about the model. That
   second assertion is the one with teeth. It is what would have said out loud that the
   teapot had been rigged since Session 01 with no element page pointing at it, and that
   `spiralCheck` has been in the same state since Session 06.

   DUPLICATES ARE REPORTED, NOT FAILED. Two pages mounting one move is a judgement call,
   the same one docs/style.md already makes about a crossover and a chassé drawing one
   tracing — so it prints with numbers and a person decides.

   Frontmatter by regex, deliberately, so this runs in the bridge VM where `astro build`
   cannot: it imports moves.js and nothing that reaches astro.config.mjs.

   Broken on purpose:

       --break=ghost   slip-step's rig repointed at a move that does not exist ... 2
       --break=orphan  toePick dropped from the declaration ..................... 1
       --break=stale   waltz declared unpublished while its page names it ....... 1

   The ghost counts two because the two assertions interlock: a page pointed at a name
   that does not exist ALSO leaves the move it used to name with nothing pointing at it.
   Worth knowing, because it means a typo is caught twice over and from both directions.

       node tools/rig-names.mjs
       node tools/rig-names.mjs --break=ghost|orphan|stale
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVES } from '../src/lib/moves.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ELEMENTS = join(ROOT, 'src/data/elements');
const BREAK = (/--break=([\w-]+)/.exec(process.argv.join(' ')) || [])[1];

/* move key → why no element page names it. Remove an entry when a page gains the rig.
   Each reason says what the GUIDE lacks, not what a skater cannot do — drawn.mjs's rule
   for its own list, and the same reason: the entry has to go stale visibly. */
const unpublished = {
  twoFoot:     'a two-foot EDGE on a lobe, and the guide has no element page for one. '
             + 'skills-1-exercise-4 names that gap in notCovered; two-foot-glide is a '
             + 'straight line and draws its own trace. Reachable on /rig.',
  toePick:     'a held pose showing where the pick is set, not a movement — moves.js '
             + 'says why the entry is not drawn. The one element that would mount it, '
             + 'pivot, needs an anchor the rig has not got, and drawn.mjs excuses it.',
  spiralCheck: 'the spiral with its arms checked, cloned from MOVES.spiral rather than '
             + 'authored — a variation of one element, not a second one. The spiral '
             + 'page mounts `spiral`.',
};
if (BREAK === 'orphan') delete unpublished.toePick;
if (BREAK === 'stale')  unpublished.waltz = 'a deliberately stale declaration';

/* ── what the pages claim, off the frontmatter without a build ───────── */
const front = p => {
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(p, 'utf8'));
  return m ? m[1] : '';
};
const claims = [];
for (const f of readdirSync(ELEMENTS).filter(n => n.endsWith('.md')).sort()) {
  const slug = f.replace(/\.md$/, '');
  const rig = (/^rig:\s*(.+)$/m.exec(front(join(ELEMENTS, f))) || [])[1]
    ?.trim().replace(/^["']|["']$/g, '');
  if (!rig) continue;
  claims.push({ slug, rig: BREAK === 'ghost' && slug === 'slip-step' ? 'slipStepp' : rig });
}

const real = new Set(Object.keys(MOVES));
let bad = 0;
const fail = (...a) => { bad++; console.log('  ' + a.join(' ')); };

/* 1 ── every claim names a real move. */
for (const { slug, rig } of claims) {
  if (real.has(rig)) continue;
  const near = [...real].filter(k => k.toLowerCase().startsWith(rig.slice(0, 4).toLowerCase()));
  fail(`GHOST   ${slug}  rig: ${rig} names no move in MOVES`,
    near.length ? `— did you mean ${near.join(', ')}?` : '',
    '\n          BodyFrame renders nothing for it, silently, and the build stays green.');
}

/* 2 ── every move is named by a page, or declared with a reason. */
const named = new Map();
for (const { slug, rig } of claims) named.set(rig, [...(named.get(rig) ?? []), slug]);
for (const key of Object.keys(MOVES)) {
  const pages = named.get(key) ?? [];
  const excused = Object.prototype.hasOwnProperty.call(unpublished, key);
  if (pages.length && excused)
    fail(`STALE   ${key}  is named by ${pages.join(', ')}, and unpublished still says it is not`,
      `\n          ("${unpublished[key]}") — delete the entry`);
  else if (!pages.length && !excused)
    fail(`ORPHAN  ${key}  is a rig no element page names, and it is not declared in unpublished`,
      '\n          Either point a page at it, or say here why the guide has none.');
}

/* 3 ── two pages on one move: a judgement, so a number rather than a failure. */
const shared = [...named].filter(([, p]) => p.length > 1);
for (const [key, pages] of shared)
  console.log(`  shared  ${key} is mounted by ${pages.length} pages: ${pages.join(', ')}`);

console.log(`\n${claims.length} pages name a rig, ${real.size} moves in MOVES, ` +
  `${Object.keys(unpublished).length} declared unpublished, ${shared.length} shared.`);
console.log(bad
  ? `\n${bad} problem${bad === 1 ? '' : 's'}`
  : 'every rig: names a real move, and every move is published or declared');
process.exit(bad ? 1 : 0);
