/* Keyframed pose data for the body-frame rig.

   Positions are relative to the hip: t along the track (+ forward), n across
   (+ the skater's right), z absolute height above the ice, all in centimetres.
   Yaw is degrees from the direction of travel, + anticlockwise seen from above.

   Note that t is the direction of TRAVEL, not the direction the skater faces.
   After a half rotation those are opposite, so a free leg "extended behind the
   skater" sits at positive t. Getting that backwards is invisible frame by frame
   and obvious on a contact sheet — see tools/contact-sheet.mjs.

   The fourth argument to P() is boot pitch in degrees, + toe down. Keep it inside
   ±3.5°: a rockered blade runs out of length past that and the skater would be on
   the picks. Pitch is not decoration — it decides which part of the blade is
   touching, which is most of what distinguishes one edge from another. A foot that
   really is on the picks says so with PICK() below, not with a pitch nobody flagged. */

import { anterior, lateral, ANKLE_POINT, buildPath, pinRuns, pinnedAt } from './rig-math.js';

/* `point` is how hard the free foot is pointed, in degrees from the right angle
   you stand at, and it is clamped to the boot's allowance in bootDir. It is
   ignored on a skating foot, whose direction comes from the tracing. Leave it out
   and the foot takes ANKLE_POINT, which is what every pose written before
   30/08/2026 does — so those poses draw exactly as they always have. */
const P = (t,n,z,pitch=0,point=ANKLE_POINT,roll=0) => ({t,n,z,pitch,point,roll});

/* AN EXTENDED FREE LEG IS POINTED — 20/09/2026, and tools/underice.mjs is what
   said so. A boot is built square to the shin, so a free leg sloping down and
   forward carries a foot at a right angle to it: toe cocked up, HEEL DOWN. On a
   sit spin that put 5.4 cm of heel through the ice for seventy-five consecutive
   frames, and nothing in the repository could see it — freefoot.mjs judges the
   boot's ANGLE, at 58.6 degrees comfortably inside its 60, and the angle is only
   half of where a boot ends up. The other half is the height, and the two only
   meet at the ends of the glyph.

   Twenty-five degrees rather than a value that just clears: it is what a pointed
   foot is, inside the boot's ANKLE_MAX of 30, and the clearance it happens to buy
   is 2.7 cm rather than nothing. Authored on the keys where the leg is EXTENDED
   and not on the entrance, wind-up and exit, where it is gathered and a pointed
   foot would be a claim about a position the skater is not in. */
const POINTED = 25;


/* A FREE FOOT IS NOT POINTED UNLESS THE POSITION SAYS SO — Martyn, 20/09/2026,
   and it is the first time a coach has ruled on either of these numbers.

   `ANKLE_POINT` is 10°, applied to every unauthored free foot, and rig-math.js
   records against it in as many words: *Verified against a coach: NO.* Both it and
   `ANKLE_MAX` are read off a study of ankle injury, which is not a study of what a
   position looks like. Ten degrees is not neutral; it is a tenth of the way to a
   pointed foot, applied to every pose nobody had an opinion about.

   ON THE WALTZ JUMP HE HAS AN OPINION. Landing it, the free foot is not pointed:
   it is pushed back, and it is NEUTRAL — which is what lets the skater step
   forward onto it and keep moving, or spike the toe in for the next element. Both
   continuations exist and a learner should be shown neither; the neutral foot is
   the one that leaves them available. And through the move itself it is neutral
   too, where it is providing the momentum.

   So `NEUTRAL` is authored on this move's free feet rather than `ANKLE_POINT`
   being changed underneath every pose in the guide. rig-math.js's own finding is
   that the constant was never the lever — plantarflexion drives the blade wherever
   the shin already points, so one number lifts the toe on a spiral and drives it
   at the ice on a landing. It is a quantity a skater chooses, per pose, which is
   why `point` is on the keyframe. */
const NEUTRAL = 0;


/* An AUTHORED hand. The flag is the whole of the LH/RH fix below: it is what the
   default-carriage loop refuses to overwrite, and it is what the renderer reads
   to decide whether the guide names which hand is which. One field, in place of
   both a silent overwrite and a measured threshold standing in for intent. */
const PH = (t,n,z,pitch=0,point=ANKLE_POINT) => ({t,n,z,pitch,point,authored:true});

/* A SECOND BLADE ON THE ICE. `skate` names the reference blade — the one the path
   is built from and the one the hip hangs off — and stays single-valued; this
   marks the other foot as also down. Its EDGE is deliberately not an argument:
   both blades are on one circle, so secondFoot derives it from the reference
   blade and this foot's direction of travel. Pass a direction only where the two
   feet oppose, which is what a spread eagle's turnout is; leave it out and the
   foot travels the way the skater does. */
const ON = (t,n,z,pitch=0,dir=null) => ({t,n,z,pitch,point:ANKLE_POINT,onIce:'blade',...(dir?{dir}:{})});

/* A TOE PICK IN THE ICE. The third kind of contact: on the ice, carrying weight,
   with no edge and no lean claim, and a boot pitched far past what a rockered
   runner has length for. Pitch is required rather than defaulted, because past
   MAX_BLADE_PITCH is the whole of what makes this a pick — blade.mjs asserts it
   from both sides, so a PICK() at a blade's pitch fails as loudly as a blade at a
   pick's.

   No `dir`, because a pick is not travelling: bootDir points it along the reach
   from the hip instead of along a tracing. And no `point`, because a planted boot's
   direction does not come from the shin, so an ankle angle written here would be
   carried, interpolated and then ignored — a description waiting to be believed,
   which is exactly what the `pick: true` keyframe flag this replaces had become.
   freefoot.mjs asserts that nobody writes one. */
const PICK = (t,n,z,pitch) => ({t,n,z,pitch,onIce:'pick'});
/* A PICK PINNED TO THE ICE — 04/10/2026, Session 29 (docs/spec-anchor.md). Over a run
   of keys that all say PIN, the foot stays where the run's first key put it while the
   body goes past; rig-math.js, *a contact pinned to the ice*. The t, n of the run's
   later keys are where it ends up, held to the pin within PIN_AGREE. */
const PIN = (t,n,z,pitch) => ({...PICK(t,n,z,pitch), pin:true});

/* A BOOT LYING ON ITS SIDE — 20/09/2026. The fifth kind of contact, and the one the
   lunge has been waiting for since Session 14 and the drag since this morning. The
   runner is out of the ice and pointing sideways out of it; what is down is the edge of
   the sole. So: on the ice, bearing weight, no edge, no lean claim, and rolled far past
   anything a blade could be at.

   THE POSITION IS STILL THE BLADE'S, as it is for every other contact in this file. A
   boot on its side does not touch there — it touches BOOT_HALF_W across and BLADE_PROUD
   below — and making the authored point the touching point for this one contact alone
   would put an offset perpendicular to the boot into `ank − contact`, which is the very
   vector the renderer recovers the up-axis from. One meaning for the authored point is
   worth more than that. `soleEdgeZ` is what carries the difference, and it is asserted
   rather than assumed: the sole's edge on the ice, and the runner clear of it.

   ROLL IS REQUIRED rather than defaulted, for the reason PICK() requires its pitch: a
   boot at no roll is a boot on its blade, and calling that a side contact is a claim the
   geometry does not make. And it is NOT AN ANKLE ANGLE — a legal lunge needs 56 to 80
   degrees of it and no ankle everts 56. A skater gets almost all of it by turning the
   leg, which this rig does not model separately, so `roll` carries both and no cuff
   limit applies to it. docs/model.md. */
const SIDE = (t,n,z,roll,point=0) => ({t,n,z,pitch:0,point,roll,onIce:'boot'});

/* A BLADE ON THE ICE, TURNED OFF THE LINE OF TRAVEL — 19/09/2026. Its own helper
   rather than a sixth argument to ON(), for the reason PICK() has one: the yaw is
   not a trim on a normal second blade, it is the whole of what makes this a push.
   Degrees, + anticlockwise from above, the convention hipYaw already uses; what a
   hip will allow is HIP_OUT and HIP_IN and tools/turnout.mjs asserts it.

   NOT FOR THE REFERENCE BLADE. That one is pinned to the path and the path is its
   tracing, so turning it off its own line is a claim that it skids — and a skid
   leaves a scrape, which this guide has no mark for. turnout.mjs refuses it. */
const PUSH = (t,n,z,yaw,pitch=0) => ({t,n,z,pitch,point:ANKLE_POINT,onIce:'blade',yaw});

/* A BLADE SLIDING ACROSS ITSELF — 19/09/2026. The fourth kind of contact, and the
   yaw's other half: PUSH says where the boot points and the ice holds it there,
   this says the ice does not. A stop.

   Steel down and weight on it, so it draws solid. IT HAS AN EDGE AND SAYS WHICH:
   a T-stop rides the trailing blade's outside edge and doing it on the inside is
   the error coaches name, so the edge is the element rather than a detail. It
   cannot be derived the way a second blade's is, because that derivation assumes
   both blades are on one circle and a skid is across the circle, not on it.

   Yaw and edge are both required rather than defaulted, for the reason PICK()
   requires its pitch: a skid with no yaw is a blade running true, and calling
   that a stop would be a pose claiming a contact its geometry does not make.
   SKID_MIN_YAW asserts the floor. What a skid is NOT held to is lean.mjs, whose
   two routes are both claims about an edge that is carrying the skater's weight
   into a circle — a T-stop's trailing blade carries neither. */
const SKID = (t,n,z,yaw,edge,pitch=0) => ({t,n,z,pitch,onIce:'skid',yaw,edge});

/* -- SPINS: WHAT THE PATH SAYS THAT THE POSE CANNOT -------------------------
   A spin is the one move in this file whose PATH does the talking. Everywhere
   else a pose is held along a curve of one radius at one rate. A spin arrives
   travelling, tightens onto a point, holds a position, gathers everything to
   the axis and speeds up, then opens out again - and all four of those are
   facts about the path, not about the pose.

   Two things the path already carried made that nearly free:

   RADIUS IS PER SEGMENT (rig-math.js, buildPath, 19/09/2026), so the entrance
   genuinely spirals in rather than being captioned as doing so.

   ROTATION RATE IS SWEEP DIVIDED BY SPAN, which buildPath has always used to
   allocate samples. So a wind-up that turns faster is a real change of rate
   that the animation plays, not a note under the picture.

   WHAT IT MEANS FOR A SPIN TO BE CENTRED, exactly: the blade's lateral offset
   from the hip EQUALS the path radius. Everywhere else in this file those are
   two free numbers - the offset is lean, the radius is the lobe. In a spin they
   are one number, and the hip stands still because it is sitting at the centre
   of curvature. The entrance is therefore not a separate idea bolted on: it is
   the radius coming down to meet the lean, and the spin begins where they meet.
   tools/spin.mjs asserts it, and asserts the other side too - that the hip is
   still travelling before then, because an exemption can only excuse a pose.

   ONLY THE LATERAL HALF IS ASSERTED. The along-track offset is not zero on a
   sit spin: the fold carries the hip a third of a metre behind the blade and
   the free leg reaching forward is what balances it. That is a question about
   mass, and this rig has markers and no mass, so spin.mjs reports it and
   declines to judge it - as it already did before any of this.

   THE FINAL WIND-UP IS NOT A POSITION. The ISU is explicit: the concluding
   upright position at the end of the spin (final wind-up) is not considered to
   be another position independent of the number of revolutions. So a wind-up
   segment carries `windup: true` and no `position`, and a sit spin that rises
   to upright to finish is still a sit spin rather than a combination.

   A POSITION IS REACHED IN A SEGMENT THAT DOES NOT CLAIM IT. The pose
   interpolates between keyframes, so the frames where a skater is folding into
   a sit are neither upright nor sit. Those get their own short segment with no
   `position`, which is also what the handbook does: revolutions in a non-basic
   position count towards the total and not towards the two a position needs. */
const R_WIDE  = 110;  // the entrance edge, hip still travelling
const R_TIGHT =  42;  // half way in, the hip orbiting what is left of the gap
const R_SPIN  =  12;  // centred - equal to the blade's lateral offset from the hip
const R_OUT   =  80;  // the exit edge, opening out again

/* A SEGMENT AT A NAMED ROTATION RATE, in revolutions per second - the number a
   coach says out loud. buildPath wants a span, which is how long the segment
   lasts, so the span is DERIVED from the rate rather than authored beside it:
   revolutions divided by revolutions per second is seconds. Spans are
   normalised downstream, so writing them in real seconds costs nothing and
   earns something - the move's duration becomes the sum of them instead of a
   second opinion about how long it takes. */
const at = (rate, seg) => ({ ...seg, rate, span: seg.sweep / 360 / rate });

/* Duration is the sum of the spans, because those are seconds. Stating it again
   in the move would be the two-copies-of-a-fact fault this file keeps a list of.
   `radius` is the fallback for a segment that omits one, and `speed` is the
   playback rate the page opens at - Martyn: a spin is worth running slower, so
   a skater sees the movement rather than the result. They can still take it to
   full speed; it just is not where the control starts. */
const spinMove = m => {
  const spans = m.path.map(g => g.span);
  const total = spans.reduce((a, b) => a + b, 0);
  let c = 0;
  const bounds = spans.map(g => (c += g) / total);

  /* A KEY THAT MEANS TO SIT ON A SEGMENT BOUNDARY TAKES THE BOUNDARY EXACTLY.
     Where the path changes foot, or starts claiming a position, is a fraction of
     the clock derived from every span in the move. Authoring that fraction by
     hand is copying a number the code already knows - and being one part in a
     million short of it put the blade the pose rides and the blade the tracing
     is drawn from on different frames for exactly one frame, which spin.mjs
     duly reported. So any key within half a frame of a boundary is snapped to
     it, and the boundary stays the only statement of where it is. Keys authored
     deliberately short of one - to hold a value across the whole of a window -
     are further off than that and are left alone. */
  const SNAP = 0.5 / 320;                        // half a frame of buildPath's 320
  const keys = m.keys.map(k => {
    const b = bounds.find(g => Math.abs(g - k.t) < SNAP);
    return b === undefined ? k : { ...k, t: b };
  });

  return { ...m, keys, radius: R_SPIN, speed: 0.5, duration: +total.toFixed(2) };
};


/* A KEY AT A ONE-FOOT TURN'S WINDOW TAKES THE WINDOW'S BOUNDARY EXACTLY — 03/10/2026.
   poseAt reads the blade's yaw, offset, edge and direction out of cuspAt inside the
   window and out of the keys outside it, so a key a frame inside the window would
   hand the skater back to a key's state with the blade half way round. spinMove's
   snap for spinMove's reason: the boundary is a fraction of the clock derived from
   every span, and authoring it by hand is copying a number the code already knows. */
/* BALANCE IN A ONE-FOOT TURN — 04/10/2026, Session 33, targets set by Martyn and held by
   tools/balance.mjs. On the glides either side of the turn the mass is over the blade's
   contact (±2 cm); through the cusp the contact is on the front of the rocker, 4 to 8 cm
   ahead of the blade's middle; on the exit edge, once the check is held, it is back at the
   middle or a little behind it (−3 to 0). TURN_PITCH is the pitch that puts it there:
   ROCKER·sin(1.6°) is 5.9 cm. The skating blade's place under the hip at each key was then
   solved so the mass sits over it: the glides had been 5 to 10 cm behind the contact.
   Three turns and brackets only; the Salchow's three is a jump's entry and keeps its own. */
const TURN_PITCH = 1.6;
const turnMove = m => {
  const spans = m.path.map(g => g.span);
  const total = spans.reduce((a, b) => a + b, 0);
  let c = 0;
  const bounds = spans.map(g => (c += g) / total);
  const SNAP = 0.5 / 320;
  return { ...m, keys: m.keys.map(k => {
    const b = [0, ...bounds].find(g => Math.abs(g - k.t) < SNAP);
    return b === undefined ? k : { ...k, t: b };
  }) };
};


/* THE OTHER THREE LEFT-FOOT THREE TURNS, WRITTEN ONCE — 03/10/2026, Session 26.
   threeTurn is authored by hand and stays that way; these three are the same move
   read off a different entry, so they are derived from one table rather than copied
   three times with the signs changed by hand.

   Three numbers decide everything. `f` is +1 for a forward entry and -1 for a backward
   one: it flips which way along the track is behind the skater, so every t on the
   free foot and the forward lean flips with it, and so does which side of the track
   is the skater's right. `n` is the lobe's sense and puts the skating blade on the
   outside of the circle (15·n). `s` is which way the blade and the hips turn: into
   the lobe for a three, so equal to `n`, and against it for a bracket (added the same
   day, when the function became turnFrom). The hips start at `base` (0 forwards,
   180 backwards) and end at base + 174·s or so, the pair at the window adding to
   2·base + 180·s, which squares the hip across the circle at the apex as threeTurn's
   comment explains. The skating blade runs from 2 cm ahead of the hip to 2.4 cm behind
   it across the window in the direction of travel at each end (6 and 6 until Session
   33, when balance.mjs's targets moved every key: TURN_PITCH, above turnMove). */
const turnFrom = (turn, foot, edge, dir, name, note) => {
  const f = dir === 'F' ? 1 : -1;
  const lobe = (foot === 'L' ? 1 : -1) * (edge === 'O' ? 1 : -1) * f;
  /* `n` puts the blade on the outside of the lobe; `s` is which way it turns, into the
     lobe for a three and against it for a bracket (TURNS.rotatesInto). For a three
     the two are the same number, so every three drawn before brackets is unchanged. */
  const n = lobe, s = turn === 'three' ? lobe : -lobe, base = dir === 'F' ? 0 : 180;
  const exit = { edge: edge === 'O' ? 'I' : 'O', dir: dir === 'F' ? 'B' : 'F' };
  const g = exit.dir === 'F' ? 1 : -1;
  const R = (t, n, z) => P(t, n, z, 0, NEUTRAL);
  const on = (x) => ({ skate: foot, edge: x.edge, dir: x.dir });
  const inn = { edge, dir };
  return turnMove({
    name, note,
    path:[ {kind:'arc', foot, edge, dir, sweep:70, span:195},
           {kind:'arc', foot, edge, dir, sweep:10, span:28, turn},
           {kind:'arc', foot, edge:exit.edge, dir:exit.dir, sweep:70, span:195} ],
    radius:160, duration:4.4,
    keys:[
      {arm:[60,4,18], t:0.00, ph:`Gliding on the ${dir === 'F' ? 'forward' : 'back'} ${edge === 'O' ? 'outside' : 'inside'} edge`,
       hipZ:94, hipYaw:base - 4*s, shYaw:base - 10*s,
       sh:P(-2*f,0,147), L:P(-1*f,15*n,0,-0.5), R:R(-30*f,8*f,14), ...on(inn)},
      {arm:[56,6,18], t:0.30, ph:'Knee bends, the shoulders turning into the circle', hipZ:89, hipYaw:base + 0*s, shYaw:base + 32*s,
       sh:P(2*f,0,140), L:P(5*f,15*n,0,-1), R:R(-14*f,8*f,12), ...on(inn)},
      {arm:[50,8,18], t:0.467, ph:'Rising onto the turn, the free hip held back', hipZ:94, hipYaw:base + 2*s, shYaw:base + 40*s,
       sh:P(0,0,146), L:P(2*f,15*n,0,TURN_PITCH), R:R(-6*f,8*f,16), ...on(inn)},
      {arm:[52,8,18], t:0.533, ph:'Out of the cusp, the check holding', hipZ:92, hipYaw:base + 178*s, shYaw:base + 150*s,
       sh:P(0,0,144), L:P(2.4*g,15*n,0,TURN_PITCH), R:R(-6*g,8*f,16), ...on(exit)},
      {arm:[60,6,18], t:0.75, ph:'The check holding, the free leg extending back', hipZ:91, hipYaw:base + 176*s, shYaw:base + 160*s,
       sh:P(-2*g,0,143), L:P(1.5*g,15*n,0,-0.5), R:R(-34*g,4*g,18), ...on(exit)},
      {arm:[62,6,18], t:1.00, ph:`Running out on the ${exit.dir === 'F' ? 'forward' : 'back'} ${exit.edge === 'O' ? 'outside' : 'inside'} edge`,
       hipZ:94, hipYaw:base + 178*s, shYaw:base + 164*s,
       sh:P(-2*g,0,146), L:P(-1*g,15*n,0,-0.5), R:R(-40*g,6*g,20), ...on(exit)},
    ]});
};

const threeFrom = (...a) => turnFrom('three', ...a);

/* A MOVE SEEN IN A MIRROR — 03/10/2026, Session 26, so the right-foot elements cost one
   line each. Reflecting across the line of travel swaps the feet and the hands, negates
   every n and every angle (hipYaw, shYaw, a foot's yaw and roll), and leaves t, z, pitch,
   the edges and the directions alone. The path's foot swaps too, which flips lobeSense
   and with it the curvature, the cusp's side and the turn's sense, so nothing in the
   rig needs telling. Hands computed from the default carriage are recomputed afterwards
   by the loop at the foot of this file, from the mirrored shoulders. */
const mirrorFoot = q => q && ({ ...q, n: -q.n,
  ...(q.yaw !== undefined ? { yaw: -q.yaw } : {}), ...(q.roll ? { roll: -q.roll } : {}) });
const swapLR = w => w === 'L' ? 'R' : w === 'R' ? 'L' : w;
const mirrorMove = (m, name, note) => ({ ...m, name, note,
  path: m.path.map(g => g.foot ? { ...g, foot: swapLR(g.foot) } : { ...g }),
  keys: m.keys.map(k => ({ ...k, hipYaw: -k.hipYaw, shYaw: -k.shYaw, sh: mirrorFoot(k.sh),
    L: mirrorFoot(k.R), R: mirrorFoot(k.L),
    ...(k.LH ? { RH: mirrorFoot(k.LH) } : {}), ...(k.RH ? { LH: mirrorFoot(k.RH) } : {}),
    skate: swapLR(k.skate) })) });

export const MOVES = {
  waltz: {
    name:'Waltz jump',
    note:'LFO takeoff · half rotation · RBO landing',
    /* span = this segment's share of the clock. Length ÷ span is the implied
       ground speed, so the run-out is split in two to shed speed the way a
       real one does rather than running out at entry pace. */
    path:[ {kind:'arc',  foot:'L', edge:'O', dir:'F', sweep:99,  span:0.32},
           {kind:'line', len:90,                                 span:0.12},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:56,  span:0.20},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:66,  span:0.36} ],
    radius:130, duration:5.6,
    keys:[
      /* THE FREE LEG FOLDED AND UNFOLDED TWICE, AND THAT WAS THE BUG — 30/08/2026.

         Martyn, watching this move: the free boot rotates a couple of times in the
         top-down view towards the end with no visible reason, and the rear view
         draws it in profile pointing at the ice, which the leg position makes
         impossible.

         Both reports are one fault and it is here, not in the renderer. The free
         leg's extension was authored inconsistently — 45%, 82%, 56%, 54%, 82%, 82%
         of reach across the landing and run-out — so between keyframes the leg
         folded and unfolded, the shin swept through HORIZONTAL, and bootDir builds
         a free boot square to the shin. A boot square to a horizontal shin points
         straight at the ice. That is the same failure that made the lunge
         undrawable, written up in docs/model.md, and freefoot.mjs had been red on
         exactly these frames since Session 05.

         The spin was the second symptom of the first. The top-down glyph takes its
         heading from the boot direction's horizontal part, and that part fell to
         0.071 of unit length — so the heading was noise, and the toe appeared to
         whip 170 degrees in eight frames. It is worth being precise about this: the
         rotation is REAL, not a numerical artefact. The boot genuinely pitched from
         toe-forward, through pointing at the ice, to toe-backward. Deriving the
         heading from the boot's lateral axis instead would have held steady at -9
         degrees throughout — and would have been a LIE, hiding a real 180-degree
         flip. The renderer was drawing an impossible pose faithfully.

         Fixed by holding the extension roughly constant, near 90% of reach to the
         ankle, with the free foot's height following the hip. The solver was used
         to find the range and then the numbers were authored by hand, because
         model.md's rule stands: an optimiser minimising a scalar has no idea what a
         landing is, and one of the three failures on record moved a landing foot
         half a metre to minimise exactly this angle.

         The free leg also passes LOW through the takeoff swing now, close to the
         ice, which is both what fixes the swing's own stretch and what a swing
         actually does. Two keys, z 20 to 16 and 26 to 10.

         Result: 85 frames over the 60-degree limit in four stretches, worst 85.9,
         became ZERO, worst 59.1 — and the last six of those were in the AIR, between
         the peak and the touchdown, closed by one number: the descending key's free
         foot from z 52 to 46, which is where a foot reaching for the ice should be
         anyway. That stretch predated this session's edits and had been reported by
         freefoot.mjs all along. The minimum horizontal component of the boot
         direction went from 0.071 to 0.571, so the top-down glyph has a heading to
         draw in every frame. See the freefoot section in docs/state-of-play.md:
         that checker said the fix was the pose or the limit, and it was the pose.

         The landing keys leaned OUT of the landing circle until 29/08/2026: the
         skating foot sat on the inside of the lobe, so the body fell away from the
         edge it was supposedly on. Invisible frame by frame — a lateral offset on
         a leaning skater looks like a lateral offset whichever way it points — and
         it survived a session being read as evidence that the feet were crossed.
         tools/lean.mjs asserts it now, from the lobe and from the edge letter.

         Free-leg side is body-relative, not track-relative. Before the rotation the
         skater faces the way they are going, so the trailing leg is at negative t;
         after it they face backwards, so a leg extended behind them points along the
         direction of travel, at positive t. Getting that backwards is invisible frame
         by frame and obvious on a contact sheet. */
      {arm:[64,10,18], t:0.00, ph:'Set-up on the forward outside edge', hipZ:96, hipYaw:-8, shYaw:-24,
       sh:P(-4,0,148), L:P(-3.7,14,0,-0.5), R:P(-49,-6,27,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[60,-2,24], t:0.14, ph:'Knee bends, edge deepens', hipZ:86, hipYaw:-6, shYaw:-20,
       sh:P(2,0,132), L:P(19,18,0,-1), R:P(-55,-5,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[54,16,18], t:0.25, ph:'Free leg swings through', hipZ:92, hipYaw:-2, shYaw:-10,
       sh:P(0,0,138), L:P(15,16,0,0.5), R:P(0,-4,10,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[50,26,6], t:0.30, ph:'Takeoff: leg and knee drive up', hipZ:100, hipYaw:8, shYaw:2,
       sh:P(-4,0,154), L:P(2,8,2,1.6), R:P(46,0,62,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[36,22,6], t:0.32, ph:'Blade leaves the ice', hipZ:118, hipYaw:26, shYaw:18,
       sh:P(-4,0,170), L:P(-12,6,30,0,NEUTRAL), R:P(40,-2,70,0,NEUTRAL), skate:null},
      {arm:[26,16,10], t:0.36, ph:'Rising, rotation begins', hipZ:126, hipYaw:70, shYaw:56,
       sh:P(-2,0,178), L:P(-26,4,46,0,NEUTRAL), R:P(22,-4,74,0,NEUTRAL), skate:null},
      {arm:[22,14,12], t:0.39, ph:'Peak: legs pass', hipZ:132, hipYaw:110, shYaw:98,
       sh:P(0,0,184), L:P(-4,8,60,0,NEUTRAL), R:P(4,-8,64,0,NEUTRAL), skate:null},
      {arm:[26,14,12], t:0.42, ph:'Descending, reaching for the ice', hipZ:114, hipYaw:158, shYaw:142,
       sh:P(-2,0,166), L:P(59,10,46,0,NEUTRAL), R:P(-2,0,26,0,NEUTRAL), skate:null},
      {arm:[34,14,14], t:0.44, ph:'Front of the blade touches down', hipZ:98, hipYaw:180, shYaw:162,
       sh:P(-4,0,148), L:P(38,12,26,0,NEUTRAL), R:P(-4,11,1,3,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[46,12,16], t:0.48, ph:'Rolling back along the blade', hipZ:96, hipYaw:178, shYaw:158,
       sh:P(-6,0,146), L:P(58,13,25,0,NEUTRAL), R:P(-4,15,0,1), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,18], t:0.55, ph:'Knee absorbs: deepest landing position', hipZ:84, hipYaw:176, shYaw:152,
       sh:P(-8,0,136), L:P(52,15,10,0,NEUTRAL), R:P(-20,17,0,-1), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.70, ph:'Check holds, edge running', hipZ:91, hipYaw:174, shYaw:150,
       sh:P(-8,0,143), L:P(50,15,15,0,NEUTRAL), R:P(-1.8,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[63,9,18], t:0.86, ph:'Rising out of the landing knee', hipZ:96, hipYaw:174, shYaw:154,
       sh:P(-6,0,148), L:P(59,14,26,0,NEUTRAL), R:P(0.7,17,0), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:172, shYaw:158,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(1.5,15,0), skate:'R', edge:'O', dir:'B'},
    ]},

  /* THE FORWARD OUTSIDE THREE TURN — 03/10/2026, Session 26, the rig for lfo-three
     and the entry to the Salchow. Step 2 of the plan Martyn set in Session 24.

     THE TURN IS A PATH SEGMENT AND NOT A POSE. The middle arc carries `turn:'three'`
     and the entry edge, and inside it cuspAt drives the blade: its yaw comes round
     from 0 to 180 on the smoothstep the hips are interpolated on, it grips the whole
     time, and the point where it touches the ice is carried in to the cusp and back
     out. The edge and direction change at the apex. Nothing between the two keys at
     the window's ends is authored, so the tracing, the blade and the edge letter
     cannot disagree. rig-math.js has the construction.

     THE HIPS TURN WITH THE BLADE, and their two ends add to 180 on purpose: 6 going
     in and 174 coming out. That puts the hip square across the circle at the same
     instant as the blade, which is where the edge changes, so the skater is over the
     outside edge until the apex and over the inside edge after it. Turning the hips
     ahead of a gripping blade was the toe-in Session 24's attempt failed on.

     THE BLADE RUNS FROM 6 cm AHEAD OF THE HIP TO 6 cm BEHIND IT across the window,
     and the cusp's own along-track offset is zero at the apex, so the blade is under
     the hip exactly where the edge changes. Either side of the apex the body is then
     over the edge it is on. The forward bend sits the blade 12 cm ahead and the
     backward one 10 cm behind, which is where the shin stays inside the boot.

     THE SHOULDERS LEAD GOING IN AND CHECK COMING OUT: 30 degrees ahead of the hips
     on the bent knee before the turn, 24 behind them on the exit. The rise onto the
     turn and the bend after it are hipZ 88 to 94 and back down to 90.

     The cusp is 0.34 of the window's 28 cm on the circle, about 9.5 cm. Smaller is a
     shorter window, which is a faster turn.

     CHECKED AGAINST COACHES' TEACHING, 04/10/2026 (the guidance, not their words): bend
     on the entry edge, rise to release the turn, bend again after it; the shoulders turn
     into the circle beforehand and check afterwards without over-twisting; and the free
     hip is held back on the entry and through the turn, not allowed to come round early.
     The knee and the shoulders already did that. The hips led by 6 degrees at the rise and
     now lead by 2, the Salchow's numbers (0, 2, 178), so the pelvis comes round through
     the cusp and not before it. Same change in turnFrom, so every three turn and bracket.

     Verified against a coach: NO. How fast the blade comes round is the open part. */
  threeTurn: turnMove({
    name:'Forward outside three turn',
    note:'LFO · the blade turning half a circle on its edge, the cusp in the tracing · LBI',
    path:[ {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:70, span:195},
           {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:10, span:28, turn:'three'},
           {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:70, span:195} ],
    radius:160, duration:4.4,
    keys:[
      {arm:[60,4,18], t:0.00, ph:'Gliding on the forward outside edge', hipZ:94, hipYaw:-4, shYaw:-10,
       sh:P(-2,0,147), L:P(-1,15,0,-0.5), R:P(-30,8,14,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[56,6,18], t:0.30, ph:'Knee bends, the shoulders turning into the circle', hipZ:89, hipYaw:0, shYaw:32,
       sh:P(2,0,140), L:P(5,15,0,-1), R:P(-14,8,12,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[50,8,18], t:0.467, ph:'Rising onto the turn, the free hip held back', hipZ:94, hipYaw:2, shYaw:40,
       sh:P(0,0,146), L:P(2,15,0,TURN_PITCH), R:P(-6,8,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[52,8,18], t:0.533, ph:'Out of the cusp, checked on the back inside edge', hipZ:92, hipYaw:178, shYaw:150,
       sh:P(0,0,144), L:P(-2.4,15,0,TURN_PITCH), R:P(6,8,16,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[60,6,18], t:0.75, ph:'The check holding, the free leg extending back', hipZ:91, hipYaw:176, shYaw:160,
       sh:P(-2,0,143), L:P(-1.5,15,0,-0.5), R:P(34,-4,18,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[62,6,18], t:1.00, ph:'Running out on the back inside edge', hipZ:94, hipYaw:178, shYaw:164,
       sh:P(-2,0,146), L:P(1,15,0,-0.5), R:P(40,-6,20,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
    ]}),

  lfiThree: threeFrom('L','I','F', 'Forward inside three turn',
    'LFI · the blade turning half a circle on its edge, the cusp in the tracing · LBO'),
  lboThree: threeFrom('L','O','B', 'Back outside three turn',
    'LBO · the blade turning half a circle on its edge, the cusp in the tracing · LFI'),
  lbiThree: threeFrom('L','I','B', 'Back inside three turn',
    'LBI · the blade turning half a circle on its edge, the cusp in the tracing · LFO'),

  /* THE BRACKETS — 03/10/2026, Session 26, Martyn: try them. The three turn's
     construction with the rotation reversed: a bracket turns AGAINST its lobe, so
     cuspAt's sense is the lobe's negative and the cusp points out of the circle
     (TURNS.bracket.rotatesInto is false). The first time that branch of cuspAt has met
     a real move, so it was looked at as well as checked.

     The lean holds through the apex for a reason worth writing down, because it is
     not the three turn's. With the cusp pointing outwards the blade moves AWAY from the
     hip, out to about 25 cm, so one frame either side of the apex the body is already
     several centimetres over the edge it is on, more than the cusp's along-track
     offset can undo. Verified against a coach: NO. */
  lfoBracket: turnFrom('bracket','L','O','F', 'Forward outside bracket',
    'LFO · the blade turning half a circle against the curve, the cusp pointing out · LBI'),
  lfiBracket: turnFrom('bracket','L','I','F', 'Forward inside bracket',
    'LFI · the blade turning half a circle against the curve, the cusp pointing out · LBO'),
  lboBracket: turnFrom('bracket','L','O','B', 'Back outside bracket',
    'LBO · the blade turning half a circle against the curve, the cusp pointing out · LFI'),
  lbiBracket: turnFrom('bracket','L','I','B', 'Back inside bracket',
    'LBI · the blade turning half a circle against the curve, the cusp pointing out · LFO'),

  /* THE SALCHOW — 03/10/2026, Martyn: he is working towards it, so it is the first
     single jump to get a rig after the waltz.

     WHAT IT IS, in the model's own terms: takeoff LBI, no pick, one rotation, landing
     RBO (skating.js JUMPS). Both edges have the same lobe sense, so the tracing is one
     long curve broken only by the flight.

     IT STARTS ON THE FORWARD OUTSIDE EDGE AND GOES IN THROUGH THE THREE TURN, which
     is the usual way in. The first build, on 03/10/2026, drew it this way and failed
     four checkers, because the rig could not turn a gripping blade; it began checked
     on the back inside edge instead. Session 26 gave the rig the cusp (cuspAt in
     rig-math.js, and threeTurn above), and the entry went back in as it was first
     written: an LFO arc, a turn segment and three keys. The keys either side of the
     window are threeTurn's, with the hips at 2 and 178 so that they add to 180 and
     square up across the circle with the blade. Prepending them moved every later
     key from t to (0.288 + t) / 1.288, which is the same instant of the jump on a
     clock 1.6 seconds longer.

     THE ROTATION IS COUNTED IN hipYaw AND NEVER WRAPPED. Backwards is 180. The swing
     of the free leg turns the hips about 25 degrees on the ice before the blade
     leaves (the shoulders lead further), which is as far as the skating hip can turn
     against a blade still gripping its line; the air does the remaining 335 to 540,
     which faces backwards again on the landing. 540 and not 180, because poseAt
     interpolates the number: a key at 180 after one at 400 would unwind the skater
     through the air the wrong way.

     THE FREE LEG IS AUTHORED IN THE TRACK FRAME, like every foot in this file, so the
     side it is on depends on which way the skater faces. On the back inside edge the
     right leg extended behind is at +t, swung out to the skater's right it is at -n,
     and through the front it is at -t. The air keys were placed body-relative
     (forwards, to the right), turned into t and n through anterior() and lateral() at
     each key's hipYaw, and written here as numbers, so the file stays authored.

     THE LANDING IS THE WALTZ JUMP'S, 360 degrees further round: the same RBO edge, the
     same toe-first touchdown, the same free leg held back and neutral (Martyn,
     20/09/2026: a landing free foot is pushed back and neutral, not pointed).

     CHECKED AGAINST COACHES' TEACHING, 04/10/2026 (the guidance, not their words): the
     free leg swings wide and well inside the circle, low and close to the ice, while the
     body drops into the circle on a bent knee; then the skater comes up to be straight
     at the moment of takeoff. The keys already did that: the leg swings 42 cm out to the
     inside at a hip of 84, comes through in front as the hip rises to 92, and the takeoff
     is at 102. Nothing changed.

     Verified against a coach: NO. */
  salchow: turnMove({
    name:'Salchow',
    note:'LBI takeoff out of a three turn, no pick · one rotation · RBO landing',
    path:[ {kind:'arc',  foot:'L', edge:'O', dir:'F', sweep:60,  span:0.24},
           {kind:'arc',  foot:'L', edge:'O', dir:'F', sweep:12,  span:0.048, turn:'three'},
           {kind:'arc',  foot:'L', edge:'I', dir:'B', sweep:120, span:0.48},
           {kind:'line', len:70,                                 span:0.10},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:56,  span:0.18},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:66,  span:0.24} ],
    radius:130, duration:7.0,
    keys:[
      {arm:[60,4,18], t:0, ph:'Gliding on the forward outside edge', hipZ:94, hipYaw:-4, shYaw:-10,
       sh:P(-2,0,147), L:P(4,15,0,-0.5), R:P(-30,8,14,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[56,6,18], t:0.0932, ph:'Knee bends, the shoulders turning into the circle', hipZ:88, hipYaw:0, shYaw:30,
       sh:P(2,0,139), L:P(12,15,0,-1), R:P(-14,8,12,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[50,8,18], t:0.1863, ph:'The three turn: rising, the hips coming round with the blade', hipZ:94, hipYaw:2, shYaw:36,
       sh:P(0,0,146), L:P(6,15,0,0.5), R:P(-6,8,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[60,6,18], t:0.2236, ph:'Out of the three turn, checked on the back inside edge', hipZ:92, hipYaw:178, shYaw:162,
       sh:P(-2,0,144), L:P(-6,15,0,-0.5), R:P(6,8,16,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[64,8,18], t:0.3634, ph:'Free leg held back, the edge running', hipZ:92, hipYaw:176, shYaw:160,
       sh:P(-4,0,142), L:P(-0.1,15,0,-0.5), R:P(50,-8,22,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[60,10,20], t:0.472, ph:'Skating knee bends, the free leg reaching back', hipZ:82, hipYaw:174, shYaw:158,
       sh:P(-6,0,132), L:P(-20,16,0,-1), R:P(54,-10,14,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[52,14,20], t:0.5342, ph:'The free leg swings out wide', hipZ:84, hipYaw:186, shYaw:200,
       sh:P(-6,0,134), L:P(-18,16,0,-1), R:P(10,-42,16,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[46,18,16], t:0.573, ph:'Free leg through in front, the shoulders leading', hipZ:92, hipYaw:196, shYaw:236,
       sh:P(-2,0,142), L:P(-10,14,0,1), R:P(-36,-14,34,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[40,20,8], t:0.5924, ph:'Takeoff: the skating knee drives up', hipZ:102, hipYaw:202, shYaw:256,
       sh:P(-2,0,154), L:P(-4,8,2,1.6), R:P(-34,-4,52,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[30,16,10], t:0.604, ph:'Blade leaves the ice', hipZ:118, hipYaw:250, shYaw:290,
       sh:P(-2,0,170), L:P(-6,-12,32,0,NEUTRAL), R:P(-10,26,56,0,NEUTRAL), skate:null},
      {arm:[22,14,12], t:0.6312, ph:'Peak: arms in, legs together', hipZ:130, hipYaw:390, shYaw:396,
       sh:P(0,0,182), L:P(3,-5,64,0,NEUTRAL), R:P(7,5,62,0,NEUTRAL), skate:null},
      {arm:[26,14,12], t:0.6545, ph:'Descending, the landing leg reaching for the ice', hipZ:112, hipYaw:500, shYaw:492,
       sh:P(-2,0,164), L:P(16,24,46,0,NEUTRAL), R:P(4,-7,28,0,NEUTRAL), skate:null},
      {arm:[34,14,14], t:0.6739, ph:'Toe of the blade touches down', hipZ:98, hipYaw:540, shYaw:522,
       sh:P(-4,0,148), L:P(38,12,26,0,NEUTRAL), R:P(-4,11,1,3,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[46,12,16], t:0.7127, ph:'Rolling back along the blade', hipZ:96, hipYaw:538, shYaw:518,
       sh:P(-6,0,146), L:P(58,13,25,0,NEUTRAL), R:P(-4,15,0,1), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,18], t:0.7671, ph:'Knee absorbs: deepest landing position', hipZ:84, hipYaw:536, shYaw:512,
       sh:P(-10,0,136), L:P(52,15,10,0,NEUTRAL), R:P(-15,17,0,-1), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.8758, ph:'Check holds, edge running', hipZ:91, hipYaw:534, shYaw:510,
       sh:P(-8,0,143), L:P(50,15,15,0,NEUTRAL), R:P(-1.8,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.0, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:532, shYaw:518,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(1.5,15,0), skate:'R', edge:'O', dir:'B'},
    ]}),

  spiral: {
    name:'Spiral',
    note:'held position · free leg at or above hip height',
    path:[{kind:'arc', foot:'L', edge:'O', dir:'F', sweep:150}],
    radius:150, duration:5,
    keys:[
      /* THE FREE LEG WAS BENT, ON A POSITION WHOSE WHOLE LINE IS THE EXTENSION —
         corrected 30/08/2026. Martyn, looking at the live page: "the free leg is
         supposed to be extended not bent sharply at the knee." He is right, and it
         had been like that since Session 01.

         Held at 69% of reach with the drawn knee 24 cm BELOW the hip. Nothing
         caught it: reach.mjs asserts a leg is not too LONG and nothing asserted a
         leg claiming an extended line is not too short. It is the same fault the
         extended edge had in Session 04, found the same way — by measuring a
         different position and noticing this one on the way past.

         It could not be fixed before today. Straightening the leg pushes the free
         boot down: at the old fixed ankle of 10 degrees the same straight leg reads
         61 degrees against freefoot.mjs's limit of 60, so the pose was bent because
         the alternative was illegal. With the ankle authored per foot it reads 49.
         That is what the ANKLE_MAX work was for.

         Now 94% of reach with the knee 6 cm below the hip — a long line with a soft
         knee rather than a locked one, which is as straight as the pose gets without
         failing reach.mjs. The free foot stays at the height it always had, about
         24 cm above the hip: the leg was lengthened, not lifted.

         All three keys were solved together against every interpolated frame, not
         authored one at a time. Two hand-written attempts each produced a stretch
         over the limit — one at f=0.24 and one at f=0.00 — which is the fault
         Session 12 recorded on the waltz jump: a free leg whose extension changes
         between keys sweeps its shin through horizontal, and a boot square to a
         horizontal shin points at the ice. Worst frame now 50 degrees against a
         limit of 60.

         The foot is authored near the boot's limit throughout, which is a CLAIM and
         not a measurement: that a skater in a spiral points the free foot as hard as
         the boot allows, from the entry onwards. It is what a coach says out loud,
         and it is the first thing to put to one. */
      {t:0.00, ph:'Entering the position', hipZ:95, hipYaw:-4, shYaw:-12,
       sh:P(16,0,139), L:P(0,10,0), R:P(-76,-2,76,0,30), skate:'L', edge:'O', dir:'F'},
      {t:0.34, ph:'Free leg rising, chest lifts', hipZ:94, hipYaw:-6, shYaw:-14,
       sh:P(28,0,130), L:P(0,13,0), R:P(-86,-2,116,0,30), skate:'L', edge:'O', dir:'F'},
      {t:1.00, ph:'Held: hips square, leg above the hip', hipZ:94, hipYaw:-6, shYaw:-14,
       sh:P(34,0,124), L:P(0,14,0), R:P(-93,-2,118,0,25), skate:'L', edge:'O', dir:'F'},
    ]},

  /* BIS Skills 1, exercise 2: a backward outside "extended position", held for a
     minimum of a third of a circle or three seconds. The sweep is 180 degrees and
     the position is complete a third of the way through, so the held part is the
     120 degrees the syllabus asks for and the duration leaves 3.5 seconds of it.

     It is the same shape as the waltz jump's run-out, which is not a coincidence:
     both are a checked back outside edge with the free leg extended behind the
     body. Note again that "behind the body" is POSITIVE t here — the skater is
     travelling backwards, so behind them is the way they are going.

     Authored on the right foot deliberately. Every other held position in this
     file skates on the left, so lean.mjs had no right-footed forward-or-backward
     pair to check the body route against; RBO gives it one.

     The held key sits on the STRAIGHT branch of twoBone on purpose. A free leg
     reaching back and down with a bent knee puts the shin near horizontal, and
     bootDir builds a free boot square to the shin — so the boot comes out
     pointing at the ice and freefoot.mjs calls it a pointe. Straighten the leg
     and the shin lies along the leg instead and the boot behaves. The two
     branches are only a few centimetres apart: at hipZ 90 the free foot at
     (60,12,28) reads -54 degrees and at (60,12,32) it reads -68. That
     sensitivity is real and lives at full extension, which is exactly where a
     held position wants to sit.

     There are two knees here and they are not the same knee. bootDir solves from
     the blade; the renderer draws from the ankle, which is 15 cm nearer the hip.
     So a leg past full reach to the blade still DRAWS bent, and the first version
     of this pose passed every checker while showing a visibly folded free leg on
     a position whose whole name is "extended". Held at 98% of reach to the ankle
     the knee is 9 cm off the line, which is a soft knee rather than a locked one,
     and that is as straight as the pose gets without failing reach.mjs. */
  extendedEdge: {
    name:'Extended edge',
    note:'held position · sustained back outside edge, free leg extended and turned out',
    path:[{kind:'arc', foot:'R', edge:'O', dir:'B', sweep:180}],
    radius:165, duration:5.2,
    keys:[
      {t:0.00, ph:'Stepping onto the back outside edge', hipZ:96, hipYaw:178, shYaw:166,
       sh:P(-6,0,148), L:P(36,10,20), R:P(-14,12,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:0.33, ph:'Free leg extends, check holds', hipZ:92, hipYaw:176, shYaw:159,
       sh:P(-9,0,142), L:P(56,12,19), R:P(-18,16,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:1.00, ph:'Held: extended, free foot turned out', hipZ:90, hipYaw:175, shYaw:157,
       sh:P(-11,0,140), L:P(68,12,18), R:P(-18,16,0,-0.5), skate:'R', edge:'O', dir:'B'},
    ]},

  /* THE FIRST POSE IN THIS FILE WITH TWO BLADES ON THE ICE — 30/08/2026.

     British Ice Skating's Skills 1 slalom is written as pairs: (1)RFI & LFO
     two-foot power change of edge, (2)RFO & LFI. This is the state either side
     of one of those changes, held rather than changed, and it is what closes the
     exercise's oldest gap.

     WHY THE POSITION AND NOT THE CHANGE. A power change of edge passes through a
     flat, where the lobe has no centre and lean.mjs's TRACK route has nothing to
     assert against — sign(n) has to pass through zero and there is no right
     answer at the crossing. Authoring the change would have meant giving that
     checker an exemption on its first day of holding two blades, which is the one
     cost this session set out not to pay. Changes of edge are the edge diagram's
     job in this repository and always have been; the rig draws bodies. What the
     flat needs is written up in docs/model.md, next to the slip step, because
     they are the same missing thing seen twice.

     R IS THE REFERENCE BLADE and L is declared with onIce alone. L's edge is
     never written down: both blades are on one circle, so they share a lobeSense,
     and secondFoot derives LFO from RFI and a forward direction. Writing "O" here
     would be the second source of truth style.md bans, and it would let somebody
     author RFI & LFI — a pair that cannot exist.

     Both pitches are a real half-degree rather than zero. An authored zero makes
     the boot's up-axis subtraction a no-op and hid the end-on roll collapse for
     four sessions; the spiral and the teapot are the poses that could not show
     it. A new pose should never be the one that hides the next one. */
  twoFoot: {
    name:'Two-foot edge',
    note:'both blades on the ice · RFI and LFO, one outside and one inside, on one lobe',
    path:[{kind:'arc', foot:'R', edge:'I', dir:'F', sweep:120}],
    radius:200, duration:4.4,
    keys:[
      /* Both feet sit to the same side of the hip, which is the whole of the
         lean: at hipZ 96 a mean offset of 15 cm is about 9 degrees, which is a
         shallow lobe and what a slalom actually is. The left foot is the nearer
         one to the hip because n is measured to the skater's RIGHT.

         HIP HEIGHT WAS CHOSEN BY MEASUREMENT, not by eye. The first draft sat at
         hipZ 92 and shin.mjs failed the LEFT leg at 31 and 32 degrees against the
         boot's 28 — caught on the second blade, on the first run after that
         checker was generalised, which is the whole argument for generalising it
         rather than leaving it reading the reference foot. Sweeping hip height
         against shin lean shows the angle is almost entirely a function of leg
         extension and barely of the lateral offset: 28-29 degrees at hipZ 92,
         25 at 94, 21 at 96. Raising the hip fixes it; moving the feet does not. */
      {t:0.00, ph:'Stepping onto two feet', hipZ:97, hipYaw:0, shYaw:-4,
       sh:P(-2,0,149), L:ON(-3,5,0,-0.5), R:P(3,17,0,-0.5),
       skate:'R', edge:'I', dir:'F'},
      {t:0.35, ph:'Both blades settle onto the lobe', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(0,0,148), L:ON(-3,8,0,-0.5), R:P(3,20,0,-0.5),
       skate:'R', edge:'I', dir:'F'},
      {t:1.00, ph:'Held: the right blade inside, the left outside', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(1,0,148), L:ON(-3,9,0,-0.5), R:P(3,21,0,-0.5),
       skate:'R', edge:'I', dir:'F'},
    ]},

  teapot: {
    name:'Teapot',
    note:'held position · low glide, free leg forward',
    path:[{kind:'arc', foot:'L', edge:'I', dir:'F', sweep:120}],
    radius:170, duration:4.4,
    keys:[
      {t:0.00, ph:'Standing glide', hipZ:96, hipYaw:0, shYaw:-6,
       sh:P(-2,0,146), L:P(0,-8,0), R:P(-27,5,19), skate:'L', edge:'I', dir:'F'},
      {t:0.42, ph:'Sinking, free leg reaches forward', hipZ:62, hipYaw:0, shYaw:-4,
       sh:P(8,0,110), L:P(30,-6,0), R:P(46,8,16,0,POINTED), skate:'L', edge:'I', dir:'F'},
      {t:1.00, ph:'Held low, free leg extended', hipZ:40, hipYaw:0, shYaw:-2,
       sh:P(16,0,88), L:P(29,-5,0), R:P(80,8,10,0,POINTED), skate:'L', edge:'I', dir:'F'},
    ]},

  /* AN UPRIGHT SPIN, LBI, anticlockwise.

     lobeSense(L,I,B) = +1, anticlockwise, which is the direction an
     anticlockwise skater actually spins - so the model picks the foot and the
     edge without being told, here and in every spin below.

     REBUILT 19/09/2026 WITH AN ENTRANCE AND AN EXIT. Martyn: a spin needs an
     entrance and an exit, and bringing the arms in increases the speed. Both
     were missing. The move began at "Rotation established" and ended "Held",
     turning at one rate throughout, which drew the RESULT of a spin and never
     the doing of it - and the arms were wide and motionless while the thing
     they most obviously control is how fast it goes.

     The rate is now authored per phase and the wind-up is a real acceleration
     the animation plays: 1.8 revolutions per second when the position is first
     held, 2.9 by the end of the wind-up. The ISU lists "clear increase of speed"
     as a Level feature, and one of the six that can earn Level 4, so this is the
     element's own vocabulary rather than a flourish. tools/gather.mjs asserts
     that the rate and the gather agree. */
  uprightSpin: spinMove({
    name:'Upright spin',
    note:'back inside edge: entered, centred, wound up and stepped out',
    path:[
      at(0.70, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:180, radius:R_WIDE}),
      at(1.30, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:250, radius:R_TIGHT}),
      at(1.80, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:400, radius:R_SPIN, position:'upright'}),
      at(2.10, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:400, radius:R_SPIN, position:'upright'}),
      at(2.90, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:560, radius:R_SPIN, windup:true}),
      at(1.40, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:150, radius:R_OUT}),
    ],
    keys:[
      /* The blade's lateral offset comes down 16 -> 12 while the path radius
         comes down 110 -> 12. They meet at the third key, and that meeting IS
         the spin starting: from there the hip is on the axis and stops
         travelling. Before it the hip orbits, which is what an entrance is. */
      {arm:[70,10,16], t:0.0000, ph:'Back inside edge, still travelling', hipZ:96, hipYaw:180, shYaw:166,
       sh:P(0,0,146), L:P(0,16,0,1.6), R:P(-30,24,20), skate:'L', edge:'I', dir:'B'},
      {arm:[64,9,17], t:0.2200, ph:'The circle tightening, rotation gathering', hipZ:96, hipYaw:180, shYaw:170,
       sh:P(0,0,146), L:P(-4.3,15,0,1.9), R:P(-26,22,20), skate:'L', edge:'I', dir:'B'},
      {arm:[54,8,18], t:0.3800, ph:'Centred - the hip stops travelling', hipZ:96, hipYaw:180, shYaw:174,
       sh:P(0,0,146), L:P(-3.9,12,0,2.2), R:P(-22,18,18), skate:'L', edge:'I', dir:'B'},
      {arm:[44,6,18], t:0.5800, ph:'Upright, free foot drawing in', hipZ:97, hipYaw:180, shYaw:178,
       sh:P(0,0,147), L:P(-3.0,12,0,2.2), R:P(-16,14,16), skate:'L', edge:'I', dir:'B'},
      {arm:[34,4,18], t:0.7400, ph:'Held - spinning upright', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(0,0,148), L:P(-2.3,12,0,2.2), R:P(-12,10,15), skate:'L', edge:'I', dir:'B'},
      {arm:[18,2,12], t:0.9100, ph:'Wind-up - everything to the axis, and it quickens', hipZ:99, hipYaw:180, shYaw:180,
       sh:P(0,0,149), L:P(-1.5,12,0,2.2), R:P(-8,6,14), skate:'L', edge:'I', dir:'B'},
      {arm:[52,8,18], t:1.0000, ph:'Exit - opening out and stepping off', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(0,0,146), L:P(-3.9,15,0,1.6), R:P(-18,20,20), skate:'L', edge:'I', dir:'B'},
    ]}),

  /* THE BACK SPIN — 04/10/2026, Session 33. The upright spin's machinery on the other
     foot: a right back outside edge, which turns the same way round as the upright spin's
     left back inside (both lobeSense +1, anticlockwise), so the same arcs and the same
     rates carry it. The free leg is crossed over the skating leg, in front of its shin,
     and the exit is the back outside edge it spun on, the free leg extending behind.

     WHICH FOOT IS THIS GUIDE'S CHOICE. None of the documents behind the page names the
     foot or the edge it turns on (the page says so); what they agree on is the exit, a
     back outside edge. For a skater who turns anticlockwise that is the right foot, the
     foot every jump here lands on, and the spin is drawn on it throughout.

     CHECKED 04/10/2026, Session 34, against three coaches' public teaching pages (base
     guidance only): all three put an anticlockwise skater's back spin on the right foot,
     on a back outside edge, leaving on that edge with the free leg extended behind. The
     choice stands as drawn.

     The blade is pitched 2.2° through the centred phases, 8 cm forward of its middle,
     inside Martyn's spin target (+6 to +10), and the shoulders sit 5 cm back toward the
     heels so the mass is over that contact (the upright spin's numbers read 3 to 4 cm
     toward the toe of it); balance.mjs holds both.

     Verified against a coach: the foot, the edge and the exit, from public teaching pages
     (above). Not the pose. */
  backSpin: spinMove({
    name:'Back spin',
    note:'right back outside edge: entered, centred with the free leg crossed, wound up and stepped out',
    path:[
      at(0.70, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:180, radius:R_WIDE}),
      at(1.30, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:250, radius:R_TIGHT}),
      at(1.80, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:400, radius:R_SPIN, position:'upright'}),
      at(2.10, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:400, radius:R_SPIN, position:'upright'}),
      at(2.90, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:560, radius:R_SPIN, windup:true}),
      at(1.40, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:150, radius:R_OUT}),
    ],
    keys:[
      {arm:[70,10,16], t:0.0000, ph:'Back outside edge, still travelling, the free leg out', hipZ:96, hipYaw:180, shYaw:166,
       sh:P(7,0,146), R:P(0,16,0,1.6), L:P(-28,-10,22), skate:'R', edge:'O', dir:'B'},
      {arm:[64,9,17], t:0.2200, ph:'The circle tightening, the free leg coming round', hipZ:96, hipYaw:180, shYaw:170,
       sh:P(7,0,146), R:P(0,15,0,1.9), L:P(-24,0,24), skate:'R', edge:'O', dir:'B'},
      {arm:[54,8,18], t:0.3800, ph:'Centred - the hip stops travelling', hipZ:96, hipYaw:180, shYaw:174,
       sh:P(5,0,146), R:P(0,12,0,2.2), L:P(-14,10,30), skate:'R', edge:'O', dir:'B'},
      {arm:[44,6,18], t:0.5800, ph:'The free leg crossed over the skating leg', hipZ:97, hipYaw:180, shYaw:178,
       sh:P(5,0,147), R:P(0,12,0,2.2), L:P(-8,15,32), skate:'R', edge:'O', dir:'B'},
      {arm:[34,4,18], t:0.7400, ph:'Held - spinning, the legs crossed', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(5,0,148), R:P(0,12,0,2.2), L:P(-6,16,30), skate:'R', edge:'O', dir:'B'},
      {arm:[18,2,12], t:0.9100, ph:'Wind-up - everything to the axis, and it quickens', hipZ:99, hipYaw:180, shYaw:180,
       sh:P(5,0,149), R:P(0,12,0,2.2), L:P(-5,15,26), skate:'R', edge:'O', dir:'B'},
      {arm:[60,8,18], t:1.0000, ph:'Exit - the free leg extending behind on the back outside edge', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(3,0,146), R:P(0,15,0,1.6), L:P(28,-4,22), skate:'R', edge:'O', dir:'B'},
    ]}),

  /* A TWO-FOOT SPIN — 04/10/2026, Session 32. Both blades on the ice, turning on the
     spot, the feet a hip's width apart (Ice Skating Australia: one revolution, then
     two, then three; Learn to Skate USA up to four at its fourth level). Three here.

     The upright spin's path and its centring with a second blade: the right is held
     diametrically across the axis from the left, so while the left's lateral offset
     comes down to R_SPIN the right's goes to -R_SPIN and the hip, between them, is on
     the axis. drawn.mjs had it as not yet authored; nothing new was needed.

     CLAIMED AS UPRIGHT, and that is a reading rather than a quotation: the ISU defines
     its basic positions for one-foot spins, by the skating leg, and both legs here are
     extended. spin.mjs holds it to that definition.

     WHERE IT DIFFERS FROM AUSTRALIA'S: their spin finishes on a back outside edge on
     the right foot. That hands the reference over inside the spin, and spin.mjs reads
     any change of foot as a change-foot spin needing three revolutions either side, so
     this one opens out on two feet and lifts the right. Verified against a coach: NO. */
  twoFootSpin: spinMove({
    name:'Two-foot spin',
    note:'both blades on the ice, a hip\'s width apart: entered, centred, three turns with a wind-up, opened out',
    path:[
      at(0.70, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:180, radius:R_WIDE}),
      at(1.30, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:250, radius:R_TIGHT}),
      at(1.40, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:720, radius:R_SPIN, position:'upright'}),
      at(2.00, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:360, radius:R_SPIN, windup:true}),
      at(1.40, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:150, radius:R_OUT}),
    ],
    keys:[
      {arm:[70,10,16], t:0.0000, ph:'Gliding backwards on two feet, the circle curving in', hipZ:95, hipYaw:180, shYaw:166,
       sh:P(0,0,146), L:P(0,16,0,1.6), R:ON(0,-8,0,0.5), skate:'L', edge:null, dir:'B'},
      {arm:[60,9,17], t:0.2400, ph:'The circle tightening, the arms gathering the rotation', hipZ:95, hipYaw:180, shYaw:172,
       sh:P(0,0,146), L:P(0,14,0,1.9), R:ON(0,-10,0,0.5), skate:'L', edge:null, dir:'B'},
      {arm:[44,6,18], t:0.3400, ph:'Centred: both blades turning on the spot', hipZ:96, hipYaw:180, shYaw:178,
       sh:P(0,0,147), L:P(0,12,0,2.2), R:ON(0,-12,0,0.5), skate:'L', edge:null, dir:'B'},
      {arm:[40,6,18], t:0.7703, ph:'Held: spinning on two feet', hipZ:97, hipYaw:180, shYaw:180,
       sh:P(0,0,148), L:P(0,12,0,2.2), R:ON(0,-12,0,0.5), skate:'L', edge:null, dir:'B'},
      {arm:[16,2,12], t:0.8600, ph:'Wind-up: the arms drawn in, and it quickens', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(0,0,149), L:P(0,12,0,2.2), R:ON(0,-12,0,0.5), skate:'L', edge:null, dir:'B'},
      {arm:[18,2,12], t:0.9142, ph:'The last turn, still centred', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(0,0,149), L:P(0,12,0,2.2), R:ON(0,-12,0,0.5), skate:'L', edge:null, dir:'B'},
      {arm:[56,8,18], t:0.9600, ph:'Opening out, the hip travelling again', hipZ:95, hipYaw:180, shYaw:176,
       sh:P(0,0,146), L:P(0,15,0,1.6), R:ON(0,-7,0,0.5), skate:'L', edge:'I', dir:'B'},
      {arm:[60,8,18], t:1.0000, ph:'The right foot lifting, gliding out', hipZ:95, hipYaw:180, shYaw:176,
       sh:P(0,0,146), L:P(0,16,0,1.6), R:P(-22,-14,14), skate:'L', edge:'I', dir:'B'},
    ]}),

  /* A SIT SPIN. The teapot, spun: same fold, same free leg forward, on a
     rotating path instead of a glide. hipYaw is 180 so the front of the body is
     at NEGATIVE t, which is why the free leg's t is the teapot's negated.

     THE FOLD GETS ITS OWN SEGMENT, claiming no position. A skater on the way
     down is neither upright nor sitting, and the pose interpolates, so a sit
     asserted from the first frame of the fold would be asserting a position the
     skater is still arriving at. The handbook does the same thing: revolutions
     in a non-basic position count towards the total and not towards the two a
     position needs.

     AND THE RISE AT THE END IS NOT A SECOND POSITION. It is the final wind-up,
     which the ISU exempts by name - otherwise every sit spin that stood up to
     finish would be a combination. That is what `windup` marks. */
  sitSpin: spinMove({
    name:'Sit spin',
    note:'back inside edge: entered, folded to parallel, wound up and stepped out',
    path:[
      at(0.70, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:180, radius:R_WIDE}),
      at(1.20, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:250, radius:R_TIGHT}),
      at(1.55, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:250, radius:R_SPIN}),
      at(1.90, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:400, radius:R_SPIN, position:'sit'}),
      at(2.40, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:400, radius:R_SPIN, position:'sit'}),
      at(3.10, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:380, radius:R_SPIN, windup:true}),
      at(1.30, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:150, radius:R_OUT}),
    ],
    keys:[
      {arm:[68,10,16], t:0.0000, ph:'Back inside edge, still travelling', hipZ:96, hipYaw:180, shYaw:168,
       sh:P(-4,0,146), L:P(-6,16,0,1.6), R:P(-34,22,20), skate:'L', edge:'I', dir:'B'},
      {arm:[62,10,18], t:0.2071, ph:'The circle tightening, beginning to sink', hipZ:88, hipYaw:180, shYaw:172,
       sh:P(-10,0,138), L:P(-24,14,0,1.9), R:P(-52,12,20), skate:'L', edge:'I', dir:'B'},
      {arm:[56,12,16], t:0.3748, ph:'Centred, and folding down', hipZ:66, hipYaw:180, shYaw:176,
       sh:P(-14,0,116), L:P(-38,12,0,2.2), R:P(-68,0,18,0,POINTED), skate:'L', edge:'I', dir:'B'},
      {arm:[48,12,14], t:0.5040, ph:'Thigh reaches parallel - the sit', hipZ:44, hipYaw:180, shYaw:178,
       sh:P(-16,0,92), L:P(-38,12,0,2.2), R:P(-76,-6,12,0,POINTED), skate:'L', edge:'I', dir:'B'},
      {arm:[42,12,13], t:0.6742, ph:'Held - thigh parallel, free leg forward', hipZ:41, hipYaw:180, shYaw:180,
       sh:P(-16,0,89), L:P(-40,12,0,2.2), R:P(-80,-6,10,0,POINTED), skate:'L', edge:'I', dir:'B'},
      {arm:[34,10,12], t:0.8084, ph:'Still sitting, and gathering in', hipZ:40, hipYaw:180, shYaw:180,
       sh:P(-16,0,88), L:P(-40,12,0,2.2), R:P(-78,-6,10,0,POINTED), skate:'L', edge:'I', dir:'B'},
      {arm:[18,2,12], t:0.9071, ph:'Wind-up - rising to the axis, and it quickens', hipZ:82, hipYaw:180, shYaw:180,
       sh:P(-10,0,132), L:P(-28,12,0,2.2), R:P(-46,10,16), skate:'L', edge:'I', dir:'B'},
      {arm:[52,8,18], t:1.0000, ph:'Exit - standing up and out', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(-2,0,146), L:P(-6,15,0,1.6), R:P(-24,18,26), skate:'L', edge:'I', dir:'B'},
    ]}),

  /* A CAMEL SPIN. The spiral, spun. Same claim as the sit: the position already
     exists in this file and the only thing a spin adds is the path.

     THE SLOWEST OF THE THREE, AND THAT IS THE POINT. A camel holds the free leg
     and the shoulders a long way off the axis, so it turns at 1.6 revolutions
     per second where an upright holds 2.1, settles SLOWER still as the chest
     drops and the leg reaches further back, and the rise out of it into the
     wind-up is the largest speed change in the file, 1.55 to 2.6, because
     nowhere else does so much mass come in at once. If one move in the guide
     shows a skater why the arms matter, it is this one. */
  /* A CAMEL SPIN. The spiral, spun.

     THE SLOWEST OF THE THREE, AND THAT IS THE POINT. A camel holds the free leg
     and the shoulders a long way off the axis, so it turns at 1.6 revolutions
     per second where an upright holds 2.1, settles slower still as the chest
     drops, and the wind-up is where the arms come in and it picks up again.

     THE FREE LEG DOES NOT MOVE, AND THAT IS A MODEL LIMIT, NOT A CHOICE.
     Measured 20/09/2026 across the whole plausible range - see docs/model.md,
     *What the rig cannot hold*. bootDir builds a free boot square to the shin,
     and for a leg reaching BACKWARDS at mid height that boot points at the ice:
     -67 to -85 degrees everywhere in z 30-70, t 0-60, at every reach, so it is
     not a fold that a longer leg would fix. The way round it - lifting the leg
     near the body and sweeping it back high - crosses the free foot over the hip
     at height, where the top view is looking straight into the boot's opening
     and the glyph swings 100 degrees between neighbouring poses. Blocked going
     up, blocked coming down.

     So this rig starts and ends with the leg already at camel height, and what
     the entrance and the wind-up draw is the path tightening and the arms
     gathering, which is the rest of what they are. Same licence as `twoFoot`
     not drawing the step-on and `toePick` not drawing its entry, and the same
     honesty rule: a pose that cannot be drawn honestly is not drawn. The page
     says so. */
  camelSpin: spinMove({
    name:'Camel spin',
    note:'back inside edge: the free leg back at hip height, the arms gathering in',
    path:[
      at(0.70, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:180, radius:R_WIDE}),
      at(1.10, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:230, radius:R_TIGHT}),
      at(1.45, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:250, radius:R_SPIN}),
      at(1.60, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:400, radius:R_SPIN, position:'camel'}),
      at(1.55, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:400, radius:R_SPIN, position:'camel'}),
      at(2.60, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:480, radius:R_SPIN, windup:true}),
      at(1.30, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:150, radius:R_OUT}),
    ],
    keys:[
      {arm:[68,10,16], t:0.0000, ph:'Back inside edge, travelling, the free leg already up', hipZ:96, hipYaw:180, shYaw:170,
       sh:P(-14,0,146), L:P(0,16,0,1.6), R:P(72,-14,114,0,24), skate:'L', edge:'I', dir:'B'},
      {arm:[64,11,14], t:0.1814, ph:'The circle tightening', hipZ:96, hipYaw:180, shYaw:172,
       sh:P(-18,0,144), L:P(0,15,0,1.9), R:P(78,-16,117,0,24), skate:'L', edge:'I', dir:'B'},
      {arm:[60,12,12], t:0.3290, ph:'Centred - the hip stops travelling', hipZ:95, hipYaw:180, shYaw:174,
       sh:P(-22,0,142), L:P(0,12,0,2.2), R:P(86,-18,121,0,22), skate:'L', edge:'I', dir:'B'},
      /* The free leg is complete here and does not move again - only the torso
         settles and the arms come in. Same shape as the extended edge, whose
         position is complete a third of the way in so that the held part is the
         part the syllabus asks for. */
      {arm:[58,14,10], t:0.4506, ph:'Camel - free knee above hip level', hipZ:95, hipYaw:180, shYaw:174,
       sh:P(-30,0,136), L:P(0,12,0,2.2), R:P(94,-20,125,0,22), skate:'L', edge:'I', dir:'B'},
      {arm:[54,16,8], t:0.6270, ph:'Held - stretched along the line, turning slowly', hipZ:95, hipYaw:180, shYaw:171,
       sh:P(-42,0,120), L:P(0,12,0,2.2), R:P(94,-20,125,0,22), skate:'L', edge:'I', dir:'B'},
      {arm:[50,16,8], t:0.7883, ph:'Still a camel, beginning to draw the arms in', hipZ:95, hipYaw:180, shYaw:168,
       sh:P(-48,0,112), L:P(0,12,0,2.2), R:P(94,-20,125,0,22), skate:'L', edge:'I', dir:'B'},
      {arm:[18,2,12], t:0.9186, ph:'Wind-up - the arms to the axis, and it quickens', hipZ:95, hipYaw:180, shYaw:168,
       sh:P(-48,0,112), L:P(0,12,0,2.2), R:P(94,-20,125,0,22), skate:'L', edge:'I', dir:'B'},
      {arm:[24,4,14], t:1.0000, ph:'Exit - the circle opening out again', hipZ:95, hipYaw:180, shYaw:170,
       sh:P(-44,0,116), L:P(0,15,0,1.6), R:P(92,-19,124,0,22), skate:'L', edge:'I', dir:'B'},
    ]}),

  /* A SPIN WITH A CHANGE OF FOOT - 19/09/2026, and it needed no new capability.

     lobeSense(L,I,B) and lobeSense(R,O,B) are BOTH +1. So an arc on the left
     back inside edge and an arc on the right back outside edge curve the same
     way, and laid end to end at the same radius they continue THE SAME CIRCLE
     about THE SAME CENTRE. The model picks the second foot and its edge for the
     same reason it picked the first.

     That is not a convenience, it is the element's own rule satisfied by
     construction. The ISU: "if the spinning centers (before and after the change
     of foot) are too far apart ... only the part before the change of foot will
     be called". Here they cannot be far apart, because there is one centre.

     HOW LONG EACH FOOT HOLDS IS THE DOCUMENT'S NUMBER, NOT A CHOICE: "the change
     of foot in any spin must be preceded and followed by a spin position with at
     least three (3) revolutions". 1100 degrees each side is 3.06, and
     tools/spin.mjs asserts it rather than trusting this comment.

     THE STEP-OVER COSTS SPEED, and the rate says so: 1.9 revolutions per second
     on the left, 1.5 across the change, 1.7 recovered on the right. A skater
     putting a foot down and taking the other up has briefly widened everything,
     and gather.mjs reads that as consistent rather than as a fault. */
  changeFootSpin: spinMove({
    name:'Change of foot spin',
    note:'left back inside to right back outside: one centre, three revolutions on each foot',
    path:[
      at(0.70, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:180,  radius:R_WIDE}),
      at(1.30, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:250,  radius:R_TIGHT}),
      at(1.90, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:1100, radius:R_SPIN, position:'upright'}),
      at(1.50, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:100,  radius:R_SPIN}),
      at(1.70, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:1100, radius:R_SPIN, position:'upright'}),
      at(2.70, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:520,  radius:R_SPIN, windup:true}),
      at(1.40, {kind:'arc', foot:'R', edge:'O', dir:'B', sweep:150,  radius:R_OUT}),
    ],
    keys:[
      {arm:[70,10,16], t:0.0000, ph:'Back inside edge, still travelling', hipZ:96, hipYaw:180, shYaw:166,
       sh:P(0,0,146), L:P(0,16,0,1.6), R:P(-30,24,20), skate:'L', edge:'I', dir:'B'},
      {arm:[64,9,17], t:0.1259, ph:'The circle tightening', hipZ:96, hipYaw:180, shYaw:170,
       sh:P(0,0,146), L:P(-4.3,15,0,1.9), R:P(-26,22,20), skate:'L', edge:'I', dir:'B'},
      {arm:[54,8,18], t:0.2201, ph:'Centred on the left - the hip stops travelling', hipZ:96, hipYaw:180, shYaw:174,
       sh:P(0,0,146), L:P(-3.9,12,0,2.2), R:P(-22,18,18), skate:'L', edge:'I', dir:'B'},
      {arm:[44,6,18], t:0.3600, ph:'Three revolutions upright on the left', hipZ:97, hipYaw:180, shYaw:178,
       sh:P(0,0,147), L:P(-2.9,12,0,2.2), R:P(-16,14,16,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      /* The weight goes across here and `skate` names the right foot from this
         key on. It is authored at the path's own segment boundary to five places
         so that the blade the pose rides and the blade the tracing is built from
         change on the same frame; spin.mjs asserts they agree, per frame. */
      {arm:[52,10,16], t:0.50366, ph:'Change of foot - stepping over onto the right', hipZ:95, hipYaw:180, shYaw:176,
       sh:P(0,0,145), R:P(-3.6,12,0,2.2,NEUTRAL), L:P(-14,12,16), skate:'R', edge:'O', dir:'B'},
      {arm:[50,8,18], t:0.5363, ph:'Centred on the right, back outside edge', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(0,0,146), R:P(-3.8,12,0,2.2), L:P(-20,-6,18), skate:'R', edge:'O', dir:'B'},
      {arm:[40,6,18], t:0.7000, ph:'Three revolutions upright on the right', hipZ:97, hipYaw:180, shYaw:178,
       sh:P(0,0,147), R:P(-2.9,12,0,2.2), L:P(-14,-2,15), skate:'R', edge:'O', dir:'B'},
      {arm:[32,4,18], t:0.8532, ph:'Still upright, drawing in', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(0,0,148), R:P(-2.1,12,0,2.2), L:P(-10,0,14), skate:'R', edge:'O', dir:'B'},
      {arm:[18,2,12], t:0.9475, ph:'Wind-up - everything to the axis, and it quickens', hipZ:99, hipYaw:180, shYaw:180,
       sh:P(0,0,149), R:P(-1.5,12,0,2.2), L:P(-8,2,14), skate:'R', edge:'O', dir:'B'},
      {arm:[52,8,18], t:1.0000, ph:'Exit - opening out and stepping off', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(0,0,146), R:P(-4.0,15,0,1.6), L:P(-18,-6,20), skate:'R', edge:'O', dir:'B'},
    ]}),

  /* A COMBINATION SPIN - camel, sit, upright, on one foot.

     A JOINING RULE, NOT A NEW CAPABILITY. The three positions already existed
     and already had checkers; what a combination adds is the requirement that
     each be HELD. The ISU: "must include a minimum of two different basic
     positions with 2 revolutions in each of these positions anywhere within the
     spin". All three are here, which the handbook scores above two.

     British Ice Skating's National Test Structure puts its floor on the whole
     thing rather than on each position: a spin combination without a change of
     foot needs a minimum of four revolutions, six with one. This is 9.2.

     THE CHANGES BETWEEN POSITIONS GET THEIR OWN SEGMENTS, claiming nothing. A
     skater half way out of a camel is not in a basic position, and saying so in
     the path is what lets the checker assert each position over frames where it
     is genuinely held. It also matches the rule: revolutions in a non-basic
     position count towards the total and not towards the two.

     THE RATE RISES THROUGH THE WHOLE THING, 1.55 to 1.9 to 2.3 to 3.0, and not
     one of those numbers is decoration. A camel is stretched along a line at
     right angles to the axis; a sit is folded low and near it; an upright is
     stacked over it. Each change brings mass in, so each change speeds the spin
     up, and a combination skated in that order accelerates all the way to the
     wind-up. */
  /* A COMBINATION SPIN - sit into upright, on one foot.

     A JOINING RULE, NOT A NEW CAPABILITY. Both positions already existed and
     already had a checker; what a combination adds is the requirement that each
     be HELD. The ISU: "must include a minimum of two different basic positions
     with 2 revolutions in each of these positions anywhere within the spin".

     British Ice Skating's National Test Structure puts its floor on the whole
     thing rather than on each position: a spin combination without a change of
     foot needs a minimum of four revolutions, six with one. This is 8.3.

     WHY NO CAMEL, WHICH IS THE USUAL THIRD. The ISU scores three basic positions
     above two, and this rig can hold a camel - camelSpin does. What it cannot do
     is CHANGE into or out of one: a free leg reaching backwards at mid height
     draws a boot pointing at the ice at every reach, and the way round it puts
     the free foot over the hip at height, where the top view looks straight into
     the boot. Measured both ways; see camelSpin's note and docs/model.md. A
     two-position combination is a real element rather than a consolation, and
     drawing a three-position one would mean drawing a change nothing could
     skate. The page says which is missing and why.

     THE CHANGE BETWEEN POSITIONS GETS ITS OWN SEGMENT, claiming nothing. A
     skater half way out of a sit is not in a basic position, and saying so in
     the path is what lets the checker assert each position over frames where it
     is genuinely held. It also matches the rule: revolutions in a non-basic
     position count towards the total and not towards the two.

     AND THE RATE RISES THROUGH IT, 1.75 to 2.3 to 3.0. A sit holds the free leg
     stretched forward, well off the axis; an upright stacks everything over the
     blade. So the change itself speeds the spin up, which is why a combination
     is skated in this order and not the other. */
  combinationSpin: spinMove({
    name:'Combination spin',
    note:'back inside edge: sit into upright, one foot, one centre, quickening throughout',
    path:[
      at(0.70, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:180, radius:R_WIDE}),
      at(1.10, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:230, radius:R_TIGHT}),
      at(1.45, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:250, radius:R_SPIN}),
      at(1.75, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:760, radius:R_SPIN, position:'sit'}),
      at(2.00, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:220, radius:R_SPIN}),
      at(2.30, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:760, radius:R_SPIN, position:'upright'}),
      at(3.00, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:420, radius:R_SPIN, windup:true}),
      at(1.40, {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:150, radius:R_OUT}),
    ],
    keys:[
      {arm:[68,10,16], t:0.0000, ph:'Back inside edge, still travelling', hipZ:96, hipYaw:180, shYaw:168,
       sh:P(-4,0,146), L:P(-6,16,0,1.6), R:P(-34,22,20), skate:'L', edge:'I', dir:'B'},
      {arm:[62,10,18], t:0.1461, ph:'The circle tightening, beginning to sink', hipZ:88, hipYaw:180, shYaw:172,
       sh:P(-10,0,138), L:P(-24,14,0,1.9), R:P(-52,12,20), skate:'L', edge:'I', dir:'B'},
      {arm:[56,12,16], t:0.2648, ph:'Centred, and folding down', hipZ:66, hipYaw:180, shYaw:176,
       sh:P(-14,0,116), L:P(-38,12,0,2.2), R:P(-68,0,18,0,POINTED), skate:'L', edge:'I', dir:'B'},
      {arm:[48,12,14], t:0.3628, ph:'Thigh reaches parallel - the sit', hipZ:44, hipYaw:180, shYaw:178,
       sh:P(-16,0,92), L:P(-38,12,0,2.2), R:P(-76,-6,12,0,POINTED), skate:'L', edge:'I', dir:'B'},
      {arm:[42,12,13], t:0.6094, ph:'Sit held - free leg forward, well off the axis', hipZ:41, hipYaw:180, shYaw:180,
       sh:P(-16,0,89), L:P(-40,12,0,2.2), R:P(-80,-6,10,0,POINTED), skate:'L', edge:'I', dir:'B'},
      {arm:[38,8,16], t:0.6719, ph:'Rising, the free leg drawing in', hipZ:92, hipYaw:180, shYaw:180,
       sh:P(-6,0,142), L:P(-18,12,0,2.2), R:P(-34,10,16), skate:'L', edge:'I', dir:'B'},
      {arm:[32,4,18], t:0.8596, ph:'Upright held - stacked over the blade, and quicker for it', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(0,0,148), L:P(-2.4,12,0,2.2), R:P(-14,12,15), skate:'L', edge:'I', dir:'B'},
      {arm:[18,2,12], t:0.9391, ph:'Wind-up - everything to the axis, and it quickens again', hipZ:99, hipYaw:180, shYaw:180,
       sh:P(0,0,149), L:P(0,12,0,2.2), R:P(-8,6,14), skate:'L', edge:'I', dir:'B'},
      {arm:[52,8,18], t:1.0000, ph:'Exit - opening out and stepping off', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(-2,0,146), L:P(-6,15,0,1.6), R:P(-18,20,20), skate:'L', edge:'I', dir:'B'},
    ]}),

  /* A SNOWPLOUGH STOP — the rig for snowplough-stop, and the first pose in which
     the REFERENCE blade skids. Both blades are sliding, so there is no gliding
     foot to hang the path off; `skate` still names the blade the path is built
     from, and that blade declares `onIce: 'skid'` like the other one.

     Which is why the tracing had to learn a third state. A blade sliding across
     itself leaves a band the width of its own length foreshortened by its yaw, not
     a curve — so the top-down view smears the mark here instead of drawing the
     confident thin line it draws everywhere else.

     FORTY DEGREES OF TOE-IN EACH (the history is below), and it took bent knees to
     buy them. Toes-in is the expensive direction — a weight-bearing hip gives
     twenty — and a bent knee adds up to twenty-five more. So the pose comes out sunk, which is how a
     snowplough is taught and is not what anybody authored here: the sweep was for
     the most toe-in the constants would allow, against the shin's 28 degrees of lean
     on both legs at once.

     IT WAS FORTY UNTIL SESSION 31, when the knees started following the feet
     (kneeFace in rig-math.js). Knees turned in over toes turned in lean the shins
     inward across the boots, 32° at the old hip of 90, and no hip height satisfied
     both shin.mjs and turnout.mjs at forty: high enough for the shin straightens the
     knee out of the twist the toe-in needs. Thirty-five, a hip of 93 and the feet
     four centimetres narrower each is the nearest pose that holds both. Some of that
     inward lean is really the boot tipping onto its inside edge, which shin.mjs
     cannot see (it measures against a level boot); a question for a coach before it
     is a question for the model.

     FORTY AGAIN SINCE SESSION 32, and over the middle of the blade. Martyn's two
     corrections: a little more knee to allow the rotation, and the body has to line
     up over the middle of the blade. Measured with Winter's segment fractions
     (src/lib/mass.js, written for it; npm run balance), the pose above had its
     mass 6 cm behind the blades' midpoints, and moving the feet forward to buy the
     bend put it 19 cm behind. Over the middle, a lower hip leans the shin forward
     over the toe and nowhere else, which the single 28° cone in shin.mjs refused;
     the split (32° forward, 28° across) lets it bend. So: hip 92, feet 2 cm
     narrower each, the knees bent 33° (were 25°), which lets the hip and knee turn
     each toe in 43°, and the shoulders 14 cm forward of the hip, about fifteen
     degrees of trunk lean, to bring the mass back over the blades. A starter move,
     so deliberately not sunk further. Verified against a coach: NO.

     Held rather than animated. A stop is a loss of speed and the path runs at one,
     so this is the pose mid-scrape and not the stopping of it. */
  /* SITTING BACK AGAINST THE STOP since Session 34 (Martyn's stop target, balance.mjs): the
     feet 15 cm ahead of the hip rather than 8, so the mass is 5 cm behind them. */
  snowplough: {
    name:'Snowplough stop',
    note:'both blades skidding · toes turned in, inside edges, scraping straight',
    path:[{kind:'line', len:150}],
    radius:200, duration:2.6,
    keys:[
      {t:0.00, ph:'Both blades turned in and pressed', hipZ:92, hipYaw:0, shYaw:0,
       sh:P(14,0,143), L:SKID(15,-28,0,-40,'I'), R:SKID(15,28,0,40,'I'), skate:'L', edge:'I', dir:'F'},
      {t:0.50, ph:'Scraping: the knees driving the blades down', hipZ:92, hipYaw:0, shYaw:0,
       sh:P(14,0,143), L:SKID(15,-28,0,-40,'I'), R:SKID(15,28,0,40,'I'), skate:'L', edge:'I', dir:'F'},
      {t:1.00, ph:'Held: the scrape taking the speed off', hipZ:92, hipYaw:0, shYaw:0,
       sh:P(14,0,143), L:SKID(15,-28,0,-40,'I'), R:SKID(15,28,0,40,'I'), skate:'L', edge:'I', dir:'F'},
    ]},

  /* A BACKWARD SNOWPLOUGH STOP — the forward one's mirror in everything except
     which way the toes go. Travelling backwards the heels lead, so the feet press
     out and the TOES turn out rather than in — and out is the cheap direction at
     the hip, forty degrees against twenty. The forward plough has to buy its
     toes-in with a bent knee; this one does not, which is a fact about hips and
     not about difficulty. Everything else a skater finds hard about it is that the
     weight has to move forward while the stop pushes them back.

     FORTY DEGREES OUT, and a hip of 93, since Session 31: it was forty-five at 90.
     With the knees following the feet (kneeFace), forty-five at 90 leaned the shins
     36°, and raising the hip enough to fix that straightened the knees past the bend
     the extra five degrees needed. Forty is what the hip gives with no bend at all.
     SITTING BACK AGAINST THE STOP since Session 34 (Martyn's stop target, balance.mjs): the
     mass had been 7 to 8 cm toward the travel, which falls over backwards. The feet went 6 cm
     further along the travel (any further is out of reach.mjs at a hip of 93) and the
     shoulders 16 cm forward, the weight held forward the way this comment always said: 4 to
     5 cm against the travel. */
  ploughBack: {
    name:'Backward snowplough stop',
    note:'both blades skidding, travelling backwards · toes turned out, inside edges',
    path:[{kind:'line', len:140}],
    radius:200, duration:2.6,
    keys:[
      {t:0.00, ph:'Both blades pressed out and flat', hipZ:93, hipYaw:180, shYaw:180,
       sh:P(-16,0,146), L:SKID(-2,-34,0,40,'I'), R:SKID(-2,34,0,-40,'I'), skate:'L', edge:'I', dir:'B'},
      {t:0.50, ph:'Scraping: the weight held forward against the stop', hipZ:93, hipYaw:180, shYaw:180,
       sh:P(-15,0,146), L:SKID(-2,-34,0,40,'I'), R:SKID(-2,34,0,-40,'I'), skate:'L', edge:'I', dir:'B'},
      {t:1.00, ph:'Held: the feet finishing wider than they started', hipZ:93, hipYaw:180, shYaw:180,
       sh:P(-14,0,146), L:SKID(-2,-34,0,40,'I'), R:SKID(-2,34,0,-40,'I'), skate:'L', edge:'I', dir:'B'},
    ]},

  /* A T-STOP — the rig for t-stop, and the first thing in this file that SKIDS.

     The gliding blade runs true on a forward outside edge and is the reference;
     the trailing blade is laid across it at a right angle, on its OUTSIDE edge,
     and slides. Coaches are unanimous about that edge and name the inside as the
     classic error, which is why a skid states its edge rather than having one
     derived — the derivation assumes both blades share a circle, and this one is
     across the circle.

     THE POSE WAS FOUND BY SWEEPING AND IT NEEDED THE KNEE. A right angle between
     the feet is ninety degrees of turnout to find, and two weight-bearing hips give
     forty each: eighty, and not enough. A knee bent thirty-five degrees adds
     eighteen more a side, which is why a skater bends to find turnout and why this
     pose comes out with BOTH knees bent and the pelvis opened thirty-five degrees
     toward the trailing foot. None of that was authored; the constants chose it,
     and it is what a T-stop actually looks like.

     DEEPER SINCE SESSION 31: hip 94 to 88, the gliding blade 12 cm ahead of the hip
     and the trailing one 6 cm further out along its own heading. While every knee
     faced the pelvis the trailing shin leaned 28° ACROSS its boot at a hip of 94 and
     no placement of the feet could take it out, because moving a foot along its
     blade moves it along the wrong axis. With the knee following the foot
     (kneeFace) the lean is over the toe, and a foot moved forward under the hip
     takes it back out: tools/knee.mjs has the tables. The hip sits behind the
     gliding blade, which is where a braking skater's weight goes (a stop pushes the
     feet ahead of the body), but how far is a coach's question; Verified: NO.

     Held rather than animated, like the other probes: a stop is a loss of speed and
     the path runs at one. This is the braking instant. */
  tStop: {
    name:'T-stop',
    note:'forward outside edge · the trailing blade across it, on its outside edge, sliding',
    path:[{kind:'arc', foot:'R', edge:'O', dir:'F', sweep:40}],
    radius:400, duration:3.0,
    keys:[
      {t:0.00, ph:'The trailing blade set down across the glide', hipZ:88, hipYaw:35, shYaw:40,
       sh:P(-2,0,141), R:P(12,-20,0,-0.5), L:SKID(-22,-20,0,90,'O'), skate:'R', edge:'O', dir:'F'},
      {t:0.45, ph:'Weight easing onto it, the outside edge shaving', hipZ:88, hipYaw:35, shYaw:42,
       sh:P(-2,0,141), R:P(12,-20,0,-0.5), L:SKID(-22,-20,0,90,'O'), skate:'R', edge:'O', dir:'F'},
      {t:1.00, ph:'Held: the glide holding its line, the trailing blade scraping', hipZ:88, hipYaw:35, shYaw:44,
       sh:P(-2,0,141), R:P(12,-20,0,-0.5), L:SKID(-22,-20,0,90,'O'), skate:'R', edge:'O', dir:'F'},
    ]},

  /* A TWO-FOOT TURN — the rig for two-foot-turn, and the first element in this
     file whose whole content is a ROTATION ON THE ICE. The skid and the per-foot
     yaw both landed on 19/09/2026 and neither had an element using it; this is
     the first, and it needed nothing new.

     WHAT A TURN IS HERE: the boot's heading is the direction of travel plus the
     yaw, so a body turning through a half circle is a yaw sweeping through a half
     circle, and `dir` NEVER CHANGES. That reads backwards — the skater ends up
     gliding backwards, and there is a field that says so. It cannot be used. `dir`
     is a carried state and `yaw` is an interpolated quantity, so flipping `dir` to
     'B' partway would take 180° off the base and send the yaw back through zero to
     compensate: every frame between those two keys would draw the blades swinging
     the wrong way and then back. So the whole 180° lives in the yaw, and a blade
     at 163° off its line of travel IS a blade running very nearly backwards. On a
     skid that is exact rather than a convention — a skidding blade has no line of
     its own to travel along, which is the whole of what `onIce: 'skid'` says.

     IT STARTS AND ENDS MID-SKID, at 25° and 155°, and that is the honest span
     rather than a trimmed one. A skid must be turned past SKID_MIN_YAW; a blade
     running true is not a skid; and `yaw` interpolates continuously, so there is no
     arrangement of keyframes that goes from a true-running blade to a skidding one
     without frames in between that are a yawed blade claiming to grip. Those frames
     would be the lie turnout.mjs refuses on a keyframe. So the rig draws the turn
     itself and not the glide into it — which is `two-foot-glide`, and has its own
     page. twoFoot does not draw stepping onto two feet either.

     THE PIVOT IS ON THE LEFT BLADE, and that is the rig's shape showing through.
     The reference blade is pinned to the path, so the hip hangs off it: give the
     reference foot a hip-relative position that rotates and the HIP orbits the
     tracing instead, by the stance width, four times life in the plan view. A
     skater swerving half a metre sideways is a worse picture than a pivot placed
     a stance-width off centre. It is also where an anticlockwise turn would put it
     — you turn around your inside, and the left is the inside of this one — so the
     licence and the movement agree rather than merely not colliding.

     BOTH BLADES ARE NEAR FLAT AND THE LETTERS SAY WHICH SIDE OF FLAT. Every
     two-blade pose in this guide is one outside edge and one inside, and here the
     turn decides which: rotating anticlockwise puts the skater fractionally over
     the left of both boots, which is the left's outside and the right's inside.
     lean.mjs does not hold a skid to it — its two routes are both claims about an
     edge carrying weight into a circle, and a pivoting blade carries neither — so
     the letters are a record of the tilt and not a load-bearing number. It belongs
     on the list of things to put to a coach.

     THE RISE IS THE TECHNIQUE. hipZ goes 94-97-94: a skater rises through the
     middle of the turn to take weight off the blades so they will pivot, and sinks
     again to hold the exit. And the SHOULDERS LEAD — shYaw is 25° ahead of hipYaw
     at the first key and level with it at the last, which is the element's own
     sentence about winding the upper body and letting the feet follow, written as
     numbers rather than asserted in prose.

     The arms are gathered to 46 cm rather than the default 67. A wide carriage
     swung through 180° is the fore-and-aft sweep the waltz jump's note warns
     about, and this turns through the same angle at a quarter of the speed. */
  twoFootTurn: {
    name:'Two-foot turn',
    note:'both blades skidding · the body turning through a half circle, forwards to backwards',
    path:[{kind:'line', len:200}],
    radius:200, duration:3.4,
    keys:[
      {t:0.00, ph:'Shoulders wound, the blades letting go', hipZ:94, hipYaw:25, shYaw:50, arm:[46,6,20],
       sh:P(0,0,146), L:SKID(0,0,0,33,'O'), R:SKID(6,14,0,17,'I'), skate:'L', edge:'O', dir:'F'},
      {t:0.25, ph:'Rising: the rise taking the weight off the blades', hipZ:96, hipYaw:60, shYaw:78, arm:[46,6,20],
       sh:P(0,0,148), L:SKID(0,0,0,68,'O'), R:SKID(13,8,0,52,'I'), skate:'L', edge:'O', dir:'F'},
      {t:0.50, ph:'Square across the travel: the scrape at its widest', hipZ:97, hipYaw:90, shYaw:105, arm:[46,6,20],
       sh:P(0,0,149), L:SKID(0,0,0,98,'O'), R:SKID(15,0,0,82,'I'), skate:'L', edge:'O', dir:'F'},
      {t:0.75, ph:'The hips catching the shoulders up', hipZ:96, hipYaw:120, shYaw:132, arm:[46,6,20],
       sh:P(0,0,148), L:SKID(0,0,0,128,'O'), R:SKID(13,-8,0,112,'I'), skate:'L', edge:'O', dir:'F'},
      {t:1.00, ph:'Facing back down the ice, the blades settling', hipZ:94, hipYaw:155, shYaw:155, arm:[46,6,20],
       sh:P(0,0,146), L:SKID(0,0,0,163,'O'), R:SKID(6,-14,0,147,'I'), skate:'L', edge:'O', dir:'F'},
    ]},

  /* THE SAME HALF TURN, BACKWARDS TO FORWARDS — the rig for backward-two-foot-turn.

     Every number in the forward turn read off a base of nought; this one reads off
     180, because the skater starts facing back down the ice. hipYaw runs 205 to 335
     and the yaws are identical to the forward turn's, which is not a coincidence
     and is worth stating: yaw is measured from the DIRECTION OF TRAVEL and the
     skater is travelling the same way in both. Turning anticlockwise out of a
     backward glide and turning anticlockwise out of a forward one put the blades
     through exactly the same headings; all that differs is which end of the sweep
     the skater could see where they were going.

     Which is the element. Learn to Skate USA teaches this after the forward one and
     what makes it harder is not the feet: the rotation finishes facing a stretch of
     ice the skater has not been looking at. So the SHOULDER LEAD IS LARGER HERE —
     25° at the first key as before, but held further into the turn, because the
     correction coaches give is to turn the head and shoulders first and let the
     feet follow rather than snapping them round. A rushed turn is the feet arriving
     before the body, and that is a shape this rig can draw: it is the shoulder line
     BEHIND the hip line, and it is what these numbers deliberately are not. */
  twoFootTurnBack: {
    name:'Backward two-foot turn',
    note:'both blades skidding, travelling backwards · the body turning through a half circle to face forwards',
    path:[{kind:'line', len:200}],
    radius:200, duration:3.6,
    keys:[
      {t:0.00, ph:'Gliding backwards, the shoulders already wound', hipZ:94, hipYaw:205, shYaw:230, arm:[46,6,20],
       sh:P(0,0,146), L:SKID(0,0,0,33,'O'), R:SKID(-6,-14,0,17,'I'), skate:'L', edge:'O', dir:'B'},
      {t:0.25, ph:'The head turning first, the blades following', hipZ:96, hipYaw:240, shYaw:268, arm:[46,6,20],
       sh:P(0,0,148), L:SKID(0,0,0,68,'O'), R:SKID(-13,-8,0,52,'I'), skate:'L', edge:'O', dir:'B'},
      {t:0.50, ph:'Square across the travel: the scrape at its widest', hipZ:97, hipYaw:270, shYaw:295, arm:[46,6,20],
       sh:P(0,0,149), L:SKID(0,0,0,98,'O'), R:SKID(-15,0,0,82,'I'), skate:'L', edge:'O', dir:'B'},
      {t:0.75, ph:'Coming round onto ice the skater can now see', hipZ:96, hipYaw:300, shYaw:318, arm:[46,6,20],
       sh:P(0,0,148), L:SKID(0,0,0,128,'O'), R:SKID(-13,8,0,112,'I'), skate:'L', edge:'O', dir:'B'},
      {t:1.00, ph:'Facing the way the skater is going, the blades settling', hipZ:94, hipYaw:335, shYaw:335, arm:[46,6,20],
       sh:P(0,0,146), L:SKID(0,0,0,163,'O'), R:SKID(-6,14,0,147,'I'), skate:'L', edge:'O', dir:'B'},
    ]},

  /* A PUSH — the rig for forward-stroking, and the fourth thing the rig learned to hold, after a second blade,
     a pick and a corrected ankle, and the first that needed a blade on the ice to
     point somewhere other than where it is going.

     The gliding foot is the reference blade and runs true along its lobe. The other
     is planted, flat, and turned thirty-five degrees off the line of travel onto its
     inside edge — which is a push, and the thing every syllabus in the sport starts
     with.

     THIRTY-FIVE IS NOT A ROUND NUMBER, it is most of what a weight-bearing hip has.
     HIP_OUT is forty. Turning the foot further is not available at the hip, so a
     skater who wants a wider push turns the pelvis instead — which is why a strong
     push looks like the whole body opening rather than a foot twisting.

     THE SIDE PUSH, WHAT A BEGINNER LEARNS — 04/10/2026, Session 30, Martyn's correction
     to Session 29, which had drawn the T here as THE way to stroke. Beginners push out to
     the side with the feet opening like a book: heels together, the pushing foot turned
     out, driving out sideways to full extension. The foot leaves the ice, the skater
     rises into the glide with the free foot low and close, then bends again and brings
     it back beside the gliding heel. The T is the progression and has its own rig,
     `pushOffT`, below. The pelvis stays square here; that is the difference a reader
     should see between the two.

     Arms forward in a low V, the hands at about rib height, between one and three
     o'clock, further forward for a beginner (Martyn, Session 29). Verified against a
     coach: NO. */
  pushOff: {
    name:'Push',
    note:'the side push · heels together, the right foot turned out and driving out sideways · rising into the glide',
    path:[{kind:'arc', foot:'L', edge:'O', dir:'F', sweep:60}],
    radius:300, duration:3.6,
    keys:[
      {t:0.00, ph:'Knees bent, heels together, the pushing foot turned out', hipZ:92, hipYaw:0, shYaw:-4, arm:[50,36,26],
       sh:P(-2,0,145), L:P(12,8,0,-0.5), R:PUSH(6,20,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.24, ph:'Pushing out to the side against the inside edge', hipZ:93, hipYaw:0, shYaw:-4, arm:[50,36,26],
       sh:P(-2,0,146), L:P(6,7,0,-0.5), R:PUSH(-2,27,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.42, ph:'The push at full extension, the pushing leg straight', hipZ:94, hipYaw:0, shYaw:-4, arm:[50,36,26],
       sh:P(-2,0,147), L:P(0,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.52, ph:'The pushing foot leaving the ice', hipZ:95, hipYaw:0, shYaw:-3, arm:[50,36,26],
       sh:P(-2,0,148), L:P(0,6,0,-0.5), R:P(-18,32,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.72, ph:'Rising into the glide, the free foot low and close behind', hipZ:97, hipYaw:0, shYaw:-2, arm:[50,36,26],
       sh:P(-2,0,150), L:P(0,6,0,-0.5), R:P(-20,22,10,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:1.00, ph:'Bending again, the free foot coming back beside the gliding heel', hipZ:92, hipYaw:0, shYaw:-4, arm:[50,36,26],
       sh:P(-2,0,145), L:P(12,8,0,-0.5), R:P(4,18,6,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
    ]},

  /* T STROKING, THE PROGRESSION — 04/10/2026, Session 30 (Martyn, who skates, against
     video, in two passes). Session 29 drew this as forward stroking itself; it is the
     second level. An improving skater moves from the side push to the T: the pushing
     blade set behind the gliding heel and square across it, which puts the push on an
     inside edge from the start and the glide on an outside edge. More elegant, more
     power, and edges rather than a straight line.

     TWO STROKES, BECAUSE ONE CANNOT SHOW WHAT MAKES IT T STROKING. Each stroke puts a
     slight curve on its edge and the next, on the other foot, curves the other way, so
     the tracing is a run of shallow arcs alternating side to side, one per foot. The
     path is an LFO arc then an RFO arc of the same size; their opposite curvature comes
     out of lobeSense, not out of anything written here.

     THE SECOND STROKE IS THE FIRST ONE MIRRORED, through mirrorMove's own key map, so the
     two cannot disagree. Between them the new foot is set down beside the gliding one,
     the reference blade hands over on the ice (buildPath displaces the path so the hip
     does not move), and the old gliding foot turns out under the body into the next T.

     HOW BENT THE T CAN BE WAS LIMITED BY THE KNEE, NOT THE BOOT. The rig pointed every
     knee where the pelvis faces, so a bent knee over a blade turned ninety degrees leaned
     the shin sideways in its boot and shin.mjs stopped it at a hip of 92 (Session 29).
     Since Session 31 the knee follows its own foot as far as the hip can turn it
     (kneeFace in rig-math.js), the lean is over the toe instead, and the T sits at a
     hip of 86 with the pushing blade 3 cm further out along its own line. The pelvis
     opens 35 degrees to let the blade turn the full ninety, the way a T-stop does.
     Verified against a coach: NO. */
  pushOffT: (() => {
    const at = (o, s) => k => ({ ...k, t: +(o + k.t * s).toFixed(4) });
    const stroke = [
      {t:0.00, ph:'The T, knees bent: the pushing blade behind the gliding heel, square across it', hipZ:86, hipYaw:-35, shYaw:-12, arm:[50,32,26],
       sh:P(-2,0,139), L:P(14,12,0,-0.5), R:PUSH(-2,17,0,-90), skate:'L', edge:'O', dir:'F'},
      {t:0.22, ph:'Pushing out against the inside edge', hipZ:92, hipYaw:-20, shYaw:-8, arm:[50,32,26],
       sh:P(-2,0,145), L:P(8,9,0,-0.5), R:PUSH(-8,25,0,-60), skate:'L', edge:'O', dir:'F'},
      {t:0.40, ph:'The push at full extension, the pushing leg straight', hipZ:94, hipYaw:0, shYaw:-4, arm:[50,32,26],
       sh:P(-2,0,147), L:P(0,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.52, ph:'The pushing foot leaving the ice', hipZ:95, hipYaw:0, shYaw:-2, arm:[50,32,26],
       sh:P(-2,0,148), L:P(0,6,0,-0.5), R:P(-28,28,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.72, ph:'Rising into the glide on the outside edge, the free leg extended behind', hipZ:97, hipYaw:0, shYaw:-2, arm:[50,32,26],
       sh:P(-2,0,150), L:P(0,6,0,-0.5), R:P(-50,14,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.90, ph:'Bending again, the free foot coming forward beside the gliding foot', hipZ:92, hipYaw:-6, shYaw:-6, arm:[50,32,26],
       sh:P(-2,0,145), L:P(12,8,0,-0.5), R:P(6,18,6,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
    ];
    const down = {t:0.44, ph:'The free blade set down beside the gliding one', hipZ:92, hipYaw:-3, shYaw:-4, arm:[50,32,26],
       sh:P(-2,0,145), L:P(12,2,0,-0.5), R:ON(14,10,0,-0.5), skate:'L', edge:'O', dir:'F'};
    /* THE WEIGHT CROSSES OVER UPRIGHT. Each glide leans into its own curve, the left
       blade right of the hip and the right blade left of it, and the right foot is
       always right of the left one, so at the instant the reference changes both blades
       are under the hip and neither is on an edge: one key on the flat, which lean.mjs
       holds to its centroid under the hip, then onto the new outside edge. */
    const over = [
      {t:0.50, ph:'The weight moving across onto the new foot', hipZ:92, hipYaw:0, shYaw:-2, arm:[50,32,26],
       sh:P(-2,0,145), L:PUSH(10,1,0,0), R:P(14,5,0,-0.5), skate:'R', edge:null, dir:'F'},
      {t:0.51, ph:'Onto the new outside edge, the old gliding foot turning out', hipZ:92, hipYaw:2, shYaw:0, arm:[50,32,26],
       sh:P(-2,0,145), L:PUSH(10,-7,0,10), R:P(14,-1,0,-0.5), skate:'R', edge:'O', dir:'F'},
    ];
    const mirror = ks => mirrorMove({ path: [], keys: ks }).keys;
    const first = [...stroke.map(at(0, 0.42)), down];
    const second = mirror(stroke.map(at(0.56, 0.44 / 0.9)));
    return {
      name:'T stroking',
      note:'from a T behind the gliding heel · two strokes, one on each foot, each curving the other way',
      path:[ {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:35, span:1},
             {kind:'arc', foot:'R', edge:'O', dir:'F', sweep:35, span:1} ],
      radius:500, duration:7.2,
      keys:[ ...first, ...over, ...second ],
    };
  })(),


  /* BACKWARD STROKING — the rig for `backward-stroking`, and it is pushOff read
     off a base of 180 rather than a new idea, the same way twoFootTurnBack is
     twoFootTurn read off one.

     THE YAW IS THE SAME NUMBER IN BOTH, AND THAT IS WORTH STATING because it looks
     like it should not be. bootDir takes a planted blade's heading from the
     direction of travel — 0 forwards, 180 backwards — plus the authored yaw. Going
     backwards flips the base; facing backwards flips which side of the track is the
     skater's right, because lateral(180) is -n. The two flips cancel, so a right
     toe turned thirty-five degrees out is -35 either way. Exactly the property
     twoFootTurnBack found in the yaws of a turn, arriving by the same route.

     WHAT IS NOT MIRRORED IS THE BODY. Every syllabus teaches this long after the
     forward version and the page says why: the difficulty is not the feet. So the
     two things a coach actually says are authored rather than left to the mirror —
     the SHOULDERS LEAD, and the WEIGHT STAYS FORWARD, which with the skater facing
     back down the ice is the shoulder centre at negative t, over the toes and not
     over the heels. A skater who sits back on a backward push has the blade run
     away in front of them, and that is a shape this rig can draw: it is sh.t on
     the wrong side of nought, and it is what this deliberately is not.

     A HELD POSITION, for pushOff's reason and not a new one: a push is a change of
     weight, the rig carries one reference blade per frame, and drawing the
     changeover means handing that blade over mid-move. This holds the instant the
     push is at its widest. */
  backStroke: {
    name:'Backward push',
    note:'back outside edge · the other blade planted and turned thirty-five degrees out',
    path:[{kind:'arc', foot:'L', edge:'O', dir:'B', sweep:60}],
    radius:300, duration:3.4,
    keys:[
      {t:0.00, ph:'Weight over the gliding blade, the push at its widest', hipZ:94, hipYaw:180, shYaw:174,
       sh:P(-5,0,147), L:P(0,-7,0,-0.5), R:PUSH(-14,-34,0,-35), skate:'L', edge:'O', dir:'B'},
      {t:0.45, ph:'Still pushing, the shoulders squaring up', hipZ:94, hipYaw:180, shYaw:176,
       sh:P(-5,0,147), L:P(0,-7,0,-0.5), R:PUSH(-14,-34,0,-35), skate:'L', edge:'O', dir:'B'},
      {t:1.00, ph:'Held: the push complete, the glide running away behind', hipZ:94, hipYaw:180, shYaw:178,
       sh:P(-4,0,147), L:P(0,-7,0,-0.5), R:PUSH(-14,-34,0,-35), skate:'L', edge:'O', dir:'B'},
    ]},

  /* A SLIP STEP — the rig for `slip-step`, the first pose in this file on a FLAT,
     and the first two-foot MOVEMENT it has drawn.

     BRITISH ICE SKATING'S OWN DEFINITION, and it is geometry four times over, which
     is the cheapest kind of expectation there is: "A step skated in a straight line
     with the blades of both skates being held flat on the ice. The weight is over the
     skating leg that may be well bent or straight while the free foot slides forward
     on the ice to full extension." A straight line, both blades flat, the weight on
     the skating leg, the free foot sliding forward. Every one of those is a claim the
     model can hold, and none of them is ours.

     A FLAT IS THE ABSENCE OF AN EDGE, not a third letter. `edge: null`, and
     `lobeSense` returns nought, so `buildPath` draws it straight from the same
     expression that curves everything else. BIS name this step with no edge letter at
     all, and `label` is foot-then-direction-then-edge, so a letter would have spelled
     a left forward flat LFF.

     IT IS A MOVEMENT AND THAT IS NOT A LAPSE. twoFoot, pushOff and toePick are all
     held positions for one reason: the rig carries one reference blade, and drawing
     what they do means handing it over mid-move. Nothing here hands over. The weight
     stays on the skating leg by BIS's own sentence, the free foot is on the ice from
     the first frame to the last, both blades stay flat, the path stays straight and no
     contact changes kind. The difficulty that stopped the others does not reach this.

     THE HIP GOES BACK AS IT GOES DOWN, and neither number was chosen. The skating
     foot's authored t rises 12 to 25 because the hip hangs off the reference blade at
     minus that — so a rising t is the hip travelling BACK over the skating foot, which
     is what sinking does. And it has to: shin.mjs will not have a deep knee with the
     blade under the hip, the same fact that shapes the teapot, the sit spin and the
     pick. Swept before authoring, at a self-imposed ceiling of 22 degrees rather than
     the 28 the cuff allows: the slide reaches 42 cm at a hip of 92 and 55 at 80, and
     this takes the second with both shins at 21 and 22. The extended edge is why the
     margin is deliberate.

     THE SHOULDERS COME FORWARD, 02/10/2026, because the pose above read as sitting
     back (Martyn, and Session 23's review). BIS put the weight OVER the skating leg,
     and with the hip behind the blade, which the boot forces for any real knee bend,
     the only thing that can put the mass over the foot is the torso. Swept first: a
     straight skating leg (BIS's other option) was tried at hips of 92 and 94 and lets
     the free foot slide only 31 to 36 cm, because two nearly straight legs cannot
     separate far along the ice; it read as standing with the feet apart. So the knee
     stays bent, a little less (hip 86, skating ankle 13 cm ahead of it, shin 24
     degrees), the slide is 48 cm at 97 per cent of reach, and the shoulders lean 18 cm
     ahead of the hip. Verified against a coach: NO, pending video on 03/10/2026.

     THE FEET STRADDLE THE TRACK, seven centimetres each side, and that is what keeps
     lean.mjs happy: a flat is held to the opposite claim from an edge — the skater is
     NOT leaning — so it is the centroid of the flat blades that must sit under the
     hip, and two feet either side of it average to nought.

     THE FEET FINISH ABOUT THIRTY CENTIMETRES APART AND THAT LOOKS SHORT, so it is
     worth saying why it is not. BIS ask for the free leg at full extension, and it is:
     the sliding leg is at ninety-three per cent of its reach. What makes the gap modest
     is that the skating foot has come forward too, because the hip goes back as the
     knee bends. Swept over every hip height and both feet, the widest gap the model
     allows is 39 cm and that sits on the cuff's 28-degree limit; with margin it is 30
     to 33. So this is the picture, not a shortfall in the authoring. */
  slipStep: {
    name:'Slip step',
    note:'both blades flat and straight · the free foot sliding forward to full extension',
    path:[{kind:'line', len:300}],
    radius:300, duration:3.6,
    keys:[
      {t:0.00, ph:'Both blades flat, the feet level', hipZ:92, hipYaw:0, shYaw:-4,
       sh:P(-2,0,144), L:P(12,-7,0), R:ON(12,7,0), skate:'L', edge:null, dir:'F'},
      {t:0.50, ph:'Sinking onto the skating leg, the free foot starting out', hipZ:89, hipYaw:0, shYaw:-3,
       sh:P(8,0,140), L:P(15,-7,0), R:ON(30,7,0), skate:'L', edge:null, dir:'F'},
      {t:1.00, ph:'Held: the shoulders over the skating foot, the free foot at full stretch', hipZ:86, hipYaw:0, shYaw:-2,
       sh:P(18,0,135), L:P(18,-7,0), R:ON(48,7,0), skate:'L', edge:null, dir:'F'},
    ]},

  /* A DRAG, WHICH IS A LUNGE — the rig for `drag`, and the first pose in this file to
     use the fifth contact. Three barriers stood in front of it on 29/08/2026. Two blades took one,
     the authorable ankle took the second when the sweep found 8,064 legal poses at a
     `point` of 8 degrees or less, and the roll takes the third.

     THE TRAILING BOOT LIES ON ITS INSIDE, BECAUSE THE LEG IS TURNED OUT — corrected
     03/10/2026: Martyn, "the inside of the boot is on the ice, so the foot is turned out,
     not in", which is also Ice Skating Australia's lunge ("extended and turned out").
     The rig has no separate free-foot yaw: turning an extended leg out rotates the boot
     about its own length, which is this roll, so nothing in the pose changes. Martyn, on the drag, and a lunge is the same
     position — he has said so before: coaches call the lunge a drag, recorded in
     docs/model.md on 30/08/2026 before either could be drawn. The right foot's inside
     is the skater's left, and a positive roll tips the up-axis that way, so the roll is
     positive and the left edge of the sole is what comes down.

     THE HEIGHT IS SOLVED, NOT AUTHORED. `z` is whatever puts the sole's edge on the
     ice at this roll — 2.16 cm — with the runner sitting clear above it, which is the
     other half of what makes this a side contact rather than a deep lean. Author the
     roll, solve the height; writing both by hand would be two numbers that have to
     agree, and `blade.mjs` now checks that they do.

     AND IT IS SOLVED BY BISECTION, NOT BY ONE SUBTRACTION, which is worth the sentence
     because the first attempt did the latter and was 0.8 cm out. The sole's edge does
     not move one-for-one with the foot: raising the foot re-aims the shin, which
     re-aims the boot, which moves the edge — the slope is about 1.23, not 1. A fixed
     point wearing the clothes of a linear solve.

     SEVENTY-FOUR DEGREES IS NOT A ROUND NUMBER either. The legal set runs 56 to 80 and
     this is near its middle. What decides the ends is reach: 62 cm behind at a hip of
     50 comes to 80.5 of the 86 the leg has, five and a half centimetres in hand rather
     than posing at the wall, which is the lesson the first extended edge taught.

     ONE POSITION, TWO NAMES, and the repository has had the note for three weeks:
     *coaches call the lunge a drag* — Martyn, 30/08/2026, written into docs/model.md
     before either could be drawn, with the instruction that the element carry the other
     name in its aliases when it could. It can. The page is `drag`, because that is what
     Learn to Skate USA calls it and the guide names elements their way; `lunge` is an
     alias and reaches it through /elements/other-names/.

     A HELD POSITION, and the entry is not drawn, for the reason toePick's is not: the
     frames between a free foot and a boot on its side are a state the model has not
     got, and inventing one to make a probe animate is authoring pose data to satisfy a
     renderer. `twoFoot` does not draw stepping on either. */
  drag: {
    name:'Drag',
    note:'forward outside edge, sunk deep · the free leg turned out, the boot on its inside, the blade clear',
    path:[{kind:'arc', foot:'L', edge:'O', dir:'F', sweep:40}],
    radius:400, duration:3.6,
    keys:[
      {t:0.00, ph:'Sunk into the skating knee, the free leg reaching back', hipZ:50, hipYaw:0, shYaw:-5,
       sh:P(4,0,102), L:P(33,6,0,-0.5), R:SIDE(-62,-10,2.16,74), skate:'L', edge:'O', dir:'F'},
      {t:0.45, ph:'The boot settling onto its side, the blade out of the ice', hipZ:50, hipYaw:0, shYaw:-4,
       sh:P(4,0,102), L:P(33,6,0,-0.5), R:SIDE(-62,-10,2.16,74), skate:'L', edge:'O', dir:'F'},
      {t:1.00, ph:'Held: the glide running, the trailing boot dragging on its inside', hipZ:50, hipYaw:0, shYaw:-3,
       sh:P(5,0,102), L:P(33,6,0,-0.5), R:SIDE(-62,-10,2.16,74), skate:'L', edge:'O', dir:'F'},
    ]},

  /* PROBE — a toe pick in the ice. Not an element page: it exists to hold the
     third kind of contact against every checker in the repository, the way
     twoFoot holds the second. The position is a toe-assisted jump's loaded
     instant — backwards on a right outside edge, sunk into the skating knee, the
     left toe pick set behind. Whether this happens is what separates a toe loop
     from a loop and a flip from a Salchow, and until today nothing in the guide
     could draw it.

     THE ANKLE DECIDES WHERE A PICK CAN GO. A picked boot's direction is authored rather
     than taken off the shin, so the ANKLE ANGLE is a consequence of where the pose puts
     the foot, and the boot allows ANKLE_MAX of it; freefoot.mjs asserts it on every frame
     on a pick. Until 04/10/2026 this pose was sunk to a hip of 54 because `npm run ankle`
     printed three bands, nothing legal between 64 and 76. That was the toe pointing the
     wrong way (rig-math.js bootDir, the pick branch): turned to point back towards the
     skater, the steepest legal boot falls smoothly as the hip rises, and the probe sits
     at 82, a working knee bend.

     A MOVEMENT SINCE 04/10/2026, Session 29 (docs/spec-anchor.md). Until then it was a
     held position, because every foot is authored relative to the hip and a pick is
     the first contact FIXED TO THE ICE: held hip-relative through real travel it swept
     backwards 168 cm over this arc. The pick is now pinned (PIN, rig-math.js *a contact
     pinned to the ice*): from 0.42 to 0.62 the toe stays where it went in and the body
     rides past it, the pick going from 56 cm behind the hip to 29, its pitch easing from
     55 to 40 as the leg comes upright. The end key's t, n are what the pin computes, and
     continuity.mjs holds them to it. The skating foot sits 19 cm ahead of the hip, where
     shin.mjs allows a knee this deep.

     THE ENTRY AND THE RELEASE ARE DRAWN, which failed twice as a held pose. The free
     boot reaching for the pick blends onto the picked rule over PICK_REACH seconds and
     its authored point moves from the blade's middle to the teeth over the span
     (rig-math.js), so nothing turns more than continuity's ordinary 30 degrees a frame
     and the teeth never go under the ice.

     Verified against a coach: NO. */
  toePick: {
    name:'Toe pick',
    note:'RBO edge · the left toe pick set behind and ridden past',
    path:[{kind:'arc', foot:'R', edge:'O', dir:'B', sweep:64}],
    radius:150, duration:3.4,
    keys:[
      {t:0.00, ph:'Gliding back on the right outside edge, the free leg extended', hipZ:88, hipYaw:176, shYaw:166,
       sh:P(0,0,138), L:P(46,-16,24,0,NEUTRAL), R:P(-12,12,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:0.25, ph:'Bending the skating knee, reaching back', hipZ:82, hipYaw:176, shYaw:162,
       sh:P(2,0,132), L:P(56,-23,16,0,NEUTRAL), R:P(-19,12,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:0.42, ph:'The toe pick going in behind', hipZ:82, hipYaw:176, shYaw:160,
       sh:P(2,0,132), L:PIN(56,-24,0,55), R:P(-19,12,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:0.62, ph:'Riding past the pick, loaded against the toe', hipZ:82, hipYaw:176, shYaw:156,
       sh:P(3,0,131), L:PIN(28.9,-10.2,0,40), R:P(-19,12,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:0.72, ph:'The pick out, the toe lifting', hipZ:83, hipYaw:176, shYaw:158,
       sh:P(3,0,132), L:P(24,-12,14,0,NEUTRAL), R:P(-19,12,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:1.00, ph:'Rising onto the edge', hipZ:88, hipYaw:176, shYaw:164,
       sh:P(1,0,138), L:P(30,-14,22,0,NEUTRAL), R:P(-12,12,0,-0.5), skate:'R', edge:'O', dir:'B'},
    ]},

  /* THE GLIDES, THE DIP, THE SLALOMS AND THE TWO-FOOT CHANGE OF EDGE — 03/10/2026,
     Session 26. The basics that drew a tracing and no body. Every contact they use
     already existed: a flat (edge null), a second blade (ON), a foot leaving the ice.

     A FLAT IS WHERE THE LEAN IS LESS THAN HALF THE STANCE. On two feet the blades sit
     12 cm apart, so while the lean carries the hip less than 6 cm off their middle the
     hip is between them, and neither blade can be on an edge that leans into a circle.
     That is what lean.mjs's flat route says, so the changes of edge in the slaloms and
     the two-foot change of edge are keyed that way: the edge letter goes to null when
     the lean comes down to 6 and picks up the new edge at 6.3 the other way. The tracing
     draws the flat in neutral ink between the two coloured curves. The lean peaks at 10
     on a 150 cm slalom and 9 on the 240 cm change of edge, at the clock times where the
     path's own curvature peaks.

     THE DIP SITS THE HIP BEHIND THE FEET, for the teapot's reason: a knee bent to about
     ninety degrees with the shin inside the boot leaves the hip well behind the blades,
     and the arms go forward to balance it, as Ice Skating Australia asks.

     Verified against a coach: NO. */
  oneFootGlide: {
    name:'One-foot glide',
    note:'both blades flat, then the weight onto the left and the right foot lifted to the inside of the knee',
    path:[{kind:'line', len:300}],
    radius:300, duration:4.0,
    keys:[
      {t:0.00, ph:'Gliding on two feet', hipZ:96, hipYaw:0, shYaw:-2,
       sh:P(-2,0,148), L:P(0,-7,0,-0.5), R:ON(0,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:0.25, ph:'The weight moving over the left foot', hipZ:95, hipYaw:0, shYaw:-2,
       sh:P(-2,0,147), L:P(0,-3,0,-0.5), R:ON(0,10,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:0.45, ph:'The right foot lifting', hipZ:95, hipYaw:0, shYaw:-2,
       sh:P(-2,0,147), L:P(0,-1,0,-0.5), R:P(2,10,12,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
      {t:0.70, ph:'The free foot at the inside of the skating knee, toe down', hipZ:95, hipYaw:0, shYaw:-2,
       sh:P(-2,0,147), L:P(0,-1,0,-0.5), R:P(6,6,34), skate:'L', edge:null, dir:'F'},
      {t:1.00, ph:'Held: gliding on one foot in a straight line', hipZ:95, hipYaw:0, shYaw:-2,
       sh:P(-2,0,147), L:P(0,-1,0,-0.5), R:P(6,6,34), skate:'L', edge:null, dir:'F'},
    ]},

  oneFootGlideBack: {
    name:'Backward one-foot glide',
    note:'both blades flat, travelling backwards, then the right foot lifted to the inside of the knee',
    path:[{kind:'line', len:300}],
    radius:300, duration:4.0,
    keys:[
      {t:0.00, ph:'Gliding backwards on two feet', hipZ:96, hipYaw:180, shYaw:182,
       sh:P(-4,0,148), L:P(0,7,0,-0.5), R:ON(0,-7,0,-0.5), skate:'L', edge:null, dir:'B'},
      {t:0.25, ph:'The weight moving over the left foot', hipZ:95, hipYaw:180, shYaw:182,
       sh:P(-4,0,147), L:P(0,3,0,-0.5), R:ON(0,-10,0,-0.5), skate:'L', edge:null, dir:'B'},
      {t:0.45, ph:'The right foot lifting', hipZ:95, hipYaw:180, shYaw:182,
       sh:P(-4,0,147), L:P(0,1,0,-0.5), R:P(-2,-10,12,0,NEUTRAL), skate:'L', edge:null, dir:'B'},
      {t:0.70, ph:'The free foot at the inside of the skating knee, toe down', hipZ:95, hipYaw:180, shYaw:182,
       sh:P(-4,0,147), L:P(0,1,0,-0.5), R:P(-6,-6,34), skate:'L', edge:null, dir:'B'},
      {t:1.00, ph:'Held: gliding backwards on one foot', hipZ:95, hipYaw:180, shYaw:182,
       sh:P(-4,0,147), L:P(0,1,0,-0.5), R:P(-6,-6,34), skate:'L', edge:null, dir:'B'},
    ]},

  twoFootGlide: {
    name:'Two-foot glide',
    note:'both blades flat and parallel, about hip width apart, running straight',
    path:[{kind:'line', len:300}],
    radius:300, duration:3.6,
    keys:[
      {t:0.00, ph:'The feet coming together under the hips', hipZ:95, hipYaw:0, shYaw:-3,
       sh:P(-2,0,147), L:P(-4,-8,0,-0.5), R:ON(4,8,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:0.40, ph:'Both blades running, the weight between them', hipZ:96, hipYaw:0, shYaw:-1,
       sh:P(-1,0,148), L:P(0,-7,0,-0.5), R:ON(0,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:1.00, ph:'Held: gliding straight on two feet', hipZ:96, hipYaw:0, shYaw:0,
       sh:P(-1,0,148), L:P(0,-7,0,-0.5), R:ON(0,7,0,-0.5), skate:'L', edge:null, dir:'F'},
    ]},

  twoFootGlideBack: {
    name:'Backward two-foot glide',
    note:'both blades flat and parallel, about hip width apart, running backwards',
    path:[{kind:'line', len:300}],
    radius:300, duration:3.6,
    keys:[
      {t:0.00, ph:'The feet coming together under the hips', hipZ:95, hipYaw:180, shYaw:183,
       sh:P(-4,0,147), L:P(4,8,0,-0.5), R:ON(-4,-8,0,-0.5), skate:'L', edge:null, dir:'B'},
      {t:0.40, ph:'Both blades running backwards, the weight over the toes', hipZ:96, hipYaw:180, shYaw:181,
       sh:P(-4,0,148), L:P(0,7,0,-0.5), R:ON(0,-7,0,-0.5), skate:'L', edge:null, dir:'B'},
      {t:1.00, ph:'Held: gliding backwards on two feet', hipZ:96, hipYaw:180, shYaw:180,
       sh:P(-4,0,148), L:P(0,7,0,-0.5), R:ON(0,-7,0,-0.5), skate:'L', edge:null, dir:'B'},
    ]},

  dip: {
    name:'Dip',
    note:'a two-foot glide, sinking until the knees are bent to about ninety degrees, arms out in front',
    path:[{kind:'line', len:340}],
    radius:340, duration:4.6,
    keys:[
      {t:0.00, ph:'Gliding on two feet', hipZ:96, hipYaw:0, shYaw:0,
       sh:P(-1,0,148), L:P(0,-7,0,-0.5), R:ON(0,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {arm:[30,36,10], t:0.28, ph:'Bending both knees, the arms coming forward', hipZ:84, hipYaw:0, shYaw:0,
       sh:P(8,0,134), L:P(18,-7,0,-0.5), R:ON(18,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {arm:[22,50,6], t:0.50, ph:'Down in the dip, the arms stretched out in front', hipZ:64, hipYaw:0, shYaw:0,
       sh:P(14,0,112), L:P(30,-7,0,-0.5), R:ON(30,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {arm:[22,50,6], t:0.72, ph:'Held low, the glide carrying on', hipZ:64, hipYaw:0, shYaw:0,
       sh:P(14,0,112), L:P(30,-7,0,-0.5), R:ON(30,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:1.00, ph:'Rising again on two feet', hipZ:96, hipYaw:0, shYaw:0,
       sh:P(-1,0,148), L:P(0,-7,0,-0.5), R:ON(0,7,0,-0.5), skate:'L', edge:null, dir:'F'},
    ]},

  slalom: {
    name:'Slalom',
    note:'both blades on the ice and close together, curving side to side and changing edge together',
    path:[ {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:55,  span:1},
           {kind:'arc', foot:'L', edge:'I', dir:'F', sweep:110, span:2},
           {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:110, span:2},
           {kind:'arc', foot:'L', edge:'I', dir:'F', sweep:55,  span:1} ],
    radius:150, duration:5.0,
    keys:[
      {t:0, ph:'Leaning into the first curve, both blades on their edges', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,4,0,-0.5), R:ON(3,16,0,-0.5), skate:'L', edge:'O', dir:'F'},
      {t:0.0833, ph:'The curve running', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,4,0,-0.5), R:ON(3,16,0,-0.5), skate:'L', edge:'O', dir:'F'},
      {t:0.1167, ph:'Coming upright: both blades flat as the curve straightens', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,0,0,-0.5), R:ON(3,12,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:0.2667, ph:'Leaning the other way, both blades onto the other edges', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-12.3,0,-0.5), R:ON(3,-0.3,0,-0.5), skate:'L', edge:'I', dir:'F'},
      {t:0.3333, ph:'The second curve at its deepest', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-16,0,-0.5), R:ON(3,-4,0,-0.5), skate:'L', edge:'I', dir:'F'},
      {t:0.4, ph:'Upright again through the change', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-12,0,-0.5), R:ON(3,0,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:0.6, ph:'Onto the first edges again', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,0.3,0,-0.5), R:ON(3,12.3,0,-0.5), skate:'L', edge:'O', dir:'F'},
      {t:0.6667, ph:'The third curve at its deepest', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,4,0,-0.5), R:ON(3,16,0,-0.5), skate:'L', edge:'O', dir:'F'},
      {t:0.7333, ph:'Upright through the last change', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,0,0,-0.5), R:ON(3,12,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:0.8833, ph:'Onto the other edges for the last curve', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-12.3,0,-0.5), R:ON(3,-0.3,0,-0.5), skate:'L', edge:'I', dir:'F'},
      {t:0.9167, ph:'The last curve', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-16,0,-0.5), R:ON(3,-4,0,-0.5), skate:'L', edge:'I', dir:'F'},
      {t:1.0, ph:'Running out on the curve', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-16,0,-0.5), R:ON(3,-4,0,-0.5), skate:'L', edge:'I', dir:'F'},
    ]},

  slalomBack: {
    name:'Backward slalom',
    note:'both blades on the ice, travelling backwards, curving side to side and changing edge together',
    path:[ {kind:'arc', foot:'L', edge:'O', dir:'B', sweep:55,  span:1},
           {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:110, span:2},
           {kind:'arc', foot:'L', edge:'O', dir:'B', sweep:110, span:2},
           {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:55,  span:1} ],
    radius:150, duration:5.4,
    keys:[
      {t:0, ph:'Leaning into the first curve, both blades on their edges', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,-4,0,-0.5), R:ON(-3,-16,0,-0.5), skate:'L', edge:'O', dir:'B'},
      {t:0.0833, ph:'The curve running', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,-4,0,-0.5), R:ON(-3,-16,0,-0.5), skate:'L', edge:'O', dir:'B'},
      {t:0.1167, ph:'Coming upright: both blades flat as the curve straightens', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,0,0,-0.5), R:ON(-3,-12,0,-0.5), skate:'L', edge:null, dir:'B'},
      {t:0.2667, ph:'Leaning the other way, both blades onto the other edges', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,12.3,0,-0.5), R:ON(-3,0.3,0,-0.5), skate:'L', edge:'I', dir:'B'},
      {t:0.3333, ph:'The second curve at its deepest', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,16,0,-0.5), R:ON(-3,4,0,-0.5), skate:'L', edge:'I', dir:'B'},
      {t:0.4, ph:'Upright again through the change', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,12,0,-0.5), R:ON(-3,0,0,-0.5), skate:'L', edge:null, dir:'B'},
      {t:0.6, ph:'Onto the first edges again', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,-0.3,0,-0.5), R:ON(-3,-12.3,0,-0.5), skate:'L', edge:'O', dir:'B'},
      {t:0.6667, ph:'The third curve at its deepest', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,-4,0,-0.5), R:ON(-3,-16,0,-0.5), skate:'L', edge:'O', dir:'B'},
      {t:0.7333, ph:'Upright through the last change', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,0,0,-0.5), R:ON(-3,-12,0,-0.5), skate:'L', edge:null, dir:'B'},
      {t:0.8833, ph:'Onto the other edges for the last curve', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,12.3,0,-0.5), R:ON(-3,0.3,0,-0.5), skate:'L', edge:'I', dir:'B'},
      {t:0.9167, ph:'The last curve', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,16,0,-0.5), R:ON(-3,4,0,-0.5), skate:'L', edge:'I', dir:'B'},
      {t:1.0, ph:'Running out on the curve', hipZ:96, hipYaw:180, shYaw:175,
       sh:P(-4,0,148), L:P(3,16,0,-0.5), R:ON(-3,4,0,-0.5), skate:'L', edge:'I', dir:'B'},
    ]},

  twoFootCoe: {
    name:'Two-foot change of edge',
    note:'both blades rolling from one pair of edges through a flat onto the other, the curve reversing',
    path:[ {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:75, span:1},
           {kind:'arc', foot:'L', edge:'I', dir:'F', sweep:75, span:1} ],
    radius:240, duration:4.4,
    keys:[
      {t:0, ph:'Both blades on the first pair of edges', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,3,0,-0.5), R:ON(3,15,0,-0.5), skate:'L', edge:'O', dir:'F'},
      {t:0.25, ph:'The curve running', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,3,0,-0.5), R:ON(3,15,0,-0.5), skate:'L', edge:'O', dir:'F'},
      {t:0.333, ph:'Rolling upright: both blades flat', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,0,0,-0.5), R:ON(3,12,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:0.675, ph:'Rolled over onto the other pair of edges', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-12.3,0,-0.5), R:ON(3,-0.3,0,-0.5), skate:'L', edge:'I', dir:'F'},
      {t:0.75, ph:'The new curve, the other way', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-15,0,-0.5), R:ON(3,-3,0,-0.5), skate:'L', edge:'I', dir:'F'},
      {t:1.0, ph:'Running on the new curve', hipZ:96, hipYaw:0, shYaw:-5,
       sh:P(-2,0,148), L:P(-3,-15,0,-0.5), R:ON(3,-3,0,-0.5), skate:'L', edge:'I', dir:'F'},
    ]},


  /* THE LOOP — 03/10/2026, Session 26. Takeoff RBO, no pick, one rotation, landing
     RBO (skating.js JUMPS). Both edges are the same edge, so like the Salchow the
     tracing is one curve broken only by the flight, and the landing is the Salchow's
     and the waltz jump's, 360 degrees round.

     The Salchow's clock and air keys with the takeoff on the other foot: the right
     blade carries the skater into the jump and out of it, and the left leg is the one
     crossed in front before the takeoff and held back after the landing. In the track
     frame, facing backwards, in front is -t.

     CHECKED AGAINST COACHES' TEACHING, 04/10/2026 (the guidance, not their words): the
     free leg is crossed in front with the feet a little apart, and it stays across
     through the takeoff rather than being thrown out sideways for rotation. The keys
     already did that: crossed 14 cm past the skating foot at the bend and 20 at the rise,
     lifting rather than swinging wide. Nothing changed.

     Verified against a coach: NO. */
  loop: {
    name:'Loop',
    note:'RBO takeoff, no pick · one rotation · RBO landing',
    path:[ {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:120, span:0.48},
           {kind:'line', len:70,                                 span:0.10},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:56,  span:0.18},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:66,  span:0.24} ],
    radius:130, duration:5.4,
    keys:[
      {arm:[60,6,18], t:0.00, ph:'Gliding on the back outside edge, the free leg in front', hipZ:92, hipYaw:178, shYaw:166,
       sh:P(-2,0,144), R:P(-6.7,15,0,-0.5), L:P(-30,8,20,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.18, ph:'The edge running, the shoulders checked', hipZ:90, hipYaw:178, shYaw:170,
       sh:P(-4,0,140), R:P(-7.9,15,0,-0.5), L:P(-28,4,18,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,20], t:0.32, ph:'Skating knee bends, the free leg crossed in front', hipZ:82, hipYaw:176, shYaw:168,
       sh:P(-6,0,132), R:P(-20,16,0,-1), L:P(-30,2,16,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[50,14,18], t:0.45, ph:'Rising, the shoulders starting to turn', hipZ:92, hipYaw:192, shYaw:222,
       sh:P(-2,0,142), R:P(-10,14,0,1), L:P(-30,-4,30,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[40,20,8], t:0.475, ph:'Takeoff: the skating knee drives up', hipZ:102, hipYaw:202, shYaw:256,
       sh:P(-2,0,154), R:P(-4,8,2,1.6), L:P(-24,-2,46,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[30,16,10], t:0.49, ph:'Blade leaves the ice', hipZ:118, hipYaw:250, shYaw:290,
       sh:P(-2,0,170), R:P(-4,6,32,0,NEUTRAL), L:P(-10,-6,56,0,NEUTRAL), skate:null},
      {arm:[22,14,12], t:0.525, ph:'Peak: arms in, legs together', hipZ:130, hipYaw:390, shYaw:396,
       sh:P(0,0,182), L:P(3,-5,64,0,NEUTRAL), R:P(7,5,62,0,NEUTRAL), skate:null},
      {arm:[26,14,12], t:0.555, ph:'Descending, the landing leg reaching for the ice', hipZ:112, hipYaw:500, shYaw:492,
       sh:P(-2,0,164), L:P(16,24,46,0,NEUTRAL), R:P(4,-7,28,0,NEUTRAL), skate:null},
      {arm:[34,14,14], t:0.58, ph:'Toe of the blade touches down', hipZ:98, hipYaw:540, shYaw:522,
       sh:P(-4,0,148), L:P(38,12,26,0,NEUTRAL), R:P(-4,11,1,3,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[46,12,16], t:0.63, ph:'Rolling back along the blade', hipZ:96, hipYaw:538, shYaw:518,
       sh:P(-6,0,146), L:P(58,13,25,0,NEUTRAL), R:P(-4,15,0,1), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,18], t:0.70, ph:'Knee absorbs: deepest landing position', hipZ:84, hipYaw:536, shYaw:512,
       sh:P(-10,0,136), L:P(52,15,10,0,NEUTRAL), R:P(-15,17,0,-1), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.84, ph:'Check holds, edge running', hipZ:91, hipYaw:534, shYaw:510,
       sh:P(-8,0,143), L:P(50,15,15,0,NEUTRAL), R:P(-1.8,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:532, shYaw:518,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(1.5,15,0), skate:'R', edge:'O', dir:'B'},
    ]},

  /* THE AXEL — 03/10/2026, Session 26. The waltz jump with a full turn more in the air:
     takeoff LFO, one and a half rotations, landing RBO. The set-up, the swing and the
     whole landing are the waltz jump's keys, the landing 360 degrees further round,
     which leaves the track-frame feet where they were because the skater faces the same
     way. The air is new: between leaving the ice and opening out, the legs are held
     together under the hip, where their track-frame position does not depend on which
     way the skater faces, and the arms are pulled in, which is what lets the rotation
     run at about twice the waltz jump's rate.

     Verified against a coach: NO. */
  axel: {
    name:'Axel',
    note:'LFO takeoff · one and a half rotations · RBO landing',
    path:[ {kind:'arc',  foot:'L', edge:'O', dir:'F', sweep:99,  span:0.32},
           {kind:'line', len:90,                                 span:0.12},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:56,  span:0.20},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:66,  span:0.36} ],
    radius:130, duration:5.6,
    keys:[
      {arm:[64,10,18], t:0.00, ph:'Set-up on the forward outside edge', hipZ:96, hipYaw:-8, shYaw:-24,
       sh:P(-4,0,148), L:P(-3.7,14,0,-0.5), R:P(-49,-6,27,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[60,-2,24], t:0.14, ph:'Knee bends, edge deepens', hipZ:86, hipYaw:-6, shYaw:-20,
       sh:P(2,0,132), L:P(19,18,0,-1), R:P(-55,-5,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[54,16,18], t:0.25, ph:'Free leg swings through', hipZ:92, hipYaw:-2, shYaw:-10,
       sh:P(0,0,138), L:P(15,16,0,0.5), R:P(0,-4,10,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[50,26,6], t:0.30, ph:'Takeoff: leg and knee drive up', hipZ:100, hipYaw:8, shYaw:2,
       sh:P(-4,0,154), L:P(2,8,2,1.6), R:P(46,0,62,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[36,22,6], t:0.32, ph:'Blade leaves the ice', hipZ:118, hipYaw:26, shYaw:18,
       sh:P(-4,0,170), L:P(-12,6,30,0,NEUTRAL), R:P(40,-2,70,0,NEUTRAL), skate:null},
      {arm:[20,12,12], t:0.35, ph:'Pulling in: the legs coming together', hipZ:128, hipYaw:150, shYaw:150,
       sh:P(-2,0,180), L:P(-2,-5,58,0,NEUTRAL), R:P(4,5,64,0,NEUTRAL), skate:null},
      {arm:[18,12,12], t:0.38, ph:'Peak: arms in tight, legs together', hipZ:134, hipYaw:330, shYaw:330,
       sh:P(0,0,186), L:P(3,-5,64,0,NEUTRAL), R:P(-3,5,64,0,NEUTRAL), skate:null},
      {arm:[20,12,12], t:0.41, ph:'Still turning, starting down', hipZ:122, hipYaw:470, shYaw:466,
       sh:P(-2,0,174), L:P(4,6,52,0,NEUTRAL), R:P(-2,-4,40,0,NEUTRAL), skate:null},
      {arm:[26,14,12], t:0.425, ph:'Opening out, reaching for the ice', hipZ:112, hipYaw:518, shYaw:502,
       sh:P(-2,0,164), L:P(52,10,44,0,NEUTRAL), R:P(-2,0,24,0,NEUTRAL), skate:null},
      {arm:[34,14,14], t:0.44, ph:'Front of the blade touches down', hipZ:98, hipYaw:540, shYaw:522,
       sh:P(-4,0,148), L:P(38,12,26,0,NEUTRAL), R:P(-4,11,1,3,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[46,12,16], t:0.48, ph:'Rolling back along the blade', hipZ:96, hipYaw:538, shYaw:518,
       sh:P(-6,0,146), L:P(58,13,25,0,NEUTRAL), R:P(-4,15,0,1), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,18], t:0.55, ph:'Knee absorbs: deepest landing position', hipZ:84, hipYaw:536, shYaw:512,
       sh:P(-8,0,136), L:P(52,15,10,0,NEUTRAL), R:P(-20,17,0,-1), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.70, ph:'Check holds, edge running', hipZ:91, hipYaw:534, shYaw:510,
       sh:P(-8,0,143), L:P(50,15,15,0,NEUTRAL), R:P(-1.8,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[63,9,18], t:0.86, ph:'Rising out of the landing knee', hipZ:96, hipYaw:534, shYaw:514,
       sh:P(-6,0,148), L:P(59,14,26,0,NEUTRAL), R:P(0.7,17,0), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:532, shYaw:518,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(1.5,15,0), skate:'R', edge:'O', dir:'B'},
    ]},


  /* THE TWO-FOOT HOP — 03/10/2026, Session 26. Standing still, both knees bend, both
     blades leave the ice together and come down together where they left it, which is
     Ice Skating Australia's description. The path is a line four centimetres long,
     because the skater is not travelling and a path of no length has no direction.
     Every piece already existed: two flat blades, flight (`skate: null`), and both
     blades arriving, the waltz jump's landing on two feet at once.

     The bend puts the feet ahead of the hip, for the dip's reason: the shin stays
     inside the boot. Verified against a coach: NO. */
  twoFootHop: {
    name:'Two-foot hop',
    note:'standing still · both knees bend · both blades leave the ice and land together',
    path:[{kind:'line', len:4}],
    radius:300, duration:2.8,
    keys:[
      {t:0.00, ph:'Standing on two feet', hipZ:96, hipYaw:0, shYaw:0,
       sh:P(-1,0,148), L:P(0,-7,0,-0.5), R:ON(0,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {arm:[52,12,24], t:0.24, ph:'Bending both knees', hipZ:84, hipYaw:0, shYaw:0,
       sh:P(6,0,134), L:P(16,-7,0,-0.5), R:ON(16,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {arm:[48,18,4], t:0.36, ph:'Springing up off both feet', hipZ:98, hipYaw:0, shYaw:0,
       sh:P(0,0,150), L:P(2,-7,1,3), R:ON(2,7,1,3), skate:'L', edge:null, dir:'F'},
      {arm:[48,18,2], t:0.44, ph:'In the air, both feet together', hipZ:112, hipYaw:0, shYaw:0,
       sh:P(0,0,164), L:P(0,-7,14,0,NEUTRAL), R:P(0,7,14,0,NEUTRAL), skate:null},
      {arm:[52,14,10], t:0.52, ph:'Coming down', hipZ:104, hipYaw:0, shYaw:0,
       sh:P(0,0,156), L:P(2,-7,6,0,NEUTRAL), R:P(2,7,6,0,NEUTRAL), skate:null},
      {arm:[60,10,18], t:0.58, ph:'Landing on both feet together', hipZ:92, hipYaw:0, shYaw:0,
       sh:P(4,0,144), L:P(10,-7,0,1), R:ON(10,7,0,1), skate:'L', edge:null, dir:'F'},
      {arm:[64,8,20], t:0.74, ph:'The knees taking the landing, the arms placed', hipZ:84, hipYaw:0, shYaw:0,
       sh:P(6,0,134), L:P(16,-7,0,-0.5), R:ON(16,7,0,-0.5), skate:'L', edge:null, dir:'F'},
      {t:1.00, ph:'Standing again', hipZ:96, hipYaw:0, shYaw:0,
       sh:P(-1,0,148), L:P(0,-7,0,-0.5), R:ON(0,7,0,-0.5), skate:'L', edge:null, dir:'F'},
    ]},

  /* THE BUNNY HOP — 04/10/2026, Session 32. Gliding forward on the left, spring off it,
     land on the right toe pick and step straight through onto the left again (Ice
     Skating Australia's description; Learn to Skate USA level 6). Nothing turns.

     ITS PICK LANDS FORWARD, which no pick did before: the toe points the way the
     skater is going, heel up, and the hip passes over it while it is in. A pick that
     names a `dir` takes its direction from the tracing (alongDir in rig-math.js);
     every toe jump's pick still points back along its reach. The pick is pinned, so
     its hip-relative t falls by the path's speed (330 cm a unit of clock) between
     its keys: 6, then -7.2, then -20.4.

     THE MASS OVER THE CONTACT ON THE GLIDES, the first move written against
     tools/balance.mjs: a glide's target is the middle of the blade, so the glide keys
     hold the mass within 3 cm of the contact. The take-off and landing are dynamic and
     not held to it.

     Verified against a coach: NO. */
  bunnyHop: {
    name:'Bunny hop',
    note:'LF glide · spring off the left · land on the right toe pick · step through onto the left',
    path:[{kind:'line', len:330}],
    radius:300, duration:4.4,
    keys:[
      {t:0.00, ph:'Gliding forward on the left foot, the right extended behind', hipZ:94, hipYaw:0, shYaw:0,
       sh:P(2,0,146), L:P(0,-2,0,-0.5), R:P(-34,9,18,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
      {arm:[56,10,20], t:0.26, ph:'The skating knee bends', hipZ:86, hipYaw:0, shYaw:0,
       sh:P(14,0,135), L:P(8,-2,0,-1), R:P(-38,9,14,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
      {arm:[52,14,16], t:0.35, ph:'The right leg swings through low', hipZ:87, hipYaw:0, shYaw:0,
       sh:P(6,0,138), L:P(12,-2,0,-1), R:P(8,9,10,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
      {arm:[44,22,4], t:0.40, ph:'Springing forward off the left', hipZ:97, hipYaw:0, shYaw:0,
       sh:P(2,0,149), L:P(0,-2,1,3), R:P(36,8,36,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
      {arm:[40,22,6], t:0.44, ph:'In the air, the right leg reaching forward', hipZ:108, hipYaw:0, shYaw:0,
       sh:P(2,0,160), L:P(-28,-4,26,0,NEUTRAL), R:P(30,8,28,0,NEUTRAL), skate:null},
      {arm:[46,18,10], t:0.48, ph:'Coming down onto the right toe', hipZ:100, hipYaw:0, shYaw:0,
       sh:P(4,0,152), L:P(-30,-4,22,0,NEUTRAL), R:P(20,8,8,0,NEUTRAL), skate:null},
      {arm:[52,14,16], t:0.51, ph:'The right toe pick lands', hipZ:86, hipYaw:0, shYaw:0,
       sh:P(6,0,142), L:P(-28,-4,18,0,NEUTRAL), R:{...PIN(6,8,0,24), dir:'F'}, skate:null},
      {arm:[54,12,18], t:0.55, ph:'Over the pick, the left foot coming through', hipZ:83, hipYaw:0, shYaw:0,
       sh:P(6,0,140), L:P(12,-3,14,0,NEUTRAL), R:{...PIN(-7.2,8,0,26), dir:'F'}, skate:null},
      {arm:[56,10,20], t:0.59, ph:'Stepping onto the left, gliding again', hipZ:85, hipYaw:0, shYaw:0,
       sh:P(6,0,140), L:P(16,-2,0,-1), R:{...PIN(-20.4,8,0,24), dir:'F'}, skate:'L', edge:null, dir:'F'},
      {arm:[58,8,20], t:0.65, ph:'The pick out, the right foot lifting behind', hipZ:90, hipYaw:0, shYaw:0,
       sh:P(4,0,142), L:P(6,-2,0,-0.5), R:P(-24,9,12,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
      {t:0.82, ph:'Gliding forward on the left', hipZ:94, hipYaw:0, shYaw:0,
       sh:P(2,0,146), L:P(0,-2,0,-0.5), R:P(-34,9,18,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
      {t:1.00, ph:'Held: the glide on the take-off foot', hipZ:94, hipYaw:0, shYaw:0,
       sh:P(2,0,146), L:P(0,-2,0,-0.5), R:P(-34,9,18,0,NEUTRAL), skate:'L', edge:null, dir:'F'},
    ]},

  /* SCOOTER PUSHES — 03/10/2026, Session 26. One foot glides while the other pushes,
     three times, which is Learn to Skate USA's count. pushOff held one push at its
     widest; this is that push made, released and made again: the right blade comes down
     beside the gliding foot already turned out, drives out and back, lifts, and returns.
     Arriving on a turned blade and leaving one are both things the rig already does,
     because a foot's yaw interpolates toward the key it is arriving at.

     The glide is a gentle forward outside edge rather than a straight flat, for
     pushOff's reason: on two flat blades the pushing foot would count toward the flat's
     centroid and carry it far from under the hip, which lean.mjs rightly refuses. On an
     edge the pushing blade's edge is derived, inside, as a push is.

     WHAT IT DOES NOT DRAW is the change of feet the element ends with. That hands the
     reference blade from one foot to the other on the ice, which the rig cannot do yet.
     Verified against a coach: NO. */
  scooterPushes: {
    name:'Scooter pushes',
    note:'LFO glide · the right blade pushing three times, lifting and coming back between pushes',
    path:[{kind:'arc', foot:'L', edge:'O', dir:'F', sweep:50}],
    radius:500, duration:4.8,
    keys:[
      {t:0.0, ph:'Gliding on the left foot, the right foot beside it', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:P(0,16,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.08, ph:'The right blade down beside it, turned out', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:PUSH(-2,20,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.2, ph:'Pushing: the blade driving out and back', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.27, ph:'The foot lifting off the ice', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:P(-16,32,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.3333, ph:'Gliding on the left foot, the right foot beside it', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:P(0,16,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.4133, ph:'The right blade down beside it, turned out', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:PUSH(-2,20,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.5333, ph:'Pushing: the blade driving out and back', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.6033, ph:'The foot lifting off the ice', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:P(-16,32,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.6667, ph:'Gliding on the left foot, the right foot beside it', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:P(0,16,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:0.7467, ph:'The right blade down beside it, turned out', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:PUSH(-2,20,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.8667, ph:'Pushing: the blade driving out and back', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.9367, ph:'The foot lifting off the ice', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:P(-16,32,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {t:1, ph:'Back beside the gliding foot', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,146), L:P(2,6,0,-0.5), R:P(0,16,8,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
    ]},

};

/* ONE ASYMMETRIC POSE, authored deliberately — 29/08/2026, Martyn's call.

   A spiral is held against a checked shoulder line, and the arms are what hold
   it: the left comes across the body and the right reaches back. From behind,
   the left forearm crosses the chest while the right upper arm passes behind it
   — two segments of two different arms, on two sides of the torso, in one frame.
   That is the case a fixed L,R draw order cannot state, and the spiral is where
   it shows: its rear view already has limbs overlapping in 73 frames of 81.

   It shares the spiral's legs rather than restating them — same path, same keys,
   different hands — so the two cannot drift apart. verified: false, like every
   pose in this file. What it demonstrates is that the renderer can be honest
   about such a pose, not that these particular numbers are right. */
const sameLegs = m => ({ ...m, keys: m.keys.map(k => {
  const o = { ...k };
  for (const f of ['sh','L','R','LH','RH']) if (o[f]) o[f] = { ...o[f] };
  return o;
}) });

/* HALF-SWIZZLE PUMPS — 04/10/2026, Session 32. On a circle the inside foot glides and
   holds the curve while the outside foot makes half a swizzle, out and back, over and
   over (Ice Skating Australia six to eight; Learn to Skate USA four to six). The
   pushing blade never leaves the ice: it is set down beside the gliding foot turned
   out, presses out and back on its inside edge, turns its toe in at the widest point
   and draws back in. Four pumps here.

   WHAT drawn.mjs SAID AGAINST IT WAS STALE: "the pushing blade is angled across the
   circle" is a yaw, and the yaw went in on 19/09/2026 (PUSH). What it does not draw yet
   is the pushing blade's own line on the ice, the lemon-shaped scallops outside the
   circle; the tracing is the gliding blade's. That is the second tracing, specified in
   docs/model.md and built after this.

   The gliding blade is the reference, as scooterPushes's is, and for its reason: on
   an edge, the pushing blade's edge is derived (inside), which is what a push is.

   Verified against a coach: NO. */
const HZ = 93;
const pumpKeys = (dir) => {
  const B = dir === 'B', N = 4, out = [];
  /* Facing backwards the skater's right is -n, and a heel-first push turns the blade
     the other way about the vertical. The push still drives the blade away from the
     circle and against the travel, which is behind the body going forwards and in
     front of it going backwards, so the foot positions are not a mirror of each other
     in the body's frame: knees bend toward where the skater faces. */
  const side = B ? -1 : 1, yawOut = B ? 20 : -30, yawIn = B ? -18 : 18;
  const T = B ? [-6, -14, -12, -8] : [0, -8, -2, 6];
  const base = { hipZ: HZ, hipYaw: B ? 180 : 0, shYaw: B ? 184 : -4, sh: P(B ? -6 : 6, 0, HZ + 51),
                 skate: 'L', edge: 'O', dir };
  const L = P(B ? -2 : 2, side * 6, 0, -0.5);
  const beside = R => ({ ...base, L, R });
  const at = (c, i) => (i + c) / N;
  for (let i = 0; i < N; i++) {
    out.push({ ...beside(PUSH(T[0], side * 18, 0, yawOut)), t: at(0, i), arm: [56, 10, 20],
      ph: i ? 'Back beside the gliding foot, turned out again' : 'The right blade beside the gliding foot, turned out' });
    out.push({ ...beside(PUSH(T[1], side * 34, 0, yawOut)), t: at(0.45, i), arm: [56, 10, 20],
      ph: 'Pressing out on the inside edge, against the travel' });
    out.push({ ...beside(PUSH(T[2], side * 34, 0, B ? -4 : 4)), t: at(0.6, i), arm: [56, 10, 20],
      ph: 'At the widest, the toe turning in' });
    out.push({ ...beside(PUSH(T[3], side * 20, 0, yawIn)), t: at(0.85, i), arm: [56, 10, 20],
      ph: 'Drawing back in toward the gliding foot' });
  }
  out.push({ ...beside(PUSH(T[0], side * 18, 0, yawOut)), t: 1, arm: [56, 10, 20], ph: 'Held: beside the gliding foot' });
  return out;
};
MOVES.halfSwizzlePumps = {
  name:'Half-swizzle pumps',
  note:'LFO glide on the circle · the right blade pressing out and drawing in, four times, never leaving the ice',
  path:[{kind:'arc', foot:'L', edge:'O', dir:'F', sweep:110}],
  radius:300, duration:6.0, keys: pumpKeys('F'),
};
MOVES.halfSwizzlePumpsBack = {
  name:'Backward half-swizzle pumps',
  note:'LBO glide on the circle · the right blade pressing out and drawing in, four times, travelling backwards',
  path:[{kind:'arc', foot:'L', edge:'O', dir:'B', sweep:100}],
  radius:300, duration:6.4, keys: pumpKeys('B'),
};

/* THE SWIZZLES — 04/10/2026, Session 33. Both blades stay on the ice and draw a lemon:
   heels together and toes out, the feet pressed apart on their inside edges, the toes
   turned in at the widest and the feet drawn back until they meet (Ice Skating
   Australia; Learn to Skate USA Basic 1 forwards and Basic 2 backwards, six to eight in
   a row). Backwards it is toes together and heels apart, the same lemon the other way
   along. Four here.

   EACH BLADE RUNS ITS OWN HALF OF THE LEMON, curving the other way from its partner:
   LFI and RFI together, which secondFoot was written to refuse because two blades on
   one circle cannot be on two inside edges. So the right blade has its own path
   (`tracks`, rig-math.js, *a second blade on its own circle*), the mirror of the
   left's, and its edge comes out of its own segment.

   THE POINTED ENDS ARE PIVOTS. Where the feet meet, the toes come round from in to out
   (backwards, the heels do) with the feet together, and a blade that turns without
   travelling is flat and turning where it stands: a `pivot` segment, which draws the
   lemon's point. The skater does not stop there: the body carries on over the feet,
   so for that ninth of each swizzle the feet run back under the hip, as marching's
   standing blade does.

   Every key is computed from one construction below, so the keys, the reference path
   and the right blade's track are three readings of one lemon. The body faces down the
   line throughout, so hipYaw is the left blade's heading read back: the feet turn out
   and in under a pelvis that does not.

   Verified against a coach: partly, 04/10/2026, Session 34. Public teaching pages agree
   on the shape: heels together to start, the feet pressed out on inside edges, the toes
   brought in until they meet, and a warning against opening so wide the feet run away.
   None gives a number. About a metre long per lemon sits inside a coach's practice square
   of about a metre and inside Australia's "a metre or more" for three to five at the first
   level; 37 cm between the blades at the widest is under shoulder width. The size and how
   fast the toes come round stay choices, and nothing found contradicts them. */
const swizzleMove = (dir) => {
  const s = dir === 'F' ? 1 : -1, B = dir === 'B';
  const A = 30, Rr = 100, G = 5, NSW = 4, ARC = 8, PIV = 1;
  const a = A * Math.PI / 180, c = 2 * Rr * Math.sin(a);
  const units = NSW * ARC + (NSW - 1) * PIV, HZ = B ? 93 : 92;
  const sweep = 2 * A;
  const path = [], track = [];
  for (let j = 0; j < NSW; j++) {
    path.push({kind:'arc', foot:'L', edge:'I', dir, sweep, span:ARC});
    track.push({kind:'arc', foot:'R', edge:'I', dir, sweep, span:ARC});
    if (j < NSW - 1) {
      path.push({kind:'pivot', foot:'L', dir, sweep: s * sweep, span:PIV});
      track.push({kind:'pivot', foot:'R', dir, sweep: -s * sweep, span:PIV});
    }
  }
  /* The left blade in the world at clock unit u: x along the line of travel, y to the
     right of it, th its heading (clockwise +, as buildPath has it). */
  const footAt = u => {
    const j = Math.min(NSW - 1, Math.floor(u / (ARC + PIV)));
    const r = u - j * (ARC + PIV), x0 = j * c;
    if (r >= ARC) { const v = (r - ARC) / PIV;
      return { x: x0 + c, y: -s * G, th: s * a - s * 2 * a * v * v * (3 - 2 * v), piv: true }; }
    const th = -s * a + s * 2 * a * (r / ARC);
    return { x: x0 + Rr * (Math.sin(s * th) - Math.sin(-a)),
             y: -s * G - s * Rr * (Math.cos(th) - Math.cos(a)), th, piv: false };
  };
  /* One lemon per swizzle; the hip 4 cm back toward the heels from centred over the feet,
     which puts the mass over the middle of the blades (npm run balance). */
  const speed = c / (ARC + PIV), lead = c / 2 - speed * ARC / 2 - s * 4;
  const keys = [];
  for (let u = 0; u <= units + 1e-9; u++) {
    const f = footAt(u), hx = speed * u + lead;
    const dx = f.x - hx, T = [Math.cos(f.th), Math.sin(f.th)], N = [-Math.sin(f.th), Math.cos(f.th)];
    const at = (x, y) => ({ t: +(x * T[0] + y * T[1]).toFixed(2), n: +(x * N[0] + y * N[1]).toFixed(2) });
    const l = at(dx, f.y), r = at(dx, -f.y), deg = f.th * 180 / Math.PI;
    const last = u >= units;
    const ph = u === 0 ? (B ? 'Toes together, heels apart, both blades on the ice' : 'Heels together, toes out, both blades on the ice')
      : last ? 'Held: the feet together at the end of the swizzle'
      : f.piv ? (B ? 'The feet together, the heels coming round to open again' : 'The feet together, the toes coming round to open again')
      : (u % (ARC + PIV)) < ARC / 2 ? (B ? 'Pressing the heels apart on the inside edges' : 'Pressing the feet apart on the inside edges')
      : (B ? 'Past the widest, drawing the heels back together' : 'Past the widest, the toes turning in and the feet drawing together');
    keys.push({ t: +(u / units).toFixed(6), ph, arm: [56, 10, 20],
      hipZ: HZ, hipYaw: +((B ? 180 : 0) + deg).toFixed(2), shYaw: +((B ? 180 : 0) + deg).toFixed(2),
      sh: P(s * 4, 0, HZ + 52),
      L: P(l.t, l.n, 0, -0.5), R: PUSH(r.t, r.n, 0, +(2 * deg).toFixed(2), -0.5),
      skate: 'L', edge: f.piv && !last ? null : 'I', dir });
  }
  return { path, radius: Rr, frames: units * 15, keys, heading: s * A,
           tracks: [{ foot: 'R', from: 0, to: 1, path: track, radius: Rr }] };
};
MOVES.swizzle = {
  name: 'Swizzle',
  note: 'both blades on the ice, pressed apart on their inside edges and drawn back together, four times',
  duration: 4.8, ...swizzleMove('F'),
};
MOVES.swizzleBack = {
  name: 'Backward swizzle',
  note: 'both blades on the ice travelling backwards, the heels pressed apart and drawn back together, four times',
  duration: 5.2, ...swizzleMove('B'),
};

/* BACKWARD WIGGLES — 04/10/2026, Session 33. Both blades on the ice, travelling backwards
   in a zigzag, the feet swinging from side to side under the skater while the upper body
   twists against them and the head and arms stay where they are (Ice Skating Australia:
   about a metre in six; New Zealand's KiwiSkate: the skater's height in four zigzags).

   drawn.mjs EXCUSED IT AS A SWIZZLE, "both blades zigzag on their own lines, curving
   opposite ways". The guide's own page says otherwise, and so do all three programmes'
   words: the feet swing to the same side together, which is the backward slalom's two
   blades on one curve, made small and quick, with the twist added. So it needs no track:
   the second blade shares the reference's circle and secondFoot derives its edge, as on
   the slalom. The edges change through a flat where the lean comes back under half the
   stance, keyed as the slaloms are.

   THE TWIST is the shoulders held square to the line of travel while the path, and the
   hips and feet with it, swing about 20° either way. hipYaw follows the path; shYaw is
   the path's own heading read back (buildPath, at each key's time), so the shoulders do
   not turn in the world.

   Verified against a coach: the feet, 04/10/2026, Session 34. A coach's public lesson
   spells it out: the feet parallel and hip-width apart, the skater turning side to side
   from the hips with the arms working against them, the backward version of forward
   wiggles. So the feet do curve together, as drawn. The coach has the arms moving against
   the hips where Australia keeps the head and arms in place; the shoulders held still in
   the world while the hips swing is both at once, and is kept. */
const wigglesMove = () => {
  const R = 35, path = [{kind:'arc', foot:'L', edge:'O', dir:'B', sweep:20, span:1}];
  for (let i = 0; i < 5; i++)
    path.push({kind:'arc', foot:'L', edge: i % 2 ? 'O' : 'I', dir:'B', sweep:40, span:2});
  path.push({kind:'arc', foot:'L', edge:'I', dir:'B', sweep:20, span:1});
  const units = 12, shape = buildPath({ path, radius: R });
  const mean = shape.reduce((a, p) => a + p.th, 0) / shape.length;
  const dev = t => (shape[Math.round(t * (shape.length - 1))].th - mean) * 180 / Math.PI;
  const HZ = 94;
  /* The slalom's stance, from slalomBack, set 3 cm further toward the heels so that the
     mass is over the middle of the blades (npm run balance read 4 cm toward the toes): on the O lobes both feet to the skater's right
     of the track's centre, on the I lobes to the left, 12 cm apart. */
  const feet = { O: [P(0,-4,0,-0.5), ON(-6,-16,0,-0.5)], I: [P(0,16,0,-0.5), ON(-6,4,0,-0.5)],
                 toI: [P(0,0,0,-0.5), ON(-6,-12,0,-0.5)], inI: [P(0,12.3,0,-0.5), ON(-6,0.3,0,-0.5)],
                 toO: [P(0,12,0,-0.5), ON(-6,0,0,-0.5)], inO: [P(0,-0.3,0,-0.5), ON(-6,-12.3,0,-0.5)] };
  const key = (u, f, edge, ph) => { const t = +(u / units).toFixed(5);
    return { t, ph, hipZ: HZ, hipYaw: 180, shYaw: +(180 + dev(t)).toFixed(2), arm: [70, 10, 10],
             sh: P(-3, 0, HZ + 52), L: f[0], R: f[1], skate: 'L', edge, dir: 'B' }; };
  const keys = [key(0, feet.O, 'O', 'Feet together, swinging to one side, travelling backwards')];
  let u = 0.5, edge = 'O';
  keys.push(key(u, feet.O, 'O', 'The heels swung out, the shoulders still'));
  for (let b = 1; b <= 11; b += 2) {
    const next = edge === 'O' ? 'I' : 'O';
    keys.push(key(b - 0.3, edge === 'O' ? feet.toI : feet.toO, null, 'Coming upright, both blades flat, the feet swinging across'));
    keys.push(key(b + 0.6, edge === 'O' ? feet.inI : feet.inO, next, 'The feet swung to the other side, the hips twisting under the shoulders'));
    if (b < 11) keys.push(key(b + 1, next === 'I' ? feet.I : feet.O, next, 'The wiggle at its widest'));
    edge = next;
  }
  keys.push(key(12, feet[edge], edge, 'Running out, feet together'));
  return { path, radius: R, keys };
};
MOVES.backwardWiggles = {
  name: 'Backward wiggles',
  note: 'both blades on the ice, travelling backwards, the feet swinging side to side together under still shoulders',
  duration: 4.4, ...wigglesMove(),
};

/* POWER CHANGE OF EDGE PULLS — 04/10/2026, Session 33. One foot down the rink, inside
   edge to outside and back, each change of edge a pull: the knee bends into the curve and
   drives through the change (U.S. Figure Skating Pre-Bronze, focus power). Forwards on the
   left foot, six lobes; the second length (backwards, after a change of feet) is the same
   movement the other way round and is not drawn.

   It is the two-foot change of edge on one foot, and keyed as the slaloms are: the edge
   letter goes to null where the lean brings the blade back under the hip, and the next
   edge picks up on the other side. On one foot there is no stance to straddle, so the
   flat is the hip over the blade (lean.mjs's flat route, within BOOT_HALF_W), and on an
   edge the blade is out from under the hip on the outside of the lobe, 7 cm here.

   Verified against a coach: NO. */
const pullsMove = () => {
  const path = [{kind:'arc', foot:'L', edge:'I', dir:'F', sweep:30, span:1}];
  for (let i = 0; i < 4; i++) path.push({kind:'arc', foot:'L', edge: i % 2 ? 'I' : 'O', dir:'F', sweep:60, span:2});
  path.push({kind:'arc', foot:'L', edge:'O', dir:'F', sweep:30, span:1});
  const units = 10, side = { I: -7, O: 7 };
  const free = P(-6, 9, 20, 0, NEUTRAL);
  const key = (u, edge, n, hipZ, ph) => ({ t: +(u / units).toFixed(5), ph, hipZ, hipYaw: 0, shYaw: edge === 'O' ? 6 : edge === 'I' ? -6 : 0,
    arm: [62, 8, 16], sh: P(2, 0, hipZ + 53), L: P(4.5, n, 0, -0.5), R: free, skate: 'L', edge, dir: 'F' });
  const keys = [key(0, 'I', side.I, 90, 'Pressing into the inside edge, the knee bent')];
  let edge = 'I';
  keys.push(key(0.5, 'I', side.I, 89, 'The inside edge at its deepest'));
  for (let b = 1; b <= 9; b += 2) {
    const next = edge === 'I' ? 'O' : 'I';
    keys.push(key(b - 0.3, null, 0, 94, 'Rising through the change, the blade flat under the hip'));
    keys.push(key(b + 0.4, next, side[next], 92, next === 'O' ? 'Driving onto the outside edge' : 'Driving onto the inside edge'));
    if (b < 9) keys.push(key(b + 1, next, side[next], 89, 'Knee bent into the curve, the pull'));
    edge = next;
  }
  keys.push(key(10, edge, side[edge], 91, 'Running out on the edge'));
  return { path, radius: 260, keys };
};
MOVES.powerCoePulls = {
  name: 'Power change of edge pulls',
  note: 'LFI and LFO alternating down a straight, each change a pull from the knee · forwards, one foot',
  duration: 6.0, ...pullsMove(),
};

/* THE HALF JUMPS — 04/10/2026, Session 33: the half flip and the tap toe jump. Both, in
   Ice Skating Australia's words, take off from a back edge with the other foot's toe pick,
   turn half way in the air, land on the toe of the foot that did NOT pick and then put the
   picking foot down going forwards. One construction draws both; they differ in the edge
   they leave from and in which way the turn goes relative to the pick, and for a skater
   who turns anticlockwise both of those come out of which foot picks:

     half flip      from LBI, right pick, turning away from it   (lands left toe, steps RFI)
     tap toe jump   from RBO, left pick, turning toward it       (lands right toe, pushes LFO)

   Both turns are anticlockwise, so the same hip numbers serve both. The tap toe jump's edge
   is left to the skater in Australia's text; the back outside edge is this guide's choice,
   the one the toe loop leaves from. The half flip's three turn after the step is its own
   page and is not drawn here, nor is the tap toe jump's run of steps after the push.

   THE TAKE-OFF PICK is the toe loop's: pinned, reaching back as far as the leg goes, toe
   back toward the skater. THE LANDING PICK is the bunny hop's: pinned, pointing along the
   travel (dir F, the skater now facing forwards), the hip passing over it. Each pinned
   run's later keys are read back off the pin (pinnedAt) rather than written by hand, so
   they say where the foot is and continuity.mjs holds them to it.

   Verified against a coach: NO. */
const halfJump = ({ name, note, skate, edge, step, stepEdge }) => {
  const pick = skate === 'L' ? 'R' : 'L';
  const path = [{kind:'arc', foot:skate, edge, dir:'B', sweep:50, span:0.40},
                {kind:'line', len:70, span:0.22},
                {kind:'arc', foot:pick, edge:stepEdge, dir:'F', sweep:40, span:0.38}];
  const F = (t, n, z) => P(t, n, z, 0, NEUTRAL);
  const k = (t, ph, hipZ, hipYaw, shYaw, sh, feet, ref, arm) =>
    ({ t, ph, hipZ, hipYaw, shYaw, sh, arm, [skate]: feet[0], [pick]: feet[1], ...ref });
  const onT = { skate, edge, dir:'B' }, air = { skate:null }, onS = { skate:pick, edge:stepEdge, dir:'F' };
  const draft = { name, note, path, radius:150, duration:3.6, keys:[
    k(0.00, `Gliding on the back ${edge === 'I' ? 'inside' : 'outside'} edge`, 94, 180, 176, P(-2,0,146),
      [P(-1,14,0,-0.5), F(30,6,18)], onT, [60,6,18]),
    k(0.18, 'Skating knee bends, the free leg reaching back', 88, 180, 180, P(-16,0,134),
      [P(-5,15,0,-1), F(48,6,12)], onT, [58,10,20]),
    k(0.27, 'The toe pick goes in behind', 89, 180, 186, P(-16,0,136),
      [P(-5,15,0,-0.5), {...PIN(48,6,0,48), yaw:20}], onT, [54,12,19]),
    k(0.36, 'Vaulting off the pick, the turn starting', 96, 214, 240, P(-2,0,150),
      [P(-4,10,2,3), {...PIN(0,0,0,40), yaw:30}], onT, [40,20,8]),
    k(0.40, 'In the air, turning half way', 112, 260, 290, P(0,0,166),
      [F(0,6,26), F(4,4,28)], air, [32,16,10]),
    k(0.48, 'Coming down, facing forwards', 104, 340, 352, P(0,0,156),
      [F(6,8,10), F(-2,0,24)], air, [44,16,14]),
    k(0.53, `The ${skate === 'L' ? 'left' : 'right'} toe pick lands first`, 88, 360, 360, P(4,0,142),
      [{...PIN(6,8,0,24), dir:'F'}, F(-6,0,18)], air, [52,14,16]),
    k(0.58, `Over the pick, the ${pick === 'L' ? 'left' : 'right'} foot coming down`, 85, 360, 360, P(4,0,140),
      [{...PIN(0,0,0,26), dir:'F'}, F(6,10,8)], air, [54,12,18]),
    k(0.62, `Onto the ${pick === 'L' ? 'left' : 'right'} blade going forwards`, 91, 360, 360, P(4,0,142),
      [{...PIN(0,0,0,24), dir:'F'}, P(2,14,0,-1)], onS, [56,10,20]),
    k(0.70, 'The pick out, the free foot lifting behind', 90, 360, 360, P(2,0,142),
      [F(-24,6,12), P(2,14,0,-0.5)], onS, [58,8,20]),
    k(1.00, `Gliding on the forward ${stepEdge === 'I' ? 'inside' : 'outside'} edge`, 94, 360, 360, P(2,0,146),
      [F(-34,6,18), P(0,14,0,-0.5)], onS, [60,8,20]),
  ]};
  /* The pinned runs' later keys read back off their pins. */
  const keys = draft.keys.map(x => ({ ...x }));
  /* The hands are filled in by the loop at the foot of this file, after this runs, and
     poseFree interpolates them; stand-ins here, since only the feet place the path. */
  const probe = { ...draft, keys: draft.keys.map(x => ({ ...x, LH: x.sh, RH: x.sh })) };
  for (const r of pinRuns(probe)) for (let i = r.keys[0] + 1; i <= r.keys[1]; i++) {
    const at = pinnedAt(r, keys[i].t);
    keys[i] = { ...keys[i], [r.foot]: { ...keys[i][r.foot], t: +at.t.toFixed(2), n: +at.n.toFixed(2) } };
  }
  return { ...draft, keys };
};
MOVES.halfFlip = halfJump({ name:'Half flip',
  note:'LBI · right toe pick · half turn away from it · left toe lands · step forwards onto RFI',
  skate:'L', edge:'I', stepEdge:'I' });
MOVES.tapToeJump = halfJump({ name:'Tap toe jump',
  note:'RBO · left toe pick · half turn toward it · right toe lands · push off onto LFO',
  skate:'R', edge:'O', stepEdge:'O' });

/* MARCHING — 04/10/2026, Session 32. Walking on the ice, each foot lifted clear in turn
   (Ice Skating Australia: eight to ten steps, every foot lifted). Four steps here,
   left first.

   drawn.mjs SAID THE RIG DRAWS NO STEPPING, and since Session 30 that was stale: a free
   blade can be set down beside the gliding one and the reference handed over on the ice
   (pushOffT). What makes it a walk rather than a glide is that the standing blade runs
   BACKWARDS under the hip, from 10 cm ahead to 10 behind, while it glides only 6 cm
   along the ice. The path is that blade's tracing and the hip is hung off it by the
   blade's own offset (buildPath), so the hip covers 26 cm a step and the blade 6:
   which is what a beginner's march looks like, a short slide under each step.

   Flat blades and straight feet. A reference blade cannot be turned off its own line
   without skidding (turnout.mjs), so the march's small V of the toes is not drawn; the
   standing foot sits close under the hip, because a flat is a blade with the hip over
   it (lean.mjs). The knees lift high, as KiwiSkate teaches it.

   Verified against a coach: NO. */
const marchKeys = () => {
  const N = 4, out = [], G = 6;                    // G: cm the standing blade glides a step
  const nOf = { L: -4, R: 4 }, nFree = { L: -9, R: 9 };
  const pose = (S, extra) => ({ hipZ: 94, hipYaw: 0, shYaw: 0, sh: P(3, 0, 146),
                                skate: S, edge: null, dir: 'F', arm: [62, 8, 20], ...extra });
  for (let i = 0; i < N; i++) {
    const S = i % 2 ? 'R' : 'L', O = S === 'L' ? 'R' : 'L', b = i / N, p = 1 / N;
    const st = t => (S === 'L' ? { L: P(t, nOf.L, 0, -0.5) } : { R: P(t, nOf.R, 0, -0.5) });
    const f = q => ({ [O]: q });
    out.push({ ...pose(S, { ...st(10), ...f(ON(-10, nOf[O], 0, -0.5)) }), t: +b.toFixed(4),
      ph: i ? `The weight onto the ${S === 'L' ? 'left' : 'right'} foot` : 'Standing on both feet, the weight going onto the left' });
    out.push({ ...pose(S, { ...st(7), ...f(P(-12, nFree[O], 7, 0, NEUTRAL)) }), t: +(b + 0.14 * p).toFixed(4),
      ph: `The ${O === 'L' ? 'left' : 'right'} foot lifting clear` });
    out.push({ ...pose(S, { ...st(0), ...f(P(2, nFree[O], 24, 0, NEUTRAL)), hipZ: 95 }), t: +(b + 0.5 * p).toFixed(4),
      ph: 'The knee up, the foot passing under it' });
    out.push({ ...pose(S, { ...st(-7), ...f(P(10, nFree[O], 7, 0, NEUTRAL)) }), t: +(b + 0.84 * p).toFixed(4),
      ph: 'Reaching forward to step' });
    out.push({ ...pose(S, { ...st(-9.5), ...f(ON(10.5, nOf[O], 0, -0.5)) }), t: +(b + 0.96 * p).toFixed(4),
      ph: `The ${O === 'L' ? 'left' : 'right'} blade down ahead` });
  }
  out.push({ hipZ: 95, hipYaw: 0, shYaw: 0, sh: P(2, 0, 147), arm: [62, 8, 20], t: 1,
    L: ON(0, -7, 0, -0.5), R: P(0, 7, 0, -0.5), skate: 'R', edge: null, dir: 'F',
    ph: 'Both feet together, ready to glide' });
  return { keys: out, len: N * G };
};
{
  const m = marchKeys();
  MOVES.marching = {
    name:'Marching',
    note:'four steps on flat blades, each foot lifted clear, the standing blade sliding a little under each',
    path:[{kind:'line', len:m.len}],
    radius:300, duration:4.8, keys:m.keys,
  };
}

/* THE PIVOT — 04/10/2026, Session 32. One toe pick set in the ice at the centre while the
   other foot goes round it on a forward inside edge, one and a quarter turns (Ice Skating
   Australia: one to two, no pumping, the anchored foot's heel pointing at the foot going
   round). The right pick is pinned at the centre of the left blade's circle, so its
   hip-relative position holds while the hip orbits it.

   A COMPASS, AND THE BOOT DECIDED WHICH WAY ROUND. The first draft put the hip between
   the feet with the anchor leg reaching out to the pick; freefoot.mjs read 62 degrees
   between shin and boot, because a boot square to a shin tilted outward points its toe
   outward and UP, and the heel-toward-the-circling-foot Australia asks for then needs
   a pointed foot no skating boot allows. With the hip over the pick (the anchor leg
   bent under the body, the skating leg out to the circle) the anchor shin is near
   upright, and a toe pitched 24 degrees into the ice with its heel toward the circling
   foot is inside the boot's 30. The pick names a `dir` and a yaw a quarter turn off the
   tracing (alongDir, since the bunny hop).

   The circle is small, 38 cm, and the skating foot 18 cm ahead of the hip, because the
   skating leg out to the side leans its shin across its boot (shin.mjs) and a wider
   circle needs a wider stance. The pelvis opens 45 degrees toward the centre, splitting
   the turnout between the feet. Entered and left along short straights, so it is not
   read as a spin; one and a quarter turns because continuity.mjs caps how fast the rate
   of turn may change entering a 38 cm circle. Verified against a coach: NO. */
{
  const R = 38, X = 30, LT = 18, SWEEP = 450;               // blade circle, blade's offset from the hip
  const arc = R * Math.PI * SWEEP / 180, total = 60 + arc + 60;
  const t0 = +(60 / total).toFixed(5), t1 = +((60 + arc) / total).toFixed(5);
  const base = { hipZ: 86, hipYaw: -45, shYaw: -40, sh: P(4, 0, 137), skate: 'L', edge: 'I', dir: 'F',
                 L: P(LT, -X, 0, -0.5) };
  const pin = { ...PIN(LT, R - X, 0, 24), dir: 'F', yaw: -90 };
  const k = (t, ph, R_, extra = {}) => ({ ...base, t, ph, R: R_, ...extra });
  MOVES.pivot = {
    name:'Pivot',
    note:'the right toe pick fixed at the centre · the left foot round it on a forward inside edge, one and a quarter turns',
    path:[ {kind:'line', len:60, span:60},
           {kind:'arc', foot:'L', edge:'I', dir:'F', sweep:SWEEP, radius:R, span:arc},
           {kind:'line', len:60, span:60} ],
    radius:R, duration:5.6,
    keys:[
      k(0, 'Gliding in on the left inside edge, the right foot coming under the hip', P(-6, 12, 12, 0, NEUTRAL), { arm: [60, 10, 18] }),
      k(t0, 'The right toe pick goes in at the centre', pin, { arm: [56, 10, 18] }),
      k(0.35, 'Round the pick on the forward inside edge', pin, { arm: [54, 10, 18] }),
      k(0.65, 'The heel of the anchored foot pointing at the circling foot', pin, { arm: [54, 10, 18] }),
      k(t1, 'The last half turn', pin, { arm: [56, 10, 18] }),
      k(0.96, 'The pick out, the right foot lifting', P(-4, 10, 12, 0, NEUTRAL), { arm: [60, 10, 18] }),
      k(1, 'Gliding out on the left', P(-14, 14, 12, 0, NEUTRAL), { arm: [62, 10, 18] }),
    ],
  };
}

MOVES.spiralCheck = sameLegs(MOVES.spiral);
MOVES.spiralCheck.name = 'Spiral, arms checked';
MOVES.spiralCheck.note = 'held position · free leg at or above hip height · left arm across, right arm back';
/* Hands authored absolutely, hip-relative, exactly as sh / L / R are. The held
   key is the one that matters; the two before it lead into it so the crossing is
   not a jump cut. z sits a little below the shoulder in both, because a checked
   arm is carried down and across rather than lifted. */
const CHECKED_HANDS = [
  /* t (along track, + forward), n (+ the skater's right), z */
  { LH: PH( 28,  14, 118), RH: PH(-46, -20, 126) },
  { LH: PH( 34,  16, 112), RH: PH(-58, -22, 120) },
  { LH: PH( 38,  17, 108), RH: PH(-64, -22, 116) },
];
MOVES.spiralCheck.keys.forEach((k, i) => { k.LH = CHECKED_HANDS[i].LH; k.RH = CHECKED_HANDS[i].RH; });

/* Arms default to a natural carriage derived from the shoulder line, so every
   move has plausible arms without authoring four more numbers per keyframe.
   Any key may override with LH / RH. Least-verified part of the rig.

   IT DID NOT, until 29/08/2026. This loop assigned k[w+'H'] unconditionally for
   every key of every move, so an authored hand was computed, stored, and then
   overwritten before anything read it. Nothing failed and no checker looked —
   the same shape as the featured filter that absorbed the twizzles: a comment
   describing an intention the code contradicts, and it would have shipped. The
   fix is the one guard below; tools/arms.mjs asserts it. */
/* THE RIGHT-FOOT TURNS, by reflection. Before the carriage loop below, so their default
   hands are computed from their own mirrored shoulders. */
Object.assign(MOVES, {
  rfoThree:   mirrorMove(MOVES.threeTurn, 'Right forward outside three turn',
    'RFO · the blade turning half a circle on its edge, the cusp in the tracing · RBI'),
  rfiThree:   mirrorMove(MOVES.lfiThree, 'Right forward inside three turn',
    'RFI · the blade turning half a circle on its edge, the cusp in the tracing · RBO'),
  rboThree:   mirrorMove(MOVES.lboThree, 'Right back outside three turn',
    'RBO · the blade turning half a circle on its edge, the cusp in the tracing · RFI'),
  rbiThree:   mirrorMove(MOVES.lbiThree, 'Right back inside three turn',
    'RBI · the blade turning half a circle on its edge, the cusp in the tracing · RFO'),
  rfoBracket: mirrorMove(MOVES.lfoBracket, 'Right forward outside bracket',
    'RFO · the blade turning half a circle against the curve, the cusp pointing out · RBI'),
  rfiBracket: mirrorMove(MOVES.lfiBracket, 'Right forward inside bracket',
    'RFI · the blade turning half a circle against the curve, the cusp pointing out · RBO'),
  rboBracket: mirrorMove(MOVES.lboBracket, 'Right back outside bracket',
    'RBO · the blade turning half a circle against the curve, the cusp pointing out · RFI'),
  rbiBracket: mirrorMove(MOVES.lbiBracket, 'Right back inside bracket',
    'RBI · the blade turning half a circle against the curve, the cusp pointing out · RFO'),
});

/* THE DOUBLES, by adding a turn in the air — 04/10/2026, Martyn: doubles next, the
   first item on docs/roadmap.md. A double is its single with one more rotation and
   nothing else: the same entry, the same takeoff, the same landing on the same back
   outside edge. So it is derived, the way the right-foot turns are, and cannot drift
   from the single it is built on.

   The extra 360 degrees go where a skater finds them, in the part of the flight
   between leaving the ice and opening out. Three rules, and they are the whole
   derivation:
   - every key up to the one where the blade leaves the ice is untouched;
   - every key from touchdown on is the single's key a turn further round, which
     leaves its track-frame feet where they were because the skater faces the same way;
   - an air key within OPEN degrees of touchdown keeps its distance from the landing,
     so the opening out and the reach for the ice are the single's; every air key
     before that takes a share of the extra turn (see `spread`). The legs are together
     and under the hip there, where their track-frame position does not depend on
     which way the skater faces.
   THE FLIGHT IS AIR TIMES AS LONG, in time and in distance, so the skater's speed across
   the ice does not change at the takeoff or the landing and the body turns about as
   far in each frame as the single's does. A real double spends only a little longer
   in the air than a single and turns much faster; drawn at the single's time it turned
   up to 65 degrees between two frames, and continuity.mjs's bound of 30 is what a
   reader's eye can follow. At 3 the doubles turn at most 22 to 28 degrees a frame,
   the singles' own range (18 to 28). Every clip here already runs slower than life, so this is
   the same slow motion applied a little more to the part that needs it. Everything on
   the ice keeps its own time, and the move gets longer by the extra flight.

   Verified against a coach: NO. */
const OPEN = 90, AIR = 3;
const doubleOf = (m, name, note) => {
  const air = m.keys.map(k => k.skate === null);
  const first = air.indexOf(true), down = air.indexOf(false, first);
  if (first < 1 || down < 0) throw new Error(`doubleOf: ${m.name} has no flight to add a turn to`);
  const g = m.keys[first], d = m.keys[down];
  /* The extra turn is added in time, slowly at first and fastest just before the
     opening: (fraction of the way from leaving to opening out) squared. Spread evenly,
     the hips took most of a turn while the free leg was still forward from the
     takeoff, and the free boot went past freefoot.mjs's 60 degrees on the Axel. */
  const o = m.keys.findIndex((k, i) => i > first && i < down && k.hipYaw > d.hipYaw - OPEN);
  const tOpen = m.keys[o < 0 ? down : o].t;
  const spread = (k, f) => k[f] > d[f] - OPEN ? k[f] + 360
    : k[f] + 360 * ((k.t - g.t) / (tOpen - g.t)) ** 2;
  /* Stretch the flight: the one line segment of a jump's path. */
  const li = m.path.findIndex(g => g.kind === 'line');
  /* Spans are relative (buildPath divides by their total), keys' t are fractions of
     the whole move, so the flight's place on the clock is its span over the total. */
  const spans = m.path.map(g => g.span), total = spans.reduce((x, y) => x + y, 0);
  const f = spans[li] / total, a = spans.slice(0, li).reduce((x, y) => x + y, 0) / total;
  const b = a + f, grow = 1 + (AIR - 1) * f;
  const at = t => (t <= a ? t : t < b ? a + AIR * (t - a) : t + (AIR - 1) * f) / grow;
  const path = m.path.map((g, i) => (i === li ? { ...g, span: AIR * g.span, len: AIR * g.len } : { ...g }));
  /* An entrance's end is a time on the ice before the flight, so it moves with the clock. */
  return { ...m, name, note, path, duration: m.duration * grow,
    ...(m.entrance ? { entrance: { ...m.entrance, at: at(m.entrance.at) } } : {}),
    keys: m.keys.map((k, i) => {
    const o = { ...k, t: at(k.t) };
    for (const f of ['sh','L','R','LH','RH']) if (o[f]) o[f] = { ...o[f] };
    if (i >= down) { o.hipYaw += 360; o.shYaw += 360; }
    else if (i > first) { o.hipYaw = spread(k, 'hipYaw'); o.shYaw = spread(k, 'shYaw'); }
    return o;
  }) };
};
Object.assign(MOVES, {
  doubleSalchow: doubleOf(MOVES.salchow, 'Double Salchow',
    'LBI takeoff out of a three turn, no pick · two rotations · RBO landing'),
  doubleLoop: doubleOf(MOVES.loop, 'Double loop',
    'RBO takeoff, no pick · two rotations · RBO landing'),
  doubleAxel: doubleOf(MOVES.axel, 'Double Axel',
    'LFO takeoff · two and a half rotations · RBO landing'),
});

/* THE COMBINATIONS, BY JOINING TWO JUMPS — 04/10/2026, Session 28. Martyn: draw the
   loop combinations. A combination is two jumps where the landing of the first is the
   takeoff of the second (skating.js, comboAt), so its rig is the two jumps' rigs
   joined at that edge and is derived, the way the doubles are, rather than authored.

   Three parts, and the rules are the whole derivation:
   - the first jump, key for key, up to its deepest landing key (the knee absorbing),
     where its path is cut;
   - LINK seconds on the landing edge (a tenth of a second since Session 29, see RUSH
     below), in which the free leg comes in from behind,
     passes the skating foot and crosses in front, with two keys of its own;
   - the second jump, key for key, from its own deepest key before the takeoff (the
     skating knee bent, the free leg crossed in front), where its path is cut too.
   Both jumps are on the right back outside edge at the join, so the tracing is one
   curve from the first landing to the second takeoff. The second jump's hips and
   shoulders are a whole number of turns further round, so the skater faces the way the
   first landing left them. The link's arc turns at the mean of the two rates either
   side of it, so the skater's speed does not step.

   EVERY TWO-JUMP COMBINATION IS DRAWN since Session 29, when the toe loop, the flip and
   the Lutz got their rigs: all seven singles into a loop and into a toe loop, and all six
   doubles into a double loop and a double toe loop. Twenty-six. The three-jump ones wait
   for an Euler rig.

   THE CLIP IS LONGER THAN EITHER JUMP, so it gets more frames. buildPath samples a move
   at 320 points however long it lasts, and a combination drawn at 320 would turn twice
   as far between frames as its jumps do on their own pages (continuity.mjs bounds that
   at 30 degrees). `frames` keeps the finer of the two jumps' frame rates.

   Verified against a coach: NO. */
const LINK_ONE = 0.1;
/* Into a loop the free leg has to come from behind to crossed in front, eighty
   centimetres, and in a tenth of a second the glyph jumped 7% of the view a frame
   (continuity.mjs). A loop second gets three tenths. */
const LINK_THROUGH = 0.3;
/* HOW MUCH FASTER THE SECOND JUMP'S ENTRY RUNS IN A COMBINATION — 04/10/2026, Session 29.
   Until today the second jump was its single's keys from the deepest bend on, at the
   single's own speed, after 0.9 s on the landing edge: about two and a half seconds from
   the first touchdown to the second takeoff. Checked against coaches' teaching (the
   guidance, not their words): there is no pause; the landing's knee bend IS the second
   jump's, the free leg is already going round (into a toe loop) or already in front
   (into a loop), and the pick goes in as the skating leg is already straightening. So
   the link is a quarter of a second and the second jump's run from its bend to the pick
   or the flight, whichever comes first, takes RUSH of its own time. Then quicker again
   (Martyn, the same day, against video): the landing's compression is the spring for the
   second jump, with no time to release it. LINK 0.25 to 0.1 s and RUSH 0.45 to 0.3. The path is cut and
   scaled with it, sweep and span together, so the skater's speed does not change; the
   pick and everything after it run at the single's own speed, so a pinned pick travels
   exactly as far as it does on the single's page. */
const RUSH = 0.3;
const secsPath = m => {
  const total = m.path.reduce((x, g) => x + g.span, 0);
  return m.path.map(g => ({ ...g, radius: g.radius ?? m.radius, span: g.span / total * m.duration }));
};
/* Split a move's path at a fraction t of its clock. Only a plain arc may be split. */
const cutPath = (m, t) => {
  const segs = secsPath(m), at = t * m.duration, before = [], after = [];
  let s0 = 0;
  for (const g of segs) {
    const s1 = s0 + g.span;
    if (s1 <= at + 1e-9) before.push(g);
    else if (s0 >= at - 1e-9) after.push(g);
    else {
      if (g.kind !== 'arc' || g.turn) throw new Error(`comboOf: ${m.name} cannot be cut inside a ${g.turn || g.kind}`);
      const f = (at - s0) / g.span;
      before.push({ ...g, sweep: g.sweep * f, span: g.span * f });
      after.push({ ...g, sweep: g.sweep * (1 - f), span: g.span * (1 - f) });
    }
    s0 = s1;
  }
  return [before, after];
};
const copyKey = k => {
  const o = { ...k };
  for (const f of ['sh', 'L', 'R', 'LH', 'RH']) if (o[f]) o[f] = { ...o[f] };
  if (o.arm) o.arm = [...o.arm];
  return o;
};
const lerp = (a, b, f) => a + (b - a) * f;
const freeBehind = (a, b, f) => ({ t: lerp(a.t, b.t, f), n: lerp(a.n, b.n, f), z: lerp(a.z, b.z, f) + 2 });
const comboOf = (A, B, name, note) => {
  const deepest = (keys, from, to) => {
    let best = from;
    for (let i = from; i < to; i++) if (keys[i].hipZ < keys[best].hipZ) best = i;
    return best;
  };
  const down = A.keys.findIndex((k, i) => i > 0 && k.skate !== null && A.keys[i - 1].skate === null);
  const land = deepest(A.keys, down, A.keys.length);
  const air = B.keys.findIndex(k => k.skate === null);
  const bend = deepest(B.keys, 0, air);
  const a = A.keys[land], b = B.keys[bend];
  if (a.skate !== b.skate || a.edge !== b.edge || a.dir !== b.dir)
    throw new Error(`comboOf: ${A.name} lands ${a.skate}${a.dir}${a.edge}, ${B.name} bends on ${b.skate}${b.dir}${b.edge}`);
  if (a.skate !== 'R') throw new Error('comboOf: the link keys assume a right-foot landing');
  const turn = 360 * Math.round((a.hipYaw - b.hipYaw) / 360);

  const tA = a.t * A.duration, tB = b.t * B.duration;
  const LINK = b.L.t > 0 ? LINK_ONE : LINK_THROUGH;
  /* Where the rush ends: the first pinned key after the bend, or the start of the
     flight, whichever is sooner. */
  const flightAt = (() => { let x = 0; for (const g of secsPath(B)) { if (g.kind === 'line') return x; x += g.span; } return B.duration; })();
  const pinKey = B.keys.find((k, i) => i > bend && ['L', 'R'].some(w => k[w]?.pin));
  const tC = Math.min(flightAt, pinKey ? pinKey.t * B.duration : Infinity);
  const [pa] = cutPath(A, a.t), [, pbc] = cutPath(B, b.t), [, pc] = cutPath(B, tC / B.duration);
  /* Bend to tC, cut out of bend-to-end (cutPath splits a segment that tC falls inside). */
  const [toC] = cutPath({ ...B, path: pbc.map(g => ({ ...g })), duration: B.duration - tB }, (tC - tB) / (B.duration - tB));
  const pb = [...toC.map(g => ({ ...g, span: g.span * RUSH, ...(g.sweep != null ? { sweep: g.sweep * RUSH } : {}),
                                ...(g.len != null ? { len: g.len * RUSH } : {}) })), ...pc];
  const rate = g => g.sweep / g.span;
  const linkRate = (rate(pa[pa.length - 1]) + rate(pb[0])) / 2;
  const path = [...pa,
    { kind: 'arc', foot: a.skate, edge: a.edge, dir: a.dir, sweep: linkRate * LINK, span: LINK, radius: A.radius },
    ...pb];
  const rushT = kt => kt <= tC ? (kt - tB) * RUSH : (tC - tB) * RUSH + (kt - tC);
  const duration = tA + LINK + rushT(B.duration);

  /* The link. Hips, shoulders, the skating foot and the arms move straight from the
     first landing to the second bend; the free foot comes in low from behind and passes
     the skating foot with daylight between them before it crosses in front. */
  const mid = (f, ph, L) => {
    const o = copyKey(a);
    o.t = (tA + f * LINK) / duration;
    o.ph = ph;
    for (const q of ['hipZ']) o[q] = lerp(a[q], b[q], f);
    o.hipYaw = lerp(a.hipYaw, b.hipYaw + turn, f);
    o.shYaw = lerp(a.shYaw, b.shYaw + turn, f);
    o.sh = { ...a.sh, t: lerp(a.sh.t, b.sh.t, f), n: lerp(a.sh.n, b.sh.n, f), z: lerp(a.sh.z, b.sh.z, f) };
    o.R = { ...a.R, t: lerp(a.R.t, b.R.t, f), n: lerp(a.R.n, b.R.n, f), z: lerp(a.R.z, b.R.z, f) };
    o.L = { ...a.L, ...L };
    if (a.arm && b.arm) o.arm = a.arm.map((v, i) => lerp(v, b.arm[i], f));
    delete o.LH; delete o.RH;
    return o;
  };
  const keys = [
    ...A.keys.slice(0, land + 1).map(k => ({ ...copyKey(k), t: k.t * A.duration / duration })),
    /* INTO A TOE LOOP THE FREE LEG STAYS BEHIND — 04/10/2026, Session 29. Into a loop it
       comes through and crosses in front, because that is where the loop's bend has it.
       The toe loop's bend has it extended behind, reaching for the pick, so it never
       comes through: it eases from where the landing left it to where the bend wants it,
       held clear of the ice. Every combination drawn before today goes into a loop and
       takes the first branch unchanged. */
    ...(b.L.t > 0 ? [
      mid(1 / 3, 'The landing edge running, the free leg held behind', freeBehind(a.L, b.L, 1 / 3)),
      mid(2 / 3, 'The free leg reaching back for the pick', freeBehind(a.L, b.L, 2 / 3)),
    ] : [
    mid(1 / 3, 'The landing edge running, the free leg coming in', { t: 26, n: 11, z: 18 }),
    mid(2 / 3, 'The free leg passing the skating foot', { t: -8, n: 7, z: 22 }),
    ]),
    ...B.keys.slice(bend).map(k => {
      const o = copyKey(k);
      o.t = (tA + LINK + rushT(k.t * B.duration)) / duration;
      o.hipYaw += turn; o.shYaw += turn;
      return o;
    }),
  ];
  /* A key that sat on a segment boundary in its own jump sits on it exactly here,
     spinMove's and turnMove's rule: the boundary is the only statement of where it is. */
  const frames = Math.round(Math.max(320 / A.duration, 320 / B.duration) * duration);
  const total = path.reduce((x, g) => x + g.span, 0);
  let c = 0;
  const bounds = [0, ...path.map(g => (c += g.span) / total)];
  const SNAP = 0.5 / frames;
  for (const k of keys) {
    const at = bounds.find(g => Math.abs(g - k.t) < SNAP);
    if (at !== undefined) k.t = at;
  }
  return { name, note, path, radius: A.radius, duration, frames, keys, combo: { first: A.name, second: B.name, land, bend, turn } };
};
/* THE TOE LOOP — 04/10/2026, Session 29, docs/spec-anchor.md step 3. Takeoff RBO off the
   left toe pick, one rotation, landing RBO.

   THE ENTRY IS A RIGHT FORWARD INSIDE THREE TURN, HELD (Martyn, 04/10/2026, who skates it):
   out of the three turn hold the back outside edge for a moment with the free leg extended,
   as after any three turn, and only then lower the pick to the ice. Without the hold the jump
   is spun off the turn and gets lost. So the three turn's keys are rfiThree's, on the
   Salchow's clock and path shape (an RFI arc, the turn, a long RBO arc, the flight, the
   landing), and from the top of the flight on the keys are the Salchow's, which land RBO
   like every jump here.

   THE PICK GOES IN AS FAR BACK AS THE LEG WILL REACH (Martyn): the leg nearly straight, the
   weight still on the skating leg, ready to launch. It is pinned, so the toe stays where it
   went in while the body comes back over it, and it comes out as the hip rises into the
   takeoff. The boot is tipped about 50 degrees (Martyn: about right), its toe back towards
   the skater (rig-math.js bootDir), turned out about 20 degrees against the pelvis and turning
   on the pick with the body (coaches' teaching, guidance only).

   Verified against a coach: NO. Checked by Martyn against video, 04/10/2026. */
{
  const T = MOVES.rfiThree.keys, S = MOVES.salchow;
  const at = (k, t) => ({ ...copyKey(k), t });
  MOVES.toeLoop = turnMove({
    name:'Toe loop',
    note:'RFI three turn · RBO held · RBO takeoff, off the left toe pick · one rotation · RBO landing',
    path:[ {kind:'arc',  foot:'R', edge:'I', dir:'F', sweep:60,  span:0.24},
           {kind:'arc',  foot:'R', edge:'I', dir:'F', sweep:12,  span:0.048, turn:'three'},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:120, span:0.48},
           {kind:'line', len:70,                                 span:0.10},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:56,  span:0.18},
           {kind:'arc',  foot:'R', edge:'O', dir:'B', sweep:66,  span:0.24} ],
    radius:130, duration:7.0,
    keys:[
      at(T[0], 0), at(T[1], 0.0932), at(T[2], 0.1863), at(T[3], 0.2236),
      {arm:[60,6,18], t:0.33, ph:'Held: the back outside edge, the free leg extended', hipZ:92, hipYaw:176, shYaw:160,
       sh:P(2,0,144), R:P(1.1,15,0,-0.5), L:P(38,6,22,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[60,8,18], t:0.43, ph:'Still holding the edge', hipZ:92, hipYaw:176, shYaw:162,
       sh:P(0,0,144), R:P(0.6,15,0,-0.5), L:P(42,7,22,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,20], t:0.50, ph:'Skating knee bends, the free leg reaching far back', hipZ:84, hipYaw:176, shYaw:168,
       sh:P(-6,0,132), R:P(-20,16,0,-1), L:P(54,9,16,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[56,11,19], t:0.535, ph:'Lowering the pick to the ice', hipZ:85, hipYaw:178, shYaw:184,
       sh:P(-5,0,133), R:P(-17,15,0,-0.5), L:P(52,10,14,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[54,12,19], t:0.555, ph:'The toe pick goes in, as far back as the leg reaches', hipZ:86, hipYaw:180, shYaw:196,
       sh:P(-4,0,136), R:P(-14,15,0,0), L:{...PIN(52,10,0,48), yaw:35}, skate:'R', edge:'O', dir:'B'},
      {arm:[40,20,8], t:0.585, ph:'Takeoff: vaulting off the pick', hipZ:98, hipYaw:198, shYaw:250,
       sh:P(-2,0,152), R:P(-4,8,2,3), L:{...PIN(39.8,12.5,0,43), yaw:52}, skate:'R', edge:'O', dir:'B'},
      {arm:[30,16,10], t:0.604, ph:'Pick and blade leave the ice', hipZ:118, hipYaw:250, shYaw:290,
       sh:P(-2,0,170), R:P(-4,6,32,0,NEUTRAL), L:P(12,6,32,0,NEUTRAL), skate:null},
      ...S.keys.filter(k => k.t > 0.62).map(copyKey),
    ]});
}
/* THE FLIP — 04/10/2026, Session 29. Takeoff LBI off the RIGHT toe pick, one rotation,
   landing RBO (skating.js JUMPS). The Salchow's entry and its landing: the forward outside
   three turn onto the back inside edge, the knee bending with the free leg reaching back,
   and from the top of the flight the Salchow's own keys, copied. In between, where the
   Salchow swings its free leg round, the flip puts the right pick in.

   CHECKED AGAINST COACHES' TEACHING (the guidance, not their words): out of the three turn
   the free leg reaches straight back behind its own hip, or a little inside the circle,
   and never across behind the skating foot (that is the Lutz's position, and the edge
   call a flip gets for it). The picking toe lands near behind the skating heel and the
   hips stay level. So the pick goes in 40 cm behind and 10 to the skater's right, turned
   out like the toe loop's, and pivots with the body as it comes round.

   Verified against a coach: NO. */
{
  const S = MOVES.salchow, K = S.keys;
  const upTo = K.filter(k => k.t <= 0.48).map(copyKey);
  MOVES.flip = {
    name:'Flip',
    note:'LBI takeoff out of a three turn, off the right toe pick · one rotation · RBO landing',
    path: S.path.map(g => ({ ...g })), radius: S.radius, duration: S.duration,
    keys:[
      ...upTo,
      {arm:[56,12,19], t:0.555, ph:'The right toe pick goes in behind', hipZ:84, hipYaw:178, shYaw:196,
       sh:P(-5,0,136), L:P(-16,16,0,-0.5), R:{...PIN(40,-10,0,50), yaw:-35}, skate:'L', edge:'I', dir:'B'},
      {arm:[40,20,8], t:0.58, ph:'Takeoff: vaulting off the pick', hipZ:97, hipYaw:198, shYaw:250,
       sh:P(-2,0,152), L:P(-4,8,2,3), R:{...PIN(36.7,-11.1,0,43), yaw:-16}, skate:'L', edge:'I', dir:'B'},
      {arm:[30,16,10], t:0.604, ph:'Pick and blade leave the ice', hipZ:118, hipYaw:250, shYaw:290,
       sh:P(-2,0,170), L:P(-6,-12,32,0,NEUTRAL), R:P(12,-4,32,0,NEUTRAL), skate:null},
      ...K.filter(k => k.t > 0.62).map(copyKey),
    ]};
}
/* THE LUTZ — 04/10/2026, Session 29. Takeoff LBO off the RIGHT toe pick, one rotation,
   landing RBO. The one counter-rotated jump: a long back outside edge curving one way and
   a jump turning the other, so the tracing changes the side it curves at the takeoff.
   From the top of the flight it is the loop's keys, copied, like every RBO landing here.

   CHECKED AGAINST COACHES' TEACHING (the guidance, not their words): the back outside
   edge is held long and on the outside all the way into the pick; the feet stay close;
   the picking foot reaches behind and across the skating foot, so the pick goes in close
   to the skating foot on its own tracing. That is the difference from the flip, whose
   pick goes in behind its own hip. The entry edge is the toe loop's mirrored onto the
   left foot, on a wider circle.

   Verified against a coach: NO. */
{
  const L = MOVES.loop;
  MOVES.lutz = {
    name:'Lutz',
    note:'LBO takeoff off a long edge, off the right toe pick · one rotation · RBO landing',
    path:[ {kind:'arc',  foot:'L', edge:'O', dir:'B', sweep:56, span:0.48, radius:280},
           ...L.path.slice(1).map(g => ({ ...g })) ],
    radius: L.radius, duration: L.duration,
    keys:[
      {arm:[60,6,18], t:0.00, ph:'Gliding on the long back outside edge, the free leg extended behind', hipZ:92, hipYaw:182, shYaw:194,
       sh:P(-2,0,144), L:P(-1.5,-15,0,-0.5), R:P(34,-8,24,0,NEUTRAL), skate:'L', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.18, ph:'The edge held on the outside, the shoulders checked', hipZ:91, hipYaw:182, shYaw:190,
       sh:P(-4,0,141), L:P(-2.4,-15,0,-0.5), R:P(36,-10,22,0,NEUTRAL), skate:'L', edge:'O', dir:'B'},
      {arm:[58,10,20], t:0.32, ph:'Skating knee bends, the free leg reaching far back and across', hipZ:84, hipYaw:184, shYaw:192,
       sh:P(-6,0,132), L:P(-20,-16,0,-1), R:P(50,-12,16,0,NEUTRAL), skate:'L', edge:'O', dir:'B'},
      {arm:[56,11,19], t:0.385, ph:'Lowering the pick to the ice', hipZ:85, hipYaw:182, shYaw:186,
       sh:P(-5,0,133), L:P(-17,-15,0,-0.5), R:P(50,-12,14,0,NEUTRAL), skate:'L', edge:'O', dir:'B'},
      {arm:[54,12,19], t:0.425, ph:'The right toe pick goes in, as far back as the leg reaches', hipZ:86, hipYaw:180, shYaw:196,
       sh:P(-4,0,136), L:P(-14,-15,0,0), R:{...PIN(50,-12,0,48), yaw:-36}, skate:'L', edge:'O', dir:'B'},
      {arm:[40,20,8], t:0.465, ph:'Takeoff: vaulting off the pick against the curve', hipZ:98, hipYaw:198, shYaw:250,
       sh:P(-2,0,152), L:P(-4,-8,2,3), R:{...PIN(37.2,-9.3,0,43), yaw:-13}, skate:'L', edge:'O', dir:'B'},
      {arm:[30,16,10], t:0.49, ph:'Pick and blade leave the ice', hipZ:118, hipYaw:250, shYaw:290,
       sh:P(-2,0,170), L:P(-4,-6,32,0,NEUTRAL), R:P(12,-4,32,0,NEUTRAL), skate:null},
      ...L.keys.filter(k => k.t >= 0.5).map(copyKey),
    ]};
}
MOVES.doubleToeLoop = doubleOf(MOVES.toeLoop, 'Double toe loop',
  'RBO takeoff, off the left toe pick · two rotations · RBO landing');
MOVES.doubleFlip = doubleOf(MOVES.flip, 'Double flip',
  'LBI takeoff out of a three turn, off the right toe pick · two rotations · RBO landing');
MOVES.doubleLutz = doubleOf(MOVES.lutz, 'Double Lutz',
  'LBO takeoff off a long edge, off the right toe pick · two rotations · RBO landing');

Object.assign(MOVES, {
  waltzLoop: comboOf(MOVES.waltz, MOVES.loop, 'Waltz jump + loop',
    'LFO takeoff · half rotation · RBO landing, held · loop: one rotation · RBO landing'),
  salchowLoop: comboOf(MOVES.salchow, MOVES.loop, 'Salchow + loop',
    'LBI takeoff · one rotation · RBO landing, held · loop: one rotation · RBO landing'),
  loopLoop: comboOf(MOVES.loop, MOVES.loop, 'Loop + loop',
    'RBO takeoff · one rotation · RBO landing, held · loop: one rotation · RBO landing'),
  axelLoop: comboOf(MOVES.axel, MOVES.loop, 'Axel + loop',
    'LFO takeoff · one and a half rotations · RBO landing, held · loop: one rotation · RBO landing'),
  doubleSalchowDoubleLoop: comboOf(MOVES.doubleSalchow, MOVES.doubleLoop, 'Double Salchow + double loop',
    'LBI takeoff · two rotations · RBO landing, held · double loop: two rotations · RBO landing'),
  doubleLoopDoubleLoop: comboOf(MOVES.doubleLoop, MOVES.doubleLoop, 'Double loop + double loop',
    'RBO takeoff · two rotations · RBO landing, held · double loop: two rotations · RBO landing'),
  doubleAxelDoubleLoop: comboOf(MOVES.doubleAxel, MOVES.doubleLoop, 'Double Axel + double loop',
    'LFO takeoff · two and a half rotations · RBO landing, held · double loop: two rotations · RBO landing'),
  /* Session 29: the toe loop as first and second. */
  waltzToeLoop: comboOf(MOVES.waltz, MOVES.toeLoop, 'Waltz jump + toe loop',
    'LFO takeoff · half rotation · RBO landing, held · toe loop: off the pick, one rotation · RBO landing'),
  salchowToeLoop: comboOf(MOVES.salchow, MOVES.toeLoop, 'Salchow + toe loop',
    'LBI takeoff · one rotation · RBO landing, held · toe loop: off the pick, one rotation · RBO landing'),
  toeLoopToeLoop: comboOf(MOVES.toeLoop, MOVES.toeLoop, 'Toe loop + toe loop',
    'RBO takeoff off the pick · one rotation · RBO landing, held · toe loop: off the pick, one rotation · RBO landing'),
  loopToeLoop: comboOf(MOVES.loop, MOVES.toeLoop, 'Loop + toe loop',
    'RBO takeoff · one rotation · RBO landing, held · toe loop: off the pick, one rotation · RBO landing'),
  axelToeLoop: comboOf(MOVES.axel, MOVES.toeLoop, 'Axel + toe loop',
    'LFO takeoff · one and a half rotations · RBO landing, held · toe loop: off the pick, one rotation · RBO landing'),
  toeLoopLoop: comboOf(MOVES.toeLoop, MOVES.loop, 'Toe loop + loop',
    'RBO takeoff off the pick · one rotation · RBO landing, held · loop: one rotation · RBO landing'),
  doubleSalchowDoubleToeLoop: comboOf(MOVES.doubleSalchow, MOVES.doubleToeLoop, 'Double Salchow + double toe loop',
    'LBI takeoff · two rotations · RBO landing, held · double toe loop: off the pick, two rotations · RBO landing'),
  doubleToeLoopDoubleToeLoop: comboOf(MOVES.doubleToeLoop, MOVES.doubleToeLoop, 'Double toe loop + double toe loop',
    'RBO takeoff off the pick · two rotations · RBO landing, held · double toe loop: off the pick, two rotations · RBO landing'),
  doubleLoopDoubleToeLoop: comboOf(MOVES.doubleLoop, MOVES.doubleToeLoop, 'Double loop + double toe loop',
    'RBO takeoff · two rotations · RBO landing, held · double toe loop: off the pick, two rotations · RBO landing'),
  doubleAxelDoubleToeLoop: comboOf(MOVES.doubleAxel, MOVES.doubleToeLoop, 'Double Axel + double toe loop',
    'LFO takeoff · two and a half rotations · RBO landing, held · double toe loop: off the pick, two rotations · RBO landing'),
  doubleToeLoopDoubleLoop: comboOf(MOVES.doubleToeLoop, MOVES.doubleLoop, 'Double toe loop + double loop',
    'RBO takeoff off the pick · two rotations · RBO landing, held · double loop: two rotations · RBO landing'),
/* Session 29: the flip and the Lutz as firsts. */
  flipLoop: comboOf(MOVES.flip, MOVES.loop, 'Flip + loop',
    'LBI takeoff off the right pick · one rotation · RBO landing, held · loop: one rotation · RBO landing'),
  flipToeLoop: comboOf(MOVES.flip, MOVES.toeLoop, 'Flip + toe loop',
    'LBI takeoff off the right pick · one rotation · RBO landing, held · toe loop: off the pick, one rotation · RBO landing'),
  doubleFlipDoubleLoop: comboOf(MOVES.doubleFlip, MOVES.doubleLoop, 'Double flip + double loop',
    'LBI takeoff off the right pick · two rotations · RBO landing, held · double loop: two rotations · RBO landing'),
  doubleFlipDoubleToeLoop: comboOf(MOVES.doubleFlip, MOVES.doubleToeLoop, 'Double flip + double toe loop',
    'LBI takeoff off the right pick · two rotations · RBO landing, held · double toe loop: off the pick, two rotations · RBO landing'),
  lutzLoop: comboOf(MOVES.lutz, MOVES.loop, 'Lutz + loop',
    'LBO takeoff off the right pick · one rotation · RBO landing, held · loop: one rotation · RBO landing'),
  lutzToeLoop: comboOf(MOVES.lutz, MOVES.toeLoop, 'Lutz + toe loop',
    'LBO takeoff off the right pick · one rotation · RBO landing, held · toe loop: off the pick, one rotation · RBO landing'),
  doubleLutzDoubleLoop: comboOf(MOVES.doubleLutz, MOVES.doubleLoop, 'Double Lutz + double loop',
    'LBO takeoff off the right pick · two rotations · RBO landing, held · double loop: two rotations · RBO landing'),
  doubleLutzDoubleToeLoop: comboOf(MOVES.doubleLutz, MOVES.doubleToeLoop, 'Double Lutz + double toe loop',
    'LBO takeoff off the right pick · two rotations · RBO landing, held · double toe loop: off the pick, two rotations · RBO landing'),
});

/* ENTRANCES — 04/10/2026, Session 34, docs/model.md "Entrances and exits", agreed with
   Martyn the same day. An entrance is the run of path and keys before an element's
   take-off (a jump) or its centring (a spin), and an element may have more than one.

   THE DEFAULT ENTRANCE IS THE AUTHORED ONE, AND THE ELEMENT'S OWN ID KEEPS IT. Where a move
   was written with its entrance (the Salchow, flip and toe loop and their three turns), the
   move is unchanged and ENTRIES records where the entrance ends: `join`, the index of the
   first path segment that belongs to the element. Every page, double, combination and hash
   that reads MOVES.salchow reads what it read before. A second entrance is a new move,
   `<id>@<entrance>`, built by withEntry from another move's entrance and this move's core
   (everything from `join` on), so every checker that walks MOVES walks it unasked.

   withEntry joins at the core's first key. The entrance's own last key sits on the same
   instant (the boundary) and is dropped: it says where the entrance was written to arrive,
   and entries.mjs asserts it agrees with the core's first key on foot, edge, direction and
   facing, which is what makes the two halves one movement. The core's facing is turned by
   whole turns to meet the entrance's, as comboOf does.

   AN EXIT IS AN ELEMENT'S LAST PATH SEGMENT: every jump's RBO run-out after the check, every
   spin's opening arc. `phasesOf` reads both boundaries off the move for the page. */
export const boundsOf = m => {
  const total = m.path.reduce((x, g) => x + g.span, 0);
  let c = 0;
  return [0, ...m.path.map(g => (c += g.span) / total)];
};
/* Segments [from, to) of a move as a move of their own, spans in seconds, keys re-timed. */
export const sliceMove = (m, from, to = m.path.length) => {
  const b = boundsOf(m), t0 = b[from], t1 = b[to];
  const keys = m.keys.filter(k => k.t >= t0 - 1e-9 && k.t <= t1 + 1e-9)
    .map(k => ({ ...copyKey(k), t: (k.t - t0) / (t1 - t0) }));
  if (Math.abs(keys[0].t) > 1e-6 || Math.abs(keys[keys.length - 1].t - 1) > 1e-6)
    throw new Error(`sliceMove: ${m.name} has no key on the boundaries of segments ${from} to ${to}`);
  keys[0].t = 0; keys[keys.length - 1].t = 1;
  return { name: m.name, path: secsPath(m).slice(from, to), radius: m.radius,
           duration: m.duration * (t1 - t0), keys };
};
export const withEntry = (entry, core, name, note, extra = {}, keep = 'core') => {
  const e = entry.keys[entry.keys.length - 1], c = core.keys[0];
  const turn = 360 * Math.round((e.hipYaw - c.hipYaw) / 360);
  const D = entry.duration + core.duration;
  const path = [...entry.path.map(g => ({ ...g })), ...secsPath(core)];
  /* keep 'core' joins at the core's first key; keep 'entry' at the entrance's last, and the
     core's first key is dropped instead, for a core whose first key is a pose the entrance
     cannot turn into within its last segment (the spins, below). */
  const keys = [
    ...entry.keys.slice(0, keep === 'core' ? -1 : undefined).map(k => ({ ...copyKey(k), t: k.t * entry.duration / D })),
    /* keep a number: the entrance's last key, and the core's first key moved that far into
       the core (a fraction of its clock) rather than dropped. */
    ...(typeof keep === 'number' ? [{ ...core.keys[0], t: keep }, ...core.keys.slice(1)]
        : core.keys.slice(keep === 'core' ? 0 : 1)).map(k => { const o = copyKey(k);
      o.t = (entry.duration + k.t * core.duration) / D; o.hipYaw += turn; o.shYaw += turn; return o; }),
  ];
  /* A key on a segment boundary in either half sits on it exactly in the whole. */
  /* The core's own frame rate, carried over the entrance: the element plays exactly as
     finely as on its own page. */
  const frames = Math.round((core.frames ?? 320) / core.duration * D);
  const bounds = boundsOf({ path });
  for (const k of keys) { const at = bounds.find(g => Math.abs(g - k.t) < 0.5 / frames); if (at !== undefined) k.t = at; }
  return { ...core, name, note, path, radius: core.radius, duration: +D.toFixed(4), frames, keys,
           entrance: { at: entry.duration / D, arrives: { skate: e.skate, edge: e.edge, dir: e.dir, hipYaw: e.hipYaw - turn },
                       ...extra } };
};

/* The entrances drawn so far. `join` is where the element starts in the authored move;
   `from: [move, join]` takes another move's entrance. Commonest first, from coaches' public
   teaching pages and the programmes held in sources/ (docs/model.md). */
const FO_THREE = 'Forward outside three turn', FI_THREE = 'Forward inside three turn';
export const ENTRIES = {
  salchow:  { join: 2, list: [{ id: 'three', name: FO_THREE }] },
  flip:     { join: 2, list: [{ id: 'three', name: FO_THREE }] },
  toeLoop:  { join: 2, list: [{ id: 'three', name: FI_THREE }] },
  loop:     { join: 0, list: [{ id: 'edge',  name: 'Back outside edge' },
                              { id: 'three', name: FI_THREE, from: ['toeLoop', 2] }] },
};
/* Variants: built, named and added to MOVES. */
for (const [id, E] of Object.entries(ENTRIES)) {
  const core = sliceMove(MOVES[id], E.join);
  for (const v of E.list.slice(1)) {
    const [src, j] = v.from, entry = sliceMove(MOVES[src], 0, j);
    MOVES[`${id}@${v.id}`] = withEntry(entry, E.join ? core : MOVES[id],
      `${MOVES[id].name}, from a ${v.name.toLowerCase()}`, `${v.name} · ${MOVES[id].note}`);
  }
}

/* A double has its single's entrances: doubleOf reads the single's keys, whichever entrance
   they start with. */
for (const [id, E] of Object.entries(ENTRIES)) {
  const dbl = 'double' + id[0].toUpperCase() + id.slice(1);
  if (!MOVES[dbl]) continue;
  ENTRIES[dbl] = { join: E.join, list: E.list.map(v => ({ ...v })) };
  for (const v of E.list.slice(1))
    MOVES[`${dbl}@${v.id}`] = doubleOf(MOVES[`${id}@${v.id}`], `${MOVES[dbl].name}, from a ${v.name.toLowerCase()}`,
      `${v.name} · ${MOVES[dbl].note}`);
}

/* EVERY SPIN THAT CENTRES ON A BACK INSIDE EDGE IS ENTERED FROM A FORWARD OUTSIDE EDGE AND A
   THREE TURN: the skater steps onto a deep forward outside edge, the knee bent, and turns the
   three into the spin (coaches' public teaching pages, base guidance only; one centres the spin
   on that three turn). The entrance is the Salchow's, the same edge and the same turn, and it
   becomes the spin's default: the spin's own wide and tightening arcs on the back inside edge
   follow it as before.

   AT THE SALCHOW'S PACE, IN SLOW MOTION. A spin is entered fast: its own first arc runs at
   nearly five metres a second, and the Salchow's three is drawn at about one. Redrawn at the
   spin's speed the three turn took a twelfth of a second, the free boot turned 31° a frame,
   and its cusp, whose depth is a fraction of its length on the ice (rig-math.js, cuspAt),
   pushed the blade out from under the body (lean.mjs). So the entrance keeps the Salchow's
   path and clock, and the skater picks up the spin's speed out of the turn: the doubles'
   rule (doubleOf) of slowing the part a reader needs to see. At 56 frames a second that
   pick-up was a lurch (continuity.mjs: 6.7 cm a frame against 5); the move runs at no
   fewer than ENTRY_FPS, at which it is 3.2. */
const ENTRY_FPS = 120;
/* THE JOIN IS THE SALCHOW'S, THE KEY OUT OF THE THREE TURN CHECKED ON THE BACK INSIDE EDGE,
   and the spin's own first key is dropped. Joined at the spin's first key, the three turned
   the skater into a pose the Salchow's three was never written to reach: the camel's free
   leg went from low in front to above the hip behind inside the turn (freefoot.mjs: 67.8°
   against 60), and the shoulders the spin carries forward pushed the body off the blade's
   edge at the apex (lean.mjs, 2.7 cm). Out of the three, the spin's second key, where the
   circle is tightening, is reached across the whole wide arc. The spins as they stood, which
   entries.mjs checks the join against, are kept in CORES. */
export const CORES = {};
/* THE CAMEL WAITS. Out of the Salchow's three its free leg has to go from low behind to
   above the hip, and every route tried (dropping its first key, keeping it a little later,
   one, two and three keys between, the leg kept at full reach, the foot pointed and not)
   passed through a bent knee with the shin level and the boot pointing at the ice
   (freefoot.mjs, 83 to 89° against 60). A camel entered from a three swings the leg up
   from the hip, straight, and this rig's knee bends whenever the foot is short of full
   reach. entries.mjs declares it. */
{
  const entry = sliceMove(MOVES.salchow, 0, 2);
  for (const id of ['uprightSpin', 'sitSpin', 'changeFootSpin', 'combinationSpin']) {
    const m = CORES[id] = MOVES[id];
    MOVES[id] = withEntry(entry, m, m.name, `forward outside edge and three turn · ${m.note}`, {}, 'entry');
    MOVES[id].frames = Math.max(MOVES[id].frames, Math.round(ENTRY_FPS * MOVES[id].duration));
    ENTRIES[id] = { join: 2, list: [{ id: 'three', name: FO_THREE, from: ['salchow', 2] }] };
  }
}
/* Where a move's entrance ends and its exit begins, as fractions of its clock. */
export const phasesOf = (id) => {
  const m = MOVES[id]; if (!m) return null;
  const base = id.split('@')[0], E = ENTRIES[base], b = boundsOf(m);
  const entry = m.entrance ? m.entrance.at : E ? b[E.join] : 0;
  return { entry, exit: b[m.path.length - 1] };
};
/* The entrances a page offers for a move: the default (the move itself) first. */
export const entrancesOf = (id) => {
  const E = ENTRIES[id];
  if (!E) return [];
  return E.list.map((v, i) => ({ id: v.id, name: v.name, move: i ? `${id}@${v.id}` : id }));
};

for(const m of Object.values(MOVES)) for(const k of m.keys){
  const R = lateral(k.shYaw), F = anterior(k.shYaw);
  // [out from the shoulder centre, forward, drop] in cm. Default is arms held
  // out and only softly bent — 48 cm past the joint against a 60 cm reach.
  // Wide arms carried through a 180° body rotation sweep a 67 cm arc, which a
  // fixed side camera shows as a violent fore-and-aft swing, so a jump has to
  // gather them in before it turns. That is choreography, not geometry.
  const [out, fwd, drop] = k.arm || [67, 8, 20];
  for(const [side, w] of [[-1,'L'],[1,'R']]){
    if(k[w+'H'] && k[w+'H'].authored) continue;              // <- the fix
    k[w+'H'] = P(k.sh.t + R[0]*out*side + F[0]*fwd, k.sh.n + R[1]*out*side + F[1]*fwd, k.sh.z - drop);
  }
}