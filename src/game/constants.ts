import type { DifficultyDef, DifficultyKey, TowerDef, TowerID, UpgradeLevel, EnemyDef, EnemyType, WaveGroup, TowerStats } from './types';

// Mobile-friendly grid: 8 cols x 10 rows
export const COLS = 8;
export const ROWS = 10;
export const CELL = 42;
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

// 5 difficulty levels
export const DIFF: Record<DifficultyKey, DifficultyDef> = {
  easy:    { label:'よわい',       em:'😊', col:'#69f0ae', dark:'#1b3a20', desc:'のんびり楽しめる初心者向け',     hpM:0.5, spdM:0.6, sp:200, shp:40, wg:2.0 },
  normal:  { label:'ふつう',       em:'😐', col:'#ffd700', dark:'#3a3000', desc:'バランスの取れた標準モード',     hpM:1.0, spdM:1.0, sp:120, shp:25, wg:1.0 },
  hard:    { label:'つよい',       em:'😤', col:'#ff9800', dark:'#3a1800', desc:'強敵が出現。戦略が重要',         hpM:1.6, spdM:1.3, sp:80,  shp:18, wg:0.75 },
  vhard:   { label:'かなりつよい', em:'💀', col:'#f44336', dark:'#3a0000', desc:'絶望的な強さ。覚悟して',         hpM:2.5, spdM:1.6, sp:60,  shp:12, wg:0.55 },
  extreme: { label:'極',           em:'👹', col:'#b71c1c', dark:'#1a0000', desc:'最強の試練。生還者は伝説に残る', hpM:4.0, spdM:2.0, sp:40,  shp:8,  wg:0.4 },
};

// ── Tower definitions with 18 units ──
export const TDEFS: Record<TowerID, TowerDef> = {
  // C - Common (起点)
  cord:      { n:'延長コード',       em:'🔌', r:'C',  rc:'#9e9e9e', baseCost:25,  req:null },
  kettle:    { n:'電気ケトル',       em:'♨️',  r:'C',  rc:'#ffb74d', baseCost:40,  req:null },
  // U - Uncommon
  fan:       { n:'扇風機',           em:'🌀', r:'U',  rc:'#81d4fa', baseCost:55,  req:'cord',   ability:'pushback' },
  lamp:      { n:'デスクライト',     em:'💡', r:'U',  rc:'#fff176', baseCost:50,  req:'kettle' },
  toaster:   { n:'トースター',       em:'🍞', r:'U',  rc:'#ff8a65', baseCost:60,  req:'kettle', ability:'firetrap' },
  // R - Rare
  vacuum:    { n:'掃除機',           em:'🌪️', r:'R',  rc:'#a5d6a7', baseCost:85,  req:'cord' },
  router:    { n:'ルーター',         em:'📡', r:'R',  rc:'#80cbc4', baseCost:90,  req:'lamp' },
  dryer:     { n:'ドライヤー',       em:'💨', r:'R',  rc:'#ef9a9a', baseCost:80,  req:'fan' },
  // E - Epic
  fridge:    { n:'冷蔵庫',           em:'🧊', r:'E',  rc:'#64b5f6', baseCost:130, req:'vacuum' },
  aircon:    { n:'エアコン',         em:'❄️', r:'E',  rc:'#4fc3f7', baseCost:140, req:'fan' },
  speaker:   { n:'スピーカー',       em:'🔊', r:'E',  rc:'#ce93d8', baseCost:120, req:'router', ability:'slowfield' },
  // L - Legend
  microwave: { n:'電子レンジ',       em:'🔥', r:'L',  rc:'#ff7043', baseCost:190, req:'toaster' },
  washer:    { n:'洗濯機',           em:'🌊', r:'L',  rc:'#26c6da', baseCost:200, req:'fridge' },
  // M - Mythic
  theater:   { n:'ホームシアター',   em:'🎬', r:'M',  rc:'#e91e63', baseCost:280, req:'router' },
  projector: { n:'プロジェクター',   em:'📽️', r:'M',  rc:'#ba68c8', baseCost:260, req:'speaker' },
  // G - Galaxy
  superpc:   { n:'スーパーPC',       em:'💻', r:'G',  rc:'#00e5ff', baseCost:380, req:'theater' },
  tesla:     { n:'テスラコイル',     em:'⚡', r:'G',  rc:'#7c4dff', baseCost:400, req:'dryer',  ability:'chainlightning' },
  // OD - Overdrive
  plasma:    { n:'プラズマキャノン', em:'🔱', r:'OD', rc:'#ffd700', baseCost:500, req:'superpc' },
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
    { c:30,  pg:5, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'電源タップ',     eff:'+5W/秒' },
    { c:60,  pg:8, pc:0, dmg:0,  rng:0,   spd:0,   lbl:'スマートプラグ', eff:'+8W/秒' },
  ],
  kettle: [
    { c:0,   pg:0, pc:1, dmg:18, rng:2.2, spd:1.2, lbl:'電気ケトル',     eff:'ヤケド付与' },
    { c:60,  pg:0, pc:1, dmg:28, rng:2.5, spd:1.5, lbl:'高速ケトル',     eff:'攻速UP' },
    { c:300, pg:0, pc:1, dmg:45, rng:2.8, spd:1.8, lbl:'業務用ケトル',   eff:'★超ヤケド！', abilityUnlock:true },
  ],
  fan: [
    { c:0,   pg:0, pc:1, dmg:8,  rng:2.6, spd:1.9, lbl:'扇風機',         eff:'ノックバック' },
    { c:60,  pg:0, pc:1, dmg:14, rng:3.0, spd:2.2, lbl:'DC扇風機',       eff:'攻速UP' },
    { c:300, pg:0, pc:2, dmg:24, rng:3.5, spd:2.5, lbl:'タワーファン',   eff:'★10秒毎にスタートへ戻す', abilityUnlock:true },
  ],
  lamp: [
    { c:0,   pg:1, pc:0, dmg:12, rng:2.8, spd:1.4, lbl:'デスクライト',   eff:'照射ダメージ' },
    { c:60,  pg:1, pc:1, dmg:22, rng:3.2, spd:1.7, lbl:'LEDライト',      eff:'攻速UP' },
    { c:300, pg:2, pc:1, dmg:35, rng:3.5, spd:2.0, lbl:'スポットライト', eff:'★超照射！', abilityUnlock:true },
  ],
  toaster: [
    { c:0,   pg:0, pc:1, dmg:15, rng:2.0, spd:1.0, lbl:'トースター',     eff:'熱攻撃' },
    { c:60,  pg:0, pc:1, dmg:25, rng:2.3, spd:1.3, lbl:'高機能トースター',eff:'攻速UP' },
    { c:300, pg:0, pc:2, dmg:40, rng:2.6, spd:1.6, lbl:'業務用トースター',eff:'★火トラップ設置', abilityUnlock:true },
  ],
  vacuum: [
    { c:0,   pg:0, pc:2, dmg:22, rng:2.0, spd:0.9, lbl:'掃除機',         eff:'吸引・引き戻し' },
    { c:60,  pg:0, pc:2, dmg:35, rng:2.3, spd:1.1, lbl:'サイクロン',     eff:'攻速UP' },
    { c:300, pg:0, pc:2, dmg:55, rng:2.7, spd:1.4, lbl:'ロボ掃除機',     eff:'★自動追尾！', abilityUnlock:true },
  ],
  router: [
    { c:0,   pg:0, pc:2, dmg:0,  rng:3.2, spd:0,   lbl:'ルーター',       eff:'攻速+20%', bf:1.20 },
    { c:60,  pg:0, pc:2, dmg:0,  rng:3.8, spd:0,   lbl:'WiFi6',          eff:'攻速+35%', bf:1.35 },
    { c:300, pg:0, pc:2, dmg:0,  rng:4.5, spd:0,   lbl:'メッシュWiFi',   eff:'★攻速+50%', bf:1.50, abilityUnlock:true },
  ],
  dryer: [
    { c:0,   pg:0, pc:2, dmg:20, rng:2.5, spd:1.5, lbl:'ドライヤー',     eff:'熱風攻撃' },
    { c:60,  pg:0, pc:2, dmg:32, rng:2.8, spd:1.8, lbl:'イオンドライヤー',eff:'攻速UP' },
    { c:300, pg:0, pc:3, dmg:50, rng:3.2, spd:2.2, lbl:'業務用ドライヤー',eff:'★範囲熱風！', abilityUnlock:true },
  ],
  fridge: [
    { c:0,   pg:0, pc:3, dmg:30, rng:2.4, spd:0.7, lbl:'冷蔵庫',         eff:'凍結攻撃' },
    { c:60,  pg:0, pc:3, dmg:46, rng:2.7, spd:0.9, lbl:'2ドア冷蔵庫',   eff:'攻速UP' },
    { c:300, pg:0, pc:4, dmg:70, rng:3.0, spd:1.2, lbl:'大型冷蔵庫',     eff:'★超凍結！', abilityUnlock:true },
  ],
  aircon: [
    { c:0,   pg:0, pc:3, dmg:25, rng:3.0, spd:1.0, lbl:'エアコン',       eff:'範囲凍結' },
    { c:60,  pg:0, pc:4, dmg:40, rng:3.4, spd:1.3, lbl:'インバータ',     eff:'攻速UP' },
    { c:300, pg:0, pc:5, dmg:60, rng:3.8, spd:1.6, lbl:'全館空調',       eff:'★超範囲凍結！', abilityUnlock:true },
  ],
  speaker: [
    { c:0,   pg:0, pc:2, dmg:18, rng:3.0, spd:1.2, lbl:'スピーカー',     eff:'音波攻撃' },
    { c:60,  pg:0, pc:3, dmg:30, rng:3.4, spd:1.5, lbl:'サウンドバー',   eff:'攻速UP' },
    { c:300, pg:0, pc:4, dmg:45, rng:4.0, spd:1.8, lbl:'重低音スピーカー',eff:'★スロウフィールド', abilityUnlock:true },
  ],
  microwave: [
    { c:0,   pg:0, pc:4, dmg:50, rng:2.0, spd:0.6, lbl:'電子レンジ',     eff:'超高火力' },
    { c:60,  pg:0, pc:5, dmg:80, rng:2.3, spd:0.8, lbl:'オーブンレンジ', eff:'攻速UP' },
    { c:300, pg:0, pc:6, dmg:120,rng:2.6, spd:1.0, lbl:'業務用レンジ',   eff:'★核熱！', abilityUnlock:true },
  ],
  washer: [
    { c:0,   pg:0, pc:4, dmg:35, rng:2.5, spd:1.2, lbl:'洗濯機',         eff:'渦巻き吸引' },
    { c:60,  pg:0, pc:5, dmg:55, rng:2.8, spd:1.5, lbl:'ドラム式',       eff:'攻速UP' },
    { c:300, pg:0, pc:6, dmg:85, rng:3.2, spd:1.8, lbl:'業務用洗濯機',   eff:'★渦巻き地獄！', abilityUnlock:true },
  ],
  theater: [
    { c:0,   pg:0, pc:5, dmg:0,  rng:4.0, spd:0,   lbl:'ホームシアター', eff:'全体攻速+30%', bf:1.30 },
    { c:60,  pg:0, pc:6, dmg:0,  rng:5.0, spd:0,   lbl:'IMAXシアター',   eff:'攻速+50%', bf:1.50 },
    { c:300, pg:0, pc:7, dmg:15, rng:5.5, spd:1.0, lbl:'超映画館',       eff:'★音波+攻速+70%', bf:1.70, abilityUnlock:true },
  ],
  projector: [
    { c:0,   pg:0, pc:4, dmg:25, rng:3.5, spd:0.8, lbl:'プロジェクター', eff:'光線攻撃' },
    { c:60,  pg:0, pc:5, dmg:42, rng:4.0, spd:1.1, lbl:'4Kプロジェクター',eff:'攻速UP' },
    { c:300, pg:0, pc:6, dmg:65, rng:4.5, spd:1.4, lbl:'レーザープロジェクター',eff:'★貫通光線！', abilityUnlock:true },
  ],
  superpc: [
    { c:0,   pg:0, pc:6, dmg:60, rng:3.5, spd:1.5, lbl:'スーパーPC',     eff:'レーザー攻撃' },
    { c:60,  pg:0, pc:7, dmg:100,rng:4.0, spd:2.0, lbl:'量子PC',         eff:'攻速UP' },
    { c:300, pg:0, pc:8, dmg:160,rng:4.5, spd:2.5, lbl:'超量子PC',       eff:'★次元崩壊！', abilityUnlock:true },
  ],
  tesla: [
    { c:0,   pg:0, pc:5, dmg:45, rng:3.0, spd:1.0, lbl:'テスラコイル',   eff:'電撃' },
    { c:60,  pg:0, pc:6, dmg:75, rng:3.5, spd:1.3, lbl:'高圧テスラ',     eff:'攻速UP' },
    { c:300, pg:0, pc:8, dmg:120,rng:4.0, spd:1.8, lbl:'超電磁テスラ',   eff:'★チェーンライトニング', abilityUnlock:true },
  ],
  plasma: [
    { c:0,   pg:0, pc:8, dmg:120,rng:4.0, spd:0.8, lbl:'プラズマキャノン', eff:'全体貫通' },
    { c:60,  pg:0, pc:10,dmg:200,rng:5.0, spd:1.2, lbl:'メガプラズマ',     eff:'攻速UP' },
    { c:300, pg:0, pc:12,dmg:350,rng:6.0, spd:1.8, lbl:'ギガプラズマ',     eff:'★世界を焼く！', abilityUnlock:true },
  ],
};

// Enemies with 3 mob types + named bosses
export const EDEFS: Record<EnemyType, EnemyDef> = {
  dust:       { em:'🌫️', hp:80,   spd:45,  rew:10, dmg:1, col:'#b0b0a0', name:'ダスト', pixel:true },
  fast_dust:  { em:'💨',  hp:50,   spd:80,  rew:12, dmg:1, col:'#e0d090', name:'スピードダスト', pixel:true },
  slime:      { em:'💧',  hp:160,  spd:25,  rew:18, dmg:2, col:'#4dd0e1', name:'スライム', pixel:true },
  tank_slime: { em:'🛡️',  hp:500,  spd:18,  rew:30, dmg:3, col:'#1565c0', name:'タンクスライム', pixel:true },
  magnet:     { em:'🧲',  hp:300,  spd:38,  rew:30, dmg:3, col:'#f48fb1', name:'マグネット', pixel:true },
  virus:      { em:'🦠',  hp:500,  spd:55,  rew:50, dmg:2, col:'#76ff03', name:'ウイルス', pixel:true },
  // ── 新敵キャラ ──
  cockroach:  { em:'🪳',  hp:120,  spd:110, rew:20, dmg:2, col:'#795548', name:'ゴキブリ', special:'clog', pixel:true },
  mold:       { em:'🍄',  hp:280,  spd:22,  rew:25, dmg:2, col:'#558b2f', name:'カビ', special:'corrode', pixel:true },
  surge:      { em:'⚡',  hp:200,  spd:60,  rew:35, dmg:3, col:'#ffeb3b', name:'過電流モンスター', special:'surge_stun', pixel:true },
  dust_lord:  { em:'👻',  hp:700,  spd:30,  rew:80, dmg:4, col:'#9e9e9e', name:'ホコリ大王', special:'multiply', pixel:true },
  boss:       { em:'🤖',  hp:2000, spd:20,  rew:150,dmg:5, col:'#ff1744', name:'ボスロボット', pixel:true },
  boss_ice:   { em:'🥶',  hp:3500, spd:18,  rew:250,dmg:7, col:'#00bcd4', name:'氷電魔フローズワンダー', bossAbility:'warp', pixel:true },
  boss_fire:  { em:'🔥',  hp:4000, spd:22,  rew:300,dmg:8, col:'#ff3d00', name:'爆熱魔クリムゾンキング', bossAbility:'wall', pixel:true },
  final_boss: { em:'👿',  hp:8000, spd:15,  rew:500,dmg:10,col:'#9c27b0', name:'家電大魔王デウスマキナ', bossAbility:'unit_disable', pixel:true },
};

// Area-specific waves - suburb (basic area)
const WAVES_SUBURB: WaveGroup[][] = [
  [{ t:'dust',  n:6,  gap:1.5 }],
  [{ t:'dust',  n:8,  gap:1.2 }, { t:'fast_dust', n:3, gap:1.0 }],
  [{ t:'slime', n:5,  gap:1.5 }, { t:'cockroach', n:4, gap:0.8 }],
  [{ t:'fast_dust', n:10, gap:0.8 }, { t:'slime', n:3, gap:2.0 }],
  [{ t:'slime', n:6,  gap:1.2 }, { t:'tank_slime', n:2, gap:3.0 }],
  [{ t:'mold',  n:4,  gap:2.0 }, { t:'cockroach', n:6, gap:0.6 }],
  [{ t:'dust',  n:15, gap:0.5 }, { t:'slime', n:8, gap:1.0 }, { t:'surge', n:3, gap:1.5 }],
  [{ t:'dust_lord', n:2, gap:5.0 }, { t:'cockroach', n:8, gap:0.5 }],
  [{ t:'slime', n:10, gap:0.8 }, { t:'surge', n:5, gap:1.0 }, { t:'boss', n:1, gap:0 }],
  [{ t:'dust_lord', n:3, gap:3.0 }, { t:'mold', n:6, gap:1.2 }, { t:'boss', n:2, gap:5.0 }],
];

const WAVES_FACTORY: WaveGroup[][] = [
  [{ t:'magnet', n:8, gap:1.2 }],
  [{ t:'tank_slime', n:4, gap:2.0 }, { t:'fast_dust', n:8, gap:0.8 }],
  [{ t:'virus', n:6, gap:1.2 }, { t:'magnet', n:5, gap:1.5 }],
  [{ t:'tank_slime', n:6, gap:1.5 }, { t:'virus', n:4, gap:2.0 }],
  [{ t:'fast_dust', n:20, gap:0.4 }, { t:'slime', n:8, gap:1.0 }],
  [{ t:'virus', n:8, gap:1.0 }, { t:'tank_slime', n:4, gap:2.5 }],
  [{ t:'magnet', n:10, gap:0.8 }, { t:'virus', n:6, gap:1.5 }],
  [{ t:'tank_slime', n:8, gap:1.2 }, { t:'boss', n:1, gap:0 }],
  [{ t:'virus', n:10, gap:0.8 }, { t:'boss', n:2, gap:3.0 }],
  [{ t:'virus', n:8, gap:0.8 }, { t:'tank_slime', n:5, gap:1.5 }, { t:'boss_ice', n:1, gap:0 }],
];

const WAVES_DOWNTOWN: WaveGroup[][] = [
  [{ t:'fast_dust', n:15, gap:0.5 }],
  [{ t:'virus', n:8, gap:1.0 }, { t:'fast_dust', n:10, gap:0.6 }],
  [{ t:'tank_slime', n:6, gap:1.5 }, { t:'magnet', n:8, gap:1.0 }],
  [{ t:'virus', n:10, gap:0.8 }, { t:'tank_slime', n:4, gap:2.0 }],
  [{ t:'fast_dust', n:25, gap:0.3 }, { t:'virus', n:6, gap:1.2 }],
  [{ t:'tank_slime', n:8, gap:1.0 }, { t:'virus', n:8, gap:1.0 }],
  [{ t:'virus', n:12, gap:0.7 }, { t:'boss', n:2, gap:4.0 }],
  [{ t:'tank_slime', n:10, gap:1.0 }, { t:'boss_fire', n:1, gap:0 }],
  [{ t:'virus', n:15, gap:0.5 }, { t:'boss_ice', n:1, gap:0 }, { t:'boss_fire', n:1, gap:5.0 }],
  [{ t:'virus', n:10, gap:0.6 }, { t:'tank_slime', n:8, gap:0.8 }, { t:'final_boss', n:1, gap:0 }],
];

const WAVES_VOLCANO: WaveGroup[][] = [
  [{ t:'tank_slime', n:10, gap:1.0 }],
  [{ t:'virus', n:12, gap:0.6 }, { t:'tank_slime', n:6, gap:1.5 }],
  [{ t:'fast_dust', n:30, gap:0.3 }],
  [{ t:'virus', n:15, gap:0.5 }, { t:'tank_slime', n:8, gap:1.0 }],
  [{ t:'boss', n:3, gap:3.0 }, { t:'virus', n:10, gap:0.8 }],
  [{ t:'tank_slime', n:12, gap:0.8 }, { t:'boss_fire', n:1, gap:0 }],
  [{ t:'virus', n:20, gap:0.4 }, { t:'boss_ice', n:1, gap:0 }],
  [{ t:'boss', n:4, gap:2.0 }, { t:'boss_fire', n:1, gap:5.0 }],
  [{ t:'virus', n:15, gap:0.5 }, { t:'boss_ice', n:1, gap:0 }, { t:'boss_fire', n:1, gap:3.0 }],
  [{ t:'tank_slime', n:10, gap:0.6 }, { t:'virus', n:12, gap:0.5 }, { t:'final_boss', n:1, gap:0 }],
];

const WAVES_GLACIER: WaveGroup[][] = [
  [{ t:'virus', n:15, gap:0.5 }],
  [{ t:'tank_slime', n:12, gap:0.8 }, { t:'fast_dust', n:20, gap:0.3 }],
  [{ t:'boss', n:3, gap:2.0 }],
  [{ t:'virus', n:20, gap:0.4 }, { t:'tank_slime', n:10, gap:0.8 }],
  [{ t:'boss_ice', n:2, gap:4.0 }, { t:'virus', n:10, gap:0.6 }],
  [{ t:'boss_fire', n:2, gap:4.0 }, { t:'tank_slime', n:12, gap:0.6 }],
  [{ t:'virus', n:25, gap:0.3 }, { t:'boss', n:4, gap:2.0 }],
  [{ t:'boss_ice', n:1, gap:0 }, { t:'boss_fire', n:1, gap:3.0 }, { t:'virus', n:15, gap:0.5 }],
  [{ t:'boss', n:5, gap:1.5 }, { t:'boss_ice', n:1, gap:5.0 }, { t:'boss_fire', n:1, gap:5.0 }],
  [{ t:'virus', n:20, gap:0.3 }, { t:'tank_slime', n:15, gap:0.5 }, { t:'final_boss', n:1, gap:0 }],
];

export const AREA_WAVES: Record<string, WaveGroup[][]> = {
  suburb: WAVES_SUBURB,
  factory: WAVES_FACTORY,
  downtown: WAVES_DOWNTOWN,
  volcano: WAVES_VOLCANO,
  glacier: WAVES_GLACIER,
};

// Legacy WAVES export for backward compat
export const WAVES = WAVES_SUBURB;

export const st = (tid: TowerID, lv: number): TowerStats => ({
  ...TDEFS[tid], ...UPS[tid][lv], lv
} as TowerStats);

export const sellVal = (tid: TowerID, lv: number): number =>
  Math.floor((TDEFS[tid].baseCost + UPS[tid].slice(1, lv + 1).reduce((a, u) => a + u.c, 0)) * 0.5);
