import type { TowerID } from './types';

/**
 * 各家電の「扱い方」チュートリアル
 * - placement: どこに置くべきか
 * - synergy: 何と組み合わせると強いか
 * - tips: 立ち回りのコツ
 */
export interface TowerUsage {
  placement: string;
  synergy: string;
  tips: string;
}

export const TOWER_USAGE: Record<TowerID, TowerUsage> = {
  cord: {
    placement: '攻撃ユニットの近くに敷く。電力供給の起点。',
    synergy: 'ほぼ全ての家電に必須。複数並べて電力上限を底上げ。',
    tips: '最初に2〜3個置いて電力に余裕を作ろう。Lv3で供給+8/秒。',
  },
  kettle: {
    placement: '道のすぐ隣（射程1.6マス）。序盤の主力DPS。',
    synergy: 'ルーターの攻速バフ／延長コードの電力でフル稼働。',
    tips: 'Lv3でヤケドDoTが超強化。序盤は2体並べると安定。',
  },
  fan: {
    placement: '敵の進路の終盤に。押し戻して時間を稼ぐ。',
    synergy: '低速化ユニット（エアコン等）と組み合わせて完全停止。',
    tips: 'Lv3はスタートまで全戻し。ボス前に置くと永久ループも狙える。',
  },
  lamp: {
    placement: 'マップ中央の長射程ポイント。射程3.5まで届く。',
    synergy: 'ルーターで攻速UP。トースターのトラップに誘導された敵を狙撃。',
    tips: 'Lv3でステルス敵にも有効。後衛として配置。',
  },
  toaster: {
    placement: '敵が必ず通る曲がり角。トラップで奇襲。',
    synergy: '電子レンジと並べて炎上ダメージを重ね掛け。',
    tips: 'Lv3で踏むと大ダメージ。一気に湧くウェーブで真価を発揮。',
  },
  ricecooker: {
    placement: '序盤の攻撃役の後ろ。蒸気範囲が道に重なる位置。',
    synergy: 'ケトル→炊飯器→オーブン→IHの熱チェーン起点。',
    tips: '供給も少し増やせる万能枠。Lv3は撃破時回復で長期戦に強い。',
  },
  vacuum: {
    placement: '道の中盤。引き戻しで敵をループさせる。',
    synergy: 'プラズマやテスラの射程内に引き込んで殲滅。',
    tips: 'Lv3で自動追尾。タンク敵への足止めが超有効。',
  },
  router: {
    placement: '攻撃ユニットの集合地帯の中心。範囲バフ用。',
    synergy: 'ケトル・ランプ・ドライヤー等の攻撃役を全強化。',
    tips: '攻撃しない代わりに最大+50%攻速。早めの設置で全体DPS爆上げ。',
  },
  dryer: {
    placement: '敵が密集する直線。範囲熱風を活かす。',
    synergy: 'テスラへの素材としても重要。ルーターで攻速UP。',
    tips: 'Lv3で範囲攻撃化。複数体まとめて処理可能。',
  },
  dishwasher: {
    placement: '妨害敵が通る中盤。広めの水流で足を止める。',
    synergy: '掃除機・洗濯機と並べて水流制御ラインを作る。',
    tips: 'Lv3で詰まりや腐食を洗浄。事故りやすい後半の保険。',
  },
  fridge: {
    placement: 'ボス戦のキー位置。凍結で無力化。',
    synergy: 'プラズマ・スーパーPC等の重DPSが凍結中に削り切る。',
    tips: 'Lv3でボスにも凍結有効。1体で戦況が変わる。',
  },
  aircon: {
    placement: '広い範囲に効く中央。雑魚処理の起点。',
    synergy: '微ダメージ×低速で長射程砲台と相性◎。',
    tips: 'Lv3で凍結チャンス追加。集団戦の安定剤。',
  },
  speaker: {
    placement: '中央〜後方。敵全体をスロウで足止め。',
    synergy: 'プロジェクターやテスラの貫通DPSと最強コンボ。',
    tips: 'Lv3でスロウフィールド常時展開。射程3.0以上に複数敵がいるとき強力。',
  },
  oven: {
    placement: '曲がり角の少し手前。敵が範囲内に長く残る場所。',
    synergy: 'トースター・電子レンジ・IHと炎上ダメージを重ねる。',
    tips: 'Lv3は炎上敵へ追撃。先にトースターで燃やすと火力が跳ねる。',
  },
  microwave: {
    placement: '中央の対ボス決戦ポイント。低速だが超火力。',
    synergy: 'フリッジで凍結→電子レンジで一撃必殺。',
    tips: 'Lv3で核熱化。電力消費が大きいのでコード多めに。',
  },
  washer: {
    placement: '道の終盤。タンクとAOEで漏れを止める。',
    synergy: '吸引（掃除機）と組み合わせて敵を渦で巻き込む。',
    tips: 'Lv3で基地HP回復。最後の砦として置こう。',
  },
  coffeemaker: {
    placement: '攻撃家電の密集地帯。範囲バフが全員に届く中心。',
    synergy: 'ルーター・シアターと重ねて攻速を限界まで上げる。',
    tips: '攻撃しない時間がある分、強いDPSを2体以上巻き込む配置が必須。',
  },
  theater: {
    placement: '攻撃ユニットの大集団の中央。全体バフ。',
    synergy: 'ルーターと重ねて攻速バフを最大化。',
    tips: 'Lv3で音波ダメージ追加。後半ステージの要。',
  },
  projector: {
    placement: '直線通路に正対。貫通光線が刺さる。',
    synergy: 'スピーカーのスロウで敵を直線上に列ばせる。',
    tips: 'Lv3でレーザー化。一直線の敵を全滅させられる。',
  },
  ihcooker: {
    placement: '熱系ユニットの近く。道の内側で複数方向に届く位置。',
    synergy: '炊飯器→オーブン→IH→テスラ→プラズマの6段チェーン。',
    tips: 'Lv3の追撃リングは炎上前提。熱系を先に置くほど強い。',
  },
  superpc: {
    placement: '中央の最重要拠点。最適化された超火力。',
    synergy: 'シアターのバフ＋プラズマと並べて最強布陣。',
    tips: 'Lv3で次元崩壊。電力消費大、コードを6個以上推奨。',
  },
  tesla: {
    placement: '敵が密集するエリア。連鎖雷で複数撃破。',
    synergy: 'ヴァキューム・スピーカーで敵を集めて連鎖を最大化。',
    tips: 'Lv3でチェーン数+1。集団戦で1体で殲滅可能。',
  },
  plasma: { placement: '最終ライン。全体貫通の最終兵器。', synergy: 'シアター＋ルーター＋スーパーPCで最強チーム。', tips: 'Lv3で「世界を焼く」発動。電力12消費、コード並べて運用。' },
  shaver:      { placement: '道に密着。連続斬りで雑魚を瞬殺。',           synergy: 'ルーターの攻速バフでDPS爆上げ。',                           tips: 'Lv3で出血DoT。タンクに刺すとじわじわ削れる。' },
  printer:     { placement: '中盤に置き、敵集団へインクスプレー。',         synergy: 'ライト系と組ませてデバフ＋狙撃。',                           tips: 'Lv3で命中DOWN。ボス前に置くと貫通対策。' },
  heater:      { placement: '通路の交差点。範囲炎上で集団処理。',           synergy: 'オーブン・電子レンジと炎チェーン。',                         tips: 'Lv3で炎が拡散。密集した敵に大ダメージ。' },
  humidifier:  { placement: '入口付近。霧で速度を削ぐ。',                   synergy: '冷蔵庫・エアコンと組み凍結確率UP。',                         tips: 'Lv3で凍結チャンス。低速＋凍結で完全停止。' },
  iron:        { placement: '道の脇。重撃で確実に1体ずつ。',                synergy: 'ケトル・トースターのDoTで足止め中に殴る。',                  tips: 'Lv3でスタン。ボスにも刺さる。' },
  blender:     { placement: '密集ポイント。回転刃で広く削る。',             synergy: 'ファン・掃除機と組み吸引→粉砕コンボ。',                      tips: 'Lv3で吸引付き。自分で集めて自分で殴れる。' },
  waffleiron:  { placement: '中継地点。格子AOEで複数同時。',               synergy: 'トースター・オーブンと炎特化編成。',                         tips: 'Lv3で焼印スタン。連続スタンで時間稼ぎ。' },
  air_purifier:{ placement: '中央。敵バフを浄化＋スロー。',                 synergy: '食洗機と組み妨害完全除去。',                                tips: 'Lv3で味方デバフも解除。マグネット対策の決定版。' },
  juicer:      { placement: '前線。敵HPを吸って自陣HPに変換。',             synergy: 'ウォーターサーバーと組み回復ループ。',                       tips: 'Lv3で回復量UP。長期戦で強い。' },
  waterserver: { placement: '味方の中央。発熱クールダウン＋HP回復。',       synergy: 'ヒーター・電子レンジ等の高負荷ユニットの近く。',           tips: 'Lv3で基地HP少回復。ボス戦の安定剤。' },
  fryer:       { placement: '通路上。油を撒いて延焼AOE。',                  synergy: 'オーブン・トースターと炎の海を作る。',                       tips: 'Lv3で延焼範囲UP。集団殲滅の主役。' },
  solarpanel:  { placement: '空きマスならどこでも。+電力。',                 synergy: '電力消費の重い高Lvユニットと相性◎。',                       tips: 'Lv3で全体ATK+5%バフ。電力＆火力両得。' },
  battery:     { placement: 'ブレーカー対策で1〜2個。',                      synergy: 'プラズマ・量子チップなど超高消費と組む。',                   tips: 'Lv3でブレーカー時にも電力供給。事故防止の保険。' },
  gameconsole: { placement: '味方の中央。連続撃破でバフ蓄積。',             synergy: 'テスラ・プラズマで撃破ペースUP→バフ最大化。',              tips: 'Lv3で最大+50%。攻撃ユニットを近くに集めよ。' },
  drone:       { placement: 'どこでもOK。マップ全域から狙撃可。',           synergy: 'ルーター・コーヒーメーカーで攻速マシマシ。',                tips: 'Lv3で同時2体。配置に縛られない万能DPS。' },
  heatpump:    { placement: '中盤。凍結+炎上の二重デバフ。',                synergy: '冷蔵庫・オーブンと組みダメージ激増。',                       tips: 'Lv3で同時付与。ボスにも有効。' },
  vrheadset:   { placement: '通路に設置。混乱で敵を逆走させる。',           synergy: 'ファンと組んで永久ループ生成可。',                           tips: 'Lv3で範囲混乱。タワー再配置の時間稼ぎに。' },
  holodeck:    { placement: '広い場所。分身を呼び出して数で押す。',         synergy: 'シアター・ルーターと組み軍隊化。',                           tips: 'Lv3で実体化ダメ。最終局面の切り札。' },
  robotarm:    { placement: '中央。多数同時攻撃の重DPS。',                  synergy: 'スーパーPC・コーヒーメーカーで攻速最大化。',                tips: 'Lv3でアーム+1。1体で2〜3体分の働き。' },
  quantumchip: { placement: '最終ライン。確率即消滅でボス特攻。',           synergy: 'バッテリー・ソーラーで電力確保必須。',                       tips: 'Lv3で対ボス即消滅UP。最強の保険。' },
  promo_starter: { placement: '初心者の中央拠点。電力+2と周囲バフを兼任。', synergy: '攻撃役の隣に置くと全体ATK+10%。', tips: 'チュートリアル修了で1体プレゼント。序盤の相棒。' },
  promo_endless: { placement: '密集ポイント。全方向の波紋AOEで殲滅。',     synergy: '加速バフ系（ルーター/コーヒー）で発生間隔を縮める。',  tips: 'エンドレス100W突破の証。所持＝伝説。' },
  tv:            { placement: '視界の利く中央。広範囲スキャンで全体バフ。',  synergy: '攻撃ユニット密集地で発動率最大化。',                        tips: '全エリア極悪クリアの証。チーム全体ATK+15%。' },
};
