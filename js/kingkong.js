import { T, rnd } from './utils.js';
import { G } from './game.js';
import { S } from './scene.js';
import { banner } from './ui.js';

function MNF(c, o){ return new T.MeshLambertMaterial(Object.assign({color:c, fog:false}, o||{})); }
function MNB(c, o){ return new T.MeshBasicMaterial(Object.assign({color:c, fog:false}, o||{})); }

function mkMesh(geo, mat, x=0, y=0, z=0){
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function towerTexture(){
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1024;
  const x = c.getContext('2d');
  x.fillStyle = '#8a6a5a'; x.fillRect(0, 0, 256, 1024);
  const cols = 6, rows = 12;
  const cw = 256 / cols, ch = 1024 / rows;
  for (let r = 0; r < rows; r++){
    for (let cc = 0; cc < cols; cc++){
      const wx = cc * cw + cw * .20;
      const wy = r * ch + ch * .25;
      const ww = cw * .60, wh = ch * .50;
      const rv = Math.random();
      let color;
      if (rv < 0.1) color = '#ff7733';
      else if (rv < 0.5) color = '#ffcc66';
      else color = '#1a1a2a';
      x.fillStyle = color;
      x.fillRect(wx, wy, ww, wh);
    }
  }
  x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 1;
  for (let r = 0; r <= rows; r++){
    x.beginPath(); x.moveTo(0, r*ch); x.lineTo(256, r*ch); x.stroke();
  }
  return new T.CanvasTexture(c);
}

function buildTower(){
  const g = new T.Group();
  const tex = towerTexture();
  const towerMat = new T.MeshLambertMaterial({map: tex, fog: false});
  const dark = MNF(0x4a3a30);
  let y = 0, w = 34;
  for (let tier = 0; tier < 10; tier++){
    const h = 60;
    const box = new T.Mesh(new T.BoxGeometry(w, h, w), towerMat);
    box.position.set(0, y + h/2, 0);
    g.add(box);
    y += h;
    w *= 0.93;
  }
  g.add(mkMesh(new T.CylinderGeometry(0.5, 5, 50, 8), dark, 0, y + 25, 0));
  g.add(mkMesh(new T.SphereGeometry(3, 10, 10), MNB(0xff3030), 0, y + 52, 0));

  const fires = [];
  for (let i = 0; i < 10; i++){
    const fy = 80 + i * 55 + rnd() * 30;
    const fw = 34 * Math.pow(0.93, Math.floor(fy / 60));
    const fMat = new T.MeshBasicMaterial({color: 0xff5522, transparent: true, opacity: 0.9, fog: false});
    const f = new T.Mesh(new T.SphereGeometry(3, 8, 8), fMat);
    const side = rnd() < 0.5 ? 1 : -1;
    const which = rnd() < 0.5 ? 'x' : 'z';
    if (which === 'x'){
      f.position.set(side * (fw/2 + 1), fy, (rnd() - 0.5) * fw * 0.5);
    } else {
      f.position.set((rnd() - 0.5) * fw * 0.5, fy, side * (fw/2 + 1));
    }
    g.add(f);
    fires.push(fMat);
  }

  const beacon = new T.PointLight(0xff3030, 3, 400);
  beacon.position.set(0, y + 52, 0);
  g.add(beacon);

  g.userData = { fires, height: y + 52, beacon };
  return g;
}

function buildKong(){
  const g = new T.Group();
  const fur = MNF(0x4a3a28);
  const furDark = MNF(0x2a1a10);
  const skin = MNF(0x7a6a5a);

  g.add(mkMesh(new T.SphereGeometry(2.2, 14, 10), fur, 0, 0, 0)).scale.set(1.3, 1.5, 1.1);
  g.add(mkMesh(new T.SphereGeometry(1.6, 10, 8), skin, 0, 0.1, 1.0)).scale.set(1, 1.2, 0.4);

  g.add(mkMesh(new T.SphereGeometry(1.4, 14, 12), fur, 0, 2.7, 0));
  g.add(mkMesh(new T.SphereGeometry(1.05, 10, 8), skin, 0, 2.6, 0.75)).scale.set(1, 0.9, 0.6);
  g.add(mkMesh(new T.BoxGeometry(2.0, 0.35, 0.5), furDark, 0, 2.9, 0.95));
  g.add(mkMesh(new T.SphereGeometry(0.22, 8, 8), MNB(0xffee00), -0.4, 2.75, 1.4));
  g.add(mkMesh(new T.SphereGeometry(0.22, 8, 8), MNB(0xffee00), 0.4, 2.75, 1.4));
  g.add(mkMesh(new T.SphereGeometry(0.10, 6, 6), MNB(0x000000), -0.4, 2.75, 1.58));
  g.add(mkMesh(new T.SphereGeometry(0.10, 6, 6), MNB(0x000000), 0.4, 2.75, 1.58));
  g.add(mkMesh(new T.BoxGeometry(1.0, 0.2, 0.3), MNB(0x220000), 0, 2.3, 1.45));
  for (let i = -1; i <= 1; i++){
    g.add(mkMesh(new T.BoxGeometry(0.18, 0.25, 0.1), MNB(0xffffcc), i*0.3, 2.25, 1.55));
  }

  const makeArm = (side) => {
    const shoulder = new T.Group();
    shoulder.position.set(side * 2.0, 1.2, 0);
    shoulder.add(mkMesh(new T.SphereGeometry(0.7, 10, 8), fur));
    shoulder.add(mkMesh(new T.CylinderGeometry(0.6, 0.5, 2.4, 8), fur, 0, -1.2, 0));
    const elbow = new T.Group();
    elbow.position.set(0, -2.4, 0);
    shoulder.add(elbow);
    elbow.add(mkMesh(new T.SphereGeometry(0.5, 8, 8), fur));
    elbow.add(mkMesh(new T.CylinderGeometry(0.5, 0.45, 2, 8), fur, 0, -1, 0));
    elbow.add(mkMesh(new T.SphereGeometry(0.7, 8, 8), skin, 0, -2.1, 0));
    g.add(shoulder);
    return { shoulder, elbow };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  const makeLeg = (side) => {
    const hip = new T.Group();
    hip.position.set(side * 0.9, -2, 0);
    hip.add(mkMesh(new T.CylinderGeometry(0.7, 0.6, 2, 8), fur, 0, -1, 0));
    const knee = new T.Group();
    knee.position.set(0, -2, 0);
    hip.add(knee);
    knee.add(mkMesh(new T.SphereGeometry(0.6, 8, 8), fur));
    knee.add(mkMesh(new T.CylinderGeometry(0.6, 0.5, 1.8, 8), fur, 0, -0.9, 0));
    knee.add(mkMesh(new T.BoxGeometry(1.2, 0.5, 1.8), skin, 0, -1.9, 0.35));
    g.add(hip);
    return { hip, knee };
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  g.scale.setScalar(4);
  g.userData = { armL, armR, legL, legR };
  return g;
}

function buildFighter(){
  const g = new T.Group();
  const body = MNF(0x5a6a4a);
  const bodyLight = MNF(0x8a9a6a);
  const propM = MNF(0x222222);

  const fus = mkMesh(new T.CylinderGeometry(0.35, 0.25, 3.5, 8), body);
  fus.rotation.x = Math.PI/2;
  g.add(fus);
  g.add(mkMesh(new T.BoxGeometry(3.6, 0.15, 1.0), bodyLight));
  g.add(mkMesh(new T.BoxGeometry(1.0, 0.15, 0.6), bodyLight, 0, 0, 1.5));
  g.add(mkMesh(new T.BoxGeometry(0.15, 0.7, 0.6), bodyLight, 0, 0.35, 1.5));
  g.add(mkMesh(new T.SphereGeometry(0.4, 8, 6), MNB(0x88ccff), 0, 0.28, 0.25)).scale.set(1, 0.7, 1.2);

  const prop = new T.Group();
  prop.position.set(0, 0, -1.9);
  prop.add(mkMesh(new T.BoxGeometry(0.12, 2.4, 0.12), propM));
  prop.add(mkMesh(new T.BoxGeometry(2.4, 0.12, 0.12), propM));
  g.add(prop);
  g.userData.prop = prop;
  g.scale.setScalar(4);
  return g;
}

export const kk = new T.Group();
kk.position.set(120, 0, -450);
kk.visible = false;
S.add(kk);

const tower = buildTower();
kk.add(tower);
const TOWER_H = tower.userData.height;

const kong = buildKong();
kong.position.set(0, 200, 16);
kk.add(kong);

const planes = [];
for (let i = 0; i < 3; i++){
  const p = buildFighter();
  p.userData.orbit = {
    angle: i * Math.PI * 2 / 3,
    radius: 120 + i * 25,
    speed: 0.22 + i * 0.06,
    heightOffset: 30 + i * 25
  };
  kk.add(p);
  planes.push(p);
}

const NSHOTS = 40;
const shotPos = new Float32Array(NSHOTS * 6);
for (let i = 0; i < NSHOTS; i++){ shotPos[i*6+1] = -9999; shotPos[i*6+4] = -9999; }
const shotGeo = new T.BufferGeometry();
shotGeo.setAttribute('position', new T.BufferAttribute(shotPos, 3));
const shotMat = new T.LineBasicMaterial({color: 0xffdd44, transparent: true, opacity: 0.9, fog: false});
const shotLines = new T.LineSegments(shotGeo, shotMat);
shotLines.frustumCulled = false;
kk.add(shotLines);

const shotData = [];
for (let i = 0; i < NSHOTS; i++){
  shotData.push({active: false, x:0, y:0, z:0, dx:0, dy:0, dz:0, life:0});
}

function fireShot(fx, fy, fz, tx, ty, tz){
  const s = shotData.find(o => !o.active);
  if (!s) return;
  s.active = true;
  s.x = fx; s.y = fy; s.z = fz;
  const dx = tx - fx, dy = ty - fy, dz = tz - fz;
  const d = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
  const sp = 180;
  s.dx = dx/d * sp; s.dy = dy/d * sp; s.dz = dz/d * sp;
  s.life = d / sp;
}

let kkT = 0, kongY = 200, kongDir = 1, active = false;

console.log('[KK] module loaded. Tower at world', kk.position.x, kk.position.y, kk.position.z, 'height', TOWER_H);

export function resetKingKong(){
  kk.visible = false;
  active = false;
  kkT = 0;
  kongY = 200;
  kongDir = 1;
  shotData.forEach(s => s.active = false);
  kong.position.y = 200;
  kong.position.z = 16;
}

export function tickKingKong(dt){
  const dz = G.P.z - kk.position.z;

  if (!active && G.mode === 'play' && dz > 0 && dz < 2500 && G.alt > 20){
    active = true;
    kk.visible = true;
    banner('SOMETHING HUGE AHEAD...');
    console.log('[KK] ACTIVATED at dz=' + dz.toFixed(0) + ' alt=' + G.alt.toFixed(0));
  }

  if (!active || !kk.visible) return;

  kkT += dt;

  kongY += kongDir * 6 * dt;
  if (kongY > TOWER_H * 0.65) kongDir = -1;
  if (kongY < 100) kongDir = 1;
  kong.position.y = kongY;

  const ct = kkT * 2.2;
  const l = kong.userData;
  l.armL.shoulder.rotation.x = Math.sin(ct) * 0.9;
  l.armR.shoulder.rotation.x = Math.sin(ct + Math.PI) * 0.9;
  l.armL.elbow.rotation.x = -Math.abs(Math.sin(ct)) * 0.6 - 0.15;
  l.armR.elbow.rotation.x = -Math.abs(Math.sin(ct + Math.PI)) * 0.6 - 0.15;
  l.legL.hip.rotation.x = Math.sin(ct + Math.PI) * 0.4;
  l.legR.hip.rotation.x = Math.sin(ct) * 0.4;
  l.legL.knee.rotation.x = -0.3;
  l.legR.knee.rotation.x = -0.3;

  for (const p of planes){
    const o = p.userData.orbit;
    o.angle += o.speed * dt;
    const px = Math.cos(o.angle) * o.radius;
    const pz = Math.sin(o.angle) * o.radius;
    const py = kongY + o.heightOffset;
    p.position.set(px, py, pz);
    p.lookAt(0, kongY, 0);
    p.userData.prop.rotation.z += dt * 40;
    if (Math.random() < 0.12) fireShot(px, py, pz, 0, kongY, 16);
  }

  for (const s of shotData){
    if (!s.active) continue;
    s.x += s.dx * dt;
    s.y += s.dy * dt;
    s.z += s.dz * dt;
    s.life -= dt;
    if (s.life <= 0) s.active = false;
  }
  for (let i = 0; i < NSHOTS; i++){
    const s = shotData[i];
    if (s.active){
      shotPos[i*6]   = s.x;
      shotPos[i*6+1] = s.y;
      shotPos[i*6+2] = s.z;
      shotPos[i*6+3] = s.x - s.dx * 0.08;
      shotPos[i*6+4] = s.y - s.dy * 0.08;
      shotPos[i*6+5] = s.z - s.dz * 0.08;
    } else {
      shotPos[i*6+1] = -9999;
      shotPos[i*6+4] = -9999;
    }
  }
  shotGeo.attributes.position.needsUpdate = true;

  tower.userData.fires.forEach((m, i) => {
    m.color.setHSL(0.05 + Math.sin(kkT * 6 + i) * 0.03, 1, 0.55);
  });

  if (G.P.z < kk.position.z - 500){
    kk.visible = false;
    active = false;
  }
      }
