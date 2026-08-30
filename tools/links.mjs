/* Every internal href in dist/ must resolve to a file that exists. A wrong base
   path or a renamed slug produces links that build cleanly and 404 in the rink. */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { stripBase } from './_rig.mjs';

const DIST = resolve(process.argv[2] || 'dist');
const walk = async d => (await Promise.all((await readdir(d, { withFileTypes: true })).map(e =>
  e.isDirectory() ? walk(join(d, e.name)) : join(d, e.name)))).flat();

const exists = async p => { try { await stat(p); return true; } catch { return false; } };
const files = await walk(DIST);
const pages = files.filter(f => f.endsWith('.html'));
let bad = 0, checked = 0;

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    const href = m[1];
    if (/^\/\//.test(href)) continue;
    checked++;
    const rel = stripBase(href);
    const candidates = href.endsWith('/')
      ? [join(DIST, rel, 'index.html')]
      : [join(DIST, rel), join(DIST, rel, 'index.html'), join(DIST, rel + '.html')];
    if (!(await Promise.all(candidates.map(exists))).some(Boolean)) {
      console.log(`  BROKEN  ${href}\n          in ${page.replace(DIST + '/', '')}`);
      bad++;
    }
  }
}
console.log(bad ? `\n${bad} broken of ${checked} internal links` : `all ${checked} internal links resolve`);
process.exit(bad ? 1 : 0);
