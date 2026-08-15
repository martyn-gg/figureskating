/* Renders a tracing from foot, edge and direction. The model lives in skating.js
   and is imported, not duplicated — the diagram and the prose on the page are
   incapable of disagreeing about which way a lobe curves. */

import { lobeSense, TURNS, exitState, label } from './skating.js';

const D2R = Math.PI / 180;
const NS = 'http://www.w3.org/2000/svg';
const el = (n, a = {}) => {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  return e;
};

function arc(x0, y0, th0, kappa, len, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (len * i) / n;
    let x, y;
    if (Math.abs(kappa) < 1e-9) { x = x0 + Math.cos(th0) * t; y = y0 + Math.sin(th0) * t; }
    else {
      x = x0 + (Math.sin(th0 + kappa * t) - Math.sin(th0)) / kappa;
      y = y0 - (Math.cos(th0 + kappa * t) - Math.cos(th0)) / kappa;
    }
    pts.push({ x, y, th: th0 + kappa * t });
  }
  return pts;
}

/* Screen coordinates put y downwards, so anticlockwise on the ice is a negative
   turning rate on screen. That sign flip lives here and nowhere else. */
const kappaOf = (s, R) => -lobeSense(s.foot, s.edge, s.dir) / R;

export function buildTrace({ entry, turn, radius = 120, sweep = 96, cuspDepth = 15 }) {
  const N = 200;
  if (!turn) {
    const pts = arc(0, 0, 0, kappaOf(entry, radius), radius * sweep * 1.6 * D2R, N);
    return { frames: pts.map(p => ({ ...p, state: entry, angle: p.th + (entry.dir === 'B' ? Math.PI : 0) })),
             entry, exit: entry, turnIdx: pts.length - 1 };
  }

  const t = TURNS[turn];
  const exit = exitState(entry, turn);
  const kIn = kappaOf(entry, radius), kOut = kappaOf(exit, radius);
  const inPts = arc(0, 0, 0, kIn, sweep * radius * D2R, N);
  const P = inPts[inPts.length - 1];
  const outPts = arc(P.x, P.y, P.th, kOut, sweep * radius * D2R, N);

  /* The cusp points into the circle when the skater rotates into it, out of it
     when they rotate against it — which is the whole difference between a three
     turn and a bracket. */
  const centreDir = P.th + (Math.PI / 2) * Math.sign(kIn);
  const apexDir = t.rotatesInto ? centreDir : centreDir + Math.PI;
  const apex = { x: P.x + Math.cos(apexDir) * cuspDepth, y: P.y + Math.sin(apexDir) * cuspDepth };

  const W = 16;
  const blend = (pts, fromEnd) => pts.map((p, i) => {
    const d = fromEnd ? pts.length - 1 - i : i;
    if (d > W) return p;
    const w = Math.pow(1 - d / W, 1.7);
    return { ...p, x: p.x + (apex.x - p.x) * w, y: p.y + (apex.y - p.y) * w };
  });

  const pts = [...blend(inPts, true), ...blend(outPts, false)];
  const spin = (t.rotatesInto ? 1 : -1) * Math.sign(kIn) * Math.PI;
  const turnIdx = inPts.length - 1;

  const frames = pts.map((p, i) => {
    const past = i > turnIdx;
    const d = (i - turnIdx) / 26;
    const u = Math.min(1, Math.max(0, (d + 1) / 2));
    return { x: p.x, y: p.y, th: p.th, state: past ? exit : entry,
             angle: p.th + (entry.dir === 'B' ? Math.PI : 0) + spin * (u * u * (3 - 2 * u)) };
  });

  return { frames, entry, exit, turnIdx };
}

function boot(state, foot) {
  const g = el('g');
  /* Which side of the blade bites is a property of foot and edge together —
     left foot outside edge is the left side of the boot, left inside the right. */
  const onLeft = (foot === 'L') === (state.edge === 'O');
  const col = state.edge === 'O' ? 'var(--edge-out)' : 'var(--edge-in)';
  for (const y of [-4.2, 4.2])
    g.appendChild(el('line', { x1: -17, y1: y, x2: 19, y2: y, stroke: 'var(--ink-soft)',
      'stroke-width': 1.4, opacity: .35, 'stroke-linecap': 'round' }));
  g.appendChild(el('line', { x1: -17, y1: onLeft ? -4.2 : 4.2, x2: 19, y2: onLeft ? -4.2 : 4.2,
    stroke: col, 'stroke-width': 3.4, 'stroke-linecap': 'round' }));
  g.appendChild(el('path', { d: 'M -18 -8 L 5 -9.5 Q 16 -8.5 18 0 Q 16 8.5 5 9.5 L -18 8 Q -21.5 0 -18 -8 Z',
    fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1.9, 'stroke-linejoin': 'round' }));
  g.appendChild(el('circle', { cx: 13, cy: 0, r: 1.8, fill: 'var(--ink)', opacity: .5 }));
  return g;
}

export function mount(svg, opts) {
  const trace = buildTrace(opts);
  const { frames, entry, exit } = trace;
  const VW = 640, VH = 340;

  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const f of frames) { x0 = Math.min(x0, f.x); y0 = Math.min(y0, f.y); x1 = Math.max(x1, f.x); y1 = Math.max(y1, f.y); }
  const pad = 70, w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
  const s = Math.min(VW / w, VH / h);

  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  svg.textContent = '';
  const root = el('g', { transform:
    `translate(${(VW - w * s) / 2 - (x0 - pad) * s} ${(VH - h * s) / 2 - (y0 - pad) * s}) scale(${s})` });
  svg.appendChild(root);

  const d = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  root.appendChild(el('path', { d: d(frames), fill: 'none', stroke: 'var(--ink)', opacity: .13,
    'stroke-width': 2.6 / s, 'stroke-linecap': 'round' }));

  const drawnIn = el('path', { fill: 'none', 'stroke-width': 3.4 / s, 'stroke-linecap': 'round',
    stroke: entry.edge === 'O' ? 'var(--edge-out)' : 'var(--edge-in)' });
  const drawnOut = el('path', { fill: 'none', 'stroke-width': 3.4 / s, 'stroke-linecap': 'round',
    stroke: exit.edge === 'O' ? 'var(--edge-out)' : 'var(--edge-in)' });
  root.append(drawnIn, drawnOut);
  const bootG = el('g');
  root.appendChild(bootG);

  let i = 0, playing = true, last = 0, raf = 0;
  const seek = n => {
    i = Math.min(frames.length - 1, Math.max(0, n));
    const cut = Math.min(Math.round(i), trace.turnIdx);
    drawnIn.setAttribute('d', d(frames.slice(0, cut + 1)));
    drawnOut.setAttribute('d', Math.round(i) > trace.turnIdx
      ? d(frames.slice(trace.turnIdx, Math.round(i) + 1)) : '');
    const f = frames[Math.round(i)];
    bootG.textContent = '';
    const g = el('g', { transform:
      `translate(${f.x} ${f.y}) rotate(${(f.angle * 180) / Math.PI}) scale(${Math.min(1, 1.15 / s)})` });
    g.appendChild(boot(f.state, entry.foot));
    bootG.appendChild(g);
  };

  const tick = now => {
    const dt = Math.min(64, now - (last || now));
    last = now;
    if (playing) { i += dt * 0.085; if (i >= frames.length - 1) i = 0; seek(i); opts.onFrame?.(i); }
    raf = requestAnimationFrame(tick);
  };
  seek(0);
  raf = requestAnimationFrame(tick);

  return {
    frames: frames.length,
    seek,
    set playing(v) { playing = v; },
    get playing() { return playing; },
    destroy() { cancelAnimationFrame(raf); },
    label: { entry: label(entry), exit: label(exit) },
  };
}
