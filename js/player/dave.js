import { T, M } from '../utils.js';
import { S } from '../scene.js';

function mkDave(){
  const g = new T.Group();
  
  const skin = M(0xe0b48c);
  const shirt = M(0x4a6a8a);
  const trousers = M(0x2a2a35);
  const shoes = M(0x1a1a1a);
  const hair = M(0x2a1a10);
  const belt = M(0x111111);
  
  const body = new T.Group(); g.add(body);
  const add = (geo, mat, x, y, z, parent) => {
    const o = new T.Mesh(geo, mat);
    o.position.set(x, y, z);
    (parent || body).add(o);
    return o;
  };
  
  add(new T.CylinderGeometry(.42, .35, 1.3, 14), shirt, 0, 1.75, 0);
  add(new T.SphereGeometry(.30, 12, 10), shirt, -.50, 2.28, 0);
  add(new T.SphereGeometry(.30, 12, 10), shirt,  .50, 2.28, 0);
  add(new T.SphereGeometry(.52, 14, 10), shirt, 0, 2.15, 0).scale.set(1, .5, .9);
  
  add(new T.CylinderGeometry(.36, .36, .12, 14), belt, 0, 1.10, 0);
  add(new T.BoxGeometry(.12, .10, .04), M(0xd4b04a), 0, 1.10, .36);
  
  add(new T.SphereGeometry(.42, 14, 10), trousers, 0, .95, 0).scale.set(1.05, .7, .9);
  
  add(new T.CylinderGeometry(.14, .17, .24, 10), skin, 0, 2.45, 0);
  
  add(new T.SphereGeometry(.31, 14, 12), skin, 0, 2.75, 0);
  add(new T.SphereGeometry(.33, 14, 12), hair, 0, 2.85, .02).scale.set(1, .82, 1);
  add(new T.SphereGeometry(.08, 8, 8), skin, 0, 2.68, -.27);
  add(new T.SphereGeometry(.055, 8, 8), M(0xffffff), -.10, 2.80, -.26);
  add(new T.SphereGeometry(.055, 8, 8), M(0xffffff),  .10, 2.80, -.26);
  add(new T.SphereGeometry(.028, 6, 6), M(0x000000), -.10, 2.80, -.31);
  add(new T.SphereGeometry(.028, 6, 6), M(0x000000),  .10, 2.80, -.31);
  add(new T.BoxGeometry(.26, .05, .08), hair, 0, 2.62, -.27);
  add(new T.SphereGeometry(.08, 8, 8), skin, -.31, 2.73, 0);
  add(new T.SphereGeometry(.08, 8, 8), skin,  .31, 2.73, 0);
  
  const armElbows = [];
  const arms = [-1, 1].map(s => {
    const shoulder = new T.Group();
    shoulder.position.set(s * .50, 2.22, 0);
    body.add(shoulder);
    add(new T.CylinderGeometry(.15, .13, .65, 10), shirt, 0, -.38, 0, shoulder);
    
    const elbow = new T.Group();
    elbow.position.set(0, -.75, 0);
    shoulder.add(elbow);
    add(new T.SphereGeometry(.13, 10, 8), skin, 0, 0, 0, elbow);
    add(new T.CylinderGeometry(.12, .10, .58, 10), skin, 0, -.33, 0, elbow);
    add(new T.SphereGeometry(.13, 10, 8), skin, 0, -.70, 0, elbow).scale.set(1, .9, .7);
    
    armElbows.push(elbow);
    return shoulder;
  });
  
  const legKnees = [];
  const legs = [-1, 1].map(s => {
    const hip = new T.Group();
    hip.position.set(s * .20, .95, 0);
    body.add(hip);
    add(new T.CylinderGeometry(.17, .15, .70, 10), trousers, 0, -.40, 0, hip);
    
    const knee = new T.Group();
    knee.position.set(0, -.80, 0);
    hip.add(knee);
    add(new T.SphereGeometry(.14, 10, 8), trousers, 0, 0, 0, knee);
    add(new T.CylinderGeometry(.14, .12, .65, 10), trousers, 0, -.38, 0, knee);
    
    add(new T.BoxGeometry(.22, .16, .42), shoes, 0, -.72, -.08, knee);
    add(new T.BoxGeometry(.24, .04, .44), M(0x333333), 0, -.82, -.08, knee);
    add(new T.SphereGeometry(.12, 8, 6), shoes, 0, -.72, -.24, knee).scale.set(1, .9, 1.4);
    
    legKnees.push(knee);
    return hip;
  });
  
  const tail = new T.Group();
  tail.position.set(0, 2.22, .32);
  body.add(tail);
  add(new T.BoxGeometry(.75, 1.3, .04), M(0x8a1f45), 0, -.55, .1, tail);
  
  g.scale.setScalar(1.05);
  
  g.userData = {
    body, arms, legs, tail,
    elbows: armElbows,
    knees: legKnees
  };
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
  u.elbows[0].rotation.x = .20 + Math.abs(Math.sin(t*3))*.15;
  u.elbows[1].rotation.x = .20 + Math.abs(Math.sin(t*3+1))*.15;
  
  u.legs[0].rotation.x = Math.sin(t*2.4)*.2 + .25*sp;
  u.legs[1].rotation.x = Math.sin(t*2.4+2)*.2 + .25*sp;
  u.knees[0].rotation.x = .20 + Math.max(0, Math.sin(t*2.4))*.30;
  u.knees[1].rotation.x = .20 + Math.max(0, Math.sin(t*2.4+2))*.30;
  
  u.tail.rotation.x = .3 + sp*.9 + Math.sin(t*9)*.08*sp;
}
