/* HOW THE ELEMENTS PAGE GROUPS ITSELF, lifted out of the page on 19/09/2026 so
   that the hub and the per-kind pages can share one derivation.

   Martyn: the elements page is a long wall of links. It was 149 KB and 306 of them
   across nine sections, which is the wrong thing to hand someone on a phone, in
   gloves, at a rink — exactly the reader docs/style.md describes. So the page
   became an index and each section became its own page, and this is the part both
   of them need.

   Nothing here is new: it is the frontmatter that was already in the page, taking
   the collection as an argument instead of fetching it. Two pages computing their
   own groups would be two answers to "what is a twizzle family", and the second
   one would go stale. */
import { label, exitState, describeEdge, chainStates, clusterOf, TURNS, STEPS, TRANSITIONS, TWIZZLES, ALL_TURNS } from './skating.js';

export function elementGroups(elements) {


  /* The eight entry edges in the order the notation reads: foot, then direction,
     then edge. Generated rather than listed, like everything else here. */
  const STATES = ['L', 'R'].flatMap(foot =>
    ['F', 'B'].flatMap(dir => ['O', 'I'].map(edge => ({ foot, edge, dir }))));

  const TURN_KEYS = Object.keys(TURNS);
  const STEP_KEYS = Object.keys(STEPS);

  /* Look an element up by what it *is*, not by a constructed slug — so a file
     renamed by hand does not silently drop out of the table. */
  const find = (s, turn) => elements.find(e =>
    e.data.entry && label(e.data.entry) === label(s) && (e.data.turn ?? null) === turn);

  const EDGE_ROWS = [['F', 'O'], ['F', 'I'], ['B', 'O'], ['B', 'I']];
  const ROW_WORD = { FO: 'forward outside', FI: 'forward inside',
                     BO: 'backward outside', BI: 'backward inside' };

  /* Transitions get the same treatment as clusters: grouped by what they are, with
     a chip for each edge they can begin on. Not all of them begin on all eight. */
  const transitions = elements.filter(e => e.data.kind === 'transition');
  const transitionGroups = Object.keys(TRANSITIONS)
    .map(k => ({
      key: k,
      def: TRANSITIONS[k],
      entries: STATES.map(s => ({ s, el: transitions.find(e =>
        label(e.data.entry) === label(s) && e.data.turn === k) })),
    }))
    .filter(g => g.entries.some(e => e.el));

  /* Twizzles get chip rows too, grouped by rotation count. Every one of the eight
     edges can be twizzled from, so unlike the transitions none of these rows is
     short. */
  const twizzles = elements.filter(e => e.data.kind === 'twizzle');
  const twizzleGroups = Object.keys(TWIZZLES)
    .map(k => ({
      key: k,
      def: TWIZZLES[k],
      entries: STATES.map(s => ({ s, el: twizzles.find(e =>
        label(e.data.entry) === label(s) && e.data.turn === k) })),
    }))
    .filter(g => g.entries.some(e => e.el));

  /* Clusters, grouped by which cluster they are rather than which edge they start
     from — eight rows of eight links reads on a phone, an 8 x 8 matrix does not. */
  const combos = elements.filter(e => e.data.kind === 'combination');
  const comboGroups = [...new Map(combos.map(e => [e.data.turns.join('-'), e.data.turns])).values()]
    .sort((a, b) => a.length - b.length || a.join().localeCompare(b.join()))
    .map(turns => ({
      turns,
      key: clusterOf(turns)?.name ?? turns.join('-'),
      entries: STATES.map(s => ({
        s, el: combos.find(e => label(e.data.entry) === label(s) && e.data.turns.join('-') === turns.join('-')),
      })),
    }));

  const rest = elements
    .filter(e => !['edge', 'turn', 'twizzle', 'transition', 'combination'].includes(e.data.kind))
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
  /* ORDER THE REMAINING KINDS RATHER THAN LETTING THEM FALL OUT OF `rest`, which is
     sorted by element NAME and so orders its kinds by whichever happens to sort first.
     That was harmless while the remainder was jumps and positions. It stopped being
     harmless on 19/09/2026, when the basics arrived and landed BELOW the jumps: the
     floor of the guide, printed last. `basic` is named first here and everything else
     keeps the order it had.

     This is not the page's ordering question, which is still open and still belongs to
     docs/gaps-competition.md — whether a section's place should be decided by whether
     its elements appear in a test the guide holds. Under that rule the basics would
     move again, and further up. This is only the floor not being the footer. */
  /* Was `KIND_ORDER = ['basic']` with everything else keeping the order an
     alphabetical sort of element names happened to give it. SECTION_RANK below
     now orders every section, including these, so ordering them again here
     would be a second answer to the same question. Left unsorted on purpose:
     SECTIONS sorts them. */
  const KIND_ORDER = [];
  const restKinds = [...new Set(rest.map(e => e.data.kind))];

  const nEdges = elements.filter(e => e.data.kind === 'edge').length;
  const nTurns = elements.filter(e => e.data.kind === 'turn').length;

  /* ONE LIST DRIVES BOTH THE CONTENTS STRIP AND THE HEADINGS BELOW — 30/08/2026,
     Martyn: the page is very long and the jumps are at the bottom of it.

     A hand-written strip would be a second statement of what this page contains, and
     the last thing in this repository that stated its own contents by hand was the
     featured filter that silently absorbed twenty-four twizzles. So the strip is
     derived from the same counts the sections are, an empty section cannot appear in
     it, and a kind added tomorrow appears in both without anyone remembering to.

     Order is deliberately NOT changed here. What should decide it is whether an
     element appears in a test the guide holds — docs/gaps-competition.md sets that
     out, and it is a bigger change than a contents strip. Until then the strip is
     what makes the bottom of the page one tap away instead of a scroll. */
  const oneFoot = elements.filter(e => e.data.kind === 'turn' && TURN_KEYS.includes(e.data.turn));
  const twoFoot = elements.filter(e => e.data.kind === 'turn' && STEP_KEYS.includes(e.data.turn));
  const KIND_LABEL = k => k === 'position' ? 'Positions'
    : `${k.charAt(0).toUpperCase()}${k.slice(1)}s`;

  /* THE ORDER OF THE SECTIONS IS THE ORDER A SKATER MEETS THEM — 19/09/2026,
     Martyn: these should be ordered properly, with basics at the top and then
     moving through the others in a logical order according to a skater's
     learning. Until now the first six were in the order they happened to be
     written and the rest fell out of an alphabetical sort of element NAMES, so
     the floor of the guide printed below the jumps.

     Why this order. You cannot hold an edge before you can push and glide, so
     the basics come first. The eight edges are next because everything after
     them is a way of leaving one. Transitions join edges together and are the
     first thing a skater does with two of them. Turns come after that, one foot
     before two, because a three turn is taught before a mohawk and both before
     brackets, rockers and counters. Twizzles are turns that travel and want the
     turns first. Clusters are runs of what has come before, so they cannot come
     before it. Then held positions, which need a secure edge and nothing else,
     and last the free skating half: jumps, then spins.

     THIS IS A PEDAGOGICAL CLAIM AND CANNOT BE DERIVED. What the guide already
     derives is which sections EXIST; what no data here knows is which is taught
     first. So it is written down — and written as a rank per id rather than as
     a list of what to show, because a list of what to show is how twenty-four
     twizzles once fell through the home page's featured filter and landed
     amongst the jumps. A section with no rank is not quietly sorted last: it
     throws, so that the kind added tomorrow is a build failure and not a
     silently misplaced heading.

     docs/gaps-competition.md proposes a different key for a different job —
     whether an element appears in a test the guide holds — which decides which
     TAB a section belongs on. That is orthogonal to this and still open. */
  const SECTION_RANK = {
    basic: 1, edges: 2, transitions: 3, 'one-foot': 4, 'two-foot': 5,
    twizzles: 6, clusters: 7, position: 8, jump: 9, spin: 10,
  };
  const rankOf = id => {
    const r = SECTION_RANK[id];
    if (r === undefined) throw new Error(
      `elementGroups: the section "${id}" has no place in SECTION_RANK. ` +
      'Give it one in src/lib/element-groups.js — a new kind must be ordered ' +
      'deliberately rather than landing at the bottom of the page unnoticed.');
    return r;
  };

  const SECTIONS = [
    { id: 'edges',       label: 'Edges',          n: nEdges },
    { id: 'one-foot',    label: 'One-foot turns', n: oneFoot.length },
    { id: 'two-foot',    label: 'Two-foot turns', n: twoFoot.length },
    { id: 'twizzles',    label: 'Twizzles',       n: twizzles.length },
    { id: 'transitions', label: 'Transitions',    n: transitions.length },
    { id: 'clusters',    label: 'Clusters',       n: combos.length },
    ...restKinds.map(k => ({ id: k, label: KIND_LABEL(k),
                             n: rest.filter(e => e.data.kind === k).length })),
  ].filter(s => s.n > 0).sort((a, b) => rankOf(a.id) - rankOf(b.id));
  return { STATES, TURN_KEYS, STEP_KEYS, find, EDGE_ROWS, ROW_WORD, transitions, transitionGroups, twizzles, twizzleGroups, combos, comboGroups, rest, KIND_ORDER, restKinds, nEdges, nTurns, oneFoot, twoFoot, KIND_LABEL, SECTIONS };
}

/* WHAT EACH SECTION IS, IN ONE LINE. The hub prints these as the card subtitles
   and each section page prints its own as the page subtitle, so a reader meets the
   same sentence whichever way they arrive. Keyed on the section id that SECTIONS
   above already generates, so a kind added tomorrow gets a card with no line
   rather than no card — visible, and not silently missing. */
export const SECTION_NOTE = {
  edges:       'The eight plain edges. Three letters each: foot, direction, edge.',
  'one-foot':  'Threes, brackets, rockers and counters — half a turn on one blade.',
  'two-foot':  'Mohawks and choctaws, which change foot as well as direction.',
  twizzles:    'Turns that travel, by rotation count.',
  transitions: 'Getting from one edge to the next: crossovers, chassés, cross rolls and changes of edge.',
  clusters:    'Turns run together, where each one\'s exit is the next one\'s entry.',
  basic:       'The floor: the push, the glide, the swizzle, the stop, the two-foot turn.',
  jump:        'The six singles and the waltz jump, by takeoff edge and whether a pick goes in.',
  position:    'Held shapes — the spiral, the teapot, the extended edge.',
  spin:        'The three basic positions, plus the two ways of joining them: a change of foot and a combination.',
};

/* THE ONE TAUGHT FIRST — 19/09/2026, Martyn: a link to "a three turn" should land
   on one, not on a chart.

   Derived rather than listed, the way the front page already picks "the first edge
   a skater is taught, found by what it is rather than by a slug". Forwards before
   backwards, outside before inside, and the left foot first because the guide
   already assumes an anticlockwise rotator on every jump page. A clockwise rotator
   is one entry away, which is what the selector on the element page is for, and the
   page says so rather than leaving it silent. */
const TEACH = { dir: 'FB', edge: 'OI', foot: 'LR' };
export const teachRank = e => e && e.entry
  ? TEACH.dir.indexOf(e.entry.dir) * 4 + TEACH.edge.indexOf(e.entry.edge) * 2 + TEACH.foot.indexOf(e.entry.foot)
  : 99;
export const canonicalOf = els =>
  els.filter(Boolean).slice().sort((a, b) => teachRank(a.data) - teachRank(b.data))[0];

/* WHICH FAMILY AN ELEMENT BELONGS TO — the same movement from a different entry
   edge. A cluster is its chain of turns, a turn or transition or twizzle is its
   turn key, a plain edge is just an edge. Everything else is alone: there is one
   Axel and one spiral, and a selector offering to move between variations of them
   would be offering nothing. */
export const familyOf = d =>
  d.turns ? `turns:${d.turns.join('-')}`
  : d.turn ? `turn:${d.turn}`
  : d.kind === 'edge' ? 'edge'
  : null;
