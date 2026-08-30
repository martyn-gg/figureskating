/* One frame of the rig, as a standalone SVG file, without a browser.

   Renders through tools/_dom.mjs, which gives the real renderers a DOM stub —
   same code path the page runs, so what comes out is the picture, not an
   approximation of it. The custom properties are resolved from tokens.js on the
   way out so the file stands alone.

   It exists because the repo's rule is that a sign is a screenshot question, and
   a screenshot needed Playwright, which needs a browser download, which is not
   always available where the work is happening.

   For anything that needs the real page — CSS, layout, the scheme switch, the
   fit at a given viewport — use page-shot.mjs. This is for looking at geometry.

       node tools/frame-svg.mjs waltz 0.25 shots            # t as a fraction
       node tools/frame-svg.mjs waltz 0.25 shots --scheme dark
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { ROOT } from './_rig.mjs';
import { SCHEMES } from '../src/lib/tokens.js';
import { rigFor, standalone } from './_dom.mjs';

const [moveId = 'waltz', atRaw = '0', outRaw = '.'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const si = process.argv.indexOf('--scheme');
const scheme = si === -1 ? 'light' : process.argv[si + 1];
const at = Number(atRaw);
const out = resolve(outRaw);
if (!Number.isFinite(at) || at < 0 || at > 1) { console.error('t must be a fraction 0..1'); process.exit(2); }
if (!SCHEMES[scheme]) { console.error(`unknown scheme: ${scheme}`); process.exit(2); }

mkdirSync(out, { recursive: true });
const views = ['top', 'side', 'rear'];
const { rig, svgs } = rigFor(moveId, views);
rig.seek(Math.round((rig.frames - 1) * at));

const tag = `${moveId}-${String(Math.round(at * 100)).padStart(3, '0')}${scheme === 'light' ? '' : '-' + scheme}`;
views.forEach((name, i) => {
  const f = join(out, `${tag}-${name}.svg`);
  writeFileSync(f, standalone(svgs[i], scheme));
  console.log(`  ${f.replace(ROOT + '/', '')}`);
});
