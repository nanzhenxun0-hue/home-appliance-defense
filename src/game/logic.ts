import type { GameState, DifficultyKey, Enemy, EnemyType, SpawnItem, TowerID, AreaKey, FireTrap } from './types';
import { DIFF, TDEFS, UPS, EDEFS, PATH, CELL, PS, st, AREA_WAVES } from './constants';
import { getSynergyEffects } from './synergy';
import { getChainComboEffects } from './chainCombo';

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

export const getWaves = (area: AreaKey) => AREA_WAVES[area] || AREA_WAVES['suburb'];

export const mkState = (diff: DifficultyKey, team: TowerID[], area: AreaKey = 'suburb'): GameState => {
  const d = DIFF[diff];
  return {
    grid: {}, timers: {}, abilityTimers: {}, enemies: [], projs: [], effs: [], particles: [],
    fireTraps: [],
    power: d.sp, wave: 0, baseHP: d.shp, maxHP: d.shp,
    waveActive: false, spawnQ: [], waveT: 0, powerT: 0,
    over: false, win: false, diff, area,
    screenShake: 0,
    team: [...team],
    disabledTowers: new Set(),
    bossWallActive: false,
    bossWallTimer: 0,
    ultGauge: 0,
    ultActive: false,
    ultTimer: 0,
    cloggedTowers: new Map(),
  };
};

export const buildQ = (wi: number, diff: DifficultyKey, area: AreaKey = 'suburb'): SpawnItem[] => {
  const d = DIFF[diff];
  const waves = getWaves(area);
  const q: SpawnItem[] = [];
  waves[wi].forEach(g => {
    for (let i = 0; i < g.n; i++) q.push({ type: g.t, at: i * g.gap * d.wg });
  });
  return q.sort((a, b) => a.at - b.at);
};

export const calcPowerBalance = (grid: GameState['grid'], team: TowerID[] = []) => {
  const en = getEnabled(grid);
  const gen = Object.entries(grid).reduce((a, [k, c]) => en.has(k) ? a + (st(c.tid, c.lv).pg || 0) : a, 0) + 2;
  const drain = Object.entries(grid).reduce((a, [k, c]) => {
    if (!en.has(k)) return a;
    const base = st(c.tid, c.lv).pc || 0;
    const synFx = getSynergyEffects(team, c.tid);
    return a + Math.ceil(base * (1 - synFx.powerDiscount));
  }, 0);
  return { gen, drain, net: gen - drain };
};

// Boss ability execution
const executeBossAbility = (s: GameState, e: Enemy) => {
  const def = EDEFS[e.type];
  if (!def.bossAbility) return;

  switch (def.bossAbility) {
    case 'warp': {
      // Teleport forward on the path
      const jump = Math.min(3, PATH.length - 1 - e.pi);
      if (jump > 0) {
        e.pi += jump;
        e.pr = 0;
        const { x, y } = pxy(e.pi, e.pr);
        s.effs.push({ id: uid(), x, y, txt: '⚡ワープ！', life: 1.5, ml: 1.5, col: '#00bcd4' });
      }
      break;
    }
    case 'wall': {
      s.bossWallActive = true;
      s.bossWallTimer = 3; // 3 seconds of immunity
      const { x, y } = pxy(e.pi, e.pr);
      s.effs.push({ id: uid(), x, y, txt: '🛡️バリア！', life: 1.5, ml: 1.5, col: '#ff3d00' });
      break;
    }
    case 'speed_buff': {
      for (const en of s.enemies) {
        en.speedBuff = 3; // 3 seconds
        en.spd *= 1.5;
      }
      s.effs.push({ id: uid(), x: 168, y: 210, txt: '💨全体加速！', life: 2, ml: 2, col: '#ff9800' });
      break;
    }
    case 'unit_disable': {
      // Randomly disable a tower for 5 seconds
      const keys = Object.keys(s.grid);
      if (keys.length > 0) {
        const rk = keys[Math.floor(Math.random() * keys.length)];
        s.disabledTowers.add(rk);
        setTimeout(() => s.disabledTowers.delete(rk), 5000);
        const [c, r] = rk.split(',').map(Number);
        s.effs.push({ id: uid(), x: c * CELL + CELL / 2, y: r * CELL + CELL / 2, txt: '⚠️無効化！', life: 2, ml: 2, col: '#9c27b0' });
      }
      break;
    }
  }
};

export const fireUlt = (s: GameState): void => {
  if (s.ultGauge < 100) return;
  s.ultGauge = 0;
  s.ultActive = true;
  s.ultTimer = 2.5;
  s.screenShake = 0.5;
  // Damage all enemies
  for (const e of s.enemies) {
    e.hp = Math.ceil(e.hp * 0.15); // reduce to 15% HP
    e.frozen = 1.5;
    e.hitFlash = 0.3;
    const { x, y } = pxy(e.pi, e.pr);
    s.effs.push({ id: uid(), x, y, txt: '⚡クリーン！', life: 1.5, ml: 1.5, col: '#00e5ff' });
  }
  s.effs.push({ id: uid(), x: 168, y: 210, txt: '🌊全自動洗浄！', life: 3, ml: 3, col: '#00e5ff' });
};

export const tickGame = (s: GameState, dt: number): void => {
  const dc = DIFF[s.diff];
  const en = getEnabled(s.grid);
  const waves = getWaves(s.area);

  if (s.screenShake > 0) s.screenShake = Math.max(0, s.screenShake - dt);

  // Ult timer
  if (s.ultActive) {
    s.ultTimer -= dt;
    if (s.ultTimer <= 0) s.ultActive = false;
  }

  // Clogged towers decay
  for (const [k, rem] of s.cloggedTowers.entries()) {
    const next = rem - dt;
    if (next <= 0) s.cloggedTowers.delete(k);
    else s.cloggedTowers.set(k, next);
  }

  // Boss wall timer
  if (s.bossWallActive) {
    s.bossWallTimer -= dt;
    if (s.bossWallTimer <= 0) s.bossWallActive = false;
  }

  if (s.waveActive) {
    s.powerT += dt;
    if (s.powerT >= 1) {
      s.powerT -= 1;
      const { gen, drain } = calcPowerBalance(s.grid, s.team);
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
    if (e.speedBuff && e.speedBuff > 0) {
      e.speedBuff -= dt;
      if (e.speedBuff <= 0) {
        e.spd = EDEFS[e.type].spd * dc.spdM;
      }
    }
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

    // New enemy special abilities
    const eDef = EDEFS[e.type];
    if (eDef.special === 'clog' && !dead.has(e.id)) {
      // Cockroach: periodically clogs a nearby tower
      e.clogTimer = (e.clogTimer ?? (3 + Math.random() * 3)) - dt;
      if (e.clogTimer <= 0) {
        e.clogTimer = 4 + Math.random() * 3;
        const { x: ex, y: ey } = pxy(e.pi, e.pr);
        let nearest: string | null = null; let nd = Infinity;
        for (const [k] of Object.entries(s.grid)) {
          const [gc, gr] = k.split(',').map(Number);
          const d = Math.hypot(gc * CELL + CELL/2 - ex, gr * CELL + CELL/2 - ey);
          if (d < nd && d < CELL * 3) { nd = d; nearest = k; }
        }
        if (nearest) {
          s.cloggedTowers.set(nearest, 5);
          const [gc, gr] = nearest.split(',').map(Number);
          s.effs.push({ id: uid(), x: gc * CELL + CELL/2, y: gr * CELL + CELL/2, txt: '🪳詰まり！', life: 1.5, ml: 1.5, col: '#795548' });
        }
      }
    }

    if (eDef.special === 'corrode' && !dead.has(e.id)) {
      // Mold: slowly corrodes nearby towers (power drain)
      e.corrodeTimer = (e.corrodeTimer ?? 1) - dt;
      if (e.corrodeTimer <= 0) {
        e.corrodeTimer = 1;
        s.power = Math.max(0, s.power - 1);
      }
    }

    if (eDef.special === 'surge_stun' && !dead.has(e.id)) {
      // Surge: stuns nearby towers briefly when it passes a tower
      const { x: ex, y: ey } = pxy(e.pi, e.pr);
      for (const [k] of Object.entries(s.grid)) {
        const [gc, gr] = k.split(',').map(Number);
        if (Math.hypot(gc * CELL + CELL/2 - ex, gr * CELL + CELL/2 - ey) < CELL * 1.2) {
          if (!s.disabledTowers.has(k)) {
            s.disabledTowers.add(k);
            const rem = k;
            setTimeout(() => s.disabledTowers.delete(rem), 1500);
          }
        }
      }
    }

    // Boss abilities (random trigger every ~8 seconds)
    if (EDEFS[e.type].bossAbility) {
      const abilityKey = `boss_${e.id}`;
      s.abilityTimers[abilityKey] = (s.abilityTimers[abilityKey] || (5 + Math.random() * 5)) - dt;
      if (s.abilityTimers[abilityKey] <= 0) {
        s.abilityTimers[abilityKey] = 6 + Math.random() * 6;
        executeBossAbility(s, e);
      }
    }
  }

  // Fire traps damage
  for (const trap of s.fireTraps) {
    trap.life -= dt;
    for (const e of s.enemies) {
      if (dead.has(e.id)) continue;
      const { x, y } = pxy(e.pi, e.pr);
      if (Math.hypot(x - trap.x, y - trap.y) < CELL * 0.8) {
        e.burning = 2;
        e.burnT = 0.5;
        e.hp -= trap.dmg * dt;
        if (e.hp <= 0) dead.add(e.id);
      }
    }
  }
  s.fireTraps = s.fireTraps.filter(t => t.life > 0);

  for (const [key, cell] of Object.entries(s.grid)) {
    if (!en.has(key)) continue;
    if (s.disabledTowers.has(key)) continue; // boss disabled
    if (s.cloggedTowers.has(key)) continue; // cockroach clogged
    const S = st(cell.tid, cell.lv);

    // Fan Lv3 ability: push enemy to start every 10 seconds
    if (cell.tid === 'fan' && cell.lv >= 2 && S.abilityUnlock) {
      const abKey = `ability_${key}`;
      s.abilityTimers[abKey] = (s.abilityTimers[abKey] || 10) - dt;
      if (s.abilityTimers[abKey] <= 0) {
        s.abilityTimers[abKey] = 10;
        const [c, r] = key.split(',').map(Number);
        const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
        const range = S.rng * CELL;
        for (const e of s.enemies) {
          if (dead.has(e.id)) continue;
          const { x, y } = pxy(e.pi, e.pr);
          if (Math.hypot(x - cx, y - cy) <= range) {
            e.pi = 0; e.pr = 0;
            s.effs.push({ id: uid(), x, y, txt: '🌀戻される！', life: 1.5, ml: 1.5, col: '#81d4fa' });
            break; // one target per activation
          }
        }
      }
    }

    // Toaster Lv3 ability: drop fire traps
    if (cell.tid === 'toaster' && cell.lv >= 2 && S.abilityUnlock) {
      const abKey = `ability_${key}`;
      s.abilityTimers[abKey] = (s.abilityTimers[abKey] || 5) - dt;
      if (s.abilityTimers[abKey] <= 0) {
        s.abilityTimers[abKey] = 5;
        // Place fire on a random path cell
        const pathIdx = Math.floor(Math.random() * PATH.length);
        const [pc, pr] = PATH[pathIdx];
        const fx = pc * CELL + CELL / 2, fy = pr * CELL + CELL / 2;
        s.fireTraps.push({ id: uid(), x: fx, y: fy, life: 4, dmg: S.dmg * 0.3 });
        s.effs.push({ id: uid(), x: fx, y: fy, txt: '🔥', life: 0.8, ml: 0.8, col: '#ff5722' });
      }
    }

    if (!S.spd || !S.dmg) continue;

    const synFx = getSynergyEffects(s.team, cell.tid);
    const placedTypes = [...new Set(Object.values(s.grid).map(c => c.tid))];
    const chainFx = getChainComboEffects(placedTypes, cell.tid);
    const synDmg = Math.ceil(S.dmg * synFx.dmgMult * chainFx.dmgMult);
    const synSpd = S.spd * synFx.spdMult * chainFx.spdMult;

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
      if (s.bossWallActive && EDEFS[e.type].bossAbility) continue; // wall protects boss
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
        toaster:'#ff8a65', dryer:'#ef9a9a', speaker:'#ce93d8', projector:'#ba68c8',
        tesla:'#7c4dff',
      };
      s.projs.push({ id: uid(), sx: cx, sy: cy, ex, ey, life: 0.18, col: projCol[cell.tid] || '#fff' });
      if (cell.tid === 'kettle' || cell.tid === 'microwave' || cell.tid === 'toaster' || cell.tid === 'dryer') {
        tgt.burning = 3; tgt.burnT = 0.5;
      }
      if (cell.tid === 'fridge' || cell.tid === 'aircon') tgt.frozen = 1.5;
      if (cell.tid === 'speaker' && cell.lv >= 2) tgt.frozen = 0.5; // slow field
      if (cell.tid === 'fan' || cell.tid === 'vacuum' || cell.tid === 'washer') {
        const bk = cell.tid === 'fan' ? 0.45 : 0.22;
        tgt.pr -= bk;
        while (tgt.pr < 0 && tgt.pi > 0) { tgt.pi--; tgt.pr += 1; }
        if (tgt.pr < 0) tgt.pr = 0;
      }

      // Chain lightning for tesla
      if (cell.tid === 'tesla' && cell.lv >= 2) {
        let chainTarget = tgt;
        for (let chain = 0; chain < 3; chain++) {
          const { x: cx2, y: cy2 } = pxy(chainTarget.pi, chainTarget.pr);
          let nextTarget: Enemy | null = null;
          let nd = Infinity;
          for (const e of s.enemies) {
            if (dead.has(e.id) || e.id === chainTarget.id) continue;
            const { x, y } = pxy(e.pi, e.pr);
            const d = Math.hypot(x - cx2, y - cy2);
            if (d < nd && d < CELL * 3) { nd = d; nextTarget = e; }
          }
          if (nextTarget) {
            nextTarget.hp -= Math.ceil(synDmg * 0.5);
            nextTarget.hitFlash = 0.1;
            const { x: nx, y: ny } = pxy(nextTarget.pi, nextTarget.pr);
            s.projs.push({ id: uid(), sx: cx2, sy: cy2, ex: nx, ey: ny, life: 0.12, col: '#7c4dff' });
            if (nextTarget.hp <= 0) dead.add(nextTarget.id);
            chainTarget = nextTarget;
          } else break;
        }
      }

      if (tgt.hp <= 0) {
        dead.add(tgt.id);
        s.power = Math.min(s.power + tgt.rew, 999);
        // Ult gauge charge on kill
        const isBoss = tgt.type.startsWith('boss') || tgt.type === 'final_boss';
        s.ultGauge = Math.min(100, s.ultGauge + (isBoss ? 25 : 3));
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

  // Dust lord multiply: spawn small dusts on death
  const newSpawns: typeof s.enemies = [];
  for (const e of s.enemies) {
    if (dead.has(e.id) && EDEFS[e.type].special === 'multiply') {
      const spawnCount = 2;
      for (let k = 0; k < spawnCount; k++) {
        newSpawns.push({
          id: uid(), type: 'dust' as EnemyType,
          hp: 30, mhp: 30, spd: 55, rew: 5,
          pi: e.pi, pr: e.pr + (k * 0.01),
          hitFlash: 0, frozen: 0, burning: 0, burnT: 0,
          em: EDEFS['dust' as EnemyType]?.em ?? '💨',
        });
      }
      const { x, y } = pxy(e.pi, e.pr);
      s.effs.push({ id: uid(), x, y, txt: '💨×2分裂！', life: 1.2, ml: 1.2, col: '#90a4ae' });
    }
  }

  s.enemies = s.enemies.filter(e => !dead.has(e.id));
  s.enemies.push(...newSpawns);
  s.projs.forEach(p => p.life -= dt);
  s.projs = s.projs.filter(p => p.life > 0);
  s.effs.forEach(e => e.life -= dt);
  s.effs = s.effs.filter(e => e.life > 0);
  s.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; p.life -= dt; });
  s.particles = s.particles.filter(p => p.life > 0);

  if (s.waveActive && s.spawnQ.length === 0 && s.enemies.length === 0) {
    s.waveActive = false;
    if (s.wave >= waves.length) s.win = true;
  }
};
