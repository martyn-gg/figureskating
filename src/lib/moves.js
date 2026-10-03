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

import { anterior, lateral, ANKLE_POINT } from './rig-math.js';

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
   comment explains. The skating blade runs from 6 cm ahead of the hip to 6 cm behind
   it across the window in the direction of travel at each end, so it averages to
   nought there. */
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
       sh:P(-2*f,0,147), L:P(4*f,15*n,0,-0.5), R:R(-30*f,8*f,14), ...on(inn)},
      {arm:[56,6,18], t:0.30, ph:'Knee bends, the shoulders turning into the circle', hipZ:88, hipYaw:base + 2*s, shYaw:base + 32*s,
       sh:P(2*f,0,139), L:P(12*f,15*n,0,-1), R:R(-14*f,8*f,12), ...on(inn)},
      {arm:[50,8,18], t:0.467, ph:'Rising onto the turn, the hips coming round with the blade', hipZ:94, hipYaw:base + 6*s, shYaw:base + 40*s,
       sh:P(0,0,146), L:P(6*f,15*n,0,0.5), R:R(-6*f,8*f,16), ...on(inn)},
      {arm:[52,8,18], t:0.533, ph:'Out of the cusp, the check holding', hipZ:92, hipYaw:base + 174*s, shYaw:base + 150*s,
       sh:P(0,0,144), L:P(6*g,15*n,0,0.5), R:R(-6*g,8*f,16), ...on(exit)},
      {arm:[60,6,18], t:0.75, ph:'The check holding, the free leg extending back', hipZ:90, hipYaw:base + 176*s, shYaw:base + 160*s,
       sh:P(-2*g,0,142), L:P(10*g,15*n,0,-0.5), R:R(-34*g,4*g,18), ...on(exit)},
      {arm:[62,6,18], t:1.00, ph:`Running out on the ${exit.dir === 'F' ? 'forward' : 'back'} ${exit.edge === 'O' ? 'outside' : 'inside'} edge`,
       hipZ:94, hipYaw:base + 178*s, shYaw:base + 164*s,
       sh:P(-2*g,0,146), L:P(8*g,15*n,0,-0.5), R:R(-40*g,6*g,20), ...on(exit)},
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
       sh:P(-4,0,148), L:P(14,14,0,-0.5), R:P(-49,-6,27,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[60,-2,24], t:0.14, ph:'Knee bends, edge deepens', hipZ:86, hipYaw:-6, shYaw:-20,
       sh:P(2,0,132), L:P(19,18,0,-1), R:P(-55,-5,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[54,16,18], t:0.25, ph:'Free leg swings through', hipZ:92, hipYaw:-2, shYaw:-10,
       sh:P(0,0,138), L:P(15,16,0,0.5), R:P(0,-4,10,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[50,26,6], t:0.30, ph:'Takeoff: leg and knee drive up', hipZ:100, hipYaw:8, shYaw:2,
       sh:P(-4,0,154), L:P(2,8,2,3), R:P(46,0,62,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
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
      {arm:[62,8,18], t:0.70, ph:'Check holds, edge running', hipZ:90, hipYaw:174, shYaw:150,
       sh:P(-8,0,142), L:P(50,15,15,0,NEUTRAL), R:P(-12,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[63,9,18], t:0.86, ph:'Rising out of the landing knee', hipZ:96, hipYaw:174, shYaw:154,
       sh:P(-6,0,148), L:P(59,14,26,0,NEUTRAL), R:P(-6,17,0), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:172, shYaw:158,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(-4,15,0), skate:'R', edge:'O', dir:'B'},
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

     Verified against a coach: NO. The shoulder lead, the hip timing and how fast the
     blade comes round are the three things worth putting to one. */
  threeTurn: turnMove({
    name:'Forward outside three turn',
    note:'LFO · the blade turning half a circle on its edge, the cusp in the tracing · LBI',
    path:[ {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:70, span:195},
           {kind:'arc', foot:'L', edge:'O', dir:'F', sweep:10, span:28, turn:'three'},
           {kind:'arc', foot:'L', edge:'I', dir:'B', sweep:70, span:195} ],
    radius:160, duration:4.4,
    keys:[
      {arm:[60,4,18], t:0.00, ph:'Gliding on the forward outside edge', hipZ:94, hipYaw:-4, shYaw:-10,
       sh:P(-2,0,147), L:P(4,15,0,-0.5), R:P(-30,8,14,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[56,6,18], t:0.30, ph:'Knee bends, the shoulders turning into the circle', hipZ:88, hipYaw:2, shYaw:32,
       sh:P(2,0,139), L:P(12,15,0,-1), R:P(-14,8,12,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[50,8,18], t:0.467, ph:'Rising onto the turn, the hips coming round with the blade', hipZ:94, hipYaw:6, shYaw:40,
       sh:P(0,0,146), L:P(6,15,0,0.5), R:P(-6,8,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[52,8,18], t:0.533, ph:'Out of the cusp, checked on the back inside edge', hipZ:92, hipYaw:174, shYaw:150,
       sh:P(0,0,144), L:P(-6,15,0,0.5), R:P(6,8,16,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[60,6,18], t:0.75, ph:'The check holding, the free leg extending back', hipZ:90, hipYaw:176, shYaw:160,
       sh:P(-2,0,142), L:P(-10,15,0,-0.5), R:P(34,-4,18,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[62,6,18], t:1.00, ph:'Running out on the back inside edge', hipZ:94, hipYaw:178, shYaw:164,
       sh:P(-2,0,146), L:P(-8,15,0,-0.5), R:P(40,-6,20,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
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

     Verified against a coach: NO. The timing of the swing against the rise is the
     part most worth a coach's eye. */
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
      {arm:[64,8,18], t:0.3634, ph:'Free leg held back, the edge running', hipZ:90, hipYaw:176, shYaw:160,
       sh:P(-4,0,140), L:P(-10,15,0,-0.5), R:P(50,-8,22,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[60,10,20], t:0.472, ph:'Skating knee bends, the free leg reaching back', hipZ:82, hipYaw:174, shYaw:158,
       sh:P(-6,0,132), L:P(-20,16,0,-1), R:P(54,-10,14,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[52,14,20], t:0.5342, ph:'The free leg swings out wide', hipZ:84, hipYaw:186, shYaw:200,
       sh:P(-6,0,134), L:P(-18,16,0,-1), R:P(10,-42,16,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[46,18,16], t:0.573, ph:'Free leg through in front, the shoulders leading', hipZ:92, hipYaw:196, shYaw:236,
       sh:P(-2,0,142), L:P(-10,14,0,1), R:P(-36,-14,34,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      {arm:[40,20,8], t:0.5924, ph:'Takeoff: the skating knee drives up', hipZ:102, hipYaw:202, shYaw:256,
       sh:P(-2,0,154), L:P(-4,8,2,3), R:P(-34,-4,52,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
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
      {arm:[62,8,18], t:0.8758, ph:'Check holds, edge running', hipZ:90, hipYaw:534, shYaw:510,
       sh:P(-8,0,142), L:P(50,15,15,0,NEUTRAL), R:P(-12,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.0, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:532, shYaw:518,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(-4,15,0), skate:'R', edge:'O', dir:'B'},
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
       sh:P(0,0,146), L:P(0,15,0,1.9), R:P(-26,22,20), skate:'L', edge:'I', dir:'B'},
      {arm:[54,8,18], t:0.3800, ph:'Centred - the hip stops travelling', hipZ:96, hipYaw:180, shYaw:174,
       sh:P(0,0,146), L:P(0,12,0,2.2), R:P(-22,18,18), skate:'L', edge:'I', dir:'B'},
      {arm:[44,6,18], t:0.5800, ph:'Upright, free foot drawing in', hipZ:97, hipYaw:180, shYaw:178,
       sh:P(0,0,147), L:P(0,12,0,2.2), R:P(-16,14,16), skate:'L', edge:'I', dir:'B'},
      {arm:[34,4,18], t:0.7400, ph:'Held - spinning upright', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(0,0,148), L:P(0,12,0,2.2), R:P(-12,10,15), skate:'L', edge:'I', dir:'B'},
      {arm:[18,2,12], t:0.9100, ph:'Wind-up - everything to the axis, and it quickens', hipZ:99, hipYaw:180, shYaw:180,
       sh:P(0,0,149), L:P(0,12,0,2.2), R:P(-8,6,14), skate:'L', edge:'I', dir:'B'},
      {arm:[52,8,18], t:1.0000, ph:'Exit - opening out and stepping off', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(0,0,146), L:P(0,15,0,1.6), R:P(-18,20,20), skate:'L', edge:'I', dir:'B'},
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
       sh:P(0,0,146), L:P(0,15,0,1.9), R:P(-26,22,20), skate:'L', edge:'I', dir:'B'},
      {arm:[54,8,18], t:0.2201, ph:'Centred on the left - the hip stops travelling', hipZ:96, hipYaw:180, shYaw:174,
       sh:P(0,0,146), L:P(0,12,0,2.2), R:P(-22,18,18), skate:'L', edge:'I', dir:'B'},
      {arm:[44,6,18], t:0.3600, ph:'Three revolutions upright on the left', hipZ:97, hipYaw:180, shYaw:178,
       sh:P(0,0,147), L:P(0,12,0,2.2), R:P(-16,14,16,0,NEUTRAL), skate:'L', edge:'I', dir:'B'},
      /* The weight goes across here and `skate` names the right foot from this
         key on. It is authored at the path's own segment boundary to five places
         so that the blade the pose rides and the blade the tracing is built from
         change on the same frame; spin.mjs asserts they agree, per frame. */
      {arm:[52,10,16], t:0.50366, ph:'Change of foot - stepping over onto the right', hipZ:95, hipYaw:180, shYaw:176,
       sh:P(0,0,145), R:P(-6,12,0,2.2,NEUTRAL), L:P(-14,12,16), skate:'R', edge:'O', dir:'B'},
      {arm:[50,8,18], t:0.5363, ph:'Centred on the right, back outside edge', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(0,0,146), R:P(0,12,0,2.2), L:P(-20,-6,18), skate:'R', edge:'O', dir:'B'},
      {arm:[40,6,18], t:0.7000, ph:'Three revolutions upright on the right', hipZ:97, hipYaw:180, shYaw:178,
       sh:P(0,0,147), R:P(0,12,0,2.2), L:P(-14,-2,15), skate:'R', edge:'O', dir:'B'},
      {arm:[32,4,18], t:0.8532, ph:'Still upright, drawing in', hipZ:98, hipYaw:180, shYaw:180,
       sh:P(0,0,148), R:P(0,12,0,2.2), L:P(-10,0,14), skate:'R', edge:'O', dir:'B'},
      {arm:[18,2,12], t:0.9475, ph:'Wind-up - everything to the axis, and it quickens', hipZ:99, hipYaw:180, shYaw:180,
       sh:P(0,0,149), R:P(0,12,0,2.2), L:P(-8,2,14), skate:'R', edge:'O', dir:'B'},
      {arm:[52,8,18], t:1.0000, ph:'Exit - opening out and stepping off', hipZ:96, hipYaw:180, shYaw:176,
       sh:P(0,0,146), R:P(0,15,0,1.6), L:P(-18,-6,20), skate:'R', edge:'O', dir:'B'},
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
       sh:P(0,0,148), L:P(0,12,0,2.2), R:P(-14,12,15), skate:'L', edge:'I', dir:'B'},
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

     FORTY DEGREES OF TOE-IN EACH, and it took bent knees to buy them. Toes-in is
     the expensive direction — a weight-bearing hip gives twenty — and a knee bent
     thirty-one degrees adds twenty-two more. So the pose comes out sunk, which is
     how a snowplough is taught and is not what anybody authored here: the sweep
     was for the most toe-in the constants would allow and this is where it landed,
     against the shin's 28 degrees of lean on both legs at once.

     Held rather than animated. A stop is a loss of speed and the path runs at one,
     so this is the pose mid-scrape and not the stopping of it. */
  snowplough: {
    name:'Snowplough stop',
    note:'both blades skidding · toes turned in, inside edges, scraping straight',
    path:[{kind:'line', len:150}],
    radius:200, duration:2.6,
    keys:[
      {t:0.00, ph:'Both blades turned in and pressed', hipZ:90, hipYaw:0, shYaw:0,
       sh:P(0,0,143), L:SKID(8,-34,0,-40,'I'), R:SKID(8,34,0,40,'I'), skate:'L', edge:'I', dir:'F'},
      {t:0.50, ph:'Scraping: the knees driving the blades down', hipZ:90, hipYaw:0, shYaw:0,
       sh:P(0,0,143), L:SKID(8,-34,0,-40,'I'), R:SKID(8,34,0,40,'I'), skate:'L', edge:'I', dir:'F'},
      {t:1.00, ph:'Held: the scrape taking the speed off', hipZ:90, hipYaw:0, shYaw:0,
       sh:P(0,0,143), L:SKID(8,-34,0,-40,'I'), R:SKID(8,34,0,40,'I'), skate:'L', edge:'I', dir:'F'},
    ]},

  /* A BACKWARD SNOWPLOUGH STOP — the forward one's mirror in everything except
     which way the toes go. Travelling backwards the heels lead, so the feet press
     out and the TOES turn out rather than in — and out is the cheap direction at
     the hip, forty degrees against twenty. The forward plough has to buy its
     toes-in with a bent knee; this one does not, which is a fact about hips and
     not about difficulty. Everything else a skater finds hard about it is that the
     weight has to move forward while the stop pushes them back. */
  ploughBack: {
    name:'Backward snowplough stop',
    note:'both blades skidding, travelling backwards · toes turned out, inside edges',
    path:[{kind:'line', len:140}],
    radius:200, duration:2.6,
    keys:[
      {t:0.00, ph:'Both blades pressed out and flat', hipZ:90, hipYaw:180, shYaw:180,
       sh:P(0,0,143), L:SKID(-8,-34,0,45,'I'), R:SKID(-8,34,0,-45,'I'), skate:'L', edge:'I', dir:'B'},
      {t:0.50, ph:'Scraping: the weight held forward against the stop', hipZ:90, hipYaw:180, shYaw:180,
       sh:P(2,0,143), L:SKID(-8,-34,0,45,'I'), R:SKID(-8,34,0,-45,'I'), skate:'L', edge:'I', dir:'B'},
      {t:1.00, ph:'Held: the feet finishing wider than they started', hipZ:90, hipYaw:180, shYaw:180,
       sh:P(3,0,143), L:SKID(-8,-34,0,45,'I'), R:SKID(-8,34,0,-45,'I'), skate:'L', edge:'I', dir:'B'},
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

     Held rather than animated, like the other probes: a stop is a loss of speed and
     the path runs at one. This is the braking instant. */
  tStop: {
    name:'T-stop',
    note:'forward outside edge · the trailing blade across it, on its outside edge, sliding',
    path:[{kind:'arc', foot:'R', edge:'O', dir:'F', sweep:40}],
    radius:400, duration:3.0,
    keys:[
      {t:0.00, ph:'The trailing blade set down across the glide', hipZ:94, hipYaw:35, shYaw:40,
       sh:P(-2,0,147), R:P(0,-20,0,-0.5), L:SKID(-22,-14,0,90,'O'), skate:'R', edge:'O', dir:'F'},
      {t:0.45, ph:'Weight easing onto it, the outside edge shaving', hipZ:94, hipYaw:35, shYaw:42,
       sh:P(-2,0,147), R:P(0,-20,0,-0.5), L:SKID(-22,-14,0,90,'O'), skate:'R', edge:'O', dir:'F'},
      {t:1.00, ph:'Held: the glide holding its line, the trailing blade scraping', hipZ:94, hipYaw:35, shYaw:44,
       sh:P(-2,0,147), R:P(0,-20,0,-0.5), L:SKID(-22,-14,0,90,'O'), skate:'R', edge:'O', dir:'F'},
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
     with. `notCovered` in nine BIS exercises says "the push back" because until
     today there was nothing to link to.

     THIRTY-FIVE IS NOT A ROUND NUMBER, it is most of what a weight-bearing hip has.
     HIP_OUT is forty. Turning the foot further is not available at the hip, so a
     skater who wants a wider push turns the pelvis instead — which is why a strong
     push looks like the whole body opening rather than a foot twisting.

     A HELD POSITION, like twoFoot and toePick, and for a plainer reason than
     either: a push is a change of weight, and the rig carries one hip height and
     one reference blade per frame. Drawing the changeover means the reference blade
     handing over mid-move, which the waltz does and which is a movement rather than
     a probe. This holds the instant the push is at its widest. */
  pushOff: {
    name:'Push',
    note:'forward outside edge · the other blade planted and turned thirty-five degrees out',
    path:[{kind:'arc', foot:'L', edge:'O', dir:'F', sweep:60}],
    radius:300, duration:3.2,
    keys:[
      {t:0.00, ph:'Weight over the gliding blade, the push at its widest', hipZ:94, hipYaw:0, shYaw:-6,
       sh:P(-2,0,147), L:P(0,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:0.45, ph:'Still pushing, the shoulders squaring up', hipZ:94, hipYaw:0, shYaw:-4,
       sh:P(-2,0,147), L:P(0,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
      {t:1.00, ph:'Held: the push complete, the glide running', hipZ:94, hipYaw:0, shYaw:-2,
       sh:P(-2,0,147), L:P(0,6,0,-0.5), R:PUSH(-14,34,0,-35), skate:'L', edge:'O', dir:'F'},
    ]},

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

     THE HIP HEIGHT IS THE POSE. A picked boot's direction is authored rather than
     taken off the shin, so the ANKLE ANGLE is a consequence of where the pose puts
     the foot, and the boot allows ANKLE_MAX of it. Measured over the space by
     `npm run ankle`, and it is three bands rather than a slope: at a hip of 62 and
     below the boot reaches 89°, standing on end; between 64 and 76 there is no legal
     pick at all, at any pitch or reach; at a standing 78 and above only 4 to 12°
     survives, which is barely past the 3.5° a blade already has — a scuff and not a
     jab. So this pose sits at a hip of 54. None of that was authored: the only
     way to tilt the boot further with the toe on the ice is to tilt the whole leg,
     and the only way to tilt the leg is to sink. Which is what a skater does before
     they pick. freefoot.mjs asserts it, and it is the first time ANKLE_MAX has bitten
     on a pose rather than on a number somebody typed.

     Sinking is not free either. shin.mjs will not have a deep knee with the blade
     under the hip, so the skating foot has to travel out from under it as the hip
     drops — the same fact that shapes the teapot and the sit spin, arriving here
     for the third time.

     IT IS A HELD POSITION AND NOT A MOVEMENT, and the reason is the pick itself.
     Every foot in this file is authored relative to the HIP, and only the reference
     blade is pinned to the path. A gliding blade travels with the skater so that
     costs nothing — but A PICK IS FIXED TO THE ICE, the first contact in this model
     that is. Held through a real span of travel its hip-relative position would have
     to sweep backwards by however far the hip went, which is 168 cm over this arc
     and out of reach within the first centimetres. So the pick is drawn where it is
     set and the arc beneath it is where the skating blade is going, not a claim that
     the toe is sliding along with it. Expressing a contact that stays put needs an
     anchor the rig has not got, and that is a bigger change than this one.

     The ENTRY is not drawn either, and that was tried first. As a movement — glide,
     sink, reach, pick — it failed twice, and both failures were real: the free boot
     descending onto the pick reaches 78° from level over 92 frames, because a boot
     square to a shin that steep points at the ice, and the top-down glyph turns 155°
     in the single frame where bootDir changes rule, against the 95 continuity.mjs
     allows across a landing. Neither is a defect in the pick. They say the frames
     between "free" and "picked" are a state the model has not got — the foot is
     neither hanging nor planted — and inventing one to make a probe animate would be
     authoring pose data to satisfy a checker. twoFoot does not draw stepping onto two
     feet either, and for the same reason. */
  toePick: {
    name:'Toe pick',
    note:'RBO edge · sunk into the skating knee · the left toe pick set behind',
    path:[{kind:'arc', foot:'R', edge:'O', dir:'B', sweep:64}],
    radius:150, duration:3.4,
    keys:[
      {t:0.00, ph:'The pick set behind, the edge running', hipZ:54, hipYaw:176, shYaw:160,
       sh:P(0,0,104), L:PICK(40,-16,0,80), R:P(-34,7,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:0.35, ph:'Shoulders checking against the toe', hipZ:54, hipYaw:176, shYaw:157,
       sh:P(2,0,104), L:PICK(40,-16,0,80), R:P(-34,7,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {t:1.00, ph:'Held: loaded against the toe, ready to vault', hipZ:54, hipYaw:176, shYaw:154,
       sh:P(3,0,103), L:PICK(40,-16,0,80), R:P(-34,7,0,-0.5), skate:'R', edge:'O', dir:'B'},
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

     Verified against a coach: NO. How far the free leg crosses before the takeoff is
     the part most worth a coach's eye. */
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
       sh:P(-2,0,144), R:P(-6,15,0,-0.5), L:P(-30,8,20,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.18, ph:'The edge running, the shoulders checked', hipZ:90, hipYaw:178, shYaw:170,
       sh:P(-4,0,140), R:P(-10,15,0,-0.5), L:P(-28,4,18,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,20], t:0.32, ph:'Skating knee bends, the free leg crossed in front', hipZ:82, hipYaw:176, shYaw:168,
       sh:P(-6,0,132), R:P(-20,16,0,-1), L:P(-30,2,16,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[50,14,18], t:0.45, ph:'Rising, the shoulders starting to turn', hipZ:92, hipYaw:192, shYaw:222,
       sh:P(-2,0,142), R:P(-10,14,0,1), L:P(-30,-4,30,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
      {arm:[40,20,8], t:0.475, ph:'Takeoff: the skating knee drives up', hipZ:102, hipYaw:202, shYaw:256,
       sh:P(-2,0,154), R:P(-4,8,2,3), L:P(-24,-2,46,0,NEUTRAL), skate:'R', edge:'O', dir:'B'},
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
      {arm:[62,8,18], t:0.84, ph:'Check holds, edge running', hipZ:90, hipYaw:534, shYaw:510,
       sh:P(-8,0,142), L:P(50,15,15,0,NEUTRAL), R:P(-12,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:532, shYaw:518,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(-4,15,0), skate:'R', edge:'O', dir:'B'},
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
       sh:P(-4,0,148), L:P(14,14,0,-0.5), R:P(-49,-6,27,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[60,-2,24], t:0.14, ph:'Knee bends, edge deepens', hipZ:86, hipYaw:-6, shYaw:-20,
       sh:P(2,0,132), L:P(19,18,0,-1), R:P(-55,-5,16,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[54,16,18], t:0.25, ph:'Free leg swings through', hipZ:92, hipYaw:-2, shYaw:-10,
       sh:P(0,0,138), L:P(15,16,0,0.5), R:P(0,-4,10,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
      {arm:[50,26,6], t:0.30, ph:'Takeoff: leg and knee drive up', hipZ:100, hipYaw:8, shYaw:2,
       sh:P(-4,0,154), L:P(2,8,2,3), R:P(46,0,62,0,NEUTRAL), skate:'L', edge:'O', dir:'F'},
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
      {arm:[62,8,18], t:0.70, ph:'Check holds, edge running', hipZ:90, hipYaw:534, shYaw:510,
       sh:P(-8,0,142), L:P(50,15,15,0,NEUTRAL), R:P(-12,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[63,9,18], t:0.86, ph:'Rising out of the landing knee', hipZ:96, hipYaw:534, shYaw:514,
       sh:P(-6,0,148), L:P(59,14,26,0,NEUTRAL), R:P(-6,17,0), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out: still on the back outside edge', hipZ:98, hipYaw:532, shYaw:518,
       sh:P(-5,0,150), L:P(60,13,28,0,NEUTRAL), R:P(-4,15,0), skate:'R', edge:'O', dir:'B'},
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