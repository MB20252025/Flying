import { T, rnd } from '../utils.js';
import { G, dist } from '../game.js';
import { S } from '../scene.js';
import { mkSlice, mCr, mPe } from '../pizza.js';
import { M } from '../utils.js';

const mObs = [M(0xe8a93c,{emissive:0x331a00}), M(0x6a3f9a), M(0xe879a8,{emissive:0x331020})];

export const sl = [];
for (let i=0;i<26;i++){ const s = mkSlice(); s.visible = false; S.add(s); sl.push(s); }

export const ob = [];
for (let i=0;i<12;i++){
  const g = new T.Group(), pz = new T.Group(), sf = new T.Group(), dn = new T.Group();
  pz.add(new T.Mesh(new T.CylinderGeometry(6,6,.8,24), mObs[0]));
  const cr = new T.Mesh(new T.TorusGeometry(6,.7,8,24), mCr); cr.rotation.x = Math.PI/2; pz.add(cr);
  for (let j=0;j<6;j++){
    const p = new T.Mesh(new T.CylinderGeometry(1,1,.3,10), mPe);
    const a = j*1.05;
    p.position.set(Math.cos(a)*3.2, .5, Math.sin(a)*3.2);
    pz.add(p);
  }
  pz.rotation.x = 1.2;
  [[10,2,5,0,1],[10,3.5,1.4,0,3],[1.4,3,5,-4.3,2],[1.4,3,5,4.3,2]].forEach(a => {
    const e = new T.Mesh(new T.BoxGeometry(a[0],a[1],a[2]), mObs[1]);
    e.position.set(a[3], a[4], a[3] ? 0 : (a[4]>2 ? -2 : 0));
    sf.add(e);
  });
  const tr = new T.Mesh(new T.TorusGeometry(4.6,2.3,10,20), M(0xc98a52)); dn.add(tr);
  const ic = new T.Mesh(new T.TorusGeometry(4.6,2.35,10,20,6.28), mObs[2]);
  ic.scale.z = .55; ic.position.z = .9; dn.add(ic);
  g.add(pz, sf, dn);
  g.userData = { k:0, kids:[pz,sf,dn] };
  g.visible = false;
  S.add(g); ob.push(g);
}

export const rg = [];
for (let i=0;i<6;i++){
  const m = new T.Mesh(new T.TorusGeometry(8,.7,8,32), new T.MeshBasicMaterial({color:0xff7ac8}));
  m.visible = false;
  S.add(m); rg.push(m);
}

const pool = a => a.find(o => !o.visible);
function put(a,x,y,z){
  const o = pool(a);
  if (!o) return null;
  o.visible = true;
  o.position.set(x,y,z);
  o.userData.age = 0; o.userData.gold = false; o.userData.done = false;
  return o;
}

export function slice(x,y,z,gold){
  const s = put(sl, x, y, z);
  if (!s) return;
  s.userData.gold = !!gold;
  const c = s.userData.c;
  if (c){
    c.color.setHex(gold ? 0xffee55 : 0xffc83d);
    c.emissive.setHex(gold ? 0xaa7700 : 0x442200);
  } else {
    s.traverse(o => { if (o.isMesh) o.material.emissive.setHex(gold ? 0x996600 : 0x000000); });
  }
}

function obst(x,y,z,k){
  const o = put(ob, x, y, z);
  if (o){ o.userData.k = k; o.userData.kids.forEach((c,i) => c.visible = (i===k)); }
}

export function pattern(z){
  const cx = G.P.x + (rnd()-.5)*60;
  const cy = Math.max(20, G.P.y + (rnd()-.4)*40);
  const r  = rnd();
  const diff = Math.min(.35, dist()/6000);

  if (r < .36){
    const d = rnd() < .5 ? 1 : -1;
    for (let i=0;i<9;i++) slice(cx + Math.sin(i*.7)*22*d, cy + Math.cos(i*.7)*8, z-i*14, i===4 && rnd()<.3);
  } else if (r < .58){
    const m = put(rg, cx, cy, z);
    if (m) m.userData.done = false;
    slice(cx, cy, z+30); slice(cx, cy, z+15); slice(cx, cy, z-18);
  } else if (r < .58 + .27 + diff){
    const g = (rnd()*3|0)-1;
    for (let i=-1;i<=1;i++) if (i!==g) obst(cx+i*26, cy, z, rnd()*3|0);
    for (let j=-1;j<=1;j++) slice(cx+g*26, cy, z+j*20);
  } else {
    obst(cx, cy, z, 2);
    for (let i=0;i<8;i++){
      const a = i*.785;
      slice(cx + Math.cos(a)*17, cy + Math.sin(a)*13, z, i===0 && rnd()<.4);
    }
  }
}

export function rebuildSlices(){
  sl.forEach(o => {
    o.remove(...o.children);
    const n = mkSlice();
    o.add(...n.children);
    o.userData.c = null;
  });
}
