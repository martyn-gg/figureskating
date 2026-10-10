/* The palette, as data. Pure — no DOM, no CSS parsing.

   It lives here rather than inline in Base.astro for the same reason skating.js
   exists: one source of truth. The layout renders these into custom properties
   and tools/contrast.mjs imports this same object and measures it, so a colour
   cannot be nudged in the stylesheet without the checker seeing it.

   Two rules run through the values, and both are here because measurement said
   so rather than because they look nice.

   1. Every pair that carries a distinction differs in LUMINANCE as well as hue,
      by at least 4.5:1. The outside edge is always the paler line and the inside
      edge the darker one, in both schemes. Before this pass the two differed by
      1.09:1, which means outside versus inside — the whole difference between a
      flip and a Lutz, and between a mohawk and a choctaw — was carried by hue
      alone. In a dim rink, on a cheap screen, through gallery glass, in greyscale
      print or for a red-green colour-blind reader, that is no distinction at all.

      4.5:1 rather than the 3:1 a line would normally be held to, because this is
      read at arm's length in a rink under sodium light and behind gallery glass,
      often on a tablet held at an angle. Ambient glare eats the low end of the
      range, so the pair is specified with the headroom to lose some.

      Luminance was chosen over the other candidates on purpose. A dash on one
      edge implies broken contact. A heavier stroke implies a deeper edge. A
      marker at intervals implies periodic events. All three would have the
      drawing assert something the model does not say. A luminance step asserts
      nothing.

   2. A line that carries information is held to 3:1; a line that only edges a
      panel is not. `--grid-line` rules the 8 x 4 matrix and is structural, so
      it meets the non-text threshold. `--ice-line` outlines chips and cards and
      carries nothing, so holding it to 3:1 would only make the page shout. */

export const LIGHT = {
  ice: '#f2f7fb', paper: '#ffffff', ink: '#12303f', 'ink-soft': '#5a7386',
  rule: '#dfe8ef', 'ice-line': '#94aec1', 'grid-line': '#6f8da2',
  accent: '#1d5a7a', warn: '#a8480a',
  /* Teal is the paler edge, burnt amber the darker one. */
  'edge-out': '#1d9689', 'edge-in': '#2c1403',
  /* The rig: ONE limb colour. There is no longer a pair.

     The two-luminance pair existed so colour could say which foot. Identity
     moved to the L and R letters, and the pair kept the 4.5:1 step it no longer
     needed — a step that costs a thirteenfold luminance range, which pins one
     limb to the panel's extreme. Measured on rendered pixels, that made lightness
     outvote stroke weight: before takeoff in dark the skating limb carried 0.29
     of the free limb's ink, so the panel showed the role backwards. It was passed
     by eye twice before anyone measured it.

     So the limb takes the ink end of the range in both schemes, weight says which
     leg bears the skater, and a casing says which is in front. One fact per
     channel, and no per-scheme reasoning left in the limbs. */
  limb: '#26094f', hip: '#12303f', shoulder: '#5a7386',
  free: '#6f8da2',
};

/* The dark ground is darker than a straight inversion would give, for two
   reasons that point the same way. A bright phone in a viewing gallery is
   unpleasant to hold and unpleasant to sit next to. And a darker panel is what
   buys the 4.5:1 step between the two edges: the range available above a panel is
   what the pair has to fit inside. */
export const DARK = {
  ice: '#0d1620', paper: '#070c10', ink: '#e6f0f5', 'ink-soft': '#8ba6b5',
  rule: '#1e3038', 'ice-line': '#33525f', 'grid-line': '#476d7e',
  accent: '#7fc4e3', warn: '#fbbf24',
  'edge-out': '#9df3e6', 'edge-in': '#a04c08',
  limb: '#e9e5ff', hip: '#e6f0f5', shoulder: '#8ba6b5',
  free: '#64748b',
};

export const SCHEMES = { light: LIGHT, dark: DARK };

/* THE NOTEBOOK — 03/10/2026, Martyn: "I really like the notebook. It's friendlier
   than the textbook." It is the default look from this date, and the palette
   above (now called the textbook) stays one switch away in the footer.

   The rig, edge and limb tokens are carried over unchanged from the scheme they
   sit in, because the stick figures are drawn in them and every pixel check that
   measures a figure was tuned against those values. What changes is the page
   round them: warm paper, white cards for the drawings, a softer ink.

   Kept apart from SCHEMES on purpose. tools/ink.mjs walks the SCHEMES keys as
   colour-scheme names for the browser, so a third key there would be passed to
   emulateMedia and fail. tools/contrast.mjs measures these separately.

   The decorative tokens at the end (ruling, margin, tape, sticky note,
   highlighter, the index tabs) carry no information, apart from the sticky
   note, which carries the unverified warning; that pair and the tab labels are
   measured too. */
/* THE TAB COLOURS, reviewed 03/10/2026 (Martyn: review them, some were added after
   the first choice). Measured as CIEDE2000 differences, normal vision and simulated
   deuteranomaly. The Dance tab's first peach (#f4b896) was the weakest choice: the
   closest of any colour to the Basics amber (16), so the rail began and ended in the
   same warm orange. Coral (#f0a091) stands 26 from Basics and 25 from both its
   neighbours, Spins and Grades, at a contrast of 6.8 with the tab ink. The others
   stay: the tabs carry their names, so colour only has to tell neighbours apart,
   and every neighbouring pair is 13 or more apart. Two pairs that are not
   neighbours meet under deuteranomaly (Edges and Spins, Turns and Grades); seven
   pale colours cannot all stay apart for every eye, and the names carry it.
   Off-ice (04/10/2026) sits between Dance and Grades in a pale aqua, apart from the
   coral and the stone either side of it and from the Turns green and Edges blue. */
const NB_SHARED = {
  'tab-basic': '#f6c76b', 'tab-edge': '#a9d1e8', 'tab-turn': '#b9dcb4',
  'tab-jump': '#e9b6c8', 'tab-spin': '#cfc4ea', 'tab-dance': '#f0a091', 'tab-office': '#9fd8cf', 'tab-grade': '#e6e0cf',
  'tab-ink': '#2b2b2e',
};

export const NOTEBOOK_LIGHT = {
  ...LIGHT,
  ice: '#ffffff', paper: '#fbf8f0', ink: '#2b2b2e', 'ink-soft': '#5f5f63',
  rule: '#e4dccb', 'ice-line': '#a49a86', 'grid-line': '#7d7466',
  accent: '#2a628f', warn: '#9a4313',
  ruling: '#dfe7f0', margin: '#e8a7a1', tape: 'rgba(214,226,236,.8)',
  sticky: '#fff3a6', 'sticky-ink': '#3d3410', highlight: 'rgba(246,199,107,.55)',
  hole: '#e9e3d3',
  dust: 'linear-gradient(transparent,transparent)', 'chalk-glow': 'none',
  ...NB_SHARED,
};

/* THE CHALKBOARD — 10/10/2026, Martyn: "Could I see the dark mode as a chalk
   board?" The notebook's dark scheme as a slate-green board: chalk-white writing,
   chalk lines faint enough to ignore, a pink chalk margin, a yellow chalk
   highlighter and soft dust where it has been wiped. A board has no punched
   holes and next to no ruling, so the holes go and the lines are barely there.
   The drawing cards move from navy to a near-black green at the same luminance,
   so they read as slate panels on the board; every rig, edge and limb colour is
   untouched, for the reason given above the notebook. */
export const NOTEBOOK_DARK = {
  ...DARK,
  ice: '#0b1510', paper: '#2b4436', ink: '#f4f3ec', 'ink-soft': '#c9d3c9',
  rule: '#41594b', 'ice-line': '#738a7c', 'grid-line': '#93a69a',
  accent: '#a6d8f2', warn: '#fbd34d',
  ruling: 'rgba(244,243,236,.035)', margin: 'rgba(246,170,180,.7)', tape: 'rgba(200,210,200,.35)',
  sticky: '#3b3517', 'sticky-ink': '#f1e7b4', highlight: 'rgba(250,230,130,.30)',
  hole: 'transparent',
  /* Chalk dust: three wiped patches, tiled. And the faintest bloom on handwriting,
     which is what makes white text on green read as chalk rather than paint. */
  dust: 'radial-gradient(ellipse 340px 120px at 22% 30%,rgba(255,255,255,.045),transparent 70%),' +
    'radial-gradient(ellipse 260px 160px at 78% 64%,rgba(255,255,255,.035),transparent 70%),' +
    'radial-gradient(ellipse 420px 90px at 40% 88%,rgba(255,255,255,.03),transparent 70%)',
  'chalk-glow': '0 0 1px rgba(241,240,232,.55),0 0 6px rgba(241,240,232,.12)',
  ...NB_SHARED,
};

export const NOTEBOOK = { light: NOTEBOOK_LIGHT, dark: NOTEBOOK_DARK };

const decls = t => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');

/* The custom properties, for the layout to drop into its head.

   The scheme follows the operating system by default and `data-scheme` on the
   root element overrides it either way. The override exists because a palette
   with two schemes is two designs, and a reviewer who can only see the one their
   laptop is set to can only review half of it — the light scheme's limb pair sits
   a third of a point above its floor and wants looking at directly. It earns its
   place for readers too: which scheme is comfortable in a rink is a property of
   the rink's lighting, not of the hour the phone thinks it is.

   Order matters. The media query is written so an explicit light override beats
   it, and the explicit dark block comes last so it beats a light OS. */
/* The notebook is the default; `data-theme="formal"` on the root restores the
   textbook. The formal blocks come after the notebook ones and each is one
   attribute more specific than the notebook block it replaces, so the order of
   precedence does not hang on source order alone. */
export const tokenCSS = () =>
  `:root{${decls(NOTEBOOK_LIGHT)}}` +
  `@media (prefers-color-scheme:dark){:root:not([data-scheme="light"]){${decls(NOTEBOOK_DARK)}}}` +
  `:root[data-scheme="dark"]{${decls(NOTEBOOK_DARK)}}` +
  `:root[data-theme="formal"]{${decls(LIGHT)}}` +
  `@media (prefers-color-scheme:dark){:root[data-theme="formal"]:not([data-scheme="light"]){${decls(DARK)}}}` +
  `:root[data-theme="formal"][data-scheme="dark"]{${decls(DARK)}}`;
