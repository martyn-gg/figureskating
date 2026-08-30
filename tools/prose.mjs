/* The words as a reader sees them, which is the one thing sixteen checkers cannot see.

   Everything else here checks a fact: a link resolves, a colour has contrast, a boot
   sits at a plausible angle. This checks that the prose still has spaces in it.

   The fault it exists for is JSX eating whitespace. A text node whose whitespace
   contains a newline is trimmed where it meets an expression or an element, so two
   counts on consecutive lines shipped as "32 twizzles,36 transitions", and a line
   ending in "start with the" before a link shipped as "theleft forward outside edge".
   Five of those went out on 30/08/2026 and no checker noticed, because none of them
   is a broken link, a bad colour or a wrong angle. It is prose, and prose was
   unwatched.

   Three assertions, against dist/ - the text that actually shipped, not the source.

   1  NO TWO WORDS JOINED ACROSS AN INLINE BOUNDARY. Block elements are implicit
      whitespace: a paragraph following a heading is not a run-on sentence, so only
      inline tags - a, b, em, span and their kin - can glue anything together.

      Deliberately narrowed to lower-case into lower-case. The first version fired on
      every `</a><span>` in a list whose CSS makes both children block: thirty-five
      false alarms and no true ones, and a checker that cries wolf gets switched off.
      The cost is that "the<b>Left" goes unseen where "the<b>left" is caught. That is
      the right way round - the fault this exists for is a word running into the
      start of a link, and a capital there is something the eye catches unaided.

   2  NO COMMA OR SEMICOLON WITHOUT A SPACE AFTER IT. A letter is required before it,
      so that 1,642 and 12,252 stay numbers rather than mistakes.

   3  NO SENTENCE RUNNING STRAIGHT INTO THE NEXT - lower case, full stop, capital.
      Domains and filenames survive it: figureskating.guide and index.astro are lower
      case to the right of the dot, and so is "e.g.".

   Needs `npm run build` first, since it reads dist/.

       node tools/prose.mjs
*/
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './_rig.mjs';

const DIST = join(ROOT, 'dist');
if (!existsSync(DIST)) {
  console.error('No dist/ - run `npm run build` first.\n');
  process.exit(2);
}

/* Everything HTML calls phrasing content, and nothing else. A tag that is not on
   this list is read as a line break, which is what a block element is to a reader. */
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'del',
  'dfn', 'em', 'i', 'ins', 'kbd', 'mark', 'q', 'rp', 'rt', 'ruby', 's', 'samp',
  'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr']);

/* A class the stylesheet turns into a block is not inline, whatever the tag says.
   `<th>Three turn<span class="sub">rotates into</span></th>` reads as two lines
   because `.sub` is `display:block`, and a checker that cannot see the stylesheet
   would call that a missing space five times over on one page. So the stylesheet is
   read: every class named in a rule that sets a separating display becomes a block.
   Over-inclusive on purpose — a class swept up from a descendant selector makes this
   quieter, never wronger, and silence is the cheaper failure for a checker nobody
   would keep if it cried wolf. */
const SEPARATES = /display:\s*(block|flex|grid|list-item|table|inline-block|inline-flex)/;
const BLOCKY = new Set();
for (const f of readdirSync(join(DIST, '_astro')).filter(n => n.endsWith('.css'))) {
  const css = readFileSync(join(DIST, '_astro', f), 'utf8');
  for (const rule of css.split('}')) {
    const i = rule.lastIndexOf('{');
    if (i < 0 || !SEPARATES.test(rule.slice(i))) continue;
    for (const c of rule.slice(0, i).matchAll(/\.([A-Za-z0-9_-]+)/g)) BLOCKY.add(c[1]);
  }
}

/* Not text at all: markup, styling, or a picture. */
const OPAQUE = /<(script|style|svg|head|template|noscript)\b[\s\S]*?<\/\1>/gi;

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', rsquo: '’',
  lsquo: '‘', ldquo: '“', rdquo: '”', times: '×',
  pound: '£', deg: '°', frac12: '½', middot: '·' };
const decode = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z0-9]+);/gi, (m, n) => ENT[n] ?? ENT[n.toLowerCase()] ?? m);

/* Two markers the reader never types: one for a tag opening, one for a tag closing.
   The difference is the whole of assertion 1's precision - see WHY below. */
const OPEN = '\u0001', CLOSE = '\u0002';
const MARKS = /[\u0001\u0002]/g;

function visible(html) {
  const body = html.replace(OPAQUE, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  let out = '', i = 0;
  const blocked = [];
  for (const m of body.matchAll(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi)) {
    out += decode(body.slice(i, m.index));
    const tag = m[1].toLowerCase(), closing = m[0].startsWith('</');
    /* A closing tag carries no class, so the opening one is remembered. Without the
       stack, `<span class="sub">` would separate and its `</span>` would not. */
    let inline = INLINE.has(tag);
    if (inline && closing && blocked[blocked.length - 1] === tag) { inline = false; blocked.pop(); }
    else if (inline && !closing) {
      const cls = /class="([^"]*)"/.exec(m[0])?.[1].split(/\s+/) ?? [];
      if (cls.some(c => BLOCKY.has(c))) { inline = false; blocked.push(tag); }
    }
    out += inline ? (closing ? CLOSE : OPEN) : ' ';
    i = m.index + m[0].length;
  }
  return out + decode(body.slice(i));
}

const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.push(p);
  }
})(DIST);

let bad = 0;
const fail = (page, what, hay, at) => {
  bad++;
  const shown = hay.slice(Math.max(0, at - 45), at + 45)
    .replace(MARKS, '').replace(/\s+/g, ' ').trim();
  console.error(`  x ${page}\n      ${what}: ...${shown}...`);
};

/* WHY THE RUN MATTERS. A close followed by an open is two sibling elements meeting
   - a chip after a link, a caption after a title - and CSS almost always makes at
   least one of them a block, so the reader sees them apart. A run WITHOUT that
   transition is text meeting markup, which is prose, which is where the fault is.
   Ignoring close-into-open took this from 2,772 findings, all false, to 8, all real. */
const GLUED = /[a-z][\u0001\u0002]+[a-z]/g;
const SIBLINGS = /\u0002[^]*\u0001/;
const PUNCT = [[/[a-z][,;][A-Za-z0-9]/g, 'no space after a comma'],
               [/[a-z]\.[A-Z]/g, 'no space after a full stop']];

for (const p of pages) {
  const page = '/' + relative(DIST, p).replace(/index\.html$/, '');
  const marked = visible(readFileSync(p, 'utf8'));
  /* Assertion 1 reads the marked text. The other two read it as the reader does,
     with the markers gone, or every bold word would look like a missing space. */
  const plain = marked.replace(MARKS, '');
  for (const m of marked.matchAll(GLUED)) {
    if (SIBLINGS.test(m[0])) continue;
    fail(page, 'two words joined across a tag', marked, m.index);
  }
  for (const [re, what] of PUNCT) for (const m of plain.matchAll(re)) fail(page, what, plain, m.index);
}

console.log(`\n${pages.length} built pages read the way a reader reads them`);
if (bad) {
  console.error(`\n${bad} place${bad === 1 ? '' : 's'} where the words run together.`);
  console.error("Almost always a missing {' '} where a line ends in an expression or a tag.\n");
  process.exit(1);
}
console.log('nothing runs together, and every comma and full stop has its space\n');
