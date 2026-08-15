/* Generates the derived tier: eight plain edges, the thirty-two one-foot turns, the
   sixteen two-foot turns, and sixty-four combinations of them.

   The point of the derived tier is that geometry costs nothing — exit edge, cusp
   direction, mirror and animation all fall out of foot/edge/direction, so this
   script never writes any of them into a file. What it does write is the prose,
   and prose is not derivable.

   So the text below is keyed on direction+edge and on the turn, never on the foot.
   A left forward outside bracket and a right forward outside bracket are mirror
   images: the same description with the words "left" and "right" nowhere in it.
   That is why every passage here is written foot-neutrally — it is not a shortcut,
   it is the honest shape of the content. The three letters differ; the skating
   does not.

   Existing files are never overwritten. Pass --force to overwrite anyway.

       node tools/gen-derived.mjs            write only what is missing
       node tools/gen-derived.mjs --force    overwrite everything it generates
*/

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lobeSense, label, exitState, chainStates, CLUSTERS, ALL_TURNS } from '../src/lib/skating.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'elements');
const force = process.argv.includes('--force');

const FEET = ['L', 'R'];
const DIRS = ['F', 'B'];
const EDGES = ['O', 'I'];

const FOOT_WORD = { L: 'Left', R: 'Right' };
const DIR_WORD = { F: 'forward', B: 'backward' };
const EDGE_WORD = { O: 'outside', I: 'inside' };
const TURN_NOUN = { three: 'three turn', bracket: 'bracket', rocker: 'rocker', counter: 'counter',
                    mohawk: 'mohawk', choctaw: 'choctaw' };

const slug = s => `${s.foot}${s.dir}${s.edge}`.toLowerCase();
const key = s => `${s.dir}${s.edge}`;                       // FO, FI, BO, BI
const sense = s => (lobeSense(s.foot, s.edge, s.dir) > 0 ? 'anticlockwise' : 'clockwise');

/* ------------------------------------------------------------------ edges */

const EDGE_TEXT = {
  FO: `Everything else is built on this one. You glide forwards with the skate rolling
towards the little-toe side of the foot and the whole body leaning into the circle it is
tracing. The lean *is* the edge — there is no separate act of steering. You commit over
the blade and the ice does the rest.

The usual fault is leaning from the shoulders alone. Drop a shoulder while the hip stays
outside the circle and the blade flattens, the lobe opens out, and what should be a curve
becomes a long shallow drift. A good forward outside edge can hold its curve indefinitely
and bring you back to where you started, which is a more demanding test than it sounds.`,

  FI: `Forwards with the skate rolling towards the big-toe side, leaning into a circle that
curves the other way. It usually feels more secure than an outside edge, because the free
leg swings on the outside of the circle where there is room for it.

Holding it deep is the harder half. The free hip wants to open, and the moment it does the
lobe flattens out. Most of the work is on the free side of the body rather than the
skating side — a theme that runs through everything in this guide.`,

  BO: `The edge every jump in the guide lands on, which is reason enough to spend time on
it for its own sake. Travelling backwards on the outside of the blade, leaning into the
circle, with the difficulty that you cannot see where you are going and the instinct is to
sit away from it.

Weight belongs over the middle of the blade. Sit back and it skids; reach for the toe and
it stops. What makes this edge hard is not the curve but the holding — keeping the
shoulders and the free leg still against a rotation that wants to carry on. That is the
run-out of a jump landing, practised on its own with the jump taken away.`,

  BI: `Backwards on the inside of the blade. Most skaters meet this edge last, partly
because it is the least used on its own and partly because the position is awkward: the
free leg sits on the inside of the circle, crossing the line of travel, with nowhere
obvious to put it.

It earns its keep elsewhere. It is the takeoff of the flip and the Salchow and the exit of
a forward outside three turn, so a weak back inside edge shows up as a problem in things
that look nothing like it.`,
};

/* ------------------------------------------------------------------ turns */

/* Keyed turn / entry-edge. Sixteen passages, each serving both feet. */
const TURN_TEXT = {
  three: {
    FO: `You glide forwards on the outside edge, rotate half a turn towards the centre of
the circle you are already tracing, and come out backwards on the inside edge of the same
foot. The tracing left on the ice makes the shape the turn is named for.

The thing worth understanding is that the circle does not change. You start on it and you
finish on it — only the edge and the direction you are facing change. That is what
separates a three turn from a rocker, which looks similar and leaves you on a new circle
curving the other way.

Rotate towards the centre and the cusp points inwards. Rotate away and you have a bracket
instead.`,

    FI: `Forwards on the inside edge, rotating into the circle, out backwards on the outside
edge of the same foot. It is usually the second three turn a skater learns and it is the
one that flatters them — the rotation goes the easy way and the exit arrives on a strong
backward edge.

Treat that as a warning rather than a compliment. Because it comes easily it is often done
with the shoulders leading and the edge only nominally present. The honest test is whether
you can hold the exit for as long as you held the entry.`,

    BO: `Backwards on the outside edge, rotating into the circle, out forwards on the inside
edge. Entering backwards changes the problem entirely: you cannot watch the turn coming,
so the timing has to be felt.

The rotation itself is small. What takes the practice is arriving at it on a real edge
rather than a flat, and not letting the free leg wind up beforehand — if the free side
leads, the turn happens where the free leg decides rather than where you meant it to.`,

    BI: `Backwards on the inside edge, rotating into the circle, out forwards on the outside
edge. This is where a good many skaters quietly stall, because the entry is the edge they
practise least and the exit is a forward outside edge that has to be held rather than
merely reached.

Done properly it is one of the most useful turns on the ice: it converts a backward inside
edge into a forward outside one, which is how a great many step sequences begin.`,
  },

  bracket: {
    FO: `The same entry as a forward outside three, the same exit edge, and the opposite
rotation. You turn away from the centre of the circle instead of towards it, so the body
works against the curve for the whole turn and then has to be checked the instant it is
done.

Because the lobe continues, the tracing looks like a three turn with the cusp pointing the
wrong way — outwards, away from the circle, the shape the turn is named for. That single
difference is felt as a much larger one. Nothing about a bracket is helped by the edge you
are on.`,

    FI: `Forwards on the inside edge, rotating away from the circle, out backwards on the
outside edge. The exit is the good one — a checked back outside edge — which makes this a
turn worth having even though the rotation fights you all the way in.

The common failure is turning early. Rotating against the curve is hard work, so the body
starts before the edge is ready and the blade scrapes round instead of cutting a clean
cusp. If you can hear the turn, it went early.`,

    BO: `Backwards on the outside edge, rotating away from the circle, out forwards on the
inside edge. Entering blind and rotating against the curve at the same time is what makes
the brackets from a back edge the ones people put off.

There is no trick to it beyond patience with the entry. A shallow entry edge gives the
turn nothing to rotate against, and what comes out is a flat scrape that leaves you facing
the right way on no edge at all.`,

    BI: `Backwards on the inside edge, rotating away from the circle, out forwards on the
outside edge. On paper it is the mirror of the back outside bracket. On ice it is usually
the harder of the two, because the entry is the weakest edge most skaters own and the free
leg has nowhere comfortable to sit.

The exit repays the trouble. A checked forward outside edge coming out of a bracket is
about the cleanest entry into a new lobe there is.`,
  },

  rocker: {
    FO: `Forwards on the outside edge, rotating into the circle exactly as a three turn
does — and then the edge does not change, so the lobe has to. You leave the circle you
were on and pick up a new one curving the other way.

That is the whole reason the turn exists as a separate thing. The rotation is a three
turn's rotation; the destination is somewhere else entirely.`,

    FI: `Forwards on the inside edge, rotating into the circle, holding the inside edge out
the back. Because the edge holds and the direction reverses, the new lobe curves opposite
to the old one — you have changed circles without changing edges.

Watch the exit rather than the turn. It is easy to rotate, land on a flat, and pick the
new lobe up a beat later. The turn is only really finished when the new curve starts at
the cusp and not after it.`,

    BO: `Backwards on the outside edge — the edge you land jumps on — rotating into the
circle and coming out forwards, still outside.

A rocker keeps the edge you are on and reverses the direction you are travelling, which,
because those are two of the three things that decide which way a lobe curves, means the
new lobe curves the opposite way. You leave one circle and join another.

It is worth doing a three turn and a rocker back to back from the same entry edge. The
rotation feels almost identical. What differs is where you end up.`,

    BI: `Backwards on the inside edge, rotating into the circle, out forwards still on the
inside edge and onto a lobe curving the other way. It shares its awkwardness with
everything else that begins on a back inside edge — the entry is the one you practise
least.

What it buys you is a change of circle without a change of edge, which is how a step
sequence travels in a straight line while every piece of it is a curve.`,
  },

  counter: {
    FO: `Forwards on the outside edge, rotating away from the circle, out backwards still
on the outside edge and onto a new lobe. Both of the difficult things at once: the
rotation fights the curve, and the lobe reverses underneath you.

Counters are usually the last of the four to arrive, and the reason is checking. The body
has to be wound against the edge, released just enough to get round, and stopped dead on a
curve that is now going the other way. Any looseness anywhere shows up immediately in the
tracing.`,

    FI: `Forwards on the inside edge, rotating away from the circle, out backwards on the
inside edge and onto a new lobe. The exit is a back inside edge, which is the least
practised edge there is, so this turn tends to be judged by what happens in the two
seconds after it rather than during it.

If the new lobe does not begin at the cusp, what you did was a rotation and not a counter.`,

    BO: `Backwards on the outside edge, rotating away from the circle, out forwards on the
outside edge and onto a new lobe. This is the one people mean when they say counters are
hard: you enter blind, rotate against the curve, and have to check onto a forward outside
edge that is now curving the other way.

Everything depends on the entry. A deep, quiet back outside edge gives you something to
turn against. A shallow one gives you nothing, and no amount of effort inside the turn
will rescue it.`,

    BI: `Backwards on the inside edge, rotating away from the circle, out forwards on the
inside edge and onto a new lobe. It has a reputation and most of it is deserved — the
weakest entry edge combined with the least helpful rotation.

It is also the clearest illustration of what the four turns actually are. Same entry as
the back inside three, same rotation as the back inside bracket, same held edge as the
back inside rocker. The combination is the only thing that makes it its own turn.`,
  },
};

/* ------------------------------------------------------- two-foot turns */

/* Eight more passages. Same rule: keyed on direction and edge, never on the
   foot, because the left and right versions are mirror images of one another. */
TURN_TEXT.mohawk = {
  FO: `Forwards on the outside edge, and instead of turning on the blade you step onto
the other foot and travel backwards on its outside edge. The circle does not change and
neither does the character of the edge — only the foot and the direction you face.

The forward outside mohawk is the less common of the two, and it is the harder to make
look calm, because the free foot has to arrive turned out and close in without the hips
opening first. There is no cusp to hide behind: whatever the edge was doing at the moment
of the step is what appears on the ice.`,

  FI: `Forwards on the inside edge, stepping onto the other foot to travel backwards on its
inside edge, staying on the same circle throughout. This is the mohawk most skaters mean
when they say the word, and it is usually the first change of foot they learn.

Where it goes wrong is in the placement. The free foot wants to arrive too far in front or
too far away, and either produces a jolt as the weight transfers. Open and closed describe
where it goes — heel to the inner side of the skating foot for open, instep to the heel
for closed — and they feel like different moves even though the tracing is identical.`,

  BO: `Backwards on the outside edge, stepping onto the other foot and coming out forwards
on its outside edge, on the same circle. Blind entry, and the step arrives at the point
where you can see least.

Everything depends on the free foot being ready early. It cannot be found during the step,
because the step is instantaneous — there is no pivot to buy time with. This is where the
difference between a two-foot turn and a one-foot turn stops being academic.`,

  BI: `Backwards on the inside edge, stepping onto the other foot to run forwards on its
inside edge, still on the same circle. Less used than the forward inside mohawk and more
awkward for the same reason every back inside entry is awkward: the free leg is on the
inside of the circle with nowhere to sit.

It is worth practising anyway, because it is the exit half of what the forward inside
mohawk teaches, and a skater who can only go one way through the change of foot has learnt
half a move.`,
};

TURN_TEXT.choctaw = {
  FO: `Forwards on the outside edge, stepping onto the other foot — and this time the edge
changes with the foot, so you leave backwards on an inside edge and the curve reverses
under you. One circle ends and another begins at the moment the blade goes down.

That reversal is the whole difficulty. A mohawk lets you keep leaning the way you were
already leaning; a choctaw asks you to change lean and foot at the same instant, and any
hesitation shows as a flat between the two lobes.`,

  FI: `Forwards on the inside edge, stepping onto the other foot to travel backwards on its
outside edge, with the curve reversing at the step. The exit is a checked back outside
edge, which makes this one of the most useful changes of foot there is — it is how a
sequence gets from a forward lobe onto a backward one without losing speed.

Watch the moment of transfer rather than either edge. If the new lobe does not start
immediately, the weight went across before the lean did.`,

  BO: `Backwards on the outside edge, stepping onto the other foot to run forwards on its
inside edge, on a new lobe curving the other way. Entering blind and reversing the curve at
the same time, which puts this among the harder things in the guide.

The step has to be made from a genuine edge. A shallow back outside entry gives the new
lobe nothing to reverse from, and what comes out is two flats with a change of foot in the
middle.`,

  BI: `Backwards on the inside edge, stepping onto the other foot to travel forwards on its
outside edge, with the lobe reversing at the step. The weakest entry edge and a change of
both foot and curve — which is why it turns up late rather than early.

The reward is the exit. A forward outside edge, checked, coming out of a reversal, is
about the strongest position a step sequence can hand you, and it is worth the months it
takes to make it quiet.`,
};

/* ------------------------------------------------------------ combinations */

/* Turns are done in clusters as often as singly, and from Skills 5 upwards the
   British syllabus is largely made of them. These are the standard named ones.
   Everything about each — the edges passed through, the exit, whether it returns
   to where it began — is chained out of exitState and never written down.

   The prose here is keyed on the cluster and on direction only, not on edge.
   That is a weaker key than the single turns use, and deliberately so: what
   makes a rocker-counter hard is the rocker-counter, and what changes it most is
   whether you enter it able to see where you are going. */


const COMBO_TEXT = {
  'double-three': {
    F: `Two three turns on the same foot, one straight after the other, entering forwards.
Each is an ordinary three turn; the difficulty is entirely in the join. You have to check
the first one hard enough to stop the rotation, then release it again immediately for the
second, and there is no time to reset the edge in between.

The tell is the second cusp. If it is shallower than the first, the check failed and the
body carried the turn round rather than the blade cutting it.`,

    B: `Two three turns on one foot from a backward entry. The rhythm is the whole exercise:
turn, check, turn, with the same knee rising and falling twice in the space one turn would
usually take.

Entering backwards you cannot watch the first turn arrive, so the second one has to be felt
rather than timed. Skaters who rush it end up with a scrape where the second cusp should be
and no edge at all coming out.`,
  },

  'three-mohawk': {
    F: `A three turn, then straight onto the other foot. The three turn takes you from
forwards to backwards on one blade; the mohawk takes you back to forwards on the other,
and the lobe carries on through both.

What makes it worth practising as one thing rather than two is that the mohawk has to be
ready before the three turn is finished. The free foot cannot be found afterwards — a step
is instantaneous, and if the foot is not there the cluster becomes a stumble with a good
turn in front of it.`,

    B: `A three turn from a backward edge, straight into a step onto the other foot. You
enter blind, turn to forwards, then step back to a backward edge, all on one lobe.

The join is the hard part, as it always is. Coming out of the three turn you are travelling
forwards for a fraction of a second, and that is the only moment in which the free foot can
be placed. Everything about the cluster is decided before the first turn starts.`,
  },

  'rocker-counter': {
    F: `A rocker into a counter, forwards. The rocker rotates into the circle and hands you
a new lobe; the counter rotates against that new lobe and hands you another. Two changes of
circle in a row, on one foot, with the body reversing its rotation between them.

This is where checking stops being a detail. The rocker's exit has to be stopped dead
before the counter can be entered, and the counter turns the other way — so any rotation
left over from the first turn is working directly against the second.`,

    B: `A rocker into a counter from a backward entry. The two turns rotate opposite ways
and both change the circle, so the skater ends up back on the lobe they began on while
having travelled somewhere else entirely.

Watch the middle edge rather than either turn. There is a genuine edge between them, brief
but real, and if it is a flat then what happened was one long rotation with two scrapes in
it rather than two turns.`,
  },

  'bracket-counter': {
    F: `A bracket into a counter, forwards. Both turn against the curve, which is what makes
this cluster feel relentless — there is no point in it where the edge is helping you.

The bracket keeps the lobe; the counter reverses it. So the body rotates the same way twice
while the circle changes underneath, and the checking has to hold through both. It is the
cluster that most rewards a deep, quiet entry edge and most punishes a shallow one.`,

    B: `A bracket into a counter from a backward edge. Entering blind, rotating against the
curve twice, and changing circle at the second turn.

The two turns look similar on the ice and feel quite different: the bracket has a cusp
pointing out of the circle and leaves you on the same lobe, the counter has the same
rotation but takes the lobe away. Doing them back to back is the clearest way to learn
which is which.`,
  },

  'counter-three': {
    F: `A counter into a three turn, forwards. The counter fights the curve and changes the
circle; the three turn then goes with the new curve and stays on it. So the cluster is hard
then easy, which is its own trap — the three turn arrives while you are still recovering
from the counter and tends to be thrown away.

Skate the second turn as deliberately as the first. It is the one that leaves you with an
edge to travel on.`,

    B: `A counter from a backward edge, straight into a three turn. Two half turns in quick
succession, the first against the curve and the second with it.

The rotation reverses between them, which means the check after the counter is doing two
jobs at once: stopping the counter and preparing the opposite rotation. There is no pause
in which to do them separately.`,
  },

  'counter-mohawk': {
    F: `A counter, then a step onto the other foot. The counter changes the circle; the
mohawk keeps the new one and changes the foot.

Coming out of a counter is an awkward moment to be placing a free foot — the body is
checked hard against a lobe that has just reversed, and the free side is exactly what is
holding that check. Letting it go to make the step is the thing that has to be practised.`,

    B: `A counter from a backward edge into a step onto the other foot. Blind entry,
reversed lobe, then a change of foot on the new curve.

The step is what saves it. A counter's exit is a difficult edge to hold for long, and
stepping off it before it decays is easier than sustaining it — which is presumably why
this cluster exists rather than the counter alone.`,
  },

  'rocker-choctaw': {
    F: `A rocker, then a step onto the other foot with the edge changing as well. The rocker
reverses the lobe by turning on the blade; the choctaw reverses it again by stepping across.
Two changes of circle by two entirely different mechanisms, one after the other.

Worth doing precisely because the mechanisms differ. The rocker's change of lobe happens at
a cusp you can see; the choctaw's happens at a gap in the tracing where one blade stops and
another starts.`,

    B: `A rocker from a backward edge into a choctaw. The lobe reverses at the rocker and
reverses again at the step, so the skater finishes curving the way they started while
having crossed the ice.

The choctaw is the harder half. Changing foot and lean at the same instant is difficult
from a settled edge and worse from one you have just turned onto, and hesitation shows as a
flat between the two lobes.`,
  },

  'choctaw-three-rocker': {
    F: `Three turns in a row, forwards: a step onto the other foot with the edge changing,
then a three turn on that foot, then a rocker. The lobe reverses, continues, then reverses
again.

The reason it is taught as one cluster is that each turn sets up the next badly. The
choctaw leaves you on a fresh lobe with no time to settle; the three turn spends the
rotation you were checking; the rocker then asks for that rotation back, the other way.
Getting through it at all is an achievement before it is ever quiet.`,

    B: `A choctaw from a backward edge, then a three turn, then a rocker. Three turns, two
feet, and the lobe reversing twice.

Take it in halves. The choctaw and the three turn belong together — the step has to land on
an edge good enough to turn on immediately. The rocker is a separate problem and can be
practised on its own from the edge the three turn leaves.`,
  },
};

/* --------------------------------------------------------------- assembly */

const files = [];

for (const foot of FEET) for (const dir of DIRS) for (const edge of EDGES) {
  const s = { foot, edge, dir };

  files.push({
    id: slug(s),
    front: [
      `name: ${FOOT_WORD[foot]} ${DIR_WORD[dir]} ${EDGE_WORD[edge]} edge`,
      `kind: edge`,
      `summary: ${label(s)} — the ${FOOT_WORD[foot].toLowerCase()} foot travelling ${dir === 'F' ? 'forwards' : 'backwards'} on an ${EDGE_WORD[edge]} edge, tracing ${sense(s) === 'anticlockwise' ? 'an anticlockwise' : 'a clockwise'} lobe.`,
      `entry: { foot: ${foot}, edge: ${edge}, dir: ${dir} }`,
    ],
    body: EDGE_TEXT[key(s)],
  });

  for (const turnKey of Object.keys(ALL_TURNS)) {
    const t = ALL_TURNS[turnKey];
    const x = exitState(s, turnKey);
    const continues = lobeSense(s.foot, s.edge, s.dir) === lobeSense(x.foot, x.edge, x.dir);

    /* The teaching order the prerequisites encode: the plain edge, then the three,
       then the bracket and the rocker off it, then the counter off both. The
       two-foot turns hang off the plain edge and off each other. Unverified like
       everything else — a plausible ladder, not a syllabus. */
    const prereq = {
      three: [slug(s)],
      bracket: [`${slug(s)}-three`],
      rocker: [`${slug(s)}-three`],
      counter: [`${slug(s)}-bracket`, `${slug(s)}-rocker`],
      mohawk: [slug(s)],
      choctaw: [`${slug(s)}-mohawk`],
    }[turnKey];

    const summary = t.changesFoot
      ? `${label(s)} to ${label(x)} — a step onto the other foot, ` +
        `${t.edgeChanges ? 'changing edge' : 'holding the edge'} and ` +
        `${continues ? 'staying on the same lobe' : 'reversing onto a new one'}. No cusp.`
      : `${label(s)} to ${label(x)} — half a turn ${t.rotatesInto ? 'into' : 'against'} the circle, ` +
        `${t.edgeChanges ? 'changing edge' : 'holding the edge'} and ` +
        `${continues ? 'staying on the same lobe' : 'leaving on a new one'}.`;

    files.push({
      id: `${slug(s)}-${turnKey}`,
      front: [
        `name: ${FOOT_WORD[foot]} ${DIR_WORD[dir]} ${EDGE_WORD[edge]} ${TURN_NOUN[turnKey]}`,
        `kind: turn`,
        `summary: ${summary}`,
        `entry: { foot: ${foot}, edge: ${edge}, dir: ${dir} }`,
        `turn: ${turnKey}`,
        `prerequisites: [${prereq.join(', ')}]`,
      ],
      body: TURN_TEXT[turnKey][key(s)],
    });
  }

  for (const [comboKey, combo] of Object.entries(CLUSTERS)) {
    const states = chainStates(s, combo.turns);
    const x = states.at(-1);
    const feet = new Set(states.map(st => st.foot)).size;
    const returns = label(x) === label(s);

    files.push({
      id: `${slug(s)}-${comboKey}`,
      front: [
        `name: ${FOOT_WORD[foot]} ${DIR_WORD[dir]} ${EDGE_WORD[edge]} ${combo.name}`,
        `kind: combination`,
        `summary: ${states.map(label).join(' → ')}${returns ? ', back where it started' : ''} — ` +
          `${combo.turns.length} turns on ${feet === 1 ? 'one foot' : 'two feet'}.`,
        `entry: { foot: ${foot}, edge: ${edge}, dir: ${dir} }`,
        `turns: [${combo.turns.join(', ')}]`,
        /* A cluster is built on its parts, so the parts are its prerequisites. */
        `prerequisites: [${[...new Set(combo.turns.map((t, i) => `${slug(states[i])}-${t}`))].join(', ')}]`,
      ],
      body: COMBO_TEXT[comboKey][dir],
    });
  }
}

mkdirSync(OUT, { recursive: true });
let wrote = 0, kept = 0;

for (const f of files) {
  const path = join(OUT, `${f.id}.md`);
  if (existsSync(path) && !force) { kept++; continue; }
  writeFileSync(path,
    ['---', ...f.front, 'verified: { checked: false }', '---', '', f.body.trim(), ''].join('\n'));
  wrote++;
}

console.log(`${wrote} written, ${kept} left alone (${files.length} derived elements in total)`);
