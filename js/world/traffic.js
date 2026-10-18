import { T, H } from '../utils.js';
import { G } from '../game.js';
import { S } from '../scene.js';

const IM = (g,m,n) => { const o = new T.InstancedMesh(g,m,n); o.frustumCulled = false; o.instanceMatrix.setUsage(T.DynamicDrawUsage); return o; };
const _m = new T.Matrix4(), _p = new T.Vector3(), _s = new T.Vector3(), _q = new T.Quaternion(), _q0 = new T.Quaternion(), _col = new T.Color(), _e = new T.Euler();

const CARC = [0xc0392b,0x2c5ea8,0xe8e8e8,0x222222,0xd4a017,0x3a8a4a,0x777777];

/* ---- CARS ---- */
export const traf = new T.Group(); S.add(traf);
const NCAR = 200;
const carB = IM(new T.BoxGeometry(2,1.1,4.4), new T.MeshLambertMaterial(), NCAR);
const carC = IM(new T.BoxGeometry(1.8,.9,2.4), new T.MeshLambertMaterial({color:0x1a2230}), NCAR);
const carH = IM(new T.SphereGeometry(.36,6,5), new T.MeshLambertMaterial(), NCAR*2);
const carL = IM(new T.BoxGeometry(.5,.3,.12), new T.MeshBasicMaterial(), NCAR*4);
traf.add(carB, carC, carH, carL);

const cars = [];
for (let i=0;i<NCAR;i++){
  cars.push({ ax:i&1, off:((i*7+3)%11)-5, dir:((i>>1)&1)?1:-1, spd:8+H(i,1,1)*12, base:H(i,2,2)*1200, pas:H(i,3,3)>.5 });
  carB.setColorAt(i, _col.setHex(CARC[i%7]));
  carH.setColorAt(i*2,   _col.setHex(0xe0a883));
  carH.setColorAt(i*2+1, _col.setHex(0x8d5a3c));
  [0xffffee,0xffffee,0xff2020,0xff2020].forEach((c,j) => carL.setColorAt(i*4+j, _col.setHex(c)));
}

function cput(m, idx, x, z, sn, cs, lx, ly, lz, sc){
  _p.set(x + lx*cs + lz*sn, ly, z - lx*sn + lz*cs);
  _s.set(sc,sc,sc);
  m.setMatrixAt(idx, _m.compose(_p,_q,_s));
}

export function updCars(px, pz){
  const cxl = Math.round(px/100), czl = Math.round(pz/100);
  for (let i=0;i<NCAR;i++){
    const c = cars[i];
    const pa = c.ax ? px : pz, lw = ((c.ax ? czl : cxl) + c.off)*100;
    let al = (c.base + c.dir*c.spd*G.tt - pa) % 1200;
    if (al < 0) al += 1200;
    al = pa + al - 600;
    let x, z, yaw;
    if (c.ax === 0){ x = lw + c.dir*3.2; z = al; yaw = c.dir > 0 ? 0 : Math.PI; }
    else { x = al; z = lw - c.dir*3.2; yaw = c.dir > 0 ? 1.5708 : -1.5708; }
    const sn = Math.sin(yaw), cs = Math.cos(yaw);
    _q.setFromEuler(_e.set(0, yaw, 0));
    cput(carB, i, x, z, sn, cs, 0, .9, 0, 1);
    cput(carC, i, x, z, sn, cs, 0, 1.8, -.3, 1);
    cput(carH, i*2, x, z, sn, cs, -.5, 2.05, -.2, 1);
    cput(carH, i*2+1, x, z, sn, cs, .5, 2.05, -.2, c.pas ? 1 : .001);
    cput(carL, i*4, x, z, sn, cs, -.7, .9, 2.2, 1);
    cput(carL, i*4+1, x, z, sn, cs, .7, .9, 2.2, 1);
    cput(carL, i*4+2, x, z, sn, cs, -.7, 1, -2.2, 1);
    cput(carL, i*4+3, x, z, sn, cs, .7, 1, -2.2, 1);
  }
  [carB, carC, carH, carL].forEach(m => m.instanceMatrix.needsUpdate = true);
}

/* ---- PEDESTRIANS ---- */
export const pedG = new T.Group(); S.add(pedG);
const NP = 340;
const pedB = IM(new T.CylinderGeometry(.26,.3,1.2,6), new T.MeshLambertMaterial(), NP);
const pedH = IM(new T.SphereGeometry(.22,6,5), new T.MeshLambertMaterial(), NP);
pedG.add(pedB, pedH);

const peds = [];
for (let i=0;i<NP;i++){
  peds.push({ ax:i&1, off:((i*5+2)%9)-4, dir:(i&2)?1:-1, side:(i%3?1:-1)*5.4, spd:1.1+H(i,4,4)*.7, base:H(i,5,5)*800 });
  pedB.setColorAt(i, _col.setHSL(H(i,6,6), .6, .45));
  pedH.setColorAt(i, _col.setHex([0xe0a883,0x8d5a3c,0xf1c9a5,0x5a3a28][i%4]));
}

export function updPeds(px, pz){
  const cxl = Math.round(px/100), czl = Math.round(pz/100);
  for (let i=0;i<NP;i++){
    const p = peds[i];
    const pa = p.ax ? px : pz, lw = ((p.ax ? czl : cxl) + p.off)*100;
    let al = (p.base + p.dir*p.spd*G.tt - pa) % 800;
    if (al < 0) al += 800;
    al = pa + al - 400;
    const y = Math.abs(Math.sin(G.tt*7+i))*.06;
    if (p.ax === 0) _p.set(lw+p.side, .7+y, al);
    else _p.set(al, .7+y, lw+p.side);
    _s.set(1,1,1);
    pedB.setMatrixAt(i, _m.compose(_p,_q0,_s));
    _p.y = 1.55 + y;
    pedH.setMatrixAt(i, _m.compose(_p,_q0,_s));
  }
  pedB.instanceMatrix.needsUpdate = pedH.instanceMatrix.needsUpdate = true;
}
