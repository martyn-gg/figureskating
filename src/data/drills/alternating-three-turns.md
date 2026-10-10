---
name: Alternating three turns
aliases: [Continuous three turns, Consecutive three turns]
summary: Forward outside three turns down the long axis, changing foot between lobes, until the check holds without thinking.
stage: turns
pattern: axis
sequence: LFO three LBI · step forward · RFO three RBI · step forward · repeat
trains: [lfo-three, rfo-three]
uses: [lfo, rfo, lbi, rbi]
trace:
  radius: 240
  path:
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 80}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 10, turn: three}
  - {kind: arc, foot: L, edge: I, dir: B, sweep: 80}
  - {kind: arc, foot: R, edge: O, dir: F, sweep: 80, newLobe: true}
  - {kind: arc, foot: R, edge: O, dir: F, sweep: 10, turn: three}
  - {kind: arc, foot: R, edge: I, dir: B, sweep: 80}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 80, newLobe: true}
  - {kind: arc, foot: L, edge: O, dir: F, sweep: 10, turn: three}
  - {kind: arc, foot: L, edge: I, dir: B, sweep: 80}
rig: alternatingThrees
variants: Some tests alternate forward outside and forward inside three turns in one pattern; others set them as separate exercises. The inside version is the same run from forward inside edges.
sources: 6
verified: {checked: false}
---

Each lobe holds one three turn, and the turn sits at its top, half way round. You come out of
it on the back edge, hold that edge until the lobe is finished, then step forward onto the
other foot and start a lobe that curves the other way.

The drill is about what happens after the turn rather than the turn itself. The rotation
that carried you through the cusp keeps going unless you stop it, and the drill asks you to
stop it every time, on alternate feet, without the back edge flattening. Coaches watch where
the turn lands on the lobe: early or late means the rotation started at the wrong moment.

Taken slowly it is a test of control; taken with speed it becomes the entry many skaters
use for spins and for jumps from the back inside edge.
