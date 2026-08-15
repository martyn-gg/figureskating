/* Mount the rig against a DOM stub and exercise every move, view and toggle.
   A parse check catches syntax errors and nothing else; this catches ordering
   bugs, bad transforms, and any attribute that comes out undefined or NaN. */
import { MOVES } from '../src/lib/moves.js';

let created = 0;
const node = tag => {
  created++;
  const n = {
    tagName: tag, children: [], attrs: {}, style: {}, _t: '',
    setAttribute(k, v) {
      if (v === undefined || v === null || (typeof v === 'number' && !isFinite(v)) || String(v).includes('NaN'))
        throw new Error(`bad attribute <${tag} ${k}="${v}">`);
      this.attrs[k] = String(v);
    },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    append(...c) { this.children.push(...c); },
    set textContent(v) { this._t = v; this.children.length = 0; },
    get textContent() { return this._t; },
    set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; },
    classList: { add() {}, remove() {} },
  };
  return n;
};
globalThis.document = { createElementNS: (_, t) => node(t), createElement: node };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

const { mount } = await import('../src/lib/body-frame.js');

let checks = 0;
for (const key of Object.keys(MOVES)) {
  for (const views of [['top', 'side', 'rear'], ['top'], ['side'], ['rear']]) {
    const host = node('div');
    const rig = mount(host, { move: key, views, autoplay: false });
    for (let i = 0; i <= 40; i++) { rig.seek(Math.round((rig.frames - 1) * i / 40)); checks++; }
    for (const k of ['hip', 'sh', 'free', 'arm']) {
      rig.setShow(k, false); rig.setShow(k, true); checks += 2;
    }
    rig.destroy();
  }
  console.log(`  ${MOVES[key].name.padEnd(12)} ${MOVES[key].keys.length} keyframes, all views, all toggles`);
}
console.log(`\n${checks} frames rendered clean across ${Object.keys(MOVES).length} moves · ${created} nodes`);
