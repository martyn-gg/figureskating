# The model

Conventions and constants shared by both engines. Read this before changing pose data.

Implementation: `src/lib/rig-math.js` (pure geometry), `src/lib/moves.js` (pose data),
`src/lib/body-frame.js` (the three renderers). The explorer is at `/rig`.

## Coordinates

The rig is rooted at the **hip**. Everything else is authored relative to it:

| Axis | Meaning |
|------|---------|
| `t`  | along the track, **+ = forward** (direction of travel) |
| `n`  | across the track, + = the skater's right *while they face the way they are going* |
| `z`  | height above the ice — this one is absolute, not hip-relative |

All distances are centimetres. Yaw is degrees from the direction of travel,
**+ = anticlockwise seen from above**.

Note that `t` is the direction of *travel*, not the direction the skater faces. On a
back outside edge those are opposite, which is exactly why the rig tracks `hipYaw`
and `shYaw` separately.

Both axes belong to the track, and `n` is no exception. "The skater's right" is a
mnemonic for reading a forward pose, not a definition: it stops being true the moment
the skater turns, and on a landing at `hipYaw` 180 the skater's right is at **−n**.
The body-relative direction is `lateral(hipYaw)` and always was. One session read the
mnemonic as the definition and spent its time deciding whether the pose data had been
authored the wrong way round; it had not.

## The three views

One rig, three orthographic projections, one clock. Each owns a different axis of
rotation, which is why all three are needed and none is redundant:

| View | Owns | Shows |
|------|------|-------|
| Top-down | yaw | the tracing, rotation count, shoulder-to-hip twist |
| Side | pitch | knee bend, free-leg swing, blade leaving the ice, toe-then-roll landing |
| From behind | roll | lean angle — which *is* edge depth — and hip/shoulder alignment |

The headline number is **shoulder yaw minus hip yaw**. Negative means the shoulders
are held back against the hips, which is what stores rotation before a takeoff and
checks it on a landing. Positive means rotation is leading the edge — on a Lutz entry
that is precisely how an outside edge becomes an inside one. Most of what a coach
shouts across a rink is this angle.

## Constants

| Name | cm | Notes |
|------|-----|------|
| `THIGH` / `SHIN` | 44 / 42 | hip to ankle, **not** hip to blade |
| `UPPER` / `FORE` | 31 / 29 | shoulder joint to hand |
| `SHOULDER_HALF` | 19 | half the shoulder width |
| `ANKLE_UP` / `ANKLE_BACK` | 15 / 5 | ankle position **in the boot's own frame** |
| `ANKLE_FREE` | 68° | how pointed a free foot is; 90° would be in line with the shin |

## Things that are derived, not authored

Adding a keyframe means giving positions. Everything below is then computed, and
authoring it by hand instead will produce contradictions between the views.

- **Lobe curvature** — from foot, edge and direction (see the README table).
- **Knee and elbow position** — two-bone solve in 3D, then projected. Solving in 2D
  folds a straight-but-foreshortened limb into a false bend.
- **Which way a joint bends** — the kneecap direction is carried along with the femur
  by shortest-arc rotation, not held fixed to the pelvis. Extend a leg behind you and
  the front of the thigh ends up facing the ice, so the knee can only fold downwards.
  This is what makes a spiral read as a straight leg with the knee turned down. The
  teapot then comes out kneecap-up without anyone authoring it.
- **Boot direction** — a blade on the ice can only point along its own tracing, so a
  skating foot takes its direction from the direction of travel plus any toe-pick
  pitch. A free foot is not free to be flat: it hangs off the shin.
- **Ankle position** — feet are authored as the **blade contact**, because that is what
  has to sit on the ice. The ankle is derived in the boot's frame and is where the
  shin must end.
- **Arm carriage** — derived from the shoulder line unless a keyframe overrides it
  with `arm: [out, forward, drop]`.

## A lateral offset is mostly lean

The rig is rooted at the hip, so a foot's `n` is measured from a point about a metre in
the air — and on an edge that point is not above the blade. A skater on an edge leans
into the circle, and the blade is therefore **outside** the lobe, out from under the
body rather than under it. The number that produces is larger than intuition suggests:

| Lean from vertical | `n` at a 90 cm hip |
|---|---|
| 5° | 8 cm |
| 10° | 16 cm |
| 15° | 24 cm |
| 25° | 42 cm |

So a skating left foot at n = +17 on a forward outside edge is not a foot placed to the
right of the body. It is a 11° edge, which is a fairly ordinary one, and the same pose
seen from behind is what the guide calls edge depth. **Read `n` as lean first and as
placement second** — and never infer that two feet are crossed from their `n` values
alone, which is a comparison that ignores how far apart they are along the track.

Two consequences, both asserted by `tools/lean.mjs`:

- **The blade sits on the outside of its own lobe.** `lobeSense` says which side the
  centre is on; the blade must be on the other one. `sign(n) === lobeSense(foot, edge, dir)`.
- **The body leans over the biting edge.** The outside of the left foot is its left side,
  so an LFO leans left; the outside of the right foot is its right side, so an RBO leans
  right. Measured against `hipYaw`, so it holds through a rotation.

They use different inputs and must agree. A pose that satisfies one and not the other is
a pose where the body and the tracing disagree about which way it is falling — which is
what six waltz-jump landing keyframes did until 29/08/2026, leaning out of the landing
circle by up to 11°.

## The blade is not flat

A figure blade is ground to a longitudinal curve — the rocker, around a 7 ft radius —
so only a centimetre or two touches at once, and **which part is touching is most of
what distinguishes one edge from another**.

The arithmetic is the surprising bit. Contact position is `ROCKER × sin(pitch)`, so:

| Boot pitch | Where on the blade |
|-----------|--------------------|
| −1° | 3.7 cm behind centre |
| 0° | the middle |
| +1° | 3.7 cm forward |
| +3° | 11 cm forward — the front of the blade |
| beyond ±3.5° | off the blade entirely |

One degree of ankle moves the contact nearly four centimetres. And the blade runs out
of length at three and a half degrees, which is the whole reason a steeply pitched boot
is wrong: **skaters are never balanced on the toe picks**. A pick is a jab, not a stance,
and only ever forwards — you cannot be on a pick behind you.

`tools/blade.mjs` enforces this. A keyframe wanting more pitch than the blade allows must
set `pick: true` and mean it. The rocker is drawn about six times deeper than life, the
same licence taken with the edge separation; the contact position is computed from the
true radius.

## The boot limits the ankle, not the other way round

A bare ankle plantarflexes maybe 45°. A skating boot encases the foot and the lower
shin and holds them close to square, so **a skater's free foot never looks like a
ballet foot however hard they point it**. `ANKLE_FREE` is 10°, not the 68° I first
guessed.

Most of a free boot's angle comes from the leg, not the ankle: a leg hanging down and
back puts the boot down and back with it. So a near-vertical boot is a sign the foot
is authored too *low* — hanging rather than extended. `tools/freefoot.mjs` flags
anything past 60° from level.

## Body-relative, not track-relative

`t` is the direction of *travel*. The skater's own forward is `hipYaw` away from it,
and on a landing those are opposite. So a free leg "extended behind the skater" is at
**negative t before a half rotation and positive t after it**.

Getting this backwards is invisible frame by frame — each pose looks plausible — and
glaringly obvious on a contact sheet of the whole element. Render the sheet before
believing any sequence that turns.

## Constraints the checkers enforce

- A foot must be within `THIGH + SHIN` of the hip, measured **to the ankle**.
- Shin lean inside the boot must stay under about 28°. A skating boot is stiff; if a
  pose needs more, the foot is in the wrong place under the hip, not the ankle.
- A skating foot's blade sits at `z = 0`. This is inviolable — an automated fix that
  lifts it to satisfy some other constraint has broken the pose, not solved it.
- The skating blade is outside its lobe and the body leans over the biting edge, both
  checked per frame rather than per keyframe, since interpolation can cross zero.

## Deliberate exaggerations

- Blade edges are drawn about ten times further apart than life, so you can see which
  one is biting.
- Cusp depth on turns is stylised.
- Body markers in the top-down view are scaled up relative to the ice, since what
  matters there is their angle rather than their size.

## Two tiers of content, very different economics

1. **Derived** — edges, turns, patterns, dances. Generated from the rules, no
   per-element cost, effectively unlimited. Build this out first; it is most of the guide.
2. **Keyframed** — body mechanics. Within this, held positions (spiral, teapot, lunge,
   Ina Bauer, spin positions) are cheap at one or two poses each and are among the most
   useful things in the guide. Jumps are the expensive end.

Sequence accordingly: derived, then held positions, then jumps.
