import { T, M } from '../utils.js';
import { S } from '../scene.js';

function mkDave(){
  const g = new T.Group();
  const sk = M(0xe0a883), gw = M(0x8a1f45), sl = M(0x4f6b8f);
  const body = new T.Group(); g.add(body);
  const add = (geo,m,x,y,z,p) => { const o = new T.Mesh(geo,m); o.position.set(x,y,z); (p||body).add(o); return o; };

  add(new T.CylinderGeometry(.5,.85,1.9,12), gw, 0,.75,0);
  add(new T.CylinderGeometry(.62,.62,.12,12), M(0xe9d7a5), 0,.95,0);
  add(new T.SphereGeometry(.38,12,10), sk, 0, 2.05, 0);
  add(new T.SphereGeometry(.4,12,10), M(0x3a2a1c), 0, 2.12, .08).scale.set(1,.9,1);
  add(new T.SphereGeometry(.2,8,8), M(0x3a2a1c), 0, 1.9, -.27);

  const arms = [-1,1].map(s => {
    const p = new T.Group(); p.position.set(s*.62, 1.65, 0); body.add(p);
    add(new T.CylinderGeometry(.19,.15,1.1,8), gw, 0,-.5,0, p);
    add(new T.SphereGeometry(.15,8,8), sk, 0,-1.1,0, p);
    return p;
  });
  const legs = [-1,1].map(s => {
    const p = new T.Group(); p.position.set(s*.25, -.15, 0); body.add(p);
    add(new T.CylinderGeometry(.16,.13,1,8), sk, 0,-.5,0, p);
    add(new T.BoxGeometry(.3,.16,.55), sl, 0,-1.05,-.1, p);
    return p;
  });
  const tail = new T.Group(); tail.position.set(0,1.6,.4); body.add(tail);
  add(new T.BoxGeometry(1.1,1.5,.05), gw, 0,-.7,.1, tail);

  g.scale.setScalar(1.2);
  g.userData = { body, arms, legs, tail };
  return g;
}

export const dave = mkDave();
S.add(dave);

const D = { lean:1, roll:0, spread:.3 };

export function animD(dt, lean, roll, spread, sp, t){
  const k = 1 - Math.exp(-7*dt);
  const u = dave.userData;
  D.lean   += (lean  - D.lean)   * k;
  D.roll   += (roll  - D.roll)   * k;
  D.spread += (spread- D.spread) * k;
  u.body.rotation.x = D.lean;
  dave.rotation.z = D.roll;
  u.arms[0].rotation.z = -D.spread - Math.sin(t*3)*.08*(1+sp);
  u.arms[1].rotation.z =  D.spread + Math.sin(t*3+1)*.08*(1+sp);
  u.arms[0].rotation.x = u.arms[1].rotation.x = -.25*sp;
  u.legs[0].rotation.x = Math.sin(t*2.4)*.2 + .25*sp;
  u.legs[1].rotation.x = Math.sin(t*2.4+2)*.2 + .25*sp;
  u.tail.rotation.x = .3 + sp*.9 + Math.sin(t*9)*.08*sp;
}
