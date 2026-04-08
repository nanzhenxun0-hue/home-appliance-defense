import type { AreaKey, AreaDef } from './types';

export const AREAS: Record<AreaKey, AreaDef> = {
  suburb: {
    name: '郊外',
    em: '🏘️',
    desc: '静かな住宅街。初心者に最適',
    col: '#69f0ae',
    waves: [],
    hasBoss: true,
    bossType: 'boss',
  },
  factory: {
    name: '工場地帯',
    em: '🏭',
    desc: '機械の悪魔が蠢く。氷電魔フローズワンダー出現',
    col: '#ff9800',
    waves: [],
    unlockArea: 'suburb',
    hasBoss: true,
    bossType: 'boss_ice',
  },
  downtown: {
    name: '都心',
    em: '🏙️',
    desc: '爆熱魔クリムゾンキングが待ち受ける',
    col: '#f44336',
    waves: [],
    unlockArea: 'factory',
    hasBoss: true,
    bossType: 'boss_fire',
  },
  volcano: {
    name: '火山',
    em: '🌋',
    desc: '灼熱の戦場。全てのボスが出現',
    col: '#ff3d00',
    waves: [],
    unlockArea: 'downtown',
    hasBoss: true,
    bossType: 'final_boss',
  },
  glacier: {
    name: '氷河',
    em: '🧊',
    desc: '最終エリア。家電大魔王デウスマキナが君臨する',
    col: '#00bcd4',
    waves: [],
    unlockArea: 'volcano',
    hasBoss: true,
    bossType: 'final_boss',
  },
};

export const AREA_ORDER: AreaKey[] = ['suburb', 'factory', 'downtown', 'volcano', 'glacier'];
