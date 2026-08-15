import fs from 'fs';
const path='/home/claude/body-frame.html';
let html=fs.readFileSync(path,'utf8');
const grab=()=>{const st=html.indexOf('const MOVES = {'),en=html.indexOf('\n};',st)+3;
 const P=(t,n,z,pitch=0)=>({t,n,z,pitch});
 return new Function('P',html.slice(st,en).replace('const MOVES =','return')).call(null,P);};
const D2R=Math.PI/180,THIGH=44,SHIN=42,A=68*D2R,UP=15,BACK=5,LIMIT=28;
const ant=y=>[Math.cos(y*D2R),-Math.sin(y*D2R),0];
function tp(f,t,v){const c=f[0]*t[0]+f[1]*t[1]+f[2]*t[2];if(c>0.99999)return v.slice();
 const ax=[f[1]*t[2]-f[2]*t[1],f[2]*t[0]-f[0]*t[2],f[0]*t[1]-f[1]*t[0]],s=Math.hypot(...ax);
 if(s<1e-7)return v.map(c0=>-c0);const k=ax.map(a=>a/s),th=Math.atan2(s,c),ct=Math.cos(th),st=Math.sin(th);
 const kv=[k[1]*v[2]-k[2]*v[1],k[2]*v[0]-k[0]*v[2],k[0]*v[1]-k[1]*v[0]],kd=k[0]*v[0]+k[1]*v[1]+k[2]*v[2];
 return v.map((c0,i)=>c0*ct+kv[i]*st+k[i]*kd*(1-ct));}
function tb(r,t,L1,L2,face){const v=[t.t-r.t,t.n-r.n,t.z-r.z],d=Math.hypot(...v)||1e-6,u=v.map(c=>c/d);
 if(d>=L1+L2){const k=L1/(L1+L2)*d;return{t:r.t+u[0]*k,n:r.n+u[1]*k,z:r.z+u[2]*k};}
 const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));
 let K=tp([0,0,-1],u,face);const dt=K[0]*u[0]+K[1]*u[1]+K[2]*u[2];
 K=[K[0]-dt*u[0],K[1]-dt*u[1],K[2]-dt*u[2]];const kl=Math.hypot(...K)||1;K=K.map(c=>c/kl);
 return{t:r.t+a*u[0]+h*K[0],n:r.n+a*u[1]+h*K[1],z:r.z+a*u[2]+h*K[2]};}
// shin lean measured against the boot's own upright, since the boot is what limits it
function lean(key,q){
  const bd=[(key.dir==='F'?1:-1)*Math.cos((q.pitch||0)*D2R),0,-Math.sin((q.pitch||0)*D2R)];
  const up=[-bd[0]*bd[2],-bd[1]*bd[2],1-bd[2]*bd[2]],ul=Math.hypot(...up)||1;
  const u2=up.map(c=>c/ul);
  const an={t:q.t-bd[0]*BACK+u2[0]*UP, n:q.n-bd[1]*BACK+u2[1]*UP, z:q.z-bd[2]*BACK+u2[2]*UP};
  const kn=tb({t:0,n:0,z:key.hipZ},an,THIGH,SHIN,ant(key.hipYaw));
  const sv=[kn.t-an.t,kn.n-an.n,kn.z-an.z],sl=Math.hypot(...sv)||1;
  const dot=(sv[0]*u2[0]+sv[1]*u2[1]+sv[2]*u2[2])/sl;
  return Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI;
}
const M=grab(); let n=0;
console.log(`shin lean inside the boot (a stiff boot allows about ${LIMIT}°)\n`);
for(const [mk,m] of Object.entries(M)) for(const k of m.keys){
  if(!k.skate) continue;
  const q=k[k.skate], before=lean(k,q);
  if(before<=LIMIT){ continue; }
  // slide the foot along the track until the shin sits inside the boot's range
  let best=q.t, bl=before;                      // search both ways: a backward
  for(let d=-80; d<=80; d+=0.5){                // skater's "forward" is −t
    const L=lean(k,{...q,t:q.t+d});
    if(L<bl-0.01){ bl=L; best=q.t+d; }
    if(bl<=LIMIT-1) break;
  }
  const nt=Math.round(best);
  console.log(` ${mk.padEnd(7)} t=${k.t.toFixed(2)} ${k.skate}  foot ${q.t} -> ${nt} cm along track   lean ${before.toFixed(0)}° -> ${lean(k,{...q,t:nt}).toFixed(0)}°`);
  const key=`${k.skate}:P(${q.t},${q.n},${q.z}${q.pitch?','+q.pitch:''})`;
  if(html.includes(key)) html=html.replace(key, `${k.skate}:P(${nt},${q.n},${q.z}${q.pitch?','+q.pitch:''})`), n++;
  else console.log('    !! not found', key);
}
fs.writeFileSync(path,html);
console.log(n? `\n${n} feet repositioned under the hip` : '\nall shins inside the boot');
