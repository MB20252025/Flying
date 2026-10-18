import { T, M } from './utils.js';

export const gP = new T.CylinderGeometry(1,1,.3,3);
export const gC = new T.BoxGeometry(1.8,.4,.3);
export const gR = new T.CylinderGeometry(.2,.2,.08,8);
export const mCr = M(0xc98a3a);
export const mPe = M(0xb3261e);

let pizzaModel = null;
export function setPizzaModel(w){ pizzaModel = w; }

export function mkSlice(){
  if (pizzaModel){
    const g = new T.Group();
    const m = pizzaModel.clone(true);
    m.traverse(o => {
      if (o.isMesh){
        o.material = o.material.clone();
        o.material.emissive = new T.Color(0x000000);
      }
    });
    g.add(m);
    g.userData.c = null;
    return g;
  }
  const g = new T.Group();
  const c = M(0xffc83d, {emissive:0x442200});
  g.add(new T.Mesh(gP, c));
  const cr = new T.Mesh(gC, mCr);
  cr.position.set(0,.02,-.5);
  g.add(cr);
  [[0,.1],[.3,-.2],[-.3,-.2]].forEach(p => {
    const o = new T.Mesh(gR, mPe);
    o.position.set(p[0], .2, p[1]);
    g.add(o);
  });
  g.userData.c = c;
  return g;
}
