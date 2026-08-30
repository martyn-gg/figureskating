# British Ice Skating — sources

Hub pages: <https://www.iceskating.org.uk/skills> · <https://www.iceskating.org.uk/test-information>

**Downloads arrive without a `.pdf` extension, and the October ones under their published
`edc78b_*` names.** Both were renamed on 15/08/2026 to the names used below.

## Downloaded 15/08/2026 — the current (pre-October) documents

| ✓ | File | Pages |
|---|---|---|
| ✔ | Skills Handbook.pdf | 8 |
| ✔ | Skills - Definition of Steps, Turns & Movements.pdf | 4 |
| ✔ | Skills 1–8.pdf | 5, 6, 6, 6, 6, 6, 6, 4 |
| ✔ | National Skills Tests Update Coming October 2026.pdf | 3 |

None of these carries an internal version marking. Confirmed pre-October by exercise
count: Skills 1 has four exercises, October's has five. (An earlier version of this line
also said "the slalom has no one-foot option". That is backwards — see the correction
below — and the count is the reliable test.)

## Downloaded 15/08/2026 — the October 2026 documents

All eight held, as `Skills N-2026-10.pdf`. Confirmed to be the new versions by exercise count:
Skills 1 has five exercises, 2 six, 3 six, 4 seven, 5 seven, 6 seven, 7 seven, and Skills
8's Section 2 has split into **2A and 2B**. Only Skills 1 carries an "Updated" marking.

**What changed in the exercises that already existed — CORRECTED 30/08/2026.** The first
reading of this said "almost nothing… no sequence was altered". That was wrong. Re-diffed
mechanically, exercise by exercise, normalising hyphenation and case
(`tools/syllabus.mjs` uses the same extraction), **four existing exercises were altered
rather than reworded**, and the update announcement mentions none of them:

| Level | Exercise | What changed |
|---|---|---|
| 1 | 4 — Slalom | The one-foot power changes become **optional**. The current version requires them; October offers a two-foot-only route as an alternative. A relaxation. |
| 2 | 3 — Forward 3-turns | Adds a requirement: *minimum two lobes on each foot*. |
| 2 | 4 — Forward cross rolls | The same minimum added. |
| 3 | 5 — Forward spirals | Reworked. The toe-pick-assisted step becomes **optional**, the rotational direction becomes optional, and an alternative entry appears that reaches the spiral without the hop. |
| 7 | 1 — FI choctaws & BO counters | *"This completes the exercise"* becomes *"then repeat the sequence"*. |

Everything else that differs is hyphenation (*3 turn* → *3-turn*, *multi directional* →
*multi-directional*) or grammar (*demonstrate a fluid* → *demonstrate fluid*).

**The correction below follows from the Skills 1 line.** An earlier note in this file said
the current slalom "has no one-foot option", and used that to tell the two generations
apart. It has the one-foot section as a **requirement**; October is what adds the option.
The generations are still distinguishable by exercise count, which is what the paragraph
above this table actually relies on.

**One substantive addition the announcement did not mention.** Every exercise page in the
October documents carries a **smaller rinks** provision: the patterns may be adjusted as
reasonably required for rinks under 60 × 30 m, provided all key requirements of the
exercise are included. That matters in Britain, where a good many rinks are not 60 × 30,
and it should be read alongside the Handbook's existing rule that Skills 5–8 may only be
tested on rinks of 40 m or larger.

## Reference — the source URLs

The per-level PDFs linked from `/skills` are the **current** versions. The October ones
are published already, but only from the announcement post, on a different host. Verified
15/08/2026 by reading two of them: the Skills 1 document below carries five exercises
including the new *Exercise 5 — Forward Outside & Forward Inside 3-Turns*, and the Skills 5
document carries seven including *Bracket Exercise* and *Backward Counter Exercise*. The
current versions have four and five respectively.

Both generations are held. Current documents are `Skills N.pdf`, October ones
`Skills N-2026-10.pdf`; the published URLs each came from are in the table below.

| Level | File | URL |
|---|---|---|
| 1 | `Skills 1-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_841a22138f7549bca0abb1556eec9a51.pdf |
| 2 | `Skills 2-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_ccc16c9e9859498b8c5f0d8e6139b205.pdf |
| 3 | `Skills 3-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_4c0d0c995a044d5aafc4189b4c395069.pdf |
| 4 | `Skills 4-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_a1116b46cb764a73b052ce5fd49247dd.pdf |
| 5 | `Skills 5-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_92fcb9b460ad469f95dac8ec967f77ec.pdf |
| 6 | `Skills 6-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_2f3e4872fe3f4d29acbb8633c27c3d7a.pdf |
| 7 | `Skills 7-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_0a257301d64b48cebd61f078c0a724af.pdf |
| 8 | `Skills 8-2026-10.pdf` | https://edc78b5e-a47b-4560-bd1b-721419351a14.usrfiles.com/ugd/edc78b_52a3cc74d49d43139a72c00f25602769.pdf |

## A probable error in the October Skills 6 document

Skills 6, Exercise 6 (*Bracket-Counter*) writes its second cluster as an LFI bracket
producing RBO. A bracket keeps the same foot, so an LFI bracket can only exit on the left
foot — LBO. Skills 7's Exercise 6 builds the same cluster and writes it correctly, mirrored
as LFI bracket to LBO, which is what makes this look like a transposition rather than
something we have misunderstood.

Found by running every explicitly-written intermediate edge in both generations of the
documents through `exitState`: nine agree, this one does not. Worth raising when we
approach British Ice Skating, and a reason to trust the model a little more.

## What October adds that the guide cannot yet link to

The new exercises introduce very little that is new in *kind*, and one thing that is.

Already covered by the 62 derived elements: the three turns at Skills 1 and 2, the
brackets at 5, the backward counters at 5, the mohawks and choctaws at 3 and 4.

Missing, and needed:

*(This list was written on 15/08/2026, before the transitions and clusters went in.
Struck items are built. Two remain, and both are held-position work.)*

- ~~**Combination turns**~~ — *bracket-counter*, *counter-3-turn*, *3-turn-open mohawk*,
  *choctaw-3-turn-rocker*, *rocker-counter*. Built 15/08/2026 as `CLUSTERS`: an ordered
  chain where each turn's exit is the next one's entry, derived by chaining `exitState`
  rather than stored. BIS writes some of the intermediate edges explicitly, which is how
  the Skills 6 error above surfaced.
- ~~**Twizzles**~~ — a 1½ at Skills 3 and a double at 7 and 8. Built 29/08/2026 with their
  own table and their own tracing. The definition document's two disqualifiers, checked
  three turns and the travelling stopping, both turned out to be geometry and are asserted
  by `tools/tracing.mjs`.
- ~~**Cross rolls**~~, forward and backward — built 15/08/2026, from outside entries,
  which is what the element is rather than a limit of the model.
- ~~**Changes of edge**~~, including the *COE* written at the end of the Skills 7
  clusters — built 15/08/2026 as the `coe` transition, on all four entry edges.
- ~~**Extended edge** as a held position~~ — built 29/08/2026 from Skills 1 exercise 2,
  the *backward outside extended position*, held for a third of a circle or three seconds.
  Its own rig in `moves.js` and its own element page.
- The toe-assisted **hop** entry on the Skills 3 spirals. **The only one left**, and
  smaller than it looked. Re-read on 30/08/2026: in the *current* documents the toe-assisted
  step is required and the rotation direction is specified; in October both become optional
  and a second route to the same spiral appears without a hop at all. So it is an optional
  variant of an optional variant, and a Skills 3 page can be honest and complete without it
  — which it should say rather than leave a silent hole. If it is ever built it wants the
  body-frame rig rather than the derived tier, as an alternative entry on the spiral's rig,
  since it is a brief airborne phase into an existing position rather than an element.

One thing worth recording from reading the definitions document properly on 29/08/2026:
the **slip step** is defined there as a step "with the blades of both skates being held
flat on the ice". That is a two-blade contact, which the body-frame rig has no field for —
the same gap the Ina Bauer and the spread eagle run into. See `docs/model.md`, *What the
rig cannot hold*. It is not on the gap list above because no Skills exercise reviewed here
calls for it, but it means the gap is one the syllabus's own vocabulary contains.

## Out of scope — not publicly available

Every per-level document points at a *Criteria for Scoring Skills 1–8*, "included in the
Manual". That is very likely coach material rather than a public download, so **it is not
wanted**. The Handbook's own judging criteria table is public and covers the same ground
for our purposes.

The same goes for anything on the Technical Guidance pages that sits behind a member
login. See `sources/README.md`: the guide is built from public material only, and where
that leaves a gap the page says so.

Publicly downloadable material beyond Skills — National Technical and National Components
requirements, current-season General Rules — is welcome if it turns out to be open.

## Video — for your eyes, not mine

New-exercise demonstrations (October 2026). I cannot watch these; they are for checking
mechanics before anything is written down as fact.

Playlist: <https://www.youtube.com/playlist?list=PLASZTijgWVdsvKp4MNBqOXGDU8Up3FKU9>

| Level | Exercise | Video |
|---|---|---|
| 1 | Ex 5 — forward outside & inside 3-turns | https://youtu.be/OdJSRKehssY |
| 2 | Ex 6 — backward outside 3-turns | https://youtu.be/RfRTIgB1BGI |
| 3 | Ex 6 — forward inside 1½ twizzle | https://youtu.be/WlfiuWi813E |
| 4 | Ex 6 — mohawk & 3-turn | https://youtu.be/o-fhcL83SGQ |
| 4 | Ex 7 — skating exercise | https://youtu.be/KzFfjJNV2bk |
| 5 | Ex 6 — bracket | https://youtu.be/cBgP7UUzbCM |
| 5 | Ex 7 — backward counter | https://youtu.be/QgTrcnowTI4 |
| 6 | Ex 6 — bracket-counter | https://youtu.be/184_k0yXFaM |
| 6 | Ex 7 — skating exercise 2 | https://youtu.be/wheB3lmGyXo |
| 7 | Ex 6 — bracket-counter-twizzle | https://youtu.be/Jvyq1rvfcRg |
| 7 | Ex 7 — choctaw-3-turn-rocker | https://youtu.be/C4aXaC81ybY |
| 8 | Section 2A | https://youtu.be/puMqPzq6R74 |
| 8 | Section 2B | https://youtu.be/hxL_AO31kk0 |
| 8 | Full programme | https://youtu.be/yAgn7RJvqwU |

The per-level playlists for the *current* exercises are linked from
<https://www.iceskating.org.uk/skills>.

## Not wanted

The old NISA **Field Moves** manuals still circulating on club websites. They are legacy.
The Handbook's own transition table is the only place old Field Moves levels come from,
and `/tests/older-names/` is the only page they appear on.

## How these documents get used

Decided 15/08/2026: the BIS pages carry **which elements appear at each level**, linked to
our element pages, plus a paragraph in our own voice on what each exercise is working on.
**No numbered step sequences and no reproduction of their patterns or drawings** — the
guidance documents are BIS's work and the page links out to them for the exact sequence.
See `docs/style.md`.

---

## Downloaded 30/08/2026 — twenty more, and a second ladder

Martyn downloaded everything available on the open site. Read and triaged the same day.
The Skills sections above are unaffected; this is the **National** ladder and the other
disciplines. See `sources/isu/MANIFEST.md` for the ISU documents that arrived with them.

### The second ladder — in scope, and the reason this batch matters

`docs/gaps-competition.md` said the guide "has no page for any of them" and did not know
whether they were in scope. They are the National tests, Technical and Components, and
there are **eight levels plus a Beginner**, aligned to Skills.

| File | What it is | Read |
|---|---|---|
| `Singles Generic Criteria 2026-2027 Jun 26.pdf` | **THE CURRENT DOCUMENT.** Updated 09/06/2026. Per-level requirements, Beginner to National 8, and BIS's own definitions of the three basic spin positions | yes, 30/08 |
| `National Test Structure 3.7.23 V3.pdf` | The founding document for the 8-level scheme, dated 03/07/2023. **SUPERSEDED — do not build from it** | yes, 30/08 |
| `Singles Event Structure 2526 - Updated July 2025 .pdf` | Championship categories and their minimum Skills / National Technical / National Components. **2025-26 season** | yes, 30/08 |

**THE TWO GENERATIONS TRAP, AGAIN.** The Skills documents taught it once and the National
documents repeat it: two files describe the same ladder three years apart and **they
contradict each other on the elements**. Two confirmed at National 3 and National 4:

- **National 3.** 2023: "the spin with no change of position must be executed with a change
  of foot and a minimum of six (6) revolutions". 2026-27: "one must be a spin with no change
  of position **and no change of foot**". Straight contradiction.
- **National 4.** 2023: "the spin combination must show all 3 basic positions" and "the spin
  with no change of position must be either a Sit or Camel Spin". Neither requirement is in
  the 2026-27 document.

Tell them apart by their dates, and **build against `Singles Generic Criteria 2026-2027`**.

### What the current document gives us that the ISU handbook does not

BIS define the three basic positions themselves, and their wording is *more* specific than
the ISU's on two of the three — both additions are geometry a rig could be measured against:

- **Upright** — skating leg straight or slightly bent; arm and free leg positions optional.
- **Sit** — upper part of the skating leg at least parallel to the ice; **the free leg must
  be in front** and the body straight or slightly forward; no pulling of the free leg or
  pulling the body towards it.
- **Camel** — free leg backwards, knee of the free leg higher than the hip; **the shoulders
  should be parallel to the ice**.

They also restate the ISU's two counting rules in their own words, which is a useful
independent confirmation: a spin needs **3 continuous revolutions on one foot** to count, and
a position within it needs **2 continuous revolutions**.

### The entry ladder, which is the argument for holding both halves

Each National level's entry requirement, read off the current criteria, is **the matching
Skills level plus the National level below it** — National 4 needs Skills 4 and National 3,
National 5 needs Skills 5 and National 4, and so on. The two ladders interlock rather than
running in parallel, which is a fact a reader of either would want on the page.

**From National 6 upwards each level has a short programme and a free programme**, with
separate criteria blocks. Only the free programmes have been read; **the short-programme
blocks still need their own pass.**

### The discrepancy, settled — and the flag was the thing that was wrong

**Resolved 30/08/2026, later the same day.** BIS's own announcement *Updates to Championship
Requirements for the 2026/27 Season* (09/12/2025, on the open site) confirms the table in
`docs/gaps-competition.md` exactly: Basic Novice Skills 6, Advanced Novice 7, Junior and Senior
8. **A season change, not a transcription error** — 2025-26 asked Skills 4 / 6 / 7 / 8 and
2026-27 asks 6 / 7 / 8 / 8.

`Singles Event Structure 2526` is therefore **stale for entry requirements** and should not be
read as current. It stays for the season-on-season comparison, which is now a third instance of
this family's one recurring hazard. **Still wanted: the 2026-27 Singles Event Structure itself**,
which does not appear on the open site — the announcement carries the table but not the document.

The original note is kept below, because the reasoning in it is exactly the trap: the older
document looked *more* self-consistent, and the tidier pattern was the stale one.

### The discrepancy as first written, 30/08/2026 — superseded by the above

`docs/gaps-competition.md` carries a championship entry table fetched from the BIS website
on 30/08/2026 and labelled 2026/27. `Singles Event Structure 2526` disagrees with it at
three rows of four:

| Category | the table in `gaps-competition.md` | this document (2025-26) |
|---|---|---|
| Basic Novice | Skills 6, National 4 | **Skills 4**, National Technical 4, National Components 4 |
| Advanced Novice | Skills 7, National 6 | **Skills 6**, National 6, National 6 |
| Junior | Skills 8, National 7 | **Skills 7**, National 7, National 7 |
| Senior | Skills 8, National 8 | Skills 8, National 8, National 8 — agrees |

The document's pattern is simply **Skills N with National N**, which also matches the entry
ladder above. That looks like a transcription error in `gaps-competition.md` rather than a
season change, but the two sources are different seasons and **the 2026-27 Singles Event
Structure is not in `sources/`**, so it cannot be settled from what is here. Do not publish
either version until it is.

Also worth knowing: this document's own header says "Age at 1st of July 2024" while its
filename and content are 2025-26. BIS's inconsistency, not ours.

### Ice dance — in scope eventually, `kind: dance` holds nothing

None read. `Ice Dance Manual May 2026.pdf` (the test manual, 21/05/2026) is the one to start
from. Then `BIS Solo Ice Dance National Criteria 2627.pdf` (current season),
`Couples Generic Criteria 2525` and `Adult Solo Technical Requirements 2525` (both 2025/26),
`Solo Ice Dance Competitive Test Scores 2025_26.pdf`, and `2201 - Test Session
Clarification.pdf`.

### Out of scope

Kept because they came down with the rest; nothing here is about an element or a test that
asks for one, so no page should ever cite them.

- **Synchronised skating** — `Synchro Criteria 2026-2027v1`, `BIS Synchronized Skating
  Selection Criteria 2025 - 2026`, `Synchro Squad Information 2025-26`, `Synchro Coaching
  Ratio Guidance`. A discipline the guide does not cover.
- **Squads, selection and eligibility** — `2023-24 BIS Development-Futures Squad
  Information`, `JUNIOR PERFORMANCE SQUAD SKATERS WISHING TO COMPETE IN SENIOR BRITISH
  EVENTS`, `Final - British Ice Skating GBE Criteria 26-27`, `ESRA June 2023`,
  `Eligibility 2023 - Final`. About who may compete, not about what they skate.
- **Music** — `Music Guidance 2025`, `BIS Music Licensing Instructions 2025-26[2]`.

### Still wanted

- **The 2026-27 Singles Event Structure**, to settle the championship table above.
- The **short-programme** criteria blocks for National 6, 7 and 8 are in the current
  document and have not been read.
