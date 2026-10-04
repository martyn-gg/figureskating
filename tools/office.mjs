/* OFF THE ICE AND THE ICE NAME EACH OTHER — 04/10/2026, Session 28.

   An off-ice entry (src/data/conditioning) lists the elements it prepares, and each of
   those element pages lists the entry under "Off the ice". Two directions of one fact,
   so this holds them together against what shipped, the way crumbs.mjs holds a crumb
   to the section that lists it. Astro logs a reference to a missing element as an error
   and exits zero (docs: a green chain is not a green build), so the references are
   checked here too.

     1  every entry prepares at least one element, and every one it names exists;
     2  the entry's page links to each element it names;
     3  each of those element pages, in every copy, links back to the entry;
     4  no element page links to an entry that does not name it.

   Needs `npm run build` first. Imports nothing from the rig.

       node tools/office.mjs
       node tools/office.mjs --break=back   every entry also claims the two-foot glide: fails 54
 *                                        (9 entry pages, 9 x 5 copies of the glide)
*/
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) { console.error('No dist/ - run `npm run build` first.\n'); process.exit(2); }
const brk = (process.argv.find(a => a.startsWith('--break=')) || '').slice(8);
let bad = 0, checks = 0;
const fail = m => { bad++; if (bad <= 30) console.log(`  x ${m}`); };
const hrefs = file => new Set([...readFileSync(file, 'utf8').matchAll(/href="([^"]*)"/g)].map(m => m[1]));

const CDIR = join(ROOT, 'src', 'data', 'conditioning');
const entries = readdirSync(CDIR).filter(f => f.endsWith('.md')).map(f => {
  const fm = yaml.load(readFileSync(join(CDIR, f), 'utf8').split(/^---$/m)[1]);
  const prepares = [...(fm.prepares || []), ...(brk === 'back' ? ['two-foot-glide'] : [])];
  return { id: f.replace(/\.md$/, ''), prepares };
});
const elementIds = new Set(readdirSync(join(ROOT, 'src', 'data', 'elements')).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')));
const copies = ['', ...readdirSync(DIST).filter(d => d !== 'elements' && existsSync(join(DIST, d, 'elements', 'in')))];

const named = new Map();     // element id -> entries naming it
for (const e of entries) {
  checks++;
  if (!e.prepares.length) fail(`${e.id}: prepares nothing`);
  const page = join(DIST, 'off-ice', e.id, 'index.html');
  if (!existsSync(page)) { fail(`${e.id}: no page built`); continue; }
  const out = hrefs(page);
  for (const id of e.prepares) {
    checks++;
    if (!elementIds.has(id)) { fail(`${e.id}: names "${id}", which is not an element`); continue; }
    if (!named.has(id)) named.set(id, new Set());
    named.get(id).add(e.id);
    checks++;
    if (!out.has(`/elements/${id}/`)) fail(`${e.id}: its page does not link to ${id}`);
  }
}
let pages = 0;
for (const cc of copies) for (const id of elementIds) {
  const file = join(DIST, cc, 'elements', id, 'index.html');
  if (!existsSync(file)) continue;
  pages++;
  const links = [...hrefs(file)].map(h => /^\/off-ice\/([^/]+)\/$/.exec(h)?.[1]).filter(Boolean);
  const want = named.get(id) ?? new Set();
  for (const w of want) { checks++; if (!links.includes(w)) fail(`/${cc ? cc + '/' : ''}elements/${id}/ does not link back to off-ice/${w}`); }
  for (const l of links) { checks++; if (!want.has(l)) fail(`/${cc ? cc + '/' : ''}elements/${id}/ links to off-ice/${l}, which does not name it`); }
}
if (pages < elementIds.size) fail(`only ${pages} element pages read for ${elementIds.size} elements: is dist/ a full build?`);
console.log(`${entries.length} off-ice entries, ${named.size} elements named, ${pages} element pages read: ${checks} checks, ${bad} failed`);
process.exit(bad ? 1 : 0);
