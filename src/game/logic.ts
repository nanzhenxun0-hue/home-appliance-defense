import type { GameState, DifficultyKey, Enemy, EnemyType, SpawnItem, TowerID, AreaKey, FireTrap } from './types';
import { DIFF, TDEFS, UPS, EDEFS, CELL, st, AREA_WAVES, getAreaPath, getAreaPathSet } from './constants';
import { getSynergyEffects } from './synergy';
import { getChainComboEffects } from './chainCombo';

let _eid = 1;
export const uid = (): number => _eid++;
export const resetUid = () => { _eid = 1; };

export const pxy = (path: [number, number][], pi: number, pr: number) => {
  const i = Math.min(pi, path.length - 2);
  const [c1, r1] = path[i];
  const [c2, r2] = path[Math.min(i + 1, path.length - 1)];
  return { x: (c1 + (c2 - c1) * pr) * CELL + CELL / 2, y: (r1 + (r2 - r1) * pr) * CELL + CELL / 2 };
};

export const getEnabled = (grid: GameState['grid']): Set<string> => {
  const en = new Set<string>();
  for (const [k, c] of Object.entries(grid)) {
    if (!TDEFS[c.tid].req) en.add(k);
  }
  // USBコード is a universal chain bridge — its presence satisfies any req.
  const hasUsbcord = Object.entries(grid).some(([k, c]) => c.tid === 'usbcord' && en.has(k));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [k, c] of Object.entries(grid)) {
      if (en.has(k)) continue;
      const req = TDEFS[c.tid].req;
      if (!req) continue;
      if (hasUsbcord || Object.entries(grid).some(([k2, c2]) => c2.tid === req && en.has(k2))) {
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
    if (c.tid !== req && c.tid !== 'usbcord') continue;
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
  if (Object.entries(grid).some(([k, c]) => c.tid === 'usbcord' && en.has(k))) return true;
  return Object.entries(grid).some(([k, c]) => c.tid === req && en.has(k));
};

export const getWaves = (area: AreaKey) => AREA_WAVES[area] || AREA_WAVES['suburb'];

export const mkState = (diff: DifficultyKey, team: TowerID[], area: AreaKey = 'suburb'): GameState => {
  const d = DIFF[diff];
  const path = getAreaPath(area);
  const pathSet = getAreaPathSet(area);
  const endless = diff === 'endless';
  return {
    grid: {}, timers: {}, abilityTimers: {}, enemies: [], projs: [], effs: [], particles: [], rings: [],
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
    freezeTileHP: 0, freezeTileMaxHP: 0, freezeTileMode: null,
    iceDotTimer: 0, absoluteZeroTimer: 0,
    path, pathSet, endless,
    totalWaves: endless ? 0 : getWaves(area).length,
  };
};

// Endless wave generator — scales infinitely
const endlessWave = (wi: number): { t: EnemyType; n: number; gap: number }[] => {
  const w = wi + 1;
  const groups: { t: EnemyType; n: number; gap: number }[] = [];
  groups.push({ t: 'dust', n: 4 + Math.floor(w * 0.6), gap: Math.max(0.3, 1.2 - w * 0.01) });
  if (w >= 2) groups.push({ t: 'fast_dust', n: 3 + Math.floor(w * 0.4), gap: 0.6 });
  if (w >= 4) groups.push({ t: 'slime', n: 2 + Math.floor(w * 0.25), gap: 1.0 });
  if (w >= 7) groups.push({ t: 'cockroach', n: 2 + Math.floor(w * 0.2), gap: 0.7 });
  if (w >= 10) groups.push({ t: 'tank_slime', n: 1 + Math.floor(w * 0.12), gap: 1.5 });
  if (w >= 15) groups.push({ t: 'virus', n: 1 + Math.floor(w * 0.15), gap: 0.9 });
  if (w >= 20) groups.push({ t: 'surge', n: 1 + Math.floor(w * 0.1), gap: 1.2 });
  if (w >= 25 && w % 5 === 0) groups.push({ t: 'dust_lord', n: 1 + Math.floor(w / 25), gap: 3.0 });
  if (w >= 10 && w % 10 === 0) groups.push({ t: 'boss', n: 1 + Math.floor(w / 30), gap: 4.0 });
  if (w >= 30 && w % 15 === 0) groups.push({ t: 'boss_ice', n: 1, gap: 0 });
  if (w >= 50 && w % 20 === 0) groups.push({ t: 'boss_fire', n: 1, gap: 0 });
  if (w >= 100 && w % 25 === 0) groups.push({ t: 'final_boss', n: 1, gap: 0 });
  return groups;
};

export const buildQ = (wi: number, diff: DifficultyKey, area: AreaKey = 'suburb'): SpawnItem[] => {
  const d = DIFF[diff];
  const groups = diff === 'endless' ? endlessWave(wi) : (getWaves(area)[wi] || []);
  const q: SpawnItem[] = [];
  groups.forEach(g => {
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
      const jump = Math.min(3, s.path.length - 1 - e.pi);
      if (jump > 0) {
        e.pi += jump;
        e.pr = 0;
        const { x, y } = pxy(s.path, e.pi, e.pr);
        s.effs.push({ id: uid(), x, y, txt: '⚡ワープ！', life: 1.5, ml: 1.5, col: '#00bcd4' });
      }
      break;
    }
    case 'wall': {
      s.bossWallActive = true;
      s.bossWallTimer = 3;
      const { x, y } = pxy(s.path, e.pi, e.pr);
      s.effs.push({ id: uid(), x, y, txt: '🛡️バリア！', life: 1.5, ml: 1.5, col: '#ff3d00' });
      break;
    }
    case 'speed_buff': {
      for (const en of s.enemies) {
        en.speedBuff = 3;
        en.spd *= 1.5;
      }
      s.effs.push({ id: uid(), x: 168, y: 210, txt: '💨全体加速！', life: 2, ml: 2, col: '#ff9800' });
      break;
    }
    case 'unit_disable': {
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
    // ── 累氷の魔雪 abilities ──
    case 'ice_wall': {
      // 技① 氷の面: spawn ice wall HP=200, absorbs hits, boss takes reduced damage while active
      if (s.freezeTileHP <= 0) {
        s.freezeTileHP = 200;
        s.freezeTileMaxHP = 200;
        s.freezeTileMode = 'wall';
        s.effs.push({ id: uid(), x: 168, y: 100, txt: '❄️氷の面出現！', life: 2, ml: 2, col: '#80d8ff' });
      }
      // Schedule next ability: blizzard
      const abKey_iw = `boss_${e.id}`;
      s.abilityTimers[abKey_iw] = 8 + Math.random() * 4;
      (def as any)._nextAbility = 'blizzard';
      break;
    }
    case 'blizzard': {
      // 技② 暴風: freeze all towers for 4 seconds
      for (const k of Object.keys(s.grid)) {
        s.disabledTowers.add(k);
        const rem = k;
        setTimeout(() => s.disabledTowers.delete(rem), 4000);
      }
      s.effs.push({ id: uid(), x: 168, y: 210, txt: '🌨️暴風！全家電凍結4秒', life: 2.5, ml: 2.5, col: '#80d8ff' });
      s.screenShake = 0.4;
      break;
    }
    case 'ice_curse': {
      // 技③ 氷の念: spawn curse tile HP=500, base takes 1 dmg every 3s while active
      if (s.freezeTileHP <= 0) {
        s.freezeTileHP = 500;
        s.freezeTileMaxHP = 500;
        s.freezeTileMode = 'curse';
        s.iceDotTimer = 3;
        s.effs.push({ id: uid(), x: 168, y: 130, txt: '❄️氷の念発動！呪氷出現', life: 2.5, ml: 2.5, col: '#4dd0e1' });
      }
      break;
    }
    case 'absolute_zero': {
      s.absoluteZeroTimer = 10;
      s.screenShake = 0.8;
      s.effs.push({ id: uid(), x: 168, y: 180, txt: '🌨️アブソルート・オプゼロ！！', life: 3, ml: 3, col: '#80d8ff' });
      break;
    }
    case 'power_drain': {
      // 電力収奪: steal 30-50W from player
      const drain = e.type === 'final_boss' ? 50 : 30;
      s.power = Math.max(0, s.power - drain);
      s.screenShake = 0.3;
      s.effs.push({ id: uid(), x: 168, y: 180, txt: `⚡-${drain}W 電力収奪！`, life: 2, ml: 2, col: '#ffd700' });
      break;
    }
    case 'regen': {
      // 自己回復: restore 8% of max HP
      const healAmt = Math.ceil(e.mhp * 0.08);
      e.hp = Math.min(e.mhp, e.hp + healAmt);
      const { x, y } = pxy(s.path, e.pi, e.pr);
      s.effs.push({ id: uid(), x, y, txt: `💙+${healAmt} 回復！`, life: 1.8, ml: 1.8, col: '#00bcd4' });
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
    const { x, y } = pxy(s.path, e.pi, e.pr);
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

  // ── Absolute Zero countdown ──
  if (s.absoluteZeroTimer > 0) {
    s.absoluteZeroTimer = Math.max(0, s.absoluteZeroTimer - dt);
  }

  // ── Freeze tile (氷の面 / 氷の念) processing ──
  if (s.freezeTileHP <= 0 && s.freezeTileMode !== null) {
    // Tile just destroyed
    s.effs.push({ id: uid(), x: 168, y: 150, txt: '💧フリーズタイル破壊！', life: 2, ml: 2, col: '#00e5ff' });
    s.freezeTileMode = null;
    s.iceDotTimer = 0;
  }
  if (s.freezeTileMode === 'curse' && s.freezeTileHP > 0) {
    s.iceDotTimer -= dt;
    if (s.iceDotTimer <= 0) {
      s.iceDotTimer = 3;
      s.baseHP = Math.max(0, s.baseHP - 1);
      s.effs.push({ id: uid(), x: 168, y: 168, txt: '❄️-1HP 氷の念', life: 1.5, ml: 1.5, col: '#4dd0e1' });
      if (s.baseHP <= 0) s.over = true;
    }
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
      const scale = s.endless ? (1 + 0.05 * Math.max(0, s.wave - 1)) : 1;
      s.enemies.push({
        id: uid(), type: it.type, em: d.em,
        hp: Math.ceil(d.hp * dc.hpM * scale), mhp: Math.ceil(d.hp * dc.hpM * scale),
        spd: d.spd * dc.spdM * scale, rew: d.rew, dmg: d.dmg,
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
    if ((e.brainwashed ?? 0) > 0) {
      // Brainwash: enemy reverses direction and deals collision damage
      e.brainwashed = Math.max(0, e.brainwashed! - dt);
      let brem = e.spd * dt;
      while (brem > 0 && (e.pi > 0 || e.pr > 0)) {
        if (e.pi === 0) { e.pr = 0; break; }
        const segLen = Math.hypot(
          s.path[e.pi][0] - s.path[e.pi - 1][0],
          s.path[e.pi][1] - s.path[e.pi - 1][1]
        ) * CELL;
        const canBack = e.pr * segLen;
        if (brem >= canBack) { brem -= canBack; e.pi--; e.pr = 1; }
        else { e.pr = Math.max(0, e.pr - brem / segLen); brem = 0; }
      }
      if (e.pi === 0) e.pr = Math.max(0, e.pr);
      // Collision damage: brainwashed enemy deals ~80% of its HP to nearby enemies
      const { x: bx, y: by } = pxy(s.path, e.pi, e.pr);
      for (const other of s.enemies) {
        if (other.id === e.id || dead.has(other.id) || (other.brainwashed ?? 0) > 0) continue;
        const { x: ox, y: oy } = pxy(s.path, other.pi, other.pr);
        if (Math.hypot(ox - bx, oy - by) < CELL * 0.85) {
          const bDmg = Math.max(1, Math.ceil(e.hp * 0.8));
          other.hp -= bDmg;
          other.hitFlash = 0.25;
          s.effs.push({ id: uid(), x: ox, y: oy, txt: `📺-${bDmg}洗脳！`, life: 1.5, ml: 1.5, col: '#e040fb' });
          if (other.hp <= 0) {
            dead.add(other.id);
            s.power = Math.min(s.power + other.rew, 999);
            s.ultGauge = Math.min(100, s.ultGauge + 3);
          }
        }
      }
      if (e.brainwashed <= 0) e.frozen = 1.5;
    } else {
      let rem = e.spd * dt;
      while (rem > 0 && e.pi < s.path.length - 1) {
        const [c1, r1] = s.path[e.pi];
        const [c2, r2] = s.path[e.pi + 1];
        const seg = Math.hypot(c2 - c1, r2 - r1) * CELL;
        const left = (1 - e.pr) * seg;
        if (rem >= left) { rem -= left; e.pi++; e.pr = 0; }
        else { e.pr += rem / seg; rem = 0; }
      }
      if (e.pi >= s.path.length - 1) {
        dead.add(e.id);
        s.baseHP = Math.max(0, s.baseHP - e.dmg);
        s.screenShake = 0.3;
        const { x, y } = pxy(s.path, e.pi, e.pr);
        s.effs.push({ id: uid(), x, y, txt: `-${e.dmg}HP`, life: 1.5, ml: 1.5, col: '#f44336' });
        if (s.baseHP <= 0) s.over = true;
      }
    }
    if (e.burning > 0) {
      e.burning -= dt; e.burnT -= dt;
      if (e.burnT <= 0) { e.hp -= 5; e.burnT = 0.5; if (e.hp <= 0) dead.add(e.id); }
    }

    // New enemy special abilities
    const eDef = EDEFS[e.type];
    // ── Magnet: periodic EMP pulse — disables nearby towers ──
    if (e.type === 'magnet' && !dead.has(e.id)) {
      e.atkTimer = (e.atkTimer ?? (4 + Math.random() * 3)) - dt;
      if (e.atkTimer <= 0) {
        e.atkTimer = 5 + Math.random() * 3;
        const { x: ex, y: ey } = pxy(s.path, e.pi, e.pr);
        const empRange = CELL * 2.5;
        s.rings.push({ id: uid(), x: ex, y: ey, r: CELL * 0.5, maxR: empRange, col: '#f48fb1', life: 0.55, ml: 0.55, thick: 2.5 });
        let hitCount = 0;
        for (const k of Object.keys(s.grid)) {
          const [gc, gr] = k.split(',').map(Number);
          if (Math.hypot(gc * CELL + CELL/2 - ex, gr * CELL + CELL/2 - ey) < empRange) {
            if (!s.disabledTowers.has(k) && hitCount < 2) {
              s.disabledTowers.add(k);
              const rem = k; setTimeout(() => s.disabledTowers.delete(rem), 2000);
              hitCount++;
            }
          }
        }
        if (hitCount > 0) {
          s.effs.push({ id: uid(), x: ex, y: ey - 14, txt: `🧲EMP！(${hitCount}機)`, life: 1.5, ml: 1.5, col: '#f48fb1' });
          s.screenShake = Math.min(s.screenShake + 0.12, 0.4);
        }
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI * 2 / 10) * i;
          s.particles.push({ id: uid(), x: ex, y: ey, vx: Math.cos(angle) * 55, vy: Math.sin(angle) * 55, life: 0.5, ml: 0.5, col: '#f48fb1', size: 3 });
        }
      }
    }

    // ── Virus: periodic infection spread — buffs nearby enemies speed ──
    if (e.type === 'virus' && !dead.has(e.id)) {
      e.atkTimer = (e.atkTimer ?? (3 + Math.random() * 2)) - dt;
      if (e.atkTimer <= 0) {
        e.atkTimer = 3.5 + Math.random() * 2;
        const { x: ex, y: ey } = pxy(s.path, e.pi, e.pr);
        const spreadR = CELL * 3.0;
        s.rings.push({ id: uid(), x: ex, y: ey, r: CELL * 0.4, maxR: spreadR, col: '#76ff03', life: 0.6, ml: 0.6, thick: 2 });
        let infected = 0;
        for (const other of s.enemies) {
          if (other.id === e.id || dead.has(other.id)) continue;
          const { x: ox, y: oy } = pxy(s.path, other.pi, other.pr);
          if (Math.hypot(ox - ex, oy - ey) < spreadR) {
            if (!(other.speedBuff && other.speedBuff > 0)) {
              other.speedBuff = 3.5;
              other.spd *= 1.25;
              infected++;
            }
          }
        }
        s.power = Math.max(0, s.power - 3);
        if (infected > 0) {
          s.effs.push({ id: uid(), x: ex, y: ey - 14, txt: `🦠感染拡散！(+${infected})`, life: 1.5, ml: 1.5, col: '#76ff03' });
        }
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.4;
          s.particles.push({ id: uid(), x: ex, y: ey, vx: Math.cos(angle) * 45, vy: Math.sin(angle) * 45 - 15, life: 0.5, ml: 0.5, col: '#76ff03', size: 2.5 });
        }
      }
    }

    if (eDef.special === 'clog' && !dead.has(e.id)) {
      // Cockroach: periodically clogs a nearby tower
      e.clogTimer = (e.clogTimer ?? (3 + Math.random() * 3)) - dt;
      if (e.clogTimer <= 0) {
        e.clogTimer = 4 + Math.random() * 3;
        const { x: ex, y: ey } = pxy(s.path, e.pi, e.pr);
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
      const { x: ex, y: ey } = pxy(s.path, e.pi, e.pr);
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
        // boss_ice: rotate between warp and regen
        if (e.type === 'boss_ice') {
          const phaseKey = `boss_ice_phase_${e.id}`;
          const phase = (s.abilityTimers[phaseKey] || 0) % 2;
          s.abilityTimers[phaseKey] = phase + 1;
          s.abilityTimers[abilityKey] = 7 + Math.random() * 4;
          if (phase < 1) {
            // warp
            const jump = Math.min(3, s.path.length - 1 - e.pi);
            if (jump > 0) { e.pi += jump; e.pr = 0; }
            const { x, y } = pxy(s.path, e.pi, e.pr);
            s.effs.push({ id: uid(), x, y, txt: '⚡ワープ！', life: 1.5, ml: 1.5, col: '#00bcd4' });
          } else {
            // regen
            const healAmt = Math.ceil(e.mhp * 0.08);
            e.hp = Math.min(e.mhp, e.hp + healAmt);
            const { x, y } = pxy(s.path, e.pi, e.pr);
            s.effs.push({ id: uid(), x, y, txt: `💙+${healAmt} 回復！`, life: 1.8, ml: 1.8, col: '#00bcd4' });
          }
        // boss_fire: rotate between wall and power_drain
        } else if (e.type === 'boss_fire') {
          const phaseKey = `boss_fire_phase_${e.id}`;
          const phase = (s.abilityTimers[phaseKey] || 0) % 2;
          s.abilityTimers[phaseKey] = phase + 1;
          s.abilityTimers[abilityKey] = 7 + Math.random() * 4;
          if (phase < 1) {
            // wall
            s.bossWallActive = true; s.bossWallTimer = 3;
            const { x, y } = pxy(s.path, e.pi, e.pr);
            s.effs.push({ id: uid(), x, y, txt: '🛡️炎壁！', life: 1.5, ml: 1.5, col: '#ff3d00' });
          } else {
            // power_drain
            s.power = Math.max(0, s.power - 30);
            s.screenShake = 0.3;
            s.effs.push({ id: uid(), x: 168, y: 180, txt: '⚡-30W 電力収奪！', life: 2, ml: 2, col: '#ffd700' });
          }
        // final_boss: rotate between unit_disable and power_drain
        } else if (e.type === 'final_boss') {
          const phaseKey = `final_boss_phase_${e.id}`;
          const phase = (s.abilityTimers[phaseKey] || 0) % 2;
          s.abilityTimers[phaseKey] = phase + 1;
          s.abilityTimers[abilityKey] = 8 + Math.random() * 4;
          if (phase < 1) {
            // unit_disable
            const keys = Object.keys(s.grid);
            if (keys.length > 0) {
              const rk = keys[Math.floor(Math.random() * keys.length)];
              s.disabledTowers.add(rk);
              const rem = rk;
              setTimeout(() => s.disabledTowers.delete(rem), 5000);
              const [c, r] = rk.split(',').map(Number);
              s.effs.push({ id: uid(), x: c * CELL + CELL / 2, y: r * CELL + CELL / 2, txt: '⚠️無効化！', life: 2, ml: 2, col: '#9c27b0' });
            }
          } else {
            // power_drain
            s.power = Math.max(0, s.power - 50);
            s.screenShake = 0.4;
            s.effs.push({ id: uid(), x: 168, y: 180, txt: '⚡-50W 電力収奪！！', life: 2.5, ml: 2.5, col: '#ffd700' });
          }
        // boss_massetsu: rotate through 4 abilities in sequence
        } else if (e.type === 'boss_massetsu') {
          const phaseKey = `massetsu_phase_${e.id}`;
          const phase = (s.abilityTimers[phaseKey] || 0) % 4;
          s.abilityTimers[phaseKey] = phase + 1;
          const abilities: Array<typeof EDEFS[typeof e.type]['bossAbility']> = ['ice_wall', 'blizzard', 'ice_curse', 'absolute_zero'];
          const chosenAbility = abilities[Math.floor(phase)];
          const fakeDef = { ...EDEFS[e.type], bossAbility: chosenAbility };
          s.abilityTimers[abilityKey] = phase === 3 ? 12 : 7 + Math.random() * 4;
          executeBossAbility(s, { ...e } as any);
          // directly call the chosen ability
          if (chosenAbility === 'ice_wall') {
            if (s.freezeTileHP <= 0) {
              s.freezeTileHP = 200; s.freezeTileMaxHP = 200; s.freezeTileMode = 'wall';
              s.effs.push({ id: uid(), x: 168, y: 100, txt: '❄️技①氷の面！', life: 2, ml: 2, col: '#80d8ff' });
            }
          } else if (chosenAbility === 'blizzard') {
            for (const k of Object.keys(s.grid)) {
              s.disabledTowers.add(k);
              const rem = k;
              setTimeout(() => s.disabledTowers.delete(rem), 4000);
            }
            s.effs.push({ id: uid(), x: 168, y: 210, txt: '🌨️技②暴風！全家電4秒凍結', life: 2.5, ml: 2.5, col: '#80d8ff' });
            s.screenShake = 0.4;
          } else if (chosenAbility === 'ice_curse') {
            if (s.freezeTileHP <= 0) {
              s.freezeTileHP = 500; s.freezeTileMaxHP = 500; s.freezeTileMode = 'curse'; s.iceDotTimer = 3;
              s.effs.push({ id: uid(), x: 168, y: 130, txt: '❄️技③氷の念！呪氷出現', life: 2.5, ml: 2.5, col: '#4dd0e1' });
            }
          } else if (chosenAbility === 'absolute_zero') {
            s.absoluteZeroTimer = 10; s.screenShake = 0.8;
            s.effs.push({ id: uid(), x: 168, y: 180, txt: '🌨️奥義！アブソルート・オプゼロ！！', life: 3, ml: 3, col: '#80d8ff' });
          }
          void fakeDef; // suppress unused warning
        } else {
          s.abilityTimers[abilityKey] = 6 + Math.random() * 6;
          executeBossAbility(s, e);
        }
      }
    }
  }

  // Fire traps damage
  for (const trap of s.fireTraps) {
    trap.life -= dt;
    for (const e of s.enemies) {
      if (dead.has(e.id)) continue;
      const { x, y } = pxy(s.path, e.pi, e.pr);
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
    if (s.absoluteZeroTimer > 0) continue; // absolute zero: all towers disabled
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
          const { x, y } = pxy(s.path, e.pi, e.pr);
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
        const pathIdx = Math.floor(Math.random() * s.path.length);
        const [pc, pr] = s.path[pathIdx];
        const fx = pc * CELL + CELL / 2, fy = pr * CELL + CELL / 2;
        s.fireTraps.push({ id: uid(), x: fx, y: fy, life: 4, dmg: S.dmg * 0.3 });
        s.effs.push({ id: uid(), x: fx, y: fy, txt: '🔥', life: 0.8, ml: 0.8, col: '#ff5722' });
      }
    }

    // Dishwasher Lv3 ability: wash away clogs / disables nearby
    if (cell.tid === 'dishwasher' && cell.lv >= 2 && S.abilityUnlock) {
      const abKey = `ability_${key}`;
      s.abilityTimers[abKey] = (s.abilityTimers[abKey] || 8) - dt;
      if (s.abilityTimers[abKey] <= 0) {
        s.abilityTimers[abKey] = 8;
        const [c, r] = key.split(',').map(Number);
        for (const k of Object.keys(s.grid)) {
          const [gc, gr] = k.split(',').map(Number);
          if (Math.hypot(gc - c, gr - r) <= S.rng) {
            s.cloggedTowers.delete(k);
            s.disabledTowers.delete(k);
          }
        }
        s.effs.push({ id: uid(), x: c * CELL + CELL/2, y: r * CELL + CELL/2, txt: '🍽️洗浄！', life: 1.2, ml: 1.2, col: '#4dd0e1' });
      }
    }

    if (!S.spd || !S.dmg) continue;

    // ── USBコード: PC系が場にいる時のみ攻撃。編成で属性が変わる ──
    let usbMode: 'idle' | 'fire' | 'beam' | 'bolt' = 'idle';
    if (cell.tid === 'usbcord') {
      const placed = Object.values(s.grid).map(c => c.tid);
      const PC_FAMILY: TowerID[] = ['superpc', 'gameconsole', 'robotarm', 'quantumchip'];
      const KITCHEN: TowerID[] = ['kettle','toaster','microwave','oven','ihcooker','ricecooker','fryer','heater','waffleiron','blender','juicer','coffeemaker'];
      const hasPC = placed.some(t => PC_FAMILY.includes(t));
      if (!hasPC) {
        s.timers[key] = 0.8; // idle: no PC linked, just support power
        continue;
      }
      if (placed.includes('tv')) usbMode = 'beam';
      else if (placed.filter(t => KITCHEN.includes(t)).length >= 2) usbMode = 'fire';
      else usbMode = 'bolt';
    }

    const synFx = getSynergyEffects(s.team, cell.tid);
    const placedTypes = [...new Set(Object.values(s.grid).map(c => c.tid))];
    const chainFx = getChainComboEffects(placedTypes, cell.tid);
    let synDmg = Math.ceil(S.dmg * synFx.dmgMult * chainFx.dmgMult);
    const synSpd = S.spd * synFx.spdMult * chainFx.spdMult;

    // USBコード: モード別に威力補正
    if (cell.tid === 'usbcord') {
      if (usbMode === 'fire') synDmg = Math.ceil(synDmg * 1.3);
      else if (usbMode === 'beam') synDmg = Math.ceil(synDmg * 1.6);
    }

    s.timers[key] = (s.timers[key] || 0) - dt * towerSpeedMult;
    if (s.timers[key] > 0) continue;
    const [c, r] = key.split(',').map(Number);
    const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2, range = S.rng * CELL;
    let rm = 1;
      for (const [k2, c2] of Object.entries(s.grid)) {
        if (c2.tid !== 'router' && c2.tid !== 'theater' && c2.tid !== 'coffeemaker') continue;
      if (!en.has(k2)) continue;
      const [rc, rr] = k2.split(',').map(Number);
      const rs = st(c2.tid, c2.lv);
      if (Math.hypot(rc - c, rr - r) <= rs.rng) rm *= (rs.bf || 1.2);
    }
    let tgt: Enemy | null = null, best = -1;
    for (const e of s.enemies) {
      if (dead.has(e.id)) continue;
      if (s.bossWallActive && EDEFS[e.type].bossAbility) continue; // wall protects boss
      const { x, y } = pxy(s.path, e.pi, e.pr);
      if (Math.hypot(x - cx, y - cy) > range) continue;
      const sc = e.pi + e.pr;
      if (sc > best) { best = sc; tgt = e; }
    }
    if (tgt) {
      s.timers[key] = 1 / (synSpd * rm);
      // Freeze tile wall redirect: damage goes to the wall instead of boss
      if (tgt.type === 'boss_massetsu' && s.freezeTileMode === 'wall' && s.freezeTileHP > 0) {
        const iceDmg = (cell.tid === 'kettle' || cell.tid === 'microwave' || cell.tid === 'oven' || cell.tid === 'ihcooker') ? synDmg * 2 : synDmg;
        s.freezeTileHP = Math.max(0, s.freezeTileHP - iceDmg);
        const { x: ex, y: ey } = pxy(s.path, tgt.pi, tgt.pr);
        s.effs.push({ id: uid(), x: ex, y: ey - 20, txt: `❄️-${Math.ceil(iceDmg)}`, life: 0.8, ml: 0.8, col: '#80d8ff' });
      } else {
        // Kettle/hot towers ALSO damage freeze curse tile while hitting boss
        if (s.freezeTileMode === 'curse' && s.freezeTileHP > 0 &&
            (cell.tid === 'kettle' || cell.tid === 'microwave' || cell.tid === 'oven' || cell.tid === 'ihcooker')) {
          s.freezeTileHP = Math.max(0, s.freezeTileHP - Math.ceil(synDmg * 0.5));
        }
        tgt.hp -= synDmg;
      }
      tgt.hitFlash = 0.1;
      const { x: ex, y: ey } = pxy(s.path, tgt.pi, tgt.pr);
      const projCol: Record<string, string> = {
        fridge:'#80deea', aircon:'#4fc3f7', kettle:'#ff7043', microwave:'#ff5722',
        fan:'#b3e5fc', vacuum:'#ce93d8', washer:'#26c6da', lamp:'#fff176',
        superpc:'#00e5ff', plasma:'#ffd700', theater:'#e91e63',
        toaster:'#ff8a65', dryer:'#ef9a9a', speaker:'#ce93d8', projector:'#ba68c8',
        tesla:'#7c4dff', ricecooker:'#f5f5f5', dishwasher:'#4dd0e1', oven:'#ff7043',
        coffeemaker:'#8d6e63', ihcooker:'#ffca28', tv:'#e040fb',
      };
      s.projs.push({ id: uid(), sx: cx, sy: cy, ex, ey, life: 0.18, col: projCol[cell.tid] || '#fff' });
      if (cell.tid === 'kettle' || cell.tid === 'microwave' || cell.tid === 'toaster' || cell.tid === 'dryer' || cell.tid === 'ricecooker' || cell.tid === 'oven' || cell.tid === 'ihcooker') {
        tgt.burning = 3; tgt.burnT = 0.5;
      }
      if (cell.tid === 'fridge' || cell.tid === 'aircon') tgt.frozen = 1.5;
      if ((cell.tid === 'speaker' && cell.lv >= 2) || cell.tid === 'dishwasher') tgt.frozen = 0.5;
      // TV: brainwash target (and 2nd target at Lv3)
      if (cell.tid === 'tv') {
        const brainDur = cell.lv >= 2 ? 5 : cell.lv >= 1 ? 4 : 3;
        if ((tgt.brainwashed ?? 0) <= 0) {
          tgt.brainwashed = brainDur;
          s.effs.push({ id: uid(), x: ex, y: ey, txt: '📺洗脳！', life: 1.2, ml: 1.2, col: '#e040fb' });
        }
        if (cell.lv >= 2 && S.abilityUnlock) {
          let second: Enemy | null = null; let sdist = Infinity;
          for (const e2 of s.enemies) {
            if (dead.has(e2.id) || e2.id === tgt.id || (e2.brainwashed ?? 0) > 0) continue;
            const { x: e2x, y: e2y } = pxy(s.path, e2.pi, e2.pr);
            const d2 = Math.hypot(e2x - cx, e2y - cy);
            if (d2 <= range && d2 < sdist) { sdist = d2; second = e2; }
          }
          if (second) {
            second.brainwashed = brainDur;
            second.hp -= Math.ceil(synDmg * 0.5);
            second.hitFlash = 0.1;
            const { x: sx2, y: sy2 } = pxy(s.path, second.pi, second.pr);
            s.projs.push({ id: uid(), sx: cx, sy: cy, ex: sx2, ey: sy2, life: 0.18, col: '#e040fb' });
            s.effs.push({ id: uid(), x: sx2, y: sy2, txt: '📺洗脳２！', life: 1.2, ml: 1.2, col: '#ce93d8' });
            if (second.hp <= 0) dead.add(second.id);
          }
        }
      }
      if (cell.tid === 'ihcooker' && cell.lv >= 2 && tgt.burning > 0) tgt.hp -= Math.ceil(synDmg * 0.35);
      if (cell.tid === 'fan' || cell.tid === 'vacuum' || cell.tid === 'washer') {
        const bk = cell.tid === 'fan' ? 0.45 : 0.22;
        tgt.pr -= bk;
        while (tgt.pr < 0 && tgt.pi > 0) { tgt.pi--; tgt.pr += 1; }
        if (tgt.pr < 0) tgt.pr = 0;
      }

      // ── AOE / Splash / Pierce for multi-target towers ──
      const aoeDmgMults: Partial<Record<TowerID, number>> = {
        blender: 0.70, washer: 0.85, aircon: 0.60, oven: 0.75,
        waffleiron: 0.75, promo_endless: 1.0,
      };
      const isTrueAoe = cell.tid in aoeDmgMults;
      const isDryerAoe = cell.tid === 'dryer' && cell.lv >= 2 && S.abilityUnlock;
      const isFryer = cell.tid === 'fryer';
      const isPlasma = cell.tid === 'plasma';

      // Helper: give rewards + light kill FX for AOE secondary kills
      const aoeKillFx = (e2: Enemy) => {
        s.power = Math.min(s.power + e2.rew, 999);
        s.ultGauge = Math.min(100, s.ultGauge + 2);
        const { x: kx, y: ky } = pxy(s.path, e2.pi, e2.pr);
        s.rings.push({ id: uid(), x: kx, y: ky, r: 3, maxR: 26, col: EDEFS[e2.type].col, life: 0.3, ml: 0.3, thick: 1.5 });
        for (let ki = 0; ki < 8; ki++) {
          const ka = (Math.PI * 2 / 8) * ki + Math.random() * 0.4;
          s.particles.push({ id: uid(), x: kx, y: ky, vx: Math.cos(ka) * (38 + Math.random() * 42), vy: Math.sin(ka) * (38 + Math.random() * 42) - 18, life: 0.5 + Math.random() * 0.25, ml: 0.75, col: EDEFS[e2.type].col, size: 2.5 + Math.random() * 2 });
        }
      };

      // Sector/fan half-angles (undefined = full 360° circle)
      const sectorHalfAngles: Partial<Record<TowerID, number>> = {
        blender: Math.PI / 2,       // ±90°  → 180° fan
        washer:  Math.PI * 2 / 3,   // ±120° → 240° fan
        aircon:  Math.PI * 5 / 12,  // ±75°  → 150° fan
        oven:    Math.PI * 5 / 12,  // ±75°  → 150° fan
        waffleiron: Math.PI / 3,    // ±60°  → 120° cone
        dryer:   Math.PI / 2,       // ±90°  → 180° fan
      };
      const sectorArcAngles: Partial<Record<TowerID, number>> = {
        blender: Math.PI,            washer:  Math.PI * 4 / 3,
        aircon:  Math.PI * 5 / 6,   oven:    Math.PI * 5 / 6,
        waffleiron: Math.PI * 2 / 3, dryer:  Math.PI,
      };
      // Direction from tower to primary target
      const tgtAngle = Math.atan2(ey - cy, ex - cx);

      if (isTrueAoe || isDryerAoe) {
        const dmgMult = isDryerAoe ? 0.55 : (aoeDmgMults[cell.tid as TowerID] ?? 0.7);
        const halfSect = isDryerAoe ? Math.PI / 2 : sectorHalfAngles[cell.tid as TowerID];
        let aoeHits = 0;
        for (const e2 of s.enemies) {
          if (dead.has(e2.id) || e2.id === tgt.id) continue;
          const { x: e2x, y: e2y } = pxy(s.path, e2.pi, e2.pr);
          if (Math.hypot(e2x - cx, e2y - cy) > range) continue;
          // Sector check: skip enemies outside the fan angle
          if (halfSect !== undefined) {
            const e2Angle = Math.atan2(e2y - cy, e2x - cx);
            let diff = Math.abs(e2Angle - tgtAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff > halfSect) continue;
          }
          const aoeDmg = Math.max(1, Math.ceil(synDmg * dmgMult));
          e2.hp -= aoeDmg;
          e2.hitFlash = 0.1;
          // Per-tower AOE status effects
          if (cell.tid === 'aircon') { e2.frozen = Math.max(e2.frozen, cell.lv >= 2 ? 2.0 : 1.5); }
          if (cell.tid === 'oven' || isDryerAoe) { e2.burning = Math.max(e2.burning, 2.5); e2.burnT = 0.5; }
          if (cell.tid === 'washer') {
            const pushBk = 0.3;
            e2.pr -= pushBk;
            while (e2.pr < 0 && e2.pi > 0) { e2.pi--; e2.pr += 1; }
            if (e2.pr < 0) e2.pr = 0;
          }
          if (cell.tid === 'blender') {
            if (cell.lv >= 2 && S.abilityUnlock) {
              e2.pr -= 0.15;
              while (e2.pr < 0 && e2.pi > 0) { e2.pi--; e2.pr += 1; }
              if (e2.pr < 0) e2.pr = 0;
            }
          }
          if (cell.tid === 'waffleiron' && cell.lv >= 2 && S.abilityUnlock) {
            e2.frozen = Math.max(e2.frozen, 1.2);
          }
          s.projs.push({ id: uid(), sx: cx, sy: cy, ex: e2x, ey: e2y, life: 0.15, col: projCol[cell.tid as TowerID] || '#fff' });
          if (e2.hp <= 0) { dead.add(e2.id); aoeKillFx(e2); }
          aoeHits++;
        }
        // AOE ring — sector fan for directional towers, full circle for promo_endless
        const aoeRingCol = projCol[cell.tid as TowerID] || '#fff';
        const arcAmt = cell.tid === 'promo_endless' ? undefined : (isDryerAoe ? Math.PI : sectorArcAngles[cell.tid as TowerID]);
        s.rings.push({
          id: uid(), x: cx, y: cy, r: CELL * 0.4, maxR: range * 0.92,
          col: aoeRingCol, life: 0.42, ml: 0.42,
          thick: cell.tid === 'promo_endless' ? 3 : 2,
          arc: arcAmt, arcDir: arcAmt !== undefined ? tgtAngle : undefined,
        });
        if (cell.tid === 'washer' && aoeHits > 0) {
          s.rings.push({ id: uid(), x: cx, y: cy, r: CELL * 0.4, maxR: range * 0.65, col: '#80deea', life: 0.3, ml: 0.3, thick: 1.5, arc: Math.PI * 4/3, arcDir: tgtAngle });
        }
        if (cell.tid === 'promo_endless') {
          s.rings.push({ id: uid(), x: cx, y: cy, r: CELL * 0.4, maxR: range * 0.7, col: '#ffd700', life: 0.32, ml: 0.32, thick: 1.5 });
          s.screenShake = Math.min(s.screenShake + 0.04, 0.2);
        }
      }

      if (isFryer) {
        // Splash explosion: damage all enemies near the primary target
        const { x: tx, y: ty } = pxy(s.path, tgt.pi, tgt.pr);
        const splashR = CELL * (cell.lv >= 2 ? 2.6 : 1.8);
        let splashHits = 0;
        for (const e2 of s.enemies) {
          if (dead.has(e2.id) || e2.id === tgt.id) continue;
          const { x: e2x, y: e2y } = pxy(s.path, e2.pi, e2.pr);
          if (Math.hypot(e2x - tx, e2y - ty) > splashR) continue;
          e2.hp -= Math.max(1, Math.ceil(synDmg * 0.60));
          e2.hitFlash = 0.1;
          e2.burning = Math.max(e2.burning, 2.5); e2.burnT = 0.5;
          s.projs.push({ id: uid(), sx: tx, sy: ty, ex: e2x, ey: e2y, life: 0.15, col: '#ffca28' });
          if (e2.hp <= 0) { dead.add(e2.id); aoeKillFx(e2); }
          splashHits++;
        }
        // Explosion rings at target
        s.rings.push({ id: uid(), x: tx, y: ty, r: CELL * 0.3, maxR: splashR, col: '#ffca28', life: 0.45, ml: 0.45, thick: 2.5 });
        s.rings.push({ id: uid(), x: tx, y: ty, r: CELL * 0.3, maxR: splashR * 0.55, col: '#ff5722', life: 0.3, ml: 0.3, thick: 1.5 });
        if (splashHits > 0) s.screenShake = Math.min(s.screenShake + 0.06, 0.25);
      }

      if (isPlasma) {
        // Pierce beam: full damage to ALL enemies in range (true AOE殲滅)
        const pierceMult = cell.lv >= 2 ? 1.3 : 1.0;
        for (const e2 of s.enemies) {
          if (dead.has(e2.id) || e2.id === tgt.id) continue;
          const { x: e2x, y: e2y } = pxy(s.path, e2.pi, e2.pr);
          if (Math.hypot(e2x - cx, e2y - cy) > range) continue;
          e2.hp -= Math.max(1, Math.ceil(synDmg * pierceMult));
          e2.hitFlash = 0.1;
          s.projs.push({ id: uid(), sx: cx, sy: cy, ex: e2x, ey: e2y, life: 0.22, col: '#ffd700' });
          if (e2.hp <= 0) { dead.add(e2.id); aoeKillFx(e2); }
        }
        // Plasma blast rings
        s.rings.push({ id: uid(), x: cx, y: cy, r: CELL * 0.5, maxR: range * 0.85, col: '#ffd700', life: 0.42, ml: 0.42, thick: 3 });
        s.rings.push({ id: uid(), x: cx, y: cy, r: CELL * 0.5, maxR: range * 0.55, col: '#ffffffcc', life: 0.28, ml: 0.28, thick: 1.5 });
        s.screenShake = Math.min(s.screenShake + 0.06, 0.25);
      }

      // Chain lightning for tesla
      if (cell.tid === 'tesla' && cell.lv >= 2) {
        let chainTarget = tgt;
        for (let chain = 0; chain < 3; chain++) {
          const { x: cx2, y: cy2 } = pxy(s.path, chainTarget.pi, chainTarget.pr);
          let nextTarget: Enemy | null = null;
          let nd = Infinity;
          for (const e of s.enemies) {
            if (dead.has(e.id) || e.id === chainTarget.id) continue;
            const { x, y } = pxy(s.path, e.pi, e.pr);
            const d = Math.hypot(x - cx2, y - cy2);
            if (d < nd && d < CELL * 3) { nd = d; nextTarget = e; }
          }
          if (nextTarget) {
            nextTarget.hp -= Math.ceil(synDmg * 0.5);
            nextTarget.hitFlash = 0.1;
            const { x: nx, y: ny } = pxy(s.path, nextTarget.pi, nextTarget.pr);
            s.projs.push({ id: uid(), sx: cx2, sy: cy2, ex: nx, ey: ny, life: 0.12, col: '#7c4dff' });
            if (nextTarget.hp <= 0) dead.add(nextTarget.id);
            chainTarget = nextTarget;
          } else break;
        }
      }

      // ── Hit particles (every hit, small sparks) ──
      {
        const { x: hx, y: hy } = pxy(s.path, tgt.pi, tgt.pr);
        const hitCol = projCol[cell.tid] || '#fff8';
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          s.particles.push({ id: uid(), x: hx, y: hy, vx: Math.cos(angle) * (25 + Math.random() * 35), vy: Math.sin(angle) * (25 + Math.random() * 35) - 20, life: 0.2 + Math.random() * 0.15, ml: 0.35, col: hitCol, size: 1.5 + Math.random() * 1.5 });
        }
      }

      if (tgt.hp <= 0) {
        dead.add(tgt.id);
        s.power = Math.min(s.power + tgt.rew, 999);
        const isBoss = tgt.type.startsWith('boss') || tgt.type === 'final_boss';
        s.ultGauge = Math.min(100, s.ultGauge + (isBoss ? 25 : 3));
        const { x, y } = pxy(s.path, tgt.pi, tgt.pr);
        const eCol = EDEFS[tgt.type].col;
        // Reward float text
        s.effs.push({ id: uid(), x, y, txt: isBoss ? `💥+${tgt.rew}W 撃破！` : `+${tgt.rew}W`, life: isBoss ? 2.2 : 1.2, ml: isBoss ? 2.2 : 1.2, col: '#ffd700' });
        // Kill shockwave ring
        const killMaxR = isBoss ? 90 : tgt.type === 'dust_lord' ? 55 : 38;
        s.rings.push({ id: uid(), x, y, r: 4, maxR: killMaxR, col: eCol, life: 0.55, ml: 0.55, thick: isBoss ? 3.5 : 2 });
        if (isBoss) {
          s.rings.push({ id: uid(), x, y, r: 4, maxR: 65, col: '#ffd700', life: 0.75, ml: 0.75, thick: 2 });
          s.screenShake = Math.min(s.screenShake + 0.55, 1.2);
        }
        // Kill particle burst
        const pCount = isBoss ? 28 : tgt.type === 'dust_lord' ? 18 : 14;
        for (let i = 0; i < pCount; i++) {
          const angle = (Math.PI * 2 / pCount) * i + Math.random() * 0.4;
          const spd = isBoss ? (90 + Math.random() * 130) : (55 + Math.random() * 85);
          s.particles.push({ id: uid(), x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 25, life: (isBoss ? 1.3 : 0.75) + Math.random() * 0.3, ml: isBoss ? 1.6 : 1.05, col: eCol, size: isBoss ? (5 + Math.random() * 7) : (3 + Math.random() * 4) });
        }
        // Gold accent particles on boss kill
        if (isBoss) {
          for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            s.particles.push({ id: uid(), x, y, vx: Math.cos(angle) * (60 + Math.random() * 80), vy: Math.sin(angle) * (60 + Math.random() * 80) - 40, life: 1.0 + Math.random() * 0.4, ml: 1.4, col: '#ffd700', size: 3 + Math.random() * 4 });
          }
        }
      }
    }
  }

  // Dust lord multiply: spawn small dusts on death + AOE explosion
  const newSpawns: typeof s.enemies = [];
  for (const e of s.enemies) {
    if (dead.has(e.id) && EDEFS[e.type].special === 'multiply') {
      const spawnCount = 3;
      for (let k = 0; k < spawnCount; k++) {
        newSpawns.push({
          id: uid(), type: 'dust' as EnemyType,
          hp: 40, mhp: 40, spd: 58, rew: 6, dmg: 1,
          pi: e.pi, pr: e.pr + (k * 0.01),
          hitFlash: 0, frozen: 0, burning: 0, burnT: 0,
          em: EDEFS['dust' as EnemyType]?.em ?? '💨',
        });
      }
      const { x, y } = pxy(s.path, e.pi, e.pr);
      s.effs.push({ id: uid(), x, y, txt: '💨×3爆散！', life: 1.5, ml: 1.5, col: '#90a4ae' });
      // AOE explosion ring + particles
      s.rings.push({ id: uid(), x, y, r: 5, maxR: 58, col: '#9e9e9e', life: 0.5, ml: 0.5, thick: 2.5 });
      s.rings.push({ id: uid(), x, y, r: 5, maxR: 35, col: '#eeeeee', life: 0.35, ml: 0.35, thick: 1.5 });
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 / 14) * i + Math.random() * 0.3;
        s.particles.push({ id: uid(), x, y, vx: Math.cos(angle) * (60 + Math.random() * 60), vy: Math.sin(angle) * (60 + Math.random() * 60) - 20, life: 0.6 + Math.random() * 0.3, ml: 0.9, col: i % 2 === 0 ? '#9e9e9e' : '#e0e0e0', size: 3 + Math.random() * 3 });
      }
      // AOE power drain on nearby towers
      for (const k of Object.keys(s.grid)) {
        const [gc, gr] = k.split(',').map(Number);
        if (Math.hypot(gc * CELL + CELL/2 - x, gr * CELL + CELL/2 - y) < CELL * 2.8) {
          if (!s.disabledTowers.has(k)) {
            s.disabledTowers.add(k);
            const rem = k; setTimeout(() => s.disabledTowers.delete(rem), 1200);
          }
        }
      }
      s.screenShake = Math.min(s.screenShake + 0.2, 0.6);
    }
  }

  s.enemies = s.enemies.filter(e => !dead.has(e.id));
  s.enemies.push(...newSpawns);
  s.projs.forEach(p => p.life -= dt);
  s.projs = s.projs.filter(p => p.life > 0);
  s.effs.forEach(e => e.life -= dt);
  s.effs = s.effs.filter(e => e.life > 0);
  s.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.life -= dt; });
  s.particles = s.particles.filter(p => p.life > 0);
  // Rings: grow outward and fade
  s.rings.forEach(r => { const grow = (r.maxR - r.r) * Math.min(1, dt * 6); r.r += grow; r.life -= dt; });
  s.rings = s.rings.filter(r => r.life > 0);

  if (s.waveActive && s.spawnQ.length === 0 && s.enemies.length === 0) {
    s.waveActive = false;
    if (!s.endless && s.wave >= waves.length) s.win = true;
  }
};
