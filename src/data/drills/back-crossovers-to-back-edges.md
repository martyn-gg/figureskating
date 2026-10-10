---
name: Back crossovers to back outside edges
summary: Back crossovers, then a held back outside edge on a half circle, then the same the other way, down the long axis.
stage: edges
pattern: axis
sequence: Back crossovers anticlockwise · RBO edge held · back crossovers clockwise · LBO edge held · repeat
trains: [rbo, lbo, rbo-crossover, lbo-crossover]
trace:
  radius: 250
  path:
  - {kind: arc, foot: R, edge: O, dir: B, sweep: 40}
  - {kind: arc, foot: L, edge: I, dir: B, sweep: 40}
  - {kind: arc, foot: R, edge: O, dir: B, sweep: 100}
  - {kind: arc, foot: L, edge: O, dir: B, sweep: 40, newLobe: true}
  - {kind: arc, foot: R, edge: I, dir: B, sweep: 40}
  - {kind: arc, foot: L, edge: O, dir: B, sweep: 100}
rig: backCrossoversToBackEdges
sources: 3
verified: {checked: false}
---

Two or three back crossovers, then a back outside edge held to finish the half circle, then
crossovers the other way and the other edge. Four or five lobes take you the length of the
rink.

The held edge is the landing edge of every jump, and this drill puts it at the end of the
speed that crossovers give, which is where a landing puts it too. Coaches look for the free
leg extended behind, the arms held steady and the edge carried right to the end of the
lobe rather than abandoned for the next crossover.

Looking over the shoulder into the circle while going backwards is part of the drill, not a
distraction from it.
