import { T, rnd } from '../utils.js';
import { G } from '../game.js';
import { S, cam } from '../scene.js';

export const NT = 140;
export const tp = new Float32Array(NT*3).fill(-9999);
const tg = new T.BufferGeometry();
tg.setAttribute('position', new T.BufferAttribute(tp, 3));
export let th = 0;

export const trail = new T.Points(tg, new T.PointsMaterial({
  color:0xfff2c8, size:1.0, transparent:true, opacity:.32,
  blending:T.AdditiveBlending, depthWrite:false, sizeAttenuation:true
}));
trail.frustumCulled = false;
S.add(trail);

export const NS = 70;
export const sp_ = new Float32Array(NS*6);
export const sgeo = new T.BufferGeometry();
export const sz = new Float32Array(NS);
sgeo.setAttribute('position', new T.BufferAttribute(sp_, 3));

export const streaks = new T.LineSegments(sgeo, new T.LineBasicMaterial({color:0xffffff, transparent:true, opacity:0}));
streaks.frustumCulled = false;
cam.add(streaks);

function rs(i, z){
  const x = (rnd()-.5)*30, y = (rnd()-.5)*20;
  sp_[i*6]   = sp_[i*6+3] = x;
  sp_[i*6+1] = sp_[i*6+4] = y;
  sz[i] = z;
}
for (let i=0;i<NS;i++) rs(i, -rnd()*45);

export function tickTrail(dt, boost){
  th = (th+1) % NT;
  tp[th*3]   = G.P.x + (Math.random()-.5);
  tp[th*3+1] = G.P.y + (Math.random()-.5);
  tp[th*3+2] = G.P.z + 1.5;
  tg.attributes.position.needsUpdate = true;
  trail.material.size = 1.4 + boost*2.0;

  const so = Math.max(0, Math.min(1, (G.P.fs-45)/60));
  streaks.material.opacity = .5*so;
  for (let i=0;i<NS;i++){
    sz[i] += G.P.fs*1.4*dt;
    if (sz[i] > 0) rs(i, -45);
    sp_[i*6+2] = sz[i];
    sp_[i*6+5] = sz[i] - so*6;
  }
  sgeo.attributes.position.needsUpdate = true;
}
