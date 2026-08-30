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
worker; **seventeen checkers in the `check` chain, all green** — count them out of
`package.json` rather than trusting a number in prose, which this line was wrong about for
four sessions — plus `npm run ankle` and `npm run drift`, which report rather than fail.

**Content:** 254 elements — eight plain edges, thirty-two one-foot turns, sixteen two-foot
turns, thirty-two twizzles, thirty-six transitions, **a hundred and twelve clusters**, seven
jumps and three held positions. 316 pages build.

*(That paragraph read 182 / 187 / 4,719 until 30/08/2026, before the syllabus half and the
finishing pass below.)*

*(An earlier revision of this file said 46 and then 62. Both were wrong by two — I was
adding up rather than counting the files. Count with `ls src/data/elements | wc -l`.)*

**A terminology correction worth keeping.** The first draft of this repository called
three turns, brackets, rockers and counters "two-foot turns". They are not: BIS defines a
*one foot turn* as a rotational movement on one foot, and a mohawk or choctaw as a turn
from one foot to the other. The names are now used the way the sport uses them.

**Written 30/08/2026:** the syllabus half, **all eight tests** — 48 entries, 415 element
references — on machinery built the same day: an `exercises` collection, exercise pages,
the test's element list derived from its exercises, and `tools/syllabus.mjs` asserting the
whole thing back against the BIS PDFs. What is left on it is **verification, not
transcription**: nobody qualified has read a word of the prose. See *The syllabus half*
below.

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
    npm run check      # harness, reach, shin, blade, boot, arms, lean, twofoot,
                       # continuity, tracing, contrast, syllabus, build, links, freefoot
    npm run drift      # house tics across the prose. A REPORT, not a check —
                       # run it after every batch of writing, and again after fixing
    npm run dev        # http://localhost:4321/figureskating/ — THERE IS A BASE PATH

**The dev server does not survive a `content.config.ts` schema change**, and a long-running one
does not survive a large batch of new content either: on 30/08/2026 it had been up two and a
half hours through two schema changes and seventy-two new files, and it stopped answering
altogether. `npx astro dev stop`, `rm -rf .astro`, start it again. Restarting it is also the
only thing that surfaced four dangling content references, because `astro build` logs those as
errors and **builds anyway** — see *Do not trust the build to fail* below.
    npm run dev

`check:freefoot` runs LAST. It was RED on purpose from Session 05 to Session 10 and is now
**GREEN** — see *The free leg folded and unfolded* below. It stays at the end of the chain,
because a pose check is where poses fail and the argument for keeping one honest red out of
everyone else's way still holds if it goes red again.

`npm run check` must pass before and after any change, with no exception any more. It is fast
and it has caught every class of error listed below at least once.

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
| free-foot point | the boot holding the ankle square | `ANKLE_MAX` is 30°, measured; `ANKLE_POINT` 10° by default |

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
- **A filter that lists what to hide will absorb the next thing you add.** The home page's
  featured list excluded `edge`, `turn`, `transition` and `combination` — every kind that
  existed when it was written — so the twenty-four twizzles added on 29/08/2026 fell
  straight through it and landed alphabetically in amongst the seven jumps. Nothing broke,
  nothing failed, and it would have shipped. A listing filter names what it shows.
- **Reviewing the element that happens to be open is not sampling.** The whole design pass
  was reviewed on the waltz jump because it was the page that was open. The spiral has
  since been the element that would have caught the problem twice: `framing.mjs` found it
  clipping 18 px and 20 px at both ends, and its rear view has the limbs overlapping in 73
  frames of 81 where the waltz jump has 1 in 70 — so a wrong depth sign would have been
  all but invisible on the move under review and obvious on the one that was not. **Rig
  changes get shot on the spiral first and the jump second**, and anything that can be
  asserted across all elements should be a checker rather than a screenshot.

## The syllabus half — begun 30/08/2026

**The exercise is the unit.** A skater says "Skills 3, exercise 4", so that is what has a
page. A test owns exercises, an exercise owns elements, and **the test's element list is
derived from its exercises** rather than written twice. The collection previously called
`exercises` — off-ice physical capacities, always empty — is now `conditioning`, which is
what it always meant.

**One entry per exercise, not one per generation.** October 2026 is mostly additive, so an
exercise carries `syllabus: current | october2026 | both` plus, where it was really
altered, one sentence saying how. 45 entries rather than 79, and no second copy to drift.

**`tools/syllabus.mjs`, the eleventh checker.** Four assertions, and the fourth is the one
with teeth:

1. Every reference resolves; exercises within a test are numbered 1..N with no gaps.
2. A test with exercises carries no element list of its own.
3. **The generation flag matches the document** — read straight out of `sources/bis/` with
   `pdftotext`. A flag cannot quietly disagree with the paper it came from.
4. **Every edge code the document names is reachable from the elements the exercise lists**,
   as an entry or — through `exitState` — as an exit. This is what catches an element left
   off a list, which is the failure mode of transcription and the one thing nobody notices
   by reading.

Assertion 4 **failed on its first run** and was right to: Skills 1's slalom has a backward
side, on two feet, and I had listed only the four forward changes of edge. Broken on purpose
afterwards: a bad test reference 2, a duplicated exercise number 1, a wrong generation flag
1, a dropped element 1, a test keeping its own list 1.

Because `sources/` is gitignored, assertions 3 and 4 **skip with a notice** on a clean
clone rather than failing. A checker that fails for want of a document nobody may
redistribute would simply get switched off.

### Skills 2 to 7 — written 30/08/2026

Forty exercises added in one pass, the checker run after every level and broken on purpose
twice more to confirm it was still live at the far end (a dropped crossover on Skills 7
exercise 7 produced EDGE; a wrong flag on Skills 6 exercise 6 produced GEN).

What the levels needed that Skills 1 did not:

- **Clusters the guide has no page for.** A rocker into a mohawk, a double 3-turn into a
  mohawk, a counter into a twizzle, a 3-turn with a change of edge into a choctaw. These are
  listed as **the elements they are made of**, with a `notCovered` line saying the pairing
  has no page of its own. `choctaw-three-rocker` is the one three-turn cluster that does
  have one, and Skills 7 exercise 7 uses it.
- **Three genuine gaps, named where they occur.** The **triple 3-turn** (Skills 5 ex 1) —
  the guide has singles and doubles and nothing at three. The **slip chassé** (Skills 5
  ex 3) — BIS's own step with both blades flat on the ice, the `onIce` gap again. The
  **two and a half twizzle** (Skills 7 ex 3) — twizzles are keyed by rotation count because
  the count decides the exit, and there is no element at that count.
- **A probable error in BIS's October Skills 6.** Exercise 6 writes the second cluster's
  intermediate edge as RBO; a bracket stays on one foot, so from LFI it can only be LBO,
  and Skills 7 writes the mirror correctly. The exercise page says so in a sentence. Worth
  raising when approaching BIS.

Two more altered exercises were confirmed against the documents while writing: Skills 2
exercises 3 and 4 gain *minimum two lobes on each foot*, and Skills 7 exercise 1 changes
from ending to repeating. Both are in `changesInOctober`.

**Prose drift, and the check for it.** Forty paragraphs written in one sitting grow house
tics that are invisible while writing. Three scans over `src/data/` find them: n-grams over
the bodies (5-grams in 3+ files, 7-grams in 2+), **n-grams over the `summary:` lines alone**
— nine of forty-five summaries had used *run straight into*, and the two bracket exercises
had summaries identical but for one word — and the first three words of every paragraph,
which caught *The second side* opening six of them. Fixed by rewriting the weaker instance
each time. What is left repeats because the exercises do.

### Skills 8 — sections, not exercises

Martyn's call, 30/08/2026: **three entries, one per section**, with October's 2A and 2B held
inside Section 2 rather than given entries of their own. They are two published versions of
the same section, identical until the double twizzle, which is the same device as the
"optional direction" already written inside Sections 1 and 3 — so `changesInOctober` carries
the difference and the element list covers both routes. `order` stays 1..3 and the numbering
assertion is untouched.

Two things had to change to hold it:

- **`unit` on the exercises collection** — `exercise` (default) or `section`. The pages print
  it instead of assuming "exercise", which was true for seven tests and would have read as
  nonsense on the eighth. Skate Canada and USFS will want their own word again.
- **`sections()` in `tools/syllabus.mjs`** — Skills 8 heads its sections `SKILLS 8 - SECTION
  n` rather than `EXERCISE n`, and the October 2A page comes out of `pdftotext` overprinted
  on itself as `SKILLS88--SECTION SKILLS SECTION22A`. Headings are now recognised by SECTION
  followed by a digit, keyed as `SECTION n` with the A/B dropped, and bodies under a repeated
  key are **appended rather than overwritten** — so Section 2's body is 2A and 2B together and
  assertion 4 sees every edge either version names. Broken on purpose afterwards: a wrong flag
  on Section 1 gave GEN, a dropped bracket on Section 2 gave EDGE.

Skills 8 is the most gap-heavy page in the guide, and honestly so: the **pivot movement**
(section 1), the **push or touch down** before the double twizzle and the **steps crossed
behind** (section 2, and they appear at no other level) are all outside the model. October
also writes the middle crossed step as crossed behind where the current document writes it
crossed in front — recorded in `changesInOctober`, and not in BIS's announcement either.

**The prose is the open question, not the data.** Forty-five exercise paragraphs by a
non-expert, every one `verified: false`. Correcting one corrects the page every skater at
that level lands on, which makes this the highest-value thing in the repository for a coach
to read.

### The October documents change more than the announcement says

Re-diffed mechanically on 30/08/2026, exercise by exercise. The manifest's earlier reading —
"almost nothing… no sequence was altered" — was wrong. **Four existing exercises were
altered**, none of them mentioned in BIS's update announcement:

- **Skills 1 ex 4**, slalom: the one-foot power changes become *optional*. A relaxation.
- **Skills 2 ex 3 and ex 4**: a *minimum two lobes on each foot* requirement added.
- **Skills 3 ex 5**, forward spirals: reworked — the toe-assisted step and the rotational
  direction both become optional, and an alternative entry appears without the hop.
- **Skills 7 ex 1**: "this completes the exercise" becomes "then repeat the sequence".

The Skills 3 one matters beyond itself: the toe-assisted hop was the **last item on the
manifest's gap list**, and October turns it into an optional variant of an optional variant.
A Skills 3 page can be complete and honest without it, as long as it says so.

An earlier manifest note also had the Skills 1 slalom backwards — it said the current
version "has no one-foot option", when in fact the current version *requires* it. Exercise
count, not content, is the reliable way to tell the two generations apart.

## Search, and the other names a movement goes by — 30/08/2026

Two of Martyn's, and the second is what made the first worth building.

**Other names.** The guide keeps the governing body's word and never translates it silently —
that rule does not move. But a skater arrives holding their coach's word, and a page filed
under a name they have never heard is a dead end. So an element may carry `aliases`: other
names for the same *movement*, written foot-neutrally, shown under the lede and gathered on
**`/elements/other-names/`** — the same shape as `/tests/older-names/`, and for the same
reason. They are ways IN, never renamings.

**Nothing goes in without a source**, and the list is short on purpose:

| the other name | the movement | where it comes from |
|---|---|---|
| open chassé, simple chassé | chassé | BIS's own definitions document heads it `SIMPLE/OPEN CHASSE'` |
| slide chassé | slip chassé | the same document, `SLIP/SLIDE CHASSE'` |
| three jump | waltz jump | Merriam-Webster, which defines it as this jump and says "also called waltz jump" |

Martyn also reports that coaches call the **lunge** a *drag*. There is no lunge page — it is
outside the model, see *What the rig cannot hold* — so the name is recorded there, ready for
whenever the pose can be drawn. **The origin of "three jump" is not something anyone here has
sourced**, and it is not guessed at on the page.

## Search — 30/08/2026

No server and no search service: this is a static site read on rink wi-fi. So search is a file
the browser already has.

- **`src/pages/search.json.js`** emits the index at build time from the collections, so a page
  cannot exist and be unsearchable. **307 records, 58 KB**, and the service worker caches it
  with everything else — which means search keeps working with the signal gone, the one thing
  a guide in a cold rink actually has to do.
- The fields are chosen for how a skater types: the name, the **other names**, the **edge
  code**, the summary, the kind.
- **`src/lib/search.js`** is the ranking, as a pure function. It lived inside the page's inline
  script for twenty minutes, which put the only logic here with no other expression somewhere
  nothing could import and therefore nothing could test. The page uses a *bundled* script so it
  can import it; `tools/search.mjs` imports the same function. One copy.
- An edge code typed in full outranks everything (100), an exact alias next (80), then name,
  then description. **On a tie the shorter name wins** — a real relevance signal, not a
  cosmetic one: it is what puts the three turn above the choctaw-three-rocker for *lfo three*,
  the plain edge above the twizzle on it for *rbi*, and the element above the exercise that
  merely mentions it for *counter*. Removing that one clause breaks five of the ten checked
  queries.
- 48 px input, full width, whole-row targets: one hand, gloves, a phone.

**`tools/search.mjs`, the fourteenth checker.** Four assertions: every built page has a record
(counted against `dist/`, because the reader's route in is the page and not the content file);
every record points at a page; **no alias is ambiguous** — an alias that lands on two movements
is a dead end wearing a signpost; and **ten representative queries return the right first hit**,
with three that must return nothing. All four broken on purpose. It runs after `check:links`
because it reads `dist/`.

## Do not trust the build to fail — 30/08/2026

`astro build` **logs a dangling content reference as an error and exits zero.** Four
`bracket-crossroll` pages named a prerequisite that did not exist, and `npm run check` was green
throughout: the build did not fail, and `links.mjs` had nothing to find because the broken
reference never reached the HTML. It surfaced only when the dev server was restarted after two
and a half hours.

The underlying rule is worth stating on its own: **a cluster is only real if every element in it
is real from the state it starts at.** Transitions generate from some entry edges and not others
— a cross roll, a crossover and a chassé are skated from outside edges, which is what the
elements are rather than a limitation. A bracket changes edge, so from an outside entry it exits
on an inside one, and there is no such thing as a cross roll from an inside edge. Four of the
eight `bracket-crossroll` entries were therefore impossible. British Ice Skating write it once,
at Skills 8 section 1, as *LBI bracket-cross roll* — an inside entry, which is the half that is
legal.

`gen-derived.mjs` now refuses to write a cluster whose chain reaches a state where its next
element does not exist, and `syllabus.mjs` asserts that every prerequisite resolves, because the
build will not. The four pages are in `_to_delete/bad-clusters/`.

## Three skills, in `.claude/skills/` — 30/08/2026

Written into the repository rather than an account, so they are versioned with the thing they
describe and a session working here picks them up:

- **`add-element`** — the full procedure for a derived element family, and the five traps that
  have each cost a session: the impossible cluster above, the twizzle slug, the "turns" noun,
  the bare `notCovered:`, and two summaries that read the same.
- **`rig-verify`** — measure, render, rasterise, look. Carries the near-miss where fixing a
  degenerate projection would have concealed a real pose fault, and the two known glyph problems
  so they are not rediscovered.
- **`new-checker`** — the house pattern: an expectation that does not come from the thing being
  judged, broken on purpose, mutation counts in the header, per frame rather than per keyframe.

## Three axes, three glyphs — 30/08/2026

Martyn reported the rear view's free boot twice, and the second time was after the pose was
already fixed. He was right both times, and the second one was a different bug.

The choice of boot glyph was `prof >= endo`: is more of the boot in the view plane, or pointing
at the camera. **That is a two-way test over a three-way question, and it never asked the one
that mattered** — `prof` adds the lateral and the vertical parts together, so a boot with *no
lateral component at all* still scored high through its vertical part and got drawn in profile.
A picture of the boot from the one direction it was least being seen from.

The waltz jump's free boot points about 45° down and 45° along the track. Of its three axes the
one most nearly aimed at the camera is its **up axis**, in every frame — 0.72 to 0.76, against
0.64 to 0.68 for its length and 0.08 to 0.14 for its width. A boot whose up-axis faces you is a
boot seen from above its own opening.

**It had a glyph all along.** `bootTop` is the plan view and the top-down view has drawn it
since the first session; the profile views could not reach for it. The rule is now the honest
one — the axes are orthonormal, so their camera components square to one, and the picture is the
view down whichever axis is most aligned with the camera: length → `bootEnd`, width →
`bootSide`, up → `bootTop`.

**677 rear-view frames** of a free boot moved from a false profile to a plan view; 44 still take
the profile, which are the frames where the lateral axis genuinely faces the camera. The skating
boot is untouched and is what it always should have been — a pure profile from the side (2,208
frames), a pure cross-section from behind (2,208). `docs/model.md` has the table.

The oldest open design item in the repository, open since Session 06, and it closed by asking
the question in three parts instead of two.

**And then a fourth glyph, Martyn's question.** Once the plan view existed, *which face* is
toward the camera decides what is actually there — and mirroring the top of a boot does not draw
its underside. **285 of the 697 plan frames** have the sole toward the camera: every plan frame
of the spiral and its checked variant, most of the teapot's, and none of the extended edge's,
because a raised or reaching free foot shows its underside to a camera behind the skater and a
trailing turned-out one does not. `bootSole` draws what is actually there — the runner whole,
the pick, the mounting plates — which makes it the most model-relevant picture in the guide,
since the blade is what all of this is about.

## The free leg folded and unfolded twice, and that was both boot bugs — 30/08/2026

Martyn, watching the waltz jump: the free boot rotates a couple of times in the top-down view
with no visible reason, and the rear view draws it in profile pointing at the ice, which the
leg position makes impossible.

**Both reports are one fault and it is the pose, not the renderer.** The free leg's extension
was authored inconsistently across the landing and run-out — 45%, 82%, 56%, 54%, 82%, 82% of
reach — so between keyframes the leg folded and unfolded, the shin swept through **horizontal**,
and `bootDir` builds a free boot square to the shin. A boot square to a horizontal shin points
straight at the ice. Identical to the failure that made the lunge undrawable.

**The near-miss is the part worth keeping.** The top-down heading comes from the horizontal part
of the boot direction, and that fell to **0.071** of unit length, so the heading looked like
noise. Deriving it from the boot's lateral axis instead held steady at −9° through the whole
stretch — and would have been a **lie**. The rotation is real: the boot genuinely pitched from
toe-forward, through pointing at the ice, to toe-backward. The renderer was drawing an
impossible pose faithfully. *A degenerate projection and a real motion look identical in one
frame; only the 3D vector tells you which.*

Fixed by holding the extension near 90% of reach with the free foot's height following the hip,
and by letting the free leg pass **low** through the takeoff swing, which is what a swing does.
The solver found the range; the numbers were authored by hand, because the rule about optimisers
editing poses has three failures on record and one of them moved a landing foot half a metre to
minimise this exact angle.

**`freefoot.mjs` is green**, first time since Session 05. 85 frames over the limit in four
stretches, worst 85.9°, became zero, worst 59.1°. Its header said the fix was the pose or the
limit. It was the pose, in all four stretches, and `ANKLE_FREE` never needed touching.

## `tools/continuity.mjs`, the thirteenth checker — nothing drawn may jump

**Nothing in the repository could have found the spin.** Every checker here asserts a property
of one frame, and a glyph correct in every frame and wrong between them passes all of them. That
was a whole missing class.

The rig interpolates smoothly, so everything drawn is a continuous function of the clock, and a
jump between adjacent frames is one of three things: a degenerate projection, a branch change,
or a pose nothing could skate. This file finds all three and says which. **11,514 adjacent-frame
comparisons** across six moves and three views, read off the markup the renderer actually
produced rather than a re-derivation — which needed `data-boot`, `data-foot`, `data-heading` and
`data-horiz` adding to the top-down glyph, since nothing could read it before and therefore
nothing could check it.

Broken on purpose with the real bug: restoring the old free-leg keyframes gives **5
discontinuities, the first "the glyph turns 155° between frames 136 and 137"**.

**What it reports rather than failing**, because these are design questions:

- **The rear view spends 110 to 149 frames of about 192 on a near-tie** between two of the
  three glyphs, on four of the six moves. That number led straight to the fix below — it was
  the second half of Martyn's report, turned into a measurement. It now means something
  permanent rather than a fault: a boot at an oblique angle where no single flat glyph is wholly
  honest, which is a property of drawing a solid with three orthogonal views.
- The glyph switches view about ten times in the waltz's rear view.

## The pairings — 30/08/2026, Martyn's call

Six runs the syllabus writes as one thing were listed as their parts with a `notCovered` line
each. They now have pages, so **the animation shows one turn running into the next**, which is
the reason for doing it: `double-three-mohawk`, `rocker-mohawk`, `bracket-crossroll`,
`counter-two-and-a-half-twizzle`, `three-coe-double-twizzle`, `rocker-counter-double-twizzle`.
48 pages.

**A cluster may now contain a change of edge, a cross roll and a twizzle**, not only turns and
steps — and `buildTrace` needed no changes at all, because `join` was stored on the element
rather than inferred from whether it was a turn. That decision was made for the transitions and
it paid here.

Every one of the six lands on the edge BIS's next numbered step names, with nothing told.

`tracing.mjs`'s `CHAINS` was a hand-kept copy of `CLUSTERS` and is now derived from it — 208
combinations rather than 184, and six new clusters that a hand-kept list would have checked none
of.

**One hole closed on the way past.** A bare `notCovered:` with nothing under it is null, not an
empty list: Astro rejects the file while every tool here reads it as empty, because they parse
frontmatter with regexes. It happened to four exercises, `syllabus.mjs` passed, and the build
failed on the Mac. The build is the only real YAML validator in the chain and it is the one step
that cannot run in the bridge VM, so `syllabus.mjs` now asserts it directly.

## Finishing edges and turns — 30/08/2026

Martyn's sequencing: the edges-and-turns half is what gets shown to people, so it gets
finished first. Four elements went in, all four defined by British Ice Skating and all four
confirmed against their own sequences rather than assumed. **24 pages, four gap lines closed,
and one exercise with an empty `notCovered` for the first time.**

- **The triple 3-turn** — one entry in `CLUSTERS`. A chain costs the same whatever its length,
  because every edge in between comes out of `exitState`. Skills 5 exercise 1.
- **The 2½ twizzle** — one entry in `TWIZZLES`, both flags computed from the count. Skills 7
  exercise 3, entered out of a backward inside counter.
- **The crossed step behind** — and it takes the **cross roll's** flags, not the crossover's.
  BIS's definition constrains placement and says nothing about the edge, so the flags had to
  come from the sequences: every XB in the syllabus, both generations, runs outside edge to
  outside edge. Skills 8 section 2, and nowhere else.
- **The slip chassé** — the chassé's flags exactly, and their sequence agrees: RFO slip chassé
  into LFI is what `exitState` gives. Skills 5 exercise 3.

**Skills 6, 7 and 8 now carry the championship entry requirement** — the published minimum for
Basic Novice, Advanced Novice and Junior/Senior. It also names the *National* tests, a second
BIS ladder this guide does not cover and says so.

### `syllabus.mjs` grew a fifth assertion, because the fourth could not see the new work

Dropping the 2½ twizzle from Skills 7 exercise 3 **passed assertion 4 cleanly**. Assertion 4
works on edge codes, so it only sees an element whose entry or exit the document writes down —
and a turn reached through another turn sits at a *derived* edge the paper never names. The
twizzle's entry is a counter's exit, so there was nothing to catch.

Assertion 5 reads the other thing the documents contain: **their words for the movements**.
Each of BIS's names maps to the model keys that would satisfy it, and an exercise must list an
element of that kind or name it in `notCovered`. It is weaker than 4 and blind to a dropped
mirror — catching that would mean parsing their whole sequence into states — but it catches a
kind left out altogether, which is what happened here.

Two things it taught on the way in:

- **Read the sequence, not the page.** The first draft matched the whole exercise block and
  reported three exercises that were already right, because Skills 1's *learning objectives*
  offer "3 turn or mohawk" and Skills 3 exercise 6 lists "introduction to a double twizzle" as
  an objective of an exercise that is a 1½. An objective is a statement of purpose, not a
  requirement to skate something. The body is now cut to the numbered steps.
- **BIS write "3 turn"; this guide writes "three turn".** So the escape that lets an honestly
  named gap pass had to accept both spellings, or the guide's own prose fails its own checker.
  One gap line on Skills 1 exercise 3 was improved rather than exempted: it now names the
  three turn and the mohawk the document offers, as its neighbour on exercise 2 already did.

### `tools/drift.mjs`, the prose check made permanent

Session 08 ran the three drift scans by hand and wrote that they "have to be run after a
batch". They are now `npm run drift`. It **reports and does not fail**, because repetition is
not automatically a fault — technical phrasing repeats because the elements repeat, and four
October entries opening "New on 01/10/2026" is deliberate.

One thing had to be got right before it was usable: **the unit is the passage, not the file.**
The derived tier keys its prose on direction and edge and never on the foot, so one passage is
deliberately written into four or eight files. Counting files reported every derived passage in
the repository as a tic. Identical bodies are now collapsed before anything is counted, URLs
are stripped, and summaries are scanned separately with the edge codes masked out.

It earned its place immediately, on this batch:

- **Two summaries came out word for word identical to existing ones.** A crossed step behind
  produces exactly the states a cross roll produces, and a slip chassé exactly those of a
  chassé — and the generated summary was keyed on the *join*, which all five share. A summary
  that does not distinguish is doing nothing. The two that collide now say what the foot does;
  the three that do not collide were left alone.
- **Two of the new paragraph openings joined existing threes.** Rewritten — the new instance,
  never the settled one.

## Two blades on the ice — decided and built 30/08/2026

`onIce` was the open question in four consecutive handoffs. It is answered: **a pose can
hold two blades, and `skate` did not become an array.**

`skate` stayed single-valued and changed job. It is the **reference blade** — the one
`buildPath` builds from and the one the hip hangs off — and `null` still means airborne. A
second blade is declared on the foot itself, `onIce: 'blade'`, with its own direction of
travel where the feet oppose. British Ice Skating's own slip-step definition puts the weight
over one leg while both blades are down, so this is their shape as well as ours.

**The second blade's edge is derived, never stored.** Two blades are on one circle, one
circle is one lobe, and one lobe is one `lobeSense` — so the second edge letter falls out of
the first blade's state and the second foot's direction. `secondFoot` in `skating.js` is four
lines. The alternative would have made RFI & LFI representable.

**BIS's paper agrees, and neither was told.** The Skills 1 slalom writes its two-foot power
changes as pairs — RFI & LFO, RFO & LFI, LBI & RBO, LBO & RBI — and every one has equal
lobeSense. `tools/twofoot.mjs` reads them straight out of the PDF and puts `secondFoot` back
against them, which makes it the only assertion in that file with an independent source.

**`lean.mjs` did not have to be weakened.** The expected cost of this change was a checker
scoped out, and it was not paid: the outside of the left foot and the inside of the right
foot are both the skater's left, so two blades bite on one side and one lean satisfies both
routes on both feet. The file now asserts that *every* blade on the ice leans the same way,
and the rendered rear view shows it — two edge dots, same side of the body, two colours.

**`tools/twofoot.mjs`, the twelfth checker.** Five assertions, each broken on purpose: a
second blade declared on an airborne pose (8 failures), a free foot declared on the ice (39),
two blades in the same place (22), the second blade's sense flipped (321 frames), and the
derivation inverted against BIS's pairs (4). The z assertion is the one `docs/model.md` asked
for: the lunge "would have passed every checker with the trailing foot lifted 30 cm".

**`shin.mjs` earned the generalisation on its first run.** The five checkers that read
`skate` now read "every blade on the ice". The first draft of the new pose failed shin lean
at 31 and 32 degrees — **on the second blade**, which the old predicate would never have
looked at. Sweeping hip height against shin lean showed the angle is almost entirely leg
extension and barely lateral offset (29° at hipZ 92, 25 at 94, 21 at 96), so the hip came up
and the feet stayed put. Fixed by measurement, not by argument.

**The pose is `twoFoot`, on `/rig`**, with no element page — as the teapot was, and for the
same reason: BIS names no element called a two-foot edge, and inventing one to fill a gap is
the thing this repository does not do. What it closes is the *rig* half of Skills 1 exercise
4's gap; the `notCovered` line was rewritten to say exactly what is still missing rather than
deleted.

### What two blades still cannot do, and the two gaps that turned out not to need them

**A change of edge in the rig.** A power change passes through a flat, where the lobe has no
centre and `lean.mjs`'s TRACK route has nothing to assert against. So the rig holds the
position either side and the edge diagram draws the change — the division of labour this
repository has always had.

**A flat.** BIS defines it as the *double* tracing of a skate that is straight: two lines, not
a third colour, which is worth knowing before anyone reaches for a token. `edgeCol` is a bare
ternary in five places and would silently colour a flat as an inside edge.

**Two gaps were misread, and reading the definitions document properly fixed both.**

- **The slip chassé is not a two-blade element.** BIS defines *slip chassé* and *slip step*
  separately. The slip **step** is the one with both blades flat. The slip **chassé** is a
  simple chassé whose free foot slides off the ice in front rather than being lifted, and
  Skills 5 exercise 3 asks for the chassé. The `notCovered` line written on 30/08/2026 gave
  the slip step's definition under the slip chassé's name; it is corrected, and the gap is now
  the same class as open versus closed mohawks — free-foot placement a blade cannot draw.
- **The crossed step behind is a defined BIS element**, and its definition places the free
  foot on the outer edge side, exactly as the crossed step in front does. So it draws a
  crossover's tracing and is one more entry in `TRANSITIONS`. Not built — it is one of the
  cheap wins still outstanding.

**The push or touch down stays a gap, and now for the right reason.** The rig can hold it;
BIS's definitions document names no such step, so there is nothing to link to. The line was
rewritten to say that instead of blaming the rig.

## The arms — applied 29/08/2026

They were never undepthed. They were **depthed wrongly**. `viewProfile` drew the legs sorted
by `NEARER`, then the torso, then both arms in fixed `L, R` order, so arms came last
unconditionally: an arm behind the chest drew in front of it, and the further arm drew over
the nearer one whenever L was the far side. Draw order is a depth claim whether or not
anybody decided it.

Now one sorted list, at one granularity, against one expression of the camera. Arms split at
the elbow, torso at the waist, legs at the knee — a limb ordered as one piece gets one end of
it wrong the moment anything passes between its ends. The legs were split on measurement, not
argument: across 2,010 samples the knee and the blade straddle the torso's depth in 227.

- **Casing is retracted from its own joint, never suppressed.** The invariant is
  casings = segments − 1 and it holds in every frame of every move.
- **The elbow is dropped past a threshold of one stroke width of *projected* bend**, joint
  circle included. `model.md` already said to stop drawing the elbow near end-on; that rule
  predated the joint circle.
- **`moves.js`'s `LH`/`RH` override was silently discarded.** The default-carriage loop
  assigned unconditionally, so an authored hand was computed, stored and overwritten before
  anything read it. One guard on an `authored` flag fixes it, and that flag — not a
  measured threshold — is also what decides whether the guide names which hand is which.
- **One asymmetric pose, `spiralCheck`**, sharing the spiral's legs and authoring only its
  hands: left arm across the body, right reaching back. It is the pose a coach names when
  they say a spiral is held against a checked shoulder line, and the spiral is where it
  shows — its rear view already has limbs overlapping in 73 frames of 81. `verified: false`,
  like everything. It appears on `/rig` with no element page, as the teapot did.

**`tools/arms.mjs`, the tenth checker.** Six assertions across 3,208 frames and 30,991
segments, every one broken on purpose first:

| broken | failures |
|---|---|
| the sort removed | 13,263 order |
| **torso drawn as a layer instead of sorted** | **7,005 order** |
| casing not retracted at the joint | 26,659 casing |
| arms drawn heavier than the skating leg | 11,123 ink |
| the renderer using the 3D bend instead of the projected one | 447 elbow |
| one hand not drawn | 3,208 hands |
| the `LH`/`RH` guard removed | the authored hands vanish entirely |

That second row settles the one design question Session 05 left open. **The torso is in the
sort, not a layer** — assertion 1 fails the layer option by construction, because it does
not sort the torso and so its drawn order cannot be monotonic in the depth it drew. That
argument came out of writing the checker, not out of the pictures.

## The boots were drawn lying on the ice, in every rear view — 29/08/2026

Martyn found it on the waltz jump's rear view. It was every rear view of every element.

The end-on boot glyph took its roll from an up-axis built **in the view**: project the
leg, then subtract the projected boot direction. That subtraction is right side-on, where
the boot's direction lies in the view plane. End-on it is worse than useless — that branch
runs *because* the boot points at the camera, so the vector being removed is near-zero and
its direction is noise. It annihilated the up-axis's vertical component, `roll` collapsed
to ±90°, and which way the boot fell was decided by the sign of the pitch.

**1102 of 1828 end-on glyphs past 60° of roll.** The extended edge, checked exhaustively
rather than sampled, was **379 of 379**, every frame, spanning only −90.0° to −91.7°.
After the fix, 0 of 379, spanning −7.1° to −10.4°.

Three things worth keeping:

- **An authored zero hid it for four sessions.** A skating pitch of exactly 0 makes the
  subtracted vector exactly zero and the subtraction a no-op. The spiral and the teapot
  are authored that way, and their skating boots scored **0 of 642**. The element the
  standing rule says to
  shoot first is the one element that could not show this. Authoring a physically
  realistic half-degree of pitch is what turns it on; authoring nothing hides it. **Shoot
  the spiral first — and conclude nothing from it alone.**
- **The up-axis now comes from the ankle**, which is where `ankleOf` put it, so the boot
  is drawn about the axis it was built about and the drawn shin enters the drawn boot's
  opening. Deriving it from the knee instead used the second-pass knee, one iteration on
  from the one the ankle sits on — up to **11.4°** apart on the waltz jump. Same fact as
  *Two knees* in `docs/model.md`, seen from the other side.
- **The edge dot was being drawn on feet in the air.** It marks the *biting* edge, so on a
  raised foot it asserts ice contact that `--free` simultaneously denies. Its screen side
  is now derived from the boot's own lateral axis rather than from where the toe points:
  on a skating boot the two agree in **1245 of 1245** glyphs, byte for byte, because a
  blade on the ice lies along its own tracing; on a free boot they part company, which is
  exactly where the wrong dot was. Removed from **583 of 583** free glyphs, each by one
  circle and nothing else.

**`tools/boot.mjs`, the ninth checker.** Two assertions, absolute, across every frame of
every move in both profile views: the edge dot is on a skating boot and never on a free
one; an end-on boot's drawn roll equals its own up-axis, and a skating boot is never past
30° of it. The expected roll comes from where `ankleOf` put the ankle, not from the
renderer, so the two cannot agree by being the same expression.

**A third defect of the same shape — RESOLVED 30/08/2026.** The side-on branch drew with a 2×2
of two projected 3D axes, which goes singular where they project onto the same screen line —
263 of 263 extended-edge frames, 100 of 100 teapot frames. What those frames held was a boot
seen from above its own opening, and there were only two glyphs. There are three now: see
*Three axes, three glyphs* below.

## `freefoot.mjs` was reading keyframes for a renderer that interpolates — 29/08/2026

Now per frame. The waltz jump's free boot passes **every keyframe at 55.8°** and reaches
**88.6° at f = 0.428**, in frames the checker never looked at. Same gap `lean.mjs` was
rewritten to close two sessions earlier, in this repository, for the same reason.

The three held positions all pass: spiral −55.7°, extended edge −53.6°, teapot +55.2°.
Only the waltz exceeds the limit, in three stretches, all of them between keyframes.

**It is red and it stays red until a skater looks at it.** The 60° limit and the
`ANKLE_FREE` behind it are a coach's call, and Session 05 measured that no value of
`ANKLE_FREE` helps all four positions at once — two improve and two get worse, and at 40°
the four span 0.1° to 84.3°. The fix is the pose, or the limit, and neither is a
developer's to choose.

Also worth saying out loud: what this file measures is a property of the **leg**. The
boot-to-shin angle is fixed at exactly `ANKLE_FREE` inside `bootDir` by construction, so
"the boot holds the ankle square" is not a claim it could ever falsify.

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
3. ~~**Held positions.**~~ Partly done 29/08/2026 — see the section below. The extended
   edge is built and the teapot published; the lunge, the Ina Bauer and the spin positions
   are outside the model as it stands, and `docs/model.md` says why.
4. ~~**The arms.**~~ Applied 29/08/2026 — see the section above. The fork is folded in and
   gone; `tools/arms.mjs` is the tenth checker.
5. **Re-shoot everything.** The boot roll fix changes every rear view of every element and
   the arms change every profile view of every element, so `shots/` and `shots/positions/`
   are stale across the board. Needs Playwright, so not from the bridge VM.
6. **The British guide.** The documents are in `sources/bis/` and reviewed. See
   `sources/bis/MANIFEST.md` for what is there, what is still missing, and how the
   documents may be used. One gap left in it: the toe-assisted hop.
7. ~~**`onIce`.**~~ Decided and built 30/08/2026 — see *Two blades on the ice* below.
8. ~~**The competition question.**~~ **Answered 30/08/2026: both, in that order.** Finish
   edges and turns first so there is something to show people, then grow into spins, dance
   and competition-level material **on its own tab**, so a beginner is not overwhelmed.
   `docs/gaps-competition.md` holds the backlog and, at the end, the three structural
   decisions the tab should be built on — chief among them that **the tab is a view, not a
   URL namespace**, and that what it shows should be derived from whether an element appears
   in a test the guide holds, never a hand-kept list.

## Held positions, and the three that were put back — 29/08/2026

The handoff queued the lunge, the Ina Bauer and the spin positions as the cheap next
thing. Going to the BIS documents first changed the list: Skills 1 to 8 contain exactly
two held positions, the **spiral** and the **extended edge**, and none of the other three
appears anywhere in the syllabus.

**Built:** the extended edge, which BIS calls a backward outside *extended position* —
Skills 1 exercise 2, held for a third of a circle or three seconds. The rig's sweep is
180° with the position complete a third of the way through, so the held part is that
120°. It is authored on the right foot on purpose: every other held position skates on
the left, and `lean.mjs` had no right-footed pair to check its body route against.

**Published:** the teapot, which has been rigged in `moves.js` and visible on `/rig` since
the first session with no element page pointing at it.

**Put back:** the lunge, the Ina Bauer and the spin positions. Each fails against a
different part of the model, and the write-up is in `docs/model.md` under *What the rig
cannot hold*. The short version: one blade and only one; a boot that pitches but cannot
roll; and `hipYaw` measured from a direction of travel that a spin does not have. The
lunge was not abandoned on a hunch — the whole plausible range of trailing-foot positions
was measured, and there is no legal pose in it.

Two things came out of building the one that worked. Both are in `docs/model.md`: the two
knees, `bootDir` solving from the blade while the renderer draws from the ankle; and the
sensitivity of the free boot's angle in the last centimetre of reach, which is precisely
where a held position sits.

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

- ~~**Element ordering is alphabetical where it should be pedagogical.**~~ Fixed
  29/08/2026. `JUMPS` is now written in learning order — waltz jump, Salchow, toe loop,
  loop, flip, Lutz, Axel — and exports `jumpOrder(name)` so every page that lists jumps
  inherits it rather than sorting for itself. The home page has a Jumps section and a
  Positions section in place of the single alphabetical "Mechanics" list. Martyn spotted
  the original; the twizzles had made it worse in the meantime.
- Positions has three entries. The rest are outside the model — see `docs/model.md`.
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
  Do not build the schema around them. Their level numbers appear in exactly one place:
  **`/tests/older-names/`**, added 30/08/2026 as an addendum for a reader who passed
  something before Skills existed. It carries the Handbook's field moves → Skills
  conversion, names the interim set (1, 2, 3, BN, INT, Adv Nov, JNR, SNR) without
  pretending to expand the abbreviations, and says plainly that the medal tests —
  Inter-Bronze, Inter-Silver and the rest — have **no published equivalent** in Skills.
  It links to no element, because the older schemes' requirements are not in the guide.
  **Two things to add later, Martyn's list:** the years each scheme was in force, and — for
  the medal tests, which convert to nothing — the elements each older level asked for, so a
  reader can find a *relative* equivalent by what was skated. That second one is the
  comparison style.md already endorses: compare elements, never levels.

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

Every git command run against this folder through the device bridge's **shell** leaves a
`.lock` file behind, including read-only ones like `git status`, and `HEAD.lock` then blocks
all writes. The working split is: Claude edits files, the human runs git.

**Corrected 30/08/2026.** That is a property of the bridge VM, not of the arrangement. The
Mac's own shell — the desktop MCP that runs commands natively rather than in the mounted
Linux VM — runs git cleanly: `git status` and a `find .git -name '*.lock'` immediately after
it leave nothing behind. Same route the build has to take anyway, since `node_modules` is
built for macOS and `npm run build` cannot run in the VM at all.


## The pick, built — 30/08/2026

Specified earlier the same day in `docs/model.md` and built in the session after it, from
the touch-point list in that specification. The list was right about the files. It was
wrong about the size of two of them and silent about two findings.

**`onIce: 'pick'`, the third value of the field two blades added.** `pick: true` is gone —
a keyframe flag that `blade.mjs` read as exempting *every* on-ice blade in the frame, which
is backwards for the only pose that would ever set it, and which had never been set. Four
model and render files, five checkers, `PICK()` beside `ON()` in `moves.js`, and one probe
rig, `toePick`, so that the branches are exercised by content and not only by construction.

**`bootDir` takes the contact from the pose rather than a boolean argument.** Seven callers
each computed `onIceOf(pose, w) === 'blade'` and handed the answer in — one derivation in
seven places, and a boolean able to disagree with the pose it came from, which is the shape
`rig-math.js`'s own opening comment warns about. All seven now pass four arguments and
`bootDir` asks. That is not in the specification; it fell out of touching every call site
at once, which is what a change of this shape is for.

**Three rules, not two.** The specification said a picked boot is "planted, pitched past
`MAX_BLADE_PITCH`", which reads as the skating branch with a bigger number. It is not. A
blade takes its direction from the tracing because a blade on ice can only lie along its
own line — but **a pick is not travelling**, so it has no line, and what points the toe is
the REACH: the horizontal direction from the hip to the foot. Taking the tracing instead
was the tempting shortcut, the formula being already written, and it points the toe *at the
skater* on the only move that needs it — a toe loop reaches back on a backward edge, and
back there is +t while the tracing runs −t.

**The renderer's `skating` was three decisions wearing one name**, and they came apart:
`planted` decides weight, `bladed` decides the edge colour and the dot. A picked boot is
bearing load and must not draw pale or vanish with the free-foot toggle; it has no biting
edge and must not take a colour or a dot. The four glyph functions take the contact now.

### Two findings the specification did not have

**The ankle is the constraint, and it decides the pose.** A free foot authors its ankle
angle and the boot's direction follows; a picked foot authors the boot's direction and the
ANKLE ANGLE follows, as whatever the shin and that direction leave between them. Same boot,
same `ANKLE_MAX`, so the same limit — and it turns out to be the first time that constant
has bitten on a pose rather than on a number somebody typed. Measured over the space, `npm run ankle` prints it, and it
is not a slope but three bands. **At a hip of 62 cm and below the boot can be pitched to 89°**
— standing on end, which is what a jab is. **Between 64 and 76 there is no legal pick at
all**, at any pitch or any reach. **At a standing 78 and above only 4 to 12° survives**,
which is barely past the 3.5° a blade already has: a scuff, not a jab. Nobody authored any of
that. **The only way to tilt the boot further with the toe
on the ice is to tilt the whole leg, and the only way to do that is to sink** — which is
what a skater does before they pick. `freefoot.mjs` asserts it.

**A pick is the first contact in this model that is fixed to the ice.** Every foot is
authored relative to the hip and only the reference blade is pinned to the path. A gliding
blade travels with the skater, so that has cost nothing until now; a pick stays where it was
put. Held through a real span of travel its hip-relative position would have to sweep
backwards by however far the hip went — 168 cm over `toePick`'s arc, out of reach within the
first centimetres. So `toePick` is a HELD position, `twoFoot` fashion, and the arc beneath it
is where the skating blade is going and not a claim that the toe is sliding with it.
Expressing a contact that stays put needs an anchor the rig has not got.

### What the entry cost, and why it is not drawn

Authored first as a movement — glide, sink, reach, pick — and it failed twice, both times
for real reasons. The free boot descending onto the pick reaches **78° from level over 92
frames**, because a boot square to a shin that steep points at the ice. And the top-down
glyph turns **155° in the single frame** where `bootDir` changes rule, against the 95
`continuity.mjs` allows across a landing. Neither is a defect in the pick: they say the
frames between *free* and *picked* are a state the model has not got, the foot being neither
hanging nor planted. Inventing one to make a probe animate would be authoring pose data to
satisfy a checker.

### The plan glyph never pivoted about its contact, and nothing had noticed

Found by looking at the rear view, which is the whole argument for looking. `bootSide` has
always shifted itself so that whatever part of the blade is touching sits at the origin,
because the origin is on the ice. The plan branch never did and never needed to: a skating
boot cannot reach that glyph and a free boot has no contact to pivot about, so the shift was
zero every time it ran. **A pick is the first boot that is both plan-drawn and touching**,
and without the shift the rear view drew the whole footprint centred on the ice with half
the boot underneath it. Carried in the matrix's own translation and written as a bare `0`
where there is nothing to shift, so **every frame that existed before today draws
byte-identically** — checked as one hash over 189 standalone frames of nine moves, before
and after.

### What it buys, and what it still does not

It buys the thing four jump pages now name and could not show: **the difference between a
flip and a Salchow and between a toe loop and a loop**. It does not buy the jumps
themselves — a toe loop is a full jump rig, and the Axel notes in `figure-skating-jumps`
apply to all of them. It does not buy the lunge, which needs a boot rolled onto its side:
a missing axis, not a missing contact type.

**Open, and a coach's question.** `pitch` on a picked foot is authored and the ankle angle
follows. The other way round is arguable — a skater jabbing a pick points the foot as hard
as the boot allows, so the ankle could be pinned at `ANKLE_MAX` and the pitch derived, which
would make `blade.mjs`'s "past what a blade allows" a test of the POSE rather than of a typed
number. It was not done, because `pitch` means one thing everywhere else in the file and
because nobody has asked a coach whether a pick really is at the boot's limit.
