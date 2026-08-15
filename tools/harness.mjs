import fs from 'fs';
import { rigPath } from './_rig.mjs';
const src = fs.readFileSync(rigPath(),'utf8')
  .match(/<script type="module">([\s\S]*?)<\/script>/)[1];

let created = 0;
const mk = (tag) => {
  created++;
  const n = {
    tagName: tag, children: [], attrs: {}, style: {}, _text: '',
    setAttribute(k,v){ if(v===undefined||v===null||(typeof v==='number'&&!isFinite(v)))
                         throw new Error(`bad attribute ${tag}.${k} = ${v}`);
                       this.attrs[k]=String(v); },
    getAttribute(k){ return this.attrs[k]; },
    appendChild(c){ this.children.push(c); return c; },
    append(...c){ this.children.push(...c); },
    set textContent(v){ this._text=v; this.children.length=0; },
    get textContent(){ return this._text; },
    set innerHTML(v){ this._html=v; }, get innerHTML(){ return this._html||''; },
    classList:{add(){},remove(){}},
  };
  return n;
};
const registry = {};
globalThis.document = {
  createElementNS:(ns,t)=>mk(t), createElement:(t)=>mk(t),
  getElementById:(id)=> registry[id] || (registry[id]=Object.assign(mk('el'),{value:0,max:0,checked:true})),
};
globalThis.performance = { now: () => 0 };
let frames = 0;
globalThis.requestAnimationFrame = (fn) => { if(frames++ < 3) queueMicrotask(()=>fn(frames*16)); };

const AsyncFn = Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFn(src.replace(/^export /gm,''))();

console.log('module evaluated, no throw');
console.log('svg nodes created on first paint:', created);

// exercise every move × every view × every scrub position
const seg = registry['moveSeg'];
const moves = seg.children.map(b=>b.textContent);
console.log('moves found:', moves.join(', '));
for(let i=0;i<moves.length;i++){
  seg.children[i].onclick();
  const scrub = registry['scrub'];
  const max = Number(scrub.max);
  for(let k=0;k<=20;k++){ scrub.value = Math.round(max*k/20); scrub.oninput({target:scrub}); }
  console.log(`  ${moves[i].padEnd(12)} scrubbed ${max+1} frames · twist ${registry['twistN'].textContent} · "${registry['phase'].textContent}"`);
}
// toggle every view and marker off and on
for(const id of ['vTop','vSide','vRear','mHip','mSh','mFree','mArm']){
  const el = registry[id];
  el.onchange({target:{checked:false}}); el.onchange({target:{checked:true}});
}
console.log('all view and marker toggles exercised cleanly');
