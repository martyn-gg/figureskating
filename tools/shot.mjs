import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js'; const { chromium } = pw;
const [,, frac='0.02', out='/tmp/shot.png'] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport:{width:1240,height:1400}, deviceScaleFactor:2 });
await p.emulateMedia({ colorScheme:'light' });
await p.goto('file:///home/claude/body-frame.html');
await p.waitForTimeout(400);
await p.evaluate(() => document.getElementById('play').click());   // pause
await p.evaluate(f => { const s=document.getElementById('scrub');
  s.value = Math.round(Number(s.max)*f); s.dispatchEvent(new Event('input')); }, Number(frac));
await p.waitForTimeout(200);
await p.locator('#views').screenshot({ path: out });
console.log('phase:', await p.locator('#phase').textContent());
await b.close();
