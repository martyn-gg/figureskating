# Design brief

Written 15/08/2026, at the end of the content phase and before any visual work. The
machinery and the derived tier are done; 161 pages now inherit whatever this decides, which
is why it is worth writing the brief down rather than opening a stylesheet.

## The reader, and why this is not a taste question

Someone in a cold rink, on a phone, in gloves, one-handed, under bad light, between
run-throughs, who arrived with a specific question and wants it answered before their hands
get cold. Half of them are in a viewing gallery behind glass. Some are parents at the
barrier who have never skated.

The second reader is a coach who has come to say we are wrong. Everything must stay easy to
disagree with.

So the hardest constraint here is not aesthetic. A design that photographs well and fails at
arm's length in a dim rink has failed.

## What is already decided, and must not be undone

- **The three-letter notation.** LFO, RBI. It matches British Ice Skating's own usage.
- **Nothing renders as authoritative by accident.** The amber unverified banner sits above
  the content, not below it, on every page. It may be restyled; it may not be softened.
- **The diagram cannot contradict the prose.** Both come from `skating.js`. No visual
  treatment may imply a distinction the model does not make, or hide one it does.
- **Colour may never be the only carrier of a derived fact.** Every page already states in
  words what the picture shows. Keep it that way.

The index tables and chip rows deliberately introduce **no new colour**, so as not to
prejudge this pass. They are structure only, and are meant to be restyled.

## The measured problem

Contrast ratios for the current tokens, computed rather than guessed:

| Pair | Light | Dark |
|---|---|---|
| body text on paper | 13.81 | 16.07 |
| soft text on paper | 4.96 | 7.28 |
| soft text on an ice panel | 4.60 | 6.77 |
| links on paper | 7.51 | 9.66 |
| outside edge on ice | 5.08 | 11.70 |
| inside edge on ice | 4.66 | 10.37 |
| table borders on ice | 1.21 | 1.35 |
| **outside edge against inside edge** | **1.09** | **1.13** |

Text is comfortably fine everywhere. Two things are not.

**The edge colours are all but identical in luminance.** Teal and amber differ by 1.09:1 in
light and 1.13:1 in dark, which means *outside versus inside edge is carried by hue alone*.
That is the single most important fact any tracing conveys — it is the whole difference
between a flip and a Lutz, and between a mohawk and a choctaw. In poor light, on a cheap
screen, through rink glass, or for a red-green colour-blind reader, it can vanish. Print the
page in greyscale and the guide stops working.

This wants a second, redundant channel. Candidates: a dash pattern on one edge, differing
stroke weight, a marker at intervals, or leaning harder on the boot glyph, which already
shows which side of the blade is biting. Whatever is chosen must survive desaturation.

**Table and panel borders sit near 1.2:1.** They are structural rather than text, but they
are what makes an 8×4 matrix readable at 414 px, and at that contrast they are close to
invisible in bright light.

## What this pass has to settle

1. **The edge vocabulary** — outside versus inside, with a channel other than hue.
2. **The four joins.** A cusp, a roll (nothing to see), a loop, a step. They are now
   genuinely different events and must read as different at phone size. The step gap is
   currently about 9% of the lobe radius; check it survives a 414 px viewport.
3. **The rig palette.** `--leg-l` rose, `--leg-r` lime, `--hip` violet, `--shoulder` sky —
   four competing hues in a diagram that already uses two for edges. Probably too many.
4. **Density and tap targets.** The matrices, the chip rows, the diagram controls. Gloves
   want 44 px minimum; several controls are currently 32–34 px.
5. **Typography in bad light.** 17 px serif body. Test it, do not assume it.
6. **Dark mode as a first-class case**, not an inversion — a rink is dim and a bright phone
   is unpleasant in a viewing gallery.

## Out of scope

Do not change what the diagrams *mean* while changing how they look. If the design pass
suggests the model is wrong, that is a separate change with its own checker.

## How to verify, because opinions about legibility are worthless

- `node tools/page-shot.mjs out/ elements/ elements/lfo-rocker-counter/ elements/lbi-loop/`
  at 414 px, in both colour schemes.
- Desaturate the result. Anything that becomes ambiguous in greyscale is carrying meaning
  in hue alone and has to change.
- Recompute the contrast table above and keep it in this file. A design pass that makes a
  number worse should say so on purpose.
- A new checker belongs here, in the pattern the rest of the repository uses: assert the
  token pairs meet their targets, and break the palette deliberately to prove the checker
  notices.

## Known and deferred, to be picked up after this pass

- **Element ordering is alphabetical and should be pedagogical.** On the home page the
  single "Mechanics" list puts Spiral between Salchow and Toe loop — a position sitting
  amongst the jumps — and the Axel first. Jumps should run in learning order: waltz jump,
  Salchow, toe loop, loop, flip, Lutz, Axel. That order belongs in `JUMPS` in
  `skating.js` so the pages inherit it rather than each sorting for themselves. Positions
  should be their own group on the home page as they already are on `/elements/`.
- **Positions has one entry.** Held positions — lunge, Ina Bauer, spin positions — are the
  cheapest useful body-frame content and are queued behind this pass.
- **Twizzles**, deliberately skipped: not a chain of half turns, and they need their own
  modelling.
