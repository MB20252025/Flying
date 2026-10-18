export const G = {
  mode: 'title',
  tt: 0, alt: 0,
  SZ: 51.9, nextZ: 0,
  shake: 0,
  stageI: -1,
  gt_: 0,
  hc: [1e9, 1e9],
  P: { x:50, y:75, z:51.9, vx:0, vy:0, fs:0, boost:0, meter:1, hit:0, wasB:false, yaw:0 },
  Q: { slices:0, rings:0, bumps:0, clean:0, bonus:0, golds:0 },
  mi: 0, mbase: 0,
  totalDist: 0,
  spawnAccum: 0,
  spawnGap: 60
};

export const dist  = () => G.totalDist;
export const score = () => Math.floor(G.totalDist*.1) + G.Q.slices*10 + G.Q.golds*40 + G.Q.rings*50 + G.Q.bonus;
