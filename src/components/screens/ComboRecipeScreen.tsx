import { motion } from 'framer-motion';
import type { TowerID } from '@/game/types';
import { RARITY_COLOR } from '@/game/types';
import { TDEFS } from '@/game/constants';
import { CHAIN_COMBOS, getAvailableCombos } from '@/game/chainCombo';

interface ComboRecipeScreenProps {
  owned: TowerID[];
  onBack: () => void;
}

const ComboRecipeScreen = ({ owned, onBack }: ComboRecipeScreenProps) => {
  const combos = getAvailableCombos(owned);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-8">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-game-gold font-black text-lg mb-1 text-center"
      >
        🔗 チェーンコンボレシピ
      </motion.h2>
      <p className="text-muted-foreground text-[10px] mb-4 text-center">
        フィールドに依存チェーンを完成させるとボーナス発動！
      </p>

      <div className="w-full max-w-md space-y-2 overflow-y-auto flex-1 pb-16">
        {combos.map(({ combo, ready, missing }, i) => (
          <motion.div
            key={combo.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-panel p-3 border ${ready ? 'border-game-gold/50' : 'border-transparent'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{combo.em}</span>
                <span className="text-foreground font-black text-xs">{combo.name}</span>
              </div>
              {ready ? (
                <span className="text-[9px] bg-game-gold/20 text-game-gold px-2 py-0.5 rounded-full font-bold">
                  発動可能！
                </span>
              ) : (
                <span className="text-[9px] bg-muted/30 text-muted-foreground px-2 py-0.5 rounded-full">
                  {missing.length}体不足
                </span>
              )}
            </div>

            {/* Chain visualization */}
            <div className="flex items-center gap-1 flex-wrap mb-2">
              {combo.chain.map((tid, ci) => {
                const def = TDEFS[tid];
                const has = owned.includes(tid);
                return (
                  <div key={tid} className="flex items-center gap-1">
                    <div
                      className={`flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] ${
                        has ? 'bg-game-surface' : 'bg-muted/20 opacity-40'
                      }`}
                      style={{ borderLeft: `3px solid ${has ? RARITY_COLOR[def.r] : '#555'}` }}
                    >
                      <span>{def.em}</span>
                      <span className="text-foreground/80">{def.n}</span>
                    </div>
                    {ci < combo.chain.length - 1 && (
                      <span className="text-game-green text-[10px] font-black">→</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Description & bonus */}
            <div className="text-muted-foreground text-[10px] mb-1">{combo.desc}</div>
            <div className="flex gap-3 text-[9px]">
              {combo.bonus.dmgMult > 1 && (
                <span className="text-game-red">
                  🗡️ 攻撃力 +{Math.round((combo.bonus.dmgMult - 1) * 100)}%
                </span>
              )}
              {combo.bonus.spdMult > 1 && (
                <span className="text-game-blue">
                  ⚡ 攻速 +{Math.round((combo.bonus.spdMult - 1) * 100)}%
                </span>
              )}
            </div>

            {/* Missing units */}
            {missing.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[9px] text-muted-foreground">不足:</span>
                {missing.map(tid => (
                  <span
                    key={tid}
                    className="text-[9px] bg-destructive/20 text-destructive rounded px-1.5 py-0.5"
                  >
                    {TDEFS[tid].em} {TDEFS[tid].n}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm">
        <button onClick={onBack} className="game-btn-secondary w-full">
          ← 戻る
        </button>
      </div>
    </div>
  );
};

export default ComboRecipeScreen;
