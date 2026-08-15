# Field Guide to Figure Skating

A public reference to figure skating elements — edges, turns, jumps, spins, dance
patterns — cross-referenced to the national test structures of the UK, and later
Canada and the US. Plus targeted off-ice preparation.

Built as a static site with offline support, so it works at the rink.

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

Every two-foot turn is then just two bits of information:

| Turn    | Edge changes | Rotates into circle | Lobe result |
|---------|--------------|---------------------|-------------|
| Three   | yes          | yes                 | continues   |
| Bracket | yes          | no                  | continues   |
| Rocker  | no           | yes                 | reverses    |
| Counter | no           | no                  | reverses    |

All four reverse the direction of travel and keep the same foot. Verified against
all 32 foot/edge/direction/turn combinations. Because it is derived, every element
mirrors for free — flip the foot and you get the clockwise-rotator version, which
almost no other resource provides.

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
    tools/gen-derived.mjs         writes the derived tier — edges and two-foot turns
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

The eight plain edges and the thirty-two two-foot turns are written by
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
    node tools/links.mjs          every internal link in dist/ resolves to a real file

`tracing.mjs` earns its place now that forty elements come out of one sign rule: a
flipped sign would be wrong forty times and look perfectly plausible every time, because
a curve on a screen is a curve either way round. It asserts the drawn lobe against
`lobeSense` in ice coordinates, and the cusp direction against `rotatesInto`, for all
forty combinations.

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
