import { T, rnd } from './utils.js';
import { G } from './game.js';
import { S } from './scene.js';
import { say } from './ui.js';
import { sl } from './world/items.js';

/* ============================================================
   *** ENABLE CACHE FIRST ***
   ============================================================ */
if (window.THREE && window.THREE.Cache){
  window.THREE.Cache.enabled = true;
}

function M(c, o){ return new T.MeshLambertMaterial(Object.assign({color:c, fog:false}, o||{})); }
function MB(c, o){ return new T.MeshBasicMaterial(Object.assign({color:c, fog:false}, o||{})); }
function fwd(){ return { fx: Math.sin(G.P.yaw), fz: -Math.cos(G.P.yaw) }; }

/* ============================================================
   PERFORMANCE — auto-detects mobile, reduces GLB instances
   ============================================================ */
const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || innerWidth < 768;
const PERF = {
  sharkGLB:    IS_MOBILE ? 1 : 2,
  demonGLB:    IS_MOBILE ? 1 : 2,
  sharkPool:   3,
  demonPool:   3,
  dragonPool:  2,
  maxActive:   IS_MOBILE ? 3 : 5,
  cullDist:    IS_MOBILE ? 400 : 800,
  mixerDist:   IS_MOBILE ? 200 : 450,
  loadGapMs:   180
};
console.log('[PERF] mobile:', IS_MOBILE, '| sharkGLB:', PERF.sharkGLB, '| demonGLB:', PERF.demonGLB);

/* ============================================================
   SHARK / DEMON TWEAK  (SIZE + BITE RADIUS)
   ============================================================ */
const SHARK_TWEAK = {
  targetLen: 18,     // was 10 — bigger shark
  xMul: 1.0, yMul: 1.0, zMul: 1.0, hideByName: [],
  chaseSpeed: 95, chaseBoost: 1.5, turnRate: 2.5,
  eatRadius: 22,     // was 16 — matches the bigger body
  lifetime: 20
};
if (typeof window !== 'undefined') window.SHARK_TWEAK = SHARK_TWEAK;

const DEMON_TWEAK = {
  targetLen: 55,     // was 35 — bigger demon
  xMul: 1.0, yMul: 1.0, zMul: 1.0, hideByName: [],
  chaseSpeed: 80, turnRate: 1.8,
  biteRadius: 30,    // was 22 — matches the bigger body
  lifetime: 24
};
if (typeof window !== 'undefined') window.DEMON_TWEAK = DEMON_TWEAK;

/* ============================================================
   TORNADO STATE
   ============================================================ */
export const TOR = {
  trapped: false, phase: 0, angle: 0, radius: 0, height: 0,
  flingTime: 0, flingVX: 0, flingVZ: 0, flingVY: 0
};
export function isPlayerTrapped(){ return TOR.trapped || TOR.flingTime > 0; }

/* ============================================================
   TORNADO VISUALS
   ============================================================ */
const wt = new T.Group(); S.add(wt);
{
  const shellDefs = [
    {r1: 42, r2: 8,  h: 350, color: 0x3366aa, opacity: 0.22},
    {r1: 32, r2: 6,  h: 340, color: 0x6699cc, opacity: 0.30},
    {r1: 22, r2: 4,  h: 330, color: 0x99bbdd, opacity: 0.35}
  ];
  const shells = [];
  for (const s of shellDefs){
    const cyl = new T.Mesh(
      new T.CylinderGeometry(s.r1, s.r2, s.h, 28, 10, true),
      new T.MeshBasicMaterial({ color: s.color, transparent: true, opacity: s.opacity, side: T.DoubleSide, depthWrite: false, fog: false })
    );
    cyl.position.y = s.h / 2;
    wt.add(cyl);
    shells.push(cyl);
  }
  const foam = new T.Mesh(new T.RingGeometry(44, 58, 32),
    new T.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.55, side:T.DoubleSide, depthWrite:false, fog:false}));
  foam.rotation.x = -Math.PI/2; foam.position.y = 0.8; wt.add(foam);

  const mist = new T.Mesh(new T.CircleGeometry(46, 16),
    new T.MeshBasicMaterial({color:0xccddee, transparent:true, opacity:0.4, side:T.DoubleSide, depthWrite:false, fog:false}));
  mist.rotation.x = -Math.PI/2; mist.position.y = 340; wt.add(mist);

  for (let i = 0; i < 16; i++){
    const pts = [];
    for (let j = 0; j <= 40; j++){
      const t = j/40, r = 6 + t*36, a = t*Math.PI*6 + i*Math.PI*2/16;
      pts.push(new T.Vector3(Math.cos(a)*r, t*350, Math.sin(a)*r));
    }
    wt.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),
      new T.LineBasicMaterial({color:0xddeeff, transparent:true, opacity:0.55, fog:false})));
  }

  const disk = new T.Mesh(new T.CircleGeometry(72, 32),
    new T.MeshBasicMaterial({color:0x2a4a77, transparent:true, opacity:0.5, fog:false}));
  disk.rotation.x = -Math.PI/2; disk.position.y = 0.5; wt.add(disk);

  const NSP = 300;
  const spPos = new Float32Array(NSP*3);
  const spT = new Float32Array(NSP), spA = new Float32Array(NSP), spR = new Float32Array(NSP);
  for (let i = 0; i < NSP; i++){ spT[i] = Math.random(); spA[i] = Math.random()*Math.PI*2; spR[i] = Math.random(); }
  const spGeo = new T.BufferGeometry();
  spGeo.setAttribute('position', new T.BufferAttribute(spPos, 3));
  wt.add(new T.Points(spGeo, new T.PointsMaterial({color:0xccddff, size:3.5, transparent:true, opacity:0.9, fog:false, sizeAttenuation:true})));

  const NSPRAY = 90;
  const sprayPos = new Float32Array(NSPRAY*3);
  for (let i = 0; i < NSPRAY; i++) sprayPos[i*3+1] = -9999;
  const sprayGeo = new T.BufferGeometry();
  sprayGeo.setAttribute('position', new T.BufferAttribute(sprayPos, 3));
  wt.add(new T.Points(sprayGeo, new T.PointsMaterial({color:0xddeeff, size:4.5, transparent:true, opacity:0.85, fog:false, sizeAttenuation:true})));

  wt.userData = { shells, spPos, spT, spA, spR, spGeo, NSP, sprayPos, sprayGeo, NSPRAY };
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
    b.position.set(Math.cos(aa)*Math.cos(bb)*130, Math.sin(bb)*130, Math.sin(aa)*Math.cos(bb)*130);
    main.add(b);
  }
  const NAT = 80;
  const atPos = new Float32Array(NAT*3);
  for (let i = 0; i < NAT; i++) atPos[i*3+1] = -99999;
  const atGeo = new T.BufferGeometry();
  atGeo.setAttribute('position', new T.BufferAttribute(atPos, 3));
  ast.add(new T.Points(atGeo, new T.PointsMaterial({
    color:0xff7733, size:10, transparent:true, opacity:0.8,
    blending:T.AdditiveBlending, depthWrite:false, fog:false
  })));
  ast.userData = { main, atPos, atGeo, NAT };
}
ast.visible = false;
let astA = false, astT = 0;
const astVel = new T.Vector3();

/* ============================================================
   GLB loader availability
   ============================================================ */
const GLTF_AVAILABLE = typeof T.GLTFLoader === 'function';
if (!GLTF_AVAILABLE) console.warn('[AMBIENT] GLTFLoader missing — procedural only');

/* ============================================================
   SEQUENTIAL LOADER QUEUE
   ============================================================ */
const loadQueue = [];
let queueRunning = false;

function enqueueGLB(path, tweak, tag, onReady){
  loadQueue.push({ path, tweak, tag, onReady });
}

function pumpQueue(){
  if (loadQueue.length === 0){ queueRunning = false; return; }
  queueRunning = true;
  const item = loadQueue.shift();

  new T.GLTFLoader().load(
    item.path,
    (gltf) => {
      try {
        const scene = gltf.scene;
        const meshes = [];
        scene.traverse(o => {
          if (o.isMesh || o.isSkinnedMesh){
            o.frustumCulled = false;
            const b = new T.Box3().setFromObject(o);
            const s = b.getSize(new T.Vector3());
            const c = new T.Vector3(); b.getCenter(c);
            const vc = o.geometry?.attributes?.position?.count || 0;
            meshes.push({ obj: o, size: s, center: c, verts: vc, name: o.name || o.material?.name || '(unnamed)' });
          }
        });
        if (meshes.length === 0){ console.warn('[' + item.tag + '] no meshes in', item.path); setTimeout(pumpQueue, PERF.loadGapMs); return; }

        let bodyMesh = meshes[0], maxVerts = 0;
        for (const m of meshes){ if (m.verts > maxVerts){ maxVerts = m.verts; bodyMesh = m; } }
        const bodyBox = new T.Box3().setFromObject(bodyMesh.obj);
        const bodySize = bodyBox.getSize(new T.Vector3());
        const bodyCenter = bodyBox.getCenter(new T.Vector3());
        const bodyMax = Math.max(bodySize.x, bodySize.y, bodySize.z) || 1;
        const expandedBox = bodyBox.clone().expandByScalar(bodyMax * 2);

        let hidden = 0, kept = 0;
        for (const m of meshes){
          const inHide = item.tweak.hideByName.includes(m.name);
          const outside = !expandedBox.containsPoint(m.center);
          const shouldHide = inHide || (m !== bodyMesh && outside);
          if (shouldHide){ m.obj.visible = false; hidden++; } else kept++;
        }
        if (kept < 2){ for (const m of meshes) m.obj.visible = true; console.warn('[' + item.tag + '] too few meshes, reverting hides'); }

        const visibleBox = new T.Box3(); visibleBox.makeEmpty();
        for (const m of meshes){ if (m.obj.visible) visibleBox.union(new T.Box3().setFromObject(m.obj)); }
        const size = visibleBox.getSize(new T.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const baseScale = item.tweak.targetLen / maxDim;
        scene.scale.set(baseScale * item.tweak.xMul, baseScale * item.tweak.yMul, baseScale * item.tweak.zMul);
        scene.rotation.y = Math.PI;

        let mixer = null;
        if (gltf.animations && gltf.animations.length > 0){
          mixer = new T.AnimationMixer(scene);
          const action = mixer.clipAction(gltf.animations[0]);
          action.setLoop(T.LoopRepeat);
          action.play();
        }

        console.log('[' + item.tag + '] ✓ visible:' + kept + '/' + meshes.length +
                    ' length:' + (maxDim * baseScale).toFixed(2) +
                    ' anims:' + (gltf.animations?.length || 0));

        item.onReady(scene, mixer);
      } catch (e){
        console.warn('[' + item.tag + '] setup failed:', e);
      }
      setTimeout(pumpQueue, PERF.loadGapMs);
    },
    undefined,
    (err) => {
      console.warn('[' + item.tag + '] load failed:', err);
      setTimeout(pumpQueue, PERF.loadGapMs);
    }
  );
}

/* ============================================================
   SHARK — procedural fallback + GLB on first N slots
   ============================================================ */
const SHARK_PROFILE = [
  new T.Vector2(0.05,0), new T.Vector2(0.20,0.5), new T.Vector2(0.50,1.5),
  new T.Vector2(0.90,2.8), new T.Vector2(1.50,4.2), new T.Vector2(2.10,6.0),
  new T.Vector2(2.70,8.0), new T.Vector2(3.30,10.5), new T.Vector2(3.80,13.0),
  new T.Vector2(4.20,16.0), new T.Vector2(4.50,19.0), new T.Vector2(4.60,22.0),
  new T.Vector2(4.50,25.0), new T.Vector2(4.20,28.0), new T.Vector2(3.80,31.0),
  new T.Vector2(3.30,34.0), new T.Vector2(2.70,37.0), new T.Vector2(2.10,40.0),
  new T.Vector2(1.50,43.0), new T.Vector2(1.00,46.0), new T.Vector2(0.60,49.0),
  new T.Vector2(0.30,52.0), new T.Vector2(0.10,54.0)
];
const SHARK_LEN = 54, SHARK_HALF = 27, Y_SCALE = 0.72;

function radiusAtProfile(z){
  const zNorm = (z + SHARK_HALF) / SHARK_LEN;
  const idx = zNorm * (SHARK_PROFILE.length - 1);
  const lo = Math.max(0, Math.floor(idx));
  const hi = Math.min(SHARK_PROFILE.length - 1, Math.ceil(idx));
  const f = idx - lo;
  return SHARK_PROFILE[lo].x * (1 - f) + SHARK_PROFILE[hi].x * f;
}

function makeSharkMaterial(){
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.68, metalness: 0.04 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uBendAmp = { value: 2.2 };
    shader.vertexShader = `uniform float uTime;uniform float uBendAmp;${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      `vec3 transformed = vec3(position);
       float tailT = max(0.0, position.z + 5.0) / 32.0;
       tailT = min(1.0, tailT); tailT = tailT * tailT;
       float wave = sin(uTime * 4.0 - position.z * 0.18);
       transformed.x += wave * uBendAmp * tailT;`);
    mat.userData.shader = shader;
  };
  return mat;
}

function bakeBodyColors(geo){
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++){
    const y = pos.getY(i), z = pos.getZ(i);
    const r = radiusAtProfile(z) * Y_SCALE;
    let t = r > 0.001 ? y/r : 0; t = Math.max(-1, Math.min(1, t));
    let R, G_, B;
    if (t < -0.25){ const u = Math.min(1,(t+1)/0.75); R=0.94-(0.94-0.86)*u; G_=0.92-(0.92-0.87)*u; B=0.84-(0.84-0.82)*u; }
    else if (t < 0.25){ const u = (t+0.25)/0.5; R=0.86-(0.86-0.55)*u; G_=0.87-(0.87-0.60)*u; B=0.82-(0.82-0.63)*u; }
    else { const u = (t-0.25)/0.75; R=0.55-(0.55-0.28)*u; G_=0.60-(0.60-0.33)*u; B=0.63-(0.63-0.36)*u; }
    colors[i*3]=R; colors[i*3+1]=G_; colors[i*3+2]=B;
  }
  geo.setAttribute('color', new T.BufferAttribute(colors, 3));
}

function bakeFinColors(geo, isDark){
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++){
    if (isDark){ colors[i*3]=0.32; colors[i*3+1]=0.37; colors[i*3+2]=0.41; }
    else { colors[i*3]=0.78; colors[i*3+1]=0.75; colors[i*3+2]=0.71; }
  }
  geo.setAttribute('color', new T.BufferAttribute(colors, 3));
}

function buildProceduralShark(){
  const g = new T.Group();
  const mat = makeSharkMaterial();
  const bodyGeo = new T.LatheGeometry(SHARK_PROFILE, 44);
  bodyGeo.rotateX(Math.PI/2); bodyGeo.translate(0,0,-SHARK_HALF); bodyGeo.scale(1,Y_SCALE,1);
  bakeBodyColors(bodyGeo);
  const body = new T.Mesh(bodyGeo, mat); body.frustumCulled = false; g.add(body);

  function addFin(shapePts, ex, pos, rotY, isDark, mirror){
    const shape = new T.Shape();
    shape.moveTo(shapePts[0][0], shapePts[0][1]);
    for (let i = 1; i < shapePts.length; i++) shape.lineTo(shapePts[i][0], shapePts[i][1]);
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, ex);
    geo.translate(0,0,-(ex.depth||0.3)/2);
    if (mirror) geo.scale(-1,1,1);
    geo.rotateY(rotY || Math.PI/2);
    geo.translate(pos.x, pos.y, pos.z);
    bakeFinColors(geo, isDark);
    const m = new T.Mesh(geo, mat); m.frustumCulled = false; g.add(m);
  }

  addFin([[0,0],[2,3],[4,6.5],[6,7.8],[8,7],[9,4],[9.5,1],[9.5,0]],
    {depth:0.4, bevelEnabled:true, bevelThickness:0.2, bevelSize:0.2, bevelSegments:2},
    {x:-4.75,y:3.2,z:-2}, Math.PI/2, true, false);

  for (const sx of [-1,1]){
    addFin([[0,0],[7,-1.5],[9,-3],[8,-4.5],[4,-3],[1,-1.5]],
      {depth:0.3, bevelEnabled:true, bevelThickness:0.15, bevelSize:0.15, bevelSegments:2},
      {x:sx*3.5,y:-1.2,z:-8}, Math.PI/2, false, sx<0);
  }
  for (const sx of [-1,1]){
    addFin([[0,0],[3,-0.5],[4.5,-2],[3.5,-3],[1,-2]],
      {depth:0.2, bevelEnabled:false},
      {x:sx*2.3,y:-2.8,z:4}, Math.PI/2, true, sx<0);
  }
  addFin([[0,0],[1,1.5],[2,2],[2.5,1],[2,0]],
    {depth:0.2, bevelEnabled:false},
    {x:-1.25,y:2,z:18}, Math.PI/2, true, false);
  addFin([[0,0],[2,-0.5],[2.5,-2],[1.5,-2.5],[0.5,-1.5]],
    {depth:0.2, bevelEnabled:false},
    {x:-1.25,y:-2.3,z:14}, Math.PI/2, false, false);
  addFin([[0,0],[2,3],[5,7],[9,10],[11,9],[10,6],[7,3],[4,1]],
    {depth:0.4, bevelEnabled:true, bevelThickness:0.15, bevelSize:0.15, bevelSegments:2},
    {x:0,y:0,z:SHARK_HALF}, -Math.PI/2, true, false);
  addFin([[0,0],[3,-2],[6,-5],[7,-5.5],[6,-3],[3,-1]],
    {depth:0.4, bevelEnabled:true, bevelThickness:0.15, bevelSize:0.15, bevelSegments:2},
    {x:0,y:-0.5,z:SHARK_HALF}, -Math.PI/2, true, false);

  for (const sx of [-1,1]){
    for (let i = 0; i < 5; i++){
      const gz = -15 + i*1.4, bodyR = radiusAtProfile(gz);
      const gill = new T.Mesh(new T.BoxGeometry(0.12,1.1,0.25),
        new T.MeshStandardMaterial({color:0x0a0a0a, roughness:0.95}));
      gill.position.set(sx*bodyR*0.92, 0.3, gz);
      gill.rotation.y = sx*0.12;
      g.add(gill);
    }
  }

  for (const sx of [-1,1]){
    const socket = new T.Mesh(new T.SphereGeometry(0.85,14,12), mat);
    socket.position.set(sx*1.55, 1.4, -21); g.add(socket);
    const eye = new T.Mesh(new T.SphereGeometry(0.62,18,16),
      new T.MeshStandardMaterial({color:0x000000, roughness:0.12, metalness:0.7}));
    eye.position.set(sx*1.85, 1.4, -21.4); g.add(eye);
    const gl = new T.Mesh(new T.SphereGeometry(0.18,8,8), new T.MeshBasicMaterial({color:0xffffff}));
    gl.position.set(sx*1.95, 1.6, -21.9); g.add(gl);
  }
  for (const sx of [-1,1]){
    const n = new T.Mesh(new T.SphereGeometry(0.22,8,6),
      new T.MeshStandardMaterial({color:0x111111, roughness:0.95}));
    n.position.set(sx*0.65, 0.15, -24.5); g.add(n);
  }

  const mouth = new T.Group();
  mouth.position.set(0, -1.4, -21); g.add(mouth);
  const cavity = new T.Mesh(new T.SphereGeometry(1.8,18,14),
    new T.MeshStandardMaterial({color:0x160404, roughness:0.95}));
  cavity.scale.set(1.4, 0.45, 1.1); cavity.position.set(0,-0.2,-2.8); mouth.add(cavity);

  const jawPivot = new T.Group();
  jawPivot.position.set(0, -0.4, -1.4); mouth.add(jawPivot);
  const lowerJaw = new T.Mesh(new T.SphereGeometry(1.5,18,12), mat);
  lowerJaw.scale.set(1.3,0.4,1.4); lowerJaw.position.set(0,-0.35,-1.3); jawPivot.add(lowerJaw);

  // Procedural shark is scaled to match the new targetLen ratio (18/10 = 1.8×)
  g.scale.setScalar(1.3 * (SHARK_TWEAK.targetLen / 10));
  g.userData = { material: mat, jawPivot };
  g.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
  return g;
}

const sharkPool = [];
for (let i = 0; i < PERF.sharkPool; i++){
  const obj = new T.Group(); obj.visible = false; S.add(obj);
  const procedural = buildProceduralShark();
  obj.add(procedural);
  const slot = { obj, procedural, glb: null, mixer: null, useGLB: false, active: false, phase: 0, life: 0 };
  sharkPool.push(slot);

  if (i < PERF.sharkGLB && GLTF_AVAILABLE){
    enqueueGLB('assets/shark.glb', SHARK_TWEAK, 'SHARK', (scene, mixer) => {
      procedural.visible = false;
      obj.add(scene);
      slot.glb = scene; slot.mixer = mixer; slot.useGLB = true;
    });
  }
}
console.log('[SHARK] pool:', PERF.sharkPool, 'GLB slots:', PERF.sharkGLB);

/* ============================================================
   DRAGON (procedural) — used as demon fallback and standalone
   ============================================================ */
function buildDragon(scale, colors){
  const g = new T.Group();
  const red = M(colors?.body ?? 0x882222);
  const redD = M(colors?.dark ?? 0x551111);

  const pieces = [];
  for (let i = 0; i < 10; i++){
    const s = new T.Mesh(new T.SphereGeometry(4 - i*0.35, 10, 8), red);
    s.position.z = i*3.5; g.add(s); pieces.push(s);
  }
  for (let i = 2; i < 10; i++){
    const r = 4 - i*0.35, spikeH = 1.8 + r*0.5;
    const spike = new T.Mesh(new T.ConeGeometry(0.7 + r*0.15, spikeH, 4), redD);
    spike.position.set(0, r + spikeH*0.35, i*3.5); spike.rotation.x = -0.15; g.add(spike);
  }
  const head = new T.Mesh(new T.BoxGeometry(5,4,8), red);
  head.position.z = -6; g.add(head);
  const upperJaw = new T.Mesh(new T.BoxGeometry(4.4,1.6,5.5), red);
  upperJaw.position.set(0,-0.4,-11); g.add(upperJaw);
  const jawPivot = new T.Group();
  jawPivot.position.set(0,-1.5,-9); g.add(jawPivot);
  const lowerJaw = new T.Mesh(new T.BoxGeometry(4.2,1.2,5.5), redD);
  lowerJaw.position.set(0,-0.6,-2.6); jawPivot.add(lowerJaw);
  for (let i = 0; i < 6; i++){
    const tooth = new T.Mesh(new T.ConeGeometry(0.25,0.8,4), MB(0xffffff));
    tooth.position.set(-1.6+i*0.65,-1.2,-13.5); tooth.rotation.x = Math.PI; g.add(tooth);
  }
  for (const sx of [-1,1]){
    const eye = new T.Mesh(new T.SphereGeometry(0.85,12,10), MB(0xffcc00));
    eye.position.set(sx*2.5, 0.8, -8.2); g.add(eye);
    const pup = new T.Mesh(new T.BoxGeometry(0.35,1,0.5), MB(0x000000));
    pup.position.set(sx*2.6, 0.8, -8.7); g.add(pup);
    const horn = new T.Mesh(new T.ConeGeometry(0.7,4,5), redD);
    horn.position.set(sx*1.8, 2.8, -6); horn.rotation.x = -0.35; g.add(horn);
  }

  const wl = new T.Group(); wl.position.set(-2.5,1,0);
  { const inner = new T.Mesh(new T.PlaneGeometry(8,9), redD);
    inner.rotation.x = -Math.PI/2; inner.position.x = -4; inner.material.side = T.DoubleSide; wl.add(inner);
    const outerPivot = new T.Group(); outerPivot.position.x = -8; wl.add(outerPivot);
    const outer = new T.Mesh(new T.PlaneGeometry(8,9), redD);
    outer.rotation.x = -Math.PI/2; outer.position.x = -4; outer.material.side = T.DoubleSide; outerPivot.add(outer);
    wl.userData.outerPivot = outerPivot;
  }
  g.add(wl);
  const wr = new T.Group(); wr.position.set(2.5,1,0);
  { const inner = new T.Mesh(new T.PlaneGeometry(8,9), redD);
    inner.rotation.x = -Math.PI/2; inner.position.x = 4; inner.material.side = T.DoubleSide; wr.add(inner);
    const outerPivot = new T.Group(); outerPivot.position.x = 8; wr.add(outerPivot);
    const outer = new T.Mesh(new T.PlaneGeometry(8,9), redD);
    outer.rotation.x = -Math.PI/2; outer.position.x = 4; outer.material.side = T.DoubleSide; outerPivot.add(outer);
    wr.userData.outerPivot = outerPivot;
  }
  g.add(wr);

  const NDRF = 60;
  const drfPos = new Float32Array(NDRF*3);
  for (let i = 0; i < NDRF; i++) drfPos[i*3+1] = -99999;
  const drfGeo = new T.BufferGeometry();
  drfGeo.setAttribute('position', new T.BufferAttribute(drfPos, 3));
  g.add(new T.Points(drfGeo, new T.PointsMaterial({
    color:0xff6600, size:8, transparent:true, opacity:0.9,
    blending:T.AdditiveBlending, depthWrite:false, fog:false
  })));

  g.scale.setScalar(scale || 1.3);
  g.userData = {
    pieces, wl, wr, jawPivot,
    wlOuterPivot: wl.userData.outerPivot,
    wrOuterPivot: wr.userData.outerPivot,
    drfPos, drfGeo, NDRF,
    drfV: Array.from({length:NDRF}, () => ({x:0,y:0,z:0,life:0}))
  };
  return g;
}

const dragonPool = [];
for (let i = 0; i < PERF.dragonPool; i++){
  const obj = buildDragon(1.3);
  obj.visible = false; S.add(obj);
  dragonPool.push({ obj, active:false, phase:0, life:0, fireCooldown:1+Math.random()*2, fireBurstTime:0 });
}

/* ============================================================
   DEMON DRAGON — procedural fallback + GLB on first N slots
   ============================================================ */
function makeDemonFire(){
  const N = 50;
  const pos = new Float32Array(N*3);
  for (let i = 0; i < N; i++) pos[i*3+1] = -99999;
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  return {
    pts: new T.Points(geo, new T.PointsMaterial({
      color:0xff3300, size:9, transparent:true, opacity:0.9,
      blending:T.AdditiveBlending, depthWrite:false, fog:false
    })),
    geo, pos, N,
    data: Array.from({length:N}, () => ({vx:0,vy:0,vz:0,life:0}))
  };
}

const demonPool = [];
// Procedural demon fallback scaled relative to new targetLen (55 vs old 35)
const demonProcScale = 2.4 * (DEMON_TWEAK.targetLen / 35);
for (let i = 0; i < PERF.demonPool; i++){
  const obj = new T.Group(); obj.visible = false; S.add(obj);

  const proceduralDemon = buildDragon(demonProcScale, { body: 0x660000, dark: 0x330000 });
  obj.add(proceduralDemon);

  const fire = makeDemonFire();
  obj.add(fire.pts);

  const slot = {
    obj, glb: null, mixer: null, useGLB: false, proceduralDemon,
    fire, active: false, phase: 0, life: 0, fireCooldown: 0, fireBurstTime: 0
  };
  demonPool.push(slot);

  if (i < PERF.demonGLB && GLTF_AVAILABLE){
    enqueueGLB('assets/demondragon.glb', DEMON_TWEAK, 'DEMON', (scene, mixer) => {
      proceduralDemon.visible = false;
      obj.add(scene);
      slot.glb = scene; slot.mixer = mixer; slot.useGLB = true;
    });
  }
}
console.log('[DEMON] pool:', PERF.demonPool, 'GLB slots:', PERF.demonGLB);

/* start the queue */
setTimeout(pumpQueue, 600);

/* ============================================================
   OCTOPUS
   ============================================================ */
const oct = new T.Group(); S.add(oct);
{
  const pur = M(0x552244), purD = M(0x2a0f22);
  const mouth = MB(0x330000), yellow = MB(0xffdd00), black = MB(0x000000), white = MB(0xffffff);

  const body = new T.Mesh(new T.SphereGeometry(45,24,18), pur);
  body.scale.set(1.2,1.4,1.1); body.position.y = 280; oct.add(body);
  const mantle = new T.Mesh(new T.SphereGeometry(38,20,14), purD);
  mantle.scale.set(1.05,0.7,1.05); mantle.position.y = 320; oct.add(mantle);

  for (let i = 0; i < 10; i++){
    const a = (i/10)*Math.PI*2;
    const w = new T.Mesh(new T.SphereGeometry(3+Math.random()*2,6,6), purD);
    w.position.set(Math.cos(a)*32, 300+Math.sin(i*7)*8, Math.sin(a)*32);
    oct.add(w);
  }
  for (const sx of [-1,1]){
    const socket = new T.Mesh(new T.SphereGeometry(13,14,12), purD);
    socket.position.set(sx*18, 288, 32); oct.add(socket);
    const eye = new T.Mesh(new T.SphereGeometry(10,16,14), yellow);
    eye.position.set(sx*18, 288, 38); oct.add(eye);
    const pup = new T.Mesh(new T.BoxGeometry(2.5,12,4), black);
    pup.position.set(sx*18, 288, 45); oct.add(pup);
    const brow = new T.Mesh(new T.BoxGeometry(22,4.5,5), purD);
    brow.position.set(sx*18, 302, 40); brow.rotation.z = sx*0.4; oct.add(brow);
  }
  const mouthMesh = new T.Mesh(new T.SphereGeometry(11,16,10), mouth);
  mouthMesh.position.set(0,256,36); mouthMesh.scale.set(1.5,0.7,0.55); oct.add(mouthMesh);
  for (let i = 0; i < 8; i++){
    const t = new T.Mesh(new T.ConeGeometry(2,5.5,4), white);
    t.position.set(-14+i*4, 260, 41); t.rotation.x = Math.PI; oct.add(t);
  }
  for (let i = 0; i < 7; i++){
    const t = new T.Mesh(new T.ConeGeometry(2,5,4), white);
    t.position.set(-12+i*4, 252, 41); oct.add(t);
  }

  const tentacles = [];
  for (let i = 0; i < 8; i++){
    const a = (i/8)*Math.PI*2;
    const attachX = Math.cos(a)*28, attachZ = Math.sin(a)*28;
    const grp = new T.Group(); grp.position.set(attachX, 224, attachZ); oct.add(grp);
    const outMidX = Math.cos(a)*20, outMidZ = Math.sin(a)*20;
    const outFarX = Math.cos(a)*55, outFarZ = Math.sin(a)*55;
    const curlX = Math.cos(a)*40, curlZ = Math.sin(a)*40;
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0,0,0),
      new T.Vector3(outMidX*0.35,-35,outMidZ*0.35),
      new T.Vector3(outMidX,-90,outMidZ),
      new T.Vector3(outFarX,-160,outFarZ),
      new T.Vector3(curlX,-205,curlZ)
    ]);
    grp.add(new T.Mesh(new T.TubeGeometry(curve, 24, 6.5, 6, false), pur));
    for (let k = 0; k < 6; k++){
      const t = 0.15 + (k/6)*0.75;
      const p = curve.getPoint(t);
      const s = new T.Mesh(new T.SphereGeometry(1.6,6,6), purD);
      s.position.copy(p).add(new T.Vector3(0,2.5,0));
      grp.add(s);
    }
    tentacles.push({ grp, phase: i*0.5, baseAngle: a });
  }
  oct.userData = { tentacles, body, mouth: mouthMesh };
}
oct.visible = false;
let octA = false, octT = 0;

/* ============================================================
   EXPLOSIONS
   ============================================================ */
const explosions = [];
function spawnExplosion(pos, color){
  const m = new T.Mesh(new T.SphereGeometry(1,10,8),
    MB(color || 0xffaa00, {transparent:true, opacity:0.9, depthWrite:false, blending:T.AdditiveBlending}));
  m.position.copy(pos); S.add(m);
  explosions.push({ mesh:m, life:0.6, maxLife:0.6 });
}
function tickExplosions(dt){
  for (let i = explosions.length - 1; i >= 0; i--){
    const e = explosions[i];
    e.life -= dt;
    if (e.life <= 0){ S.remove(e.mesh); e.mesh.geometry.dispose(); e.mesh.material.dispose(); explosions.splice(i,1); continue; }
    const t = 1 - e.life/e.maxLife;
    e.mesh.scale.setScalar(5 + t*45);
    e.mesh.material.opacity = (1-t)*0.9;
  }
}

/* ============================================================
   SHOOTING API
   ============================================================ */
export function getShootableTargets(){
  const out = [];
  for (const s of sharkPool) if (s.active) out.push({ obj:s.obj, type:'shark' });
  for (const d of dragonPool) if (d.active) out.push({ obj:d.obj, type:'dragon' });
  for (const d of demonPool) if (d.active) out.push({ obj:d.obj, type:'demon' });
  return out;
}

export function killTarget(t){
  if (t.type === 'shark'){ const s = sharkPool.find(x => x.obj === t.obj); if (s){ s.active = false; spawnExplosion(t.obj.position, 0x66aaff); } }
  else if (t.type === 'dragon'){ const d = dragonPool.find(x => x.obj === t.obj); if (d){ d.active = false; spawnExplosion(t.obj.position, 0xff5522); } }
  else if (t.type === 'demon'){ const d = demonPool.find(x => x.obj === t.obj); if (d){ d.active = false; spawnExplosion(t.obj.position, 0xff2200); } }
  t.obj.visible = false;
  G.Q.bonus += 100;
  G.P.meter = Math.min(1, G.P.meter + 0.30);
}

/* ============================================================
   HELPERS
   ============================================================ */
function totalActive(){
  let n = 0;
  for (const s of sharkPool) if (s.active) n++;
  for (const d of dragonPool) if (d.active) n++;
  for (const d of demonPool) if (d.active) n++;
  return n;
}
function distToPlayer(p){
  return Math.hypot(p.x - G.P.x, p.y - G.P.y, p.z - G.P.z);
}

/* ============================================================
   SPAWN HELPERS
   ============================================================ */
function spawnShark(){
  if (totalActive() >= PERF.maxActive) return false;
  const slot = sharkPool.find(s => !s.active); if (!slot) return false;
  const { fx, fz } = fwd();
  const side = rnd() < .5 ? -1 : 1;
  const d = 300 + rnd()*200;
  slot.obj.position.set(G.P.x + fx*d + fz*side*80, G.P.y + (rnd()-.3)*60, G.P.z + fz*d - fx*side*80);
  slot.obj.rotation.set(0, Math.atan2(G.P.x - slot.obj.position.x, G.P.z - slot.obj.position.z) + Math.PI, 0);
  slot.obj.visible = true; slot.active = true; slot.phase = 0; slot.life = SHARK_TWEAK.lifetime;
  return true;
}

function spawnDragon(){
  if (totalActive() >= PERF.maxActive) return false;
  const slot = dragonPool.find(d => !d.active); if (!slot) return false;
  const { fx, fz } = fwd();
  const side = rnd() < .5 ? -1 : 1;
  const d = 320 + rnd()*200;
  slot.obj.position.set(G.P.x + fx*d + fz*side*100, G.P.y + 40 + rnd()*40, G.P.z + fz*d - fx*side*100);
  slot.obj.visible = true; slot.active = true; slot.phase = 0; slot.life = 18;
  slot.fireCooldown = 0.5 + Math.random()*1.5; slot.fireBurstTime = 0;
  slot.obj.userData.drfV.forEach(v => { v.life = 0; });
  return true;
}

function spawnDemon(){
  if (totalActive() >= PERF.maxActive) return false;
  const slot = demonPool.find(d => !d.active); if (!slot) return false;
  const { fx, fz } = fwd();
  const side = rnd() < .5 ? -1 : 1;
  const d = 400 + rnd()*200;
  slot.obj.position.set(G.P.x + fx*d + fz*side*100, G.P.y + 40 + rnd()*60, G.P.z + fz*d - fx*side*100);
  slot.obj.visible = true; slot.active = true; slot.phase = 0; slot.life = DEMON_TWEAK.lifetime;
  slot.fireCooldown = 0.5 + Math.random()*1.5; slot.fireBurstTime = 0;
  slot.fire.data.forEach(v => { v.life = 0; });
  return true;
}

/* ============================================================
   TICKERS
   ============================================================ */
function tickTornado(dt){
  if (!wtA) return;
  wtT += dt; wtSpin += dt*4; wt.rotation.y = wtSpin;
  const u = wt.userData;
  u.shells.forEach((s, i) => { s.rotation.y = wtSpin*(1 + i*0.4); });
  for (let i = 0; i < u.NSP; i++){
    u.spT[i] += dt*0.22;
    if (u.spT[i] > 1) u.spT[i] -= 1;
    const t = u.spT[i], r = 6 + t*34 + u.spR[i]*8;
    u.spA[i] += dt*(2 + u.spR[i]*2);
    u.spPos[i*3] = Math.cos(u.spA[i])*r;
    u.spPos[i*3+1] = t*350 + u.spR[i]*20;
    u.spPos[i*3+2] = Math.sin(u.spA[i])*r;
  }
  u.spGeo.attributes.position.needsUpdate = true;
  for (let i = 0; i < u.NSPRAY; i++){
    const px = u.sprayPos[i*3], py = u.sprayPos[i*3+1], pz = u.sprayPos[i*3+2];
    if (py < 0 || py > 90){
      if (Math.random() < 0.08){
        const a = Math.random()*Math.PI*2;
        u.sprayPos[i*3] = Math.cos(a)*42;
        u.sprayPos[i*3+1] = 0;
        u.sprayPos[i*3+2] = Math.sin(a)*42;
      }
    } else {
      const r = Math.hypot(px, pz) || 1, a = Math.atan2(pz, px);
      u.sprayPos[i*3] = Math.cos(a+dt)*(r + 25*dt);
      u.sprayPos[i*3+1] = py + 35*dt;
      u.sprayPos[i*3+2] = Math.sin(a+dt)*(r + 25*dt);
    }
  }
  u.sprayGeo.attributes.position.needsUpdate = true;

  const dx = G.P.x - wt.position.x, dz = G.P.z - wt.position.z;
  const d = Math.hypot(dx, dz) || 1;

  if (TOR.trapped){
    TOR.phase += dt; TOR.angle += dt*6;
    TOR.radius = Math.max(8, TOR.radius - dt*18);
    TOR.height = Math.min(250, TOR.height + dt*50);
    G.P.x = wt.position.x + Math.cos(TOR.angle)*TOR.radius;
    G.P.z = wt.position.z + Math.sin(TOR.angle)*TOR.radius;
    G.P.y = TOR.height; G.P.vy = 0; G.P.fs = 0;
    if (TOR.phase > 2.5){
      TOR.trapped = false; TOR.flingTime = 1.2;
      TOR.flingVX = Math.cos(TOR.angle)*500;
      TOR.flingVZ = Math.sin(TOR.angle)*500;
      TOR.flingVY = 200;
      say('Dave: "WHHHOOOAAA!"', 2);
    }
  } else if (d < 60 && G.P.y < 320){
    TOR.trapped = true; TOR.phase = 0;
    TOR.angle = Math.atan2(dz, dx); TOR.radius = d; TOR.height = G.P.y;
    say('Dave: "OH NO—"', 1.2);
  } else if (d < 220 && G.P.y < 360){
    const pull = ((220 - d)/220) * 500;
    G.P.x -= (dx/d)*pull*dt; G.P.z -= (dz/d)*pull*dt;
  }
  if (wtT > 22){ wt.visible = false; wtA = false; TOR.trapped = false; TOR.flingTime = 0; }
}

function tickAsteroid(dt){
  if (!astA) return;
  astT += dt;
  ast.position.x += astVel.x*dt;
  ast.position.y += astVel.y*dt;
  ast.position.z += astVel.z*dt;
  const u = ast.userData;
  u.main.rotation.x += dt*0.3; u.main.rotation.y += dt*0.2;
  for (let i = u.NAT-1; i > 0; i--){
    u.atPos[i*3] = u.atPos[(i-1)*3];
    u.atPos[i*3+1] = u.atPos[(i-1)*3+1];
    u.atPos[i*3+2] = u.atPos[(i-1)*3+2];
  }
  u.atPos[0] = ast.position.x; u.atPos[1] = ast.position.y; u.atPos[2] = ast.position.z + 60;
  u.atGeo.attributes.position.needsUpdate = true;
  if (astT > 1.5 && astT < 3.5) G.shake = Math.max(G.shake, 1.2);
  if (astT > 6){ ast.visible = false; astA = false; }
}

function tickSharks(dt){
  for (const s of sharkPool){
    if (!s.active) continue;
    s.life -= dt; s.phase += dt;

    const dist = distToPlayer(s.obj.position);
    if (dist > PERF.cullDist){ s.active = false; s.obj.visible = false; continue; }

    if (s.useGLB){
      if (s.mixer && dist < PERF.mixerDist) s.mixer.update(dt);
    } else {
      const shader = s.procedural.userData.material.userData.shader;
      if (shader) shader.uniforms.uTime.value = s.phase;
      s.procedural.userData.jawPivot.rotation.x = -Math.abs(Math.sin(s.phase*1.5))*0.22 - 0.03;
    }

    const dx = G.P.x - s.obj.position.x;
    const dy = G.P.y - s.obj.position.y;
    const dz = G.P.z - s.obj.position.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    const targetYaw = Math.atan2(dx, dz) + Math.PI;
    const speed = Math.min(SHARK_TWEAK.chaseSpeed, d * SHARK_TWEAK.chaseBoost);
    s.obj.position.x += (dx/d)*speed*dt;
    s.obj.position.y += (dy/d)*speed*dt;
    s.obj.position.z += (dz/d)*speed*dt;

    let yd = targetYaw - s.obj.rotation.y;
    while (yd > Math.PI) yd -= Math.PI*2;
    while (yd < -Math.PI) yd += Math.PI*2;
    const mr = SHARK_TWEAK.turnRate*dt;
    if (Math.abs(yd) < mr) s.obj.rotation.y = targetYaw;
    else s.obj.rotation.y += Math.sign(yd)*mr;

    const tr = -Math.sign(yd)*Math.min(Math.abs(yd), 0.35);
    s.obj.rotation.z += (tr - s.obj.rotation.z)*Math.min(1, dt*3);

    if (d < SHARK_TWEAK.eatRadius && G.P.hit <= 0){
      G.P.hit = 1.4; G.P.fs *= 0.4; G.Q.bumps++; G.Q.clean = 0;
      G.shake = 1.2; say('Dave: "OI! SHARK!"', 2);
      s.active = false; s.obj.visible = false;
    }
    if (s.life <= 0){ s.active = false; s.obj.visible = false; }
  }
}

function tickDragons(dt){
  for (const d of dragonPool){
    if (!d.active) continue;
    d.life -= dt; d.phase += dt;
    const dist = distToPlayer(d.obj.position);
    if (dist > PERF.cullDist){ d.active = false; d.obj.visible = false; continue; }

    const u = d.obj.userData;
    const flap = Math.sin(d.phase*5)*0.5;
    const flapD = Math.sin(d.phase*5-0.7)*0.4;
    u.wl.rotation.z = flap; u.wlOuterPivot.rotation.z = flapD;
    u.wr.rotation.z = -flap; u.wrOuterPivot.rotation.z = -flapD;
    u.pieces.forEach((s,i) => {
      s.position.y = Math.sin(d.phase*2.5 + i*0.4)*2;
      s.position.x = Math.sin(d.phase*1.8 + i*0.4)*2;
    });
    u.jawPivot.rotation.x = -Math.abs(Math.sin(d.phase*1.5))*0.3;

    const dx = G.P.x - d.obj.position.x;
    const dz = G.P.z - d.obj.position.z;
    const dl = Math.hypot(dx, dz) || 1;
    d.obj.position.x += (dx/dl)*55*dt;
    d.obj.position.z += (dz/dl)*55*dt;
    d.obj.rotation.y = Math.atan2(dx, dz) + Math.PI;

    if (d.life <= 0){ d.active = false; d.obj.visible = false; }
  }
}

function tickDemons(dt){
  for (const d of demonPool){
    if (!d.active) continue;
    d.life -= dt; d.phase += dt;

    const dist = distToPlayer(d.obj.position);
    if (dist > PERF.cullDist){ d.active = false; d.obj.visible = false; continue; }

    if (d.mixer && dist < PERF.mixerDist) d.mixer.update(dt);
    else if (d.useGLB && d.mixer) d.mixer.update(dt * 2);

    if (!d.useGLB && d.proceduralDemon){
      const u = d.proceduralDemon.userData;
      const flap = Math.sin(d.phase*5)*0.5;
      u.wl.rotation.z = flap;
      u.wr.rotation.z = -flap;
    }

    const dx = G.P.x - d.obj.position.x;
    const dy = G.P.y - d.obj.position.y;
    const dz = G.P.z - d.obj.position.z;
    const dl = Math.hypot(dx, dy, dz) || 1;
    const speed = Math.min(DEMON_TWEAK.chaseSpeed, dl*1.2);
    d.obj.position.x += (dx/dl)*speed*dt;
    d.obj.position.y += (dy/dl)*speed*dt;
    d.obj.position.z += (dz/dl)*speed*dt;

    const ty = Math.atan2(dx, dz) + Math.PI;
    let yd = ty - d.obj.rotation.y;
    while (yd > Math.PI) yd -= Math.PI*2;
    while (yd < -Math.PI) yd += Math.PI*2;
    const mr = DEMON_TWEAK.turnRate*dt;
    if (Math.abs(yd) < mr) d.obj.rotation.y = ty;
    else d.obj.rotation.y += Math.sign(yd)*mr;

    if (d.fireBurstTime > 0){
      d.fireBurstTime -= dt;
      for (let i = 0; i < d.fire.N; i++){
        const v = d.fire.data[i];
        if (v.life <= 0 && Math.random() < 0.4){
          d.fire.pos[i*3]   = (Math.random()-.5)*6;
          d.fire.pos[i*3+1] = (Math.random()-.5)*4;
          d.fire.pos[i*3+2] = 15 + (Math.random()-.5)*6;
          v.vx = (Math.random()-.5)*20;
          v.vy = (Math.random()-.5)*12;
          v.vz = 30 + Math.random()*15;
          v.life = 0.9 + Math.random()*0.6;
        }
      }
    } else {
      d.fireCooldown -= dt;
      if (d.fireCooldown <= 0){ d.fireBurstTime = 1.3; d.fireCooldown = 2 + Math.random()*2; }
    }
    for (let i = 0; i < d.fire.N; i++){
      const v = d.fire.data[i];
      if (v.life > 0){
        v.life -= dt;
        d.fire.pos[i*3] += v.vx*dt;
        d.fire.pos[i*3+1] += v.vy*dt;
        d.fire.pos[i*3+2] += v.vz*dt;
        if (v.life <= 0) d.fire.pos[i*3+1] = -99999;
      }
    }
    d.fire.geo.attributes.position.needsUpdate = true;

    if (dl < DEMON_TWEAK.biteRadius && G.P.hit <= 0){
      G.P.hit = 1.5; G.P.fs *= 0.35; G.Q.bumps++; G.Q.clean = 0;
      G.shake = 1.4; say('Dave: "DEMON DRAGON!"', 2);
      d.active = false; d.obj.visible = false;
    }
    if (d.life <= 0){ d.active = false; d.obj.visible = false; }
  }
}

function tickOctopus(dt){
  if (!octA) return;
  octT += dt;
  const u = oct.userData;
  u.tentacles.forEach((t,i) => {
    t.grp.rotation.y = Math.sin(octT*0.7 + i*0.8)*0.35;
    t.grp.rotation.x = Math.cos(octT*0.6 + i*0.8)*0.12;
    t.grp.rotation.z = Math.sin(octT*0.9 + i*1.2)*0.10;
  });
  u.body.rotation.y = Math.sin(octT*0.4)*0.08;
  u.mouth.scale.y = 0.7 + Math.abs(Math.sin(octT*2))*0.3;
  if (octT > 25){ oct.visible = false; octA = false; }
}

/* ============================================================
   MASTER TIMERS
   ============================================================ */
let spawnT = 8, sharkTimer = 3, dragonTimer = 8, demonTimer = 3;

export function resetAmbient(){
  wt.visible = false; wtA = false; wtT = 0; wtSpin = 0;
  TOR.trapped = false; TOR.flingTime = 0; TOR.phase = 0;
  ast.visible = false; astA = false; astT = 0;

  sharkPool.forEach(s => { s.active = false; s.obj.visible = false; if (s.mixer){ s.mixer.stopAllAction(); s.mixer.setTime(0); } });
  dragonPool.forEach(d => { d.active = false; d.obj.visible = false; });
  demonPool.forEach(d => {
    d.active = false; d.obj.visible = false;
    if (d.mixer){ d.mixer.stopAllAction(); d.mixer.setTime(0); }
    d.fire.data.forEach(v => { v.life = 0; });
  });

  oct.visible = false; octA = false; octT = 0;
  explosions.slice().forEach(e => { S.remove(e.mesh); e.mesh.geometry.dispose(); e.mesh.material.dispose(); });
  explosions.length = 0;

  spawnT = 8; sharkTimer = 3; dragonTimer = 8; demonTimer = 3;
}

function pickOne(){
  const opts = [];
  if (G.alt < 600) opts.push('wt', 'oct');
  if (G.alt > 40 && G.alt < 2400) opts.push('drg', 'drg');
  if (G.alt > 20) opts.push('shk', 'shk', 'shk');
  if (G.alt > 20 && demonPool.length > 0) opts.push('demon', 'demon', 'demon');
  if (G.alt > 150) opts.push('ast', 'ast');
  if (opts.length === 0) opts.push('ast');
  const e = opts[(Math.random()*opts.length)|0];

  const { fx, fz } = fwd();
  const d = 400 + Math.random()*300;
  const ax = G.P.x + fx*d, az = G.P.z + fz*d;

  if (e === 'wt'){ wt.position.set(ax, 0, az); wt.visible = true; wtA = true; wtT = 0; wtSpin = 0; TOR.trapped = false; TOR.flingTime = 0; say('Dave: "Is that a... water tornado?"', 3); }
  else if (e === 'ast'){ ast.position.set(G.P.x + fx*400 - fz*500, G.P.y + 200 + Math.random()*100, G.P.z + fz*400 + fx*500); astVel.set(fz*200, -10, -fx*200); ast.visible = true; astA = true; astT = 0; say('Dave: "...that\'s a big rock."', 3); }
  else if (e === 'shk'){ if (spawnShark()) say('Dave: "...shark?"', 2.5); }
  else if (e === 'drg'){ spawnDragon(); }
  else if (e === 'demon'){ if (spawnDemon()) say('Dave: "Oh NO, a demon!"', 2.5); }
  else if (e === 'oct'){ oct.position.set(ax, 0, az); oct.visible = true; octA = true; octT = 0; say('Dave: "...is that a tentacle?"', 3); }
}

export function tickAmbient(dt){
  if (G.mode !== 'play') return;

  spawnT -= dt;
  if (spawnT <= 0){ pickOne(); spawnT = 12 + Math.random()*15; }

  sharkTimer -= dt;
  if (sharkTimer <= 0){ if (G.alt > 20) spawnShark(); sharkTimer = 4 + Math.random()*3; }

  dragonTimer -= dt;
  if (dragonTimer <= 0){ if (G.alt > 40 && G.alt < 2400) spawnDragon(); dragonTimer = 10 + Math.random()*8; }

  demonTimer -= dt;
  if (demonTimer <= 0){ if (G.alt > 20 && demonPool.length > 0) spawnDemon(); demonTimer = 4 + Math.random()*3; }

  if (TOR.flingTime > 0){
    G.P.x += TOR.flingVX*dt;
    G.P.z += TOR.flingVZ*dt;
    G.P.y += TOR.flingVY*dt;
    TOR.flingVX *= 0.95; TOR.flingVZ *= 0.95;
    TOR.flingVY -= 80*dt; TOR.flingTime -= dt;
    if (G.P.y < 14) G.P.y = 14;
  }

  tickTornado(dt);
  tickAsteroid(dt);
  tickSharks(dt);
  tickDragons(dt);
  tickDemons(dt);
  tickOctopus(dt);
  tickExplosions(dt);
     }
