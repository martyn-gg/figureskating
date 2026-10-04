/* THE GLOSSARY — 04/10/2026, Session 28. The words the guide leans on that a newcomer
   will not know. Each entry says what the word means here, in a sentence or two, and
   points at the page that shows it where one exists. Links are site paths, checked by
   tools/links.mjs on the built page like every other link.

   The ISU judging terms (base value, GOE, levels, under-rotation, edge calls) are as the
   ISU uses them in 2026; they change between seasons, so they are kept short. */
export const GLOSSARY = [
  { term: 'Barrier', also: ['boards'], def: 'The wall around the ice. Hold it when getting on and off, and stop beside it rather than in the middle.', see: [['Your first session', 'first-session/']] },
  { term: 'Base value', def: 'The points a jump, spin or sequence is worth before the judges mark its quality. The ISU sets one for every element, and for spins and sequences one per level.' },
  { term: 'Carriage', def: 'How the head, shoulders, arms and upper body are held over the blade. Good carriage is tall and quiet.', see: [['Core and carriage', 'off-ice/core-and-carriage/']] },
  { term: 'Check', def: 'Holding the shoulders and arms firmly against a rotation, so that it stops, or does not start before it should. Every jump landing is checked, and so is the exit of most turns.' },
  { term: 'Clockwise and anticlockwise', also: ['rotation direction'], def: 'The way a skater turns in jumps and spins. Most turn anticlockwise, and the guide is written for them. A clockwise skater does the mirror image of everything: every left becomes right.' },
  { term: 'Cluster', def: 'The guide\'s word for a run of turns where each one\'s exit edge is the next one\'s entry.', see: [['Clusters', 'elements/in/clusters/']] },
  { term: 'Combination', def: 'Two or more jumps where the landing of one is the takeoff of the next, with no step between them. Not to be confused with a combination spin.', see: [['Jump combinations', 'elements/in/combo/'], ['Combination spin', 'elements/combination-spin/']] },
  { term: 'Cusp', def: 'The point in a turn\'s tracing where the blade changes direction, drawn as a small point or loop on the ice.' },
  { term: 'Edge', def: 'A blade has two: the inside edge on the big-toe side and the outside edge on the little-toe side. The word also means the curve a skater travels on one of them.', see: [['The eight edges', 'elements/in/edges/'], ['The blade', 'kit/blade/']] },
  { term: 'Edge call', def: 'A mark the technical panel gives a flip or a Lutz taken off the wrong edge: an "e" for the wrong edge, or a "!" for an edge that was not clear.', see: [['Lutz', 'elements/lutz/'], ['Flip', 'elements/flip/']] },
  { term: 'Edge code', also: ['LFO', 'RBI'], def: 'Three letters for an edge: the foot (L or R), the direction (F or B) and the edge (O or I). LFO is a left foot travelling forwards on an outside edge.', see: [['The eight edges', 'elements/in/edges/']] },
  { term: 'Edge jump', def: 'A jump that takes off from the edge alone, with no toe pick: the waltz jump, Salchow, loop and Axel.', see: [['Jumps', 'elements/in/jump/']] },
  { term: 'Flutz and lip', def: 'Informal names for two common faults: a Lutz that rolls onto the inside edge before the takeoff (a flutz), and a flip taken off an outside edge (a lip). Both earn an edge call.' },
  { term: 'Free leg', also: ['free foot', 'free side'], def: 'The leg that is not on the ice, and that side of the body. The other is the skating leg.' },
  { term: 'GOE', also: ['grade of execution'], def: 'The judges\' mark for how well an element was done, from −5 to +5, added to its base value as a share of it.' },
  { term: 'Guards', def: 'Hard covers for walking off the ice. Off before the first step onto it.', see: [['Looking after skates', 'kit/care/']] },
  { term: 'Hold', def: 'How two dance partners hold each other: where each stands, which way each faces, and where the hands go.', see: [['Holds', 'elements/in/hold/']] },
  { term: 'Hollow', also: ['radius of hollow'], def: 'The shallow groove ground along the bottom of the blade that leaves its two edges. A smaller radius cuts a deeper groove that grips harder.', see: [['The blade', 'kit/blade/']] },
  { term: 'Level', def: 'For spins, step sequences and some other elements, a grade from Base (B) to 4 given for the difficult features shown. A higher level has a higher base value.' },
  { term: 'Lobe', def: 'A curve skated on one edge, roughly half a circle. Pattern dances and the old school figures are built of them.' },
  { term: 'Mohawk and choctaw', def: 'Turns from one foot to the other that reverse the direction of travel. A mohawk keeps the same kind of edge; a choctaw changes it.', see: [['Two-foot turns', 'elements/in/two-foot/']] },
  { term: 'Pick', also: ['toe pick'], def: 'The teeth at the front of a figure blade. For jabbing into the ice in toe jumps, not for standing on.', see: [['The blade', 'kit/blade/']] },
  { term: 'Rocker', def: 'Two meanings. On the blade, the curve it is ground to along its length. As a turn, a one-foot turn that reverses the direction of travel, keeps the same edge and rotates into the curve, coming out on a new lobe.', see: [['The blade', 'kit/blade/'], ['Rocker (turn)', 'elements/lfo-rocker/']] },
  { term: 'Skating leg', also: ['skating foot', 'skating side'], def: 'The leg carrying the skater on the ice, and that side of the body.' },
  { term: 'Soakers', def: 'Cloth covers for storing dry blades. Hard guards hold water against the steel; soakers do not.', see: [['Looking after skates', 'kit/care/']] },
  { term: 'Spin rocker', def: 'The tighter curve towards the front of the blade, just behind the pick, that a spin sits on.', see: [['The blade', 'kit/blade/']] },
  { term: 'Spotting', def: 'Finding something familiar to look at so as to keep your bearings while turning, and to see straight again after.', see: [['Spotting and rotation', 'off-ice/spotting-and-rotation/']] },
  { term: 'Toe jump', def: 'A jump vaulted off the toe pick of the free foot: the toe loop, flip and Lutz.', see: [['Jumps', 'elements/in/jump/']] },
  { term: 'Tracing', def: 'The mark a blade leaves on the ice. Every element in the guide is drawn by its tracing.' },
  { term: 'Turnout', def: 'How far the legs rotate outward from the hip.', see: [['Hips and turnout', 'off-ice/hips-and-turnout/']] },
  { term: 'Under-rotation', also: ['q', 'under-rotated', 'downgraded'], def: 'A jump landed short of its turns. A quarter short is marked q; more than a quarter but less than half, under-rotated (<); half a turn or more, downgraded (<<) and scored as the jump with one turn fewer.' },
];
export const slugOf = term => term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
