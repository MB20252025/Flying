import { T, H, lit, rnd } from '../utils.js';
import { S } from '../scene.js';

const IM = (g,m,n) => { const o = new T.InstancedMesh(g,m,n); o.frustumCulled = false; o.instanceMatrix.setUsage(T.DynamicDrawUsage); return o; };

const _m = new T.Matrix4(), _p = new T.Vector3(), _s = new T.Vector3(), _q0 = new T.Quaternion(), _col = new T.Color();

export const town = new T.Group(); S.add(town);

const BCAP = 20000, CCAP = 7000, WCAP = 42000;

export const bm  = IM(new T.BoxGeometry(1,1,1), new T.MeshLambertMaterial({emissive:0x14100c}), BCAP);
const coneG = new T.CylinderGeometry(0,.7071,1,4,1); coneG.rotateY(Math.PI/4);
export const cnm = IM(coneG, new T.MeshLambertMaterial({emissive:0x10100c}), CCAP);
export const wm  = IM(new T.BoxGeometry(1,1,1), new T.MeshBasicMaterial(), WCAP);

town.add(bm, cnm, wm);
let nb_ = 0, nc_ = 0, nw_ = 0;

function B(x,y,z,w,h,d,c){ if (nb_>=BCAP) return; _p.set(x,y,z); _s.set(w,h,d); bm.setMatrixAt(nb_, _m.compose(_p,_q0,_s)); bm.setColorAt(nb_++, _col.setHex(c)); }
function Cn(x,y,z,w,h,d,c){ if (nc_>=CCAP) return; _p.set(x,y,z); _s.set(w,h,d); cnm.setMatrixAt(nc_, _m.compose(_p,_q0,_s)); cnm.setColorAt(nc_++, _col.setHex(c)); }
function Wn(x,y,z,w,h,d,c){ if (nw_>=WCAP) return; _p.set(x,y,z); _s.set(w,h,d); wm.setMatrixAt(nw_, _m.compose(_p,_q0,_s)); wm.setColorAt(nw_++, _col.setHex(c)); }

const WALL = [0xd9c7a8,0xc9d3d9,0xe0b9a0,0xb7c9b0,0xe8dccb,0xc4b7a3,0xd6a9a0];
const ROOF = [0x7a3b2e,0x4a4f5a,0x6b4a3a,0x3f5a4a];
const CARC = [0xc0392b,0x2c5ea8,0xe8e8e8,0x222222,0xd4a017,0x3a8a4a,0x777777];

function pcar(x,z,c,rot){ B(x,.9,z,rot?4.4:2,1.1,rot?2:4.4,c); B(x,1.8,z,rot?2.4:1.8,.9,rot?1.8:2.4,0x1a2230); Wn(x,.9,z+(rot?0:-2.2),rot?.1:1.6,.3,rot?1.6:.1,0xff2020); }

function houses(X,Z,A,Bq){
  for (let q=0;q<4;q++){
    const x = X+(q&1?22:-22), z = Z+(q&2?21:-21);
    const k = H(A*4+q, Bq, 5), Hh = 6+k*4.5, w = 22, d = 18, fz = z+d/2+.06;
    const ok = H(A+q, Bq, 9);
    B(x, Hh/2, z, w, Hh, d, WALL[(k*97|0)%7]);
    Cn(x, Hh+2.6, z, w*1.15, 5.2, d*1.2, ROOF[(k*53|0)%4]);
    B(x-w/2-1.2, Hh*.6, z, w*.25, Hh*1.2, d*1.05, WALL[(k*97|0)%7]);
    Cn(x-w/2-1.4, Hh+2.2, z, w*.45, 4.4, d*1.1, ROOF[(k*53|0)%4]);
    B(x+6, Hh+3.8, z-3, 2, 4, 2, 0x6b3a2a);
    B(x+6, Hh+5.9, z-3, 2.4, .4, 2.4, 0x4a2a1a);
    B(x-3, 1.4, fz-.01, 2, 2.8, .2, [0x2a4a7a,0x7a2a2a,0x2a6a3a,0x222222][(k*13|0)%4]);
    B(x-3, .15, fz+.25, 3, .3, 1, 0x9a9a9a);
    B(x-3, 2.9, fz+.3, 3.6, .15, 1.6, 0x5a3a22);
    Wn(x+4, 3.4, fz, 3, 2.4, .12, lit(A+q, Bq, 1));
    Wn(x-8, 3.4, fz, 3, 2.4, .12, lit(A+q, Bq, 2));
    for (const wx of [-6,0,6]) Wn(x+wx, Hh-2.4, fz, 2.6, 2.2, .12, lit(A+q, Bq, 3+wx));
    for (const wz of [-4,4]){
      Wn(x+w/2+.06, 3.4, z+wz, .12, 2.4, 2.8, lit(A+q, Bq, 10+wz));
      Wn(x+w/2+.06, Hh-2.4, z+wz, .12, 2.2, 2.6, lit(A+q, Bq, 20+wz));
    }
    B(x+7, 1.6, fz-.02, 4.2, 3.2, .12, 0x8a7a6a);
    Wn(x+7, 1.6, fz+.06, 4, 2.8, .04, 0x2a2a2a);
    B(x, .6, z+d/2+3.5, w, 1.2, .9, 0x2f5a2a);
    B(x+7, .08, z+d/2+6, 5, .16, 12, 0x56565e);
    B(x-6, .55, z+d/2+9, w*.7, .9, .4, 0x2a5a2a);
    B(x+w/2+1.5, .15, z+d/2+3, w*.2, .25, d*.6, 0x8a8a8a);
    if (ok > .45) pcar(x+7, z+d/2+7, CARC[(ok*10|0)%7], 0);
    if (ok < .4){
      B(x-9, 2, z+d/2+4, .8, 4, .8, 0x5a3a22);
      Cn(x-9, 6.5, z+d/2+4, 6, 8, 6, 0x2a6a32);
      B(x-9, .4, z+d/2+4, 2, .4, 2, 0x8a8a8a);
    }
  }
}

function shops(X,Z,A,Bq){
  const SC = [0xc94a3a,0x3a6ac9,0x3ac98a,0xc9a53a,0x8a3ac9,0xe8e8e8];
  for (let i=0;i<4;i++){
    const k = H(A*5+i, Bq, 7), w = 20, x = X-33+i*22, z = Z+4, d = 34, Hh = 9+k*5, fz = z+d/2;
    B(x, Hh/2, z, w, Hh, d, [0xb86b4a,0xcfc4ad,0x8a8f99,0xd6b98a][(k*7|0)%4]);
    B(x, Hh+.5, z, w+.4, 1, d+.4, 0x3a3a40);
    B(x, 3.6, fz+.8, w-1, .15, 1.8, SC[(k*31|0)%6]);
    B(x, 3.2, fz+1.7, w-1, .4, .1, 0xffffff);
    Wn(x, 5.6, fz+.1, w-2, 2, .3, SC[(k*31|0)%6]);
    B(x, 4.3, fz+1.5, w-1, .4, 3, SC[(k*17|0)%6]);
    Wn(x-2, 2.2, fz+.05, w-8, 3, .12, 0xffe2a0);
    B(x+w/2-3, 1.4, fz+.05, 2.4, 2.8, .2, 0x222222);
    for (const wx of [-6,0,6]) Wn(x+wx, Hh-2.6, fz+.06, 3, 2.2, .12, lit(A*5+i, Bq, wx));
    B(x+3, Hh+1.4, z-5, 4, 1.8, 3, 0x888888);
    for (let c=0;c<4;c++){
      Wn(x+w/2+.06, 3.4, z-10+c*8, .12, 2.6, 3.2, lit(A*5+i, Bq, c));
      Wn(x+w/2+.06, 7,   z-10+c*8, .12, 2.2, 3.0, lit(A*5+i, Bq, c+10));
    }
  }
  B(X, .08, Z-31, 82, .16, 28, 0x2c2c34);
  for (let i=0;i<8;i++) pcar(X-30+i*8.5, Z-31, CARC[(H(A,Bq,i)*10|0)%7], 0);
  B(X, .1, Z+38, 84, .2, 22, 0x6b6b72);
  for (let i=0;i<3;i++){
    const tx = X-25+i*25;
    B(tx, 2, Z+40, .8, 4, .8, 0x5a3a22);
    Cn(tx, 6.5, Z+40, 5.5, 7, 5.5, 0x2a6a32);
  }
}

function office(X,Z,g){
  const Hh = 28+g*45, k = g*10|0;
  B(X, 2, Z, 44, 4, 36, 0x4a4f5a);
  B(X, Hh/2, Z, 36, Hh, 30, [0x7d8aa0,0x6e7f95,0x8a8f99][k%3]);
  B(X, Hh+.5, Z, 37, 1, 31, 0x3a3a40);
  B(X+5, Hh+4, Z, .6, 7, .6, 0xaaaaaa);
  Wn(X+5, Hh+7.8, Z, 1, 1, 1, 0xff2020);
  const nf = Math.floor(Hh/4)-1;
  for (let f=1;f<=nf;f++) for (let c=0;c<6;c++){
    const wx = X-15+c*6;
    Wn(wx, f*4+1, Z+15.06, 3.2, 2.4, .12, lit(wx, f, g*100));
    Wn(X+18.06, f*4+1, Z-12.5+c*5, .12, 2.4, 3.2, lit(f, c, g*100+1));
    Wn(wx, f*4+1, Z-15.06, 3.2, 2.4, .12, lit(wx, f, g*100+2));
  }
}

function petrol(X,Z){
  B(X, .15, Z, 78, .3, 72, 0x3a3a42);
  B(X-6, 8.2, Z+10, 34, 1, 18, 0xe03a3a);
  B(X-6, 8.85, Z+10, 34.2, .3, 18.2, 0xffffff);
  for (const px of [-20,8]) for (const pz of [3,17]) B(X+px, 4, Z+pz, 1, 8, 1, 0xdddddd);
  for (let i=-1;i<=1;i++) Wn(X-6+i*10, 7.6, Z+10, 5, .2, 5, 0xffffee);
  for (let i=0;i<4;i++){
    const px = X-17+i*7.5;
    B(px, 1.6, Z+10, 1.2, 3.2, .9, 0xf0f0f0);
    Wn(px, 2.5, Z+10.5, .8, .8, .12, 0x40ff80);
    B(px, .5, Z+10, 2.2, .2, 2.6, 0x777777);
    B(px, 3.4, Z+10, 1.4, .2, .4, 0xff4040);
  }
  pcar(X-13, Z+14.5, 0x2c5ea8, 0);
  B(X-8, 3.6, Z-26, 30, 7.2, 16, 0xe8e8e8);
  B(X-8, 7.4, Z-26, 30.4, .6, 16.4, 0xe03a3a);
  for (let i=-1;i<=2;i++) Wn(X-8+i*7-3.5, 3.4, Z-17.94, 5, 3, .12, 0xfff0c0);
  B(X+30, 9, Z+14, 1.2, 18, 1.2, 0x666666);
  Wn(X+30, 17, Z+14, 7, 5, 1.4, 0x4be37a);
  Wn(X+30, 18, Z+14.75, 5, .7, .1, 0xffffff);
  Wn(X+30, 16.2, Z+14.75, 5, .7, .1, 0xffffff);
  B(X+8, 3, Z-26, 20, 6, 14, 0x2a5a8a);
  B(X+8, 6.2, Z-26, 20.4, .4, 14.4, 0x4be37a);
  Wn(X+8, 3, Z-19, 18, 4, .1, 0x1a4a7a);
  B(X-26, 2.2, Z-26, .5, 4, .5, 0x999999);
  B(X-26, 4.4, Z-26, 1, .5, .5, 0x111111);
  B(X-26, .05, Z-26, 3, .05, 3, 0x1a1a1a);
  for (const bxp of [-30,10]) B(bxp, 1, Z+20, .3, 2, .3, 0xff8a00);
}

function park(X,Z){
  B(X, .1, Z, 86, .2, 86, 0x2f6b34);
  B(X+14, .2, Z-12, 24, .25, 18, 0x2b6fa0);
  for (let i=0;i<18;i++){
    const tx = X+(H(X,i,2)-.5)*76, tz = Z+(H(Z,i,3)-.5)*76;
    if (Math.abs(tx-X-14)<17 && Math.abs(tz-Z+12)<14) continue;
    B(tx, 2, tz, .8, 4, .8, 0x5a3a22);
    Cn(tx, 7, tz, 6.5, 8, 6.5, [0x1f5a2a,0x2b7a3a,0x3a8a2a][i%3]);
  }
  for (let i=0;i<3;i++) B(X-30+i*8, .5, Z+30, 3, .5, .9, 0x7a5232);
}

function cellStart(X,Z){
  B(X, -.2, Z, 84, .2, 84, 0x2f6b34);
  B(X+30, -.08, Z+12, 10, .12, 40, 0x56565e);
  pcar(X+30, Z+22, 0x2c5ea8, 0);
  for (let i=0;i<7;i++){
    const a = i*.9, tx = X+Math.cos(a)*34, tz = Z+Math.sin(a)*34;
    B(tx, 2, tz, .8, 4, .8, 0x5a3a22);
    Cn(tx, 6.5, tz, 6, 8, 6, 0x2a6a32);
  }
  B(X, 1, Z+40, 50, 2, .8, 0x2f5a2a);
}

function lamps(X,Z){
  for (const q of [[X-43.5,Z-25],[X-43.5,Z+25],[X-25,Z+43.5],[X+25,Z+43.5]]){
    B(q[0], 4, q[1], .35, 8, .35, 0x444444);
    Wn(q[0], 8.1, q[1], 1.4, .3, 1.4, 0xfff1b0);
  }
}

function tlights(cx,cz){
  for (const sx of [-1,1]) for (const sz of [-1,1]){
    const x = cx+sx*6.5, z = cz+sz*6.5, g = sx*sz > 0;
    B(x, 3, z, .35, 6, .35, 0x222222);
    B(x, 6.7, z, .9, 2.7, .9, 0x111111);
    Wn(x-sx*.3, 7.6, z-sz*.3, .6, .6, .6, g?0xff2a2a:0x401010);
    Wn(x-sx*.3, 6.7, z-sz*.3, .6, .6, .6, 0x4a3000);
    Wn(x-sx*.3, 5.8, z-sz*.3, .6, .6, .6, g?0x103010:0x30ff60);
  }
}

export function laySt(cx, cz){
  nb_ = nc_ = nw_ = 0;
  for (let a=-7;a<=7;a++) for (let b=-7;b<=7;b++){
    const A = cx+a, Bq = cz+b;
    const X = (A+.5)*100, Z = (Bq+.5)*100;
    const h = H(A,Bq,0), g = H(A,Bq,1);
    if (A===0 && Bq===0) cellStart(X,Z);
    else if (A===0 && Bq===-5) B(X,-.2,Z,90,.2,90,0x55555c);   // ← King Kong tower cell
    else if (h < .1) park(X,Z);
    else if (h < .14) petrol(X,Z);
    else if (h < .3) shops(X,Z,A,Bq);
    else if (h < .4) office(X,Z,g);
    else houses(X,Z,A,Bq);
    lamps(X,Z);
    if (((A+Bq)&1) !== 0) tlights(A*100, Bq*100);
  }
  bm.count = nb_; cnm.count = nc_; wm.count = nw_;
  [bm,cnm,wm].forEach(o => { o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true; });
}
