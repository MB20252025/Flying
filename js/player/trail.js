import { T, rnd } from '../utils.js';
import { G } from '../game.js';
import { S, cam } from '../scene.js';

export const NT = 140;
export const tp = new Float32Array(NT*3).fill(-9999);
const tg = new T.BufferGeometry();
tg.setAttribute('position', new T.BufferAttribute(tp, 3));
export let th = 0;

export const trail = new T.Points(tg, new T.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: T.AdditiveBlending,
  uniforms: {
    uSize: { value: 1.4 },
    uColor: { value: new T.Color(0xfff2c8) },
    uOpacity: { value: 0.60 }
  },
  vertexShader: `
    uniform float uSize;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * 260.0 / max(-mv.z, 1.0);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    void main(){
      float r = length(gl_PointCoord - 0.5) * 2.0;
      float a = smoothstep(1.0, 0.0, r);
      a *= a;
      gl_FragColor = vec4(uColor, a * uOpacity);
    }
  `
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
  const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);
  tp[th*3]   = G.P.x - fx * 1.5 + (Math.random()-.5);
  tp[th*3+1] = G.P.y + (Math.random()-.5);
  tp[th*3+2] = G.P.z - fz * 1.5;
  tg.attributes.position.needsUpdate = true;
  trail.material.uniforms.uSize.value = 1.4 + boost * 1.8;

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
