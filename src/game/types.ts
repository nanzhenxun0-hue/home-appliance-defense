// ── Core Game Types ──

export type DifficultyKey = 'easy' | 'normal' | 'hard' | 'lunatic';

export interface DifficultyDef {
  label: string;
  em: string;
  col: string;
  dark: string;
  desc: string;
  hpM: number;
  spdM: number;
  sp: number;
  shp: number;
  wg: number;
}

export type TowerID = 'cord' | 'kettle' | 'fan' | 'vacuum' | 'router' | 'fridge';
export type Rarity = 'C' | 'U' | 'R';

export interface TowerDef {
  n: string;
  em: string;
  r: Rarity;
  rc: string;
  baseCost: number;
  req: TowerID | null;
}

export interface UpgradeLevel {
  c: number;
  pg: number;
  pc: number;
  dmg: number;
  rng: number;
  spd: number;
  lbl: string;
  eff: string;
  bf?: number;
}

export interface TowerStats extends TowerDef, UpgradeLevel {
  lv: number;
}

export type EnemyType = 'dust' | 'slime' | 'magnet';

export interface EnemyDef {
  em: string;
  hp: number;
  spd: number;
  rew: number;
  dmg: number;
  col: string;
}

export interface WaveGroup {
  t: EnemyType;
  n: number;
  gap: number;
}

export interface GridCell {
  tid: TowerID;
  lv: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  em: string;
  hp: number;
  mhp: number;
  spd: number;
  rew: number;
  dmg: number;
  pi: number;
  pr: number;
  frozen: number;
  burning: number;
  burnT: number;
  hitFlash: number; // hit flash timer
}

export interface Projectile {
  id: number;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  life: number;
  col: string;
}

export interface FloatEffect {
  id: number;
  x: number;
  y: number;
  txt: string;
  life: number;
  ml: number;
  col: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ml: number;
  col: string;
  size: number;
}

export interface SpawnItem {
  type: EnemyType;
  at: number;
}

export interface GameState {
  grid: Record<string, GridCell>;
  timers: Record<string, number>;
  enemies: Enemy[];
  projs: Projectile[];
  effs: FloatEffect[];
  particles: Particle[];
  power: number;
  wave: number;
  baseHP: number;
  maxHP: number;
  waveActive: boolean;
  spawnQ: SpawnItem[];
  waveT: number;
  powerT: number;
  over: boolean;
  win: boolean;
  diff: DifficultyKey;
  screenShake: number;
}

export interface UIState {
  power: number;
  wave: number;
  baseHP: number;
  maxHP: number;
  wActive: boolean;
  over: boolean;
  win: boolean;
}

export interface HighScoreEntry {
  diff: DifficultyKey;
  wave: number;
  won: boolean;
  date: string;
  power: number;
}
