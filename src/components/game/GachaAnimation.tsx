import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import type { TowerID, Rarity } from '@/game/types';
import { RARITY_COLOR, RARITY_LABEL } from '@/game/types';
import { TDEFS } from '@/game/constants';

type Phase = 'idle' | 'truck' | 'unbox' | 'reveal' | 'done';

interface GachaAnimationProps {
  results: TowerID[];
  onComplete: () => void;
  playSound?: (name: string) => void;
  isNew: (tid: TowerID) => boolean;
}

const getBoxStyle = (rarity: Rarity) => {
  switch (rarity) {
    case 'C': return { bg: '#8B6914', border: '#a07828', label: '', glow: 'none' };
    case 'U': return { bg: '#7B5B2A', border: '#9a7540', label: '', glow: 'none' };
    case 'R': return { bg: '#6B4226', border: '#8a5a38', label: '⚠ 精密機器', glow: '0 0 8px rgba(33,150,243,0.3)' };
    case 'E': return { bg: '#5A3080', border: '#7a48a8', label: '⚠ 精密機器', glow: '0 0 12px rgba(171,71,188,0.4)' };
    case 'L': return { bg: '#3A2A10', border: '#c8a050', label: '取扱注意', glow: '0 0 14px rgba(255,152,0,0.4)' };
    case 'M': return { bg: '#1a1a2e', border: '#e91e63', label: '★特別仕様★', glow: '0 0 16px rgba(233,30,99,0.5)' };
    case 'G': return { bg: '#0a2a3a', border: '#00e5ff', label: '★★超高級★★', glow: '0 0 20px rgba(0,229,255,0.5)' };
    case 'OD': return { bg: '#1a1500', border: '#ffd700', label: '⚡OVERDRIVE⚡', glow: '0 0 30px rgba(255,215,0,0.6)' };
  }
};

const GachaAnimation = ({ results, onComplete, playSound, isNew }: GachaAnimationProps) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [revealIdx, setRevealIdx] = useState(0);
  const [tapReady, setTapReady] = useState(false);

  const highestRarity = results.reduce((best, tid) => {
    const r = TDEFS[tid]?.r || 'C';
    const order = ['C','U','R','E','L','M','G','OD'];
    return order.indexOf(r) > order.indexOf(best) ? r : best;
  }, 'C' as Rarity);

  const hasOD = results.some(tid => TDEFS[tid]?.r === 'OD');
  const hasHighRare = results.some(tid => {
    const r = TDEFS[tid]?.r;
    return r === 'G' || r === 'M' || r === 'L';
  });

  useEffect(() => {
    if (results.length === 0) { setPhase('idle'); return; }
    setPhase('truck');
    playSound?.('gacha_pull');

    const t1 = setTimeout(() => {
      setPhase('unbox');
      setTapReady(true);
    }, 2200);

    return () => clearTimeout(t1);
  }, [results]);

  const handleTapOpen = useCallback(() => {
    if (!tapReady) return;
    setTapReady(false);
    playSound?.('ui_tap');
    
    if (hasOD) {
      playSound?.('gacha_od');
    } else if (hasHighRare) {
      playSound?.('gacha_rare');
    }

    setPhase('reveal');
    setRevealIdx(0);

    const delay = hasOD ? 400 : hasHighRare ? 300 : 200;
    results.forEach((tid, i) => {
      setTimeout(() => {
        setRevealIdx(prev => prev + 1);
        const def = TDEFS[tid];
        if (def.r === 'OD') playSound?.('gacha_od');
        else if (['G','M','L'].includes(def.r)) playSound?.('gacha_rare');
        else playSound?.('gacha_reveal');
      }, 600 + i * delay);
    });

    setTimeout(() => setPhase('done'), 600 + results.length * delay + 800);
  }, [tapReady, results, hasOD, hasHighRare, playSound]);

  if (phase === 'idle') return null;

  const boxStyle = getBoxStyle(highestRarity);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={phase === 'done' ? onComplete : phase === 'unbox' ? handleTapOpen : undefined}>

      <AnimatePresence mode="wait">
        {/* ── Phase: Truck arriving ── */}
        {phase === 'truck' && (
          <motion.div key="truck" className="flex flex-col items-center gap-4"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}>
            
            {/* Truck */}
            <div className="relative">
              <motion.div className="text-7xl"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.4, repeat: 4 }}>
                🚚
              </motion.div>
              <motion.div className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-foreground/20"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8 }} />
            </div>

            <motion.div className="text-sm font-bold text-foreground/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ duration: 1.5, delay: 0.5 }}>
              📦 お届け物が届きました...
            </motion.div>

            {/* Rarity hint: sparks for high rarity */}
            {(hasOD || hasHighRare) && (
              <motion.div className="flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}>
                {hasOD && <span className="text-game-gold text-xs animate-pulse">⚡⚡⚡</span>}
                {hasHighRare && !hasOD && <span className="text-purple-400 text-xs animate-pulse">✨✨</span>}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Phase: Unbox (tap to open) ── */}
        {phase === 'unbox' && (
          <motion.div key="unbox" className="flex flex-col items-center gap-4 cursor-pointer"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}>
            
            {/* Cardboard box */}
            <motion.div className="relative w-40 h-40 rounded-lg flex items-center justify-center"
              style={{
                background: boxStyle.bg,
                border: `3px solid ${boxStyle.border}`,
                boxShadow: boxStyle.glow,
              }}
              animate={{ rotate: [-1, 1, -1] }}
              transition={{ duration: 0.5, repeat: Infinity }}>
              
              {/* Tape */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full"
                style={{ background: 'rgba(200,180,120,0.3)', borderLeft: '1px dashed rgba(255,255,255,0.15)', borderRight: '1px dashed rgba(255,255,255,0.15)' }} />
              
              {/* Label */}
              {boxStyle.label && (
                <div className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(255,0,0,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,0,0,0.3)' }}>
                  {boxStyle.label}
                </div>
              )}

              <span className="text-5xl">📦</span>

              {/* OD electric sparks */}
              {hasOD && (
                <motion.div className="absolute inset-0 rounded-lg"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  style={{ boxShadow: '0 0 30px rgba(255,215,0,0.5), inset 0 0 20px rgba(255,215,0,0.2)' }} />
              )}
            </motion.div>

            <motion.div className="text-sm font-bold"
              style={{ color: hasOD ? '#ffd700' : '#aaa' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}>
              タップして開封！
            </motion.div>
          </motion.div>
        )}

        {/* ── Phase: Reveal results ── */}
        {(phase === 'reveal' || phase === 'done') && (
          <motion.div key="reveal" className="flex flex-col items-center gap-3 w-full max-w-xs px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}>

            {/* Packing material scatter effect */}
            <motion.div className="text-xs text-foreground/30 mb-1"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}>
              プチプチ... 🫧🫧🫧
            </motion.div>

            <div className="grid grid-cols-5 gap-2 w-full">
              {results.map((tid, i) => {
                const def = TDEFS[tid];
                const revealed = i < revealIdx;
                const bs = getBoxStyle(def.r);
                return (
                  <motion.div key={`${i}-${tid}`}
                    className="flex flex-col items-center p-1.5 rounded-lg relative overflow-hidden"
                    initial={{ scale: 0.3, opacity: 0, rotateY: 180 }}
                    animate={revealed ? { scale: 1, opacity: 1, rotateY: 0 } : { scale: 0.6, opacity: 0.2 }}
                    transition={{ duration: 0.4, type: 'spring', damping: 15 }}
                    style={{
                      background: revealed ? RARITY_COLOR[def.r] + '18' : bs.bg + '40',
                      border: `1.5px solid ${revealed ? RARITY_COLOR[def.r] + '66' : '#333'}`,
                      boxShadow: revealed ? bs.glow : 'none',
                    }}>
                    {revealed ? (
                      <>
                        {def.r === 'OD' && (
                          <motion.div className="absolute inset-0 rounded-lg"
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,0,0.1))', border: '1px solid rgba(255,215,0,0.4)' }} />
                        )}
                        {def.r === 'G' && (
                          <motion.div className="absolute inset-0 rounded-lg"
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.15), transparent)' }} />
                        )}
                        <span className="text-xl relative z-10">{def.em}</span>
                        <span className="text-[7px] font-black mt-0.5 relative z-10" style={{ color: RARITY_COLOR[def.r] }}>
                          {RARITY_LABEL[def.r]}
                        </span>
                        <span className="text-[8px] text-foreground/70 mt-0.5 relative z-10 truncate w-full text-center">{def.n.slice(0, 4)}</span>
                        {isNew(tid) && (
                          <motion.span className="text-[7px] text-game-gold font-bold mt-0.5 relative z-10"
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.5 }}>
                            NEW!
                          </motion.span>
                        )}
                      </>
                    ) : (
                      <span className="text-lg opacity-30">📦</span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {phase === 'done' && (
              <motion.div className="text-xs text-foreground/50 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}>
                タップして閉じる
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GachaAnimation;
