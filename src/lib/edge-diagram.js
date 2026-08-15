/* Renders a tracing from foot, edge and direction. The model lives in skating.js
   and is imported, not duplicated — the diagram and the prose on the page are
   incapable of disagreeing about which way a lobe curves. */

import { lobeSense, ALL_TURNS, exitState, label } from './skating.js';

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

/* Two blades are a boot's width apart, so a step lands beside the tracing it
   leaves rather than on top of it. Drawn wider than life, like the edges. */
const STEP_OFFSET = 11;

const smoothstep = u => { const c = Math.min(1, Math.max(0, u)); return c * c * (3 - 2 * c); };

/* One turn or a cluster of them — the difference is only how many times round the
   loop. Pass `turn` for a single turn or `turns` for a chain; a chain shortens each
   segment so three turns still fit on a phone. */
export function buildTrace({ entry, turn, turns, radius = 120, sweep, cuspDepth = 15 }) {
  const N = 200;
  const chain = turns?.length ? turns : (turn ? [turn] : []);
  const span = sweep ?? (chain.length > 1 ? 66 : 96);

  if (!chain.length) {
    const pts = arc(0, 0, 0, kappaOf(entry, radius), radius * 96 * 1.6 * D2R, N);
    return { frames: pts.map(p => ({ ...p, state: entry, angle: p.th + (entry.dir === 'B' ? Math.PI : 0) })),
             entry, exit: entry, states: [entry], marks: [], turnIdx: pts.length - 1, stepped: false };
  }

  const L = span * radius * D2R;
  const W = 16;
  let pts = arc(0, 0, 0, kappaOf(entry, radius), L, N);
  let state = entry;
  const states = [entry];
  const marks = [];              // one per turn: where it happens and what kind

  for (const key of chain) {
    const t = ALL_TURNS[key];
    const next = exitState(state, key);
    const kIn = kappaOf(state, radius), kOut = kappaOf(next, radius);
    const P = pts[pts.length - 1];
    const centreDir = P.th + (Math.PI / 2) * Math.sign(kIn);
    const idx = pts.length - 1;

    /* Half a revolution of the body, unless the direction of travel does not
       change — a crossover or a change of edge leaves you facing the way you
       were already facing. */
    const reverses = t.reversesDir !== false;

    if (t.join === 'step') {
      /* Nothing pivots, so there is nothing to draw a cusp with. The new blade
         goes down beside the skating foot and the old tracing simply stops.
         Faking a cusp would draw a different element. */
      const ox = P.x + Math.cos(centreDir) * STEP_OFFSET;
      const oy = P.y + Math.sin(centreDir) * STEP_OFFSET;
      pts = [...pts, ...arc(ox, oy, P.th, kOut, L, N)];
      marks.push({ idx, after: idx + 1, stepped: true, spin: reverses ? Math.PI : 0, key });
    } else if (t.join === 'roll') {
      /* A change of edge is the one join with nothing at all to see: the blade
         rolls from one edge to the other and the heading never breaks. Drawing a
         cusp here would invent a turn that is not being done. */
      pts = [...pts, ...arc(P.x, P.y, P.th, kOut, L, N)];
      marks.push({ idx, after: idx + 1, stepped: false, spin: 0, key });
    } else if (t.join === 'loop') {
      /* A small circle traced on the same edge, returning to the edge it left —
         so it curves the way the lobe curves and sits inside it. Drawn larger
         than life, like everything else here. */
      const kLoop = Math.sign(kIn) / (radius / 4);
      pts = [...pts,
             ...arc(P.x, P.y, P.th, kLoop, (2 * Math.PI) / Math.abs(kLoop), N),
             ...arc(P.x, P.y, P.th, kOut, L, N)];
      /* The little circle sits between the two halves of the lobe, so the exit
         does not begin until it has closed. */
      marks.push({ idx, after: idx + N + 2, loopFrom: idx + 1, loopTo: idx + N + 1,
                   stepped: false, spin: 0, key });
    } else {
      /* The cusp points into the circle when the skater rotates into it, out of it
         when they rotate against it — the whole difference between a three turn
         and a bracket. */
      const apexDir = t.rotatesInto ? centreDir : centreDir + Math.PI;
      const apex = { x: P.x + Math.cos(apexDir) * cuspDepth, y: P.y + Math.sin(apexDir) * cuspDepth };
      const out = arc(P.x, P.y, P.th, kOut, L, N);
      const pull = (p, d) => {
        if (d > W) return p;
        const w = Math.pow(1 - d / W, 1.7);
        return { ...p, x: p.x + (apex.x - p.x) * w, y: p.y + (apex.y - p.y) * w };
      };
      pts = [
        ...pts.map((p, i) => (i > idx - W ? pull(p, idx - i) : p)),
        ...out.map((p, i) => pull(p, i)),
      ];
      marks.push({ idx, after: idx + 1, stepped: false, spin: reverses ? (t.rotatesInto ? 1 : -1) * Math.sign(kIn) * Math.PI : 0, key });
    }
    state = next;
    states.push(next);
  }

  /* State and heading per frame. Each turn contributes half a revolution to the
     way the skater faces — smoothed through a pivot, instant through a step. */
  const stateAt = i => {
    let s = 0;
    for (const m of marks) if (i > m.idx) s++;
    return states[s];
  };
  const frames = pts.map((p, i) => {
    let a = p.th + (entry.dir === 'B' ? Math.PI : 0);
    for (const m of marks) {
      a += m.spin * (m.stepped ? (i > m.idx ? 1 : 0)
                               : smoothstep(((i - m.idx) / 26 + 1) / 2));
    }
    return { x: p.x, y: p.y, th: p.th, state: stateAt(i), angle: a };
  });

  return { frames, entry, exit: states.at(-1), states, marks,
           turnIdx: marks[0].idx, stepped: marks.some(m => m.stepped) };
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

  /* One drawn segment per edge the skater is on, so a cluster shows its own
     colour changing under the boot rather than one flat line. A segment after a
     step starts one frame later — that gap is the two blades. */
  const segments = [];
  let from = 0;
  for (const m of trace.marks) {
    segments.push({ from, to: m.idx, state: trace.states[segments.length], gapAfter: m.stepped });
    from = m.idx + (m.stepped ? 1 : 0);
  }
  segments.push({ from, to: frames.length - 1, state: trace.states.at(-1), gapAfter: false });

  root.appendChild(el('path', {
    d: segments.map(g => d(frames.slice(g.from, g.to + 1))).join(' '),
    fill: 'none', stroke: 'var(--ink)', opacity: .13,
    'stroke-width': 2.6 / s, 'stroke-linecap': 'round' }));

  const drawn = segments.map(g => el('path', { fill: 'none', 'stroke-width': 3.4 / s,
    'stroke-linecap': 'round',
    stroke: g.state.edge === 'O' ? 'var(--edge-out)' : 'var(--edge-in)' }));
  root.append(...drawn);
  const bootG = el('g');
  root.appendChild(bootG);

  let i = 0, playing = true, last = 0, raf = 0, speed = 1;
  const seek = n => {
    i = Math.min(frames.length - 1, Math.max(0, n));
    const now = Math.round(i);
    segments.forEach((g, k) => {
      const to = Math.min(now, g.to);
      drawn[k].setAttribute('d', to > g.from ? d(frames.slice(g.from, to + 1)) : '');
    });
    const f = frames[now];
    bootG.textContent = '';
    const g = el('g', { transform:
      `translate(${f.x} ${f.y}) rotate(${(f.angle * 180) / Math.PI}) scale(${Math.min(1, 1.15 / s)})` });
    /* The boot takes its foot from the frame, not from the entry — on a mohawk
       the second half of the tracing is the other blade. */
    g.appendChild(boot(f.state, f.state.foot));
    bootG.appendChild(g);
  };

  const tick = now => {
    const dt = Math.min(64, now - (last || now));
    last = now;
    if (playing) { i += dt * 0.085 * speed; if (i >= frames.length - 1) i = 0; seek(i); opts.onFrame?.(i); }
    raf = requestAnimationFrame(tick);
  };
  seek(0);
  raf = requestAnimationFrame(tick);

  return {
    frames: frames.length,
    seek,
    set playing(v) { playing = v; },
    get playing() { return playing; },
    /* A turn at full speed is a smear. The useful view of a counter is a quarter
       of real time, which is not something scrubbing gives you. */
    set speed(v) { speed = v; },
    get speed() { return speed; },
    destroy() { cancelAnimationFrame(raf); },
    label: { entry: label(entry), exit: label(exit) },
  };
}
