/* The manifest was a static file in public/ with `start_url: "."`, which worked by
   accident and named no icons at all — so an installed copy got whatever the
   operating system chose to screenshot. It is generated now, for the same reason
   search.json is: every path in it has to agree with the base path, and a file in
   public/ cannot see the base path.

   The icons themselves come from tools/icons.mjs, which draws them from the site
   palette. Run that after changing a colour, not this. */
import { url } from '../lib/url.js';

const icon = (src, sizes, purpose) => ({
  src: url(src), sizes, type: 'image/png', ...(purpose ? { purpose } : {}),
});

export function GET() {
  return new Response(JSON.stringify({
    name: 'Field Guide to Figure Skating',
    short_name: 'Skating Guide',
    id: url(),
    start_url: url(),
    scope: url(),
    display: 'standalone',
    background_color: '#f2f7fb',
    theme_color: '#12303f',
    description: 'Edges, turns, jumps and the national tests they appear in.',
    icons: [
      icon('icon-192.png', '192x192'),
      icon('icon-512.png', '512x512'),
      /* Android crops a maskable icon to whatever shape the launcher uses, so this
         one carries the safe margin and the plain pair above do not. */
      icon('icon-maskable-512.png', '512x512', 'maskable'),
    ],
  }, null, 2), { headers: { 'content-type': 'application/manifest+json' } });
}
