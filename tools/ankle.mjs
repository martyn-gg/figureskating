/* The evidence for ANKLE_MAX, runnable.
 *
 * A constant with a comment is a guess with a footnote. ANKLE_FREE was 10 degrees
 * from 30/08/2026 back to Session 04 and docs/model.md was honest that it was a
 * guess — "not the 68 I first guessed" — so this file exists to keep the number and
 * the measurement in the same place. It reports; it asserts nothing.
 *
 *   node tools/ankle.mjs            the two tables
 *   node tools/ankle.mjs --sweep    plus the camel-space sweep (slow, ~300k poses)
 *
 * WHERE THE NUMBER COMES FROM. Manufacturers publish stiffness ratings and not
 * angles — Edea 40-95, Jackson 2-95, and the two scales are not comparable to one
 * another, let alone to a degree. The number is in the injury literature instead:
 * Fortin et al., reported in Lower Extremity Review's "Over the Edge", measured a
 * rigid boot taking 15 degrees of plantarflexion and 10 of dorsiflexion off normal
 * ankle motion. A bare ankle plantarflexes about 45, so a boot allows about 30.
 * Verified against a coach: NO. A study of injury is not a study of what a position
 * looks like.
 */
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, D2R, ANKLE_MAX, ANKLE_POINT, anterior, twoBone, bootDir,
         ankleOf, poseAt } from '../src/lib/rig-math.js';

const elevOf = (pose, w) => {
  const q = pose[w], hip = { t:0, n:0, z:pose.hipZ };
  const k0 = twoBone(hip, q, THIGH, SHIN, anterior(pose.hipYaw));
  const bd = bootDir(pose, w, k0, q);
  return Math.asin(Math.max(-1, Math.min(1, -bd[2]))) / D2R;
};
const worstFree = (m, point) => {
  let w = 0;
  for (let i = 0; i <= 320; i++) {
    const k = poseAt(m, i / 320);
    for (const side of ['L','R']) {
      if (k.skate === side || (k[side] && k[side].onIce)) continue;
      const e = Math.abs(elevOf({ ...k, [side]: { ...k[side], point } }, side));
      if (e > w) w = e;
    }
  }
  return w;
};

console.log(`ANKLE_MAX ${ANKLE_MAX}deg — what the boot allows`);
console.log(`ANKLE_POINT ${ANKLE_POINT}deg — what an unauthored foot does\n`);

console.log('1. WHY THE NUMBER IS NOT A KNOB. Worst free-boot angle from level, every');
console.log('   frame, with every free foot forced to the same point. freefoot.mjs');
console.log('   fails past 60.\n');
const ids = Object.keys(MOVES).filter(id => MOVES[id].keys.some(k => k.skate));
process.stdout.write('  point  ');
for (const id of ids) process.stdout.write(id.slice(0,11).padStart(13));
console.log('   over 60');
for (const point of [10,15,20,25,30]) {
  process.stdout.write(String(point).padStart(6) + '   ');
  let bad = 0;
  for (const id of ids) {
    const w = worstFree(MOVES[id], point);
    if (w > 60) bad++;
    process.stdout.write((`${w.toFixed(0)}${w > 60 ? '!' : ' '}`).padStart(13));
  }
  console.log(String(bad).padStart(10));
}
console.log('\n   Two improve and three break, and the reason is not the number. Before');
console.log('   30/08/2026 bootDir applied one constant to every free foot in every');
console.log('   frame, so it was an identity and not a limit: every foot was pointed');
console.log('   exactly this hard, always. Plantarflexion drives the blade wherever the');
console.log('   shin already points — it lifts the toe on a spiral and drives it at the');
console.log('   ice on a landing. That is the whole of the table above, and it is why');
console.log('   the ankle is authored per foot now rather than set once here.\n');

console.log('2. WHAT IT UNLOCKS. Legal ISU camels — free leg backwards, free knee above');
console.log('   the hip, within reach, boot inside 60 — over a grid of free-foot');
console.log('   positions where a camel actually lives.\n');
const camels = (point) => {
  let n = 0;
  for (let hipZ = 84; hipZ <= 96; hipZ += 2)
   for (let ft = 60; ft <= 105; ft += 1)
    for (let fn = -16; fn <= 8; fn += 4)
     for (let fz = hipZ - 15; fz <= hipZ + 30; fz += 2) {
       const pose = { hipZ, hipYaw: 180, skate: 'L', R: { t: ft, n: fn, z: fz, pitch: 0, point } };
       const hip = { t:0, n:0, z:hipZ }, q = pose.R;
       const k0 = twoBone(hip, q, THIGH, SHIN, anterior(180));
       const bd = bootDir(pose, 'R', k0, q);
       const an = ankleOf(q, bd, [k0.t-q.t, k0.n-q.n, k0.z-q.z]);
       const kn = twoBone(hip, an, THIGH, SHIN, anterior(180));
       if (kn.z > hipZ
           && Math.hypot(an.t, an.n, an.z - hipZ) <= THIGH + SHIN
           && Math.abs(Math.asin(Math.max(-1,Math.min(1,-bd[2]))) / D2R) <= 60) n++;
     }
  return n;
};
for (const point of [10,15,20,25,30])
  console.log(`   point ${String(point).padStart(2)}deg   ${String(camels(point)).padStart(5)} legal` +
    (point === 10 ? '   <- none. this was the wall.' : ''));
console.log('\n   The camel spin was undrawable at 10 and is drawable from 15 up. It is');
console.log('   the same wall the lunge hit, and it is the same constant.');

console.log('\n3. WHAT IT DECIDES. Same constant read backwards. A free foot authors its');
console.log('   ankle angle and the boot follows; a PICKED foot authors the boot — pitch,');
console.log('   on the ice — and the ankle angle follows. So ANKLE_MAX stops being a range');
console.log('   to check a typed number against and becomes a constraint on the POSE.');
console.log('   Steepest boot a picked foot can hold with its toe on the ice, by hip');
console.log('   height, over a reach of 25-60 cm:\n');
const pickCeiling = (hipZ) => {
  let best = null;
  for (let ft = 25; ft <= 60; ft += 1)
    for (let p = 4; p <= 89; p += 1) {
      const pose = { hipZ, hipYaw: 176, skate: 'R',
                     L: { t: ft, n: -16, z: 0, pitch: p, onIce: 'pick' },
                     R: { t: -34, n: 7, z: 0, pitch: -0.5 } };
      const q = pose.L, hip = { t: 0, n: 0, z: hipZ };
      const k0 = twoBone(hip, q, THIGH, SHIN, anterior(176));
      const bd = bootDir(pose, 'L', k0, q);
      const an = ankleOf(q, bd, [k0.t-q.t, k0.n-q.n, k0.z-q.z]);
      if (Math.hypot(an.t, an.n, an.z - hipZ) > THIGH + SHIN) continue;
      const s = [q.t-k0.t, q.n-k0.n, q.z-k0.z], sl = Math.hypot(...s) || 1;
      const a = Math.asin(Math.max(-1, Math.min(1,
        (bd[0]*s[0] + bd[1]*s[1] + bd[2]*s[2]) / sl))) / D2R;
      if (a >= 0 && a <= ANKLE_MAX && (!best || p > best.p)) best = { p, ft, a };
    }
  return best;
};
for (const hipZ of [46, 50, 54, 58, 62, 64, 66, 70, 74, 76, 78, 82, 86, 90, 94]) {
  const b = pickCeiling(hipZ);
  console.log(`   hip ${String(hipZ).padStart(2)} cm   ` + (b
    ? `boot up to ${String(b.p).padStart(2)}deg   (reach ${b.ft} cm, ankle ${b.a.toFixed(0)}deg)`
    : 'no legal pick at any pitch or reach'));
}
console.log('\n   A blade needs 3.5deg of pitch before the teeth reach the ice at all, so');
console.log('   the bottom of that column is not "a shallow pick" — it is no pick. The');
console.log('   only way to tilt the boot further with the toe down is to tilt the whole');
console.log('   leg, and the only way to do that is to sink. Which is what a skater does');
console.log('   before they pick: nobody authored it, this did.');
