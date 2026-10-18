import { T, rnd } from './utils.js';
import { G } from './game.js';
import { S } from './scene.js';
import { say } from './ui.js';
import { sl } from './world/items.js';

function M(c, o){ return new T.MeshLambertMaterial(Object.assign({color:c, fog:false}, o||{})); }
function MB(c, o){ return new T.MeshBasicMaterial(Object.assign({color:c, fog:false}, o||{})); }
function fwd(){ return { fx: Math.sin(G.P.yaw), fz: -Math.cos(G.P.yaw) }; }

/* ============================================================
   TORNADO STATE (exported so main can freeze player input)
   ============================================================ */
export const TOR = {
  trapped: false,
  phase: 0,
  angle: 0,
  radius: 0,
  height: 0,
  flingTime: 0,
  flingVX: 0,
  flingVZ: 0,
  flingVY: 0
};

export function isPlayerTrapped(){
  return TOR.trapped || TOR.flingTime > 0;
}

/* ============================================================
   WATER TORNADO
   ============================================================ */
const wt = new T.Group(); S.add(wt);
{
  const funnel = new T.Mesh(
    new T.CylinderGeometry(40, 6, 350, 24, 8, true),
    MB(0x88bbdd, {transparent:true, opacity:0.4, side:T.DoubleSide, depthWrite:false})
  );
  funnel.position.y = 175;
  wt.add(funnel);

  for (let i = 0; i < 8; i++){
    const pts = [];
    for (let j = 0; j <= 40; j++){
      const t = j / 40;
      const r = 6 + t * 34;
      const a = t * Math.PI * 5 + i * Math.PI * 2 / 8;
      pts.push(new T.Vector3(Math.cos(a)*r, t*350, Math.sin(a)*r));
    }
    wt.add(new T.Line(
      new T.BufferGeometry().setFromPoints(pts),
      new T.LineBasicMaterial({color:0xddeeff, transparent:true, opacity:0.7, fog:false})
    ));
  }

  const disk = new T.Mesh(
    new T.CircleGeometry(70, 32),
    MB(0x5577aa, {transparent:true, opacity:0.55})
  );
  disk.rotation.x = -Math.PI/2;
  disk.position.y = 0.5;
  wt.add(disk);

  const NSP = 120;
  const spPos = new Float32Array(NSP*3);
  const spT = new Float32Array(NSP);
  const spA = new Float32Array(NSP);
  for (let i = 0; i < NSP; i++){ spT[i] = Math.random(); spA[i] = Math.random()*Math.PI*2; }
  const spGeo = new T.BufferGeometry();
  spGeo.setAttribute('position', new T.BufferAttribute(spPos, 3));
  const spPts = new T.Points(spGeo, new T.PointsMaterial({
    color:0xbbddff, size:2.5, transparent:true, opacity:0.85, fog:false
  }));
  wt.add(spPts);
  wt.userData = { spPos, spT, spA, spGeo, NSP };
}
wt.visible = false;
let wtA = false, wtT = 0, wtSpin = 0;

/* ============================================================
   ASTEROID
   ============================================================ */
const ast = new T.Group(); S.add(ast);
{
  const rockMat = M(0x553322);
  const main = new T.Mesh(new T.SphereGeometry(140, 24, 18), rockMat);
  ast.add(main);
  for (let i = 0; i < 14; i++){
    const b = new T.Mesh(new T.SphereGeometry(20 + Math.random()*25, 8, 6), rockMat);
    const aa = Math.random()*Math.PI*2, bb = Math.random()*Math.PI - Math.PI/2;
    b.position.set(
      Math.cos(aa)*Math.cos(bb)*130,
      Math.sin(bb)*130,
      Math.sin(aa)*Math.cos(bb)*130
    );
    main.add(b);
  }

  const NAT = 80;
  const atPos = new Float32Array(NAT*3);
  for (let i = 0; i < NAT; i++) atPos[i*3+1] = -99999;
  const atGeo = new T.BufferGeometry();
  atGeo.setAttribute('position', new T.BufferAttribute(atPos, 3));
  const atPts = new T.Points(atGeo, new T.PointsMaterial({
    color:0xff7733, size:10, transparent:true, opacity:0.8,
    blending:T.AdditiveBlending, depthWrite:false, fog:false
  }));
  ast.add(atPts);
  ast.userData = { main, atPos, atGeo, NAT };
}
ast.visible = false;
let astA = false, astT = 0;
const astVel = new T.Vector3();

/* ============================================================
   SHARKS — pool of 3, each hunts pizza
   ============================================================ */
function buildShark(){
  const g = new T.Group();
  const body = M(0x445566);
  const belly = M(0x99aabb);

  const torso = new T.Mesh(new T.SphereGeometry(1, 20, 14), body);
  torso.scale.set(8, 5, 22);
  g.add(torso);

  const b = new T.Mesh(new T.SphereGeometry(1, 14, 10), belly);
  b.scale.set(6, 2.5, 18);
  b.position.y = -2;
  g.add(b);

  const fin = new T.Mesh(new T.ConeGeometry(2.5, 10, 4), body);
  fin.position.y = 5;
  fin.rotation.x = -Math.PI/5;
  g.add(fin);

  const tailTop = new T.Mesh(new T.ConeGeometry(3, 12, 4), body);
  tailTop.position.set(0, 3, 20);
  tailTop.rotation.x = Math.PI/2;
  g.add(tailTop);
  const tailBot = new T.Mesh(new T.ConeGeometry(2, 8, 4), body);
  tailBot.position.set(0, -2, 20);
  tailBot.rotation.x = Math.PI/2;
  g.add(tailBot);

  const snout = new T.Mesh(new T.ConeGeometry(5, 12, 8), body);
  snout.position.z = -20;
  snout.rotation.x = -Math.PI/2;
  g.add(snout);

  const mouth = new T.Mesh(new T.BoxGeometry(8, 1.5, 6), MB(0x110000));
  mouth.position.set(0, -2.5, -16);
  g.add(mouth);

  for (let i = 0; i < 10; i++){
    const tooth = new T.Mesh(new T.ConeGeometry(0.4, 1.2, 4), MB(0xffffff));
    tooth.position.set(-3.6 + i*0.8, -1.8, -18);
    tooth.rotation.x = Math.PI;
    g.add(tooth);
  }

  for (const sx of [-1, 1]){
    const eye = new T.Mesh(new T.SphereGeometry(0.8, 8, 8), MB(0x000000));
    eye.position.set(sx*3.5, 1.5, -17);
    g.add(eye);
    const pfin = new T.Mesh(new T.ConeGeometry(2, 8, 4), body);
    pfin.position.set(sx*7, -1, -3);
    pfin.rotation.z = sx * Math.PI/3;
    g.add(pfin);
  }

  return g;
}

const sharkPool = [];
for (let i = 0; i < 3; i++){
  const obj = buildShark();
  obj.visible = false;
  S.add(obj);
  sharkPool.push({ obj, active: false, phase: 0, life: 0, target: null, vel: new T.Vector3() });
}

/* ============================================================
   DRAGONS — pool of 3, each hunts the player
   ============================================================ */
function buildDragon(){
  const g = new T.Group();
  const red = M(0x882222);
  const redD = M(0x551111);

  const pieces = [];
  for (let i = 0; i < 10; i++){
    const s = new T.Mesh(new T.SphereGeometry(4 - i*0.35, 10, 8), red);
    s.position.z = i * 3.5;
    g.add(s);
    pieces.push(s);
  }

  const head = new T.Mesh(new T.SphereGeometry(3.5, 14, 10), red);
  head.scale.set(1.1, 1, 1.4);
  head.position.z = -5;
  g.add(head);

  const snout = new T.Mesh(new T.ConeGeometry(1.8, 5, 6), red);
  snout.position.z = -9;
  snout.rotation.x = -Math.PI/2;
  g.add(snout);

  for (const sx of [-1, 1]){
    const horn = new T.Mesh(new T.ConeGeometry(0.7, 4, 5), redD);
    horn.position.set(sx*2, 3, -4);
    horn.rotation.x = -0.4;
    g.add(horn);
    const eye = new T.Mesh(new T.SphereGeometry(0.6, 8, 8), MB(0xffdd00));
    eye.position.set(sx*1.5, 1, -6);
    g.add(eye);
    const pup = new T.Mesh(new T.SphereGeometry(0.25, 6, 6), MB(0x000000));
    pup.position.set(sx*1.5, 1, -6.5);
    g.add(pup);
  }

  const wl = new T.Group(); wl.position.set(-2, 1, 0);
  const wlm = new T.Mesh(new T.PlaneGeometry(14, 10), redD);
  wlm.position.x = -7;
  wlm.material.side = T.DoubleSide;
  wl.add(wlm);
  g.add(wl);

  const wr = new T.Group(); wr.position.set(2, 1, 0);
  const wrm = new T.Mesh(new T.PlaneGeometry(14, 10), redD);
  wrm.position.x = 7;
  wrm.material.side = T.DoubleSide;
  wr.add(wrm);
  g.add(wr);

  const NDRF = 80;
  const drfPos = new Float32Array(NDRF*3);
  for (let i = 0; i < NDRF; i++) drfPos[i*3+1] = -99999;
  const drfGeo = new T.BufferGeometry();
  drfGeo.setAttribute('position', new T.BufferAttribute(drfPos, 3));
  const drfPts = new T.Points(drfGeo, new T.PointsMaterial({
    color:0xff6600, size:8, transparent:true, opacity:0.9,
    blending:T.AdditiveBlending, depthWrite:false, fog:false
  }));
  g.add(drfPts);

  g.userData = {
    pieces, wl, wr,
    drfPos, drfGeo, NDRF,
    drfV: Array.from({length:NDRF}, () => ({x:0,y:0,z:0,life:0}))
  };
  return g;
}

const dragonPool = [];
for (let i = 0; i < 3; i++){
  const obj = buildDragon();
  obj.visible = false;
  S.add(obj);
  dragonPool.push({ obj, active: false, phase: 0, life: 0 });
}

/* ============================================================
   OCTOPUS — 8 connected tentacles, scary face
   ============================================================ */
const oct = new T.Group(); S.add(oct);
{
  const pur  = M(0x552244);
  const purD = M(0x2a0f22);
  const mouth = MB(0x330000);
  const yellow = MB(0xffdd00);
  const black = MB(0x000000);
  const white = MB(0xffffff);

  /* Bulbous head */
  const body = new T.Mesh(new T.SphereGeometry(45, 24, 18), pur);
  body.scale.set(1.2, 1.4, 1.1);
  body.position.y = 280;
  oct.add(body);

  /* Mantle top — smooth dome */
  const mantle = new T.Mesh(new T.SphereGeometry(38, 20, 14), purD);
  mantle.scale.set(1.05, 0.7, 1.05);
  mantle.position.y = 320;
  oct.add(mantle);

  /* Sparse wart bumps */
  for (let i = 0; i < 10; i++){
    const a = (i / 10) * Math.PI * 2;
    const w = new T.Mesh(new T.SphereGeometry(3 + Math.random()*2, 6, 6), purD);
    w.position.set(Math.cos(a)*32, 300 + Math.sin(i*7)*8, Math.sin(a)*32);
    oct.add(w);
  }

  /* TWO BIG MENACING EYES facing +Z */
  for (const sx of [-1, 1]){
    const socket = new T.Mesh(new T.SphereGeometry(13, 14, 12), purD);
    socket.position.set(sx * 18, 288, 32);
    oct.add(socket);

    const eye = new T.Mesh(new T.SphereGeometry(10, 16, 14), yellow);
    eye.position.set(sx * 18, 288, 38);
    oct.add(eye);

    /* Vertical slit pupil */
    const pup = new T.Mesh(new T.BoxGeometry(2.5, 12, 4), black);
    pup.position.set(sx * 18, 288, 45);
    oct.add(pup);

    /* Angry brow, angled inward-down */
    const brow = new T.Mesh(new T.BoxGeometry(22, 4.5, 5), purD);
    brow.position.set(sx * 18, 302, 40);
    brow.rotation.z = sx * 0.4;
    oct.add(brow);
  }

  /* Wide beak-mouth */
  const mouthMesh = new T.Mesh(new T.SphereGeometry(11, 16, 10), mouth);
  mouthMesh.position.set(0, 256, 36);
  mouthMesh.scale.set(1.5, 0.7, 0.55);
  oct.add(mouthMesh);

  /* Row of sharp teeth */
  for (let i = 0; i < 8; i++){
    const t = new T.Mesh(new T.ConeGeometry(2, 5.5, 4), white);
    t.position.set(-14 + i * 4, 260, 41);
    t.rotation.x = Math.PI;
    oct.add(t);
  }
  for (let i = 0; i < 7; i++){
    const t = new T.Mesh(new T.ConeGeometry(2, 5, 4), white);
    t.position.set(-12 + i * 4, 252, 41);
    oct.add(t);
  }

  /* EIGHT tentacles — anchored to the underside, grouped for clean animation */
  const tentacles = [];
  for (let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    const attachX = Math.cos(a) * 28;
    const attachZ = Math.sin(a) * 28;

    const grp = new T.Group();
    grp.position.set(attachX, 224, attachZ);
    oct.add(grp);

    /* Curve in LOCAL space: starts at 0,0,0 so rotation keeps base fixed */
    const outMidX = Math.cos(a) * 20;
    const outMidZ = Math.sin(a) * 20;
    const outFarX = Math.cos(a) * 55;
    const outFarZ = Math.sin(a) * 55;
    const curlX = Math.cos(a) * 40;
    const curlZ = Math.sin(a) * 40;

    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0, 0),
      new T.Vector3(outMidX * 0.35, -35, outMidZ * 0.35),
      new T.Vector3(outMidX,       -90, outMidZ),
      new T.Vector3(outFarX,      -160, outFarZ),
      new T.Vector3(curlX,        -205, curlZ)
    ]);
    const geo = new T.TubeGeometry(curve, 40, 6.5, 8, false);
    grp.add(new T.Mesh(geo, pur));

    /* Suckers along the underside — a few small dots */
    for (let k = 0; k < 6; k++){
      const t = 0.15 + (k / 6) * 0.75;
      const p = curve.getPoint(t);
      const s = new T.Mesh(new T.SphereGeometry(1.6, 6, 6), purD);
      s.position.copy(p).add(new T.Vector3(0, 2.5, 0));
      grp.add(s);
    }

    tentacles.push({ grp, phase: i * 0.5, baseAngle: a });
  }

  oct.userData = { tentacles, body, mouth: mouthMesh };
}
oct.visible = false;
let octA = false, octT = 0;

/* ============================================================
   EXPLOSIONS — small pool for kill effects
   ============================================================ */
const explosions = [];
function spawnExplosion(pos, color){
  const m = new T.Mesh(
    new T.SphereGeometry(1, 10, 8),
    MB(color || 0xffaa00, {transparent:true, opacity:0.9, depthWrite:false, blending:T.AdditiveBlending})
  );
  m.position.copy(pos);
  S.add(m);
  explosions.push({ mesh: m, life: 0.6, maxLife: 0.6 });
}
function tickExplosions(dt){
  for (let i = explosions.length - 1; i >= 0; i--){
    const e = explosions[i];
    e.life -= dt;
    if (e.life <= 0){
      S.remove(e.mesh);
      e.mesh.geometry.dispose();
      e.mesh.material.dispose();
      explosions.splice(i, 1);
      continue;
    }
    const t = 1 - e.life / e.maxLife;
    const sc = 5 + t * 45;
    e.mesh.scale.setScalar(sc);
    e.mesh.material.opacity = (1 - t) * 0.9;
  }
}

/* ============================================================
   SHOOTING API — main.js calls these
   ============================================================ */
export function getShootableTargets(){
  const out = [];
  for (const s of sharkPool) if (s.active) out.push({ obj: s.obj, type: 'shark' });
  for (const d of dragonPool) if (d.active) out.push({ obj: d.obj, type: 'dragon' });
  return out;
}

export function killTarget(t){
  if (t.type === 'shark'){
    const s = sharkPool.find(x => x.obj === t.obj);
    if (s){
      s.active = false;
      spawnExplosion(t.obj.position, 0x66aaff);
    }
  } else if (t.type === 'dragon'){
    const d = dragonPool.find(x => x.obj === t.obj);
    if (d){
      d.active = false;
      spawnExplosion(t.obj.position, 0xff5522);
    }
  }
  t.obj.visible = false;

  G.Q.bonus += 100;
  G.P.meter = Math.min(1, G.P.meter + 0.30);
}

/* ============================================================
   SPAWN HELPERS
   ============================================================ */
function findNearestSlice(pos){
  let best = null, bestD = 1e9;
  for (const s of sl){
    if (!s.visible) continue;
    const dx = s.position.x - pos.x;
    const dy = s.position.y - pos.y;
    const dz = s.position.z - pos.z;
    const d = dx*dx + dy*dy + dz*dz;
    if (d < bestD){ bestD = d; best = s; }
  }
  return best;
}

function spawnShark(){
  const slot = sharkPool.find(s => !s.active);
  if (!slot) return false;
  const { fx, fz } = fwd();
  const side = rnd() < .5 ? -1 : 1;
  const d = 300 + rnd() * 200;
  slot.obj.position.set(
    G.P.x + fx * d + fz * side * 80,
    G.P.y + (rnd() - .3) * 60,
    G.P.z + fz * d - fx * side * 80
  );
  slot.obj.visible = true;
  slot.active = true;
  slot.phase = 0;
  slot.life = 20;
  slot.target = null;
  return true;
}

function spawnDragon(){
  const slot = dragonPool.find(d => !d.active);
  if (!slot) return false;
  const { fx, fz } = fwd();
  const side = rnd() < .5 ? -1 : 1;
  const d = 320 + rnd() * 200;
  slot.obj.position.set(
    G.P.x + fx * d + fz * side * 100,
    G.P.y + 40 + rnd() * 40,
    G.P.z + fz * d - fx * side * 100
  );
  slot.obj.visible = true;
  slot.active = true;
  slot.phase = 0;
  slot.life = 18;
  slot.obj.userData.drfV.forEach(v => { v.life = 0; });
  return true;
}

/* ============================================================
   INDIVIDUAL TICKERS
   ============================================================ */
function tickTornado(dt){
  if (!wtA) return;

  wtT += dt;
  wtSpin += dt * 4;
  wt.rotation.y = wtSpin;

  const u = wt.userData;
  for (let i = 0; i < u.NSP; i++){
    u.spT[i] += dt * 0.15;
    if (u.spT[i] > 1) u.spT[i] -= 1;
    const t = u.spT[i];
    const r = 6 + t * 34;
    u.spA[i] += dt * 3;
    u.spPos[i*3]     = Math.cos(u.spA[i]) * r;
    u.spPos[i*3 + 1] = t * 350;
    u.spPos[i*3 + 2] = Math.sin(u.spA[i]) * r;
  }
  u.spGeo.attributes.position.needsUpdate = true;

  /* Player interaction */
  const dx = G.P.x - wt.position.x;
  const dz = G.P.z - wt.position.z;
  const d = Math.hypot(dx, dz) || 1;

  if (TOR.trapped){
    TOR.phase += dt;
    TOR.angle += dt * 6;
    TOR.radius = Math.max(8, TOR.radius - dt * 18);
    TOR.height = Math.min(250, TOR.height + dt * 50);

    G.P.x = wt.position.x + Math.cos(TOR.angle) * TOR.radius;
    G.P.z = wt.position.z + Math.sin(TOR.angle) * TOR.radius;
    G.P.y = TOR.height;
    G.P.vy = 0;
    G.P.fs = 0;

    if (TOR.phase > 2.5){
      TOR.trapped = false;
      TOR.flingTime = 1.2;
      TOR.flingVX = Math.cos(TOR.angle) * 500;
      TOR.flingVZ = Math.sin(TOR.angle) * 500;
      TOR.flingVY = 200;
      say('Dave: "WHHHOOOAAA!"', 2);
    }
  } else if (d < 60 && G.P.y < 320){
    TOR.trapped = true;
    TOR.phase = 0;
    TOR.angle = Math.atan2(dz, dx);
    TOR.radius = d;
    TOR.height = G.P.y;
    say('Dave: "OH NO—"', 1.2);
  } else if (d < 220 && G.P.y < 360){
    const pull = ((220 - d) / 220) * 500;
    G.P.x -= (dx / d) * pull * dt;
    G.P.z -= (dz / d) * pull * dt;
  }

  if (wtT > 22){ wt.visible = false; wtA = false; TOR.trapped = false; TOR.flingTime = 0; }
}

function tickAsteroid(dt){
  if (!astA) return;
  astT += dt;
  ast.position.x += astVel.x * dt;
  ast.position.y += astVel.y * dt;
  ast.position.z += astVel.z * dt;
  const u = ast.userData;
  u.main.rotation.x += dt * 0.3;
  u.main.rotation.y += dt * 0.2;

  for (let i = u.NAT - 1; i > 0; i--){
    u.atPos[i*3]     = u.atPos[(i-1)*3];
    u.atPos[i*3 + 1] = u.atPos[(i-1)*3 + 1];
    u.atPos[i*3 + 2] = u.atPos[(i-1)*3 + 2];
  }
  u.atPos[0] = ast.position.x;
  u.atPos[1] = ast.position.y;
  u.atPos[2] = ast.position.z + 60;
  u.atGeo.attributes.position.needsUpdate = true;

  if (astT > 1.5 && astT < 3.5) G.shake = Math.max(G.shake, 1.2);
  if (astT > 6){ ast.visible = false; astA = false; }
}

function tickSharks(dt){
  for (const s of sharkPool){
    if (!s.active) continue;
    s.life -= dt;
    s.phase += dt;

    /* Lock target or pick new */
    if (!s.target || !s.target.visible) s.target = findNearestSlice(s.obj.position);

    if (s.target){
      const dx = s.target.position.x - s.obj.position.x;
      const dy = s.target.position.y - s.obj.position.y;
      const dz = s.target.position.z - s.obj.position.z;
      const d = Math.hypot(dx, dy, dz) || 1;

      s.obj.rotation.y = Math.atan2(dx, dz) + Math.PI;
      s.obj.rotation.z = Math.sin(s.phase * 3) * 0.15;

      if (d < 18){
        /* Eat the pizza */
        s.target.visible = false;
        spawnExplosion(s.target.position, 0xffaa33);
        s.target = null;
      } else {
        const sp = 95;
        s.obj.position.x += (dx/d) * sp * dt;
        s.obj.position.y += (dy/d) * sp * dt;
        s.obj.position.z += (dz/d) * sp * dt;
      }
    } else {
      /* No pizza — drift forward in world */
      s.obj.position.z -= 15 * dt;
    }

    if (s.life <= 0){ s.active = false; s.obj.visible = false; }
  }
}

function tickDragons(dt){
  for (const d of dragonPool){
    if (!d.active) continue;
    d.life -= dt;
    d.phase += dt;

    const u = d.obj.userData;
    const flap = Math.sin(d.phase * 5) * 0.7;
    u.wl.rotation.z = flap;
    u.wr.rotation.z = -flap;

    u.pieces.forEach((s, i) => {
      s.position.y = Math.sin(d.phase * 2.5 + i * 0.4) * 2;
      s.position.x = Math.sin(d.phase * 1.8 + i * 0.4) * 2;
    });

    /* Fly toward player */
    const dx = G.P.x - d.obj.position.x;
    const dz = G.P.z - d.obj.position.z;
    const dl = Math.hypot(dx, dz) || 1;
    d.obj.position.x += (dx/dl) * 55 * dt;
    d.obj.position.z += (dz/dl) * 55 * dt;
    d.obj.position.y += Math.sin(d.phase * 1.5) * 3 * dt;
    d.obj.rotation.y = Math.atan2(dx, dz) + Math.PI;

    /* Fire breath */
    for (let i = 0; i < u.NDRF; i++){
      const v = u.drfV[i];
      if (v.life > 0){
        v.life -= dt;
        u.drfPos[i*3]     += v.x * dt;
        u.drfPos[i*3 + 1] += v.y * dt;
        u.drfPos[i*3 + 2] += v.z * dt;
        if (v.life <= 0) u.drfPos[i*3 + 1] = -99999;
      } else if (Math.random() < 0.35){
        u.drfPos[i*3]     = d.obj.position.x;
        u.drfPos[i*3 + 1] = d.obj.position.y;
        u.drfPos[i*3 + 2] = d.obj.position.z + 20;
        v.x = (Math.random()-0.5) * 25;
        v.y = (Math.random()-0.5) * 20 + 8;
        v.z = (Math.random()-0.5) * 25;
        v.life = 1 + Math.random() * 0.7;
      }
    }
    u.drfGeo.attributes.position.needsUpdate = true;

    /* Retreat if it gets too close to the player (never crashes) */
    if (dl < 90){
      d.obj.position.x -= (dx/dl) * 40 * dt;
      d.obj.position.z -= (dz/dl) * 40 * dt;
    }

    if (d.life <= 0){ d.active = false; d.obj.visible = false; }
  }
}

function tickOctopus(dt){
  if (!octA) return;
  octT += dt;
  const u = oct.userData;

  /* Tentacle sway — group base stays anchored, only the tips swing */
  u.tentacles.forEach((t, i) => {
    t.grp.rotation.y = Math.sin(octT * 0.7 + i * 0.8) * 0.35;
    t.grp.rotation.x = Math.cos(octT * 0.6 + i * 0.8) * 0.12;
    t.grp.rotation.z = Math.sin(octT * 0.9 + i * 1.2) * 0.10;
  });

  /* Head sway + jaw chomp */
  u.body.rotation.y = Math.sin(octT * 0.4) * 0.08;
  u.mouth.scale.y = 0.7 + Math.abs(Math.sin(octT * 2)) * 0.3;

  if (octT > 25){ oct.visible = false; octA = false; }
}

/* ============================================================
   MASTER SPAWN TIMER
   ============================================================ */
let spawnT = 8;
let sharkTimer = 4;
let dragonTimer = 6;

export function resetAmbient(){
  wt.visible = false;  wtA = false;  wtT = 0; wtSpin = 0;
  TOR.trapped = false; TOR.flingTime = 0; TOR.phase = 0;

  ast.visible = false; astA = false; astT = 0;

  sharkPool.forEach(s => { s.active = false; s.obj.visible = false; s.target = null; });
  dragonPool.forEach(d => { d.active = false; d.obj.visible = false; });

  oct.visible = false; octA = false; octT = 0;

  explosions.slice().forEach(e => {
    S.remove(e.mesh);
    e.mesh.geometry.dispose();
    e.mesh.material.dispose();
  });
  explosions.length = 0;

  spawnT = 8;
  sharkTimer = 4;
  dragonTimer = 6;
}

/* ============================================================
   PICK ONE
   ============================================================ */
function pickOne(){
  const opts = [];
  if (G.alt < 600) opts.push('wt', 'oct');
  if (G.alt > 40 && G.alt < 2400) opts.push('drg', 'drg', 'drg');
  if (G.alt > 80 && G.alt < 2000) opts.push('shk', 'shk', 'shk');
  if (G.alt > 150) opts.push('ast', 'ast');

  if (opts.length === 0) opts.push('ast');
  const e = opts[(Math.random() * opts.length) | 0];

  const { fx, fz } = fwd();
  const d = 400 + Math.random() * 300;
  const ax = G.P.x + fx * d;
  const az = G.P.z + fz * d;

  if (e === 'wt'){
    wt.position.set(ax, 0, az);
    wt.visible = true; wtA = true; wtT = 0; wtSpin = 0;
    TOR.trapped = false; TOR.flingTime = 0;
    say('Dave: "Is that a... water tornado?"', 3);
  } else if (e === 'ast'){
    ast.position.set(
      G.P.x + fx * 400 - fz * 500,
      G.P.y + 200 + Math.random()*100,
      G.P.z + fz * 400 + fx * 500
    );
    astVel.set(fz * 200, -10, -fx * 200);
    ast.visible = true; astA = true; astT = 0;
    say('Dave: "...that\'s a big rock."', 3);
  } else if (e === 'shk'){
    if (spawnShark()) say('Dave: "...shark?"', 2.5);
  } else if (e === 'drg'){
    spawnDragon();
  } else if (e === 'oct'){
    oct.position.set(ax, 0, az);
    oct.visible = true; octA = true; octT = 0;
    say('Dave: "...is that a tentacle?"', 3);
  }
}

/* ============================================================
   MASTER TICK
   ============================================================ */
export function tickAmbient(dt){
  if (G.mode !== 'play') return;

  /* Periodic random event */
  spawnT -= dt;
  if (spawnT <= 0){
    pickOne();
    spawnT = 10 + Math.random() * 15;
  }

  /* Extra shark and dragon slots pop in more often */
  sharkTimer -= dt;
  if (sharkTimer <= 0){
    if (G.alt > 80 && G.alt < 2000) spawnShark();
    sharkTimer = 6 + Math.random() * 6;
  }
  dragonTimer -= dt;
  if (dragonTimer <= 0){
    if (G.alt > 40 && G.alt < 2400) spawnDragon();
    dragonTimer = 8 + Math.random() * 7;
  }

  /* Flung out of tornado coast */
  if (TOR.flingTime > 0){
    G.P.x += TOR.flingVX * dt;
    G.P.z += TOR.flingVZ * dt;
    G.P.y += TOR.flingVY * dt;
    TOR.flingVX *= 0.95;
    TOR.flingVZ *= 0.95;
    TOR.flingVY -= 80 * dt;
    TOR.flingTime -= dt;
    if (G.P.y < 14) G.P.y = 14;
  }

  tickTornado(dt);
  tickAsteroid(dt);
  tickSharks(dt);
  tickDragons(dt);
  tickOctopus(dt);
  tickExplosions(dt);
                                                   }
