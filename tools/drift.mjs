/* House tics, which are invisible while writing and obvious in a list.

   Prose written in one sitting grows repeated phrasing. Session 08 wrote forty-eight
   exercise paragraphs and found it by hand; this is that check, so it does not have to be
   reinvented after the next batch. Three scans, because the first one alone caught about a
   third of it:

   1  N-GRAMS OVER THE BODIES. 5-grams appearing in three or more files, 7-grams in two or
      more.

   2  N-GRAMS OVER THE `summary:` LINES ALONE. The worst offenders, and the body scan never
      sees them: nine of forty-five summaries had used "run straight into", and the two
      bracket exercises had summaries identical but for one word — in a list, where a
      summary's whole job is to distinguish.

   3  THE FIRST THREE WORDS OF EVERY PARAGRAPH. "The second side" opened six of them.

   THE UNIT IS THE PASSAGE, NOT THE FILE. The derived tier keys its prose on direction and
   edge and never on the foot, so one passage is deliberately written into four or eight
   element files — a left forward outside bracket and a right one are mirror images and take
   the same words. Counting files would report every derived passage in the repository as a
   tic. So identical bodies are collapsed to one before anything is counted, and the report
   names the group.

   REPORTS, IT DOES NOT FAIL. Repetition is not automatically a fault: technical phrasing
   repeats because the elements repeat, and four October entries opening "New on 01/10/2026"
   is deliberate. Judgement is required, which is why this is not in `npm run check`.

   Rewrite the weaker instance, never the accurate one, and RE-RUN AFTER EVERY PASS: fixing
   tics introduces new ones, and "rotates with the lobe" reached three files that way.

       node tools/drift.mjs                 # everything under src/data
       node tools/drift.mjs elements        # one collection
       node tools/drift.mjs --since 30      # only files changed in the last 30 minutes
*/
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './_rig.mjs';

const args = process.argv.slice(2);
const si = args.indexOf('--since');
const sinceMin = si === -1 ? null : Number(args[si + 1]);
const only = args.filter(a => !a.startsWith('--') && a !== String(sinceMin));
const DATA = join(ROOT, 'src/data');

const dirs = (only.length ? only : readdirSync(DATA))
  .filter(d => { try { return statSync(join(DATA, d)).isDirectory(); } catch { return false; } });

const files = [];
for (const d of dirs)
  for (const f of readdirSync(join(DATA, d)).filter(f => f.endsWith('.md'))) {
    const p = join(DATA, d, f);
    if (sinceMin && (Date.now() - statSync(p).mtimeMs) / 60000 > sinceMin) continue;
    const raw = readFileSync(p, 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    files.push({
      id: `${d}/${f.replace(/\.md$/, '')}`,
      summary: (/^summary:\s*(.+)$/m.exec(m ? m[1] : '') || [])[1]?.trim() ?? '',
      body: (m ? m[2] : raw),
    });
  }

/* URLs are not prose. A markdown link keeps its text and loses its target, or three pages
   citing one source read as three pages using one phrase. */
const prose = s => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, ' ');
const words = s => prose(s).toLowerCase().replace(/[^a-z0-9½'\s-]/g, ' ').split(/\s+/).filter(Boolean);

/* Collapse files that share a body to one entry. The generator writes the same passage to
   every foot it serves, so without this the derived tier reports itself. The label keeps
   the group legible: `lfo-triple-three +3` rather than four ids that say the same thing. */
const byBody = new Map();
for (const f of files) {
  const k = f.body.trim();
  if (!byBody.has(k)) byBody.set(k, []);
  byBody.get(k).push(f);
}
const passages = [...byBody.values()].map(g => ({
  id: g.length === 1 ? g[0].id : `${g[0].id} +${g.length - 1}`,
  summary: g.map(f => f.summary).join(' \u0000 '),
  body: g[0].body,
}));

/* An n-gram index: phrase -> the set of files it appears in. Counted per file rather than
   per occurrence, because the same phrase twice on one page is a style choice and the same
   phrase on three pages is a tic. */
function grams(pick, n) {
  const idx = new Map();
  for (const f of passages) {
    const w = words(pick(f));
    for (let i = 0; i + n <= w.length; i++) {
      const g = w.slice(i, i + n).join(' ');
      if (!idx.has(g)) idx.set(g, new Set());
      idx.get(g).add(f.id);
    }
  }
  return idx;
}

let flagged = 0;
const report = (title, idx, min) => {
  const hits = [...idx].filter(([, s]) => s.size >= min)
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  /* A longer phrase contains shorter ones with the same reach; report the longest only. */
  const kept = hits.filter(([g, s]) =>
    !hits.some(([h, t]) => h !== g && h.includes(g) && t.size >= s.size));
  console.log(`\n${title} — ${kept.length}`);
  for (const [g, s] of kept.slice(0, 25)) {
    flagged++;
    console.log(`  ${String(s.size).padStart(2)}x  "${g}"`);
    console.log(`        ${[...s].sort().join(', ')}`);
  }
  if (kept.length > 25) console.log(`  … and ${kept.length - 25} more`);
};

console.log(`prose drift over ${files.length} files, ${passages.length} distinct passages` +
  `${sinceMin ? `, changed in the last ${sinceMin} min` : ''}`);

report('5-grams in 3+ bodies', grams(f => f.body, 5), 3);
report('7-grams in 2+ bodies', grams(f => f.body, 7), 2);
/* Summaries are NOT shared: the generator writes a distinct one per foot, and a summary's
   whole job is to distinguish. So they are scanned per file, with the derived skeleton —
   the edge codes — masked out, or every summary in a family matches every other. */
{
  const idx = new Map();
  for (const f of files) {
    const w = words(f.summary.replace(/\b[LR][FB][OI]\b/g, ' '));
    for (let i = 0; i + 4 <= w.length; i++) {
      const g = w.slice(i, i + 4).join(' ');
      if (!idx.has(g)) idx.set(g, new Set());
      idx.get(g).add(f.id);
    }
  }
  report('4-grams in 2+ summaries, edge codes masked', idx, 2);
}

/* 3 — how paragraphs open. */
const opens = new Map();
for (const f of passages)
  for (const para of f.body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)) {
    const o = words(para).slice(0, 3).join(' ');
    if (!o) continue;
    if (!opens.has(o)) opens.set(o, []);
    opens.get(o).push(f.id);
  }
const rep = [...opens].filter(([, v]) => v.length >= 3).sort((a, b) => b[1].length - a[1].length);
console.log(`\nparagraph openings used 3+ times — ${rep.length}`);
for (const [o, v] of rep.slice(0, 20)) {
  flagged++;
  console.log(`  ${String(v.length).padStart(2)}x  "${o}…"   ${[...new Set(v)].sort().slice(0, 6).join(', ')}${v.length > 6 ? ' …' : ''}`);
}

console.log(flagged
  ? `\n${flagged} phrases to look at. Rewrite the weaker instance, never the accurate one, and re-run.`
  : '\nnothing repeating above the thresholds');
