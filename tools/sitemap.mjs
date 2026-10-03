/* THE SITEMAP, FROM WHAT WAS BUILT — 03/10/2026, Martyn: add the site to search
   engines.

   Written after `astro build` from dist/ itself, so it lists exactly the pages that
   shipped: every index.html, at its canonical URL, with the hreflang alternates the
   page itself declares (the root copy is x-default, /uk/, /us/, /au/ and /nz/ its
   country copies), so a search engine is told once which copies are the same
   page. A page that asks not to be indexed (the 404) is left out. No lastmod: a
   date that is not the date the content changed is worse than none, and a build
   date would claim every page changed on every deploy.

       node tools/sitemap.mjs          (run by `npm run build`)
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './_rig.mjs';

const DIST = join(ROOT, 'dist');
const pages = [];
const walk = d => { for (const f of readdirSync(d)) {
  const p = join(d, f);
  if (statSync(p).isDirectory()) walk(p); else if (f === 'index.html') pages.push(p);
} };
walk(DIST);

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const entries = [];
for (const p of pages.sort()) {
  const html = readFileSync(p, 'utf8');
  if (/<meta name="robots" content="noindex"/.test(html)) continue;
  const canon = (/<link rel="canonical" href="([^"]+)"/.exec(html) || [])[1];
  if (!canon) throw new Error(`${relative(DIST, p)} has no canonical link`);
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]);
  entries.push(`  <url>\n    <loc>${esc(canon)}</loc>\n` +
    alts.map(([l, h]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(h)}"/>\n`).join('') + '  </url>');
}
writeFileSync(join(DIST, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  entries.join('\n') + '\n</urlset>\n');
console.log(`sitemap.xml: ${entries.length} pages`);
