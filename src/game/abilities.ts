// Special abilities for each tower type
import type { TowerID } from './types';

export interface AbilityDef {
  name: string;
  desc: string;
  icon: string;
  /** passive = always active, active = triggers on attack */
  type: 'passive' | 'active';
}

export const ABILITIES: Record<TowerID, AbilityDef> = {
  cord:      { name: 'パワーチェーン', desc: '隣接タワーの発電量+1W', icon: '🔗', type: 'passive' },
  kettle:    { name: 'スチームバースト', desc: '攻撃時30%で範囲ヤケド', icon: '💨', type: 'active' },
  fan:       { name: 'サイクロンウォール', desc: '敵の移動速度-15%（範囲内）', icon: '🌬️', type: 'passive' },
  lamp:      { name: 'スポットライト', desc: '照射した敵の被ダメ+20%', icon: '🔦', type: 'active' },
  vacuum:    { name: 'ブラックホール', desc: '3秒毎に範囲内の敵を中心に引き寄せ', icon: '🕳️', type: 'active' },
  router:    { name: 'ネットブースト', desc: '範囲内タワーのレンジ+0.3', icon: '📶', type: 'passive' },
  fridge:    { name: 'アブソリュートゼロ', desc: '凍結した敵に+50%ダメージ', icon: '🧊', type: 'passive' },
  aircon:    { name: 'ブリザードゾーン', desc: '範囲内の全敵を減速（常時）', icon: '🌨️', type: 'passive' },
  microwave: { name: 'メルトダウン', desc: '敵撃破時に爆発し周囲にダメージ', icon: '💥', type: 'active' },
  washer:    { name: 'タイダルウェーブ', desc: '5秒毎に津波で全敵ノックバック', icon: '🌊', type: 'active' },
  theater:   { name: '低音振動', desc: '範囲内の敵のHPリジェネを無効化', icon: '🎵', type: 'passive' },
  superpc:   { name: 'ターゲットロック', desc: 'HP最大の敵を優先攻撃＋クリ率20%', icon: '🎯', type: 'passive' },
  plasma:    { name: 'オーバードライブ', desc: '全体攻撃＋低HP敵を即死', icon: '⚡', type: 'active' },
};
