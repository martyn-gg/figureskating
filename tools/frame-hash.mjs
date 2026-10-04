/* One hash per move over EVERY frame of all three views, rendered through the real
   renderers (tools/_dom.mjs). Session 29, 04/10/2026.

   The workflow note "Hash the frames" did this by hand with frame-svg.mjs at seven
   times a move and one shasum. Seven samples prove a render change inert at seven
   instants; a change that only bites between them (an interpolation, a run of
   pinned frames) walks straight past. This takes every frame, and prints one line
   per move so a diff names the moves that changed rather than saying "something did".

       node tools/frame-hash.mjs > before.txt     # change something
       node tools/frame-hash.mjs > after.txt
       diff before.txt after.txt                  # every line is a move that moved

   --every N samples every Nth frame, for a quick look. --move a,b limits the set. */
import { createHash } from 'node:crypto';
import { MOVES } from '../src/lib/moves.js';
import { rigFor, standalone } from './_dom.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i === -1 ? d : process.argv[i + 1]; };
const every = Number(arg('--every', 1));
const only = arg('--move', null)?.split(',');

for (const id of Object.keys(MOVES)) {
  if (only && !only.includes(id)) continue;
  const { rig, svgs } = rigFor(id);
  const h = createHash('sha256');
  for (let i = 0; i < rig.frames; i += every) {
    rig.seek(i);
    for (const s of svgs) h.update(standalone(s));
  }
  console.log(`${id.padEnd(26)} ${String(rig.frames).padStart(4)}  ${h.digest('hex').slice(0, 16)}`);
}
