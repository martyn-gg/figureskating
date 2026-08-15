import fs from 'fs';
import { rigPath } from './_rig.mjs';
const html = fs.readFileSync(rigPath(),'utf8');
const start = html.indexOf('const MOVES = {');
const end   = html.indexOf('\n};', start) + 3;
const P = (t,n,z,pitch=0)=>({t,n,z,pitch});
const MOVES = new Function('P', html.slice(start, end).replace('const MOVES =','return') ).call(null, P);

const D2R=Math.PI/180, THIGH=44, SHIN=42, A=68*D2R, UP=15, BACK=3;
const ant=y=>[Math.cos(y*D2R),-Math.sin(y*D2R),0];
function tp(f,t,v){const c=f[0]*t[0]+f[1]*t[1]+f[2]*t[2];if(c>0.99999)return v.slice();
 const ax=[f[1]*t[2]-f[2]*t[1],f[2]*t[0]-f[0]*t[2],f[0]*t[1]-f[1]*t[0]],s=Math.hypot(...ax);
 if(s<1e-7)return v.map(c0=>-c0);
 const k=ax.map(a=>a/s),th=Math.atan2(s,c),ct=Math.cos(th),st=Math.sin(th);
 const kv=[k[1]*v[2]-k[2]*v[1],k[2]*v[0]-k[0]*v[2],k[0]*v[1]-k[1]*v[0]],kd=k[0]*v[0]+k[1]*v[1]+k[2]*v[2];
 return v.map((c0,i)=>c0*ct+kv[i]*st+k[i]*kd*(1-ct));}
function twoBone(r,t,L1,L2,face){const v=[t.t-r.t,t.n-r.n,t.z-r.z],d=Math.hypot(...v)||1e-6,u=v.map(c=>c/d);
 if(d>=L1+L2){const k=L1/(L1+L2)*d;return{t:r.t+u[0]*k,n:r.n+u[1]*k,z:r.z+u[2]*k};}
 const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));
 let K=tp([0,0,-1],u,face);const dt=K[0]*u[0]+K[1]*u[1]+K[2]*u[2];
 K=[K[0]-dt*u[0],K[1]-dt*u[1],K[2]-dt*u[2]];const kl=Math.hypot(...K)||1;K=K.map(c=>c/kl);
 return{t:r.t+a*u[0]+h*K[0],n:r.n+a*u[1]+h*K[1],z:r.z+a*u[2]+h*K[2]};}
function bootDir(k,pose,foot,skating){
 if(skating){const y=(pose.dir==='F'?0:180)*D2R,p=(foot.pitch||0)*D2R;
  return [Math.cos(y)*Math.cos(p),-Math.sin(y)*Math.cos(p),-Math.sin(p)];}
 const s=[foot.t-k.t,foot.n-k.n,foot.z-k.z],sl=Math.hypot(...s)||1,u=s.map(c=>c/sl);
 let a=tp([0,0,-1],u,ant(pose.hipYaw));const d=a[0]*u[0]+a[1]*u[1]+a[2]*u[2];
 a=[a[0]-d*u[0],a[1]-d*u[1],a[2]-d*u[2]];const al=Math.hypot(...a)||1;a=a.map(c=>c/al);
 const c=Math.cos(A),sn=Math.sin(A);return [a[0]*c+u[0]*sn,a[1]*c+u[1]*sn,a[2]*c+u[2]*sn];}

console.log('hip -> ankle distance against a', THIGH+SHIN, 'cm leg\n');
let bad=0;
for(const [mk,m] of Object.entries(MOVES)) for(const k of m.keys) for(const w of ['L','R']){
  const q=k[w], skating = k.skate===w;
  const k0=twoBone({t:0,n:0,z:k.hipZ}, q, THIGH, SHIN, ant(k.hipYaw));
  const bd=bootDir(k0,k,q,skating);
  const up=[-bd[0]*bd[2],-bd[1]*bd[2],1-bd[2]*bd[2]],ul=Math.hypot(...up)||1;
  const an={t:q.t-bd[0]*BACK+up[0]/ul*UP, n:q.n-bd[1]*BACK+up[1]/ul*UP, z:q.z-bd[2]*BACK+up[2]/ul*UP};
  const d=Math.hypot(an.t,an.n,an.z-k.hipZ), pc=100*d/(THIGH+SHIN);
  if(pc>100){ bad++; console.log(`  OVER  ${mk.padEnd(7)} t=${k.t.toFixed(2)} ${w}${skating?'*':' '}  ${d.toFixed(0)}cm = ${pc.toFixed(0)}%   blade(${q.t},${q.n},${q.z})`); }
}
console.log(bad ? `\n${bad} feet beyond reach — leg would detach from the boot` : '\nall feet within reach');
