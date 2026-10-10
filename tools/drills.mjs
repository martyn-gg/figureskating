/* PRACTICE DRILLS AND THE ELEMENTS THEY TRAIN NAME EACH OTHER — 10/10/2026, Session 37.

   A drill (src/data/drills) lists the elements it trains and the elements it is built
   from; each element it trains lists the drill under "Drills". Two directions of one
   fact, held together the way office.mjs holds the off-ice pages. And because a drill
   page draws a tracing and may name a rig move, those are checked at the source:

     1  every drill trains at least one element, and every element it names exists;
     2  the drill's page links to each element it trains and is built from;
     3  each element it trains, in every copy, links back to the drill;
     4  no element page links to a drill that does not train it;
     5  a drill names a rig move that exists, or says in notDrawn why it has none;
     6  its tracing goes through buildPath without throwing, and is drawn on its page.

   Needs `npm run build` first.

       node tools/drills.mjs
       node tools/drills.mjs --break=back    every drill also claims the two-foot glide
       node tools/drills.mjs --break=rig     every drill names a move that does not exist
*/
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { MOVES } from '../src/lib/moves.js';
import { buildPath } from '../src/lib/rig-math.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) { console.error('No dist/ - run `npm run build` first.\n'); process.exit(2); }
const brk = (process.argv.find(a => a.startsWith('--break=')) || '').slice(8);
let bad = 0, checks = 0;
const fail = m => { bad++; if (bad <= 30) console.log(`  x ${m}`); };
const hrefs = file => new Set([...readFileSync(file, 'utf8').matchAll(/href="([^"]*)"/g)].map(m => m[1]));

const DDIR = join(ROOT, 'src', 'data', 'drills');
const drills = readdirSync(DDIR).filter(f => f.endsWith('.md')).map(f => {
  const fm = yaml.load(readFileSync(join(DDIR, f), 'utf8').split(/^---$/m)[1]);
  return { id: f.replace(/\.md$/, ''), fm,
    trains: [...(fm.trains || []), ...(brk === 'back' ? ['two-foot-glide'] : [])],
    uses: fm.uses || [], rig: brk === 'rig' ? 'noSuchMove' : fm.rig };
});
const elementIds = new Set(readdirSync(join(ROOT, 'src', 'data', 'elements')).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')));
const copies = ['', ...readdirSync(DIST).filter(d => d !== 'elements' && existsSync(join(DIST, d, 'elements', 'in')))];

const named = new Map();
for (const d of drills) {
  checks++;
  if (!d.trains.length) fail(`${d.id}: trains nothing`);
  const page = join(DIST, 'drills', d.id, 'index.html');
  if (!existsSync(page)) { fail(`${d.id}: no page built`); continue; }
  const html = readFileSync(page, 'utf8'), out = hrefs(page);
  for (const id of new Set([...d.trains, ...d.uses])) {
    checks++;
    if (!elementIds.has(id)) { fail(`${d.id}: names "${id}", which is not an element`); continue; }
    checks++;
    if (!out.has(`/elements/${id}/`)) fail(`${d.id}: its page does not link to ${id}`);
  }
  for (const id of d.trains) { if (!named.has(id)) named.set(id, new Set()); named.get(id).add(d.id); }
  checks++;
  if (d.rig && !MOVES[d.rig]) fail(`${d.id}: rig "${d.rig}" is not a move`);
  if (!d.rig && !d.fm.notDrawn) fail(`${d.id}: no rig move and no notDrawn saying why`);
  if (d.fm.trace) {
    checks++;
    try {
      const frames = buildPath({ path: d.fm.trace.path, radius: d.fm.trace.radius ?? 200 });
      if (!frames?.length || frames.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) fail(`${d.id}: tracing has no finite points`);
    } catch (e) { fail(`${d.id}: buildPath threw on its tracing: ${e.message}`); }
    checks++;
    if (!/class="drill-trace"/.test(html)) fail(`${d.id}: has a tracing but its page draws none`);
  }
}
let pages = 0;
for (const cc of copies) for (const id of elementIds) {
  const file = join(DIST, cc, 'elements', id, 'index.html');
  if (!existsSync(file)) continue;
  pages++;
  const links = [...hrefs(file)].map(h => /^\/drills\/([^/]+)\/$/.exec(h)?.[1]).filter(Boolean);
  const want = named.get(id) ?? new Set();
  for (const w of want) { checks++; if (!links.includes(w)) fail(`/${cc ? cc + '/' : ''}elements/${id}/ does not link back to drills/${w}`); }
  for (const l of links) { checks++; if (!want.has(l)) fail(`/${cc ? cc + '/' : ''}elements/${id}/ links to drills/${l}, which does not train it`); }
}
if (pages < elementIds.size) fail(`only ${pages} element pages read for ${elementIds.size} elements: is dist/ a full build?`);
console.log(`${drills.length} drills, ${named.size} elements trained, ${pages} element pages read: ${checks} checks, ${bad} failed`);
process.exit(bad ? 1 : 0);
