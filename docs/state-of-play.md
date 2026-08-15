# State of play

Written 15/08/2026, at the end of the first build session. Read this before changing
anything; then `README.md` for the approach and `docs/model.md` for the geometry.

## Where it stands

The machinery is built and the content is barely started. That is deliberate — the
expensive part is done and the cheap part is now genuinely cheap.

**Working:** a static Astro 7 site with content collections for elements, tests and
exercises; an animated edge diagram on any element with an entry edge; the three-view
body-frame rig on any element with a rig; a `/rig` explorer; offline via a service
worker; six checkers that pass on a clean clone.

**Barely started:** six elements, one example test, no exercises, no transcribed
syllabus. The site is a working machine with almost nothing in it.

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
    npm run check      # harness, reach, shin, blade, freefoot, build, links
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

## What to do next

1. **Generate the derived tier.** All four turns across both feet, both edges and both
   directions is thirty-two real elements, plus the plain edges — each already knowing its
   exit edge, cusp, mirror and animation without a word being written. This takes the site
   from a six-element toy to something with realistic density, which is a precondition for
   any serious design work.
2. **Then a visual design pass.** The diagram vocabulary — edge colours, leg colours,
   marker style — should be settled before hundreds of diagrams inherit it. The brief's
   hardest constraint is not aesthetic: this is read in a cold rink, in gloves, on a phone,
   one-handed, under bad lighting.
3. **Held positions** (lunge, Ina Bauer, spin positions) are the cheapest useful body-frame
   content: one or two poses each.
4. **A real syllabus**, transcribed from published material with `sourceUrl` set and
   `verified` only once confirmed.
5. **Side-by-side correct versus common error** — Lutz beside flutz, shoulders checked
   beside shoulders opening early. Same rig, two state tracks, one clock. Teaches something
   video cannot, because you can stop it and the two stay aligned.

## What needs a skater, not a developer

- Validating the poses against video and, eventually, a coach.
- How much pitch a real toe pick takes — needed before any toe jump is keyframed.
- Whether a waltz jump lands at the front of the blade, as currently drawn.

## A note on git

Every git command run against this folder through Claude's device bridge leaves a `.lock`
file behind, including read-only ones like `git status`, and `HEAD.lock` then blocks all
writes. The working split is: Claude edits files, the human runs git. Running the Cowork
task on the computer rather than in the cloud avoids this.
