import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import type { TowerID, Rarity } from '@/game/types';
import { RARITY_COLOR, RARITY_LABEL, OX_RAINBOW, OX_RAINBOW_STOPS, PROMO_GRADIENT } from '@/game/types';
import { TDEFS } from '@/game/constants';
import ScreenCrackEffect from './ScreenCrackEffect';

type Phase = 'idle' | 'truck' | 'unbox' | 'reveal' | 'done';

interface GachaAnimationProps {
  results: TowerID[];
  onComplete: () => void;
  playSound?: (name: string) => void;
  isNew: (tid: TowerID) => boolean;
}

const RARITY_ORDER: Rarity[] = ['C', 'U', 'R', 'E', 'L', 'M', 'G', 'OD', 'OX'];

const getBoxStyle = (rarity: Rarity) => {
  switch (rarity) {
    case 'C':  return { bg: '#8B6914', border: '#a07828', label: '',              glow: 'none' };
    case 'U':  return { bg: '#7B5B2A', border: '#9a7540', label: '',              glow: 'none' };
    case 'R':  return { bg: '#6B4226', border: '#8a5a38', label: '⚠ 精密機器',   glow: '0 0 8px rgba(33,150,243,0.3)' };
    case 'E':  return { bg: '#5A3080', border: '#7a48a8', label: '⚠ 精密機器',   glow: '0 0 12px rgba(171,71,188,0.4)' };
    case 'L':  return { bg: '#3A2A10', border: '#c8a050', label: '取扱注意',      glow: '0 0 14px rgba(255,152,0,0.4)' };
    case 'M':  return { bg: '#1a1a2e', border: '#e91e63', label: '★特別仕様★',   glow: '0 0 16px rgba(233,30,99,0.5)' };
    case 'G':  return { bg: '#0a2a3a', border: '#00e5ff', label: '★★超高級★★', glow: '0 0 20px rgba(0,229,255,0.5)' };
    case 'OD': return { bg: '#1a1500', border: '#ffd700', label: '⚡OVERDRIVE⚡', glow: '0 0 30px rgba(255,215,0,0.6)' };
    case 'OX': return { bg: '#1a1500', border: '#ffd700', label: '⚡OVERDRIVE⚡', glow: '0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(224,64,251,0.3)' };
    default:   return { bg: '#1a1500', border: '#ffd700', label: '⚡OVERDRIVE⚡', glow: '0 0 30px rgba(255,215,0,0.6)' };
  }
};

const OX_CRACK_PATHS = [
  'M 80 0 L 72 45 L 88 55 L 60 110 L 72 115 L 58 160',
  'M 35 10 L 48 55 L 38 68 L 50 130',
  'M 125 18 L 110 60 L 124 72 L 106 140',
  'M 0 75 L 45 68 L 52 80 L 30 100',
  'M 160 55 L 118 62 L 110 75 L 135 105',
];

const GachaAnimation = ({ results, onComplete, playSound, isNew }: GachaAnimationProps) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [revealIdx, setRevealIdx] = useState(0);
  const [tapReady, setTapReady] = useState(false);
  const [crackActive, setCrackActive] = useState(false);

  const highestRarity = results.reduce((best, tid) => {
    const r = TDEFS[tid]?.r || 'C';
    return RARITY_ORDER.indexOf(r) > RARITY_ORDER.indexOf(best) ? r : best;
  }, 'C' as Rarity);

  const hasOX = results.some(tid => TDEFS[tid]?.r === 'OX');
  const hasOD = results.some(tid => TDEFS[tid]?.r === 'OD');
  const hasPromo = results.some(tid => TDEFS[tid]?.r === 'P');
  const hasHighRare = results.some(tid => {
    const r = TDEFS[tid]?.r;
    return r === 'G' || r === 'M' || r === 'L';
  });
  const isSpecial = hasOX || hasOD || hasPromo;

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

    if (hasOX) {
      playSound?.('gacha_od');
      setCrackActive(true);
    } else if (hasOD || hasPromo) {
      playSound?.('gacha_od');
    } else if (hasHighRare) {
      playSound?.('gacha_rare');
    }

    setPhase('reveal');
    setRevealIdx(0);

    const delay = (hasOX || hasOD || hasPromo) ? 400 : hasHighRare ? 300 : 200;
    results.forEach((tid, i) => {
      setTimeout(() => {
        setRevealIdx(prev => prev + 1);
        const def = TDEFS[tid];
        if (def.r === 'OX') playSound?.('gacha_od');
        else if (def.r === 'OD') playSound?.('gacha_od');
        else if (['G', 'M', 'L', 'P'].includes(def.r)) playSound?.('gacha_rare');
        else playSound?.('gacha_reveal');
      }, 600 + i * delay);
    });

    setTimeout(() => setPhase('done'), 600 + results.length * delay + 800);
  }, [tapReady, results, hasOX, hasOD, hasPromo, hasHighRare, playSound]);

  if (phase === 'idle') return null;

  const boxStyle = getBoxStyle(highestRarity);

  const bgGradient = hasOX
    ? 'radial-gradient(ellipse at center, rgba(60,0,40,0.95), rgba(0,0,0,0.97))'
    : hasOD || hasPromo
    ? 'radial-gradient(ellipse at center, rgba(80,30,0,0.92), rgba(0,0,0,0.96))'
    : hasHighRare
    ? 'radial-gradient(ellipse at center, rgba(40,0,60,0.9), rgba(0,0,0,0.95))'
    : 'rgba(0,0,0,0.85)';

  return (
    <>
      <ScreenCrackEffect active={crackActive} isOX={hasOX} onComplete={() => setCrackActive(false)} />

      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden"
        style={{ background: bgGradient }}
        onClick={phase === 'done' ? onComplete : phase === 'unbox' ? handleTapOpen : undefined}
      >
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{
          background: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)',
        }} />

        {/* Starburst on reveal */}
        {(phase === 'reveal' || phase === 'done') && (
          <motion.div className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.6, 0.3], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            style={{
              background: hasOX
                ? 'radial-gradient(circle at center, rgba(224,64,251,0.4) 0%, rgba(255,0,128,0.25) 25%, rgba(0,176,255,0.15) 50%, transparent 70%)'
                : hasOD || hasPromo
                ? 'radial-gradient(circle at center, rgba(255,215,0,0.55), transparent 55%)'
                : hasHighRare
                ? 'radial-gradient(circle at center, rgba(170,80,255,0.5), transparent 55%)'
                : 'radial-gradient(circle at center, rgba(80,160,255,0.35), transparent 60%)',
            }}
          />
        )}

        {/* OX: animated rainbow rings in background */}
        {hasOX && (phase === 'reveal' || phase === 'done') && OX_RAINBOW_STOPS.map((col, i) => (
          <motion.div
            key={`bg-ring-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{ left: '50%', top: '50%', border: `1px solid ${col}55` }}
            animate={{
              width: [100 + i * 80, 200 + i * 80],
              height: [100 + i * 80, 200 + i * 80],
              x: '-50%', y: '-50%',
              opacity: [0.5, 0],
            }}
            transition={{ duration: 2.5, delay: i * 0.18, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}

        {/* Sparkles */}
        {(phase === 'reveal' || phase === 'done') && Array.from({ length: hasOX ? 32 : isSpecial ? 24 : hasHighRare ? 14 : 8 }).map((_, i) => {
          const col = hasOX ? OX_RAINBOW_STOPS[i % OX_RAINBOW_STOPS.length] : hasPromo ? (i % 2 === 0 ? '#e040fb' : '#ff8c00') : hasOD ? '#ffd700' : hasHighRare ? '#e070ff' : '#80c0ff';
          return (
            <motion.div key={`spark-${i}`} className="absolute pointer-events-none rounded-full"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: (Math.random() - 0.5) * 700,
                y: (Math.random() - 0.5) * 700,
                scale: [0, 1.3, 0],
              }}
              transition={{ duration: 1.6 + Math.random() * 1.2, delay: Math.random() * 0.8, repeat: Infinity, repeatDelay: Math.random() }}
              style={{
                left: '50%', top: '50%',
                width: 4 + Math.random() * 7, height: 4 + Math.random() * 7,
                background: col,
                boxShadow: `0 0 12px ${col}`,
              }}
            />
          );
        })}

        {/* Screen flash on reveal */}
        {phase === 'reveal' && (
          <motion.div className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, hasOX ? 1 : isSpecial ? 0.95 : hasHighRare ? 0.7 : 0.4, 0] }}
            transition={{ duration: 0.6 }}
            style={{
              background: hasOX
                ? 'linear-gradient(135deg, #ff008044, #ff8c0044, #ffe00044, #00e67644, #00b0ff44, #e040fb44)'
                : isSpecial ? '#fffbe6' : hasHighRare ? '#f5e6ff' : '#e6f0ff',
            }}
          />
        )}

        <AnimatePresence mode="wait">
          {/* ── Phase: Truck ── */}
          {phase === 'truck' && (
            <motion.div key="truck" className="flex flex-col items-center gap-4"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}>

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

              {(hasOX || hasOD || hasPromo || hasHighRare) && (
                <motion.div className="flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}>
                  {hasOX && (
                    <span className="text-sm animate-pulse font-bold" style={{
                      background: OX_RAINBOW,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>✦ ✦ ✦ 超越の気配 ✦ ✦ ✦</span>
                  )}
                  {!hasOX && (hasOD || hasPromo) && <span className="text-game-gold text-xs animate-pulse">⚡⚡⚡</span>}
                  {!hasOX && !hasOD && !hasPromo && hasHighRare && <span className="text-purple-400 text-xs animate-pulse">✨✨</span>}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Phase: Unbox ── */}
          {phase === 'unbox' && (
            <motion.div key="unbox" className="flex flex-col items-center gap-4 cursor-pointer"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.4, type: 'spring' }}>

              {/* Box */}
              <motion.div className="relative w-40 h-40 rounded-lg flex items-center justify-center overflow-hidden"
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

                <span className="text-5xl relative z-10">📦</span>

                {/* OD electric sparks */}
                {(hasOD || hasOX) && (
                  <motion.div className="absolute inset-0 rounded-lg"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                    style={{ boxShadow: '0 0 30px rgba(255,215,0,0.5), inset 0 0 20px rgba(255,215,0,0.2)' }} />
                )}

                {/* OX: cracks spreading on box */}
                {hasOX && (
                  <>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 160 160"
                      style={{ zIndex: 20 }}>
                      <defs>
                        <filter id="box-crack-glow">
                          <feGaussianBlur stdDeviation="1" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient id="crack-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                          {OX_RAINBOW_STOPS.map((c, i) => (
                            <stop key={i} offset={`${(i / (OX_RAINBOW_STOPS.length - 1)) * 100}%`} stopColor={c} />
                          ))}
                        </linearGradient>
                      </defs>
                      {OX_CRACK_PATHS.map((d, i) => (
                        <g key={i}>
                          {/* Glow layer */}
                          <motion.path d={d} fill="none" stroke={OX_RAINBOW_STOPS[i % OX_RAINBOW_STOPS.length]}
                            strokeWidth="3" opacity="0.3" filter="url(#box-crack-glow)"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ delay: 0.4 + i * 0.22, duration: 0.4 }} />
                          {/* White crack */}
                          <motion.path d={d} fill="none" stroke="rgba(255,255,255,0.95)"
                            strokeWidth="1.2"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ delay: 0.4 + i * 0.22, duration: 0.4 }} />
                        </g>
                      ))}
                    </svg>
                    {/* Rainbow pulse glow around box */}
                    <motion.div className="absolute inset-0 rounded-lg"
                      animate={{
                        boxShadow: [
                          '0 0 20px #ff008066, 0 0 40px #e040fb44',
                          '0 0 20px #00b0ff66, 0 0 40px #ffe00044',
                          '0 0 20px #00e67666, 0 0 40px #ff008044',
                          '0 0 20px #ff008066, 0 0 40px #e040fb44',
                        ],
                      }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  </>
                )}

                {/* Promo: magenta+rainbow shimmer */}
                {hasPromo && !hasOX && (
                  <motion.div className="absolute inset-0 rounded-lg"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ background: PROMO_GRADIENT, opacity: 0.15 }} />
                )}
              </motion.div>

              <motion.div className="text-sm font-bold"
                style={hasOX ? {
                  background: OX_RAINBOW,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                } : { color: (hasOD || hasPromo) ? '#ffd700' : '#aaa' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}>
                タップして開封！
              </motion.div>
            </motion.div>
          )}

          {/* ── Phase: Reveal ── */}
          {(phase === 'reveal' || phase === 'done') && (
            <motion.div key="reveal" className="flex flex-col items-center gap-3 w-full max-w-xs px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}>

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
                  const isOXCard = def.r === 'OX';
                  const isPromoCard = def.r === 'P';

                  const cardBg = isOXCard
                    ? `linear-gradient(#200028, #200028) padding-box, ${OX_RAINBOW} border-box`
                    : isPromoCard
                    ? `linear-gradient(#2a0a18, #2a0a18) padding-box, ${PROMO_GRADIENT} border-box`
                    : undefined;

                  return (
                    <motion.div key={`${i}-${tid}`}
                      className="flex flex-col items-center p-1.5 rounded-lg relative overflow-hidden"
                      initial={{ scale: 0.3, opacity: 0, rotateY: 180, y: 20 }}
                      animate={revealed
                        ? (isOXCard
                          ? { scale: [0.3, 1.6, 1], opacity: 1, rotateY: 0, y: 0 }
                          : def.r === 'OD'
                          ? { scale: [0.3, 1.4, 1], opacity: 1, rotateY: 0, y: 0 }
                          : ['G', 'M', 'L', 'P'].includes(def.r)
                          ? { scale: [0.3, 1.2, 1], opacity: 1, rotateY: 0, y: 0 }
                          : { scale: 1, opacity: 1, rotateY: 0, y: 0 })
                        : { scale: 0.6, opacity: 0.2 }}
                      transition={{ duration: 0.55, type: 'spring', damping: 12 }}
                      style={{
                        background: revealed
                          ? (cardBg || (RARITY_COLOR[def.r] + '18'))
                          : bs.bg + '40',
                        border: (isOXCard || isPromoCard) && revealed
                          ? '2px solid transparent'
                          : `1.5px solid ${revealed ? RARITY_COLOR[def.r] + '88' : '#333'}`,
                        boxShadow: revealed
                          ? isOXCard
                            ? `0 0 20px rgba(224,64,251,0.6), 0 0 40px rgba(255,0,128,0.3), 0 0 8px rgba(0,176,255,0.3)`
                            : isPromoCard
                            ? `0 0 16px rgba(224,64,251,0.5), 0 0 30px rgba(255,140,0,0.3)`
                            : `${bs.glow}, 0 0 24px ${RARITY_COLOR[def.r]}55`
                          : 'none',
                      }}>

                      {revealed ? (
                        <>
                          {/* OX: rainbow shimmer overlay */}
                          {isOXCard && (
                            <motion.div className="absolute inset-0 rounded-lg pointer-events-none"
                              animate={{ opacity: [0.15, 0.35, 0.15] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              style={{ background: 'linear-gradient(135deg, rgba(255,0,128,0.2), rgba(0,176,255,0.2), rgba(224,64,251,0.2))' }} />
                          )}
                          {/* OD gold shimmer */}
                          {def.r === 'OD' && (
                            <motion.div className="absolute inset-0 rounded-lg"
                              animate={{ opacity: [0.2, 0.5, 0.2] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,0,0.1))', border: '1px solid rgba(255,215,0,0.4)' }} />
                          )}
                          {/* Promo: magenta+rainbow shimmer */}
                          {isPromoCard && (
                            <motion.div className="absolute inset-0 rounded-lg pointer-events-none"
                              animate={{ opacity: [0.12, 0.3, 0.12] }}
                              transition={{ duration: 1.0, repeat: Infinity }}
                              style={{ background: PROMO_GRADIENT }} />
                          )}
                          {def.r === 'G' && (
                            <motion.div className="absolute inset-0 rounded-lg"
                              animate={{ opacity: [0.1, 0.3, 0.1] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.15), transparent)' }} />
                          )}

                          <span className="text-xl relative z-10">{def.em}</span>

                          {/* Rarity label */}
                          {isOXCard ? (
                            <span className="text-[7px] font-black mt-0.5 relative z-10" style={{
                              background: OX_RAINBOW,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              filter: 'drop-shadow(0 0 4px rgba(224,64,251,0.8))',
                            }}>
                              {RARITY_LABEL[def.r]}
                            </span>
                          ) : isPromoCard ? (
                            <span className="text-[7px] font-black mt-0.5 relative z-10" style={{
                              background: PROMO_GRADIENT,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              filter: 'drop-shadow(0 0 4px rgba(224,64,251,0.6))',
                            }}>
                              {RARITY_LABEL[def.r]}
                            </span>
                          ) : (
                            <span className="text-[7px] font-black mt-0.5 relative z-10" style={{ color: RARITY_COLOR[def.r] }}>
                              {RARITY_LABEL[def.r]}
                            </span>
                          )}

                          <span className="text-[8px] text-foreground/70 mt-0.5 relative z-10 truncate w-full text-center">{def.n.slice(0, 4)}</span>

                          {isNew(tid) && (
                            <motion.span className="text-[7px] font-bold mt-0.5 relative z-10"
                              initial={{ scale: 0 }}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 0.5 }}
                              style={isOXCard ? {
                                background: OX_RAINBOW,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              } : { color: '#ffd700' }}>
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
    </>
  );
};

export default GachaAnimation;
