/* THE DANCE HOLDS — 03/10/2026, Martyn: explain the holds with a diagram, and later
   animate them.

   The definitions are U.S. Figure Skating's rule 8107, Dance Holds (2026-27
   rulebook), which describes each hold by where the partners stand, which way each
   faces, and where every hand goes. That is what this records, seen from above,
   and nothing more: no elbows, no lean, no free leg. A hold is a relationship
   between two people, and from above the relationship is the whole of it.

   DATA, NOT DRAWING, so the holds can be animated later. Every hold has the same
   shape: two partners, each a centre and a facing, and a list of arms, each going
   from a named shoulder to a point. A transition from one hold to another is then
   an interpolation of the same numbers, and HoldDiagram.astro draws any frame of it.

   THE FRAME. Metres, seen from above, x to the right and y down the page, with the
   couple travelling up the page (towards -y). A facing of 0 is up the page, 180 is
   down: a partner facing 180 is skating backwards. A partner's right is +x when
   facing 0 and -x when facing 180.

   Arms: `who` is the partner the arm belongs to, `side` the shoulder it leaves,
   `via` an elbow where the arm has to go round a body, `to` the point the hand reaches, and `at` what is there: 'join' (two hands
   clasped, both arms list the same point), 'back' (a hand on the partner's back),
   'shoulder' (a hand resting on the partner's shoulder or upper arm), 'hip' (a hand
   at the partner's hip). Partner positions are a schematic of the rule's words, not
   a measurement: the rule gives relationships, not distances.

   HEIGHTS, for the view from behind (03/10/2026, Martyn: add the holds from the
   rear). `z` is how high the hand is, in metres off the ice, and `vz` the elbow
   where an arm has one. Where an arm leaves them out, its kind decides: hands
   joined at shoulder height with the arms extended, a hand on the back at the
   shoulder blade, a hand resting on a shoulder at the shoulder. The Kilian's
   clasped hands rest at the follow's hip and say so. The figures are an adult of
   about 1.75 m: shoulders at 1.42, hips at 0.95. */

export const HOLDS = {
  'closed-hold': {
    /* B. Closed (or Waltz) Hold: directly opposite, one forward and one backward,
       shoulders parallel. */
    lead:   { x: 0, y: 0.28, facing: 0 },
    follow: { x: 0, y: -0.28, facing: 180 },
    arms: [
      { who: 'lead', side: 'R', via: [0.33, -0.24], to: [0.13, -0.4], at: 'back' },
      { who: 'follow', side: 'L', to: [0.24, 0.2], at: 'shoulder' },
      { who: 'lead', side: 'L', to: [-0.62, 0], at: 'join' },
      { who: 'follow', side: 'R', to: [-0.62, 0], at: 'join' },
    ],
  },
  'open-hold': {
    /* C1. Open (or Foxtrot) Hold: the arms of the closed hold, the partners turned
       so both face the same way. */
    lead:   { x: -0.24, y: 0, facing: 8 },
    follow: { x: 0.24, y: 0, facing: -15 },
    arms: [
      { who: 'lead', side: 'R', to: [0.16, 0.14], at: 'back' },
      { who: 'follow', side: 'L', to: [-0.05, -0.02], at: 'shoulder' },
      { who: 'lead', side: 'L', to: [-0.02, -0.48], at: 'join' },
      { who: 'follow', side: 'R', to: [-0.02, -0.48], at: 'join' },
    ],
  },
  'outside-hold': {
    /* D. Outside (or Tango) Hold: facing opposite ways like the closed hold, but
       offset, the front of each partner's corresponding hip in line. */
    lead:   { x: -0.13, y: 0.1, facing: 0 },
    follow: { x: 0.13, y: -0.1, facing: 180 },
    arms: [
      { who: 'lead', side: 'R', via: [0.38, -0.02], to: [0.24, -0.22], at: 'back' },
      { who: 'follow', side: 'L', to: [0.1, 0.06], at: 'shoulder' },
      { who: 'lead', side: 'L', to: [-0.62, -0.1], at: 'join' },
      { who: 'follow', side: 'R', to: [-0.62, -0.1], at: 'join' },
    ],
  },
  'kilian-hold': {
    /* E1. Kilian Hold: same direction, the follow at the lead's right, the lead's
       right shoulder behind the follow's left. */
    lead:   { x: -0.17, y: 0.12, facing: 0 },
    follow: { x: 0.17, y: -0.04, facing: 0 },
    arms: [
      { who: 'follow', side: 'L', to: [-0.58, -0.22], at: 'join' },
      { who: 'lead', side: 'L', to: [-0.58, -0.22], at: 'join' },
      { who: 'lead', side: 'R', to: [0.42, 0.02], at: 'join', z: 1.0 },
      { who: 'follow', side: 'R', to: [0.42, 0.02], at: 'join', z: 1.0 },
    ],
  },
  'reversed-kilian-hold': {
    /* E2. Reversed Kilian Hold: the Kilian with the follow at the lead's left. */
    lead:   { x: 0.17, y: 0.12, facing: 0 },
    follow: { x: -0.17, y: -0.04, facing: 0 },
    arms: [
      { who: 'follow', side: 'R', to: [0.58, -0.22], at: 'join' },
      { who: 'lead', side: 'R', to: [0.58, -0.22], at: 'join' },
      { who: 'lead', side: 'L', to: [-0.42, 0.02], at: 'join', z: 1.0 },
      { who: 'follow', side: 'L', to: [-0.42, 0.02], at: 'join', z: 1.0 },
    ],
  },
  'hand-in-hand-hold': {
    /* A1. Hand-in-Hand Hold, facing the same direction: side by side, arms
       extended, hands clasped. */
    lead:   { x: -0.6, y: 0, facing: 0 },
    follow: { x: 0.6, y: 0, facing: 0 },
    arms: [
      { who: 'lead', side: 'R', to: [0, 0.04], at: 'join', z: 1.15 },
      { who: 'follow', side: 'L', to: [0, 0.04], at: 'join', z: 1.15 },
    ],
  },
};

/* Half the shoulder width, in metres, and the heights the figures from behind are
   drawn at. */
export const SHOULDER = 0.21;
export const HEIGHT = { head: 1.62, shoulder: 1.42, hip: 0.95 };
const DEFAULT_Z = { join: 1.35, back: 1.3, shoulder: 1.42, hip: 1.0 };
/** How high an arm's hand is, and its elbow if it has one. */
export const handZ = a => a.z ?? DEFAULT_Z[a.at];
export const elbowZ = a => a.vz ?? (HEIGHT.shoulder + handZ(a)) / 2 - 0.05;

/** A partner's two shoulders, from its centre and facing. */
export function shoulders(p) {
  const t = p.facing * Math.PI / 180;
  const rx = Math.cos(t), ry = Math.sin(t);
  return { R: [p.x + rx * SHOULDER, p.y + ry * SHOULDER], L: [p.x - rx * SHOULDER, p.y - ry * SHOULDER] };
}

/** The unit vector a partner faces: up the page at 0. */
export const forward = p => {
  const t = p.facing * Math.PI / 180;
  return [Math.sin(t), -Math.cos(t)];
};

/* Which hold each dance's hold text names, for linking. One pattern, tried left to
   right, so "reversed Kilian" and "open Kilian" are read whole before "Kilian" or
   "open" alone could be. A semi-open hold is no open hold, and is left unlinked. */
const HOLD_RE = /(reversed? kilian|(?:open|high|crossed) kilian|kilian|hand[- ]in[- ]hand|hands? joined|arm[- ]in[- ]arm|(?<!semi-)\bclosed\b|\bwaltz\b|reverse outside|(?:partial )?outside|\btango\b|(?<!semi-)\bopen\b|\bfoxtrot\b)/gi;
const SLUG_OF = w => {
  w = w.toLowerCase();
  if (/^reversed? kilian/.test(w)) return 'reversed-kilian-hold';
  if (/kilian/.test(w)) return 'kilian-hold';
  if (/hand|arm/.test(w)) return 'hand-in-hand-hold';
  if (/closed|waltz/.test(w)) return 'closed-hold';
  if (/outside|tango/.test(w)) return 'outside-hold';
  return 'open-hold';
};

/** A dance's hold text cut into plain runs and runs naming a hold:
    [{ text, slug? }]. The page links the named ones. */
export function holdParts(text) {
  const out = []; let at = 0;
  for (const m of String(text).matchAll(HOLD_RE)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    out.push({ text: m[0], slug: SLUG_OF(m[0]) });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}
