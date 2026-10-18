import { T, rnd } from './utils.js';
import { G } from './game.js';
import { S } from './scene.js';
import { say } from './ui.js';

function M(c, o){ return new T.MeshLambertMaterial(Object.assign({color:c, fog:false}, o||{})); }
function MB(c, o){ return new T.MeshBasicMaterial(Object.assign({color:c, fog:false}, o||{})); }
function fwd(){ return { fx: Math.sin(G.P.yaw), fz: -Math.cos(G.P.yaw) }; }

/* ============ WATER TORNADO ============ */
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

/* ============ ASTEROID ============ */
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

/* ============ SKY SHARK ============ */
const shark = new T.Group(); S.add(shark);
{
  const body = M(0x445566);
  const belly = M(0x99aabb);

  const torso = new T.Mesh(new T.SphereGeometry(1, 20, 14), body);
  torso.scale.set(8, 5, 22);
  shark.add(torso);

  const b = new T.Mesh(new T.SphereGeometry(1, 14, 10), belly);
  b.scale.set(6, 2.5, 18);
  b.position.y = -2;
  shark.add(b);

  const fin = new T.Mesh(new T.ConeGeometry(2.5, 10, 4), body);
  fin.position.y = 5;
  fin.rotation.x = -Math.PI/5;
  shark.add(fin);

  const tailTop = new T.Mesh(new T.ConeGeometry(3, 12, 4), body);
  tailTop.position.set(0, 3, 20);
  tailTop.rotation.x = Math.PI/2;
  shark.add(tailTop);
  const tailBot = new T.Mesh(new T.ConeGeometry(2, 8, 4), body);
  tailBot.position.set(0, -2, 20);
  tailBot.rotation.x = Math.PI/2;
  shark.add(tailBot);

  const snout = new T.Mesh(new T.ConeGeometry(5, 12, 8), body);
  snout.position.z = -20;
  snout.rotation.x = -Math.PI/2;
  shark.add(snout);

  const mouth = new T.Mesh(new T.BoxGeometry(8, 1.5, 6), MB(0x110000));
  mouth.position.set(0, -2.5, -16);
  shark.add(mouth);

  for (let i = 0; i < 10; i++){
    const tooth = new T.Mesh(new T.ConeGeometry(0.4, 1.2, 4), MB(0xffffff));
    tooth.position.set(-3.6 + i*0.8, -1.8, -18);
    tooth.rotation.x = Math.PI;
    shark.add(tooth);
  }

  for (const sx of [-1, 1]){
    const eye = new T.Mesh(new T.SphereGeometry(0.8, 8, 8), MB(0x000000));
    eye.position.set(sx*3.5, 1.5, -17);
    shark.add(eye);
    const pfin = new T.Mesh(new T.ConeGeometry(2, 8, 4), body);
    pfin.position.set(sx*7, -1, -3);
    pfin.rotation.z = sx * Math.PI/3;
    shark.add(pfin);
  }

  shark.userData = { phase: 0 };
}
shark.visible = false;
let shkA = false, shkT = 0;

/* ============ DRAGON ============ */
const drg = new T.Group(); S.add(drg);
{
  const red = M(0x882222);
  const redD = M(0x551111);

  const pieces = [];
  for (let i = 0; i < 10; i++){
    const s = new T.Mesh(new T.SphereGeometry(4 - i*0.35, 10, 8), red);
    s.position.z = i * 3.5;
    drg.add(s);
    pieces.push(s);
  }

  const head = new T.Mesh(new T.SphereGeometry(3.5, 14, 10), red);
  head.scale.set(1.1, 1, 1.4);
  head.position.z = -5;
  drg.add(head);

  const snout = new T.Mesh(new T.ConeGeometry(1.8, 5, 6), red);
  snout.position.z = -9;
  snout.rotation.x = -Math.PI/2;
  drg.add(snout);

  for (const sx of [-1, 1]){
    const horn = new T.Mesh(new T.ConeGeometry(0.7, 4, 5), redD);
    horn.position.set(sx*2, 3, -4);
    horn.rotation.x = -0.4;
    drg.add(horn);
    const eye = new T.Mesh(new T.SphereGeometry(0.6, 8, 8), MB(0xffdd00));
    eye.position.set(sx*1.5, 1, -6);
    drg.add(eye);
    const pup = new T.Mesh(new T.SphereGeometry(0.25, 6, 6), MB(0x000000));
    pup.position.set(sx*1.5, 1, -6.5);
    drg.add(pup);
  }

  const wl = new T.Group(); wl.position.set(-2, 1, 0);
  const wlm = new T.Mesh(new T.PlaneGeometry(14, 10), redD);
  wlm.position.x = -7;
  wlm.material.side = T.DoubleSide;
  wl.add(wlm);
  drg.add(wl);

  const wr = new T.Group(); wr.position.set(2, 1, 0);
  const wrm = new T.Mesh(new T.PlaneGeometry(14, 10), redD);
  wrm.position.x = 7;
  wrm.material.side = T.DoubleSide;
  wr.add(wrm);
  drg.add(wr);

  const NDRF = 80;
  const drfPos = new Float32Array(NDRF*3);
  for (let i = 0; i < NDRF; i++) drfPos[i*3+1] = -99999;
  const drfGeo = new T.BufferGeometry();
  drfGeo.setAttribute('position', new T.BufferAttribute(drfPos, 3));
  const drfPts = new T.Points(drfGeo, new T.PointsMaterial({
    color:0xff6600, size:8, transparent:true, opacity:0.9,
    blending:T.AdditiveBlending, depthWrite:false, fog:false
  }));
  drg.add(drfPts);

  drg.userData = {
    pieces, wl, wr,
    drfPos, drfGeo, NDRF,
    drfV: Array.from({length:NDRF}, () => ({x:0,y:0,z:0,life:0}))
  };
}
drg.visible = false;
let drgA = false, drgT = 0;

/* ============ OCTOPUS ============ */
const oct = new T.Group(); S.add(oct);
{
  const pur = M(0x882288);

  const head = new T.Mesh(new T.SphereGeometry(25, 18, 14), pur);
  head.scale.set(1.3, 1.6, 1.2);
  head.position.y = 220;
  oct.add(head);

  for (const sx of [-1, 1]){
    const eye = new T.Mesh(new T.SphereGeometry(4, 12, 10), MB(0xffee00));
    eye.position.set(sx*14, 230, -22);
    oct.add(eye);
    const pup = new T.Mesh(new T.SphereGeometry(1.5, 8, 8), MB(0x000000));
    pup.position.set(sx*14, 230, -25);
    oct.add(pup);
  }

  const tents = [];
  for (let i = 0; i < 6; i++){
    const a = i / 6 * Math.PI * 2;
    const ox = Math.cos(a) * 20;
    const oz = Math.sin(a) * 20;
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(ox, 200, oz),
      new T.Vector3(ox + Math.cos(a)*15, 160, oz + Math.sin(a)*15),
      new T.Vector3(ox + Math.cos(a)*35, 110, oz + Math.sin(a)*35),
      new T.Vector3(ox + Math.cos(a)*50, 60,  oz + Math.sin(a)*50),
      new T.Vector3(ox + Math.cos(a)*40, 20,  oz + Math.sin(a)*40),
    ]);
    const geo = new T.TubeGeometry(curve, 30, 6, 8, false);
    const m = new T.Mesh(geo, pur);
    oct.add(m);
    tents.push(m);
  }

  oct.userData = { head, tents };
}
oct.visible = false;
let octA = false, octT = 0;

/* ============ MASTER ============ */
let spawnT = 12 + Math.random() * 10;

export function resetAmbient(){
  wt.visible = false;  wtA = false;  wtT = 0;
  ast.visible = false; astA = false; astT = 0;
  shark.visible = false; shkA = false; shkT = 0;
  drg.visible = false; drgA = false; drgT = 0;
  oct.visible = false; octA = false; octT = 0;
  spawnT = 12 + Math.random() * 10;
}

function spawnOne(e){
  const { fx, fz } = fwd();
  const d = 400 + Math.random() * 300;
  const ax = G.P.x + fx * d;
  const az = G.P.z + fz * d;

  if (e === 'wt'){
    wt.position.set(ax, 0, az);
    wt.visible = true; wtA = true; wtT = 0; wtSpin = 0;
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
    shark.position.set(ax, G.P.y + 60, az);
    shark.visible = true; shkA = true; shkT = 0;
    shark.userData.phase = 0;
    say('Dave: "...shark?"', 2.5);
  } else if (e === 'drg'){
    drg.position.set(ax, G.P.y + 30, az);
    drg.visible = true; drgA = true; drgT = 0;
    drg.userData.drfV.forEach(v => { v.life = 0; });
  } else if (e === 'oct'){
    oct.position.set(ax, 0, az);
    oct.visible = true; octA = true; octT = 0;
    say('Dave: "...is that a tentacle?"', 3);
  }
}

function pickOne(){
  const opts = [];
  if (G.alt < 600) opts.push('wt', 'oct');
  if (G.alt > 80 && G.alt < 900) opts.push('drg');
  if (G.alt > 200 && G.alt < 1500) opts.push('shk');
  if (G.alt > 150) opts.push('ast');
  if (opts.length === 0) opts.push('ast');
  spawnOne(opts[(Math.random()*opts.length)|0]);
}

export function tickAmbient(dt){
  if (G.mode !== 'play') return;

  spawnT -= dt;
  if (spawnT <= 0){
    pickOne();
    spawnT = 20 + Math.random() * 25;
  }

  /* TORNADO */
  if (wtA){
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
    if (wtT > 20){ wt.visible = false; wtA = false; }
  }

  /* ASTEROID */
  if (astA){
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

  /* SKY SHARK */
  if (shkA){
    shkT += dt;
    const u = shark.userData;
    u.phase += dt * 1.5;
    const { fx, fz } = fwd();
    shark.position.x += fx * G.P.fs * 0.9 * dt;
    shark.position.z += fz * G.P.fs * 0.9 * dt;
    shark.position.y += Math.sin(u.phase * 2) * 0.5;
    shark.rotation.z = Math.sin(u.phase) * 0.15;
    if (shkT > 18){ shark.visible = false; shkA = false; }
  }

  /* DRAGON */
  if (drgA){
    drgT += dt;
    const u = drg.userData;
    const flap = Math.sin(drgT * 5) * 0.7;
    u.wl.rotation.z = flap;
    u.wr.rotation.z = -flap;

    u.pieces.forEach((s, i) => {
      s.position.y = Math.sin(drgT * 2.5 + i * 0.4) * 2;
      s.position.x = Math.sin(drgT * 1.8 + i * 0.4) * 2;
    });

    // Fly toward player
    const dx = G.P.x - drg.position.x;
    const dz = G.P.z - drg.position.z;
    const dl = Math.hypot(dx, dz) || 1;
    drg.position.x += (dx/dl) * 40 * dt;
    drg.position.z += (dz/dl) * 40 * dt;
    drg.rotation.y = Math.atan2(dx, dz) + Math.PI;

    // Fire breath
    for (let i = 0; i < u.NDRF; i++){
      const v = u.drfV[i];
      if (v.life > 0){
        v.life -= dt;
        u.drfPos[i*3]     += v.x * dt;
        u.drfPos[i*3 + 1] += v.y * dt;
        u.drfPos[i*3 + 2] += v.z * dt;
        if (v.life <= 0) u.drfPos[i*3 + 1] = -99999;
      } else if (Math.random() < 0.3){
        u.drfPos[i*3]     = drg.position.x;
        u.drfPos[i*3 + 1] = drg.position.y;
        u.drfPos[i*3 + 2] = drg.position.z + 20;
        v.x = (Math.random()-0.5) * 25;
        v.y = (Math.random()-0.5) * 20 + 8;
        v.z = (Math.random()-0.5) * 25;
        v.life = 1 + Math.random() * 0.7;
      }
    }
    u.drfGeo.attributes.position.needsUpdate = true;

    if (drgT > 12){ drg.visible = false; drgA = false; }
  }

  /* OCTOPUS */
  if (octA){
    octT += dt;
    const u = oct.userData;
    u.tents.forEach((t, i) => {
      t.rotation.z = Math.sin(octT * 0.8 + i * 1.2) * 0.25;
      t.rotation.x = Math.cos(octT * 0.6 + i * 1.2) * 0.15;
    });
    u.head.rotation.y = Math.sin(octT * 0.5) * 0.1;
    if (octT > 22){ oct.visible = false; octA = false; }
  }
                       }
