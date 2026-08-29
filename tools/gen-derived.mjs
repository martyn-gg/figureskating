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
import { lobeSense, label, exitState, chainStates,
         TURNS, STEPS, TRANSITIONS, TWIZZLES, CLUSTERS, JUMPS, LANDING, ALL_TURNS,
         halves } from '../src/lib/skating.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'elements');
const force = process.argv.includes('--force');

const FEET = ['L', 'R'];
const DIRS = ['F', 'B'];
const EDGES = ['O', 'I'];

const FOOT_WORD = { L: 'Left', R: 'Right' };
const DIR_WORD = { F: 'forward', B: 'backward' };
const EDGE_WORD = { O: 'outside', I: 'inside' };
const TURN_NOUN = { three: 'three turn', bracket: 'bracket', rocker: 'rocker', counter: 'counter',
                    mohawk: 'mohawk', choctaw: 'choctaw',
                    coe: 'change of edge', loop: 'loop', crossover: 'crossover',
                    chasse: 'chassé', crossroll: 'cross roll',
                    twizzle: 'twizzle', twizzle15: '1½ twizzle', twizzle2: 'double twizzle' };

/* Slugs spell the rotation count out. A URL cannot hold a ½, and `twizzle-15`
   reads as fifteen of them. */
const TWIZZLE_SLUG = { twizzle: 'twizzle', twizzle15: 'one-and-a-half-twizzle',
                       twizzle2: 'double-twizzle' };

/* Which entry edges each transition is actually skated from. A crossover, a chassé
   and a cross roll all begin on an outside edge — that is not a modelling
   limitation, it is what the elements are. Changes of edge and loops are done on
   all four. */
const TRANSITION_ENTRIES = {
  coe: ['O', 'I'], loop: ['O', 'I'],
  crossover: ['O'], chasse: ['O'], crossroll: ['O'],
};

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

/* -------------------------------------------------------------- transitions */

/* The connecting material: what a skater does between turns. None of it reverses
   the direction of travel, which is what makes it not a turn. */

/* Twizzles. Keyed on direction and edge like everything else here, and on the
   rotation count, because one and a half is a different element from one rather
   than the same element done longer — it comes out on the other edge letter and
   travelling the other way. */
const TWIZZLE_TEXT = {
  twizzle: {
    FO: `One rotation on a forward outside edge, finishing on the edge it began on and
still going the same way. That makes it the honest place to learn one: nothing about the
exit has to be relearned, and the only new thing is the rotation itself.

The edge is where it goes wrong. A forward outside edge is already leaning into its circle
and the rotation wants to take that lean with it, so the usual failure is the free side
opening halfway round and the blade settling onto a flat. The tracing will tell you which
happened. A curl means you rotated over the blade; a scallop means you skidded across it.`,

    FI: `Forwards on an inside edge, one rotation, out on the same edge. Most skaters
twizzle from here first, because an inside edge is already turning the way the body wants
to go and there is less rotation to find.

Which is also the trap. Rotation that arrives free is rotation you have not learned to
meter, and it shows as a twizzle that does most of its turning in the first half and coasts
through the second. Even rotation looks slower than it is and is much harder.`,

    BO: `Backwards on an outside edge, one rotation, out where it started. This is the
twizzle of ice dance — done in sequence, in pairs, at speed — and the one most likely to be
asked for with something else immediately after it.

Blind, so it runs off the edge and the shoulders rather than off anything you can watch.
The exit is the whole element: the rotation has to stop on the edge it started on, checked,
rather than two-thirds of the way round with a step put in to tidy up what is left.`,

    BI: `Backwards on an inside edge, one rotation, exiting on the edge it began on. The
weakest of the four entries — a back inside edge has the least lean to sit on and the least
to check against — which is a reason to practise it rather than avoid it.

It exposes the free hip more than the other three. Let it trail and the rotation runs out
before the turn is finished, and the last quarter arrives as a scrape rather than a curl.`,
  },

  twizzle15: {
    FO: `One and a half rotations from a forward outside edge, leaving backwards on an
inside one. Same foot, and the blade never changes which way it is curving — the edge
letter changes because you turned round, not because the curve did.

The half rotation is what makes it impossible to fake. A whole one can be assembled out of
a three turn and a step and still look roughly right from the side; a half cannot, because
you finish facing the way you did not start. Either the rotation was continuous or you are
standing on the wrong edge, and there is no third outcome.`,

    FI: `The one British Ice Skating asks for at Skills 3: forwards on an inside edge, one
and a half rotations, out backwards on an outside one. It is the first twizzle in the
syllabus and the first element where continuous rotation is the thing actually being
tested.

Judge it at the exit. A back outside edge, held and checked, means the rotation finished
where it was meant to; a back inside edge or a flat means it did not, and nothing done
afterwards recovers that. Better still, judge it from the ice — a curl and then a clean
edge is a twizzle, and a cusp anywhere in it is a three turn wearing the name.`,

    BO: `Backwards on an outside edge, one and a half rotations, out forwards on an inside
one. Rarer than the forward entries and more useful than it looks: it turns backward travel
into forward travel without a step, on one foot, while still going the same way down the
ice.

The difficulty is that it starts blind and finishes sighted, so the half of it you can see
is the half already decided. Everything that matters has happened by the time the rink
comes back into view.`,

    BI: `Backwards on an inside edge, one and a half rotations, out forwards on an outside
one — the weakest entry edge turning into the strongest exit, which is what makes it worth
having.

It is the least forgiving of the four. A back inside edge gives the rotation almost nothing
to push against, so it has to be brought in with the shoulders and the free side and then
held there, and the common result is a twizzle that turns one rotation cleanly and drags
the last half round flat.`,
  },

  twizzle2: {
    FO: `Two rotations on a forward outside edge, out on the edge it began on. Two curls in
the tracing, evenly spaced, and no cusp between them — that spacing is the element. Uneven
curls mean the rotation was found once and then found again, which is two twizzles rather
than one.

Doubling the rotation does not double the difficulty; holding the edge for twice as long
does. Everything a single twizzle lets you get away with, this one charges for.`,

    FI: `Two rotations forwards on an inside edge, exiting where it entered. The rotation is
easier to start here than from an outside edge and much harder to keep even, because the
edge helps with the first turn and not with the second.

Watch the travel rather than the skater. A double that stops moving has become a spin — the
governing bodies say so in as many words — and the tracing shows it immediately: two curls
sitting on top of each other instead of one after the other.`,

    BO: `Two rotations backwards on an outside edge, out on the same edge. This is the one
asked for at the top of the Skills syllabus, and in ice dance it is done alongside a partner
where the two sets of curls are compared with each other.

Nothing about it is new after a single; all of it is harder. The rotation has to be metered
so that the second turn is as strong as the first, and the check at the end has to arrive on
an edge that has been running for twice as long.`,

    BI: `Two rotations backwards on an inside edge, exiting where it began. The hardest of
the twelve, for the same reason the single is the hardest of its four: there is least to
lean on and least to check against, and now it has to last twice as long.

If it fails it usually fails between the curls, where the edge flattens and the second
rotation is skidded rather than turned. The tracing is unambiguous about it — a flat is a
straight line, and a straight line in the middle of a twizzle is the whole fault.`,
  },
};

const TRANSITION_TEXT = {
  coe: {
    FO: `The blade rolls from the outside edge to the inside edge without turning, and
because one of the three things that decide a lobe has changed, the curve reverses under
you. Forwards throughout — you never stop facing the way you are going.

There is nothing to see at the moment it happens, which is the difficulty. A three turn
leaves a cusp and a mohawk leaves a gap; a change of edge leaves a smooth line that either
does or does not have a kink in it, and the kink is the fault. The roll should take a
metre, not an instant.`,

    FI: `Forwards from the inside edge to the outside, the curve reversing as the blade
rolls across. This is the half most skaters find harder, because arriving on an outside
edge asks for a lean the free side has to allow.

Judge it by the two lobes rather than the join. If they are the same depth, the change
happened where it should. If the second is shallower, the roll came late and you spent the
first part of it on a flat.`,

    BO: `Backwards from the outside edge to the inside, the curve reversing. Blind, and
without the cusp or the gap that at least tells you a turn has occurred.

It is worth doing this slowly and listening. A clean change of edge is silent. A late one
scrapes, because what actually happened was a moment on the flat with the weight in the
wrong place, and the ice will tell you before your feet do.`,

    BI: `Backwards from the inside edge to the outside, the lobe reversing. The weakest
entry edge rolling onto the strongest exit, which makes this more useful than it looks —
it is the cheapest way of getting from a back inside edge to a checked back outside one.

The whole move lives in the ankle and the hip. If the shoulders join in, you have started
a turn instead.`,
  },

  loop: {
    FO: `A small circle traced on one foot, on one edge, forwards, coming back to the edge
it left and carrying on. Nothing changes — not the foot, not the edge, not the direction —
which is what makes it its own thing rather than a turn.

It is a figure, and it behaves like one: the whole thing is decided by the entry. The loop
should sit inside the lobe, be about the size of the skater's own body, and rejoin the
curve so cleanly that the tracing reads as a lobe with a knot in it rather than two
separate shapes.`,

    FI: `A loop on a forward inside edge — the same small circle, curving the other way.
The free side has less room here than on an outside loop, and crowding it is what turns a
round loop into an egg.

Practise it as a shape rather than a movement. A loop is judged on the tracing it leaves,
and there is nowhere for a wobble to hide in a closed curve.`,

    BO: `A loop entered backwards on the outside edge. Blind, and the whole figure happens
in a couple of seconds with no chance to correct it once begun.

This is where the knee does the work. The loop is drawn by rising and sinking over a
continuous edge, not by pushing; anything added with the shoulders shows up as a flat spot
on the far side of the circle, where you cannot see it.`,

    BI: `A loop on a backward inside edge — the one the British syllabus asks for, and the
hardest of the four for the reason every back inside element is hardest: the free leg sits
inside the circle with nowhere to go.

The size is the giveaway. A tight loop means the edge was too deep going in; a large
sprawling one means the edge was never deep enough to close it.`,
  },

  crossover: {
    FO: `The free foot crosses in front of the skating foot and goes down on the inside
edge of the other foot, on the same circle. It is how a skater builds speed on a curve, and
it is the first thing after plain edges that most people learn.

The push is the whole point and the part most often thrown away. Both feet push — the
outside foot as it crosses, and then the inside foot as it comes out from under. A
crossover done as a step over rather than two pushes looks tidy and produces nothing.`,

    BO: `Backwards, the free foot crossing over and going down on the inside edge of the
other foot, on the same circle. Every backward entry in the guide starts with these, so
they deserve more attention than their difficulty suggests.

The common fault is turning the shoulders into the circle to help. It does help, briefly,
and then there is no rotation left to check with when the crossovers stop and the element
starts. Keep the shoulders square to the circle and let the feet do it.`,
  },

  chasse: {
    FO: `Forwards, the free foot placed on the ice *beside* the skating foot rather than
crossed over it, and the old skating foot lifted with the blade parallel to the ice. The
tracing is a crossover's — same circle, same change of foot and edge — and the feet are
doing something quite different.

Worth stating plainly: this guide draws what the blades draw, and here the blades draw the
same thing. The difference is placement, and placement is what the body-frame view is for.
Open, slip and slide chassés differ from one another the same way.`,

    BO: `Backwards, the free foot set down beside the skating foot rather than across it.
Quieter than a crossover and less powerful, which is the trade — a chassé keeps a curve
going without disturbing it.

Because there is no crossing action to hide behind, a chassé shows up a weak edge at once.
If the lobe opens out as the feet change, the edge was never deep.`,
  },

  crossroll: {
    FO: `The free foot swings in from the side, passes the skating foot and goes down on
its own outside edge — and because the new edge is outside on the other foot, the curve
reverses. One lobe ends and the next begins as the feet cross.

It is the most expressive way of getting from one lobe to the next and the least forgiving,
because the whole transfer happens over an outside edge with the body already leaning the
new way. Lean late and it becomes a step; lean early and you fall into the new lobe rather
than rolling into it.`,

    BO: `Backwards, the free foot passing the skating foot and taking its own outside edge,
the lobe reversing at the change. Blind, and the new lean has to be committed to before
there is any evidence it will be caught.

Watch the shoulders. The reversal wants to be led from the hips with the shoulders
following; led from the shoulders it becomes a lurch, and the tracing shows two lobes with
a straight line between them instead of one continuous roll.`,
  },
};

/* ------------------------------------------------------------------- jumps */

/* Takeoff, landing, pick and rotations all come from JUMPS, so no page can
   disagree with the model about what a Salchow is. Only the words are written. */

const JUMP_SLUG = { toeLoop: 'toe-loop', salchow: 'salchow', loop: 'loop', axel: 'axel' };

const JUMP_TEXT = {
  toeLoop: `Backwards on a right outside edge, the left toe pick placed behind, and the
vault carries you through one rotation to land on the edge you left. Usually the first toe
jump a skater lands, and often the first double as well.

The trap is the pick. It is a jab, not a stance — it sets the height and comes straight out
again. Reach back and *press* on it and the rotation stalls, and the jump gets spent on the
ice rather than above it.`,

  salchow: `From a back inside edge, no pick, the free leg swinging through to carry you
round. The edge does the work, which is why a Salchow rewards patience on the entry far
more than effort in the air.

It is usually entered from a forward outside three turn, so a poor three turn is the most
common reason a Salchow fails — the jump was fine and the thing before it was not.
Practise the entry as its own element before blaming the takeoff.`,

  loop: `A back outside edge, no pick, and the rotation comes entirely from the edge and
the check. Nothing helps you: there is no swing through and nothing to vault off, which is
what makes the loop the honest test of a skater's edge.

It shares its takeoff with the toe loop, and the two are told apart by whether a pick goes
in. Seen from above they are the same entry; seen from the side, one has a jab in it.`,

  axel: `The only jump here with a forward takeoff, which is why it carries an extra half
rotation — you leave facing forwards and land facing backwards, so one and a half turns is
the least a single can be.

It is a waltz jump with a full rotation added, and that is the useful way to hold it in
mind. The entry edge, the swing, the check on the landing and the run-out are all things a
waltz jump already teaches. Getting the waltz jump right rather than merely getting past it
is most of the work.`,
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

  for (const turnKey of [...Object.keys(TURNS), ...Object.keys(STEPS)]) {
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

  for (const [key_, tr] of Object.entries(TRANSITIONS)) {
    if (!TRANSITION_ENTRIES[key_].includes(edge)) continue;
    const x = exitState(s, key_);
    const continues = lobeSense(s.foot, s.edge, s.dir) === lobeSense(x.foot, x.edge, x.dir);
    const how = { roll: 'the blade rolls across without turning',
                  loop: 'a small circle traced on the same edge',
                  step: 'a step onto the other foot' }[tr.join];

    files.push({
      id: `${slug(s)}-${key_}`,
      front: [
        `name: ${FOOT_WORD[foot]} ${DIR_WORD[dir]} ${EDGE_WORD[edge]} ${TURN_NOUN[key_]}`,
        `kind: transition`,
        `summary: ${label(s)} to ${label(x)} — ${how}, still travelling ` +
          `${dir === 'F' ? 'forwards' : 'backwards'}, and the lobe ` +
          `${continues ? 'continues' : 'reverses'}.`,
        `entry: { foot: ${foot}, edge: ${edge}, dir: ${dir} }`,
        `turn: ${key_}`,
        `prerequisites: [${slug(s)}]`,
      ],
      body: TRANSITION_TEXT[key_][key(s)],
    });
  }

  /* Twizzles are skated from all four entries, unlike the crossovers and chassés
     above — there is no edge you cannot twizzle from. */
  for (const [key_, tw] of Object.entries(TWIZZLES)) {
    const x = exitState(s, key_);
    const whole = Math.floor(tw.rotations);
    files.push({
      id: `${slug(s)}-${TWIZZLE_SLUG[key_]}`,
      front: [
        `name: ${FOOT_WORD[foot]} ${DIR_WORD[dir]} ${EDGE_WORD[edge]} ${TURN_NOUN[key_]}`,
        `kind: twizzle`,
        `summary: ${label(s)} to ${label(x)} — ${halves(tw.rotations)} rotation` +
          `${tw.rotations === 1 ? '' : 's'} on one foot, travelling, ` +
          `${whole === 1 ? 'one curl' : `${whole} curls`} and no cusp.`,
        `entry: { foot: ${foot}, edge: ${edge}, dir: ${dir} }`,
        `turn: ${key_}`,
        /* A twizzle is built on the edge it is done on, and the longer ones on the
           single. Nothing here is a cluster: it is one continuous turn. */
        `prerequisites: [${key_ === 'twizzle' ? slug(s)
                          : `${slug(s)}, ${slug(s)}-twizzle`}]`,
      ],
      body: TWIZZLE_TEXT[key_][key(s)],
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

/* The four jumps the model knows about that have no page yet. Takeoff, landing,
   pick and rotations are read from JUMPS rather than typed out again. */
for (const [key_, j] of Object.entries(JUMPS)) {
  if (!JUMP_SLUG[key_]) continue;
  const t = j.takeoff, x = LANDING;
  files.push({
    id: JUMP_SLUG[key_],
    front: [
      `name: ${j.name}`,
      `kind: jump`,
      `summary: ${label(t)} takeoff, ${j.assisted ? 'off the pick' : 'off the edge'}, ` +
        `${j.rotations} rotation${j.rotations === 1 ? '' : 's'} to ${label(x)}.`,
      `jump:`,
      `  takeoff: { foot: ${t.foot}, edge: ${t.edge}, dir: ${t.dir} }`,
      `  landing: { foot: ${x.foot}, edge: ${x.edge}, dir: ${x.dir} }`,
      `  assisted: ${j.assisted}`,
      `  rotations: ${j.rotations}`,
    ],
    body: JUMP_TEXT[key_],
  });
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
