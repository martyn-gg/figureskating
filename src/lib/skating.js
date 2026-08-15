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

/** LFO, RBI, and so on. */
export const label = s => `${s.foot}${s.dir}${s.edge}`;

const flip = (v, a, b) => (v === a ? b : a);

/** Mirror an edge for a clockwise rotator. Free, and almost no other resource does it. */
export const mirror = s => ({ ...s, foot: flip(s.foot, 'L', 'R') });

/* Every two-foot turn is two bits of information. Everything else — the exit
   edge, whether the lobe continues or reverses, which way the cusp points, which
   way the body rotates — falls out of these. */
export const TURNS = {
  three:   { name: 'Three turn', edgeChanges: true,  rotatesInto: true  },
  bracket: { name: 'Bracket',    edgeChanges: true,  rotatesInto: false },
  rocker:  { name: 'Rocker',     edgeChanges: false, rotatesInto: true  },
  counter: { name: 'Counter',    edgeChanges: false, rotatesInto: false },
};

/** Same foot always; direction always reverses; edge depends on the turn. */
export function exitState(entry, turnKey) {
  const t = TURNS[turnKey];
  if (!t) throw new Error(`unknown turn: ${turnKey}`);
  return {
    foot: entry.foot,
    edge: t.edgeChanges ? flip(entry.edge, 'O', 'I') : entry.edge,
    dir: flip(entry.dir, 'F', 'B'),
  };
}

/** Does the new lobe curve the same way? Derived, never stored. */
export function lobeContinues(entry, turnKey) {
  const x = exitState(entry, turnKey);
  return lobeSense(entry.foot, entry.edge, entry.dir) === lobeSense(x.foot, x.edge, x.dir);
}

/** A sentence a page can print without anyone writing it per element. */
export function describeTurn(entry, turnKey) {
  const t = TURNS[turnKey], x = exitState(entry, turnKey);
  return `${label(entry)} ${t.name.toLowerCase()} to ${label(x)} — the edge ` +
    `${t.edgeChanges ? 'changes' : 'holds'}, the skater rotates ` +
    `${t.rotatesInto ? 'into the circle' : 'against it'}, and the lobe ` +
    `${lobeContinues(entry, turnKey) ? 'continues' : 'reverses'}.`;
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
