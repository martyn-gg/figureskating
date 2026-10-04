import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Foot, edge and direction are the three facts everything else is derived from —
   see src/lib/skating.js. They are stored, never the lobe direction itself. */
const foot = z.enum(['L', 'R']);
const edge = z.enum(['O', 'I']);
const dir  = z.enum(['F', 'B']);

/* Mechanics written by a non-expert stay flagged until someone qualified has
   checked them. Nothing renders as authoritative by accident. */
const verified = z.object({
  checked: z.boolean().default(false),
  by: z.string().optional(),
  on: z.date().optional(),
}).default({ checked: false });

const md = base => glob({ pattern: '**/[^_]*.md', base });

const elements = defineCollection({
  loader: md('./src/data/elements'),
  schema: z.object({
    name: z.string(),
    /* `basic` added 19/09/2026. Everything else in this enum starts from a curve
       the skater is already holding; `basic` is the floor below that — the push
       itself, the glide, the swizzle, the stop, the two-foot turn. Nine exercises
       said so in `notCovered` before the kind existed, all of them some version of
       *the step wide and the push back*. A basic mostly has no `entry`, because
       most of them are two-foot or straight, and the derived machinery keys off
       `entry` — so a basic is written rather than generated, and that is the point
       of it being its own kind rather than an edge with a missing field. */
    kind: z.enum(['edge', 'turn', 'twizzle', 'transition', 'combination', 'jump', 'spin', 'position', 'step', 'dance', 'hold', 'basic', 'sequence']),
    summary: z.string(),
    entry: z.object({ foot, edge, dir }).optional(),
    /* One-foot turns first, then the two-foot ones. A mohawk and a choctaw change
       foot as well as direction, which the model derives rather than stores —
       see src/lib/skating.js. */
    /* Twizzles are one key per rotation count, not one key plus a number, because
       the rotation count decides the exit — a half turn reverses the direction of
       travel and takes the edge letter with it. Storing it as data on the element
       would put a fact that changes the exit somewhere exitState cannot see it. */
    turn: z.enum(['three', 'bracket', 'rocker', 'counter',
                  'mohawk', 'choctaw',
                  'coe', 'loop', 'crossover', 'chasse', 'crossroll',
                  'crossbehind', 'slipchasse', 'stepwide', 'pushback',
                  'twizzle', 'twizzle15', 'twizzle2', 'twizzle25']).optional(),
    /* A cluster: an ordered chain in which each turn's exit is the next one's
       entry. Only the entry edge and the sequence are stored; every edge the
       skater passes through in between is derived. */
    /* A cluster may hold a change of edge, a cross roll or a twizzle as well as
       turns and steps — added 30/08/2026 with the six pairings the syllabus writes
       as one thing. This list is a third statement of the model's turn keys, after
       ALL_TURNS and the `turn` enum above; worth collapsing into one import from
       skating.js the next time this file is opened. */
    turns: z.array(z.enum(['three', 'bracket', 'rocker', 'counter',
                           'mohawk', 'choctaw',
                           'coe', 'crossroll',
                           'twizzle', 'twizzle15', 'twizzle2', 'twizzle25'])).optional(),
    jump: z.object({
      /* Which jump in skating.js's JUMPS this is, and at what count (2 for a double).
         Everything else in this block is jumpAt(of, count) written out, and
         tools/jumps.mjs holds every page to it. 04/10/2026. */
      of: z.string(),
      count: z.number().int().default(1),
      takeoff: z.object({ foot, edge, dir }),
      landing: z.object({ foot, edge, dir }),
      assisted: z.boolean().describe('true for toe jumps, false for edge jumps'),
      rotations: z.number(),
    }).optional(),
    /* OTHER NAMES THE SAME MOVEMENT GOES BY.

       The guide uses the governing body's word and never translates it silently —
       that rule does not move. But a skater searching for what their coach calls
       it will not find a page filed under a name they have never heard, and this
       site has no search box, so an unfamiliar name is a dead end.

       So: the canonical name stays BIS's, and the alternatives are carried beside
       it as text on the page and gathered on /elements/other-names/. They are for
       FINDING a page, never for renaming one.

       Written foot-neutrally, because an alias names the movement rather than the
       element: "open chassé", not "left forward outside open chassé". Nothing goes
       in here that cannot be pointed at a source — the list is short on purpose. */
    aliases: z.array(z.string()).default([]),
    /* WHAT ONE COUNTRY'S PROGRAMME CALLS IT — 03/10/2026. The country copies
       (src/lib/country.js) head the page with this name. It is not a translation:
       each value is the word a governing body's own level list uses for the same
       movement, taken from the grade pages in src/data/grades, and
       tools/countries.mjs holds every value to being one of `aliases` too, so the
       root copy finds it in search as well. Absent for most elements, which go by
       one name everywhere. */
    names: z.object({ uk: z.string(), us: z.string(), au: z.string(), nz: z.string() })
      .partial().default({}),
    /* Poses live in the body-frame rig, not here — this only names the move. */
    rig: z.string().optional(),
    /* A PATTERN DANCE — 03/10/2026. The steps as the dance diagram writes them: the edge
       (a change of edge as four letters, RFOI), the beats it is held for (two numbers
       for a change of edge), and how it is reached, as an abbreviation src/lib/dance.js
       knows. tools/dance.mjs holds the list to whole measures and alternating feet. */
    dance: z.object({
      rhythm: z.string(),
      meter: z.enum(['3/4', '4/4', '2/4', '6/8']),
      bpm: z.number().positive(),
      hold: z.string(),
      sameSteps: z.boolean(),
      /* Seconds one pattern takes, from the timing chart in the same rulebook. With the
         tempo it says how many beats the step list should come to, which is the check
         on a list read off a page by hand. */
      patternSeconds: z.number().positive().optional(),
      /* THE STEP CHART, for the dances whose steps carry turns, double steps or a
         different step for each partner. Each row keeps the rulebook's notation as
         written, because a three turn inside a progressive or a wide step on two feet
         does not reduce to one edge, and a lossy version would be wrong in a way nobody
         could see. `beats` is a sum as written, "2+1" or "0.5+0.5". */
      chart: z.array(z.object({
        n: z.string(),
        hold: z.string().optional(),
        lead: z.string().optional(),
        follow: z.string().optional(),
        beats: z.string().regex(/^[0-9.]+(\+[0-9.]+)*$/),
        /* Where the two partners' steps under one number last different times and
           no follow-only row carries the difference (the Tango Romantica's 35a and
           35b: the lead 2 and 4, the follow 1+3 and 1), the chart gives the lead its
           own count. `beats` is then the follow's, and the bar total is the same
           either way: tools/dance.mjs checks that it is. */
        leadBeats: z.string().regex(/^[0-9.]+(\+[0-9.]+)*$/).optional(),
        note: z.string().optional(),
      })).min(1).optional(),
      steps: z.array(z.object({
        n: z.number().int().positive(),
        edge: z.string().regex(/^[LR][FB](O|I|OI|IO)$/),
        beats: z.union([z.number().positive(), z.array(z.number().positive()).length(2)]),
        how: z.enum(['Pr', 'Ch', 'SlCh', 'SwR', 'sw', 'CR', 'XB', 'XF', 'CSt', 'opCSt']).optional(),
        opt: z.string().optional(),
      })).min(1).optional(),
    }).refine(d => !!d.steps !== !!d.chart, 'a dance has steps or a chart, not both').optional(),
    /* A TRACING FOR AN ELEMENT THAT HAS NO ENTRY EDGE — added 19/09/2026.

       Everything with an `entry` draws itself: the page hands foot, edge and
       direction to `buildTrace` and gets the lobe. The basics have no entry —
       most are two-foot or straight — so twenty-two pages shipped drawing
       nothing at all, which is the fault Session 14 found on six jump pages and
       fixed. A field guide whose argument is that you can see the shape cannot
       have its foundation be prose.

       The segments are EXACTLY a rig move's `path`, and they are fed to
       `buildPath` in rig-math.js — the same function that draws the tracing
       under the body-frame rig. Not a second tracing engine: if the model ever
       changed its mind about which way a lobe curves, this and the rig would
       change together, which is the rule the derived tier already lives by.

       `feet` is how many blades are on the ice. A two-foot glide that drew one
       line would be claiming the wrong element — the two tracings a boot's width
       apart ARE the fact, and it is what separates these from the edges. */
    trace: z.object({
      radius: z.number().positive().default(200),
      feet: z.union([z.literal(1), z.literal(2)]).default(1),
      path: z.array(z.union([
        z.object({ kind: z.literal('line'), len: z.number().positive(), span: z.number().optional() }),
        z.object({ kind: z.literal('arc'), foot, edge, dir,
                   sweep: z.number(), span: z.number().optional() }),
      ])).min(1),
    }).optional(),
    prerequisites: z.array(reference('elements')).default([]),
    verified,
  }),
});

const tests = defineCollection({
  loader: md('./src/data/tests'),
  schema: z.object({
    name: z.string(),
    governingBody: z.enum(['BIS', 'SkateCanada', 'USFS']),
    discipline: z.enum(['skills', 'freeSkating', 'patternDance', 'freeDance', 'pairs', 'synchro']),
    level: z.union([z.number(), z.string()]),
    /* An ordered list of references. The element itself is never duplicated,
       so one element can appear in a British, Canadian and American test at once.

       OPTIONAL, and empty for anything with exercises. A BIS Skills test is a set
       of exercises and each exercise carries its own elements, so the test's list
       is DERIVED from them rather than written twice — the same rule that keeps
       exit edges out of the element files. Tests that are a flat list of elements
       still use this. */
    elements: z.array(reference('elements')).default([]),
    sourceUrl: z.string().url().optional(),
    verified,
  }),
});

/* A BIS Skills exercise: the unit a skater and a coach actually name out loud —
   "Skills 3, exercise 4". It is the level that owns elements, not the test.

   WHAT IS AND IS NOT RECORDED. The guide carries which elements an exercise calls
   for, linked to their own pages, and a paragraph in our own voice on what the
   exercise is working on. It does not carry BIS's numbered sequences, their
   patterns, their drawings or their learning objectives — those are their work and
   the page links out to them. See docs/style.md. */
const exercises = defineCollection({
  loader: md('./src/data/exercises'),
  schema: z.object({
    name: z.string(),
    test: reference('tests'),
    order: z.number().int().positive(),
    /* What this governing body calls the unit. BIS Skills 1–7 are numbered exercises;
       Skills 8 is three sections skated as one programme, and Skate Canada and USFS will
       bring their own words again. The pages print this rather than assuming "exercise",
       which was true for seven tests out of eight and would have quietly been wrong on
       the eighth. */
    unit: z.enum(['exercise', 'section']).default('exercise'),
    summary: z.string(),
    /* British Ice Skating revised the National Skills Tests on 01/10/2026. The
       revision is mostly additive, so ONE entry per exercise carries both
       generations rather than two sets of prose that would drift apart:

         current      in the pre-October documents only
         october2026  added on 01/10/2026
         both         in both — and if it was altered, changesInOctober says how.

       Four exercises were altered rather than merely reworded, which the update
       announcement does not mention. Where that happens the prose describes the
       exercise as it stands and changesInOctober states the difference. */
    syllabus: z.enum(['current', 'october2026', 'both']),
    changesInOctober: z.string().optional(),
    elements: z.array(reference('elements')).default([]),
    /* Things the exercise asks for that this guide has no element for, named
       rather than quietly omitted. A gap the reader can see is a gap a coach can
       correct; a gap they cannot see reads as a claim of completeness. */
    notCovered: z.array(z.string()).default([]),
    sourceUrl: z.string().url().optional(),
    verified,
  }),
});

/* Deliberately names the capacity rather than prescribing a movement — that tells a
   skater what to ask a coach or physio for, and keeps a website out of the business
   of instructing exercise. Empty for now; the schema exists so elements can link to
   it. It was called `exercises` until 30/08/2026, which was the wrong name for it:
   in this sport an exercise is a numbered part of a Skills test, and that is what
   the collection above is. */
const conditioning = defineCollection({
  loader: md('./src/data/conditioning'),
  schema: z.object({
    name: z.string(),
    capacity: z.array(z.string()),
    prepares: z.array(reference('elements')).default([]),
    source: z.string(),
    verified,
  }),
});

/* A COUNTRY'S GRADING SCHEME, LAID OUT AS A WAY IN — 03/10/2026, Martyn: "these don't
   need to bulk out each element, but if a skater prefers to start at the grade and work
   in". So a grade page links into the elements and nothing links back: an element page
   lists British Ice Skating's tests and exercises, as it always has, and is not given a
   line for every other country's ladder.

   One file per programme (Learn to Skate USA, U.S. Figure Skating's skating skills, and
   so on). Each level holds items in the programme's own words, because naming a skill
   is citation; each item points at the guide's elements where they exist, or carries a
   note saying the guide has no page. A gap the reader can see, as with notCovered. */
const grades = defineCollection({
  loader: md('./src/data/grades'),
  schema: z.object({
    name: z.string(),
    body: z.string(),
    country: z.enum(['UK', 'USA', 'New Zealand', 'Australia']),
    order: z.number().int(),
    summary: z.string(),
    source: z.string(),
    sourceUrl: z.string().url(),
    /* Words added after each level name when the levels are searchable, for a body with
       two ladders that share level names: British Ice Skating's National 1 is a free
       skating test and a pattern dance test. */
    levelSuffix: z.string().optional(),
    levels: z.array(z.object({
      name: z.string(),
      /* The names the same level goes by now, where a programme has renamed its
         levels since the document the page follows. Searchable, and printed
         beside the level. */
      aka: z.array(z.string()).default([]),
      note: z.string().optional(),
      items: z.array(z.object({
        label: z.string(),
        elements: z.array(reference('elements')).default([]),
        page: z.string().optional(),
        note: z.string().optional(),
      })).min(1),
    })).min(1),
    verified,
  }),
});

export const collections = { elements, tests, exercises, conditioning, grades };
