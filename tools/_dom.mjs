/* The browserless render path, in one place.

   The three renderers only need a DOM to hang elements off. Giving them a stub
   runs the real code — viewTop and viewProfile, the real fit, the real draw
   order — so what comes out is the picture, not an approximation of it.

   It lives here rather than inside frame-svg.mjs because tools/boot.mjs needs
   the same thing, and two copies of a stub whose whole job is to preserve order
   faithfully is exactly the kind of second copy this repository does not keep.

   The stub keeps what it is given, IN ORDER. Order is the depth claim, so a stub
   that reordered anything would be lying about the thing most often checked here.
*/
import { SCHEMES } from '../src/lib/tokens.js';

const svgs = [];

export const node = tag => {
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

/* Imported only after the stub is installed — body-frame.js touches document at
   module scope through el(), so the order here is load-bearing. */
export const bodyFrame = await import('../src/lib/body-frame.js');
export const { mount, armsAuthored, ARM_END_ON } = bodyFrame;

/* Mount a move once and hand back the view SVGs plus the rig handle. Seeking
   repaints into the same nodes, so a whole-move sweep costs one mount. */
export function rigFor(move, views = ['top', 'side', 'rear']) {
  svgs.length = 0;
  const rig = mount(node('div'), { move, views, autoplay: false });
  const byView = Object.fromEntries(views.map((v, i) => [v, svgs[i]]));
  return { rig, svgs: svgs.slice(), byView, views };
}

/* Depth-first, parents before children — the order they were appended in. */
export function walk(n, fn) { fn(n); for (const c of n.children) walk(c, fn); }

export function findAll(n, pred) {
  const out = [];
  walk(n, x => { if (pred(x)) out.push(x); });
  return out;
}

/* Serialise one view SVG standalone, with the scheme's custom properties
   resolved so the file does not depend on a stylesheet. */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ser = n => `<${n.tagName}${Object.entries(n.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')}>` +
  `${esc(n._t || '')}${n.children.map(ser).join('')}</${n.tagName}>`;

export function standalone(n, scheme = 'light') {
  let s = ser(n).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  for (const [k, v] of Object.entries(SCHEMES[scheme])) s = s.split(`var(--${k})`).join(v);
  return s.replace('>', ` style="background:${SCHEMES[scheme].ice}">`);
}
