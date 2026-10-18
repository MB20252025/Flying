import { T, rnd } from '../utils.js';
import { S } from '../scene.js';

const gc = document.createElement('canvas');
gc.width = gc.height = 512;
{
  const x = gc.getContext('2d');
  x.fillStyle = '#1b3823'; x.fillRect(0,0,512,512);
  for (let i=0;i<2500;i++){
    x.fillStyle = `rgba(${20+rnd()*35|0},${55+rnd()*45|0},${30+rnd()*25|0},.45)`;
    x.fillRect(rnd()*512, rnd()*512, 3, 3);
  }
  const E = [0,256,512];
  for (const e of E){ x.fillStyle='#585b66'; x.fillRect(e-18,0,36,512); x.fillRect(0,e-18,512,36); }
  for (const e of E){ x.fillStyle='#22242c'; x.fillRect(e-10,0,20,512); x.fillRect(0,e-10,512,20); }
  x.fillStyle='#e8e8e8';
  for (const e of E) for (let i=0;i<512;i+=20){ x.fillRect(e-1,i,2,10); x.fillRect(i,e-1,10,2); }
  for (const jx of E) for (const jy of E){
    if ((jx===256)===(jy===256)){
      x.fillStyle='#22242c'; x.beginPath(); x.arc(jx,jy,34,0,7); x.fill();
      x.fillStyle='#9a9aa4'; x.beginPath(); x.arc(jx,jy,7,0,7); x.fill();
      x.fillStyle='#2e6b34'; x.beginPath(); x.arc(jx,jy,5,0,7); x.fill();
    } else {
      x.fillStyle='#22242c'; x.fillRect(jx-14,jy-14,28,28);
      x.fillStyle='#e8e8e8';
      for (const sg of [-1,1]) for (let k=-2;k<=2;k++){
        x.fillRect(jx+sg*28-4, jy+k*4-1, 8, 2);
        x.fillRect(jx+k*4-1, jy+sg*28-4, 2, 8);
      }
    }
  }
}

const gt = new T.CanvasTexture(gc);
gt.wrapS = gt.wrapT = T.RepeatWrapping;
gt.repeat.set(8,8);
gt.anisotropy = 4;

export const gm = new T.MeshBasicMaterial({map:gt});
export const ground = new T.Mesh(new T.PlaneGeometry(1600,1600), gm);
ground.rotation.x = -Math.PI/2;
ground.position.y = -.3;
S.add(ground);
