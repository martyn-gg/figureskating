/* The two things a boot glyph claims, asserted on every frame of every move in
   both profile views.

   1  THE EDGE DOT MARKS A BITING EDGE, so it is drawn on a boot that is on the
      ice and on no other. A free foot is in the air — the glyph says so in
      --free — and a dot on it asserts ice contact the model is simultaneously
      denying. It was drawn on both.

   2  A BOOT DRAWN END-ON ROLLS WITH ITS OWN BOOT, and a skating boot is never
      drawn past the roll a stiff boot allows.

   The second one needs an expected value that does not come from the renderer,
   or it asserts nothing. It comes from the ankle: ankleOf places the ankle by
   building the boot's up-axis out of the leg's direction, and the leg is DRAWN
   ending at that ankle. So the direction from the blade to the ankle, with the
   boot's own direction taken out, is where the glyph's cuff has to face — the
   model's output, not a second copy of its internals. If ankleOf's up-axis and
   the renderer's ever part company, the picture shows a boot whose opening is
   not where the leg goes into it, and this catches it.

   Why it is worth having, measured against the code as it stood on 29/08/2026,
   before the derivation was fixed:

     rolls past 60 deg    1102 of 1828 end-on glyphs; the extended edge 379 of
                          379, every frame, spanning only -90.0 to -91.7 deg.
                          Boots drawn lying on the ice in every rear view.
     free boots with a
     wrongly drawn dot     583 of 583.

   The spiral and the teapot scored 0 on the first of those, which is the whole
   reason it survived: their skating pitch is authored as exactly 0, and that is
   the one value that made the bad term vanish. The element the standing rule
   says to shoot first is the one element that could not show this.

       node tools/boot.mjs
*/
import { MOVES } from '../src/lib/moves.js';
import { THIGH, SHIN, anterior, twoBone, bootDir, ankleOf, buildPath, poseAt } from '../src/lib/rig-math.js';
import { rigFor, walk } from './_dom.mjs';

/* A stiff boot allows about 28 deg of lean (tools/shin.mjs), and seen end-on the
   boot's roll IS that lean, give or take what the projection does to a boot that
   is also pitched. Anything past this is a boot lying over, not a boot on an edge. */
const ROLL_LIMIT = 30;
const TOL = 0.02;                      // degrees: the drawn value is rounded to 2 dp, nothing else

const unit = v => { const l = Math.hypot(...v) || 1; return v.map(c => c / l); };

let worst = 0;
let dotBad = 0, rollBad = 0, overBad = 0, endOn = 0, dots = 0, glyphs = 0;
const say = (...a) => console.log('  ' + a.join(' '));

for (const [key, m] of Object.entries(MOVES)) {
  const path = buildPath(m);
  for (const mode of ['side', 'rear']) {
    const { rig, byView } = rigFor(key, [mode]);
    const svg = byView[mode];
    const vx = v => mode === 'side' ? v[0] : v[1];

    for (let i = 0; i < rig.frames; i++) {
      rig.seek(i);
      const pose = poseAt(m, i / (path.length - 1));

      walk(svg, holder => {
        const role = holder.attrs['data-boot'];
        if (!role) return;
        glyphs++;
        const which = holder.attrs['data-foot'];
        const skating = role === 'skating';

        /* what the picture claims */
        let drawn = null, dot = 0;
        walk(holder, n => {
          if (n.attrs['data-roll'] !== undefined) drawn = Number(n.attrs['data-roll']);
          if (n.attrs['data-edge-dot'] !== undefined) dot++;
        });

        /* 1 — the dot */
        if (dot) dots++;
        if (!skating && dot) {
          dotBad++;
          if (dotBad <= 6) say(`DOT   ${key} ${mode} f=${i} ${which}  edge dot on a free boot`);
        }
        if (skating && drawn !== null && !dot) {
          dotBad++;
          if (dotBad <= 6) say(`DOT   ${key} ${mode} f=${i} ${which}  no edge dot on a skating boot drawn end-on`);
        }

        if (drawn === null) return;                 // side-on glyph: no roll claimed
        endOn++;

        /* 2 — the roll, expected from where the model put the ankle */
        const q = pose[which];
        const kn0 = twoBone({ t: 0, n: 0, z: pose.hipZ }, q, THIGH, SHIN, anterior(pose.hipYaw));
        const bd = bootDir(pose, which, kn0, q, skating);
        const ank = ankleOf(q, bd, [kn0.t - q.t, kn0.n - q.n, kn0.z - q.z]);
        const up = [ank.t - q.t, ank.n - q.n, ank.z - q.z];
        const f3 = unit(bd);
        const d = up[0] * f3[0] + up[1] * f3[1] + up[2] * f3[2];
        const u = unit([up[0] - d * f3[0], up[1] - d * f3[1], up[2] - d * f3[2]]);
        const want = Math.atan2(vx(u), u[2]) * 180 / Math.PI;

        let off = Math.abs(drawn - want);
        if (off > 180) off = 360 - off;
        worst = Math.max(worst, off);
        if (off > TOL) {
          rollBad++;
          if (rollBad <= 8) say(`ROLL  ${key} ${mode} f=${i} ${which} ${role}  drawn ${drawn.toFixed(1)}°, ` +
            `boot's own up-axis ${want.toFixed(1)}°  (off by ${off.toFixed(1)}°)`);
        }

        if (skating && Math.abs(drawn) > ROLL_LIMIT) {
          overBad++;
          if (overBad <= 8) say(`OVER  ${key} ${mode} f=${i} ${which}  skating boot drawn at ${drawn.toFixed(1)}° ` +
            `of roll, past the ${ROLL_LIMIT}° a boot allows`);
        }
      });
    }
  }
}

console.log(`\nboot glyphs ${glyphs}, of them ${endOn} drawn end-on; ${dots} carry an edge dot.\n` +
  `worst disagreement between a drawn roll and the boot's own up-axis: ${worst.toFixed(2)}°\n`);
const bad = dotBad + rollBad + overBad;
console.log(bad
  ? `${dotBad} edge dots on the wrong foot, ${rollBad} rolls disagreeing with the boot, ` +
    `${overBad} past ${ROLL_LIMIT}°`
  : `every edge dot is on a blade that is on the ice; every end-on boot rolls with its own ` +
    `up-axis, and no skating boot is drawn past ${ROLL_LIMIT}°`);
process.exit(bad ? 1 : 0);
