---
name: Forward power three turns
aliases: [Power threes]
summary: A forward outside three, a back crossover and a step forward, round a circle, to build speed from the turns.
stage: turns
pattern: circle
sequence: LFO three LBI · back crossover to RBO · step forward to LFO · repeat
trains: [lfo-three, rbo-crossover]
uses: [lfo, lbi, rbo]
trace:
  radius: 300
  path:
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 60}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 10, turn: three}
  - {kind: arc, foot: L, edge: I, dir: B, sweep: 60}
  - {kind: arc, foot: R, edge: O, dir: B, sweep: 60}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 60}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 10, turn: three}
  - {kind: arc, foot: L, edge: I, dir: B, sweep: 60}
  - {kind: arc, foot: R, edge: O, dir: B, sweep: 60}
notDrawn: the change of foot onto a new lobe, which the body frame is gaining next.
variants: 'Coaches differ after the three: some take a full back crossover, others shift onto the inside edge of the other foot with a short push underneath.'
sources: 5
verified: {checked: false}
---

Round one circle: a forward outside three, a back crossover underneath, a step forward onto
the forward outside edge, and the three again. Each lap of the pattern should come out faster
than the one before it.

The point is that a turn can make speed rather than lose it. The knee bends into the three,
rises through it and bends again as the crossover pushes, and the step forward comes off
that push rather than off a pause. Where the skater stops pushing and starts drifting is
easy to see on the ice.

The same circle is the setting for spin entries and for the three turns that lead into
jumps, so the drill feeds both.
