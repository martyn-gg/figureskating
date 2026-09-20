/* Bringing the arms in speeds the spin up - asserted, not captioned.
 *
 * Martyn, 19/09/2026: bringing the arms in increases the speed of the spin. He
 * is right, it is the first thing anyone is taught about a spin, and the rig
 * drew three spins that turned at one rate from the first frame to the last
 * while the arms stayed where they were put. The pictures were not wrong so much
 * as silent about the only thing a beginner is trying to learn.
 *
 * THE EXPECTATION COMES FROM OUTSIDE THE RIG, which is what makes this a checker
 * and not a restatement. Angular momentum is conserved: a skater who draws mass
 * towards the axis turns faster, and one who puts it out again turns slower. The
 * ISU agrees in its own vocabulary - "clear increase of speed" is a Level
 * feature, and one of the six that can earn a spin Level 4.
 *
 * WHAT IS ASSERTED IS THE DIRECTION, NOT THE RATIO, and the reason is the same
 * one spin.mjs gives for declining to judge where the axis sits: this rig has
 * markers and no mass. A real skater's moment of inertia falls by perhaps three
 * or four times between wide arms and crossed ones, because most of the mass is
 * in a trunk that barely moves. A marker model has no trunk, so the same gather
 * changes its spread by nine, and asserting conservation would demand the
 * animation draw a nine-fold speed-up. That would be a checker forcing the
 * picture to be wrong. So:
 *
 *   - where the skater gathers in, the rate must not fall
 *   - where the skater opens out, the rate must not rise
 *   - and every spin must contain a wind-up where the spread falls AND the
 *     rate rises, because a spin drawn without one is the fault this exists for
 *
 * SPREAD is the mean squared horizontal distance of the rig's markers from the
 * spin axis - the shoulders, both hands and both feet, plus the hip. Squared,
 * because that is what moment of inertia weights by, and horizontal because a
 * vertical axis does not care how high a marker is. Measured against the axis
 * rather than the hip: on a sit spin the hip is a third of a metre off the axis
 * and it is the axis the skater turns about. The axis is read per frame from the
 * blade, because which of those two is off the other changes with the position.
 *
 * ONLY THE CENTRED PART IS JUDGED. During the entrance and the exit the skater
 * is travelling, the path radius is not the spin radius, and "the axis" is not
 * a fixed point the body turns about - so a rate change there is about where
 * they are going rather than about what they have gathered.
 *
 * Broken on purpose. Counts are places reported:
 *
 *   --break=flat     every centred segment at one rate ............ 5
 *   --break=wide     the wind-up's arms held at entrance width .... 8
 *   --break=invert   the centred rates reversed .................... 9
 *   --break=freespin the change of foot given a rate RISE ........... 2
 *
 *     npm run check:gather
 */
import { MOVES } from '../src/lib/moves.js';
import { poseAt } from '../src/lib/rig-math.js';
import { lobeSense } from '../src/lib/skating.js';

const BREAK = (process.argv.find(a => a.startsWith('--break')) || '').split('=')[1] || null;

const SAMPLES = 40;
/* How much the spread must move before a rate is held to it. Below this the two
   segments are the same shape and the rate is free. */
const NOISE = 0.04;            // fraction of the spread

const isSpin = m => m.path.every(s => s.kind === 'arc')
  && new Set(m.path.map(s => lobeSense(s.foot, s.edge, s.dir))).size === 1
  && m.path.reduce((a, s) => a + s.sweep, 0) >= 360;

const MARKERS = ['sh', 'LH', 'RH', 'L', 'R'];

let bad = 0, spins = 0;
console.log(`the gather and the rate${BREAK ? `  [--break=${BREAK}]` : ''}\n`);

for (const [id, m] of Object.entries(MOVES)) {
  if (!isSpin(m)) continue;
  spins++;

  const spans = m.path.map(s => s.span ?? 1 / m.path.length);
  const sum = spans.reduce((a, b) => a + b, 0);
  let c = 0;
  const segs = m.path.map((seg, i) => {
    const from = c / sum; c += spans[i];
    return { seg, from, to: c / sum, radius: seg.radius ?? m.radius };
  });

  const centred = segs.filter(s => s.seg.position || s.seg.windup);
  if (!centred.length) continue;

  /* THE AXIS IS READ PER FRAME, FROM THAT FRAME'S OWN BLADE - square off it at
     the path radius, which is where the centre of curvature is.

     Taking it once from the first centred segment and holding it was this
     file's first bug, and it reported the opposite of the truth. The pose is
     hip-relative, and a sit spin's fold carries the hip a third of a metre
     behind the blade while an upright's sits over it. So between a held sit and
     a held upright the blade's along-track offset changes, the axis moves
     relative to the hip, and a fixed axis measured the upright's markers from a
     point 40 cm away - which made a spin gathering in look like one opening
     out. The blade is pinned to the path and the path is the circle; the axis
     follows the blade, and the hip is the thing that moves. */
  const axisAt = (s, t) => {
    const p = poseAt(m, t), b = p[p.skate];
    const ls = lobeSense(s.seg.foot, s.seg.edge, s.seg.dir);
    return [b.t, b.n - ls * s.radius];
  };

  const spreadOf = (s) => {
    let tot = 0, n = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const t = s.from + (s.to - s.from) * (i / SAMPLES);
      const pose = poseAt(m, t);
      const [ax, an] = axisAt(s, t);
      for (const w of MARKERS) {
        let q = pose[w];
        if (!q) continue;
        /* the mutation: hold the wind-up's hands out where the entrance had them */
        if (BREAK === 'wide' && s.seg.windup && (w === 'LH' || w === 'RH')) {
          const e = poseAt(m, segs[0].from);
          q = e[w];
        }
        tot += (q.t - ax) ** 2 + (q.n - an) ** 2; n++;
      }
      tot += (0 - ax) ** 2 + (0 - an) ** 2; n++;      // the hip
    }
    return tot / n;
  };

  const rates = centred.map(s => s.seg.rate);
  const order = BREAK === 'flat' ? centred.map(() => rates[0])
    : BREAK === 'invert' ? [...rates].reverse()
    : BREAK === 'freespin' ? rates.map((r, i) => (i && centred[i].seg.foot !== centred[i - 1].seg.foot ? r + 1 : r))
    : rates;

  const rows = centred.map((s, i) => ({ s, rate: order[i], spread: spreadOf(s) }));

  const fail = msg => { bad++; console.log(`  ${msg}`); };

  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    const d = (b.spread - a.spread) / a.spread;

    /* ACROSS A CHANGE OF FOOT THE SHAPE DOES NOT DECIDE THE RATE. A step-over
       costs speed through the transfer itself, not through anything the body
       has opened out - so a skater can come out of it tighter AND slower, and
       holding the two together here would be asserting the wrong physics.

       The exemption is not a hole: an exemption can only excuse a pose, so the
       other side is asserted instead. A change of foot may cost speed and may
       hold it, and may not GAIN it. Nobody spins up by putting a foot down. */
    if (a.s.seg.foot !== b.s.seg.foot) {
      if (b.rate > a.rate)
        fail(`FREE SPIN  ${id}  the change of foot GAINS speed, ${a.rate} -> ${b.rate} rev/s` +
             ` - a step-over can cost rotation or hold it, never make it`);
      continue;
    }

    if (d < -NOISE && b.rate < a.rate)
      fail(`SLOWER  ${id}  segment ${i} draws ${((-d) * 100).toFixed(0)}% in and turns SLOWER, ${a.rate} -> ${b.rate} rev/s`);
    if (d > NOISE && b.rate > a.rate)
      fail(`FASTER  ${id}  segment ${i} opens ${(d * 100).toFixed(0)}% out and turns FASTER, ${a.rate} -> ${b.rate} rev/s`);
  }

  const w = rows.findIndex(r => r.s.seg.windup);
  if (w < 1) fail(`NO WIND-UP  ${id}  has no wind-up segment to gather into`);
  else {
    const before = rows[w - 1], wind = rows[w];
    const drew = (before.spread - wind.spread) / before.spread;
    if (!(drew > NOISE && wind.rate > before.rate))
      fail(`NO GATHER  ${id}  the wind-up draws ${(drew * 100).toFixed(0)}% in and goes ${before.rate} -> ${wind.rate} rev/s` +
           ` - a wind-up that does not both gather and quicken is not one`);
  }

  console.log(`  ${id.padEnd(16)} ` + rows.map(r =>
    `${r.rate}rev/s@${Math.sqrt(r.spread).toFixed(0)}cm`).join('  ->  '));
}

console.log(`\n${spins} spins measured, spread as the root mean square distance of the markers from the axis`);
console.log(bad
  ? `\n${bad} place${bad === 1 ? '' : 's'} where the rate and the gather disagree`
  : 'every spin quickens as it gathers in, slows as it opens out, and winds up at the end');
process.exit(bad ? 1 : 0);
