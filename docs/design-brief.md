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
| ~~the left limb against the right~~ | 1.06 | *pair retired* | 1.78 | *pair retired* |
| the limb on ice | 4.36, 4.63 | 15.78 | 6.43, 11.48 | 14.85 |
| the limb on the page | not measured | 17.01 | not measured | 16.01 |
| the hip axis on ice | 5.28 | 12.81 | 9.37 | 15.74 |
| the shoulder axis on ice | 5.50 | **4.60** | 10.38 | **7.13** |
| the free foot on ice | 2.38 | 3.24 | 3.64 | 3.83 |
| an ice panel against the page | 1.08 | 1.08 | 1.07 | 1.08 |

**There were two hue-only pairs, not one.** The brief went in knowing about the edges at
1.09:1. Measuring the rest found the rig's left and right limbs at **1.06:1** in light —
rose against lime, all but identical in luminance, and the pair that tells a reader which
leg they are looking at.

**For the edges the rule is two lightnesses of one channel, not two nameable hues.** The
brief assumed a reader should be able to name each line's colour. That assumption did not
earn its place: lightness separation survives greyscale and most colour-vision deficiency,
so what the edge pair is held to is **a luminance step of at least 4.5:1, with identity also
stated in words in the key.**

**For the rig the answer turned out to be simpler: one hue, full stop.** The limbs went
through an intermediate state of one violet at two lightnesses, 4.73:1 apart, keyed to
left and right. It was measured on rendered pixels rather than swatches and it failed — see
*Limb depth* below — so both limbs now take a single token, `--limb`, and the pair no longer
exists. There is nothing left for a reader to tell apart by colour, which is why there is no
sibling ratio in the table above. The limb rule is now **4.5:1 against the ice panel and
4.5:1 against the page** — a limb has to be legible on both grounds it is ever drawn over,
and that is the whole requirement. Foot identity was never colour's job anyway: it is
carried by the L and R letters on the feet, and depth by stroke weight.

**Where a line carries meaning it is held to 4.5:1, not 3:1.** A line carrying meaning is
normally held to 3:1. That is a threshold set for an office. This is read at arm's length in
a cold rink under sodium light, often behind gallery glass or on a tablet held at an angle,
and ambient glare eats the low end of the range — so anything load-bearing is specified with
the headroom to lose some and still work. Outside against inside is 4.78:1 in light and
4.64:1 in dark. The limb clears the same bar against both of its grounds: 15.78:1 on ice and
17.01:1 on paper in light, 14.85:1 and 16.01:1 in dark. It has that much room precisely
because it no longer has a sibling to leave room for.

**The dark scheme's ground went darker to pay for it.** Paper is `#070c10` and the ice panel
`#0d1620`, where they were `#0b141a` and `#101c24`. Two reasons point the same way: a bright
phone in a viewing gallery is unpleasant to hold and unpleasant to sit beside, and the range
available above a panel is exactly what the edge pair has to fit inside. Every text ratio in
the dark column improved as a side effect.

**Four numbers got worse, deliberately, and this is the trade.** The outside edge on ice
falls from 5.08 to 3.37 in light. The inside edge on ice falls from 10.37 to 3.06 in dark.
The shoulder axis falls from 5.50 to 4.60 in light and from 10.38 to 7.13 in dark, because it
is now soft ink rather than a hue of its own. Every one of those is a line against a panel and
every one still clears 3:1, which is the floor for a line merely being visible. Two more limb
numbers were down the same way while the limb pair existed — 4.63 to 3.34 in light, 6.43 to
3.20 in dark — and retiring the pair took them back up rather than trading them away.

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
`--leg-r` were rose against lime at 1.06:1. They became one violet at two luminances, and
then — once the pair was measured on rendered pixels rather than on swatches — a single
`--limb` for both legs and the arms. `--hip` and `--shoulder` were violet against sky and are
now full ink and soft ink, because they are told apart by where they sit on the body rather
than by colour. That hands every spare hue back to the edges, which are the only place in the
guide where hue is load-bearing. What the rig used to say in colour it now says in weight and
in letters, both of which survive a greyscale printer.

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

- `npm run check:contrast` — seventeen token pairs against their targets, in both schemes.
  `node tools/contrast.mjs --break` puts the old edge colours *and* the old limb colour back
  and must fail; it fails on exactly six rows — the edge pair and the limb against each of its
  two grounds, in both schemes — and nothing else, which is the point. It is part of
  `npm run check`.
- `node tools/ink.mjs` — the limb measurement, on rendered pixels rather than tokens. Needs
  Playwright, so it is not in `npm run check`. `node tools/ink.mjs --break` restores the
  two-luminance pair and must fail in dark and pass in light, which is the shape of the
  original finding rather than a blanket failure.
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

## Limb depth: weight, and where it stops working

Settled 29/08/2026. Depth between the two limbs is carried by **stroke weight**, not by
opacity and not by hue — skating 5.4, free 3.0, a ratio of 1.8:1, declared once as
`LIMB_W`. Arms take one weight, `ARM_W` 3.2, sitting just above the free leg so they never
outrank a skating one. No opacity remains on any limb in any view; what looks like opacity
on a boot is shading inside one foot's glyph, distinguishing skating from free, and stays.

**There is a third state and it is deliberate.** The skating leg is heavy for as long as it
*is* the skating leg, so on a jump there are two transitions and not one: heavy → neither
at the frame the blade leaves the ice, neither → heavy at the frame the front of the blade
touches down. On the waltz jump that is frames 103 and 141 of 319 — thirty-eight frames,
twelve per cent of the move, with both limbs at 3.0. That is not the panel declining to
answer. It is answering *neither*, which is the truth while nobody is on the ice, and the
tracing says the same thing in the same instant by going dashed. Two channels agreeing is a
system.

If it ever matters to a reader which foot is *about* to take the weight, that is a
different claim from weight and belongs on the boot glyph — the landing foot's glyph
firming up on approach — not on a third limb weight. Not built; nobody has asked.

**Weight could not carry role while the limbs had two colours, and no ratio would have fixed
it.** Measured on the rendered pixels, per unit length of limb, as stroke width ×
|luminance − panel|, with the two-luminance pair in place:

| scheme | phase | skating | free | ratio |
|---|---|---|---|---|
| light | before takeoff — skating is the dark limb | 4.92 | 2.05 | 2.41 |
| light | after landing — skating is the pale limb | 3.68 | 2.74 | **1.35** |
| dark | before takeoff — skating is the violet limb | 0.68 | 2.40 | **0.29** |
| dark | after landing — skating is the near-white limb | 4.31 | 0.38 | 11.35 |

The two limbs differed from their panel by **1.3×** in light and **6.3×** in dark. In light
both were darker than a near-white ground, so they sat the same side of it and 1.8:1 of
weight won at every phase — narrowly, 1.35, at the landing. In dark, holding both to 3:1
against the panel while keeping 4.6:1 between them forced one near-white and one mid-violet,
and 1.8:1 cannot touch a 6.3× gap. To win there the skating stroke would have had to be
**18.9**, which is not a stroke, it is a bar.

Counting pose as well as weight it is worse: at frame 60 from behind, in dark, the free leg
carries roughly **twenty times** the ink of the skating leg, because it is also the more
extended at that moment.

So in dark, before takeoff, the eye follows the free leg. Confirmed the expensive way — the
first review of that panel passed it by eye, having identified the near-white limb as the
skating one. It is the free one. Two channels in conflict and the reviewer followed the
brighter, which is exactly what a reader will do, so the misreading is the evidence.

**The fix was to remove the competing channel, not to raise the ratio.** Both limbs now take
the single `--limb` token, so the lightness term is identical for both and cancels: ink mass
reduces to the weight ratio alone, **1.80 in every frame of every move, in both views and
both schemes**. Not approximately — exactly, because it is the same arithmetic on both sides.
That is `node tools/ink.mjs`, which measures the rendered stroke and its computed colour
against the panel behind it rather than trusting the tokens, and refuses to report anything
at all if `--limb` or `--ice` fails to resolve. `--break` puts the old pair back and returns
0.29 in dark against 2.41 in light — the original finding, reproduced on demand.

**Where this leaves role.** Weight now carries it, but only because nothing else is
competing; weight remains a *depth* channel that happens to be unopposed. If role ever has to
be legible independently of depth — a reader glancing at a single frame — it wants the boot
glyph, which is already the thing that carries foot identity by letter rather than by colour.
Deferred, deliberately, and written down so it is not rediscovered by eye a third time.

**Where the camera stands, settled 29/08/2026.** Casing is a depth claim and a depth claim
needs a viewpoint. The side view plots +t to the right so a skater going forwards travels
left to right across the panel, which is the direction the page is read in; that fixes the
camera on the skater's **right**, at +n, and depth ordering with it. The rear view plots +n
to the right, which is what standing behind someone looks like, so its camera is at −t.
Both now live in one `NEARER` entry per view, and the boot's toe/heel test reads the same
expression — until this date the side view ordered limbs from the skater's left while
drawing boots from their right, and neither half knew the other disagreed. A camera side is
a decision, not a fact, so it cannot be checked; what can be, and now is by construction, is
that everything in a panel reads it off the same line.

**Role is now in the DOM.** `data-limb="skating|free"` on the two leg paths, `data-casing` on
the casing. It was a fact the renderer knew and the markup threw away, which is why settling
the argument at all needed a frame annotated by hand; two readers had it backwards before it
was labelled. The attribute is worth keeping even if the checker were thrown away.

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
- **Arms — next, and no longer blocked.** They take `--limb`, carry no left/right
  distinction, and get no casing and no depth ordering. `ink.mjs` does not measure them: it
  keys on `data-limb`, which is legs only, deliberately, because arms have no role split to
  assert. From behind, a hand crossing the torso is where the omission will show first. This
  was waiting on which way `n` points, which is now answered — and on a viewpoint to order
  depth against, which is now stated.
