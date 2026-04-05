import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TowerID, Rarity } from '@/game/types';
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER, GACHA_COST, GACHA_COST_10 } from '@/game/types';
import { TDEFS } from '@/game/constants';

interface GachaScreenProps {
  gacha: {
    inv: { owned: TowerID[]; volts: number };
    pull1: () => TowerID | null;
    pull10: () => TowerID[] | null;
  };
  onBack: () => void;
}

const GachaScreen = ({ gacha, onBack }: GachaScreenProps) => {
  const [results, setResults] = useState<TowerID[]>([]);
  const [revealing, setRevealing] = useState(false);
  const [revealIdx, setRevealIdx] = useState(0);

  const doPull1 = () => {
    const r = gacha.pull1();
    if (r) {
      setResults([r]);
      setRevealing(true);
      setRevealIdx(0);
      setTimeout(() => setRevealIdx(1), 600);
    }
  };

  const doPull10 = () => {
    const r = gacha.pull10();
    if (r) {
      setResults(r);
      setRevealing(true);
      setRevealIdx(0);
      r.forEach((_, i) => {
        setTimeout(() => setRevealIdx(i + 1), 300 + i * 200);
      });
    }
  };

  const isNew = (tid: TowerID) => !gacha.inv.owned.includes(tid);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-4 relative overflow-hidden">
      {/* BG effect */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(270 80% 30%), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-4">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <button onClick={onBack} className="game-btn-ghost text-sm">← 戻る</button>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold text-lg">⚡ {gacha.inv.volts}V</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-purple-300 tracking-tight">⚡ ガチャ</h1>
        <p className="text-muted-foreground text-xs text-center">Waveクリアで稼いだボルトでユニットを獲得！</p>

        {/* Pull buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={doPull1}
            disabled={gacha.inv.volts < GACHA_COST}
            className="game-btn-primary flex-1 py-3 text-sm disabled:opacity-30"
          >
            1回ガチャ<br /><span className="text-yellow-300 text-xs">{GACHA_COST}V</span>
          </button>
          <button
            onClick={doPull10}
            disabled={gacha.inv.volts < GACHA_COST_10}
            className="flex-1 py-3 text-sm font-bold rounded-lg disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
              color: '#fff',
              border: '1px solid rgba(192,38,211,0.5)',
            }}
          >
            10連ガチャ<br /><span className="text-yellow-200 text-xs">{GACHA_COST_10}V（お得！）</span>
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-5 gap-2 mt-2">
              {results.map((tid, i) => {
                const def = TDEFS[tid];
                const revealed = i < revealIdx;
                return (
                  <motion.div
                    key={`${i}-${tid}`}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={revealed ? { rotateY: 0, opacity: 1 } : { rotateY: 180, opacity: 0.3 }}
                    transition={{ duration: 0.4, delay: 0 }}
                    className="flex flex-col items-center p-2 rounded-lg"
                    style={{
                      background: revealed ? RARITY_COLOR[def.r] + '15' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${revealed ? RARITY_COLOR[def.r] + '55' : '#333'}`,
                    }}
                  >
                    {revealed ? (
                      <>
                        <span className="text-xl">{def.em}</span>
                        <span className="text-[7px] font-black mt-0.5" style={{ color: RARITY_COLOR[def.r] }}>
                          {RARITY_LABEL[def.r]}
                        </span>
                        <span className="text-[8px] text-foreground/70 mt-0.5">{def.n.slice(0, 4)}</span>
                        {isNew(tid) && (
                          <span className="text-[7px] text-yellow-400 font-bold mt-0.5">NEW!</span>
                        )}
                      </>
                    ) : (
                      <span className="text-lg opacity-30">❓</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <button onClick={() => { setResults([]); setRevealing(false); }} className="game-btn-ghost w-full mt-3 text-xs">
              閉じる
            </button>
          </div>
        )}

        {/* Owned units */}
        <div className="w-full mt-2">
          <h3 className="text-sm font-bold text-foreground/80 mb-2">所持ユニット ({gacha.inv.owned.length})</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {gacha.inv.owned.map(tid => {
              const def = TDEFS[tid];
              return (
                <div key={tid} className="flex flex-col items-center p-1.5 rounded-lg"
                  style={{
                    background: RARITY_COLOR[def.r] + '0a',
                    border: `1px solid ${RARITY_COLOR[def.r]}33`,
                  }}>
                  <span className="text-lg">{def.em}</span>
                  <span className="text-[7px] font-bold" style={{ color: RARITY_COLOR[def.r] }}>{def.r}</span>
                  <span className="text-[8px] text-foreground/60">{def.n.slice(0, 5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rates */}
        <details className="w-full text-xs text-muted-foreground mt-2">
          <summary className="cursor-pointer text-center">排出確率</summary>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {RARITY_ORDER.map(r => (
              <div key={r} className="text-center p-1 rounded" style={{ background: RARITY_COLOR[r] + '15', color: RARITY_COLOR[r] }}>
                <div className="font-bold">{r}</div>
                <div className="text-[9px]">{RARITY_LABEL[r]}</div>
                <div className="text-[10px] font-mono">{((r === 'C' ? 0.35 : r === 'U' ? 0.25 : r === 'R' ? 0.15 : r === 'E' ? 0.12 : r === 'L' ? 0.06 : r === 'M' ? 0.04 : r === 'G' ? 0.02 : 0.01) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default GachaScreen;
