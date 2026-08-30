/* The three renderers. Every quantity they draw comes from rig-math.js, so the
   views are three projections of one state and cannot contradict each other.
   Top-down owns yaw, side owns pitch, from-behind owns roll. */

import { MOVES } from './moves.js';
import {
  D2R, anterior, THIGH, SHIN, UPPER, FORE,
  ankleOf, twoBone, shoulderJoint, elbowFace, bootDir, buildPath, poseAt,
  contactAlong, pitchOf, bladeZone, onIceOf, edgeOf, bladesDown,
} from './rig-math.js';

/* ═══ drawing helpers ════════════════════════════════════════ */
const NS='http://www.w3.org/2000/svg';

const el=(n,a={})=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e;};

const unit  = v => { const l = Math.hypot(...v) || 1; return v.map(c => c/l); };
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];

const edgeCol = e => e==='O' ? 'var(--edge-out)' : 'var(--edge-in)';

/* Left and right keep their own colour in every view, so you can read which
   way round the skater is without waiting for the boot to turn. */
/* One limb colour. Which foot is carried by the letter on the boot, which is
   where the brief already put identity; colour is free to stop competing for it. */
const LIMB = 'var(--limb)';

/* WHERE THE CAMERA STANDS, per view — the one fact that both the depth ordering
   and the boot's toe/heel test are read off, so they cannot drift apart.

   Side: the along-track axis is plotted with +t to the right, so a skater going
   forwards travels left to right, which is the way a diagram is read. That puts
   the camera on the skater's RIGHT, at +n; standing on their left gives the same
   picture mirrored. Depth is across-track, larger n nearer.

   Rear: plotted with +n to the right, which is what standing behind someone
   looks like — their right hand on your right. The camera is at -t, depth is
   along-track, smaller t nearer.

   Both return "how near the camera", so the sign is the whole content. The side
   one was backwards until 29/08/2026, where it contradicted the toe/heel test
   twenty lines below: depth ordered from the skater's left, boots drawn from
   their right. */
const NEARER = { side: q => q.n, rear: q => -q.t };

/* The casing: an outer stroke in the panel's own colour, so it costs no contrast
   and reads as depth rather than as another thing to learn. It belongs to the
   limb in front, which is enforced by draw order rather than by choosing — the
   nearer limb is drawn last and cases over what it crosses. Casing the further
   limb is unrepresentable, not merely discouraged. */
const CASE = 5;

/* Depth is carried by STROKE WEIGHT, not by opacity or by hue.
   Colour is identity — which foot — and must stay at full strength in both
   schemes, so the pale limb of the pair cannot also be the dim one. Opacity was
   doing the opposite: it dimmed the free limb, and in dark that limb is already
   the lower-contrast half, so the two channels multiplied and it vanished.
   Weight is a channel that costs no contrast.
   Role, not depth-per-frame: the skating leg is the heavy one for as long as it
   is the skating leg. It swaps at a landing, where the skater's weight really
   does swap, and nowhere else — a per-frame depth test would trade the weights
   as the free leg passes through, which reads as a flicker, not as space. */
const LIMB_W = { skating: 5.4, free: 3.0 };
/* Arms take the same treatment for the same reason. They are not the subject of
   the leg finding, but FROM BEHIND is read for lean and alignment and that is
   partly the shoulder line — an arm dimmed to .8 in the paler hue fails there
   exactly as a leg did. One weight, no role split: both arms are equally the
   subject. Sits just above the free leg so it never outranks the skating one. */
const ARM_W = 3.2;

/* Projected bend below which an elbow is not drawn, joint circle included.
   model.md already said stop drawing the elbow once the arm is near end-on; that
   rule predates the joint circle, which had been sitting on the shoulder-to-hand
   line ever since. One stroke width: at that point the joint is inside the line
   that would be drawn without it, so drawing it claims a bend the picture cannot
   show. Same number for the polyline and the circle, because they are one claim. */
export const ARM_END_ON = ARM_W;

/* WHICH HAND IS WHICH, and when the guide says so.

   A move whose author asserted a distinction between the hands gets letters; one
   that did not gets none. Exactly the boots' rule, where an element that stays on
   one foot gets no L/R tag because the model makes no distinction there.

   It follows the DATA, not a measurement of it. The first proposal used a 12 cm
   threshold on the two hands in the shoulder frame, which was its weakest number:
   every other constant in this repository comes from the equipment — the rocker's
   radius, the cuff's 28 deg, the boot's 10 deg — and there is no physical fact
   behind "how far apart must two hands be before we name them". The flag also
   deletes the question of what happens to a pose sitting either side of it. */
export function armsAuthored(move){
  return move.keys.some(k => (k.LH && k.LH.authored) || (k.RH && k.RH.authored));
}

/* THE GLYPHS TAKE A CONTACT, NOT A BOOLEAN — 30/08/2026.

   Each of these used to take `skating`, and it decided three separate things at
   once: how heavily the boot is drawn, whether the runner takes an edge colour,
   and whether an edge dot appears. Those came apart the moment a foot could be on
   the ice without being on a blade. They are two questions now:

     planted — on the ice by any means. Decides WEIGHT. A picked foot is bearing
               load and must not be drawn as though it were in the air.
     bladed  — on the ice on a runner. Decides EDGE COLOUR and the DOT, both of
               which name a biting edge, and a pick has none to name.

   What is left is the pick's own picture: the runner up out of the ice and the
   teeth in it. That is drawn by giving the runner the limb colour rather than an
   edge colour, and the teeth full ink rather than the faint wash they carry when
   they are only along for the ride. */
const planted = c => c != null;
const bladed  = c => c === 'blade';

/* boot seen from above: toe at +x */
function bootTop(edge, contact, foot){
  const g = el('g');
  g.appendChild(el('path',{d:'M -15 -6.5 L 4 -8 Q 13.5 -7 15.5 0 Q 13.5 7 4 8 L -15 6.5 Q -18 0 -15 -6.5 Z',
    fill:'var(--paper)',stroke:LIMB,'stroke-width':planted(contact)?2.6:1.7,
    'stroke-linejoin':'round'}));
  g.appendChild(el('line',{x1:-14,y1:0,x2:16,y2:0,
    stroke:bladed(contact)?edgeCol(edge):planted(contact)?'var(--ink)':'var(--free)',
    'stroke-width':2.8,'stroke-linecap':'round'}));
  return g;
}

/* Boot seen from BENEATH: toe at +x, and the blade is the whole point of it.

   Added 30/08/2026, Martyn's call, and it is the fourth glyph rather than a variant
   of the third. When the boot's up-axis points at the camera the plan view is the
   right picture — but WHICH FACE is toward you decides what is actually there, and
   mirroring the top of a boot does not draw its underside. From beneath, a figure
   boot is almost entirely blade: a steel runner standing proud of the sole, with
   the pick at the front, and the footprint behind it. Measured across the six
   moves, 285 of 697 plan frames have the sole toward the camera, and they are
   exactly where you would guess — every plan frame of the spiral and its checked
   variant, and most of the teapot's, because a raised or reaching free foot shows
   its underside to a camera behind the skater.

   It is also the most model-relevant picture in the guide. The blade is what this
   whole repository is about, and this is the only view that shows the runner whole.

   No edge dot: the dot marks a BITING edge, and a boot showing its sole is a boot
   off the ice. Every one of those 285 frames is a free boot, and a skating boot can
   never reach this glyph — a blade on the ice has its up-axis pointing up, never at
   a camera beside or behind the skater. */
function bootSole(edge, contact, foot){
  const skating = bladed(contact), weight = planted(contact);
  const g = el('g');
  /* The same footprint as the plan view. Handedness is the transform's job — the
     glyph is drawn in the boot's own frame and the plan branch mirrors it. */
  g.appendChild(el('path',{d:'M -15 -6.5 L 4 -8 Q 13.5 -7 15.5 0 Q 13.5 7 4 8 L -15 6.5 Q -18 0 -15 -6.5 Z',
    fill:'var(--paper)',stroke:LIMB,'stroke-width':weight?2.6:1.7,'stroke-linejoin':'round'}));
  /* The mounting plates, faint — they are what tells you this is the underside and
     not the top, before you have read the blade. */
  for (const x of [-10.5, 9]) g.appendChild(el('rect',{x:x-2.5,y:-5,width:5,height:10,
    fill:'none',stroke:LIMB,'stroke-width':1,opacity:.35,rx:1}));
  /* The runner. Drawn as a solid rather than a line, because from here it has width
     and the width is the two edges — the thing the guide exists to explain. */
  g.appendChild(el('rect',{x:-13.5,y:-1.9,width:27.5,height:3.8,rx:1,
    fill:skating?edgeCol(edge):'var(--free)',stroke:'var(--ink)','stroke-width':.9}));
  /* Toe pick, seen from underneath: the teeth stand out past the front of the runner. */
  g.appendChild(el('path',{d:'M 14 -1.9 L 17.4 -1.2 L 15.6 0 L 17.8 1.1 L 14 1.9 Z',
    fill:skating?'var(--ink)':LIMB,opacity:skating?.8:.45}));
  return g;
}

/* Where a pick touches, in the side glyph's own units: the deepest tooth of the
   toe pick, which is drawn at (17.8, 3.2). A blade's contact point slides along
   the rocker with pitch and comes from contactAlong; a pick's does not move,
   because teeth do not roll. Both end up at the origin after the glyph's shift,
   which is the point the boot pivots about. */
const PICK_ALONG = 17.8, PICK_TOOTH_Y = 3.2;

/* boot seen from the side: toe at +x, blade and pick beneath */
function bootSide(edge, contact, along, foot){
  const skating = bladed(contact), weight = planted(contact), picked = contact === 'pick';
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
    fill:'var(--paper)',stroke:LIMB,'stroke-width':weight?2.6:1.7,
    'stroke-linejoin':'round'}));

  g.appendChild(el('path',{
    d:`M -12 -3 L 18 -3 L ${under.slice().reverse().join(' L ')} Z`,
    fill:skating?edgeCol(edge):LIMB,stroke:'none',opacity:skating?1:picked?.6:.32}));

  /* Toe pick: teeth at the front, reaching to about the blade's lowest plane.
     That is why engaging them takes a real pitch — they are barely proud of the ice. */
  g.appendChild(el('path',{d:'M 15.5 -2.4 L 16.4 2.6 L 17.1 0.6 L 17.8 3.2 L 18.4 0.9 L 18.6 -2.6 Z',
    fill:weight?'var(--ink)':LIMB,opacity:picked?1:skating?.75:.3}));

  /* The contact marker rings whatever is actually touching: the point on the
     rocker for a blade, and the teeth for a pick. Both sit at the origin after the
     translate above, which is the point the boot pivots about. */
  if(weight){
    g.appendChild(el('circle',{cx:along.toFixed(2),cy:(picked?PICK_TOOTH_Y:bladeY(along)).toFixed(2),r:2.6,
      fill:'none',stroke:'var(--ink)','stroke-width':1.3,opacity:.85}));
  }
  return g;
}

/* Boot seen end-on — and a boot from the front is not a boot from the back.
   facing +1 = toe toward the viewer (rounded toe box, laces, pick teeth),
   facing −1 = heel toward the viewer (square heel, tall cuff, back seam).
   This is also where the edge itself becomes visible: the blade tips and
   the biting side is the one touching the ice. */
function bootEnd(edge, contact, foot, facing, dotSide){
  const g = el('g',{transform:'translate(0 -2.2)'});   // edge marker sits on the ice
  const skating = bladed(contact), weight = planted(contact);
  const col = skating ? edgeCol(edge) : 'var(--free)';
  const stroke = weight ? 'var(--ink)' : 'var(--free)';
  const sw = weight ? 2.6 : 1.7;

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
  /* The dot marks the BITING edge, which is a fact about a blade that is on the
     ice. A free foot is in the air — the glyph says so in --free — so it has no
     biting edge and gets no dot. It was drawn on both, so every raised foot in
     the guide asserted ice contact the model was simultaneously denying.

     Which side it falls on is the boot's own lateral axis seen through this
     view, handed in as dotSide, not a rule about where the toe points. On a
     skating boot the two agree exactly, because a blade on the ice lies along
     its own tracing; on a free boot, whose direction is built from the shin,
     they part company — which is precisely where the wrong dot was appearing. */
  if(skating){
    const onLeft = (foot==='L') === (edge==='O');      // which side of the blade bites
    g.appendChild(el('circle',{cx:(onLeft?dotSide:-dotSide)*3.2, cy:2.2, r:3.2,
      fill:col,'data-edge-dot':onLeft?'skater-left':'skater-right'}));
  }
  return g;
}

/* ═══ view: top-down ═════════════════════════════════════════ */
function viewTop(svg, move, path, frames, SHOW){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const p of path){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);}
  /* The panel takes the shape of what it holds. A fixed landscape box was
     letterboxing a lobe, which is portrait — hence a top-down card that was half
     empty on a phone, with the tracing shrunk to a hairline to fit the one axis
     that did not need shrinking. Clamped at both ends so a long run does not
     become a strip and a compact one does not become a tower.

     VBASE is near the panel's real CSS width at phone size on purpose: every
     stroke here is written in viewBox units, so a box twice the rendered width
     halves every line. It renders bolder on a wide screen, which is the right
     direction to be wrong in. */
  /* The bbox above is the TRACING only, and the body is drawn around it — so a
     free leg extended at the start or the end of a move reached outside the box
     and was cut off. It always did; a fixed 880-unit landscape box had so much
     dead space that the overhang landed in it. Tightening the box to the content
     removed the accident that was hiding it.

     So measure the body too. Every limb point is stored as (t,n) offsets from
     the hip in centimetres and drawn at BS, which makes the maximum overhang
     exactly computable from the poses — no rig solving, no guessed padding, and
     it holds for a spiral's reach as well as a waltz jump's. Intermediate joints
     (knee, elbow) can bow outside the line between their ends, hence the 1.15;
     JOINT covers the stroke and joint-circle radii, which are drawn in screen
     units and so are not scaled by BS. */
  const BS = 1.2;
  let reach = 0;
  for(const fr of frames){
    const ps = fr.pose;
    for(const k of ['L','R','LH','RH','sh']){
      const q = ps[k]; if(!q) continue;
      reach = Math.max(reach, Math.abs(q.t||0), Math.abs(q.n||0));
    }
  }
  const JOINT = 14;
  const VBASE=440, pad = Math.max(55, reach * BS * 1.15 + JOINT);
  const wRaw=x1-x0+pad*2, hRaw=y1-y0+pad*2;
  const ar=Math.min(2.2,Math.max(0.85,wRaw/hRaw));
  const VW=VBASE, VH=Math.round(VBASE/ar);
  const w=wRaw, h=hRaw, s=Math.min(VW/w,VH/h);
  svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`); svg.textContent='';
  const root=el('g',{transform:`translate(${(VW-w*s)/2-(x0-pad)*s} ${(VH-h*s)/2-(y0-pad)*s}) scale(${s})`});
  svg.appendChild(root);

  const d = pts => pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  /* The whole tracing, faint, so the part not yet skated is still legible as the
     shape the move makes. It was thin enough to disappear at phone size. */
  root.appendChild(el('path',{d:d(path),fill:'none',stroke:'var(--ink)',opacity:.16,'stroke-width':3/s}));

  const live=el('g'); root.appendChild(live);
  const body=el('g'); root.appendChild(body);
  // BS is hoisted above the fit, which needs it to measure the body's overhang.
  // Deliberately ~4× life: at true scale a skater is a speck against a four-metre
  // lobe, and rotation — the whole point of this view — becomes unreadable. The
  // tracing stays true; only the body is enlarged.

  return frame => {
    const {p, pose, idx} = frame;
    live.textContent=''; body.textContent='';

    // trace so far: solid where a blade is down, dashed while airborne
    let run=[], runAir=null;
    const flush=()=>{ if(run.length>1){
      const seg=el('path',{d:d(run),fill:'none','stroke-width':4.2/s,'stroke-linecap':'round',
        stroke: runAir?'var(--ink-soft)':edgeCol(run.edge)});
      if(runAir) seg.setAttribute('stroke-dasharray',`${6/s} ${7/s}`);
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

    // Overhead, depth is height: the raised foot is the nearer one, so it draws last.
    for(const which of ['L','R'].slice().sort((a,b)=>(pose[a].z||0)-(pose[b].z||0))){
      /* "Is this foot on the ice", not "is this the skating foot". They were the
         same question until a pose could hold two blades; asking the old one here
         would draw the second blade of an Ina Bauer in free weight, in the free
         colour, and hide it entirely with the free-foot toggle off. Since a foot
         can also be on its pick, the answer is the contact itself rather than a
         boolean: three values, and the glyph reads them apart. */
      const contact = onIceOf(pose, which), down = contact != null;
      if(!SHOW.free && !down) continue;
      const q=pose[which], pos=rel(q);
      const kn0 = twoBone({t:0,n:0,z:pose.hipZ}, q, THIGH, SHIN, anterior(pose.hipYaw));
      const bd0 = bootDir(pose, which, kn0, q);
      /* data-boot, data-foot and data-heading, on the same argument that put them
         on the profile glyphs: role, side and orientation are facts the renderer
         knows and the markup was throwing away. Nothing could read this glyph, so
         nothing could check it — and what it got wrong was the heading, which came
         from the horizontal part of a boot direction that can point straight down.
         tools/continuity.mjs reads it now. */
      const heading = (p.th - Math.atan2(-bd0[1], bd0[0]))*180/Math.PI;
      const g=el('g',{transform:`translate(${pos.x} ${pos.y}) rotate(${heading}) scale(${Math.min(1,1.05/s)})`,
        'data-boot':contact === 'blade' ? 'skating' : (contact || 'free'),
        'data-foot':which,'data-heading':heading.toFixed(2),
        'data-horiz':Math.hypot(bd0[0],bd0[1]).toFixed(4)});
      /* Each blade takes its OWN edge. On a two-foot pose the two differ by
         definition — one outside, one inside — and that difference is the whole
         of what the position is, so the top view is where it has to show. */
      g.appendChild(bootTop(edgeOf(pose, which), contact, which));
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
          fill:'none',stroke:LIMB,'stroke-width':ARM_W/s,
          'stroke-linecap':'round','stroke-linejoin':'round'}));
        body.appendChild(el('circle',{cx:b.x,cy:b.y,r:2/s,fill:'var(--ice)',
          stroke:LIMB,'stroke-width':1.4/s}));
        body.appendChild(el('circle',{cx:c.x,cy:c.y,r:2.8/s,fill:LIMB}));
      }
    }
    if(SHOW.hip) bar(hip, pose.hipYaw, 17, 'var(--hip)');
    if(SHOW.sh)  bar(rel(pose.sh), pose.shYaw, 21, 'var(--shoulder)');
  };
}

/* ═══ views: side and rear (orthographic, cm) ════════════════ */
function viewProfile(svg, mode, SHOW, maxZ = 190, ASYM = false){   // mode 'side' | 'rear'
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
    const near = NEARER[mode];
    const hipPt = {x:originX, y:H(pose.hipZ)};
    const shPt  = {x:ax(pose.sh), y:H(pose.sh.z)};

    /* ═══ ONE sorted list, one granularity ═════════════════════

       Draw order IS the depth claim, so it is made in a single place against a
       single expression. This used to be a fixed stack: legs sorted by NEARER,
       then the torso, then both arms in L,R order. Arms were therefore last
       unconditionally — an arm behind the chest drew in front of it, and the
       further arm drew over the nearer one whenever L happened to be the far
       side. Depth was not absent from the arms; it was asserted, and asserted
       wrongly about half the time by construction.

       Everything splits at its middle joint — arms at the elbow, torso at the
       waist, legs at the knee — because a limb ordered as one piece gets one end
       of it wrong the moment anything passes between its ends. An upper arm can
       be behind the chest while the forearm is in front of it, and no single
       ordering of the whole arm can say both. The legs were split on measurement
       rather than argument: over 2,010 samples the knee and the blade straddle
       the torso's depth in 227 of them.

       An item is {part, depth, paint}; paint receives whether it is the first
       thing drawn, because casing belongs to whatever is in front of something
       and the furthest thing is in front of nothing. */
    const items = [];

    /* The sorted value, emitted onto every segment it paints. It is the one
       thing items.sort() consumes and was the one thing the markup threw away —
       the same argument that put data-limb on the legs. Without it a checker
       cannot ask the question this exists to answer: is the drawn order
       consistent with the stated camera? */
    let curDepth = 0;

    /* CASING, retracted rather than suppressed.

       Every segment in front of something gets a halo — that is the whole
       channel. The complication is that a limb is now two segments meeting at a
       joint, and a casing is wider than the stroke it protects, so the
       second-drawn half's casing paints over the first half's stroke and cuts a
       notch into a line that is continuous.

       The first attempt suppressed a casing when its sibling happened to sort
       next to it. That was wrong in a way worth recording: the two halves of a
       limb are usually contiguous in depth, so the second half of nearly every
       limb lost its halo, and whether a segment got one at all depended on what
       unrelated item happened to sort between it and its sibling.

       So the casing is retracted from its own internal joint by its own
       half-width and stops there. The stroke still runs to the joint, so the
       limb is unbroken; only the halo stops short, which is what a technical
       illustrator does at an elbow. The invariant is casings = segments − 1. */
    const shorten = (a, b, byA, byB) => {
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const room = Math.max(0, (L - byA - byB) / L);        // never invert a short segment
      return [{x: a.x + ux*byA*room, y: a.y + uy*byA*room},
              {x: b.x - ux*byB*room, y: b.y - uy*byB*room}];
    };
    const seg = (a, b, col, wid, attrs = {}, retract = [0, 0]) => cased => {
      if(cased){
        const [ca, cb] = shorten(a, b, retract[0], retract[1]);
        g.appendChild(el('path',{d:`M ${ca.x} ${ca.y} L ${cb.x} ${cb.y}`,fill:'none',
          stroke:'var(--ice)','stroke-width':wid+CASE,'stroke-linecap':'round',
          'stroke-linejoin':'round','data-casing':''}));
      }
      g.appendChild(el('path',{d:`M ${a.x} ${a.y} L ${b.x} ${b.y}`,fill:'none',stroke:col,
        'stroke-width':wid,'stroke-linecap':'round','stroke-linejoin':'round',
        'data-depth':curDepth.toFixed(2), ...attrs}));
    };
    /* Retraction at an internal joint: the casing's own half-width, so its round
       cap ends where the joint is instead of past it. */
    const back = wid => (wid + CASE) / 2;

    /* ─── legs ──────────────────────────────────────────────── */
    /* Both segments keep data-limb, so ink.mjs still reads role off the DOM.
       They carry identical width and colour, so its measurement is unchanged —
       it now finds two elements per role rather than one and records the same
       value either way. */
    const byDepth = ['L','R'].slice().sort((a,b)=>near(pose[a])-near(pose[b]));
    for(const which of byDepth){
      /* `skating` here has always meant "drawn as a blade on the ice" — heavier
         stroke, edge colour, a rockered blade under it, an edge dot. That is a
         property of being ON THE ICE, not of being the reference blade — and since
         30/08/2026 it is TWO properties, because a picked foot is on the ice and
         has no edge. `planted` carries the weight, `bladed` carries the edge. */
      const contact = onIceOf(pose, which);            // 'blade' | 'pick' | null
      const onIce = contact != null, skating = contact === 'blade';
      const edge = edgeOf(pose, which);
      if(!SHOW.free && !onIce) continue;
      const q=pose[which];
      // two passes: the boot direction needs a shin, the shin needs an ankle
      const kn0 = twoBone({t:0,n:0,z:pose.hipZ}, q, THIGH, SHIN, anterior(pose.hipYaw));
      const bd  = bootDir(pose, which, kn0, q);
      const ank = ankleOf(q, bd, [kn0.t - q.t, kn0.n - q.n, kn0.z - q.z]);
      const kn  = twoBone({t:0,n:0,z:pose.hipZ}, ank, THIGH, SHIN, anterior(pose.hipYaw));
      const pt  = {x:ax(ank), y:H(ank.z)};                 // the leg ends at the ankle
      const kp  = {x:ax(kn), y:H(kn.z)};
      const bootPt = {x:ax(q), y:H(q.z)};                  // the boot sits on the blade
      const wid = onIce ? LIMB_W.skating : LIMB_W.free;
      const role = skating ? 'skating' : (contact || 'free');

      /* The boot's frame in this view is two directions rather than an angle:
         where the toe points, and which way is up out of the boot. Deriving the
         second from world up worked only while the foot hung below the knee —
         raise it, as a spiral does, and the shin entered through the sole. */
      const vx = v => mode === 'side' ? v[0] : v[1];

      let tx = vx(bd), ty = -bd[2];
      const prof = Math.hypot(tx, ty) || 1e-6;
      tx /= prof; ty /= prof;

      /* Up out of the boot: taken from the ANKLE, in 3D, once.

         ankleOf places the ankle along this very axis, so taking the boot's own
         direction back off the ankle returns the axis the boot was built about —
         and the leg is drawn ending at that ankle, so the boot's opening faces
         exactly where the shin goes into it. Deriving it from the knee instead
         used the second-pass knee, one iteration past the one the ankle sits on:
         up to 11.4 deg apart on the waltz jump, with the drawn shin then entering
         the drawn boot off-centre.

         It used to be built in the VIEW as well — project the leg, then subtract
         the projected boot direction — and a 2D subtraction standing in for a 3D
         one degenerates whenever the two projections line up. End-on that is every
         frame by construction, because that branch runs precisely when the boot
         points at the camera and the vector being removed is near-zero noise: it
         annihilated the up-axis's vertical part, roll collapsed to +/-90 deg with
         the side decided by the sign of the pitch, and the boot was drawn lying on
         the ice in every rear view in the guide. 1102 of 1828 glyphs past 60 deg
         of roll; the extended edge every frame of 379, spanning -90.0 to -91.7.

         One vector, in 3D, projected like everything else. The side-on branch
         still squares it against the boot direction in the view; that is a
         separate, measured problem, flagged where it happens. */
      const toAnkle = [ank.t - q.t, ank.n - q.n, ank.z - q.z];
      const f3 = unit(bd);
      const dd = toAnkle[0]*f3[0] + toAnkle[1]*f3[1] + toAnkle[2]*f3[2];
      const u3 = unit([toAnkle[0]-dd*f3[0], toAnkle[1]-dd*f3[1], toAnkle[2]-dd*f3[2]]);
      let ux = vx(u3), uy = -u3[2];
      const ul = Math.hypot(ux, uy) || 1;
      ux /= ul; uy /= ul;

      /* THE BOOT HAS THREE AXES AND THERE ARE THREE GLYPHS — 30/08/2026.

         The choice between them used to be `prof >= endo`: is more of the boot in
         the view plane, or pointing at the camera. That is a two-way test over a
         three-way question, and it never asked the one that matters, because
         `prof` adds the lateral and the vertical parts together. A boot with NO
         lateral component at all still scores high on it through its vertical
         part, and gets drawn in profile — a picture of the boot from the one
         direction it is least being seen from.

         Martyn found it on the waltz jump's rear view. The free boot points about
         45 degrees down and 45 along the track, so of its three axes the one most
         nearly aimed at the camera is its UP axis, every time: 0.72 to 0.76,
         against 0.64 to 0.68 for its length and 0.08 to 0.14 for its width. A boot
         whose up-axis faces you is a boot seen from above its own opening, which
         `docs/model.md` has recorded as having no glyph since Session 06.

         It had one all along. `bootTop` is the plan view and has been drawn by the
         top-down view since the first session; the profile views simply could not
         reach for it. So the rule is now the honest one — the boot's axes are
         orthonormal, so their three camera components square to one, and the glyph
         to draw is the view down whichever axis is most aligned with the camera:

           length at the camera  -> bootEnd,  a cross-section
           width  at the camera  -> bootSide, a profile
           up     at the camera  -> bootTop,  a plan

         Each is then foreshortened by how much of it is left in the view plane,
         which is what the old `p2` and `endo` scalings were already doing. */
      const latL = cross(f3, u3);              // the skater's left: forward x up
      const camOf = v => mode === 'side' ? v[1] : -v[0];     // + = toward the viewer
      const camF = camOf(f3), camU = camOf(u3), camL = camOf(latL);
      const aF = Math.abs(camF), aU = Math.abs(camU), aL = Math.abs(camL);
      const glyph = aF >= aU && aF >= aL ? 'end' : (aU >= aL ? 'plan' : 'side');

      /* How much of the boot points at the camera — same axis and same sign as
         NEARER above, so a toe drawn coming at you and a limb drawn in front are
         the same claim, made once. */
      const toward = mode === 'side' ? bd[1] : -bd[0];
      const endo = Math.abs(toward);
      const facing = (Math.sign(toward) || 1);            // +1 = toe toward viewer
      const along = skating ? contactAlong(pitchOf(bd)) : contact === 'pick' ? PICK_ALONG : 0;

      /* Two items, ordered independently. The knee circle and the boot travel
         with the shin, because both are attached to it. */
      const hipD = near({t:0, n:0}), kneeD = near(kn), ankD = near(ank);

      items.push({part:'leg'+which, depth:(hipD + kneeD)/2, paint: cased => {
        seg(hipPt, kp, LIMB, wid, {'data-limb':role,'data-leg':'thigh'}, [0, back(wid)])(cased && SHOW.free);
      }});

      items.push({part:'leg'+which, depth:(kneeD + ankD)/2, paint: cased => {
        seg(kp, pt, LIMB, wid, {'data-limb':role,'data-leg':'shin'}, [back(wid), 0])(cased && SHOW.free);
        g.appendChild(el('circle',{cx:kp.x,cy:kp.y,r:wid*0.62,fill:'var(--ice)',
          stroke:LIMB,'stroke-width':onIce?2.2:1.7}));

        /* data-boot and data-foot for tools/boot.mjs, on the same argument that
           put data-limb on the legs: role and side are facts the renderer knows
           and the markup was throwing away. */
        const holder = el('g',{transform:`translate(${bootPt.x} ${bootPt.y}) scale(${S})`,
          'data-boot':role,'data-foot':which});
        if(glyph === 'plan'){
          /* A PLAN VIEW, seen down the boot's own up-axis. Its length and its width
             are both in the view plane, so the 2x2 is built from those two projected
             directions and carries its own foreshortening — no normalising, because
             the shortening IS the information. Both columns come from 3D axes that
             are orthogonal by construction, so this one cannot go singular the way
             the side-on branch can.

             camU > 0 means the cuff opening faces the viewer and we are looking into
             the top of the boot; camU < 0 means the sole is toward us, which is a
             different picture and not a mirrored one — see bootSole. The sign on the
             lateral column mirrors the frame either way, so the toe and the skater's
             left stay on the correct hand. */
          const px = vx(f3), py = -f3[2];
          const qx = vx(latL) * Math.sign(camU || 1), qy = -latL[2] * Math.sign(camU || 1);
          /* THE PLAN GLYPH PIVOTS ABOUT THE CONTACT TOO — 30/08/2026. bootSide has
             always shifted itself so that whatever part of the blade is touching sits
             at the origin, because the origin is placed on the ice. The plan branch
             never did, and never needed to: a skating boot cannot reach this glyph
             (its up-axis points up, never at a camera beside or behind the skater)
             and a free boot has no contact point to pivot about, so `along` was zero
             every time this ran. A PICK is the first boot that is both plan-drawn and
             touching, and without the shift the plan view drew the whole footprint
             centred on the ice — half the boot underneath it, in the rear view of the
             only pose that has one. Carried in the matrix's own translation rather
             than a wrapping group, and written as a bare 0 where there is nothing to
             shift, so every frame that existed before today draws byte-identically to
             what it did — checked as one hash over 189 standalone frames of nine
             moves, before the change and after it. */
          const e = px * -along, f = py * -along;
          const gt = el('g',{transform:
            `matrix(${px.toFixed(4)} ${py.toFixed(4)} ${(-qx).toFixed(4)} ${(-qy).toFixed(4)} ` +
            `${e ? e.toFixed(4) : 0} ${f ? f.toFixed(4) : 0})`,
            'data-plan':(camU > 0 ? 'top' : 'sole'),'data-fore':Math.hypot(px,py).toFixed(3)});
          gt.appendChild((camU > 0 ? bootTop : bootSole)(edge, contact, which));
          holder.appendChild(gt);
        } else if(glyph === 'side'){
          /* A KNOWN FUDGE, measured on 29/08/2026 and deliberately left standing.
             The two columns here are two projected 3D axes, so where they project
             onto nearly the same screen line the matrix goes singular and the glyph
             collapses to a stroke. That is not a rare frame: in the rear view a free
             boot's up-axis points near the camera in 263 of 263 extended-edge frames,
             100 of 100 teapot frames, 69 of those inside 5 degrees.

             Squaring the up-axis against the boot's direction IN THE VIEW keeps a
             legible glyph, at the price of drawing a boot that is not the boot in
             the model. Neither is right. What those frames actually hold is a boot
             seen from above its own opening, and this file has no glyph for that —
             which is a design call, not a renderer one. Written up in the Session 06
             handoff. Squaring the projection kills the boot-direction component
             either way, so this is very nearly the drawing that was always here:
             unchanged on every side-on skating glyph in the repo, and inside 1.3
             deg on all but seventy-five free ones.

             End-on, the same squaring was catastrophic rather than approximate —
             see the branch below. */
          let sx = ux, sy = uy;
          const dp = sx * tx + sy * ty;
          sx -= dp * tx; sy -= dp * ty;
          const sl = Math.hypot(sx, sy) || 1;
          sx /= sl; sy /= sl;
          const p2 = Math.max(prof, 0.12);
          const gp = el('g',{transform:
            `matrix(${(tx*p2).toFixed(4)} ${(ty*p2).toFixed(4)} ${(-sx).toFixed(4)} ${(-sy).toFixed(4)} 0 0)`});
          gp.appendChild(bootSide(edge, contact, along, which));
          holder.appendChild(gp);
        } else {
          /* End-on the glyph is a CROSS-SECTION: what it rolls with is the boot's
             up-axis and nothing else. The one thing that hid the old collapse is a
             skating pitch authored as exactly 0 — that makes the vector the old code
             removed exactly zero and the subtraction a no-op. The spiral and the
             teapot are authored that way, which is why the element the standing rule
             says to shoot first is the one element that cannot show this. */
          const roll = Math.atan2(ux, -uy) * 180 / Math.PI;

          /* Which side of the glyph the edge dot falls on: the boot's own lateral
             axis, seen through this view. latL is the skater's left — facing +t
             their right is +n, so left = forward x up. Hoisted above, because the
             three-way glyph choice needs it too and two copies of one axis is
             exactly the thing this file does not keep. */
          // glyph-local x maps to screen x through the roll, hence the cosine
          const dotSide = Math.sign(vx(latL) * Math.cos(roll * D2R)) || 1;

          const ge = el('g',{transform:`rotate(${roll.toFixed(2)}) scale(${Math.max(endo,0.12).toFixed(3)} 1)`,
            'data-roll':roll.toFixed(2)});
          ge.appendChild(bootEnd(edge, contact, which, facing, dotSide));
          holder.appendChild(ge);
        }
        g.appendChild(holder);
      }});
    }

    /* ─── torso, split at the waist ─────────────────────────── */
    /* Same argument one level up: the torso spans hip to shoulder, so ordering it
       as a single piece gets one end wrong the moment an arm passes it. An arm can
       be behind the chest and in front of the hips; one segment cannot say that. */
    const waist = {t: pose.sh.t/2, n: pose.sh.n/2, z: (pose.hipZ + pose.sh.z)/2};
    const waistPt = {x:ax(waist), y:H(waist.z)};
    const hipD = near({t:0,n:0}), shD = near(pose.sh), waistD = near(waist);
    items.push({part:'torso', depth:(hipD + waistD)/2,
      paint: seg(hipPt, waistPt, 'var(--ink)', 5, {opacity:.85,'data-torso':'lower'}, [0, back(5)])});
    items.push({part:'torso', depth:(waistD + shD)/2,
      paint: seg(waistPt, shPt, 'var(--ink)', 5, {opacity:.85,'data-torso':'upper'}, [back(5), 0])});

    /* ─── arms ──────────────────────────────────────────────── */
    /* Four segments, sorted individually. The elbow circle travels with whichever
       of its two segments is nearer, because it is a joint between them and cannot
       be behind one and in front of the other.

       data-arm-side is in the DOM and not in the ink: which arm this is remains
       something the drawing does not say, exactly as the brief requires, but it is
       a fact the renderer knows and the markup was throwing away. A checker cannot
       assert "both hands are accounted for" without it. */
    if(SHOW.arm){
      for(const [side, which] of [[-1,'L'],[1,'R']]){
        const j = shoulderJoint(pose, side), hand = pose[which+'H'];
        const eb = twoBone(j, hand, UPPER, FORE, elbowFace(pose, side));
        const jp={x:ax(j),y:H(j.z)}, ep={x:ax(eb),y:H(eb.z)}, hp={x:ax(hand),y:H(hand.z)};

        /* Projected bend: how far the elbow sits off the shoulder-to-hand line, in
           the panel's own units. This is the quantity model.md's rule is about —
           not the 3D bend, which can be large while the picture shows none, which
           is exactly how the zigzag got shipped. */
        const dx = hp.x - jp.x, dy = hp.y - jp.y;
        const len = Math.hypot(dx, dy) || 1e-6;
        const bendPx = Math.abs((ep.x - jp.x)*dy - (ep.y - jp.y)*dx) / len;
        const endOn = bendPx < ARM_END_ON;

        const jd = near(j), ed = near(eb), hd = near(hand);
        const dot = () => {
          /* Which hand is which, when the move's own data says there is a
             distinction to make. ASYM is a fact about the MOVE, read once at mount
             — a painter only ever sees one frame, and testing the interpolated
             pose here makes the letters appear mid-glide on any move reaching a
             check from a neutral carriage. */
          if(ASYM){
            g.appendChild(el('circle',{cx:hp.x,cy:hp.y,r:5.4,fill:LIMB}));
            const tx2 = el('text',{x:hp.x,y:hp.y,fill:'var(--ice)','font-size':7.2,
              'font-family':'ui-sans-serif, -apple-system, sans-serif','font-weight':600,
              'text-anchor':'middle','dominant-baseline':'central','data-hand':which});
            tx2.textContent = which;
            g.appendChild(tx2);
          } else {
            g.appendChild(el('circle',{cx:hp.x,cy:hp.y,r:3,fill:LIMB,'data-hand':which}));
          }
        };

        if(endOn){
          /* One segment, no joint, no joint circle. Past this threshold the arm
             points at or away from the camera and the bend is unrepresentable;
             drawing an elbow here draws a fact the panel cannot carry. */
          items.push({part:'arm'+which, depth:(jd + hd)/2, paint: cased => {
            seg(jp, hp, LIMB, ARM_W, {'data-arm':'straight','data-arm-side':which,'data-end-on':''})(cased);
            dot();
          }});
        } else {
          const nearerIsFore = (ed + hd)/2 > (jd + ed)/2;
          const elbow = () => g.appendChild(el('circle',{cx:ep.x,cy:ep.y,r:2.4,
            fill:'var(--ice)',stroke:LIMB,'stroke-width':1.6,'data-elbow':which}));
          items.push({part:'arm'+which, depth:(jd + ed)/2, paint: cased => {
            seg(jp, ep, LIMB, ARM_W, {'data-arm':'upper','data-arm-side':which}, [0, back(ARM_W)])(cased);
            if(!nearerIsFore) elbow();
          }});
          items.push({part:'arm'+which, depth:(ed + hd)/2, paint: cased => {
            seg(ep, hp, LIMB, ARM_W, {'data-arm':'fore','data-arm-side':which}, [back(ARM_W), 0])(cased);
            if(nearerIsFore) elbow();
            dot();
          }});
        }
      }
    }

    /* Casing says "I am in front of this", so the furthest item gets none. That is
       the whole rule — the sibling exception is gone, because retraction removes
       the notch it was there to prevent. */
    items.sort((a,b) => a.depth - b.depth);
    items.forEach((it, i) => { curDepth = it.depth; it.paint(i > 0); });

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

  /* A fact about the MOVE's data, read once. Testing the interpolated pose inside
     a painter instead makes the letters appear mid-glide on any move that reaches
     a check from a neutral carriage — a painter only ever sees one frame. */
  const asym = armsAuthored(m);

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
      painters.push(viewProfile(s, mode, SHOWN, maxZ, asym));
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
