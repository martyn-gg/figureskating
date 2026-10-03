/* THE COUNTRY COPIES — 03/10/2026, Martyn: a country selector that tailors the
   pages to that country's conventions and lists, BUILT as real pages at /uk/,
   /us/, /au/ and /nz/, and a search that finds a move under any name while still
   honouring the country chosen. English-speaking countries only for now.

   The root copy stays, and is the guide for every country at once: nothing is
   taken away from a reader who has not chosen. A country copy differs in three
   ways and no others:

   1. An element is headed with that country's name for it, where the country's
      own programme names it differently (`names` in the element's frontmatter,
      held by tools/countries.mjs to be one of the element's aliases).
   2. "Appears in" leads with where the element sits in that country's grades.
   3. The front page, the grades hub and search put that country first.

   Which pages have copies is decided here and nowhere else. The ones that do not
   (tests, exercises, grade detail pages, the rig, about) are either one country's
   material already or the same for everyone, so a link to them from a country
   page goes to the single copy. */
import { url } from './url.js';

export const COUNTRIES = [
  { id: 'uk', code: 'UK', short: 'UK', adj: 'British', name: 'the UK', grades: 'UK', lang: 'en-GB',
    bodies: 'British Ice Skating' },
  { id: 'us', code: 'USA', short: 'USA', adj: 'American', name: 'the USA', grades: 'USA', lang: 'en-US',
    bodies: 'Learn to Skate USA and U.S. Figure Skating' },
  { id: 'au', code: 'AU', short: 'Australia', adj: 'Australian', name: 'Australia', grades: 'Australia', lang: 'en-AU',
    bodies: 'Ice Skating Australia' },
  { id: 'nz', code: 'NZ', short: 'New Zealand', adj: 'New Zealand', name: 'New Zealand', grades: 'New Zealand', lang: 'en-NZ',
    bodies: 'New Zealand Ice Figure Skating' },
];

export const CC = COUNTRIES.map(c => c.id);
export const countryOf = cc => COUNTRIES.find(c => c.id === cc) ?? null;

/** Every country copy plus the root, for getStaticPaths. `undefined` is the root,
    because a rest parameter that is undefined matches no path segment at all. */
export const COPIES = [undefined, ...CC];

const clean = p => String(p ?? '').replace(/^\/+/, '');

/** Whether a site path (no leading slash) has a copy in each country. */
export const localised = path => {
  const p = clean(path).replace(/[?#].*$/, '');
  return p === '' || p === 'search/' || p === 'grades/'
    || (p.startsWith('elements/') && !p.startsWith('elements/other-names'));
};

/** A link from a page in country `cc` (undefined for the root). Goes to the
    country copy when there is one and to the single copy when there is not. */
export const curl = (cc, path = '') =>
  cc && localised(path) ? url(`${cc}/${clean(path)}`) : url(path);

/** Splits a pathname into its country and the rest, both without the base. */
export const splitPath = pathname => {
  const base = url().replace(/\/$/, '');
  const p = clean(pathname.startsWith(base) ? pathname.slice(base.length) : pathname);
  const m = p.match(/^([a-z]{2})(\/|$)(.*)$/);
  return m && CC.includes(m[1]) ? { cc: m[1], rest: m[3] } : { cc: undefined, rest: p };
};

/** The name an element goes by in a country: its own programme's word where the
    element records one, the guide's name everywhere else. */
export const nameIn = (data, cc) => (cc && data.names?.[cc]) || data.name;
