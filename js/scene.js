import { T, $ } from './utils.js';

export const R = new T.WebGLRenderer({canvas:$('c'),antialias:false,powerPreference:'high-performance'});
export const S = new T.Scene();
export const cam = new T.PerspectiveCamera(65,1,1,40000);
S.add(cam);
S.fog = new T.Fog(0x2b3a6b,60,650);

export const hemi = new T.HemisphereLight(0xaaccff,0x443355,.95); S.add(hemi);
export const sun  = new T.DirectionalLight(0xffddaa,.55); sun.position.set(-50,80,-30); S.add(sun);

export const PIXEL = { pr: 1 };

export function setPR(v){ PIXEL.pr = v; resize(); }

export function resize(){
  R.setPixelRatio(PIXEL.pr);
  R.setSize(innerWidth, innerHeight, false);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}

addEventListener('resize', resize);
