import { T, cl, setSeed, rnd, $ } from './utils.js';
import { CFG, best, saveCfg } from './config.js';
import { G, dist } from './game.js';
import { R, S, cam, PIXEL, setPR, resize } from './scene.js';
import { initInput, K, INPUT, stick } from './input.js';
import { sfx, tickAudio, setGain } from './audio.js';
import { say, tickHud, checkMission } from './ui.js';

import { sky, palette } from './sky.js';
import { gm, ground, gt, GROUND_TILE } from './world/ground.js';
import { town, laySt } from './world/town.js';
import { traf, updCars, pedG, updPeds } from './world/traffic.js';
import { cm, cls, NC, spawnCloud, recycleClouds, attachEyes, resetEyeTracker } from './world/clouds.js';
import { sl, ob, rg, pattern, rebuildSlices } from './world/items.js';
import { dave, animD } from './player/dave.js';
import { tp, tickTrail } from './player/trail.js';
import { room, tickTV, rebuildTablePizza } from './room/livingroom.js';
import { startIntro, skipIntro, introStep } from './room/intro.js';
import { tickPigeon, tickBirds, tickFlybys, resetFlybys, resetBirds, resetPigeon } from './creatures.js';
import { tickSpace, aurora, aurora2 } from './space.js';
import { tickKingKong, resetKingKong } from './kingkong.js';
import { tickDebris, tickWeather, resetWeather, setCrashed } from './effects.js';
import { setPizzaModel } from './pizza.js';

const SPAWN_LEAD = 440;

/* ---------- Cloud eyes ---------- */
function makeEye(){
  const g = new T.Group();
  for (const sg of [-1,1]){
    const eyeGroup = new T.Group();
    eyeGroup.position.x = sg * 1.6;

    const white = new T.Mesh(
      new T.SphereGeometry(1, 20, 16),
      new T.MeshBasicMaterial({color:0xf0ede4})
    );
    eyeGroup.add(white);

    const lookAt = new T.Group();
    lookAt.name = 'lookAt';
    eyeGroup.add(lookAt);

    const iris = new T.Mesh(
      new T.SphereGeometry(0.5, 20, 12),
      new T.MeshBasicMaterial({color:0x5a3a1a})
    );
    iris.scale.set(1, 1, 0.4);
    iris.position.z = 0.82;
    lookAt.add(iris);

    const pupil = new T.Mesh(
      new T.SphereGeometry(0.25, 16, 10),
      new T.MeshBasicMaterial({color:0x050505})
    );
    pupil.scale.set(1, 1, 0.5);
    pupil.position.z = 0.94;
    lookAt.add(pupil);

    const glint = new T.Mesh(
      new T.CircleGeometry(0.08, 10),
      new T.MeshBasicMaterial({color:0xffffff, side:T.DoubleSide})
    );
    glint.position.set(-0.15, 0.15, 1.02);
    lookAt.add(glint);

    g.add(eyeGroup);
  }
  g.visible = false;
  g.userData.free = true;
  return g;
}

const eyeG = [];
for (let i = 0; i < 16; i++){
  const g = makeEye();
  S.add(g);
  eyeG.push(g);
}
attachEyes(eyeG);

const _eyePos = new T.Vector3();
const _eyeDir = new T.Vector3();
const _zAxis  = new T.Vector3(0, 0, 1);

function updEyes(){
  for (let i = 0; i < NC; i++){
    const g = cls[i].eg;
    if (!g) continue;
    const bl = Math.sin(G.tt * .8 + i * 3.1) > .98 ? .1 : 1;
    g.scale.y = g.scale.x * bl;
    g.children.forEach(eyeGroup => {
      const lookAt = eyeGroup.getObjectByName('lookAt');
      if (!lookAt) return;
      _eyePos.set(
        g.position.x + eyeGroup.position.x * g.scale.x,
        g.position.y + eyeGroup.position.y * g.scale.y,
        g.position.z + eyeGroup.position.z * g.scale.z
      );
      _eyeDir.subVectors(cam.position, _eyePos).normalize();
      lookAt.quaternion.setFromUnitVectors(_zAxis, _eyeDir);
    });
  }
}

/* ---------- pizza.glb ---------- */
if (T.GLTFLoader){
  new T.GLTFLoader().load('assets/pizza.glb', gl => {
    const m = gl.scene;
    const b = new T.Box3().setFromObject(m);
    const sz = b.getSize(new T.Vector3());
    const ct = b.getCenter(new T.Vector3());
    m.position.sub(ct);
    const w = new T.Group(); w.add(m);
    const k = 2.6 / Math.max(sz.x, sz.z);
    w.scale.setScalar(k);
    if (sz.y > Math.max(sz.x, sz.z) * .8) m.rotation.x = -Math.PI/2;
    setPizzaModel(w);
    rebuildSlices();
    rebuildTablePizza();
  }, undefined, () => {});
}

/* ---------- settings ---------- */
function updateSettingsLabels(){
  $('so').textContent = 'Sound: ' + (CFG.snd ? 'on' : 'off');
  $('iv').textContent = 'Invert up/down: ' + (CFG.inv ? 'on' : 'off');
  $('lw').textContent = 'Low effects: ' + (CFG.low ? 'on' : 'off');
  $('best').textContent = best ? 'Best score: ' + best : '';
}
$('so').onclick = () => { CFG.snd = !CFG.snd; setGain(CFG.snd); saveCfg(); updateSettingsLabels(); };
$('iv').onclick = () => { CFG.inv = !CFG.inv; saveCfg(); updateSettingsLabels(); };
$('lw').onclick = () => {
  CFG.low = !CFG.low;
  saveCfg();
  setPR(CFG.low ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  updateSettingsLabels();
};

/* ---------- mode transitions ---------- */
function startPlay(){
  G.mode = 'play';
  G.P.x = 50;
  G.P.z = 51.9;
  G.P.yaw = 0;
  G.P.vx = 0;
  G.P.fs = 8;
  room.visible = false;
  $('sk').classList.add('h');
  ['sc','di','ms','bb','bo','pb'].forEach(id => $(id).classList.remove('h'));
  say('RIGHT THEN, DAVE. WHERE TO?', 4.5);
  G.spawnAccum = 0;
  G.spawnGap = 60;
  for (let i = 0; i < NC; i++) spawnCloud(i, true);
  cam.position.set(G.P.x, G.P.y + 3.2, G.P.z + 14);
  cam.lookAt(G.P.x, G.P.y + 1.2, G.P.z - 25);
}

function restart(){
  G.P.x = 50; G.P.y = 60; G.P.z = 51.9;
  resetRun();
  room.visible = false;
  G.mode = 'play';
  $('pause').classList.add('h');
  ['sc','di','ms','bb','bo','pb'].forEach(id => $(id).classList.remove('h'));
  say('Round two. Mind the sofas.', 3);
}

function togglePause(){
  if (G.mode === 'play'){ G.mode = 'pause'; $('pause').classList.remove('h'); INPUT.boostBtn = false; }
  else if (G.mode === 'pause'){ G.mode = 'play'; $('pause').classList.add('h'); last = performance.now(); }
}

function resetRun(){
  setSeed(20260 + (Math.random()*9999|0));
  G.Q = { slices:0, rings:0, bumps:0, clean:0, bonus:0, golds:0 };
  G.mi = 0; G.mbase = 0;
  G.P.vx = 0; G.P.vy = 0; G.P.fs = 0; G.P.boost = 0; G.P.meter = 1; G.P.hit = 0; G.P.yaw = 0;
  G.totalDist = 0;
  G.spawnAccum = 0;
  G.spawnGap = 60;
  resetEyeTracker();
  [sl, ob, rg].forEach(a => a.forEach(o => o.visible = false));
  for (let i = 0; i < NC; i++) spawnCloud(i, true);
  for (let k = 0; k < 5; k++){
    const ahead = 130 + k * 85;
    pattern(G.P.x, G.P.y, G.P.z - ahead, 0, -1);
  }
  tp.fill(-9999);
  G.hc = [1e9, 1e9];
  resetFlybys();
  resetKingKong();
  resetBirds();
  resetPigeon();
  resetWeather();
  setCrashed(false);
}

initInput(togglePause);
$('go').onclick  = startIntro;
$('sk').onclick  = skipIntro;
$('pb').onclick  = togglePause;
$('rs').onclick  = togglePause;
$('rst').onclick = restart;
updateSettingsLabels();

function tickAurora(){
  aurora.position.set(G.P.x, G.P.y + 400, G.P.z - 2200);
  aurora2.position.set(G.P.x, G.P.y + 350, G.P.z - 2100);
  aurora.rotation.z = Math.sin(G.tt * .15) * .15;
  aurora2.rotation.z = .4 + Math.sin(G.tt * .2) * .2;
}

/* ---------- play step ---------- */
function play(dt){
  let ix = cl(stick.x + ((K.ArrowRight||K.KeyD)?1:0) - ((K.ArrowLeft||K.KeyA)?1:0), -1, 1);
  let iy = cl(stick.y + ((K.ArrowUp||K.KeyW)?1:0) - ((K.ArrowDown||K.KeyS)?1:0), -1, 1);
  if (CFG.inv) iy = -iy;

  const wb = (INPUT.boostBtn || K.Space || K.ShiftLeft) && G.P.meter > .03;
  G.P.boost += ((wb ? 1 : 0) - G.P.boost) * (1 - Math.exp(-5*dt));
  G.P.meter = cl(G.P.meter + (wb ? -.26 : .09) * dt);
  if (wb && !G.P.wasB) sfx.boost();
  G.P.wasB = wb;

  /* NO YAW — the player always flies forward along -Z.
     Left/right now strafes sideways. The camera never rotates. */
  G.P.yaw = 0;
  const fx = 0, fz = -1;

  /* strafe velocity: lerps toward the joystick input */
  G.P.vx += (ix * 32 - G.P.vx) * (1 - Math.exp(-4*dt));

  const base = 38 + Math.min(22, dist()/90);
  G.P.fs += (base * (1 + G.P.boost*.9) * (G.P.hit > 0 ? .55 : 1) - G.P.fs) * (1 - Math.exp(-3*dt));
  G.P.hit = Math.max(0, G.P.hit - dt);
  G.P.vy += (iy*26*(1 + G.P.boost*.9) + 6 - G.P.vy) * (1 - Math.exp(-3*dt));

  for (const c of cls){
    if (!c.gold) continue;
    const dx = G.P.x - c.x, dy = G.P.y - c.y, dz = G.P.z - c.z;
    const i = dx*dx + dy*dy + dz*dz < c.r*c.r*.8;
    if (i){
      G.P.vy += 45*dt;
      if (!c.in){ sfx.up(); say('Dave: "Ooh, a golden updraft."', 2); }
    }
    c.in = i;
  }

  G.P.x += G.P.vx * dt;
  G.P.y += G.P.vy * dt;
  G.P.z += fz * G.P.fs * dt;
  if (G.P.y < 14){ G.P.y = 14; G.P.vy = Math.max(G.P.vy, 0); }
  G.Q.clean = G.Q.bumps ? Math.max(0, G.Q.clean + G.P.fs*dt) : G.Q.clean + G.P.fs*dt;
  G.alt = G.P.y;
  G.totalDist += G.P.fs * dt;

  const sp = cl((G.P.fs - 30)/70);
  dave.position.set(G.P.x, G.P.y, G.P.z);
  /* Dave faces slightly toward his travel direction so strafing reads clearly,
     but never more than ~40° off forward. */
  dave.rotation.y = Math.atan2(G.P.vx, G.P.fs + 0.001);
  dave.visible = G.P.hit <= 0 || ((G.P.hit*12)|0) % 2 === 0;
  animD(dt, -.4 - .7*sp - .15*G.P.boost + .5*iy, -ix*.6, .3 + .9*G.P.boost + .2*Math.abs(ix), sp, G.tt);

  G.spawnAccum += G.P.fs * dt;
  while (G.spawnAccum > G.spawnGap){
    G.spawnAccum -= G.spawnGap;
    const ax = G.P.x + fx * SPAWN_LEAD;
    const az = G.P.z + fz * SPAWN_LEAD;
    pattern(ax, G.P.y, az, fx, fz);
    G.spawnGap = Math.max(55, 88 - dist()/150);
  }

  for (const o of sl){
    if (!o.visible) continue;
    const u = o.userData;
    u.age += dt;
    o.scale.setScalar(Math.min(1, u.age*2) * (u.gold ? 1.5 : 1));
    o.rotation.y += dt*2.2;
    o.rotation.z = Math.sin(G.tt*2 + o.id) * .3;
    const dx = G.P.x - o.position.x, dy = G.P.y - o.position.y, dz = G.P.z - o.position.z;
    const d2 = dx*dx + dy*dy + dz*dz;
    if (d2 < 400){
      const f = (1 - Math.sqrt(d2)/20) * 7 * dt;
      o.position.x += dx*f; o.position.y += dy*f; o.position.z += dz*f;
    }
    if (d2 < 14){
      o.visible = false;
      if (u.gold){ G.Q.golds++; say('Golden slice! Dave: "Posh."', 1.8); }
      else G.Q.slices++;
      sfx.chime(u.gold);
    } else if (o.position.z > G.P.z + 50) o.visible = false;
  }

  for (const o of ob){
    if (!o.visible) continue;
    const u = o.userData;
    u.age += dt;
    o.scale.setScalar(Math.min(1, u.age*1.5));
    const k = u.k;
    if (k === 0) o.children[0].children[0].parent.rotation.z += dt*.8;
    else o.rotation.y += dt * (k === 1 ? .5 : .9);
    if (k === 2) o.rotation.z += dt*.7;
    const dx = G.P.x - o.position.x, dy = G.P.y - o.position.y, dz = G.P.z - o.position.z;
    const r = (k === 0 ? 6.5 : k === 1 ? 6.2 : 6.6) + 2;
    if (G.P.hit <= 0 && dx*dx + dy*dy + dz*dz < r*r && u.age > .5){
      G.P.hit = 1.4; G.P.fs *= .4;
      G.Q.bumps++; G.Q.clean = 0;
      G.shake = 1;
      sfx.hit();
      say(['Dave: "Ow. Rude."', 'Dave: "Who parks a sofa up here?"', 'Dave: "Mind the doughnut, mate."'][Math.random()*3|0], 2);
    }
    if (o.position.z > G.P.z + 60) o.visible = false;
  }

  for (const o of rg){
    if (!o.visible) continue;
    const u = o.userData;
    u.age += dt;
    o.material.color.setHSL((G.tt*.3 + o.id*.1) % 1, .8, .65);
    o.scale.setScalar(Math.min(1, u.age*1.5));
    if (!u.done && o.position.z > G.P.z){
      u.done = true;
      const dx = G.P.x - o.position.x, dy = G.P.y - o.position.y;
      if (dx*dx + dy*dy < 80){
        G.Q.rings++;
        say(['Dave: "Showing off now."', 'Dave: "Smooth."', 'Dave: "Nailed it."'][G.Q.rings%3], 1.6);
        sfx.ring();
        G.shake = .3;
      }
    }
    if (o.position.z > G.P.z + 60) o.visible = false;
  }

  tickPigeon(dt);
  tickBirds(dt);
  tickFlybys(dt);
  tickKingKong(dt);
  checkMission();
  tickTrail(dt, G.P.boost);

  /* ---------- CAMERA: FIXED behind player, NEVER rotates ----------
     Position is set directly from player each frame.
     Look-at is always 25 units ahead along -Z.
     No rotation. No yaw. No spin. */
  cam.position.set(
    G.P.x,
    G.P.y + 3.2,
    G.P.z + 14
  );
  cam.up.set(0, 1, 0);
  cam.lookAt(
    G.P.x,
    G.P.y + 1.2,
    G.P.z - 25
  );

  if (cam.fov !== 64){
    cam.fov = 64;
    cam.updateProjectionMatrix();
  }

  tickWeather(dt);
  recycleClouds();
  tickSpace(dt);
  tickDebris(dt);
  updEyes();
  tickHud(dt);
  tickAudio(sp, G.P.boost, G.stageI);
}

/* ---------- main loop ---------- */
let last = performance.now();
let fpsA = 16, fpsC = 0;

function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min((now - last)/1000, .05);
  last = now;
  if (G.mode === 'pause') return;
  G.tt += dt;

  fpsA = fpsA + (dt*1000 - fpsA)*.05;
  if (++fpsC > 90 && fpsA > 26 && PIXEL.pr > .7 && !CFG.low){
    setPR(Math.max(.7, PIXEL.pr - .25));
    fpsC = 0;
  }

  if (G.mode === 'title'){
    tickTV(dt, true);
    cam.position.x = 50 + Math.sin(G.tt*.4) * .8;
    cam.position.y = 3.4;
    cam.position.z = 63;
    cam.lookAt(50, 1.6, 46);
  } else if (G.mode === 'intro'){
    if (introStep(dt)) startPlay();
  } else if (G.mode === 'play'){
    play(dt);
  }

  const px = G.mode === 'play' ? G.P.x : 50;
  const pz = G.mode === 'play' ? G.P.z : 51.9;
  const cx = Math.floor(px/100), cz = Math.floor(pz/100);
  if (cx !== G.hc[0] || cz !== G.hc[1]){ G.hc = [cx, cz]; laySt(cx, cz); }

  ground.position.x = px;
  ground.position.z = pz;
  gt.offset.set(px / GROUND_TILE, -pz / GROUND_TILE);
  ground.visible = G.alt < 1900;

  town.visible = G.alt < 1500;
  traf.visible = G.alt < 700;
  pedG.visible = G.alt < 300;
  if (traf.visible) updCars(px, pz);
  if (pedG.visible) updPeds(px, pz);

  sky.position.copy(cam.position);
  cm.uniforms.uS.value = R.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360));
  palette();
  tickAurora();

  R.render(S, cam);
}

/* ---------- boot ---------- */
setPR(CFG.low ? 1 : Math.min(window.devicePixelRatio || 1, 2));
resize();
laySt(0, 0);
for (let i = 0; i < NC; i++) spawnCloud(i, true);
palette();

G.P.x = 50; G.P.y = 1.45; G.P.z = 51.9; G.P.yaw = 0;
dave.position.set(50, 1.45, 51.9);
dave.visible = true;
room.visible = true;
G.mode = 'title';

requestAnimationFrame(frame);
