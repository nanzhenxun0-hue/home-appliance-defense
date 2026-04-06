import type { TowerID } from './types';

export interface Synergy {
  id: string;
  name: string;
  members: TowerID[];
  minCount: number;
  desc: string;
  effect: {
    dmgMult?: number;
    spdMult?: number;
    powerDiscount?: number; // reduce pc by this %
  };
}

export const SYNERGIES: Synergy[] = [
  {
    id: 'kitchen',
    name: '🍳 キッチン連合',
    members: ['kettle', 'fridge', 'microwave'],
    minCount: 2,
    desc: '火力系ユニットの攻撃力+25%',
    effect: { dmgMult: 1.25 },
  },
  {
    id: 'airflow',
    name: '🌬️ エアフロー',
    members: ['fan', 'aircon', 'washer'],
    minCount: 2,
    desc: '冷却・吸引系の攻速+20%',
    effect: { spdMult: 1.20 },
  },
  {
    id: 'network',
    name: '📶 ネットワーク',
    members: ['router', 'superpc', 'theater'],
    minCount: 2,
    desc: 'バフ系ユニットの消費電力-30%',
    effect: { powerDiscount: 0.30 },
  },
  {
    id: 'powerline',
    name: '🔌 電源ライン',
    members: ['cord', 'lamp', 'vacuum'],
    minCount: 2,
    desc: '基盤ユニットの攻速+15%',
    effect: { spdMult: 1.15 },
  },
  {
    id: 'overdrive',
    name: '⚡ オーバードライブ',
    members: ['plasma', 'superpc', 'microwave'],
    minCount: 2,
    desc: '超火力ユニットの攻撃力+40%',
    effect: { dmgMult: 1.40 },
  },
  {
    id: 'fullhouse',
    name: '🏠 フルハウス',
    members: ['fridge', 'aircon', 'washer', 'microwave', 'theater'],
    minCount: 3,
    desc: '高級家電3体以上で全体攻撃力+15%・消費電力-15%',
    effect: { dmgMult: 1.15, powerDiscount: 0.15 },
  },
];

export const getActiveSynergies = (team: TowerID[]): Synergy[] => {
  return SYNERGIES.filter(syn => {
    const count = syn.members.filter(m => team.includes(m)).length;
    return count >= syn.minCount;
  });
};

export const getSynergyEffects = (team: TowerID[], tid: TowerID) => {
  const active = getActiveSynergies(team);
  let dmgMult = 1;
  let spdMult = 1;
  let powerDiscount = 0;

  for (const syn of active) {
    if (!syn.members.includes(tid)) continue;
    if (syn.effect.dmgMult) dmgMult *= syn.effect.dmgMult;
    if (syn.effect.spdMult) spdMult *= syn.effect.spdMult;
    if (syn.effect.powerDiscount) powerDiscount = Math.min(powerDiscount + syn.effect.powerDiscount, 0.5);
  }

  return { dmgMult, spdMult, powerDiscount };
};
