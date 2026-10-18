import { T, rnd, M } from './utils.js';
import { G } from './game.js';
import { S } from './scene.js';
import { say, QUOTES } from './ui.js';
import { burst } from './audio.js';

/* ---------- PIGEON ---------- */
export const pig = new T.Group();
{
  const b = new T.Mesh(new T.SphereGeometry(1.4,10,8), M(0x8a93a6)); b.scale.z = 1.4; pig.add(b);
  const h = new T.Mesh(new T.SphereGeometry(.8,10,8), M(0x6d778c)); h.position.set(0,1,-1.6); pig.add(h);
  const gl = new T.Mesh(new T.BoxGeometry(1.4,.35,.3), M(0x000000)); gl.position.set(0,1.2,-2.25); pig.add(gl);
  const bk = new T.Mesh(new T.ConeGeometry(.25,.8,6), M(0xf0b040)); bk.rotation.x = -Math.PI/2; bk.position.set(0,.9,-2.5); pig.add(bk);
  for (const s of [-1,1]){
    const w = new T.Group(); w.position.set(s*1,.4,0);
    const m = new T.Mesh(new T.BoxGeometry(2.4,.12,1.4), M(0x777f93)); m.position.x = s*1.2; w.add(m);
    pig.add(w); pig.userData['w'+s] = w;
  }
}
pig.visible = false;
pig.scale.setScalar(1.3);
S.add(pig);
export let pigT = 22, pigSaid = false, qi = 0;

export function tickPigeon(dt){
  pigT -= dt;
  if (pigT <= 0 && !pig.visible){
    pig.visible = true; pigSaid = false;
    const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);
    pig.position.set(
      G.P.x + fx * 300 + (rnd() < .5 ? -22 : 22),
      G.P.y + 4,
      G.P.z + fz * 300
    );
    pigT = 30;
  }
  if (!pig.visible) return;
  const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);
  pig.position.x -= fx * 28 * dt;
  pig.position.z -= fz * 28 * dt;
  pig.position.y += Math.sin(G.tt*2)*.05;
  pig.userData.w1.rotation.z  =  Math.sin(G.tt*14)*.6;
  pig.userData['w-1'].rotation.z = -Math.sin(G.tt*14)*.6;

  const dx = pig.position.x - G.P.x;
  const dz = pig.position.z - G.P.z;
  const alongF = dx * fx + dz * fz;
  if (!pigSaid && alongF < 70 && alongF > -20){
    pigSaid = true;
    say('Pigeon: ' + QUOTES[qi++ % QUOTES.length], 4.5);
  }
  if (alongF < -50) pig.visible = false;
}

/* ---------- BIRDS ---------- */
const BT = [
  {c:0x8a6a4a,w:0x6a4a2a,s:.55,f:24,v:24,n:9},
  {c:0xf4f4f4,w:0xcfd5dc,s:1.2,f:7,v:19,n:6},
  {c:0x14141a,w:0x0b0b10,s:1.1,f:9,v:21,n:6},
  {c:0x6a4a2e,w:0x3e2a1a,s:2.6,f:1.6,v:17,n:2},
  {c:0x2fd04a,w:0xffd23a,s:.9,f:12,v:23,n:7},
  {c:0x2a3f8a,w:0x5a7fdc,s:.35,f:38,v:30,n:12},
  {c:0xc0783a,w:0x8a5a2a,s:1.9,f:5,v:22,n:2}
];
const bgW = new T.BoxGeometry(2.2,.07,.8);
const bgS = new T.SphereGeometry(.5,6,5);
const bgC = new T.ConeGeometry(.12,.4,5);
export const birds = [];
let birdT = 3;

for (let i=0;i<60;i++){
  const g = new T.Group();
  const mb = M(0xffffff), mw = M(0xffffff);
  const b0 = new T.Mesh(bgS, mb); b0.scale.set(.7,.6,1.5); g.add(b0);
  const hd = new T.Mesh(bgS, mb); hd.scale.setScalar(.5); hd.position.set(0,.2,-.8); g.add(hd);
  const bk = new T.Mesh(bgC, M(0xf0a020)); bk.rotation.x = -Math.PI/2; bk.position.set(0,.18,-1.1); g.add(bk);
  const tl = new T.Mesh(new T.BoxGeometry(.5,.05,.6), mw); tl.position.z = .95; g.add(tl);
  const w = [-1,1].map(sg => {
    const q = new T.Group(); q.position.set(sg*.3,.1,0);
    const m = new T.Mesh(bgW, mw); m.position.x = sg*1.1;
    q.add(m); g.add(q);
    return q;
  });
  g.visible = false; S.add(g);
  birds.push({ g, mb, mw, w, v:new T.Vector3(), f:10, t:0, ti:0, on:false });
}

function spawnFlock(){
  const pool = G.alt < 400 ? [0,1,1,2,0,3,5,5]
             : G.alt < 1500 ? [1,2,3,4,0,4,5,6]
             : [3,4,4,5];
  const ti = pool[rnd()*pool.length|0], ty = BT[ti];
  const side = rnd()<.5 ? -1 : 1;
  const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);
  const px = G.P.x + fx*(250+rnd()*120) + fz*side*(110+rnd()*120);
  const py = G.P.y + (rnd()-.4)*70;
  const pz = G.P.z + fz*(250+rnd()*120) - fx*side*(110+rnd()*120);
  const vz = fz * ty.v;
  const vx = fx * ty.v;
  for (let k=0;k<ty.n;k++){
    const b = birds.find(q => !q.on);
    if (!b) return;
    b.on = true; b.g.visible = true;
    b.mb.color.setHex(ty.c); b.mw.color.setHex(ty.w);
    b.f = ty.f; b.ti = ti;
    b.g.scale.setScalar(ty.s*1.6);
    b.v.set(vx,0,vz);
    b.g.position.set(px + (k%2?1:-1)*k*4, py + (rnd()-.5)*6, pz + k*5);
    b.g.rotation.y = Math.atan2(vx, vz) + Math.PI;
    b.t = rnd()*6;
  }
}

export function tickBirds(dt){
  birdT -= dt;
  if (birdT <= 0){
    if (G.alt < 2000) spawnFlock();
    birdT = 2 + rnd()*3;
  }
  for (const b of birds){
    if (!b.on) continue;
    b.t += dt*b.f;
    const g = b.g, a = b.ti === 3 ? .22 : .75;
    g.position.addScaledVector(b.v, dt);
    b.w[0].rotation.z =  Math.sin(b.t)*a;
    b.w[1].rotation.z = -Math.sin(b.t)*a;
    g.position.y += Math.cos(b.t)*.03;

    const dx = g.position.x - G.P.x;
    const dz = g.position.z - G.P.z;
    const behind = -(dx * Math.sin(G.P.yaw) + dz * -Math.cos(G.P.yaw));
    if (behind > 60 || behind < -900 || Math.abs(g.position.y - G.P.y) > 450){
      b.on = false; g.visible = false;
    }
  }
}

/* ---------- FLYBYS ---------- */
function mkHero(){
  const g = new T.Group();
  const bl = M(0x1d4fd0), rd = M(0xc41818), sk = M(0xe6b08c);
  const a = (geo,m,x,y,z,p) => { const o = new T.Mesh(geo,m); o.position.set(x,y,z); (p||g).add(o); return o; };
  a(new T.BoxGeometry(.7,.45,1.3), bl, 0,0,0);
  a(new T.BoxGeometry(.72,.2,.4), rd, 0,0,.55);
  a(new T.SphereGeometry(.28,8,6), sk, 0,.04,-.95);
  a(new T.SphereGeometry(.3,8,6), M(0x111111), 0,.1,-.85).scale.set(1,.7,1);
  [-1,1].forEach(sg => {
    a(new T.BoxGeometry(.2,.2,1.1), bl, sg*.15,0,-1.5);
    a(new T.SphereGeometry(.12,6,5), sk, sg*.15,0,-2.1);
    a(new T.BoxGeometry(.24,.24,1.1), bl, sg*.17,0,1.15);
    a(new T.BoxGeometry(.28,.28,.4), rd, sg*.17,0,1.85);
  });
  const cape = new T.Group(); cape.position.set(0,.2,-.4); g.add(cape);
  a(new T.BoxGeometry(1.3,.05,2.6), rd, 0,0,1.3, cape);
  g.userData.cape = cape;
  g.scale.setScalar(2.4);
  return g;
}

function mkPlane(){
  const g = new T.Group();
  const w = M(0xf0f2f5,{emissive:0x202226});
  const a = (geo,m,x,y,z) => { const o = new T.Mesh(geo,m); o.position.set(x,y,z); g.add(o); return o; };
  a(new T.CylinderGeometry(1.8,1.8,26,10), w, 0,0,0).rotation.x = Math.PI/2;
  a(new T.ConeGeometry(1.8,5,10), w, 0,0,-15.5).rotation.x = -Math.PI/2;
  a(new T.BoxGeometry(34,.4,6), M(0xd6dae0), 0,-.6,1);
  a(new T.BoxGeometry(.4,5,4), M(0x2a5ac8), 0,3.5,11.5);
  a(new T.BoxGeometry(10,.3,3), M(0xd6dae0), 0,.5,11.5);
  [-9,9].forEach(x => a(new T.CylinderGeometry(.9,.9,3.5,8), M(0x888888), x,-1.5,-.5).rotation.x = Math.PI/2);
  g.userData.l1 = a(new T.SphereGeometry(.5,6,5), new T.MeshBasicMaterial({color:0xff2020}), -17,-.4,2);
  g.userData.l2 = a(new T.SphereGeometry(.5,6,5), new T.MeshBasicMaterial({color:0x20ff40}), 17,-.4,2);
  g.scale.setScalar(1.3);
  return g;
}

function mkUfo(){
  const g = new T.Group();
  const d = new T.Mesh(new T.SphereGeometry(1,16,10), M(0xb4bccc,{emissive:0x303844}));
  d.scale.set(6,1.3,6); g.add(d);
  const dm = new T.Mesh(new T.SphereGeometry(2.2,12,8,0,6.28,0,1.57), new T.MeshBasicMaterial({color:0x66ffdd, transparent:true, opacity:.7}));
  dm.position.y = .8; g.add(dm);
  const rg = new T.Group();
  for (let i=0;i<8;i++){
    const l = new T.Mesh(new T.SphereGeometry(.45,6,5), new T.MeshBasicMaterial({color:[0xff4040,0xffe040,0x40ff80,0x40a0ff][i%4]}));
    const a = i*.785;
    l.position.set(Math.cos(a)*5.3, -.2, Math.sin(a)*5.3);
    rg.add(l);
  }
  g.add(rg); g.userData.ring = rg;
  g.scale.setScalar(1.6);
  return g;
}

function mkHeli(){
  const g = new T.Group();
  const w = M(0x303a48);
  const a = (geo,m,x,y,z) => { const o = new T.Mesh(geo,m); o.position.set(x,y,z); g.add(o); return o; };
  a(new T.SphereGeometry(1.6,10,8), w, 0,0,0).scale.set(1,.9,1.6);
  a(new T.BoxGeometry(.4,3,.4), M(0x222222), 0,1.5,2);
  a(new T.BoxGeometry(8,.08,.8), M(0x111111), 0,3.1,2);
  a(new T.BoxGeometry(.4,3,.4), M(0x222222), 0,-.4,-2);
  a(new T.BoxGeometry(3,.06,.3), M(0x111111), 0,-.6,-2.2);
  a(new T.BoxGeometry(2.4,.06,.5), M(0xff4040), 0,-1.6,0);
  return g;
}

export const hero  = mkHero();
export const plane = mkPlane();
export const ufo   = mkUfo();
export const heli  = mkHeli();
[hero, plane, ufo, heli].forEach(o => { o.visible = false; S.add(o); });

let fbT = 14, heroOn = false, planeOn = false, ufoOn = false, heliOn = false;
let heroSaid = false, ufoSaid = false, heliT = 40;
let planeVelX = 0;

function spawnFly(){
  const r = rnd(), sd = rnd()<.5 ? -1 : 1;
  const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);
  const rx = Math.cos(G.P.yaw), rz = Math.sin(G.P.yaw);

  if (r < .58 && G.alt < 2400 && !heroOn){
    heroOn = true; heroSaid = false; hero.visible = true;
    hero.position.set(
      G.P.x + fx * 80 + rx * sd * 18,
      G.P.y + (rnd()-.5)*10,
      G.P.z + fz * 80 + rz * sd * 18
    );
  } else if (r < .78 && G.alt > 100 && G.alt < 1700 && !planeOn){
    planeOn = true; plane.visible = true;
    plane.position.set(
      G.P.x - rx * sd * 420,
      G.P.y + (rnd()-.3)*50,
      G.P.z - rz * sd * 380
    );
    planeVelX = sd * 85;
    plane.rotation.y = -Math.PI/2 * sd;
  } else if (G.alt > 400 && !ufoOn){
    ufoOn = true; ufoSaid = false; ufo.visible = true;
    ufo.position.set(
      G.P.x - rx * sd * 500,
      G.P.y + rnd()*60,
      G.P.z - rz * sd * 420
    );
    ufo.userData.vx = sd * 40;
  }
}

export function tickFlybys(dt){
  fbT -= dt;
  if (fbT <= 0){ spawnFly(); fbT = 15 + rnd()*16; }

  const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);

  if (heroOn){
    /* Fixed 280 m/s — no longer scaled to player speed.
       At base speed (~60) he still blasts past you.
       At full boost (~780) you outrun him and he recedes behind. */
    hero.position.x -= fx * 280 * dt;
    hero.position.z -= fz * 280 * dt;
    hero.userData.cape.rotation.x = Math.sin(G.tt*16)*.12;
    hero.rotation.z = Math.sin(G.tt*2)*.1;

    const dx = hero.position.x - G.P.x;
    const dz = hero.position.z - G.P.z;
    const alongF = dx * fx + dz * fz;

    if (!heroSaid && alongF < 30){
      heroSaid = true;
      say('Dave: "...was that a bloke in a cape? Show-off."', 3.5);
      burst(.8, 2500, .3);
    }
    if (alongF < -900){ heroOn = false; hero.visible = false; }
  }

  if (planeOn){
    const rx = Math.cos(G.P.yaw), rz = Math.sin(G.P.yaw);
    plane.position.x += rx * planeVelX * dt;
    plane.position.z += rz * planeVelX * dt;
    plane.userData.l1.visible = plane.userData.l2.visible = Math.sin(G.tt*8) > 0;

    const dx = plane.position.x - G.P.x;
    const dz = plane.position.z - G.P.z;
    if (Math.hypot(dx, dz) > 700){ planeOn = false; plane.visible = false; }
  }

  if (ufoOn){
    const rx = Math.cos(G.P.yaw), rz = Math.sin(G.P.yaw);
    ufo.position.x += rx * ufo.userData.vx * dt;
    ufo.position.z += rz * ufo.userData.vx * dt;
    ufo.position.y += Math.sin(G.tt*2)*.1;
    ufo.userData.ring.rotation.y += dt*3;

    const dx = ufo.position.x - G.P.x;
    const dz = ufo.position.z - G.P.z;
    const alongF = dx * fx + dz * fz;
    if (!ufoSaid && alongF < 60){
      ufoSaid = true;
      say('Dave: "Aliens. Course there are."', 3);
    }
    if (alongF < -300 || Math.hypot(dx, dz) > 800){ ufoOn = false; ufo.visible = false; }
  }

  heliT -= dt;
  if (heliT <= 0 && !heliOn && G.alt < 1600){
    heliOn = true; heli.visible = true;
    const rx = Math.cos(G.P.yaw), rz = Math.sin(G.P.yaw);
    const sd = Math.random()<.5 ? -1 : 1;
    heli.position.set(
      G.P.x - rx * sd * 400,
      G.P.y + 50,
      G.P.z - rz * sd * 300
    );
    heli.userData.sd = sd;
  }
  if (heliOn){
    const rx = Math.cos(G.P.yaw), rz = Math.sin(G.P.yaw);
    heli.position.x += rx * heli.userData.sd * 55 * dt;
    heli.position.z += rz * heli.userData.sd * 55 * dt;
    heli.position.y += Math.sin(G.tt)*.1;
    const rotor = heli.children[2];
    rotor.rotation.y += dt*40;

    const dx = heli.position.x - G.P.x;
    const dz = heli.position.z - G.P.z;
    if (Math.hypot(dx, dz) > 700){
      heliOn = false; heli.visible = false; heliT = 40 + Math.random()*30;
    }
  }
}

export function resetFlybys(){
  hero.visible = plane.visible = ufo.visible = heli.visible = false;
  heroOn = planeOn = ufoOn = heliOn = false;
  fbT = 14;
}

export function resetBirds(){
  birds.forEach(b => { b.on = false; b.g.visible = false; });
  birdT = 3;
}

export function resetPigeon(){
  pig.visible = false; pigT = 22;
      }
