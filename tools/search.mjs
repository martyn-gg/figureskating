/* Search, asserted against the index that actually ships.

   The guide has no server, so search is a static file and a ranking function. Both
   can be wrong quietly: an index missing a collection looks like a page that simply
   does not exist, and a ranking that puts a cluster above the turn it contains
   looks like a site with nothing on it. Neither shows up in a build.

   Four assertions.

   1  EVERY PAGE A READER CAN REACH IS IN THE INDEX. Counted against dist/ rather
      than against the collections, so a page that builds and is unsearchable fails
      here — which is the failure mode that matters, since the reader's route in is
      the page and not the content file.

   2  EVERY RECORD POINTS AT A PAGE THAT EXISTS. The other direction, and the one a
      renamed file breaks.

   3  ALIASES ARE UNAMBIGUOUS. An alias is a way IN, so two movements answering to
      one name is a dead end wearing a signpost. No alias may equal another
      element's name, or an alias of a different movement.

   4  REPRESENTATIVE QUERIES RETURN THE RIGHT FIRST HIT. The ranking is the only
      logic here with no other expression, so it gets a table of what a skater
      would actually type and what they should get. It imports the same `rank`
      the page imports — there is one copy of it and this is the thing testing it.

   Needs `npm run build` first, since it reads dist/. It sits after check:links in
   the chain for that reason.

       node tools/search.mjs
*/
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './_rig.mjs';
import { rank } from '../src/lib/search.js';

const DIST = join(ROOT, 'dist');
if (!existsSync(join(DIST, 'search.json'))) {
  console.error('No dist/search.json — run `npm run build` first.\n');
  process.exit(2);
}
const docs = JSON.parse(readFileSync(join(DIST, 'search.json'), 'utf8'));

let bad = 0;
const fail = m => { bad++; console.error(`  x ${m}`); };

/* Every built page, as the URL the index would use.

   Two kinds of page are not records. Lists, explorers and addenda are how you get
   to records rather than records themselves. And the pages about the guide —
   about, coaches — are about the site, not about skating; putting them in an index
   of movements would mean "spiral" competing with a paragraph on domain costs.
   Named individually rather than pattern-matched, so a new element page cannot
   slip out of search by resembling one of these. */
const NOT_RECORDS = new Set(['', 'elements/', 'tests/', 'rig/', 'search/',
                             'elements/other-names/', 'tests/older-names/',
                             'about/', 'coaches/']);
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === 'index.html') {
      const u = relative(DIST, dir).split('\\').join('/');
      pages.push(u ? `${u}/` : '');
    }
  }
})(DIST);

const indexed = new Set(docs.map(d => d.u));
const missing = pages.filter(p => !NOT_RECORDS.has(p) && !indexed.has(p));
for (const p of missing.slice(0, 8))
  fail(`/${p} is built and cannot be found by search — no record in the index`);
if (missing.length > 8) fail(`…and ${missing.length - 8} more pages missing from the index`);

const built = new Set(pages);
for (const d of docs) if (!built.has(d.u))
  fail(`the index points at /${d.u}, which is not a page`);

/* 3 — aliases */
const byName = new Map();
for (const d of docs) {
  if (!byName.has(d.t)) byName.set(d.t, []);
  byName.get(d.t).push(d);
}
const aliasOwner = new Map();
for (const d of docs) for (const a of d.a || []) {
  const key = a.toLowerCase();
  /* Every foot of one movement shares its aliases, which is the point — the owner
     is the movement, identified by the set of names it answers to. */
  const owner = (d.a || []).slice().sort().join('|');
  if (aliasOwner.has(key) && aliasOwner.get(key) !== owner)
    fail(`"${a}" is an alias of two different movements — an alias is a way in, so it has to land somewhere`);
  aliasOwner.set(key, owner);
  if (byName.has(a)) fail(`"${a}" is an alias AND the name of another page`);
  if (a.toLowerCase() === d.t.toLowerCase()) fail(`${d.u} lists its own name as an alias`);
}

/* 4 — what a skater types, and what they should get. */
const QUERIES = [
  ['lfo three',        'Left forward outside three turn'],
  ['rbi',              'Right backward inside edge'],
  ['counter',          'Left forward inside counter'],
  ['three jump',       'Waltz jump'],            // the alias, and the reason for all this
  ['open chasse',      'Left forward outside chassé'],
  ['slide chassé',     'Left forward outside slip chassé'],
  ['crossed behind',   'Left forward outside crossed step behind'],
  ['skills 8',         'BIS Skills 8'],
  ['spiral',           'Spiral'],
  ['slalom',           'BIS Skills 1 · exercise 4 — Slalom'],
];
for (const [q, want] of QUERIES) {
  const got = rank(docs, q)[0];
  if (!got) { fail(`"${q}" finds nothing; it should find ${want}`); continue; }
  if (got.doc.t !== want) fail(`"${q}" puts "${got.doc.t}" first; it should be "${want}"`);
}

/* A query that should find nothing must find nothing, or the ranking is matching
   on noise and every search looks like it worked. */
for (const q of ['zzzz', 'quadruple axel', 'drag'])
  if (rank(docs, q).length) fail(`"${q}" matched ${rank(docs, q).length} records and should match none`);

const size = statSync(join(DIST, 'search.json')).size;
console.log(`\n${docs.length} records, ${(size / 1024).toFixed(0)} KB, ` +
  `${docs.filter(d => (d.a || []).length).length} carrying another name`);
console.log(`${pages.length} pages built, ${pages.length - NOT_RECORDS.size} of them searchable`);
console.log(bad
  ? `\n${bad} search problem${bad === 1 ? '' : 's'}`
  : 'every page is findable, every record is a page, no alias is ambiguous,\n' +
    `and ${QUERIES.length} representative queries return what a skater is asking for`);
process.exit(bad ? 1 : 0);
