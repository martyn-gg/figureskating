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
worker; seven checkers that pass on a clean clone.

**Content:** 46 elements — eight plain edges, thirty-two two-foot turns, three jumps and
a spiral — plus one example test and no exercises. 49 pages build.

**Barely started:** the syllabus half. Elements know what they are; nothing yet knows
which test it belongs to, and no governing body's material has been read.

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

## What to do next

1. **A visual design pass.** The diagram vocabulary — edge colours, leg colours, marker
   style — should be settled now that forty diagrams inherit it rather than six. The
   hardest constraint is not aesthetic: this is read in a cold rink, in gloves, on a
   phone, one-handed, under bad lighting. The index tables deliberately introduce no new
   colour, so as not to prejudge it.
2. **Held positions** (lunge, Ina Bauer, spin positions) are the cheapest useful body-frame
   content: one or two poses each.
3. **A real syllabus.** See "on reading the governing bodies" below — this is blocked on
   documents, not on effort.
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

## A note on git

Every git command run against this folder through Claude's device bridge leaves a `.lock`
file behind, including read-only ones like `git status`, and `HEAD.lock` then blocks all
writes. The working split is: Claude edits files, the human runs git. Running the Cowork
task on the computer rather than in the cloud avoids this.
