/* EVERY HEADING HAS SOMETHING UNDER IT — 02/10/2026.

   The first checker here that looks at a page the way a reader does, rather than at
   the model the page was built from. Every other tool in this directory asks whether
   a pose, an edge or a link is right; none of them would notice a page that says
   "Derived" in large type and then shows an empty bordered box.

   That is what 23 element pages shipped: all 22 basics and the slip step.
   `[...slug].astro` printed the heading and the `div.derived` unconditionally, and
   every paragraph inside the div needs an entry edge or a jump, which those kinds do
   not have. Found on 24/09/2026 by reading pages at phone width (Session 23), after
   every checker in the chain had been green on them for weeks. It is the same kind
   of fault as the unstyled class in Session 14 and the underground boot in Session
   15: visible to anyone who looks, invisible to everything that asserts.

   ONE ASSERTION, against dist/ — what shipped, not the source.

   A heading (h2 to h6, in the page body outside the nav and the footer) owns everything up to the next heading of the
   same or a higher level. That section must contain either text a reader can see or
   something that is itself the content: a picture, a figure, a control. A heading
   followed only by its own subheadings is fine as long as each of those has content,
   because each is checked in its own right.

   The expectation does not come from the template. It is a property of the page:
   whatever logic decides what goes in a section, a reader seeing a title over
   nothing is the fault, and this is the only place that fault is visible.

   Broken on purpose: with the Derived block restored to unconditional, 23 pages and
   23 sections fail — the 22 basics and the slip step, exactly the review's count.
   `--break` reports what it would see if every section's text were removed, which
   proves the reading reaches every heading on every page (it must fail them all).

   Needs `npm run build` first, since it reads dist/. Imports nothing from the rig,
   so it runs in either shell.

       node tools/sections.mjs
*/
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BREAK = process.argv.includes('--break');
if (!existsSync(DIST)) {
  console.error('No dist/ - run `npm run build` first.\n');
  process.exit(2);
}

const pages = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.html')) pages.push(p);
  }
})(DIST);

/* Things that are content without being text. A section holding only one of these
   is a picture or a control under its title, which is what it should be. */
const MEDIA = /<(svg|img|picture|canvas|video|audio|iframe|object|input|select|textarea|button)\b/i;
/* Never seen by a reader, so never counts as content — and the svg is removed only
   after MEDIA has had its look, so a figure still counts. */
const HIDDEN = /<(script|style|template|noscript)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi;
const visible = html => html
  .replace(HIDDEN, '')
  .replace(/<svg\b[\s\S]*?<\/svg>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, 'x')
  .trim();

let headings = 0, failures = [];
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  /* The layout has no <main>, so the body stands in for it, less the two pieces of
     chrome every page shares. */
  const m = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  if (!m) continue;
  const main = m[1].replace(HIDDEN, '')
    .replace(/<nav\b[\s\S]*?<\/nav>|<footer\b[\s\S]*?<\/footer>/gi, '');
  const hs = [...main.matchAll(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  hs.forEach((h, i) => {
    headings++;
    const level = Number(h[1]);
    const start = h.index + h[0].length;
    const next = hs.slice(i + 1).find(x => Number(x[1]) <= level);
    let body = main.slice(start, next ? next.index : main.length);
    /* Subheadings are checked on their own; their text is not this section's. */
    const own = body.replace(/<h([2-6])\b[^>]*>[\s\S]*?<\/h\1>/gi, '');
    const hasSub = own.length !== body.length;
    if (BREAK) body = own.replace(/>[^<]+</g, '><');
    const content = MEDIA.test(BREAK ? '' : body) || visible(BREAK ? body : own) !== '';
    if (!content && !(hasSub && !BREAK)) {
      failures.push(`${relative(DIST, file)}: "${visible(h[2])}" has nothing under it`);
    }
  });
}

const pageCount = new Set(failures.map(f => f.split(':')[0])).size;
console.log(`\n${pages.length} built pages, ${headings} headings`);
if (failures.length) {
  const shown = failures.slice(0, 40);
  console.error(`\n${failures.length} empty section(s) on ${pageCount} page(s)${BREAK ? ' (--break)' : ''}:\n`);
  for (const f of shown) console.error('  ' + f);
  if (failures.length > shown.length) console.error(`  … and ${failures.length - shown.length} more`);
  process.exit(1);
}
console.log('every heading has something under it\n');
