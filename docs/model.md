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

## The pick is a third kind of contact — specified 30/08/2026, not built

Four of the seven jumps are toe-assisted, the jump pages now say out loud that the pick is
what separates a flip from a Salchow and a toe loop from a loop, and the rig cannot draw it.
This is what it would take. Written as one decision with every touch point listed, because
that is what this repository asks of a change that moves something other files point at.

**`pick: true` already exists and is wrong.** It is a KEYFRAME flag, and `blade.mjs` reads it
as "exempt every on-ice blade in this frame from the ±3.5° limit". The moment a pose has one
foot on an edge and another on the pick — which is the only pose that needs it — that exempts
the wrong foot too. It has never been set on any keyframe, so nothing is broken today; it is a
description waiting to be believed, which is this repository's recurring failure mode. It goes.

**The shape is `onIce: 'pick'`,** the same field two blades added, with a third value. A picked
foot is not a blade and it is not free: it is on the ice, carrying weight, with no edge, no
lean claim and a boot pitched far past what a blade allows.

**Two functions already handle it and need no change**, which is the two-blades work paying
forward: `onIceOf` returns whatever the foot declares, and `bladesDown` filters for `'blade'`
and so excludes a picked foot correctly. What remains is every place that still asks
`=== 'blade'` and means *on the ice*. They are enumerable:

| File | What it does now | What a pick needs |
|---|---|---|
| `rig-math.js` `edgeOf` | returns the reference blade's edge for any non-blade foot | a pick has no edge; return null |
| `rig-math.js` `bootDir` | branches skating / free | a third branch: planted, pitched past `MAX_BLADE_PITCH` |
| `rig-math.js` | — | wants `contactsDown(pose)`, every foot touching by any means |
| `moves.js` `ON()` | hardcodes `onIce:'blade'` | a `PICK()` sibling; and `pick:true` removed |
| `body-frame.js` ×2 | `down`/`skating` = `=== 'blade'` | a picked foot would draw pale, in free weight, and vanish with the free-foot toggle off — **the exact bug the two-blades comment beside it describes**, one contact type along |
| `blade.mjs` | keyframe-level `!k.pick` | per foot |
| `freefoot.mjs` | skips `=== 'blade'` | a picked foot would be measured against the free-boot limit and called a pointe. It *is* pointed, deliberately |
| `boot.mjs` | every edge dot is on a blade on the ice | a picked foot must not get a dot — the renderer decides, so check rather than assume |
| `continuity.mjs` ×3 | `down` = `=== 'blade'`, incl. landing detection | a pick going in would read as a landing |
| `twofoot.mjs` | every free foot is clear of the ice | a picked foot sits at z 0 and is not free |
| `lean.mjs` | iterates `bladesDown` | correct already — a pick makes no lean claim |

Four model and render files, five checkers, one of them correct already. That is the size of
the two-blades change, and it should be a session of its own rather than the tail of one.

**What it buys, in order:** the difference between a flip and a Salchow and between a toe loop
and a loop, which is the question a skater actually asks and which four jump pages now name
and cannot show; the toe-assisted hop into the Skills 3 spirals, the last item on the BIS gap
list; and the Lutz, whose whole identity is an outside edge plus a pick.

**What it does not buy:** the lunge. That needs a boot rolled onto its side, which is a
missing axis rather than a missing contact type.

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
