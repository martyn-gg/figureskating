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
| `ANKLE_UP` / `ANKLE_BACK` | 15 / 5 | ankle position in the boot's own frame, **from the blade's centre** — the contact is elsewhere, see `contactAlongOf` |
| `PICK_ALONG` | 17.8 | how far forward of the blade's centre the deepest tooth is |
| `ANKLE_MAX` | 30° | what the boot allows a free foot to point; 90° would be in line with the shin |
| `ANKLE_POINT` | 10° | how far an unauthored free foot points. A keyframe may say `point` |

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
ballet foot however hard they point it**.

**A LIMIT AND A DEFAULT, NOT ONE CONSTANT — 30/08/2026.** This was a single `ANKLE_FREE`
of 10°, applied by `bootDir` to every free foot in every frame, which made it an identity
and not a limit: not *the boot allows no more than this* but *every free foot is pointed
exactly this hard, always*. Session 05 wrote that down and did not act on it, and Session
05's finding that no value of the constant helps every pose at once follows straight from
it — plantarflexion drives the blade wherever the shin already points, so one number
lifts the toe on a spiral and drives it at the ice on a landing. The number was never the
lever. `npm run ankle` prints that table.

`ANKLE_MAX` is 30°, and it is the first number here that is measured rather than guessed.
Manufacturers publish stiffness ratings and not angles — Edea 40–95, Jackson 2–95, scales
that are not comparable to each other. The injury literature has it: Fortin et al.,
reported in *Lower Extremity Review*'s "Over the Edge", measured a rigid boot taking 15°
of plantarflexion and 10° of dorsiflexion off normal ankle motion, which leaves about 30
of the bare ankle's 45. A study of injury is not a study of what a position looks like, so
this is still not a coach's number.

`ANKLE_POINT` is 10° — the old constant, so **every pose written before 30/08/2026 draws
exactly as it always did**. A foot that needs a line says so, with `point` on the
keyframe, in degrees, clamped to `ANKLE_MAX`. That is the same shape as `pitch` on a
skating foot and for the same reason: it is a quantity a skater chooses, not a property of
the leg.

What it bought: **the camel spin, which was undrawable at 10° and is drawable from 15°
up.** And a note for whoever picks up the spiral — its free leg is held at **69% of
reach**, visibly bent on a position whose whole line is the extension, and straightening
it to 93% put the free boot at 61° against a 60° limit. That is why it is bent. At a
`point` of 25 the same straight leg reads 47°.

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
- **Every blade claimed on the ice is within 3 cm of it, and every foot not claimed on the
  ice is at least 5 cm clear.** The existing poses sit at 0–2 and 10–117, so there is a real
  gap between the two and nothing had to be nudged to pass. This is the assertion the lunge
  asked for: it "would have passed every checker with the trailing foot lifted 30 cm", and a
  second blade authored at free-foot height is the same cheat the other way up.
- **Two blades on the ice share one lobeSense, every frame, and sit 5–70 cm apart.** Measured
  through `poseAt` rather than off the keyframes, because the renderer reads `poseAt` and a
  per-foot field dropped from its interpolation would make a second blade vanish everywhere
  except in the authoring — which is exactly how the `LH`/`RH` override was discarded for
  four sessions. `tools/twofoot.mjs`, which also puts the derivation back against British
  Ice Skating's own four pairs.
- **Every** blade on the ice is outside its lobe and the body leans over the biting edge,
  both checked per frame rather than per keyframe, since interpolation can cross zero. Two
  blades bite on the same side of the body, so one lean satisfies both.
- A boot drawn end-on rolls with its own up-axis, and a skating boot is never drawn past
  30° of roll — the 28° the cuff allows, plus what the projection does to a boot that is
  also pitched. `tools/boot.mjs`.
- The edge dot is drawn on a blade that is on the ice and on nothing else. A free foot is
  in the air; a dot on it asserts contact the model is simultaneously denying.
- Every drawn segment carries `data-depth` and the drawn order is non-decreasing in it;
  casings = segments − 1, each retracted from its own joint; no arm segment carries more
  ink than a skating leg; the elbow is not drawn below the projected-bend threshold; both
  hands appear in every frame that draws arms; an authored `LH`/`RH` survives the
  default-carriage assignment. `tools/arms.mjs`.
- The free boot's angle from level is checked **per frame**, not per keyframe. The waltz
  jump passes every keyframe at 55.8° and reaches 88.6° between two of them.
- **A free boot is not drawn below the ice**, measured off the real render tree in every
  view that draws an ice line, with one declared exception: a free foot in the last frames
  before it takes the weight, which is the step-over this rig does not draw. Held from both
  sides — deeper fails, vanished fails. `tools/underice.mjs`, in the chain since 20/09/2026.
- **A free foot's `point` is a pose's choice, not a constant.** `ANKLE_POINT`'s 10° is what
  an unauthored foot does and it is not neutral; `NEUTRAL` is 0 and `POINTED` is 25, both
  authored per key. Martyn, 20/09/2026: landing a waltz jump the free foot is pushed back
  and neutral, and it is neutral through the move as well.
- **A `rig:` names a move that exists, and every move is named by a page or declared.**
  `BodyFrame.astro` wraps its figure in `{m && (...)}`, so a name matching nothing draws
  nothing and the build stays green. Asserted from both sides, because an exemption that
  only excuses is the hole this file keeps recording: a declared-unpublished move that
  gains a page fails too. `tools/rig-names.mjs`.

## Deliberate exaggerations

- Blade edges are drawn about ten times further apart than life, so you can see which
  one is biting.
- Cusp depth on turns is stylised.
- Body markers in the top-down view are scaled up relative to the ice, since what
  matters there is their angle rather than their size. The tracing is **not** — which is why
  a second blade gets a boot glyph there and no second tracing. See *Two blades* below.

## Two tiers of content, very different economics

1. **Derived** — edges, turns, patterns, dances. Generated from the rules, no
   per-element cost, effectively unlimited. Build this out first; it is most of the guide.
2. **Keyframed** — body mechanics. Within this, held positions are cheap at one or two
   poses each and are among the most useful things in the guide. Jumps are the expensive
   end.

Sequence accordingly: derived, then held positions, then jumps. But see **What the rig
cannot hold** below: an earlier revision of this list named the lunge, the Ina Bauer and
the spin positions as the cheap ones, and all three turned out to be outside the model
rather than merely unbuilt. Two of the three have since come back inside it — the Ina
Bauer when a pose learned to hold two blades, and **the spin on 30/08/2026, which was
never outside it at all**. The lunge is still out.

## What the rig cannot hold — 29/08/2026

Three held positions were tried and put back. Each fails against a different part of the
model, and none of them fails for want of effort at the keyframes.

**One blade, and only one — RESOLVED 30/08/2026.** See *Two blades* below. A pose held a
single `skate` field and the tracing, the edge colour and both lean assertions all read off
it. An **Ina Bauer** and a **spread eagle** have two blades on the ice at once, on two
edges. So does BIS's own **slip step**, defined in *Definition of Steps, Turns & Movements*
as a step with the blades of both skates held flat on the ice — so this was never an exotic
gap, it was a thing the syllabus names. A pose can now hold two blades; the slip step still
cannot be drawn, because it needs a **flat**, which is a different missing thing.

**A boot can pitch but it cannot roll.** A **lunge** has one blade on its edge and the
trailing boot lying on its side, and rolled onto its side is an axis the rig does not
have. That was the fatal one, and not for the reason expected. `bootDir` builds a free
boot square to the shin, so a trailing leg that reaches back and down to the ice ends with
a near-horizontal shin and therefore a boot pointing straight at the ice. `freefoot.mjs`
calls that a ballet pointe and is right to.

~~Measured across the whole plausible range of trailing-foot positions at a lunge's hip
height, **there is no legal pose**: the boot only comes back inside 60° once the foot is
lifted about 30 cm, at which point it is an arabesque and not a lunge.~~ **The conclusion
held and the reason was backwards — re-measured 30/08/2026 when the ankle became
authorable.** The old sweep could not vary the ankle, because nothing could: every free
foot was pointed at exactly 10°. Re-run with `point` free over the boot's allowance, on a
trailing leg held past 85% of reach:

- **At 10°, still nothing** — at any hip height, at any trailing-foot height. Stronger than
  the original claim, which said the boot came back inside 60° once the foot was lifted.
  With the leg required to be extended rather than tucked, it never does.
- **With the ankle free, legal poses appear with the trailing foot ON THE ICE**, and
  disappear as it lifts — the opposite direction. Best at each hip height, with the skating
  leg's own reach and shin lean checked: hip 42 → 60°, hip 46 → 57°, hip 50 → 54°, hip 54 →
  51°, all with the trailing foot at z = 0 about 70 cm behind and the skating blade a third
  of a metre forward.
- **Every one of the 8,064 legal poses uses a point of 8° or less, and 4,002 of them use
  zero.** The lunge was blocked by a constant that was too *high*. Nothing in the file could
  ask for a flatter ankle than 10° until 30/08/2026.

So the pose is no longer the blocker.

**Coaches call the lunge a drag** — Martyn, 30/08/2026. There is no page to hang that on yet,
so it is recorded here: when the pose can be drawn, the element carries `drag` in its
`aliases` and appears on `/elements/other-names/`.

**The lunge is still out, and now for exactly one reason.** `onIce` did not buy it and
neither did the ankle. Its second contact is a **boot lying on its side**, not a blade, and
what that needs is a rolled-boot glyph and a roll axis the renderer does not have — the same
missing glyph as *a boot seen from above its own opening*. Marking the foot as touching would
exempt it from the free-boot limit and then draw it wrong, which is worse than not drawing
it. Three barriers stood here on 29/08/2026; two have gone and this is the third.

**One thing the re-measurement will not tell you, and it is worth knowing before trusting
it.** A free foot's shin-to-boot angle is `point` by construction, so no checker can falsify
it — `shin.mjs` deliberately iterates blades on the ice only, and extending it to free feet
would assert an identity. The trailing shin in these lunge poses runs to about 39° against a
boot cuff that allows 28, and nothing in the repository says so. That is a real limit of the
measurement above, not a defect in it.

~~**A spin is the far side of a boundary this model already states.**~~ **WRONG, and
corrected 30/08/2026 — see *A spin is an arc* below.** The claim was that `hipYaw` is
measured from the direction of travel and a spin has no direction of travel. A spin's
blade has a direction of travel at every instant, and it rotates at the rate the body
does, so `hipYaw` through a spin is *constant* rather than undefined. What a spin has not
got is net displacement, which is a different thing. The paragraph stood for a session and
cost nothing but the session; it is left here struck through because a model that quietly
deletes its wrong turns teaches nobody anything.

## A free leg that is up and behind cannot be brought down — 20/09/2026

Found while giving the spins an entrance and an exit, and it is the reason the camel spin's
free leg does not move and the combination spin has no camel in it.

`bootDir` builds a **free boot square to the shin**. That is the rule that made the lunge
undrawable and that made the waltz jump's free boot swing through the ice, and both of those
were read as problems with the pose — a leg folding and unfolding, a shin sweeping through
horizontal. This one is not. It is a property of the region.

Measured across the whole plausible range, hip at 96 cm, free foot swept over `t` and `z`:

| free foot | elevation of the free boot |
|---|---|
| in front, low (`t` −40, `z` 16) | +1° |
| behind, low (`t` +40, `z` 16) | −52° |
| **behind, mid height** (`t` 0–60, `z` 30–70) | **−67° to −85°, at every reach** |
| behind, high (`t` +94, `z` 125) — the held camel | −47° |
| over the hip, high (`t` 0, `z` 110) | −62°, between neighbours at +44° and +18° |

Two things follow, and together they close the door.

**The mid-height region behind the body is bad at every extension.** It is not a fold that a
longer leg fixes: at 78% of reach the same boot reads −4° in front of the hip and −70° behind
it. So a leg cannot be raised or lowered through it.

**The way round it is the degenerate one.** Lifting the leg near the body and sweeping it back
at height crosses the free foot over the hip, which is where the top view is looking straight
into the boot's opening — the glyph swings a hundred degrees between neighbouring poses. That
is the same missing glyph recorded under *the boot seen from above its own opening*.

Blocked going up and blocked coming down. So a camel is drawable and a change into or out of
one is not, and the rig that holds a camel starts and ends already in it. Same family as
`twoFoot` not drawing the step-on and `toePick` not drawing its entry, and the same rule
decides it: a pose that cannot be drawn honestly is not drawn.

**What would fix it** is a free boot whose direction does not come from the shin alone — the
`point` field already rotates it about one axis, and what a reaching leg needs is the other.
That is a model change and nobody has costed it. It would also buy the lunge.

## The drag's contact is the side of the boot, and the rig cannot roll one — 20/09/2026

**Corrected the same day, by Martyn, after the first version of this section had been
committed.** It measured a trailing *blade*, flat on the ice, turned out — which is what the
element page said and what I took from it — and concluded that `shin.mjs` was the blocker.
That is an answer about a pose nobody skates.

**What a drag actually is:** the free boot is turned IN, the skating knee sinks far enough
that the free blade lifts clear of the ice, and what drags is the **inside of the boot**. So
the contact is not a blade at all, and putting the boot's inner side on the ice means rolling
it onto that side.

Which is the axis this file has said the rig has not got since Session 14, under *What the rig
cannot hold*: **a boot can pitch but not roll.** The drag is not a new blocker. It is the
lunge's, and the same sentence decides both.

### The model was already saying the blade comes up

Worth writing down, because it was measured before the correction arrived and reads as
corroboration rather than as a patch. Free foot behind, pointed, at its furthest reach:

| hip | furthest back with the marker on the ice | the blade's low end there | lift needed to clear |
|---|---|---|---|
| 96 | 32 cm | −8.9 cm | 9.5 cm |
| 92 | 42 cm | −9.9 cm | 10.5 cm |
| 88 | 50 cm | −10.6 cm | 11.0 cm |
| 84 | 56 cm | −11.1 cm | 12.0 cm |
| 80 | 62 cm | −11.5 cm | 12.0 cm |

At every hip height the blade is nine to twelve centimetres into the ice, and **lifting it
buys reach**: at a hip of 88 the foot goes 50 cm back with the marker on the surface, 64 at
ten centimetres up and 75 at twenty. Sink, extend, and the blade has to come up — which is
the coaching, arriving out of the geometry. The first pass read those negative numbers as a
pose being blocked. They are the pose telling you where the foot goes.

`tools/underice.mjs` exists because of this. A blade that will not clear is a blade that has
to be lifted, and until that checker there was nothing in the repository that could say so.

### What is still true about the pose as the page described it

A trailing **blade**, flat on the ice and turned out, is not drawable either, and this is why
the page's own wording could not have been animated as written. A boot allows 28° of shin
lean:

| hip | skating blade | trailing, 20 cm back | 30 cm | 40 cm |
|---|---|---|---|---|
| 96 | 23° | 26° | 25° | out of reach |
| 94 | 26° | **31°** | **32°** | out of reach |
| 92 | **30°** | **35°** | **37°** | **33°** |
| 88 | **36°** | **41°** | **44°** | **44°** |

Only a locked skating leg keeps both shins legal. Pitching the trailing boot makes it worse
monotonically — 44° at zero pitch, 52° at 8, 64° at 20, 80° at 40 — because tilting the boot
tilts its up-axis away from the shin. And `turnout.mjs` reads a trailing toe as 150° of hip
rotation, which is the case its own header predicted and excluded picks for. None of that is
the drag; all of it is worth keeping, because it is what the repository would have shipped.

### Three conventions this measurement had to get right first

Durable, and two of them were wrong on the first pass.

**Which way is behind.** `t` is the direction of TRAVEL, so behind the skater is `-t` at
hipYaw 0 and `+t` at hipYaw 180. Sweeping `+t` at hipYaw 0 measures the region in FRONT, which
is benign, and reports a blocked pose as fine. `moves.js` opens by warning about this.

**Which sign is up.** `freefoot.mjs`, which owns the 60° limit, reads elevation as
`asin(bd[2])`, positive toe up. `ankle.mjs` read `asin(-bd[2])` and took the absolute value of
it everywhere, so **the two disagreed from the day `ankle.mjs` was written and nothing could
see it.** Fixed, output byte-identical. Two copies of a fact, one wrong, hidden by an `abs()`.

**What `point` a surface was swept at.** The camel table above reproduces at **point 25, n −8,
hip 96** — four of five landmarks within a degree. That is a pointed foot, not the default 10.
The surface is a function of the ankle as well as the leg, so a table read at another point is
another table.

### The checker this produced, and what it immediately found

`tools/underice.mjs`, and it is worth saying what it is not. `freefoot.mjs` limits the boot's
ANGLE at 60° from level, and the angle is half of where a boot ends up; the other half is the
height, and the two only meet at the ends of a glyph 30 cm long. A boot pointed at the limit
reaches some 14 cm below the marker it hangs from, which is fine at knee height and buried at
ten centimetres.

It measures off the real render tree rather than off the pose, because the class of fault it
exists for is a DRAWING fault: Session 15's was a plan glyph that failed to pivot about its
contact, which no amount of correct pose data would have saved and which a checker
recomputing `bootDir` would have passed. Where the ice is comes out of the markup — `data-ice`
was added to the ground line for it, on the same argument that put `data-boot` on the boots —
so the views it judges are the ones that DRAW an ice line, found rather than named.

**It found nine runs on the day it was written**, none of them the drag:

| move | deepest | frames |
|---|---|---|
| sit spin | 5.4 cm | 75 |
| combination spin | 5.4 cm | 48 |
| teapot | 4.8 cm | 31 |
| waltz jump | 2.0 cm | 25, plus four shorter runs |
| change of foot | 1.2 cm | 7 |

**And it dictated the fix rather than confirming one, which is the difference between a
checker and a test.** The first three are one fault: a boot is built square to the shin, so a
free leg sloping down and forward carries a foot at a right angle to it — toe cocked up, heel
down — and it is the HEEL going through the ice. The sit spin's boot reads +58.6°,
comfortably inside the 60 `freefoot.mjs` allows. **An extended free leg is pointed**, and
`POINTED` at 25 (inside `ANKLE_MAX`'s 30) is what a pointed foot is; it clears all three, on
the keys where the leg is extended and not on the entrance, wind-up and exit where it is
gathered. 42 of 399 hashed frames moved, all of them in those three moves.

The two that remain are not the same fault and neither is ready to be moved. The waltz jump's
landing gets WORSE when pointed — `npm run ankle`'s own line is that plantarflexion lifts the
toe on a spiral and drives it at the ice on a landing — and the change of foot is unmoved by
the ankle entirely, because its free foot is at z 0 at the instant it is about to become the
skating foot. That is the step-over this rig does not draw, after `twoFoot` and `toePick`.

### What it would take

A boot that can **roll**. The lunge has wanted it since Session 14, the drag wants it now, and
it is a different axis from the one the camel change wants — that one is a free boot's
*direction* coming from something other than the shin alone. Two missing rotations, not one,
and the drag is the element that needs the cheaper of them: a contact declared on the boot's
side rather than on a runner, with an angle saying how far over it is.

Until then the page says what is missing and why.

## The boot's fourth rotation — specified and built 20/09/2026

The lunge has been blocked since Session 14 and the drag joined it this morning. Both want the
same thing and this file has named it loosely — "a boot can pitch but not roll". This is that,
stated precisely enough to build from, and the precedent is *The pick is a third kind of
contact*: specify it, then mark the specification up with what building it actually cost.

**Built the same afternoon. What follows is the specification as written, with the four places
it was wrong marked where they happened.** Its central claim — one field, one rotation, one
function, and everything else follows — held exactly. Two of its details did not, one of them
in a direction that reversed a decision.

### What is missing, exactly

A boot has three rotational degrees of freedom and this model authors two of them.

`bootDir` returns one vector, `bd`. Its pitch comes from `point` (rotation about the boot's
lateral axis) and its yaw from `yaw` or from the tracing. That is two. The third is **rotation
about `bd` itself**, and it is not authored anywhere — it is *derived*, in `ankleOf`:

```
up = reject(toKnee, bd)        // the boot's up-axis: the direction the leg leaves in
ankle = contact − bd·back + up̂·ANKLE_UP
```

So the boot's up-axis is the shin's own direction with the boot direction taken out, and the
whole boot frame is pinned to the plane containing the shin. **There is no roll, and there is
nowhere to put one.** The renderer then reads the axis straight back off the ankle —
`u3 = unit(reject(ank − blade, bd))`, `latL = cross(bd, u3)` — which is the rule *The boot's
up-axis is one vector* below, and is why `boot.mjs` can assert the drawn roll to 0.00°.

### The shape: one field, one rotation, one function

`roll` on the foot, in degrees, rotating `up` about `bd` inside `ankleOf`, before the ankle is
placed along it. Defaulting to zero, so every pose written before it draws byte-identically —
the same shape as `pitch`, `point` and `yaw`, and the same promise, which is checkable by
hashing frames.

**Everything else follows for free**, and this is the part worth checking before believing:

- The renderer recovers the up-axis from the ankle, so a rotated `up` is a rotated glyph with
  no renderer change at all, and `boot.mjs`'s 0.00° assertion stays true by construction.
- `latL = cross(bd, u3)` rotates with it, so the **glyph choice follows automatically**. The
  branch picks whichever of the boot's three axes most faces the camera, and a boot rolled onto
  its side presents its up-axis sideways — which is `bootTop` or `bootSole`, a plan. That is the
  right picture of a boot lying over, and it already exists.
- The ankle moves, by up to `ANKLE_UP·sin(roll)`, 13 cm at 60°. **That is correct rather than a
  side effect**: roll your foot onto its edge and your ankle goes over the contact. `twoBone`
  re-solves the knee from the moved ankle, so the leg follows.

**A stale note to retire.** *Still open — a glyph for a boot seen from above its own opening*
has been carried in the memory file since Session 06 and is answered: *Three axes, three
glyphs*, 30/08/2026, found the glyph had existed since the first session and the profile views
simply could not reach for it. The roll needs no new glyph. It needs the axes to be able to get
there.

> **WRONG, AND CORRECTED THE SAME HOUR.** The next section makes 41.2° a threshold. It is
> only the answer while the boot is level: tilt it and the sole's edge moves with the whole
> frame, and on a lunge's trailing boot it reaches the ice at about 22°. There is no constant
> here, only a per-pose pair. `SIDE_ROLL` became `SIDE_ROLL_LEVEL` and is a reference figure.

### The contact, and the number that decides it

Rolling far enough stops the blade being what touches. **Both dimensions are in the glyphs
already, at true scale, so this is read rather than chosen:** the boot is 8 cm to the edge of
its sole (`bootTop`'s path) and the blade stands 7 cm proud of that sole (`bootSide`: body at
y −3, rocker's lowest at y 4). Rolling about the runner, the sole's edge sits at
`7cos θ − 8sin θ` above the ice and reaches it at

**θ = 41.2°.**

Past that the boot's edge is the lowest thing on the foot and the blade is clear. So a
boot-side contact is, **by construction, past the roll a boot on an edge can be at** — exactly
as a pick is by construction past `MAX_BLADE_PITCH`. That symmetry is the argument that this is
the right decomposition and not a fifth special case.

For scale: `boot.mjs`'s `ROLL_LIMIT` is 30 and `shin.mjs` allows 28. Between 30 and 41 the boot
is over further than a stiff cuff permits and the blade is *still* the lowest thing — a band
that is a real pose and not a contact, and nothing needs to draw it.

### `onIce: 'boot'` — the fifth contact

`onIce` already carries `blade`, `pick` and `skid`. The fourth value says the ice is holding
the boot's **side**: on the ice, bearing weight, no edge, no lean claim, and a roll far past
what a blade allows.

`contactAlongOf` gains a branch — a boot on its side touches along most of its length, so zero,
the same answer and the same reason as a skid. What it also needs, and what has no precedent in
the file, is a **lateral** twin: the contact is 8 cm off the boot's centre line rather than on
it. Today every contact sits on the blade, which is on the centre line, so the offset has never
existed. This is the one genuinely new mechanism in the specification.

> **BUILT AND TAKEN BACK OUT.** `contactAcrossOf` was written, wired into `ankleOf`, and
> removed within the hour. Putting an offset perpendicular to the boot between the authored
> point and the ankle contaminates `ank − contact`, which is **the vector the renderer recovers
> the up-axis from** — so the recovered axis came out 45° wrong and `boot.mjs`'s drift check
> would have had to learn to undo it. The authored point keeps one meaning for all five
> contacts, the blade's reference, and `soleEdgeZ` carries the difference as an assertion
> instead. One meaning for the authored point was worth more than making it the touching point
> for one contact out of five.

### What it does to each checker

| file | today | with the roll |
|---|---|---|
| `boot.mjs` | a *planted* boot may not roll past `ROLL_LIMIT`; a free one may lie over | a three-way rule. A boot on its **side** must be rolled **past** 41.2°, asserted from both sides — a boot declared on its side and drawn at 20° is claiming a contact its geometry does not make, which is `blade.mjs`'s pick assertion word for word |
| `lean.mjs` | iterates `edgesDown` | untouched: a boot on its side has no edge, so it is not in the set. Its header's sentence *"a planted boot is a boot the ice is holding upright, whichever part of it is down"* becomes false and must be rewritten |
| `blade.mjs` | `blade`/`skid` inside ±3.5° of pitch, `pick` outside | a boot on its side is neither; its pitch is free and its ROLL is what is held |
| `shin.mjs` | iterates `runnersDown` | ~~widen it~~ **it cannot be widened: the quantity is an identity.** `roll` IS the rotation of the boot's up-axis away from the plane of the shin, so the shin-to-boot angle tracks it one for one — measured at roll 80 it reads 83 against world up and 95 against the boot's own axis. Same reason picks are excluded and free feet are. And a legal lunge needs **56 to 80° of roll**, which no ankle everts: a skater gets almost all of it by turning the leg, which this rig does not model separately, so `roll` carries both and no cuff limit applies to it |
| `turnout.mjs` | `runnersDown`, and picks excluded because a leg extended behind reads as rotation nobody is doing | a boot on its side behind the body has the same problem and wants the same exclusion |
| `freefoot.mjs` | skips anything `onIce` | skips it: correct, the foot is not free |
| `underice.mjs` | free boots only | skips it — and **it is what confirmed the contact was right**: the drag does not appear in its output, so the solved height really does put the sole on the ice and nothing through it. Written this morning and load-bearing by the afternoon |
| `contactAlongOf` | rocker / teeth / nothing | a fourth branch, zero, plus the lateral offset above |

### What it buys, honestly

**The lunge**, whose pose stopped being the blocker on 30/08/2026 — 8,064 legal poses were
found, all at a `point` of 8° or less — and which has been waiting on this alone ever since.
**The drag**, which is the same position; Martyn, 30/08/2026: *coaches call the lunge a drag*,
recorded before either was drawable and now the reason they are one piece of work.

It does **not** buy the Ina Bauer or the spread eagle, which were freed by two blades, nor the
slip step, which needs a **flat** — a different missing thing, recorded below.

### What building it actually cost

**The renderer needed no change at all.** The strongest claim in the specification and the one
most likely to be wrong. `boot.mjs` reports the worst disagreement between a drawn roll and the
boot's own up-axis as **0.00°** with the roll in, across 25,668 glyphs — so rotating `up` in
`ankleOf` really does rotate all three axes, and the glyph chooser really does follow on its
own. The rear view now draws a boot lying over at 55° of projected roll, which is the first
time this rig has drawn one legitimately.

**`boot.mjs`'s roll limit needed an exemption, and the exemption needed somewhere to point.**
Its own sentence — *a planted boot is a boot the ice is holding upright, whichever part of it
is down* — stopped being true, because `onIce: 'boot'` is a boot the ice is holding OVER. The
limit is excused for it and `blade.mjs` holds the pair instead, which is where it belongs:
what that file is about is which part of the boot reaches the ice. Broken on purpose there,
3 of 3 each way — the sole lifted off the ice, and the runner put back on it.

**The height is a fixed point, not a linear solve**, and the first attempt was 0.8 cm out
because it assumed otherwise. Raising the foot re-aims the shin, which re-aims the boot, which
moves the sole's edge: the slope is about 1.23, not 1. Bisection, and the comment says so.

**And it bought one element, not two.** The lunge and the drag are the same position — *coaches
call the lunge a drag*, Martyn, 30/08/2026, recorded here three weeks before either could be
drawn, with the instruction that the element carry the other name in its aliases when it could.
It does. The page is `drag`, Learn to Skate USA's name, and `lunge` is the alias.

### The two decisions it rests on

1. **Is `roll` authored, or derived from the contact?** Authoring it is the cheap, consistent
   answer and matches `pitch`, `point` and `yaw`. Deriving it — the roll is whatever puts the
   sole's edge on the ice, given where the ankle is — is the house's preferred shape, *prefer
   assertions on quantities the pose IMPLIES over ones it STATES*, and it is what made the
   pick's hip height fall out rather than be typed. The hybrid is to author it and assert it
   against `7cos θ = 8sin θ`, which makes the number falsifiable instead of a description
   waiting to be believed.
2. **Does `shin.mjs` widen to free and side-contact feet?** It deliberately does not, because a
   free foot's shin-to-boot angle is `point` by construction and asserting it would assert an
   identity. That reasoning does not hold for a boot on its side, whose shin angle is a
   consequence of the roll — so this may be a third quantity the pose implies.

## Two blades, and the one fact that made them cheap — 30/08/2026

A pose can hold two blades. `skate` did not become an array; it stayed single-valued and
changed job. It is now the **reference blade**: the one `buildPath` builds the path from and
the one the hip hangs off, and `null` still means airborne. A second blade is declared on the
foot itself, `onIce: 'blade'`, with its own direction of travel where the two feet oppose.

**The second blade's edge is never stored.** Both blades are on one circle, and one circle is
one lobe, so the two share a `lobeSense`. Feed that back through the same three flags and the
second edge letter falls out of the first blade's state and the second foot's direction —
`secondFoot` in `skating.js`, four lines. Storing it would be the second source of truth
`style.md` bans, and it would make an impossible pair like RFI & LFI representable.

British Ice Skating's Skills 1 slalom writes its two-foot power changes as pairs — RFI & LFO,
RFO & LFI, LBI & RBO, LBO & RBI — and **all four have equal lobeSense**. Neither the document
nor this model was told. It is the same agreement that already held for mohawks and choctaws,
and `tools/twofoot.mjs` asserts it against their paper rather than against the model itself.

Two consequences worth having in front of you before authoring anything two-footed.

**A two-blade pose is one foot outside and the other inside — or the feet oppose.** Both feet
the same way round gives one of each letter, which is a two-foot power change or an Ina
Bauer. One forward and one backward gives the *same* letter on both, which is a spread eagle,
and that is what the turnout is for. There is no third shape.

**`lean.mjs` did not have to be weakened, and got stronger.** The expectation was that a
checker would have to be scoped out. It does not: the outside of the left foot and the inside
of the right foot are both the skater's left side, so two blades bite on one side, the body
leans over that side, and one lean satisfies both routes on both feet. The file now asserts
that *every* blade on the ice leans the same way. The rear view shows it — the two edge dots
come out on the same side of the body, in two different colours.

### What two blades still cannot do

**A change of edge, in the rig.** A power change passes through a **flat**, where the lobe has
no centre, `lobeSense` is zero and `lean.mjs`'s TRACK route has nothing to assert against —
`sign(n)` must pass through zero and there is no right answer at the crossing. So the rig
holds the two-foot *position* either side of the change and the edge diagram draws the change,
which is the division of labour this repository has always had. Giving that assertion a
domain is real work and it is the same missing thing as the flat below.

**A flat.** BIS defines a flat as the double tracing of a skate that is straight — two lines,
not a third colour, which is worth knowing before anyone reaches for a token. `edgeCol` is a
bare ternary in five places and would silently colour a flat as an inside edge: the same shape
as the featured filter that absorbed the twizzles. The slip step needs this and so does the
crossing above.

**A second tracing in the top-down view.** Deliberately not drawn. That view's one invariant is
that *the tracing is true and only the body is enlarged* — the body is drawn about four times
life so a skater is not a speck against a four-metre lobe. A second blade is positioned by the
body scale, so a line under it would be four times too far from the first; drawn at true scale
the two tracings are a boot's width apart on a four-metre lobe and resolve to one line, which
is what they honestly look like. Neither is worth having. The two blades are carried by two
boot glyphs in two edge colours, which is where that fact is legible anyway.

## A foot arriving on the ice — specified and built 20/09/2026

A foot in this rig is one of two things. It is the skating foot or a declared contact —
`onIce`, in one of its five kinds — or it is free. `tools/twofoot.mjs` asserts the gap
between them: a contact within 3 cm of the ice, a free foot at least 5 cm clear, with the
note that the existing poses sit at 0–2 and 10–117 so there is a real gap and nothing had
to be nudged to pass.

**There is no third thing, and a foot being put down needs one.** This file records the
diagnosis twice already, both on 30/08/2026, and `moves.js` writes it plainly against the
pick: *the frames between "free" and "picked" are a state the model has not got — the foot
is neither hanging nor planted*, followed immediately by *twoFoot does not draw stepping
onto two feet either, and for the same reason*. This is that state, named and specified,
after it turned up for the fourth time.

### How it surfaced, which is the part worth keeping

`tools/underice.mjs` reported a boot drawn through the ice on the waltz jump's landing and
on the change of foot. Four of the five waltz runs were a coach's correction — an arriving
foot is neutral, not pointed — and the fifth was an unwritten `point` on a *skating* key
that does nothing where it sits and is interpolated toward by the free frames before it.
Both are fixed, and what is left is one run of two frames at a millimetre.

Then the reason showed itself. **`twofoot.mjs`'s clearance assertion runs on keyframes**, and
the file labels that itself — `── 1, 2, 3: the keyframes ──`. Per frame, the two moves read:

| move | per-key minimum | per-frame minimum | frames under 5 cm |
|---|---|---|---|
| waltz | 10.00 cm | 1.23 cm | 2 |
| changeFootSpin | 14.00 cm | 0.01 cm | 17 |

Every keyframe clears at twice the bound and the feet reach a millimetre between them. That
is `freefoot.mjs`'s old fault in another file — *the waltz jump passes every keyframe at
55.8° and reaches 88.6° between two of them* — and these are the only two moves in the guide
where it happens, which is why they are exactly the two `underice` was reporting. **Two
checkers were seeing one hole from opposite sides.**

**And the obvious repair is wrong.** Making the assertion per frame would assert something
false: a foot being put down HAS to cross that band, because a skater cannot step onto a
foot that teleports from 5 cm to contact. So 5 cm is a claim about a foot that is *staying*
free, and the rig cannot say which kind it is looking at. That is the missing thing, exactly.

### The shape: derived, not authored

Unlike the roll and the pick, this wants no new field. Whether a foot is arriving is already
written down, in the keys either side of it:

```
arrivalOf(move, f, which) → 'arriving' | 'departing' | null
```

A free foot is **arriving** when the next key in which that foot takes a contact — becomes
`skate`, or carries `onIce` — is the next key at all; **departing** when the previous key was
one; and neither otherwise. Nothing is stated that the pose does not already imply, which is
this repository's stated preference and the thing that made the pick's hip height fall out
rather than be typed.

The alternative is a flag on the keyframe. It is rejected for the reason `pick: true` was
rejected on 30/08/2026: a flag exempts and holds nothing to account, where a derived answer
can be asserted from both sides.

### What it changes

**One: the boot's orientation over the last few centimetres.** Today `bootDir` builds a free
boot square to the shin plus `point`, so a boot whose blade is a millimetre off the ice still
hangs at a leg-derived angle and the glyph goes through the surface. While a foot is arriving,
its direction should blend from that construction toward the planted one the contact key uses —
the heading from the tracing, the pitch from `pitch` — reaching it exactly at contact. The two
agree at z = 0, so the seam is where nothing is happening.

**In `bootDir`, not the renderer**, on the roll's precedent: one change in one function, and
the renderer follows for free because it recovers all three axes from the ankle. If the roll's
central claim held, this one should too, and `boot.mjs` should still report 0.00°.

**Two: the clearance assertion becomes per frame and gains a second side.** A foot below the
bound that is *not* arriving or departing fails, which is the assertion that does not exist
today. And an arriving foot must descend monotonically and actually reach its contact, so the
window cannot be used to excuse a foot that dips and comes back up. That is the pattern
`blade.mjs` used for the pick: replace an exemption with a declaration and the same file gets
a second assertion for free, pointing the other way.

### The one constant that has to move

The blend's window is a height, not a span of clock. It cannot be clock: the change of foot
descends 16 cm over 0.14 of its duration, and at 16 cm the foot is plainly free — blending
there would orient a boot to a contact it is nowhere near.

So the window is the last **`CLEAR`** centimetres, which is 5, and which today lives in
`tools/twofoot.mjs` as a checker's constant. **A checker's number cannot become load-bearing
in the model**; that is two expressions of one fact, the failure this file keeps recording.
It moves to `rig-math.js` beside `ANKLE_MAX` and `MAX_BLADE_PITCH`, and `twofoot.mjs` imports
it. Like those two it is then a number the model imposes, and like those two it is **not
verified against a coach** — it came from the spread of the existing poses, which is a
description of what has been authored rather than a measurement of skating.

### What it should buy, stated so it can be wrong

- `underice.mjs`'s `arriving` declaration **empties entirely** and the file goes to zero
  exemptions, because a boot blended to its contact sits on the ice rather than through it.
- `boot.mjs` still reports the worst drawn-roll disagreement as **0.00°**.
- The frames that move are **only** those in the arrival windows: 2 in the waltz, 17 in the
  change of foot, and none anywhere else. Everything else hashes identical.
- `continuity.mjs` stays green — it is the file that would catch a blend that jumps, and it
  is the reason the blend is specified as continuous rather than as a switch.
- `freefoot.mjs` may need arriving feet excluded from its 60° limit, the way `onIce` feet are,
  because an arriving boot's angle is partly its contact's. **Unknown**, and the first thing
  to measure.

### What building it cost

Four of the five held. The fifth was wrong in a way that found something bigger.

| prediction | outcome |
|---|---|
| `underice`'s declaration empties | **nearly**: 0.1 cm over two frames became **0.027 cm over one** |
| `boot.mjs` still 0.00° | **held**, across 26,952 glyphs, with no renderer change |
| 19 frames move, nothing else | **wrong**: 37 foot-frames are inside the window |
| `continuity.mjs` stays green | **held** |
| `freefoot.mjs` may need arriving feet excluded | **not needed** — green without it |

**The count was wrong because I counted arrivals and the specification says arriving OR
departing.** Nineteen frames arrive; eighteen depart. And the eighteen led somewhere.

> **THE DEPARTURE HALF IS BUILT AND INERT, AND THE REASON IS A THIRD INSTANCE OF THE SAME
> HOLE.** A departing foot never reaches `bootDir`'s free branch, because `onIceOf` answers
> *on the ice* for anything that is `pose.skate`, and `poseAt` carries `skate` from the LEFT
> key — so a foot that stops being the skating blade at key *b* is still claimed to be on the
> ice for every frame up to it. `onIceOf`'s own header warns about exactly this conflation:
> *"which reads 'is this the skating foot' and silently means 'is this foot on the ice at
> all'. Those were the same question until 30/08/2026 and are not any more."* They are still
> not, and this is where they come apart.
>
> Measured per frame, a blade CLAIMED on the ice is drawn:
>
> | move | per-key max | per-frame max | frames over the 3 cm bound |
> |---|---|---|---|
> | waltz | 2.00 cm | **29.99 cm** | 6 |
> | changeFootSpin | 0.00 cm | **15.99 cm** | 33 |
>
> Thirty centimetres in the air, with the tracing built from it, and every keyframe passing at
> nought to two. That is the same keyframe blindness as the clearance assertion and the free
> boot's angle before it, for the third time in one file, and it is a bigger fault than the
> one this section set out to fix. **Not fixed here.** Fixing it means deciding whether
> `skate` names the blade the tracing is built from or the blade that is touching, and those
> stopped being the same question when a pose could hold two blades. That is its own piece of
> work and wants its own specification.

**What did change**: nineteen frames, in the two moves the arrival exists in, and nothing
anywhere else. `CLEAR` now lives in `rig-math.js` and `tools/twofoot.mjs` imports it. The
blend is nine lines in `bootDir` and the planted construction was lifted into a local function
so there is one expression of it with two callers.

**What is still not asserted.** `twofoot.mjs`'s clearance assertion is still per keyframe. The
specification says it should go per frame with the arrival excusing the crossing and holding
it to a monotonic descent, and that is the obvious next step — but it should wait for the
`skate` question above, because the same file's assertion 1 is per keyframe for the same
reason and both want settling together rather than one at a time.

### What it does not buy

It is not the whole of the handover. `twoFoot`, `pushOff` and `toePick` are held as positions
for **two** reasons, and this is one of them: the other is that the rig carries one reference
blade and drawing what those do means handing it over mid-move. Two blades exist since
30/08/2026 and the arrival would exist after this, but the reference handover is a third thing
and is not specified here. The slip step draws because nothing in it hands over.

## What `skate` names — specified and built 20/09/2026

The section above ends on a question it could not answer: *does `skate` name the blade the
tracing is built from, or the blade that is touching?* This is that question, settled before
anything is built, on the roll's and the pick's and the arrival's precedent.

### `skate` is doing three jobs, and two of them are the same job

Read off the call sites rather than off the name:

- **The rig's spatial root.** `body-frame.js` places the hip at `at(-sk.t, -sk.n)` and every
  joint at `rel(q)`, which multiplies out to `p + (q − sk)`. The reference foot is pinned to
  the path point and the whole skater hangs off it.
- **The blade the tracing is built from.** `pose.edge` and `pose.dir` attach to it, `edgeOf`
  derives the second foot's edge from it through `secondFoot`, `refFirst` sorts it first, and
  the ice mark is drawn wherever it goes.
- **A claim that the foot is touching the ice.** `onIceOf` returns `'blade'` for it whatever
  the foot says, and returns it whatever the foot's height.

The first two are one job under two descriptions, and that job is **continuous by
construction**: the picture is measured from the reference, so the reference exists at every
frame of the move or the skater has nowhere to hang. The third is not continuous at all. A
blade is on the ice and then it is not, and the moment it stops is the interesting one.

### The decision

**`skate` names the blade the tracing is built from.** It is the rig's frame of reference and
it says nothing whatever about contact. Whether a foot is touching is `onIce`, declared on the
foot, for every foot — the reference one included.

It cannot be the other way round. A name that has to be continuous cannot mean a thing that is
not. Reading `skate` as *the blade that is touching* would require it to change in the middle
of a span, and at that instant the hip has nothing to hang from, `edge` and `dir` have no blade
to attach to, and the tracing is being drawn from a foot the pose has just stopped naming.

This also finishes a sentence started on 19/09/2026 and left half-written. `onIceOf`'s own
comment says the contact *"is declared on the foot for every other foot in this model; now it
is for this one as well, and 'blade' is what it means when nothing is said."* That let the
reference blade say **which** contact it has. It did not let it say it has **none**, because
the fallback was unconditional. A default that cannot be overridden is not a default; it is
the answer with a comment about defaults above it.

### Where it goes wrong, and it is three spans in the whole guide

Every span in `MOVES` where a foot's contact differs between the two keys bounding it:

| move | span | what happens | reference |
|---|---|---|---|
| waltz | 0.30 → 0.32 | L departs, z 2 → 30 | L → air |
| waltz | 0.42 → 0.44 | R arrives, z 26 → 1 | air → R |
| changeFootSpin | 0.36 → 0.50 | L departs z 0 → 16, R arrives z 16 → 0 | L → R |

Three, and the pattern in them is the whole diagnosis: **the arrivals already work and the
departures do not, and the reason is that in every departure the departing foot is the
outgoing reference blade.** An arriving foot is not the reference at the key it starts from,
so `onIceOf` finds nothing on it and reports it free, and the arrival blend built on
20/09/2026 fires. A departing foot *is* the reference at the key it starts from, so `onIceOf`
answers `'blade'` for the whole span and `bootDir` returns from the planted branch before the
free one is reached. That is why half of a symmetrical piece of work was inert.

The cost, per frame, of a blade claimed on the ice:

| move | per-key max | per-frame max | frames over the 3 cm bound |
|---|---|---|---|
| waltz | 2.00 cm | **29.99 cm** | 6 |
| changeFootSpin | 0.00 cm | **15.99 cm** | 33 |

And the waltz's authoring says it out loud: the key named *"Blade leaves the ice"* is the one
at 0.32, with the blade thirty centimetres above it. The blade left at 0.30.

### A contact holds across a span only where both keys declare it

The second half of the answer, and it is not about `skate` at all.

`lpP` carries `onIce` from the left key, alongside `edge` and `dir`, under a comment calling
all three states rather than quantities. `edge` and `dir` are states and the comment is right
about them: they are labels that stay true while the foot moves. **`onIce` is not that kind of
thing.** It is a geometric claim — this foot is within `ON_ICE` of the ice — and a span is the
pose interpolating away from it. A claim the motion falsifies cannot be carried through the
motion.

So:

> At the instant of a key, the key's declaration is the truth. **Between two keys, a contact
> holds only if both ends declare it.** A foot with a contact at the left key and not at the
> right is departing; at the right and not the left, arriving; and for the interior of that
> span it is not on the ice.

That is `arrivalOf` exactly, written on 20/09/2026 to describe a state. It now decides one as
well, which is the second time in this file that a derived answer turned out to be load-bearing
somewhere nobody had looked.

### The shape: one predicate, one interpolation, no data change

`onIceOf` reads the foot's own declaration first — **including a declared absence** — and falls
back to the reference default only where the foot says nothing:

```js
const f = pose[which];
if (f && 'onIce' in f) return f.onIce;
return pose.skate && which === pose.skate ? 'blade' : null;
```

and `poseAt` writes `onIce: null` onto a foot that `arrivalOf` reports arriving or departing,
for `u > 0`.

`u > 0` and not `u >= 0` because the declaration is the truth at the instant of the key. A
blade leaves the ice at a moment, and the last key that declares the contact is that moment.

**No authored data moves.** Nothing in `moves.js` writes `onIce: null`, so every keyframe
answers exactly as it does today and every checker that reads `move.keys` — `blade`, `shin`,
`reach`, `turnout`, `twofoot`'s first three, `ankle`, `underice`'s declaration pass — is
untouched by construction. Everything that reads `poseAt` gets the honest answer without being
changed: the renderer, `lean`, `freefoot`, `continuity`, `twofoot`'s assertion 4. One change in
one function and the callers follow, which is the roll's central claim being leaned on for the
third time.

The alternative was to delete the `|| 'blade'` fallback and write `onIce: 'blade'` into the 85
keys that rely on it. Rejected: at a key the fallback is not a guess but a derivation, and
`twofoot`'s assertion 1 is the thing that holds it honest. Writing it out 85 times would be a
second expression of a fact the model already has, which is this repository's named recurring
failure. The fallback was never wrong at a key. It was wrong at a frame, because `skate`
carries and the contact it implies expires.

### What it changes in the picture

**One: the departure half of `bootDir`'s blend stops being inert.** It was built on 20/09/2026
and never once reached. A departing boot now blends from the planted construction it is leaving
toward the free one over the last `CLEAR` centimetres, which is the arrival run backwards and is
the same nine lines.

**Two: the ice mark stops where the blade does.** `stateOf` in `body-frame.js` asks `!po.skate`
and calls that airborne, which reads *"is there a reference"* and is used to mean *"is anything
on the ice"* — the same conflation one layer up. It becomes: the mark is drawn where the
reference blade has a contact. On the waltz the mark today runs six frames past the takeoff.

**Three: the change of foot loses its mark for thirty-three frames, and that is a gap rather
than a fix.** The authoring has L down at 0.36 and R down at 0.50 and nothing in between, so
the model's honest answer is that it does not know what is touching during the transfer. Today
it draws a mark anyway, from a blade sixteen centimetres up. The repair is an authoring one — a
transfer key with both blades down — and it is not made here, because the two blades in a
change of foot sit about four centimetres apart and `twofoot`'s assertion 3 floors two blades
down at five. That floor was read off two blades *a leg's width apart*; a spin's change of foot
is the first pose in the guide that is neither that nor a mistake, and ruling on it is its own
piece of work.

### `twofoot.mjs`'s assertions 1 and 2, per frame

They go per frame together, because they are per keyframe for the same reason, and settling
one would open the same argument twice. Per frame they are three claims, not two:

1. **A foot the model claims is on the ice is on the ice** — within `ON_ICE`. Today's
   assertion 2, first half, at every frame rather than at every key.
2. **A foot the model claims is free is clear of the ice** — at least `CLEAR` — *unless* it is
   arriving or departing, and then it must cross the band **monotonically** and actually reach
   or leave its contact. The window is a claim too: an arrival that dips and comes back up is
   not an arrival, and neither is one that never lands.
3. **The tracing is only drawn from a blade that is on it.** Assertion 1's replacement.
   `skate` naming a foot that is on the ice was true per key and is not per frame, and the
   claim worth keeping is not about `skate` at all: it is that the renderer's ice mark and the
   reference blade's contact agree, frame by frame.

Assertion 1's second half — *an airborne pose has nothing touching* — stays, and is now
per frame and stronger: it was `!skate ⇒ nothing down`, which per frame would be false on the
takeoff, and becomes *no foot claims a contact that both bounding keys do not declare*.

### What it should buy, stated so it can be wrong

- `probe-skate-z.mjs` reports **no move at all**: nothing claimed on the ice above 3 cm at any
  frame, in place of 29.99 and 15.99.
- `boot.mjs` still reports the worst drawn-roll disagreement as **0.00°**, with no renderer
  change. Third time that claim is cashed.
- The frames that move are the **departing feet inside the last `CLEAR` centimetres, and
  nothing else**. Everything outside the three spans hashes identical.
- `continuity.mjs` stays green. Its `landing` flag, which loosens the orientation bound where
  the contact state flips, now fires at the departure key instead of at the far end of the
  span — so the step it has to absorb moves, and it should be **smaller**, not larger.
- `freefoot.mjs` may need departing feet excluding from its 60° free-boot limit, the way
  arriving feet turned out not to. **Unknown**, and the first thing to measure. The arrival
  needed no exclusion, which is weak evidence and not an argument.
- `underice.mjs` stays at its one run of 0.027 cm or improves. A departing boot blended toward
  the contact it is leaving sits on the ice rather than through it, which is the arrival's
  claim in reverse.

### What building it cost

Four of the six held. Two were wrong, and one of the two was wrong about where the
assertion belonged rather than about the model.

| prediction | outcome |
|---|---|
| nothing claimed on the ice above 3 cm at any frame | **held**: `probe-skate-z.mjs` reports no move at all |
| `boot.mjs` still 0.00°, no renderer change | **held**, across 26,952 glyphs. Third time |
| only the departing feet inside the last `CLEAR` centimetres move | **wrong**: the whole span moves, 11 of 441 hashed frames |
| `continuity.mjs` stays green, its `landing` flag moving | **held** |
| `freefoot.mjs` may need departing feet excluded | **not needed** — green without it, as the arrival was |
| `underice.mjs` stays at 0.027 cm or improves | **wrong**: it improved AND gained a run |

**The window was the wrong unit.** A departing foot does not merely blend over the last
`CLEAR` centimetres — it changes construction for the **whole span**, because `bootDir`
was returning from the planted branch before the free one and now does not. The blend
smooths the last five centimetres of that; above them the foot is simply drawn free,
which is the larger change and the correct one. What moved: eleven of 441 hashed frames,
all in the two moves that have a departure, and five of the eleven are the waltz's top
view at every sampled time after the takeoff, because the ice mark is cumulative and
ending it earlier changes every later frame of that view.

**`underice.mjs` gained a run, and that is the fix working rather than failing.** Until
this change a departing foot never reached that checker at all: it was claimed on the
ice, so it was not a free boot and nothing measured it against the ice line. Now the two
frames after the change of foot's left blade leaves sit 0.0370 cm below the line, for
precisely the reason the arriving frames sit 0.0273 cm below it — the interpolation out
of a key whose foot is at z 0. One fault, two directions. `arriving` became `handover`
and takes a list per move; `--break=deeper` had to move from zeroing the declared depths
to minus one, because the new entry's measured depth **is** nought and a mutation that
has quietly become a no-op on one of its cases is no longer testing it.

**Assertion 1's per-frame form was specified in the wrong place.** The specification said
it should be *the renderer's ice mark and the reference blade's contact agree, frame by
frame*. They agree by construction now, because `stateOf` derives the mark from
`onIceOf` — one expression, which is the whole point — so asserting it would be reading
the renderer's own `if` back to it. What went in instead is the claim that survives the
construction being correct: **a reference blade that is off the ice is one that is
changing hands.** That is the carry outliving the contact, stated so it cannot happen
again quietly, and `--break=carry` restores exactly the pre-20/09 reading to prove it
fires — thirty-nine failures, which is the six waltz frames and the thirty-three of the
change of foot.

**And the monotonic descent is not asserted, deliberately.** The specification asked for
it: an arrival that dips and comes back up is not an arrival, and neither is one that
never lands. Neither is expressible as a failure. `lpP` interpolates `z` linearly between
the two bounding keys, so a dip is arithmetically impossible, and *reaching the contact*
is assertion 2 holding at the contact key, which it already does per keyframe. Both would
have been second expressions of facts the model already carries, which is this file's
named recurring failure, and a checker that cannot fail is a decoration. The claim that
does carry weight, and is asserted, is that a foot under `CLEAR` outside a handover fails
— `--break=dip`, 3,192 failures.

**What the change of foot looks like now.** The mark has a thirty-three-frame gap through
the transfer, at the tightest part of the coil, and it reads as a step-over rather than as
a missing line. It is the honest picture: the authoring has the left blade down at 0.36
and the right at 0.50 and says nothing about what is touching in between, and drawing a
mark there was drawing it from a blade sixteen centimetres up. The repair is an authoring
one and is **not made here** — a transfer key with both blades down would put them about
four centimetres apart, and `twofoot.mjs`'s assertion 3 floors two blades down at five
because it was read off two blades a leg's width apart. A spin's change of foot is the
first pose in the guide that is neither that nor a mistake, and ruling on that floor is
its own piece of work.


### What it does not fix, and what measuring it turned up

**The rig's root jumps at every reference change, and no checker sees it.** Because every
drawn point is `p + (q − sk)`, changing which foot `sk` is moves the entire skater by the old
reference foot's offset, in one frame:

| move | seam | frames | the skater moves |
|---|---|---|---|
| waltz | L → air, t = 0.32 | 102 → 103 | 11.3 cm, **0.027** of the top view |
| waltz | air → R, t = 0.44 | 140 → 141 | 12.5 cm, **0.030** of the top view |
| changeFootSpin | L → R, t = 0.50 | 160 → 161 | 8.2 cm |

against a local rate of 0.003 to 0.006 of the view between neighbouring frames, and against
`continuity.mjs`'s `SLIDE` bound of 0.06. It is a jump of five to eight times the surrounding
motion sitting at half the bound, and it shows in the **top view only**, because the side and
rear views are drawn from the hip and cannot see the skater move across the ice.

This is the reference handover that the section above calls *a third thing*, and it is
untouched by any of the above: `skate` still carries, so the root behaves byte for byte as it
does today. Recorded here with its numbers so that the next person to reach for it has them,
and because a fault that is known and unasserted is a fault with a delay on it. **The bound
cannot simply be tightened onto it** — that turns the chain red on a fault nobody has fixed.
What `continuity.mjs` can do now, and does, is **report** the seams and their slide alongside
the branch flips it already reports, which is the treatment this file gives to anything that
is a design question rather than a defect.


## The reference handover — specified 20/09/2026

The section above found this and did not fix it: **the rig's root jumps at every reference
change.** This is that, specified before it is built, and the measuring turned the fix into
a different shape from the one that section predicted.

### The path is doing three jobs and the hip is the casualty

`buildPath` returns a curve. Three things read it, and they do not all want the same curve:

- **the tracing**, drawn on the ice — a blade's own mark, and each segment carries the
  `foot` that cut it;
- **the rig's root** — `body-frame.js` places the hip at `at(-sk.t, -sk.n)`, so every drawn
  point is `p + (q − sk)` and the reference blade is pinned to the curve;
- **the clock** — sample index maps to time, which is how a pose is paired with a place.

While one blade is down for the whole move these are one curve. The moment the move hands
over, they are not. `buildPath` chains segments tangent-continuously — its own comment says
so, and says it about the **radius** changing, which is the case it was written for. A
segment's `foot` can change at the same boundary, and chaining the position there is a claim
that the two blades were in the same place. They are 6 to 13 cm apart.

So the anchor is re-derived from a different foot and the whole skater moves by the distance
between them, in one frame. Measured per frame against the anchor the renderer actually
uses:

| move | worst hip step | where |
|---|---|---|
| waltz | **12.54 cm** | frame 141, the landing |
| changeFootSpin | **14.49 cm** | frame 161, the step-over |

against a waltz median of 1.78 cm and a spin median of nought, the spin being centred and
not travelling at all through its middle.

### And the anchor is meaningless while the blade is off the ice

`skate` names the blade the tracing is built from — settled earlier today — and the tracing
is only drawn where that blade has a contact. The root was never given the same condition.
Pinning a blade to the tracing while it is 30 cm in the air makes the hip inherit the free
foot's motion: the waltz's hip follows the take-off leg backwards, and the change of foot's
hip is carried round the spin's own coil for the forty-six frames when neither blade is
down, instead of staying on the spot a spin is defined by.

**That is the same conflation one layer further out**, and it is why the obvious repair —
displace the path at each reference change — leaves a residue. Tried and measured: it takes
the waltz from 12.54 to 5.31 cm and the change of foot's step-over from 14.49 to 2.90, and
the leftovers are the departing foot's own motion being read as the body's.

### The decision: hold, then displace

Three sentences.

> **While the reference blade has a contact, the hip is placed from it**, as it is today.
>
> **While nothing is on the ice, the offset is HELD at its last value** — the body carries
> on as it was. There is nothing cutting the ice to be measured from, and a held offset is
> the only honest thing to say about where the hip is: it keeps whatever relationship to the
> curve it had when the blade left.
>
> **When a blade takes the ice, the path is displaced so the hip does not move**:
> `p_new = p_old − A + B`, with `A` the held offset and `B` the new blade's, in the ice frame
> at that instant.

Holding is what makes the two cases come out right with one rule, and neither was designed
for. A jump's flight segment is a straight line, so a constant offset carries the hip
straight through the air. A spin's coil is a circle whose radius **equals** the centred
blade's lateral offset — that is `spin.mjs`'s definition of centred — so a constant offset
holds the hip on the centre point for the whole step-over. One rule, a jump and a spin, and
the spin's answer falls out of a fact the checkers already assert rather than being arranged.

It also removes half the seams outright. A blade leaving the ice is no longer a change of
anchor at all, because the offset it leaves behind is the offset that is held. Only a blade
**arriving** needs a displacement, and there is one of those per handover.

### Where it lives: the path point carries the hip

The renderer must not keep deriving the anchor from `pose.skate`, because the held offset is
a function of the history and a single pose does not have one. So `buildPath` computes it
and **each path point carries the offset**, and `body-frame.js` reads it from there.

That is the better shape for its own sake, and it is this repository's standing rule: the
renderer was re-deriving from the pose a fact the path already had to know, which is two
expressions of one thing. After it, `pose.skate` places nothing — it names the blade the
tracing is drawn from, which is all it was ever supposed to mean.

The displacement is keyed on the **pose's** contact, not on the segment's `foot` field.
Those agree on the clock but not always on the sample: `buildPath` rounds its sample count
per segment, so the change of foot's path boundary falls at index 162 while the pose's
reference changes at 161. Keying on the pose means the root cannot drift from what the
renderer draws, for the same reason `boot.mjs` takes its expected roll from `ankleOf`'s
output rather than from the renderer's expression of it.

### What it should buy, stated so it can be wrong

- **The waltz's worst hip step falls from 12.54 cm to 3.34**, and no frame of it exceeds
  three times the median of 1.78. The worst is then frame 88, which is not a seam.
- **The change of foot's step-over falls from 14.49 cm to under 2**, and the hip is
  stationary through the whole of it, which is what a spin is.
- **The seam count halves**: one displacement per move, at the arrival, not two.
- **No drawn tracing gains a visible step**, because every displacement falls inside a
  stretch where no mark is drawn — the waltz's airborne gap and the change of foot's
  thirty-three-frame contact gap. That is only true since this morning; before the contact
  work a mark was drawn across both, and this change would have put a step in it.
- `continuity.mjs`'s reference-seam report **empties**.
- `spin.mjs`, `lean.mjs`, `tracing.mjs`, `freefoot.mjs`, `boot.mjs` are **unaffected**: every
  one of them measures the body against itself or a blade against its own lobe, and none
  cares where on the ice the whole thing sits.
- `framing.mjs` **may go red**. The tracing's end moves 9.8 cm on the waltz and 8.0 on the
  change of foot, so the panel's extent changes. **Unknown**, and the first thing to measure.
- The frames that move are **every frame of those two moves after their first handover, in
  the top view only** — the side and rear are drawn from the hip and cannot see the skater
  move across the ice.

### What it does not fix

**A spin's hip goes from stationary to full speed between two frames**, and it is a
different fault with the same smell. At the exit the segment's radius jumps from the spin's
to the run-out's, and the hip's speed is made of the curvature when the blade's offset
equals the radius — so the change of foot reads nought cm per frame at frame 302 and
**10.46 at 303**, and again 7.5 to 3.9 across the entrance's two radii at frame 41.
`buildPath`'s comment declares tangent continuity across a radius change and calls the
curvature step intended, which it is for the tracing; nobody asked what it does to the body
hanging off it. Its own piece of work.

**And the change of foot's transfer key is not blocked by what the last handoff said it
was.** That handoff claimed `twofoot.mjs`'s 5 cm floor on two blades down was in the way.
Measured: the closest two blades ever come in this guide is **13.4 cm**, on `twoFoot`, so
the floor has never been near a real pose and is not the obstacle. The obstacle is that the
step-over is authored with **no moment when both feet are down at all** — the left rises
from z 0 while the right descends to it, they cross at a horizontal gap of 1.6 cm with the
left 11.7 cm in the air, and there is no instant where both are on the ice. Authoring a
transfer key means re-authoring the step-over so the weight passes through two feet, which
is a question about how a change of foot is actually skated and wants a coach, not a floor.


## A step is three different things, and the guide now means one of them — 20/09/2026

`kind: 'step'` opened the same day the flat went in, with the slip step in it and nine
`notCovered` lines pointing nowhere. Filling it needed one decision — what a step IS — and
the documents turn out to answer it three different ways.

### British Ice Skating define it twice, incompatibly

Their *Definition of Steps, Turns & Movements* opens with the taxonomic sense: *"STEP — the
visible tracing on the ice that is executed on one foot. It may consist of an edge, change of
edge, a turn on one foot such as a Three-Turn or Counter or a flat."* Under that, a step is
the tracing BETWEEN changes of foot, every edge and every one-foot turn in this guide is
already one, and the thing the nine lines describe is not a step at all.

The same document then names four elements in the other sense, by **where the free foot is put
down**: slip step, toe step, crossed step in front, crossed step behind. That is the sense the
slip step already sits in.

And this repository had a third: `STEPS` in `skating.js` is the mohawk and the choctaw, which
BIS call *a turn from one foot to the other*. Three meanings of one word, which is this file's
oldest recorded failure shape wearing a different hat.

### The cut is geometric, not lexical

The tempting answer was to make `kind: 'step'` BIS's placement family and move the crossed
step behind and the slip chassé into it. **It is wrong, and the reason is worth keeping.** The
same definitions list names the cross roll, the simple/open chassé and the slip/slide chassé
in exactly the same register, without the word. "Crossed step behind" is one name, not
*crossed* plus *step*. Cutting the taxonomy on which BIS names happen to contain an English
word would be building a kind out of vocabulary rather than out of movement, and it would
re-slug pages that already ship in order to do it.

So the sentence `element-groups.js` already carried stands, and it is now load-bearing rather
than descriptive: **a transition is how you get from one edge to the next; a step is a way of
moving that changes neither.** The slip step changes neither foot nor edge. A step wide and a
push back change both — they are transitions.

`kind: 'step'` keeps one member and a shape: the spread eagle and the Ina Bauer are the same
kind of claim, and two blades made both reachable.

### The nine lines were one restriction's complement

`gen-derived.mjs` restricts the crossover, the chassé and the cross roll to **outside** entries,
with the note that this is what the elements are and not a modelling limitation. True of those
three, and it left the inside half of both flag sets generated by nobody. The syllabus lives in
that half.

Read off the sequences rather than chosen, and all nine agree without exception: **a step wide
is inside edge to inside edge**, which is the cross roll's flag set, and **a push back is
inside to outside**, which is the crossover's. No new flag, no new join, no model change at
all — six generated pages, and **0 of 441 hashed frames moved**, which is what a content
change should cost.

The names are BIS's, from the exercise sheets rather than the definitions document, and that
distinction is the whole argument about whether they may exist. Session 19 declined to invent
an element on exactly that ground for Skills 8 section 2's *push, or touch down*, and that
line still holds: BIS describe it in one exercise and name it nowhere. *Step wide* is written
nine times across six of the eight tests, in the same slot in the numbered notation where
*cross roll*, *3-turn* and *XF-* appear. A name in service is not a description.

**A push back draws what a backward stroke draws**, because it is the same push. It is a
transition rather than a basic for the reason `forward-stroking` is a basic while `lfo-chasse`
is a transition though a chassé contains a push: a basic is how you push at all, a transition
is which edge you leave and which you arrive on. The pages say so rather than inventing a
difference, which is the answer this guide already gives for a crossover against a chassé.

### What is still a gap, and why it is a better gap

Two lines survive, narrowed rather than deleted. Skills 2 exercise 3 steps from a **backward**
outside edge onto a **forward** outside one, changing foot and the direction the skater faces
with no turn in it, and BIS's definitions name no step that arrives facing the other way.
Skills 8 section 2 keeps its push or touch down. Both now say what is missing instead of
saying that steps in general have nowhere to point.

## A flat is the absence of an edge — 20/09/2026

The last of the three things *Two blades* said this rig could not hold. Two blades went in
on 30/08, the boot's roll this afternoon, and this is the third.

### It was already half built, and the halves disagreed

`PathThumb.astro`, which draws the `trace` tracings under the basics, has had this in it
since it was written: *"A straight segment has no edge to name and both blades take the
neutral ink."* So `two-foot-glide` has been drawing an honest flat for weeks. Nothing else
in the repository knew — which is one fact with two expressions and one of them wrong, this
file's own recurring failure, found again.

`edgeCol` was the other expression: `e === 'O' ? out : in`, a two-way test over a three-way
question, which answers "inside edge" for anything that is not an outside one. Four call
sites in the body-frame rig, and it would have coloured a flat as an inside edge in all of
them. The same shape as the featured filter that absorbed twenty-four twizzles.

**The derived tier was never at risk**, and that is worth recording because it narrows the
job. `EdgeDiagram` is driven by an `entry` state through `exitState`, which only ever
produces O and I, so its ternaries cannot meet a flat. The gap was the rig.

### The absence of an edge, not a third letter

`edge: null`, and `lobeSense` returns nought for anything that is not O or I — so a flat
comes out straight from `buildPath`'s own `-lobeSense/R`, with no branch anywhere. Three
reasons it is an absence:

- **BIS name the slip step with no edge letter at all**, which is the sport's own answer.
- `label` is foot-then-direction-then-edge, so a third letter would have spelled a left
  forward flat **LFF**.
- `PathThumb` had already reasoned it that way, and agreeing with the half that was right
  costs nothing.

`secondFoot` follows: both blades of a flat are flat, because the derivation reads a shared
lobe and there is no lobe to share.

### `lean.mjs` holds a flat rather than excusing it

Both its routes are sign tests — the blade on the far side of the hip from the lobe's
centre, the body fallen over the biting edge — and a flat has neither sign. The instinct is
to skip it, and that is the hole this file's own comments keep warning about.

**What is true instead is the opposite claim, and it is stronger than either route: a skater
on a flat is not leaning.** So the blades must sit UNDER the skater rather than out from
under them, measured as the centroid of the flat blades against the hip in the skater's own
lateral direction — one rule covering a single flat blade and a pair straddling the hip,
with no special case for either.

**`BOOT_HALF_W` is the bound and it is not a tolerance.** It is read off the boot glyph's
footprint and it is the edge of the sole: past it the hip is outside the foot it is standing
on, which is not a lean, it is a fall. Broken on purpose: give every flat an edge's lean and
it reports.

### And no edge dot

The dot marks which side of the blade is biting and a flat bites neither. That cannot be
read off the contact kind — a flat is an ordinary blade, on the ice and gripping — so
`boot.mjs` reads the edge letter from the pose instead, and asserts both ways: a blade on an
edge must carry a dot, a blade on a flat must not. BIS define a flat as the **double tracing
of a skate running straight**, both edges cutting, so the fact that both are down lives in
the tracing's two lines, which is where it already did.

### What it bought

**The slip step**, and BIS's definition is geometry four times over: *"A step skated in a
straight line with the blades of both skates being held flat on the ice. The weight is over
the skating leg that may be well bent or straight while the free foot slides forward on the
ice to full extension."* A straight line, both blades flat, the weight on the skating leg,
the free foot sliding forward. None of those claims is ours.

**It is the first two-foot MOVEMENT this rig has drawn.** `twoFoot`, `pushOff` and `toePick`
are held positions for one reason — the rig carries one reference blade and drawing what
they do means handing it over mid-move. Nothing here hands over: the weight stays on the
skating leg by BIS's own sentence, the free foot is on the ice throughout, both blades stay
flat and no contact changes kind.

Inert where it should be: **0 of 420 hashed frames** moved across the twenty moves that
existed before it.

### The tripwire that had already fired

Found on the way, and it is the same lesson one page along. `index.astro` kept a hand-written
list of the kinds it can name and, for anything else, printed *"N of them in a category this
page has not been taught to name"* — a tripwire wired into the PAGE rather than into the
build. The spins shipped on 19/09/2026 and **the live front page has been saying "5 of them
in a category this page has not been taught to name" ever since.** Visible, shipped, read by
nobody.

`element-groups.js` had already settled this argument for its own ordering — a section with
no rank throws rather than sorting quietly to the bottom. So the front page now throws too. A
notice nobody reads is a decoration.

## The pick is a third kind of contact — specified and built 30/08/2026

Four of the seven jumps are toe-assisted, the jump pages say out loud that the pick is what
separates a flip from a Salchow and a toe loop from a loop, and the rig could not draw it.
It can now. What follows is the specification as it was written, marked up with what
building it actually cost — the list of files was right, two of its rows were wrong, and it
was silent about the two things that turned out to decide the shape of the pose.

**`pick: true` is gone.** It was a KEYFRAME flag, and `blade.mjs` read it as "exempt every
on-ice blade in this frame from the ±3.5° limit" — which, in the only pose that would ever
set it, exempts the foot on the edge as well as the foot on the teeth. It had never been set
on any keyframe, so nothing was broken; it was a description waiting to be believed.

**The shape is `onIce: 'pick'`,** the same field two blades added, with a third value. A
picked foot is not a blade and it is not free: it is on the ice, carrying weight, with no
edge, no lean claim and a boot pitched far past what a blade allows.

**Two functions already handled it and needed no change**, which is the two-blades work
paying forward: `onIceOf` returns whatever the foot declares, and `bladesDown` filters for
`'blade'` and so excludes a picked foot correctly. `contactsDown` joins them — every foot
touching the ice by any means — and is what the old `=== 'blade'` tests became wherever they
meant *on the ice*. Those were enumerable, and the enumeration held:

| File | What it did | What the pick needed |
|---|---|---|
| `rig-math.js` `edgeOf` | returned the reference blade's edge for any non-blade foot | a pick has no edge; returns null |
| `rig-math.js` `bootDir` | branched skating / free | **a third RULE, not a third branch of the second** — see below |
| `rig-math.js` | — | `contactsDown(pose)`, every foot touching by any means |
| `moves.js` `ON()` | hardcoded `onIce:'blade'` | `PICK()` beside it; `pick:true` removed |
| `body-frame.js` ×2 | `down`/`skating` = `=== 'blade'` | **three decisions wearing one name** — see below |
| `blade.mjs` | keyframe-level `!k.pick` | per foot, and asserted from BOTH sides |
| `freefoot.mjs` | skipped `=== 'blade'` | skips any contact — and gained the assertion that decides the pose |
| `boot.mjs` | every edge dot is on a blade on the ice | no dot on a pick; the roll limit follows the weight instead |
| `continuity.mjs` ×3 | `down` = `=== 'blade'`, incl. landing detection | a pick going in changes the rule exactly as a landing does |
| `twofoot.mjs` | every free foot is clear of the ice | a picked foot sits at z 0 and is not free |
| `lean.mjs` | iterates `bladesDown` | correct already — a pick makes no lean claim |
| `shin.mjs` | iterates `bladesDown` | **correct already, and tried the other way first** — see below |

Two things the specification did not say, and one it said wrongly.

**`bootDir` has three rules, and the third is the reach.** "Planted, pitched past
`MAX_BLADE_PITCH`" reads as the skating branch with a bigger number, and it is not. A blade
takes its direction from the tracing because a blade on the ice can only lie along its own
line. **A pick is not travelling** — it is a jab; the teeth go in and stay in one spot while
the skater goes past — so it has no line, and what points the toe is the REACH: the
horizontal direction from the hip to the foot. Using the tracing was the tempting shortcut,
the formula being already written above it, and it points the toe *at the skater* on the one
move that needs it, because a toe loop reaches back on a backward edge and back there is +t
while the tracing runs −t.

`bootDir` also stopped taking `skating` as an argument. Seven callers each computed
`onIceOf(pose, which) === 'blade'` and handed the answer in: one derivation in seven places,
and a boolean free to disagree with the pose it came from, which is the shape this file's own
opening comment warns about. It reads the pose now.

**`skating` in the renderer was three decisions under one name.** Weight, edge colour and the
edge dot moved together for as long as being on the ice meant being on a blade. A picked foot
is bearing load — it must not draw pale, in free weight, or vanish with the free-foot toggle
— and it has no biting edge, so it must take neither a colour nor a dot. `planted` decides
the first, `bladed` the other two, and the four glyph functions take the contact rather than
a boolean.

**A picked foot's SHIN lean cannot be checked, and its ANKLE angle can.** `shin.mjs` was
extended to picks and then put back. The lean it measures is the shin against a boot up-axis
built from world up, which is what "lean inside the boot" means while the boot is near flat;
a picked boot is pitched 80° and there that vector stops being the boot's axis at all. Use
the boot's real up-axis instead and it comes from the knee, one iteration from the shin being
measured, and the angle collapses towards an identity — the same trap as a free foot's.

What a pick genuinely constrains is the ankle, and it is `ANKLE_MAX` read backwards. A free
foot authors its ankle angle and the boot's direction follows; **a picked foot authors the
boot's direction and the ankle angle follows**, as whatever the shin and that direction leave
between them. Same boot, same allowance, so the same limit — and this is the first time that
constant has bitten on a pose rather than on a number somebody typed. Measured over the
space by `npm run ankle`, and it is three bands rather than a slope: **at a hip of 62 cm and
below the boot reaches 89°**, standing on end; **between 64 and 76 there is no legal pick at
all**, at any pitch or reach; **at 78 and above only 4 to 12° survives**, barely past the
3.5° a blade already has — a scuff rather than a jab. **The only way to tilt the boot further with the toe on the
ice is to tilt the whole leg, and the only way to do that is to sink** — which is what a
skater does before they pick. Nobody authored that; the constraint did.

**And a pick is the first contact in this model that is fixed to the ice.** Every foot is
authored relative to the hip, and only the reference blade is pinned to the path. A gliding
blade travels with the skater, so this has never cost anything; a pick stays where it was
put, and held through a real span of travel its hip-relative position would have to sweep
backwards by however far the hip went. `toePick` is therefore a HELD position rather than a
movement, `twoFoot` fashion. Expressing a contact that stays put needs an anchor the rig has
not got, and that is a bigger change than this one was.

**What it buys, in order:** the difference between a flip and a Salchow and between a toe
loop and a loop, which is the question a skater actually asks and which four jump pages name
and could not show; the toe-assisted hop into the Skills 3 spirals, the last item on the BIS
gap list; and the Lutz, whose whole identity is an outside edge plus a pick. Each of those is
still a jump rig away — the contact exists, the elements do not.

**What it does not buy:** the lunge. That needs a boot rolled onto its side, which is a
missing axis rather than a missing contact type.

## The ankle sits behind the BOOT, not behind the contact — 30/08/2026

Martyn, on the toe pick's side view: *the leg isn't sitting in the boot*. It was not,
and it never had been on any pitched blade either — by 2 cm, where nobody could see it.

`ankleOf` places the ankle `ANKLE_BACK` behind and `ANKLE_UP` above the foot marker.
Both constants were measured from **the blade's centre**; the marker is **the contact**.
Those are the same point only on a blade at exactly zero pitch. Everywhere else they
differ by `ROCKER × sin(pitch)` — and on a pick they differ by the whole length of the
front of the boot, because the teeth are 17.8 cm forward of the blade's centre.

The renderer already knew. `bootSide` shifts the glyph back by that distance so that
whatever is touching sits on the ice; nothing shifted the ankle to match, so the leg was
drawn ending over the contact while the boot was drawn hanging off behind it. On a pick
the leg came out of the toe.

**One derivation, in the model.** `PICK_ALONG` moved out of `body-frame.js` into
`rig-math.js` — how far forward of the ankle the teeth go in is a fact about a boot, not
a glyph coordinate — and `contactAlongOf(pose, which, bd)` is now the single answer to
*how far along the boot is the contact*: the rocker for a blade, the teeth for a pick,
nothing for a foot in the air. `ankleOf` steps back by it and the glyph shifts by it, so
they cannot part company again. `ankleOf` takes the pose and the side now rather than a
foot marker, the same correction `bootDir` took earlier the same day.

Measured across every foot in the file, the distance from the ankle to the cuff opening
was 5.1 to 17.5 cm and is now **5.1 cm everywhere** — which is what a fixed point inside
a rigid boot should be.

### What it moved, and the two poses it caught

96 of 210 rendered frames changed. The spiral, the checked spiral and the teapot are
authored at exactly zero pitch and are byte-identical — the same property that hid the
end-on roll collapse for four sessions.

**It broke two checkers, and both were the fault arriving rather than a new one.** All
three spins are authored at 2.2° of pitch, spinning on the front of the blade, which puts
the contact 8.2 cm forward of centre — so their ankles had been 8.2 cm too far forward
since they were written. Corrected, six shins passed 28° (`shin.mjs`) and the sit spin's
skating thigh rose above parallel in 66 of 321 frames (`spin.mjs`, against the ISU
definition).

### Re-authored 19/09/2026, and the lever is not the same one twice

`shin.mjs` says *the foot is in the wrong place under the hip*, and `twoFoot`'s own note says
the opposite — *raising the hip fixes it; moving the feet does not*. **Both are true, of
different poses**, and the three spins happen to contain one of each.

**A near-extended leg takes hip height.** `uprightSpin` and `camelSpin` both hold the skating
foot at `t: 0`, directly under the hip, and there is a reason: the spin axis sits square off
the blade at exactly `radius`, so a foot level with the hip fore-and-aft is what puts **the
hip exactly on the axis** — `spin.mjs` reports the hip sweeping 0 cm per revolution, which is
the whole of what spinning on the spot means. Moving those feet to fix the lean would have
traded that away. Both were raised 2 cm instead: upright 93/95/96 → 95/97/98, camel 93 → 95
throughout, the authored rise preserved, and the hip still sweeps 0.

**A folded leg takes the foot, because hip height is no lever at all there.** Swept over the
sit spin's held key, raising the hip moved the lean by **0.6° across 4 cm** and at the last
key moved it the *wrong way* — 30.5 up to 31.5 — because with the hip already at 40 cm and
the foot 34 cm in front, lifting the hip does not extend the leg. The foot does: `sitSpin`'s
skating foot travels out to `-38` and `-40`, six centimetres further than before, which is the
same "the blade travels out from under the hip as the hip drops" that already shapes the
teapot and `toePick`, intensified by 8.2 cm of contact offset.

`npm run check` is green end to end. The sit spin's hip now sweeps 40 cm per revolution rather
than 34 — reported by `spin.mjs` and not asserted, because where a skater actually balances is
a question about mass and this rig has markers and no mass.

**The general form**, and this is the second time in two sessions: when two pieces of
code hold the same distance, one of them has an origin the other does not. `bootSide`
pivoted about the contact; `ankleOf` measured from the centre; nothing compared them,
because until a pick arrived the difference was small enough to look like the drawing.

## A blade on the ice may point somewhere other than where it is going — 19/09/2026

`bootDir`'s planted branch took a boot's heading from the tracing: nought or a hundred and
eighty, nothing in between, no per-foot yaw anywhere in the model. Correct for an edge, and
an edge is all the rig had ever been asked to hold. **Wrong for a push**, which is the first
thing every syllabus in the sport teaches and which nine BIS exercises name in `notCovered`
because there was nothing to link to.

`yaw` on a foot, in degrees, **+ anticlockwise seen from above** — the convention `hipYaw`
and `shYaw` already use, so there is one rotation sense in the file rather than two.
Defaults to zero, so every pose written before today draws byte-identically. Read only in
the planted branch: a pick already takes its direction from the reach, having had to solve
the same problem first.

### The limit is the hip, and the scarce direction is inward

`pitch` has `MAX_BLADE_PITCH`, `point` has `ANKLE_MAX`, and an unasserted number in this
file is a description waiting to be believed. What limits a yaw is not the tracing but how
far a hip will turn over a planted foot.

**Weight-bearing, and that is the whole point.** The textbook ranges — internal 40–45°,
external 44–52° — are measured lying down with the leg free. A skater is standing on the
foot in question. Kadlec et al. measured 135 adults rotating about a planted foot with the
pelvis held square and got **external 37–41° but internal only 20–23°**, roughly half the
free-leg figure. So `HIP_OUT` is 40 and `HIP_IN` is 20, and the allowance is asymmetric.

That asymmetry is not a detail. **A snowplough turns both toes IN**, which is the expensive
way round, and **a hockey stop asks for ninety degrees of it**. Neither is available from a
square pelvis, and the honest answer in both cases is that the skater turns the pelvis and
widens the stance rather than twisting the feet off it — which is what they are taught.

**A rig limit is not an anatomy limit, and the hockey stop is where that matters.**
Martyn's challenge: a hockey stop is usually thought of as a hockey-skate movement, so is
the figure boot's allowance the right one, and is the model precise enough to be making
this claim at all? The boot is the right boot — Learn to Skate USA teaches it at Basic 5,
in figure skates, and the hockey-skate literature already in this file puts the gain at 5
to 9 degrees of ankle, which is not the thirty the pose is short by. **The second half of
the question is the one that lands.** The sweep finds no legal hockey stop, and what it has
actually found is that THIS RIG cannot hold one: a hockey stop is made of the shoulders and
hips counter-rotating against each other with the upper body leaning away from the travel,
and the model has one hip yaw, a knee that faces wherever that yaw points, and no spine. So
the reason recorded in `tools/drawn.mjs` says the rig, not the skater.

`tools/turnout.mjs` asserts it per pose, blades only. Reading a boot's heading against the
pelvis is only hip rotation while the leg is somewhere near under the skater: extend it
behind and a toe pointing away from the body is hip EXTENSION with a pointed ankle, and the
plan angle reads as 154° of rotation that nobody is doing — `toePick`'s pick does exactly
that. Same failure shape as `shin.mjs` measuring lean against world up at eighty degrees.

### A yaw on the reference blade is refused

The reference blade is pinned to the path and **the path is its tracing**, so turning it off
its own line is a claim that it skids. A skid leaves a scrape, the guide has no mark for one,
and `lean.mjs` would still be asserting that the blade leans over a biting edge it no longer
has. Saying so out loud beats drawing a tracing that is a lie.

### What a push costs, and nobody authored it

`pushOff` is the rig for **forward stroking**, and its pose was found by sweeping rather than
by eye, because three limits close on it at once:

| | asks for | has |
|---|---|---|
| turnout at the hip | 35° | `HIP_OUT` 40 |
| the boot's lean | 26° | `shin.mjs` 28 |
| the leg's length | 86 cm | `THIGH + SHIN` 86 |

The widest push the model permits is a hip at 94 cm with the feet **28 cm apart laterally**,
and every one of those three is within a couple of units of its limit. Push wider and the
leg runs out; sink to push harder and the shin passes what a stiff boot allows. **A push
cannot be both wide and sunk**, which is the third time this repository has met that fact —
it already shapes the teapot, the sit spin and `toePick`.

Worth a coach's eye, because the pose sits hard against `shin.mjs`'s 28°, and like
`ANKLE_MAX` that number is read off a study rather than off a skater.

### What the yaw does not unblock

Fourteen basics drew nothing. The yaw accounts for **five** of them — stroking both ways,
half-swizzle pumps both ways, and the drag. The rest are three separate pieces of work:

- **Six need the skid** — both snowplough stops, the T-stop, the hockey stop and both
  two-foot turns. A blade flat and sliding across itself, which needs a scrape to draw and a
  `lean.mjs` exemption paired with an assertion the other way.
- **Two need a second path** — the swizzles. Both blades run true along their own lines;
  the trouble is that those lines diverge and converge, and the rig has one path.
- **One needs an anchor** — the pivot, whose pick is fixed to the ice, which
  `docs/gaps-basics.md` and the pick's own notes already describe.

## A blade that is not travelling along itself — 19/09/2026

`onIce: 'skid'`, the fourth kind of contact. Steel on the ice and weight on it, like a
blade; not gripping, because it is turned across its own line and there is no groove to
follow sideways however hard the edge is pressed. A stop.

**A skid is not a flat blade, and this was written the other way round first.** The
reasoning was that a blade tipped onto an edge grips, so a skid must be flat. It is wrong:
a T-stop is unanimously on the trailing blade's **outside** edge, with the inside named by
coaches as the classic error, and a hockey stop has both blades tilted so their edges dig
in. What stops a blade gripping is direction, not tilt. Tilting only decides how much bite.

So **a skid carries its own edge**, authored rather than derived — the derivation for a
second blade assumes both are on one circle, and a skid is across the circle, not on it.
It takes an edge colour and an edge dot like any blade. What says it is a stop is the
contact mark: a bar the length of the runner instead of a ring round one point of the
rocker, because a skid touches along itself.

### Three questions about a foot, and the middle one was missing

`bladesDown` answered *on an edge* while being named for *a blade on the ice*. Those are
the same set only while every blade down is gripping, so it became:

| | |
|---|---|
| `edgesDown` | on an edge — a biting side, leans over it, curves |
| `runnersDown` | steel on the ice — an edge or a skid, but not teeth |
| `contactsDown` | touching by any means |

`lean.mjs` takes edges, `shin.mjs` and `turnout.mjs` take runners, `blade.mjs` takes
contacts. Same fault as the renderer's `skating`, which was three decisions under one name
until a pick arrived: **a name that answers a narrower question than it asks is a bug with
a delay on it.**

### The exemption, and where its other half went

`lean.mjs` does not judge a skid, and the honest reason is not "it has no edge" — it has
one. It has no part of either *claim*: the TRACK route puts the blade on the far side of
the hip from a lobe centre, and a skid is across the lobe; the BODY route says the skater
has fallen over the biting edge, and in a T-stop the weight stays on the **gliding** foot
while the trailing ankle turns out under almost none of it.

An exemption can only excuse a pose, so the assertion lives where the yaw does:
`turnout.mjs` holds a skid to `SKID_MIN_YAW` and requires it to name its edge. That is the
pick's assertion read back — a blade inside the rocker's pitch and a pick outside it; a
blade aligned with its travel and a skid not. It does **not** separate a skid from a push,
and is not trying to: a push is turned further and grips throughout, and whether a contact
slips or holds is friction, which a rig of markers cannot see. That is why the contact is
declared rather than derived.

### The knee was the missing term, and a T-stop is how it was found

A right angle between the feet is ninety degrees of turnout to find. Two weight-bearing
hips give forty each — eighty, and **not enough**: the model forbade a T-stop outright.

A straight knee barely rotates, because the condyles interlock at full extension. Bend it
and they disengage: roughly **18° external and 25° internal by about 35° of flexion**
(Freeman & Pinskerova, via WikiMSK). **Which is why a skater bends the knee to find
turnout, and why a dancer pliés to find it.** With the term in, `turnoutAllowed` is read
per foot off how bent that leg is, and the sweep finds a legal right-angled T-stop at a hip
of 94 with **both knees bent 35° and the pelvis opened 35° toward the trailing foot** —
which is what a T-stop looks like. None of that was authored.

It rises fast, too: 2 cm off full extension is already 25° of flexion and lifts turnout
from 40 to 53, because a two-bone chain near full reach is nearly locked.

### `lpP` dropped two fields, and the picture looked fine anyway

`yaw` and `edge` were added to a foot and left out of the pose interpolator. The push was
authored turned 35°, every checker that reads keyframes agreed, and **every frame the
renderer drew had it running true.** It was rendered, looked at, and passed — because two
boots in different places look different whether or not one of them is turned.

`lpP`'s own comment had named the failure in advance: *a field left out of this line would
make a second blade disappear everywhere except in the authoring*. The test that existed
was by side effect — assertion 4 needed `onIce`, so `onIce` was safe and nothing else was.
`twofoot.mjs` now asserts the round trip **by name**, over whatever a keyframe carries, so
a field added tomorrow and forgotten fails on the first run rather than in a picture nobody
can read. Broken on purpose: drop `yaw` from `lpP`, six feet reported.

**Render, don't reason — and then measure, don't eye.**

### The reference blade may skid, and then the tracing is a scrape

`onIceOf` hardcoded `'blade'` for the reference foot, which was true for as long as the
reference was the one gliding. **A two-foot snowplough and a hockey stop have both blades
sliding**, so the reference IS the skid. It declares its contact on the foot now, like
every other foot in the model, and `'blade'` is what silence means.

That forced the top-down tracing into a third state. A blade sliding across itself does not
leave a curve — its whole length sweeps sideways — so the mark is a **band**, and its width
is not authored and could not be: it is `BLADE_FRONT − BLADE_BACK` foreshortened by
`sin(yaw)`, zero on a true-running blade and the whole 26 cm at a right angle. Drawing a
thin line there would be the most confident lie this view could tell, because the tracing
is the one mark in the guide a reader is meant to take as a record of what the blade did.

`turnout.mjs`'s refusal changed shape with it: a yaw on the reference blade is refused
**unless the pose declares the skid**. The objection was never the yaw, it was claiming a
skid without saying so — and now saying so is what tells the renderer to smear the mark.

**A snowplough needs forty degrees of toe-in on each foot, and bent knees to buy them.**
Toes-in is the expensive direction; a weight-bearing hip gives twenty. A knee bent 31°
adds twenty-two more, so the widest plough the constants allow comes out sunk, with both
shins at the 28° limit at once. That is how a snowplough is taught, and nobody authored it.

The second blade's scrape is still not drawn, because no second blade's tracing ever is —
the same one-path limit that keeps the swizzles out.

## A spin is an arc — 30/08/2026

A spin was written up in this file as a second rig, rooted in the skater rather than the
track, on the grounds that `hipYaw` is measured from a direction of travel and a spin has
not got one. That is wrong twice over.

**A spin's blade has a direction of travel at every instant.** It is going round a small
circle, and the tangent to that circle rotates at the same rate the body does. So the
angle between the two — which is all `hipYaw` is — does not become undefined during a
spin. It becomes *constant*. What a spin has not got is net displacement, and the model
already had the machinery for that: British Ice Skating's twizzle disqualifier, "if the
travelling stops, it becomes a Solo Spin", is the advance going to zero, which
`tools/tracing.mjs` asserts from the twizzle side. A spin is the same statement read from
the other side.

**So a spin is a single arc of very small radius**, and it needs no new fields, no new
machinery and no second rig. Three of them — upright, sit and camel — hold every
assertion in `npm run check`, at radius 12 cm over three revolutions.

Two things fall out of it that are worth having before authoring one.

**The camel is not the spiral, and the sit is nearly the teapot.** The sit spin is the
teapot's fold on a rotating path, and its numbers are the teapot's give or take a sign.
The camel is *not* the spiral, which is what I assumed and the ISU's own definition
refuted: a camel needs the free knee above the hip, and the spiral holds its free leg at
69% of reach with the knee 24 cm below it. The two positions differ by exactly the thing
the handbook names.

**The path's centre of curvature is the spin axis, and it is not free.** The centre of a
circle is square to its tangent, so the axis sits at the blade's own `t`, offset laterally
by exactly `radius`. Placing the body relative to the blade therefore places it relative
to the axis, and the distance from any marker to that axis is the circle that marker
sweeps every revolution. `npm run check:spin` prints them:

| | hip | shoulders | free foot |
|---|---|---|---|
| upright | 0 | 0 | 17 cm |
| sit | 34 cm | 18 cm | 46 cm |
| camel | 0 | 48 cm | 96 cm |

Everywhere else in the rig the radius is the lobe and the blade's lateral offset is lean,
two free numbers. In a spin they jointly decide where the skater turns about. The camel's
free foot sweeping most of a metre is the whole look of the element; the sit's hip a third
of a metre behind the axis is not a choice — `shin.mjs` will not allow a deep sit with the
blade under the hip (84° of shin lean against the boot's 28), so the foot has to travel
forward as the hip drops, and the hips end up behind. In a real one the free leg reaching
the other way is what balances that.

**And this is where the model stops.** It can say where the axis is. It cannot say whether
that is where the skater balances, because balance is about mass and this rig has markers
and no mass. `tools/spin.mjs` prints the orbits and deliberately asserts nothing about
them.

## Three axes, three glyphs — 30/08/2026

The boot is a solid and the profile views draw it flat, so there has to be a rule for which
flat picture to draw. It used to be `prof >= endo`: is more of the boot in the view plane, or
pointing at the camera.

**That is a two-way test over a three-way question, and it never asked the one that mattered.**
`prof` adds the lateral and the vertical parts of the boot direction together, so a boot with
*no lateral component at all* still scored high on it through its vertical part, and got drawn
in profile — a picture of the boot from the one direction it was least being seen from.

Martyn found it on the waltz jump's rear view, twice. The free boot there points about 45°
down and 45° along the track. Of its three axes, the one most nearly aimed at the camera is
its **up axis**, in every frame: 0.72 to 0.76, against 0.64 to 0.68 for its length and 0.08 to
0.14 for its width. A boot whose up-axis faces you is a boot seen from above its own opening.

**It had a glyph all along.** `bootTop` is the plan view and the top-down view has drawn it
since the first session; the profile views simply could not reach for it. The rule is now the
honest one — the boot's axes are orthonormal, so their three camera components square to one,
and the picture to draw is the view down whichever axis is most aligned with the camera:

| the axis at the camera | the glyph | what you are looking at |
|---|---|---|
| its length | `bootEnd` | a cross-section: heel or toe toward you |
| its width | `bootSide` | a profile |
| its up, cuff toward you | `bootTop` | a plan, into the boot |
| its up, sole toward you | `bootSole` | the underside: the blade, whole |

**The fourth glyph is not a mirrored third.** Martyn's question, and it is the right one:
mirroring the top of a boot does not draw its underside. From beneath, a figure boot is almost
entirely blade — a steel runner standing proud of the sole with the pick at the front — and
that is a different picture, not a reflected one. **285 of 697 plan frames** have the sole
toward the camera, and they fall exactly where you would guess: every plan frame of the spiral
and its checked variant, and most of the teapot's, because a raised or reaching free foot shows
its underside to a camera behind the skater. The extended edge has none, because its free foot
is turned out and trailing.

It is also the most model-relevant picture in the guide: the blade is what this repository is
about and this is the only view that shows the runner whole. No edge dot on it — the dot marks
a *biting* edge and a boot showing its sole is off the ice. A skating boot can never reach this
glyph, because a blade on the ice has its up-axis pointing up and never at a camera beside or
behind the skater.

Each is foreshortened by how much of it is left in the view plane, which is what the old `p2`
and `endo` scalings already did. The plan branch builds its 2×2 from two projected 3D axes that
are orthogonal by construction, so unlike the side-on branch it cannot go singular.

What it changed, measured across all six moves: **677 rear-view frames** of a free boot moved
from a false profile to a plan view, and only 44 still take the profile — the frames where the
lateral axis genuinely is the one facing the camera. The skating boot is unaffected and is what
it always should have been: a pure profile from the side, a pure cross-section from behind.

`continuity.mjs` still reports a **near-tie** count, and it now means something different and
permanent: a boot at an oblique angle where no single flat glyph is wholly honest. That is a
property of drawing a solid with three orthogonal views, not a fault.

## Two knees, and they are not the same knee — 29/08/2026

`bootDir` solves its knee from the **blade**. The renderer draws its knee from the
**ankle**, which sits 15 cm nearer the hip. So a leg past full reach to the blade — the
straight branch of `twoBone`, which is what makes a free boot behave — can still be drawn
with a visibly folded knee.

The first extended edge passed all eight checkers and drew a bent free leg on a position
whose entire name is *extended*. Nothing was wrong; two correct calculations were being
read as one. Author extension against the **ankle** distance that `reach.mjs` reports, not
against the blade.

There is a related sensitivity worth knowing about. At full extension `twoBone` puts the
knee `sqrt(L1² - a²)` off the hip-to-ankle line, which has an infinite derivative at
`a = L1`, so the knee — and with it the free boot's angle — moves fast for the last
centimetre or two of reach. At hip height 90 a free foot at `(60, 12, 28)` gives a boot at
−54° and the same foot at `(60, 12, 32)` gives −68°. Held positions live exactly there.

## The boot's up-axis is one vector, and it comes from the ankle — 29/08/2026

A boot has a direction and an up. The direction is `bootDir`: along the tracing for a
skating foot, off the shin for a free one. The up is what says which way the cuff faces,
and it is not free — `ankleOf` builds it by taking the boot's own direction out of the
leg's direction, and then places the ankle along it. **The renderer must draw the boot
about that same axis**, or the drawn shin does not enter the drawn boot's opening.

There is exactly one honest way to get it: take the boot's direction back off
`ank − blade`. That returns `ankleOf`'s axis by construction, so the two cannot drift
apart, and `tools/boot.mjs` asserts the drawn roll against it to 0.00°.

Two ways of getting it that look right and are not:

- **From the knee.** The renderer's knee is the second-pass one, solved from the ankle;
  `ankleOf`'s is the first, solved from the blade. One iteration apart is up to **11.4°**
  on the waltz jump — see *Two knees* above, which is the same fact seen from the side.
- **In the view instead of in 3D.** Project the leg, then subtract the projected boot
  direction. A 2D subtraction standing in for a 3D one degenerates the moment the two
  projections line up, and **end-on that is every frame by construction**: that branch
  runs *because* the boot points at the camera, so the vector being removed is near-zero
  and its direction is noise. It annihilated the up-axis's vertical component, roll
  collapsed to ±90° with the side chosen by the sign of the pitch, and the boot was drawn
  lying on the ice. **1102 of 1828 end-on glyphs past 60° of roll**; the extended edge
  **379 of 379**, every frame, spanning only −90.0° to −91.7°.

**What hid it for four sessions is an authored zero.** A skating pitch of exactly 0 makes
the subtracted vector exactly zero and the subtraction a no-op. The spiral and the teapot
are authored that way, and their skating boots scored 0 of 642. So the element the standing
rule says to shoot first is the one element that could not show this — and authoring a
physically realistic
half-degree of pitch is what turns it on. **Shoot the spiral first, and conclude nothing
from it alone.**

### What is still wrong there, and is a design call

The side-on branch draws the boot with a 2×2 whose columns are two projected 3D axes, so
where they project onto nearly the same screen line it goes singular and the glyph
collapses to a stroke. That is not a rare frame: in the rear view a free boot's up-axis
points near the camera in **263 of 263** extended-edge frames, **100 of 100** teapot
frames, 69 of those inside 5°. The renderer squares the up-axis against the boot direction
in the view, which keeps a legible glyph and draws a boot that is not the boot in the
model.

Neither is right. What those frames actually hold is **a boot seen from above its own
opening**, and there is no glyph for that — `bootSide` and `bootEnd` are the only two, and
the branch picks between them on how much the *direction* points at the camera, which is
the wrong question in this case. A third glyph, or a rule for declining to draw one, is a
design decision.

## Draw order is a depth claim, made once — 29/08/2026

The renderer used to draw the legs sorted by `NEARER`, then the torso, then both arms in
fixed `L, R` order. Arms were therefore last unconditionally: an arm behind the chest drew
in front of it, and the further arm drew over the nearer one whenever L happened to be the
far side. **The arms were not undepthed. They were depthed wrongly** — about half the time,
by construction.

Now: **one list, sorted once, against one expression of where the camera is.** `NEARER[mode]`
is that expression and it is the only source of the camera in this file.

**Everything splits at its middle joint** — arms at the elbow, torso at the waist, legs at
the knee — because a limb ordered as a single piece gets one end of it wrong the moment
anything passes between its ends. An upper arm can be behind the chest while the forearm is
in front of it, and no single ordering of the whole arm can say both. The legs were split on
measurement rather than argument: over 2,010 samples — 201 of each of five moves, both legs
— the knee and the **blade** straddle the torso's depth in **227**, in every move including
the spiral. 227 is the load-bearing figure, because the old sort ordered a leg at its blade.

**Casing is retracted from its own joint, never suppressed.** A casing is wider than the
stroke it protects, so where two segments of one limb meet, the second-drawn one's casing
paints a notch into the first. The first attempt suppressed a casing when its sibling
happened to sort next to it — which, because the two halves of a limb are usually contiguous
in depth, removed the halo from the second half of nearly every limb, and made whether a
segment got one at all depend on what unrelated item sorted between it and its sibling. So
the casing stops short of its own internal joint by its own half-width instead. The stroke
still runs to the joint, so the limb is unbroken; only the halo stops short, which is what a
technical illustrator does at an elbow. **The invariant is casings = segments − 1.**

**The elbow is dropped past the end-on threshold, joint circle included.** This file already
said stop drawing the elbow when the arm is near end-on; that rule predates the joint circle,
which had been sitting on the shoulder-to-hand line ever since. The threshold is one stroke
width of **projected** bend, which is the quantity the rule is about — the 3D bend can be
large while the picture shows none, which is exactly how the zigzag shipped.

### Which hand is which follows the data, not a measurement of it

`moves.js` says "any key may override with `LH` / `RH`". It did not: the default-carriage
loop assigned unconditionally for every key of every move, so an authored hand was computed,
stored and overwritten before anything read it. Nothing failed and no checker looked — the
same shape as the featured filter that absorbed the twizzles. The fix is one guard on an
`authored` flag.

That flag also decides whether the guide names which hand is which: a move whose keys author
a hand gets letters, one that does not gets none. Exactly the boots' rule, where an element
that stays on one foot gets no L/R tag because the model makes no distinction there. **No
threshold.** An earlier proposal used 12 cm between the hands in the shoulder frame, which
was its weakest number — every other constant here comes from the equipment, and there is no
physical fact behind "how far apart must two hands be before we name them". It is read once
per **move**, not per frame: a painter only ever sees one frame, so testing the interpolated
pose there makes the letters appear mid-glide on any move reaching a check from a neutral
carriage.
