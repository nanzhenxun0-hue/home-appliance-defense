import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TowerID, Rarity } from '@/game/types';
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER, RARITY_BG, GACHA_COST, GACHA_COST_10 } from '@/game/types';
import { TDEFS } from '@/game/constants';
import { ABILITIES } from '@/game/abilities';
import { getTowerSprite } from '@/game/sprites';

interface GachaScreenProps {
  gacha: {
    inv: { owned: TowerID[]; volts: number };
    pull1: () => TowerID | null;
    pull10: () => TowerID[] | null;
  };
  onBack: () => void;
}

const RARITY_RANK: Record<Rarity, number> = { C: 0, U: 1, R: 2, E: 3, L: 4, M: 5, G: 6, OD: 7 };

const getRarityFx = (r: Rarity) => {
  const rank = RARITY_RANK[r];
  if (rank >= 7) return { bg: 'radial-gradient(ellipse, #ffd700, #ff6f00, #000)', particles: 40, screenFlash: '#ffd700' };
  if (rank >= 6) return { bg: 'radial-gradient(ellipse, #00e5ff, #0d47a1, #000)', particles: 30, screenFlash: '#00e5ff' };
  if (rank >= 5) return { bg: 'radial-gradient(ellipse, #e91e63, #4a148c, #000)', particles: 25, screenFlash: '#e91e63' };
  if (rank >= 4) return { bg: 'radial-gradient(ellipse, #ff9800, #e65100, #000)', particles: 20, screenFlash: '#ff9800' };
  if (rank >= 3) return { bg: 'radial-gradient(ellipse, #ab47bc, #4a148c, #000)', particles: 15, screenFlash: '#ab47bc' };
  if (rank >= 2) return { bg: 'radial-gradient(ellipse, #2196f3, #0d47a1, #000)', particles: 10, screenFlash: null };
  return { bg: 'radial-gradient(ellipse, #333, #111, #000)', particles: 5, screenFlash: null };
};

const SpriteIcon = ({ tid, size = 48 }: { tid: TowerID; size?: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const sprite = getTowerSprite(tid);
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, 0, 0, size, size);
    };
    if (sprite.complete) draw();
    else sprite.onload = draw;
  }, [tid, size]);
  return <canvas ref={ref} width={size} height={size} className="block" style={{ imageRendering: 'pixelated' }} />;
};

const GachaScreen = ({ gacha, onBack }: GachaScreenProps) => {
  const [results, setResults] = useState<TowerID[]>([]);
  const [revealIdx, setRevealIdx] = useState(0);
  const [showDetail, setShowDetail] = useState<TowerID | null>(null);
  const [screenFlash, setScreenFlash] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);

  const bestRarity = (tids: TowerID[]): Rarity => {
    let best: Rarity = 'C';
    for (const tid of tids) {
      if (RARITY_RANK[TDEFS[tid].r] > RARITY_RANK[best]) best = TDEFS[tid].r;
    }
    return best;
  };

  const doReveal = (tids: TowerID[]) => {
    setResults(tids);
    setRevealIdx(0);
    setPulling(true);
    const best = bestRarity(tids);
    const fx = getRarityFx(best);

    // Pre-reveal suspense
    if (RARITY_RANK[best] >= 4) {
      setScreenFlash(fx.screenFlash);
      setTimeout(() => setScreenFlash(null), 400);
    }

    // Staggered reveal
    tids.forEach((tid, i) => {
      setTimeout(() => {
        setRevealIdx(i + 1);
        const r = TDEFS[tid].r;
        if (RARITY_RANK[r] >= 5) {
          setScreenFlash(RARITY_COLOR[r]);
          setTimeout(() => setScreenFlash(null), 200);
        }
      }, 500 + i * 300);
    });
    setTimeout(() => setPulling(false), 500 + tids.length * 300 + 200);
  };

  const doPull1 = () => {
    const r = gacha.pull1();
    if (r) doReveal([r]);
  };

  const doPull10 = () => {
    const r = gacha.pull10();
    if (r) doReveal(r);
  };

  const isNew = (tid: TowerID) => !gacha.inv.owned.includes(tid);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-4 relative overflow-hidden">
      {/* Screen flash overlay */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 pointer-events-none"
            style={{ background: screenFlash }}
          />
        )}
      </AnimatePresence>

      {/* BG effect */}
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(270 80% 30%), transparent 70%)' }} />

      {/* Animated particles BG */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: ['#c084fc', '#60a5fa', '#f472b6', '#fbbf24'][i % 4],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ y: [-20, -100], opacity: [0.6, 0] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-3">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <button onClick={onBack} className="game-btn-ghost text-sm">← 戻る</button>
          <div className="flex items-center gap-2">
            <motion.span key={gacha.inv.volts} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
              className="text-yellow-400 font-bold text-lg">⚡ {gacha.inv.volts}V</motion.span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(135deg, #c084fc, #f472b6, #fbbf24)' }}>
          ⚡ デンキガチャ
        </h1>
        <p className="text-muted-foreground text-xs text-center">Waveクリアで稼いだボルトでユニットを獲得！</p>

        {/* Pull buttons */}
        <div className="flex gap-3 w-full">
          <motion.button
            onClick={doPull1}
            disabled={gacha.inv.volts < GACHA_COST || pulling}
            className="game-btn-primary flex-1 py-3 text-sm disabled:opacity-30"
            whileTap={{ scale: 0.95 }}
          >
            1回ガチャ<br /><span className="text-yellow-300 text-xs">{GACHA_COST}V</span>
          </motion.button>
          <motion.button
            onClick={doPull10}
            disabled={gacha.inv.volts < GACHA_COST_10 || pulling}
            className="flex-1 py-3 text-sm font-bold rounded-lg disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
              color: '#fff',
              border: '1px solid rgba(192,38,211,0.5)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            10連ガチャ<br /><span className="text-yellow-200 text-xs">{GACHA_COST_10}V（お得！）</span>
          </motion.button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-5 gap-2 mt-2">
              {results.map((tid, i) => {
                const def = TDEFS[tid];
                const revealed = i < revealIdx;
                const rank = RARITY_RANK[def.r];
                const fx = getRarityFx(def.r);
                return (
                  <motion.div
                    key={`${i}-${tid}`}
                    initial={{ rotateY: 180, scale: 0.5 }}
                    animate={revealed ? { rotateY: 0, scale: 1 } : { rotateY: 180, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    onClick={() => revealed && setShowDetail(tid)}
                    className="flex flex-col items-center p-1.5 rounded-lg cursor-pointer relative overflow-hidden"
                    style={{
                      background: revealed ? fx.bg : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${revealed ? RARITY_COLOR[def.r] + '88' : '#333'}`,
                      boxShadow: revealed && rank >= 4 ? `0 0 16px ${RARITY_COLOR[def.r]}55` : 'none',
                    }}
                  >
                    {revealed ? (
                      <>
                        {rank >= 5 && (
                          <motion.div className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ background: `radial-gradient(circle, ${RARITY_COLOR[def.r]}44, transparent)` }}
                          />
                        )}
                        <SpriteIcon tid={tid} size={32} />
                        <span className="text-[7px] font-black mt-0.5 relative z-10" style={{ color: RARITY_COLOR[def.r] }}>
                          {RARITY_LABEL[def.r]}
                        </span>
                        <span className="text-[8px] text-white/70 mt-0.5 relative z-10">{def.n.slice(0, 4)}</span>
                        {isNew(tid) && (
                          <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="text-[7px] text-yellow-400 font-bold mt-0.5 relative z-10">NEW!</motion.span>
                        )}
                      </>
                    ) : (
                      <motion.span animate={{ rotateZ: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-lg opacity-30">❓</motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <button onClick={() => { setResults([]); }} className="game-btn-ghost w-full mt-3 text-xs">
              閉じる
            </button>
          </div>
        )}

        {/* Detail modal */}
        <AnimatePresence>
          {showDetail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setShowDetail(null)}>
              <motion.div initial={{ scale: 0.5, rotateY: 90 }} animate={{ scale: 1, rotateY: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-72 rounded-2xl p-5 relative overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{
                  background: RARITY_BG[TDEFS[showDetail].r],
                  border: `2px solid ${RARITY_COLOR[TDEFS[showDetail].r]}66`,
                  boxShadow: `0 0 40px ${RARITY_COLOR[TDEFS[showDetail].r]}33`,
                }}>
                {/* Animated BG */}
                <motion.div className="absolute inset-0 pointer-events-none"
                  animate={{ opacity: [0.05, 0.15, 0.05] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ background: `radial-gradient(circle at 50% 30%, ${RARITY_COLOR[TDEFS[showDetail].r]}44, transparent 70%)` }}
                />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <SpriteIcon tid={showDetail} size={80} />
                  <div className="text-center">
                    <div className="font-black text-lg" style={{ color: RARITY_COLOR[TDEFS[showDetail].r] }}>
                      {TDEFS[showDetail].n}
                    </div>
                    <div className="text-xs font-bold" style={{ color: RARITY_COLOR[TDEFS[showDetail].r] }}>
                      {RARITY_LABEL[TDEFS[showDetail].r]}
                    </div>
                  </div>
                  {/* Ability */}
                  <div className="w-full rounded-lg p-3 text-center"
                    style={{ background: RARITY_COLOR[TDEFS[showDetail].r] + '15', border: `1px solid ${RARITY_COLOR[TDEFS[showDetail].r]}33` }}>
                    <div className="text-xs font-bold text-yellow-300 mb-1">
                      {ABILITIES[showDetail].icon} {ABILITIES[showDetail].name}
                    </div>
                    <div className="text-[10px] text-white/70">{ABILITIES[showDetail].desc}</div>
                  </div>
                  <button onClick={() => setShowDetail(null)}
                    className="game-btn-ghost text-xs w-full">閉じる</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Owned units */}
        <div className="w-full mt-2">
          <h3 className="text-sm font-bold text-foreground/80 mb-2">所持ユニット ({gacha.inv.owned.length}/13)</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {gacha.inv.owned.map(tid => {
              const def = TDEFS[tid];
              return (
                <motion.div key={tid}
                  onClick={() => setShowDetail(tid)}
                  className="flex flex-col items-center p-1.5 rounded-lg cursor-pointer"
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: RARITY_COLOR[def.r] + '0a',
                    border: `1px solid ${RARITY_COLOR[def.r]}33`,
                  }}>
                  <SpriteIcon tid={tid} size={28} />
                  <span className="text-[7px] font-bold" style={{ color: RARITY_COLOR[def.r] }}>{def.r}</span>
                  <span className="text-[8px] text-foreground/60">{def.n.slice(0, 5)}</span>
                </motion.div>
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
