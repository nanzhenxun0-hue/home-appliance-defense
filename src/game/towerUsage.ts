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
  plasma: {
    placement: '最終ライン。全体貫通の最終兵器。',
    synergy: 'シアター＋ルーター＋スーパーPCで最強チーム。',
    tips: 'Lv3で「世界を焼く」発動。電力12消費、コード並べて運用。',
  },
};
