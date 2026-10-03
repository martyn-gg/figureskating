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

   Every reason rests on a document in sources/ (BIS, Learn to Skate USA, NZIFSA
   KiwiSkate, Ice Skating Australia's Aussie Skate manual, the ISU) or on the guide's own
   definitions, and says which body it is quoting where it matters. Re-read against those
   documents on 03/10/2026 and cut where they did not support it. None of them is a
   coach's sign-off. */

export const FOUNDATIONS = {
  'swizzle': [
    { to: /^backward-swizzle$/, why: 'The same in-and-out movement on both feet, travelling backwards. Learn to Skate USA teaches it one level later.' },
    { to: /^forward-stroking$/, why: 'Learn to Skate USA teaches the swizzle at its first level and stroking at its third. Ice Skating Australia teaches half swizzles, one foot at a time, in between.' },
    { to: /^half-swizzle-pumps$/, why: 'Half a swizzle: one foot makes the in-and-out movement while the other glides. Ice Skating Australia teaches it in a straight line and then on a circle.' },
  ],
  'backward-swizzle': [
    { to: /^backward-half-swizzle-pumps$/, why: 'Half a backward swizzle, made by one foot while the other glides round a circle.' },
    { to: /^backward-stroking$/, why: 'Ice Skating Australia teaches backward swizzles, then backward half swizzles, then backward stroking, and rules out the toe pick in all three.' },
  ],
  'two-foot-glide': [
    { to: /^dip$/, why: 'The dip is taken from a two-foot glide: Ice Skating Australia asks for about a metre of glide and then the squat.' },
    { to: /^forward-stroking$/, why: 'Each stroke finishes in a glide, and every programme teaches the glide first.' },
    { to: /^one-foot-glide$/, why: 'The same straight glide with one foot lifted and carried at the inside of the skating knee.' },
    { to: /^slip-step$/, why: 'Both blades flat on the ice, as here. In the slip step the free foot then slides forward to full extension.' },
    { to: /^two-foot-change-of-edge$/, why: 'Both feet stay on the ice as they do here, and the change rolls them together onto the other pair of edges.' },
  ],
  'backward-two-foot-glide': [
    { to: /^backward-one-foot-glide$/, why: 'The same straight backward glide on one foot. New Zealand and Ice Skating Australia both teach the two-foot glide first.' },
    { to: /^backward-slalom$/, why: 'Both feet stay on the ice while travelling backwards, as here, and swing from one pair of edges to the other.' },
    { to: /^backward-stroking$/, why: 'Each backward stroke finishes in a backward glide.' },
  ],
  'one-foot-glide': [
    { to: /^[lr]f[oi]$/, why: 'The one-foot glide runs on a flat. New Zealand teaches it straight and then on a curve, which is the blade on an edge.' },
    { to: /^drag$/, why: 'The drag is a glide on one foot with the skating knee bent deep and the free leg extended behind, turned out.' },
    { to: /^extended-edge$/, why: 'An extended edge holds one foot for a third of a circle. The one-foot glide is where holding one foot starts.' },
    { to: /^pivot$/, why: 'Ice Skating Australia teaches pivots at its last level, long after the one-foot glide. The circling foot glides on an inside edge.' },
    { to: /^spiral$/, why: 'A spiral is held on an edge, the free leg stretched out behind, turned out, and raised to hip height or higher.' },
    { to: /^bunny-hop$/, why: 'The bunny hop springs off a glide on one foot and returns to it, so the glide has to hold first.' },
    { to: /^t-stop$/, why: 'The T-stop starts from a one-foot glide, the other foot set down behind it.' },
  ],
  'backward-one-foot-glide': [
    { to: /^[lr]b[oi]$/, why: 'New Zealand moves the backward glide onto a curve and round a circle, which is the backward edges. On them, Ice Skating Australia keeps the free leg ahead, above the line.' },
    { to: /^(upright-spin|change-of-foot-spin)$/, why: 'Ice Skating Australia\'s two-foot spin exits on a back outside edge, and its first one-foot spin carries the free foot at the side of the knee, as this glide does.' },
  ],
  'forward-stroking': [
    { to: /^[lr]f[oi]$/, why: 'An edge is a stroke held on one foot round a curve. Ice Skating Australia already asks for each stroke to be held for the skater\'s height.' },
    { to: /^[lr]f[oi]-chasse$/, why: 'British Ice Skating defines a chassé as two edges, the free foot put down next to the skating foot for the second and then lifted with its blade level.' },
    { to: /^[lr]f[oi]-slipchasse$/, why: 'British Ice Skating\'s slip chassé is the chassé with the free foot sliding off the ice in front on the second step.' },
    { to: /^[lr]f[oi]-crossroll$/, why: 'British Ice Skating\'s cross roll brings the free foot in from the side and past the skating foot onto the next outside curve, the weight rolling across with it.' },
    { to: /^[lr]f[oi]-stepwide$/, why: 'A wide step changes feet as a stroke does, with the new foot placed out to the side and nothing crossing.' },
    { to: /^slip-step$/, why: 'British Ice Skating\'s slip step keeps the weight on the skating leg as the free foot glides forward along the ice.' },
  ],
  'backward-stroking': [
    { to: /^[lr]b[oi]$/, why: 'Ice Skating Australia holds each backward stroke for two to three seconds with the free foot ahead above the line, and its backward edges keep the free leg in the same place.' },
    { to: /^[lr]b[oi]-pushback$/, why: 'A push back is a backward stroke taken from a named edge onto the other foot\'s outside edge.' },
    { to: /^[lr]b[oi]-chasse$/, why: 'British Ice Skating\'s chassé, skated backwards: two edges, the free foot set down beside the skating foot on the second and lifted again.' },
    { to: /^[lr]b[oi]-slipchasse$/, why: 'British Ice Skating\'s slip chassé, skated backwards, slides the free foot off the ice to the back on the second step.' },
    { to: /^[lr]b[oi]-crossroll$/, why: 'British Ice Skating\'s cross roll, skated backwards: the free foot passes the skating foot onto the next outside curve.' },
    { to: /^[lr]b[oi]-stepwide$/, why: 'A backward wide step changes feet as a backward stroke does, with the new foot placed out to the side and nothing crossing.' },
  ],
  'half-swizzle-pumps': [
    { to: /^[lr]f[oi]-crossover$/, why: 'Learn to Skate USA teaches forward crossovers one level after the pumps, on the same circle. In Ice Skating Australia\'s description the outside leg crosses in front and each foot pushes outwards, away from the circle.' },
    { to: /^[lr]f[oi]-crossbehind$/, why: 'The same circle, with the free foot crossing behind the skating foot, which British Ice Skating defines as a crossed step behind.' },
  ],
  'backward-half-swizzle-pumps': [
    { to: /^[lr]b[oi]-crossover$/, why: 'Learn to Skate USA teaches backward crossovers one level after these pumps. Ice Skating Australia keeps the crossing foot on the ice and every push going outwards, away from the circle.' },
    { to: /^[lr]b[oi]-crossbehind$/, why: 'The same backward circle, with the free foot crossing behind the skating foot.' },
  ],
  'two-foot-turn': [
    { to: /^backward-two-foot-turn$/, why: 'The same half turn the other way, from backwards to forwards. Ice Skating Australia teaches it after the forward turn, on a curve.' },
    { to: /^[lr]f[oi]-three$/, why: 'Both turn from forwards to backwards, and the three turn does it on one foot. Ice Skating Australia teaches the two-foot turn first.' },
    { to: /^[lr]f[oi]-mohawk$/, why: 'Both turn from forwards to backwards, and the mohawk changes feet as it turns. Ice Skating Australia teaches its forward inside mohawk after the two-foot turns.' },
    { to: /^upright-spin$/, why: 'Learn to Skate USA teaches the two-foot spin at its fourth level, after two-foot turns at its second and third.' },
  ],
  'backward-two-foot-turn': [
    { to: /^[lr]b[oi]-three$/, why: 'Both turn from backwards to forwards, and the three turn does it on one foot.' },
    { to: /^[lr]b[oi]-mohawk$/, why: 'Both turn from backwards to forwards, and the mohawk changes feet as it turns.' },
  ],
  'two-foot-change-of-edge': [
    { to: /^[lr][fb][oi]-coe$/, why: 'British Ice Skating defines a change of edge as one foot\'s tracing leaving one curve and edge for another. Here both feet do it together.' },
    { to: /^slalom$/, why: 'British Ice Skating\'s Skills 1 slalom is this change, repeated as a two-foot power change of edge.' },
  ],
  'slalom': [
    { to: /^backward-slalom$/, why: 'The same wave drawn travelling backwards, which British Ice Skating Skills 1 asks for as the second side of its slalom.' },
  ],
  'backward-slalom': [
    { to: /^[lr]b[oi]-coe$/, why: 'British Ice Skating Skills 1 builds its backward slalom from two-foot power changes of edge, the roll a backward change of edge makes on one blade.' },
  ],
  'dip': [
    { to: /^teapot$/, why: 'The teapot holds a low knee bend on one foot with the free leg forward. The dip is a deep bend on two.' },
    { to: /^sit-spin$/, why: 'The ISU defines a sit spin by the skating thigh being at least parallel to the ice. Ice Skating Australia\'s dip bends the knees to about ninety degrees.' },
  ],
  'drag': [
    { to: /^spiral$/, why: 'Both extend the free leg behind, turned out. Ice Skating Australia\'s spiral lifts it to at least hip height, and its lunge lifts only the blade.' },
  ],
  'bunny-hop': [
    { to: /^waltz-jump$/, why: 'Both leave the ice from a forward glide. New Zealand\'s KiwiSkate teaches them together, on its Free skating 1 badge.' },
  ],
  'snowplough-stop': [
    { to: /^backward-snowplough-stop$/, why: 'The same skidding stop, travelling backwards. New Zealand teaches the backward half snowplough at its Basic badge.' },
    { to: /^hockey-stop$/, why: 'Both stop by skidding the blades. New Zealand teaches the snowplough at its first badge and the parallel side stop at Novice 2.' },
  ],
};

/* The reason a basic gives for one element built on it, or null. */
export function reasonFor(basicId, targetId) {
  const r = (FOUNDATIONS[basicId] || []).find(x => x.to.test(targetId));
  return r ? r.why : null;
}
