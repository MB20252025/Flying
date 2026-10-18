import { T, rnd } from './utils.js';
import { G } from './game.js';
import { S } from './scene.js';

function MNF(c, o){ return new T.MeshBasicMaterial(Object.assign({color:c, fog:false}, o||{})); }

function mkMesh(geo, mat, x=0, y=0, z=0){
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function towerTexture(){
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#6a4a3a'; x.fillRect(0, 0, 256, 512);
  const cols = 6, rows = 10;
  const cw = 256 / cols, ch = 512 / rows;
  for (let r = 0; r < rows; r++){
    for (let cc = 0; cc < cols; cc++){
      const wx = cc * cw + cw * .2;
      const wy = r * ch + ch * .25;
      const ww = cw * .6, wh = ch * .5;
      const rv = Math.random();
      let col;
      if (rv < 0.15) col = '#ff8844';
      else if (rv < 0.6) col = '#ffe066';
      else col = '#0a0a1a';
      x.fillStyle = col;
      x.fillRect(wx, wy, ww, wh);
    }
  }
  return new T.CanvasTexture(c);
}

function buildTower(){
  const g = new T.Group();
  const tex = towerTexture();
  const towerMat = new T.MeshBasicMaterial({map: tex, fog: false});

  let y = 0, w = 40;
  for (let tier = 0; tier < 15; tier++){
    const h = 100;
    const box = new T.Mesh(new T.BoxGeometry(w, h, w), towerMat);
    box.position.set(0, y + h/2, 0);
    g.add(box);
    y += h;
    w *= 0.94;
  }

  // Spire
  g.add(mkMesh(new T.CylinderGeometry(0.5, 4, 60, 8), MNF(0x3a2a20), 0, y + 30, 0));
  // Big red beacon ball
  const beaconBall = new T.Mesh(new T.SphereGeometry(6, 12, 12), MNF(0xff2020));
  beaconBall.position.set(0, y + 65, 0);
  g.add(beaconBall);

  // Fires
  const fires = [];
  for (let i = 0; i < 14; i++){
    const fy = 80 + i * 100 + rnd() * 40;
    const fw = 40 * Math.pow(0.94, Math.floor(fy / 100));
    const fMat = new T.MeshBasicMaterial({color: 0xff5522, fog: false});
    const f = new T.Mesh(new T.SphereGeometry(3.5, 8, 8), fMat);
    const side = rnd() < 0.5 ? 1 : -1;
    f.position.set(side * (fw/2 + 2), fy, (rnd() - 0.5) * fw * 0.5);
    g.add(f);
    fires.push(fMat);
  }

  g.userData = { fires, height: y + 65, beaconBall };
  return g;
}

function buildKong(){
  const g = new T.Group();
  const fur = MNF(0x4a2a10);
  const furDark = MNF(0x2a1808);
  const skin = MNF(0x9a7a5a);

  // Torso
  g.add(mkMesh(new T.SphereGeometry(2.2, 14, 10), fur, 0, 0, 0)).scale.set(1.3, 1.5, 1.1);
  g.add(mkMesh(new T.SphereGeometry(1.6, 10, 8), skin, 0, 0.1, 1.0)).scale.set(1, 1.2, 0.4);

  // Head
  g.add(mkMesh(new T.SphereGeometry(1.5, 14, 12), fur, 0, 2.8, 0));
  g.add(mkMesh(new T.SphereGeometry(1.15, 10, 8), skin, 0, 2.7, 0.8)).scale.set(1, 0.9, 0.6);
  g.add(mkMesh(new T.BoxGeometry(2.2, 0.4, 0.5), furDark, 0, 3.0, 1.0));

  // Eyes — bright yellow, easy to spot
  g.add(mkMesh(new T.SphereGeometry(0.28, 8, 8), MNF(0xffee00), -0.42, 2.85, 1.5));
  g.add(mkMesh(new T.SphereGeometry(0.28, 8, 8), MNF(0xffee00),  0.42, 2.85, 1.5));
  g.add(mkMesh(new T.SphereGeometry(0.12, 6, 6), MNF(0x000000), -0.42, 2.85, 1.72));
  g.add(mkMesh(new T.SphereGeometry(0.12, 6, 6), MNF(0x000000),  0.42, 2.85, 1.72));

  // Mouth
  g.add(mkMesh(new T.BoxGeometry(1.2, 0.28, 0.3), MNF(0x220000), 0, 2.35, 1.55));
  for (let i = -1; i <= 1; i++){
    g.add(mkMesh(new T.BoxGeometry(0.22, 0.32, 0.1), MNF(0xffffcc), i*0.35, 2.28, 1.65));
  }

  // Arms
  const makeArm = (side) => {
    const shoulder = new T.Group();
    shoulder.position.set(side * 2.2, 1.2, 0);
    shoulder.add(mkMesh(new T.SphereGeometry(0.8, 10, 8), fur));
    shoulder.add(mkMesh(new T.CylinderGeometry(0.7, 0.6, 2.4, 8), fur, 0, -1.2, 0));
    const elbow = new T.Group();
    elbow.position.set(0, -2.4, 0);
    shoulder.add(elbow);
    elbow.add(mkMesh(new T.SphereGeometry(0.6, 8, 8), fur));
    elbow.add(mkMesh(new T.CylinderGeometry(0.6, 0.5, 2, 8), fur, 0, -1, 0));
    elbow.add(mkMesh(new T.SphereGeometry(0.8, 8, 8), skin, 0, -2.1, 0));
    g.add(shoulder);
    return { shoulder, elbow };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Legs
  const makeLeg = (side) => {
    const hip = new T.Group();
    hip.position.set(side * 1.0, -2, 0);
    hip.add(mkMesh(new T.CylinderGeometry(0.8, 0.7, 2, 8), fur, 0, -1, 0));
    const knee = new T.Group();
    knee.position.set(0, -2, 0);
    hip.add(knee);
    knee.add(mkMesh(new T.SphereGeometry(0.7, 8, 8), fur));
    knee.add(mkMesh(new T.CylinderGeometry(0.7, 0.6, 1.8, 8), fur, 0, -0.9, 0));
    knee.add(mkMesh(new T.BoxGeometry(1.4, 0.6, 2.2), skin, 0, -1.9, 0.4));
    g.add(hip);
    return { hip, knee };
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  g.scale.setScalar(30); // ← 6x bigger than before
  g.userData = { armL, armR, legL, legR };
  return g;
}

function buildFighter(){
  const g = new T.Group();
  const body = MNF(0x6a7a5a);
  const bodyLight = MNF(0xaabb88);

  const fus = mkMesh(new T.CylinderGeometry(0.4, 0.3, 3.5, 8), body);
  fus.rotation.x = Math.PI/2;
  g.add(fus);
  g.add(mkMesh(new T.BoxGeometry(3.6, 0.18, 1.0), bodyLight));
  g.add(mkMesh(new T.BoxGeometry(1.0, 0.18, 0.6), bodyLight, 0, 0, 1.5));
  g.add(mkMesh(new T.BoxGeometry(0.18, 0.8, 0.6), bodyLight, 0, 0.4, 1.5));
  g.add(mkMesh(new T.SphereGeometry(0.45, 8, 6), MNF(0x88ccff), 0, 0.32, 0.25)).scale.set(1, 0.7, 1.2);

  const prop = new T.Group();
  prop.position.set(0, 0, -1.9);
  prop.add(mkMesh(new T.BoxGeometry(0.15, 2.6, 0.15), MNF(0x222222)));
  prop.add(mkMesh(new T.BoxGeometry(2.6, 0.15, 0.15), MNF(0x222222)));
  g.add(prop);
  g.userData.prop = prop;

  g.scale.setScalar(10); // ← 2.5x bigger than before
  return g;
}

/* --- Assemble --- */
export const kk = new T.Group();
kk.position.set(0, 0, -700); // 700 units ahead, dead centre
kk.visible = true;           // ALWAYS VISIBLE — no gate
S.add(kk);

const tower = buildTower();
kk.add(tower);
const TOWER_H = tower.userData.height;

const kong = buildKong();
kong.position.set(0, 400, 22); // on the front face of the tower
kk.add(kong);

const planes = [];
for (let i = 0; i < 3; i++){
  const p = buildFighter();
  p.userData.orbit = {
    angle: i * Math.PI * 2 / 3,
    radius: 180 + i * 40,
    speed: 0.22 + i * 0.05,
    heightOffset: 40 + i * 40
  };
  kk.add(p);
  planes.push(p);
}

/* --- Tracers --- */
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
  const sp = 300;
  s.dx = dx/d * sp; s.dy = dy/d * sp; s.dz = dz/d * sp;
  s.life = d / sp;
}

let kkT = 0, kongY = 400, kongDir = 1;
let logTimer = 0;

console.log('[KK] Tower spawned at', kk.position.x, kk.position.y, kk.position.z,
            '| tower height:', TOWER_H, '| KK kong scale: 30');

window.addEventListener('keydown', e => {
  if (e.code === 'KeyK' && G.mode === 'play'){
    kk.position.set(G.P.x, 0, G.P.z - 500);
    console.log('[KK] Teleported to', kk.position.x, kk.position.z);
  }
});

export function resetKingKong(){
  kkT = 0;
  kongY = 400;
  kongDir = 1;
  shotData.forEach(s => s.active = false);
  kong.position.set(0, 400, 22);
}

export function tickKingKong(dt){
  kkT += dt;
  logTimer += dt;
  if (logTimer > 2){
    logTimer = 0;
    console.log('[KK] visible=' + kk.visible +
                ' playerZ=' + G.P.z.toFixed(0) +
                ' kkZ=' + kk.position.z.toFixed(0) +
                ' dz=' + (G.P.z - kk.position.z).toFixed(0));
  }

  kongY += kongDir * 20 * dt;
  if (kongY > TOWER_H * 0.7) kongDir = -1;
  if (kongY < 300) kongDir = 1;
  kong.position.y = kongY;

  const ct = kkT * 2.2;
  const l = kong.userData;
  l.armL.shoulder.rotation.x = Math.sin(ct) * 0.9;
  l.armR.shoulder.rotation.x = Math.sin(ct + Math.PI) * 0.9;
  l.armL.elbow.rotation.x = -Math.abs(Math.sin(ct)) * 0.6 - 0.15;
  l.armR.elbow.rotation.x = -Math.abs(Math.sin(ct + Math.PI)) * 0.6 - 0.15;
  l.legL.hip.rotation.x = Math.sin(ct + Math.PI) * 0.4;
  l.legR.hip.rotation.x = Math.sin(ct) * 0.4;

  for (const p of planes){
    const o = p.userData.orbit;
    o.angle += o.speed * dt;
    const px = Math.cos(o.angle) * o.radius;
    const pz = Math.sin(o.angle) * o.radius;
    const py = kongY + o.heightOffset;
    p.position.set(px, py, pz);
    p.lookAt(0, kongY, 0);
    p.userData.prop.rotation.z += dt * 40;
    if (Math.random() < 0.15) fireShot(px, py, pz, 0, kongY, 22);
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
      shotPos[i*6+3] = s.x - s.dx * 0.06;
      shotPos[i*6+4] = s.y - s.dy * 0.06;
      shotPos[i*6+5] = s.z - s.dz * 0.06;
    } else {
      shotPos[i*6+1] = -9999;
      shotPos[i*6+4] = -9999;
    }
  }
  shotGeo.attributes.position.needsUpdate = true;

  tower.userData.fires.forEach((m, i) => {
    m.color.setHSL(0.05 + Math.sin(kkT * 6 + i) * 0.03, 1, 0.55);
  });

  const pulse = 0.7 + Math.sin(kkT * 4) * 0.3;
  tower.userData.beaconBall.scale.setScalar(pulse);
}
