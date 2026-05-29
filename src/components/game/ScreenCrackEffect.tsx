import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScreenCrackEffectProps {
  active: boolean;
  isOX?: boolean;
  onComplete?: () => void;
}

const CRACK_LINES = [
  'M 50 50 L 15 5', 'M 50 50 L 85 8', 'M 50 50 L 95 45',
  'M 50 50 L 90 85', 'M 50 50 L 55 95', 'M 50 50 L 10 90',
  'M 50 50 L 5 50', 'M 50 50 L 30 15', 'M 50 50 L 70 20',
  'M 50 50 L 80 70', 'M 50 50 L 35 80', 'M 50 50 L 20 60',
];

const BRANCH_LINES = [
  'M 32 27 L 22 18', 'M 67 29 L 78 20', 'M 72 47 L 85 38',
  'M 70 67 L 82 75', 'M 52 72 L 58 88', 'M 22 70 L 12 80',
  'M 27 50 L 10 42', 'M 40 20 L 35 8', 'M 60 25 L 68 12',
  'M 75 58 L 90 62', 'M 42 75 L 38 90', 'M 25 58 L 8 55',
];

const OX_RAINBOW_STOPS = ['#ff0080', '#ff8c00', '#ffe000', '#00e676', '#00b0ff', '#e040fb'];

const ScreenCrackEffect = ({ active, isOX = false, onComplete }: ScreenCrackEffectProps) => {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'crack' | 'shatter' | 'fade'>('idle');

  useEffect(() => {
    if (!active) { setPhase('idle'); return; }
    setPhase('flash');
    const t1 = setTimeout(() => setPhase('crack'), 200);
    const t2 = setTimeout(() => setPhase('shatter'), 900);
    const t3 = setTimeout(() => { setPhase('fade'); onComplete?.(); }, 2800);
    const t4 = setTimeout(() => setPhase('idle'), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [active, onComplete]);

  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
        {/* Initial flash */}
        {phase === 'flash' && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: isOX ? 'linear-gradient(135deg, #ff0080, #ffe000, #00b0ff, #e040fb)' : 'white' }}
          />
        )}

        {/* Crack lines SVG */}
        {(phase === 'crack' || phase === 'shatter' || phase === 'fade') && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'fade' ? 0 : 1 }}
            transition={{ duration: phase === 'fade' ? 0.7 : 0.1 }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <filter id="crack-glow">
                  <feGaussianBlur stdDeviation="0.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {isOX && (
                  <linearGradient id="ox-crack-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    {OX_RAINBOW_STOPS.map((c, i) => (
                      <stop key={i} offset={`${(i / (OX_RAINBOW_STOPS.length - 1)) * 100}%`} stopColor={c} />
                    ))}
                  </linearGradient>
                )}
              </defs>
              {CRACK_LINES.map((d, i) => (
                <motion.path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={isOX ? `url(#ox-crack-grad)` : 'rgba(255,215,0,0.9)'}
                  strokeWidth={isOX ? '0.6' : '0.4'}
                  filter="url(#crack-glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.03, ease: 'easeOut' }}
                />
              ))}
              {phase !== 'crack' && BRANCH_LINES.map((d, i) => (
                <motion.path
                  key={`b-${i}`}
                  d={d}
                  fill="none"
                  stroke={isOX ? OX_RAINBOW_STOPS[i % OX_RAINBOW_STOPS.length] : 'rgba(255,180,0,0.6)'}
                  strokeWidth="0.25"
                  filter="url(#crack-glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                />
              ))}
            </svg>
          </motion.div>
        )}

        {/* Shatter fragments */}
        {phase === 'shatter' && (
          <>
            {Array.from({ length: isOX ? 30 : 20 }).map((_, i) => {
              const angle = (i / (isOX ? 30 : 20)) * Math.PI * 2;
              const dist = 60 + Math.random() * 120;
              const rainbowColor = OX_RAINBOW_STOPS[i % OX_RAINBOW_STOPS.length];
              return (
                <motion.div
                  key={`shard-${i}`}
                  className="absolute"
                  style={{
                    left: '50%', top: '50%',
                    width: 8 + Math.random() * 22,
                    height: 8 + Math.random() * 22,
                    background: isOX
                      ? `linear-gradient(${Math.random() * 360}deg, ${rainbowColor}66, ${OX_RAINBOW_STOPS[(i + 2) % OX_RAINBOW_STOPS.length]}33, transparent)`
                      : `linear-gradient(${Math.random() * 360}deg, rgba(255,215,0,0.3), rgba(180,50,255,0.2), transparent)`,
                    border: isOX ? `1px solid ${rainbowColor}88` : '1px solid rgba(255,215,0,0.4)',
                    clipPath: `polygon(${Math.random()*30}% 0%, 100% ${Math.random()*30}%, ${70+Math.random()*30}% 100%, 0% ${70+Math.random()*30}%)`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    rotate: Math.random() * 360 - 180,
                    scale: 0.3,
                  }}
                  transition={{ duration: 1.2 + Math.random() * 0.5, ease: 'easeOut' }}
                />
              );
            })}
          </>
        )}

        {/* Radial burst behind cracks */}
        {(phase === 'crack' || phase === 'shatter') && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 1.5 }}
            style={{
              background: isOX
                ? 'radial-gradient(circle at 50% 50%, rgba(255,0,128,0.2) 0%, rgba(255,140,0,0.15) 20%, rgba(0,230,118,0.1) 40%, rgba(0,176,255,0.15) 60%, rgba(224,64,251,0.2) 80%, transparent 100%)'
                : 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.25) 0%, rgba(180,50,255,0.1) 40%, transparent 70%)',
            }}
          />
        )}

        {/* OX: extra rainbow rings expanding outward */}
        {isOX && phase === 'shatter' && OX_RAINBOW_STOPS.map((col, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{ left: '50%', top: '50%', border: `2px solid ${col}`, marginLeft: -10, marginTop: -10 }}
            initial={{ width: 20, height: 20, x: '-50%', y: '-50%', opacity: 0.8 }}
            animate={{ width: 800, height: 800, x: '-50%', y: '-50%', opacity: 0 }}
            transition={{ duration: 1.4, delay: i * 0.12, ease: 'easeOut' }}
          />
        ))}

        {/* Text reveal */}
        {(phase === 'shatter' || phase === 'fade') && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 3 }}
            animate={{ opacity: phase === 'fade' ? 0 : 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', damping: 12 }}
          >
            {isOX ? (
              <div className="text-center select-none">
                <div
                  className="font-black"
                  style={{
                    fontSize: '5rem',
                    background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffe000, #00e676, #00b0ff, #e040fb)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 24px rgba(224,64,251,0.9)) drop-shadow(0 0 48px rgba(255,0,128,0.6))',
                    letterSpacing: '0.15em',
                  }}
                >
                  OX
                </div>
                <motion.div
                  className="text-base mt-1 font-bold"
                  style={{
                    background: 'linear-gradient(90deg, #ff0080, #ff8c00, #ffe000, #00e676, #00b0ff, #e040fb)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 8px rgba(224,64,251,0.7))',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  ✦ オーバークロス ✦
                </motion.div>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className="sf-title text-4xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #ffd700, #ff6b00, #ffd700)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.8)) drop-shadow(0 0 40px rgba(255,107,0,0.5))',
                  }}
                >
                  OVERDRIVE
                </div>
                <motion.div
                  className="text-sm mt-1 font-bold"
                  style={{ color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.6)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  ★ 超越覚醒 ★
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default ScreenCrackEffect;
