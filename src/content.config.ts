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
    kind: z.enum(['edge', 'turn', 'jump', 'spin', 'position', 'step', 'dance']),
    summary: z.string(),
    entry: z.object({ foot, edge, dir }).optional(),
    /* One-foot turns first, then the two-foot ones. A mohawk and a choctaw change
       foot as well as direction, which the model derives rather than stores —
       see src/lib/skating.js. */
    turn: z.enum(['three', 'bracket', 'rocker', 'counter',
                  'mohawk', 'choctaw', 'twizzle', 'loop']).optional(),
    jump: z.object({
      takeoff: z.object({ foot, edge, dir }),
      landing: z.object({ foot, edge, dir }),
      assisted: z.boolean().describe('true for toe jumps, false for edge jumps'),
      rotations: z.number(),
    }).optional(),
    /* Poses live in the body-frame rig, not here — this only names the move. */
    rig: z.string().optional(),
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
       so one element can appear in a British, Canadian and American test at once. */
    elements: z.array(reference('elements')).default([]),
    sourceUrl: z.string().url().optional(),
    verified,
  }),
});

/* Deliberately names the capacity rather than prescribing a movement — that tells a
   skater what to ask a coach or physio for, and keeps a website out of the business
   of instructing exercise. Empty for now; the schema exists so elements can link to it. */
const exercises = defineCollection({
  loader: md('./src/data/exercises'),
  schema: z.object({
    name: z.string(),
    capacity: z.array(z.string()),
    prepares: z.array(reference('elements')).default([]),
    source: z.string(),
    verified,
  }),
});

export const collections = { elements, tests, exercises };
