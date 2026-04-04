import { motion } from 'framer-motion';

interface HowToScreenProps {
  onBack: () => void;
}

const SECTIONS = [
  { em: '🛒', t: '家電を選んで設置', d: 'ショップのカードをクリックして設置モードに。緑のマスをクリックで配置。右クリックでキャンセル。' },
  { em: '🔌', t: '電力はウェーブ中のみ増加', d: '攻撃タワーは毎秒電力を消費する。延長コードで発電！電力収支はウェーブ中のみ動作。' },
  { em: '🔗', t: '依存チェーン', d: 'C→U→Rの順が必要。掃除機/ルーターは延長コードが、冷蔵庫は掃除機が先に要る。緑の線が繋がっていると有効！' },
  { em: '💤', t: '連携切れで停止', d: '依存元を売ると依存先が💤停止。線が赤くなったら危険サイン。売る前に依存関係を確認して。' },
  { em: '📏', t: '射程を確認', d: 'タワーにホバーで射程リング表示。クリックでピン留め→パネルで強化・売却ができる。' },
  { em: '🌊', t: 'ウェーブ開始', d: '準備できたらWaveボタンを押す。倒した敵から電力を回収！全5Waveクリアで勝利。' },
];

const HowToScreen = ({ onBack }: HowToScreenProps) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
    <div className="max-w-xl w-full">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-game-gold font-black text-xl mb-5 text-center"
      >
        📖 遊び方
      </motion.h2>

      {SECTIONS.map(({ em, t, d }, i) => (
        <motion.div
          key={t}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-panel flex gap-3 mb-3 p-3"
        >
          <span className="text-2xl flex-shrink-0">{em}</span>
          <div>
            <div className="text-foreground font-black text-xs mb-1">{t}</div>
            <div className="text-muted-foreground text-[11px] leading-relaxed">{d}</div>
          </div>
        </motion.div>
      ))}

      {/* Chain diagram */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-panel p-3 mb-3"
      >
        <div className="text-game-green text-[10px] font-black mb-2">🔗 依存チェーン図</div>
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="bg-game-surface rounded-lg px-2 py-0.5 text-foreground/80">🔌延長コード(C)</span>
          <span className="text-game-green font-black">→</span>
          <div className="flex flex-col gap-1">
            <span className="bg-game-surface rounded-lg px-2 py-0.5 text-foreground/80">🌪️掃除機(U)</span>
            <span className="bg-game-surface rounded-lg px-2 py-0.5 text-foreground/80">📡ルーター(U)</span>
          </div>
          <span className="text-game-blue font-black">→</span>
          <span className="bg-game-surface rounded-lg px-2 py-0.5 text-foreground/80">🧊冷蔵庫(R)</span>
        </div>
      </motion.div>

      {/* Rarity explanation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="glass-panel p-3 mb-3"
      >
        <div className="text-game-gold text-[10px] font-black mb-2">⭐ レアリティ</div>
        <div className="flex gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: '#757575' }} />
            <span className="text-foreground/70">C (コモン) — 依存なし</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: '#4caf50' }} />
            <span className="text-foreground/70">U (アンコモン)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: '#2196f3' }} />
            <span className="text-foreground/70">R (レア)</span>
          </div>
        </div>
      </motion.div>

      <button onClick={onBack} className="game-btn-secondary w-full mt-2">
        ← 戻る
      </button>
    </div>
  </div>
);

export default HowToScreen;
