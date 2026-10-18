import { $ } from './utils.js';
import { G, score, dist } from './game.js';
import { best, setBest } from './config.js';
import { sfx } from './audio.js';

let bt = 0, st_ = 0;

export function banner(t){
  const e = $('rg');
  e.textContent = t; e.style.opacity = 1;
  clearTimeout(bt);
  bt = setTimeout(()=>e.style.opacity = 0, 3200);
}

export function say(t, s){
  const e = $('sub');
  e.textContent = t; e.style.opacity = 1;
  clearTimeout(st_);
  st_ = setTimeout(()=>e.style.opacity = 0, (s||3)*1000);
}

export const MS = [
  ['Collect 15 pizza slices', () => G.Q.slices, 15],
  ['Fly through 3 rings',     () => G.Q.rings,  3],
  ['Fly 500m without a bump', () => G.Q.clean, 500, 1],
  ['Collect 40 pizza slices', () => G.Q.slices, 40],
  ['Fly through 8 rings',     () => G.Q.rings,  8],
  ['Fly 1500m without a bump',() => G.Q.clean, 1500, 1],
  ['Collect 100 pizza slices',() => G.Q.slices, 100],
  ['Reach 1000 altitude',     () => G.P.y,     1000, 1],
  ['Reach SPACE (2700 altitude)', () => G.P.y, 2700, 1]
];

export function checkMission(){
  if (G.mi >= MS.length) return;
  const m = MS[G.mi];
  const v = m[3] ? m[1]() : m[1]() - G.mbase;
  if (v >= m[2]){
    G.Q.bonus += 200;
    banner('MISSION COMPLETE  +200');
    sfx.stage();
    G.mi++;
    G.mbase = (G.mi < MS.length && !MS[G.mi][3]) ? MS[G.mi][1]() : 0;
  }
}

export function tickHud(dt){
  G.gt_ += dt;
  if (G.gt_ <= 0.2) return;
  G.gt_ = 0;
  const sc = score();
  $('sc').innerHTML = sc + '<small>🍕 ' + G.Q.slices + '  ◯ ' + G.Q.rings + '  💥 ' + G.Q.bumps + '</small>';
  $('di').innerHTML = Math.floor(dist()) + ' m<br><small style="font-size:13px">ALT ' + Math.floor(G.P.y) + '</small>';
  $('bf').style.width = (G.P.meter*100) + '%';
  if (G.mi < MS.length){
    const m = MS[G.mi];
    const v = m[3] ? m[1]() : m[1]() - G.mbase;
    $('ms').textContent = 'MISSION: ' + m[0] + ' (' + Math.min(m[2], Math.floor(v)) + '/' + m[2] + ')';
  } else {
    $('ms').textContent = 'All missions done. Legend.';
  }
  setBest(sc);
}
