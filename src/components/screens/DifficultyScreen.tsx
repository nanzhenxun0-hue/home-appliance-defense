import { useState } from 'react';
import { motion } from 'framer-motion';
import { DIFF } from '@/game/constants';
import type { DifficultyKey } from '@/game/types';
import { useHighScore } from '@/hooks/useHighScore';

interface DifficultyScreenProps {
  onSelect: (diff: DifficultyKey) => void;
  onBack: () => void;
}

const DifficultyScreen = ({ onSelect, onBack }: DifficultyScreenProps) => {
  const [hov, setHov] = useState<DifficultyKey | null>(null);
  const { getBest } = useHighScore();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="max-w-lg w-full">
        <button onClick={onBack} className="game-btn-ghost text-xs mb-4 px-3 py-1">← 戻る</button>
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-game-gold font-black text-xl mb-1 text-center"
        >
          難易度を選んでください
        </motion.h2>
        <p className="text-muted-foreground text-[11px] mb-6 text-center">
          難しいほど敵が強く速い。電力も少なめ。
        </p>

        <div className="flex flex-col gap-3">
          {(Object.entries(DIFF) as [DifficultyKey, typeof DIFF[DifficultyKey]][]).map(([key, d], i) => {
            const isH = hov === key;
            const best = getBest(key);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => onSelect(key)}
                onMouseEnter={() => setHov(key)}
                onMouseLeave={() => setHov(null)}
                className="glass-panel p-4 cursor-pointer flex items-center gap-4 transition-all duration-150"
                style={{
                  borderColor: isH ? d.col : undefined,
                  transform: isH ? 'scale(1.02) translateX(3px)' : undefined,
                  boxShadow: isH ? `0 6px 24px ${d.col}33` : undefined,
                }}
              >
                <span className="text-3xl">{d.em}</span>
                <div className="flex-1">
                  <div className="font-black text-base" style={{ color: d.col }}>{d.label}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{d.desc}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[
                      ['❤️', `HP:${d.shp}`],
                      ['⚡', `初期:${d.sp}W`],
                      ['👾', `x${d.hpM}`],
                      ['💨', `x${d.spdM}`],
                    ].map(([em, t]) => (
                      <span key={t} className="game-badge text-[9px]">{em}{t}</span>
                    ))}
                  </div>
                  {best && (
                    <div className="text-[9px] text-game-gold mt-1">
                      🏆 ベスト: Wave {best.wave} {best.won ? '✅クリア' : ''}
                    </div>
                  )}
                </div>
                <div className="text-xl" style={{ color: isH ? d.col : 'var(--muted-foreground)' }}>›</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DifficultyScreen;
