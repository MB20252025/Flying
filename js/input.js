import { $ } from './utils.js';
import { G } from './game.js';

export const K = {};
export const INPUT = { boostBtn: false };
export const stick = { id:null, ox:0, oy:0, x:0, y:0 };

let pauseCb = null;
export function initInput(pauseFn){
  pauseCb = pauseFn;
  addEventListener('keydown', e => {
    K[e.code] = 1;
    if (e.code==='KeyP'||e.code==='Escape') pauseCb();
    if (e.code.startsWith('Arrow')||e.code==='Space') e.preventDefault();
  });
  addEventListener('keyup', e => K[e.code] = 0);

  const cv = $('c'), js = $('js'), jk = $('jk');
  cv.addEventListener('pointerdown', e => {
    if (stick.id !== null || G.mode !== 'play') return;
    stick.id = e.pointerId;
    stick.ox = e.clientX; stick.oy = e.clientY;
    stick.x = stick.y = 0;
    js.style.display = 'block';
    js.style.left = e.clientX+'px';
    js.style.top  = e.clientY+'px';
    jk.style.transform = 'none';
  });
  addEventListener('pointermove', e => {
    if (e.pointerId !== stick.id) return;
    const dx = e.clientX - stick.ox, dy = e.clientY - stick.oy;
    stick.x = Math.max(-1, Math.min(1, dx/65));
    stick.y = Math.max(-1, Math.min(1, -dy/65));
    jk.style.transform = `translate(${stick.x*35}px,${-stick.y*35}px)`;
  });
  const pend = e => {
    if (e.pointerId === stick.id){
      stick.id = null; stick.x = stick.y = 0;
      js.style.display = 'none';
    }
  };
  addEventListener('pointerup', pend);
  addEventListener('pointercancel', pend);

  const bo = $('bo');
  bo.addEventListener('pointerdown', e => { INPUT.boostBtn = true; bo.setPointerCapture(e.pointerId); });
  ['pointerup','pointercancel','pointerleave'].forEach(n => bo.addEventListener(n, () => INPUT.boostBtn = false));

  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode==='play') pauseCb(); });
}
