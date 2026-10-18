import { T, rnd } from './utils.js';
import { G } from './game.js';
import { S } from './scene.js';

console.log('[KK] === FILE LOADED ===');

function MK(color, extra){
  return new T.MeshBasicMaterial(Object.assign({color, fog: false}, extra || {}));
}

function buildTower(){
  const g = new T.Group();
  let y = 0, w = 80;

  for (let i = 0; i < 20; i++){
    const h = 100;
    const body = new T.Mesh(
      new T.BoxGeometry(w, h, w),
      MK(i % 2 ? 0x3a2a1a : 0x4a3a2a)
    );
    body.position.set(0, y + h/2, 0);
    g.add(body);

    // Front-face windows only (fast)
    for (let wy = 0; wy < 4; wy++){
      for (let wx = -2; wx <= 2; wx++){
        if (Math.random() < 0.45) continue;
        const r = Math.random();
        const winColor = r < 0.15 ? 0xff5522 : r < 0.6 ? 0xffcc66 : 0x1a1a2a;
        const win = new T.Mesh(
          new T.BoxGeometry(9, 16, 1),
          MK(winColor)
        );
        win.position.set(wx * 13, y + 15 + wy * 22, w/2 + 0.6);
        g.add(win);
      }
    }

    y += h;
    w *= 0.94;
  }

  // Spire
  const spire = new T.Mesh(
    new T.CylinderGeometry(2, 10, 150, 8),
    MK(0x2a1a10)
  );
  spire.position.y = y + 75;
  g.add(spire);

  // Huge red beacon at top
  const beacon = new T.Mesh(
    new T.SphereGeometry(20, 16, 16),
    MK(0xff2020)
  );
  beacon.position.y = y + 160;
  g.add(beacon);

  // 5000-unit vertical light beam — visible from anywhere
  const beam = new T.Mesh(
    new T.CylinderGeometry(10, 10, 5000, 8),
    MK(0xff3030, {transparent: true, opacity: 0.4, blending: T.AdditiveBlending, depthWrite: false})
  );
  beam.position.y = y + 2500;
  g.add(beam);

  g.userData = { height: y + 160, beacon, beam };
  return g;
}

function buildKong(){
  const g = new T.Group();
  const fur = MK(0x3a1a05);
  const furDark = MK(0x1a0800);
  const skin = MK(0x9a7a5a);
  const yellow = MK(0xffdd00);
  const black = MK(0x000000);
  const white = MK(0xffffff);

  // Torso
  const torso = new T.Mesh(new T.SphereGeometry(3, 16, 12), fur);
  torso.scale.set(1.4, 1.8, 1.2);
  g.add(torso);

  // Chest
  const chest = new T.Mesh(new T.SphereGeometry(2.2, 10, 8), skin);
  chest.position.set(0, 0.2, 1.4);
  chest.scale.set(1, 1.3, 0.4);
  g.add(chest);

  // Head
  const head = new T.Mesh(new T.SphereGeometry(2, 16, 12), fur);
  head.position.set(0, 4, 0);
  g.add(head);

  // Face
  const face = new T.Mesh(new T.SphereGeometry(1.5, 12, 10), skin);
  face.position.set(0, 3.8, 1.2);
  face.scale.set(1, 0.9, 0.6);
  g.add(face);

  // Brow
  const brow = new T.Mesh(new T.BoxGeometry(3, 0.5, 0.6), furDark);
  brow.position.set(0, 4.2, 1.6);
  g.add(brow);

  // Eyes
  const eyeL = new T.Mesh(new T.SphereGeometry(0.4, 10, 10), yellow);
  eyeL.position.set(-0.6, 3.9, 2.2);
  g.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.6; g.add(eyeR);
  const pupilL = new T.Mesh(new T.SphereGeometry(0.2, 8, 8), black);
  pupilL.position.set(-0.6, 3.9, 2.5);
  g.add(pupilL);
  const pupilR = pupilL.clone(); pupilR.position.x = 0.6; g.add(pupilR);

  // Mouth
  const mouth = new T.Mesh(new T.BoxGeometry(1.6, 0.4, 0.4), MK(0x330000));
  mouth.position.set(0, 3.2, 2.1);
  g.add(mouth);
  for (let i = -1; i <= 1; i++){
    const tooth = new T.Mesh(new T.BoxGeometry(0.3, 0.4, 0.15), white);
    tooth.position.set(i * 0.45, 3.15, 2.25);
    g.add(tooth);
  }

  // Arms
  const makeArm = (side) => {
    const shoulder = new T.Group();
    shoulder.position.set(side * 3, 1.5, 0);
    const upper = new T.Mesh(new T.CylinderGeometry(1, 0.85, 3, 10), fur);
    upper.position.y = -1.5;
    shoulder.add(upper);
    const elbow = new T.Group();
    elbow.position.y = -3;
    shoulder.add(elbow);
    elbow.add(new T.Mesh(new T.SphereGeometry(0.9, 8, 8), fur));
    const fore = new T.Mesh(new T.CylinderGeometry(0.85, 0.7, 2.5, 10), fur);
    fore.position.y = -1.25;
    elbow.add(fore);
    const hand = new T.Mesh(new T.SphereGeometry(1.1, 10, 8), skin);
    hand.position.y = -2.7;
    hand.scale.set(1, 1.2, 0.8);
    elbow.add(hand);
    g.add(shoulder);
    return { shoulder, elbow };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // Legs
  const makeLeg = (side) => {
    const hip = new T.Group();
    hip.position.set(side * 1.4, -3, 0);
    const thigh = new T.Mesh(new T.CylinderGeometry(1, 0.9, 3, 10), fur);
    thigh.position.y = -1.5;
    hip.add(thigh);
    const knee = new T.Group();
    knee.position.y = -3;
    hip.add(knee);
    knee.add(new T.Mesh(new T.SphereGeometry(0.9, 8, 8), fur));
    const shin = new T.Mesh(new T.CylinderGeometry(0.9, 0.8, 2.5, 10), fur);
    shin.position.y = -1.25;
    knee.add(shin);
    const foot = new T.Mesh(new T.BoxGeometry(1.8, 0.8, 2.8), skin);
    foot.position.set(0, -2.7, 0.6);
    knee.add(foot);
    g.add(hip);
    return { hip, knee };
  };
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  g.scale.setScalar(25);
  g.userData = { armL, armR, legL, legR, head };
  return g;
}

function buildFighter(){
  const g = new T.Group();
  const body = MK(0x556644);
  const bodyLight = MK(0x889966);

  const fus = new T.Mesh(new T.CylinderGeometry(0.5, 0.35, 4, 8), body);
  fus.rotation.x = Math.PI/2;
  g.add(fus);
  g.add(new T.Mesh(new T.BoxGeometry(4.5, 0.2, 1.2), bodyLight));
  const tail = new T.Mesh(new T.BoxGeometry(1.2, 0.2, 0.7), bodyLight);
  tail.position.set(0, 0, 1.8);
  g.add(tail);
  const cockpit = new T.Mesh(new T.SphereGeometry(0.5, 8, 6), MK(0x88ddff));
  cockpit.position.set(0, 0.4, 0.4);
  cockpit.scale.set(1, 0.7, 1.3);
  g.add(cockpit);

  const prop = new T.Group();
  prop.position.z = -2.2;
  prop.add(new T.Mesh(new T.BoxGeometry(0.2, 3, 0.2), MK(0x222222)));
  prop.add(new T.Mesh(new T.BoxGeometry(3, 0.2, 0.2), MK(0x222222)));
  g.add(prop);
  g.userData.prop = prop;

  g.scale.setScalar(12);
  return g;
}

export const kk = new T.Group();
kk.position.set(50, 0, -400);
S.add(kk);

const tower = buildTower();
kk.add(tower);
const TOWER_H = tower.userData.height;

const kong = buildKong();
kong.position.set(0, 800, 60);
kk.add(kong);

const planes = [];
for (let i = 0; i < 3; i++){
  const p = buildFighter();
  p.userData.orbit = {
    angle: i * Math.PI * 2 / 3,
    radius: 400 + i * 60,
    speed: 0.25 + i * 0.08,
    heightOffset: 100 + i * 200
  };
  kk.add(p);
  planes.push(p);
}

const NSHOTS = 50;
const shotPos = new Float32Array(NSHOTS * 6);
for (let i = 0; i < NSHOTS; i++){ shotPos[i*6+1] = -9999; shotPos[i*6+4] = -9999; }
const shotGeo = new T.BufferGeometry();
shotGeo.setAttribute('position', new T.BufferAttribute(shotPos, 3));
const shotMat = new T.LineBasicMaterial({color: 0xffdd44, fog: false, transparent: true, opacity: 0.95});
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
  const sp = 400;
  s.dx = dx/d * sp; s.dy = dy/d * sp; s.dz = dz/d * sp;
  s.life = d / sp;
}

let kkT = 0, kongY = 800, kongDir = 1;
let logT = 0;

console.log('[KK] Tower at', kk.position.x, 0, kk.position.z, '| height', TOWER_H);

window.addEventListener('keydown', e => {
  if (e.code === 'KeyK' && G.mode === 'play'){
    kk.position.set(G.P.x, 0, G.P.z - 400);
    console.log('[KK] TELEPORTED to', kk.position.x, kk.position.z);
  }
});

window.__kkTest = function(){
  kk.position.set(G.P.x, 0, G.P.z - 400);
  console.log('[KK] __kkTest called — tower 400 units ahead');
};

export function resetKingKong(){
  kkT = 0;
  kongY = 800;
  kongDir = 1;
  shotData.forEach(s => s.active = false);
  kong.position.set(0, 800, 60);
}

export function tickKingKong(dt){
  kkT += dt;
  logT += dt;
  if (logT > 3){
    logT = 0;
    console.log('[KK] dz=' + (G.P.z - kk.position.z).toFixed(0) + ' kkY=' + kongY.toFixed(0) + ' active');
  }

  kongY += kongDir * 25 * dt;
  if (kongY > TOWER_H * 0.8) kongDir = -1;
  if (kongY < 400) kongDir = 1;
  kong.position.y = kongY;

  const ct = kkT * 2.5;
  const l = kong.userData;
  l.armL.shoulder.rotation.x = Math.sin(ct) * 1.2;
  l.armR.shoulder.rotation.x = Math.sin(ct + Math.PI) * 1.2;
  l.armL.elbow.rotation.x = -Math.abs(Math.sin(ct)) * 0.8 - 0.2;
  l.armR.elbow.rotation.x = -Math.abs(Math.sin(ct + Math.PI)) * 0.8 - 0.2;
  l.legL.hip.rotation.x = Math.sin(ct + Math.PI) * 0.5;
  l.legR.hip.rotation.x = Math.sin(ct) * 0.5;
  l.head.rotation.z = Math.sin(ct * 0.7) * 0.15;

  for (const p of planes){
    const o = p.userData.orbit;
    o.angle += o.speed * dt;
    const px = Math.cos(o.angle) * o.radius;
    const pz = Math.sin(o.angle) * o.radius;
    const py = kongY + o.heightOffset;
    p.position.set(px, py, pz);
    p.lookAt(0, kongY, 0);
    p.userData.prop.rotation.z += dt * 60;
    if (Math.random() < 0.2) fireShot(px, py, pz, 0, kongY, 60);
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
      shotPos[i*6+3] = s.x - s.dx * 0.05;
      shotPos[i*6+4] = s.y - s.dy * 0.05;
      shotPos[i*6+5] = s.z - s.dz * 0.05;
    } else {
      shotPos[i*6+1] = -9999;
      shotPos[i*6+4] = -9999;
    }
  }
  shotGeo.attributes.position.needsUpdate = true;

  const pulse = 0.8 + Math.sin(kkT * 5) * 0.3;
  tower.userData.beacon.scale.setScalar(pulse);
}
