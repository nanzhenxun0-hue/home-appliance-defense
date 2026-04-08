import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AreaKey, DifficultyKey } from '@/game/types';
import { AREAS, AREA_ORDER } from '@/game/areas';
import { DIFF } from '@/game/constants';
import { useHighScore } from '@/hooks/useHighScore';

interface AreaSelectScreenProps {
  onSelect: (area: AreaKey, diff: DifficultyKey) => void;
  onBack: () => void;
}

const AreaSelectScreen = ({ onSelect, onBack }: AreaSelectScreenProps) => {
  const [selectedArea, setSelectedArea] = useState<AreaKey | null>(null);
  const { getBest } = useHighScore();

  if (selectedArea) {
    const area = AREAS[selectedArea];
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center p-4 pt-6">
        <div className="max-w-md w-full">
          <button onClick={() => setSelectedArea(null)} className="game-btn-ghost text-sm mb-4">← エリア選択に戻る</button>
          <div className="text-center mb-4">
            <span className="text-3xl">{area.em}</span>
            <h2 className="text-lg font-black mt-1" style={{ color: area.col }}>{area.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{area.desc}</p>
          </div>

          <h3 className="text-sm font-bold text-foreground/80 mb-3 text-center">難易度を選択</h3>
          <div className="flex flex-col gap-2.5">
            {(Object.entries(DIFF) as [DifficultyKey, typeof DIFF[DifficultyKey]][]).map(([key, d], i) => {
              const best = getBest(key);
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => onSelect(selectedArea, key)}
                  className="glass-panel p-3 flex items-center gap-3 text-left transition-all hover:brightness-125"
                  style={{ borderColor: d.col + '33' }}
                >
                  <span className="text-2xl">{d.em}</span>
                  <div className="flex-1">
                    <div className="font-black text-sm" style={{ color: d.col }}>{d.label}</div>
                    <div className="text-[10px] text-muted-foreground">{d.desc}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {[['❤️', `HP:${d.shp}`], ['⚡', `${d.sp}W`], ['👾', `x${d.hpM}`]].map(([em, t]) => (
                        <span key={t} className="game-badge text-[8px]">{em}{t}</span>
                      ))}
                    </div>
                    {best && (
                      <div className="text-[8px] text-game-gold mt-0.5">🏆 Wave {best.wave} {best.won ? '✅' : ''}</div>
                    )}
                  </div>
                  <span className="text-muted-foreground">›</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-4 pt-6">
      <div className="max-w-md w-full">
        <button onClick={onBack} className="game-btn-ghost text-sm mb-4">← 戻る</button>
        <h2 className="text-xl font-black text-game-gold text-center mb-1">🗺️ エリア選択</h2>
        <p className="text-xs text-muted-foreground text-center mb-4">挑戦するエリアを選んでください</p>

        <div className="flex flex-col gap-3">
          {AREA_ORDER.map((key, i) => {
            const area = AREAS[key];
            const locked = area.unlockArea ? true : false; // TODO: track clears
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => !locked && setSelectedArea(key)}
                disabled={locked}
                className="glass-panel p-4 flex items-center gap-3 text-left transition-all disabled:opacity-40"
                style={{ borderColor: !locked ? area.col + '44' : undefined }}
              >
                <span className="text-3xl">{locked ? '🔒' : area.em}</span>
                <div className="flex-1">
                  <div className="font-black text-base" style={{ color: locked ? '#666' : area.col }}>{area.name}</div>
                  <div className="text-[10px] text-muted-foreground">{area.desc}</div>
                  {area.bossType && (
                    <div className="text-[9px] text-game-red mt-1">
                      👹 ボス: {area.bossType === 'boss_ice' ? '氷電魔フローズワンダー' :
                        area.bossType === 'boss_fire' ? '爆熱魔クリムゾンキング' :
                        area.bossType === 'final_boss' ? '家電大魔王デウスマキナ' : 'ボスロボット'}
                    </div>
                  )}
                </div>
                {!locked && <span className="text-muted-foreground text-xl">›</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AreaSelectScreen;
