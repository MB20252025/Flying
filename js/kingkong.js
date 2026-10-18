import { T, cl, lp, sm, H } from './utils.js';
import { G } from './game.js';
import { S, R, cam } from './scene.js';
import { CFG } from './config.js';

/* ============================================================
   KING KONG TOWER
   - Tower sits in its own cleared town cell, dead ahead of the start
   - Kong spirals UP the building, leaps, roars + beats his chest at the top, climbs back down
   - 3 fighters circle him, banking, firing tracers; hits spark and make him flinch
   - Flames + smoke pour out of 18 windows
   - Windows / bodies / tracers are instanced = very few draw calls
   ============================================================ */

export const TX = 50, TZ = -450;                 // tower base (world). Clear town cell (0,-5) in town.js
const SEG = 24, SEGH = 90, W0 = 84, TAPER = .975;
const TOP_H = SEG * SEGH;
const segW = i => W0 * Math.pow(TAPER, i);
const widthAt = y => segW(Math.min(SEG - 1, Math.max(0, Math.floor(y / SEGH))));

const _m = new T.Matrix4(), _p = new T.Vector3(), _s = new T.Vector3(), _q = new T.Quaternion(),
      _q0 = new T.Quaternion(), _c = new T.Color(), _Z = new T.Vector3(0, 0, 1), _d = new T.Vector3();
function setI(mesh, i, x, y, z, sx, sy, sz, col){
  _p.set(x, y, z); _s.set(sx, sy, sz);
  mesh.setMatrixAt(i, _m.compose(_p, _q0, _s));
  if (col !== undefined) mesh.setColorAt(i, _c.setHex(col));
}
const ML = (c, o) => new T.MeshLambertMaterial(Object.assign({ color: c, fog: false }, o || {}));
const MB = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c, fog: false }, o || {}));

/* ---------------- tower ---------------- */
function buildTower(){
  const g = new T.Group(), unit = new T.BoxGeometry(1, 1, 1);
  const bodies = new T.InstancedMesh(unit, new T.MeshLambertMaterial({ fog: false }), SEG * 6);
  const STONE = [0x6b5a48, 0x5e5040, 0x756250, 0x655645];
  let nb = 0;
  for (let i = 0; i < SEG; i++){
    const w = segW(i), y0 = i * SEGH;
    setI(bodies, nb++, 0, y0 + SEGH / 2, 0, w, SEGH, w, STONE[i % 4]);
    setI(bodies, nb++, 0, y0 + SEGH - 1.5, 0, w + 6, 3, w + 6, 0x3a2e22);          // ledge
    for (const sx of [-1, 1]) for (const sz of [-1, 1])                              // corner pillars
      setI(bodies, nb++, sx * w / 2, y0 + SEGH / 2, sz * w / 2, 5, SEGH + .2, 5, 0x4a3d2e);
  }
  bodies.count = nb; bodies.frustumCulled = false; g.add(bodies);

  const wins = new T.InstancedMesh(unit, new T.MeshBasicMaterial({ fog: false }), SEG * 4 * 4 * 5);
  const NRM = [[0, 1], [1, 0], [0, -1], [-1, 0]], TAN = [[1, 0], [0, -1], [-1, 0], [0, 1]];
  const fireSet = new Set();
  for (let k = 0; k < 18; k++){
    const seg = 3 + Math.floor(k * (SEG - 5) / 18);
    fireSet.add(seg * 1000 + ((k * 3) % 4) * 100 + ((k * 5) % 4) * 10 + (k % 3));
  }
  const fires = []; let nw = 0;
  for (let i = 0; i < SEG; i++){
    const w = segW(i), y0 = i * SEGH, cols = Math.max(3, Math.floor(w / 16)), sp = (w - 18) / cols;
    for (let f = 0; f < 4; f++) for (let r = 0; r < 4; r++) for (let c = 0; c < cols; c++){
      const u = (c - (cols - 1) / 2) * sp, y = y0 + 14 + r * 20, n = NRM[f], t = TAN[f];
      const px = n[0] * (w / 2 + .7) + t[0] * u, pz = n[1] * (w / 2 + .7) + t[1] * u;
      const isF = fireSet.has(i * 1000 + f * 100 + r * 10 + c);
      const col = isF ? 0xff5a1a : (H(i, r * 7 + c, f) > .4 ? (H(c, i, r + f) > .5 ? 0xffd27a : 0xffb347) : 0x1a1a2a);
      setI(wins, nw, px, y, pz, (f & 1) ? 1.2 : 8, 12, (f & 1) ? 8 : 1.2, col);
      if (isF) fires.push({ x: px, y, z: pz, nx: n[0], nz: n[1], idx: nw, e: Math.random() });
      nw++;
    }
  }
  wins.count = nw; wins.frustumCulled = false; g.add(wins);

  const spire = new T.Mesh(new T.CylinderGeometry(2, 12, 150, 8), ML(0x2a1a10));
  spire.position.y = TOP_H + 75; g.add(spire);
  const beacon = new T.Mesh(new T.SphereGeometry(14, 14, 12), MB(0xff2020));
  beacon.position.y = TOP_H + 160; g.add(beacon);
  const beam = new T.Mesh(new T.CylinderGeometry(8, 8, 5000, 8),
    MB(0xff3030, { transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false }));
  beam.position.y = TOP_H + 2600; g.add(beam);
  return { g, fires, wins, beacon };
}

/* ---------------- Kong ---------------- */
function buildKong(){
  const root = new T.Group(), g = new T.Group(); root.add(g);
  const fur = ML(0x3a1a05), furDark = ML(0x1a0800), furLite = ML(0x57300f), skin = ML(0x9a7a5a),
        eyeM = MB(0xffcc22), black = MB(0x000000), white = ML(0xffffff), mouthM = ML(0x4a0a0a);
  const add = (geo, mat, x, y, z, p) => { const o = new T.Mesh(geo, mat); o.position.set(x, y, z); (p || g).add(o); return o; };
  const sph = (r, w, h) => new T.SphereGeometry(r, w || 12, h || 10);

  add(sph(3, 16, 12), fur, 0, 0, 0).scale.set(1.2, 1.8, 1.2);                // torso
  add(sph(2.6), fur, 0, 1.8, -.4).scale.set(1.6, .9, 1);                      // shoulder hump
  add(sph(2.2, 10, 8), skin, 0, .2, 1.5).scale.set(1, 1.3, .4);               // chest
  add(sph(2.4), furDark, 0, -2.6, .2).scale.set(1.3, .8, 1);                  // hips
  for (let i = 0; i < 12; i++){                                               // fur tufts
    const a = i * 2.4, t = add(new T.ConeGeometry(.5, 1.5, 5), furLite, Math.cos(a) * 3.4, 1.5 - (i % 4) * 1.4, -1.5 - Math.abs(Math.sin(a)) * 1.2);
    t.rotation.x = -1.9; t.rotation.z = Math.cos(a) * .6;
  }

  const head = new T.Group(); head.position.set(0, 4, .3); g.add(head);
  add(sph(2, 16, 12), fur, 0, 0, 0, head);
  add(sph(1.5), skin, 0, -.3, 1.2, head).scale.set(1, .9, .6);
  add(new T.BoxGeometry(3.2, .55, .7), furDark, 0, .3, 1.55, head);          // brow
  for (const sx of [-1, 1]){
    add(sph(.42, 10, 10), eyeM, sx * .65, -.05, 2.15, head);
    add(sph(.2, 8, 8), black, sx * .65, -.05, 2.5, head);
    add(sph(.55, 8, 8), skin, sx * 2, 0, 0, head);                            // ears
    add(sph(.15, 6, 5), black, sx * .28, -.55, 2.2, head);                    // nostrils
    add(new T.ConeGeometry(.14, .5, 5), white, sx * .5, -.95, 2.15, head).rotation.x = Math.PI;  // fangs
  }
  const jaw = new T.Group(); jaw.position.set(0, -1, 1); head.add(jaw);
  add(new T.BoxGeometry(1.9, .5, 1.5), mouthM, 0, -.15, .55, jaw);
  for (let i = -1; i <= 1; i++) add(new T.BoxGeometry(.3, .35, .2), white, i * .5, .1, 1.2, jaw);

  const arm = side => {
    const sh = new T.Group(); sh.position.set(side * 3.1, 1.6, 0); g.add(sh);
    add(new T.CylinderGeometry(1.1, .9, 3, 10), fur, 0, -1.5, 0, sh);
    const el = new T.Group(); el.position.y = -3; sh.add(el);
    add(sph(.95, 8, 8), fur, 0, 0, 0, el);
    add(new T.CylinderGeometry(.9, .75, 2.5, 10), fur, 0, -1.25, 0, el);
    add(sph(1.1, 10, 8), skin, 0, -2.7, 0, el).scale.set(1, 1.2, .8);
    for (let f = -1; f <= 1; f++) add(new T.BoxGeometry(.32, 1, .38), skin, f * .42, -3.5, .1, el);   // fingers
    return { sh, el };
  };
  const leg = side => {
    const hip = new T.Group(); hip.position.set(side * 1.5, -3, 0); g.add(hip);
    add(new T.CylinderGeometry(1.1, .9, 3, 10), fur, 0, -1.5, 0, hip);
    const kn = new T.Group(); kn.position.y = -3; hip.add(kn);
    add(sph(.95, 8, 8), fur, 0, 0, 0, kn);
    add(new T.CylinderGeometry(.9, .8, 2.5, 10), fur, 0, -1.25, 0, kn);
    add(new T.BoxGeometry(1.9, .8, 2.8), skin, 0, -2.7, .6, kn);
    for (let f = -1; f <= 1; f++) add(new T.BoxGeometry(.5, .5, .7), skin, f * .6, -2.7, 2.2, kn);    // toes
    return { hip, kn };
  };
  root.scale.setScalar(6);
  root.userData = { g, head, jaw, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1) };
  return root;
}

/* ---------------- fighters (nose = -Z) ---------------- */
function buildFighter(){
  const g = new T.Group(), body = ML(0x556644), light = ML(0x889966), dark = MB(0x222222);
  const add = (geo, m, x, y, z) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  add(new T.CylinderGeometry(.5, .32, 4, 8), body, 0, 0, 0).rotation.x = Math.PI / 2;
  add(new T.BoxGeometry(5, .18, 1.3), light, 0, -.1, .2);                                 // wings
  add(new T.BoxGeometry(1.8, .15, .7), light, 0, 0, 1.8);                                 // tailplane
  add(new T.BoxGeometry(.15, .9, .8), light, 0, .45, 1.8);                                // fin
  add(new T.SphereGeometry(.5, 8, 6), MB(0x88ddff), 0, .4, .3).scale.set(1, .7, 1.4);     // canopy
  for (const sx of [-1, 1]) add(new T.CylinderGeometry(.06, .06, 1, 5), dark, sx * 1.3, -.1, -.6).rotation.x = Math.PI / 2;  // guns
  const prop = new T.Group(); prop.position.z = -2.2; g.add(prop);
  prop.add(new T.Mesh(new T.BoxGeometry(.18, 3, .12), dark)); prop.add(new T.Mesh(new T.BoxGeometry(3, .18, .12), dark));
  g.userData.prop = prop; g.scale.setScalar(9); return g;
}

/* ---------------- fire / smoke / sparks (2 draw calls) ---------------- */
function mkPS(n, additive){
  const pos = new Float32Array(n * 3).fill(-99999), siz = new Float32Array(n), col = new Float32Array(n * 4);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('size', new T.BufferAttribute(siz, 1));
  geo.setAttribute('col', new T.BufferAttribute(col, 4));
  const mat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending, uniforms: { uS: { value: 600 } },
    vertexShader: 'attribute float size;attribute vec4 col;varying vec4 vC;uniform float uS;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=col;gl_PointSize=min(size*uS/max(-mv.z,1.),500.);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec4 vC;void main(){float r=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,0.,r);gl_FragColor=vec4(vC.rgb,a*a*vC.a);}'
  });
  const pts = new T.Points(geo, mat); pts.frustumCulled = false;
  const P_ = []; for (let i = 0; i < n; i++) P_.push({ l: 0, m: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s0: 1, s1: 1, k: 0 });
  return { pts, pos, siz, col, geo, mat, P_, n, head: 0 };
}
function emit(ps, k, x, y, z, vx, vy, vz, life, s0, s1){
  const p = ps.P_[ps.head]; ps.head = (ps.head + 1) % ps.n;
  p.l = p.m = life; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.s0 = s0; p.s1 = s1; p.k = k;
}
function updPS(ps, dt){
  for (let i = 0; i < ps.n; i++){
    const p = ps.P_[i];
    if (p.l <= 0){ ps.siz[i] = 0; ps.col[i * 4 + 3] = 0; continue; }
    p.l -= dt; const u = 1 - Math.max(0, p.l) / p.m;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.k === 2){ p.vx += 3 * dt; p.vy *= .995 }                       // smoke drifts
    else if (p.k === 1){ p.vy -= 40 * dt }                               // sparks fall
    ps.pos[i * 3] = p.x; ps.pos[i * 3 + 1] = p.y; ps.pos[i * 3 + 2] = p.z;
    ps.siz[i] = lp(p.s0, p.s1, u);
    let r, g, b, a;
    if (p.k === 0){ r = 1; g = u < .3 ? lp(.85, .4, u / .3) : lp(.4, .08, (u - .3) / .7); b = u < .3 ? lp(.45, .1, u / .3) : .05; a = Math.min(1, u * 10) * (1 - u) * .9 }
    else if (p.k === 1){ r = 1; g = lp(.95, .45, u); b = lp(.7, .1, u); a = (1 - u) }
    else { r = g = b = lp(.1, .28, u); a = Math.sin(Math.PI * u) * .5 }
    ps.col[i * 4] = r; ps.col[i * 4 + 1] = g; ps.col[i * 4 + 2] = b; ps.col[i * 4 + 3] = a;
  }
  ps.geo.attributes.position.needsUpdate = ps.geo.attributes.size.needsUpdate = ps.geo.attributes.col.needsUpdate = true;
}

/* ---------------- assemble ---------------- */
export const kk = new T.Group();
kk.position.set(TX, 0, TZ);
S.add(kk);

const tw = buildTower(); kk.add(tw.g);
const actors = new T.Group(); kk.add(actors);                      // hidden when player is far away
const kong = buildKong(); actors.add(kong);
const fireP = mkPS(240, true), smokeP = mkPS(110, false);
actors.add(smokeP.pts, fireP.pts);

const planes = [];
for (let i = 0; i < 3; i++){
  const p = buildFighter();
  p.userData.o = { a: i * Math.PI * 2 / 3, R: 170 + i * 50, sp: .5 + i * .1, h: [90, -40, 200][i], fire: 1 + i, burst: 0, bt: 0 };
  actors.add(p); planes.push(p);
}

const NSHOT = 60;
const shotM = new T.InstancedMesh(new T.BoxGeometry(1.4, 1.4, 30), MB(0xffe066, { transparent: true, opacity: .95, blending: T.AdditiveBlending, depthWrite: false }), NSHOT);
shotM.frustumCulled = false; actors.add(shotM);
const shots = [];
for (let i = 0; i < NSHOT; i++){ shots.push({ on: false, x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, life: 0 }); setI(shotM, i, 0, -9999, 0, 0, 0, 0); }

/* ---------------- Kong behaviour ---------------- */
const GAP = 22;
const K = { y: 420, th: .4, dir: 1, st: 'climb', stT: 0, phase: 0, nextLeap: 6, j: null, flinch: 0, dCur: 0 };
const PZ = { aL: -2, aR: -2, eL: -.3, eR: -.3, sp: .25, hL: -.3, hR: -.3, kL: .3, kR: .3, jaw: 0, hx: 0, tx: -.12, tz: 0, sq: 1 };
let kkT = 0, flickT = 0;

function stepKong(dt){
  K.phase += dt * 2.4 * (K.st === 'climb' ? 1 : .3);
  K.flinch = Math.max(0, K.flinch - dt * 2.5);
  const top = TOP_H * .86, bottom = 300;

  if (K.st === 'climb'){
    const pulse = Math.max(0, Math.sin(K.phase));
    K.y += K.dir * (6 + 20 * pulse) * (K.dir < 0 ? 1.4 : 1) * dt;
    K.th += (.09 + .04 * pulse) * dt;
    K.nextLeap -= dt;
    if (K.nextLeap <= 0){ K.st = 'crouch'; K.stT = 0 }
    else if (K.dir > 0 && K.y > top){ K.st = 'roar'; K.stT = 0 }
    else if (K.dir < 0 && K.y < bottom){ K.dir = 1 }
  } else if (K.st === 'crouch'){
    K.stT += dt;
    if (K.stT > .32){ K.st = 'air'; K.stT = 0; K.j = { y0: K.y, th0: K.th, H: 30 + Math.random() * 15, L: 28 * K.dir, dth: .35 + Math.random() * .2 } }
  } else if (K.st === 'air'){
    K.stT += dt; const u = Math.min(1, K.stT / 1.4), j = K.j;
    K.y = j.y0 + 4 * j.H * u * (1 - u) + j.L * u;
    K.th = j.th0 + j.dth * (u * u * (3 - 2 * u));
    if (u >= 1){ K.st = 'land'; K.stT = 0 }
  } else if (K.st === 'land'){
    K.stT += dt;
    if (K.stT > .35){ K.st = 'climb'; K.nextLeap = 5 + Math.random() * 5 }
  } else if (K.st === 'roar'){
    K.stT += dt;
    if (K.stT > 6){ K.st = 'climb'; K.dir = -1; K.nextLeap = 3 }
  }

  const hw = widthAt(K.y) / 2 + 1, dx = Math.sin(K.th), dz = Math.cos(K.th);
  const dT = hw / Math.max(Math.abs(dx), Math.abs(dz)) + GAP;
  K.dCur = K.dCur ? K.dCur + (dT - K.dCur) * (1 - Math.exp(-4 * dt)) : dT;
  kong.position.set(dx * K.dCur, K.y, dz * K.dCur);
  kong.rotation.y = K.th + Math.PI;                                  // belly faces the wall

  /* pose targets */
  const s = Math.sin(K.phase), tg = {};
  if (K.st === 'climb'){
    const a = .5 + .5 * s, b = 1 - a;
    Object.assign(tg, { aL: lp(-2.6, -1.3, a), aR: lp(-2.6, -1.3, b), eL: -.2 - .6 * b, eR: -.2 - .6 * a, sp: .25,
      hL: -.25 - .6 * a, hR: -.25 - .6 * b, kL: .3 + .6 * b, kR: .3 + .6 * a, jaw: .1, hx: -.1, tx: -.12, tz: .05 * s, sq: 1 });
  } else if (K.st === 'crouch' || K.st === 'land'){
    Object.assign(tg, { aL: -2.8, aR: -2.8, eL: -.3, eR: -.3, sp: .3, hL: -1.1, hR: -1.1, kL: 1.5, kR: 1.5, jaw: .2, hx: -.2, tx: -.25, tz: 0, sq: .88 });
  } else if (K.st === 'air'){
    Object.assign(tg, { aL: -2.9, aR: -2.9, eL: -.1, eR: -.1, sp: .5, hL: -.2, hR: -.2, kL: .2, kR: .2, jaw: .5, hx: -.35, tx: -.2, tz: 0, sq: 1.06 });
  } else {                                                           // roar + chest beat
    const beat = .5 + .5 * Math.sin(K.stT * 13);
    Object.assign(tg, { aL: -.7, aR: -.7, eL: -1.9 * beat, eR: -1.9 * (1 - beat), sp: .15, hL: -.2, hR: -.2, kL: .2, kR: .2,
      jaw: .7 + .3 * Math.sin(K.stT * 9), hx: -.5, tx: .12, tz: 0, sq: 1 + .02 * beat });
  }
  const k = 1 - Math.exp(-10 * dt);
  for (const key in tg) PZ[key] += (tg[key] - PZ[key]) * k;

  const u = kong.userData, fl = K.flinch;
  u.armL.sh.rotation.x = PZ.aL; u.armR.sh.rotation.x = PZ.aR;
  u.armL.sh.rotation.z = -PZ.sp; u.armR.sh.rotation.z = PZ.sp;
  u.armL.el.rotation.x = PZ.eL; u.armR.el.rotation.x = PZ.eR;
  u.legL.hip.rotation.x = PZ.hL; u.legR.hip.rotation.x = PZ.hR;
  u.legL.kn.rotation.x = PZ.kL; u.legR.kn.rotation.x = PZ.kR;
  u.jaw.rotation.x = PZ.jaw; u.head.rotation.x = PZ.hx + fl * .35; u.head.rotation.z = Math.sin(kkT * 1.7) * .08 + fl * Math.sin(kkT * 40) * .1;
  u.g.rotation.set(PZ.tx, 0, PZ.tz + fl * Math.sin(kkT * 30) * .08); u.g.scale.y = PZ.sq;
}

function shoot(p, i){
  const kp = kong.position, jx = (Math.random() - .5) * 60, jy = (Math.random() - .5) * 70, jz = (Math.random() - .5) * 60;
  const tx = kp.x + jx, ty = kp.y + jy, tz = kp.z + jz;
  const sh = shots.find(o => !o.on); if (!sh) return;
  const fx = p.position.x, fy = p.position.y, fz = p.position.z, ddx = tx - fx, ddy = ty - fy, ddz = tz - fz, d = Math.hypot(ddx, ddy, ddz) || 1, sp = 520;
  sh.on = true; sh.x = fx; sh.y = fy; sh.z = fz; sh.dx = ddx / d * sp; sh.dy = ddy / d * sp; sh.dz = ddz / d * sp; sh.life = d / sp;
  emit(fireP, 1, fx, fy, fz, 0, 0, 0, .15, 18, 4);                   // muzzle flash
}

function stepPlanes(dt){
  planes.forEach((p, i) => {
    const o = p.userData.o;
    o.a += o.sp * dt;
    p.position.set(Math.cos(o.a) * o.R, K.y + o.h + Math.sin(kkT * .6 + i * 2) * 45, Math.sin(o.a) * o.R);
    p.rotation.set(0, Math.PI - o.a, -.5 + Math.sin(kkT + i) * .1);  // nose along the orbit, banked into the turn
    p.userData.prop.rotation.z += dt * 60;
    if (o.burst > 0){ o.bt -= dt; if (o.bt <= 0){ shoot(p, i); o.burst--; o.bt = .07 } }
    else { o.fire -= dt; if (o.fire <= 0){ o.burst = 5 + (Math.random() * 4 | 0); o.fire = 2.5 + Math.random() * 3 } }
  });
  for (let i = 0; i < NSHOT; i++){
    const s = shots[i];
    if (s.on){
      s.x += s.dx * dt; s.y += s.dy * dt; s.z += s.dz * dt; s.life -= dt;
      if (s.life <= 0){
        s.on = false;
        const kp = kong.position, near = Math.hypot(s.x - kp.x, s.y - kp.y, s.z - kp.z) < 55;
        for (let q = 0; q < (near ? 10 : 6); q++) emit(fireP, 1, s.x, s.y, s.z, (Math.random() - .5) * 60, Math.random() * 40, (Math.random() - .5) * 60, .35 + Math.random() * .3, 10, 2);
        if (near && Math.random() < .5) K.flinch = 1;
        setI(shotM, i, 0, -9999, 0, 0, 0, 0);
      } else {
        _d.set(s.dx, s.dy, s.dz).normalize(); _q.setFromUnitVectors(_Z, _d); _p.set(s.x, s.y, s.z); _s.set(1, 1, 1);
        shotM.setMatrixAt(i, _m.compose(_p, _q, _s));
      }
    }
  }
  shotM.instanceMatrix.needsUpdate = true;
}

function stepFire(dt){
  const rateF = CFG.low ? 6 : 14, rateS = CFG.low ? 1.5 : 3;
  for (const f of tw.fires){
    f.e += dt;
    const nF = Math.floor(f.e * rateF);
    if (nF > 0){
      f.e -= nF / rateF;
      for (let n = 0; n < nF; n++)
        emit(fireP, 0, f.x + f.nx * .8 + (Math.random() - .5) * 4, f.y + (Math.random() - .5) * 6, f.z + f.nz * .8 + (Math.random() - .5) * 4,
          f.nx * (3 + Math.random() * 6) + (Math.random() - .5) * 3, 10 + Math.random() * 14, f.nz * (3 + Math.random() * 6) + (Math.random() - .5) * 3,
          .7 + Math.random() * .6, 14 + Math.random() * 10, 34 + Math.random() * 14);
    }
    if (Math.random() < rateS * dt)
      emit(smokeP, 2, f.x + f.nx * 3, f.y + 8, f.z + f.nz * 3, f.nx * 3, 12 + Math.random() * 6, f.nz * 3, 3 + Math.random() * 1.5, 18, 70);
  }
  flickT -= dt;
  if (flickT <= 0){
    flickT = .12; const C = [0xff5a1a, 0xffb030, 0xffe080, 0xff3a10];
    for (const f of tw.fires) tw.wins.setColorAt(f.idx, _c.setHex(C[Math.random() * 4 | 0]));
    tw.wins.instanceColor.needsUpdate = true;
  }
}

/* ---------------- public API ---------------- */
export function resetKingKong(){
  kkT = 0;
  Object.assign(K, { y: 420, th: .4, dir: 1, st: 'climb', stT: 0, phase: 0, nextLeap: 6, j: null, flinch: 0, dCur: 0 });
  shots.forEach((s, i) => { s.on = false; setI(shotM, i, 0, -9999, 0, 0, 0, 0); });
  [fireP, smokeP].forEach(ps => ps.P_.forEach(p => p.l = 0));
}

export function tickKingKong(dt){
  tw.beacon.scale.setScalar(.8 + Math.sin(performance.now() * .005) * .3);
  const far = Math.hypot(G.P.x - TX, G.P.z - TZ) > 3200;
  actors.visible = !far;
  if (far) return;
  dt = Math.min(dt, .05); kkT += dt;
  const us = R.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360));
  fireP.mat.uniforms.uS.value = smokeP.mat.uniforms.uS.value = us;
  stepKong(dt); stepPlanes(dt); stepFire(dt);
  updPS(fireP, dt); updPS(smokeP, dt);
}

/* optional: call from main.js to make the tower solid */
export function kkCollide(x, y, z){
  if (y < 0 || y > TOP_H) return false;
  const h = widthAt(y) / 2 + 3;
  return Math.abs(x - TX) < h && Math.abs(z - TZ) < h;
}

stepKong(0); stepPlanes(0);      // place everything correctly before the first frame
