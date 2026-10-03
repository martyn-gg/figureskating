/* WHAT EACH BASIC IS FOR — 03/10/2026, Martyn: explain how each basic skill supports
   the bigger ones, and link back from the bigger skills to the basics.

   The links already existed in both directions, from `prerequisites` and its inverse
   (see [...slug].astro, "Leads to"). What neither direction said was WHY: a skater on
   the swizzle page saw "Forward stroking" and the stroke's own summary, which does not
   tell them what the swizzle has to do with it.

   This file holds the reasons and nothing else. It does not hold the links: a reason
   is only shown where a `prerequisites` entry already makes the link, and
   `tools/foundations.mjs` fails both ways round, on a basic-to-element link with no
   reason and on a reason that matches no link. So the graph has one source of truth
   and this is commentary on it that cannot drift away from it.

   Keyed by the basic, then by a pattern over the id of the element built on it, so a
   family of four (the forward edges, the backward crossovers) is written once and the
   page shows the four as one line. Foot-neutral, like every passage here, and held to
   the house style by `tools/house.mjs`.

   Every reason is a statement about how the two movements relate, or about the order a
   governing body teaches them in, and says which. None of them is a coach's sign-off. */

export const FOUNDATIONS = {
  'swizzle': [
    { to: /^backward-swizzle$/, why: 'The same press and draw, travelling backwards, with the weight moved forward so the heels can push.' },
    { to: /^forward-stroking$/, why: 'A stroke is half a swizzle: one foot presses out against its inside edge while the other glides, and the pushing foot lifts.' },
    { to: /^half-swizzle-pumps$/, why: 'The swizzle\'s press, kept on one foot while the other holds a curve.' },
  ],
  'backward-swizzle': [
    { to: /^backward-half-swizzle-pumps$/, why: 'The backward press, made by one foot while the other glides round a circle.' },
    { to: /^backward-stroking$/, why: 'The backward press taken one foot at a time, with the pushing foot lifted at the end of each push.' },
  ],
  'two-foot-glide': [
    { to: /^dip$/, why: 'The dip is this glide taken down into a deep bend and back up again.' },
    { to: /^forward-stroking$/, why: 'Every stroke ends in a glide, and the glide has to be steady before the push can be.' },
    { to: /^one-foot-glide$/, why: 'The same balance over the middle of the blade, on half the base.' },
    { to: /^slip-step$/, why: 'Both blades stay flat on the ice, as they do here, while one foot slides away in front.' },
    { to: /^two-foot-change-of-edge$/, why: 'A steady two-foot glide is where both blades roll off the flat together.' },
  ],
  'backward-two-foot-glide': [
    { to: /^backward-one-foot-glide$/, why: 'The same forward weight over the balls of the feet, on one blade.' },
    { to: /^backward-slalom$/, why: 'The backward slalom swings this glide from one pair of edges to the other.' },
    { to: /^backward-stroking$/, why: 'Each backward push finishes in this glide.' },
  ],
  'one-foot-glide': [
    { to: /^[lr]f[oi]$/, why: 'Tip the blade of a one-foot glide off the flat and it becomes an edge.' },
    { to: /^drag$/, why: 'The drag is a one-foot glide with the skating knee sunk deep and the free leg reaching back.' },
    { to: /^extended-edge$/, why: 'Holding one foot for a long time starts here, on a straight line.' },
    { to: /^pivot$/, why: 'The pivot holds the weight over one leg while the other foot works, which is the balance this glide teaches.' },
    { to: /^spiral$/, why: 'A spiral is a one-foot glide with the free leg lifted behind to hip height or above.' },
    { to: /^t-stop$/, why: 'The T-stop brakes out of a one-foot glide, so the glide has to hold its line first.' },
  ],
  'backward-one-foot-glide': [
    { to: /^[lr]b[oi]$/, why: 'Tip the blade of a backward one-foot glide off the flat and it becomes a backward edge.' },
    { to: /^(upright-spin|change-of-foot-spin)$/, why: 'A spin turns on one backward edge, so balance over one backward blade comes first.' },
  ],
  'forward-stroking': [
    { to: /^[lr]f[oi]$/, why: 'An edge is a stroke held longer on one foot.' },
    { to: /^[lr]f[oi]-chasse$/, why: 'A chassé is the push with a step in it: the free foot goes down beside the skating foot and the old one lifts.' },
    { to: /^[lr]f[oi]-slipchasse$/, why: 'A slip chassé is that same step, with the old foot sliding away along the ice as it leaves.' },
    { to: /^[lr]f[oi]-crossroll$/, why: 'A cross roll is a push taken across the skating foot onto the outside edge of the other.' },
    { to: /^[lr]f[oi]-stepwide$/, why: 'A wide step is a push placed onto the other foot, out to the side and clear of the skating foot.' },
    { to: /^slip-step$/, why: 'Every stroke holds the weight over one leg while the other foot moves along the ice, and the slip step asks for the same.' },
  ],
  'backward-stroking': [
    { to: /^[lr]b[oi]$/, why: 'A backward edge is a backward stroke held longer on one foot.' },
    { to: /^[lr]b[oi]-pushback$/, why: 'A push back is a backward stroke taken from a named edge onto the outside edge of the other foot.' },
    { to: /^[lr]b[oi]-chasse$/, why: 'A backward chassé is the backward push with a step in it: the free foot goes down beside the skating foot and the old one lifts.' },
    { to: /^[lr]b[oi]-slipchasse$/, why: 'A backward slip chassé is that same step, with the old foot sliding away along the ice as it leaves.' },
    { to: /^[lr]b[oi]-crossroll$/, why: 'A backward cross roll is a push taken across the skating foot onto the outside edge of the other.' },
    { to: /^[lr]b[oi]-stepwide$/, why: 'A backward wide step is a push placed onto the other foot, out to the side and clear of the skating foot.' },
  ],
  'half-swizzle-pumps': [
    { to: /^[lr]f[oi]-crossover$/, why: 'A crossover keeps the pumps\' circle and push, and the free foot crosses in front where it would have closed. Learn to Skate USA teaches it the level after.' },
    { to: /^[lr]f[oi]-crossbehind$/, why: 'The same pump on a circle, with the free foot crossing behind the skating foot.' },
  ],
  'backward-half-swizzle-pumps': [
    { to: /^[lr]b[oi]-crossover$/, why: 'A backward crossover keeps the pumps\' circle and push, and the free foot crosses in front where it would have closed. Learn to Skate USA teaches it the level after.' },
    { to: /^[lr]b[oi]-crossbehind$/, why: 'The same backward pump on a circle, with the free foot crossing behind the skating foot.' },
  ],
  'two-foot-turn': [
    { to: /^backward-two-foot-turn$/, why: 'The same half turn the other way, from backwards to forwards, ending on ice you have not been watching.' },
    { to: /^[lr]f[oi]-three$/, why: 'A forward three turn makes the same half turn from forwards to backwards on one foot, and the shoulders lead it in the same way.' },
    { to: /^[lr]f[oi]-mohawk$/, why: 'A forward mohawk makes the same change from forwards to backwards with a step onto the other foot.' },
    { to: /^upright-spin$/, why: 'The first rotation on the ice. Learn to Skate USA teaches the two-foot spin at its fourth level, after two-foot turns at its second and third.' },
  ],
  'backward-two-foot-turn': [
    { to: /^[lr]b[oi]-three$/, why: 'A backward three turn makes the same half turn from backwards to forwards on one foot.' },
    { to: /^[lr]b[oi]-mohawk$/, why: 'A backward mohawk makes the same change from backwards to forwards with a step onto the other foot.' },
  ],
  'two-foot-change-of-edge': [
    { to: /^[lr][fb][oi]-coe$/, why: 'A one-foot change of edge is the same roll across the flat, with the other foot lifted.' },
    { to: /^slalom$/, why: 'The slalom is this change repeated in rhythm down the ice.' },
  ],
  'slalom': [
    { to: /^backward-slalom$/, why: 'The same wave drawn travelling backwards, which British Ice Skating Skills 1 asks for as the second side of its slalom.' },
  ],
  'backward-slalom': [
    { to: /^[lr]b[oi]-coe$/, why: 'British Ice Skating Skills 1 builds its backward slalom from two-foot power changes of edge, the roll a backward change of edge makes on one blade.' },
  ],
  'dip': [
    { to: /^teapot$/, why: 'The teapot holds the depth of the dip on one foot.' },
    { to: /^sit-spin$/, why: 'A sit spin needs the skating thigh at least parallel to the ice, the depth the dip trains on two feet.' },
  ],
  'drag': [
    { to: /^spiral$/, why: 'Both trail the free leg behind one skating foot. The spiral lifts it clear to hip height and holds it there.' },
  ],
  'snowplough-stop': [
    { to: /^backward-snowplough-stop$/, why: 'The same press and skid, made travelling backwards.' },
    { to: /^hockey-stop$/, why: 'A hockey stop skids both blades at once, and the snowplough is where a skater first skids a blade on purpose.' },
  ],
};

/* The reason a basic gives for one element built on it, or null. */
export function reasonFor(basicId, targetId) {
  const r = (FOUNDATIONS[basicId] || []).find(x => x.to.test(targetId));
  return r ? r.why : null;
}
