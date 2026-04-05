import type { GameState, DifficultyKey, Enemy, SpawnItem, TowerID } from './types';
import { DIFF, TDEFS, UPS, EDEFS, WAVES, PATH, CELL, PS, st } from './constants';

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
  // Base gen + cord adjacency bonus
  let gen = 2;
  for (const [k, c] of Object.entries(grid)) {
    if (!en.has(k)) continue;
    gen += st(c.tid, c.lv).pg || 0;
    // Cord ability: adjacent towers get +1W gen
    if (c.tid === 'cord') {
      const [cc, cr] = k.split(',').map(Number);
      for (const [k2] of Object.entries(grid)) {
        if (k2 === k || !en.has(k2)) continue;
        const [c2, r2] = k2.split(',').map(Number);
        if (Math.abs(cc - c2) <= 1 && Math.abs(cr - r2) <= 1) gen += 1;
      }
    }
  }
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
        marked: false, slowed: false,
      });
    }
  }

  const lowPower = s.power <= 0 && s.waveActive;
  const towerSpeedMult = lowPower ? 0.4 : 1;

  // Passive abilities: aircon slow aura, fan slow aura
  for (const [key, cell] of Object.entries(s.grid)) {
    if (!en.has(key)) continue;
    const [c, r] = key.split(',').map(Number);
    const S = st(cell.tid, cell.lv);
    if (cell.tid === 'aircon' || cell.tid === 'fan') {
      const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
      const range = S.rng * CELL;
      const slowAmt = cell.tid === 'aircon' ? 0.7 : 0.85;
      for (const e of s.enemies) {
        const { x, y } = pxy(e.pi, e.pr);
        if (Math.hypot(x - cx, y - cy) <= range) {
          e.slowed = true;
        }
      }
    }
  }

  const dead = new Set<number>();
  for (const e of s.enemies) {
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.frozen > 0) { e.frozen -= dt; continue; }
    let spd = e.spd;
    if (e.slowed) spd *= 0.75;
    let rem = spd * dt;
    while (rem > 0 && e.pi < PATH.length - 1) {
      const [c1, r1] = PATH[e.pi];
      const [c2, r2] = PATH[e.pi + 1];
      const seg = Math.hypot(c2 - c1, r2 - r1) * CELL;
      const left = (1 - e.pr) * seg;
      if (rem >= left) { rem -= left; e.pi++; e.pr = 0; }
      else { e.pr += rem / seg; rem = 0; }
    }
    e.slowed = false; // reset each frame
    if (e.pi >= PATH.length - 1) {
      dead.add(e.id);
      s.baseHP = Math.max(0, s.baseHP - e.dmg);
      s.screenShake = 0.4;
      const { x, y } = pxy(e.pi, e.pr);
      s.effs.push({ id: uid(), x, y, txt: `-${e.dmg}HP`, life: 1.5, ml: 1.5, col: '#f44336' });
      if (s.baseHP <= 0) s.over = true;
    }
    if (e.burning > 0) {
      e.burning -= dt; e.burnT -= dt;
      if (e.burnT <= 0) { e.hp -= 5; e.burnT = 0.5; if (e.hp <= 0) dead.add(e.id); }
    }
  }

  // Washer tidal wave ability
  for (const [key, cell] of Object.entries(s.grid)) {
    if (cell.tid !== 'washer' || !en.has(key)) continue;
    if (!s.timers[`${key}_wave`]) s.timers[`${key}_wave`] = 5;
    s.timers[`${key}_wave`] -= dt;
    if (s.timers[`${key}_wave`] <= 0) {
      s.timers[`${key}_wave`] = 5;
      for (const e of s.enemies) {
        if (dead.has(e.id)) continue;
        e.pr -= 0.3;
        while (e.pr < 0 && e.pi > 0) { e.pi--; e.pr += 1; }
        if (e.pr < 0) e.pr = 0;
      }
      const [c, r] = key.split(',').map(Number);
      s.effs.push({ id: uid(), x: c * CELL + CELL / 2, y: r * CELL + CELL / 2, txt: '🌊 WAVE!', life: 1.0, ml: 1.0, col: '#26c6da' });
    }
  }

  // Vacuum black hole ability
  for (const [key, cell] of Object.entries(s.grid)) {
    if (cell.tid !== 'vacuum' || !en.has(key)) continue;
    if (!s.timers[`${key}_bh`]) s.timers[`${key}_bh`] = 3;
    s.timers[`${key}_bh`] -= dt;
    if (s.timers[`${key}_bh`] <= 0) {
      s.timers[`${key}_bh`] = 3;
      const [c, r] = key.split(',').map(Number);
      const S = st(cell.tid, cell.lv);
      const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
      const range = S.rng * CELL;
      for (const e of s.enemies) {
        if (dead.has(e.id)) continue;
        const { x, y } = pxy(e.pi, e.pr);
        if (Math.hypot(x - cx, y - cy) <= range) {
          e.pr -= 0.15;
          while (e.pr < 0 && e.pi > 0) { e.pi--; e.pr += 1; }
          if (e.pr < 0) e.pr = 0;
        }
      }
    }
  }

  for (const [key, cell] of Object.entries(s.grid)) {
    if (!en.has(key)) continue;
    const S = st(cell.tid, cell.lv);
    if (!S.spd || !S.dmg) continue;
    s.timers[key] = (s.timers[key] || 0) - dt * towerSpeedMult;
    if (s.timers[key] > 0) continue;
    const [c, r] = key.split(',').map(Number);
    const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
    let range = S.rng * CELL;

    // Router ability: range boost
    for (const [k2, c2] of Object.entries(s.grid)) {
      if (c2.tid !== 'router' || !en.has(k2)) continue;
      const [rc, rr] = k2.split(',').map(Number);
      const rs = st(c2.tid, c2.lv);
      if (Math.hypot(rc - c, rr - r) <= rs.rng) range += 0.3 * CELL;
    }

    let rm = 1;
    for (const [k2, c2] of Object.entries(s.grid)) {
      if (c2.tid !== 'router' && c2.tid !== 'theater') continue;
      if (!en.has(k2)) continue;
      const [rc, rr] = k2.split(',').map(Number);
      const rs = st(c2.tid, c2.lv);
      if (Math.hypot(rc - c, rr - r) <= rs.rng) rm *= (rs.bf || 1.2);
    }

    // SuperPC ability: target highest HP enemy
    let tgt: Enemy | null = null;
    if (cell.tid === 'superpc') {
      let bestHP = -1;
      for (const e of s.enemies) {
        if (dead.has(e.id)) continue;
        const { x, y } = pxy(e.pi, e.pr);
        if (Math.hypot(x - cx, y - cy) > range) continue;
        if (e.hp > bestHP) { bestHP = e.hp; tgt = e; }
      }
    } else {
      let best = -1;
      for (const e of s.enemies) {
        if (dead.has(e.id)) continue;
        const { x, y } = pxy(e.pi, e.pr);
        if (Math.hypot(x - cx, y - cy) > range) continue;
        const sc = e.pi + e.pr;
        if (sc > best) { best = sc; tgt = e; }
      }
    }

    if (tgt) {
      s.timers[key] = 1 / (S.spd * rm);
      let dmg = S.dmg;

      // Lamp ability: marked enemies take +20% damage
      if (cell.tid === 'lamp') tgt.marked = true;
      if (tgt.marked) dmg = Math.ceil(dmg * 1.2);

      // Fridge ability: frozen enemies take +50% damage
      if (cell.tid === 'fridge' && tgt.frozen > 0) dmg = Math.ceil(dmg * 1.5);

      // SuperPC crit
      if (cell.tid === 'superpc' && Math.random() < 0.2) {
        dmg = Math.ceil(dmg * 2);
        const { x, y } = pxy(tgt.pi, tgt.pr);
        s.effs.push({ id: uid(), x, y, txt: 'CRIT!', life: 0.8, ml: 0.8, col: '#00e5ff' });
      }

      // Plasma ability: hit all enemies in range
      if (cell.tid === 'plasma') {
        for (const e of s.enemies) {
          if (dead.has(e.id) || e.id === tgt.id) continue;
          const { x, y } = pxy(e.pi, e.pr);
          if (Math.hypot(x - cx, y - cy) <= range) {
            e.hp -= Math.ceil(dmg * 0.4);
            e.hitFlash = 0.1;
            if (e.hp <= 0 && e.hp / e.mhp < 0.1) {
              dead.add(e.id);
              s.power = Math.min(s.power + e.rew, 999);
              s.effs.push({ id: uid(), x, y, txt: `+${e.rew}W`, life: 1.0, ml: 1.0, col: '#ffd700' });
            }
          }
        }
      }

      tgt.hp -= dmg;
      tgt.hitFlash = 0.12;
      const { x: ex, y: ey } = pxy(tgt.pi, tgt.pr);
      const projCol: Record<string, string> = {
        fridge: '#80deea', aircon: '#4fc3f7', kettle: '#ff7043', microwave: '#ff5722',
        fan: '#b3e5fc', vacuum: '#ce93d8', washer: '#26c6da', lamp: '#fff176',
        superpc: '#00e5ff', plasma: '#ffd700', theater: '#e91e63',
      };
      s.projs.push({ id: uid(), sx: cx, sy: cy, ex, ey, life: 0.18, col: projCol[cell.tid] || '#fff' });
      
      // Kettle ability: 30% chance area burn
      if (cell.tid === 'kettle') {
        tgt.burning = 3; tgt.burnT = 0.5;
        if (Math.random() < 0.3) {
          for (const e of s.enemies) {
            if (dead.has(e.id) || e.id === tgt.id) continue;
            const { x, y } = pxy(e.pi, e.pr);
            if (Math.hypot(x - ex, y - ey) <= CELL * 1.5) {
              e.burning = 2; e.burnT = 0.5;
            }
          }
          s.effs.push({ id: uid(), x: ex, y: ey, txt: '💨蒸気!', life: 0.8, ml: 0.8, col: '#ff7043' });
        }
      } else if (cell.tid === 'microwave') {
        tgt.burning = 3; tgt.burnT = 0.5;
      }
      if (cell.tid === 'fridge' || cell.tid === 'aircon') tgt.frozen = 1.5;
      if (cell.tid === 'fan') {
        tgt.pr -= 0.45;
        while (tgt.pr < 0 && tgt.pi > 0) { tgt.pi--; tgt.pr += 1; }
        if (tgt.pr < 0) tgt.pr = 0;
      }

      if (tgt.hp <= 0) {
        dead.add(tgt.id);
        s.power = Math.min(s.power + tgt.rew, 999);
        const { x, y } = pxy(tgt.pi, tgt.pr);
        s.effs.push({ id: uid(), x, y, txt: `+${tgt.rew}W`, life: 1.0, ml: 1.0, col: '#ffd700' });

        // Microwave ability: explode on kill
        if (cell.tid === 'microwave') {
          const explosionRange = CELL * 1.8;
          for (const e of s.enemies) {
            if (dead.has(e.id)) continue;
            const { x: ex2, y: ey2 } = pxy(e.pi, e.pr);
            if (Math.hypot(ex2 - x, ey2 - y) <= explosionRange) {
              e.hp -= Math.ceil(dmg * 0.5);
              e.hitFlash = 0.15;
              e.burning = 2; e.burnT = 0.5;
              if (e.hp <= 0) dead.add(e.id);
            }
          }
          s.effs.push({ id: uid(), x, y, txt: '💥 BOOM!', life: 1.2, ml: 1.2, col: '#ff5722' });
          s.screenShake = 0.2;
          // Explosion particles
          for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i + Math.random() * 0.4;
            const speed = 60 + Math.random() * 80;
            s.particles.push({
              id: uid(), x, y,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              life: 0.6 + Math.random() * 0.4, ml: 1.0,
              col: ['#ff5722', '#ff9800', '#ffd700'][Math.floor(Math.random() * 3)],
              size: 3 + Math.random() * 4,
            });
          }
        }

        // Death particles
        for (let i = 0; i < (tgt.type === 'boss' ? 20 : 10); i++) {
          const angle = (Math.PI * 2 / 10) * i + Math.random() * 0.5;
          const speed = 40 + Math.random() * 80;
          s.particles.push({
            id: uid(), x, y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 0.5 + Math.random() * 0.5, ml: 1.0,
            col: EDEFS[tgt.type].col, size: 2 + Math.random() * 4,
          });
        }
        // Boss kill special effects
        if (tgt.type === 'boss') {
          s.screenShake = 0.5;
          s.effs.push({ id: uid(), x, y, txt: '🏆 BOSS DOWN!', life: 2.0, ml: 2.0, col: '#ffd700' });
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            s.particles.push({
              id: uid(), x, y,
              vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 120,
              life: 1.0, ml: 1.0, col: '#ffd700', size: 5,
            });
          }
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
