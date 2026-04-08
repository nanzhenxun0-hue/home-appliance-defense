import type { TowerID } from './types';

export interface ChainCombo {
  id: string;
  name: string;
  em: string;
  chain: TowerID[];
  desc: string;
  bonus: {
    dmgMult: number;
    spdMult: number;
  };
}

export const CHAIN_COMBOS: ChainCombo[] = [
  {
    id: 'power_surge',
    name: '⚡ パワーサージ',
    em: '⚡',
    chain: ['cord', 'fan', 'aircon'],
    desc: 'コード→扇風機→エアコンの冷却ライン',
    bonus: { dmgMult: 1.15, spdMult: 1.10 },
  },
  {
    id: 'clean_sweep',
    name: '🌪️ クリーンスウィープ',
    em: '🌪️',
    chain: ['cord', 'vacuum', 'fridge'],
    desc: 'コード→掃除機→冷蔵庫の吸引冷却コンボ',
    bonus: { dmgMult: 1.20, spdMult: 1.0 },
  },
  {
    id: 'frost_chain',
    name: '❄️ フロストチェーン',
    em: '❄️',
    chain: ['cord', 'vacuum', 'fridge', 'washer'],
    desc: '吸引→冷凍→渦巻きの4段チェーン',
    bonus: { dmgMult: 1.30, spdMult: 1.10 },
  },
  {
    id: 'info_highway',
    name: '📡 情報ハイウェイ',
    em: '📡',
    chain: ['kettle', 'lamp', 'router'],
    desc: 'ケトル→ライト→ルーターの知識ライン',
    bonus: { dmgMult: 1.0, spdMult: 1.25 },
  },
  {
    id: 'media_empire',
    name: '🎬 メディアエンパイア',
    em: '🎬',
    chain: ['kettle', 'lamp', 'router', 'theater'],
    desc: '情報→娯楽の4段チェーン',
    bonus: { dmgMult: 1.20, spdMult: 1.20 },
  },
  {
    id: 'cyber_core',
    name: '💻 サイバーコア',
    em: '💻',
    chain: ['kettle', 'lamp', 'router', 'theater', 'superpc'],
    desc: '5段の最強デジタルチェーン',
    bonus: { dmgMult: 1.35, spdMult: 1.25 },
  },
  {
    id: 'overdrive_chain',
    name: '🔥 オーバードライブチェーン',
    em: '🔥',
    chain: ['kettle', 'lamp', 'router', 'theater', 'superpc', 'plasma'],
    desc: '最長6段！究極の破壊チェーン',
    bonus: { dmgMult: 1.50, spdMult: 1.30 },
  },
  {
    id: 'heat_wave',
    name: '♨️ ヒートウェーブ',
    em: '♨️',
    chain: ['kettle', 'toaster', 'microwave'],
    desc: 'ケトル→トースター→レンジの灼熱コンボ',
    bonus: { dmgMult: 1.25, spdMult: 1.0 },
  },
  {
    id: 'wind_tunnel',
    name: '🌬️ ウィンドトンネル',
    em: '🌬️',
    chain: ['cord', 'fan', 'dryer'],
    desc: 'コード→扇風機→ドライヤーの風チェーン',
    bonus: { dmgMult: 1.15, spdMult: 1.20 },
  },
  {
    id: 'thunder_path',
    name: '⚡ サンダーパス',
    em: '⚡',
    chain: ['cord', 'fan', 'dryer', 'tesla'],
    desc: '風→雷の4段チェーン',
    bonus: { dmgMult: 1.35, spdMult: 1.15 },
  },
  {
    id: 'sound_system',
    name: '🔊 サウンドシステム',
    em: '🔊',
    chain: ['kettle', 'lamp', 'router', 'speaker'],
    desc: '情報→音波の4段チェーン',
    bonus: { dmgMult: 1.15, spdMult: 1.25 },
  },
  {
    id: 'cinema_deluxe',
    name: '📽️ シネマデラックス',
    em: '📽️',
    chain: ['kettle', 'lamp', 'router', 'speaker', 'projector'],
    desc: '音響→映像の5段メディアチェーン',
    bonus: { dmgMult: 1.25, spdMult: 1.30 },
  },
];

export const getChainDepth = (tid: TowerID): number => {
  const chain: TowerID[] = [tid];
  let cur = tid;
  const { TDEFS } = require('./constants');
  while (TDEFS[cur]?.req) {
    cur = TDEFS[cur].req!;
    chain.unshift(cur);
  }
  return chain.length;
};

export const getActiveChainCombos = (placedTowers: TowerID[]): ChainCombo[] => {
  const placed = new Set(placedTowers);
  return CHAIN_COMBOS.filter(combo =>
    combo.chain.every(t => placed.has(t))
  );
};

export const getChainComboEffects = (placedTowers: TowerID[], tid: TowerID) => {
  const active = getActiveChainCombos(placedTowers);
  let dmgMult = 1;
  let spdMult = 1;
  for (const combo of active) {
    if (!combo.chain.includes(tid)) continue;
    dmgMult *= combo.bonus.dmgMult;
    spdMult *= combo.bonus.spdMult;
  }
  return { dmgMult, spdMult };
};

export const getAvailableCombos = (owned: TowerID[]): { combo: ChainCombo; ready: boolean; missing: TowerID[] }[] => {
  const ownedSet = new Set(owned);
  return CHAIN_COMBOS.map(combo => {
    const missing = combo.chain.filter(t => !ownedSet.has(t));
    return { combo, ready: missing.length === 0, missing };
  });
};
