/* EVERY ELEMENT PAGE SAYS WHERE IT BELONGS, AND IS RIGHT — 04/10/2026, Session 28.

   Martyn: give every page the breadcrumb the holds had. Each element page now opens
   with "Elements · <its section>", built from sectionOf in element-groups.js, and the
   same trail goes to search engines as a JSON-LD BreadcrumbList from the same array.

   The fault this exists for is a crumb that points at a list the page is not in. The
   section pages decide membership with their own filters (the one-foot grid, the
   cluster rows, the combination tables), and sectionOf decides the crumb, so the two
   can disagree; and before today the JSON-LD said Elements -> page while the site had
   three levels. So the expectation is taken from the OTHER side: the section page the
   crumb names must link back to the element. Asserted against dist/, every copy.

   For every element page, in the root and every country copy:
     1  there is exactly one breadcrumb (a div with the navigation role), with two links: Elements, then a section;
     2  both stay inside the page's own copy;
     3  the section page exists and links to this element page;
     4  the JSON-LD BreadcrumbList names the same two links and then the page's h1.

   First run: the Edges grid linked LBI to the camel spin and RBO to the extended edge
   (and so did the entry column of both turn tables), because element-groups.js's `find` took any element with an
   entry and no turn for a plain edge. Live since the spins and positions arrived.

   Needs `npm run build` first. Imports nothing from the rig, so it runs in either shell.

       node tools/crumbs.mjs
       node tools/crumbs.mjs --break=section   read every crumb as the next section's:
                                               fails 1,820 (every page in every copy)
*/
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(DIST)) { console.error('No dist/ - run `npm run build` first.\n'); process.exit(2); }
const brk = (process.argv.find(a => a.startsWith('--break=')) || '').slice(8);

const decode = t => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const links = html => [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => ({ href: m[1], text: decode(m[2]) }));

/* The copies: the root, and every top-level directory that has its own elements/. */
const copies = ['', ...readdirSync(DIST).filter(d => d !== 'elements' && existsSync(join(DIST, d, 'elements', 'in')))];
const sectionIds = readdirSync(join(DIST, 'elements', 'in'));

let bad = 0, pages = 0, rootPages = 0;
const fail = m => { bad++; if (bad <= 30) console.log(`  x ${m}`); };
const sectionLinks = new Map();
const linksOf = file => {
  if (!sectionLinks.has(file)) sectionLinks.set(file, new Set(links(readFileSync(file, 'utf8')).map(l => l.href)));
  return sectionLinks.get(file);
};

for (const cc of copies) {
  const base = cc ? `/${cc}/` : '/';
  const dir = join(DIST, cc, 'elements');
  for (const slug of readdirSync(dir)) {
    const file = join(dir, slug, 'index.html');
    if (slug === 'in' || !existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    const here = `${base}elements/${slug}/`;
    /* other-names and the like are listings, not elements: no Elements nav, no h1 crumb. */
    const navs = [...html.matchAll(/<div class="crumbs"[^>]*role="navigation"[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/div>/g)];
    if (!navs.length && !/BreadcrumbList/.test(html)) continue;
    pages++; if (!cc) rootPages++;
    if (navs.length !== 1) { fail(`${here}: ${navs.length} breadcrumb navs`); continue; }
    const ls = links(navs[0][1]);
    if (ls.length !== 2) { fail(`${here}: ${ls.length} links in the crumb, not 2`); continue; }
    const [top, sec] = ls;
    if (top.href !== `${base}elements/`) fail(`${here}: first crumb is ${top.href}`);
    let href = sec.href;
    if (brk === 'section') {
      const id = href.split('/').filter(Boolean).pop();
      href = `${base}elements/in/${sectionIds[(sectionIds.indexOf(id) + 1) % sectionIds.length]}/`;
    }
    const m = href.startsWith(`${base}elements/in/`) && /\/elements\/in\/([^/]+)\/$/.exec(href);
    if (!m) { fail(`${here}: section crumb ${href} is not a section in this copy`); continue; }
    const secFile = join(DIST, cc, 'elements', 'in', m[1], 'index.html');
    if (!existsSync(secFile)) { fail(`${here}: section page ${href} does not exist`); continue; }
    if (!linksOf(secFile).has(here)) fail(`${here}: crumbed to ${href}, which does not list it`);

    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map(x => JSON.parse(x[1])).flat().find(x => x['@type'] === 'BreadcrumbList');
    if (!ld) { fail(`${here}: no BreadcrumbList`); continue; }
    const names = ld.itemListElement.map(i => i.name);
    const want = [top.text, sec.text, h1 ? decode(h1[1]) : '?'];
    if (names.join(' > ') !== want.join(' > ')) fail(`${here}: JSON-LD says ${names.join(' > ')}, the page ${want.join(' > ')}`);
    const items = ld.itemListElement.slice(0, 2).map(i => i.item && new URL(i.item).pathname);
    if (items.join() !== [top.href, sec.href].join()) fail(`${here}: JSON-LD links ${items.join(', ')}, the page ${top.href}, ${sec.href}`);
  }
}

/* The skip above must not hide a page that lost both: the root copy has one page per
   element file, and every one of them is counted. */
const nFiles = readdirSync(join(DIST, '..', 'src', 'data', 'elements')).filter(f => f.endsWith('.md')).length;
if (rootPages !== nFiles) fail(`the root copy has ${rootPages} crumbed element pages and src/data/elements has ${nFiles} files`);

console.log(`${pages} element pages across ${copies.length} copies: ${bad ? `${bad} problems` : 'every one says which list it is in, that list links back, and search engines are told the same'}`);
process.exit(bad ? 1 : 0);
