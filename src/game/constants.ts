import type { DifficultyDef, DifficultyKey, TowerDef, TowerID, UpgradeLevel, EnemyDef, EnemyType, WaveGroup, TowerStats } from './types';

// Mobile-friendly grid: 8 cols x 10 rows
export const COLS = 8;
export const ROWS = 10;
export const CELL = 42; // base cell, will scale on canvas
export const GW = COLS * CELL;
export const GH = ROWS * CELL;

// Winding path for 8x10 grid
export const PATH: [number, number][] = [
  [0,1],[1,1],[2,1],[3,1],
  [3,2],[3,3],[3,4],
  [4,4],[5,4],[6,4],
  [6,5],[6,6],
  [5,6],[4,6],[3,6],[2,6],
  [2,7],[2,8],
  [3,8],[4,8],[5,8],[6,8],[7,8],
];

export const PS = new Set(PATH.map(([c,r]) => `${c},${r}`));

export const DIFF: Record<DifficultyKey, DifficultyDef> = {
  easy:    { label:'かんたん',    em:'😊', col:'#69f0ae', dark:'#1b3a20', desc:'敵が弱くのんびり楽しめる',     hpM:0.6, spdM:0.7, sp:150, shp:30, wg:1.8 },
  normal:  { label:'ふつう',      em:'😐', col:'#ffd700', dark:'#3a3000', desc:'バランスの取れた標準モード',   hpM:1.0, spdM:1.0, sp:100, shp:20, wg:1.0 },
  hard:    { label:'むずかしい',  em:'😤', col:'#ff9800', dark:'#3a1800', desc:'敵が強い。戦略が重要になる',   hpM:1.6, spdM:1.3, sp:70,  shp:15, wg:0.75 },
  lunatic: { label:'ルナティック',em:'💀', col:'#f44336', dark:'#3a0000', desc:'絶望的な難易度。覚悟して',     hpM:2.5, spdM:1.7, sp:50,  shp:10, wg:0.5 },
};

export const TDEFS: Record<TowerID, TowerDef> = {
  // C - Common
  cord:      { n:'延長コード',     em:'🔌', r:'C',  rc:'#9e9e9e', baseCost:30,  req:null },
  kettle:    { n:'電気ケトル',     em:'♨️',  r:'C',  rc:'#ffb74d', baseCost:50,  req:null },
  // U - Uncommon
  fan:       { n:'扇風機',         em:'🌀', r:'U',  rc:'#81d4fa', baseCost:60,  req:null },
  lamp:      { n:'デスクライト',   em:'💡', r:'U',  rc:'#fff176', baseCost:55,  req:null },
  // R - Rare
  vacuum:    { n:'掃除機',         em:'🌪️', r:'R',  rc:'#a5d6a7', baseCost:90,  req:'cord' },
  router:    { n:'ルーター',       em:'📡', r:'R',  rc:'#80cbc4', baseCost:100, req:'cord' },
  // E - Epic
  fridge:    { n:'冷蔵庫',         em:'🧊', r:'E',  rc:'#64b5f6', baseCost:140, req:'vacuum' },
  aircon:    { n:'エアコン',       em:'❄️', r:'E',  rc:'#4fc3f7', baseCost:150, req:'fan' },
  // L - Legend
  microwave: { n:'電子レンジ',     em:'🔥', r:'L',  rc:'#ff7043', baseCost:200, req:'kettle' },
  washer:    { n:'洗濯機',         em:'🌊', r:'L',  rc:'#26c6da', baseCost:220, req:'vacuum' },
  // M - Mythic
  theater:   { n:'ホームシアター', em:'🎬', r:'M',  rc:'#e91e63', baseCost:300, req:'router' },
  // G - Galaxy
  superpc:   { n:'スーパーPC',     em:'💻', r:'G',  rc:'#00e5ff', baseCost:400, req:'router' },
  // OD - Overdrive
  plasma:    { n:'プラズマキャノン', em:'⚡', r:'OD', rc:'#ffd700', baseCost:500, req:'superpc' },
};

export const RCOLOR = Object.fromEntries(
  Object.entries({ C:'#757575', U:'#4caf50', R:'#2196f3', E:'#ab47bc', L:'#ff9800', M:'#e91e63', G:'#00e5ff', OD:'#ffd700' })
);
export const RBGCOL = Object.fromEntries(
  Object.entries({ C:'#1a1a1a', U:'#0d2a12', R:'#0a1f3a', E:'#1f0a2a', L:'#2a1a00', M:'#2a0a1a', G:'#002a2a', OD:'#2a2200' })
);

export const UPS: Record<TowerID, UpgradeLevel[]> = {
  cord: [
    { c:0,   pg:3, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'延長コード',     eff:'+3W/秒 供給' },
    { c:40,  pg:5, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'電源タップ',     eff:'+5W/秒' },
    { c:80,  pg:8, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'スマートプラグ', eff:'+8W/秒' },
  ],
  kettle: [
    { c:0,   pg:0, pc:1, dmg:18, rng:2.2, spd:1.2, lbl:'電気ケトル',     eff:'ヤケド付与' },
    { c:60,  pg:0, pc:1, dmg:28, rng:2.5, spd:1.5, lbl:'高速ケトル',     eff:'攻速+ヤケド' },
    { c:120, pg:0, pc:1, dmg:45, rng:2.8, spd:1.8, lbl:'業務用ケトル',   eff:'超高火力！' },
  ],
  fan: [
    { c:0,   pg:0, pc:1, dmg:8,  rng:2.6, spd:1.9, lbl:'扇風機',         eff:'ノックバック' },
    { c:50,  pg:0, pc:1, dmg:14, rng:3.0, spd:2.2, lbl:'DC扇風機',       eff:'広範囲KB' },
    { c:100, pg:0, pc:2, dmg:24, rng:3.5, spd:2.5, lbl:'タワーファン',   eff:'強力KB！' },
  ],
  lamp: [
    { c:0,   pg:1, pc:0, dmg:12, rng:2.8, spd:1.4, lbl:'デスクライト',   eff:'照射ダメージ' },
    { c:50,  pg:1, pc:1, dmg:22, rng:3.2, spd:1.7, lbl:'LEDライト',      eff:'高速照射' },
    { c:100, pg:2, pc:1, dmg:35, rng:3.5, spd:2.0, lbl:'スポットライト', eff:'超照射！' },
  ],
  vacuum: [
    { c:0,   pg:0, pc:2, dmg:22, rng:2.0, spd:0.9, lbl:'掃除機',         eff:'吸引・引き戻し' },
    { c:80,  pg:0, pc:2, dmg:35, rng:2.3, spd:1.1, lbl:'サイクロン',     eff:'吸引力UP！' },
    { c:150, pg:0, pc:2, dmg:55, rng:2.7, spd:1.4, lbl:'ロボ掃除機',     eff:'自動追尾！' },
  ],
  router: [
    { c:0,   pg:0, pc:2, dmg:0,  rng:3.2, spd:0,   lbl:'ルーター',       eff:'攻速+20%', bf:1.20 },
    { c:80,  pg:0, pc:2, dmg:0,  rng:3.8, spd:0,   lbl:'WiFi6',          eff:'攻速+35%', bf:1.35 },
    { c:150, pg:0, pc:2, dmg:0,  rng:4.5, spd:0,   lbl:'メッシュWiFi',   eff:'攻速+50%', bf:1.50 },
  ],
  fridge: [
    { c:0,   pg:0, pc:3, dmg:30, rng:2.4, spd:0.7, lbl:'冷蔵庫',         eff:'凍結攻撃' },
    { c:120, pg:0, pc:3, dmg:46, rng:2.7, spd:0.9, lbl:'2ドア冷蔵庫',   eff:'強力凍結！' },
    { c:200, pg:0, pc:4, dmg:70, rng:3.0, spd:1.2, lbl:'大型冷蔵庫',     eff:'超凍結！' },
  ],
  aircon: [
    { c:0,   pg:0, pc:3, dmg:25, rng:3.0, spd:1.0, lbl:'エアコン',       eff:'範囲凍結' },
    { c:130, pg:0, pc:4, dmg:40, rng:3.4, spd:1.3, lbl:'インバータ',     eff:'広範囲凍結' },
    { c:220, pg:0, pc:5, dmg:60, rng:3.8, spd:1.6, lbl:'全館空調',       eff:'超範囲凍結！' },
  ],
  microwave: [
    { c:0,   pg:0, pc:4, dmg:50, rng:2.0, spd:0.6, lbl:'電子レンジ',     eff:'超高火力ヤケド' },
    { c:180, pg:0, pc:5, dmg:80, rng:2.3, spd:0.8, lbl:'オーブンレンジ', eff:'爆炎！' },
    { c:300, pg:0, pc:6, dmg:120,rng:2.6, spd:1.0, lbl:'業務用レンジ',   eff:'核熱！' },
  ],
  washer: [
    { c:0,   pg:0, pc:4, dmg:35, rng:2.5, spd:1.2, lbl:'洗濯機',         eff:'渦巻き吸引' },
    { c:180, pg:0, pc:5, dmg:55, rng:2.8, spd:1.5, lbl:'ドラム式',       eff:'超吸引！' },
    { c:300, pg:0, pc:6, dmg:85, rng:3.2, spd:1.8, lbl:'業務用洗濯機',   eff:'渦巻き地獄！' },
  ],
  theater: [
    { c:0,   pg:0, pc:5, dmg:0,  rng:4.0, spd:0,   lbl:'ホームシアター', eff:'全体攻速+30%', bf:1.30 },
    { c:250, pg:0, pc:6, dmg:0,  rng:5.0, spd:0,   lbl:'IMAXシアター',   eff:'全体攻速+50%', bf:1.50 },
    { c:400, pg:0, pc:7, dmg:15, rng:5.5, spd:1.0, lbl:'超映画館',       eff:'音波攻撃+攻速+70%', bf:1.70 },
  ],
  superpc: [
    { c:0,   pg:0, pc:6, dmg:60, rng:3.5, spd:1.5, lbl:'スーパーPC',     eff:'レーザー攻撃' },
    { c:350, pg:0, pc:7, dmg:100,rng:4.0, spd:2.0, lbl:'量子PC',         eff:'量子レーザー' },
    { c:500, pg:0, pc:8, dmg:160,rng:4.5, spd:2.5, lbl:'超量子PC',       eff:'次元崩壊！' },
  ],
  plasma: [
    { c:0,   pg:0, pc:8, dmg:120,rng:4.0, spd:0.8, lbl:'プラズマキャノン', eff:'全体貫通' },
    { c:500, pg:0, pc:10,dmg:200,rng:5.0, spd:1.2, lbl:'メガプラズマ',     eff:'超貫通！' },
    { c:800, pg:0, pc:12,dmg:350,rng:6.0, spd:1.8, lbl:'ギガプラズマ',     eff:'世界を焼く！' },
  ],
};

export const EDEFS: Record<EnemyType, EnemyDef> = {
  dust:   { em:'🌫️', hp:80,   spd:45,  rew:10, dmg:1, col:'#b0b0a0' },
  slime:  { em:'💧',  hp:160,  spd:25,  rew:18, dmg:2, col:'#4dd0e1' },
  magnet: { em:'🧲',  hp:300,  spd:38,  rew:30, dmg:3, col:'#f48fb1' },
  virus:  { em:'🦠',  hp:500,  spd:55,  rew:50, dmg:2, col:'#76ff03' },
  boss:   { em:'🤖',  hp:2000, spd:20,  rew:150,dmg:5, col:'#ff1744' },
};

export const WAVES: WaveGroup[][] = [
  [{ t:'dust',  n:6,  gap:1.5 }],
  [{ t:'dust',  n:8,  gap:1.2 }, { t:'slime', n:2, gap:3.0 }],
  [{ t:'slime', n:5,  gap:1.5 }, { t:'magnet',n:2, gap:4.0 }],
  [{ t:'dust',  n:12, gap:0.8 }, { t:'magnet',n:3, gap:2.5 }],
  [{ t:'slime', n:6,  gap:1.2 }, { t:'virus', n:2, gap:3.0 }],
  [{ t:'magnet',n:6,  gap:1.5 }, { t:'virus', n:3, gap:2.0 }],
  [{ t:'dust',  n:15, gap:0.5 }, { t:'slime', n:8, gap:1.0 }, { t:'magnet',n:4, gap:2.0 }],
  [{ t:'virus', n:5,  gap:1.5 }, { t:'magnet',n:6, gap:1.2 }],
  [{ t:'slime', n:10, gap:0.8 }, { t:'virus', n:5, gap:1.5 }, { t:'boss',  n:1, gap:0 }],
  [{ t:'virus', n:8,  gap:1.0 }, { t:'boss',  n:2, gap:5.0 }],
];

export const st = (tid: TowerID, lv: number): TowerStats => ({
  ...TDEFS[tid], ...UPS[tid][lv], lv
} as TowerStats);

export const sellVal = (tid: TowerID, lv: number): number =>
  Math.floor((TDEFS[tid].baseCost + UPS[tid].slice(1, lv + 1).reduce((a, u) => a + u.c, 0)) * 0.5);
