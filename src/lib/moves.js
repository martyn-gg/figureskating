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
   touching, which is most of what distinguishes one edge from another. Mark a
   genuine pick with pick:true on the keyframe. */

import { anterior, lateral } from './rig-math.js';

const P = (t,n,z,pitch=0) => ({t,n,z,pitch});

/* An AUTHORED hand. The flag is the whole of the LH/RH fix below: it is what the
   default-carriage loop refuses to overwrite, and it is what the renderer reads
   to decide whether the guide names which hand is which. One field, in place of
   both a silent overwrite and a measured threshold standing in for intent. */
const PH = (t,n,z,pitch=0) => ({t,n,z,pitch,authored:true});

/* A SECOND BLADE ON THE ICE. `skate` names the reference blade — the one the path
   is built from and the one the hip hangs off — and stays single-valued; this
   marks the other foot as also down. Its EDGE is deliberately not an argument:
   both blades are on one circle, so secondFoot derives it from the reference
   blade and this foot's direction of travel. Pass a direction only where the two
   feet oppose, which is what a spread eagle's turnout is; leave it out and the
   foot travels the way the skater does. */
const ON = (t,n,z,pitch=0,dir=null) => ({t,n,z,pitch,onIce:'blade',...(dir?{dir}:{})});

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
       sh:P(-4,0,148), L:P(14,14,0,-0.5), R:P(-49,-6,27), skate:'L', edge:'O', dir:'F'},
      {arm:[60,-2,24], t:0.14, ph:'Knee bends, edge deepens', hipZ:86, hipYaw:-6, shYaw:-20,
       sh:P(2,0,132), L:P(19,18,0,-1), R:P(-55,-5,16), skate:'L', edge:'O', dir:'F'},
      {arm:[54,16,18], t:0.25, ph:'Free leg swings through', hipZ:92, hipYaw:-2, shYaw:-10,
       sh:P(0,0,138), L:P(15,16,0,0.5), R:P(0,-4,10), skate:'L', edge:'O', dir:'F'},
      {arm:[50,26,6], t:0.30, ph:'Takeoff — leg and knee drive up', hipZ:100, hipYaw:8, shYaw:2,
       sh:P(-4,0,154), L:P(2,8,2,3), R:P(46,0,62), skate:'L', edge:'O', dir:'F'},
      {arm:[36,22,6], t:0.32, ph:'Blade leaves the ice', hipZ:118, hipYaw:26, shYaw:18,
       sh:P(-4,0,170), L:P(-12,6,30), R:P(40,-2,70), skate:null},
      {arm:[26,16,10], t:0.36, ph:'Rising, rotation begins', hipZ:126, hipYaw:70, shYaw:56,
       sh:P(-2,0,178), L:P(-26,4,46), R:P(22,-4,74), skate:null},
      {arm:[22,14,12], t:0.39, ph:'Peak — legs pass', hipZ:132, hipYaw:110, shYaw:98,
       sh:P(0,0,184), L:P(-4,8,60), R:P(4,-8,64), skate:null},
      {arm:[26,14,12], t:0.42, ph:'Descending, reaching for the ice', hipZ:114, hipYaw:158, shYaw:142,
       sh:P(-2,0,166), L:P(59,10,46), R:P(-2,0,26), skate:null},
      {arm:[34,14,14], t:0.44, ph:'Front of the blade touches down', hipZ:98, hipYaw:180, shYaw:162,
       sh:P(-4,0,148), L:P(38,12,26), R:P(-4,11,1,3), skate:'R', edge:'O', dir:'B'},
      {arm:[46,12,16], t:0.48, ph:'Rolling back along the blade', hipZ:96, hipYaw:178, shYaw:158,
       sh:P(-6,0,146), L:P(58,13,25), R:P(-4,15,0,1), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,18], t:0.55, ph:'Knee absorbs — deepest landing position', hipZ:84, hipYaw:176, shYaw:152,
       sh:P(-8,0,136), L:P(52,15,10), R:P(-20,17,0,-1), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.70, ph:'Check holds, edge running', hipZ:90, hipYaw:174, shYaw:150,
       sh:P(-8,0,142), L:P(50,15,15), R:P(-12,18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[63,9,18], t:0.86, ph:'Rising out of the landing knee', hipZ:96, hipYaw:174, shYaw:154,
       sh:P(-6,0,148), L:P(59,14,26), R:P(-6,17,0), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out — still on the back outside edge', hipZ:98, hipYaw:172, shYaw:158,
       sh:P(-5,0,150), L:P(60,13,28), R:P(-4,15,0), skate:'R', edge:'O', dir:'B'},
    ]},

  spiral: {
    name:'Spiral',
    note:'held position · free leg at or above hip height',
    path:[{kind:'arc', foot:'L', edge:'O', dir:'F', sweep:150}],
    radius:150, duration:5,
    keys:[
      {t:0.00, ph:'Entering the position', hipZ:95, hipYaw:-4, shYaw:-12,
       sh:P(16,0,139), L:P(0,10,0), R:P(-58,-2,73), skate:'L', edge:'O', dir:'F'},
      {t:0.34, ph:'Free leg rising, chest lifts', hipZ:94, hipYaw:-6, shYaw:-14,
       sh:P(28,0,130), L:P(0,13,0), R:P(-73,-2,99), skate:'L', edge:'O', dir:'F'},
      {t:1.00, ph:'Held — hips square, leg above the hip', hipZ:94, hipYaw:-6, shYaw:-14,
       sh:P(34,0,124), L:P(0,14,0), R:P(-70,-2,117), skate:'L', edge:'O', dir:'F'},
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
      {t:1.00, ph:'Held — extended, free foot turned out', hipZ:90, hipYaw:175, shYaw:157,
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
      {t:1.00, ph:'Held — the right blade inside, the left outside', hipZ:96, hipYaw:0, shYaw:-5,
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
       sh:P(8,0,110), L:P(30,-6,0), R:P(46,8,16), skate:'L', edge:'I', dir:'F'},
      {t:1.00, ph:'Held low, free leg extended', hipZ:40, hipYaw:0, shYaw:-2,
       sh:P(16,0,88), L:P(29,-5,0), R:P(80,8,10), skate:'L', edge:'I', dir:'F'},
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
MOVES.spiralCheck.name = 'Spiral — arms checked';
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