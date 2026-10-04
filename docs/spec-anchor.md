# Spec: a contact pinned to the ice

Written 04/10/2026, Session 28, for the next session (Martyn: yes, make the anchor the next
job, starting with a short spec).

**Built 04/10/2026, Session 29: parts A, B and C, order of work steps 1 and 2.** Two
departures, both in the handoff: the pin lives inside `poseAt` (over `poseFree`) because
eleven checkers read `poseAt` and no single world transform exists; and part B needed a
second blend, the contact point moving from the blade's middle to the teeth over the whole
span, as well as the direction over `PICK_REACH`.

## The problem

Every foot in `moves.js` is authored relative to the hip, in the track frame (`t` along the
path, `n` across it), and only the reference blade is pinned to the path. A gliding blade
travels with the skater, so that costs nothing. A toe pick does not travel: once it is in,
it stays where it went in while the body goes past it. Authored hip-relative, a pick held for
a real span of travel has to sweep backwards by however far the hip went (`toePick`'s comment
measures 168 cm over its arc), so today a pick can only be a held position.

There is a second, smaller gap. A free foot reaching down onto a pick has no in-between
state: `bootDir` builds a free boot square to the shin and a picked boot from the reach, and
switching rule in one frame turned the top-down glyph 155° (continuity allows 95 across a
landing). Both failures are recorded in `toePick`'s comment.

## What it unlocks

- **Jumps:** the toe loop, flip and Lutz, then their doubles by `doubleOf`.
- **Combinations:** the 19 two-jump combinations that are not drawn today, the ones with a
  toe loop second or a toe-loop, flip or Lutz first. The three-jump ones also need an Euler rig,
  which is the loop's flight landing on the other foot: no anchor, but its own landing keys.
- **Basics:** the pivot (a pick held while the other blade circles it) and the bunny hop.
- **Later:** the toe-assisted hop into the Skills 3 spirals; toe steps in step sequences.

## Design

### A. The anchor

A foot key may declare `pin: true` alongside `onIce: 'pick'` (and, later, `'blade'` for a
stop). Over a run of keys that all declare it, the foot is fixed in the WORLD, not in the
track frame:

1. At the first pinned key, the foot's world position is computed once from the path point
   and heading at that time and the authored `t`, `n` (the same rotation `body-frame.js`
   already applies at line ~481).
2. On every frame inside the run, the foot's track-frame `t`, `n` are recomputed from that
   world point and the frame's own path point and heading. The authored `t`, `n` of later
   pinned keys are ignored for position and asserted to agree to within a centimetre
   (they document where the foot ends up, which is useful when reading a move).
3. `z` stays authored (zero for a pick).

Where it lives: a pass over the frames after `buildPath` and `poseAt`, in the one place that
turns a pose into world coordinates, so that every view and every checker sees the same
pinned foot. `poseAt` stays a function of the clock alone.

### B. Reaching for the pick

Extend the existing `arrival` (rig-math.js `arrivalOf`, used for landing blades) to picks: on
the last few frames before a key that declares `onIce: 'pick'`, `bootDir` blends from the
free rule (square to the shin) to the picked rule (from the reach), and the same in reverse
as the pick leaves. The blend is over a fixed time, not a fraction of the span, so it does
not change with the clip's length. Continuity's 95° landing allowance should then not be
needed: the target is the ordinary 30.

### C. What the checkers must learn

- `reach.mjs`: a pinned foot moves away from the hip as the body travels, so reach is the
  live constraint. It must fail, not clamp, when the hip outruns the leg: that is the moment
  the pick has to come out.
- `continuity.mjs`: a pinned foot's world position must not move at all inside its run
  (a new assertion, the strictest one in the file), and nothing may jump at the run's ends.
- `twofoot.mjs`/`lean.mjs`: a pinned pick is a contact, as `pick` already is.
- A mutation for each: unpin the foot (it slides), and pin it a frame late (it jumps).

## Order of work

1. The anchor on `toePick`, turned from a held position into a movement: glide, sink, reach
   and pin, ride past it, release. Measure reach along the run before authoring anything.
2. The reaching blend, on the same move, until continuity passes at 30.
3. The toe loop: `loop`'s keys from the bend with a pick replacing the bent free leg, sunk to
   a hip of 62 or below (`toePick`'s band). Then the flip (from the Salchow's three turn), then
   the Lutz (a long back outside edge).
4. `doubleOf` the three. `comboOf` draws the toe-loop seconds once the toe loop exists.
5. The pivot and the bunny hop.

## Risks, said plainly

- The sunk hip a pick needs (62 cm or less, from `ankle.mjs`'s three bands) makes the entry
  deep. The toe loop's real takeoff may need the pick only briefly, so most of the run may be
  shorter than step 1 suggests. Measure before authoring.
- The Lutz's long outside edge into a pick behind is the hardest pose in the set. It may need
  the shin allowance revisited, which is a coach question as much as a code one.
- Every animation drawn so far stays byte-identical unless it declares `pin`. Hash the frames
  before and after (workflow notes, *Hash the frames*) to prove it.
