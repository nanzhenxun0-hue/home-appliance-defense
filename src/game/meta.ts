// やり込み要素の定義: 実績 / ミッション / チャレンジ
import type { DifficultyKey, AreaKey } from './types';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  volts: number;
  check: (p: ProgressSnapshot) => boolean;
}

export interface Mission {
  id: string;
  name: string;
  target: number;
  volts: number;
  // Which counter to check against (from ProgressSnapshot.daily or .weekly)
  metric: MissionMetric;
  scope: 'daily' | 'weekly';
}

export type MissionMetric =
  | 'pulls'
  | 'waveClears'
  | 'gameWins'
  | 'voltsEarned'
  | 'bestWave'
  | 'endlessWave'
  | 'odDrops';

export interface ChallengeMod {
  id: string;
  name: string;
  desc: string;
  icon: string;
  diff: DifficultyKey;
  area: AreaKey;
  volts: number;
  // Runtime modifiers applied in GameScreen
  startPowerMul?: number;   // e.g. 0.5 = half
  noUpgrade?: boolean;
  noUltimate?: boolean;
  enemyHpMul?: number;      // 1.5 = tougher
}

export interface ProgressSnapshot {
  // Lifetime
  totalWaves: number;
  totalPulls: number;
  totalWins: number;
  totalVolts: number;
  odDrops: number;
  endlessBest: number;
  extremeClears: string[];      // AreaKey list
  challengeClears: string[];    // Challenge id list
  achievementsUnlocked: string[];

  // Daily bucket
  dailyKey: string;
  daily: Record<MissionMetric, number>;

  // Weekly bucket
  weeklyKey: string;
  weekly: Record<MissionMetric, number>;

  // Missions active for the current period
  activeDaily: string[];        // mission ids
  activeWeekly: string[];       // mission ids
  claimedDaily: string[];
  claimedWeekly: string[];

  // Login streak
  loginStreak: number;
  lastLoginDate: string;
}

export const EMPTY_METRICS: Record<MissionMetric, number> = {
  pulls: 0, waveClears: 0, gameWins: 0, voltsEarned: 0, bestWave: 0, endlessWave: 0, odDrops: 0,
};

// ── Achievements ──
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win',   name: '初勝利',           desc: '初めてステージをクリアする', icon: '🎖️', volts: 100, check: p => p.totalWins >= 1 },
  { id: 'win_10',      name: '常勝将軍',         desc: '通算10ステージクリア',       icon: '🏅', volts: 300, check: p => p.totalWins >= 10 },
  { id: 'waves_100',   name: '波状攻撃',         desc: '通算100ウェーブ突破',        icon: '🌊', volts: 300, check: p => p.totalWaves >= 100 },
  { id: 'waves_500',   name: '不屈の戦士',       desc: '通算500ウェーブ突破',        icon: '⚔️', volts: 800, check: p => p.totalWaves >= 500 },
  { id: 'pulls_1',     name: 'ガチャデビュー',   desc: '初めてガチャを引く',         icon: '🎰', volts: 50,  check: p => p.totalPulls >= 1 },
  { id: 'pulls_100',   name: '100連達成',         desc: '通算100回ガチャを引く',      icon: '🎲', volts: 500, check: p => p.totalPulls >= 100 },
  { id: 'od_10',       name: 'レア収集家',       desc: 'OD以上を10体入手',           icon: '💎', volts: 500, check: p => p.odDrops >= 10 },
  { id: 'endless_50',  name: 'エンドレス50',     desc: 'エンドレスでWave50到達',     icon: '♾️', volts: 500, check: p => p.endlessBest >= 50 },
  { id: 'endless_100', name: 'エンドレス100',    desc: 'エンドレスでWave100到達',    icon: '🌌', volts: 1000, check: p => p.endlessBest >= 100 },
  { id: 'extreme_all', name: '極クリア制覇',     desc: '全エリアを極でクリア',       icon: '👑', volts: 2000, check: p => p.extremeClears.length >= 6 },
  { id: 'chal_all',    name: 'チャレンジ制覇',   desc: '全チャレンジをクリア',       icon: '🔥', volts: 1000, check: p => p.challengeClears.length >= CHALLENGES.length },
  { id: 'streak_7',    name: '皆勤賞',           desc: '7日連続ログイン',            icon: '📅', volts: 500, check: p => p.loginStreak >= 7 },
];

// ── Mission Pool ──
export const MISSION_POOL: Mission[] = [
  // Daily
  { id: 'd_pull3',    name: 'ガチャを3回引く',     target: 3,   volts: 60,  metric: 'pulls',       scope: 'daily' },
  { id: 'd_pull10',   name: '10連ガチャを引く',    target: 10,  volts: 150, metric: 'pulls',       scope: 'daily' },
  { id: 'd_waves20',  name: '合計20ウェーブ突破',  target: 20,  volts: 100, metric: 'waveClears',  scope: 'daily' },
  { id: 'd_wave15',   name: '1戦でWave15まで進む', target: 15,  volts: 120, metric: 'bestWave',    scope: 'daily' },
  { id: 'd_win1',     name: 'ステージを1回クリア', target: 1,   volts: 80,  metric: 'gameWins',    scope: 'daily' },
  { id: 'd_win3',     name: 'ステージを3回クリア', target: 3,   volts: 200, metric: 'gameWins',    scope: 'daily' },
  { id: 'd_volts500', name: '500ボルト獲得',        target: 500, volts: 100, metric: 'voltsEarned', scope: 'daily' },
  { id: 'd_endless20', name: 'エンドレスWave20到達', target: 20, volts: 150, metric: 'endlessWave', scope: 'daily' },
  // Weekly
  { id: 'w_pull50',    name: '週間50回ガチャ',       target: 50,   volts: 500,  metric: 'pulls',       scope: 'weekly' },
  { id: 'w_waves200',  name: '週間200ウェーブ突破',  target: 200,  volts: 400,  metric: 'waveClears',  scope: 'weekly' },
  { id: 'w_win10',     name: '週間10ステージクリア', target: 10,   volts: 500,  metric: 'gameWins',    scope: 'weekly' },
  { id: 'w_od3',       name: '週間OD以上×3',         target: 3,    volts: 600,  metric: 'odDrops',     scope: 'weekly' },
  { id: 'w_endless40', name: '週間エンドレスWave40', target: 40,   volts: 700,  metric: 'endlessWave', scope: 'weekly' },
  { id: 'w_volts3000', name: '週間3000ボルト獲得',   target: 3000, volts: 500,  metric: 'voltsEarned', scope: 'weekly' },
];

// ── Challenges ──
export const CHALLENGES: ChallengeMod[] = [
  {
    id: 'eco',
    name: 'エコモード',
    desc: '開始電力半減。効率的な配置が鍵',
    icon: '🌱',
    diff: 'hard',
    area: 'suburb',
    volts: 500,
    startPowerMul: 0.5,
  },
  {
    id: 'no_upgrade',
    name: 'ノーアップグレード',
    desc: 'アップグレード禁止。物量で圧倒せよ',
    icon: '🚫',
    diff: 'normal',
    area: 'factory',
    volts: 500,
    noUpgrade: true,
  },
  {
    id: 'no_ult',
    name: 'ウルト封印',
    desc: '必殺技禁止。純粋な火力勝負',
    icon: '⚡',
    diff: 'hard',
    area: 'downtown',
    volts: 600,
    noUltimate: true,
  },
  {
    id: 'tough',
    name: '強敵襲来',
    desc: '敵HP1.5倍。長期戦を制せ',
    icon: '💀',
    diff: 'normal',
    area: 'volcano',
    volts: 700,
    enemyHpMul: 1.5,
  },
];

// ── Date helpers ──
export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const thisWeekKey = (): string => {
  const d = new Date();
  // ISO week (Mon start)
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((+t - +yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${wk}`;
};

// Pick 3 random daily + 3 weekly missions
export const rollMissions = (scope: 'daily' | 'weekly', count = 3): string[] => {
  const pool = MISSION_POOL.filter(m => m.scope === scope);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(m => m.id);
};
