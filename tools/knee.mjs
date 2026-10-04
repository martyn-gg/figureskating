/* WHERE A KNEE CAN POINT, measured before it is changed — Session 31, 04/10/2026.

   Every leg's knee was solved toward the way the pelvis faces. A skater's knee goes
   out over a turned-out foot, so a bent knee over a blade turned off the pelvis drew
   the shin leaning across its boot, and shin.mjs stopped the T at a hip of 92.

   This sweeps the knee-direction rule against hip height and foot yaw on the two
   poses that are waiting on it, the T at the start of pushOffT and the T-stop, and
   prints shin lean through shin.mjs's own expression (imported, not re-derived) and
   whether the hip can turn the foot that far (turnoutAllowed, as turnout.mjs reads it).

   Rules compared, each applied to every foot with steel on the ice:
     pelvis  the knee faces where the pelvis faces (the rule until Session 31)
     half    the knee follows half the foot's turn off the pelvis
     hip     the knee follows the foot as far as the hip can rotate it (HIP_OUT out,
             HIP_IN in); the rest is the shin twisting under a bent knee. This is
             kneeFace, the model's rule since Session 31, read from rig-math.js
     foot    the knee follows the foot all the way

       npm run knee                                  */
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, HIP_OUT, HIP_IN, anterior, twoBone, kneeFace, bootDir, ankleOf,
         turnoutAllowed, kneeFlex, runnersDown, dirOf } from '../src/lib/rig-math.js';
import { shinInBoot, bootFill, LIMIT, FORWARD } from './shin.mjs';
/* Over the boot means shin.mjs's own test since Session 32: forward lean against
   FORWARD, across against LIMIT. The cells still print total lean. */
const legOf = (k, w, face) => { const s = shinInBoot(k, w, face); return { v: s.lean, over: bootFill(s) > 1 + 1e-9 }; };

const wrap = a => { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; };
const sideOf = w => (w === 'L' ? 1 : -1);
const outOf = (k, w) => sideOf(w) * wrap((dirOf(k, w) === 'F' ? 0 : 180) + (k[w].yaw || 0) - k.hipYaw);

const RULES = {
  pelvis: () => 0,
  half:   out => out / 2,
  hip:    null,                       // kneeFace, the model's rule since Session 31
  foot:   out => out,
};
/* "hip" is the model's own rule, read from kneeFace rather than restated here. */
const faceBy = (rule, k, w) => rule === 'hip' ? kneeFace(k, w) : anterior(k.hipYaw + sideOf(w) * RULES[rule](outOf(k, w)));

/* The hip-to-ankle distance turnout.mjs reads the knee's flexion from. */
const flexOf = (k, w) => {
  const q = k[w], hip = { t: 0, n: 0, z: k.hipZ }, k0 = twoBone(hip, q, THIGH, SHIN, kneeFace(k, w));
  const an = ankleOf(k, w, bootDir(k, w, k0, q), [k0.t - q.t, k0.n - q.n, k0.z - q.z]);
  return Math.hypot(an.t, an.n, an.z - k.hipZ);
};

const CASES = [
  { move: 'pushOffT', at: 0, foot: 'R', yaws: [-90, -75, -60], label: "the T at pushOffT's first key" },
  { move: 'tStop',    at: 0, foot: 'L', yaws: [90, 75, 60],    label: 'the T-stop' },
];
const HIPS = [96, 94, 92, 90, 88, 86, 84, 82, 80, 78];

for (const c of CASES) {
  const base = MOVES[c.move].keys[c.at];
  console.log(`\n${c.label} (${c.move}, hipYaw ${base.hipYaw}°, authored hip ${base.hipZ}): worst shin lean over both feet on the ice, ` +
    `limit ${FORWARD}° forward, ${LIMIT}° across\n  * = over the limit, ! = the hip and knee cannot turn the foot this far`);
  for (const yaw of c.yaws) {
    console.log(`\n  ${c.foot} foot yawed ${yaw}°`);
    console.log('   hip  ' + Object.keys(RULES).map(r => r.padStart(12)).join('') + '   flex  out/allowed');
    for (const hipZ of HIPS) {
      const k = { ...base, hipZ, [c.foot]: { ...base[c.foot], yaw } };
      const cells = Object.keys(RULES).map(r => {
        const legs = runnersDown(k).map(w => ({ w, ...legOf(k, w, faceBy(r, k, w)) }));
        const { w, v } = legs.reduce((a, b) => (b.v > a.v ? b : a)), over = legs.some(l => l.over);
        return `${v.toFixed(0).padStart(3)}° ${w}${over ? '*' : ' '}`.padStart(12);
      });
      const d = flexOf(k, c.foot), allow = turnoutAllowed(d), out = outOf(k, c.foot);
      const ok = out <= allow.out + 1e-9 && -out <= allow.in + 1e-9;
      console.log(`   ${String(hipZ).padStart(3)}  ${cells.join('')}   ${kneeFlex(d).toFixed(0).padStart(3)}°  ` +
        `${out.toFixed(0)}/${allow.out.toFixed(0)}${ok ? '' : ' !'}`);
    }
  }
}

/* WHICH WAY THE SHIN LEANS IN ITS BOOT, at the authored hip and four deeper. Forward
   is over the toe, across is toward the boot's own right (+) or left (−). */
console.log('\n\nthe same shins split in the boot frame: forward over the toe / across the boot, degrees');
for (const c of CASES) {
  const base = MOVES[c.move].keys[c.at];
  for (const hipZ of [base.hipZ, base.hipZ - 4, base.hipZ - 8]) {
    const k = { ...base, hipZ };
    console.log(`\n  ${c.move} hip ${hipZ}`);
    for (const w of runnersDown(k)) {
      const row = Object.keys(RULES).map(r => {
        const s = shinInBoot(k, w, faceBy(r, k, w));
        return `${r} ${s.forward.toFixed(0)}/${s.across.toFixed(0)}`.padStart(16);
      });
      console.log(`    ${w} (out ${outOf(k, w).toFixed(0)}°)  ${row.join('')}`);
    }
  }
}

/* SO DOES THE RULE MAKE DEPTH REACHABLE? Under every rule a deeper bend leans the shin
   further; the question is whether placing the feet can take it back out. Each foot on
   the ice is moved along its own heading by δ (forward under the hip, toe-first) and
   the worst lean over both is printed. A lean across the boot cannot be removed this
   way; a lean over the toe can. */
const along = (k, w, dlt) => {
  const h = ((dirOf(k, w) === 'F' ? 0 : 180) + (k[w].yaw || 0));
  const a = anterior(h);
  return { ...k[w], t: k[w].t + a[0] * dlt, n: k[w].n + a[1] * dlt };
};
const DELTAS = [0, 3, 6, 9, 12];
console.log(`\n\nfeet moved along their own heading by δ cm: worst shin lean over both feet, limit ${FORWARD}° forward, ${LIMIT}° across`);
for (const c of CASES) {
  const base = MOVES[c.move].keys[c.at];
  for (const r of ['pelvis', 'hip']) {
    console.log(`\n  ${c.move}, knee rule "${r}"`);
    console.log('   hip ' + DELTAS.map(d => `δ ${d}`.padStart(8)).join(''));
    for (const hipZ of HIPS) {
      let k = { ...base, hipZ };
      const cells = DELTAS.map(dlt => {
        const kk = { ...k };
        for (const w of runnersDown(k)) kk[w] = along(k, w, dlt);
        const legs = runnersDown(kk).map(w => legOf(kk, w, faceBy(r, kk, w)));
        const v = Math.max(...legs.map(l => l.v)), over = legs.some(l => l.over);
        return `${v.toFixed(0)}°${over ? '*' : ' '}`.padStart(8);
      });
      console.log(`   ${String(hipZ).padStart(3)} ${cells.join('')}`);
    }
  }
}
