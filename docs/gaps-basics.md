# The basics — the floor below the edges

Written 19/09/2026, Martyn: *the guide lacks basic techniques like stroking.*

It did. Every one of the 250 elements the guide held began from a curve the skater was
already carrying. Nothing in it said how you get moving, how you stop, or how you turn round
on two feet. The guide's own `notCovered` fields had been saying so for weeks without anyone
reading them as a pattern — **nine exercises**, each excusing itself with some version of
*the step wide and the push back*, plus the two-foot power change of edge in Skills 1, the
pivot in Skills 8, and the toe-assisted hop in Skills 3.

## Where the content comes from

**Learn to Skate USA, Basic 1–6.** Chosen over Skate UK because BIS publishes its
Fundamentals curriculum as a **paid booklet** rather than a free PDF, and `docs/style.md`
says the guide is built from public material only so that the answer to *where did you get
this?* is *your website*. Two independent copies of Basic 1–6 were read on 19/09/2026 and
agree level by level; both, and the Skate UK and CanSkate cross-checks, are recorded in
`sources/usfs/MANIFEST.md`.

**All three curricula teach the same movements in nearly the same order** — push, swizzle,
glide, stop, two-foot turn, slalom. That is the argument for the basics being elements at
all rather than one programme's syllabus.

**Names are Learn to Skate USA's, spelled in British English**, with the other bodies' words
in `aliases`: *snowplough stop* carries *snowplow stop*, *swizzle* carries *lemon* and
*sculling*, *half-swizzle pumps* carries *circle thrusts*. Searching "lemon" finds the
swizzle, which is checked.

## The twenty-two

`kind: basic`, added to the enum on 19/09/2026. Most carry no `entry`, because most are
two-foot or straight and the derived machinery keys off `entry` — so a basic is written
rather than generated, which is why it is its own kind rather than an edge with a field
missing.

| | element | the rig |
|---|---|---|
| **Getting moving** | forward stroking | yes — a rig |
| | backward stroking | yes — a rig, 20/09/2026 |
| | swizzle, backward swizzle | **no** |
| | half-swizzle pumps, backward half-swizzle pumps | **no** |
| **Gliding** | two-foot glide, backward two-foot glide | yes |
| | one-foot glide, backward one-foot glide | yes |
| | dip | yes, and the most worthwhile of them |
| | drag | **no — the trailing shin is 30 to 44° over what the boot allows** |
| **Stopping** | snowplough stop, backward snowplough stop | yes — a rig each |
| | T-stop | yes — a rig |
| | hockey stop | **no — counter-rotation and a free upper body** |
| **Turning and changing edge** | two-foot turn, backward two-foot turn | yes — a rig each, and the first use of the skid on an element |
| | slalom, backward slalom | yes |
| | two-foot change of edge | yes |
| | pivot | **no — the pick has no anchor** |

Eight of twenty-two, on the day this was written. **Fifteen of twenty-two now**, and the
count and the reasons are held by `tools/drawn.mjs` rather than by this table — read them
there if the two ever disagree. The fourteen that could not be drawn looked like one blocker
and were three.

**The yaw went in on 19/09/2026** — `docs/model.md`, *A blade on the ice may point somewhere
other than where it is going*. It accounts for **five** of the fourteen: stroking both ways,
half-swizzle pumps both ways, and the drag. `forward-stroking` has a rig. The rest split into
**six needing the skid** (both snowplough stops, the T-stop, the hockey stop, both two-foot
turns), **two needing a second path** (the swizzles — both blades run true, but their lines
diverge and the rig has one path), and **one needing an anchor** (the pivot).

**The skid went in the same day** — `onIce: 'skid'`, `docs/model.md`, *A blade that is not
travelling along itself* — and the scrape with it. **The T-stop, both snowplough stops and
both two-foot turns have rigs**, and the reference blade may now declare a skid, which is
what a two-foot stop and a two-foot turn both need. The hockey stop wants counter-rotation
and a free upper body, the swizzles still need a second path, and the pivot still needs an
anchor. Only the drag and backward stroking are waiting on nothing but authoring.

**Backward stroking had a rig on 20/09/2026 and the drag did not** — `docs/model.md`,
*A trailing foot flat on the ice needs a shin the boot has not got*. Backward stroking was
the claim above being true: it is `pushOff` read off a base of 180, and the yaw is the same
number in both because flipping the direction of travel and flipping which side is the
skater's right cancel. The drag was the claim being wrong, and the sentence "waiting on
nothing but authoring" is what it was wrong about. **Measured, a trailing foot flat on the
ice needs the shin 30 to 44 degrees over the 28 a boot allows, at every hip height below 96
and every reach past ten centimetres, and pitching the boot makes it worse monotonically.**
Only a locked skating leg keeps both shins legal, and the bent knee is what the element is
about. `turnout.mjs` blocks it a second time, reading a trailing toe as 150 degrees of hip
rotation — the case its own header predicted and excluded picks for.

That leaves seven, and `tools/drawn.mjs` holds the reason for each: both swizzles (the
blades are turned out against the travel), both half-swizzle pumps (the pushing blade is
angled across the circle), the hockey stop (counter-rotation and a spine), the pivot (the
pick has no anchor), and the drag. The drag is the only one whose blocker is `shin.mjs`, and
the only one waiting on the same thing as the camel change and the lunge.

## The turns, and what a sweeping yaw cost — 19/09/2026, later the same day

The two two-foot turns are the first elements to USE the skid and the yaw, and they are the
first poses in the file whose yaw moves at all: every skid before them was a held stop at a
single angle. Three things came out of that, and none of them was a new capability.

**A turn is a yaw sweeping through a half circle, and `dir` never changes.** The skater ends
up gliding backwards and there is a field that says so, and it cannot be used: `dir` is a
carried state and `yaw` is an interpolated quantity, so flipping `dir` partway takes 180° off
the base and sends the yaw back through zero to compensate. Every frame between those two
keyframes would draw the blades swinging the wrong way and back. So the whole rotation lives
in the yaw, which on a skid is exact rather than a convention — a skidding blade has no line
of its own to travel along.

**The rig starts and ends mid-skid, at 25° and 155° of body rotation, and that span is the
skid floor read from both ends.** A skid must be turned past `SKID_MIN_YAW`; a blade running
true is not a skid; and `yaw` interpolates, so no arrangement of keyframes gets from a
true-running blade to a skidding one without frames in between that are a yawed blade
claiming to grip. The rig draws the turn and not the glide into it.

**Which found a hole in the checker.** `turnout.mjs` read the skid floor off nought only, so
a blade at 176° — running as true along its own line as one at 4°, backwards — passed it by
a mile. No pose could reach that while the only skids in the file were three held stops at
40, 45 and 90 degrees. Asserted from both ends now, `--break=back`, 35 feet reported.

**And the scrape was drawn as a stroke.** One stroke carries one width, so a sweeping yaw
bucketed into thirteen short round-capped strokes of rising width: a caterpillar of
overlapping discs where the mark should taper. Every checker was green; it was found by
looking. The band is a filled shape now, its half-width read off each frame's own yaw.

**The eight were drawn on 19/09/2026**, as tracings rather than rigs. `trace` on the element
carries segments in exactly a rig move's `path` vocabulary and `PathThumb` runs them through
**`buildPath`** — the same function that lays the tracing under the body frame, so this is not
a second tracing engine and `lobeSense` still decides which way a lobe curves in one place
only. Blank element pages went from 23 to 15, and the 15 that remain are the fourteen above
plus `other-names`, which is a listing.

Two things the drawing settled that the prose had not:

- **Two blades draw two lines, and they are on opposite edges.** A two-foot glide drawn as
  one line is a picture of a one-foot glide. And two blades on one lobe are one outside edge
  and one inside — `twoFoot` in `moves.js` is already authored on that — so the second tracing
  takes the other letter and **the two colours swap at every change of edge**, which on a
  slalom is the element itself.
- **The separation is in screen units, not ice units.** A boot is 16 cm wide and a slalom is
  eight metres long, so at the zoom that fits one in a thumbnail the two tracings land three
  units apart under a stroke twenty-five wide: one thick line. Drawn at a fixed distance on
  the reader's screen instead — the same licence the rocker's sag and the edge separation
  already take.
- **The drawing corrected the prose.** `two-foot-change-of-edge` said the tracing showed "a
  single crossing point". The two tracings never cross; they stay side by side, and what
  changes hands at the inflection is which of them is on an outside edge. Rewritten to say
  what is actually drawn.

**`tools/drawn.mjs` is the nineteenth checker**, and it exists because this repository has now
shipped a block of pictureless element pages twice — six jumps, then twenty-two basics, both
found by counting built HTML and by nothing else. It reads `dist/`, not the source, because
what matters is whether a reader gets a picture. Its exemption list is a **declaration, not a
skip**: each undrawable page is named with its reason, and the checker fails both when an
unlisted page draws nothing AND when a listed page starts drawing, so a stale reason cannot
sit there quietly. Broken on purpose both ways, one page reported each.

## A blade on the ice always points where it is going, and half the basics are movements where it does not

`bootDir`'s planted branch takes the boot's direction from the tracing:

```js
if(on){                                          // planted: along the tracing
  const y = (dirOf(pose, which) === 'F' ? 0 : 180) * D2R;
```

Nought or a hundred and eighty, and nothing in between. There is **no per-foot yaw for a
blade on the ice** — measured rather than read off: both blades of `twoFoot` return a heading
of exactly 0.0°, and authoring `yaw`, `heading` or `toeIn` on the second foot changes nothing,
because no field of that name is read.

That is correct for an edge, and an edge is all the rig had ever been asked to hold. **A blade
on the ice can only lie along its own line** — the same sentence `rig-math.js` already uses to
justify the rule.

It is wrong for a stop and wrong for a push, and those are the two most fundamental movements
in the sport. A snowplough is a blade turned some twenty-five degrees across the direction of
travel and pressed flat so that it *skids* rather than grips. A push is a blade driven
sideways against its inside edge. A hockey stop is both blades square across the travel. A
two-foot turn spends its middle with the blades pointing across the line. In every one of
them the blade is on the ice and is **not travelling along itself**.

**That sentence is Session 15's, and it was written about the pick.** The pick was the first
contact allowed to point somewhere other than along the tracing, and `bootDir` grew a third
rule for it — direction from the reach, because a jab does not travel. A skid is the same
observation about a different contact: the blade is down, bearing weight, and going somewhere
other than where it points. So the precedent is in the file, and the general form is that
**`bootDir` has been answering "where does this boot point" with "where is this foot going",
and those come apart the moment a foot stops being a wheel.**

### What the fix would be, and what it costs

A per-foot **yaw** on an on-ice blade — authored, in degrees off the direction of travel,
defaulting to zero so every pose written before it draws byte-identically. That is the same
shape as `pitch` and `point`: a quantity the skater chooses rather than a property of the leg,
which is the test `rig-math.js` already applies to decide what gets authored.

It is not free:

- **`tracing.mjs` and `lean.mjs` both assume the tracing is the blade.** A skidding blade
  draws a scrape, not a curve, and the guide has no mark for a scrape. A snowplough's tracing
  is two straight converging smears; that is a new kind of mark, not a new arc.
- **`blade.mjs` puts the contact on the rocker from pitch alone.** A blade skidding flat is
  in contact along most of its length, which is what a skid *is*, and `contactAlong` has no
  answer for that.
- **`lean.mjs` asserts every blade leans into its circle and over its edge.** A hockey stop
  is the opposite claim: flat enough not to bite. That is an exemption, and this repository's
  own rule is that an exemption can only excuse a pose — it would need an assertion pointing
  the other way, that a *skidding* blade is inside some angle of flat.

So the honest order is: ship the eight the rig can already hold, and treat the skid as its own
piece of work, specified the way the pick was.

## Still not covered, deliberately

**Bunny hop** (Basic 6), **lunge** (Basic 4 bonus) and **shoot the duck** (Basic 6 bonus) are
basics by any curriculum and are not here. The bunny hop is a jump and belongs with the jumps;
the lunge needs a boot rolled onto its side, which is a missing axis and has been the lunge's
blocker since Session 14. **Snowplow Sam** (ages 3–5) sits below the guide's floor.

**Sit on the ice and stand up**, marching, and falling are Basic 1 and are lesson content
rather than elements with geometry. Left out on purpose.

## The exercises still say "the push back"

The nine `notCovered` entries have not been rewritten. Forward stroking now exists and most of
them could name it — but several are specifically a **step wide**, which changes foot without
turning and is `kind: step`, a value the enum has carried since the beginning with nothing in
it. Doing that properly means deciding what a step is, and it should be done in one pass
across all nine rather than opportunistically.
