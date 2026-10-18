import { T, cl, lp, sm } from './utils.js';
import { S, hemi } from './scene.js';
import { G } from './game.js';
import { WX } from './effects.js';
import { cm } from './world/clouds.js';
import { gm } from './world/ground.js';
import { banner } from './ui.js';
import { sfx } from './audio.js';
import { aurora, auroraMat, auroraMat2 } from './space.js';

export const skyM = new T.ShaderMaterial({
  side:T.BackSide, depthWrite:false, fog:false,
  uniforms:{ t:{value:new T.Color()}, b:{value:new T.Color()}, sc:{value:new T.Color()}, st:{value:1}, sd:{value:new T.Vector3(-.5,.3,-.6).normalize()} },
  vertexShader:'varying vec3 d;void main(){d=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 d;uniform vec3 t,b,sc,sd;uniform float st;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}void main(){float y=clamp(d.y,0.,1.);vec3 c=mix(b,t,pow(y,.5));c+=sc*pow(max(dot(d,sd),0.),28.)*.7;float s=step(.9975,h(floor(d*190.)))*st*smoothstep(.1,.5,d.y);gl_FragColor=vec4(c+s,1.);}'
});
export const sky = new T.Mesh(new T.SphereGeometry(1000,24,12), skyM);
sky.renderOrder = -1; sky.frustumCulled = false;
S.add(sky);

const ST = [
  [0,'THE NEIGHBOURHOOD',0x0b1230,0x2b3a6b,.8,0xffcc88],
  [250,'THE CLOUD LAYER',0x24407a,0xf0a070,.2,0xffd9a0],
  [600,'THE STRANGE SKY',0x4a2a8a,0xff7fb0,.5,0xffe0ff],
  [1100,'THE IMPOSSIBLE ATMOSPHERE',0x0b6b7a,0xc77dff,.8,0xaaffee],
  [1700,'ABOVE REALITY',0x120030,0xffd06b,1,0xffffff],
  [2700,'SPACE',0x000005,0x04041c,1,0xffffff],
  [4200,'DEEP SPACE',0x000000,0x0a0024,1,0xffffff]
];

const c1 = new T.Color(), c2 = new T.Color(), W = new T.Color(1,1,1), GR = new T.Color(.3,.32,.38), GR2 = new T.Color(.12,.13,.18);

export function palette(){
  const alt = G.alt;
  let i = 0;
  while (i < ST.length-1 && alt >= ST[i+1][0]) i++;
  const a = ST[i], b = ST[Math.min(i+1, ST.length-1)];
  const f = i >= ST.length-1 ? 0 : sm(a[0], b[0], alt);

  c1.setHex(a[2]).lerp(c2.setHex(b[2]), f);
  skyM.uniforms.t.value.copy(c1);
  hemi.color.copy(c1).lerp(W, .45);

  c1.setHex(a[3]).lerp(c2.setHex(b[3]), f);
  skyM.uniforms.b.value.copy(c1);
  S.fog.color.copy(c1);
  hemi.groundColor.copy(c1).multiplyScalar(.4);

  cm.uniforms.uL.value.copy(c1).lerp(W, .72).multiplyScalar(.6 + .4*Math.min(1, alt/300));
  c2.setHex(a[2]).lerp(new T.Color(b[2]), f);
  cm.uniforms.uD.value.copy(c2).lerp(W, .3).multiplyScalar(.6 + .35*Math.min(1, alt/300));

  skyM.uniforms.st.value = lp(a[4], b[4], f);
  c1.setHex(a[5]);
  skyM.uniforms.sc.value.copy(c1);
  S.fog.far = 650 + alt*.3;

  gm.color.setRGB(
    .55 + .45*Math.min(1, alt/400),
    .60 + .40*Math.min(1, alt/400),
    .70 + .30*Math.min(1, alt/400)
  );

  if (WX.stormF > .01){
    const g = 1 - .55*WX.stormF;
    cm.uniforms.uL.value.multiplyScalar(g);
    cm.uniforms.uD.value.multiplyScalar(g*.8);
    S.fog.color.lerp(GR, WX.stormF*.6);
    skyM.uniforms.t.value.lerp(GR2, WX.stormF*.7);
    skyM.uniforms.b.value.lerp(GR, WX.stormF*.6);
  }
  if (WX.flash > .01){
    S.fog.color.lerp(W, WX.flash*.5);
    skyM.uniforms.b.value.lerp(W, WX.flash*.5);
    skyM.uniforms.t.value.lerp(W, WX.flash*.4);
    cm.uniforms.uL.value.lerp(W, WX.flash*.6);
  }
  hemi.intensity = .95 - .35*WX.stormF + WX.flash*3;
  cm.uniforms.uO.value = 1 - sm(1900, 2700, alt);

  if (i !== G.stageI){
    G.stageI = i;
    if (G.mode === 'play'){ banner(a[1]); sfx.stage(); }
  }

  const au = sm(1000, 1600, alt) * (1 - sm(2300, 2800, alt));
  aurora.visible = auroraMat2.opacity > 0;
  aurora.visible = au > .01;
  auroraMat.opacity = au*.22;
  auroraMat2.opacity = au*.14;
  aurora.position.set(G.P.x, G.P.y+400, G.P.z-2200);
  aurora.rotation.z = Math.sin(G.tt*.15)*.15;
}
