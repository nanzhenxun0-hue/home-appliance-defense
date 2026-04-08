import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialScreenProps {
  onComplete: () => void;
}

const STEPS = [
  {
    em: '👋',
    title: 'ようこそ！家電タワーディフェンスへ',
    desc: '家電たちが悪魔化して人間を襲う世界。あなたは残された家電の力で町を守ります！',
  },
  {
    em: '🎰',
    title: 'ガチャでユニットを集めよう',
    desc: 'ボルト(V)を使ってガチャを回し、8段階のレアリティの家電ユニットを集めましょう。ノーマル・プレミアム・限定の3種類のガチャがあります。',
  },
  {
    em: '🎮',
    title: 'チームを編成しよう',
    desc: '最大5体のユニットでチームを組みます。シナジーやチェーンコンボを意識して編成しましょう！',
  },
  {
    em: '🗺️',
    title: 'エリアを選んで出撃',
    desc: '5つのエリアと5段階の難易度から選んで戦います。各エリアには強力なボスが待ち構えています。',
  },
  {
    em: '👆',
    title: '設置＆強化',
    desc: '下のバーからユニットを選び、グリッドをタップして設置。設置したユニットをタップすると強化ウィンドウが開きます。Lv3で特殊能力が解放！',
  },
  {
    em: '🔌',
    title: '依存チェーンに注意',
    desc: '高レアタワーは依存元が必要。例えば「扇風機」は「延長コード」が先に必要です。線が繋がっていないと動きません！',
  },
  {
    em: '👹',
    title: 'ボスに備えよう',
    desc: 'ボスはワープ、バリア、全体加速、ユニット無効化などの特殊能力を使います。対策を練って挑みましょう！',
  },
];

const TutorialScreen = ({ onComplete }: TutorialScreenProps) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, hsl(270 60% 25%), transparent 70%)' }} />

      <div className="relative z-10 max-w-sm w-full">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i === step ? '#c084fc' : i < step ? '#7c3aed' : '#333',
                boxShadow: i === step ? '0 0 8px #c084fc' : 'none',
              }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass-panel p-6 rounded-2xl text-center"
          >
            <span className="text-5xl block mb-3">{current.em}</span>
            <h2 className="text-lg font-black text-foreground mb-2">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="game-btn-ghost flex-1 py-2.5 text-sm">
              ← 戻る
            </button>
          )}
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="game-btn-primary flex-1 py-2.5 text-sm"
          >
            {isLast ? '🎮 はじめる！' : '次へ →'}
          </button>
        </div>

        <button onClick={onComplete} className="w-full text-center text-xs text-muted-foreground mt-4 py-2">
          スキップ
        </button>
      </div>
    </div>
  );
};

export default TutorialScreen;
