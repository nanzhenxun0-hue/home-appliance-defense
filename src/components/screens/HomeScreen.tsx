import { motion } from 'framer-motion';
import bgHome from '@/assets/bg-home.jpg';
import logoImg from '@/assets/logo.png';
import towerCord from '@/assets/tower-cord.png';
import towerKettle from '@/assets/tower-kettle.png';
import towerFan from '@/assets/tower-fan.png';
import towerVacuum from '@/assets/tower-vacuum.png';
import towerRouter from '@/assets/tower-router.png';
import towerFridge from '@/assets/tower-fridge.png';

const FLOATING_IMGS = [towerCord, towerKettle, towerFan, towerVacuum, towerRouter, towerFridge, towerCord, towerKettle];

interface HomeScreenProps {
  onPlay: () => void;
  onHowTo: () => void;
  onScores: () => void;
}

const HomeScreen = ({ onPlay, onHowTo, onScores }: HomeScreenProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0 z-0">
      <img src={bgHome} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, rgba(10,8,20,0.7) 0%, rgba(10,8,20,0.85) 50%, rgba(10,8,20,0.95) 100%)',
      }} />
    </div>

    {/* Animated scanline */}
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden opacity-[0.03]">
      <div className="w-full h-1" style={{
        background: 'linear-gradient(90deg, transparent, hsl(270 100% 70%), transparent)',
        animation: 'sf-scan 4s linear infinite',
      }} />
    </div>

    {/* SF particle effects */}
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full pointer-events-none z-[1]"
        style={{
          width: 2 + Math.random() * 3,
          height: 2 + Math.random() * 3,
          left: `${Math.random() * 100}%`,
          bottom: `-5%`,
          background: i % 3 === 0 ? 'hsl(350 100% 60%)' : i % 3 === 1 ? 'hsl(210 100% 65%)' : 'hsl(270 100% 70%)',
          animation: `sf-particle-float ${5 + Math.random() * 10}s linear infinite`,
          animationDelay: `${Math.random() * 10}s`,
          boxShadow: `0 0 6px currentColor`,
        }}
      />
    ))}

    {/* Floating tower images */}
    {FLOATING_IMGS.map((src, i) => (
      <div
        key={i}
        className="absolute select-none pointer-events-none opacity-[0.08] z-[1]"
        style={{
          left: `${4 + i * 12}%`,
          top: `${6 + i * 9}%`,
          animation: `float-icon ${4 + i * 0.6}s ease-in-out infinite`,
          animationDelay: `${i * 0.45}s`,
          filter: 'drop-shadow(0 0 8px hsl(270 100% 70%))',
        }}
      >
        <img src={src} alt="" width={40 + i * 3} height={40 + i * 3} className="w-auto" style={{ height: 40 + i * 3 }} />
      </div>
    ))}

    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
      className="text-center mb-2 relative z-10"
    >
      <img src={logoImg} alt="KADEN TD" width={160} height={160} className="mx-auto mb-2" style={{ filter: 'drop-shadow(0 0 30px hsl(270 80% 65% / 0.5))' }} />
      <h1 className="sf-title sf-glow-text text-game-purple font-black text-3xl md:text-4xl tracking-tight">
        家電タワーディフェンス
      </h1>
      <p className="text-muted-foreground text-xs tracking-[0.3em] mt-1 sf-title">KADEN TOWER DEFENSE</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="text-muted-foreground text-sm mb-9 text-center leading-loose relative z-10"
    >
      🔌 延長コードで電力を確保し　♨️ 家電で敵を迎え撃て！
      <br />
      <span className="text-muted-foreground/60">弱い家電がいないと強い家電は動けない…</span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="flex flex-col gap-3 w-full max-w-xs items-center relative z-10"
    >
      <button
        onClick={onPlay}
        className="game-btn-primary w-full text-xl"
        style={{ animation: 'glow-pulse 2.5s infinite' }}
      >
        ▶ ゲームスタート
      </button>
      <button onClick={onHowTo} className="game-btn-secondary w-full">
        📖 遊び方
      </button>
      <button onClick={onScores} className="game-btn-ghost w-full text-xs">
        🏆 ハイスコア
      </button>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="mt-11 flex gap-2 flex-wrap justify-center relative z-10"
    >
      {[['🔋', '電力管理'], ['🔗', '依存チェーン'], ['▲', '強化Lv3'], ['🌊', '5Wave']].map(([em, t]) => (
        <span key={t} className="game-badge">{em} {t}</span>
      ))}
    </motion.div>
  </div>
);

export default HomeScreen;
