/* The rig's geometry. Pure functions, no DOM — so the checkers can import it
   directly instead of scraping a page, and so a projection bug can be reproduced
   in isolation.

   Coordinates: t along the track (+ forward), n across (+ the skater's right),
   z height above the ice, centimetres throughout. Yaw is degrees from the
   direction of travel, + anticlockwise seen from above. */

import { lobeSense, secondFoot, TURNS } from './skating.js';

export const D2R = Math.PI / 180;
export const anterior = yawDeg => [Math.cos(yawDeg*D2R), -Math.sin(yawDeg*D2R), 0];
export const lateral  = yawDeg => [Math.sin(yawDeg*D2R),  Math.cos(yawDeg*D2R), 0];  // skater's right

/* ═══ which feet are on the ice ═══════════════════════════════

   `skate` is the REFERENCE blade and stays single-valued: it is the blade
   buildPath builds from and the blade the hip hangs off, and null still means
   airborne. British Ice Skating's own slip-step definition puts the weight over
   one leg while both blades are down, so a second blade on the ice is not a
   second skating foot and the model should not pretend otherwise.

   A second blade is declared on the foot itself — `onIce: 'blade'` — with its
   own direction of travel where it differs. Its EDGE is never stored, because
   both blades are on one circle and a shared circle is a shared lobeSense: see
   secondFoot in skating.js. Storing it would be the second source of truth that
   style.md bans, and it would make an impossible pair representable.

   A THIRD VALUE, `onIce: 'pick'` — 30/08/2026. A picked foot is not a blade and
   it is not free: it is on the ice, carrying weight, with no edge, no lean claim
   and a boot pitched far past what a rockered blade allows. It replaces a
   keyframe flag `pick: true`, which blade.mjs read as exempting EVERY on-ice
   blade in that frame — precisely backwards for the only pose that needs it, and
   never set on any keyframe, so it was a description waiting to be believed.

   A FOURTH VALUE, `onIce: 'skid'` — 19/09/2026. A skidding foot has its runner on
   the ice and is sliding ACROSS it rather than along it, which is what a stop is.
   Steel down and weight on it, like a blade; no biting edge, like a pick; flat,
   because a blade on a real edge grips instead of skidding. It is the yaw's other
   half — `yaw` says where the boot points and this says the ice is not holding it
   there.

   SO THERE ARE THREE QUESTIONS NOW, AND THE MIDDLE ONE USED TO BE MISSING.

     edgesDown     on an EDGE — has a biting side, leans over it, curves
     runnersDown   STEEL on the ice — an edge or a skid, but not teeth
     contactsDown  touching by any means at all

   `edgesDown` was called `bladesDown` until today, and the rename is the point
   rather than tidiness. It answered "on an edge" while being named for "a blade
   on the ice", and those were the same set only while every blade down was
   gripping. A skidding blade IS a blade down, so the next person to reach for
   `bladesDown` meaning steel would have silently excluded every stop in the
   guide. Same fault as the renderer's `skating`, which was three decisions under
   one name until a pick arrived; same fault as `pick: true`. A name that answers
   a narrower question than it asks is a bug with a delay on it. Six call sites,
   all in this repository, all changed together.

   Read these rather than comparing against pose.skate. The comparison was
   correct while a pose could hold one blade and it silently means "free" the
   moment a pose can hold two — the same shape as the featured filter that
   absorbed the twizzles. */
/* THE REFERENCE BLADE MAY DECLARE A CONTACT TOO — 19/09/2026. It was hardcoded to
   'blade', which was true for as long as the reference foot was the one gliding.
   A two-foot snowplough and a hockey stop have BOTH blades skidding, so the
   reference is the skid, and there was no way to say so. The contact is declared
   on the foot for every other foot in this model; now it is for this one as well,
   and 'blade' is what it means when nothing is said. */
/* AND IT MAY DECLARE THAT IT HAS NONE — 20/09/2026, and this is the other half of
   the sentence above. The fallback was unconditional, so the reference foot could say
   WHICH contact it had and could not say it had none — and a default that cannot be
   overridden is not a default, it is the answer with a comment about defaults over it.

   The foot's own declaration wins, an explicit null included; the reference default is
   what it means when the foot says nothing. Nothing authored writes `onIce: null`, so
   every keyframe answers exactly as it did. What writes it is poseAt, onto a foot that
   is arriving or departing, because `skate` NAMES THE BLADE THE TRACING IS BUILT FROM
   and says nothing about contact. docs/model.md, *What `skate` names*, has the argument. */
export const onIceOf = (pose, which) => {
  const f = pose[which];
  if (f && f.onIce !== undefined) return f.onIce;
  return pose.skate && which === pose.skate ? 'blade' : null;
};

export const dirOf = (pose, which) =>
  which === pose.skate ? pose.dir : ((pose[which] && pose[which].dir) || pose.dir);

export function edgeOf(pose, which) {
  if (!pose.skate || which === pose.skate) return pose.edge;
  const on = onIceOf(pose, which);
  /* A PICK HAS NO EDGE. The runner is out of the ice and the teeth are in it, so
     there is no biting side to name. Handing back the reference blade's edge here
     would give the renderer a colour and a dot side for a claim the model is not
     making — the same shape as the flag this replaced. */
  if (on === 'pick') return null;
  /* AND NEITHER HAS A BOOT ON ITS SIDE, for the same reason one step further: the
     runner is not merely out of the ice, it is pointing sideways out of it. There is
     no biting side to name and no colour to give the glyph. */
  if (on === 'boot') return null;
  /* A SKID HAS AN EDGE AND IT IS AUTHORED. It cannot be derived: secondFoot below
     works because both blades are on one circle, and a skidding blade is not on
     the circle at all — it is across it. But the edge is real and it is the whole
     teaching point of a T-stop, which is on the OUTSIDE edge and whose classic
     error is doing it on the inside. So it is stated on the foot, like pitch and
     yaw, and a pose that omits it is refused rather than guessed at. */
  if (on === 'skid') return pose[which].edge ?? null;
  /* A BLADE ON ITS OWN CIRCLE HAS ITS OWN EDGE — 04/10/2026, Session 33. poseAt has
     put it there from the segment the blade is on (trackedAt), the same way the
     reference blade's comes from its path, so it is derived, not stated: the curvature
     of the line it draws is computed from that same letter. */
  if (on === 'blade' && pose[which].track) return pose[which].edge ?? null;
  if (on !== 'blade') return pose.edge;
  return secondFoot({ foot: pose.skate, edge: pose.edge, dir: pose.dir },
                    dirOf(pose, which)).edge;
}

const refFirst = pose => (a, b) => (a === pose.skate ? 0 : 1) - (b === pose.skate ? 0 : 1);

/** Every foot on an EDGE — gripping, with a biting side. Reference blade first. */
export const edgesDown = pose =>
  ['L', 'R'].filter(w => onIceOf(pose, w) === 'blade').sort(refFirst(pose));

/** Every foot with STEEL on the ice — an edge or a skid, but not teeth. */
export const runnersDown = pose =>
  ['L', 'R'].filter(w => ['blade', 'skid'].includes(onIceOf(pose, w))).sort(refFirst(pose));

/** Every foot touching the ice by any means — an edge, a skid, a pick or a boot
    lying on its side. */
export const contactsDown = pose =>
  ['L', 'R'].filter(w => onIceOf(pose, w) !== null).sort(refFirst(pose));

export const THIGH = 44, SHIN = 42, UPPER = 31, FORE = 29, SHOULDER_HALF = 19;

/* A figure blade is not flat. It is ground to a longitudinal curve — the rocker,
   around a 7 ft radius — so only a centimetre or two touches the ice at once, and
   which part of the blade that is matters enormously. Spins live near the front;
   most gliding sits behind the middle.

   The consequence is not obvious until you do the arithmetic: contact position is
   ROCKER × sin(pitch), so a boot pitched by one degree has moved the contact 3.5 cm
   along the blade. Tiny ankle changes travel a long way. And running the contact off
   the front of the blade takes barely three degrees — past that you are not on the
   blade at all, you are on the pick. Skaters are never balanced on the picks like a
   ballet pointe; the pick is a jab, not a stance. */
export const ROCKER = 213;                  // cm, ~7 ft
export const BLADE_FRONT = 13, BLADE_BACK = -13;   // cm from the blade's midpoint
export const MAX_BLADE_PITCH = Math.asin(BLADE_FRONT / ROCKER) / (Math.PI / 180);   // ≈ 3.5°

/** Where along the blade the skater is, for a given boot pitch (+ = toe down). */
export const contactAlong = pitchDeg =>
  ROCKER * Math.sin(Math.max(-MAX_BLADE_PITCH, Math.min(MAX_BLADE_PITCH, pitchDeg)) * Math.PI / 180);

/** Which part of the blade, in words. */
export function bladeZone(pitchDeg) {
  const a = contactAlong(pitchDeg);
  if (pitchDeg > MAX_BLADE_PITCH + 1e-9) return 'toe pick';       // only ever forwards
  if (pitchDeg < -MAX_BLADE_PITCH - 1e-9) return 'off the heel';
  if (a > 7) return 'front of the blade';
  if (a > 2.5) return 'forward of centre';
  if (a < -7) return 'heel';
  if (a < -2.5) return 'behind centre';
  return 'middle of the blade';
}

/** Boot pitch in degrees from a boot direction (+ = toe down). */
export const pitchOf = bd => -Math.asin(Math.max(-1, Math.min(1, bd[2]))) * 180 / Math.PI;

/* WHERE THE TOE PICK'S DEEPEST TOOTH SITS, along the boot from the blade's
   lowest point. It lived in body-frame.js as a glyph coordinate until 30/08/2026,
   which is where it was measured but not where it belongs: how far forward of the
   ankle the teeth go in is a fact about a boot, and it decides where the leg has
   to be when they do. The glyph still draws the teeth at this distance — from
   here, so the drawing and the model cannot drift apart. */
export const PICK_ALONG = 17.8;

/* THE BOOT AS A SOLID, which until 20/09/2026 this model never needed. Every contact
   it could express sat on the blade, and the blade is a line on the sole's centre
   line, so the boot's width and depth were the glyph's business and nothing else's.
   A boot lying on its SIDE touches along its edge, which is off that line in both
   directions, and where that edge is decides both where the ankle goes and how far
   the boot has to be over before the blade is clear of the ice.

   READ OFF THE GLYPHS, NOT CHOSEN. `bootTop`'s footprint runs to ±8 in y; `bootSide`
   puts the boot's body at y −3 and the rocker's lowest point at y 4. The glyphs are
   drawn at true scale — the boot holder carries the view's own px-per-cm — so those
   are centimetres. They are declared HERE because the model should own the dimensions
   and the picture should draw them, and `tools/boot.mjs` asserts that the paths still
   agree, because this is now a fact with two expressions. */
export const BOOT_HALF_W = 8;                      // cm, centre line to the sole's edge
export const BLADE_PROUD = 7;                      // cm, the runner below the sole

/* HOW FAR OVER A LEVEL BOOT MUST BE BEFORE ITS EDGE IS LOWER THAN ITS BLADE:
   BLADE_PROUD·cos θ = BOOT_HALF_W·sin θ, so 41.2°.

   A REFERENCE FIGURE AND NOT A THRESHOLD, and the specification had it as a threshold
   for an hour. It is only the answer while the boot is level — bd horizontal and the
   up-axis vertical. Tilt the boot and the sole's edge moves with the whole frame: on a
   lunge's trailing boot, reaching back and down, the edge reaches the ice at about 22°.
   Measured, which is the only reason it is written down correctly here.

   So what holds a side contact is not a constant. It is soleEdgeZ below, per pose, and
   the pair of assertions that go with it. */
export const SIDE_ROLL_LEVEL = Math.atan2(BLADE_PROUD, BOOT_HALF_W) / (Math.PI / 180);

/* HOW FAR ALONG THE BOOT THE CONTACT IS, from the blade's lowest point: the
   rocker for a blade, the teeth for a pick, and nothing at all for a foot in the
   air, which touches nowhere.

   ONE DERIVATION, because two things need it and they have to agree. The renderer
   shifts the boot glyph back by this much so that whatever is actually touching
   sits on the ice; ankleOf steps back by it so the ankle ends up over the BOOT
   rather than over the contact. Where the two disagreed, the leg was drawn
   entering the boot somewhere other than its opening — by up to 2 cm on a pitched
   blade, which nobody saw, and by the whole 17.8 on a pick, which is what finally
   made it visible. */
export const contactAlongOf = (pose, which, bd) => {
  const c = onIceOf(pose, which);
  /* A SKID FALLS THROUGH TO ZERO, and that is the right answer rather than an
     omission: a flat blade sliding sideways is in contact along most of its
     length, so there is no one point on the rocker to name, and its middle is as
     honest a place to pivot the glyph as any. */
  /* A BOOT ON ITS SIDE falls through to zero for the skid's reason, not by omission:
     it lies along most of its length, so there is no one point on it to name and its
     middle is as honest a place to pivot as any. Where a side contact differs from
     every other is ACROSS the boot, and that is not an offset here: the authored point
     stays the blade's reference and soleEdgeZ below is what holds the roll to the ice. */
  /* A FOOT REACHING FOR ITS PICK, or leaving it — 04/10/2026, Session 29. Its authored
     point is the blade's middle while it is free and the teeth once it is in, so what
     the point MEANS changes at the contact. Stepping it there moved the whole boot
     PICK_ALONG along itself in one frame, which on a boot stood on end is 17.8 cm
     straight up. So it moves over the span either side of the pick (`c`, below),
     which is the whole of the reach rather than only its last quarter second. */
  const ar = pose[which] && pose[which].arrival;
  if (!c && ar && ar.on === 'pick') return PICK_ALONG * ar.c;
  return c === 'blade' ? contactAlong(pitchOf(bd)) : c === 'pick' ? PICK_ALONG : 0;
};

/* Foot positions are authored as the CONTACT, because that is what has to sit on
   the ice. The ankle is elsewhere: up inside the boot and a little back of the
   BLADE'S CENTRE. Those are two different origins whenever the contact is not the
   blade's centre, which is every pitched blade and every pick — see
   contactAlongOf above. The shin has to end at the ankle — run it to the contact
   instead and the leg appears to come out of the sole, or, on a pick, out of the
   toe. Offsets are in the boot's own frame. */
export const ANKLE_UP = 15, ANKLE_BACK = 5;

export function ankleOf(pose, which, bd, toKnee){
  const foot = pose[which];
  /* The boot's up-axis is the direction the leg leaves in, not world up. Using
     world up works while the foot is below the knee and fails the moment it is
     not — a raised free foot, as in a spiral, ends up with the shin entering
     through the sole. */
  let up;
  if (toKnee) {
    const d = toKnee[0]*bd[0] + toKnee[1]*bd[1] + toKnee[2]*bd[2];
    up = [toKnee[0]-d*bd[0], toKnee[1]-d*bd[1], toKnee[2]-d*bd[2]];
  } else {
    up = [-bd[0]*bd[2], -bd[1]*bd[2], 1 - bd[2]*bd[2]];
  }
  /* THE BOOT'S FOURTH ROTATION — 20/09/2026. Everything above builds the up-axis out
     of the shin, which pins the whole boot frame to the plane containing the leg: a
     boot could pitch and yaw and never roll, and that is what has blocked the lunge
     since Session 14 and the drag since this morning. `roll` turns the up-axis about
     the boot's own direction, which is the one rotation that plane cannot express.

     HERE AND NOWHERE ELSE, WHICH IS THE WHOLE ECONOMY OF IT. The renderer does not
     hold a boot frame of its own — it reads the up-axis back off the ankle this
     function places, and takes the lateral axis as their cross product. So rotating
     `up` rotates all three axes, the glyph chooser follows on its own, and
     tools/boot.mjs's assertion that the drawn roll matches the model's is still true
     by construction rather than by a second edit agreeing with this one.

     The ankle MOVES, by up to ANKLE_UP·sin(roll) — thirteen centimetres at sixty
     degrees. That is the model working rather than a side effect: roll your foot onto
     its edge and the ankle travels over the contact, and twoBone re-solves the knee
     from where it ends up. Defaults to zero and is a no-op there, so every pose
     written before today draws byte-identically — hashed over 399 frames, both ways. */
  const roll = foot.roll || 0;
  if (roll) up = rotateAbout(bd, up, roll);
  const ul = Math.hypot(...up) || 1;
  /* Back along the boot from the contact: past the ankle's own offset from the
     blade's centre, AND past however far the contact is from that centre. On a
     flat blade the second term is zero, which is why one term did for fifteen
     sessions. */
  const back = ANKLE_BACK + contactAlongOf(pose, which, bd);
  return {t: foot.t - bd[0]*back + up[0]/ul*ANKLE_UP,
          n: foot.n - bd[1]*back + up[1]/ul*ANKLE_UP,
          z: foot.z - bd[2]*back + up[2]/ul*ANKLE_UP};
}

/* THE BOOT'S OWN FRAME, from the same two vectors the renderer draws it about. Exported
   because the roll gave three different callers a reason to want the lateral axis and
   the repository keeps one expression of a fact. `up` must be the unit up-axis. */
export const bootLateral = (bd, up) =>
  [bd[1]*up[2]-bd[2]*up[1], bd[2]*up[0]-bd[0]*up[2], bd[0]*up[1]-bd[1]*up[0]];

/* HOW HIGH THE EDGE OF THE SOLE IS — 20/09/2026, and it is what holds a roll honest.
   A foot is authored at the BLADE'S reference point, and that is true of all five
   contacts including this one: it is not where a boot on its side touches, because what
   touches is the edge of its sole, BOOT_HALF_W across the runner and BLADE_PROUD above
   it. Keeping the authored point the same thing for every contact is worth more than
   making it the touching point for one of them — the alternative puts an offset
   perpendicular to the boot into `ank − contact`, which is the vector the renderer
   recovers the up-axis FROM, and tools/boot.mjs's drift check would have to learn to
   undo it.

   So the roll is authored and this is the quantity it is held to, IN A PAIR, because an
   exemption can only excuse a pose:

     the sole's edge is ON the ice     soleEdgeZ === 0
     and the runner is CLEAR of it     foot.z > 0

   The second is what stops a side contact being a deep lean with a better name, and it
   is not a separate claim so much as the first one read back: solving the first for z
   gives z = −soleEdgeZ(at z 0), which is positive only once the boot is over far enough
   for its edge to be the lowest thing on the foot. Same shape as a pick, which must be
   pitched PAST the blade's limit or the runner still reaches the ice.

   The edge that comes down is the one the boot is rolled toward, so the sign is the
   roll's and is not a second number that could disagree with it. */
export const soleEdgeZ = (pose, which, bd, up) => {
  const ul = Math.hypot(...up) || 1, u = up.map(c => c/ul);
  const lat = bootLateral(bd, u);
  return pose[which].z + BLADE_PROUD*u[2] + Math.sign(pose[which].roll || 1)*BOOT_HALF_W*lat[2];
};

/* Rotation of v about a UNIT axis by an angle, Rodrigues. `transport` below is the
   shortest arc between two vectors and cannot express this: a turn about an axis you
   name, by an amount you name, which is what a roll is. */
export function rotateAbout(axis, v, deg){
  if(!deg) return v.slice();
  const th = deg * D2R, c = Math.cos(th), sn = Math.sin(th);
  const kv = [axis[1]*v[2]-axis[2]*v[1], axis[2]*v[0]-axis[0]*v[2], axis[0]*v[1]-axis[1]*v[0]];
  const kd = axis[0]*v[0] + axis[1]*v[1] + axis[2]*v[2];
  return v.map((c0,i) => c0*c + kv[i]*sn + axis[i]*kd*(1-c));
}

/* Shortest-arc rotation taking `from` onto `to`, applied to v (Rodrigues). */
export function transport(from, to, v){
  const c = from[0]*to[0] + from[1]*to[1] + from[2]*to[2];
  if(c > 0.99999) return v.slice();
  const ax = [from[1]*to[2]-from[2]*to[1], from[2]*to[0]-from[0]*to[2], from[0]*to[1]-from[1]*to[0]];
  const s = Math.hypot(...ax);
  if(s < 1e-7) return [-v[0], -v[1], -v[2]];
  const k = ax.map(a => a/s), th = Math.atan2(s, c), ct = Math.cos(th), st = Math.sin(th);
  const kv = [k[1]*v[2]-k[2]*v[1], k[2]*v[0]-k[0]*v[2], k[0]*v[1]-k[1]*v[0]];
  const kd = k[0]*v[0] + k[1]*v[1] + k[2]*v[2];
  return v.map((c0,i) => c0*ct + kv[i]*st + k[i]*kd*(1-ct));
}

/* Two-bone chain solved in 3D, then projected — so a limb that is straight but
   pointing away from the camera reads as straight rather than as a false bend.
   `faceRest` is where the joint points with the limb hanging down: forwards for
   a knee, backwards for an elbow. Crucially it is carried along with the limb
   rather than held fixed to the pelvis. Extend a leg behind you and the front
   of the thigh ends up facing the ice, so the knee can only fold downwards —
   which is why a spiral reads as a straight leg with the knee turned down. */
export function twoBone(root, tip, L1, L2, faceRest){
  const v = [tip.t-root.t, tip.n-root.n, tip.z-root.z];
  const d = Math.hypot(...v) || 1e-6, u = v.map(c => c/d);
  if(d >= L1 + L2){                                   // at full reach: straight
    const k = L1/(L1+L2)*d;
    return {t:root.t+u[0]*k, n:root.n+u[1]*k, z:root.z+u[2]*k, bend:0, d};
  }
  const a = (L1*L1 - L2*L2 + d*d) / (2*d);
  const h = Math.sqrt(Math.max(0, L1*L1 - a*a));
  let K = transport([0,0,-1], u, faceRest);
  const dot = K[0]*u[0] + K[1]*u[1] + K[2]*u[2];
  K = [K[0]-dot*u[0], K[1]-dot*u[1], K[2]-dot*u[2]];
  const kl = Math.hypot(...K) || 1;
  K = K.map(c => c/kl);
  return {t:root.t+a*u[0]+h*K[0], n:root.n+a*u[1]+h*K[1], z:root.z+a*u[2]+h*K[2], bend:h, d};
}

/* WHERE A KNEE POINTS — the `faceRest` every leg's twoBone is solved with, and since
   04/10/2026 (Session 31) not always where the pelvis faces.

   One expression, because until that day it was written out as anterior(pose.hipYaw)
   at twenty-two call sites across the renderer and eleven checkers, every one of them
   free to disagree with the drawing the moment the rule changed.

   THE RULE. A skater's knee goes out over a turned-out foot: the turnout comes from the
   hip rotating the whole leg, and the knee is part of the leg. So for a foot with STEEL
   ON THE ICE (an edge or a skid — runnersDown's set) the knee follows the foot's turn
   off the pelvis, as far as a weight-bearing hip can rotate it: HIP_OUT outward,
   HIP_IN inward. Past that the hip has run out and what is left is the shin twisting
   under a bent knee, which is KNEE_TWIST's allowance and which tools/turnout.mjs
   already holds the total to. The knee stops; the foot may go on.

   WHY IT MATTERS, measured first (tools/knee.mjs). With the knee held to the pelvis, a
   bent knee over a blade turned fifty-five degrees off it leans the shin ACROSS the
   boot: 23° across and 9° forward on the T at pushOffT's first key, 28° across on the
   T-stop's trailing blade. Following the foot turns that into lean over the toe (8°
   across, 19° forward), which is what a boot's flex is built for and, the part that
   decides depth, what moving the foot under the hip can take back out. Under the old
   rule no placement of the feet got the T-stop below a hip of 92 inside shin.mjs's 28°;
   under this one 12 cm along the blades reaches 88.

   WHICH FEET, AND WHY NOT THE OTHERS.
     a runner    its heading is the tracing plus an authored yaw, independent of the leg,
                 so the knee can be told to follow it
     a free foot its boot is BUILT from the shin (bootDir's free rule), so its heading is
                 an output of the knee and following it would be circular; it keeps the
                 pelvis, as every free leg in this guide was authored against
     a pick      its direction comes from the reach and its leg is near straight behind,
                 where the knee's direction barely shows; not measured, so not changed
     a boot on   the lunge's trailing leg, turned out by its roll rather than a yaw;
     its side    likewise not measured, so not changed

   Verified against a coach: NO. The rule is anatomy ("knees over toes" is the coaching
   line), the limits are the existing HIP_OUT and HIP_IN read off a study. */
export const kneeFace = (pose, which) => {
  const on = onIceOf(pose, which);
  if (on !== 'blade' && on !== 'skid') return anterior(pose.hipYaw);
  let turn = (dirOf(pose, which) === 'F' ? 0 : 180) + (pose[which].yaw || 0) - pose.hipYaw;
  while (turn > 180) turn -= 360;
  while (turn <= -180) turn += 360;
  const side = which === 'L' ? 1 : -1;               // + = the toe away from the midline
  const follow = Math.max(-HIP_IN, Math.min(HIP_OUT, side * turn));
  return anterior(pose.hipYaw + side * follow);
};

export const shoulderJoint = (pose, side) => {           // side −1 = left, +1 = right
  const R = lateral(pose.shYaw);
  return {t:pose.sh.t + R[0]*SHOULDER_HALF*side, n:pose.sh.n + R[1]*SHOULDER_HALF*side, z:pose.sh.z};
};

/* Where an elbow points, with the arm hanging down. Purely posterior is what
   anatomy suggests, but it makes an abducted arm hinge fore-and-aft — which a
   side view then shows as a snapping zigzag, because the arm foreshortens to
   nothing while the elbow offset does not. Mixing in an inward component
   transports to a downward-drooping elbow once the arm is out to the side:
   the soft elbow a coach actually asks for, and legible from every angle. */
export const elbowFace = (pose, side) => {
  const A = anterior(pose.shYaw), R = lateral(pose.shYaw);
  const v = [-A[0]*0.5 - R[0]*0.87*side, -A[1]*0.5 - R[1]*0.87*side, 0];
  const l = Math.hypot(...v) || 1;
  return v.map(c => c/l);
};

/* Where the boot actually points, in 3D.

   THREE RULES, ONE PER KIND OF CONTACT.

   A BLADE on the ice can only lie along its own tracing, so it takes its direction
   from the travel direction, tilted by its pitch (+ = toe down). Held inside ±3.5°,
   because that is all the length a rockered runner has.

   A PICK is not travelling. It is a jab: the teeth go into the ice and stay in one
   spot while the skater goes past. So it has no tracing to lie along, and what
   decides where its toe points is the REACH — a jab goes in where the leg sends
   it, which is the horizontal line from the hip to the foot. Its pitch is past
   what a blade allows by definition; that is what makes it a pick and not a badly
   authored blade, and `blade.mjs` asserts it from both sides.

   Taking the travel direction here instead would have been the tempting shortcut,
   since the formula is already written above — and it would have pointed the toe at
   the skater on the only move that needs it. A toe loop reaches BACK and picks, and
   back on a backward edge is +t while the tracing's own direction is −t.

   A FREE foot is not free to be flat: it hangs off the shin. So its direction is
   built from the shin and an ankle angle — 90° would be fully pointed, in line
   with the leg; 0° a right angle. Same transport trick as the knee, so the ankle
   bends about the correct axis wherever the leg is.

   WHICH RULE APPLIES IS READ HERE, not handed in. Every caller used to compute
   `onIceOf(pose, which) === 'blade'` and pass the answer, which is one derivation
   in seven places and a boolean that can disagree with the pose it came from —
   the shape this file's own opening comment warns about. There is nothing to
   disagree with now. */
/* How far a free foot points, measured from neutral — 0° is the right angle you
   stand at, 90° would be fully in line with the shin.

   The limit is the boot, not the ankle. A bare ankle plantarflexes maybe 45°, but
   a stiff skating boot encases the foot and lower shin and holds them near square
   to each other. So a skater's free foot never looks like a ballet foot however
   hard they point it — the boot will not let it. Same constraint that keeps the
   shin inside ~28° of lean, seen from the other side.

   TWO NUMBERS, NOT ONE — 30/08/2026. This was a single constant `ANKLE_FREE` at
   10°, and `bootDir` applied it to every free foot in every frame. That made it an
   IDENTITY rather than a limit: not "the boot allows no more than this" but "every
   free foot is pointed exactly this hard, always". Session 05 noticed and did not
   act on it, and Session 05's finding that no value of the constant helps every
   pose at once follows directly from it — plantarflexion drives the blade wherever
   the shin already points, so raising one number lifts the toe on a spiral and
   drives it at the ice on a landing. The number was never the lever.

   ANKLE_MAX is what the boot allows. A bare ankle plantarflexes ~45°; Fortin et al.
   (reported in Lower Extremity Review, "Over the Edge") measured a rigid boot
   taking 15° of plantarflexion and 10° of dorsiflexion off that, which leaves about
   30°. Manufacturers publish stiffness ratings and not angles — Edea 40–95, Jackson
   2–95, and the two scales are not comparable to each other — so the number comes
   from the injury literature or from nowhere.

   ANKLE_POINT is what an unauthored foot does, and it is the old constant, so every
   pose written before today draws exactly as it did. A foot that needs a line says
   so: `point` on the keyframe, in degrees, clamped to ANKLE_MAX. That is the same
   shape as `pitch` on a skating foot, and for the same reason — it is a quantity a
   skater chooses, not a property of the leg.

   Verified against a coach: NO. Both numbers are read off a study of injury, which
   is not the same as a study of what a position looks like. */
export const ANKLE_MAX = 30;                       // degrees, the boot's allowance
export const ANKLE_POINT = 10;                     // degrees, an unauthored foot

/* HOW FAR A BLADE ON THE ICE MAY POINT OFF THE WAY THE PELVIS FACES — 19/09/2026.

   The third constant of this shape, after ANKLE_MAX and MAX_BLADE_PITCH, and the
   same argument: a number the body imposes, read off a study rather than chosen,
   which then decides what poses can exist.

   WEIGHT-BEARING, and that is the whole point of the numbers being these numbers.
   The textbook ranges — internal 40-45 degrees, external 44-52 — are measured
   lying down with the leg free. A skater is standing on the foot in question.
   Kadlec et al. measured 135 adults rotating about a planted foot, pelvis and
   shoulders held square (the Functional Footprint device), and got EXTERNAL 37 to
   41 degrees but INTERNAL only 20 to 23 — roughly half the free-leg figure. Their
   own conclusion is the one that matters here: an athlete whose task asks for more
   transverse-plane motion than their weight-bearing range is at risk of injury.

   So the allowance is ASYMMETRIC, and it is the toes-in direction that is scarce.
   That is not a detail: a snowplough turns both toes IN, which is the expensive
   way round, and a hockey stop asks for ninety degrees of it. Neither can be
   authored from a square pelvis, and the honest answer in both cases is that the
   skater turns the pelvis and widens the stance rather than twisting the feet off
   it — which is what they are taught to do.

   NOT A COACH'S NUMBER, like the other two. A study of what a hip does is not a
   study of what a skater's hip does after ten years of turnout. */
export const HIP_OUT = 40;                         // degrees, toe away from the midline
export const HIP_IN  = 20;                         // degrees, toe toward it

/* AND THE KNEE ADDS TO IT, BUT ONLY WHEN IT IS BENT.

   A straight knee barely rotates: the femoral and tibial condyles interlock at
   full extension and hold the tibia where it is. Bend it and they disengage —
   rotation rises to roughly 18 degrees external and 25 internal by about 30 to 40
   degrees of flexion, and then stays level until deep flexion tightens the soft
   tissue again (Freeman & Pinskerova, via WikiMSK).

   WHICH IS WHY A SKATER BENDS THE KNEE TO FIND TURNOUT, and why a dancer pliés to
   find it. It is the same observation the rest of this file keeps making: the
   limit is not a constant, it is a function of the pose. ANKLE_MAX turned out to
   decide the pick's hip height; this decides how wide a push or a stop can be, and
   it says a straight-legged one is narrower than a bent-kneed one by nearly twenty
   degrees a side.

   Without it the model forbids a right-angled T-stop outright — two feet at 40
   each is eighty degrees between them and a T is ninety. With it there is
   comfortably enough. That was the check on whether the term was missing. */
export const KNEE_TWIST_OUT = 18, KNEE_TWIST_IN = 25;
export const KNEE_TWIST_FULL = 35;                 // degrees of flexion for all of it

/** Knee flexion in degrees, from the hip-to-ankle distance. 0 = straight. */
export const kneeFlex = d => 180 - Math.acos(Math.max(-1, Math.min(1,
  (THIGH*THIGH + SHIN*SHIN - d*d) / (2*THIGH*SHIN)))) * 180 / Math.PI;

/** How far this leg may turn the foot, given how bent its knee is. */
export const turnoutAllowed = d => {
  const f = Math.min(1, Math.max(0, kneeFlex(d) / KNEE_TWIST_FULL));
  return { out: HIP_OUT + KNEE_TWIST_OUT * f, in: HIP_IN + KNEE_TWIST_IN * f };
};

/* THE LEAST YAW THAT MAKES A STOP A STOP.

   A SKID IS NOT A FLAT BLADE, and this was written the other way round first. The
   reasoning was that a blade tipped onto an edge grips, so a skid must be flat —
   and it is wrong. A T-stop is unanimously on the trailing blade's OUTSIDE edge,
   with the inside edge named by coaches as the classic error; a hockey stop has
   both blades "tilted so their edges dig in". What stops a blade gripping is not
   being flat, it is being turned ACROSS its own line: there is no groove to follow
   sideways however hard the edge is pressed. Tilting only decides how much bite.
   Written up here so the flat version is not reasoned out a second time.

   So what a skid is held to is its YAW, and the assertion is the pick's read back:
   a blade must be inside the rocker's pitch and a pick outside it; a blade running
   true is aligned with its travel and a SKID MUST NOT BE. Below this a pose would
   be calling a contact a stop while its geometry runs along the line like any
   other edge.

   It does NOT separate a skid from a push — a push is turned thirty-five degrees
   and grips the whole time, and whether a contact slips or holds is a fact about
   friction that a rig of markers cannot see. That is why the contact is declared
   rather than derived. This is the floor on the declaration, not a proof of it. */
export const SKID_MIN_YAW = 15;                    // degrees off the line of travel


/* HOW FAR A FOOT THAT IS STAYING FREE IS CLEAR OF THE ICE — moved here from
   tools/twofoot.mjs on 20/09/2026, where it had lived as that checker's `CLEAR`.

   It moved because the arrival below makes it load-bearing in the MODEL: it is the
   height over which an arriving boot's direction blends toward its contact. A
   checker's constant that the renderer depends on is two expressions of one fact,
   which is this repository's recurring failure, so there is one and tools/twofoot.mjs
   imports it.

   The fourth constant of this shape, after ANKLE_MAX, ANKLE_POINT and
   MAX_BLADE_PITCH — and unlike those it is not read off a study of anything. It came
   from the spread of the poses already authored: contacts sat at 0-2 and free feet at
   10-117, so five was the middle of a gap nobody had to be nudged across. That makes
   it a description of what had been written rather than a measurement of skating.

   Verified against a coach: NO. Worth saying plainly, because ANKLE_POINT carried the
   same line and a coach turned out to disagree with it on the first move he was asked
   about. */
export const CLEAR = 5;                            // cm, a free foot's clearance

/* HOW MUCH TURN A SKATER TAKES TO WIND UP OR OPEN OUT — 20/09/2026, and the ninth
   constant of this shape. **Verified against a coach: YES.** Martyn, asked how much
   turn a skater takes to open from the wind-up onto the exit edge, and the same
   amount going in: about half a revolution. It is the first of these numbers to be
   answered on the day it was asked rather than read off a study of something else,
   which is what ANKLE_POINT was and what a coach disagreed with. */
export const RAMP = 180;                           // degrees of turn, each side of a boundary

/* A PICKED BOOT'S DIRECTION: back along the reach towards the hip, pitched, and turned
   by `yaw` — 04/10/2026, Session 29. The yaw is the turnout a picking foot takes (the toe
   goes in slightly turned out, not square) and, over a pinned run, the pivot on the pick
   as the body comes round. Degrees, + anticlockwise from above, the convention every
   other yaw here uses; for a left foot that is outward. At yaw 0 this is the old
   expression to the bit. Null when the pick is under the hip and there is no reach. */
const pickDir = (foot, pitchDeg, yawDeg) => {
  const h = Math.hypot(foot.t, foot.n);
  if (h <= 1e-6) return null;
  const p = pitchDeg * D2R, y = yawDeg * D2R, c = Math.cos(y), sn = Math.sin(y);
  const bt = -foot.t / h, bn = -foot.n / h;
  return [(bt * c + bn * sn) * Math.cos(p), (-bt * sn + bn * c) * Math.cos(p), -Math.sin(p)];
};

/* A PICK THAT LANDS ALONG THE TRAVEL — 04/10/2026, Session 32, for the bunny hop.
   Every pick until today was a jab behind: the toe jumps reach back and the toe points
   back along the reach toward the skater (pickDir, above). The bunny hop lands FORWARD
   onto its pick and steps straight through, so the toe points the way the skater is
   going, heel up behind, and the hip passes over the pick while it is in. Read off the
   reach, that direction would swing half a turn as the reach crosses zero.

   So a pick may name a `dir`, and then it points along the tracing like a planted
   blade, pitched toe down by its own pitch and turned by its own yaw. A pick without
   one is exactly what it was, which is every pick written before today. */
const alongDir = (dir, pitchDeg, yawDeg) => {
  const y = ((dir === 'F' ? 0 : 180) + (yawDeg || 0)) * D2R, p = (pitchDeg || 0) * D2R;
  return [Math.cos(y)*Math.cos(p), -Math.sin(y)*Math.cos(p), -Math.sin(p)];
};

export function bootDir(pose, which, knee, foot){
  const on = onIceOf(pose, which);
  const p = (foot.pitch || 0) * D2R;
  /* THE PLANTED CONSTRUCTION, LIFTED OUT AS A FUNCTION OF THE DIRECTION IT RUNS —
     20/09/2026. It was inline below and is now called twice: once by a foot that is
     on the ice, with the direction the pose is going, and once by a foot that is
     arriving at or leaving a contact, with the direction of the key it is arriving
     at or left. One expression, two callers, which is the point of lifting it. */
  const planted = dir => {
    const y = ((dir === 'F' ? 0 : 180) + (foot.yaw || 0)) * D2R;
    return [Math.cos(y)*Math.cos(p), -Math.sin(y)*Math.cos(p), -Math.sin(p)];
  };
  if(on === 'pick'){
    /* BACK ALONG THE REACH, TOWARD THE HIP — corrected 04/10/2026, Session 29. Foot
       coordinates are already relative to the hip, so the horizontal part of the foot
       vector is the reach; a pick under the hip has no reach to speak of and falls back
       to the tracing rather than dividing by it.

       From 30/08/2026 this pointed the toe AWAY from the hip, along the reach, so the
       heel sat nearest the body. Martyn, who skates, on 04/10/2026: the toe points back
       towards the skater, heel up and furthest away, the boot tipped by the ankle. Which
       is also the only way a stiff boot can do it: a leg reaching back at θ from vertical
       carries a boot square to the shin pointing forward and down by θ, the ankle adds
       up to ANKLE_MAX, and pointing the toe away would need 90 − θ of plantarflexion that
       no skating boot has. The old sense is why a pick was legal only with the hip sunk to
       62 or the boot nearly flat: the model was asking the ankle for the impossible pose
       and finding the few corners where it fitted. It is also why the free foot reaching
       for a pick swung its toe 155 degrees at the contact: the free rule had it right. */
    if (foot.dir) return alongDir(foot.dir, foot.pitch, foot.yaw);
    const d = pickDir(foot, foot.pitch || 0, foot.yaw || 0);
    if(d) return d;
  }
  if(on){
    /* PLANTED: ALONG THE TRACING, PLUS WHATEVER THE SKATER HAS TURNED THE FOOT —
       19/09/2026. Until then this was the tracing and nothing else: nought or a
       hundred and eighty, with no value in between, because a blade on the ice can
       only lie along its own line and for six sessions every blade the rig held
       was running along one.

       It is not true of a blade that is PUSHING. A push drives sideways against
       the inside edge while the skater goes somewhere else, so the boot points off
       the line of travel by thirty or forty degrees and grips the whole time —
       which is the opposite of a skid, and the reason this is a yaw and not a new
       kind of contact. `bootDir` was answering "where does this boot point" with
       "where is this foot going", and those are the same question only while the
       foot is a wheel.

       Degrees, + anticlockwise seen from above, which is the convention hipYaw and
       shYaw already use — one rotation sense in this file, not two. Defaults to
       zero, so every pose written before today draws byte-identically.

       NOT ON A PICK: that branch is above and takes its direction from the reach,
       because a pick is not travelling either and already had to solve this. And
       what limits the number is not the tracing but the hip — see HIP_OUT and
       HIP_IN, asserted per pose by tools/turnout.mjs. */
    return planted(dirOf(pose, which));
  }
  const s = [foot.t-knee.t, foot.n-knee.n, foot.z-knee.z];
  const sl = Math.hypot(...s) || 1, u = s.map(c => c/sl);
  let a = transport([0,0,-1], u, anterior(pose.hipYaw));
  const d = a[0]*u[0] + a[1]*u[1] + a[2]*u[2];
  a = [a[0]-d*u[0], a[1]-d*u[1], a[2]-d*u[2]];
  const al = Math.hypot(...a) || 1;
  a = a.map(c => c/al);
  const af = Math.min(ANKLE_MAX, Math.max(0, foot.point ?? ANKLE_POINT)) * D2R;
  const c = Math.cos(af), sn = Math.sin(af);
  const free = [a[0]*c + u[0]*sn, a[1]*c + u[1]*sn, a[2]*c + u[2]*sn];

  /* A FOOT ARRIVING ON THE ICE, OR LEAVING IT — 20/09/2026. Specified in
     docs/model.md before it was built.

     A free boot is built square to the shin, so one whose blade is a millimetre off
     the ice still hangs at a leg-derived angle and the glyph is drawn through the
     surface. tools/underice.mjs found that on two moves; tools/twofoot.mjs could not,
     because the assertion that a free foot is 5 cm clear runs on keyframes and both
     moves clear at twice the bound on every key while reaching a millimetre between
     them. The obvious repair — assert it per frame — would be FALSE: a foot being put
     down has to cross that band, because nobody steps onto a foot that teleports from
     five centimetres to contact.

     So over the last CLEAR centimetres the direction blends from the free
     construction to the planted one it is heading for, arriving exactly at it. The
     two agree at z = 0, where `pitch` and `yaw` have finished interpolating toward
     the target key, so the seam falls where nothing is happening.

     THE WINDOW IS A HEIGHT AND NOT A SPAN OF CLOCK. The change of foot descends 16 cm
     over 0.14 of its duration, and at 16 cm the foot is plainly free; blending there
     would orient a boot at a contact it is nowhere near.

     Lerp and renormalise rather than a slerp: it stays on the sphere, it is
     continuous, and it is not constant-speed — which no checker asks for and
     tools/continuity.mjs is the file that would object if it mattered. */
  if (foot.arrival && foot.arrival.on === 'pick') {
    /* Toward the picked rule, by time (PICK_REACH, below). The target is the pick's
       own construction with the pitch of the key it is arriving at, so at w = 1 this
       is the frame after exactly. */
    const w = foot.arrival.w, h = Math.hypot(foot.t, foot.n), al = foot.arrival.along;
    if (w > 0 && (al || h > 1e-6)) {
      /* A lerp of the two directions, renormalised. Under the old pick rule the two
         pointed the toe opposite ways and this passed near vertical, where the top
         view's heading is noise (61 degrees in one frame on the toe loop); a heading
         blend was tried and failed the other way, on a free boot near vertical whose
         own heading is noise. With the toe pointing back towards the skater the two
         rules agree in heading and the lerp is short. */
      const q = al ? alongDir(al, foot.arrival.pitch, foot.arrival.yaw)
                   : pickDir(foot, foot.arrival.pitch, foot.arrival.yaw);
      const v = [free[0] + (q[0]-free[0])*w, free[1] + (q[1]-free[1])*w, free[2] + (q[2]-free[2])*w];
      const vl = Math.hypot(...v) || 1;
      return [v[0]/vl, v[1]/vl, v[2]/vl];
    }
    return free;
  }
  if (foot.arrival) {
    const w = Math.min(1, Math.max(0, 1 - (foot.z / CLEAR)));
    if (w > 0) {
      const q = planted(foot.arrival.dir);
      const v = [free[0] + (q[0]-free[0])*w, free[1] + (q[1]-free[1])*w, free[2] + (q[2]-free[2])*w];
      const vl = Math.hypot(...v) || 1;
      return [v[0]/vl, v[1]/vl, v[2]/vl];
    }
  }
  return free;
}

/* ═══ the cusp of a one-foot turn ════════════════════════════════
   03/10/2026, Session 26. The rig turned a blade off its own line only in the air or
   in a skid, so a three turn could not be drawn: a gripping blade has to come round
   half a circle while it is still cutting a line. Session 24 tried it with `dir` and
   failed four checkers. This is the piece that was missing.

   WHAT A CUSP IS, as geometry. A blade that grips moves along its own length. If it
   also turns through 180 degrees while the skater goes on along the circle, the
   point where it touches the ice cannot stay on the circle: it is carried inwards
   while the blade points inwards, stops dead where the blade is square across the
   circle, and is carried back out once the skater is going backwards. That stop is
   the point of the "3". The cusp is what lets a gripping blade turn, so it is
   derived here from the turn and is not drawn on afterwards.

   THE CONSTRUCTION. Over a window of the clock, u from 0 to 1, the blade turns
   ψ = 180·S(u) with S the same smoothstep poseAt uses, so a hip interpolated between
   two keys at the window's ends turns in step with it. The contact moves along the
   blade at σ = cosψ·(1 + c·sin²ψ) of the circle's own rate. cosψ is the grip: it
   is forwards before the apex, nothing at it and backwards after it. The second
   factor is 1 at both ends, so the contact leaves and rejoins the circle at the
   circle's speed, and its coefficients are solved so that it rejoins it at the right
   place (cuspTables, below, which also carries the circle turning under the window).

   DEPTH IS NOT AUTHORED, it falls out at 0.34 of the window's length on the circle.
   Write a shorter window for a tighter cusp.

   Verified against a coach: NO. The shape is forced once the blade grips. The speed
   of the turn, carried by the window's length on the clock, is a choice. */
const CUSP_N = 400;
const S3 = x => x * x * (3 - 2 * x);

/* THE CIRCLE TURNS UNDER THE CUSP — corrected 03/10/2026, the same session, found by the
   brackets. The offsets are measured in the frame of the circle, and that frame turns as
   the skater goes round it. The first table left that out, so the contact gripped in the
   rotating frame rather than on the ice. A three turn's cusp points inwards and the error
   stayed under the 3° turnout.mjs allows; a bracket's points outwards and read 5° two
   frames from the apex.

   So the integration carries the frame's own turn, K = the window's sweep in radians,
   signed with the lobe, in units of the window's length: the contact's velocity on the
   ice is σ along the blade exactly, which means its velocity in the frame is that less
   the frame's advance (1, 0) and its rotation K × (a, b). With K in, the two end
   conditions no longer share a single symmetry, so the speed profile takes two
   coefficients, m = 1 + c1·sin²ψ + c2·sinψ·cosψ, and both are solved. Everything is
   linear in them, so three integrations and a 2×2 solve do it. a is along the track and
   b is to the left. */
const cuspCache = new Map();
const cuspTables = (s, K) => {
  const key = `${s}:${K.toFixed(9)}`;
  if (cuspCache.has(key)) return cuspCache.get(key);
  const run = (c1, c2) => {
    const A = [0], B = [0];
    let x = 0, y = 0;
    for (let i = 0; i < CUSP_N; i++) {
      const p = s * Math.PI * S3((i + 0.5) / CUSP_N);
      const m = 1 + c1 * Math.sin(p) ** 2 + c2 * Math.sin(p) * Math.cos(p);
      const sg = Math.cos(p) * m;
      const dx = (sg * Math.cos(p) - 1 + K * y) / CUSP_N;
      const dy = (sg * Math.sin(p) - K * x) / CUSP_N;
      x += dx; y += dy; A.push(x); B.push(y);
    }
    return { A, B, x, y };
  };
  const o = run(0, 0), e1 = run(1, 0), e2 = run(0, 1);
  const a11 = e1.x - o.x, a12 = e2.x - o.x, a21 = e1.y - o.y, a22 = e2.y - o.y;
  const det = a11 * a22 - a12 * a21;
  const c1 = (-o.x * a22 + o.y * a12) / det, c2 = (-o.y * a11 + o.x * a21) / det;
  const out = run(c1, c2);
  cuspCache.set(key, out);
  return out;
};
const cuspTable = (tab, u) => {
  const x = Math.min(1, Math.max(0, u)) * CUSP_N, i = Math.min(CUSP_N - 1, Math.floor(x));
  return tab[i] + (tab[i + 1] - tab[i]) * (x - i);
};

/** The one-foot turn whose window the clock is in, if any: how far through it, the
    blade's yaw off the circle (signed, + anticlockwise), and the contact's offset
    from the circle in cm. A turn is an `arc` segment carrying `turn:` and the ENTRY
    edge's foot, edge and direction; the arcs either side are ordinary edges. */
export function cuspAt(move, t) {
  const spans = move.path.map(s => s.span ?? 1 / move.path.length);
  const sum = spans.reduce((a, b) => a + b, 0);
  let c = 0;
  for (let i = 0; i < move.path.length; i++) {
    const seg = move.path[i], t0 = c / sum, t1 = (c += spans[i]) / sum;
    if (!seg.turn || t < t0 || t > t1) continue;
    const T = TURNS[seg.turn];
    const entry = { foot: seg.foot, edge: seg.edge, dir: seg.dir };
    const exit = { foot: seg.foot, edge: T.edgeChanges ? (seg.edge === 'O' ? 'I' : 'O') : seg.edge,
                   dir: seg.dir === 'F' ? 'B' : 'F' };
    const lobe = lobeSense(seg.foot, seg.edge, seg.dir);
    const sense = T.rotatesInto ? lobe : -lobe;
    const L = (seg.radius ?? move.radius) * seg.sweep * D2R;
    const u = (t - t0) / (t1 - t0);
    const tab = cuspTables(sense, lobe * seg.sweep * D2R);
    return { u, t0, t1, entry, exit, sense, L,
             psi: sense * 180 * S3(u),
             dt: L * cuspTable(tab.A, u), dn: -L * cuspTable(tab.B, u) };
  }
  return null;
}

/* The cusp applies to the reference blade only while it is the turn's foot and on
   its edge. A turn written on a foot that is in the air is a contradiction, and
   turnout.mjs says so rather than this quietly doing nothing. */
const cuspFor = (move, t, pose) => {
  const cu = cuspAt(move, t);
  return cu && pose.skate === cu.entry.foot && onIceOf(pose, pose.skate) === 'blade' ? cu : null;
};

/* ═══ path ════════════════════════════════════════════════════ */
export function buildPath(move){
  /* `frames` is optional and defaults to 320, so every move without one draws as it
     did. A jump combination is twice as long as a jump and sets it, so that it turns
     no further between frames than its jumps do on their own (moves.js, comboOf). */
  const TOTAL = move.frames ?? 320, pts = [];
  /* `heading` is the direction the path sets off in, degrees + anticlockwise (the yaw
     convention), defaulting to nought. The swizzle's left blade sets off toes out, at
     an angle to the line the lemons run along, and without it the whole chain of
     lemons is drawn tilted by that angle. Absent everywhere else, so nothing moves. */
  let x=0, y=0, th=-(move.heading ?? 0)*D2R;
  pts.push({x,y,th});
  const spans = move.path.map(s => s.span ?? 1/move.path.length);
  const sum = spans.reduce((a,b)=>a+b, 0);
  move.path.forEach((seg, si) => {
    // samples proportional to the segment's share of the clock, so time
    // maps linearly to index and phase boundaries land where they're authored
    const N = Math.max(2, Math.round(TOTAL * spans[si] / sum));
    /* RADIUS IS PER SEGMENT, falling back to the move's — 19/09/2026, for the
       spins. A spin arrives on a wide edge and tightens onto a point, and until
       now every arc of a move shared one radius, so an entrance could only have
       been captioned rather than drawn. Optional and defaulted, which is the
       same shape as `point` and `yaw`: every move written before it has no
       seg.radius, takes move.radius, and draws byte-identically.

       Segments stay tangent-continuous across a radius change — buildPath
       carries x, y and th from the previous segment's end — so the tracing has
       no step in position or heading, only in curvature. A run of arcs of
       falling radius is therefore a spiral approximated in arcs, which is what
       a spin entrance is. */
    /* A PIVOT — 04/10/2026, Session 33, for the swizzle. The blade turns where it stands:
       the heading swings by `sweep` degrees (+ anticlockwise seen from above, the yaw
       convention) and the contact does not move, so the tracing draws a point. That is
       the pointed end of a lemon, where the toes come round from in to out with the feet
       together. The blade is flat through it (the pose's edge is null), which is the only
       way a blade can turn without travelling: an edge would carry it along its own curve.
       Not an arc, so the arcs either side do not ramp into it.

       The heading comes round on a smoothstep, not at a constant rate: the blade's rate
       of turn starts and ends near the arcs' own, which is what continuity.mjs holds
       every path to (WRENCH, 2° a frame). At a constant rate a 60° pivot in ten frames
       stepped by 5.25° at each end. */
    if (seg.kind === 'pivot') {
      const S = u => u*u*(3 - 2*u);
      for (let i = 1; i <= N; i++) pts.push({x, y, th: th - seg.sweep*D2R*S(i/N)});
      th -= seg.sweep*D2R;
      return;
    }
    const R = seg.radius ?? move.radius;
    const k = seg.kind==='arc' ? -lobeSense(seg.foot,seg.edge,seg.dir)/R : 0;
    const len = seg.kind==='arc' ? R*seg.sweep*D2R : seg.len;

    /* THE STAIRCASE, AND THE RAMP THAT TAKES IT OUT — 20/09/2026. docs/model.md,
       *The path is a staircase*, has the argument and the tables.

       A segment used to hold one radius and one rate throughout, and segments were
       chained tangent-continuously — so position and heading were continuous and
       NOTHING ELSE WAS. The body hangs off the curve and reads the derivatives the
       curve has not got: the hip's speed is (R − the blade's lateral offset) × the
       rate, and R_SPIN is by its own comment equal to that offset, so a centred
       skater went from nought to 10.46 cm a frame between two frames at a spin's
       exit, and the rotation rate roughly halved in the same frame.

       So a segment's radius and rate are values it REACHES, not constants it holds.
       Each enters at the mean of this segment's and the previous one's, leaves at the
       mean of this one's and the next, and holds its own value in between — which
       makes both continuous at the boundary, because the two sides meet at the same
       mean.

       THE AUTHORED RATE IS THE SEGMENT'S MEAN RATE, NOT ITS INSTANTANEOUS ONE, and
       that is what keeps this safe. `span` stays exactly what `at()` computed, so the
       duration, spinMove's bounds, every keyframe's `t` and the ISU revolution counts
       spin.mjs asserts are untouched; the plateau is SOLVED so the segment still turns
       `sweep` in `span`. One equation, monotone, bisected.

       A RAMP IS BETWEEN TWO ARCS. A line does not take part — you cannot be partly
       straight, and a take-off is not an artefact: the blade stops steering at a
       definite instant and the body goes on with what it had. Smoothing the waltz's
       arc-to-line boundaries made it measurably worse, which is the measurement that
       found this rule.

       A segment with nothing to ramp takes the closed form below unchanged, from the
       segment's start in one evaluation, so every move that had no staircase renders
       byte for byte as it did. */
    const arcs = move.path.map(g => g.kind === 'arc');
    const kOf  = (j) => -lobeSense(move.path[j].foot, move.path[j].edge, move.path[j].dir) /
                        (move.path[j].radius ?? move.radius);
    const mean = (a, b) => (a + b) / 2;
    const isArc = seg.kind === 'arc';
    /* A HELD SEGMENT HOLDS ITS RADIUS, AND MAY STILL CHANGE ITS RATE. `position` and
       `windup` name a basic position the skater is holding through the segment, and
       spin.mjs asserts those are CENTRED — the blade's lateral offset equals the path
       radius, so the hip sits on the centre of curvature and stops travelling. A radius
       that ramps through one of them would un-centre it, which is the ISU's own word for
       a fault. So the transition is taken entirely by the segment either side that is
       free to move, and it ramps to the held segment's own value rather than to a mean.

       The RATE ramps through a held segment all the same, because a skater drawing in
       accelerates while perfectly centred — that is what a wind-up IS. */
    const heldOf = j => !!(move.path[j].position || move.path[j].windup);
    const held = isArc && heldOf(si);
    const target = (j) => held ? k : heldOf(j) ? kOf(j) : mean(k, kOf(j));
    const kIn  = isArc && si > 0             && arcs[si-1] ? target(si-1) : k;
    const kOut = isArc && si < arcs.length-1 && arcs[si+1] ? target(si+1) : k;
    const r0   = isArc ? (seg.rate ?? null) : null;
    const rIn  = r0 != null && si > 0             && arcs[si-1] && move.path[si-1].rate != null
                 ? mean(move.path[si-1].rate, r0) : r0;
    const rOut = r0 != null && si < arcs.length-1 && arcs[si+1] && move.path[si+1].rate != null
                 ? mean(r0, move.path[si+1].rate) : r0;
    const flat = kIn === k && kOut === k && (r0 == null || (rIn === r0 && rOut === r0));

    if(flat){
      for(let i=1;i<=N;i++){
        const t = len*i/N;
        let px,py;
        if(Math.abs(k)<1e-9){ px = x+Math.cos(th)*t; py = y+Math.sin(th)*t; }
        else { px = x+(Math.sin(th+k*t)-Math.sin(th))/k; py = y-(Math.cos(th+k*t)-Math.cos(th))/k; }
        pts.push({x:px,y:py,th:th+k*t});
      }
    } else if(r0 == null && (kIn*k <= 0 || kOut*k <= 0)){
      /* A RAMP THROUGH AN INFLECTION — 03/10/2026, Session 26. The branch below steps
         in ANGLE and divides by the curvature to get a length, which is fine while a
         ramp stays on one side of straight and infinite where it reaches it. Two arcs
         curving opposite ways ramp to a mean of nought at their boundary, so a slalom
         took a single step of 288 cm and drew 42 m of tracing for a 7 m element. It had
         been doing so on the slalom, backward slalom and two-foot change of edge pages
         since their tracings were added, and nothing measured a tracing's length.

         So this case steps in ARC LENGTH, where nought curvature is just a straight
         piece. The ramp is the same shape, linear in, a plateau, linear out, and the
         plateau K is solved so the segment still turns exactly `sweep`: the turn is
         K·(L − ws) + (kIn + kOut)·ws/2, set equal to k·L. No move whose ramps stay on one
         side of straight comes this way, so every such path is unchanged. */
      const L = len, ws = Math.min(L/2, RAMP*D2R/Math.abs(k));
      const K = (k*L - (kIn + kOut)*ws/2) / (L - ws);
      const kS = q => q < ws ? kIn + (K - kIn)*(q/ws) : q > L - ws ? K + (kOut - K)*((q - (L - ws))/ws) : K;
      const ds = L / N;
      for(let i=0;i<N;i++){
        const dth = kS((i + 0.5)*ds) * ds;
        x += Math.cos(th + dth/2)*ds; y += Math.sin(th + dth/2)*ds;
        th += dth;
        pts.push({x,y,th});
      }
    } else {
      const TH = seg.sweep, w = Math.min(TH/2, RAMP);
      const ramp = (inV, mid, outV) => phi =>
        phi < w            ? inV + (mid - inV) * (phi / w)
      : phi > TH - w       ? mid + (outV - mid) * ((phi - (TH - w)) / w)
      :                      mid;
      const kAt = ramp(kIn, k, kOut);
      /* The plateau that keeps the segment's own clock. ∫dφ/ω over a linear ramp from
         a to b across w is w·ln(b/a)/(b−a); the whole integral must come to TH/r0, and
         it falls as the plateau rises, so bisection finds it in a handful of steps. */
      let star = r0;
      if(r0 != null && (rIn !== r0 || rOut !== r0)){
        const leg = (a, b) => Math.abs(a - b) < 1e-9 ? w / a : w * Math.log(b / a) / (b - a);
        const time = m => leg(rIn, m) + (TH - 2*w) / m + leg(m, rOut);
        const want = TH / r0;
        let lo = Math.min(rIn, r0, rOut) / 4, hi = Math.max(rIn, r0, rOut) * 4;
        for(let it = 0; it < 60; it++){ const m = (lo + hi) / 2; if(time(m) > want) lo = m; else hi = m; }
        star = (lo + hi) / 2;
      }
      const wAt = r0 == null ? null : ramp(rIn, star, rOut);
      /* Two passes: the turn each sample takes, then scaled so the segment turns
         exactly `sweep`. Stepping in time and hoping the total lands is how a heading
         drifts, and every later segment is chained off this one's. */
      const span = spans[si];                          // seconds, exactly as at() computed it
      const dts = [];
      let phi = 0;
      for(let i=0;i<N;i++){
        const om = wAt ? wAt(Math.min(TH, phi)) : null;
        const dTh = om == null ? TH / N : 360 * om * (span / N);
        dts.push(dTh); phi += dTh;
      }
      const scale = TH / dts.reduce((a,b)=>a+b, 0);
      phi = 0;
      for(let i=0;i<N;i++){
        const dTh = dts[i] * scale;
        const kk = kAt(Math.min(TH, phi + dTh/2));
        const dth = dTh * D2R * Math.sign(k);
        x = x + (Math.sin(th+dth)-Math.sin(th))/kk;
        y = y - (Math.cos(th+dth)-Math.cos(th))/kk;
        th += dth; phi += dTh;
        pts.push({x,y,th});
      }
    }
    const last = pts[pts.length-1]; x=last.x; y=last.y; th=last.th;
  });
  // cumulative distance in cm (path units ≈ cm at this radius scale)
  let d=0; pts[0].d=0;
  for(let i=1;i<pts.length;i++){ d += Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y); pts[i].d=d; }

  /* THE HIP'S OFFSET FROM THE PATH, AND THE DISPLACEMENT THAT KEEPS IT CONTINUOUS
     — 20/09/2026. docs/model.md, *The reference handover*, has the argument.

     Until today body-frame.js derived this itself, per frame, as `pose.skate`'s own
     offset. That was two faults in one line. It re-derived from the pose a fact the
     path has to know, which is this repository's named recurring failure; and it
     gave the root no condition the TRACING has — `skate` names the blade the tracing
     is built from, the mark is drawn only where that blade has a contact, and the
     hip was hung off it whether it was touching or 30 cm in the air. So the root
     moved by the distance between two blades whenever the reference changed: 12.54 cm
     in one frame on the waltz, 14.49 on the change of foot, against medians of 1.78
     and nought.

     Three rules. While the reference blade has a contact the offset is that blade's.
     While nothing is on the ice the offset is HELD at its last value, because there is
     nothing cutting the ice to measure from and the body carries on as it was. When a
     blade takes the ice the path is displaced so the hip does not move.

     HOLDING IS WHAT MAKES ONE RULE COVER A JUMP AND A SPIN, and neither was designed
     for. A flight segment is a line, so a constant offset carries the hip straight
     through the air. A spin's coil is a circle whose radius EQUALS the centred blade's
     lateral offset — spin.mjs's own definition of centred — so a constant offset holds
     the hip on the centre point for the whole step-over. It also halves the seams: a
     blade LEAVING the ice is no longer a change of anchor at all, because the offset it
     leaves behind is the offset that is held.

     Keyed on the POSE's contact, never on the segment's `foot`. They agree on the clock
     and not always on the sample — the sample count is rounded per segment, so the
     change of foot's path boundary falls at index 162 while the pose's reference changes
     at 161 — and the renderer draws from the pose, so the root has to as well or the two
     drift. boot.mjs's rule, one file along.

     `d` is deliberately computed ABOVE this, so it stays the arc length actually
     skated rather than picking up the displacement as distance travelled.

     A PATH WITH NO KEYS IS A SHAPE AND NOT A SKATER, so it gets no offset. PathThumb
     runs a basic's `trace` through this function to draw a tracing for an element with
     no entry edge — deliberately, one derivation rather than two — and hands it a
     `path` and a `radius` and nothing else. There is no body to place, so there is
     nothing to hold or displace, and the curve it wants is the plain one. Found by
     `astro build` and by nothing before it: every checker here iterates MOVES, and
     MOVES is not where the second caller lives. */
  if(!move.keys) return pts;
  const n = pts.length;
  let held = {t:0, n:0}, src = null, dx = 0, dy = 0;
  for(let i=0;i<n;i++){
    const po = poseFree(move, i/(n-1));
    const down = po.skate && onIceOf(po, po.skate) ? po.skate : null;
    /* A BLADE TAKING THE ICE, not a DIFFERENT blade — 03/10/2026, Session 26. This
       read `down !== src`, and `src` was never cleared while nothing was on the ice, so
       a landing on the foot that took off was not a landing: the loop (takeoff and
       landing both RBO) moved the hip 3 cm in one frame, under continuity.mjs's 5, and
       the two-foot hop, which lands where it took off, moved it 8. Every move that
       lands on the other foot is unchanged, because for those the two conditions
       agree. */
    if(down && down !== src){
      if(i > 0){
        const th2 = pts[i].th, dt = po[down].t - held.t, dn = po[down].n - held.n;
        dx += Math.cos(th2)*dt - Math.sin(th2)*dn;
        dy += Math.sin(th2)*dt + Math.cos(th2)*dn;
      }
      src = down;
    }
    if(down) held = {t: po[down].t, n: po[down].n};
    else src = null;
    pts[i].x += dx; pts[i].y += dy;
    /* THE CUSP MOVES THE CONTACT AND NOT THE SKATER. poseAt has put the same offset
       on the reference blade, so `held` carries it and the hip, path minus held,
       stays on the circle while the tracing and the blade leave it together. */
    const cu = cuspFor(move, i/(n-1), po);
    if(cu){
      const th2 = pts[i].th;
      pts[i].x += Math.cos(th2)*cu.dt - Math.sin(th2)*cu.dn;
      pts[i].y += Math.sin(th2)*cu.dt + Math.cos(th2)*cu.dn;
    }
    pts[i].ot = held.t; pts[i].on = held.n;
  }
  return pts;
}

/* ═══ pose interpolation ═════════════════════════════════════ */
const lp = (a,b,u)=>a+(b-a)*u;

/* The per-foot fields are CARRIED from the keyframe being left, not interpolated
   — onIce, edge and dir are states, not quantities, exactly as pose-level skate,
   edge and dir already are. Dropping them here is the failure this file is most
   exposed to: the renderer and every per-frame checker read poseAt's output, not
   the keyframe, so a field left out of this line would make a second blade
   disappear everywhere except in the authoring. tools/twofoot.mjs asserts the
   round trip per frame for exactly that reason. */
const lpP = (a,b,u)=>({t:lp(a.t,b.t,u),n:lp(a.n,b.n,u),z:lp(a.z,b.z,u),pitch:lp(a.pitch,b.pitch,u),
                       /* `point` is a quantity like pitch, so it interpolates rather
                          than carrying. Leaving it out here would make an authored
                          point visible in the keyframe and nowhere else — the failure
                          this function's own comment warns about, one field along. */
                       point:lp(a.point ?? ANKLE_POINT, b.point ?? ANKLE_POINT, u),
                       /* `yaw` is a quantity too and interpolates. IT WAS LEFT OUT WHEN IT
                          WAS ADDED, on 19/09/2026, and the comment above had already
                          named the consequence: the push was authored turned thirty-five
                          degrees, every checker that reads keyframes agreed, and every
                          frame the renderer drew had it running true. It was looked at and
                          passed, because two boots in different places look different
                          whether or not one of them is turned. Measure the rendered
                          heading, do not eye it. */
                       
                       yaw:lp(a.yaw ?? 0, b.yaw ?? 0, u),
                       /* `roll` is a quantity and interpolates, and it is in this line on
                          the day it was added rather than a session later. `yaw`'s note
                          above is the reason: the omission is invisible in the authoring,
                          invisible to every checker that reads keyframes, and visible only
                          in what the renderer draws. */
                       roll:lp(a.roll ?? 0, b.roll ?? 0, u),
                       /* `edge` on a foot is a STATE and carries, like onIce and dir. Only
                          a skid has one — every other foot's edge is derived from the
                          reference blade — and a skid without it draws on the wrong edge,
                          which on a T-stop is the error coaches name. Same omission, same
                          line, same day. */
                       ...(a.onIce ? {onIce:a.onIce} : {}), ...(a.dir ? {dir:a.dir} : {}),
                       ...(a.edge ? {edge:a.edge} : {})});

/* A FOOT ARRIVING ON THE ICE, OR LEAVING IT — 20/09/2026, and it is DERIVED rather
   than authored because the keys either side already say it. docs/model.md,
   *A foot arriving on the ice*, has the argument; the short version is that a flag
   exempts and holds nothing to account, which is why `pick: true` was taken out.

   A free foot is ARRIVING when the next key is one where it takes a contact, and
   DEPARTING when the previous key was. poseAt is holding exactly those two keys, so
   this costs a comparison rather than a traversal.

   What travels with it is the contact's DIRECTION and nothing else: `pitch` and `yaw`
   are quantities and lpP is already interpolating them toward the target key, so by
   the moment of contact the two constructions in bootDir are being handed the same
   numbers. `dir` is a state and carries, so it has to be fetched. */
const arrivalOf = (a, b, which, move, t, u) => {
  const onA = onIceOf(a, which), onB = onIceOf(b, which);
  if (!onA && onB) return { phase: 'arriving',  dir: (b[which] && b[which].dir) || b.dir,
                            ...pickReach(onB, b[which], (b.t - t) * (move.duration || 1), u,
                                         (b.t - a.t) * (move.duration || 1)) };
  if (onA && !onB) return { phase: 'departing', dir: (a[which] && a[which].dir) || a.dir,
                            ...pickReach(onA, a[which], (t - a.t) * (move.duration || 1), 1 - u,
                                         (b.t - a.t) * (move.duration || 1)) };
  return null;
};

/* REACHING FOR THE PICK, AND LEAVING IT — 04/10/2026, Session 29, docs/spec-anchor.md
   part B. A blade arriving on the ice blends over the last CLEAR centimetres of
   HEIGHT, because a blade comes down flat and the height is where its rule changes.
   A pick does not come down flat: the boot is near vertical, the toe is the only
   thing that touches, and the free rule (square to the shin) and the picked rule
   (along the reach) can point the toe's horizontal part a hundred and fifty degrees
   apart while both are nearly straight down. So a foot reaching for a pick blends
   over a fixed TIME before the contact, PICK_REACH seconds, and the same after it
   comes out. A time and not a fraction of the span, so the blend does not change
   with the clip's length.

   Only for a pick, and only as extra fields on the arrival: a blade's arrival
   object is exactly what it was, so every move drawn before today is unchanged. */
export const PICK_REACH = 0.25;                     // seconds
/* The window is PICK_REACH or the whole span, whichever is shorter, so the blend always
   starts from nothing at the span's far key. A toe loop's pick comes out a twelfth of a
   second before the blade leaves, and a quarter-second window there would have started
   the departure three quarters blended: a step at the key. */
const pickReach = (on, foot, dtSeconds, near, spanSeconds) => on !== 'pick' ? {} : {
  on: 'pick', pitch: foot.pitch || 0, yaw: foot.yaw || 0, along: foot.dir || null,
  w: S3(Math.min(1, Math.max(0, 1 - dtSeconds / Math.min(PICK_REACH, spanSeconds)))),
  /* How far the authored point has moved from the blade's middle to the teeth: over
     the whole span (`near` is poseFree's eased u, 1 at the pick), not over PICK_REACH.
     The direction comes round in the last quarter second; the point cannot, because a
     boot stood on end with its point still at the blade's middle has its teeth 10 cm
     under the ice. Looked at, 04/10/2026: toePick at 0.38 and 0.66. */
  c: near,
};

function poseFree(move, t){
  const K = move.keys;
  let i = 0; while(i < K.length-2 && K[i+1].t <= t) i++;
  const a = K[i], b = K[Math.min(i+1,K.length-1)];
  const span = Math.max(1e-6, b.t-a.t);
  const raw = Math.min(1, Math.max(0, (t-a.t)/span));
  const u = raw*raw*(3-2*raw);
  /* A CONTACT HOLDS ACROSS A SPAN ONLY WHERE BOTH KEYS DECLARE IT — 20/09/2026.
     lpP carries onIce from the left key alongside edge and dir, under a comment calling
     all three states rather than quantities. It is right about edge and dir: they are
     labels that stay true while the foot moves. onIce is not that kind of thing. It is a
     geometric claim — this foot is within ON_ICE of the ice — and a span is the pose
     interpolating away from it. A claim the motion falsifies cannot be carried through
     the motion, which is how a blade claimed on the ice came to be drawn 29.99 cm above
     it for six frames of the waltz with the tracing built from it.

     u > 0 and not u >= 0 because the declaration IS the truth at the instant of the key.
     A blade leaves the ice at a moment, and the last key that declares the contact is
     that moment. */
  const foot = which => {
    const f = lpP(a[which], b[which], u);
    if (!f) return f;
    const ar = arrivalOf(a, b, which, move, t, u);
    return ar ? { ...f, arrival: ar, ...(u > 0 ? { onIce: null } : {}) } : f;
  };
  const pose = {
    hipZ: lp(a.hipZ,b.hipZ,u), hipYaw: lp(a.hipYaw,b.hipYaw,u), shYaw: lp(a.shYaw,b.shYaw,u),
    sh: lpP(a.sh,b.sh,u), L: foot('L'), R: foot('R'),
    LH: lpP(a.LH,b.LH,u), RH: lpP(a.RH,b.RH,u),
    skate: a.skate, edge: a.edge, dir: a.dir, ph: a.ph,
  };
  /* INSIDE A ONE-FOOT TURN the reference blade's yaw, its offset from the circle and
     its edge and direction all come from cuspAt, so they cannot disagree with the
     tracing buildPath draws from the same call. The edge and direction change AT THE
     APEX, where the blade is square across the circle: before it the skater is going
     forwards on the entry edge, after it backwards on the exit edge. The yaw is
     re-read against the new direction there, so the heading does not move. The keys
     either side of the window carry the entry and the exit state, and nothing inside
     it is authored. */
  const cu = move.path && cuspFor(move, t, pose);
  if (cu) {
    const past = Math.abs(cu.psi) > 90, st = past ? cu.exit : cu.entry;
    const q = pose[pose.skate];
    pose[pose.skate] = { ...q, t: q.t + cu.dt, n: q.n + cu.dn,
                         yaw: cu.psi - (past ? cu.sense * 180 : 0) };
    pose.edge = st.edge; pose.dir = st.dir;
  }
  return pose;
}

/* ═══ a contact pinned to the ice ════════════════════════════════
   04/10/2026, Session 29. docs/spec-anchor.md, part A.

   Every foot is authored relative to the hip in the track frame, and only the
   reference blade is pinned to the path. A gliding blade travels with the skater, so
   that cost nothing until the pick: a pick stays where it went in while the body goes
   past it. Authored hip-relative, a pick held through real travel has to sweep
   backwards by however far the hip went, so until today a pick could only be a held
   position.

   A foot key may now declare `pin: true`. Over a run of consecutive keys that all
   declare it, the foot is FIXED IN THE WORLD:

     1. at the run's first key its world point is computed once, from the path's
        point, heading and hip offset at that time and the authored t, n;
     2. on every time inside the run its t, n are recomputed from that world point
        and that time's own hip and heading;
     3. z, pitch and everything else stay as poseFree interpolates them.

   The authored t, n of the run's later keys are not used for position. They say where
   the foot ends up, which is worth reading in a move, and tools/continuity.mjs holds
   them to the pinned value within PIN_AGREE, so they cannot quietly drift from it.

   WHERE IT LIVES, and the one departure from the spec. The spec put the pass "after
   buildPath and poseAt, in the one place that turns a pose into world coordinates".
   There is no one place: body-frame.js does it per view, and eleven checkers call
   poseAt directly and never see a view. A pass the renderer ran and the checkers did
   not would be the second copy this repository keeps a list of. So it lives here,
   inside poseAt, and everything that reads poseAt sees the same pinned foot.
   poseFree is the old poseAt, still a function of the clock alone, and buildPath
   reads it: the path is built from the unpinned pose and the pin is read off the
   path, so nothing is circular. That is safe because the pin may not be on the
   reference blade (asserted below): the path's root is the reference blade's, so a
   pin on any other foot cannot move it.

   A MOVE THAT DECLARES NO PIN gets poseFree's own object back, untouched, which is
   what keeps every move drawn before today byte-identical. tools/frame-hash.mjs
   proves it, every frame of every move. */
export const PIN_AGREE = 1;                          // cm, an authored pinned key against the pin
const pinCache = new WeakMap();

/** The hip's world position and heading at time t, interpolated along the path's
    samples. At a sample's own time this is exactly the sample. */
const hipOnPath = (path, t) => {
  const x = Math.min(1, Math.max(0, t)) * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(x)), f = x - i;
  const a = path[i], b = path[i + 1], L = (u, v) => u + (v - u) * f;
  const th = L(a.th, b.th), ot = L(a.ot || 0, b.ot || 0), on = L(a.on || 0, b.on || 0);
  const T = [Math.cos(th), Math.sin(th)], N = [-Math.sin(th), Math.cos(th)];
  return { x: L(a.x, b.x) - T[0]*ot - N[0]*on, y: L(a.y, b.y) - T[1]*ot - N[1]*on, T, N, th };
};

/** The pinned runs of a move: per foot, each maximal run of consecutive keys whose
    foot declares `pin`, with the world point it is pinned to. Cached per move. */
export function pinRuns(move){
  if (pinCache.has(move)) return pinCache.get(move);
  const K = move.keys || [], runs = [];
  if (K.some(k => ['L', 'R'].some(w => k[w] && k[w].pin))) {
    const path = buildPath(move);
    for (const w of ['L', 'R']) {
      for (let i = 0; i < K.length; i++) {
        if (!(K[i][w] && K[i][w].pin)) continue;
        let j = i;
        while (j + 1 < K.length && K[j + 1][w] && K[j + 1][w].pin) j++;
        for (let k = i; k <= j; k++)
          if (K[k].skate === w)
            throw new Error(`pin on the reference blade (${w} at t=${K[k].t}): the path is ` +
              `rooted on it, so it cannot also be read off the path`);
        const h = hipOnPath(path, K[i].t), q = K[i][w];
        runs.push({ foot: w, from: K[i].t, to: K[j].t, keys: [i, j],
                    x: h.x + h.T[0]*q.t + h.N[0]*q.n, y: h.y + h.T[1]*q.t + h.N[1]*q.n, path });
        i = j;
      }
    }
  }
  pinCache.set(move, runs);
  return runs;
}

/** Where a pinned foot is, hip-relative in the track frame, at time t. */
export const pinnedAt = (run, t) => {
  const h = hipOnPath(run.path, t), dx = run.x - h.x, dy = run.y - h.y;
  return { t: dx*h.T[0] + dy*h.T[1], n: dx*h.N[0] + dy*h.N[1] };
};

export function poseAt(move, t){
  const pose = poseFree(move, t);
  const runs = move.keys ? pinRuns(move) : [];
  for (const r of runs) {
    if (t < r.from || t > r.to) continue;
    pose[r.foot] = { ...pose[r.foot], ...pinnedAt(r, t), pin: true };
  }
  for (const r of move.keys ? trackRuns(move) : []) {
    if (t < r.from || t > r.to) continue;
    pose[r.foot] = { ...pose[r.foot], ...trackedAt(r, t), track: true };
  }
  return pose;
}

/* ═══ a second blade on its own circle ═══════════════════════════
   04/10/2026, Session 33. docs/model.md, *A second blade on its own circle*.

   Since Session 09 a second blade's edge has been derived: two blades on one circle
   share a lobe, so the second letter falls out of the first (secondFoot). That is
   true of every two-foot pose the rig held until the swizzle, and false of the
   swizzle, whose blades run two halves of a lemon curving opposite ways: RFI and LFI
   together, which the derivation cannot produce and was written to refuse.

   So a second blade may have its OWN PATH. `move.tracks` lists them:

       { foot: 'R', from: 0, to: 1, path: [segments], radius }

   The segments are the reference path's own kind, built by the same buildPath, and
   the blade's edge comes out of its segment exactly as the reference blade's does:
   the curvature is computed FROM the segment's foot, edge and direction, so the edge
   and the line cannot disagree. Nothing is stated that the geometry does not imply.

   The track is anchored where the foot is at `from` — the hip's place and heading on
   the reference path at that time, plus the foot's authored t, n and yaw there — and
   from then on the foot is wherever its track has got to, re-expressed hip-relative
   in the path frame at each time, with its yaw the difference between its own heading
   and the path's. That is the pin's construction (pinRuns, above) with a moving point.

   As with a pin, the authored t, n and yaw of the keys inside the run do not place the
   foot. They say where it is, which is worth reading in a move, and tools/twofoot.mjs
   holds them to the track within TRACK_AGREE, so they cannot drift from it. Not on the
   reference blade: the path is rooted on it, and a track there would be a second
   path for one blade. */
export const TRACK_AGREE = 1;                        // cm and degrees, an authored key against its track
const trackCache = new WeakMap();
const wrap180 = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a === -180 ? 180 : a; };

export function trackRuns(move){
  if (trackCache.has(move)) return trackCache.get(move);
  const out = [];
  if (move.tracks && move.tracks.length) {
    const path = buildPath(move);
    for (const tr of move.tracks) {
      const k0 = (move.keys || []).find(k => Math.abs(k.t - tr.from) < 1e-9);
      if (!k0 || !k0[tr.foot]) throw new Error(`track on ${tr.foot} from t=${tr.from}: no key there to anchor it`);
      for (const k of move.keys)
        if (k.t >= tr.from && k.t <= tr.to && k.skate === tr.foot)
          throw new Error(`track on the reference blade (${tr.foot} at t=${k.t}): the path is rooted on it`);
      const shape = buildPath({ path: tr.path, radius: tr.radius ?? move.radius, frames: move.frames });
      const spans = tr.path.map(s => s.span ?? 1 / tr.path.length);
      const sum = spans.reduce((a, b) => a + b, 0);
      const h = hipOnPath(path, tr.from), q = k0[tr.foot];
      const head = h.th - (q.yaw || 0) * D2R;           // the foot's own heading, path units
      out.push({ foot: tr.foot, from: tr.from, to: tr.to, path, shape, segs: tr.path,
                 bounds: spans.map((_, i) => spans.slice(0, i + 1).reduce((a, b) => a + b, 0) / sum),
                 x: h.x + h.T[0]*q.t + h.N[0]*q.n, y: h.y + h.T[1]*q.t + h.N[1]*q.n, head });
    }
  }
  trackCache.set(move, out);
  return out;
}

/** Where a tracked foot is at time t: hip-relative t and n in the path frame, its yaw
    off the path's heading, and the edge and direction of the segment it is on. */
export const trackedAt = (run, t) => {
  const u = Math.min(1, Math.max(0, (t - run.from) / Math.max(1e-9, run.to - run.from)));
  const S = run.shape, xi = u * (S.length - 1);
  const i = Math.min(S.length - 2, Math.floor(xi)), f = xi - i, a = S[i], b = S[i + 1];
  const lx = a.x + (b.x - a.x) * f, ly = a.y + (b.y - a.y) * f, lth = a.th + (b.th - a.th) * f;
  const c = Math.cos(run.head), s = Math.sin(run.head);
  const wx = run.x + c*lx - s*ly, wy = run.y + s*lx + c*ly;
  const h = hipOnPath(run.path, t), dx = wx - h.x, dy = wy - h.y;
  let si = run.bounds.findIndex(e => u <= e + 1e-12); if (si < 0) si = run.segs.length - 1;
  /* At a boundary the segment being LEFT holds, as a key's state does in poseFree. */
  const seg = run.segs[si];
  return { t: dx*h.T[0] + dy*h.T[1], n: dx*h.N[0] + dy*h.N[1],
           yaw: wrap180(-(run.head + lth - h.th) / D2R),
           edge: seg.kind === 'arc' ? seg.edge : null, dir: seg.dir };
};
