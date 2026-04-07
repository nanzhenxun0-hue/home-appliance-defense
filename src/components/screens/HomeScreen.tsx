import { motion } from 'framer-motion';
import bgHome from '@/assets/bg-home.jpg';
import logoImg from '@/assets/logo.png';

interface HomeScreenProps {
  onPlay: () => void;
  onHowTo: () => void;
  onScores: () => void;
  onGacha: () => void;
  onCombo: () => void;
  volts: number;
}

const HomeScreen = ({ onPlay, onHowTo, onScores, onGacha, onCombo, volts }: HomeScreenProps) => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center p-5 relative overflow-hidden bg-background">
    {/* BG image */}
    <div className="absolute inset-0 z-0">
      <img src={bgHome} alt="" className="w-full h-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-background/70" />
    </div>

    {/* Particles */}
    {Array.from({ length: 15 }).map((_, i) => (
      <div key={i} className="absolute rounded-full pointer-events-none z-[1]"
        style={{
          width: 2 + Math.random() * 2, height: 2 + Math.random() * 2,
          left: `${Math.random() * 100}%`, bottom: '-3%',
          background: i % 3 === 0 ? 'hsl(350 100% 60%)' : i % 3 === 1 ? 'hsl(210 100% 65%)' : 'hsl(270 100% 70%)',
          animation: `sf-particle-float ${6 + Math.random() * 10}s linear infinite`,
          animationDelay: `${Math.random() * 8}s`,
          boxShadow: '0 0 4px currentColor',
        }}
      />
    ))}

    <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }} className="text-center mb-4 relative z-10">
      <img src={logoImg} alt="KADEN TD" width={100} height={100} className="mx-auto mb-2" style={{ filter: 'drop-shadow(0 0 20px hsl(270 80% 65% / 0.5))' }} />
      <h1 className="font-black text-2xl text-purple-300 tracking-tight">家電タワーディフェンス</h1>
      <p className="text-muted-foreground text-[10px] tracking-[0.3em] mt-1">KADEN TOWER DEFENSE</p>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }} className="text-muted-foreground text-xs mb-6 text-center leading-loose relative z-10">
      🔌 家電を集めて編成し、敵の侵攻を阻止せよ！
    </motion.div>

    {/* Volt display */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className="glass-panel px-4 py-2 mb-4 relative z-10 flex items-center gap-2">
      <span className="text-yellow-400 text-lg">⚡</span>
      <span className="text-yellow-300 font-black text-lg">{volts}</span>
      <span className="text-muted-foreground text-xs">ボルト</span>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }} className="flex flex-col gap-2.5 w-full max-w-xs items-center relative z-10">
      <button onClick={onPlay} className="game-btn-primary w-full text-lg py-3"
        style={{ animation: 'glow-pulse 2.5s infinite' }}>
        ▶ ゲームスタート
      </button>
      <button onClick={onGacha} className="w-full py-2.5 text-sm font-bold rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
          color: '#fff', border: '1px solid rgba(192,38,211,0.4)',
        }}>
        🎰 ガチャ
      </button>
      <button onClick={onHowTo} className="game-btn-secondary w-full text-sm">📖 遊び方</button>
      <button onClick={onScores} className="game-btn-ghost w-full text-xs">🏆 ハイスコア</button>
    </motion.div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      className="mt-8 flex gap-2 flex-wrap justify-center relative z-10">
      {[['🎰', 'ガチャ'], ['🎮', '5体編成'], ['⚡', '8レアリティ'], ['🌊', '10Wave']].map(([em, t]) => (
        <span key={t} className="game-badge text-[9px]">{em} {t}</span>
      ))}
    </motion.div>
  </div>
);

export default HomeScreen;
