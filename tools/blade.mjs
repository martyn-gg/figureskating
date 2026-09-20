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
     a boot on its SIDE must have the edge of its sole on the ice and its runner
       clear of it — 20/09/2026, the same claim one contact along

   The second is what a keyframe flag could never assert: an exemption can only
   ever excuse a pose, never hold it to anything.

   THE THIRD IS HERE BECAUSE OF WHAT THIS FILE IS ABOUT, which is which part of the
   boot reaches the ice. A boot lying over has a pitch that decides nothing — the
   rocker is out of the ice and pointing sideways out of it — so `pitch` is the wrong
   question and `soleEdgeZ` is the right one. tools/boot.mjs excuses a side contact
   from its roll limit and names this as the other side, because an exemption that
   points nowhere is a hole.

   Broken on purpose:

     --break=slack     every pick set to a blade's pitch ................  3 of 3
     --break=lie       every reference blade set to a pick's ............ 82 of 129
     --break=hover     every side contact's sole lifted 4 cm ............  3 of 3
     --break=shallow   every side contact's runner put back on the ice ...  3 of 3

       node tools/blade.mjs
       node tools/blade.mjs --break=slack|lie|hover|shallow
*/
import { MOVES } from '../src/lib/moves.js';
import { MAX_BLADE_PITCH, contactAlong, bladeZone, contactsDown, onIceOf, soleEdgeZ,
         THIGH, SHIN, anterior, twoBone, bootDir, ankleOf } from '../src/lib/rig-math.js';

const BREAK = (/--break=(\w+)/.exec(process.argv.join(' ')) || [])[1];
let bad = 0, blades = 0, picks = 0, sides = 0;
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
      /* A SKID IS A RUNNER. It has no edge and it is sliding, but it is the same
         rockered steel and it runs off its own front at the same three and a half
         degrees — so it is held to the blade's limit, not the pick's. Sending it
         down the else branch would have demanded it be pitched PAST the blade,
         which is the opposite of flat and the opposite of a stop. */
      if (on === 'blade' || on === 'skid') {
        blades++;
        if (Math.abs(pitch) > MAX_BLADE_PITCH + 1e-9) {
          bad++; console.log(line + '   ← off the blade, and not declared a pick'); continue;
        }
      } else if (on === 'boot') {
        /* A BOOT ON ITS SIDE — 20/09/2026, and the else branch below is why it needs
           naming here rather than falling through. That branch said "not a blade, so a
           pick", which was true of every contact in the file until today and is the
           exemption-shaped hole this repository keeps finding: a description of
           something that changed. A boot lying over is neither, and its PITCH is not
           the quantity that decides it — the rocker is out of the ice and pointing
           sideways out of it, so any pitch is as true as any other.

           WHAT DECIDES IT IS THE PAIR, and this file is where it belongs, because what
           this file holds is which part of the boot reaches the ice:

             the sole's edge is ON the ice   soleEdgeZ === 0
             and the runner is CLEAR of it   z > 0

           The second is what stops a side contact being a deep lean with a better
           name, and it is the pick's assertion read one contact along: a pick must be
           pitched past the blade or the runner still reaches, and a boot must be
           rolled past its own sole or the runner still reaches. tools/boot.mjs excuses
           these from its roll limit and points here for the other side. */
        sides++;
        const k0 = twoBone({ t: 0, n: 0, z: k.hipZ }, q, THIGH, SHIN, anterior(k.hipYaw));
        const bd = bootDir(k, w, k0, q);
        const an = ankleOf(k, w, bd, [k0.t - q.t, k0.n - q.n, k0.z - q.z]);
        const v = [an.t - q.t, an.n - q.n, an.z - q.z];
        const d = v[0]*bd[0] + v[1]*bd[1] + v[2]*bd[2];
        let edge = soleEdgeZ(k, w, bd, [v[0]-d*bd[0], v[1]-d*bd[1], v[2]-d*bd[2]]);
        let zz = q.z;
        if (BREAK === 'hover') { edge += 4; }              // the sole off the ice
        if (BREAK === 'shallow') { zz = -1; }              // the runner still down
        if (Math.abs(edge) > 0.05) {
          bad++; console.log(line + `   ← declared on its side, and the sole's edge is ` +
            `${edge.toFixed(1)} cm ${edge > 0 ? 'off' : 'through'} the ice`); continue;
        }
        if (!(zz > 1e-9)) {
          bad++; console.log(line + '   ← declared on its side, but the runner still reaches the ice'); continue;
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

console.log(`\n${blades} blades, ${picks} picks and ${sides} boots on their side, across the keyframes`);
console.log(bad
  ? `\n${bad} pose${bad === 1 ? '' : 's'} whose geometry and whose declared contact disagree`
  : '\nevery blade is somewhere real on its rocker, every pick is past where a blade can reach,\nand every boot on its side has its sole on the ice and its runner clear of it');
process.exit(bad ? 1 : 0);
