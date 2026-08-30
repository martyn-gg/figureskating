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

/* TWO BLADES ON THE ICE, and the one fact that makes them cheap.

   A pose with both blades down is not two independent feet. Both blades are on
   one circle, so they share a lobe — and a shared lobe means an equal lobeSense.
   Feed that back through the same three flags and the second blade's edge letter
   is not a fact to store: it falls out of the first blade's state and the second
   foot's direction of travel.

   British Ice Skating's own Skills 1 slalom writes the pairs out — RFI & LFO,
   RFO & LFI, LBI & RBO, LBO & RBI — and every one of the four has equal
   lobeSense. Neither their document nor this model was told; it is the same
   agreement that already held for mohawks and choctaws.

   The direction argument is what separates the two shapes a two-blade position
   comes in. Both feet the same way is a two-foot power change or an Ina Bauer.
   Opposed — one forward, one backward — is a spread eagle, which is what the
   turnout IS, and the derived edge letter comes out the same as the first
   blade's rather than opposite. */
export function secondFoot(ref, dir2 = ref.dir) {
  const foot = ref.foot === 'L' ? 'R' : 'L';
  const want = lobeSense(ref.foot, ref.edge, ref.dir);
  const rest = (foot === 'L' ? 1 : -1) * (dir2 === 'F' ? 1 : -1);
  return { foot, edge: want * rest === 1 ? 'O' : 'I', dir: dir2 };
}

/* Every one-foot turn is two bits of information. Everything else — the exit
   edge, whether the lobe continues or reverses, which way the cusp points, which
   way the body rotates — falls out of these. */
export const TURNS = {
  three:   { name: 'Three turn', edgeChanges: true,  rotatesInto: true,  changesFoot: false, join: 'cusp' },
  bracket: { name: 'Bracket',    edgeChanges: true,  rotatesInto: false, changesFoot: false, join: 'cusp' },
  rocker:  { name: 'Rocker',     edgeChanges: false, rotatesInto: true,  changesFoot: false, join: 'cusp' },
  counter: { name: 'Counter',    edgeChanges: false, rotatesInto: false, changesFoot: false, join: 'cusp' },
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
  mohawk:  { name: 'Mohawk',  edgeChanges: false, rotatesInto: null, changesFoot: true, join: 'step' },
  choctaw: { name: 'Choctaw', edgeChanges: true,  rotatesInto: null, changesFoot: true, join: 'step' },
};

/* The connecting material. None of these reverses the direction of travel, which
   is exactly what separates them from a turn: you go on the way you were going.
   Everything else is the same three flags, so lobeSense keeps working — a change
   of edge reverses the lobe because one flag flipped, a crossover keeps it
   because two did.

   `join` is how the tracing is drawn where the element happens, and it is stored
   rather than inferred because four different things happen there: a cusp where
   the blade pivots, a roll where it changes edge without pivoting, a small circle
   for a loop, and a break where the skater steps onto the other foot. */
export const TRANSITIONS = {
  coe:       { name: 'Change of edge', edgeChanges: true,  changesFoot: false, reversesDir: false, rotatesInto: null, join: 'roll' },
  loop:      { name: 'Loop',           edgeChanges: false, changesFoot: false, reversesDir: false, rotatesInto: null, join: 'loop' },
  crossover: { name: 'Crossover',      edgeChanges: true,  changesFoot: true,  reversesDir: false, rotatesInto: null, join: 'step' },
  chasse:    { name: 'Chassé',         edgeChanges: true,  changesFoot: true,  reversesDir: false, rotatesInto: null, join: 'step' },
  crossroll: { name: 'Cross roll',     edgeChanges: false, changesFoot: true,  reversesDir: false, rotatesInto: null, join: 'step' },
  /* Added 30/08/2026, both defined by British Ice Skating and both confirmed
     against their own sequences rather than assumed.

     CROSSED STEP BEHIND takes the cross roll's flags, not the crossover's. Their
     definition constrains PLACEMENT — the free foot goes down on the outer edge
     side with the leg crossed behind — and says nothing about the resulting edge,
     so the flags had to come from the sequences. Every XB in the syllabus, in both
     generations, runs outside edge to outside edge: Skills 8 section 2 writes
     RBO -> XB-LBO twice. So the edge is held, which is a cross roll's shape and
     not a crossover's. That it draws the same tracing as a cross roll is the same
     honest collision as crossover against chassé — placement is the difference and
     a blade cannot draw placement.

     SLIP CHASSÉ takes the chassé's flags exactly, and their sequences agree:
     Skills 5 exercise 3 writes RFO slip chassé into LFI, which is what exitState
     gives. It is NOT the slip STEP, which is a separate entry in their definitions
     with both blades flat on the ice and is still outside this model. */
  crossbehind: { name: 'Crossed step behind', edgeChanges: false, changesFoot: true, reversesDir: false, rotatesInto: null, join: 'step' },
  slipchasse:  { name: 'Slip chassé',         edgeChanges: true,  changesFoot: true, reversesDir: false, rotatesInto: null, join: 'step' },
};

/* Twizzles. The one element that does not fall out of the three flags, and the
   reason is worth stating, because it is the model's own axiom failing.

   A twizzle is a travelling turn on one foot, rotated continuously. BIS's own
   definition adds that a series of checked three turns will not do, "as this does
   not constitute a continuous action", and that if the travelling stops it has
   become a spin. Both halves of that are geometry:

   - **No cusps.** A three turn reverses the blade by pivoting: the tracing comes
     to a point, and the direction of travel flips there. A twizzle's tracing never
     does that. Its tangent winds all the way round instead, which on a curve that
     is also advancing means a small loop — a curl — per rotation. Cusps against
     curls is exactly "checked" against "continuous".
   - **It travels.** Shrink the advance to nothing and the curls collapse onto one
     circle traced over and over, which is a pirouette. The travel is not
     decoration; it is what keeps it a turn.

   What does NOT fall out is the half rotation. A tangent can only wind in whole
   turns, so the extra half of a 1.5 belongs to the body turning against the blade
   — the skid. Everywhere else in this model a blade points along its own tracing;
   through a twizzle it does not, and that single exception is why twizzles needed
   their own treatment rather than four more rows in TURNS.

   Two flags, both computed from the rotation count rather than typed in:

   - The curls never change the way they curve — a tangent that winds one way
     cannot also wind the other — so the lobe CONTINUES, always.
   - A half rotation leaves the skater facing the other way, so the direction of
     travel reverses. The lobe continuing then forces the edge letter to flip with
     it, because foot, edge and direction have to keep the same lobeSense.

   So edgeChanges and reversesDir are one flag here, on exactly when the rotation
   count ends in a half. LFI, one and a half, comes out LBO — and the edge letter
   changed without the blade ever changing which way it curved. */
const twizzle = (rotations, name) => ({
  name, rotations,
  changesFoot: false,
  reversesDir: rotations % 1 !== 0,
  edgeChanges: rotations % 1 !== 0,
  rotatesInto: null,
  join: 'twizzle',
});

/** 1.5 is not how anyone writes it on a syllabus. */
export const halves = n => (n % 1 ? `${Math.floor(n)}\u00bd` : String(n));

export const TWIZZLES = {
  twizzle:   twizzle(1,   'Twizzle'),
  twizzle15: twizzle(1.5, '1½ twizzle'),
  twizzle2:  twizzle(2,   'Double twizzle'),
  /* Skills 7 exercise 3 asks for one, out of a backward inside counter. It costs
     one line because the count is the key and both flags compute from it — which
     is the whole argument for keying twizzles this way rather than storing a
     number on the element. */
  twizzle25: twizzle(2.5, '2½ twizzle'),
};

/** Everything one element can turn into another with. */
export const ALL_TURNS = { ...TURNS, ...STEPS, ...TRANSITIONS, ...TWIZZLES };

/** Three flags decide the exit. Nothing else is stored anywhere. */
export function exitState(entry, turnKey) {
  const t = ALL_TURNS[turnKey];
  if (!t) throw new Error(`unknown turn: ${turnKey}`);
  return {
    foot: t.changesFoot ? flip(entry.foot, 'L', 'R') : entry.foot,
    edge: t.edgeChanges ? flip(entry.edge, 'O', 'I') : entry.edge,
    dir: t.reversesDir === false ? entry.dir : flip(entry.dir, 'F', 'B'),
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
  /* Skills 5 exercise 1, both forward outside entries. A chain costs the same
     whatever its length — every edge in between comes out of exitState — so a
     third repetition is one more item in a list rather than a third element. */
  'triple-three':         { name: 'triple three',         turns: ['three', 'three', 'three'] },

  /* THE PAIRINGS THE SYLLABUS WRITES AS ONE THING — 30/08/2026, Martyn's call:
     a skater should see one turn run into the next in the animation, which is
     what a cluster page gives them and a pair of separate pages does not.

     Each is a run British Ice Skating writes with a hyphen in its own sequences,
     and each was listed here as its parts with a notCovered line until now. Note
     what these add that the first eight did not: a cluster may now contain a
     CHANGE OF EDGE, a CROSS ROLL and a TWIZZLE, not only turns and steps. Nothing
     in exitState or buildTrace needed telling — the chain loop already joined all
     five kinds, because `join` was stored on the element rather than inferred
     from whether it was a turn. That decision was made for the transitions and it
     paid here. */
  'double-three-mohawk':          { name: 'double three-mohawk',          turns: ['three', 'three', 'mohawk'] },
  'rocker-mohawk':                { name: 'rocker-mohawk',                turns: ['rocker', 'mohawk'] },
  'bracket-crossroll':            { name: 'bracket-cross roll',           turns: ['bracket', 'crossroll'] },
  'counter-two-and-a-half-twizzle': { name: 'counter-2½ twizzle',         turns: ['counter', 'twizzle25'] },
  'three-coe-double-twizzle':     { name: '3-turn-change of edge-double twizzle', turns: ['three', 'coe', 'twizzle2'] },
  'rocker-counter-double-twizzle':{ name: 'rocker-counter-double twizzle', turns: ['rocker', 'counter', 'twizzle2'] },
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
  if (t.join === 'twizzle') {
    const curls = Math.floor(t.rotations);
    const rot = t.rotations === 1 ? 'one rotation' : halves(t.rotations) + ' rotations';
    const curled = curls === 1 ? 'one curl' : curls + ' curls';
    const tail = t.reversesDir
      ? ', and the half rotation turns the skater to face the other way, which is why the '
        + 'edge letter changes without the blade ever changing which way it curves'
      : ', because a curl cannot curve against itself';
    return label(entry) + ' ' + t.name.toLowerCase() + ' to ' + label(x) + ' \u2014 ' + rot
      + ' on one foot, travelling, leaving ' + curled + ' in the tracing and no cusp anywhere. '
      + 'The lobe continues' + tail + '.';
  }
  if (t.reversesDir === false) {
    const how = { roll: 'the blade rolls from one edge to the other without pivoting',
                  loop: 'the blade traces a small circle and comes back to the edge it left',
                  step: 'the skater steps onto the other foot' }[t.join];
    return `${label(entry)} ${t.name.toLowerCase()} to ${label(x)} — ${how}, the direction ` +
      `of travel does not change, and the lobe ${lobe}.`;
  }
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
/* Listed in the order they are learned, not alphabetically and not by takeoff
   edge. That order is a real fact about the jumps — a waltz jump is the half
   rotation an Axel is built out of, and a Lutz is a flip fought against its own
   edge — so it lives here, where every page that lists jumps can inherit it,
   rather than in each page's own sort. */
export const JUMPS = {
  waltz:    { name: 'Waltz jump', takeoff: { foot: 'L', edge: 'O', dir: 'F' }, assisted: false, rotations: 0.5 },
  salchow:  { name: 'Salchow',   takeoff: { foot: 'L', edge: 'I', dir: 'B' }, assisted: false, rotations: 1 },
  toeLoop:  { name: 'Toe loop',  takeoff: { foot: 'R', edge: 'O', dir: 'B' }, assisted: true,  rotations: 1 },
  loop:     { name: 'Loop',      takeoff: { foot: 'R', edge: 'O', dir: 'B' }, assisted: false, rotations: 1 },
  flip:     { name: 'Flip',      takeoff: { foot: 'L', edge: 'I', dir: 'B' }, assisted: true,  rotations: 1 },
  lutz:     { name: 'Lutz',      takeoff: { foot: 'L', edge: 'O', dir: 'B' }, assisted: true,  rotations: 1 },
  axel:     { name: 'Axel',      takeoff: { foot: 'L', edge: 'O', dir: 'F' }, assisted: false, rotations: 1.5 },
};

/** Where a jump sits in the learning order, by name. −1 for anything not a jump. */
export const jumpOrder = name =>
  Object.values(JUMPS).findIndex(j => j.name.toLowerCase() === String(name).toLowerCase());

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
