---
name: Consecutive edges
aliases: [Edges on an axis, Alternating edges]
summary: Half-circle lobes down the long axis on alternate feet, one edge to each lobe.
stage: edges
pattern: axis
sequence: LFO · RFO · LFO · RFO; then forward inside, back outside and back inside
trains: [lfo, rfo, lfi, rfi, lbo, rbo, lbi, rbi]
uses: [forward-stroking]
trace:
  radius: 220
  path:
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 170}
  - {kind: arc, foot: R, edge: O, dir: F, sweep: 170, newLobe: true}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 170, newLobe: true}
  - {kind: arc, foot: R, edge: O, dir: F, sweep: 170, newLobe: true}
notDrawn: the change of foot onto a new lobe, which the body frame is gaining next.
sources: 5
verified: {checked: false}
---

Each lobe is close to half a circle, starting and finishing on the long axis. You push from
the inside edge of the old foot onto the new one, and the new lobe curves the opposite way,
so the pattern snakes down the ice.

This is the base the rest of skating sits on. The edge comes from the lean of the whole body
over the blade, not from tipping the ankle, and a lobe that flattens half way round shows
the lean was lost. The push should be short and to the side; a long push behind you swings
the hips open and the next lobe starts crooked.

The same drill is skated on forward inside edges, then backwards on both, where the push
and the look over the shoulder make it far harder.
