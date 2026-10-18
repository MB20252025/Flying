import { T, rnd, M, tex } from '../utils.js';
import { S } from '../scene.js';
import { mkSlice, gP } from '../pizza.js';

export const room = new T.Group();
room.position.set(50,0,50);
S.add(room);

export const rm = [];

function bx(w,h,d,c,x,y,z,o){
  const m = M(c,o); rm.push(m);
  const e = new T.Mesh(new T.BoxGeometry(w,h,d), m);
  e.position.set(x,y,z);
  room.add(e);
  return e;
}
function cy(r1,r2,h,c,x,y,z){
  const m = M(c); rm.push(m);
  const e = new T.Mesh(new T.CylinderGeometry(r1,r2,h,10), m);
  e.position.set(x,y,z);
  room.add(e);
  return e;
}
function pl(w,h,t,x,y,z,ry,basic){
  const m = basic ? new T.MeshBasicMaterial({map:t}) : M(0xffffff, {map:t});
  rm.push(m);
  const o = new T.Mesh(new T.PlaneGeometry(w,h), m);
  o.position.set(x,y,z);
  o.rotation.y = ry || 0;
  room.add(o);
  return o;
}
function art(t,w,h,x,y,z,ry){
  const fm = M(0x3a2a1a); rm.push(fm);
  const f = new T.Mesh(new T.BoxGeometry(w+.2, h+.2, .08), fm);
  f.position.set(x,y,z); f.rotation.y = ry;
  room.add(f);
  const o = pl(w,h,t,0,0,.05,0);
  room.remove(o); f.add(o);
  return f;
}

/* --- shell --- */
bx(12,.2,10,0x6b4a35,0,-.05,0);
bx(12,5,.2,0x3d4a6b,0,2.5,-5);
bx(.2,5,10,0x44527a,-6,2.5,0);
bx(.2,5,10,0x44527a,6,2.5,0);
export const ceil = bx(12,.2,10,0xe8e0d0,0,5.1,0);

/* --- furniture --- */
bx(5,.9,2.2,0x5a3f7a,0,.45,2);
bx(5,1.4,.6,0x5a3f7a,0,1.2,3);
bx(.5,1.2,2.2,0x4e3569,-2.5,.7,2);
bx(.5,1.2,2.2,0x4e3569,2.5,.7,2);
bx(4.2,.35,1.6,0x6d4f8f,0,1,1.8);
bx(4,.9,1,0x2a2018,0,.45,-4.3);
bx(3.6,2,.3,0x111111,0,2.3,-4.6);
bx(2.6,.6,1.2,0x7a5232,0,.3,-.6);
bx(.1,2.2,2.4,0x1a2a66,-5.85,2.7,-2);
bx(.12,3.6,1.1,0xb0485a,-5.78,2.6,-3.6);
bx(.12,3.6,1.1,0xb0485a,-5.78,2.6,-.4);

bx(.5,.5,.5,0x2a2a2a,-4.6,.25,2.6);
const lampS = bx(.7,.7,.7,0xffc27a,-4.6,1.6,2.6,{emissive:0xff9a40});

/* --- TV --- */
const tvc = document.createElement('canvas');
tvc.width = 128; tvc.height = 72;
{ const x = tvc.getContext('2d');
  x.fillStyle = '#050818'; x.fillRect(0,0,128,72);
  for (let i=0;i<90;i++){ x.fillStyle='#fff'; x.fillRect(rnd()*128, rnd()*72, 1,1); }
  x.fillStyle='#d9884a'; x.beginPath(); x.arc(80,36,18,0,7); x.fill();
  x.fillStyle='#050818'; x.beginPath(); x.arc(88,32,16,0,7); x.fill();
}
export const tv = new T.Mesh(new T.PlaneGeometry(3.3, 1.7), new T.MeshBasicMaterial({map:new T.CanvasTexture(tvc)}));
tv.position.set(0, 2.3, -4.43);
room.add(tv);

const lamp = new T.PointLight(0xffb060, 1.3, 16);
lamp.position.set(-4.4, 3.2, 2.4);
room.add(lamp);
export { lamp };

/* --- table & floating items --- */
export const fl = [
  mkSlice(),
  bx(.3,.12,.8,0x222222,.8,.7,-.5),
  bx(1,.4,1,0xd0a040,-1.4,1.3,2.2),
  bx(.4,.5,.4,0xeeeeee,-.9,.9,-.7)
];
fl[0].scale.setScalar(.7);
fl[0].position.set(0,.9,-.6);
room.add(fl[0]);

/* --- floor / rug --- */
pl(12,10,tex(256,256,(x,w,h)=>{
  for (let i=0;i<16;i++){
    x.fillStyle = `hsl(28,${35+i%3*6}%,${30+(i*7%5)*3}%)`;
    x.fillRect(i*16,0,15,h);
    x.fillStyle='#0004'; x.fillRect(i*16+15,0,1,h);
    for (let j=0;j<4;j++) x.fillRect(i*16+((j*5+i*3)%12), (i*53+j*64)%h, 4,1);
  }
}),0,.06,0,0).rotation.x = -Math.PI/2;

pl(6,4,tex(256,170,(x,w,h)=>{
  x.fillStyle='#8a2f3a'; x.fillRect(0,0,w,h);
  x.strokeStyle='#e8c97a'; x.lineWidth=6; x.strokeRect(10,10,w-20,h-20);
  x.lineWidth=2;
  for (let i=0;i<7;i++){
    x.beginPath(); x.moveTo(30+i*32, h/2);
    x.lineTo(46+i*32, h/2-30); x.lineTo(62+i*32, h/2);
    x.lineTo(46+i*32, h/2+30); x.closePath(); x.stroke();
  }
}),0,.08,.6,0).rotation.x = -Math.PI/2;

/* --- wall art --- */
const pLand = tex(160,110,(x,w,h)=>{
  const g = x.createLinearGradient(0,0,0,h*.6);
  g.addColorStop(0,'#2a4a8a'); g.addColorStop(1,'#ffb070');
  x.fillStyle = g; x.fillRect(0,0,w,h);
  x.fillStyle='#ffe9a0'; x.beginPath(); x.arc(110,52,12,0,7); x.fill();
  x.fillStyle='#3a3a5a'; x.beginPath();
  x.moveTo(0,70); x.lineTo(35,35); x.lineTo(65,62); x.lineTo(100,28);
  x.lineTo(160,72); x.lineTo(160,110); x.lineTo(0,110); x.fill();
  x.fillStyle='#2b6fa0'; x.fillRect(0,78,w,32);
  x.fillStyle='#ffd7a0'; x.fillRect(100,80,20,2); x.fillRect(95,88,30,2);
});
const pAbs = tex(128,128,(x,w,h)=>{
  x.fillStyle='#f3e9d2'; x.fillRect(0,0,w,h);
  for (let i=0;i<14;i++){
    x.fillStyle = `hsl(${i*47%360},75%,55%)`;
    x.beginPath(); x.arc(rnd()*w, rnd()*h, 8+rnd()*22, 0,7); x.fill();
  }
  x.strokeStyle='#111'; x.lineWidth=3;
  x.beginPath(); x.moveTo(0,20); x.bezierCurveTo(40,120,90,-20,128,100); x.stroke();
});
const pPig = tex(100,128,(x,w,h)=>{
  x.fillStyle='#d8c9a3'; x.fillRect(0,0,w,h);
  x.fillStyle='#7d8798'; x.beginPath(); x.ellipse(50,100,32,34,0,0,7); x.fill();
  x.fillStyle='#8f99aa'; x.beginPath(); x.arc(50,56,20,0,7); x.fill();
  x.fillStyle='#e0a030'; x.beginPath(); x.moveTo(34,58); x.lineTo(20,64); x.lineTo(34,66); x.fill();
  x.fillStyle='#000'; x.fillRect(38,48,24,7);
  x.fillStyle='#fff'; x.fillRect(42,50,3,2);
  x.fillStyle='#6a4a2a'; x.font='9px serif'; x.fillText('The Philosopher', 10, 122);
});
art(pLand,2.2,1.5,-4.1,3.3,-4.86,0);
art(pAbs, 1.5,1.5, 4.3,3.2,-4.86,0);
art(pPig, 1.1,1.4, 5.86,3,-2.6,-Math.PI/2);
art(pLand,1.6,1.1,-5.86,3.2,3,Math.PI/2);

/* --- clock --- */
const clkG = new T.Group(); clkG.position.set(0,4.25,-4.84); room.add(clkG);
{ const fm = M(0xf5f1e6); rm.push(fm);
  clkG.add(new T.Mesh(new T.CircleGeometry(.45,24), fm));
  const rmm = M(0x3a2a1a); rm.push(rmm);
  clkG.add(new T.Mesh(new T.RingGeometry(.45,.52,24), rmm));
}
function hand(l, wd){
  const g = new T.Group();
  const m = M(0x111111); rm.push(m);
  const o = new T.Mesh(new T.BoxGeometry(wd, l, .02), m);
  o.position.y = l/2; g.add(o);
  g.position.z = .02;
  clkG.add(g);
  return g;
}
export const clkM = hand(.38,.03), clkH = hand(.26,.045);

/* --- dust --- */
const dg = new T.BufferGeometry();
const dp = new Float32Array(180);
for (let i=0;i<60;i++){
  dp[i*3]   = (rnd()-.5)*8;
  dp[i*3+1] = .5 + rnd()*4;
  dp[i*3+2] = (rnd()-.5)*8;
}
dg.setAttribute('position', new T.BufferAttribute(dp,3));
export const dust = new T.Points(dg, new T.PointsMaterial({color:0xfff0c0, size:.06, transparent:true, opacity:.55, depthWrite:false}));
room.add(dust);

/* --- skirting / trim --- */
bx(12,.35,.08,0xf2efe8,0,.18,-4.86);
bx(.08,.35,10,0xf2efe8,-5.86,.18,0);
bx(.08,.35,10,0xf2efe8,5.86,.18,0);
bx(11.8,.06,.06,0xf2efe8,0,1.3,-4.87);

/* --- TV stand / console --- */
bx(.55,1.5,.5,0x1a1a1a,-2.7,.75,-4.35);
bx(.55,1.5,.5,0x1a1a1a,2.7,.75,-4.35);
for (const sx of [-2.7, 2.7]){
  cy(.18,.18,.04,0x333333,sx,1.1,-4.08).rotation.x = Math.PI/2;
  cy(.1,.1,.04,0x333333,sx,.55,-4.08).rotation.x = Math.PI/2;
}
bx(.9,.1,.5,0x222222,-1.1,.98,-4.3);
bx(.05,.05,.05,0x40ff40,-.8,1.05,-4.05,{emissive:0x40ff40});

/* --- bookshelf --- */
bx(.06,3.2,2.6,0x4a2f1a,5.84,1.6,.4);
bx(.45,3.2,.06,0x5a3a22,5.62,1.6,-.9);
bx(.45,3.2,.06,0x5a3a22,5.62,1.6,1.7);
for (let i=0;i<4;i++){
  bx(.45,.06,2.6,0x6b4a2a,5.62,.45+i*.8,.4);
  for (let j=0;j<9;j++){
    const hb = .45 + rnd()*.2;
    bx(.25,hb,.2,[0xb23a3a,0x2f5a8a,0xd4b04a,0x3a7a4a,0x7a3a8a,0xe8e0d0][(i*9+j)%6], 5.62, .48+i*.8+hb/2, -.7+j*.25);
  }
}

/* --- tall shelf / display --- */
bx(.12,3.7,1.8,0x6b4a2a,5.84,1.85,3.3);
bx(.12,.08,.2,0xd4af37,5.74,1.8,2.6);
bx(.05,.22,.14,0xffffff,5.87,1.4,2);

/* --- side table with mug / lamp glow --- */
bx(.14,.8,1.8,0xf2f2f2,-5.8,.7,-2);

/* --- coffee table --- */
bx(1.1,.08,1.1,0xc99a5b,-.3,.64,-.6);
bx(1.1,.04,.9,0xc99a5b,-.3,.98,-1.18).rotation.x = -.95;

/* --- pizza slices (pizza.glb fallback) --- */
for (const q of [[-.45,-.5,.3],[-.1,-.7,2.2]]){
  const m = M(0xffc83d, {emissive:0x331a00}); rm.push(m);
  const o = new T.Mesh(gP, m);
  o.scale.setScalar(.38);
  o.position.set(q[0], .72, q[1]);
  o.rotation.y = q[2];
  room.add(o);
}

const can  = cy(.11,.11,.3,0xcfd2d6,.7,.82,-.3);
const can2 = cy(.11,.11,.3,0x2a6a3a,1,.7,-.75); can2.rotation.z = 1.4;
const crisps = bx(.4,.5,.12,0xe0302a,.45,.9,-.95); crisps.rotation.z = .25;
const mug = cy(.14,.12,.22,0xffffff,-.95,.75,-.4);
bx(.25,.07,.14,0x222222,-.8,.7,-.95);

/* --- pillows --- */
bx(.9,.9,.3,0xe07a5f,-1.7,1.55,2.75).rotation.z = .3;
bx(.9,.9,.3,0x3d8fa8,1.7,1.5,2.75).rotation.z = -.25;
bx(1.8,.07,1.2,0x2f8f7a,1.3,1.22,1.8).rotation.y = .3;

/* --- plant --- */
cy(.4,.3,.7,0xb5562c,4.9,.35,3.9);
for (let i=0;i<7;i++){
  const l = cy(0,.28,1.3,0x2f8f3a,4.9+Math.cos(i)*.15,1.2,3.9+Math.sin(i)*.15);
  l.rotation.z = Math.cos(i*1.9)*.5;
  l.rotation.x = Math.sin(i*1.9)*.5;
}

/* --- roof --- */
const roofG = new T.CylinderGeometry(0,.7071,1,4,1); roofG.rotateY(Math.PI/4);
const roofM = M(0x8a2f2a); rm.push(roofM);
export const roof = new T.Mesh(roofG, roofM);
roof.scale.set(13.5, 5, 11.5);
roof.position.set(0, 7.7, 0);
room.add(roof);
bx(1,3,1,0x6b3a2a,3,8.5,-1);

fl.push(can, crisps, mug);

/* === FIX: flb MUST be defined AFTER the last fl.push so it has one entry per item === */
export const flb = fl.map(o => o.position.clone());

/* --- extra details --- */
const pFam = tex(140,110,(x,w,h)=>{
  x.fillStyle='#3a3020'; x.fillRect(0,0,w,h);
  x.fillStyle='#c8b898'; x.fillRect(6,6,w-12,h-12);
  x.fillStyle='#a8c8e0'; x.fillRect(6,6,w-12,40);
  const cols = ['#e0b090','#c09060','#f0c0a0','#a07060'];
  for (let i=0;i<4;i++){
    x.fillStyle = cols[i];
    x.beginPath(); x.arc(30+i*28, 60, 10, 0,7); x.fill();
    x.fillStyle = cols[(i+2)%4];
    x.fillRect(24+i*28, 68, 14, 32);
  }
  x.fillStyle='#222'; x.fillRect(0,100,w,4);
});
const pKids = tex(120,140,(x,w,h)=>{
  x.fillStyle='#f4ecd8'; x.fillRect(0,0,w,h);
  x.strokeStyle='#e04040'; x.lineWidth=4;
  x.beginPath(); x.arc(60,50,26,0,7); x.stroke();
  for (let i=0;i<6;i++){
    x.beginPath();
    const a = i/6*6.28;
    x.moveTo(60+Math.cos(a)*26, 50+Math.sin(a)*26);
    x.lineTo(60+Math.cos(a)*46, 50+Math.sin(a)*46);
    x.stroke();
  }
  x.fillStyle='#3080e0';
  x.beginPath(); x.moveTo(30,110); x.lineTo(60,90); x.lineTo(90,110); x.lineTo(90,132); x.lineTo(30,132); x.fill();
  x.fillStyle='#e0a020'; x.fillRect(58,80,4,20);
  x.fillStyle='#ffe040'; x.beginPath(); x.arc(60,78,6,0,7); x.fill();
});
const pMirror = tex(80,110,(x,w,h)=>{
  const g = x.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#c8d8e8'); g.addColorStop(.5,'#e8f0f8'); g.addColorStop(1,'#a8c0d8');
  x.fillStyle = g; x.fillRect(0,0,w,h);
  x.strokeStyle='#8a6a4a'; x.lineWidth=4; x.strokeRect(2,2,w-4,h-4);
});

art(pFam,   1.4, 1.1, -2.6, 3.1, -4.86, 0);
art(pKids,  1.0, 1.2, -1.0, 3.05,-4.86, 0);
art(pMirror,.8,  1.1,  2.2, 3.0, -4.86, 0);
pl(4.4,3.0,tex(200,140,(x,w,h)=>{
  x.fillStyle='#8a3a3a'; x.fillRect(0,0,w,h);
  x.strokeStyle='#e0c8a0'; x.lineWidth=3; x.strokeRect(8,8,w-16,h-16);
  x.lineWidth=2; x.strokeRect(18,18,w-36,h-36);
  for (let i=0;i<8;i++){ x.beginPath(); x.arc(w/2,h/2,(i+1)*8,0,7); x.stroke(); }
}),0,.07,1.4,0).rotation.x = -Math.PI/2;

for (let i=0;i<4;i++) for (let j=0;j<11;j++){
  const hh = .32 + rnd()*.22;
  bx(.22,hh,.18,[0xb23a3a,0x2f5a8a,0xd4b04a,0x3a7a4a,0x7a3a8a,0xe8e0d0,0x4a2a1a][(i*11+j)%7], 5.62, .5+i*.8+hh/2, -.72+j*.22);
}

bx(.5,.06,.16,0x181818,1.2,.72,-.35).rotation.z=.15;
bx(.55,.1,.4,0xe8e0d0,.3,.72,-.35).rotation.y=.4;
bx(.02,.02,.35,0x303030,-.4,.72,-1.2).rotation.y=.3;
bx(.1,.03,.1,0xc0a040,.6,.72,-1.4);
bx(.35,.05,.2,0x2a2018,-.5,.72,-.3).rotation.y=-.2;

art(pFam, 1.0, .8, 3.4, 2.6, -4.86, 0);
bx(.15,.3,.06,0xf5f1e6,-2.4,1.6,-4.86);
bx(.2,.2,.06,0xf5f1e6,-1.0,1.6,-4.86);
bx(.16,.4,.06,0x2a2a2a,1.4,1.5,-4.86);
bx(.06,2.4,.06,0x5a3a22,-5.4,1.2,-4.5);
bx(.5,.15,.9,0x2a4a7a,-5.0,.1,-3.6);
bx(.5,.15,.9,0x2a2a2a,-5.0,.1,-2.4);

const catM = M(0xd9a05a); rm.push(catM);
const cat = new T.Mesh(new T.SphereGeometry(.3,10,8), catM);
cat.scale.set(1.4,.9,1); cat.position.set(1.4,1.2,2.2); room.add(cat);
const catHead = new T.Mesh(new T.SphereGeometry(.2,10,8), catM);
catHead.position.set(1.55,1.35,2.35); room.add(catHead);
[-1,1].forEach(sg => {
  const e = new T.Mesh(new T.ConeGeometry(.07,.18,4), catM);
  e.position.set(1.55+sg*.1, 1.52, 2.35); room.add(e);
});

const candleM = M(0xe8d0a0,{emissive:0x2a1a00}); rm.push(candleM);
const candle = new T.Mesh(new T.CylinderGeometry(.1,.1,.35,10), candleM);
candle.position.set(-1.4,1.5,2.1); room.add(candle);
const flameM = new T.MeshBasicMaterial({color:0xffd060}); rm.push(flameM);
const flame = new T.Mesh(new T.SphereGeometry(.05,6,5), flameM);
flame.position.set(-1.4,1.75,2.1); flame.scale.y = 1.8; room.add(flame);

bx(.5,.06,.5,0x222222,0,4.55,0);
bx(.04,.04,.04,0xffffff,0,4.51,0,{emissive:0xffffff});
bx(.06,2.2,.9,0x3a2a1a,-5.86,1.1,3.4);
bx(.06,2.2,.9,0x3a2a1a,5.86,1.1,-1.6);
for (let i=0;i<12;i++){
  const a = i/12*6.2832;
  bx(.04,.02,.06,0x222222, Math.cos(a)*.38, 4.25+Math.sin(a)*.38, -4.80);
}
bx(.04,.02,1.4,0x101010,1.8,.4,-4.84);

/* --- TV animation --- */
const tvx = tvc.getContext('2d');
let tvT = 0;
export function tvDraw(t){
  tvx.fillStyle = '#04071a'; tvx.fillRect(0,0,128,72);
  for (let i=0;i<70;i++){
    tvx.fillStyle = i%5 ? '#889' : '#fff';
    tvx.fillRect((i*47 + t*(4 + i%4*3)) % 128, (i*29)%58, 1,1);
  }
  const cx = 84, cy_ = 30;
  tvx.save();
  tvx.beginPath(); tvx.arc(cx,cy_,19,0,7); tvx.clip();
  tvx.fillStyle='#d9884a'; tvx.fillRect(cx-20,cy_-20,40,40);
  tvx.fillStyle='#b2582a';
  for (let k=-2;k<=2;k++) tvx.fillRect(cx-20, cy_+k*7-1+Math.sin(t+k)*2, 40,3);
  tvx.fillStyle='rgba(2,4,16,.8)';
  tvx.beginPath(); tvx.arc(cx+12+Math.sin(t*.3)*3, cy_-4, 19, 0,7); tvx.fill();
  tvx.restore();
  tvx.strokeStyle='#e8c9a0'; tvx.lineWidth=1;
  tvx.beginPath(); tvx.ellipse(cx,cy_,30,6,-.3,0,7); tvx.stroke();
  tvx.fillStyle='rgba(0,0,0,.65)'; tvx.fillRect(6,58,116,10);
  tvx.fillStyle='#fff'; tvx.font='7px sans-serif';
  tvx.fillText(t%8<4 ? '...and the universe is still expanding...' : '...so where does it all go, really?', 10, 65.5);
  tv.material.map.needsUpdate = true;
}
export function tickTV(dt, running){
  if (!running) return;
  tvT += dt;
  if (tvT > .1){ tvT = 0; tvDraw(Date.now()/1000); }
}

export function rebuildTablePizza(){
  if (!fl[0]) return;
  fl[0].remove(...fl[0].children);
  fl[0].add(...mkSlice().children);
             }
