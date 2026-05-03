import type { DifficultyDef, DifficultyKey, TowerDef, TowerID, UpgradeLevel, EnemyDef, EnemyType, WaveGroup, TowerStats, PersonalityType } from './types';

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
  cord:      { n:'延長コード',       em:'🔌', r:'C',  rc:'#9e9e9e', baseCost:25,  req:null,       personality:'縁の下の力持ち', quote:'「みんなを繋げるのが俺の仕事だ！」', role:'発電', skillName:'パワーシェア', skillDesc:'戦場に電力を供給。Lv3で供給量+8/秒。設置数で電力上限が伸びる。' },
  kettle:    { n:'電気ケトル',       em:'♨️',  r:'C',  rc:'#ffb74d', baseCost:40,  req:null,       personality:'熱血漢',         quote:'「沸騰するまで諦めないぞ！」', role:'近接DPS', skillName:'ボイル・バースト', skillDesc:'近接にヤケドDoTを付与。Lv3で2秒の継続炎上ダメージへ強化。' },
  // U - Uncommon
  fan:       { n:'扇風機',           em:'🌀', r:'U',  rc:'#81d4fa', baseCost:55,  req:'cord',     ability:'pushback',   personality:'自由奔放', quote:'「風に乗れ！どこへでも飛ばしてやる！」', role:'CC/ノックバック', skillName:'ガストブロウ', skillDesc:'敵を後方へ押し戻す。Lv3で10秒毎に範囲全敵をスタートまで吹き飛ばす。' },
  lamp:      { n:'デスクライト',     em:'💡', r:'U',  rc:'#fff176', baseCost:50,  req:'kettle',   personality:'明察眼',           quote:'「暗闇に光を当てれば、真実が見える。」', role:'長射程DPS', skillName:'スポットレイ', skillDesc:'光線で単体狙撃。Lv3で射程+30%・ステルス無効化。' },
  toaster:   { n:'トースター',       em:'🍞', r:'U',  rc:'#ff8a65', baseCost:60,  req:'kettle',   ability:'firetrap',   personality:'職人気質', quote:'「焦がさず、しかし確実に仕留める！」', role:'設置型DPS', skillName:'ファイアトラップ', skillDesc:'地面に火炎トラップを置く。Lv3で踏んだ敵に大ダメージ。' },
  ricecooker:{ n:'炊飯器',           em:'🍚', r:'U',  rc:'#f5f5f5', baseCost:65,  req:'kettle',   ability:'steam',      personality:'縁の下の力持ち', quote:'「蒸気で包めば、家はまだ戦える。」', role:'蒸気DoT/補助', skillName:'スチームリカバー', skillDesc:'蒸気で敵に継続ダメージ。Lv3で撃破時に基地HPを少し回復。' },
  // R - Rare
  vacuum:    { n:'掃除機',           em:'🌪️', r:'R',  rc:'#a5d6a7', baseCost:85,  req:'cord',     personality:'完璧主義者', quote:'「塵一つ残さない。それが私のポリシー。」', role:'CC/吸引', skillName:'バキュームプル', skillDesc:'敵をコース上で引き戻す。Lv3で吸引範囲+15%・自動追尾。' },
  router:    { n:'ルーター',         em:'📡', r:'R',  rc:'#80cbc4', baseCost:90,  req:'lamp',     personality:'情報通',           quote:'「全ての情報は私を通る。繋がりは力だ。」', role:'バフ/サポート', skillName:'WiFiオーラ', skillDesc:'周囲の味方の攻速をUP。Lv3でメッシュ化し効果範囲が大幅拡大。' },
  dryer:     { n:'ドライヤー',       em:'💨', r:'R',  rc:'#ef9a9a', baseCost:80,  req:'fan',      personality:'快活',             quote:'「熱風で吹き飛ばせ！元気が一番！」', role:'熱風DPS', skillName:'ヒートブラスト', skillDesc:'熱風で連続ヒット。Lv3で範囲攻撃に変化、複数敵を同時に焼く。' },
  dishwasher:{ n:'食洗機',           em:'🍽️', r:'R',  rc:'#4dd0e1', baseCost:95,  req:'cord',     ability:'wash',       personality:'完璧主義者', quote:'「汚れた敵は、洗い流すだけ。」', role:'浄化/スロー', skillName:'ジェットウォッシュ', skillDesc:'水流で敵を減速。Lv3で詰まり・腐食などの妨害を洗浄し味方を復帰。' },
  // E - Epic
  fridge:    { n:'冷蔵庫',           em:'🧊', r:'E',  rc:'#64b5f6', baseCost:130, req:'vacuum',   personality:'冷静沈着', quote:'「感情は凍らせておけ。冷静さが勝利を呼ぶ。」', role:'CC/凍結', skillName:'アブソリュートフリーズ', skillDesc:'敵を凍結させ停止。Lv3で凍結時間が延長＋ボスにも有効。' },
  aircon:    { n:'エアコン',         em:'❄️', r:'E',  rc:'#4fc3f7', baseCost:140, req:'fan',      personality:'冷静沈着', quote:'「絶対零度の冷気で敵の動きを封じろ！」', role:'範囲CC', skillName:'クライオフィールド', skillDesc:'広範囲を冷気で覆い全敵を低速化。Lv3で凍結チャンスも付与。' },
  speaker:   { n:'スピーカー',       em:'🔊', r:'E',  rc:'#ce93d8', baseCost:120, req:'router',   ability:'slowfield',  personality:'天才型', quote:'「音の波動が世界を変える。聴け、この轟き！」', role:'デバフ/スロー', skillName:'ソニックウェーブ', skillDesc:'音波で敵をスロウ化。Lv3で範囲スロウフィールドを常時展開。' },
  oven:       { n:'オーブン',         em:'🥧', r:'E',  rc:'#ff7043', baseCost:145, req:'toaster',  ability:'bake',       personality:'職人気質', quote:'「予熱は完了。ここから一気に焼き上げる。」', role:'範囲炎上DPS', skillName:'ベイクゾーン', skillDesc:'範囲内の敵を焼き続ける。Lv3で炎上中の敵へのダメージが増加。' },
  // L - Legend
  microwave: { n:'電子レンジ',       em:'🔥', r:'L',  rc:'#ff7043', baseCost:190, req:'toaster',  personality:'熱血漢', quote:'「マイクロ波で内側から燃やし尽くせ！」', role:'重DPS', skillName:'マイクロインフェルノ', skillDesc:'内側から焼く高火力。Lv3で核熱化し残留炎上ダメージ。' },
  washer:    { n:'洗濯機',           em:'🌊', r:'L',  rc:'#26c6da', baseCost:200, req:'fridge',   personality:'頼れる兄貴', quote:'「汚れも敵も全部ぶん回して洗い流す！」', role:'タンク/AOE', skillName:'スピンドレイン', skillDesc:'渦巻きで敵を巻き込みダメージ。Lv3で渦が拡大し基地HPも回復。' },
  coffeemaker:{ n:'コーヒーメーカー', em:'☕', r:'L',  rc:'#8d6e63', baseCost:185, req:'router',   ability:'caffeine',   personality:'情報通', quote:'「眠気を飛ばす。判断速度も火力だ。」', role:'攻速バフ/集中', skillName:'カフェインブースト', skillDesc:'周囲の味方を加速。Lv3で一時的に攻撃間隔をさらに短縮する覚醒を付与。' },
  // M - Mythic
  theater:   { n:'ホームシアター',   em:'🎬', r:'M',  rc:'#e91e63', baseCost:280, req:'router',   personality:'カリスマ', quote:'「我々の戦いは、最高の映画より劇的だ！」', role:'全体バフ', skillName:'シアターモード', skillDesc:'戦場全体に攻速バフ。Lv3で音波ダメージも追加し全味方を底上げ。' },
  projector: { n:'プロジェクター',   em:'📽️', r:'M',  rc:'#ba68c8', baseCost:260, req:'speaker',  personality:'幻想家', quote:'「光と影で描く。これが究極の幻術だ！」', role:'貫通DPS', skillName:'ホログラムビーム', skillDesc:'光線で複数貫通。Lv3でレーザー化し列を一掃。' },
  ihcooker:   { n:'IHクッキングヒーター', em:'🍳', r:'M',  rc:'#ffca28', baseCost:270, req:'oven',     ability:'induction',  personality:'超論理型', quote:'「熱は一点に集める。無駄な火力など存在しない。」', role:'誘導熱DPS', skillName:'インダクションリング', skillDesc:'磁場で敵を焼き、雷・炎チェーンを増幅。Lv3で範囲内の炎上敵へ追撃。' },
  // G - Galaxy
  superpc:   { n:'スーパーPC',       em:'💻', r:'G',  rc:'#00e5ff', baseCost:380, req:'theater',  personality:'超論理型', quote:'「計算完了。敵の消滅確率：99.97%。」', role:'最適化DPS', skillName:'クァンタムカリキュレート', skillDesc:'最適解で敵を撃破。Lv3で次元崩壊弾により範囲全消滅級ダメージ。' },
  tesla:     { n:'テスラコイル',     em:'⚡', r:'G',  rc:'#7c4dff', baseCost:400, req:'dryer',    ability:'chainlightning', personality:'狂天才', quote:'「神をも超える電撃！食らえ、バカ共！」', role:'チェーンDPS', skillName:'チェーンライトニング', skillDesc:'雷が複数敵を連鎖。Lv3でヒット数+1、雷の跳躍範囲も拡大。' },
  // OD - Overdrive
  plasma:    { n:'プラズマキャノン', em:'🔱', r:'OD', rc:'#ffd700', baseCost:500, req:'superpc',  personality:'破壊神', quote:'「宇宙の終わりを見たいか？これが答えだ！！」', role:'AOE殲滅', skillName:'プラズマアポカリプス', skillDesc:'全体貫通の破壊光線。Lv3で「世界を焼く」発動、AOE+30%。' },
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
    { c:0,   pg:0, pc:1, dmg:20, rng:2.2, spd:1.2, lbl:'電気ケトル',     eff:'ヤケド付与' },
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
  ricecooker: [
    { c:0,   pg:1, pc:1, dmg:14, rng:2.2, spd:1.1, lbl:'炊飯器',         eff:'蒸気DoT' },
    { c:70,  pg:1, pc:1, dmg:24, rng:2.6, spd:1.3, lbl:'圧力炊飯器',     eff:'蒸気範囲UP' },
    { c:320, pg:2, pc:2, dmg:38, rng:3.0, spd:1.6, lbl:'土鍋IH炊飯器',   eff:'★撃破時HP回復', abilityUnlock:true },
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
  dishwasher: [
    { c:0,   pg:0, pc:2, dmg:16, rng:2.6, spd:1.1, lbl:'食洗機',         eff:'水流スロー' },
    { c:70,  pg:0, pc:2, dmg:28, rng:3.0, spd:1.4, lbl:'ビルトイン食洗機', eff:'洗浄範囲UP' },
    { c:320, pg:0, pc:3, dmg:44, rng:3.4, spd:1.7, lbl:'業務用食洗機',     eff:'★妨害洗浄', abilityUnlock:true },
  ],
  fridge: [
    { c:0,   pg:0, pc:3, dmg:30, rng:2.4, spd:0.7, lbl:'冷蔵庫',         eff:'凍結攻撃' },
    { c:60,  pg:0, pc:3, dmg:50, rng:2.7, spd:0.9, lbl:'2ドア冷蔵庫',   eff:'攻速UP' },
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
    { c:300, pg:0, pc:6, dmg:110,rng:2.6, spd:0.95,lbl:'業務用レンジ',   eff:'★核熱！', abilityUnlock:true },
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
    { c:300, pg:0, pc:8, dmg:105,rng:4.0, spd:1.8, lbl:'超電磁テスラ',   eff:'★チェーンライトニング', abilityUnlock:true },
  ],
  plasma: [
    { c:0,   pg:0, pc:8, dmg:120,rng:4.0, spd:0.8, lbl:'プラズマキャノン', eff:'全体貫通' },
    { c:60,  pg:0, pc:10,dmg:200,rng:5.0, spd:1.2, lbl:'メガプラズマ',     eff:'攻速UP' },
    { c:300, pg:0, pc:12,dmg:300,rng:6.0, spd:1.8, lbl:'ギガプラズマ',     eff:'★世界を焼く！', abilityUnlock:true },
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
  cockroach:  { em:'🪳',  hp:120,  spd:95,  rew:20, dmg:2, col:'#795548', name:'ゴキブリ', special:'clog', pixel:true },
  mold:       { em:'🍄',  hp:280,  spd:22,  rew:25, dmg:2, col:'#558b2f', name:'カビ', special:'corrode', pixel:true },
  surge:      { em:'⚡',  hp:230,  spd:60,  rew:40, dmg:3, col:'#ffeb3b', name:'過電流モンスター', special:'surge_stun', pixel:true },
  dust_lord:  { em:'👻',  hp:850,  spd:30,  rew:100,dmg:4, col:'#9e9e9e', name:'ホコリ大王', special:'multiply', pixel:true },
  boss:       { em:'🤖',  hp:2000, spd:20,  rew:150,dmg:5, col:'#ff1744', name:'ボスロボット', pixel:true },
  boss_ice:   { em:'🥶',  hp:3500, spd:18,  rew:300,dmg:7, col:'#00bcd4', name:'氷電魔フローズワンダー', bossAbility:'warp', pixel:true },
  boss_fire:  { em:'🔥',  hp:4000, spd:22,  rew:350,dmg:8, col:'#ff3d00', name:'爆熱魔クリムゾンキング', bossAbility:'wall', pixel:true },
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
