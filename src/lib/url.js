/* Astro's BASE_URL has carried a trailing slash in some versions and not others,
   and `${base}elements/` silently produces /figureskatingelements/ when it does not.
   Nothing in the build objects, so join through here rather than by concatenation. */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');
export const url = (path = '') => `${BASE}/${String(path).replace(/^\/+/, '')}`;
