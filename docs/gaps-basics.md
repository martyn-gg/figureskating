# The basics — the floor below the edges

Written 06/09/2026, Martyn: *the guide lacks basic techniques like stroking.*

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
this?* is *your website*. Two independent copies of Basic 1–6 were read on 06/09/2026 and
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

`kind: basic`, added to the enum on 06/09/2026. Most carry no `entry`, because most are
two-foot or straight and the derived machinery keys off `entry` — so a basic is written
rather than generated, which is why it is its own kind rather than an edge with a field
missing.

| | element | the rig |
|---|---|---|
| **Getting moving** | forward stroking, backward stroking | **no — the push is not along the tracing** |
| | swizzle, backward swizzle | **no** |
| | half-swizzle pumps, backward half-swizzle pumps | **no** |
| **Gliding** | two-foot glide, backward two-foot glide | yes |
| | one-foot glide, backward one-foot glide | yes |
| | dip | yes, and the most worthwhile of them |
| | drag | **no — the trailing foot is turned out** |
| **Stopping** | snowplough stop, backward snowplough stop | **no** |
| | T-stop, hockey stop | **no** |
| **Turning and changing edge** | two-foot turn, backward two-foot turn | **no — mid-turn the blades point across the travel** |
| | slalom, backward slalom | yes |
| | two-foot change of edge | yes |
| | pivot | **no — the pick has no anchor** |

Eight of twenty-two. The other fourteen looked like one blocker and were three.

**The yaw went in on 19/09/2026** — `docs/model.md`, *A blade on the ice may point somewhere
other than where it is going*. It accounts for **five** of the fourteen: stroking both ways,
half-swizzle pumps both ways, and the drag. `forward-stroking` has a rig. The rest split into
**six needing the skid** (both snowplough stops, the T-stop, the hockey stop, both two-foot
turns), **two needing a second path** (the swizzles — both blades run true, but their lines
diverge and the rig has one path), and **one needing an anchor** (the pivot).

**The skid went in the same day** — `onIce: 'skid'`, `docs/model.md`, *A blade that is not
travelling along itself* — and the scrape with it. **The T-stop and the snowplough stop both
have rigs**, and the reference blade may now declare a skid, which is what a two-foot stop
needs. The backward snowplough, the hockey stop and the two two-foot turns have everything
they need and want rigs of their own; the swizzles still need a second path, and the pivot
still needs an anchor.

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
