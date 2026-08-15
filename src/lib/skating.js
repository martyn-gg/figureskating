/* The derived model. Pure functions, no DOM — this is what the content layer,
   the diagrams and the tests all agree on.

   The whole guide rests on one observation: which way a lobe curves is not a
   fact you store about an element, it is a product of three facts about the
   foot. Store those three, derive everything else, and a few hundred elements
   cost almost nothing to add. */

/** +1 = anticlockwise seen from above the ice. */
export function lobeSense(foot, edge, dir) {
  return (foot === 'L' ? 1 : -1) * (edge === 'O' ? 1 : -1) * (dir === 'F' ? 1 : -1);
}

/** LFO, RBI, and so on: foot, then direction, then edge. */
export const label = s => `${s.foot}${s.dir}${s.edge}`;

const WORDS = { L: 'left foot', R: 'right foot', F: 'forwards', B: 'backwards',
                O: 'outside edge', I: 'inside edge' };

/** The same three letters in words — "left foot, forwards, outside edge". */
export const describeEdge = s => `${WORDS[s.foot]}, ${WORDS[s.dir]}, ${WORDS[s.edge]}`;

const flip = (v, a, b) => (v === a ? b : a);

/** Mirror an edge for a clockwise rotator. Free, and almost no other resource does it. */
export const mirror = s => ({ ...s, foot: flip(s.foot, 'L', 'R') });

/* Every one-foot turn is two bits of information. Everything else — the exit
   edge, whether the lobe continues or reverses, which way the cusp points, which
   way the body rotates — falls out of these. */
export const TURNS = {
  three:   { name: 'Three turn', edgeChanges: true,  rotatesInto: true,  changesFoot: false },
  bracket: { name: 'Bracket',    edgeChanges: true,  rotatesInto: false, changesFoot: false },
  rocker:  { name: 'Rocker',     edgeChanges: false, rotatesInto: true,  changesFoot: false },
  counter: { name: 'Counter',    edgeChanges: false, rotatesInto: false, changesFoot: false },
};

/* The two-foot turns, and the reason the model did not need extending to hold
   them. A mohawk changes foot and keeps the edge character; a choctaw changes
   foot and changes it. Feed either through lobeSense — the foot flips, the
   direction flips — and a mohawk's lobe continues while a choctaw's reverses.
   That is precisely what British Ice Skating's own definitions say, and nothing
   here had to be told it.

   There is no cusp: the tracing stops on one blade and starts on the other, a
   step rather than a pivot. `rotatesInto` is null and the renderer draws a break
   instead of a point. */
export const STEPS = {
  mohawk:  { name: 'Mohawk',  edgeChanges: false, rotatesInto: null, changesFoot: true },
  choctaw: { name: 'Choctaw', edgeChanges: true,  rotatesInto: null, changesFoot: true },
};

/** Every turn in the guide, one-foot and two-foot alike. */
export const ALL_TURNS = { ...TURNS, ...STEPS };

/** Direction always reverses. The foot and the edge depend on the turn. */
export function exitState(entry, turnKey) {
  const t = ALL_TURNS[turnKey];
  if (!t) throw new Error(`unknown turn: ${turnKey}`);
  return {
    foot: t.changesFoot ? flip(entry.foot, 'L', 'R') : entry.foot,
    edge: t.edgeChanges ? flip(entry.edge, 'O', 'I') : entry.edge,
    dir: flip(entry.dir, 'F', 'B'),
  };
}

/* Turns are done in clusters as often as singly — a rocker-counter, a bracket-
   counter, a three turn straight into a mohawk. A cluster is not a new kind of
   element so much as a new shape of one: an ordered chain in which each turn's
   exit is the next one's entry. Nothing else is needed to describe it. */

/* The standard named clusters. Their display names live here rather than in the
   generator, so the page that lists them and the script that writes them cannot
   end up calling the same thing two different things. */
export const CLUSTERS = {
  'double-three':         { name: 'double three',         turns: ['three', 'three'] },
  'three-mohawk':         { name: 'three-mohawk',         turns: ['three', 'mohawk'] },
  'rocker-counter':       { name: 'rocker-counter',       turns: ['rocker', 'counter'] },
  'bracket-counter':      { name: 'bracket-counter',      turns: ['bracket', 'counter'] },
  'counter-three':        { name: 'counter-three',        turns: ['counter', 'three'] },
  'counter-mohawk':       { name: 'counter-mohawk',       turns: ['counter', 'mohawk'] },
  'rocker-choctaw':       { name: 'rocker-choctaw',       turns: ['rocker', 'choctaw'] },
  'choctaw-three-rocker': { name: 'choctaw-three-rocker', turns: ['choctaw', 'three', 'rocker'] },
};

/** Which named cluster a sequence of turns is, if it is one. */
export const clusterOf = turns =>
  Object.entries(CLUSTERS).find(([, c]) => c.turns.join() === turns.join())?.[1] ?? null;

/** Every state a chain passes through, entry first, final exit last. */
export function chainStates(entry, turnKeys) {
  const states = [entry];
  for (const k of turnKeys) states.push(exitState(states[states.length - 1], k));
  return states;
}

/** Where a chain ends up. */
export const chainExit = (entry, turnKeys) => chainStates(entry, turnKeys).at(-1);

/** A sentence for a cluster, listing the edges it passes through. */
export function describeChain(entry, turnKeys) {
  const states = chainStates(entry, turnKeys);
  const parts = turnKeys.map((k, i) =>
    `${ALL_TURNS[k].name.toLowerCase()} to ${label(states[i + 1])}`);
  const feet = new Set(states.map(s => s.foot)).size;
  return `${label(entry)}, ${parts.join(', then ')}. ` +
    `${turnKeys.length} turns on ${feet === 1 ? 'one foot' : 'two feet'}, ` +
    `and the skater finishes ${chainReturns(entry, turnKeys) ? 'on the edge they started on' : `on ${label(states.at(-1))}`}.`;
}

/** Some clusters come back to where they began. Worth knowing; never stored. */
export const chainReturns = (entry, turnKeys) =>
  label(chainExit(entry, turnKeys)) === label(entry);

/** Does the new lobe curve the same way? Derived, never stored. */
export function lobeContinues(entry, turnKey) {
  const x = exitState(entry, turnKey);
  return lobeSense(entry.foot, entry.edge, entry.dir) === lobeSense(x.foot, x.edge, x.dir);
}

/** A sentence a page can print without anyone writing it per element. */
export function describeTurn(entry, turnKey) {
  const t = ALL_TURNS[turnKey], x = exitState(entry, turnKey);
  const lobe = lobeContinues(entry, turnKey) ? 'continues' : 'reverses';
  if (t.changesFoot) {
    return `${label(entry)} ${t.name.toLowerCase()} to ${label(x)} — the skater steps ` +
      `onto the other foot, the edge ${t.edgeChanges ? 'changes' : 'holds'}, and the ` +
      `lobe ${lobe}. There is no cusp, because nothing pivots.`;
  }
  return `${label(entry)} ${t.name.toLowerCase()} to ${label(x)} — the edge ` +
    `${t.edgeChanges ? 'changes' : 'holds'}, the skater rotates ` +
    `${t.rotatesInto ? 'into the circle' : 'against it'}, and the lobe ${lobe}.`;
}

/* The second derived table. For an anticlockwise rotator all six land on the same
   edge; they differ only in takeoff edge and whether a toe pick is used. Flip vs
   Lutz is purely the takeoff edge, which is the entire flutz argument. */
export const JUMPS = {
  toeLoop:  { name: 'Toe loop',  takeoff: { foot: 'R', edge: 'O', dir: 'B' }, assisted: true,  rotations: 1 },
  salchow:  { name: 'Salchow',   takeoff: { foot: 'L', edge: 'I', dir: 'B' }, assisted: false, rotations: 1 },
  loop:     { name: 'Loop',      takeoff: { foot: 'R', edge: 'O', dir: 'B' }, assisted: false, rotations: 1 },
  flip:     { name: 'Flip',      takeoff: { foot: 'L', edge: 'I', dir: 'B' }, assisted: true,  rotations: 1 },
  lutz:     { name: 'Lutz',      takeoff: { foot: 'L', edge: 'O', dir: 'B' }, assisted: true,  rotations: 1 },
  waltz:    { name: 'Waltz jump', takeoff: { foot: 'L', edge: 'O', dir: 'F' }, assisted: false, rotations: 0.5 },
  axel:     { name: 'Axel',      takeoff: { foot: 'L', edge: 'O', dir: 'F' }, assisted: false, rotations: 1.5 },
};

/** Every jump in the list lands here, which is why the takeoff is the whole story. */
export const LANDING = { foot: 'R', edge: 'O', dir: 'B' };

/** Jumps sharing a takeoff edge — the pairs that get confused with each other. */
export function confusableWith(jumpKey) {
  const j = JUMPS[jumpKey];
  if (!j) return [];
  return Object.entries(JUMPS)
    .filter(([k, o]) => k !== jumpKey && label(o.takeoff) === label(j.takeoff))
    .map(([k]) => k);
}
