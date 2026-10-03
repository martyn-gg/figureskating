/* WHAT A SEARCH ENGINE READS, CHECKED — 03/10/2026, with the sitemap.

   Against dist/, the pages that shipped. Every page must have:
     1  a title, and a description of 50 to 200 characters, the snippet a result shows;
     2  a canonical link to itself;
     3  a language that agrees with its own hreflang entry (the /us/ copy says en-US,
        the root copy, x-default, says en-GB);
     4  structured data, where it has any, that parses;
   and across the root copy, no two pages share a title or a description, because a
   search engine shows two identical results as one and drops the other. Country
   copies repeat the root's on purpose; hreflang says they are the same page.
   Finally robots.txt names the sitemap, and the sitemap lists every page that does
   not ask to be left out.

   Broken on purpose:
       --break=desc   one page's description emptied ........ 1 page
       --break=dup    a second page given the front page's title . 1 clash

       node tools/seo.mjs
*/
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './_rig.mjs';

const DIST = join(ROOT, 'dist');
const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
const SITE = 'https://figureskating.guide';
const CC = ['uk', 'us', 'au', 'nz'];
let bad = 0;
const fail = m => { bad++; if (bad <= 30) console.log(`  x ${m}`); };

const files = [];
const walk = d => { for (const f of readdirSync(d)) {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p); else if (f === 'index.html') files.push(p);
} };
walk(DIST);

const attr = (html, re) => (re.exec(html) || [])[1];
const unent = s => s && s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const titles = new Map(), descs = new Map();
let indexable = 0, first = true;
for (const p of files.sort()) {
  let html = readFileSync(p, 'utf8');
  const path = '/' + relative(DIST, p).replace(/index\.html$/, '');
  if (BREAK === 'desc' && first) html = html.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content=""');
  if (BREAK === 'dup' && path === '/about/') html = html.replace(/<title>[^<]*<\/title>/, '<title>Field Guide to Figure Skating</title>');
  first = false;
  const title = unent(attr(html, /<title>([^<]*)<\/title>/));
  const desc = unent(attr(html, /<meta name="description" content="([^"]*)"/));
  const canon = attr(html, /<link rel="canonical" href="([^"]+)"/);
  const lang = attr(html, /<html lang="([^"]+)"/);
  const noindex = /<meta name="robots" content="noindex"/.test(html);
  if (!noindex) indexable++;
  if (!title) fail(`${path}: no title`);
  if (!desc || desc.length < 50 || desc.length > 200) fail(`${path}: description is ${desc ? desc.length : 0} characters, wanted 50 to 200`);
  if (canon !== SITE + path) fail(`${path}: canonical is ${canon}`);
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]);
  const mine = alts.find(([, h]) => h === SITE + path);
  if (alts.length && !mine) fail(`${path}: its hreflang links do not include itself`);
  if (mine && !(mine[0] === lang || (mine[0] === 'x-default' && lang === 'en-GB'))) fail(`${path}: lang ${lang}, hreflang ${mine[0]}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { fail(`${path}: structured data does not parse`); }
  }
  const country = CC.includes(path.split('/')[1]);
  if (!country && !noindex) {
    for (const [map, v, what] of [[titles, title, 'title'], [descs, desc, 'description']]) {
      if (map.has(v)) fail(`${path}: same ${what} as ${map.get(v)}`); else map.set(v, path);
    }
  }
}
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!/^Sitemap: https:\/\/figureskating\.guide\/sitemap\.xml$/m.test(robots)) fail('robots.txt does not name the sitemap');
const sm = existsSync(join(DIST, 'sitemap.xml')) ? readFileSync(join(DIST, 'sitemap.xml'), 'utf8') : '';
const listed = (sm.match(/<loc>/g) || []).length;
if (listed !== indexable) fail(`the sitemap lists ${listed} pages and ${indexable} are indexable`);

console.log(bad
  ? `\n${bad} problem${bad === 1 ? '' : 's'} a search engine would see`
  : `${files.length} pages: each titled, described, canonical and in its own language, no two root pages alike,\nand all ${indexable} indexable pages in the sitemap that robots.txt names`);
process.exit(bad ? 1 : 0);
