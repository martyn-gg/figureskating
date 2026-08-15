# The model

Conventions and constants shared by both engines. Read this before changing pose data.

## Coordinates

The rig is rooted at the **hip**. Everything else is authored relative to it:

| Axis | Meaning |
|------|---------|
| `t`  | along the track, **+ = forward** (direction of travel) |
| `n`  | across the track, **+ = the skater's right** |
| `z`  | height above the ice — this one is absolute, not hip-relative |

All distances are centimetres. Yaw is degrees from the direction of travel,
**+ = anticlockwise seen from above**.

Note that `t` is the direction of *travel*, not the direction the skater faces. On a
back outside edge those are opposite, which is exactly why the rig tracks `hipYaw`
and `shYaw` separately.

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
