---
name: "Example: how a test is recorded"
governingBody: BIS
discipline: skills
level: 0
elements: [lfo-three, rbo-rocker, spiral]
sourceUrl: https://www.iceskating.org.uk/test-information
verified: { checked: false }
---

**This is a structural example.** The element list above is made up to show the shape of the
data, and no governing body's requirements are transcribed on this page.

A test is an ordered list of references to elements. The elements themselves live once in
their own collection and know nothing about tests, which is what lets the same three turn
appear in a British, a Canadian and an American test without being written three times. It
is also what lets each element page list every test it appears in, in every country, for
free.

Real syllabus entries get transcribed from the governing body's published material, with
`sourceUrl` pointing at it and `verified.checked` set only once someone has confirmed it
against the current version.
