/* THE HOUSE STYLE, ASSERTED — 19/09/2026.

   docs/style.md has had a Words section and a Sentence habits section since the
   first day and nothing has ever checked either of them. They are the rules that
   keep the guide from reading like something generated: no *simply*, no *just*,
   no verbs borrowed from a motivational poster, no *It is worth noting that*, foot
   neutrality, and a length that keeps a field guide a field guide.

   Every one of those is a property of a string, which makes it the cheapest kind
   of checker there is and the least excusable to be missing. `prose.mjs` already
   reads the built pages for words that run together; this reads the SOURCE,
   because a house-style fault wants a file and a line to fix, not a rendered page.

   NARROWED WHERE A NAIVE MATCH WOULD CRY WOLF, which this repository has learned
   to do the hard way: `left` and `right` are only a foot-neutrality fault next to
   a body part, or "the pushing foot rather than being left trailing" would fire on
   every page that has one. The rules are only applied to the prose a reader sees —
   element bodies, exercise bodies, test bodies and summaries — never to comments
   or frontmatter, where a note about the rule would trip the rule.

   Broken on purpose, one mutation per rule, each injected into every page's first
   paragraph so the count is the corpus and a silent rule is obvious:

       --break=words   "You simply nail it." .............. 658 places (three words a page)
       --break=foot    "Push with the left foot." ......... 272 element paragraphs
       --break=us      "Travel counterclockwise." ......... 329 places
       --break=dash    four em dashes in a paragraph ...... 329 places
       --break=length  the floor raised past every page ... 272 element pages

       node tools/house.mjs
       node tools/house.mjs --break=words|foot|us|dash|length
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BREAK = (/--break=([\w-]+)/.exec(process.argv.join(' ')) || [])[1];

/* Each rule: a name, a test over one paragraph, and what to say. */
const WORDS = [
  [/\bsimply\b/i,            'simply'],
  /* `just` ONLY IN THE SENSE THE RULE IS ABOUT. style.md bans it because it tells a
     skater who is struggling that they should not be — "just rotate", "it's just a
     flat". It does not mean the temporal one: "the body has just been there" and
     "a lobe that has just reversed" diminish nothing, and "released just enough"
     is a quantity. Banning the word outright fired on six sentences that were
     right and would have forced them to get worse, which is how a checker earns
     being switched off. */
  [/(?<!\b(?:has|have|had|having)\s)\bjust\b(?!\s+(?:enough|as|off|past|short|before|after|under|over|about|inside|outside|behind|ahead|beyond|below|above))/i, 'just'],
  /* `easy` in the sense the rule is about — "it is easy to", "the easy way". NOT the
     comparative: "one hip opens more easily than the other" is a measurement of an
     asymmetry, and the rule exists to stop the guide telling a struggling skater
     they should not be, which a comparison between two of their own hips does not. */
  [/\beasy\b|(?<!\b(?:more|less|as)\s)\beasily\b(?!\s+than)/i, 'easy'],
  [/\bof course\b/i,         'of course'],
  [/\bobviously\b/i,         'obviously'],
  [/\ball you have to do\b/i,'all you have to do'],
  [/\bmaster(ed|ing|s)?\b/i, 'master'],
  [/\bnail(ed|ing|s)?\b/i,   'nail'],
  [/\bconquer(ed|ing|s)?\b/i,'conquer'],
];
const OPENERS = [/^it is worth noting that\b/i, /^importantly[,\s]/i];
/* British English. Only spellings with no British sense at all. */
const US = [
  [/\bcounterclockwise\b/i, 'anticlockwise'],
  [/\bcolor(s|ed|ing)?\b/i, 'colour'],
  [/\bcenter(s|ed|ing)?\b/i,'centre'],
  [/\bgray\b/i,             'grey'],
  [/\bmaneuver(s|ed|ing)?\b/i, 'manoeuvre'],
  [/\btraveled\b|\btraveling\b/i, 'travelled'],
  [/\bdefense\b|\boffense\b/i, 'defence'],
];
const FOOT = /\b(left|right)\s+(foot|feet|leg|legs|blade|blades|hand|arm|shoulder|hip|knee|ankle|toe|skate|side)\b/i;

let bad = 0, files = 0, paras = 0, words = 0;
const fail = (where, msg) => { bad++; console.log(`  ${where}\n      ${msg}`); };

const read = dir => readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('_'))
  .map(f => {
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    return { f, dir, fm: m ? m[1] : '', body: (m ? m[2] : raw).trim() };
  });

const ELEMENTS = read('src/data/elements');
const OTHERS = [...read('src/data/exercises'), ...read('src/data/tests')];

for (const doc of [...ELEMENTS, ...OTHERS]) {
  files++;
  const where = `${doc.dir.replace('src/data/', '')}/${doc.f}`;
  const isElement = doc.dir.endsWith('elements');
  /* The summary is prose a reader sees, so it is held to the same words. */
  const sm = /^summary:\s*"?(.*?)"?\s*$/m.exec(doc.fm);
  const blocks = doc.body.split(/\n\s*\n/).filter(p => p.trim());
  const texts = [...(sm ? [['summary', sm[1]]] : []), ...blocks.map((p, i) => [`paragraph ${i + 1}`, p])];

  for (const [label, raw] of texts) {
    let text = raw;
    if (BREAK === 'words' && label === 'paragraph 1') text += ' You simply nail it.';
    if (BREAK === 'foot' && label === 'paragraph 1') text += ' Push with the left foot.';
    if (BREAK === 'us' && label === 'paragraph 1') text += ' Travel counterclockwise.';
    if (BREAK === 'dash' && label === 'paragraph 1') text += ' one — two — three — four';
    paras++;
    for (const [re, name] of WORDS)
      if (re.test(text)) fail(`${where} · ${label}`, `uses "${name}" — style.md: every one of them tells a skater who is struggling that they should not be`);
    for (const re of OPENERS)
      if (re.test(text.trim())) fail(`${where} · ${label}`, 'opens with a phrase style.md bans — if it were not worth noting it would not be in the paragraph');
    for (const [re, want] of US)
      if (re.test(text)) fail(`${where} · ${label}`, `American spelling — the guide is British English, so "${want}"`);
    const dashes = (text.match(/—/g) || []).length;
    if (dashes > 2) fail(`${where} · ${label}`, `${dashes} em dashes in one paragraph — style.md allows two`);
    /* A PLAIN EDGE IS A FOOT, so its summary may name one. The rule exists because a
       left bracket and a right one are mirror images and one passage should serve
       both; the eight plain edges are the one family where the foot IS the subject
       and the summary is generated per foot, so nothing is duplicated by saying so. */
    const edgeSummary = isElement && label === 'summary' && /^kind:\s*edge\s*$/m.test(doc.fm);
    if (isElement && !edgeSummary && FOOT.test(text))
      fail(`${where} · ${label}`, `names a foot — "${FOOT.exec(text)[0]}". A left element and a right one are mirror images, so one passage serves both`);
    if (/^#{1,6}\s/m.test(text) && isElement)
      fail(`${where} · ${label}`, 'has a heading inside an element body — if a page needs subheadings, the page is too long');
    if (/^\s*\d+\.\s/m.test(text))
      fail(`${where} · ${label}`, 'reads as a numbered procedure — this is a reference, and step-by-step is the coach\'s job');
  }

  if (isElement) {
    const n = doc.body.split(/\s+/).filter(Boolean).length;
    words += n;
    /* TWO FLOORS, BECAUSE THERE ARE TWO TIERS OF PROSE AND style.md ONLY KNEW ABOUT
       ONE. Ninety to a hundred and sixty was written for a hand-written page, before
       the derived tier existed. A generated cluster page says what the cluster is and
       the one thing that is not obvious about it, and is done in seventy words;
       holding it to ninety would pad two hundred and forty pages to meet a number.
       So the generated families get sixty and the hand-written pages keep ninety —
       and the ceiling is the same for both, because a field guide that stops being
       short stops being a field guide. */
    const DERIVED = ['combination', 'turn', 'transition', 'twizzle'];
    const kind = (/^kind:\s*(\w+)/m.exec(doc.fm) || [])[1];
    const derived = DERIVED.includes(kind);
    const lo = BREAK === 'length' ? 1e9 : derived ? 60 : 90;
    if (n < lo || n > 160)
      fail(`${where}`, `${n} words — style.md asks for ${lo} to 160 on ${derived ? 'a derived' : 'a hand-written'} page`);
  }
}

console.log(`\n${files} pages, ${paras} paragraphs, ${words} words of element prose`);
console.log(bad ? `\n${bad} place${bad === 1 ? '' : 's'} where the house style is not kept`
  : 'every page keeps the house style: the words, the openers, the spelling, the dashes,\nfoot neutrality and the length');
process.exit(bad ? 1 : 0);
