/* The token pairs must meet their targets, in both colour schemes.

   Contrast is the one part of a visual design that is not a matter of opinion,
   and it was measured before the design pass rather than guessed: the two edge
   colours differed by 1.09:1 in luminance, so outside versus inside edge — the
   single most important thing a tracing says — was carried by hue alone. This
   checker exists because that is trivial to reintroduce by nudging one hex code,
   and impossible to notice by looking at a screen you have already got used to.

   It imports src/lib/tokens.js rather than parsing a stylesheet, for the same
   reason tracing.mjs imports skating.js: a checker that keeps its own copy of
   the thing it checks is checking the copy.

       node tools/contrast.mjs
       node tools/contrast.mjs --break    # put the old edge pair back

   `--break` restores the two pairs this pass replaced — the edge colours and the
   rig's limbs. It must fail, and *what* it fails on is the only evidence that the
   checker is worth having: everything else about the page still measures fine,
   and the guide quietly stops working.
*/

import { SCHEMES } from '../src/lib/tokens.js';

const channels = hex => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
};

/** WCAG relative luminance. */
const luminance = hex => {
  const [r, g, b] = channels(hex).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* Each pair carries its target and the reason for it. The reason is in the file
   because a bare number invites the next person to lower it.

   4.5 is the text threshold, and it is also what the two pairs that carry a
   distinction are held to — the edges and the limbs. A line would normally be
   held to 3:1, but this is read in a cold rink under bad light, at arm's length,
   often through gallery glass or on a tilted tablet, and glare eats the low end
   of the range. 3:1 remains the floor for a line merely being visible against
   its panel. */
const PAIRS = [
  ['ink', 'paper', 4.5, 'body text'],
  ['ink-soft', 'paper', 4.5, 'soft text on paper'],
  ['ink-soft', 'ice', 4.5, 'soft text on an ice panel'],
  ['accent', 'paper', 4.5, 'links'],
  ['warn', 'paper', 4.5, 'the unverified banner'],

  /* The headline. This pair is the difference between a flip and a Lutz. */
  ['edge-out', 'edge-in', 4.5, 'OUTSIDE EDGE AGAINST INSIDE EDGE'],
  ['edge-out', 'ice', 3, 'the outside edge on ice'],
  ['edge-in', 'ice', 3, 'the inside edge on ice'],

  ['grid-line', 'ice', 3, 'the matrix grid, which is what makes an 8 x 4 table readable'],
  ['grid-line', 'paper', 3, 'the matrix grid on paper'],
  /* Panel edging carries nothing, so it is held only to separating a panel from
     the page it sits on. */
  ['ice-line', 'ice', 1.9, 'panel edging'],
  ['ice', 'paper', 1.03, 'an ice panel against the page'],

  ['leg-l', 'leg-r', 4.5, 'THE LEFT LIMB AGAINST THE RIGHT'],
  ['leg-l', 'ice', 3, 'the left limb on ice'],
  ['leg-r', 'ice', 3, 'the right limb on ice'],
  ['hip', 'ice', 3, 'the hip axis'],
  ['shoulder', 'ice', 3, 'the shoulder axis'],
  ['free', 'ice', 3, 'the free foot'],
];

/* The palette as it stood before 15/08/2026. Restoring the two pairs the design
   pass replaced is the deliberate break. Note it puts the old colours onto the NEW
   ground, so these are not the old palette's own numbers — docs/design-brief.md
   carries those. This is a probe, not a historical record.
   the deliberate break. */
const BROKEN = { light: { 'edge-out': '#0f766e', 'edge-in': '#b45309',
                          'leg-l': '#e11d48', 'leg-r': '#4d7c0f' },
                 dark:  { 'edge-out': '#5eead4', 'edge-in': '#fbbf24',
                          'leg-l': '#fb7185', 'leg-r': '#a3e635' } };

const broken = process.argv.includes('--break');
let failures = 0;

console.log(`token contrast (${PAIRS.length} pairs x 2 schemes)${broken ? ' — with the old edge and limb pairs put back' : ''}\n`);

for (const [name, base] of Object.entries(SCHEMES)) {
  const t = broken ? { ...base, ...BROKEN[name] } : base;
  console.log(`  ${name}`);
  for (const [a, b, target, why] of PAIRS) {
    if (!(a in t) || !(b in t)) {
      failures++; console.error(`  \u2717 ${name}: no such token in the pair ${a}/${b}`); continue;
    }
    const got = contrast(t[a], t[b]);
    const ok = got >= target;
    if (!ok) failures++;
    const line = `${ok ? '    \u2713' : '  \u2717 '} ${got.toFixed(2).padStart(5)}:1  ${target.toFixed(2).padStart(5)} wanted   ${a} on ${b} — ${why}`;
    (ok ? console.log : console.error)(line);
  }
  console.log('');
}

if (failures) {
  console.error(`${failures} contrast check(s) failed`);
  process.exit(1);
}
console.log('every token pair meets its target in both colour schemes');
