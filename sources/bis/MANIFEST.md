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

None of these carries an internal version marking. Confirmed pre-October by inspection:
Skills 1 has four exercises and the slalom has no one-foot option.

## Downloaded 15/08/2026 — the October 2026 documents

All eight held, as `Skills N-2026-10.pdf`. Confirmed to be the new versions by exercise count:
Skills 1 has five exercises, 2 six, 3 six, 4 seven, 5 seven, 6 seven, 7 seven, and Skills
8's Section 2 has split into **2A and 2B**. Only Skills 1 carries an "Updated" marking.

**What changed in the exercises that already existed: almost nothing.** Diffed line by
line against the current versions, the differences are hyphenation (*3 turn* became
*3-turn*, *multi directional* became *multi-directional*) and small grammatical tidying.
No sequence was altered.

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

- **Combination turns** — *bracket-counter*, *counter-3-turn*, *3-turn-open mohawk*,
  *choctaw-3-turn-rocker*, *rocker-counter*. This is what Skills 5 to 8 is largely made
  of, and it is a new content *type* rather than a new element: an ordered chain where
  each turn's exit is the next one's entry. Entirely derivable — chain `exitState`. BIS
  writes some of the intermediate edges explicitly, which is how the Skills 6 error above
  surfaced.
- **Twizzles** — a 1½ at Skills 3 and a double at 7 and 8. Not derivable from the current
  model; a twizzle is a travelling multi-rotation turn and wants its own treatment.
- **Cross rolls**, forward and backward. Skills 1's new exercise needs them.
- **Changes of edge**, including the *COE* written at the end of the Skills 7 clusters.
- **Extended edge** as a held position, and the toe-assisted **hop** entry now offered on
  the Skills 3 spirals.

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
The Handbook's own transition table is the only place old Field Moves levels should appear.

## How these documents get used

Decided 15/08/2026: the BIS pages carry **which elements appear at each level**, linked to
our element pages, plus a paragraph in our own voice on what each exercise is working on.
**No numbered step sequences and no reproduction of their patterns or drawings** — the
guidance documents are BIS's work and the page links out to them for the exact sequence.
See `docs/style.md`.
