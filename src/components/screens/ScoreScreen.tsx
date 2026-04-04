import { useHighScore } from '@/hooks/useHighScore';
import { DIFF } from '@/game/constants';
import { motion } from 'framer-motion';

interface ScoreScreenProps {
  onBack: () => void;
}

const ScoreScreen = ({ onBack }: ScoreScreenProps) => {
  const { getScores } = useHighScore();
  const scores = getScores();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
      <div className="max-w-lg w-full">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-game-gold font-black text-xl mb-5 text-center"
        >
          🏆 ハイスコア
        </motion.h2>

        {scores.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-12">
            まだ記録がありません。ゲームをプレイしよう！
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scores.slice(0, 10).map((s, i) => {
              const d = DIFF[s.diff];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel p-3 flex items-center gap-3"
                >
                  <span className="text-game-gold font-black text-sm w-6 text-center">
                    {i + 1}
                  </span>
                  <span className="text-lg">{d.em}</span>
                  <div className="flex-1">
                    <span className="font-bold text-xs" style={{ color: d.col }}>{d.label}</span>
                    <span className="text-muted-foreground text-[10px] ml-2">
                      Wave {s.wave} {s.won ? '✅' : '💀'}
                    </span>
                  </div>
                  <span className="text-game-gold text-xs font-bold">{s.power}W</span>
                  <span className="text-muted-foreground text-[9px]">{s.date}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        <button onClick={onBack} className="game-btn-secondary w-full mt-5">
          ← 戻る
        </button>
      </div>
    </div>
  );
};

export default ScoreScreen;
