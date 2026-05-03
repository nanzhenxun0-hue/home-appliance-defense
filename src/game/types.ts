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
  | 'plasma'                              // OD
  | 'ricecooker' | 'dishwasher' | 'oven' | 'coffeemaker' | 'ihcooker';

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

export type PersonalityType = '熱血漢' | '冷静沈着' | '縁の下の力持ち' | '完璧主義者' | '自由奔放' | '情報通' | 'カリスマ' | '幻想家' | '職人気質' | '快活' | '明察眼' | '天才型' | '超論理型' | '狂天才' | '破壊神' | '頼れる兄貴';

export const PERSONALITY_BONUS: Record<PersonalityType, { label: string; icon: string }> = {
  '熱血漢':     { label: 'ATK +12%',    icon: '🔥' },
  '冷静沈着':   { label: '凍結時間+20%', icon: '❄️' },
  '縁の下の力持ち':{ label: '電力供給+20%', icon: '🔋' },
  '完璧主義者': { label: '吸引範囲+15%', icon: '🎯' },
  '自由奔放':   { label: '範囲+15%',    icon: '🌀' },
  '情報通':     { label: 'シナジー+10%', icon: '📡' },
  'カリスマ':   { label: 'シナジー+25%', icon: '✨' },
  '幻想家':     { label: 'ATK範囲+25%', icon: '🌠' },
  '職人気質':   { label: '炎ダメ+15%',  icon: '🍞' },
  '快活':       { label: '攻速+10%',    icon: '💨' },
  '明察眼':     { label: '射程+8%',     icon: '💡' },
  '天才型':     { label: 'スロー+20%',  icon: '🔊' },
  '超論理型':   { label: 'チェーン+20%',icon: '💻' },
  '狂天才':     { label: '雷ヒット+1',   icon: '⚡' },
  '破壊神':     { label: 'AOE+30%',    icon: '🔱' },
  '頼れる兄貴': { label: '基地HP回復',   icon: '🌊' },
};

export interface TowerDef {
  n: string;
  em: string;
  r: Rarity;
  rc: string;
  baseCost: number;
  req: TowerID | null;
  ability?: 'pushback' | 'firetrap' | 'slowfield' | 'chainlightning' | 'energyshield' | 'steam' | 'wash' | 'bake' | 'caffeine' | 'induction';
  personality?: PersonalityType;
  quote?: string;
  /** 固有スキル名（図鑑/UI表示用） */
  skillName?: string;
  /** 固有スキルの説明（Lv3で開花する切り札） */
  skillDesc?: string;
  /** 役割タグ（DPS/サポート/タンク/CC等） */
  role?: string;
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

export type EnemyType =
  | 'dust' | 'fast_dust' | 'slime' | 'tank_slime' | 'magnet' | 'virus'
  | 'cockroach' | 'mold' | 'surge' | 'dust_lord'
  | 'boss' | 'boss_ice' | 'boss_fire' | 'final_boss';

export interface EnemyDef {
  em: string;
  hp: number;
  spd: number;
  rew: number;
  dmg: number;
  col: string;
  name?: string;
  bossAbility?: 'warp' | 'wall' | 'speed_buff' | 'unit_disable';
  special?: 'clog' | 'corrode' | 'surge_stun' | 'multiply'; // new enemy specials
  pixel?: boolean; // draw in pixel art style
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
  clogTimer?: number;   // cockroach: clogs a tower
  corrodeTimer?: number; // mold: corrodes towers over time
  surgeStun?: number;   // electrical surge stun duration
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
  // Ult system
  ultGauge: number;       // 0-100
  ultActive: boolean;
  ultTimer: number;
  // Clog: cockroach ability - map of tower key -> clog duration remaining
  cloggedTowers: Map<string, number>;
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
  ultGauge: number;
  ultActive: boolean;
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
  chips: number;
}

export const GACHA_COST = 100;
export const GACHA_COST_10 = 900;

// Commercial-grade stricter rates
export const GACHA_RATES: Record<Rarity, number> = {
  C: 0.45, U: 0.279, R: 0.13, E: 0.07,
  L: 0.035, M: 0.02, G: 0.008, OD: 0.004,
};

export const GACHA_BANNERS: GachaBanner[] = [
  {
    id: 'normal',
    name: 'ノーマル配送',
    em: '🚚',
    cost1: 100,
    cost10: 900,
    desc: '標準の家電配送。茶色いダンボールで届きます',
    col: '#7c3aed',
  },
  {
    id: 'premium',
    name: 'プレミアム配送',
    em: '🚛',
    cost1: 250,
    cost10: 2250,
    desc: '「精密機器取り扱い注意」シール付き！レア以上UP',
    col: '#c026d3',
    rateBoost: { C: 0.20, U: 0.25, R: 0.22, E: 0.15, L: 0.08, M: 0.05, G: 0.03, OD: 0.02 },
  },
  {
    id: 'limited',
    name: '限定高級配送',
    em: '✨',
    cost1: 400,
    cost10: 3600,
    desc: '化粧箱入り超高級配送！OD確率10倍＋ピックアップ',
    col: '#ffd700',
    rateBoost: { C: 0.15, U: 0.20, R: 0.20, E: 0.15, L: 0.10, M: 0.08, G: 0.05, OD: 0.07 },
    pickup: 'plasma',
  },
];

export const WAVE_VOLT_REWARD = (wave: number): number => 40 + wave * 20;
