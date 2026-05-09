import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TDEFS } from '@/game/constants';
import { RARITY_COLOR } from '@/game/types';
import type { TowerID } from '@/game/types';

interface PromoRewardModalProps {
  tid: TowerID | null;
  onClose: () => void;
}

const UNLOCK_MSG: Partial<Record<TowerID, { title: string; sub: string }>> = {
  promo_starter: {
    title: '🎓 チュートリアル完了！',
    sub: '初回チュートリアルクリアの証として\n限定キャラクターを獲得しました！',
  },
  promo_endless: {
    title: '♾️ エンドレス 100W 突破！',
    sub: '終わりなき戦いを制した者だけに\n与えられる伝説の証を獲得しました！',
  },
};

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  angle: (i / 22) * Math.PI * 2,
  r: 70 + Math.random() * 60,
  delay: Math.random() * 0.4,
  size: 4 + Math.random() * 6,
}));

export default function PromoRewardModal({ tid, onClose }: PromoRewardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!tid) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    cvs.width = cvs.offsetWidth;
    cvs.height = cvs.offsetHeight;
    const W = cvs.width, H = cvs.height;
    const col = RARITY_COLOR['P'];

    const sparks = Array.from({ length: 60 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W,
      y: H / 2 + (Math.random() - 0.5) * H,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      life: Math.random(),
      maxLife: 0.5 + Math.random() * 1.5,
      size: 1.5 + Math.random() * 2.5,
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of sparks) {
        s.x += s.vx;
        s.y += s.vy;
        s.life += 0.016;
        if (s.life > s.maxLife) {
          s.x = W / 2 + (Math.random() - 0.5) * W * 0.6;
          s.y = H / 2 + (Math.random() - 0.5) * H * 0.6;
          s.life = 0;
        }
        const alpha = Math.sin((s.life / s.maxLife) * Math.PI) * 0.7;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [tid]);

  if (!tid) return null;
  const def = TDEFS[tid];
  const col = RARITY_COLOR['P'];
  const msg = UNLOCK_MSG[tid] ?? { title: 'P限定キャラ獲得！', sub: '' };

  return (
    <AnimatePresence>
      {tid && (
        <motion.div
          key="promo-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          {/* Spark canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          <motion.div
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            className="relative w-80 max-w-[90vw] rounded-3xl overflow-hidden flex flex-col items-center"
            style={{
              background: 'linear-gradient(160deg, #1a0a1e 0%, #0d0a1a 100%)',
              border: `2px solid ${col}`,
              boxShadow: `0 0 60px ${col}55, 0 0 120px ${col}22`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header glow strip */}
            <div className="w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${col}, transparent)` }} />

            {/* P badge */}
            <div className="mt-5 mb-1 px-3 py-0.5 rounded-full text-xs font-black tracking-widest"
              style={{ background: `${col}22`, border: `1px solid ${col}`, color: col }}>
              Ｐ レアリティ　プロモ限定
            </div>

            {/* Title */}
            <div className="text-center px-4 mt-1 mb-3">
              <div className="text-sm font-black text-white whitespace-pre-line leading-tight">{msg.title}</div>
            </div>

            {/* Unit showcase */}
            <div className="relative flex items-center justify-center mb-4">
              {/* Rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute"
                style={{
                  width: 130, height: 130,
                  borderRadius: '50%',
                  border: `2px dashed ${col}66`,
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                className="absolute"
                style={{
                  width: 100, height: 100,
                  borderRadius: '50%',
                  border: `1px solid ${col}33`,
                }}
              />
              {/* Particles */}
              {PARTICLES.map(p => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size, height: p.size,
                    background: col,
                    top: '50%', left: '50%',
                    marginTop: -p.size / 2, marginLeft: -p.size / 2,
                  }}
                  animate={{
                    x: [0, Math.cos(p.angle) * p.r, 0],
                    y: [0, Math.sin(p.angle) * p.r, 0],
                    opacity: [0, 0.9, 0],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                />
              ))}
              {/* Emoji */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative text-7xl flex items-center justify-center"
                style={{
                  width: 80, height: 80,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${col}44 0%, transparent 70%)`,
                  filter: `drop-shadow(0 0 18px ${col})`,
                }}>
                {def.em}
              </motion.div>
            </div>

            {/* Unit name */}
            <div className="text-lg font-black mb-0.5" style={{ color: col }}>{def.n}</div>

            {/* Sub text */}
            <div className="text-[10px] text-center text-muted-foreground px-5 mb-3 whitespace-pre-line leading-relaxed">
              {msg.sub}
            </div>

            {/* Skill card */}
            <div className="mx-4 mb-4 w-[calc(100%-2rem)] rounded-xl p-3 flex flex-col gap-1"
              style={{ background: `${col}11`, border: `1px solid ${col}33` }}>
              <div className="text-[10px] font-black" style={{ color: col }}>
                ✦ スキル：{def.skillName}
              </div>
              <div className="text-[9px] text-muted-foreground leading-relaxed">{def.skillDesc}</div>
              <div className="text-[9px] mt-0.5 text-muted-foreground italic">「{def.quote}」</div>
            </div>

            {/* Notice: non-tradeable */}
            <div className="text-[9px] text-muted-foreground mb-3 px-4 text-center">
              ※ このキャラはガチャ・交換不可のプロモ限定です
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="mb-5 px-10 py-3 rounded-2xl font-black text-sm text-white"
              style={{ background: `linear-gradient(135deg, ${col}, #9c254d)`, boxShadow: `0 0 20px ${col}66` }}>
              受け取る ✓
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
