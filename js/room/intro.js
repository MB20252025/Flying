import { sm, lp, T } from '../utils.js';
import { S, cam } from '../scene.js';
import { G } from '../game.js';
import { dave, animD } from '../player/dave.js';
import { room, fl, flb, ceil, roof, rm, lamp, tickTV, clkM, clkH, dust } from '../room/livingroom.js';
import { debris, setCrashed, getCrashed } from '../effects.js';
import { burst, tone, sfx, initAudio, resumeAudio } from '../audio.js';
import { say } from '../ui.js';

const KY = [[0,1.45],[3.2,1.45],[5.5,2.8],[7.5,8],[10,35],[13,75]];
const LINES = [
  [.5,'TV: "...and the universe is still expanding, you know."'],
  [2.4,'Dave: "Mad, that."'],
  [4,'Dave: "...why is my pizza floating?"'],
  [6.4,'Dave: "Oh, come ON."'],
  [10,'Dave: "Nobody\'s going to believe this."']
];

let li = 0;
let introT = 0, introY = 1.45;

export function startIntro(){
  initAudio(); resumeAudio();
  setCrashed(false);
  li = 0; introT = 0; introY = 1.45;
  ceil.visible = roof.visible = true;
  Object.assign(G.P, { x:50, y:75, z:51.9 });
  G.mode = 'intro';
  room.visible = true;
  document.getElementById('title').classList.add('h');
  document.getElementById('sk').classList.remove('h');
  ['sc','di','ms','bb'].forEach(id => document.getElementById(id).classList.add('h'));
  sfx.up();
}

export function skipIntro(){ introT = 13; introY = 75; }

export function introStep(dt){
  introT += dt;
  const t = introT;

  tickTV(dt, room.visible);
  clkM.rotation.z = -t*.15;
  clkH.rotation.z = -t*.0125;
  dust.rotation.y += dt*.04;

  let ty = 75;
  for (let i=1;i<KY.length;i++){
    if (t <= KY[i][0]){
      const a = KY[i-1], b = KY[i];
      ty = lp(a[1], b[1], (t-a[0])/(b[0]-a[0]));
      break;
    }
  }
  introY += (ty - introY) * (1 - Math.exp(-6*dt));
  dave.position.set(50, introY, 51.9);
  dave.visible = true;

  const fly  = sm(3.2, 5.5, t);
  const lean = lp(1, -.15, fly) + (-.55*sm(6,10,t));
  animD(dt, t<3 ? 1.05 : lean, Math.sin(t*5)*.15*fly, .3+.5*Math.abs(Math.sin(t*4))*fly, .3*sm(7,11,t), t);

  const rise = sm(2.2, 7, t);
  fl.forEach((o,i) => {
    o.position.y = flb[i].y + rise*(2.6 + i*.4);
    o.position.x = flb[i].x + Math.sin(t+i)*.4*rise;
    o.rotation.y = t*(.6 + i*.3)*rise;
    o.rotation.x = rise*Math.sin(t+i)*.8;
  });

  ceil.visible = roof.visible = t < 6.3;
  if (t >= 6.3 && !getCrashed() && G.mode === 'intro' && t < 9){
    setCrashed(true);
    debris();
    G.shake = 1.6;
    burst(.9, 1800, .8);
    tone(90, .6, 'sawtooth', .2, 40);
  }

  const wf_ = 1 - sm(7, 8.6, t);
  rm.forEach(m => {
    m.transparent = true;
    if (m !== ceil.material) m.opacity = wf_;
  });
  document.querySelectorAll('#c').forEach(()=>{});
  lamp.intensity = 1.3*wf_;
  room.visible = wf_ > .01;

  const s = sm(5.2, 9, t);
  cam.position.set(lp(50,50,s), lp(3.4, dave.position.y+3.2, s), lp(57, dave.position.z+11, s));
  cam.lookAt(50, lp(1.6, dave.position.y+.5, s), lp(46, dave.position.z-25, s));
  if (G.shake > 0){
    cam.position.x += (Math.random()-.5)*G.shake*.5;
    cam.position.y += (Math.random()-.5)*G.shake*.5;
    G.shake = Math.max(0, G.shake - dt*1.5);
  }

  if (G.mode === 'intro' && li < LINES.length && t >= LINES[li][0]){
    say(LINES[li][1], 2.6);
    li++;
  }
  G.alt = Math.max(0, introY - 50);

  if (introT >= 13) return true;
  return false;
}
