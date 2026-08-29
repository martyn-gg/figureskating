/* One frame of the rig, as a standalone SVG file, without a browser.

   The three renderers only need a DOM to hang elements off, so this gives them a
   stub, then walks the tree back out as text. Same code path the page runs —
   viewTop and viewProfile, the real fit, the real draw order — so what comes out
   is the picture, not an approximation of it.

   It exists because the repo's rule is that a sign is a screenshot question, and
   a screenshot needed Playwright, which needs a browser download, which is not
   always available where the work is happening. The custom properties are
   resolved from tokens.js on the way out so the file stands alone.

   For anything that needs the real page — CSS, layout, the scheme switch, the
   fit at a given viewport — use page-shot.mjs. This is for looking at geometry.

       node tools/frame-svg.mjs waltz 0.25 shots            # t as a fraction
       node tools/frame-svg.mjs waltz 0.25 shots --scheme dark
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { ROOT } from './_rig.mjs';
import { SCHEMES } from '../src/lib/tokens.js';

const [moveId = 'waltz', atRaw = '0', outRaw = '.'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const si = process.argv.indexOf('--scheme');
const scheme = si === -1 ? 'light' : process.argv[si + 1];
const at = Number(atRaw);
const out = resolve(outRaw);
if (!Number.isFinite(at) || at < 0 || at > 1) { console.error('t must be a fraction 0..1'); process.exit(2); }
if (!SCHEMES[scheme]) { console.error(`unknown scheme: ${scheme}`); process.exit(2); }

/* A DOM stub that keeps what it is given, in order — order is the depth claim,
   so a stub that reordered anything would be lying about the thing most often
   being checked here. */
const svgs = [];
const node = tag => {
  const n = {
    tagName: tag, children: [], attrs: {}, style: {}, _t: '',
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    append(...c) { this.children.push(...c); },
    set textContent(v) { this._t = v; this.children.length = 0; },
    get textContent() { return this._t; },
    set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; },
    classList: { add() {}, remove() {} },
  };
  if (tag === 'svg') svgs.push(n);
  return n;
};
globalThis.document = { createElementNS: (_, t) => node(t), createElement: node };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const { mount } = await import('../src/lib/body-frame.js');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ser = n => `<${n.tagName}${Object.entries(n.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')}>` +
  `${esc(n._t || '')}${n.children.map(ser).join('')}</${n.tagName}>`;
const standalone = n => {
  let s = ser(n).replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg"`);
  for (const [k, v] of Object.entries(SCHEMES[scheme])) s = s.split(`var(--${k})`).join(v);
  return s.replace('>', ` style="background:${SCHEMES[scheme].ice}">`);
};

mkdirSync(out, { recursive: true });
const host = node('div');
const rig = mount(host, { move: moveId, views: ['top', 'side', 'rear'], autoplay: false });
rig.seek(Math.round((rig.frames - 1) * at));

const tag = `${moveId}-${String(Math.round(at * 100)).padStart(3, '0')}${scheme === 'light' ? '' : '-' + scheme}`;
['top', 'side', 'rear'].forEach((name, i) => {
  const f = join(out, `${tag}-${name}.svg`);
  writeFileSync(f, standalone(svgs[i]));
  console.log(`  ${f.replace(ROOT + '/', '')}`);
});
