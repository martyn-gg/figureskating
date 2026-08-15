import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const file = process.argv[2] || './prototypes/body-frame.html';
const move = process.argv[3] || 'Waltz jump';
const out  = process.argv[4] || '/tmp/sheet';
const times = (process.argv[5] || '0,0.14,0.25,0.30,0.32,0.36,0.39,0.42,0.44,0.48,0.55,0.70,0.86,1.0').split(',').map(Number);

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport:{width:1000,height:1500}, deviceScaleFactor:2 });
await p.emulateMedia({ colorScheme:'light' });
await p.goto('file://'+file);
await p.waitForTimeout(350);
await p.evaluate(m => {
  for(const btn of document.getElementById('moveSeg').children) if(btn.textContent===m) btn.click();
  document.getElementById('play').click();
  document.getElementById('vTop').checked = false;
  document.getElementById('vTop').dispatchEvent(new Event('change'));
}, move);
await p.waitForTimeout(250);
for(let i=0;i<times.length;i++){
  await p.evaluate(f => { const s=document.getElementById('scrub');
    s.value=Math.round(Number(s.max)*f); s.dispatchEvent(new Event('input')); }, times[i]);
  await p.waitForTimeout(90);
  const ph = await p.locator('#phase').textContent();
  await p.locator('.pair .card').first().screenshot({ path:`${out}_${String(i).padStart(2,'0')}.png` });
  console.log(String(times[i]).padEnd(5), ph);
}
await b.close();
