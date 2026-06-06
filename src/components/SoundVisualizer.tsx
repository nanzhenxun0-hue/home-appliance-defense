import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSharedAnalyser, subscribeSoundEvents, type SoundEvent, type SoundName } from '@/hooks/useSound';
import { getBGMAnalyser } from '@/hooks/useBGM';

// ---- Onomatopoeia mapping ----
const ONOMATOPOEIA: Partial<Record<SoundName, { text: string; color: string; size: number }>> = {
  place:        { text: 'カチッ',  color: '#7dd3fc', size: 18 },
  upgrade:      { text: 'ピコーン', color: '#fde047', size: 22 },
  sell:         { text: 'チャリン', color: '#fbbf24', size: 18 },
  coin:         { text: 'チャリン', color: '#fbbf24', size: 18 },
  hit:          { text: 'ドスッ',  color: '#f87171', size: 20 },
  kill:         { text: 'バシュッ', color: '#fb923c', size: 22 },
  crit:         { text: 'ズドンッ', color: '#facc15', size: 28 },
  explosion:    { text: 'ドゴオォン', color: '#f97316', size: 36 },
  zap:          { text: 'ビリリッ', color: '#a78bfa', size: 24 },
  freeze:       { text: 'シャキィン', color: '#93c5fd', size: 26 },
  wind:         { text: 'ヒュオオオ', color: '#bae6fd', size: 24 },
  ult_charge:   { text: 'ウィィィン', color: '#c084fc', size: 22 },
  ult_fire:     { text: 'ドーーン!!', color: '#fde047', size: 42 },
  combo:        { text: 'コンボ!', color: '#fb7185', size: 26 },
  boss_warn:    { text: 'ゴゴゴ…', color: '#f43f5e', size: 30 },
  danger:       { text: 'ドクン',   color: '#ef4444', size: 26 },
  wave_start:   { text: 'スタート!', color: '#34d399', size: 24 },
  wave_clear:   { text: 'クリア!',  color: '#86efac', size: 28 },
  victory:      { text: 'ファンファーレ♪', color: '#fde047', size: 30 },
  game_over:    { text: 'ガーン…',  color: '#9ca3af', size: 26 },
  gacha_pull:   { text: 'シャラララ…', color: '#c084fc', size: 22 },
  gacha_reveal: { text: 'キラッ',   color: '#fde047', size: 22 },
  gacha_rare:   { text: 'キラリーン', color: '#fbbf24', size: 28 },
  gacha_od:     { text: 'ピカァァァ!!', color: '#facc15', size: 40 },
  gacha_promo:  { text: 'スペシャル!', color: '#ff4081', size: 30 },
  unlock:       { text: 'アンロック♪', color: '#a3e635', size: 22 },
  levelup:      { text: 'レベルアップ!', color: '#facc15', size: 26 },
};

interface Pop { id: number; text: string; color: string; size: number; x: number; y: number; rot: number }

interface Props {
  showWaveform?: boolean;
  showOnomatopoeia?: boolean;
}

const Waveform = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx2d = cvs.getContext('2d');
    if (!ctx2d) return;
    let raf = 0;
    const sfxData = new Uint8Array(128);
    const bgmData = new Uint8Array(128);
    const draw = () => {
      const w = cvs.width = cvs.clientWidth * (window.devicePixelRatio || 1);
      const h = cvs.height = cvs.clientHeight * (window.devicePixelRatio || 1);
      ctx2d.clearRect(0, 0, w, h);
      const sfxAn = getSharedAnalyser();
      const bgmAn = getBGMAnalyser();
      // SFX bars (cyan)
      if (sfxAn) {
        sfxAn.getByteFrequencyData(sfxData);
        const n = 32;
        const bw = w / n;
        for (let i = 0; i < n; i++) {
          const v = sfxData[i * 2] / 255;
          const bh = v * h * 0.95;
          const grad = ctx2d.createLinearGradient(0, h, 0, h - bh);
          grad.addColorStop(0, 'rgba(56,189,248,0.9)');
          grad.addColorStop(1, 'rgba(217,70,239,0.9)');
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(i * bw + 1, h - bh, bw - 2, bh);
        }
      }
      // BGM line wave (purple, overlaid)
      if (bgmAn) {
        bgmAn.getByteTimeDomainData(bgmData);
        ctx2d.lineWidth = 2 * (window.devicePixelRatio || 1);
        ctx2d.strokeStyle = 'rgba(168,85,247,0.85)';
        ctx2d.shadowColor = 'rgba(168,85,247,0.8)';
        ctx2d.shadowBlur = 8;
        ctx2d.beginPath();
        const slice = w / bgmData.length;
        for (let i = 0; i < bgmData.length; i++) {
          const v = bgmData[i] / 128 - 1;
          const y = h / 2 + v * h * 0.4;
          if (i === 0) ctx2d.moveTo(i * slice, y); else ctx2d.lineTo(i * slice, y);
        }
        ctx2d.stroke();
        ctx2d.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[40] h-10 opacity-70"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

const Onomatopoeia = () => {
  const [pops, setPops] = useState<Pop[]>([]);
  const counter = useRef(0);
  useEffect(() => {
    return subscribeSoundEvents((e: SoundEvent) => {
      const o = ONOMATOPOEIA[e.name];
      if (!o) return;
      const id = ++counter.current;
      const x = 20 + Math.random() * 60; // % of viewport
      const y = 25 + Math.random() * 35;
      const rot = -15 + Math.random() * 30;
      setPops(p => [...p, { id, ...o, x, y, rot }]);
      setTimeout(() => setPops(p => p.filter(pp => pp.id !== id)), 900);
    });
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
      <AnimatePresence>
        {pops.map(p => (
          <motion.div
            key={p.id}
            initial={{ scale: 0.2, opacity: 0, rotate: p.rot }}
            animate={{ scale: 1.1, opacity: 1, rotate: p.rot }}
            exit={{ scale: 0.6, opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 380, damping: 14 }}
            className="absolute font-black select-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size}px`,
              color: p.color,
              textShadow: `2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 12px ${p.color}`,
              fontFamily: '"Bebas Neue", "Anton", system-ui, sans-serif',
              letterSpacing: '0.05em',
              WebkitTextStroke: '1px #000',
            }}
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const SoundVisualizer = ({ showWaveform = true, showOnomatopoeia = true }: Props) => {
  return (
    <>
      {showOnomatopoeia && <Onomatopoeia />}
      {showWaveform && <Waveform />}
    </>
  );
};

export default SoundVisualizer;
