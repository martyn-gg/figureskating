/* PATTERN DANCES — 03/10/2026, Session 26, Martyn: we need a section for Dance, and it
   was going to hold the pattern dances.

   A pattern dance is a fixed list of steps skated to music: each step an edge, held for a
   number of beats, sometimes reached in a particular way (a progressive, a chassé, a swing
   roll). The step lists here are read off the dance diagrams in US Figure Skating's
   2026-27 rulebook, which carries every pattern dance with its step numbers, edges and
   beats, and the words for the abbreviations come from the key printed before them. The
   guide does not reproduce the diagrams; it records the steps as facts and says what each
   one is.

   `how` is the abbreviation the diagram writes after or before the edge. Where the guide
   has an element for that kind of step, `turn` names it, and a step is linked to that
   element only when the guide's own model, run from the step before, lands on the edge
   the dance writes. Where it does not, the step is not linked and tools/dance.mjs says so,
   because that is the model and a governing body disagreeing, and worth knowing. */
import { exitState } from './skating.js';

export const DANCE_KEY = {
  Pr:    { word: 'progressive' },
  Ch:    { word: 'chassé', turn: 'chasse' },
  SlCh:  { word: 'slide chassé' },
  SwR:   { word: 'swing roll' },
  sw:    { word: 'swing', note: 'the free leg swung through' },
  CR:    { word: 'cross roll', turn: 'crossroll' },
  XB:    { word: 'cross step behind', turn: 'crossbehind' },
  XF:    { word: 'cross step in front' },
  CSt:   { word: 'C step', turn: 'mohawk' },
  opCSt: { word: 'open C step', turn: 'mohawk' },
};

/** "RFOI" → the first edge as a state; a change of edge is written as both letters. */
export const edgeOfStep = s => ({ foot: s.edge[0], dir: s.edge[1], edge: s.edge[2] });

/** The step a dance step follows, wrapping round: a pattern repeats. The step before
    a change of edge ends on its second letter. */
export const before = (steps, i) => {
  const p = steps[(i - 1 + steps.length) % steps.length];
  return { foot: p.edge[0], dir: p.edge[1], edge: p.edge[p.edge.length - 1] };
};

/** The element a step's `how` names, if the guide's model agrees with the dance about
    where it lands. Returns { slug } or { disagrees: exitState } or null. */
export function stepLink(steps, i) {
  const s = steps[i], k = s.how && DANCE_KEY[s.how];
  if (!k || !k.turn) return null;
  const from = before(steps, i), to = edgeOfStep(s);
  const ex = exitState(from, k.turn);
  const lab = e => `${e.foot}${e.dir}${e.edge}`;
  if (lab(ex) === lab(to)) return { slug: `${lab(from).toLowerCase()}-${k.turn}` };
  return { disagrees: lab(ex), from: lab(from) };
}

export const totalBeats = steps =>
  steps.reduce((a, s) => a + (Array.isArray(s.beats) ? s.beats.reduce((x, y) => x + y, 0) : s.beats), 0);
