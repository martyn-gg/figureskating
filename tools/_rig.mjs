/* Resolve paths relative to the repository, never to whoever's machine wrote the
   tool. Every checker takes an optional path argument so it can be pointed at a
   work-in-progress copy. */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const rigPath = (argv = process.argv) =>
  resolve(ROOT, argv[2] ?? 'prototypes/body-frame.html');

/* Playwright is not a dependency of the site — the browser download is far too
   heavy to inflict on anyone who only wants to build pages. Screenshot tools ask
   for it politely instead of exploding. */
export async function browser() {
  let pw;
  try { pw = await import('playwright'); }
  catch {
    console.error('This tool needs Playwright, which is not installed by default:\n' +
      '  npm install --no-save playwright && npx playwright install chromium\n');
    process.exit(2);
  }
  const exe = process.env.CHROMIUM_PATH;         // set in sandboxes with a preinstalled build
  return (pw.chromium ?? pw.default.chromium).launch(exe ? { executablePath: exe } : {});
}
