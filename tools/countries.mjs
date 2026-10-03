/* THE COUNTRY COPIES STAY COPIES — 03/10/2026.

   /uk/, /us/, /au/ and /nz/ hold a copy of every page src/lib/country.js calls
   localised. Three things can quietly go wrong with that, and this checks all
   three against what was built:

   1. A country name that search cannot find. `names` in an element's frontmatter
      heads the page on a country copy, and the root copy only finds the move
      under that name if it is one of the element's aliases too. So every value
      must be an alias.
   2. A page missing from a copy. Every localised page at the root must exist in
      every country, or the selector and the redirect lead to a 404.
   3. A link that falls out of the country. On a country page, a link to a
      localised path must go to that country's copy. The two exceptions are the
      links that are a deliberate choice of country, which carry `data-cc`.

   And on a country copy, an element with a name for that country must be headed
   with it.

   Broken on purpose:
     node tools/countries.mjs --break-alias   # one name dropped from its aliases
     node tools/countries.mjs --break-links   # the root's links checked as if American
*/

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './_rig.mjs';

const argv = process.argv.slice(2);
const CC = ['uk', 'us', 'au', 'nz'];
const DIST = join(ROOT, 'dist');
const fail = [];

/* --- 1. names are aliases ------------------------------------------------- */
const EL = join(ROOT, 'src/data/elements');
const field = (src, key) => {
  const m = src.match(new RegExp(`^${key}: (.*)$`, 'm'));
  return m ? JSON.parse(m[1]) : null;
};
const named = [];
for (const f of readdirSync(EL).filter(f => f.endsWith('.md'))) {
  const src = readFileSync(join(EL, f), 'utf8').split('\n---')[0];
  const names = field(src, 'names');
  if (!names) continue;
  let aliases = (field(src, 'aliases') ?? []).map(a => a.toLowerCase());
  if (argv.includes('--break-alias') && named.length === 0) aliases = aliases.filter(a => a !== Object.values(names)[0].toLowerCase());
  const id = f.replace(/\.md$/, '');
  for (const [cc, n] of Object.entries(names)) {
    if (!CC.includes(cc)) fail.push(`${id}: names has "${cc}", which is not a country copy`);
    if (!aliases.includes(n.toLowerCase())) fail.push(`${id}: the ${cc} name "${n}" is not one of its aliases, so the root search cannot find it`);
  }
  named.push({ id, names });
}

/* --- 2. every localised page exists in every copy ------------------------- */
const pages = (dir, rel = '') => readdirSync(join(dir, rel)).flatMap(n => {
  const r = rel ? `${rel}/${n}` : n;
  return statSync(join(dir, r)).isDirectory() ? pages(dir, r) : (n === 'index.html' ? [r] : []);
});
const localisedRoot = ['index.html', 'search/index.html', 'grades/index.html',
  ...pages(join(DIST, 'elements'), '').map(p => `elements/${p}`)
    .filter(p => !p.startsWith('elements/other-names'))];
let missing = 0;
for (const cc of CC) for (const p of localisedRoot) {
  if (!existsSync(join(DIST, cc, p))) { missing++; if (missing <= 10) fail.push(`${cc}/${p} is missing`); }
}

/* --- 3. links stay in the country ----------------------------------------- */
const isLocalised = p => p === '' || p === 'search/' || p === 'grades/'
  || (p.startsWith('elements/') && !p.startsWith('elements/other-names'));
let checked = 0, strays = 0;
const scan = (cc, dir) => {
  for (const p of pages(dir)) {
    const html = readFileSync(join(dir, p), 'utf8');
    for (const m of html.matchAll(/<a\b([^>]*)>/g)) {
      const attrs = m[1];
      if (/\bdata-cc=/.test(attrs)) continue;
      const href = attrs.match(/\bhref="([^"]*)"/)?.[1];
      if (!href || !href.startsWith('/') || href.startsWith('//')) continue;
      checked++;
      const path = href.slice(1).replace(/[?#].*$/, '');
      if (isLocalised(path) && !path.startsWith(`${cc}/`)) {
        strays++;
        if (strays <= 10) fail.push(`${cc}/${p}: links to /${path}, which has a ${cc} copy`);
      }
    }
  }
};
if (argv.includes('--break-links')) scan('us', join(DIST, 'elements'));
else for (const cc of CC) scan(cc, join(DIST, cc));

/* --- 4. the country's name heads the page --------------------------------- */
for (const { id, names } of named) for (const [cc, n] of Object.entries(names)) {
  const f = join(DIST, cc, 'elements', id, 'index.html');
  if (!existsSync(f)) continue;
  const h1 = readFileSync(f, 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim();
  if (h1 !== n) fail.push(`${cc}/elements/${id}/ is headed "${h1}", not the ${cc} name "${n}"`);
}

console.log(`country copies: ${named.length} elements with a country name, ${localisedRoot.length} localised pages x ${CC.length} countries, ${checked} links checked`);
if (missing > 10) fail.push(`... and ${missing - 10} more missing pages`);
if (strays > 10) fail.push(`... and ${strays - 10} more links out of the country`);
if (fail.length) {
  for (const f of fail) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('every country name is searchable, every page has its copies, and no link leaves its country');
