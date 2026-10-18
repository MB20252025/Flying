import { CFG } from './config.js';

let AC=null, mg=null, wg=null, wf=null, nb=null;
const pads = [];

export function initAudio(){
  if (AC) return;
  try {
    AC = new (window.AudioContext||window.webkitAudioContext)();
    mg = AC.createGain();
    mg.gain.value = CFG.snd ? 1 : 0;
    mg.connect(AC.destination);

    nb = AC.createBuffer(1, AC.sampleRate*2, AC.sampleRate);
    const d = nb.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;

    const s = AC.createBufferSource();
    s.buffer = nb; s.loop = true;
    wf = AC.createBiquadFilter(); wf.type='bandpass'; wf.frequency.value=500;
    wg = AC.createGain(); wg.gain.value=0;
    s.connect(wf); wf.connect(wg); wg.connect(mg); s.start();

    const lf = AC.createBiquadFilter(); lf.type='lowpass'; lf.frequency.value=600;
    const pg = AC.createGain(); pg.gain.value=.05;
    lf.connect(pg); pg.connect(mg);
    [110,164.8,220,277.2].forEach((f,i)=>{
      const o = AC.createOscillator();
      o.type = i%2 ? 'triangle' : 'sine';
      o.frequency.value = f; o.detune.value = i*5;
      o.connect(lf); o.start();
      pads.push([o,f]);
    });
  } catch(e){ AC = null; }
}

export function setGain(v){ if (mg) mg.gain.value = v ? 1 : 0; }
export function resumeAudio(){ if (AC && AC.state==='suspended') AC.resume(); }

export function tone(f,d,ty,v,f2){
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
  o.type = ty || 'sine';
  o.frequency.setValueAtTime(f,t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t+d);
  g.gain.setValueAtTime(v||.15, t);
  g.gain.exponentialRampToValueAtTime(.001, t+d);
  o.connect(g); g.connect(mg);
  o.start(t); o.stop(t+d);
}

export function burst(d,f,v){
  if (!AC) return;
  const s = AC.createBufferSource(), fi = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime;
  s.buffer = nb;
  fi.type='lowpass'; fi.frequency.setValueAtTime(f,t); fi.frequency.exponentialRampToValueAtTime(80,t+d);
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.001,t+d);
  s.connect(fi); fi.connect(g); g.connect(mg);
  s.start(t); s.stop(t+d);
}

let chN = 0;
export const sfx = {
  chime(g){
    tone(g ? 880 : 520 + (chN++%5)*90, .25, 'triangle', .14);
    if (g) tone(1320,.3,'sine',.1);
  },
  hit(){ burst(.4,1200,.5); tone(120,.3,'sawtooth',.12,50); },
  boost(){ burst(.8,3000,.25); tone(200,.6,'sawtooth',.06,600); },
  ring(){ [0,4,7,12].forEach((n,i)=>setTimeout(()=>tone(440*Math.pow(2,n/12),.3,'triangle',.12),i*70)); },
  stage(){ [0,7,12,19].forEach((n,i)=>setTimeout(()=>tone(330*Math.pow(2,n/12),.7,'sine',.12),i*120)); },
  up(){ tone(300,.5,'sine',.1,900); }
};

export function tickAudio(sp, boost, stage){
  if (!AC) return;
  wg.gain.setTargetAtTime(.04 + .14*sp + .05*boost, AC.currentTime, .1);
  wf.frequency.setTargetAtTime(350 + 900*sp, AC.currentTime, .1);
  pads.forEach(p => p[0].frequency.setTargetAtTime(p[1]*(1+stage*.1), AC.currentTime, 2));
}
