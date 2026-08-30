# What a national competition needs that the guide has not got

Written 30/08/2026 at Martyn's request, mid-session. **A log, not a plan.** Nothing here
is built and nothing here should be built on the strength of this file alone — the whole
point of writing it down is that the next person can see the size of the thing before
deciding whether to start.

Read `docs/state-of-play.md` first for what exists. The short version: **182 elements, and
not one of them is a spin.**

## ANSWERED, 30/08/2026 — both, in that order

Martyn's call, given a few hours after this file was written: **finish edges and turns first**,
so there is something to show people, and then grow into spins, dance and competition-level
material. The second half goes on **its own tab, so a beginner is not overwhelmed by it**.

So this stops being a fork and becomes a backlog. What follows is unchanged; the structural
consequences of the tab are at the end, because they are cheap now and expensive later.

## Where this comes from, and how far to trust it

Two different provenances, and they are not the same:

**Read from British Ice Skating's own site, 30/08/2026.** The championship entry ladder
below. That is a fetched page and it is quotable in the sense `sources/README.md` means.

**Not read from any document.** Everything under *What a free skating programme contains*.
That section is written from general knowledge of the sport, which is precisely the standard
this repository does not publish to. It is here as a **shopping list for a human with a
browser**, not as content. No element named below should get a page until the governing
body's own document for it is in `sources/` and has been read.

The technical guidance page holds the singles documents behind an accordion that does not
render its contents to a fetch, which is the same wall `sources/bis/MANIFEST.md` already
records: the shape of things is on the open web and the element-level requirements are in
PDFs. The route is unchanged — a human downloads them into `sources/`.

## The entry ladder, and the second test scheme

British Ice Skating's championship requirements for 2026/27 set minimum tests per category.

> **DO NOT USE THIS TABLE — flagged 30/08/2026.** `sources/bis/Singles Event Structure 2526`
> now exists and disagrees with three of its four rows: Basic Novice needs **Skills 4** not 6,
> Advanced Novice **Skills 6** not 7, Junior **Skills 7** not 8. The document's pattern is
> Skills N with National N, which also matches the per-level entry requirements in
> `Singles Generic Criteria 2026-2027` (Skills N plus the National level below). It also
> splits National into **Technical and Components as two separate minima**, which this table
> does not. That looks like a transcription error here rather than a season change — but the
> table was fetched as 2026/27 and the document is 2025-26, and the 2026-27 event structure is
> not in `sources/`, so it cannot be settled from what we hold. See `sources/bis/MANIFEST.md`.

| Category | Skills | The other test |
|---|---|---|
| Basic Novice | Skills 6 | National 4, Technical & Components |
| Advanced Novice | Skills 7 | National 6, Technical & Components |
| Junior | Skills 8 | National 7, Technical & Components |
| Senior | Skills 8 | National 8, Technical & Components |

Two things fall out of that table and both are worth more than they look.

**The syllabus half now has a top.** Skills 8 is the entry requirement for Junior and Senior,
which is a fact a skater reading `/tests/bis-skills-8/` would want on the page and which
costs nothing to add — it is the body's own published requirement about a test the guide
already carries. This is the cheapest useful thing in this file.

**There is a whole second ladder the guide does not know exists.** The *National* tests,
Technical and Components, numbered at least to 8. They gate competition entry alongside
Skills and the guide has no page for any of them. Whether they are in scope is a real
question — the guide's premise is elements and the tests that ask for them, and a second
ladder of eight tests is another syllabus half.

## What a free skating programme contains

Unverified, as above. Against the 182 elements the guide holds:

**Spins — nothing at all, and it is not an oversight.** `kind: spin` is in the content
schema and there are zero spin elements. `docs/model.md` explains why the rig cannot hold
one: `hipYaw` is measured from the direction of travel and a spin has none, so a spin
position is a second rig rooted in the skater rather than the track. That boundary is
correctly drawn and it is also the largest hole in any competition coverage — upright, sit
and camel positions, the layback and the Biellmann, flying entries, change of foot,
combination spins. A programme cannot be described without them. **This is the biggest
single item in this file and it is a rig project, not a content one.**

**Jumps above one rotation.** Seven jumps, all single. Competition is doubles and triples
from Advanced Novice up and quads at the top. `JUMPS` already carries a `rotations` field,
so the model question is whether a double Axel is a separate element or the same element at
a different count — the same question twizzles answered with one key per rotation count, and
for the same reason (the count changes the exit). Worth deciding once, cheaply, before
anything is written.

**Jump combinations and sequences.** Two or three jumps joined, which is a joining rule
rather than a new element — the same shape as the clusters the guide already generates from
`CLUSTERS`. Plausibly cheap.

**Step sequences and choreographic sequences.** Scored units with their own requirements.
The guide holds the raw material — 48 turns, 28 transitions, 64 clusters — and no notion of
a sequence as a thing that is scored.

**Listed movements.** Spread eagle, Ina Bauer, hydroblading, spirals as a sequence. The
spread eagle and the Ina Bauer became *possible* on 30/08/2026 when a pose learned to hold
two blades, and neither is built. The **pivot** is still outside the model, for the same
reason spins are — Skills 8 section 1 already names it and the page says so.

**Pairs and ice dance.** Lifts, throws, twists, death spirals, the compulsory patterns.
`kind: dance` is in the schema and holds nothing. These are whole disciplines, not gaps.

**Levels and features.** The ISU's level 1-4 criteria — how many difficult turns, how many
revolutions, entered how. Deliberately absent, and arguably should stay absent: this is a
field guide to what an element *is*, and a level is a judging outcome rather than a
mechanic. Naming it as an exclusion is better than leaving a reader to wonder.

## The honest summary

The guide covers the **compulsory-figure and skating-skills half of the sport very well and
the free-skating half hardly at all.** That is not an accident of effort: it follows from the
one idea the whole thing rests on. Everything derived from `lobeSense` is a blade on a curve,
and a jump in the air and a spin about a point are both the model saying where it stops.

So the next big decision is not which elements to add. It is whether the guide is *a field
guide to edges and turns*, which it currently is and is nearly complete as, or *a field guide
to figure skating*, which needs a second rig and a second model. Both are defensible. Only
one of them is a weekend.

## What to fetch, if the answer is the second one

Into `sources/bis/`, and record them in its `MANIFEST.md`:

- The singles technical guidance documents behind the accordion at
  <https://www.iceskating.org.uk/technical-guidance>
- The National test (Technical & Components) syllabus, levels 1-8
- Whatever BIS publishes on well-balanced programme requirements per category
- The ISU technical panel handbook for singles, if it is public, for the element vocabulary

And the standing rule does not move: public material only, written from scratch, and
`verified: false` until someone qualified has read it.

## The tab — three decisions worth making before anything is built

Not urgent, and not to be built yet. Each costs a line now and a migration later.

**The tab is a view, not a URL namespace.** The founding rule about content here is that an
element is written once and appears in as many lists as want it — that is what lets one three
turn sit in a British, a Canadian and an American test without being written three times.
Splitting `/elements/` into a beginner tree and an advanced tree would fork that namespace and
break every link into it. A second tab changes **what is listed**, never where a page lives. A
spin still lives at `/elements/<slug>/`; it is simply not on the first tab's list.

**A listing filter names what it shows, not what it hides.** Not a hypothetical. The home
page's featured list was once written as "everything except edge, turn, transition and
combination" — every kind that existed when it was written — and the twenty-four twizzles
added later fell straight through it and landed amongst the jumps. Nothing failed and it would
have shipped. A tab defined as "everything except spins and dance" absorbs the next kind added
in exactly the same way, silently, and the next kind is the one nobody is watching.

**What decides the split should be data, not an editorial list.** There is already a good key
and it costs nothing: **does this element appear in a test the guide holds?** Everything
reachable from Skills 1 to 8 is the syllabus half; everything else is the free-skating half.
It is derived from what is already written, it maintains itself as tests are added, and it
gives an honest answer to "why is this not on the first tab" — because no test in the guide
asks for it yet. A hand-kept list of advanced slugs would be wrong within two sessions.
