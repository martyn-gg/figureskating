/* The three renderers. Every quantity they draw comes from rig-math.js, so the
   views are three projections of one state and cannot contradict each other.
   Top-down owns yaw, side owns pitch, from-behind owns roll. */

import { MOVES } from './moves.js';
import {
  D2R, anterior, THIGH, SHIN, UPPER, FORE,
  ankleOf, twoBone, shoulderJoint, elbowFace, bootDir, buildPath, poseAt,
  contactAlong, pitchOf, bladeZone,
} from './rig-math.js';

/* ═══ drawing helpers ════════════════════════════════════════ */
const NS='http://www.w3.org/2000/svg';

const el=(n,a={})=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e;};

const edgeCol = e => e==='O' ? 'var(--edge-out)' : 'var(--edge-in)';

/* Left and right keep their own colour in every view, so you can read which
   way round the skater is without waiting for the boot to turn. */
const legCol = f => f==='L' ? 'var(--leg-l)' : 'var(--leg-r)';

/* boot seen from above: toe at +x */
function bootTop(edge, skating, foot){
  const g = el('g');
  g.appendChild(el('path',{d:'M -15 -6.5 L 4 -8 Q 13.5 -7 15.5 0 Q 13.5 7 4 8 L -15 6.5 Q -18 0 -15 -6.5 Z',
    fill:'var(--paper)',stroke:legCol(foot),'stroke-width':skating?2:1.5,
    'stroke-linejoin':'round',opacity:skating?1:.6}));
  g.appendChild(el('line',{x1:-14,y1:0,x2:16,y2:0,stroke:skating?edgeCol(edge):'var(--free)',
    'stroke-width':2.8,'stroke-linecap':'round'}));
  return g;
}

/* boot seen from the side: toe at +x, blade and pick beneath */
function bootSide(edge, skating, along, foot){
  /* The glyph is drawn with the blade's midpoint at x=0, then shifted so that
     whichever part of the blade is actually touching sits at the origin — which
     is the point the whole boot pivots about. */
  const g = el('g',{transform:`translate(${(-along).toFixed(2)} 0) translate(0 -4)`});

  /* The rocker's real sag is about 4 mm across the blade and invisible at this
     size, so it is drawn roughly six times deeper — the same licence taken with
     the edge separation. The contact position is computed from the true radius. */
  const SAG = 0.0098;
  const bladeY = x => 4 - SAG * x * x;
  const under = [];
  for (let x = -12; x <= 18.001; x += 1.5) under.push(`${x.toFixed(1)} ${bladeY(x).toFixed(2)}`);

  g.appendChild(el('path',{d:'M -11 -21 L -9 -3 L 15 -3 L 17 -8 L 6 -13 L 3 -21 L -1 -16 L -7 -16 Z',
    fill:'var(--paper)',stroke:legCol(foot),'stroke-width':skating?2:1.5,
    'stroke-linejoin':'round',opacity:skating?1:.65}));

  g.appendChild(el('path',{
    d:`M -12 -3 L 18 -3 L ${under.slice().reverse().join(' L ')} Z`,
    fill:skating?edgeCol(edge):legCol(foot),stroke:'none',opacity:skating?1:.32}));

  /* Toe pick: teeth at the front, reaching to about the blade's lowest plane.
     That is why engaging them takes a real pitch — they are barely proud of the ice. */
  g.appendChild(el('path',{d:'M 15.5 -2.4 L 16.4 2.6 L 17.1 0.6 L 17.8 3.2 L 18.4 0.9 L 18.6 -2.6 Z',
    fill:skating?'var(--ink)':legCol(foot),opacity:skating?.75:.3}));

  if(skating){
    g.appendChild(el('circle',{cx:along.toFixed(2),cy:bladeY(along).toFixed(2),r:2.6,
      fill:'none',stroke:'var(--ink)','stroke-width':1.3,opacity:.85}));
  }
  return g;
}

/* Boot seen end-on — and a boot from the front is not a boot from the back.
   facing +1 = toe toward the viewer (rounded toe box, laces, pick teeth),
   facing −1 = heel toward the viewer (square heel, tall cuff, back seam).
   This is also where the edge itself becomes visible: the blade tips and
   the biting side is the one touching the ice. */
function bootEnd(edge, skating, foot, facing){
  const g = el('g',{transform:'translate(0 -2.2)'});   // edge marker sits on the ice
  const col = skating ? edgeCol(edge) : 'var(--free)';
  const stroke = skating ? 'var(--ink)' : 'var(--free)';
  const sw = skating ? 2 : 1.6;

  /* At this size the silhouette does the work, not the detail — so the toe
     is drawn narrow and domed with the pick jutting below, and the heel wide,
     square and tall. Different outlines, not just different insides. */
  if(facing > 0){
    g.appendChild(el('path',{d:'M -5.6 -20 Q 0 -22.4 5.6 -20 L 7.6 -8 Q 8.2 -4 4.4 -4 L -4.4 -4 Q -8.2 -4 -7.6 -8 Z',
      fill:'var(--paper)',stroke,'stroke-width':sw,'stroke-linejoin':'round'}));
    g.appendChild(el('path',{d:'M -3.6 -17.4 L 3.6 -14.8 M -3.6 -13.6 L 3.6 -11 M -3.6 -9.8 L 3.6 -7.2',
      fill:'none',stroke,'stroke-width':1.35,opacity:.62,'stroke-linecap':'round'}));
    g.appendChild(el('path',{d:'M -3 -4 L -3 1.4 L -1.5 -0.2 L 0 1.4 L 1.5 -0.2 L 3 1.4 L 3 -4 Z',
      fill:stroke}));                                   // toe pick, head-on
  } else {
    g.appendChild(el('path',{d:'M -8.4 -25 L 8.4 -25 L 9.6 -4 L -9.6 -4 Z',
      fill:'var(--paper)',stroke,'stroke-width':sw,'stroke-linejoin':'round'}));
    g.appendChild(el('line',{x1:0,y1:-24,x2:0,y2:-5,stroke,'stroke-width':1.35,opacity:.5}));
    g.appendChild(el('line',{x1:-8.9,y1:-11,x2:8.9,y2:-11,stroke,'stroke-width':1.35,opacity:.4}));
    g.appendChild(el('line',{x1:0,y1:-4,x2:0,y2:1.4,stroke:'var(--ink-soft)','stroke-width':2.6,opacity:.6}));
  }
  const onLeft = (foot==='L') === (edge==='O');        // same rule the top view uses
  g.appendChild(el('circle',{cx:(onLeft?-1:1)*(-facing)*3.2, cy:2.2, r:3.2, fill:col}));
  return g;
}

/* ═══ view: top-down ═════════════════════════════════════════ */
function viewTop(svg, move, path, frames, SHOW){
  const VW=880, VH=380;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const p of path){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);}
  const pad=95, w=x1-x0+pad*2, h=y1-y0+pad*2, s=Math.min(VW/w,VH/h);
  svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`); svg.textContent='';
  const root=el('g',{transform:`translate(${(VW-w*s)/2-(x0-pad)*s} ${(VH-h*s)/2-(y0-pad)*s}) scale(${s})`});
  svg.appendChild(root);

  const d = pts => pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  root.appendChild(el('path',{d:d(path),fill:'none',stroke:'var(--ink)',opacity:.12,'stroke-width':2.4/s}));

  const live=el('g'); root.appendChild(live);
  const body=el('g'); root.appendChild(body);
  // Body scale, cm → path units. Deliberately ~4× life: at true scale a skater is a
  // speck against a four-metre lobe, and rotation — the whole point of this view —
  // becomes unreadable. The tracing stays true; only the body is enlarged.
  const BS = 1.2;

  return frame => {
    const {p, pose, idx} = frame;
    live.textContent=''; body.textContent='';

    // trace so far: solid where a blade is down, dashed while airborne
    let run=[], runAir=null;
    const flush=()=>{ if(run.length>1){
      const seg=el('path',{d:d(run),fill:'none','stroke-width':3.2/s,'stroke-linecap':'round',
        stroke: runAir?'var(--ink-soft)':edgeCol(run.edge)});
      if(runAir) seg.setAttribute('stroke-dasharray',`${5/s} ${6/s}`);
      live.appendChild(seg);} };
    for(let i=0;i<=idx;i++){
      const f=frames[i], air=!f.pose.skate;
      if(runAir===null){runAir=air;run=[path[i]];run.edge=f.pose.edge;}
      else if(air!==runAir){ flush(); runAir=air; const keep=run[run.length-1]; run=[keep,path[i]]; run.edge=f.pose.edge; }
      else run.push(path[i]);
    }
    flush();

    const T={x:Math.cos(p.th),y:Math.sin(p.th)}, Nv={x:-Math.sin(p.th),y:Math.cos(p.th)};
    const at=(t,n)=>({x:p.x+T.x*t*BS+Nv.x*n*BS, y:p.y+T.y*t*BS+Nv.y*n*BS});
    const sk = pose.skate ? pose[pose.skate] : null;
    const hip = sk ? at(-sk.t,-sk.n) : {x:p.x,y:p.y};
    const rel=(q)=>({x:hip.x+T.x*q.t*BS+Nv.x*q.n*BS, y:hip.y+T.y*q.t*BS+Nv.y*q.n*BS});

    const bar=(pos,yawDeg,halfCm,colour)=>{
      const a=p.th - yawDeg*D2R;            // + yaw = anticlockwise on ice = −θ on screen
      const dx=Math.cos(a+Math.PI/2)*halfCm*BS, dy=Math.sin(a+Math.PI/2)*halfCm*BS;
      body.appendChild(el('line',{x1:pos.x-dx,y1:pos.y-dy,x2:pos.x+dx,y2:pos.y+dy,
        stroke:colour,'stroke-width':4/s,'stroke-linecap':'round'}));
      body.appendChild(el('circle',{cx:pos.x,cy:pos.y,r:2.6/s,fill:colour}));
    };

    for(const which of ['L','R']){
      if(!SHOW.free && which!==pose.skate) continue;
      const q=pose[which], pos=rel(q);
      const kn0 = twoBone({t:0,n:0,z:pose.hipZ}, q, THIGH, SHIN, anterior(pose.hipYaw));
      const bd0 = bootDir(pose, which, kn0, q, which===pose.skate);
      const g=el('g',{transform:`translate(${pos.x} ${pos.y}) rotate(${(p.th - Math.atan2(-bd0[1], bd0[0]))*180/Math.PI}) scale(${Math.min(1,1.05/s)})`});
      g.appendChild(bootTop(pose.edge, which===pose.skate, which));
      body.appendChild(g);
    }
    /* Arms belong here more than anywhere: seen from above, "out to the sides"
       is unambiguous, where a side view foreshortens them to nothing. */
    if(SHOW.arm){
      for(const [side, which] of [[-1,'L'],[1,'R']]){
        const j = shoulderJoint(pose, side), hand = pose[which+'H'];
        const eb = twoBone(j, hand, UPPER, FORE, elbowFace(pose, side));
        const a = rel(j), b = rel(eb), c = rel(hand);
        body.appendChild(el('path',{d:`M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`,
          fill:'none',stroke:legCol(which),'stroke-width':2.8/s,
          'stroke-linecap':'round','stroke-linejoin':'round',opacity:.85}));
        body.appendChild(el('circle',{cx:b.x,cy:b.y,r:2/s,fill:'var(--ice)',
          stroke:legCol(which),'stroke-width':1.4/s}));
        body.appendChild(el('circle',{cx:c.x,cy:c.y,r:2.8/s,fill:legCol(which),opacity:.9}));
      }
    }
    if(SHOW.hip) bar(hip, pose.hipYaw, 17, 'var(--hip)');
    if(SHOW.sh)  bar(rel(pose.sh), pose.shYaw, 21, 'var(--shoulder)');
  };
}

/* ═══ views: side and rear (orthographic, cm) ════════════════ */
function viewProfile(svg, mode, SHOW, maxZ = 190){          // mode 'side' | 'rear'
  // the rear view only needs ±1.5 m of width, so it can afford to zoom in
  const VW=430, VH=310, GROUND=VH-40;
  /* Fit the whole skater, at the tallest point of the move — the peak of a jump
     was pushing head and shoulders off the top of the card. Capped so a low move
     like a teapot does not blow up to fill the frame. */
  const S = Math.min(mode==='side' ? 1.45 : 1.65, (GROUND - 22) / Math.max(60, maxZ));
  svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
  return frame => {
    const {pose, p, dist} = frame;
    svg.textContent='';
    const g=el('g'); svg.appendChild(g);

    const win = mode==='side' ? 300 : 150;                 // half-width of view, cm
    const originX = VW/2;
    const H = z => GROUND - z*S;
    const X = mode==='side'
      ? (t => originX + (t - 0) * S)                       // along-track, hip centred
      : (n => originX + n * S);                            // across-track

    // ice + scale ticks
    g.appendChild(el('line',{x1:0,y1:GROUND,x2:VW,y2:GROUND,stroke:'var(--ink)',opacity:.45,'stroke-width':1.6}));
    if(mode==='side'){
      const step=50, off=((dist%step)+step)%step;
      for(let k=-win;k<=win;k+=step){
        const x=originX+(k-off)*S;
        if(x>4&&x<VW-4) g.appendChild(el('line',{x1:x,y1:GROUND,x2:x,y2:GROUND+7,stroke:'var(--ice-line)','stroke-width':2}));
      }
    } else {
      for(const k of [-100,-50,0,50,100]) g.appendChild(el('line',{x1:X(k),y1:GROUND,x2:X(k),y2:GROUND+ (k?5:9),
        stroke:'var(--ice-line)','stroke-width':2}));
      g.appendChild(el('line',{x1:originX,y1:20,x2:originX,y2:GROUND,stroke:'var(--ice-line)','stroke-width':1,'stroke-dasharray':'3 5'}));
    }

    const ax = q => mode==='side' ? X(q.t) : X(q.n);
    const hipPt = {x:originX, y:H(pose.hipZ)};
    const shPt  = {x:ax(pose.sh), y:H(pose.sh.z)};
    const line=(a,b,col,wid,op=1)=>g.appendChild(el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
      stroke:col,'stroke-width':wid,'stroke-linecap':'round',opacity:op}));

    for(const which of ['L','R']){
      const skating = which===pose.skate;
      if(!SHOW.free && !skating) continue;
      const q=pose[which];
      // two passes: the boot direction needs a shin, the shin needs an ankle
      const kn0 = twoBone({t:0,n:0,z:pose.hipZ}, q, THIGH, SHIN, anterior(pose.hipYaw));
      const bd  = bootDir(pose, which, kn0, q, skating);
      const ank = ankleOf(q, bd, [kn0.t - q.t, kn0.n - q.n, kn0.z - q.z]);
      const kn  = twoBone({t:0,n:0,z:pose.hipZ}, ank, THIGH, SHIN, anterior(pose.hipYaw));
      const pt  = {x:ax(ank), y:H(ank.z)};                 // the leg ends at the ankle
      const kp  = {x:ax(kn), y:H(kn.z)};
      const bootPt = {x:ax(q), y:H(q.z)};                  // the boot sits on the blade
      const col = legCol(which), wid = skating ? 4.6 : 3.4;
      g.appendChild(el('path',{d:`M ${hipPt.x} ${hipPt.y} L ${kp.x} ${kp.y} L ${pt.x} ${pt.y}`,
        fill:'none',stroke:col,'stroke-width':wid,'stroke-linecap':'round','stroke-linejoin':'round',
        opacity:skating?.95:.7}));
      g.appendChild(el('circle',{cx:kp.x,cy:kp.y,r:wid*0.62,fill:'var(--ice)',
        stroke:col,'stroke-width':2,opacity:skating?1:.7}));

      /* Project the boot the same way the bars are projected. A boot is
         parallel to the facing direction where a shoulder bar is across it,
         so it takes the complementary factor. Signed, so it mirrors too. */
      /* Build the boot's frame in this view from two directions rather than an
         angle: where the toe points, and where the leg leaves. Deriving the second
         from world up worked only while the foot hung below the knee — raise it,
         as a spiral does, and the shin entered through the sole. */
      const toKnee = [kn.t - q.t, kn.n - q.n, kn.z - q.z];
      const vx = v => mode === 'side' ? v[0] : v[1];

      let tx = vx(bd), ty = -bd[2];
      const prof = Math.hypot(tx, ty) || 1e-6;
      tx /= prof; ty /= prof;

      let ux = vx(toKnee), uy = -toKnee[2];
      const dp = ux * tx + uy * ty;
      ux -= dp * tx; uy -= dp * ty;
      const ul = Math.hypot(ux, uy) || 1;
      ux /= ul; uy /= ul;

      const out = mode === 'side' ? bd[1] : bd[0];
      const endo = Math.abs(out);
      const facing = (-Math.sign(out) || 1);              // +1 = toe toward viewer

      const along = skating ? contactAlong(pitchOf(bd)) : 0;
      const holder = el('g',{transform:`translate(${bootPt.x} ${bootPt.y}) scale(${S})`});
      if(prof >= endo){
        const p2 = Math.max(prof, 0.12);
        const gp = el('g',{transform:
          `matrix(${(tx*p2).toFixed(4)} ${(ty*p2).toFixed(4)} ${(-ux).toFixed(4)} ${(-uy).toFixed(4)} 0 0)`});
        gp.appendChild(bootSide(pose.edge, skating, along, which));
        holder.appendChild(gp);
      } else {
        const roll = Math.atan2(ux, -uy) * 180 / Math.PI;   // same up-axis, seen end-on
        const ge = el('g',{transform:`rotate(${roll.toFixed(2)}) scale(${Math.max(endo,0.12).toFixed(3)} 1)`});
        ge.appendChild(bootEnd(pose.edge, skating, which, facing));
        holder.appendChild(ge);
      }
      g.appendChild(holder);
    }

    line(hipPt, shPt, 'var(--ink)', 5, .85);               // torso

    /* Arms: identical chain, but an elbow points backwards where a knee points
       forwards — so the same solver runs with the facing vector negated. */
    if(SHOW.arm){
      for(const [side, which] of [[-1,'L'],[1,'R']]){
        const j = shoulderJoint(pose, side), hand = pose[which+'H'];
        const eb = twoBone(j, hand, UPPER, FORE, elbowFace(pose, side));
        const jp={x:ax(j),y:H(j.z)}, ep={x:ax(eb),y:H(eb.z)}, hp={x:ax(hand),y:H(hand.z)};
        const col = legCol(which);
        g.appendChild(el('path',{d:`M ${jp.x} ${jp.y} L ${ep.x} ${ep.y} L ${hp.x} ${hp.y}`,
          fill:'none',stroke:col,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.8}));
        g.appendChild(el('circle',{cx:ep.x,cy:ep.y,r:2.4,fill:'var(--ice)',stroke:col,'stroke-width':1.6}));
        g.appendChild(el('circle',{cx:hp.x,cy:hp.y,r:3,fill:col,opacity:.9}));
      }
    }

    // hip and shoulder bars foreshorten as they rotate — that IS the rotation cue
    const barF = (yaw) => mode==='side' ? Math.sin(yaw*D2R) : Math.cos(yaw*D2R);
    const bar=(pt,yaw,halfCm,col)=>{
      const half = Math.abs(barF(yaw))*halfCm*S;
      g.appendChild(el('line',{x1:pt.x-half,y1:pt.y,x2:pt.x+half,y2:pt.y,
        stroke:col,'stroke-width':4.5,'stroke-linecap':'round'}));
      g.appendChild(el('circle',{cx:pt.x,cy:pt.y,r:3,fill:col}));
    };
    if(SHOW.hip) bar(hipPt, pose.hipYaw, 17, 'var(--hip)');
    if(SHOW.sh)  bar(shPt,  pose.shYaw,  21, 'var(--shoulder)');
  };
}

/* ═══ mount ═══════════════════════════════════════════════════

   One rig, however many views the caller asks for. Returns a handle rather
   than wiring its own controls, so the same engine serves a single diagram on
   an element page and the full explorer. */

export function mount(host, {
  move = 'waltz', views = ['top', 'side', 'rear'], show = {}, onFrame, autoplay = true,
} = {}) {
  const SHOWN = { hip: true, sh: true, free: true, arm: true, ...show };
  const m = MOVES[move];
  if (!m) throw new Error(`unknown move: ${move}`);

  const path = buildPath(m);
  const frames = path.map((p, i) => ({ p, idx: i, dist: p.d, pose: poseAt(m, i / (path.length - 1)) }));

  /* Tallest thing the renderer will draw, across the whole move. */
  const maxZ = frames.reduce((hi, f) => {
    const p = f.pose;
    return Math.max(hi, p.sh.z, p.hipZ, p.L.z, p.R.z, p.LH.z, p.RH.z);
  }, 0) + 12;

  const painters = [];
  host.textContent = '';
  const card = (title, sub) => {
    const c = document.createElement('div');
    c.className = 'bf-card';
    const h = document.createElement('h3');
    h.innerHTML = `${title} <span>· ${sub}</span>`;
    const s = document.createElementNS(NS, 'svg');
    c.append(h, s);
    return { c, s };
  };
  if (views.includes('top')) {
    const { c, s } = card('Top-down', 'tracing and rotation');
    host.appendChild(c);
    painters.push(viewTop(s, m, path, frames, SHOWN));
  }
  if (views.includes('side') || views.includes('rear')) {
    const row = document.createElement('div');
    row.className = 'bf-pair';
    host.appendChild(row);
    for (const [mode, title, sub] of [['side', 'Side', 'height, knee and swing'],
                                      ['rear', 'From behind', 'lean and alignment']]) {
      if (!views.includes(mode)) continue;
      const { c, s } = card(title, sub);
      row.appendChild(c);
      painters.push(viewProfile(s, mode, SHOWN, maxZ));
    }
  }

  /* Real time is the wrong speed for learning a jump. A skater watching this
     wants it slowed down, not scrubbed — scrubbing gives you frames, slowing
     gives you the movement. */
  let i = 0, playing = autoplay, last = 0, raf = 0, speed = 1;
  const seek = n => {
    i = Math.min(frames.length - 1, Math.max(0, n));
    const f = frames[Math.round(i)];
    for (const paint of painters) paint(f);
    const sk = f.pose.skate;
    const zone = sk ? bladeZone(f.pose[sk].pitch || 0) : 'in the air';
    onFrame?.(i, f.pose, Math.round(f.pose.shYaw - f.pose.hipYaw), zone);
  };
  const tick = now => {
    const dt = Math.min(64, now - (last || now));
    last = now;
    if (playing) {
      i += (dt / 1000) * (frames.length - 1) / m.duration * speed;
      if (i >= frames.length - 1) i = 0;
      seek(i);
    }
    raf = requestAnimationFrame(tick);
  };
  seek(0);
  raf = requestAnimationFrame(tick);

  return {
    frames: frames.length,
    seek,
    set playing(v) { playing = v; },
    get playing() { return playing; },
    set speed(v) { speed = v; },
    get speed() { return speed; },
    setShow(k, v) { SHOWN[k] = v; seek(i); },
    destroy() { cancelAnimationFrame(raf); },
    note: m.note,
  };
}
