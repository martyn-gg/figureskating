---
name: rig-verify
description: Render frames of the body-frame rig and actually look at them. Use whenever a pose, projection, sign or glyph is in question — the standing rule here is render, don't reason.
---

# Render, don't reason

Projection geometry is invisible in the maths and obvious in the picture. Several fixes in
this repository were argued through carefully, shipped, and wrong.

## Measure first — and be willing to be wrong about the diagnosis

Before rendering anything, measure the suspect quantity per frame with a `node -e` script
importing `rig-math.js` and `moves.js` directly. Print the frames either side of the fault.

**A degenerate projection and a real motion look identical in one frame.** When a projected
heading swings wildly, check whether the underlying **3D vector** moved too.

> The waltz jump's free boot: the top-down heading's horizontal component fell to 0.071 of
> unit length, which looks exactly like a degenerate projection. Deriving the heading from the
> boot's lateral axis instead held rock-steady at −9° — and would have been a lie. The boot
> genuinely pitched through vertical, and rotating about the lateral axis leaves that axis
> unchanged, which is precisely why it looked stable. The renderer was drawing an impossible
> pose faithfully; the fault was the keyframes.

If the 3D vector moved, the motion is real and "fixing" the projection conceals the bug you
were sent to find.

## The render loop

1. `node tools/frame-svg.mjs <move> <t 0..1> shots/<name>` — standalone SVG, no browser.
   Use `--scheme dark` for the other palette.
2. Stage those SVGs out of the repo folder into the container.
3. Rasterise with the preinstalled Chromium. Pass `executablePath: '/opt/pw-browsers/chromium'`
   explicitly — the bundled resolution fails — and screenshot the `svg` element, not the page.
4. Read the PNGs.

No SVG converter is installed in either the bridge VM or the container; ImageMagick has no
working SVG delegate. Playwright is the route that works.

## What to shoot

**The spiral first and the jump second.** Reviewing whichever element happens to be open is
not sampling: the spiral's rear view has limbs overlapping in 73 frames of 81 where the waltz
jump has 1 in 70.

**But conclude nothing from the spiral alone.** Its skating pitch is authored as exactly 0,
which is the one value that made the end-on roll collapse vanish and hid it for four sessions.
**And its free leg is held at 69% of reach** — visibly bent on a position whose whole line is
the extension, uncaught since Session 01 because `reach.mjs` asserts a maximum and nothing
asserts a minimum. So it is the wrong element to judge an extended leg against, and the right
one to judge overlapping limbs against. Know which question you are asking it.

## Prefer a checker to a screenshot

Anything assertable across all elements should be a checker instead — see the `new-checker`
skill. Between-frame faults are covered by `tools/continuity.mjs`; per-frame geometry by the
rest of the seventeen. Use pictures for **judgement** — is this the right glyph, does this look
like a landing — and never for facts a script could settle.

## The boot has four glyphs, and which one is drawn is a three-way question

Settled 30/08/2026, after two reports on the same frames.

The boot's three axes are orthonormal, so their camera components square to one, and the
picture to draw is the view down whichever axis is most aligned with the camera: **length →
`bootEnd`** (a cross-section), **width → `bootSide`** (a profile), **up → a plan**. The plan
then splits on which face is toward you: `bootTop` into the cuff, `bootSole` onto the underside.

Two traps this closed, both of which had stood for sessions:

- The old test was `prof >= endo` — in the view plane, or at the camera. **A two-way test over
  a three-way question**, and it added the lateral and vertical parts together, so a boot with
  no lateral component at all was still drawn in profile: a picture of it from the one
  direction it was least being seen from.
- **A mirrored top is not an underside.** From beneath, a figure boot is almost entirely blade.

`continuity.mjs --verbose` still reports a near-tie count. It now means a boot at an oblique
angle where no single flat glyph is wholly honest — a property of drawing a solid with
orthogonal views, not a fault.

## The free foot now has a number in it — 30/08/2026

`point` on a keyframe is how hard the free foot is pointed, in degrees from the right angle you
stand at, clamped to `ANKLE_MAX`. Leave it out and it takes `ANKLE_POINT`, which is what every
pose written before that date does.

**So a free boot that looks wrong now has two candidate causes, not one.** Before, the boot was
square to the shin by construction and the only fix was the leg. Now it can genuinely be the
foot. `npm run ankle` prints the whole space: every pose in the file has slack it is not using,
and which way the slack runs depends on where the shin points — **a leg reaching backwards and
UP wants more point** (spiral, sit spin, camel all improve to about 36° at 30) **and a leg
reaching backwards and DOWN wants less** (the waltz and the extended edge are best at 0). That
opposition is why one constant could never suit every pose, and it is not a fact about the
constant's value.

Two things follow when you are looking at a frame:

- **Do not read a pose's free-boot angle as a judgement anybody made.** Every pose written
  before 30/08/2026 is at 10° because that was the only number available. Its `point` is an
  unmade decision, not a choice.
- **A pose can be fixed at the foot without moving a marker.** That is not "moving pose data to
  satisfy a checker" — it is authoring a quantity that used to be forced. Moving the leg to
  change the boot, when the ankle is what is wrong, is the mistake now.

## Still open

**From directly behind, two feet at the same lateral offset coincide**, so the rear view has
little to say when the free leg trails.
