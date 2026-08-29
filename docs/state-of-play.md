# State of play

Written 15/08/2026 at the end of the first build session, revised the same day once the
derived tier went in. Read this before changing anything; then `README.md` for the
approach and `docs/model.md` for the geometry.

## Where it stands

The machinery was built first and the derived tier is now in it. That ordering is why
forty elements arrived in an afternoon rather than over a winter.

**Working:** a static Astro 7 site with content collections for elements, tests and
exercises; an animated edge diagram on any element with an entry edge; the three-view
body-frame rig on any element with a rig; a `/rig` explorer; offline via a service
worker; eight checkers that pass on a clean clone.

**Content:** 180 elements — eight plain edges, thirty-two one-foot turns, sixteen two-foot
turns, twenty-four twizzles, twenty-eight transitions, sixty-four clusters, seven jumps and
a spiral — plus one example test and no exercises.

*(An earlier revision of this file said 46 and then 62. Both were wrong by two — I was
adding up rather than counting the files. Count with `ls src/data/elements | wc -l`.)*

**A terminology correction worth keeping.** The first draft of this repository called
three turns, brackets, rockers and counters "two-foot turns". They are not: BIS defines a
*one foot turn* as a rotational movement on one foot, and a mohawk or choctaw as a turn
from one foot to the other. The names are now used the way the sport uses them.

**Barely started:** the syllabus half. Elements know what they are; nothing yet knows
which test it belongs to. Both generations of the British Ice Skating Skills documents —
current and the October 2026 revision — are read and reviewed in `sources/bis/`, so this
is now a writing job rather than a research one.

**Not verified by anyone qualified:** all of it. Every element and test carries a
`verified` flag defaulting to false, and unchecked pages render behind a banner saying
so. That is not false modesty — the mechanics were drafted by someone who can do a
waltz jump and no more.

## The one idea everything rests on

Which way a lobe curves is not a fact you store about an element. It is a product of
three facts about the foot:

    lobeSense = (foot == L ? +1 : −1) × (edge == O ? +1 : −1) × (dir == F ? +1 : −1)

Store those three; derive the rest. The exit edge, whether the lobe continues or
reverses, which way the cusp points, the mirrored version for a clockwise rotator, the
sentence describing it, the animated tracing — none of it is authored per element.

That is why adding the remaining turns costs almost nothing, and why the guide can offer
mirrored versions of everything when almost no other resource does.

**Corollary: never copy the model.** `edge-diagram.js` imports `skating.js`; the rig's
renderers import `rig-math.js`. There are no standalone prototypes, deliberately — two
copies of an engine will drift, and this project keeps designing against exactly that.

## How to work on it

    npm install
    npm run check      # harness, reach, shin, blade, freefoot, tracing, build, links
    npm run dev

`npm run check` must pass before and after any change. It is fast and it has caught
every class of error listed below at least once.

Screenshot tools need Playwright, which is deliberately not a dependency:

    npm install --no-save playwright && npx playwright install chromium
    node tools/shot.mjs waltz 0.4 out.png        # one frame
    node tools/contact-sheet.mjs waltz .         # every keyframe, side by side
    node tools/page-shot.mjs out/ elements/      # built pages at phone width
    node tools/speed.mjs                         # the speed control really slows it down

## Three rules learned the hard way

**Render it, don't reason about it.** Projection geometry is invisible in the maths and
obvious in the picture. Several fixes were argued through carefully, shipped, and wrong;
each was then settled in minutes by taking a screenshot and, where still unclear, drawing
debug markers at the computed points.

**Ask what equipment constrains it.** Nearly every correction from a skater took the same
form — something modelled as free is limited by kit:

| Modelled as free | Actually limited by | Consequence |
|---|---|---|
| blade contact | the rocker, ~7 ft radius | contact = `ROCKER × sin(pitch)`; 1° moves it 3.7 cm |
| boot pitch | the blade running out of length | ±3.5° max; past that you are on the picks |
| shin lean | the boot cuff | about 28° |
| free-foot point | the boot holding the ankle square | `ANKLE_FREE` is 10°, not 68° |

Each became a checker. Before keyframing a new element, ask what limits it.

**Don't let an optimiser edit poses.** Automated fixes made things worse three times: one
lifted skating blades off the ice to satisfy leg reach, one moved a landing foot half a
metre behind the hip to minimise shin angle, one searched past its first valid answer and
raised a trailing foot to hip height. They minimise a scalar with no idea what a landing
is. Use the checkers to flag; fix by hand; re-assert the hard constraints afterwards.

## Errors already made, so they aren't made again

- `rotate(180)` is a point reflection, not a mirror — it renders a boot upside down.
- The boot glyph is drawn in centimetres and must use the view's own cm scale. Mixing
  units means no offset can ever line up.
- The glyph's ice contact is the underside of the blade, not the glyph origin.
- A boot needs an actual cuff opening, or the shin butts against a closed silhouette.
- An elbow orbits the arm's axis, so during a body rotation it crosses the
  shoulder-to-hand line from any fixed camera. Unavoidable; stop drawing the elbow once
  the arm is near end-on.
- **`t` is the direction of travel, not the way the skater faces.** After a half rotation
  they are opposite, so a free leg "extended behind the skater" sits at *positive* t.
  This was wrong for an entire landing and was invisible frame by frame — only the contact
  sheet showed it. Render the sheet before believing any sequence that turns.
- The boot's up-axis comes from the leg, not from world up. World up works only while the
  foot hangs below the knee; raise it and the shin enters through the sole.
- Astro bundles a component's CSS only on pages that **import** it. `/rig` reused
  `BodyFrame`'s class names without importing it and had no styling at all.
- Live values must not sit inline with prose — each change reflows the paragraph. Give
  them a fixed row, reserve heights, throttle DOM writes, and verify by measuring bounding
  boxes across ~45 consecutive frames.
- **A lateral offset on a leaning skater looks the same whichever way it points.** The
  waltz landing leaned out of its own circle for two weeks, through a design pass that
  shot that very element in two schemes, and was then read as evidence of crossed feet in
  a different frame. Neither the picture nor the arithmetic volunteers the sign; only
  comparing it to the tracing does.
- **Reviewing the element that happens to be open is not sampling.** The whole design pass
  was reviewed on the waltz jump because it was the page that was open. The spiral has
  since been the element that would have caught the problem twice: `framing.mjs` found it
  clipping 18 px and 20 px at both ends, and its rear view has the limbs overlapping in 73
  frames of 81 where the waltz jump has 1 in 70 — so a wrong depth sign would have been
  all but invisible on the move under review and obvious on the one that was not. **Rig
  changes get shot on the spiral first and the jump second**, and anything that can be
  asserted across all elements should be a checker rather than a screenshot.

## Pose handedness, and what it actually was — 29/08/2026

Session 02 left three candidate explanations for the waltz jump's frame 60, where the
skating left foot sits at n = +17.2 and the free right foot at n = −4.6: opposite
authoring handedness, `n` measured against the curve, or genuinely crossed feet. It is
none of them, and the question was the wrong shape.

`n` is measured from the **hip**, and on an edge the hip is not above the blade. At
hipZ 86, n = +17.2 is an 11.8° lean — a deepening forward outside edge and nothing more.
The free foot 70 cm behind it at n = −4.6 is not near enough to cross anything. The two
numbers were being compared as if they were foot placements when they are mostly lean,
which `docs/model.md` never said and now does.

What the question turned up on the way past is a real defect it was not looking for. The
skating blade must sit on the **outside** of its lobe; across all three moves every
keyframe did, except the six waltz **landing** keys, which had the skater leaning out of
the landing circle by 6–11°. Three independent routes agree: `lobeSense` and the sign of
`n`; the biting edge from the edge letter, measured against `hipYaw`; and the drawn
top-down hip, which sat 22 cm outside the landing circle where the entry's sits 19 cm
inside. The six keys were flipped by hand and `reach`, `shin`, `blade`, `freefoot` and
`tracing` still pass — a sign flip does not change a distance, which is exactly why five
checkers had nothing to say about it.

- **`tools/lean.mjs`, the eighth checker.** Both routes, per frame rather than per
  keyframe, on 922 frames. `--break` puts the old landing back.
- **The side view's camera is settled.** The along-track axis plots +t to the right, so a
  skater going forwards reads left to right; that puts the camera on the skater's right,
  at +n, and `NEARER.side` is `q => q.n`. The old value ordered depth from the skater's
  left while the boot's toe/heel test twenty lines below drew from their right — the two
  disagreed and neither knew. They are now one expression, so that particular pair cannot
  drift apart again.
- **`tools/frame-svg.mjs`** dumps any frame of any view as a standalone SVG without a
  browser, by giving the renderers a DOM stub. "Render, don't reason" needed Playwright
  until now, which is not always available where the work is.

## Twizzles, and the axiom they break — 29/08/2026

Deferred since Session 01 on the grounds that a travelling multi-rotation turn is not a
chain of half turns. That was right, and the reason is sharper than it looked: **a twizzle
breaks this model's founding axiom.** Everywhere else a blade points along its own tracing.
A tangent can only wind in whole turns, so the extra half of a 1½ cannot be in the tracing
at all — it is the body turning against the blade, and that skid is the exception the rest
of the repository is built on not having.

Everything else did fall out, and BIS's own definition turned out to be geometry twice:

- *"A series of checked three turns is not acceptable, as this does not constitute a
  continuous action"* is **cusps against curls**. A three turn reverses the blade by
  pivoting, and the tracing comes to a point. A twizzle's tangent winds all the way round
  instead, which on a curve that is also advancing is a small loop — a curl — per rotation.
- *"If the travelling stops, it becomes a solo spin"* is **the advance going to zero**, at
  which point the curls collapse onto one circle traced over and over.

The two flags are computed from the rotation count rather than typed in. Curls cannot curve
against themselves, so the lobe always continues; a half rotation turns the skater round, so
the direction reverses; and the lobe continuing then forces the edge letter to flip with it.
**LFI, one and a half, comes out LBO — and the blade never changed which way it curved.**
That last part is the claim most worth putting to a coach.

- `TWIZZLES` in `skating.js`: one key per rotation count, not one key plus a number. The
  count decides the exit, so putting it on the element would hide a fact `exitState` has to
  see. Single, 1½ and double; twenty-four elements across the eight entry edges.
- The tracing is a trochoid, in `edge-diagram.js`. The advance must stay under the curl
  radius or the tangent never completes its turn and the curve scallops instead — that
  inequality is the whole difference between a twizzle and a wobble. Ratio 0.55, Martyn's
  call from four rendered candidates.
- `tracing.mjs` gained five twizzle assertions and now covers 184 combinations: no cusp
  anywhere, whole turns of the tangent in the lobe's direction, it travels, it curls rather
  than scallops, and it comes out along the line it went in on. Broken on purpose — advance
  1.4 gives 72 failures, advance 0 gives 24, advance 0.98 gives 24 caught as a cusp, which
  is right, because at exactly 1.0 a trochoid genuinely has cusps.

## The derived tier, and what generating it taught

`tools/gen-derived.mjs` writes the eight edges and thirty-two turns. It imports
`skating.js` and restates none of it, so no exit edge, cusp or mirror appears in any
content file. What the script does carry is the prose, keyed on direction, edge and turn
and **never on the foot** — a left forward outside bracket and a right one are mirror
images, so they take the same words with "left" and "right" in neither. Sixteen turn
passages and four edge passages cover all forty pages honestly. The text differs exactly
where the skating differs.

It refuses to overwrite an existing file, so a page corrected by a coach stays corrected.

Two things came out of the multiplication:

- **`tools/tracing.mjs`, the seventh checker.** Forty elements from one sign rule means a
  flipped sign is wrong forty times and looks plausible every time — a curve on a screen
  is a curve either way round. It asserts the drawn lobe against `lobeSense` in ice
  coordinates and the cusp against `rotatesInto`, across all forty. Flipping the sign in
  `edge-diagram.js` makes 104 assertions fail, which is the only evidence that a checker
  is worth having.
- **A flat list stopped working at forty.** `/elements/` is now an 8 × 4 matrix — entry
  edge down the side, turn across the top, exit edge in the cell — with the two defining
  bits of each turn in the column head, so the whole taxonomy is legible in one screen.
  Each element page also lists the rest of its family, the other things you can do from
  the edge you are standing on, which is how anyone will actually move around the guide.

## The two-foot turns, and what they cost

Sixteen more elements: mohawks and choctaws on every entry edge. The model needed one new
table and a generalised `exitState`; `lobeSense` already predicted both, because the foot
flips and the direction flips, so a mohawk's lobe continues and a choctaw's reverses.

The renderer needed more thought than the model. A two-foot turn has **no cusp** — nothing
pivots — so the tracing stops on one blade and starts again beside it, offset by roughly a
boot's width, and the boot glyph changes foot mid-animation. Drawing a cusp there would
have drawn a turn that is not the one being described, so `tracing.mjs` now asserts the
absence: a step must have a real gap, the foot must differ across it, and a one-foot turn
must not have one. Fifty-six combinations checked.

Open and closed are free-foot placement, not tracing, so each is one element rather than
two. The diagram cannot tell them apart, and does not pretend to.

## Clusters

Sixty-four of them: eight named runs of turns across all eight entry edges. A cluster
stores its entry edge and the order of its turns and nothing else; every edge in between
is chained out of `exitState`, which is why a run of three costs no more to add than one.

`CLUSTERS` lives in `skating.js` rather than in the generator, so the page that lists them
and the script that writes them cannot end up calling the same thing two different things.

The drawing was the work. `buildTrace` now walks a chain, joining each turn with a cusp or
a step as that turn requires, and `mount` paints one segment per edge so the colour changes
under the boot as the skater changes edge. `tracing.mjs` grew a chain pass: one mark per
turn, in order, each with the right kind of join, the right lobe before it and the right
edge after it. Pushing one wrong state into a chain fails 168 assertions.

The prose is keyed on the cluster and on direction only — a weaker key than the single
turns use, and deliberately so. What makes a rocker-counter hard is the rocker-counter;
what changes it most is whether you can see where you are going.

## Transitions — the connecting material

Changes of edge, loops, crossovers, chassés and cross rolls. What they have in common is
that **none of them reverses the direction of travel**, which is precisely what makes them
not turns; `exitState` grew a `reversesDir` flag and nothing else changed.

The renderer needed a real addition: `join`, stored on each element rather than inferred,
because four different things happen where an element occurs. A **cusp** where the blade
pivots. A **roll** where it changes edge without pivoting — nothing to see, which is the
whole difficulty of a change of edge and now the whole difficulty of drawing one honestly.
A **loop**, a small circle traced on the same edge and closing back onto it. A **step**
where the skater changes foot.

Two things the model made us say out loud:

- A crossover and a chassé produce **identical tracings**. They differ in where the free
  foot goes, which a blade cannot draw. The guide says so instead of inventing a
  difference — the same call already made for open versus closed mohawks.
- Crossovers, chassés and cross rolls are generated from **outside entries only**. That is
  not a limitation of the model; it is what the elements are.

The four missing jump pages went in at the same time, generated from `JUMPS` so no page can
disagree with the model about what a Salchow is. Seven jumps now, three of them still
hand-written from the first session.

## What to do next

1. ~~**Twizzles.**~~ Done 29/08/2026 — see the section above.
2. **A visual design pass — done 29/08/2026.** See `docs/design-brief.md`, which
   carries the constraints, the measured contrast table and the verification method. The
   headline finding: the two edge colours differ by 1.09:1 in luminance, so outside versus
   inside edge is carried by hue alone, and that is the single most important fact a
   tracing conveys.
3. **Held positions** (lunge, Ina Bauer, spin positions) are the cheapest useful body-frame
   content: one or two poses each.
4. **The British guide.** The documents are in `sources/bis/` and reviewed. See
   `sources/bis/MANIFEST.md` for what is there, what is still missing, and how the
   documents may be used.

## Offline, and the bug that hid the whole build

Symptom: the dev server showed six elements when a hundred and twenty-four were on disk.
Cause: `public/sw.js` was cache-first with a fixed cache name and no revalidation, and it
registered in development as well as production. Once a page was in the cache it was served
from the cache for ever, and the cache name never changed so the `activate` cleanup never
fired.

That is not a local annoyance. It was going to ship. Every reader would have been pinned to
whatever version of a page they happened to load first, which for a guide whose entire
premise is *coaches will correct this* is about the worst failure available.

Now: **stale-while-revalidate**, the cache named after the build (`src/lib/build-id.js`, one
module evaluated once so every page agrees on the version), the worker registered only in a
production build, and any worker left over from a local build unregistered on sight.

`tools/offline.mjs` asserts both halves of the promise — the page still opens with the
network gone, *and* a changed page reaches a returning reader. Restoring the old worker
verbatim passes the first and fails the second, which is what makes the checker worth
having. Needs Playwright, so `npm run check:offline` rather than part of `npm run check`.

The cost of naming the cache after the build is that a deploy makes every reader
re-download on their next visit. That is the right trade for a guide expecting corrections.

## Known and deferred

- **Element ordering is alphabetical where it should be pedagogical.** The home page's
  single "Mechanics" list puts Spiral between Salchow and Toe loop — a position amongst the
  jumps — and the Axel first. Jumps should run in learning order: waltz jump, Salchow, toe
  loop, loop, flip, Lutz, Axel, and that order belongs in `JUMPS` so pages inherit it
  rather than each sorting for themselves. Positions want their own group on the home page,
  as they already have on `/elements/`. Martyn spotted it; deferred past the design pass by
  his call, and written here so it is not lost.
- Positions has exactly one entry. Held positions are queued.
- Twizzle prose is written to the entry edge and the rotation count, like everything else
  here, but nobody has skated any of it. The claim most worth a coach's eye is that the
  blade stays on one physical edge throughout and the letter changes only because the
  skater turns round.

## Playback speed

Both engines take a `speed` multiplier and both control bars carry a cycling **1× ½× ¼× ⅛×**
button. Discrete steps rather than a slider, because this is used one-handed, on a phone,
in gloves — and a slider needs a grip a glove does not have. Choosing a speed starts the
animation, so the control is never dead on a paused figure.

Scrubbing gives you frames; slowing gives you the movement, and they are not substitutes.
A counter at full speed is a smear. `tools/speed.mjs` asserts the rate really does halve
at each step on both engines — it needs Playwright, so it is not in `npm run check`.
4. **Side-by-side correct versus common error** — Lutz beside flutz, shoulders checked
   beside shoulders opening early. Same rig, two state tracks, one clock. Teaches something
   video cannot, because you can stop it and the two stay aligned.
5. **The prose is a first draft by a non-expert**, and now there is forty times more of
   it. The sixteen turn passages are the highest-value thing for a coach to read, because
   correcting one fixes two pages.

## On reading the governing bodies

Worth writing down, because it keeps coming up.

British Ice Skating publishes the *shape* of the Skills 1–8 framework on the open web —
the five assessment pillars, the progression — but the element-level requirements live in
PDFs (the Skills Handbook, the Skills Definitions, the per-level guidance) and coach
material appears to sit behind a login. Fetching a page returns readable text; fetching a
PDF does not. So the practical route is a human downloading the documents into the repo
folder, after which they can be read directly.

`sources/` exists for exactly this, is gitignored apart from its manifests, and each
subfolder's `MANIFEST.md` lists what to fetch and why.

Two live points:

- **BIS updates the National Skills Tests on 01/10/2026, additively.** No exercise is
  replaced or removed and the elements themselves are unchanged: Skills 1–7 gain one or
  two exercises each, Skills 1 and 3 gain completion options, Skills 8 changes sections 2A
  and 2B. So writing against the current guidance now is safe and October is a second
  pass, not a rewrite. There is a preview playlist, so both versions can be ready in
  advance.
- The old NISA **Field Moves** manuals still floating around club websites are legacy.
  Do not build the schema around them.

The house rule does not change: descriptions are written from scratch, diagrams drawn from
scratch, and a syllabus entry carries `sourceUrl` and stays unverified until someone has
checked it against the current published version. `docs/style.md` is the standing
reference for how all of it is written.

## What needs a skater, not a developer

- Validating the poses against video and, eventually, a coach.
- How much pitch a real toe pick takes — needed before any toe jump is keyframed.
- Whether a waltz jump lands at the front of the blade, as currently drawn.
- Whether the corrected waltz landing looks like a waltz landing. The lean is now on the
  right side of the circle and about 11° at its deepest, which is shallow for a landing;
  whether it should be deeper is a judgement the geometry cannot make.

## A note on git

Every git command run against this folder through Claude's device bridge leaves a `.lock`
file behind, including read-only ones like `git status`, and `HEAD.lock` then blocks all
writes. The working split is: Claude edits files, the human runs git. Running the Cowork
task on the computer rather than in the cloud avoids this.
