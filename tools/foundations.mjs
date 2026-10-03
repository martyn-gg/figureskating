/* EVERY LINK FROM A BASIC SAYS WHY — 03/10/2026.

   Martyn asked for each basic to explain how it supports the bigger elements, and for
   the bigger elements to link back. The links are `prerequisites` and nothing else;
   the reasons live in src/lib/foundations.js, keyed by the basic and a pattern over
   the id of the element built on it. Two stores, so this holds them to each other.

   THREE ASSERTIONS, all against the element files as written, never against the page:

     1  Every element naming a basic as a prerequisite is matched by exactly one of
        that basic's reasons. None is a link with no "why"; two is an ambiguity the
        page would resolve silently by taking the first.
     2  Every reason matches at least one such link. A reason with nothing under it is
        commentary on a link that was removed, and would never be seen to be wrong.
     3  Every key in FOUNDATIONS is a basic. The file is about the bottom of the ladder.

   The expectation comes from the element files' frontmatter, read here with a regex,
   not from getCollection or the template, so a fault in either cannot hide itself.

   Broken on purpose (--break=drop removes the first reason of every basic; --break=stray
   adds a reason for an element that does not exist under each basic):

       --break=drop   18 reasons removed ...... 45 links with no reason, 0 stray
       --break=stray  18 reasons added ........ 0 links with no reason, 18 stray

       node tools/foundations.mjs
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FOUNDATIONS } from '../src/lib/foundations.js';

const BREAK = (/--break=([\w-]+)/.exec(process.argv.join(' ')) || [])[1];
const DIR = 'src/data/elements';

const kind = {}, pre = {};
for (const f of readdirSync(DIR).filter(f => f.endsWith('.md'))) {
  const id = f.slice(0, -3);
  const fm = (/^---\n([\s\S]*?)\n---/.exec(readFileSync(join(DIR, f), 'utf8')) || [])[1] || '';
  kind[id] = (/^kind:\s*(\S+)/m.exec(fm) || [])[1];
  const m = /^prerequisites:\s*\[(.*?)\]/m.exec(fm);
  pre[id] = m ? m[1].split(',').map(x => x.trim()).filter(Boolean) : [];
}

const F = {};
for (const [k, v] of Object.entries(FOUNDATIONS)) {
  F[k] = [...v];
  if (BREAK === 'drop') F[k].shift();
  if (BREAK === 'stray') F[k].push({ to: /^no-such-element$/, why: 'nothing' });
}

let bad = 0, links = 0, missing = 0, stray = 0;
const fail = msg => { bad++; console.log(`  ${msg}`); };

for (const k of Object.keys(F))
  if (kind[k] !== 'basic') fail(`KEY ${k}  is not a basic (kind: ${kind[k] ?? 'no such element'})`);

const used = new Map();
for (const [id, ps] of Object.entries(pre))
  for (const b of ps) {
    if (kind[b] !== 'basic') continue;
    links++;
    const hits = (F[b] || []).filter(r => r.to.test(id));
    if (hits.length === 0) { missing++; fail(`MISSING ${b} -> ${id}  has no reason in foundations.js`); }
    if (hits.length > 1) fail(`AMBIGUOUS ${b} -> ${id}  matches ${hits.length} reasons`);
    for (const h of hits) used.set(h, true);
  }

for (const [k, rs] of Object.entries(F))
  for (const r of rs)
    if (!used.has(r)) { stray++; fail(`STRAY ${k}  ${r.to}  matches no element built on it`); }

console.log(`\n${links} links from a basic, ${Object.values(F).flat().length} reasons` +
  (BREAK ? `  [break=${BREAK}: ${missing} with no reason, ${stray} stray]` : ''));
console.log(bad ? `\n${bad} fault${bad === 1 ? '' : 's'}`
  : 'every link from a basic has exactly one reason, and every reason has a link under it');
process.exit(bad ? 1 : 0);
