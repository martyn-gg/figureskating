# Design brief

Written 15/08/2026 at the end of the content phase, and revised the same day at the end of
the visual design pass. The machinery and the derived tier were done first; 161 pages
inherit what this settles, which is why it was worth writing the brief before opening a
stylesheet, and worth recording the outcome in the same file.

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

## The measured problem, and where it ended up

Contrast ratios, computed rather than guessed. `before` is the palette this pass replaced;
`after` is `src/lib/tokens.js` as it stands. Both columns are produced by
`node tools/contrast.mjs`, which imports the token module rather than reading a stylesheet.

| Pair | Light before | Light after | Dark before | Dark after |
|---|---|---|---|---|
| body text on paper | 13.81 | 13.81 | 16.07 | 16.97 |
| soft text on paper | 4.96 | 4.96 | 7.28 | 7.69 |
| soft text on an ice panel | 4.60 | 4.60 | 6.77 | 7.13 |
| links on paper | 7.51 | 7.51 | 9.66 | 10.20 |
| the unverified banner on paper | 5.02 | 5.84 | 11.14 | 11.77 |
| outside edge on ice | 5.08 | **3.37** | 11.70 | 14.22 |
| inside edge on ice | 4.66 | 16.11 | 10.37 | **3.06** |
| **outside edge against inside edge** | **1.09** | **4.78** | **1.13** | **4.64** |
| the matrix grid on ice | 1.21 | 3.24 | 1.35 | 3.26 |
| the matrix grid on paper | 1.31 | 3.50 | 1.45 | 3.51 |
| panel edging on ice | 1.21 | 2.14 | 1.35 | 2.18 |
| **the left limb against the right** | **1.06** | **4.73** | **1.78** | **4.64** |
| the left limb on ice | 4.36 | 15.78 | 6.43 | **3.20** |
| the right limb on ice | 4.63 | **3.34** | 11.48 | 14.85 |
| the hip axis on ice | 5.28 | 12.81 | 9.37 | 15.74 |
| the shoulder axis on ice | 5.50 | **4.60** | 10.38 | **7.13** |
| the free foot on ice | 2.38 | 3.24 | 3.64 | 3.83 |
| an ice panel against the page | 1.08 | 1.08 | 1.07 | 1.08 |

**There were two hue-only pairs, not one.** The brief went in knowing about the edges at
1.09:1. Measuring the rest found the rig's left and right limbs at **1.06:1** in light —
rose against lime, all but identical in luminance, and the pair that tells a reader which
leg they are looking at.

**Both pairs are held to 4.5:1, not 3:1.** A line carrying meaning is normally held to 3:1.
That is a threshold set for an office. This is read at arm's length in a cold rink under
sodium light, often behind gallery glass or on a tablet held at an angle, and ambient glare
eats the low end of the range — so both pairs are specified with the headroom to lose some
and still work. Outside against inside is 4.78:1 in light and 4.64:1 in dark; left limb
against right is 4.73:1 and 4.64:1.

**The dark scheme's ground went darker to pay for it.** Paper is `#070c10` and the ice panel
`#0d1620`, where they were `#0b141a` and `#101c24`. Two reasons point the same way: a bright
phone in a viewing gallery is unpleasant to hold and unpleasant to sit beside, and the range
available above a panel is exactly what the edge pair has to fit inside. Every text ratio in
the dark column improved as a side effect.

**Six numbers got worse, deliberately, and this is the trade.** The outside edge on ice falls
from 5.08 to 3.37 in light. The inside edge on ice falls from 10.37 to 3.06 in dark. The
right limb on ice falls from 4.63 to 3.34 in light and the left limb from 6.43 to 3.20 in
dark. The shoulder axis falls from 5.50 to 4.60 in light and from 10.38 to 7.13 in dark,
because it is now soft ink rather than a hue of its own. Every one of those is a line against
a panel and every one still clears 3:1, which is the floor for a line merely being visible.

The arithmetic forces the trade and it is worth stating plainly. A 4.5:1 step between two
lines that each have to clear 3:1 against the panel behind them needs a thirteenfold
luminance range, and a panel only has so much range beneath it, so one of each pair has to
sit close to the panel. Spending it here is right: outside versus inside is the difference
between a flip and a Lutz and between a mohawk and a choctaw, and it is the one distinction
the guide cannot afford to lose.

## What this pass settled

**1. The edge vocabulary carries a second channel, and the channel is luminance.** The
outside edge is the paler line and the inside edge the darker one, in both colour schemes, so
the rule a reader learns does not change when the rink lights come up. Teal and burnt umber
still separate them by hue for anyone who sees hue.

The other candidates were rejected for the same reason as each other. A dash on one edge
implies broken contact. A heavier stroke implies a deeper edge. A marker at intervals implies
periodic events. Each would have the drawing assert something `skating.js` does not say,
which is the one thing this brief forbids. A luminance step asserts nothing.

Every diagram also carries a key naming which line is which, generated from the edges the
tracing actually visits — so a tracing that never leaves an outside edge does not show a
legend for an inside one. The tracing itself is drawn a little heavier, at 4.4 units against
4, with the ghost of the full path raised from 13% to 18%.

**1a. Which foot is on the ice is tagged in letters.** Colour could not carry it. The edges
already own the two hues that survive a rink, and a tracing genuinely cannot show which blade
made it — two blades leave the same mark, which is why the guide says a crossover and a
chassé are indistinguishable. So where an element changes foot, each segment of the tracing
gets a filled disc outside its own lobe with **L** or **R** in it. Letters on purpose: no
amount of bad lighting, no greyscale printer and no colour blindness degrades a letter.
Elements that stay on one foot get no tag, because there is nothing to distinguish — the tag
appears exactly where the model makes the distinction and nowhere else.

**2. The four joins read as four things at 414 px, and one of them got better for free.**
A cusp is a point. A loop is a closed circle. A step is a gap with the other blade beside it
and the two feet named in letters. A roll is the one with nothing to see — and now that the two edge colours differ in
lightness, a change of edge shows as an unbroken line that goes from pale to dark. The join
that was hardest to draw honestly is now the one the palette draws for you.

The step gap was 11 units, which renders as 6.4 CSS px at 414 px — about three stroke
widths, and easy to read as a wobble rather than a break. It is now 16, which renders as
9.3 px. `tracing.mjs` already asserts a step has a real gap and a one-foot turn does not,
so the number is free to change.

**3. The rig is down from four competing hues to one, plus the two inks.** `--leg-l` and
`--leg-r` were rose against lime at 1.06:1; they are now one violet at two luminances, 4.73:1
apart, on the same rule as the edges. `--hip` and `--shoulder` were violet against sky and are now full ink
and soft ink, because they are told apart by where they sit on the body rather than by
colour. That hands two hues back to the edges, which are the only place in the guide where
hue is load-bearing.

**4. Tap targets are 44 px.** The diagram's play, speed, scrub and mirror controls were
32–34 px, and every cell of the 8 × 4 matrix was about 30 px tall. Nav links now have a
44 px row too. The matrix is taller for it, which is the correct cost.

**5. The 17 px serif body stays.** It was tested at 414 px in both schemes rather than
assumed. What was not adequate was the sans-serif control furniture at 0.78 rem, which is
now 0.82–0.86 rem.

**6. Dark mode is authored, not inverted.** The ice panel stays lighter than the page in
both schemes, and the dark palette keeps its own edge pair rather than flipping the light
one. The luminance ordering is the same in both, so the rule survives the switch.

## Out of scope

Do not change what the diagrams *mean* while changing how they look. If the design pass
suggests the model is wrong, that is a separate change with its own checker.

## How to verify, because opinions about legibility are worthless

- `npm run check:contrast` — eighteen token pairs against their targets, in both schemes.
  `node tools/contrast.mjs --break` puts the old edge colours *and* the old limb colours back
  and must fail; it fails on exactly the four pair rows and nothing else, which is the point.
  It is now part of `npm run check`.
- `node tools/page-shot.mjs out/ elements/ elements/lfo-rocker-counter/ elements/lbi-loop/`
  at 414 px, in both colour schemes.
- Desaturate the result. Anything that becomes ambiguous in greyscale is carrying meaning in
  hue alone and has to change. Note that `lfo-rocker-counter` is a poor page to judge the
  edge pair on, because a rocker-counter never leaves an outside edge; use a three turn, a
  change of edge or a choctaw. A mohawk or a crossover is the page to check the foot tags on.
- Then turn the screen brightness down and look again from a metre away. Greyscale catches
  hue-only distinctions; it does not catch a distinction that is technically present and
  practically invisible in a dim rink.
- The colours are data in `src/lib/tokens.js`, and `Base.astro` renders them. A hex code
  written anywhere else is a second source of truth the checker cannot see.

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
- **The rig's own drawing has not been re-shot.** The palette is measured and the swatches
  are settled, but no element in the repository with a rig was screenshotted at 414 px in
  the new colours. Do that before trusting the limb pair on a real pose.
