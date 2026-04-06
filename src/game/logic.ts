import type { GameState, DifficultyKey, Enemy, SpawnItem, TowerID } from './types';
import { DIFF, TDEFS, UPS, EDEFS, WAVES, PATH, CELL, PS, st } from './constants';
import { getSynergyEffects } from './synergy';

let _eid = 1;
export const uid = (): number => _eid++;
export const resetUid = () => { _eid = 1; };

export const pxy = (pi: number, pr: number) => {
  const i = Math.min(pi, PATH.length - 2);
  const [c1, r1] = PATH[i];
  const [c2, r2] = PATH[Math.min(i + 1, PATH.length - 1)];
  return { x: (c1 + (c2 - c1) * pr) * CELL + CELL / 2, y: (r1 + (r2 - r1) * pr) * CELL + CELL / 2 };
};

export const getEnabled = (grid: GameState['grid']): Set<string> => {
  const en = new Set<string>();
  for (const [k, c] of Object.entries(grid)) {
    if (!TDEFS[c.tid].req) en.add(k);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [k, c] of Object.entries(grid)) {
      if (en.has(k)) continue;
      const req = TDEFS[c.tid].req;
      if (req && Object.entries(grid).some(([k2, c2]) => c2.tid === req && en.has(k2))) {
        en.add(k); changed = true;
      }
    }
  }
  return en;
};

export const findNearest = (key: string, grid: GameState['grid']): string | null => {
  const [c1, r1] = key.split(',').map(Number);
  const req = TDEFS[grid[key].tid].req;
  if (!req) return null;
  let best: string | null = null, bd = Infinity;
  for (const [k, c] of Object.entries(grid)) {
    if (c.tid !== req) continue;
    const [c2, r2] = k.split(',').map(Number);
    const d = Math.hypot(c2 - c1, r2 - r1);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
};

export const canPlace = (tid: TowerID, grid: GameState['grid']): boolean => {
  const req = TDEFS[tid].req;
  if (!req) return true;
  const en = getEnabled(grid);
  return Object.entries(grid).some(([k, c]) => c.tid === req && en.has(k));
};

export const mkState = (diff: DifficultyKey, team: TowerID[]): GameState => {
  const d = DIFF[diff];
  return {
    grid: {}, timers: {}, enemies: [], projs: [], effs: [], particles: [],
    power: d.sp, wave: 0, baseHP: d.shp, maxHP: d.shp,
    waveActive: false, spawnQ: [], waveT: 0, powerT: 0,
    over: false, win: false, diff, screenShake: 0,
    team: [...team],
  };
};

export const buildQ = (wi: number, diff: DifficultyKey): SpawnItem[] => {
  const d = DIFF[diff];
  const q: SpawnItem[] = [];
  WAVES[wi].forEach(g => {
    for (let i = 0; i < g.n; i++) q.push({ type: g.t, at: i * g.gap * d.wg });
  });
  return q.sort((a, b) => a.at - b.at);
};

export const calcPowerBalance = (grid: GameState['grid']) => {
  const en = getEnabled(grid);
  const gen = Object.entries(grid).reduce((a, [k, c]) => en.has(k) ? a + (st(c.tid, c.lv).pg || 0) : a, 0) + 2;
  const drain = Object.entries(grid).reduce((a, [k, c]) => en.has(k) ? a + (st(c.tid, c.lv).pc || 0) : a, 0);
  return { gen, drain, net: gen - drain };
};

export const tickGame = (s: GameState, dt: number): void => {
  const dc = DIFF[s.diff];
  const en = getEnabled(s.grid);

  if (s.screenShake > 0) s.screenShake = Math.max(0, s.screenShake - dt);

  if (s.waveActive) {
    s.powerT += dt;
    if (s.powerT >= 1) {
      s.powerT -= 1;
      const { gen, drain } = calcPowerBalance(s.grid);
      s.power = Math.min(Math.max(s.power + gen - drain, 0), 999);
    }
    s.waveT += dt;
    while (s.spawnQ.length && s.waveT >= s.spawnQ[0].at) {
      const it = s.spawnQ.shift()!;
      const d = EDEFS[it.type];
      s.enemies.push({
        id: uid(), type: it.type, em: d.em,
        hp: Math.ceil(d.hp * dc.hpM), mhp: Math.ceil(d.hp * dc.hpM),
        spd: d.spd * dc.spdM, rew: d.rew, dmg: d.dmg,
        pi: 0, pr: 0, frozen: 0, burning: 0, burnT: 0, hitFlash: 0,
      });
    }
  }

  const lowPower = s.power <= 0 && s.waveActive;
  const towerSpeedMult = lowPower ? 0.4 : 1;

  const dead = new Set<number>();
  for (const e of s.enemies) {
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.frozen > 0) { e.frozen -= dt; continue; }
    let rem = e.spd * dt;
    while (rem > 0 && e.pi < PATH.length - 1) {
      const [c1, r1] = PATH[e.pi];
      const [c2, r2] = PATH[e.pi + 1];
      const seg = Math.hypot(c2 - c1, r2 - r1) * CELL;
      const left = (1 - e.pr) * seg;
      if (rem >= left) { rem -= left; e.pi++; e.pr = 0; }
      else { e.pr += rem / seg; rem = 0; }
    }
    if (e.pi >= PATH.length - 1) {
      dead.add(e.id);
      s.baseHP = Math.max(0, s.baseHP - e.dmg);
      s.screenShake = 0.3;
      const { x, y } = pxy(e.pi, e.pr);
      s.effs.push({ id: uid(), x, y, txt: `-${e.dmg}HP`, life: 1.5, ml: 1.5, col: '#f44336' });
      if (s.baseHP <= 0) s.over = true;
    }
    if (e.burning > 0) {
      e.burning -= dt; e.burnT -= dt;
      if (e.burnT <= 0) { e.hp -= 5; e.burnT = 0.5; if (e.hp <= 0) dead.add(e.id); }
    }
  }

  for (const [key, cell] of Object.entries(s.grid)) {
    if (!en.has(key)) continue;
    const S = st(cell.tid, cell.lv);
    if (!S.spd || !S.dmg) continue;

    // Apply synergy effects
    const synFx = getSynergyEffects(s.team, cell.tid);
    const synDmg = Math.ceil(S.dmg * synFx.dmgMult);
    const synSpd = S.spd * synFx.spdMult;

    s.timers[key] = (s.timers[key] || 0) - dt * towerSpeedMult;
    if (s.timers[key] > 0) continue;
    const [c, r] = key.split(',').map(Number);
    const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2, range = S.rng * CELL;
    let rm = 1;
    for (const [k2, c2] of Object.entries(s.grid)) {
      if (c2.tid !== 'router' && c2.tid !== 'theater') continue;
      if (!en.has(k2)) continue;
      const [rc, rr] = k2.split(',').map(Number);
      const rs = st(c2.tid, c2.lv);
      if (Math.hypot(rc - c, rr - r) <= rs.rng) rm *= (rs.bf || 1.2);
    }
    let tgt: Enemy | null = null, best = -1;
    for (const e of s.enemies) {
      if (dead.has(e.id)) continue;
      const { x, y } = pxy(e.pi, e.pr);
      if (Math.hypot(x - cx, y - cy) > range) continue;
      const sc = e.pi + e.pr;
      if (sc > best) { best = sc; tgt = e; }
    }
    if (tgt) {
      s.timers[key] = 1 / (synSpd * rm);
      tgt.hp -= synDmg;
      tgt.hitFlash = 0.1;
      const { x: ex, y: ey } = pxy(tgt.pi, tgt.pr);
      const projCol: Record<string, string> = {
        fridge:'#80deea', aircon:'#4fc3f7', kettle:'#ff7043', microwave:'#ff5722',
        fan:'#b3e5fc', vacuum:'#ce93d8', washer:'#26c6da', lamp:'#fff176',
        superpc:'#00e5ff', plasma:'#ffd700', theater:'#e91e63',
      };
      s.projs.push({ id: uid(), sx: cx, sy: cy, ex, ey, life: 0.18, col: projCol[cell.tid] || '#fff' });
      if (cell.tid === 'kettle' || cell.tid === 'microwave') { tgt.burning = 3; tgt.burnT = 0.5; }
      if (cell.tid === 'fridge' || cell.tid === 'aircon') tgt.frozen = 1.5;
      if (cell.tid === 'fan' || cell.tid === 'vacuum' || cell.tid === 'washer') {
        const bk = cell.tid === 'fan' ? 0.45 : 0.22;
        tgt.pr -= bk;
        while (tgt.pr < 0 && tgt.pi > 0) { tgt.pi--; tgt.pr += 1; }
        if (tgt.pr < 0) tgt.pr = 0;
      }
      if (tgt.hp <= 0) {
        dead.add(tgt.id);
        s.power = Math.min(s.power + tgt.rew, 999);
        const { x, y } = pxy(tgt.pi, tgt.pr);
        s.effs.push({ id: uid(), x, y, txt: `+${tgt.rew}W`, life: 1.0, ml: 1.0, col: '#ffd700' });
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
          const speed = 40 + Math.random() * 60;
          s.particles.push({
            id: uid(), x, y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 0.5 + Math.random() * 0.3, ml: 0.8,
            col: EDEFS[tgt.type].col, size: 3 + Math.random() * 3,
          });
        }
      }
    }
  }

  s.enemies = s.enemies.filter(e => !dead.has(e.id));
  s.projs.forEach(p => p.life -= dt);
  s.projs = s.projs.filter(p => p.life > 0);
  s.effs.forEach(e => e.life -= dt);
  s.effs = s.effs.filter(e => e.life > 0);
  s.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; p.life -= dt; });
  s.particles = s.particles.filter(p => p.life > 0);

  if (s.waveActive && s.spawnQ.length === 0 && s.enemies.length === 0) {
    s.waveActive = false;
    if (s.wave >= WAVES.length) s.win = true;
  }
};
