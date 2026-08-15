/* One identifier per build, evaluated once because this module is evaluated once.
   Computing it in a page's frontmatter instead would give every page a slightly
   different value, and the pages would then fight over which service worker is
   current.

   It names the service worker's cache, so a deploy retires the previous cache
   rather than adding to it. The cost is that a deploy makes every reader
   re-download on their next visit; the alternative is readers pinned to whatever
   they saw first, which is worse for a guide that expects to be corrected. */
export const BUILD_ID = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
