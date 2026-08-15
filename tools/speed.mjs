/* The speed control must actually change the speed.

   A dead playback control is invisible: the button relabels itself, the picture
   keeps moving, and nothing looks wrong. The first version of this feature was
   measured rather than eyeballed and the first measurement read zero at every
   setting — which turned out to be the measuring script's fault, but only
   because something was measuring at all.

   Plays each animation for a fixed wall-clock interval at every speed setting
   and asserts the frames advanced roughly halve each time.

   Needs Playwright, so it is not in `npm run check` — the browser download is
   too heavy to inflict on anyone who only wants to build pages.

       npm run build && node tools/speed.mjs
*/

import { browser, serveDist } from './_rig.mjs';

const WINDOW_MS = 900;
const TOLERANCE = 0.28;        // wall-clock jitter in a headless browser is real

const TARGETS = [
  { name: 'edge diagram', url: '/elements/lfo-counter/', sel: '.diagram' },
  { name: 'body frame',   url: '/elements/waltz-jump/',  sel: '.bf' },
];

const srv = await serveDist();
const b = await browser();
const page = await b.newPage({ viewport: { width: 414, height: 900 } });
let failures = 0;

const run = async (url, clicks) => {
  await page.goto(`${srv.origin}${url}`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  return page.evaluate(async ([n, ms]) => {
    const btn = document.querySelector('[data-speed]') || document.getElementById('rig-speed');
    const play = document.querySelector('[data-play]') || document.getElementById('rig-play');
    const scrub = document.querySelector('[data-scrub]') || document.getElementById('rig-scrub');
    if (!btn || !play || !scrub) return { missing: true };
    for (let k = 0; k < n; k++) btn.click();
    if (play.textContent.trim() === '▶') play.click();
    scrub.value = '0'; scrub.dispatchEvent(new Event('input'));
    if (play.textContent.trim() === '▶') play.click();      // scrubbing pauses; resume
    await new Promise(r => setTimeout(r, ms));
    return { frames: Number(scrub.value), label: btn.textContent.trim() };
  }, [clicks, WINDOW_MS]);
};

console.log(`playback speed (frames advanced in ${WINDOW_MS} ms at each setting)\n`);

for (const t of TARGETS) {
  const rows = [];
  for (const n of [0, 1, 2, 3]) rows.push(await run(t.url, n));
  if (rows.some(r => r.missing)) {
    console.error(`  ✗ ${t.name}: no speed control found`); failures++; continue;
  }
  console.log(`  ${t.name}`);
  for (const r of rows) console.log(`    ${r.label.padEnd(3)} ${String(r.frames).padStart(4)}`);

  if (rows[0].frames < 10) { console.error(`  ✗ ${t.name}: not animating at all`); failures++; continue; }
  for (let k = 1; k < rows.length; k++) {
    const ratio = rows[k].frames / rows[k - 1].frames;
    if (Math.abs(ratio - 0.5) > TOLERANCE) {
      console.error(`  ✗ ${t.name}: ${rows[k - 1].label} → ${rows[k].label} changed the rate by ` +
        `${ratio.toFixed(2)}×, expected about half`);
      failures++;
    }
  }
}

await b.close();
srv.close();

if (failures) { console.error(`\n${failures} speed check(s) failed`); process.exit(1); }
console.log('\nevery step of the speed control halves the rate, on both engines');
