import type { TowerID } from './types';
import { TDEFS } from './constants';

/** A chain combo: a sequence of towers connected by dependency */
export interface ChainCombo {
  id: string;
  name: string;
  em: string;
  chain: TowerID[];
  desc: string;
  bonus: {
    dmgMult: number;   // multiplier for all towers in chain
    spdMult: number;
  };
}

// Build the full dependency tree upward: tower → its req → req's req → ...
const buildChainUp = (tid: TowerID): TowerID[] => {
  const chain: TowerID[] = [tid];
  let cur = tid;
  while (TDEFS[cur]?.req) {
    cur = TDEFS[cur].req!;
    chain.unshift(cur);
  }
  return chain;
};

// All defined chain combos (length ≥ 3 chains get bonuses)
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
    chain: ['kettle', 'microwave'],
    desc: 'ケトル→レンジの灼熱コンボ',
    bonus: { dmgMult: 1.25, spdMult: 1.0 },
  },
];

/** Get chain depth for a placed tower (how long its dependency chain is) */
export const getChainDepth = (tid: TowerID): number => buildChainUp(tid).length;

/** Get all active chain combos based on towers placed on grid */
export const getActiveChainCombos = (placedTowers: TowerID[]): ChainCombo[] => {
  const placed = new Set(placedTowers);
  return CHAIN_COMBOS.filter(combo =>
    combo.chain.every(t => placed.has(t))
  );
};

/** Get chain combo effects for a specific tower */
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

/** Check which combos a player can potentially make with owned towers */
export const getAvailableCombos = (owned: TowerID[]): { combo: ChainCombo; ready: boolean; missing: TowerID[] }[] => {
  const ownedSet = new Set(owned);
  return CHAIN_COMBOS.map(combo => {
    const missing = combo.chain.filter(t => !ownedSet.has(t));
    return { combo, ready: missing.length === 0, missing };
  });
};
