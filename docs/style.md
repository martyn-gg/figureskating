# Style

How everything here is written, so that forty element pages and three qualification guides
read as one guide by one hand. Descriptive, mostly — it records what the existing pages
already do. Where it prescribes, it is because the next batch of writing needs a decision
already made.

## Who is reading

Someone in a cold rink, on a phone, in gloves, one-handed, under bad light, between
run-throughs. They arrived with a specific question and they want it answered before their
hands get cold. They are not browsing.

The second reader is a coach who has come to tell us we are wrong, which is the point of
the repository being public. Write so that being corrected is easy: say one thing per
sentence, and never hedge a mechanical claim into unfalsifiability.

## Voice

Second person, present tense. *You glide forwards on the outside edge* — not *the skater
glides*, and not *one glides*. The exception is the qualification guides, where you are
describing somebody else's rule and "the skater" is the right register.

Prose. Bullets are for things that are genuinely lists; an explanation is not a list. No
headings inside an element body — if a page needs subheadings, the page is too long.

No encouragement and no enthusiasm. A counter is hard. Saying so is more use than saying
it is achievable, and a skater who has been struggling for a month can tell the difference.

British English throughout, dd/mm/yyyy, 24-hour time. Anticlockwise, not counterclockwise —
including on the American pages, where the US term goes in brackets on first use and never
again. Metric, except where the equipment itself is imperial: a blade rocker is a seven-foot
radius because that is how it is ground and sold.

## Rules that hold everywhere

**Never write what the model derives.** Exit edge, cusp direction, lobe sense, the mirrored
version — the page prints all of it from `skating.js`. Restating it in prose creates two
sources of truth, and the second one is always the one that goes stale. If a sentence
would be invalidated by changing a letter in the frontmatter, delete the sentence.

**Write foot-neutrally.** A left forward outside bracket and a right one are mirror images,
so the words "left" and "right" belong in neither description. One passage serves both
pages honestly. This is not a shortcut; it is the true shape of the content, and it is why
`tools/gen-derived.mjs` keys its prose on direction, edge and turn but never on the foot.

**Explain the notation nowhere.** The footer explains it on every page and the derived
block explains it again on any page that has an edge. A body that also explains it is the
third telling.

**Nothing reads as authoritative by accident.** `verified: { checked: false }` until
someone qualified has said otherwise, and the amber banner does the rest. Do not soften
the banner with confident prose above it.

**Everything is written from scratch.** No governing body's wording, tables or diagrams
are reproduced. Where their term *is* the term, name it and attribute it — that is
citation, not reproduction. See `sources/README.md`.

**Public material only.** Nothing is built from a document that needs a member login or is
issued to coaches rather than published. The gaps that leaves are written as gaps. This is
not caution for its own sake: the intention is to finish the guide from public sources and
then go and ask the governing bodies what they think of it, and that conversation is a
great deal easier if the answer to *where did you get this?* is *your website*.

## Element pages

Two or three paragraphs. Ninety to a hundred and sixty words. Longer than that and it stops
being a field guide.

Each paragraph has a job:

1. **What it is, mechanically, in one breath.** Direction, edge, rotation, exit. This is
   the paragraph someone reads standing up.
2. **The thing that is not obvious.** What it gets confused with, what the common fault is,
   what to watch instead of the obvious thing. This is the paragraph that justifies the
   page existing, and it is the one a coach will correct.
3. **Optional: what it is for.** Where the element turns up later, or what a weak version
   of it breaks downstream.

The `summary` is one sentence and it *distinguishes* rather than describes. "Half a turn
against the circle, holding the edge and leaving on a new lobe" earns its place; "a
difficult turn" does not.

Never a numbered procedure. This is a reference, not a lesson plan, and step-by-step
instruction is the coach's job and not a website's.

## Qualification guides

One per governing body: British Ice Skating, Skate Canada, U.S. Figure Skating. The same
five sections in the same order, so the three can be read side by side — while never
pretending the three systems have the same shape underneath, because they do not.

1. **What it is.** One paragraph. The body, the pathway's own name, who takes it and when.
2. **How it is structured.** The ladder, in the body's own numbering and its own words.
   This is the one place a table beats prose.
3. **What each level asks for.** Our sentence for the requirement, their name for the test,
   linked through to the element pages. The element collection does the cross-referencing
   for free, so a single three turn can sit in a British, a Canadian and an American test
   without being written three times.
4. **What is different about it.** The honest paragraph. Where this body's system does not
   line up with the others, and why.
5. **Source and currency.** Which documents, downloaded when, carrying what version
   marking, and what is missing because it sits behind a login.

Three rules specific to the guides:

**Use each body's own vocabulary and never translate it silently.** BIS *Skills*, USFS
*moves in the field*, Skate Canada *Skills assessments* — related, not equal. Flattening
them into one word would be the single most misleading thing this guide could do.

**One table is theirs, and it says so.** The field moves to Skills conversion on
`/tests/older-names/` is British Ice Skating's own, carried because it is a historical
lookup with no honest prose equivalent — a reader who passed Level 6 in 2016 wants a row,
not a paragraph. It is attributed in the table's caption and linked back to BIS. That is
the exception to the rule above, and it is the only one: it exists because the information
is administrative fact of no creative value, and because the alternative was worse to use
in gloves. Anything with substance in it — a sequence, a pattern, a drawing — still gets
written from scratch or not at all.

**Never publish a cross-body table of level equivalences.** Skills 4 is not Preliminary is
not STAR 5, whatever the forum posts say. If a comparison is wanted, compare *elements* —
the element pages already list every test they appear in, in every country, which is a
true comparison rather than an invented one.

**Say what you do not know.** "The requirements above Skills 8 sit behind a member login
and are not covered here" is a better sentence than a plausible guess, and it tells a
reader exactly what to go and check.

### How much of a test to carry

Settled 15/08/2026, after reading the BIS guidance documents. Their exercises are written
as numbered step sequences — *SIDE 1 (1)LFO open chassé (2)RFI (3)LFO sustained edge…* —
and that sequence effectively **is** the syllabus. It is their work.

So a level page carries **which elements appear**, linked through to our element pages, and
**a paragraph in our own voice on what each exercise is working on** — the shape, the
purpose, what it is testing. It does not carry the numbered sequence, and it does not
reproduce their patterns or their drawings. It links out to the governing body's own
document for the exact steps, which is where a skater should be reading them anyway.

The test of whether a sentence is on the right side of that line: could you have written it
having watched the exercise skated, without the document open? If yes, it is ours. If it
only exists because you were copying, it is theirs.

### The shape it took — 30/08/2026

**The exercise is the unit, and it gets a page.** A skater says "Skills 3, exercise 4", so
that is what has a URL. A test owns exercises; an exercise owns elements; the test's element
list is derived from its exercises rather than written out again. `tools/syllabus.mjs`
asserts that a test with exercises keeps no list of its own.

**One entry per exercise, not one per generation.** British Ice Skating revised the Skills
tests on 01/10/2026 and the revision is mostly additive, so an exercise carries a flag —
`current`, `october2026` or `both` — and, where it was genuinely altered, one sentence
saying how. Two sets of prose for the same exercise would drift, and the drift would be
invisible.

**Name the gaps.** An exercise page lists what the guide has no element for, in
`notCovered`, rather than quietly leaving it out. A gap the reader can see is a gap a coach
can correct; a gap they cannot see reads as a claim of completeness. Skills 1's slalom asks
for two-foot power changes of edge, which the rig cannot hold, and the page says so.

**Write the paragraph from the skating, not from the document.** In practice the useful
question is not "what does the sequence say" but "what would go wrong here". Skills 1's
second exercise holds an edge for three seconds; the paragraph is about why three seconds
on a back outside edge is longer than it sounds. That sentence passes the test above — it
could have been written watching it, and it is not in their document.

## Words

Use the rink's words: edge, lobe, cusp, check, run-out, free leg, free side, skating foot,
tracing, flat.

Do not use *simply*, *just*, *easy*, *of course*, *obviously*, *all you have to do*. Every
one of them tells a skater who is struggling that they should not be.

Do not use *master*, *nail*, *conquer*, or any other verb borrowed from a motivational
poster. Elements are learned, held, checked, or not yet.

## Sentence habits

Open short. One idea per sentence. Prefer the concrete number to the vague quantity — *three
and a half degrees* rather than *very little*, because the number is checkable and the
phrase is not.

Em dashes are load-bearing here and easy to overuse. Two per paragraph is plenty.

Do not open a sentence with *It is worth noting that* or *Importantly*. If it were not
worth noting it would not be in the paragraph.

Do not end a page with a summary of the page.
