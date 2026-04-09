// ── Core Game Types ──

export type DifficultyKey = 'easy' | 'normal' | 'hard' | 'vhard' | 'extreme';

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
  | 'cord' | 'kettle'                     // C
  | 'fan' | 'lamp' | 'toaster'            // U
  | 'vacuum' | 'router' | 'dryer'         // R
  | 'fridge' | 'aircon' | 'speaker'       // E
  | 'microwave' | 'washer'                // L
  | 'theater' | 'projector'               // M
  | 'superpc' | 'tesla'                   // G
  | 'plasma';                             // OD

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
  ability?: 'pushback' | 'firetrap' | 'slowfield' | 'chainlightning' | 'energyshield';
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
  abilityUnlock?: boolean; // Lv3 unlocks special ability
}

export interface TowerStats extends TowerDef, UpgradeLevel {
  lv: number;
}

export type EnemyType = 'dust' | 'fast_dust' | 'slime' | 'tank_slime' | 'magnet' | 'virus' | 'boss' | 'boss_ice' | 'boss_fire' | 'final_boss';

export interface EnemyDef {
  em: string;
  hp: number;
  spd: number;
  rew: number;
  dmg: number;
  col: string;
  name?: string;
  bossAbility?: 'warp' | 'wall' | 'speed_buff' | 'unit_disable';
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

export interface FireTrap {
  id: number;
  x: number;
  y: number;
  life: number;
  dmg: number;
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
  shielded?: boolean;
  speedBuff?: number;
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

// Area system
export type AreaKey = 'suburb' | 'factory' | 'downtown' | 'volcano' | 'glacier';

export interface AreaDef {
  name: string;
  em: string;
  desc: string;
  col: string;
  waves: WaveGroup[][];
  unlockArea?: AreaKey; // must clear this area first
  hasBoss: boolean;
  bossType?: EnemyType;
}

export interface GameState {
  grid: Record<string, GridCell>;
  timers: Record<string, number>;
  abilityTimers: Record<string, number>;
  enemies: Enemy[];
  projs: Projectile[];
  effs: FloatEffect[];
  particles: Particle[];
  fireTraps: FireTrap[];
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
  area: AreaKey;
  screenShake: number;
  team: TowerID[];
  disabledTowers: Set<string>; // temporarily disabled by boss
  bossWallActive: boolean;
  bossWallTimer: number;
}

export interface UIState {
  power: number;
  wave: number;
  baseHP: number;
  maxHP: number;
  wActive: boolean;
  over: boolean;
  win: boolean;
  area: AreaKey;
}

export interface HighScoreEntry {
  diff: DifficultyKey;
  area?: AreaKey;
  wave: number;
  won: boolean;
  date: string;
  power: number;
}

// Gacha
export type GachaBannerType = 'normal' | 'premium' | 'limited';

export interface GachaBanner {
  id: GachaBannerType;
  name: string;
  em: string;
  cost1: number;
  cost10: number;
  desc: string;
  col: string;
  rateBoost?: Partial<Record<Rarity, number>>; // override rates
  pickup?: TowerID;
}

export interface GachaInventory {
  owned: TowerID[];
  volts: number;
}

export const GACHA_COST = 100;
export const GACHA_COST_10 = 900;

// Commercial-grade stricter rates
export const GACHA_RATES: Record<Rarity, number> = {
  C: 0.45, U: 0.28, R: 0.13, E: 0.07,
  L: 0.035, M: 0.02, G: 0.008, OD: 0.003,
};

export const GACHA_BANNERS: GachaBanner[] = [
  {
    id: 'normal',
    name: 'ノーマルガチャ',
    em: '🎰',
    cost1: 100,
    cost10: 900,
    desc: '標準的な排出率のガチャ',
    col: '#7c3aed',
  },
  {
    id: 'premium',
    name: 'プレミアムガチャ',
    em: '💎',
    cost1: 200,
    cost10: 1800,
    desc: 'レア以上の確率2倍！',
    col: '#c026d3',
    rateBoost: { R: 0.30, E: 0.24, L: 0.12, M: 0.08, G: 0.04, OD: 0.02, C: 0.10, U: 0.10 },
  },
  {
    id: 'limited',
    name: '限定ガチャ',
    em: '🌟',
    cost1: 300,
    cost10: 2700,
    desc: 'OD確率5倍！ピックアップ付き',
    col: '#ffd700',
    rateBoost: { OD: 0.05, G: 0.05, M: 0.08, L: 0.10, E: 0.15, R: 0.20, U: 0.20, C: 0.17 },
    pickup: 'plasma',
  },
];

export const WAVE_VOLT_REWARD = (wave: number): number => 40 + wave * 20;
