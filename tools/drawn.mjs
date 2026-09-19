/* EVERY ELEMENT PAGE DRAWS SOMETHING, OR SAYS WHY IT CANNOT — 19/09/2026.

   Twice now the guide has shipped a block of element pages containing no picture at
   all. Six jump pages on 30/08/2026, found by counting the built HTML; twenty-two
   basics on 06/09/2026, found the same way a week later. Neither was a broken link,
   a bad colour or a wrong angle, so none of the other checkers could see it, and the
   site's own argument is that you can see the shape.

   AGAINST dist/, NOT THE SOURCE. What matters is whether a reader gets a picture,
   and that is a property of the HTML that shipped — a component that silently
   renders nothing, a field the page forgot to read, a `trace` that parses and is
   never passed on, all build clean and all fail here.

   THE EXEMPTION IS A DECLARATION, NOT A SKIP, which is this repository's rule about
   exemptions: a pose may be excused only by something that also holds it to
   account. `cannotDraw` below names each page that legitimately draws nothing AND
   why, and the checker fails if a named page starts drawing — because then the
   reason has gone stale and the list is lying about the model. Fourteen of these
   are one fact (docs/gaps-basics.md): a blade on the ice takes its heading from the
   tracing, so a stop, a push and a two-foot turn — every movement where the blade
   points somewhere other than where it is going — cannot be drawn at all yet.

   Broken on purpose, both ways, because an exemption asserted from one side only is
   the shape this repository keeps finding in its own checkers:

       --break=blank  strip every tracing from the slalom ......... 1 page reported
       --break=stale  declare the slalom undrawable while it draws  1 page reported

       node tools/drawn.mjs
       node tools/drawn.mjs --break=blank|stale
*/
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DIST = resolve('dist/elements');
const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];

/* slug → why it draws nothing. Remove an entry when the page gains a picture. */
const cannotDraw = {
  'other-names':                 'a listing of aliases, not an element',
  'forward-stroking':            'the push is not along the tracing — no per-foot yaw',
  'backward-stroking':           'the push is not along the tracing — no per-foot yaw',
  'swizzle':                     'the blades are turned out against the travel',
  'backward-swizzle':            'the blades are turned out against the travel',
  'half-swizzle-pumps':          'the pushing blade is angled across the circle',
  'backward-half-swizzle-pumps': 'the pushing blade is angled across the circle',
  'snowplough-stop':             'a skid: the blade is flat and across the travel',
  'backward-snowplough-stop':    'a skid: the blade is flat and across the travel',
  't-stop':                      'the trailing blade lies across the glide',
  'hockey-stop':                 'both blades skid square across the travel',
  'two-foot-turn':               'mid-turn the blades point across the line of travel',
  'backward-two-foot-turn':      'mid-turn the blades point across the line of travel',
  'drag':                        'the trailing foot is turned out, and touches',
  'pivot':                       'the pick is fixed to the ice and the rig has no anchor',
};

if (BREAK === 'stale') cannotDraw.slalom = 'a deliberately stale exemption';

const dirs = (await readdir(DIST, { withFileTypes: true }))
  .filter(e => e.isDirectory()).map(e => e.name).sort();

let bad = 0, drew = 0;
for (const slug of dirs) {
  let html;
  try { html = await readFile(join(DIST, slug, 'index.html'), 'utf8'); } catch { continue; }
  const body = html.includes('<main') ? html.slice(html.indexOf('<main')) : html;
  /* --break removes every tracing from one page, which is the fault this exists for. */
  const stripped = BREAK === 'blank' && slug === 'slalom'
    ? body.replace(/<svg[\s\S]*?<\/svg>/g, '') : body;
  const draws = /<svg/.test(stripped) || /body-frame|data-rig/.test(stripped);
  const excused = Object.prototype.hasOwnProperty.call(cannotDraw, slug);

  if (draws) { drew++; if (excused) {
    console.log(`  STALE   ${slug} draws, and cannotDraw still says it cannot`);
    console.log(`          ("${cannotDraw[slug]}") — delete the entry`);
    bad++;
  } } else if (!excused) {
    console.log(`  BLANK   ${slug} draws nothing and is not named in cannotDraw`);
    bad++;
  }
}

console.log(`\n${dirs.length} element pages, ${drew} drawing, ` +
  `${Object.keys(cannotDraw).length} declared undrawable`);
console.log(bad
  ? `\n${bad} problem${bad === 1 ? '' : 's'}`
  : 'every element page draws something, or names itself and its reason as one that cannot');
process.exit(bad ? 1 : 0);
