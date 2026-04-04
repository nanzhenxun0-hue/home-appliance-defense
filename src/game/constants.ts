import type { DifficultyDef, DifficultyKey, TowerDef, TowerID, UpgradeLevel, EnemyDef, EnemyType, WaveGroup } from './types';

export const COLS = 16;
export const ROWS = 10;
export const CELL = 48;
export const GW = COLS * CELL;
export const GH = ROWS * CELL;

export const PATH: [number, number][] = [
  [0,4],[1,4],[2,4],[3,4],[3,3],[3,2],[4,2],[5,2],[6,2],[7,2],
  [7,3],[7,4],[7,5],[7,6],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],
  [12,6],[12,5],[12,4],[12,3],[13,3],[14,3],[15,3]
];

export const PS = new Set(PATH.map(([c,r]) => `${c},${r}`));

export const DIFF: Record<DifficultyKey, DifficultyDef> = {
  easy:    { label:'かんたん',    em:'😊', col:'#69f0ae', dark:'#1b3a20', desc:'敵が弱くのんびり楽しめる',     hpM:0.6, spdM:0.7, sp:150, shp:30, wg:1.8 },
  normal:  { label:'ふつう',      em:'😐', col:'#ffd700', dark:'#3a3000', desc:'バランスの取れた標準モード',   hpM:1.0, spdM:1.0, sp:80,  shp:20, wg:1.0 },
  hard:    { label:'むずかしい',  em:'😤', col:'#ff9800', dark:'#3a1800', desc:'敵が強い。戦略が重要になる',   hpM:1.6, spdM:1.3, sp:60,  shp:15, wg:0.75 },
  lunatic: { label:'ルナティック',em:'💀', col:'#f44336', dark:'#3a0000', desc:'絶望的な難易度。覚悟して',     hpM:2.5, spdM:1.7, sp:50,  shp:10, wg:0.5 },
};

export const TDEFS: Record<TowerID, TowerDef> = {
  cord:   { n:'延長コード', em:'🔌', r:'C', rc:'#9e9e9e', baseCost:50,  req:null },
  kettle: { n:'電気ケトル', em:'♨️',  r:'C', rc:'#ffb74d', baseCost:75,  req:null },
  fan:    { n:'扇風機',     em:'🌀', r:'C', rc:'#81d4fa', baseCost:80,  req:null },
  vacuum: { n:'掃除機',     em:'🌪️', r:'U', rc:'#a5d6a7', baseCost:120, req:'cord' },
  router: { n:'ルーター',   em:'📡', r:'U', rc:'#80cbc4', baseCost:150, req:'cord' },
  fridge: { n:'冷蔵庫',     em:'🧊', r:'R', rc:'#64b5f6', baseCost:200, req:'vacuum' },
};

export const RCOLOR: Record<string, string> = { C:'#757575', U:'#4caf50', R:'#2196f3' };
export const RBGCOL: Record<string, string> = { C:'#2a2a2a', U:'#0d2a12', R:'#0a1f3a' };

export const UPS: Record<TowerID, UpgradeLevel[]> = {
  cord:   [
    { c:0,   pg:3, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'延長コード',     eff:'+3W/秒 供給' },
    { c:60,  pg:5, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'電源タップ',     eff:'+5W/秒' },
    { c:100, pg:8, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'スマートプラグ', eff:'+8W/秒' },
  ],
  kettle: [
    { c:0,   pg:0, pc:1, dmg:18, rng:2.2, spd:1.2, lbl:'電気ケトル',     eff:'ヤケド付与' },
    { c:80,  pg:0, pc:1, dmg:28, rng:2.5, spd:1.5, lbl:'高速ケトル',     eff:'攻速+ヤケド' },
    { c:160, pg:0, pc:1, dmg:45, rng:2.8, spd:1.8, lbl:'業務用ケトル',   eff:'超高火力！' },
  ],
  fan: [
    { c:0,   pg:0, pc:1, dmg:8,  rng:2.6, spd:1.9, lbl:'扇風機',         eff:'ノックバック' },
    { c:70,  pg:0, pc:1, dmg:14, rng:3.0, spd:2.2, lbl:'DC扇風機',       eff:'広範囲KB' },
    { c:140, pg:0, pc:2, dmg:24, rng:3.5, spd:2.5, lbl:'タワーファン',   eff:'強力KB！' },
  ],
  vacuum: [
    { c:0,   pg:0, pc:2, dmg:22, rng:2.0, spd:0.9, lbl:'掃除機',         eff:'吸引・引き戻し' },
    { c:100, pg:0, pc:2, dmg:35, rng:2.3, spd:1.1, lbl:'サイクロン掃除機', eff:'吸引力UP！' },
    { c:180, pg:0, pc:2, dmg:55, rng:2.7, spd:1.4, lbl:'ロボット掃除機', eff:'自動追尾！' },
  ],
  router: [
    { c:0,   pg:0, pc:2, dmg:0,  rng:3.2, spd:0,   lbl:'ルーター',       eff:'攻速+20%', bf:1.20 },
    { c:110, pg:0, pc:2, dmg:0,  rng:3.8, spd:0,   lbl:'WiFi6',          eff:'攻速+35%', bf:1.35 },
    { c:200, pg:0, pc:2, dmg:0,  rng:4.5, spd:0,   lbl:'メッシュWiFi',   eff:'攻速+50%', bf:1.50 },
  ],
  fridge: [
    { c:0,   pg:0, pc:4, dmg:30, rng:2.6, spd:0.7, lbl:'冷蔵庫',         eff:'凍結攻撃' },
    { c:150, pg:0, pc:4, dmg:46, rng:2.9, spd:0.9, lbl:'2ドア冷蔵庫',   eff:'強力凍結！' },
    { c:250, pg:0, pc:5, dmg:70, rng:3.3, spd:1.2, lbl:'大型冷蔵庫',     eff:'超凍結！' },
  ],
};

export const EDEFS: Record<EnemyType, EnemyDef> = {
  dust:   { em:'🌫️', hp:100, spd:50, rew:12, dmg:1, col:'#b0b0a0' },
  slime:  { em:'💧',  hp:200, spd:28, rew:22, dmg:2, col:'#4dd0e1' },
  magnet: { em:'🧲',  hp:380, spd:42, rew:40, dmg:3, col:'#f48fb1' },
};

export const WAVES: WaveGroup[][] = [
  [{ t:'dust',  n:8,  gap:1.5 }],
  [{ t:'dust',  n:10, gap:1.1 }, { t:'slime', n:3, gap:2.5 }],
  [{ t:'slime', n:6,  gap:1.5 }, { t:'magnet',n:2, gap:4.0 }],
  [{ t:'dust',  n:14, gap:0.8 }, { t:'magnet',n:4, gap:2.5 }],
  [{ t:'slime', n:8,  gap:1.0 }, { t:'magnet',n:6, gap:1.8 }],
];

export const st = (tid: TowerID, lv: number): TowerStats => ({
  ...TDEFS[tid], ...UPS[tid][lv], lv
} as any);

export const sellVal = (tid: TowerID, lv: number): number =>
  Math.floor((TDEFS[tid].baseCost + UPS[tid].slice(1, lv + 1).reduce((a, u) => a + u.c, 0)) * 0.5);

// Need to import TowerStats type workaround
import type { TowerStats } from './types';
