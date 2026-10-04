/* THE NOTEBOOK LOOK — 03/10/2026.

   The guide as a skater's own well-kept notebook: ruled paper, a red margin, the
   stick figures taped in on white cards, headings in handwriting with a
   highlighter through them, the unverified warning on a sticky note, and index
   tabs down the right edge. Martyn's reasoning for making it the default: the
   figures are stick figures, which already read as drawn by hand, so the page
   round them can be friendlier without redrawing anything.

   Every rule here is scoped under NB, so `data-theme="formal"` on the root turns
   the whole lot off and the textbook styles in Base.astro show through untouched.
   Kept in a module, and not in Base's style block, because the scope prefix would
   otherwise be pasted onto some sixty selectors by hand.

   Things deliberately left alone:
   - No rotation on anything that holds a stick figure or a tracing. The pixel
     checkers (ink, tracing, underice) measure those drawings, and a tilted card
     would move every pixel they look at. Chips and the sticky note tilt; cards
     do not.
   - Fonts are self-hosted in public/fonts. The service worker caches same-origin
     requests only, so a font from a CDN would vanish offline in the rink.
   - Every control keeps its 44 px target. The tabs are narrower than that to
     look at, so each one carries an invisible hit area reaching into the gutter. */

export const NB = ':root:not([data-theme="formal"])';

/* The six index tabs, in the order a skater meets them. `match` says which
   element kinds and which section pages light each one up. */
export const TABS = [
  { id: 'basic', label: 'Basics', href: 'elements/in/basic/',
    kinds: ['basic'], sections: ['basic'] },
  { id: 'edge', label: 'Edges', href: 'elements/in/edges/',
    kinds: ['edge'], sections: ['edges'] },
  { id: 'turn', label: 'Turns', href: 'elements/in/one-foot/',
    kinds: ['turn', 'twizzle', 'transition', 'combination', 'step', 'sequence'],
    sections: ['one-foot', 'two-foot', 'twizzles', 'transitions', 'clusters', 'step', 'sequence'] },
  { id: 'jump', label: 'Jumps', href: 'elements/in/jump/',
    kinds: ['jump', 'combo'], sections: ['jump', 'combo'] },
  { id: 'spin', label: 'Spins', href: 'elements/in/spin/',
    kinds: ['spin', 'position'], sections: ['spin', 'position'] },
  /* DANCE — 03/10/2026, Martyn: a section for dance, to hold the pattern dances. */
  { id: 'dance', label: 'Dance', href: 'elements/in/dance/',
    kinds: ['hold', 'dance'], sections: ['hold', 'dance'] },
  /* OFF THE ICE — 04/10/2026, Martyn: off the ice is not kit, so it gets its own tab,
     hyphenated so it cannot be misread as "Office".
     Its pages are found by path, like the grades. */
  { id: 'office', label: 'Off-ice', href: 'off-ice/', kinds: [], sections: [] },
  { id: 'grade', label: 'Grades', href: 'grades/', kinds: [], sections: [] },
];

/** Which tab a page belongs to: from the element's kind if the page passed one,
    otherwise from the path. Null for pages that sit outside the sections. */
export const tabFor = (pathname, kind) => {
  if (kind) return TABS.find(t => t.kinds.includes(kind))?.id ?? null;
  const sec = pathname.match(/\/elements\/in\/([a-z-]+)\/?$/)?.[1];
  if (sec) return TABS.find(t => t.sections.includes(sec))?.id ?? null;
  if (/\/(grades|tests)\//.test(pathname)) return 'grade';
  if (/\/off-ice\//.test(pathname)) return 'office';
  /* The first session is the floor below the basics, so it lights the Basics tab. */
  if (/\/first-session\//.test(pathname)) return 'basic';
  return null;
};

const FONTS = [
  ['Kalam', 400, 'normal', 'kalam-latin-400-normal'],
  ['Kalam', 700, 'normal', 'kalam-latin-700-normal'],
  ['Caveat', 500, 'normal', 'caveat-latin-500-normal'],
  ['Literata', 400, 'normal', 'literata-latin-400-normal'],
  ['Literata', 600, 'normal', 'literata-latin-600-normal'],
  ['Literata', 400, 'italic', 'literata-latin-400-italic'],
];

const HAND = "Caveat,'Bradley Hand','Segoe Print',cursive";
const HEAD = "Kalam,'Bradley Hand','Segoe Print',cursive";
const BOOK = "Literata,Georgia,'Times New Roman',serif";

/** The stylesheet. `fontBase` is the site's base URL, so the fonts resolve under
    whatever path the site is served from. */
export const notebookCSS = fontBase => {
  const faces = FONTS.map(([family, weight, style, file]) =>
    `@font-face{font-family:${family};font-weight:${weight};font-style:${style};` +
    `font-display:swap;src:url(${fontBase}fonts/${file}.woff2) format('woff2')}`).join('');

  /* Each rule is written once, against a bare selector list, and NB is put in
     front of every selector in the list. */
  const R = (sel, body) => sel.split(',').map(s => `${NB} ${s.trim()}`).join(',') + `{${body}}`;
  const tab = TABS.map(t => R(`.tabs a.t-${t.id}`, `background:var(--tab-${t.id})`)).join('');

  return faces + [
    /* The page: ruled paper, a margin line and three punched holes. The rules are
       28 px apart and the body runs at 28 px, so a paragraph sits on them. */
    R('body', `background-color:var(--paper);background-image:linear-gradient(var(--ruling) 1px,transparent 1px);
      background-size:100% 28px;background-position:0 27px;font:17px/28px ${BOOK}`),
    R('.wrap', 'position:relative;padding-left:2.9rem;padding-right:2.6rem'),
    R('.wrap::before', `content:"";position:absolute;left:2rem;top:0;bottom:0;width:2px;background:var(--margin)`),
    R('.wrap::after', `content:"";position:absolute;left:.45rem;top:5rem;bottom:2rem;width:14px;pointer-events:none;
      background:radial-gradient(circle at 7px 7px,var(--hole) 6px,transparent 7px) 0 0/14px 18rem repeat-y`),

    /* Type. Headings in Kalam with a highlighter stroke through the lower half
       of each line; asides in Caveat; reading text in Literata. */
    R('h1,h2,h3,nav,.meta,footer', `font-family:${BOOK}`),
    R('h1', `font-family:${HEAD};font-weight:700;font-size:2.1rem;line-height:2.75rem;letter-spacing:0;
      width:fit-content;max-width:100%;margin:0 0 .35rem;
      background:linear-gradient(transparent 58%,var(--highlight) 58%,var(--highlight) 88%,transparent 88%) 0 0/100% 2.75rem`),
    R('h2', `font-family:${HEAD};font-weight:700;font-size:1.35rem;line-height:28px;letter-spacing:0;
      text-transform:none;color:var(--ink);margin:2.4rem 0 .5rem`),
    R('.lede', 'font-style:italic;color:var(--ink-soft);font-size:1.02rem'),
    R('.aka', `font-family:${HAND};font-size:1.35rem;line-height:1.35;margin:-.9rem 0 1.4rem`),
    R('.aka b', 'font-weight:500'),

    /* The nav row, in handwriting, with the scheme switch drawn in pencil. */
    R('nav', `font-family:${HAND};font-size:1.22rem;border-bottom:1px dashed var(--ice-line);gap:0 .85rem`),
    R('nav .scheme,nav .country summary', 'padding:.5rem .7rem'),
    R('nav .scheme,.theme,nav .country summary', `border:1.5px solid var(--ink);color:var(--ink);font-family:${HEAD};font-size:.95rem`),
    R('nav .country ul', 'border-radius:2px;border-color:var(--rule);box-shadow:2px 3px 8px rgba(0,0,0,.14)'),

    /* Chips as little paper labels, tilted a degree or two either way. */
    R('.chip', `font-family:${HEAD};font-size:.92rem;background:var(--ice);border:1px solid var(--rule);
      border-radius:2px;padding:.05rem .6rem;box-shadow:1px 1px 0 rgba(0,0,0,.08);transform:rotate(-1.5deg)`),
    R('.chip:nth-child(even)', 'transform:rotate(1.2deg)'),

    /* The unverified warning, on a sticky note with a strip of tape. */
    R('.unverified', `position:relative;background:var(--sticky);color:var(--sticky-ink);border:0;border-radius:0;
      font-family:${HAND};font-size:1.3rem;line-height:1.3;padding:1rem 1.1rem .85rem;margin:1.4rem .4rem 2rem 0;
      transform:rotate(-1.2deg);box-shadow:2px 3px 6px rgba(0,0,0,.16)`),
    R('.unverified::before', `content:"";position:absolute;top:-10px;left:50%;margin-left:-36px;width:72px;height:19px;
      background:var(--tape);transform:rotate(2deg)`),
    R('.unverified b', 'color:var(--warn)'),

    /* The drawings, taped in on white cards. No rotation: see the note at the top. */
    R('.bf-card,.jumptrace', `position:relative;overflow:visible;background:var(--ice);border:1px solid var(--rule);
      border-radius:2px;box-shadow:1px 2px 5px rgba(0,0,0,.1)`),
    R('.bf-card::before,.jumptrace::before', `content:"";position:absolute;top:-9px;left:-10px;width:58px;height:17px;
      background:var(--tape);transform:rotate(-24deg);pointer-events:none`),
    R('.bf-card::after,.jumptrace::after', `content:"";position:absolute;top:-9px;right:-10px;width:58px;height:17px;
      background:var(--tape);transform:rotate(24deg);pointer-events:none`),
    R('.bf-views', 'gap:1.4rem'),
    R('.bf-card .bf-h', `font-family:${HAND};font-size:1.15rem;font-weight:500;letter-spacing:0;text-transform:none;
      border-bottom:1px dashed var(--rule)`),
    R('.bf-card .bf-h span', 'color:var(--ink)'),
    R('.bf-ctl', 'background:none;border:0;padding:.5rem 0'),
    R('.bf-ctl button', `background:none;border:1.5px solid var(--ink);font-family:${HEAD}`),
    R('.bf-phase,.bf figcaption,.jumptrace figcaption,.jt-pair span', `font-family:${HAND};font-size:1.15rem;line-height:1.3`),
    R('.derived', 'background:none;border:1.5px dashed var(--ice-line);border-radius:4px'),
    /* The front page's eight edges: small cards, the code in Kalam and the name in
       Caveat. Not rotated, like every card that holds a drawing. The page's own
       scoped rules carry the same weight as these, so each selector here has one
       part more to win. */
    R('.edge-grid a[href]', 'border:1px solid var(--rule);border-radius:2px;box-shadow:1px 2px 4px rgba(0,0,0,.1)'),
    R('.edge-grid a b', `font-family:${HEAD};font-weight:700;letter-spacing:.03em`),
    R('.edge-grid a span', `font-family:${HAND};font-size:1.05rem;line-height:1.15`),
    R('.mygrades', 'background:var(--paper)'),
    R('.mygrades p.mg-head', `font-family:${HEAD};font-weight:700`),

    /* Lists of links read as a handwritten index. */
    R('ul.plain li', 'border-bottom:1px dashed var(--rule)'),
    R('ul.plain span', `font-family:${BOOK};font-size:.95rem`),

    R('footer', `font-family:${BOOK};font-size:.9rem;border-top:1px dashed var(--ice-line)`),

    /* The index tabs down the right edge. Shown only in the notebook. */
    R('.tabs', 'display:flex'),
    R('.tabs a', `position:relative;display:flex;align-items:center;justify-content:center;width:26px;min-height:64px;
      writing-mode:vertical-rl;color:var(--tab-ink);text-decoration:none;font-family:${HEAD};font-size:.85rem;
      line-height:1.2;
      border-radius:6px 0 0 6px`),
    R('.tabs a::before', 'content:"";position:absolute;inset:0 0 0 -18px'),
    R('.tabs a[aria-current]', 'width:32px;font-weight:700;box-shadow:-1px 1px 3px rgba(0,0,0,.18)'),
    tab,
  ].join('');
};
