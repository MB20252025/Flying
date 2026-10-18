export const T = window.THREE;
export const $ = i => document.getElementById(i);
export const cl = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const lp = (a,b,t)=>a+(b-a)*t;
export const sm = (a,b,x)=>{x=cl((x-a)/(b-a));return x*x*(3-2*x)};

let _seed = 20260;
export const setSeed = s => { _seed = s; };
export const rnd = ()=>{_seed|=0;_seed=_seed+0x6D2B79F5|0;let t=Math.imul(_seed^_seed>>>15,1|_seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

export const H = (a,b,c)=>{const h=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return h-Math.floor(h)};
export const lit = (a,b,c)=>H(a,b,c)>.42?(H(c,a,b)>.5?0xffd27a:0xffb84a):0x1c2740;
export const M = (c,o)=>new T.MeshLambertMaterial(Object.assign({color:c},o||{}));
export const tex = (w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return new T.CanvasTexture(c)};
