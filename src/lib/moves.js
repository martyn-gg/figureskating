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
      /* Free-leg side is body-relative, not track-relative. Before the rotation the
         skater faces the way they are going, so the trailing leg is at negative t;
         after it they face backwards, so a leg extended behind them points along the
         direction of travel, at positive t. Getting that backwards is invisible frame
         by frame and obvious on a contact sheet. */
      {arm:[64,10,18], t:0.00, ph:'Set-up on the forward outside edge', hipZ:96, hipYaw:-8, shYaw:-24,
       sh:P(-4,0,148), L:P(14,14,0,-0.5), R:P(-49,-6,27), skate:'L', edge:'O', dir:'F'},
      {arm:[60,-2,24], t:0.14, ph:'Knee bends, edge deepens', hipZ:86, hipYaw:-6, shYaw:-20,
       sh:P(2,0,132), L:P(19,18,0,-1), R:P(-55,-5,20), skate:'L', edge:'O', dir:'F'},
      {arm:[54,16,18], t:0.25, ph:'Free leg swings through', hipZ:92, hipYaw:-2, shYaw:-10,
       sh:P(0,0,138), L:P(15,16,0,0.5), R:P(0,-4,26), skate:'L', edge:'O', dir:'F'},
      {arm:[50,26,6], t:0.30, ph:'Takeoff — leg and knee drive up', hipZ:100, hipYaw:8, shYaw:2,
       sh:P(-4,0,154), L:P(2,8,2,3), R:P(46,0,62), skate:'L', edge:'O', dir:'F'},
      {arm:[36,22,6], t:0.32, ph:'Blade leaves the ice', hipZ:118, hipYaw:26, shYaw:18,
       sh:P(-4,0,170), L:P(-12,6,30), R:P(40,-2,70), skate:null},
      {arm:[26,16,10], t:0.36, ph:'Rising, rotation begins', hipZ:126, hipYaw:70, shYaw:56,
       sh:P(-2,0,178), L:P(-26,4,46), R:P(22,-4,74), skate:null},
      {arm:[22,14,12], t:0.39, ph:'Peak — legs pass', hipZ:132, hipYaw:110, shYaw:98,
       sh:P(0,0,184), L:P(-4,8,60), R:P(4,-8,64), skate:null},
      {arm:[26,14,12], t:0.42, ph:'Descending, reaching for the ice', hipZ:114, hipYaw:158, shYaw:142,
       sh:P(-2,0,166), L:P(59,10,52), R:P(-2,0,26), skate:null},
      {arm:[34,14,14], t:0.44, ph:'Front of the blade touches down', hipZ:98, hipYaw:180, shYaw:162,
       sh:P(-4,0,148), L:P(38,12,73), R:P(-4,-11,1,3), skate:'R', edge:'O', dir:'B'},
      {arm:[46,12,16], t:0.48, ph:'Rolling back along the blade', hipZ:96, hipYaw:178, shYaw:158,
       sh:P(-6,0,146), L:P(58,13,34), R:P(-4,-15,0,1), skate:'R', edge:'O', dir:'B'},
      {arm:[58,10,18], t:0.55, ph:'Knee absorbs — deepest landing position', hipZ:84, hipYaw:176, shYaw:152,
       sh:P(-8,0,136), L:P(52,15,61), R:P(-20,-17,0,-1), skate:'R', edge:'O', dir:'B'},
      {arm:[62,8,18], t:0.70, ph:'Check holds, edge running', hipZ:90, hipYaw:174, shYaw:150,
       sh:P(-8,0,142), L:P(50,15,66), R:P(-12,-18,0,-0.5), skate:'R', edge:'O', dir:'B'},
      {arm:[63,9,18], t:0.86, ph:'Rising out of the landing knee', hipZ:96, hipYaw:174, shYaw:154,
       sh:P(-6,0,148), L:P(59,14,35), R:P(-6,-17,0), skate:'R', edge:'O', dir:'B'},
      {arm:[64,10,18], t:1.00, ph:'Run-out — still on the back outside edge', hipZ:98, hipYaw:172, shYaw:158,
       sh:P(-5,0,150), L:P(60,13,37), R:P(-4,-15,0), skate:'R', edge:'O', dir:'B'},
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

/* Arms default to a natural carriage derived from the shoulder line, so every
   move has plausible arms without authoring four more numbers per keyframe.
   Any key may override with LH / RH. Least-verified part of the rig. */
for(const m of Object.values(MOVES)) for(const k of m.keys){
  const R = lateral(k.shYaw), F = anterior(k.shYaw);
  // [out from the shoulder centre, forward, drop] in cm. Default is arms held
  // out and only softly bent — 48 cm past the joint against a 60 cm reach.
  // Wide arms carried through a 180° body rotation sweep a 67 cm arc, which a
  // fixed side camera shows as a violent fore-and-aft swing, so a jump has to
  // gather them in before it turns. That is choreography, not geometry.
  const [out, fwd, drop] = k.arm || [67, 8, 20];
  for(const [side, w] of [[-1,'L'],[1,'R']])
    k[w+'H'] = P(k.sh.t + R[0]*out*side + F[0]*fwd, k.sh.n + R[1]*out*side + F[1]*fwd, k.sh.z - drop);
}