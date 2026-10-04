/* ACCESSIBILITY, AS AXE-CORE SEES IT — 03/10/2026, Martyn: is it accessibility
   compliant?

   Runs axe-core (WCAG 2.0, 2.1 and 2.2 at A and AA, plus its best-practice rules)
   on a spread of built pages, each in both schemes and both looks, and fails on
   any violation. The first run found no main landmark on any page, a skipped
   heading level under every rig, and three colours too faint to read; those are
   fixed and this keeps them fixed.

   WHAT THIS CANNOT SAY. An automated audit finds roughly a third of what a WCAG
   audit would: it can measure a contrast ratio and find a missing label, and it
   cannot tell whether a label says anything useful, whether the keyboard order
   makes sense, or whether a screen reader user can follow a moving diagram. A
   pass here is "no machine-detectable failures" and nothing more.

   Needs Playwright and axe-core, neither of them a dependency, so it is not in
   `npm run check` or in CI:  npm install --no-save playwright axe-core

       node tools/a11y.mjs
*/
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { browser, serveDist } from './_rig.mjs';

/* Like Playwright, axe-core is not a dependency of the site: asked for, not assumed. */
let AXE;
try { AXE = readFileSync(join(dirname(createRequire(import.meta.url).resolve('axe-core')), 'axe.min.js'), 'utf8'); }
catch {
  console.error('This tool needs axe-core, which is not installed by default:\n  npm install --no-save axe-core\n');
  process.exit(2);
}
const PAGES = ['', 'about/', 'coaches/', 'elements/', 'elements/in/edges/', 'elements/in/dance/', 'elements/in/hold/',
  'elements/lfo/', 'elements/lfo-three/', 'elements/waltz-jump/', 'elements/dutch-waltz/', 'elements/westminster-waltz/',
  'elements/kilian-hold/', 'elements/forward-stroking/', 'grades/', 'uk/grades/', 'grades/bis-ice-dance/', 'tests/',
  'tests/bis-skills-1/', 'search/', 'rig/', 'uk/', 'elements/other-names/',
  /* Kit and off the ice, 04/10/2026: both figures, a hub, an entry, and an element page
     carrying the new combination figure and the Off the ice list. */
  'kit/', 'kit/blade/', 'kit/boots/', 'kit/care/', 'off-ice/', 'off-ice/holding-the-landing/',
  'elements/in/combo/', 'elements/salchow-loop/'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const srv = await serveDist(); const b = await browser();
const tally = new Map(); let views = 0;
for (const scheme of ['light', 'dark']) for (const theme of ['notebook', 'formal']) {
  const page = await b.newPage({ viewport: { width: 414, height: 900 }, colorScheme: scheme });
  await page.addInitScript(([s, t]) => { try {
    localStorage.setItem('scheme', s); if (t === 'formal') localStorage.setItem('theme', 'formal');
  } catch (e) {} }, [scheme, theme]);
  for (const p of PAGES) {
    await page.goto(`${srv.origin}/${p}`, { waitUntil: 'load' });
    await page.addScriptTag({ content: AXE });
    const found = await page.evaluate(async tags => (await axe.run(document, { runOnly: { type: 'tag', values: tags } }))
      .violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => n.target.join(' ')) })), TAGS);
    views++;
    for (const v of found) {
      const k = `${v.id} (${v.impact}): ${v.help}`;
      if (!tally.has(k)) tally.set(k, []);
      tally.get(k).push(`${scheme}/${theme} /${p}  ${v.nodes.slice(0, 2).join(', ')}`);
    }
  }
  await page.close();
}
await b.close(); srv.close();
for (const [k, where] of tally) { console.log(`  x ${k}`); for (const w of where.slice(0, 4)) console.log(`      ${w}`); }
console.log(tally.size
  ? `\n${tally.size} kind${tally.size === 1 ? '' : 's'} of violation across ${views} page views`
  : `${PAGES.length} pages x 2 schemes x 2 looks = ${views} page views, no violations of WCAG 2.2 A or AA or of axe-core's best practice`);
process.exit(tally.size ? 1 : 0);
