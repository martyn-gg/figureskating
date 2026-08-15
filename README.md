# Field Guide to Figure Skating

A public reference to figure skating elements — edges, turns, jumps, spins, dance
patterns — cross-referenced to the national test structures of the UK, and later
Canada and the US. Plus targeted off-ice preparation.

Built as a static site with offline support, so it works at the rink — stale-while-
revalidate, so it also updates.

> **Status: prototype.** The engines work. The pose data does not yet represent
> correct technique — see *Accuracy* below. Nothing here should be used to learn
> from yet.

**Picking this up?** Read [docs/state-of-play.md](docs/state-of-play.md) first.

## Why it is built this way

Almost nothing is drawn by hand. The geometry is derived from rules, which is what
makes covering hundreds of elements tractable.

**Lobe curvature falls out of three facts about the foot:**

    lobeSense = (foot == L ? +1 : −1) × (edge == O ? +1 : −1) × (dir == F ? +1 : −1)
    (+1 = anticlockwise seen from above the ice)

Every **one-foot turn** is then just two bits of information:

| Turn    | Edge changes | Rotates into circle | Lobe result |
|---------|--------------|---------------------|-------------|
| Three   | yes          | yes                 | continues   |
| Bracket | yes          | no                  | continues   |
| Rocker  | no           | yes                 | reverses    |
| Counter | no           | no                  | reverses    |

All four reverse the direction of travel and keep the same foot. Verified against all 32
foot/edge/direction/turn combinations — and, since the table was derived here from first
principles, worth saying that it matches British Ice Skating's own published definitions
of the four turns exactly, clause for clause.

**The same line covers the two-foot turns**, where the skater steps from one foot to the
other instead of turning on the blade:

| Turn    | Changes foot | Edge changes | Lobe result |
|---------|--------------|--------------|-------------|
| Mohawk  | yes          | no           | continues   |
| Choctaw | yes          | yes          | reverses    |

Nothing had to be added to make those work. The foot flips and the direction flips, so
`lobeSense` comes out unchanged for a mohawk and inverted for a choctaw — which is exactly
what the governing body's definitions say, arrived at without being told. They differ only
in the drawing: there is no cusp, because nothing pivots, so the tracing stops on one blade
and starts again beside it.

**And the connecting material falls out of the same three flags.** None of it reverses the
direction of travel, which is exactly what separates it from a turn — you carry on the way
you were already going:

| Element | Changes foot | Edge changes | Lobe result |
|---------|--------------|--------------|-------------|
| Change of edge | no  | yes | reverses  |
| Loop           | no  | no  | continues |
| Crossover      | yes | yes | continues |
| Chassé         | yes | yes | continues |
| Cross roll     | yes | no  | reverses  |

A crossover and a chassé have identical rows because they leave identical tracings — the
difference between them is where the free foot is placed, which is a body-frame matter and
not something a blade can draw. The guide says so rather than inventing a distinction.

**And turns chain.** A cluster — *rocker-counter*, *bracket-counter*, *choctaw-three-rocker*
— is not a new kind of element but a new shape of one: an ordered run in which each turn's
exit is the next one's entry. It stores its entry edge and the order of its turns, and
every edge in between is chained out of the same function. A run of three costs no more to
add than one.

Because all of it is derived, every element mirrors for free — flip the foot and you get
the clockwise-rotator version, which almost no other resource provides.

## Layout

    src/content.config.ts         collection schemas — elements, tests, exercises
    src/data/elements/            one file per element; foot, edge, direction only
    src/data/tests/               a test is an ordered list of element references
    src/lib/skating.js            the derived model — pure, no DOM
    src/lib/edge-diagram.js       renders a tracing; imports the model, never copies it
    src/lib/rig-math.js           the body rig's geometry — pure, no DOM
    src/lib/moves.js              keyframed pose data
    src/lib/body-frame.js         the three renderers and mount()
    src/components/               EdgeDiagram and BodyFrame
    src/pages/rig.astro           the body-frame explorer
    src/pages/                    element and test pages
    tools/gen-derived.mjs         writes the derived tier — edges, turns and clusters
    tools/                        verification scripts (see below)
    docs/model.md                 coordinate conventions and constants
    docs/style.md                 how everything here is written
    sources/                      governing-body documents, read locally, never committed

## Running it

Astro 7, Node 22.

    npm install
    npm run dev        # local site
    npm run build      # static output to dist/
    npm run check      # all seven checkers, then a build, then the link check

## The derived tier is generated

The eight edges, forty-eight turns, twenty-eight transitions, sixty-four clusters and the
jump pages are written by
`tools/gen-derived.mjs`, which imports `skating.js` and never restates any of it. The
geometry costs nothing; the prose does not, so the script carries the prose and keys it
on direction, edge and turn — never on the foot. A left forward outside bracket and a
right forward outside bracket are mirror images, so they get the same words with "left"
and "right" appearing in neither. The three letters differ; the skating does not.

Existing files are never overwritten, so anything corrected by hand stays corrected:

    npm run gen:derived            # write only what is missing
    node tools/gen-derived.mjs --force

## One implementation, not two

There are no standalone prototypes. Both engines are modules under `src/lib`, the
site imports them, and the tools drive the built site — so there is nothing that can
drift out of step with what actually ships. The checkers import `moves.js` and
`rig-math.js` directly rather than scraping a page.

## The diagram cannot contradict the prose

`edge-diagram.js` imports `lobeSense` and the turn table from `skating.js` rather than
holding its own copy, so the animated tracing and the sentence describing it are
derived from the same three facts. The mirror toggle on every diagram is not a second
drawing — it flips one character and regenerates.

## Nothing renders as authoritative by accident

Elements and tests both carry a `verified` flag, defaulting to false. Any page whose
mechanics have not been checked by someone qualified says so, in a banner, above the
content. Syllabus entries carry a `sourceUrl` and stay unverified until confirmed
against the governing body's current material.

## Verification

Projection bugs are invisible in the maths and obvious in the picture, so these are
not optional.

    node tools/harness.mjs        evaluate headlessly, scrub every frame, every toggle
    node tools/shot.mjs waltz 0.4 out.png   one frame of the rig
    node tools/reach.mjs          flag any foot the leg cannot physically reach
    node tools/shin.mjs           flag shin lean beyond what a stiff boot allows
    node tools/blade.mjs          flag boot pitch that would put a skater on the picks
    node tools/freefoot.mjs       flag a free boot hanging near-vertical
    node tools/tracing.mjs        every lobe curves the way the model says it does
    node tools/contact-sheet.mjs waltz .   every keyframe of a move, side by side
    node tools/page-shot.mjs out/ elements/ elements/lfo/   built pages at phone width
    node tools/speed.mjs          the playback speed control really does slow it down
    node tools/offline.mjs        works with no network, and does not pin stale content
    node tools/links.mjs          every internal link in dist/ resolves to a real file

`offline.mjs` exists because the first service worker here was cache-first with a fixed
cache name and no revalidation. It worked — and it meant the first copy of a page anyone
loaded was the copy they kept for ever, so a coach's correction would never have reached a
returning reader. The checker asserts both halves of the promise: the page still opens with
the network gone, *and* a changed page arrives. Restoring the old worker passes the first
and fails the second.

`speed.mjs` and `offline.mjs` need Playwright and so are not in `npm run check`. It exists because a dead
playback control is invisible — the button relabels itself, the picture keeps moving, and
nothing looks wrong. It plays each engine for a fixed interval at every setting and
asserts the rate halves each step.

`tracing.mjs` earns its place now that a hundred and fifty elements come out of one sign
rule: a flipped sign would be wrong a hundred and fifty times and look perfectly plausible
every time, because a curve on a screen is a curve either way round. Across 160
combinations it asserts the drawn lobe against `lobeSense` in ice coordinates; the cusp's
direction *and depth* against `rotatesInto`; that a change of edge has no cusp and no
break; that a loop closes, turns a full circle and curves with its own lobe; that a step
leaves a real gap with the other foot on the far side; that the direction of travel
reverses exactly when the model says it does; and for clusters, one mark per turn in order
with the right join, lobe and edge. Every one of those was written by breaking the renderer
on purpose first: flipping the sign fails 104 assertions, drawing a cusp on a change of
edge fails 8, reversing the loop fails 8, and one wrong chain state fails 168.

The two screenshot tools need Playwright, which is not a dependency — the browser
download is too heavy to inflict on anyone who only wants to build pages. They print
the one-line install command if it is missing:

    npm install --no-save playwright && npx playwright install chromium

The contact sheet is the one that catches sequence errors. Individual frames all look
plausible; only the whole element side by side shows a leg on the wrong side of the body.

## Accuracy

The mechanics are a first draft by a non-expert and want checking against video and
a coach before anyone relies on them. Corrections very welcome — open an issue.

Descriptions and diagrams here are written and drawn from scratch. No governing-body
document is reproduced. Source material is read locally out of `sources/`, which git
ignores; `sources/README.md` explains the arrangement and `docs/style.md` sets out how
element pages and qualification guides are written so that they read as one guide.
