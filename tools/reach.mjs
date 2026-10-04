/* Every foot must be within the leg's reach, measured to the ankle inside the
   boot — not to the blade. Out of reach means the leg visibly detaches. */
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, kneeFace, bootDir, ankleOf, onIceOf, buildPath, poseAt } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];

const REACH = THIGH + SHIN;
let bad = 0;
console.log(`hip → ankle distance against a ${REACH} cm leg\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    for (const w of ['L', 'R']) {
      const q = k[w], on = onIceOf(k, w);
      const k0 = twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, kneeFace(k, w));
      const bd = bootDir(k, w, k0, q);   // planted or free — bootDir reads the pose
      const an = ankleOf(k, w, bd, [k0.t-q.t, k0.n-q.n, k0.z-q.z]);
      const d = Math.hypot(an.t, an.n, an.z - k.hipZ);
      if (d > REACH) {
        bad++;
        console.log(`  OVER  ${key.padEnd(9)} t=${k.t.toFixed(2)} ${w} ${(on || 'free').padEnd(5)}  ` +
          `${d.toFixed(0)}cm = ${(100 * d / REACH).toFixed(0)}%   blade(${q.t},${q.n},${q.z})`);
      }
    }

/* EVERY FRAME ON A PICK — 04/10/2026, Session 29, docs/spec-anchor.md part C. The
   loop above reads keyframes, which was enough while every foot was interpolated
   between two authored places. A pinned pick is not: between its keys it is wherever
   the ice holds it, and the hip travels away from it or over it. So reach is the live
   constraint there, and it is measured on every frame. It fails rather than clamping:
   the frame the hip outruns the leg is the frame the pick has to come out, and twoBone
   would otherwise straighten the leg and quietly draw it short.

   --break=far puts the run's first pinned key 50 cm further behind: 1 run, 23 frames. */
const brkFar = m => BREAK !== 'far' ? m : { ...m, keys: m.keys.map(k => {
  for (const w of ['L', 'R']) if (k[w]?.pin) {
    const i = m.keys.indexOf(k);
    if (i > 0 && m.keys[i - 1][w]?.pin) continue;
    return { ...k, [w]: { ...k[w], t: k[w].t + 50 * Math.sign(k[w].t || 1) } };
  }
  return k;
}) };
let pickFrames = 0;
for (const [key, m0] of Object.entries(MOVES)) {
  if (!m0.keys.some(k => onIceOf(k, 'L') === 'pick' || onIceOf(k, 'R') === 'pick')) continue;
  const m = brkFar(m0), N = buildPath(m).length;
  let run = null;
  const flush = () => { if (run) { bad++; console.log(`  OVER  ${key.padEnd(9)} ${run.w} pick, ${run.n} frames from ` +
    `f=${run.from.toFixed(3)}, worst ${run.worst.toFixed(0)}% — out of the leg's reach: either it went in too far away or the hip has outrun it and it has to come out`); run = null; } };
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1), k = poseAt(m, f);
    for (const w of ['L', 'R']) {
      if (onIceOf(k, w) !== 'pick') continue;
      pickFrames++;
      const q = k[w];
      const k0 = twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, kneeFace(k, w));
      const bd = bootDir(k, w, k0, q);
      const an = ankleOf(k, w, bd, [k0.t-q.t, k0.n-q.n, k0.z-q.z]);
      const pct = 100 * Math.hypot(an.t, an.n, an.z - k.hipZ) / REACH;
      if (pct > 100) { run ??= { w, from: f, n: 0, worst: 0 }; run.n++; run.worst = Math.max(run.worst, pct); }
      else flush();
    }
  }
  flush();
}
console.log(`${pickFrames} frames on a pick measured, every frame`);

console.log(bad ? `\n${bad} feet beyond reach — the leg would detach from the boot` : 'all feet within reach');
process.exit(bad ? 1 : 0);
