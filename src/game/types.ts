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

export type TowerID =
  | 'cord' | 'kettle'         // C
  | 'fan' | 'lamp'            // U
  | 'vacuum' | 'router'       // R
  | 'fridge' | 'aircon'       // E
  | 'microwave' | 'washer'    // L
  | 'theater'                 // M
  | 'superpc'                 // G
  | 'plasma';                 // OD

export type Rarity = 'C' | 'U' | 'R' | 'E' | 'L' | 'M' | 'G' | 'OD';

export const RARITY_ORDER: Rarity[] = ['C', 'U', 'R', 'E', 'L', 'M', 'G', 'OD'];

export const RARITY_LABEL: Record<Rarity, string> = {
  C: 'コモン', U: 'アンコモン', R: 'レア', E: 'エピック',
  L: 'レジェンド', M: 'ミシック', G: 'ギャラクシー', OD: 'オーバードライブ',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  C: '#9e9e9e', U: '#4caf50', R: '#2196f3', E: '#ab47bc',
  L: '#ff9800', M: '#e91e63', G: '#00e5ff', OD: '#ffd700',
};

export const RARITY_BG: Record<Rarity, string> = {
  C: '#1a1a1a', U: '#0d2a12', R: '#0a1f3a', E: '#1f0a2a',
  L: '#2a1a00', M: '#2a0a1a', G: '#002a2a', OD: '#2a2200',
};

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

export type EnemyType = 'dust' | 'slime' | 'magnet' | 'virus' | 'boss';

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
  hitFlash: number;
  marked: boolean;
  slowed: boolean;
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
  team: TowerID[];
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

// Gacha
export interface GachaInventory {
  owned: TowerID[];
  volts: number;
}

export const GACHA_COST = 100;
export const GACHA_COST_10 = 900;

export const GACHA_RATES: Record<Rarity, number> = {
  C: 0.35, U: 0.25, R: 0.15, E: 0.12,
  L: 0.06, M: 0.04, G: 0.02, OD: 0.01,
};

export const WAVE_VOLT_REWARD = (wave: number): number => 40 + wave * 20;
