# Scheme switch — two files

Overwrite these two in the repo:

    src/lib/tokens.js       -> src/lib/tokens.js
    src/layouts/Base.astro  -> src/layouts/Base.astro

Everything else from the earlier package is already applied in your repo
(palette, tools/contrast.mjs, the check:contrast script).

What changes:

- tokenCSS() emits three blocks instead of two. The media query is scoped to
  :root:not([data-scheme="light"]) and an explicit [data-scheme="dark"] block
  comes last, so an override wins in either direction.
- Base.astro gains a synchronous inline script that reads localStorage.scheme
  before first paint, a 44 px pill button at the end of the nav row, and the
  script that labels it with the scheme it switches TO.

Then: npm run check:contrast (unaffected by this change, but it confirms the
tokens module still parses), and npm run dev to review light.

Still outstanding, unchanged by this: the hand edits to
src/pages/elements/index.astro (grid lines -> var(--grid-line), cells 32 -> 44 px),
listed as diffs in the package README.
