import { T, rnd } from './utils.js';
import { G } from './game.js';
import { S, cam } from './scene.js';

/* ---------- CELESTIAL BODIES ---------- */
export const celest = new T.Group();
S.add(celest);

export const moon = new T.Mesh(new T.SphereGeometry(900,24,16), new T.MeshBasicMaterial({color:0xdfe3ee, fog:false}));
moon.position.set(-5000,7000,-16000);
celest.add(moon);

export const pl2 = new T.Mesh(new T.SphereGeometry(1600,24,16), new T.MeshBasicMaterial({color:0x9a5be0, fog:false}));
pl2.position.set(11000,5000,-22000);
{
  const r = new T.Mesh(new T.RingGeometry(2200,3600,48), new T.MeshBasicMaterial({color:0xe0b0ff, side:T.DoubleSide, transparent:true, opacity:.55, fog:false}));
  r.rotation.x = 1.2; r.rotation.y = .3; pl2.add(r);
}
celest.add(pl2);

export const planetRed   = new T.Mesh(new T.SphereGeometry(1200,24,16), new T.MeshBasicMaterial({color:0xc04a2a, fog:false}));
planetRed.position.set(-8000,3000,-18000); celest.add(planetRed);

export const planetBlue  = new T.Mesh(new T.SphereGeometry(1400,24,16), new T.MeshBasicMaterial({color:0x3a6ad0, fog:false}));
planetBlue.position.set(15000,-4000,-25000); celest.add(planetBlue);

export const planetGreen = new T.Mesh(new T.SphereGeometry(900,20,14), new T.MeshBasicMaterial({color:0x40a070, fog:false}));
planetGreen.position.set(-12000,-2000,-30000); celest.add(planetGreen);

export const star1 = new T.Mesh(new T.SphereGeometry(800,16,12), new T.MeshBasicMaterial({color:0xffd040, fog:false}));
star1.position.set(8000,8000,-35000); celest.add(star1);

export const star2 = new T.Mesh(new T.SphereGeometry(500,16,12), new T.MeshBasicMaterial({color:0xffa040, fog:false}));
star2.position.set(9000,7500,-35000); celest.add(star2);

export const bhCore = new T.Mesh(new T.SphereGeometry(500,16,12), new T.MeshBasicMaterial({color:0x000000, fog:false}));
bhCore.position.set(-16000,5000,-40000); celest.add(bhCore);

export const bhDisk = new T.Mesh(new T.RingGeometry(600,1500,48), new T.MeshBasicMaterial({color:0xff60a0, side:T.DoubleSide, transparent:true, opacity:.7, fog:false, blending:T.AdditiveBlending, depthWrite:false}));
bhDisk.position.copy(bhCore.position);
bhDisk.rotation.x = 1.1;
celest.add(bhDisk);

/* ---------- EARTH ---------- */
const ec = document.createElement('canvas');
ec.width = 1024; ec.height = 512;
{
  const x = ec.getContext('2d');
  const g = x.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#1b4a8a'); g.addColorStop(.5,'#1f6fb5'); g.addColorStop(1,'#1b4a8a');
  x.fillStyle = g; x.fillRect(0,0,1024,512);
  for (let i=0;i<70;i++){
    x.fillStyle = ['#3f8a3a','#5a9a40','#9a8a4a','#2f7a3a'][i%4];
    x.beginPath(); x.ellipse(rnd()*1024, 90+rnd()*330, 15+rnd()*60, 10+rnd()*30, rnd()*3, 0,7); x.fill();
  }
  x.fillStyle = '#f4f8ff'; x.fillRect(0,0,1024,24); x.fillRect(0,490,1024,22);
  x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 5;
  for (let i=0;i<60;i++){
    x.beginPath();
    const y = 40+rnd()*430, x0 = rnd()*1024;
    x.moveTo(x0, y);
    x.quadraticCurveTo(x0+60, y-15, x0+130, y+4);
    x.stroke();
  }
}

export const earth = new T.Mesh(new T.SphereGeometry(8000,64,40), new T.MeshBasicMaterial({map:new T.CanvasTexture(ec), fog:false, transparent:true}));
earth.position.set(50,-8000.5,51);
earth.visible = false;
S.add(earth);

export const atm = new T.Mesh(new T.SphereGeometry(8180,48,32), new T.MeshBasicMaterial({color:0x5ab4ff, transparent:true, opacity:.3, side:T.BackSide, fog:false, depthWrite:false, blending:T.AdditiveBlending}));
atm.position.copy(earth.position);
atm.visible = false;
S.add(atm);

/* ---------- AURORA ---------- */
export const auroraMat  = new T.MeshBasicMaterial({color:0x60ffc0, transparent:true, opacity:0, side:T.DoubleSide, blending:T.AdditiveBlending, depthWrite:false, fog:false});
const auroraG = new T.PlaneGeometry(3000,400,24,4);
export const aurora = new T.Mesh(auroraG, auroraMat);
aurora.frustumCulled = false; S.add(aurora);

export const auroraMat2 = auroraMat.clone();
auroraMat2.color.setHex(0xc060ff);
export const aurora2 = new T.Mesh(auroraG, auroraMat2);
aurora2.rotation.z = .4;
aurora2.frustumCulled = false; S.add(aurora2);

/* ---------- SHOOTING STARS ---------- */
const NS_STAR = 8;
const shooters = [];
const shootGeo = new T.BufferGeometry();
const shootPos = new Float32Array(NS_STAR*6);
shootGeo.setAttribute('position', new T.BufferAttribute(shootPos, 3));
const shootMat = new T.LineBasicMaterial({color:0xffffff, transparent:true, opacity:.9, fog:false});
export const shooterLines = new T.LineSegments(shootGeo, shootMat);
shooterLines.frustumCulled = false;
celest.add(shooterLines);

for (let i=0;i<NS_STAR;i++) shooters.push({t:0,life:0,x:0,y:0,z:0,dx:0,dy:0,dz:0});

export function spawnShooter(){
  if (G.alt < 2000) return;
  const s = shooters.find(o => o.life <= 0);
  if (!s) return;
  const side = Math.random()<.5 ? -1 : 1;
  s.life = .6 + Math.random()*.6;
  s.t = 0;
  s.x = G.P.x + side*(300 + Math.random()*400);
  s.y = G.P.y + 150 + Math.random()*200;
  s.z = G.P.z - 500 - Math.random()*500;
  s.dx = -side*(1400 + Math.random()*600);
  s.dy = -(300 + Math.random()*400);
  s.dz = -(200 + Math.random()*400);
}

export function tickSpace(dt){
  /* shooting stars */
  if (G.alt > 2000 && Math.random() < .02) spawnShooter();
  for (const s of shooters){
    if (s.life > 0){
      s.t += dt; s.life -= dt;
      s.x += s.dx*dt; s.y += s.dy*dt; s.z += s.dz*dt;
    }
  }
  let n = 0;
  for (const s of shooters){
    if (s.life > 0){
      shootPos[n++] = s.x; shootPos[n++] = s.y; shootPos[n++] = s.z;
      shootPos[n++] = s.x - s.dx*.06;
      shootPos[n++] = s.y - s.dy*.06;
      shootPos[n++] = s.z - s.dz*.06;
    }
  }
  shootGeo.setDrawRange(0, n/3);
  shootGeo.attributes.position.needsUpdate = true;

  /* comet */
  cometT -= dt;
  if (cometT <= 0){
    comet.visible = true;
    comet.position.set(G.P.x+1500, G.P.y+400, G.P.z-2600);
    cometT = 45 + Math.random()*40;
  }
  if (comet.visible){
    comet.position.x -= 25*dt;
    comet.position.z += 10*dt;
    if (Math.abs(comet.position.x - G.P.x) > 2500) comet.visible = false;
  }

  /* celestial visibility */
  pl2.visible = G.alt > 800;
  planetRed.visible   = G.alt > 1800;
  planetBlue.visible  = G.alt > 2200;
  planetGreen.visible = G.alt > 2600;
  star1.visible = star2.visible = G.alt > 3000;
  bhCore.visible = bhDisk.visible = G.alt > 3400;

  const ef = Math.max(0, Math.min(1, (G.alt-1100)/(1900-1100)));
  earth.visible = atm.visible = ef > .01;
  earth.material.opacity = ef;
  earth.material.color.setScalar(.4 + .6*Math.max(0, Math.min(1, (G.alt-900)/(2300-900))));
  atm.material.opacity = .3*ef;

  celest.position.copy(cam.position).multiplyScalar(.97);
}

/* ---------- COMET ---------- */
export const comet = new T.Group();
const cometHead = new T.Mesh(new T.SphereGeometry(20,8,6), new T.MeshBasicMaterial({color:0xd8f0ff, fog:false}));
comet.add(cometHead);
const cometTail = new T.Mesh(new T.ConeGeometry(30,300,8), new T.MeshBasicMaterial({color:0x90c8ff, transparent:true, opacity:.35, fog:false, blending:T.AdditiveBlending, depthWrite:false}));
cometTail.rotation.x = Math.PI/2;
cometTail.position.z = 150;
comet.add(cometTail);
comet.visible = false;
celest.add(comet);
export let cometT = 30;
export function setCometT(v){ cometT = v; }
