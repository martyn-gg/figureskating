/* A figure blade is rockered, so boot pitch decides which part of it is touching —
   and running the contact off the front takes barely three and a half degrees. Past
   that the skater is on the toe pick, which is a jab and not a stance. Any on-ice
   pose asking for more than the blade allows is drawing a ballet pointe. */
import { MOVES } from '../src/lib/moves.js';
import { MAX_BLADE_PITCH, contactAlong, bladeZone, bladesDown } from '../src/lib/rig-math.js';

let bad = 0;
console.log(`boot pitch against what a rockered blade allows (±${MAX_BLADE_PITCH.toFixed(1)}°)\n`);

for (const [key, m] of Object.entries(MOVES))
  for (const k of m.keys)
    /* EVERY blade on the ice, not just the reference one. A second blade is as
       rockered as the first and runs off its own front at the same 3.5°. */
    for (const w of bladesDown(k)) {
    const q = k[w], pitch = q.pitch || 0;
    const line = `  ${key.padEnd(7)} t=${k.t.toFixed(2)} ${w}  ${String(pitch).padStart(5)}°  ` +
      `${contactAlong(pitch).toFixed(1).padStart(6)} cm  ${bladeZone(pitch)}`;
    if (Math.abs(pitch) > MAX_BLADE_PITCH + 1e-9 && !k.pick) {
      bad++; console.log(line + '   ← off the blade, and not marked as a pick');
    } else console.log(line);
  }

console.log(bad
  ? `\n${bad} poses pitched past what the blade allows — set pick:true or reduce the pitch`
  : '\nevery on-ice pose is somewhere real on the blade');
process.exit(bad ? 1 : 0);
