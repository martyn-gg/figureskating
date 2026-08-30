---
name: add-element
description: Add a derived element family — a turn, transition, twizzle count or cluster — to this guide, end to end. Use when adding an element the syllabus names, extending CLUSTERS or TWIZZLES, or closing a notCovered line.
---

# Adding a derived element

Every element here is generated from three flags. Adding one is a fixed procedure with
several parts that are easy to forget, all of which have bitten at least once.

## First: get the flags from the sequences, not the definition

British Ice Skating's *Definition of Steps, Turns & Movements* often constrains **placement**
and says nothing about the resulting edge. When it does, the flags come from their numbered
sequences instead. Read the level PDFs with `pdftotext -layout` and look at what edge the step
*after* it lands on.

> The **crossed step behind** takes the cross roll's flags, not the crossover's, because every
> XB in the syllabus runs outside edge to outside edge. The definition could not have told you.
> The **slip chassé** takes the chassé's, and is *not* the slip **step**, which is a separate
> entry in the same document.

Verify before writing any prose: `exitState(entry, key)` must equal the edge the document's
next numbered step names.

```
node -e "import('./src/lib/skating.js').then(({exitState,label})=>
  console.log(label(exitState({foot:'R',edge:'O',dir:'B'},'crossbehind'))))"
```

## The steps

1. **`src/lib/skating.js`** — one entry in `TURNS`, `STEPS`, `TRANSITIONS`, `TWIZZLES` or
   `CLUSTERS`. Say in a comment why each flag is what it is and what confirmed it.
2. **`src/content.config.ts`** — add the key to the `turn` enum, and to the `turns` enum if a
   cluster may contain it. This file is a *third* statement of the model's keys and it drifts.
3. **`tools/gen-derived.mjs`** — `TURN_NOUN`; `TWIZZLE_SLUG` if it is a twizzle;
   `TRANSITION_ENTRIES` if it is a transition; and the prose. `TRANSITION_TEXT` is keyed on
   direction+edge, `COMBO_TEXT` on cluster+direction, `TWIZZLE_TEXT` on direction+edge.
4. **Generate**: `node tools/gen-derived.mjs`. It refuses to overwrite, so a page a coach has
   corrected stays corrected.
5. **Wire the exercises**: add the element and remove the `notCovered` line *only* if the
   element closes it. Rewrite a line that has become wrong rather than deleting it.
5b. **Other names**, if the movement has any. `aliases` on the element — foot-neutral, because
   an alias names the movement — and **nothing goes in without a source**: a governing body's
   own document, or a dictionary. They are how a reader searching for their coach's word finds
   the page; they never rename it. `tools/search.mjs` fails an alias that lands on two
   movements or collides with a page's name.
6. **Check, then break on purpose**: `npm run check`, then drop the new element from an
   exercise and confirm `syllabus.mjs` reports it.

## The traps, all of which have happened

- **A cluster is only real if every element in it is real from the state it starts at.**
  Transitions generate from some entry edges only. A bracket changes edge, so from an outside
  entry it exits inside — and there is no cross roll from an inside edge. Four
  `bracket-crossroll` pages named a prerequisite with no page. **Astro logs a dangling content
  reference and builds anyway**, so `npm run check` stayed green; it surfaced only on a dev
  server restart. `syllabus.mjs` asserts prerequisites now, and the generator skips impossible
  entries.
- **A twizzle's slug spells its count out** (`two-and-a-half-twizzle`), so prerequisites must
  map through `TWIZZLE_SLUG`. Never paste the key.
- **"N turns" is wrong** when a cluster holds a change of edge or a cross roll. Not reversing
  the direction of travel is exactly what makes those not turns.
- **A bare `notCovered:`** with nothing under it is null, not an empty list. Astro rejects the
  file; every tool here parses frontmatter with regexes and reads it as empty. Write `[]`.
- **Two summaries that read the same are two summaries doing nothing.** The generated
  transition summary is keyed on `join`, which five step transitions share, so a new element
  producing the same states as an existing one collides word for word. Give the colliding one
  a phrase about what the *foot* does; leave the settled ones alone.

## Verification

- `npm run check` green — thirteen checkers, `check:freefoot` last and expected green.
- `node tools/gen-derived.mjs` again: **0 written** — generator and files agree, so a fresh
  clone reproduces them.
- `npm run drift`, then again after fixing anything it finds.
- **Restart the dev server.** It does not survive a `content.config.ts` schema change; kill it
  with `npx astro dev stop`, `rm -rf .astro`, and start it again. The site is at
  `http://localhost:4321/figureskating/` — there is a base path.
- The build runs on the Mac only. `node_modules` is macOS and the bridge VM is Linux.
