---
name: Change-of-edge pulls on the diagonals
summary: Power change-of-edge pulls from corner to corner, forwards on one diagonal and backwards on the other.
stage: edges
pattern: diagonal
sequence: Forward outside-to-inside and inside-to-outside pulls on one diagonal · back pulls on the other
trains: [power-change-of-edge-pulls]
trace:
  radius: 200
  path:
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 40}
  - {kind: arc, foot: L, edge: I, dir: F, sweep: 80}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 80}
  - {kind: arc, foot: L, edge: I, dir: F, sweep: 80}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 40}
notDrawn: the pulls are drawn on their own page; the diagonals between corners are not.
sources: 3
verified: {checked: false}
---

Pulls that change edge on one foot, corner to corner across the rink: forwards along one
diagonal, backwards along the other, then the other foot. The diagonal gives a long straight
line to hold, so any drift off it shows.

The change of edge comes from the body moving across the blade, not from the ankle rolling,
and the speed comes from the press as the knee rises through each change. One coach skates it
as forward crossovers down one side changing outside to inside, and inside to outside down
the other.

It is the edge control behind step sequences, where the edge changes on one foot without a
turn.
