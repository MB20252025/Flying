import { T, M } from './utils.js';
import { G } from './game.js';
import { S, cam } from './scene.js';
import { burst, tone } from './audio.js';

const IM = (g,m,n) => { const o = new T.InstancedMesh(g,m,n); o.frustumCulled = false; o.instanceMatrix.setUsage(T.DynamicDrawUsage); return o; };
const _m = new T.Matrix4(), _p = new T.Vector3(), _s = new T.Vector3(), _q = new T.Quaternion(), _q0 = new T.Quaternion(), _col = new T.Color(), _e = new T.Euler();

/* ---------- DEBRIS ---------- */
const ND = 220;
const dbm = IM(new T.BoxGeometry(1,1,1), new T.MeshLambertMaterial(), ND);
const dbs = [];
S.add(dbm);

for (let i=0;i<ND;i++){
  dbs.push({p:new T.Vector3(), v:new T.Vector3(), r:new T.Vector3(), w:new T.Vector3(), l:0, s:1});
  dbm.setMatrixAt(i, _m.compose(_p.set(0,-999,0), _q0, _s.set(0,0,0)));
  dbm.setColorAt(i, _col.setHex(0xffffff));
}

const NDU = 160;
const dup = new Float32Array(NDU*3).fill(-9999);
const duv = new Float32Array(NDU*3);
const dug = new T.BufferGeometry();
dug.setAttribute('position', new T.BufferAttribute(dup, 3));
const dum = new T.PointsMaterial({color:0xd8d0c4, size:6, transparent:true, opacity:0, depthWrite:false});
const dustP = new T.Points(dug, dum);
dustP.frustumCulled = false;
S.add(dustP);

let dustL = 0, deb = false, crashed = false;
export const getCrashed = () => crashed;
export const setCrashed = v => { crashed = v; };

export function debris(){
  deb = true;
  for (let i=0;i<ND;i++){
    const d = dbs[i], r = Math.random();
    d.p.set(50 + (Math.random()-.5)*6, 5.2 + Math.random()*.5, 51 + (Math.random()-.5)*5);
    d.v.set((Math.random()-.5)*16, 6 + Math.random()*14, (Math.random()-.5)*16);
    d.w.set((Math.random()-.5)*12, (Math.random()-.5)*12, (Math.random()-.5)*12);
    d.r.set(0,0,0);
    d.l = 3.5 + Math.random()*2.5;
    d.s = .10 + Math.random()*.85;
    if (i < 8) d.s = 1.0 + Math.random()*.5;
    dbm.setColorAt(i, _col.setHex(r<.45 ? 0xb5412e : r<.75 ? 0xeee6d8 : 0x7a5230));
  }
  dbm.instanceColor.needsUpdate = true;
  for (let i=0;i<NDU;i++){
    dup[i*3]   = 50 + (Math.random()-.5)*5;
    dup[i*3+1] = 5 + Math.random();
    dup[i*3+2] = 51 + (Math.random()-.5)*4;
    duv[i*3]   = (Math.random()-.5)*10;
    duv[i*3+1] = Math.random()*8;
    duv[i*3+2] = (Math.random()-.5)*10;
  }
  dustL = 2.5;
}

export function tickDebris(dt){
  if (deb){
    let any = false;
    for (let i=0;i<ND;i++){
      const d = dbs[i];
      let sc = 0;
      if (d.l > 0){
        any = true;
        d.v.y -= 20*dt;
        d.p.addScaledVector(d.v, dt);
        if (d.p.y < .3){ d.p.y = .3; d.v.set(d.v.x*.3, 0, d.v.z*.3); d.w.multiplyScalar(.3); }
        d.r.addScaledVector(d.w, dt);
        d.l -= dt;
        sc = d.s * Math.min(1, d.l);
      }
      _q.setFromEuler(_e.set(d.r.x, d.r.y, d.r.z));
      _s.set(sc, sc*.35, sc*.8);
      dbm.setMatrixAt(i, _m.compose(d.p, _q, _s));
    }
    dbm.instanceMatrix.needsUpdate = true;
    if (!any) deb = false;
  }
  if (dustL > 0){
    dustL -= dt;
    for (let i=0;i<NDU*3;i++){ dup[i] += duv[i]*dt; duv[i] *= .97; }
    dum.opacity = Math.min(.5, dustL*.4);
    dug.attributes.position.needsUpdate = true;
  }
}

/* ---------- WEATHER ---------- */
export const WX = { stormF:0, storm:false, stormT:45, flash:0, boltT:0, nextBolt:3 };

const NR = 240;
const rX = new Float32Array(NR), rY = new Float32Array(NR), rZ = new Float32Array(NR);
const rp = new Float32Array(NR*6);
const rgeo = new T.BufferGeometry();
rgeo.setAttribute('position', new T.BufferAttribute(rp, 3));
const rain = new T.LineSegments(rgeo, new T.LineBasicMaterial({color:0xaac4ff, transparent:true, opacity:.45}));
rain.frustumCulled = false; rain.visible = false;
cam.add(rain);
for (let i=0;i<NR;i++){
  rX[i] = (Math.random()-.5)*36;
  rY[i] = Math.random()*20 - 12;
  rZ[i] = -Math.random()*50;
}

const bp = new Float32Array(220*6);
const bgeo = new T.BufferGeometry();
bgeo.setAttribute('position', new T.BufferAttribute(bp, 3));
const bolt = new T.LineSegments(bgeo, new T.LineBasicMaterial({color:0xeaf2ff, fog:false, transparent:true}));
bolt.frustumCulled = false; bolt.visible = false;
S.add(bolt);

const thunderQ = [];

function mkBolt(){
  const pts = [];
  let x = G.P.x + (Math.random()-.5)*320;
  let z = G.P.z - 180 - Math.random()*280;
  let y = G.P.y + 280;
  const bot = Math.max(0, G.P.y - 260);
  const dy = (y - bot)/18;
  for (let i=0;i<=18;i++){
    pts.push([x,y,z]);
    x += (Math.random()-.5)*30;
    z += (Math.random()-.5)*30;
    y -= dy;
  }
  let n = 0;
  const seg = (a,b,o) => {
    bp[n++] = a[0]+o; bp[n++] = a[1]; bp[n++] = a[2];
    bp[n++] = b[0]+o; bp[n++] = b[1]; bp[n++] = b[2];
  };
  for (const o of [-1.4,-.8,0,.8,1.4]) for (let i=0;i<18;i++) seg(pts[i], pts[i+1], o);
  let prev = pts[8];
  const dx = (Math.random()-.5)*40;
  for (let i=0;i<12;i++){
    const nx = [prev[0]+dx*.5+(Math.random()-.5)*14, prev[1]-dy*.7, prev[2]+(Math.random()-.5)*14];
    seg(prev, nx, 0);
    prev = nx;
  }
  bgeo.setDrawRange(0, n/3);
  bgeo.attributes.position.needsUpdate = true;
  bolt.visible = true;
  WX.flash = 1;
  WX.boltT = .3;
  thunderQ.push(.8 + Math.random()*1.6);
}

export function tickWeather(dt){
  WX.stormT -= dt;
  if (WX.stormT <= 0){
    WX.storm = !WX.storm && G.alt < 1700;
    WX.stormT = WX.storm ? 28 + Math.random()*10 : 55 + Math.random()*40;
  }
  if (G.alt > 1900) WX.storm = false;
  WX.stormF += ((WX.storm ? 1 : 0) - WX.stormF) * (1 - Math.exp(-.7*dt));

  if (WX.storm && WX.stormF > .6){
    WX.nextBolt -= dt;
    if (WX.nextBolt <= 0){
      mkBolt();
      WX.nextBolt = .5 + Math.random()*1.8;
    }
  }
  if (WX.boltT > 0){
    WX.boltT -= dt;
    bolt.material.opacity = Math.random() > .3 ? 1 : .4;
    if (WX.boltT <= 0) bolt.visible = false;
  }
  WX.flash = Math.max(0, WX.flash - dt*3.5);

  for (let k=thunderQ.length-1;k>=0;k--){
    thunderQ[k] -= dt;
    if (thunderQ[k] <= 0){
      thunderQ.splice(k,1);
      burst(1.6, 350, .7);
      tone(60, 1.2, 'sawtooth', .15, 30);
    }
  }

  rain.visible = WX.stormF > .03;
  if (rain.visible){
    rain.material.opacity = WX.stormF*.5;
    for (let i=0;i<NR;i++){
      rY[i] -= 55*dt;
      rZ[i] += G.P.fs*dt;
      if (rY[i] < -14 || rZ[i] > 3){
        rX[i] = (Math.random()-.5)*36;
        rY[i] = 8 + Math.random()*8;
        rZ[i] = -Math.random()*50 - 1;
      }
      rp[i*6]   = rX[i];
      rp[i*6+1] = rY[i];
      rp[i*6+2] = rZ[i];
      rp[i*6+3] = rX[i] - .1;
      rp[i*6+4] = rY[i] + 1.5;
      rp[i*6+5] = rZ[i] - .3;
    }
    rgeo.attributes.position.needsUpdate = true;
  }
}

export function resetWeather(){
  WX.stormF = 0; WX.storm = false; WX.stormT = 45; WX.flash = 0; WX.boltT = 0; WX.nextBolt = 3;
}
