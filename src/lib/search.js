/* Ranking, as a pure function, so the page and the checker share one copy of it.

   It lived inside the search page's inline script for about twenty minutes, which
   put the one piece of logic here that has no other expression somewhere nothing
   could import and therefore nothing could test. Two copies of a fact is this
   repository's recurring failure; a fact with no test is the next one along.

   WHO IS TYPING. docs/style.md: a cold rink, a phone, gloves, one hand, a specific
   question, not browsing. So the ranking is built around the three things that
   actually get typed:

     an EDGE CODE, in full — LFO, rbi. Almost never ambiguous, so it outranks
       everything and outranks it by a lot.
     ANOTHER NAME for the movement — what a coach calls it. This is the whole
       reason aliases exist: a page filed under a word the reader has never heard
       is a page they cannot find.
     part of a NAME, then part of a description.

   Every token must hit something. A search for two words that returns pages
   matching one of them has stopped being a search. */

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One token against one record. The order of these lines is the ranking. */
export function score(d, tok) {
  const t = norm(d.t), s = norm(d.s), k = norm(d.k), e = norm(d.e);
  const a = (d.a || []).map(norm);
  const word = new RegExp('\\b' + esc(tok));
  if (e && e === tok) return 100;            // the edge code, typed in full
  if (a.some(x => x === tok)) return 80;     // another name for it, exactly
  if (t.startsWith(tok)) return 60;
  if (a.some(x => x.startsWith(tok))) return 55;
  if (word.test(t)) return 40;
  if (a.some(x => x.includes(tok))) return 35;
  if (t.includes(tok)) return 25;
  if (k.startsWith(tok)) return 14;          // "jump", "twizzle", "exercise"
  if (word.test(s)) return 12;
  if (s.includes(tok)) return 6;
  return 0;
}

/** Every record that matches every token, best first. */
export function rank(docs, query) {
  const toks = norm(query).split(/\s+/).filter(Boolean);
  if (!toks.length) return [];
  const out = [];
  for (const d of docs) {
    let total = 0;
    for (const tok of toks) {
      const sc = score(d, tok);
      if (!sc) { total = 0; break; }
      total += sc;
    }
    if (total) out.push({ score: total, doc: d });
  }
  /* On a tie, the SHORTER name wins. That is a real relevance signal and not a
     cosmetic one: "lfo three" scores the three turn and the choctaw-three-rocker
     identically, because both are on LFO and both contain the word, and the reader
     who typed two words wants the element those two words fully describe rather
     than the cluster that happens to contain it. Same effect puts the plain edge
     above the twizzle on it, and an element above the exercise that mentions it.
     Alphabetical last, so the order is total and the checker can rely on it. */
  return out.sort((x, y) =>
    y.score - x.score || x.doc.t.length - y.doc.t.length || x.doc.t.localeCompare(y.doc.t));
}
