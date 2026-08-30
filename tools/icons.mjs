/* The app icons, generated rather than drawn.

   A manifest that names no icons gets whatever the operating system decides to
   screenshot, which on a home screen is usually a blurry crop of the nav bar. So
   the guide ships its own — and it draws them from src/lib/tokens.js like
   everything else with a colour in it, because an icon in the site's palette that
   was typed out by hand is a second copy of that palette waiting to disagree with
   the first.

   The mark is a serpentine: two lobes, opposite edges, with the change of edge
   marked at the crossing. It is the shape the whole guide is about, and it is
   still legible at 32 px, which almost nothing else here would be.

   Run: node tools/icons.mjs   (writes public/, commit the result) */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './_rig.mjs';
import { LIGHT } from '../src/lib/tokens.js';

const OUT = join(ROOT, 'public');

/* `pad` insets the mark so a maskable icon survives being cropped to a circle:
   Android may take away everything outside the middle 80%. The "any" icons use
   the full square, the maskable one keeps clear of the edges. */
const svg = ({ pad = 0, round = 0 } = {}) => {
  const s = 512, k = (s - 2 * pad) / s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${round}" fill="${LIGHT.ink}"/>
  <g transform="translate(${pad} ${pad}) scale(${k})">
    <path d="M 76 256 A 90 90 0 0 0 256 256 A 90 90 0 0 1 436 256"
          fill="none" stroke="${LIGHT.ice}" stroke-width="42"
          stroke-linecap="round"/>
    <circle cx="256" cy="256" r="30" fill="${LIGHT['edge-out']}"/>
  </g>
</svg>`;
};

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch {
  console.error('This tool needs sharp, which the site itself does not require:\n' +
    '  npm install --no-save sharp\n');
  process.exit(2);
}

/* The favicon stays vector — it is the one an SVG-capable browser prefers, and it
   is a twentieth of the size of the PNG it replaces. */
await writeFile(join(OUT, 'icon.svg'), svg({ round: 96 }));

const png = async (name, size, opts) =>
  writeFile(join(OUT, name), await sharp(Buffer.from(svg(opts))).resize(size, size).png().toBuffer());

await png('icon-192.png', 192, { round: 0 });
await png('icon-512.png', 512, { round: 0 });
await png('icon-maskable-512.png', 512, { pad: 64, round: 0 });   // 12.5% safe margin each side
await png('apple-touch-icon.png', 180, { round: 0 });             // iOS rounds it itself

console.log('wrote icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png');
