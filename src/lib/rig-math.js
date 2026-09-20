/* The rig's geometry. Pure functions, no DOM — so the checkers can import it
   directly instead of scraping a page, and so a projection bug can be reproduced
   in isolation.

   Coordinates: t along the track (+ forward), n across (+ the skater's right),
   z height above the ice, centimetres throughout. Yaw is degrees from the
   direction of travel, + anticlockwise seen from above. */

import { lobeSense, secondFoot } from './skating.js';

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
export const onIceOf = (pose, which) =>
  which === pose.skate ? (pose.skate ? ((pose[which] && pose[which].onIce) || 'blade') : null)
                       : ((pose[which] && pose[which].onIce) || null);

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
    /* Along the reach. Foot coordinates are already relative to the hip, so the
       horizontal part of the foot vector IS the reach; a pick under the hip has no
       reach to speak of and falls back to the tracing rather than dividing by it. */
    const h = Math.hypot(foot.t, foot.n);
    if(h > 1e-6) return [foot.t/h*Math.cos(p), foot.n/h*Math.cos(p), -Math.sin(p)];
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

/* ═══ path ════════════════════════════════════════════════════ */
export function buildPath(move){
  const TOTAL = 320, pts = [];
  let x=0, y=0, th=0;
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
    const R = seg.radius ?? move.radius;
    const k = seg.kind==='arc' ? -lobeSense(seg.foot,seg.edge,seg.dir)/R : 0;
    const len = seg.kind==='arc' ? R*seg.sweep*D2R : seg.len;
    for(let i=1;i<=N;i++){
      const t = len*i/N;
      let px,py;
      if(Math.abs(k)<1e-9){ px = x+Math.cos(th)*t; py = y+Math.sin(th)*t; }
      else { px = x+(Math.sin(th+k*t)-Math.sin(th))/k; py = y-(Math.cos(th+k*t)-Math.cos(th))/k; }
      pts.push({x:px,y:py,th:th+k*t});
    }
    const last = pts[pts.length-1]; x=last.x; y=last.y; th=last.th;
  });
  // cumulative distance in cm (path units ≈ cm at this radius scale)
  let d=0; pts[0].d=0;
  for(let i=1;i<pts.length;i++){ d += Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y); pts[i].d=d; }
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
const arrivalOf = (a, b, which) => {
  const onA = onIceOf(a, which), onB = onIceOf(b, which);
  if (!onA && onB) return { phase: 'arriving',  dir: (b[which] && b[which].dir) || b.dir };
  if (onA && !onB) return { phase: 'departing', dir: (a[which] && a[which].dir) || a.dir };
  return null;
};

export function poseAt(move, t){
  const K = move.keys;
  let i = 0; while(i < K.length-2 && K[i+1].t <= t) i++;
  const a = K[i], b = K[Math.min(i+1,K.length-1)];
  const span = Math.max(1e-6, b.t-a.t);
  const raw = Math.min(1, Math.max(0, (t-a.t)/span));
  const u = raw*raw*(3-2*raw);
  const foot = which => {
    const f = lpP(a[which], b[which], u);
    if (!f) return f;
    const ar = arrivalOf(a, b, which);
    return ar ? { ...f, arrival: ar } : f;
  };
  return {
    hipZ: lp(a.hipZ,b.hipZ,u), hipYaw: lp(a.hipYaw,b.hipYaw,u), shYaw: lp(a.shYaw,b.shYaw,u),
    sh: lpP(a.sh,b.sh,u), L: foot('L'), R: foot('R'),
    LH: lpP(a.LH,b.LH,u), RH: lpP(a.RH,b.RH,u),
    skate: a.skate, edge: a.edge, dir: a.dir, ph: a.ph,
  };
}
