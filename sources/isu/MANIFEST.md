# sources/isu/ — International Skating Union

Downloaded 30/08/2026. All public, all from <https://www.isu.org/figure-skating-rules/>,
which lists them in plain HTML — no accordion, no member login. See `sources/README.md`
for the standing rule: read, never reproduced.

**Why the ISU and not British Ice Skating.** Skills 1–8 contain no spins at all, and BIS's
own singles technical documents sit behind an accordion that does not render to a fetch.
The ISU handbook is what actually defines a spin, and BIS's National Test Structure says so
itself — it requires being "read in conjunction with ISU Special Regulations and Technical
Rules and ISU Communications".

## Held

| File | What it is | Used for |
|---|---|---|
| `TP-HandbookSingles-26-27-15-July-2026-…pdf` | Technical Panel Handbook, Single Skating 2026-27, published 15/07/2026 | **The three basic spin positions**, the three-revolution minimum, the two-revolutions-in-a-position minimum. Read 30/08/2026; `tools/spin.mjs` tests the rig against it |
| `2026-FS---Pair-Sports-Rules-FINAL-20260513-…pdf` | ISU Sports Rules, Single & Pair Skating 2026-27, in force 12/06/2026 | The formal definitions the handbook rests on. Not yet read |
| `Handbook-for-Referees-and-Judges-2026-27-…pdf` | Referees & Judges, Single and Pair 2026-27 | Not yet read |
| `Handbook-for-Referees-and-Judges-2025-26-…pdf` | The season before | Kept for diffing, as the two Skills generations are |
| `Handbook-Ice-Dance-Technical-Panel-2026-27-…pdf` | Ice Dance Technical Panel 2026-27 | For the dance half. Not yet read |
| `Handbook-for-Judges-and-Referees---2026-27-…pdf` | Ice Dance judges | Not yet read |
| `IDTC-2026-27-Q-A-Clarification-…pdf` | Ice Dance Q&A | Not yet read |
| `SP-New-RTD-guidelines-…pdf`, `SP-Thinking-words…pdf`, `SPComponentCharts…pdf`, `Componentschart…pdf`, `SPWhoisresponsibleforDeductions…pdf` | Components and deductions material | **Probably out of scope.** `docs/gaps-competition.md` rules levels and features out: this is a field guide to what an element *is*, and a level is a judging outcome |

Two files are duplicates with a `(1)` suffix — the Singles handbook and the 2026-27
referees handbook. Harmless; `device_bash` cannot delete, so they stay until someone
removes them by hand.

## What is quoted from these, and what is not

The three basic-position definitions are **structural facts stated in a governing body's
public rulebook**, and `tools/spin.mjs` encodes them as three one-line predicates over the
rig with the wording quoted in its header so a reader can check the encoding against the
source. Nothing else is reproduced: element pages carry shape and purpose in our words, as
`docs/style.md` requires, and link out for the rest.

## Still wanted

- **The BIS National test (Technical & Components) syllabus**, levels 1–8. `sources/bis/`
  now holds `National Test Structure 3.7.23 V3.pdf`, which carries the per-level spin
  requirements — this is the second ladder `docs/gaps-competition.md` said the guide did
  not know existed. **Read it before writing any spin page.**
- Whatever BIS publishes on well-balanced programme requirements per category.
