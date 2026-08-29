/* Nothing may be drawn outside the panel it is drawn in.

   This is the checker the top-down panel needed and did not have. Both renderers
   size their view by measuring the *path* and then draw a body, a boot or a
   marker around it, so the drawn extent is always larger than the extent that
   was measured. While a panel had dead space to spare that overhang landed
   harmlessly inside it; tightening the box to its content exposed a free leg
   hanging 24 px outside the top-down card at the ends of a waltz jump. The bug
   was years older than the box that revealed it.

   It is exactly the class tracing.mjs exists for — a thing that is wrong in the
   picture, invisible in the maths, and plausible at a glance — so it is asserted
   the same way: measure what is actually rendered, not what was intended.

   Every element with a tracing, every move in the rig, every view, sampled
   across the whole animation. Measured in screen space with
   getBoundingClientRect, because getBBox ignores the ancestor transform both
   renderers rely on and will happily report a clean sheet.

   Needs Playwright, so it is not in `npm run check`.

       npm run build && node tools/framing.mjs
       node tools/framing.mjs --frames 21     # finer sampling
*/

import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { browser, ROOT } from './_rig.mjs';

const argv = process.argv.slice(2);
const fi = argv.indexOf('--frames');
const NFRAMES = fi === -1 ? 9 : Number(argv[fi + 1]);
const TOL = 0.75;                    // sub-pixel rounding, not overhang

/* Serve the repository itself, so the page imports the same modules the site
   does rather than a bundled copy of them. */
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html' };
const server = createServer((req, res) => {
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  try {
    const body = readFileSync(p);
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('no'); }
});
await new Promise(r => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;

/* The elements, read from the content files — the checker should cover what the
   site actually ships, not a list of what it is supposed to ship. */
const DIR = join(ROOT, 'src', 'data', 'elements');
const cases = [];
for (const f of readdirSync(DIR).filter(n => n.endsWith('.md'))) {
  const src = readFileSync(join(DIR, f), 'utf8');
  const fm = src.split('---')[1] ?? '';
  const e = fm.match(/entry:\s*\{\s*foot:\s*([LR]),\s*edge:\s*([OI]),\s*dir:\s*([FB])\s*\}/);
  if (!e) continue;
  const turn = fm.match(/^turn:\s*(\w+)/m)?.[1] ?? null;
  const turns = fm.match(/^turns:\s*\[([^\]]+)\]/m)?.[1].split(',').map(s => s.trim()) ?? null;
  cases.push({ id: f.replace(/\.md$/, ''), entry: { foot: e[1], edge: e[2], dir: e[3] }, turn, turns });
}

const b = await browser();
const page = await (await b.newContext({ viewport: { width: 414, height: 900 } })).newPage();
await page.goto(`${origin}/tools/_framing.html`).catch(() => {});
await page.setContent(`<!doctype html><meta charset=utf-8>
  <style>svg{display:block;width:372px;height:auto}.bf-views{width:372px}.bf-card svg{width:372px}</style>
  <div id=host></div><svg id=one></svg>`, { baseURL: origin });

let failures = 0, checked = 0;
const fail = m => { failures++; console.error(`  ✗ ${m}`); };

console.log(`framing (nothing drawn outside its panel) — ${cases.length} tracings, ` +
            `3 rig moves x 3 views, ${NFRAMES} frames each\n`);

/* --- the tracings --- */
const traceBad = await page.evaluate(async ([cases, n, tol, origin]) => {
  const { mount } = await import(`${origin}/src/lib/edge-diagram.js`);
  const svg = document.getElementById('one');
  const bad = [];
  for (const c of cases) {
    const view = mount(svg, { entry: c.entry, turn: c.turn, turns: c.turns });
    view.playing = false;
    for (let i = 0; i < n; i++) {
      view.seek(Math.round((view.frames - 1) * (i / (n - 1))));
      const box = svg.getBoundingClientRect();
      let worst = 0, who = '';
      for (const el of svg.querySelectorAll('path,line,circle,polygon,polyline')) {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        const over = Math.max(box.left - r.left, box.top - r.top, r.right - box.right, r.bottom - box.bottom);
        if (over > worst) { worst = over; who = el.tagName; }
      }
      if (worst > tol) bad.push({ id: c.id, frac: +(i / (n - 1)).toFixed(2), over: Math.round(worst), who });
    }
    view.destroy();
  }
  return bad;
}, [cases, NFRAMES, TOL, origin]);
checked += cases.length * NFRAMES;
for (const x of traceBad.slice(0, 12)) fail(`${x.id} @ ${x.frac}: ${x.who} ${x.over}px outside the panel`);
if (traceBad.length > 12) console.error(`  … and ${traceBad.length - 12} more`);
if (!traceBad.length) console.log(`  tracings: all ${cases.length} inside, every frame`);

/* --- the rig --- */
const rigBad = await page.evaluate(async ([n, tol, origin]) => {
  const { mount } = await import(`${origin}/src/lib/body-frame.js`);
  const { MOVES } = await import(`${origin}/src/lib/moves.js`);
  const host = document.getElementById('host');
  const bad = [];
  for (const move of Object.keys(MOVES)) {
    for (const view of ['top', 'side', 'rear']) {
      host.textContent = '';
      const rig = mount(host, { move, views: [view] });
      rig.playing = false;
      for (let i = 0; i < n; i++) {
        rig.seek(Math.round((rig.frames - 1) * (i / (n - 1))));
        for (const card of host.querySelectorAll('.bf-card')) {
          const svg = card.querySelector('svg'); if (!svg) continue;
          const box = svg.getBoundingClientRect();
          let worst = 0, who = '';
          for (const el of svg.querySelectorAll('path,line,circle,polygon,polyline')) {
            const r = el.getBoundingClientRect();
            if (!r.width && !r.height) continue;
            const over = Math.max(box.left - r.left, box.top - r.top, r.right - box.right, r.bottom - box.bottom);
            if (over > worst) { worst = over; who = el.getAttribute('stroke') || el.tagName; }
          }
          if (worst > tol) bad.push({ move, view, frac: +(i / (n - 1)).toFixed(2), over: Math.round(worst), who });
        }
      }
      rig.destroy();
    }
  }
  return bad;
}, [NFRAMES, TOL, origin]);
checked += 3 * 3 * NFRAMES;
for (const x of rigBad.slice(0, 12)) fail(`${x.move} ${x.view} @ ${x.frac}: ${x.who} ${x.over}px outside the panel`);
if (rigBad.length > 12) console.error(`  … and ${rigBad.length - 12} more`);
if (!rigBad.length) console.log('  rig: all moves, all views, all frames inside');

await b.close();
server.close();

console.log(`\n${checked} frame-panels measured`);
if (failures) { console.error(`${traceBad.length + rigBad.length} outside the panel`); process.exit(1); }
console.log('nothing is drawn outside the panel it belongs to');
