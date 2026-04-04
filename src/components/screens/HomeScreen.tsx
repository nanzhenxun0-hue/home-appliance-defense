import { motion } from 'framer-motion';

const FLOATING_ICONS = ['🔌', '♨️', '🌀', '🌪️', '📡', '🧊', '🔌', '♨️'];

interface HomeScreenProps {
  onPlay: () => void;
  onHowTo: () => void;
  onScores: () => void;
}

const HomeScreen = ({ onPlay, onHowTo, onScores }: HomeScreenProps) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative overflow-hidden">
    {/* Floating background icons */}
    {FLOATING_ICONS.map((e, i) => (
      <div
        key={i}
        className="absolute select-none pointer-events-none opacity-5"
        style={{
          fontSize: 28 + i * 3,
          left: `${6 + i * 12}%`,
          top: `${8 + i * 9}%`,
          animation: `float-icon ${4 + i * 0.6}s ease-in-out infinite`,
          animationDelay: `${i * 0.45}s`,
        }}
      >
        {e}
      </div>
    ))}

    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
      className="text-center mb-2"
    >
      <div className="text-7xl mb-1" style={{ filter: 'drop-shadow(0 0 24px rgba(255,215,0,0.4))' }}>
        🏠
      </div>
      <h1 className="text-game-gold font-black text-4xl tracking-tight" style={{ textShadow: '0 0 40px rgba(255,215,0,0.3)' }}>
        家電タワーディフェンス
      </h1>
      <p className="text-muted-foreground text-xs tracking-widest mt-1">KADEN TOWER DEFENSE</p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="text-muted-foreground text-sm mb-9 text-center leading-loose"
    >
      🔌 延長コードで電力を確保し　♨️ 家電で敵を迎え撃て！
      <br />
      <span className="text-muted-foreground/60">弱い家電がいないと強い家電は動けない…</span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="flex flex-col gap-3 w-full max-w-xs items-center"
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
      className="mt-11 flex gap-2 flex-wrap justify-center"
    >
      {[['🔋', '電力管理'], ['🔗', '依存チェーン'], ['▲', '強化Lv3'], ['🌊', '5Wave']].map(([em, t]) => (
        <span key={t} className="game-badge">{em} {t}</span>
      ))}
    </motion.div>
  </div>
);

export default HomeScreen;
