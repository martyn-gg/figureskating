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
    kind: z.enum(['edge', 'turn', 'twizzle', 'transition', 'combination', 'jump', 'spin', 'position', 'step', 'dance', 'basic']),
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
                  'crossbehind', 'slipchasse',
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
    /* Poses live in the body-frame rig, not here — this only names the move. */
    rig: z.string().optional(),
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

export const collections = { elements, tests, exercises, conditioning };
