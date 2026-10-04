# Roadmap

Agreed with Martyn on 04/10/2026. The order is his; the reasoning is recorded so a later
session can tell when it no longer holds. `docs/gaps-competition.md` (30/08/2026) is the
older backlog this grows out of; where they disagree, this file is newer.

## Where the guide stands

Singles from the first lesson to the Axel, skating skills to BIS Skills 8, all 30 pattern
dances drawn on the rink, the six dance holds from above and behind, and the twizzles. The
site has search, a sitemap, Search Console and Bing, visitor counts (Cloudflare Web
Analytics) and Instagram and Facebook, all as `figureskatingguide`.

**The aim now is feedback.** There is enough content to show people. Building continues, but
the first measure of the next few weeks is whether skaters, coaches and judges find the
guide and tell us what is wrong with it.

## The order

1. **Doubles and jump combinations.** Done. *Doubles done 04/10/2026*: six double pages
   (2S, 2T, 2Lo, 2F, 2Lz, 2A) from `jumpAt(key, 2)` in `skating.js`, the double Salchow,
   loop and Axel drawn by `doubleOf` in `moves.js` (the single with one more turn in the
   air), held to the model by `tools/jumps.mjs`. The flip and Lutz have no rig
   as singles either (the toe loop has had one since 04/10/2026, Session 29); their doubles
   draw the two edges like the singles do.
   *Combinations done 04/10/2026*: `comboAt` and `ALL_COMBOS` in `skating.js`. Every jump
   lands RBO, so the second jump is whichever takes off there (`SECONDS`: the toe loop and
   the loop), derived rather than listed. 26 pages, every jump into each second at the
   same count, the waltz jump with the singles; their own kind, `combo`, and section,
   *Jump combinations*, a grid of first jump against second. Seven drawn by `comboOf` in
   `moves.js` (the four rigged firsts into a loop, the three rigged doubles into a double
   loop), the two rigs joined on the landing edge. `tools/jumps.mjs` holds pages and rigs
   to the model. Not held: mixed counts (2A+1T) and jump sequences. *Three-jump combinations
   through an Euler done 04/10/2026* (26 more, 52 in all).
2. **The National tests.** British Ice Skating's free-skating ladder, the second of its two.
   Only the Skills tests are written out. The championship entry table in
   `gaps-competition.md` already names National 4, 6, 7 and 8; they need the syllabus
   documents in `sources/` first.
3. **The watcher's guide: pairs.** One page per element family, saying how to recognise it
   from the stands and what makes it good, drawn from the holds model with nobody leaving
   the ice:
   - lifts, by the ISU's five groups (armpit, waist, hand-to-hip, hand-to-hand press,
     hand-to-hand lasso) and their take-offs;
   - the twist lift;
   - throw jumps;
   - the four death spirals, named by the follow's edge (back inside, back outside, forward
     inside, forward outside), each an edge on a circle round the lead's pick;
   - pair spins round a shared axis.
   Side-by-side jumps and spins are singles content skated in unison and link to the
   existing pages.
4. **The watcher's guide: synchro.** The same shape. The formation elements (lines, blocks,
   circles, wheels, intersections, pivoting shapes) are holds and paths on the 60 × 30 m
   rink, which the pattern dances already draw; twizzle, spin and moves elements link to
   singles pages. Group lifts are the one new family. **Write from the current ISU
   guidelines, not from memory**: the ISU renames and merges synchro element types every
   few seasons. Starting points: ISU Communication 38, Technical Guidelines SYS 2026/27, and
   NZIFSA's 2026/27 well-balanced programme summary.
5. **Fully drawn lifts and throws**, only if readers ask. The rig assumes both blades are
   on the ice; a body in the air is new capability.

## Next session

**A contact pinned to the ice** (`docs/spec-anchor.md`). Unlocks the toe loop, flip and Lutz,
their doubles, 19 undrawn combinations, the pivot and the bunny hop. Agreed with Martyn
04/10/2026. *Steps 1 and 2 done 04/10/2026, Session 29*: the pin and the reach for the pick,
on `toePick`, now a movement. *The toe loop drawn the same day*, after Martyn corrected
which way a picking toe points, then the double toe loop and eleven more combinations
(18 drawn), then the flip and the Lutz and every two-jump combination (26). *Stroking
corrected 04/10/2026, Session 30*: `pushOff` is the side push, `pushOffT` the T over two
alternating strokes, both on the forward stroking page. **Next session first:** a knee that
tracks its own foot, then the pivot, and the Euler for the three-jump combinations.

## Also on the list, unordered

- **Competition dance elements**: dance lifts, dance spins and the choreographic elements.
  They belong with the watcher's guide.
- **Scoring for watchers**: levels, grade of execution and what a technical panel looks for,
  in a page or two.
- **Pairs and dance tests**: BIS and US Figure Skating both run them. Read the syllabuses
  before sizing the pairs section.
- **Equipment** *Done 04/10/2026: `/kit/` (blade, boot, care), the rocker and the hollow drawn by `BladeRocker` and `BladeHollow`.* (04/10/2026, from reading adultsskatetoo.com's guides for gaps). The
  guide has nothing on kit. First the blade's rocker, drawn from the geometry the rig
  already stands on (`blade.mjs`): the curve along the blade, the sweet spot, where a
  spin and a back edge sit on it, where the pick begins. Then prose: boots (fit, and why
  too stiff stops the knee bending), and care (guards on and off the ice, soakers, drying,
  sharpening and the hollow). The questions of a skater's first month.
- **Off-ice training** *Done 04/10/2026: nine entries at `/off-ice/`, each element page lists the entries that name it, `tools/office.mjs` holds both directions.* In the empty `conditioning` collection. What makes it ours is the
  link to the ice: each exercise names the elements it prepares (a floor waltz jump for
  the takeoff, a held landing position, spin-position balance and spotting), the way the
  basics name what they lead to. Generic strength, stretching and cardio are better
  covered elsewhere and are at most a line. Read US Figure Skating's off-ice training
  page first. Warm-up and landing safety stated plainly, with no injury advice.
- **Coach review.** The "not checked by a coach yet" notice is on every page. Closing it is
  people, not pages; a fuller guide makes it easier to ask.

## Standing rule: brand-agnostic

No product, model or maker is named or recommended anywhere in the guide (Martyn,
04/10/2026). Equipment pages say what a rocker, a pick or a hollow does, never which blade
has one. If a brand ever sponsors the site, it gets a badge spot for its logo and nothing
in the content changes.

## Standing rule: coaches' pages are a check, not a source

Coaches' public pages and videos may be read to check a pose or a piece of technique, the way
a coach would correct it at the rink (Martyn, 04/10/2026). Take the base guidance only: no
wording, no quotes, no names, nothing that would need attribution. What changes in the guide
is written in its own words, and the rig carries the number.

## Small and ready

- **Share images**: a 1200 × 630 card per page, built at build time like the tracings, in
  place of the app icon that links currently show.
- **IndexNow on deploy**, once content changes weekly. The key file is already published.
- **The Facebook username**: swap the numeric Page address in `SOCIAL` (`src/lib/site.js`)
  for `facebook.com/figureskatingguide` once Facebook grants it.
- **A manual accessibility pass**: keyboard order and VoiceOver on a phone, which
  `tools/a11y.mjs` cannot do.
