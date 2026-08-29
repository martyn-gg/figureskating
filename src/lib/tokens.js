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
export const tokenCSS = () =>
  `:root{${decls(LIGHT)}}` +
  `@media (prefers-color-scheme:dark){:root:not([data-scheme="light"]){${decls(DARK)}}}` +
  `:root[data-scheme="dark"]{${decls(DARK)}}`;
