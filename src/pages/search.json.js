/* The search index, built once at build time and small enough to hold in a pocket.

   No server and no search service: this is a static site read on rink wi-fi, so
   search has to be a file the browser already has. Roughly three hundred records
   of five short fields comes out under 60 KB and the service worker caches it with
   everything else, which means search keeps working with the signal gone — the one
   thing a reference guide in a cold rink actually has to do.

   The fields are chosen for how a skater types, not for completeness:

     t  the name
     a  the OTHER names it goes by, which is the whole reason this exists — a page
        filed under a word the reader has never heard is a page they cannot find
     e  the edge code, LFO and the rest, because that is what gets typed
     s  the summary, so a description matches when a name does not
     k  the kind, so "jump" or "twizzle" narrows

   Nothing here is authored. It is read out of the collections, so a page cannot
   exist and be unsearchable, and tools/links.mjs asserts the count against the
   number of pages built. */
import { getCollection } from 'astro:content';
import { label } from '../lib/skating.js';
import { elementGroups, SECTION_NOTE } from '../lib/element-groups.js';

export async function GET() {
  const [elements, exercises, tests] = await Promise.all(
    ['elements', 'exercises', 'tests'].map(c => getCollection(c)));

  const testName = id => tests.find(t => t.id === id)?.data.name ?? id;

  const docs = [
    /* THE SECTION PAGES — 19/09/2026. The elements page became a hub and its nine
       sections became pages, and the moment they existed the search checker said
       they could not be found, which is the assertion doing precisely its job.
       They are worth a record on their own terms: "twizzles" and "basics" are what
       a skater types, and landing on the list of them is a better answer than
       landing on one of them. Derived from SECTIONS like everything else, so a kind
       added tomorrow is searchable without anyone remembering. */
    ...elementGroups(elements).SECTIONS.map(sec => ({
      u: `elements/in/${sec.id}/`, t: sec.label, s: SECTION_NOTE[sec.id] ?? '',
      k: 'section', a: [], e: '',
    })),
    ...elements.map(e => ({
      u: `elements/${e.id}/`, t: e.data.name, s: e.data.summary, k: e.data.kind,
      a: e.data.aliases ?? [], e: e.data.entry ? label(e.data.entry) : '',
    })),
    ...exercises.map(x => ({
      u: `exercises/${x.id}/`,
      /* The unit word comes from the entry, exactly as the exercise page's own
         title does — Skills 8 is three sections and calling them exercises here
         would make search disagree with the page it links to. */
      t: `${testName(x.data.test.id)} · ${x.data.unit === 'section' ? 'Section ' : 'exercise '}${x.data.order}` +
         `${/^section/i.test(x.data.name) ? '' : ` — ${x.data.name}`}`,
      s: x.data.summary, k: 'exercise', a: [], e: '',
    })),
    ...tests.map(t => ({
      u: `tests/${t.id}/`, t: t.data.name,
      s: `${t.data.governingBody} · ${t.data.discipline}, level ${t.data.level}`,
      k: 'test', a: [], e: '',
    })),
  ];

  return new Response(JSON.stringify(docs), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
