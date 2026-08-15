# Field Guide to Figure Skating

A public reference to figure skating elements — edges, turns, jumps, spins, dance
patterns — cross-referenced to the national test structures of the UK, and later
Canada and the US. Plus targeted off-ice preparation.

Built as a static site with offline support, so it works at the rink.

> **Status: prototype.** The engines work. The pose data does not yet represent
> correct technique — see *Accuracy* below. Nothing here should be used to learn
> from yet.

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
    src/pages/                    element and test pages
    prototypes/edge-engine.html   edges, turns and cusps — the derived tier
    prototypes/body-frame.html    one 3D marker rig, three orthogonal projections
    tools/                        verification scripts (see below)
    docs/model.md                 coordinate conventions and constants

## Running it

Astro 7, Node 22.

    npm install
    npm run dev        # local site
    npm run build      # static output to dist/
    npm run check      # harness, reach and shin checks

## Nothing renders as authoritative by accident

Elements and tests both carry a `verified` flag, defaulting to false. Any page whose
mechanics have not been checked by someone qualified says so, in a banner, above the
content. Syllabus entries carry a `sourceUrl` and stay unverified until confirmed
against the governing body's current material.

## Verification

Projection bugs are invisible in the maths and obvious in the picture, so these are
not optional.

    node tools/harness.mjs        evaluate headlessly, scrub every frame, every toggle
    node tools/shot.mjs 0.2 out.png   screenshot at a scrub position
    node tools/reach.mjs          flag any foot the leg cannot physically reach
    node tools/shin.mjs           flag shin lean beyond what a stiff boot allows
    node tools/contact-sheet.mjs  every keyframe of a move, side by side
    node tools/links.mjs          every internal link in dist/ resolves to a real file

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
document is reproduced.
