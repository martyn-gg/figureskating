# Field Guide to Figure Skating

A public reference to skating elements — edges, turns, twizzles, transitions,
clusters, jumps and positions — and the British Ice Skating tests they appear in.
Static site, no accounts, works offline at the rink.

**Live at [figureskating.guide](https://figureskating.guide).**

Everything here is written and drawn from scratch. No governing body's material is
reproduced; the syllabus documents are read locally (see `sources/`, gitignored)
and the guide is written *from* them, not *out of* them.

Nothing on the site is verified by a coach yet, and every page says so.

## Running it

    npm install
    npm run dev            # http://localhost:4321/
    npm run build
    npm run check          # the whole chain — see below

Node 26. The one dependency is Astro.

If the dev server wedges after a schema change, a plain `kill` does not clear
Astro's lock:

    npx astro dev stop && rm -rf .astro && npm run dev

## How it is built

The founding fact is one line in `src/lib/skating.js`:

```js
lobeSense = (foot === 'L' ? 1 : -1) * (edge === 'O' ? 1 : -1) * (dir === 'F' ? 1 : -1)
```

Which way a lobe curves follows from three facts about the foot. So the guide
stores those three and derives everything else — the tracing, the mirrored twin,
the prose. **Never copy the model.** If a fact can be worked out from foot,
edge and direction, it is not stored a second time.

The consequence is that prose is keyed on direction and edge but *never on the
foot*, so one passage serves between two and eight pages. `tools/drift.mjs`
counts passages rather than files for exactly that reason.

Three tiers:

| Tier | Where | What |
| --- | --- | --- |
| Model | `src/lib/skating.js` | the geometry and the vocabulary |
| Derived | `tools/gen-derived.mjs` → `src/data/` | elements written out from `TURNS`, `STEPS`, `TRANSITIONS`, `TWIZZLES`, `CLUSTERS`, `JUMPS` |
| Rendered | `src/lib/moves.js` → `body-frame.js` | 3D pose keyframes projected to three views |

Content lives in `src/data/`, not `src/content/`, and collections are declared in
`src/content.config.ts`. Entries are keyed by `entry.id` — Astro 7 has no `slug`.

### The rig

`src/lib/moves.js` holds body-frame pose keyframes; `src/lib/body-frame.js`
renders them to the top, side and rear views; `src/lib/rig-math.js` does the
maths. Coordinates are centimetres: `t` along the track (positive is the
direction of *travel*, not of facing), `n` across it (positive is the skater's
right), `z` above the ice.

Two rules earned the hard way:

- **Render, don't reason.** If you want to know what the drawing does, draw it and
  measure the pixels. A degenerate projection and a real motion look identical in
  one frame; only the 3D vector tells you which.
- **Don't let an optimiser edit poses.** Both of the waltz jump's rendering bugs
  turned out to be one wrong pose. The fix was nine numbers in `moves.js`, not a
  tolerance in a checker.

### Colour

The palette is data, in `src/lib/tokens.js`, and `tools/contrast.mjs` imports the
same object and measures it. A hex code written into a stylesheet would be a
second source of truth that the checker cannot see. The app icons are generated
from the same palette by `tools/icons.mjs`.

## Checks

`npm run check` runs sixteen steps, in order, stopping at the first failure:

| | |
| --- | --- |
| `harness` | the checkers' own fixtures |
| `reach` `shin` `blade` `boot` `arms` `lean` | the rig, joint by joint |
| `twofoot` | poses with both blades down, including BIS's own four pairs |
| `continuity` | 11,514 adjacent-frame comparisons across 6 moves × 3 views |
| `tracing` | what the blade leaves behind |
| `contrast` | every pair that carries meaning, measured in both schemes |
| `syllabus` | prerequisites resolve, vocabulary is defined, no bare `notCovered:` |
| `build` | then, on `dist/`: |
| `links` | every internal href resolves to a file that exists |
| `search` | the index covers every page and answers representative queries |
| `freefoot` | free-boot elevation, every frame |

Four more need Playwright and are run by hand
(`npm install --no-save playwright && npx playwright install chromium`):
`offline`, `framing`, `ink`, `speed`.

`npm run drift` is a report, not a check — it lists passages that have started to
resemble each other.

House rules that the checkers exist to enforce:

- A checker nobody has seen fail is a decoration. Break the thing, watch it fail,
  then fix it.
- A listing filter names what it shows, not what it hides. A new kind of element
  must not be able to appear somewhere by not having been thought of.
- A fact the renderer knows belongs in the DOM, where a checker can read it.
- `astro build` logs invalid content references as errors **and exits zero**.
  `check:syllabus` asserts that prerequisites resolve because the build will not.

## Skills

`.claude/skills/` carries three procedures: `add-element`, `rig-verify`,
`new-checker`.

## Deployment

GitHub Actions builds and publishes to GitHub Pages on every push to `main`
(`.github/workflows/pages.yml`). The custom domain is set by `public/CNAME`;
`base` is `/` and lives in `astro.config.mjs`, which the tools read rather than
copy.

## Verification

The plan is that coaches, judges and technical officials sign off *passages*
rather than pages — 307 pages share 159 passages, so it is 477 approvals rather
than 921. Three approvals give a passage its tick; a single objection takes it
straight back off. See `/coaches/` on the site.

## Licence

Two licences, because there are two kinds of thing here. The content — prose,
diagrams, element and test data — is CC BY-SA 4.0: reuse it, adapt it, sell it if
you like, but credit the guide and pass the same freedom on. The code that builds
and draws it is MIT. `LICENSE` covers the code and explains the split;
`LICENSE-CONTENT` covers the content.

The syllabus documents in `sources/` are neither: they are not in the repository
and are not ours to license.
