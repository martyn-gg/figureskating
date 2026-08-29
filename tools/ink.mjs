/* The skating limb must dominate the free limb, in every frame and both schemes.

   Sibling to framing.mjs, and it exists for the same reason: a thing that is
   wrong in the picture, invisible in the maths, and plausible at a glance. On
   29/08/2026 the rig showed role backwards in the dark scheme for the whole of a
   takeoff — the skating limb carried 0.29 of the free limb's ink — and it was
   passed by eye twice, once by the person who had specified the panel. What
   settled it was labelling the roles from the DOM and measuring. This is that,
   automated.

   Ink, per unit length of limb:

       stroke-width x |luminance(limb) - luminance(panel)| x opacity

   Pose is deliberately out of it. A limb that happens to be extended covers more
   of the panel, but that is the move, not the palette; what is being asserted is
   that the two channels available to the renderer — weight and lightness — agree
   with each other rather than cancel. It is a proxy for salience, not a model of
   it. The failing case was 0.29 against 1.0, so the direction is what matters.

   It fails loudly if the tokens have not resolved. The first hand-rolled version
   of this measurement rendered the rig on a bare page, every var(--limb) fell
   back to black, and it produced a confident picture of dots — the same trap
   state-of-play.md records for /rig reusing BodyFrame's class names without
   importing it. A checker measuring unresolved tokens agrees with everything.

   Needs Playwright, so it is not in `npm run check`.

       npm run build && node tools/ink.mjs
       node tools/ink.mjs --break     # put the two-luminance limb pair back
*/

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { browser, ROOT } from './_rig.mjs';
import { SCHEMES, tokenCSS } from '../src/lib/tokens.js';

const BREAK = process.argv.includes('--break');
const argv = process.argv.slice(2);
const fi = argv.indexOf('--frames');
const NFRAMES = fi === -1 ? 17 : Number(argv[fi + 1]);

/* The pair as it stood before 29/08/2026: one limb near the panel's extreme, the
   other mid-range, which is what let lightness outvote weight. Applied by role,
   because that is how the old code applied it — the pale token went to whichever
   foot was R, not to whichever leg was skating, and that mismatch IS the bug. */
const OLD_PAIR = {
  light: { skating: '#26094f', free: '#9a6bf8' },
  dark:  { skating: '#7c3aed', free: '#e9e5ff' },
};

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html' };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  try {
    const body = readFileSync(p);
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    /* A real page on this origin, so the document has one. `setContent` leaves
       Playwright on about:blank, and a dynamic import of an http:// module from
       about:blank is cross-origin and fails — which is how this checker failed on
       its first run. The page is served empty and filled in below. */
    if (req.url.startsWith('/__ink')) {
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end('<!doctype html><html><head></head><body></body></html>');
    }
    res.writeHead(404); res.end('no');
  }
});
await new Promise(r => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;

const b = await browser();
const page = await (await b.newContext({ viewport: { width: 414, height: 900 } })).newPage();

let failures = 0, precondition = 0;
const fail = m => { failures++; console.error(`  ✗ ${m}`); };
/* Counted separately from what is printed. The list is truncated at ten; the
   summary must not be, or a red line reading "10 failures" understates a hundred. */
const count = n => { failures += n; };

console.log(`ink mass (the skating limb must dominate the free limb) — ` +
            `3 rig moves x 2 views x 2 schemes, ${NFRAMES} frames each` +
            `${BREAK ? ' — with the old two-luminance limb pair put back' : ''}\n`);

for (const scheme of Object.keys(SCHEMES)) {
  /* The real token CSS, from the module the site imports. Not a copy, and not a
     bare page: the whole point of the precondition below. */
  await page.goto(`${origin}/__ink.html`);
  await page.evaluate(html => { document.documentElement.innerHTML = html; },
    `<head><meta charset="utf-8">
      <style>${tokenCSS()}</style>
      <style>:root{color-scheme:${scheme}}html{background:var(--paper)}
        .bf-views{width:372px}.bf-card{background:var(--ice)}.bf-card svg{display:block;width:372px;height:auto}</style>
     </head><body><div id="host"></div></body>`);
  await page.emulateMedia({ colorScheme: scheme });

  const resolved = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { limb: cs.getPropertyValue('--limb').trim(), ice: cs.getPropertyValue('--ice').trim() };
  });
  if (!resolved.limb || !resolved.ice) {
    precondition++;
    fail(`${scheme}: tokens did not resolve (--limb "${resolved.limb}", --ice "${resolved.ice}") — ` +
         `every limb would measure as a fallback colour, so nothing below would mean anything`);
    continue;
  }

  const bad = await page.evaluate(async ([n, origin, brk, oldPair]) => {
    const { mount } = await import(`${origin}/src/lib/body-frame.js`);
    const { MOVES } = await import(`${origin}/src/lib/moves.js`);
    const host = document.getElementById('host');

    const lum = css => {
      const [r, g, bl] = css.match(/[\d.]+/g).slice(0, 3)
        .map(v => Number(v) / 255)
        .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    };

    const out = [];
    for (const move of Object.keys(MOVES)) {
      for (const view of ['side', 'rear']) {
        host.textContent = '';
        const rig = mount(host, { move, views: [view] });
        rig.playing = false;
        for (let i = 0; i < n; i++) {
          rig.seek(Math.round((rig.frames - 1) * (i / (n - 1))));
          const card = host.querySelector('.bf-card');
          const svg = card?.querySelector('svg'); if (!svg) continue;
          const panel = lum(getComputedStyle(card).backgroundColor);

          const ink = {};
          for (const el of svg.querySelectorAll('[data-limb]')) {
            const role = el.getAttribute('data-limb');
            if (brk) el.setAttribute('stroke', oldPair[role]);
            const cs = getComputedStyle(el);
            const w = Number(cs.strokeWidth.replace('px', ''));
            ink[role] = w * Math.abs(lum(cs.stroke) - panel) * Number(cs.opacity || 1);
          }
          /* Both limbs have to be on screen for the comparison to mean anything;
             a view showing only the skating leg is not a failure. */
          if (ink.skating == null || ink.free == null) continue;
          const ratio = ink.free === 0 ? Infinity : ink.skating / ink.free;
          if (ratio < 1.2) {
            out.push({ move, view, frac: +(i / (n - 1)).toFixed(2), ratio: +ratio.toFixed(2),
                       skating: +ink.skating.toFixed(2), free: +ink.free.toFixed(2) });
          }
        }
        rig.destroy();
      }
    }
    return out;
  }, [NFRAMES, origin, BREAK, OLD_PAIR[scheme]]);

  if (!bad.length) console.log(`  ${scheme}: the skating limb dominates in every frame of every move`);
  else {
    console.error(`  ${scheme}`);
    for (const x of bad.slice(0, 10)) {
      console.error(`  ✗ ${x.move} ${x.view} @ ${x.frac}: ink ratio ${x.ratio} ` +
           `(skating ${x.skating}, free ${x.free})${x.ratio < 1 ? ' — role shown BACKWARDS' : ''}`);
    }
    if (bad.length > 10) console.error(`  … and ${bad.length - 10} more`);
    count(bad.length);
  }
}

await b.close();
server.close();

/* 1.2 rather than the 1.8 the weights give, so a deliberate easing of the ratio
   does not fail the gate — what is being caught is a channel cancelling another,
   not a tuning decision. Below 1.0 the panel is stating the opposite of the truth,
   which is what happened. */
if (failures) {
  console.error(`\n${failures} failure(s) — ` + (precondition
    ? 'the tokens did not resolve, so nothing here was measured against a real palette'
    : 'the free limb is competing with the skating one'));
  process.exit(1);
}
console.log('\nweight carries role in every frame, both views, both schemes');
