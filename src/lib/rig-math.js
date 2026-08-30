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

   Read these rather than comparing against pose.skate. The comparison was
   correct while a pose could hold one blade and it silently means "free" the
   moment a pose can hold two — the same shape as the featured filter that
   absorbed the twizzles. */
export const onIceOf = (pose, which) =>
  which === pose.skate ? (pose.skate ? 'blade' : null)
                       : ((pose[which] && pose[which].onIce) || null);

export const dirOf = (pose, which) =>
  which === pose.skate ? pose.dir : ((pose[which] && pose[which].dir) || pose.dir);

export function edgeOf(pose, which) {
  if (!pose.skate || which === pose.skate) return pose.edge;
  if (onIceOf(pose, which) !== 'blade') return pose.edge;
  return secondFoot({ foot: pose.skate, edge: pose.edge, dir: pose.dir },
                    dirOf(pose, which)).edge;
}

/** Every foot with a blade on the ice, reference blade first. */
export const bladesDown = pose =>
  ['L', 'R'].filter(w => onIceOf(pose, w) === 'blade')
            .sort((a, b) => (a === pose.skate ? 0 : 1) - (b === pose.skate ? 0 : 1));

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

/* Foot positions are authored as the blade contact, because that is what has to
   sit on the ice. The ankle is elsewhere: up inside the boot and a little back
   of centre. The shin has to end there — run it to the blade instead and the leg
   appears to come out of the sole. Offsets are in the boot's own frame. */
export const ANKLE_UP = 15, ANKLE_BACK = 5;

export function ankleOf(blade, bd, toKnee){
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
  const ul = Math.hypot(...up) || 1;
  return {t: blade.t - bd[0]*ANKLE_BACK + up[0]/ul*ANKLE_UP,
          n: blade.n - bd[1]*ANKLE_BACK + up[1]/ul*ANKLE_UP,
          z: blade.z - bd[2]*ANKLE_BACK + up[2]/ul*ANKLE_UP};
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

   A blade on ice can only lie along its own tracing, so a skating foot takes
   its direction from the travel direction, tilted by any toe-pick pitch
   (+ = toe down). A free foot is not free to be flat: it hangs off the shin.
   So its direction is built from the shin and an ankle angle — 90° would be
   fully pointed, in line with the leg; 0° a right angle. Same transport trick
   as the knee, so the ankle bends about the correct axis wherever the leg is. */
/* How far a free foot points, measured from neutral — 0° is the right angle you
   stand at, 90° would be fully in line with the shin.

   The limit is the boot, not the ankle. A bare ankle plantarflexes maybe 45°, but
   a stiff skating boot encases the foot and lower shin and holds them near square
   to each other. So a skater's free foot never looks like a ballet foot however
   hard they point it — the boot will not let it. Same constraint that keeps the
   shin inside ~28° of lean, seen from the other side. */
export const ANKLE_FREE = 10 * D2R;

export function bootDir(pose, which, knee, foot, skating){
  if(skating){
    const y = (dirOf(pose, which) === 'F' ? 0 : 180) * D2R, p = (foot.pitch || 0) * D2R;
    return [Math.cos(y)*Math.cos(p), -Math.sin(y)*Math.cos(p), -Math.sin(p)];
  }
  const s = [foot.t-knee.t, foot.n-knee.n, foot.z-knee.z];
  const sl = Math.hypot(...s) || 1, u = s.map(c => c/sl);
  let a = transport([0,0,-1], u, anterior(pose.hipYaw));
  const d = a[0]*u[0] + a[1]*u[1] + a[2]*u[2];
  a = [a[0]-d*u[0], a[1]-d*u[1], a[2]-d*u[2]];
  const al = Math.hypot(...a) || 1;
  a = a.map(c => c/al);
  const c = Math.cos(ANKLE_FREE), sn = Math.sin(ANKLE_FREE);
  return [a[0]*c + u[0]*sn, a[1]*c + u[1]*sn, a[2]*c + u[2]*sn];
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
    const k = seg.kind==='arc' ? -lobeSense(seg.foot,seg.edge,seg.dir)/move.radius : 0;
    const len = seg.kind==='arc' ? move.radius*seg.sweep*D2R : seg.len;
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
                       ...(a.onIce ? {onIce:a.onIce} : {}), ...(a.dir ? {dir:a.dir} : {})});

export function poseAt(move, t){
  const K = move.keys;
  let i = 0; while(i < K.length-2 && K[i+1].t <= t) i++;
  const a = K[i], b = K[Math.min(i+1,K.length-1)];
  const span = Math.max(1e-6, b.t-a.t);
  const raw = Math.min(1, Math.max(0, (t-a.t)/span));
  const u = raw*raw*(3-2*raw);
  return {
    hipZ: lp(a.hipZ,b.hipZ,u), hipYaw: lp(a.hipYaw,b.hipYaw,u), shYaw: lp(a.shYaw,b.shYaw,u),
    sh: lpP(a.sh,b.sh,u), L: lpP(a.L,b.L,u), R: lpP(a.R,b.R,u),
    LH: lpP(a.LH,b.LH,u), RH: lpP(a.RH,b.RH,u),
    skate: a.skate, edge: a.edge, dir: a.dir, ph: a.ph,
  };
}
