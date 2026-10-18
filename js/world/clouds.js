import { T, cl, rnd } from '../utils.js';
import { G } from '../game.js';
import { S } from '../scene.js';

export const NC = 56, PP = 9, CN = NC*PP;
const cpos = new Float32Array(CN*3);
const csz  = new Float32Array(CN);
const ccol = new Float32Array(CN*3);
const ck   = new Float32Array(CN);
const cg = new T.BufferGeometry();
[['position',cpos,3],['size',csz,1],['col',ccol,3],['k',ck,1]].forEach(a => cg.setAttribute(a[0], new T.BufferAttribute(a[1], a[2])));

export const cm = new T.ShaderMaterial({
  transparent:true, depthWrite:false,
  uniforms: { uO:{value:1}, uS:{value:500}, uL:{value:new T.Color()}, uD:{value:new T.Color()} },
  vertexShader: 'attribute float size;attribute vec3 col;attribute float k;varying vec3 vC;varying float vA;uniform float uS;uniform vec3 uL,uD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float d=-mv.z;gl_PointSize=min(size*uS/max(d,1.),700.);vC=mix(uD,uL,k)*col;vA=smoothstep(8.,50.,d)*(1.-smoothstep(480.,760.,d));gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'varying vec3 vC;varying float vA;uniform float uO;void main(){float r=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,.05,r);a*=a;gl_FragColor=vec4(vC,a*.8*vA*uO);}'
});
export const cloudsP = new T.Points(cg, cm);
cloudsP.frustumCulled = false;
S.add(cloudsP);

export const cls = [];
for (let i=0;i<NC;i++) cls.push({ x:0, y:0, z:0, r:20, gold:false, in:false, eg:null });

export let eyeG = [];
export function attachEyes(eyes){ eyeG = eyes; }

let lastEyeDist = 0;
let nextEyeDistance = 2500 + Math.random() * 1000;

export function resetEyeTracker(){
  lastEyeDist = G.totalDist;
  nextEyeDistance = 2500 + Math.random() * 1000;
}

/* Clouds must never sit below alt 200 */
const CLOUD_MIN_Y = 200;

export function spawnCloud(i, init){
  const c = cls[i];
  if (c.eg){ c.eg.visible = false; c.eg.userData.free = true; c.eg = null; }
  const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);
  const ahead = init ? rnd()*700 : 150 + rnd()*550;
  c.x = G.P.x + fx * ahead + (rnd()-.5)*520;

  let cy = G.P.y + (rnd()-.5)*280;
  if (cy < CLOUD_MIN_Y) cy = CLOUD_MIN_Y + rnd() * 120;
  c.y = cy;

  c.z = G.P.z + fz * ahead + (rnd()-.5)*520;
  c.gold = rnd() < .07;
  const w = 16 + rnd()*38;
  const h = 6 + rnd()*(rnd()<.3 ? 30 : 14);
  c.r = w; c.in = false;
  for (let j=0;j<PP;j++){
    const n = i*PP + j;
    cpos[n*3]   = c.x + (rnd()-.5)*2*w;
    cpos[n*3+1] = c.y + (rnd()-.45)*2*h;
    cpos[n*3+2] = c.z + (rnd()-.5)*w;
    csz[n] = (w*.9 + rnd()*30)*(.8+rnd()*.5);
    ck[n] = cl(((rnd()-.45)*2*h)/h*.5 + .55 + (rnd()-.5)*.3);
    const v = .9 + rnd()*.1;
    ccol[n*3]   = c.gold ? 1 : v;
    ccol[n*3+1] = c.gold ? .82 : v;
    ccol[n*3+2] = c.gold ? .45 : v;
  }
  cg.attributes.position.needsUpdate = cg.attributes.size.needsUpdate = cg.attributes.col.needsUpdate = cg.attributes.k.needsUpdate = true;

  if (!c.gold && G.P.y > 900 && c.r >= 22){
    if (G.totalDist - lastEyeDist >= nextEyeDistance){
      const g = eyeG.find(e => e.userData.free);
      if (g){
        g.userData.free = false;
        c.eg = g;
        g.visible = true;
        g.scale.setScalar(c.r * .12);
        g.position.set(c.x, c.y, c.z);
        lastEyeDist = G.totalDist;
        nextEyeDistance = 2500 + Math.random() * 1000;
      }
    }
  }
}

export function recycleClouds(){
  const fx = Math.sin(G.P.yaw), fz = -Math.cos(G.P.yaw);
  for (let i=0;i<NC;i++){
    const c = cls[i];
    const dx = c.x - G.P.x, dz = c.z - G.P.z;
    const forward = dx * fx + dz * fz;
    const right   = dx * fz - dz * fx;
    if (forward < -60 || Math.abs(c.y - G.P.y) > 210 || Math.abs(right) > 340 || c.y < CLOUD_MIN_Y){
      spawnCloud(i, false);
    }
  }
}
