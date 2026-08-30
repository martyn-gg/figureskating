---
name: new-checker
description: Add a checker to this repository the house way — an independent expectation, broken on purpose, with the mutation counts in its header. Use when a class of fault could be asserted rather than spotted by eye.
---

# Writing a checker

Seventeen of these exist and every one was written by breaking the thing on purpose first.

## The rule that makes one worth having

**A checker nobody has seen fail is a decoration.** Break the code, record the failure count in
the file's header, then fix it. Counts on record: sign flip 104, boot roll 1102 of 1828, edge
dot 583 of 583, torso drawn as a layer 7,005, casing not retracted 26,659, the free-leg pose 5
discontinuities, a change of edge drawn as a step 8, a camel's free foot 10 cm lower 102 of
321, a spin's position claim removed 1 move, an ankle authored past the boot 1 foot.

Ship a `--break` flag where the old behaviour can be restored in a line. Where it would need a
second copy of a renderer, put the pre-fix counts in the header instead — `boot.mjs` does that.

## The expectation must not come from the thing being judged

A checker that recomputes the renderer's own expression asserts nothing. Take it by a different
route:

- `boot.mjs` takes the expected roll from `ankleOf`'s **output**, not the renderer's formula.
- `lean.mjs` runs two independent routes — the lobe and the path; the edge letter and `hipYaw`
  — which must agree on every frame.
- `twofoot.mjs` puts the model's derivation back against **British Ice Skating's own pairs**,
  read out of their PDF with `pdftotext`.
- `spin.mjs` takes all three of its position definitions from the **ISU Technical Panel
  Handbook**, whose wording is quoted in the header so the encoding can be checked against the
  source. Their definitions are geometry — "the upper part of the skating leg at least parallel
  to the ice" is a comparison between two markers — which is the cheapest outside expectation
  this repository has ever had. **Go and read the governing body's definition before inventing
  one**: it refuted a claim this session had already written down (that a camel is a spiral).

## Ask what KIND of fault it is

- **Per frame** — geometry, contact, reach, lean. Twelve checkers do this.
- **Between frames** — a glyph correct in every frame and wrong between them passes every one
  of them. That class needed inventing; `continuity.mjs` covers it now.
- **Against the source document** — transcription. `syllabus.mjs`, six assertions. Note its
  limits: assertion 4 works on edge codes, so it is blind to an element sitting at a *derived*
  edge the document never names.
- **Against the markup** — if the renderer knows a fact, put it in the DOM as `data-*` and
  assert it. A fact a checker cannot read is a fact it cannot check, and that is where the
  top-down boot bug lived.

## Per frame, not per keyframe

The rig interpolates. `freefoot.mjs` read keyframes only, and the waltz jump passed every one
at 55.8° while reaching 88.6° between two of them. Iterate `buildPath`, not `move.keys`.

**But some assertions belong on the keyframes and only there.** `freefoot.mjs`'s second
assertion — that an authored ankle angle is inside what the boot allows — reads keys, because
an out-of-range number is an authoring mistake and interpolating between two legal keys can
never produce one. Ask which the fault lives in before choosing.

## The WINDOW you assert over is a claim too

`spin.mjs`'s first bug. It tested each spin's position "over the held part", and took that
from the keyframes: the last keyframe is at t = 1.00, so the window collapsed and it sampled a
single instant 321 times — a checker that cannot watch a position being lost, passing happily.
The window came from the source in the end, like the assertion: the ISU asks for two
revolutions in a position, so on a three-revolution spin it is the last two thirds of the
clock. Fixing it immediately failed two moves that were reaching their position at the very
end. **If the assertion comes from the document, the interval should too.**

## A clamp is a silent correction of somebody's number

`bootDir` clamps an authored ankle angle to `ANKLE_MAX`. Defensive and right — and on its own
it is the repository's oldest failure shape, a description of something that quietly changed:
the filter that named what it hid, the loop that discarded an authored hand under a comment
promising it worked. Keep the clamp; assert that nothing relies on it.

## Do not trust the build to fail

`astro build` **logs a dangling content reference as an error and builds anyway**, so four
pages pointed at an element that did not exist while `npm run check` stayed green. If a
correctness property matters, assert it here rather than assuming a build step will.

## Steps

1. Write `tools/<name>.mjs` with a header saying what it asserts and why it is worth having.
2. Break each assertion on purpose; record the counts.
3. `package.json`: a `check:<name>` script, and add it to the `check` chain. A **report**
   rather than a pass/fail check stays out of the chain — `drift` is one.
4. Note it in `docs/state-of-play.md`, and in `docs/model.md` under the constraints it
   enforces.

## Report, do not fail, where judgement is required

Repetition in prose is not automatically a tic; a boot glyph switching branch is not
automatically a pop. Print those with numbers and let a person decide.
