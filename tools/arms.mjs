/* The arms, and the six things the drawing now claims.

   Every frame of every move, both profile views. The arms are the last part of
   the rig to get a depth claim at all, and the reason they needed one is that
   they already had one: viewProfile drew the legs sorted, then the torso, then
   both arms in fixed L,R order, so an arm behind the chest drew in front of it
   and the further arm drew over the nearer one whenever L was the far side.
   Draw order is a depth claim whether or not anybody decided it.

   1  EVERY SEGMENT CARRIES data-depth AND THE DRAWN ORDER IS NON-DECREASING IN IT.
      This is the assertion that discriminates. It fails, by construction, both
      today's renderer and the torso-as-a-layer option: neither sorts the torso,
      so their drawn order cannot be monotonic in the depth they drew. That
      argument came out of writing this checker rather than out of the pictures.

   2  CASINGS = SEGMENTS - 1, EACH RETRACTED FROM ITS OWN JOINT AND NOWHERE ELSE.
      Casing says "I am in front of this", so everything but the furthest thing
      has one. The retraction is what makes that possible per segment: a casing is
      wider than the stroke it protects, so without it the second-drawn half of a
      limb paints a notch into the first. The first attempt suppressed the casing
      instead, which removed the halo from the second half of nearly every limb.

   3  NO ARM SEGMENT CARRIES MORE INK THAN A SKATING LEG. Weight is the depth
      channel and role is what it encodes; an arm that outweighed the skating leg
      would be claiming to be the subject of the frame.

   4  THE ELBOW IS NOT DRAWN BELOW THE PROJECTED-BEND THRESHOLD, joint circle
      included. Checked both ways against the bend recomputed from rig-math, so a
      glyph cannot be dropped where the bend is visible or drawn where it is not.

   5  BOTH HANDS ARE ACCOUNTED FOR IN EVERY FRAME THAT DRAWS ARMS. One L, one R,
      never two of either and never one missing behind the other.

   6  AN AUTHORED LH/RH SURVIVES THE DEFAULT-CARRIAGE ASSIGNMENT. moves.js says
      "any key may override with LH / RH"; until 29/08/2026 the loop assigned
      unconditionally, so an authored hand was computed, stored and overwritten
      before anything read it. Nothing failed and no checker looked — the same
      shape as the featured filter that absorbed the twizzles. This asserts the
      value that survives is not the one the default would have written.

       node tools/arms.mjs
*/
import { MOVES } from '../src/lib/moves.js';
import { D2R, anterior, lateral, UPPER, FORE, shoulderJoint, elbowFace, twoBone,
         buildPath, poseAt } from '../src/lib/rig-math.js';
import { rigFor, walk, armsAuthored, ARM_END_ON } from './_dom.mjs';

const fails = { order: 0, casing: 0, ink: 0, elbow: 0, hands: 0, authored: 0 };
const say = (k, ...a) => { fails[k]++; if (fails[k] <= 5) console.log('  ' + a.join(' ')); };
const pt = d => { const m = /^M ([-\d.e]+) ([-\d.e]+) L ([-\d.e]+) ([-\d.e]+)$/.exec(d); return m && m.slice(1).map(Number); };

/* Which end of a split segment meets its sibling, read off the DOM rather than
   assumed — the renderer says which half it is drawing. */
const JOINT_END = {
  thigh: 'b', shin: 'a', lower: 'b', upper_torso: 'a', upper: 'b', fore: 'a',
};
const jointEndOf = n =>
  n.attrs['data-leg'] ? JOINT_END[n.attrs['data-leg']]
  : n.attrs['data-torso'] ? (n.attrs['data-torso'] === 'lower' ? 'b' : 'a')
  : n.attrs['data-arm'] === 'upper' ? 'b'
  : n.attrs['data-arm'] === 'fore' ? 'a'
  : null;                                     // 'straight' — one piece, no joint

let frames = 0, segments = 0, armSegs = 0, elbows = 0, endOns = 0;

for (const [key, m] of Object.entries(MOVES)) {
  const path = buildPath(m);
  for (const mode of ['side', 'rear']) {
    const { rig, byView } = rigFor(key, [mode]);
    const svg = byView[mode];
    const vx = v => mode === 'side' ? v[0] : v[1];

    for (let i = 0; i < rig.frames; i++) {
      rig.seek(i);
      frames++;
      const pose = poseAt(m, i / (path.length - 1));
      const where = `${key} ${mode} f=${i}`;

      /* Walk once, in document order — which IS draw order. */
      const drawn = [], casings = [], hands = [], elbowSides = [];
      let skatingInk = Infinity, prevCasing = null, groundY = null, hipY = null;
      walk(svg, n => {
        /* the panel's own two reference points, for the scale in assertion 4 */
        if (n.tagName === 'line' && groundY === null && n.attrs.stroke === 'var(--ink)'
            && n.attrs.x1 === '0' && n.attrs.y1 === n.attrs.y2) groundY = Number(n.attrs.y1);
        if (n.tagName === 'circle' && n.attrs.fill === 'var(--hip)') hipY = Number(n.attrs.cy);
        if (n.attrs['data-casing'] !== undefined) { prevCasing = n; casings.push(n); return; }
        if (n.attrs['data-hand'] !== undefined && n.tagName !== 'text') hands.push(n.attrs['data-hand']);
        if (n.tagName === 'text' && n.attrs['data-hand'] !== undefined) hands.push(n.attrs['data-hand']);
        if (n.attrs['data-elbow'] !== undefined) elbowSides.push(n.attrs['data-elbow']);
        if (n.attrs['data-depth'] === undefined) return;
        drawn.push({ n, depth: Number(n.attrs['data-depth']), casing: prevCasing });
        prevCasing = null;
        if (n.attrs['data-limb'] === 'skating') skatingInk = Math.min(skatingInk, Number(n.attrs['stroke-width']));
        if (n.attrs['data-arm'] !== undefined) armSegs++;
        segments++;
      });

      /* 1 — the drawn order is the depth order */
      for (let k = 1; k < drawn.length; k++)
        if (drawn[k].depth < drawn[k - 1].depth - 1e-9)
          say('order', `ORDER  ${where}  ${drawn[k - 1].depth} then ${drawn[k].depth} — drawn out of depth`);

      /* 2 — casings = segments − 1, each on its own segment, retracted at its joint */
      if (casings.length !== drawn.length - 1)
        say('casing', `CASING ${where}  ${casings.length} casings for ${drawn.length} segments`);
      for (const d of drawn) {
        if (!d.casing) continue;
        const s = pt(d.n.attrs.d), c = pt(d.casing.attrs.d);
        if (!s || !c) { say('casing', `CASING ${where}  unparseable path`); continue; }
        const [ax, ay, bx, by] = s, L = Math.hypot(bx - ax, by - ay) || 1;
        const par = (x, y) => ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (L * L);
        const off = (x, y) => Math.abs((x - ax) * (by - ay) - (y - ay) * (bx - ax)) / L;
        const ta = par(c[0], c[1]), tb = par(c[2], c[3]);
        if (off(c[0], c[1]) > 0.01 || off(c[2], c[3]) > 0.01)
          say('casing', `CASING ${where}  casing is not on its own segment's line`);
        if (ta < -1e-6 || tb > 1 + 1e-6)
          say('casing', `CASING ${where}  casing overruns its segment (${ta.toFixed(3)}..${tb.toFixed(3)})`);
        const end = jointEndOf(d.n);
        if (end && L > 2 * ((Number(d.n.attrs['stroke-width']) + 5) / 2)) {
          const short = end === 'a' ? ta > 1e-6 : tb < 1 - 1e-6;
          if (!short) say('casing', `CASING ${where}  casing runs into the joint at end ${end}` +
            ` (${d.n.attrs['data-leg'] || d.n.attrs['data-torso'] || d.n.attrs['data-arm']})`);
        }
      }

      /* 3 — arm ink never outweighs the skating leg */
      for (const d of drawn) {
        if (d.n.attrs['data-arm'] === undefined) continue;
        if (Number(d.n.attrs['stroke-width']) >= skatingInk)
          say('ink', `INK    ${where}  arm at ${d.n.attrs['stroke-width']} vs skating leg ${skatingInk}`);
      }

      /* 4 — the elbow follows the projected bend, both ways.

         The threshold is in the PANEL's units, so the panel's scale is needed.
         It is read off the drawing rather than by restating the renderer's fit:
         the ice line is at the ground and the hip marker is at the hip's height,
         so S is the ratio between them. If the fit ever changes, this follows it. */
      const S = (groundY - hipY) / (pose.hipZ || 1);
      for (const [side, which] of [[-1, 'L'], [1, 'R']]) {
        const j = shoulderJoint(pose, side), hand = pose[which + 'H'];
        const eb = twoBone(j, hand, UPPER, FORE, elbowFace(pose, side));
        const dx = (vx([hand.t, hand.n]) - vx([j.t, j.n])) * S, dy = -(hand.z - j.z) * S;
        const ex = (vx([eb.t, eb.n]) - vx([j.t, j.n])) * S, ey = -(eb.z - j.z) * S;
        const len = Math.hypot(dx, dy) || 1e-6;
        const bend = Math.abs(ex * dy - ey * dx) / len;          // projected, in panel units
        const wantEndOn = bend < ARM_END_ON;

        const drawnEndOn = drawn.some(d => d.n.attrs['data-arm-side'] === which && d.n.attrs['data-end-on'] !== undefined);
        const hasElbow = elbowSides.includes(which);
        if (drawnEndOn) endOns++; else elbows++;

        if (drawnEndOn !== wantEndOn)
          say('elbow', `ELBOW  ${where} ${which}  drawn ${drawnEndOn ? 'end-on' : 'bent'} at a projected ` +
            `bend of ${bend.toFixed(2)} against a ${ARM_END_ON} threshold`);
        if (drawnEndOn && hasElbow)
          say('elbow', `ELBOW  ${where} ${which}  end-on arm still drew its joint circle`);
        if (!drawnEndOn && !hasElbow)
          say('elbow', `ELBOW  ${where} ${which}  bent arm drew no joint circle`);
      }

      /* 5 — both hands, exactly once each */
      const hs = hands.slice().sort().join('');
      if (hs !== 'LR') say('hands', `HANDS  ${where}  hands drawn: [${hands.join(',')}]`);
    }
  }
}

/* 6 — an authored hand survives the default carriage. Recomputed here from the
   same inputs moves.js uses, so this asserts the guard rather than restating it:
   without the guard the stored value IS the default, exactly. */
let authoredKeys = 0;
for (const [key, m] of Object.entries(MOVES)) {
  for (const k of m.keys) {
    const R = lateral(k.shYaw), F = anterior(k.shYaw);
    const [out, fwd, drop] = k.arm || [67, 8, 20];
    for (const [side, w] of [[-1, 'L'], [1, 'R']]) {
      const h = k[w + 'H'];
      if (!h || !h.authored) continue;
      authoredKeys++;
      const dflt = { t: k.sh.t + R[0] * out * side + F[0] * fwd,
                     n: k.sh.n + R[1] * out * side + F[1] * fwd, z: k.sh.z - drop };
      if (Math.hypot(h.t - dflt.t, h.n - dflt.n, h.z - dflt.z) < 1e-6)
        say('authored', `AUTHOR ${key} t=${k.t} ${w}H  authored hand equals the default carriage — the guard is gone`);
    }
  }
  const drew = armsAuthored(m);
  const has = m.keys.some(k => (k.LH && k.LH.authored) || (k.RH && k.RH.authored));
  if (drew !== has) say('authored', `AUTHOR ${key}  armsAuthored says ${drew}, the keys say ${has}`);
}
if (!authoredKeys)
  say('authored', 'AUTHOR no move in the repo authors a hand — assertion 6 would pass vacuously');

console.log(`\n${frames} frames, ${segments} segments (${armSegs} arm), ` +
  `${elbows} elbows drawn, ${endOns} arms end-on, ${authoredKeys} authored hands\n`);
const bad = Object.values(fails).reduce((a, b) => a + b, 0);
console.log(bad
  ? Object.entries(fails).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(', ')
  : 'every segment states its depth and is drawn in it; every casing is retracted from its own ' +
    'joint;\nno arm outweighs a skating leg; every elbow matches its projected bend; both hands ' +
    'in every frame;\nand an authored hand survives the default carriage');
process.exit(bad ? 1 : 0);
