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
   were one fact (docs/gaps-basics.md): a blade on the ice took its heading from the
   tracing, so a stop, a push and a two-foot turn — every movement where the blade
   points somewhere other than where it is going — could not be drawn at all. The
   yaw and the skid closed most of it, and each entry left names what the MODEL lacks
   rather than what a skater cannot do.

   HOW MANY REMAIN IS NOT WRITTEN HERE. It said ten while the list held nine, which is
   the fifth time in this repository a count stated by hand has drifted from the thing
   it counts — a description of something that changed. The run prints the number from
   the list itself; read it there.

   Broken on purpose, both ways, because an exemption asserted from one side only is
   the shape this repository keeps finding in its own checkers:

       --break=blank  strip every tracing from the slalom .............. 1 page
       --break=stale  declare the slalom undrawable while it draws ..... 1 page
       --break=rig    strip the mounted rig from forward-stroking ...... 1 page

       node tools/drawn.mjs
       node tools/drawn.mjs --break=blank|stale|rig
*/
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DIST = resolve('dist/elements');
const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];

/* slug → why it draws nothing. Remove an entry when the page gains a picture. */
const cannotDraw = {
  'other-names':                 'a listing of aliases, not an element',
  'swizzle':                     'the blades are turned out against the travel',
  'backward-swizzle':            'the blades are turned out against the travel',
  'half-swizzle-pumps':          'the pushing blade is angled across the circle',
  'backward-half-swizzle-pumps': 'the pushing blade is angled across the circle',
  /* NOT A CLAIM ABOUT SKATERS — 19/09/2026, Martyn's challenge, and he is right that
     the first version of this line overreached. What the sweep found is that THIS RIG
     has no legal pose for it, and the rig holds one hip height, a knee that faces
     wherever hipYaw points, and no spine. A hockey stop is made of the things it does
     not have: the shoulders and hips counter-rotating against each other and the
     upper body leaning away from the travel while the feet go across it. The boot is
     the right boot — Learn to Skate USA teaches this in Basic 5, in figure skates, and
     a hockey boot's extra 5 to 9 degrees of ankle is not the missing 30. */
  'hockey-stop':                 'no legal pose in THIS rig: it wants counter-rotation and '
                               + 'a free upper body, and the model has one hip yaw and no spine',
  /* MEASURED, NOT GUESSED — 20/09/2026. The line here used to say the drag wanted
     nothing but a rig, which was the same authoring-only claim backward stroking
     carried, and backward stroking turned out to be true. This one is not. A
     trailing foot flat on the ice needs the shin 30 to 44 degrees over inside a boot
     that allows 28, at every hip height below 96 and every reach past 10 cm — and
     pitching the boot makes it worse monotonically, because tilting the boot tilts
     its up-axis away from the shin. Only a locked skating leg keeps both shins
     legal, and the bent knee is the element. Full table in docs/model.md. */
  'drag':                        'the trailing shin is 30 to 44 degrees over what the boot '
                               + 'allows, and the bent skating knee the element is about is '
                               + 'what puts it there',
  'pivot':                       'the pick is fixed to the ice and the rig has no anchor',
};

if (BREAK === 'stale') cannotDraw.slalom = 'a deliberately stale exemption';

/* Directories that are not element pages are not element pages. /elements/in/ holds
   the section pages and has no index.html of its own, and counting it made the total
   one more than the number of pages the sum of the two columns accounts for. */
const dirs = [];
for (const e of (await readdir(DIST, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!e.isDirectory()) continue;
  try { await readFile(join(DIST, e.name, 'index.html'), 'utf8'); dirs.push(e.name); } catch { /* not a page */ }
}

let bad = 0, drew = 0;
for (const slug of dirs) {
  let html;
  try { html = await readFile(join(DIST, slug, 'index.html'), 'utf8'); } catch { continue; }
  const body = html.includes('<main') ? html.slice(html.indexOf('<main')) : html;
  /* --break removes every tracing from one page, which is the fault this exists for. */
  let stripped = body;
  if (BREAK === 'blank' && slug === 'slalom') stripped = stripped.replace(/<svg[\s\S]*?<\/svg>/g, '');
  /* The rig mutation needs a page whose ONLY picture is a rig, or stripping it
     proves nothing — which is precisely how the missing pattern stayed hidden. */
  if (BREAK === 'rig' && slug === 'forward-stroking') stripped = stripped.replace(/data-move=/g, 'x=');
  /* A RIG IS NOT AN <svg> IN THE HTML. BodyFrame ships `<figure class="bf"
     data-move=...>` and mounts the three views from script, so the built page
     carries no SVG at all until a browser runs. The first version of this checker
     looked for `body-frame` and `data-rig`, NEITHER OF WHICH THIS REPOSITORY HAS
     EVER EMITTED — and it passed anyway, because every rigged page until today
     also had an entry edge and therefore an EdgeDiagram to find. A pattern that
     has never matched anything cannot fail, which is this file's own subject
     turning up inside the file. `data-move` is what the renderer actually reads. */
  const draws = /<svg/.test(stripped) || /data-move=/.test(stripped);
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
