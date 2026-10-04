/* THE RIG HAS MASS — Session 32, 04/10/2026.

   Until today the rig was markers. Balance is about mass, so "is this skater over
   the blade" could only be judged by eye, and docs/model.md said, more than once,
   that fore-aft balance is asserted nowhere. This is the measurement. It moves no
   pose and draws nothing: tools/balance.mjs reads it, and the targets a checker
   would need (where the mass should sit, phase by phase) are not set yet.

   SEGMENT FRACTIONS ARE WINTER'S (Biomechanics and Motor Control of Human Movement,
   table 4.1, after Dempster): the share of body mass in each segment and where along
   the segment its own centre sits, measured from the proximal joint. Head and neck
   are not drawn by the rig, so the head is placed HEAD_UP along the trunk above the
   shoulder line (an ear is about a ninth of stature above the shoulders, and this
   rig's shoulders put stature near 178 cm). A skating boot with its blade is about
   1.2 kg, two per cent of a 60 kg skater, and sits with the foot at the blade's middle.

   Joints come from the same functions the renderer uses (twoBone, kneeFace, bootDir,
   ankleOf, shoulderJoint, elbowFace), so the mass sits where the drawn limbs are. */
import { THIGH, SHIN, UPPER, FORE, twoBone, kneeFace, bootDir, ankleOf,
         shoulderJoint, elbowFace, contactAlongOf, runnersDown, anterior } from './rig-math.js';

export const HEAD_UP = 20;                         // cm along the trunk above the shoulder line

/* [share of body mass, centre from the proximal end as a fraction of the segment] */
export const SEGMENTS = {
  head:     [0.081, null],                         // placed, not along a segment
  trunk:    [0.497, 0.50],                         // hip joint to shoulder line
  upperArm: [0.028, 0.436],                        // shoulder to elbow, each
  foreHand: [0.022, 0.682],                        // elbow to hand, each
  thigh:    [0.100, 0.433],                        // hip to knee, each
  shank:    [0.0465, 0.433],                       // knee to ankle, each
  footBoot: [0.0145 + 0.020, null],                // foot and skate, each, at the blade's middle
};
/* The table's shares sum past one once the boots are added; normalised here so the
   centre is a true weighted mean. */
export const TOTAL = Object.entries(SEGMENTS)
  .reduce((s, [k, [m]]) => s + m * (k === 'head' || k === 'trunk' ? 1 : 2), 0);

const lerp = (a, b, f) => ({ t: a.t + (b.t - a.t) * f, n: a.n + (b.n - a.n) * f, z: a.z + (b.z - a.z) * f });

/* One leg's joints, the renderer's way: knee solved to the contact, the boot's
   direction from that, the ankle stepped back up inside the boot, the knee re-solved
   to the ankle. The blade's middle is the contact stepped back by contactAlongOf. */
export function legOf(pose, which) {
  const q = pose[which], hip = { t: 0, n: 0, z: pose.hipZ }, face = kneeFace(pose, which);
  const k0 = twoBone(hip, q, THIGH, SHIN, face);
  const bd = bootDir(pose, which, k0, q);
  const an = ankleOf(pose, which, bd, [k0.t - q.t, k0.n - q.n, k0.z - q.z]);
  const knee = twoBone(hip, an, THIGH, SHIN, face);
  const back = contactAlongOf(pose, which, bd);
  const mid = { t: q.t - bd[0] * back, n: q.n - bd[1] * back, z: q.z - bd[2] * back };
  return { hip, knee, ankle: an, contact: q, mid, bd };
}

/* Every segment's own centre and mass (normalised), so a caller can sum any subset. */
export function segmentsOf(pose) {
  const out = [], put = (name, [m], p) => out.push({ name, m: m / TOTAL, ...p });
  const hip = { t: 0, n: 0, z: pose.hipZ }, sh = pose.sh;
  const up = [sh.t - hip.t, sh.n - hip.n, sh.z - hip.z], ul = Math.hypot(...up) || 1;
  put('trunk', SEGMENTS.trunk, lerp(hip, sh, SEGMENTS.trunk[1]));
  put('head', SEGMENTS.head, { t: sh.t + up[0] / ul * HEAD_UP, n: sh.n + up[1] / ul * HEAD_UP, z: sh.z + up[2] / ul * HEAD_UP });
  for (const [side, w] of [[-1, 'L'], [1, 'R']]) {
    const j = shoulderJoint(pose, side), hand = pose[w + 'H'];
    if (hand) {
      const el = twoBone(j, hand, UPPER, FORE, elbowFace(pose, side));
      put('upperArm' + w, SEGMENTS.upperArm, lerp(j, el, SEGMENTS.upperArm[1]));
      put('foreHand' + w, SEGMENTS.foreHand, lerp(el, hand, SEGMENTS.foreHand[1]));
    } else {                                       // a raw key with no hand: hang the arm from the shoulder
      put('upperArm' + w, SEGMENTS.upperArm, { ...j, z: j.z - UPPER * SEGMENTS.upperArm[1] });
      put('foreHand' + w, SEGMENTS.foreHand, { ...j, z: j.z - UPPER - FORE * SEGMENTS.foreHand[1] });
    }
    const g = legOf(pose, w);
    put('thigh' + w, SEGMENTS.thigh, lerp(g.hip, g.knee, SEGMENTS.thigh[1]));
    put('shank' + w, SEGMENTS.shank, lerp(g.knee, g.ankle, SEGMENTS.shank[1]));
    put('footBoot' + w, SEGMENTS.footBoot, g.mid);
  }
  return out;
}

/** The whole body's centre of mass, in the pose's own frame (hip at t = n = 0). */
export function massCentre(pose) {
  const c = { t: 0, n: 0, z: 0 };
  for (const s of segmentsOf(pose)) { c.t += s.m * s.t; c.n += s.m * s.n; c.z += s.m * s.z; }
  return c;
}

/* WHERE THE MASS IS AGAINST WHAT IS HOLDING IT UP, fore and aft.

   One runner: the mass's offset from the CONTACT, along the blade (+ toward the toe),
   and where on the blade that contact is (`contactOnBlade`, + forward of the middle).
   The first is the balance question; the second is where a coach puts the weight on
   the rocker, and it is the one that differs by phase (the middle on a glide, forward
   toward the rocker's front for turns and spins).

   Two runners: the offset from the midpoint of the two contacts, along the direction
   of travel at the hip (+ toward where the skater faces travelling), and the share
   of the support's width the mass sits across, 0 over the left blade and 1 over the
   right.

   A pose with no runner down (airborne, or only a pick) returns null: a jab and a
   flight are not stances. */
export function balanceOf(pose) {
  const down = runnersDown(pose);
  if (!down.length) return null;
  const c = massCentre(pose);
  if (down.length === 1) {
    const w = down[0], g = legOf(pose, w), h = Math.hypot(g.bd[0], g.bd[1]) || 1;
    const along = ((c.t - g.contact.t) * g.bd[0] + (c.n - g.contact.n) * g.bd[1]) / h;
    const onBlade = ((g.contact.t - g.mid.t) * g.bd[0] + (g.contact.n - g.mid.n) * g.bd[1]) / h;
    return { feet: w, along, contactOnBlade: onBlade, com: c };
  }
  const L = pose.L, R = pose.R, mid = { t: (L.t + R.t) / 2, n: (L.n + R.n) / 2 };
  const fwd = anterior(pose.hipYaw);
  const along = (c.t - mid.t) * fwd[0] + (c.n - mid.n) * fwd[1];
  const span = [R.t - L.t, R.n - L.n], sl2 = span[0] ** 2 + span[1] ** 2 || 1;
  const across = ((c.t - L.t) * span[0] + (c.n - L.n) * span[1]) / sl2;
  return { feet: 'LR', along, across, com: c };
}
