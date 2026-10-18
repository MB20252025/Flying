export const CFG = {
  snd: localStorage.getItem('ut_snd') !== '0',
  inv: localStorage.getItem('ut_inv') === '1',
  low: localStorage.getItem('ut_low') === '1'
};

export let best = +localStorage.getItem('ut_best') || 0;

export function setBest(v){
  if (v > best){
    best = v;
    try { localStorage.setItem('ut_best', v); } catch(e){}
  }
}

export function saveCfg(){
  try {
    localStorage.setItem('ut_snd', CFG.snd ? 1 : 0);
    localStorage.setItem('ut_inv', CFG.inv ? 1 : 0);
    localStorage.setItem('ut_low', CFG.low ? 1 : 0);
  } catch(e){}
}
