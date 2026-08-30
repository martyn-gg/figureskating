/* A figure blade is rockered, so boot pitch decides which part of it is touching —
   and running the contact off the front takes barely three and a half degrees. Past
   that the skater is on the toe pick, which is a jab and not a stance. Any on-ice
   pose asking for more than the blade allows is drawing a ballet pointe.

   TWO ASSERTIONS SINCE 30/08/2026, and they are the same claim from both sides.
   Until then a keyframe could carry `pick: true`, which this file read as "exempt
   every on-ice blade in this frame from the limit" — precisely backwards for the
   only pose that would ever want it, since a picked pose has one foot on an edge
   and the other on the teeth, and the flag exempted both. It had never been set on
   any keyframe, so nothing was broken; it was a description waiting to be believed.

   The contact is declared on the FOOT now, so the check is per foot and runs both
   ways:

     a blade must be inside ±MAX_BLADE_PITCH — past that there is no runner left
     a pick must be OUTSIDE it, toe down — otherwise calling it a pick is a lie,
       and a pose is quietly claiming a contact its geometry does not make

   The second is what a keyframe flag could never assert: an exemption can only
   ever excuse a pose, never hold it to anything. Broken on purpose: every pick set
   to a blade's pitch, 3 of 3; every reference blade set to a pick's, 37 of 40.

       node tools/blade.mjs
       node tools/blade.mjs --break=slack|lie
*/
import { MOVES } from '../src/lib/moves.js';
import { MAX_BLADE_PITCH, contactAlong, bladeZone, contactsDown, onIceOf } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
let bad = 0, blades = 0, picks = 0;
console.log(`boot pitch against what a rockered blade allows (±${MAX_BLADE_PITCH.toFixed(1)}°)` +
  `${BREAK ? `, broken on purpose: ${BREAK}` : ''}\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    /* EVERY contact, not just the reference blade. A second blade is as rockered
       as the first and runs off its own front at the same 3.5°; a pick is not
       rockered at all and is held to the opposite rule. */
    for (const w of contactsDown(k)) {
      const q = k[w], on = onIceOf(k, w);
      let pitch = q.pitch || 0;
      if (BREAK === 'slack' && on === 'pick') pitch = 2;
      if (BREAK === 'lie' && on === 'blade' && w === k.skate) pitch = 40;
      const line = `  ${key.padEnd(9)} t=${k.t.toFixed(2)} ${w} ${on.padEnd(5)} ${String(pitch).padStart(5)}°  ` +
        `${contactAlong(pitch).toFixed(1).padStart(6)} cm  ${bladeZone(pitch)}`;
      if (on === 'blade') {
        blades++;
        if (Math.abs(pitch) > MAX_BLADE_PITCH + 1e-9) {
          bad++; console.log(line + '   ← off the blade, and not declared a pick'); continue;
        }
      } else {
        picks++;
        /* Toe down only. The other way round bladeZone says "off the heel", and
           there are no teeth at the back of a blade to stand on. */
        if (!(pitch > MAX_BLADE_PITCH + 1e-9)) {
          bad++; console.log(line + '   ← declared a pick, but the blade still reaches the ice'); continue;
        }
      }
      console.log(line);
    }

console.log(`\n${blades} blades and ${picks} picks on the ice across the keyframes`);
console.log(bad
  ? `\n${bad} pose${bad === 1 ? '' : 's'} whose pitch and whose declared contact disagree`
  : '\nevery blade is somewhere real on its rocker, and every pick is past where a blade can reach');
process.exit(bad ? 1 : 0);
