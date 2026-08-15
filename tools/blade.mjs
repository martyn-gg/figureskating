/* A figure blade is rockered, so boot pitch decides which part of it is touching —
   and running the contact off the front takes barely three and a half degrees. Past
   that the skater is on the toe pick, which is a jab and not a stance. Any on-ice
   pose asking for more than the blade allows is drawing a ballet pointe. */
import { MOVES } from '../src/lib/moves.js';
import { MAX_BLADE_PITCH, contactAlong, bladeZone } from '../src/lib/rig-math.js';

let bad = 0;
console.log(`boot pitch against what a rockered blade allows (±${MAX_BLADE_PITCH.toFixed(1)}°)\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys) {
    if (!k.skate) continue;
    const q = k[k.skate], pitch = q.pitch || 0;
    const line = `  ${key.padEnd(7)} t=${k.t.toFixed(2)} ${k.skate}  ${String(pitch).padStart(5)}°  ` +
      `${contactAlong(pitch).toFixed(1).padStart(6)} cm  ${bladeZone(pitch)}`;
    if (Math.abs(pitch) > MAX_BLADE_PITCH + 1e-9 && !k.pick) {
      bad++; console.log(line + '   ← off the blade, and not marked as a pick');
    } else console.log(line);
  }

console.log(bad
  ? `\n${bad} poses pitched past what the blade allows — set pick:true or reduce the pitch`
  : '\nevery on-ice pose is somewhere real on the blade');
process.exit(bad ? 1 : 0);
