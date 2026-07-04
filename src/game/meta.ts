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
  // Wins
  { id: 'first_win',   name: '初勝利',           desc: '初めてステージをクリアする', icon: '🎖️', volts: 100, check: p => p.totalWins >= 1 },
  { id: 'win_10',      name: '常勝将軍',         desc: '通算10ステージクリア',       icon: '🏅', volts: 300, check: p => p.totalWins >= 10 },
  { id: 'win_50',      name: '歴戦の勇者',       desc: '通算50ステージクリア',       icon: '🏆', volts: 800, check: p => p.totalWins >= 50 },
  { id: 'win_200',     name: '伝説の指揮官',     desc: '通算200ステージクリア',      icon: '👑', volts: 2500, check: p => p.totalWins >= 200 },
  // Waves
  { id: 'waves_100',   name: '波状攻撃',         desc: '通算100ウェーブ突破',        icon: '🌊', volts: 300, check: p => p.totalWaves >= 100 },
  { id: 'waves_500',   name: '不屈の戦士',       desc: '通算500ウェーブ突破',        icon: '⚔️', volts: 800, check: p => p.totalWaves >= 500 },
  { id: 'waves_2000',  name: '津波の英雄',       desc: '通算2000ウェーブ突破',       icon: '🌀', volts: 2000, check: p => p.totalWaves >= 2000 },
  { id: 'waves_5000',  name: '時空の守護者',     desc: '通算5000ウェーブ突破',       icon: '🕰️', volts: 5000, check: p => p.totalWaves >= 5000 },
  // Gacha
  { id: 'pulls_1',     name: 'ガチャデビュー',   desc: '初めてガチャを引く',         icon: '🎰', volts: 50,  check: p => p.totalPulls >= 1 },
  { id: 'pulls_100',   name: '100連達成',         desc: '通算100回ガチャを引く',      icon: '🎲', volts: 500, check: p => p.totalPulls >= 100 },
  { id: 'pulls_500',   name: 'ガチャ中毒',       desc: '通算500回ガチャを引く',      icon: '🎴', volts: 1500, check: p => p.totalPulls >= 500 },
  { id: 'pulls_1000',  name: 'ガチャ廃人',       desc: '通算1000回ガチャを引く',     icon: '💠', volts: 3000, check: p => p.totalPulls >= 1000 },
  // OD / Rare
  { id: 'od_1',        name: '初OD',             desc: 'OD以上を初入手',             icon: '✨', volts: 100, check: p => p.odDrops >= 1 },
  { id: 'od_10',       name: 'レア収集家',       desc: 'OD以上を10体入手',           icon: '💎', volts: 500, check: p => p.odDrops >= 10 },
  { id: 'od_30',       name: 'OD愛好家',         desc: 'OD以上を30体入手',           icon: '🔷', volts: 1200, check: p => p.odDrops >= 30 },
  { id: 'od_100',      name: 'OD王',             desc: 'OD以上を100体入手',          icon: '🔶', volts: 3000, check: p => p.odDrops >= 100 },
  // Volts
  { id: 'volts_10k',   name: '一万ボルト',       desc: '通算10,000ボルト獲得',       icon: '⚡', volts: 500, check: p => p.totalVolts >= 10000 },
  { id: 'volts_100k',  name: '雷神の使徒',       desc: '通算100,000ボルト獲得',      icon: '⚡', volts: 2000, check: p => p.totalVolts >= 100000 },
  // Endless
  { id: 'endless_20',  name: 'エンドレス20',     desc: 'エンドレスでWave20到達',     icon: '♾️', volts: 200, check: p => p.endlessBest >= 20 },
  { id: 'endless_50',  name: 'エンドレス50',     desc: 'エンドレスでWave50到達',     icon: '♾️', volts: 500, check: p => p.endlessBest >= 50 },
  { id: 'endless_100', name: 'エンドレス100',    desc: 'エンドレスでWave100到達',    icon: '🌌', volts: 1000, check: p => p.endlessBest >= 100 },
  { id: 'endless_200', name: 'エンドレス200',    desc: 'エンドレスでWave200到達',    icon: '🌠', volts: 3000, check: p => p.endlessBest >= 200 },
  { id: 'endless_500', name: '深淵の探索者',     desc: 'エンドレスでWave500到達',    icon: '🕳️', volts: 8000, check: p => p.endlessBest >= 500 },
  // Extreme / Area
  { id: 'extreme_1',   name: '極を知る',         desc: '極難度を初クリア',           icon: '🔥', volts: 500, check: p => p.extremeClears.length >= 1 },
  { id: 'extreme_3',   name: '極の中堅',         desc: '3エリアを極でクリア',        icon: '🔥', volts: 1200, check: p => p.extremeClears.length >= 3 },
  { id: 'extreme_all', name: '極クリア制覇',     desc: '全エリアを極でクリア',       icon: '👑', volts: 2000, check: p => p.extremeClears.length >= 6 },
  // Challenges
  { id: 'chal_1',      name: 'チャレンジ挑戦',   desc: 'チャレンジを1つクリア',      icon: '🎯', volts: 300, check: p => p.challengeClears.length >= 1 },
  { id: 'chal_half',   name: 'チャレンジャー',   desc: 'チャレンジを半数クリア',     icon: '🎯', volts: 800, check: p => p.challengeClears.length >= Math.ceil(CHALLENGES.length / 2) },
  { id: 'chal_all',    name: 'チャレンジ制覇',   desc: '全チャレンジをクリア',       icon: '🔥', volts: 3000, check: p => p.challengeClears.length >= CHALLENGES.length },
  // Streak
  { id: 'streak_3',    name: '三日坊主脱出',     desc: '3日連続ログイン',            icon: '📅', volts: 150, check: p => p.loginStreak >= 3 },
  { id: 'streak_7',    name: '皆勤賞',           desc: '7日連続ログイン',            icon: '📅', volts: 500, check: p => p.loginStreak >= 7 },
  { id: 'streak_30',   name: '月間精勤',         desc: '30日連続ログイン',           icon: '🗓️', volts: 2000, check: p => p.loginStreak >= 30 },
  { id: 'streak_100',  name: '百日修行',         desc: '100日連続ログイン',          icon: '🎌', volts: 8000, check: p => p.loginStreak >= 100 },
];

// ── Mission Pool ──
export const MISSION_POOL: Mission[] = [
  // Daily - Gacha
  { id: 'd_pull3',     name: 'ガチャを3回引く',      target: 3,    volts: 60,  metric: 'pulls',       scope: 'daily' },
  { id: 'd_pull10',    name: '10連ガチャを引く',     target: 10,   volts: 150, metric: 'pulls',       scope: 'daily' },
  { id: 'd_pull20',    name: '20回ガチャを引く',     target: 20,   volts: 260, metric: 'pulls',       scope: 'daily' },
  { id: 'd_od1',       name: 'OD以上を1体入手',      target: 1,    volts: 180, metric: 'odDrops',     scope: 'daily' },
  // Daily - Battle
  { id: 'd_waves20',   name: '合計20ウェーブ突破',   target: 20,   volts: 100, metric: 'waveClears',  scope: 'daily' },
  { id: 'd_waves50',   name: '合計50ウェーブ突破',   target: 50,   volts: 240, metric: 'waveClears',  scope: 'daily' },
  { id: 'd_wave15',    name: '1戦でWave15まで進む',  target: 15,   volts: 120, metric: 'bestWave',    scope: 'daily' },
  { id: 'd_wave25',    name: '1戦でWave25まで進む',  target: 25,   volts: 220, metric: 'bestWave',    scope: 'daily' },
  { id: 'd_win1',      name: 'ステージを1回クリア',  target: 1,    volts: 80,  metric: 'gameWins',    scope: 'daily' },
  { id: 'd_win3',      name: 'ステージを3回クリア',  target: 3,    volts: 200, metric: 'gameWins',    scope: 'daily' },
  { id: 'd_win5',      name: 'ステージを5回クリア',  target: 5,    volts: 350, metric: 'gameWins',    scope: 'daily' },
  // Daily - Volts / Endless
  { id: 'd_volts500',  name: '500ボルト獲得',        target: 500,  volts: 100, metric: 'voltsEarned', scope: 'daily' },
  { id: 'd_volts1500', name: '1,500ボルト獲得',      target: 1500, volts: 260, metric: 'voltsEarned', scope: 'daily' },
  { id: 'd_endless20', name: 'エンドレスWave20到達', target: 20,   volts: 150, metric: 'endlessWave', scope: 'daily' },
  { id: 'd_endless35', name: 'エンドレスWave35到達', target: 35,   volts: 280, metric: 'endlessWave', scope: 'daily' },

  // Weekly - Gacha
  { id: 'w_pull30',    name: '週間30回ガチャ',       target: 30,   volts: 320,  metric: 'pulls',       scope: 'weekly' },
  { id: 'w_pull50',    name: '週間50回ガチャ',       target: 50,   volts: 500,  metric: 'pulls',       scope: 'weekly' },
  { id: 'w_pull100',   name: '週間100回ガチャ',      target: 100,  volts: 900,  metric: 'pulls',       scope: 'weekly' },
  { id: 'w_od3',       name: '週間OD以上×3',         target: 3,    volts: 600,  metric: 'odDrops',     scope: 'weekly' },
  { id: 'w_od7',       name: '週間OD以上×7',         target: 7,    volts: 1200, metric: 'odDrops',     scope: 'weekly' },
  // Weekly - Battle
  { id: 'w_waves150',  name: '週間150ウェーブ突破',  target: 150,  volts: 350,  metric: 'waveClears',  scope: 'weekly' },
  { id: 'w_waves200',  name: '週間200ウェーブ突破',  target: 200,  volts: 500,  metric: 'waveClears',  scope: 'weekly' },
  { id: 'w_waves500',  name: '週間500ウェーブ突破',  target: 500,  volts: 1000, metric: 'waveClears',  scope: 'weekly' },
  { id: 'w_win5',      name: '週間5ステージクリア',  target: 5,    volts: 300,  metric: 'gameWins',    scope: 'weekly' },
  { id: 'w_win10',     name: '週間10ステージクリア', target: 10,   volts: 500,  metric: 'gameWins',    scope: 'weekly' },
  { id: 'w_win25',     name: '週間25ステージクリア', target: 25,   volts: 1200, metric: 'gameWins',    scope: 'weekly' },
  { id: 'w_bestWave40', name: '週間で1戦Wave40到達', target: 40,   volts: 700,  metric: 'bestWave',    scope: 'weekly' },
  // Weekly - Endless / Volts
  { id: 'w_endless40', name: '週間エンドレスWave40', target: 40,   volts: 700,  metric: 'endlessWave', scope: 'weekly' },
  { id: 'w_endless80', name: '週間エンドレスWave80', target: 80,   volts: 1500, metric: 'endlessWave', scope: 'weekly' },
  { id: 'w_volts3000', name: '週間3,000ボルト獲得',  target: 3000, volts: 500,  metric: 'voltsEarned', scope: 'weekly' },
  { id: 'w_volts8000', name: '週間8,000ボルト獲得',  target: 8000, volts: 1100, metric: 'voltsEarned', scope: 'weekly' },
];

// ── Challenges ──
export const CHALLENGES: ChallengeMod[] = [
  { id: 'eco',          name: 'エコモード',           desc: '開始電力半減。効率的な配置が鍵',           icon: '🌱', diff: 'hard',    area: 'suburb',   volts: 500,  startPowerMul: 0.5 },
  { id: 'eco_extreme',  name: '超エコモード',         desc: '開始電力30%のみ。極限の節電チャレンジ',    icon: '🍃', diff: 'vhard',   area: 'glacier',  volts: 1200, startPowerMul: 0.3 },
  { id: 'no_upgrade',   name: 'ノーアップグレード',   desc: 'アップグレード禁止。物量で圧倒せよ',       icon: '🚫', diff: 'normal',  area: 'factory',  volts: 500,  noUpgrade: true },
  { id: 'no_upgrade_h', name: '無強化極限',           desc: '強化禁止のまま高難度を制せ',               icon: '⛔', diff: 'hard',    area: 'downtown', volts: 900,  noUpgrade: true },
  { id: 'no_ult',       name: 'ウルト封印',           desc: '必殺技禁止。純粋な火力勝負',               icon: '⚡', diff: 'hard',    area: 'downtown', volts: 600,  noUltimate: true },
  { id: 'no_ult_v',     name: 'ウルト封印・激',       desc: '必殺技禁止のまま超高難度に挑む',           icon: '🔒', diff: 'vhard',   area: 'sky',      volts: 1400, noUltimate: true },
  { id: 'tough',        name: '強敵襲来',             desc: '敵HP1.5倍。長期戦を制せ',                  icon: '💀', diff: 'normal',  area: 'volcano',  volts: 700,  enemyHpMul: 1.5 },
  { id: 'tough2',       name: '鋼鉄軍団',             desc: '敵HP2倍。総力戦だ',                        icon: '🛡️', diff: 'hard',    area: 'volcano',  volts: 1200, enemyHpMul: 2.0 },
  { id: 'iron_will',    name: '鉄の意志',             desc: '強化禁止+敵HP1.5倍',                       icon: '🗡️', diff: 'hard',    area: 'glacier',  volts: 1500, noUpgrade: true, enemyHpMul: 1.5 },
  { id: 'blackout',     name: 'ブラックアウト',       desc: '開始電力半減+ウルト封印',                  icon: '🌑', diff: 'hard',    area: 'sky',      volts: 1600, startPowerMul: 0.5, noUltimate: true },
  { id: 'nightmare',    name: '悪夢の一戦',           desc: '全制限+敵HP1.5倍',                         icon: '👹', diff: 'vhard',   area: 'sky',      volts: 2500, startPowerMul: 0.5, noUpgrade: true, noUltimate: true, enemyHpMul: 1.5 },
  { id: 'apocalypse',   name: '終焉',                 desc: '極難度・全制限+敵HP2倍',                   icon: '☠️', diff: 'extreme', area: 'volcano',  volts: 4000, startPowerMul: 0.5, noUpgrade: true, noUltimate: true, enemyHpMul: 2.0 },
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
