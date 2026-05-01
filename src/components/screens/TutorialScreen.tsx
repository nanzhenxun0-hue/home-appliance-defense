import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialScreenProps {
  onComplete: () => void;
}

/**
 * 行動型チュートリアル（読ませない、やらせる）
 * STEP0: スタートボタンだけ
 * STEP1: 指定マスに「延長コード」を強制配置
 * STEP2: 自動戦闘を見るだけ（操作不可）
 * STEP3: 2体目「電気ケトル」を強制配置
 * STEP4: わざと負ける構成 → ヒント → 配置をやり直し
 * STEP5: ULTボタンを光らせて押させる
 * STEP6: 卒業
 */

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Cell = { x: number; y: number; unit?: 'cord' | 'kettle' };

const COLS = 5;
const ROWS = 4;
const PATH: Array<[number, number]> = [
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
];
const PATH_KEY = new Set(PATH.map(([x, y]) => `${x},${y}`));

const UNITS = {
  cord:   { em: '🔌', name: '延長コード', color: '#9e9e9e', dmg: 0,  range: 0,   atkSpd: 0, supply: 5 },
  kettle: { em: '♨️', name: '電気ケトル', color: '#ffb74d', dmg: 14, range: 1.5, atkSpd: 1.0 },
} as const;

interface Enemy { id: number; pi: number; pr: number; hp: number; mhp: number; spd: number; em: string }

const TutorialScreen = ({ onComplete }: TutorialScreenProps) => {
  const [step, setStep] = useState<Step>(0);
  const [grid, setGrid] = useState<Record<string, 'cord' | 'kettle'>>({});
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [hp, setHp] = useState(5);
  const [ultCharge, setUltCharge] = useState(0);
  const [ultFired, setUltFired] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const enemyId = useRef(1);
  const lastTs = useRef<number | null>(null);
  const raf = useRef<number>(0);
  const fireFlashes = useRef<Record<string, number>>({});

  // どのマスに置かせるかを決定（光らせるマス）
  const targetCell = useMemo<{ x: number; y: number } | null>(() => {
    if (step === 1) return { x: 1, y: 0 };
    if (step === 3) return { x: 3, y: 2 };
    if (step === 4) return { x: 2, y: 0 }; // ヒント後の置き直し位置
    return null;
  }, [step]);

  const requiredUnit: 'cord' | 'kettle' | null =
    step === 1 ? 'cord' :
    step === 3 ? 'kettle' :
    step === 4 ? 'kettle' :
    null;

  // STEP2 / STEP4 / STEP5 で敵をスポーン
  useEffect(() => {
    if (step === 2) {
      enemyId.current = 1;
      setEnemies([
        { id: enemyId.current++, pi: 0, pr: 0,    hp: 30, mhp: 30, spd: 0.5, em: '🌫️' },
        { id: enemyId.current++, pi: 0, pr: -1.2, hp: 30, mhp: 30, spd: 0.5, em: '🌫️' },
      ]);
    } else if (step === 4) {
      // わざと負けやすい構成：HP低くタフな敵2体
      setHp(2);
      setEnemies([
        { id: enemyId.current++, pi: 0, pr: 0,    hp: 50, mhp: 50, spd: 0.45, em: '💧' },
      ]);
    } else if (step === 5) {
      setUltCharge(100);
      setUltFired(false);
      setEnemies([
        { id: enemyId.current++, pi: 0, pr: 0,    hp: 80, mhp: 80, spd: 0.4, em: '🪳' },
        { id: enemyId.current++, pi: 0, pr: -0.6, hp: 80, mhp: 80, spd: 0.4, em: '🪳' },
        { id: enemyId.current++, pi: 0, pr: -1.2, hp: 80, mhp: 80, spd: 0.4, em: '🪳' },
      ]);
    } else if (step === 0 || step === 1 || step === 3) {
      setEnemies([]);
    }
  }, [step]);

  // STEP4 用：失敗ヒント表示タイマー
  useEffect(() => {
    if (step !== 4) { setHint(null); return; }
    setHint(null);
    const t = setTimeout(() => {
      setHint('💡 ヒント：敵の通り道に置いてみよう');
    }, 1800);
    return () => clearTimeout(t);
  }, [step]);

  // ループ：敵を進ませて、近くのケトルが攻撃
  useEffect(() => {
    if (step !== 2 && step !== 4 && step !== 5) {
      cancelAnimationFrame(raf.current);
      lastTs.current = null;
      return;
    }
    const tick = (ts: number) => {
      raf.current = requestAnimationFrame(tick);
      const dt = lastTs.current ? Math.min((ts - lastTs.current) / 1000, 0.05) : 0.016;
      lastTs.current = ts;

      setEnemies(prev => {
        let baseLost = 0;
        // 攻撃処理
        const grids = Object.entries(grid);
        const next = prev.map(e => ({ ...e })).filter(e => e.hp > 0);
        for (const [key, u] of grids) {
          if (u !== 'kettle') continue;
          const [gx, gy] = key.split(',').map(Number);
          // 射程内の最も進んだ敵
          let target: Enemy | null = null;
          for (const en of next) {
            if (en.pr < 0) continue;
            const ex = en.pi + 0; // path is row 1, x = pi
            const ey = 1;
            const dx = ex - gx, dy = ey - gy;
            if (Math.hypot(dx, dy) <= UNITS.kettle.range) {
              if (!target || en.pi > target.pi) target = en;
            }
          }
          if (target) {
            target.hp -= 30 * dt; // dps ≈ 30
            fireFlashes.current[key] = 0.15;
          }
        }
        // 敵を進める
        for (const e of next) {
          e.pr += e.spd * dt;
          while (e.pr >= 1 && e.pi < PATH.length - 1) { e.pr -= 1; e.pi += 1; }
          if (e.pi >= PATH.length - 1 && e.pr >= 0.9) {
            e.hp = 0;
            baseLost += 1;
          }
        }
        if (baseLost > 0) {
          setHp(h => Math.max(0, h - baseLost));
          setShake(true);
          setTimeout(() => setShake(false), 250);
        }
        return next.filter(e => e.hp > 0);
      });

      // フラッシュ減衰
      for (const k in fireFlashes.current) {
        fireFlashes.current[k] -= dt;
        if (fireFlashes.current[k] <= 0) delete fireFlashes.current[k];
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [step, grid]);

  // 進行条件チェック
  useEffect(() => {
    if (step === 2 && enemies.length === 0) {
      const t = setTimeout(() => setStep(3), 800);
      return () => clearTimeout(t);
    }
    if (step === 4) {
      if (hp <= 0) {
        // 失敗 → ヒントを残してリトライさせる（STEP4のまま）
        setEnemies([]);
        const t = setTimeout(() => {
          setHp(3);
          setHint('💡 配置を変えよう。光ったマスに置いてね');
          // 既存のkettleを撤去（ヒントのため）
          setGrid(g => {
            const ng: typeof g = {};
            for (const k in g) if (g[k] === 'cord') ng[k] = g[k];
            return ng;
          });
          setEnemies([{ id: enemyId.current++, pi: 0, pr: 0, hp: 50, mhp: 50, spd: 0.45, em: '💧' }]);
        }, 900);
        return () => clearTimeout(t);
      }
      if (enemies.length === 0 && hp > 0) {
        const t = setTimeout(() => setStep(5), 800);
        return () => clearTimeout(t);
      }
    }
    if (step === 5 && ultFired && enemies.length === 0) {
      const t = setTimeout(() => setStep(6), 800);
      return () => clearTimeout(t);
    }
  }, [step, enemies.length, hp, ultFired]);

  const place = (x: number, y: number) => {
    if (PATH_KEY.has(`${x},${y}`)) return;
    if (!targetCell || !requiredUnit) return;
    if (x !== targetCell.x || y !== targetCell.y) {
      setShake(true); setTimeout(() => setShake(false), 250);
      return;
    }
    setGrid(g => ({ ...g, [`${x},${y}`]: requiredUnit }));
    if (step === 1) setTimeout(() => setStep(2), 600);
    if (step === 3) setTimeout(() => setStep(4), 600);
    // STEP4 で置いた直後はゲームループが続いて勝てば次へ進む
  };

  const fireUlt = () => {
    if (step !== 5 || ultCharge < 100 || ultFired) return;
    setUltFired(true);
    setUltCharge(0);
    setEnemies(es => es.map(e => ({ ...e, hp: 0 })));
  };

  const stepBanner = (() => {
    switch (step) {
      case 0: return { em: '👋', text: 'はじめよう' };
      case 1: return { em: '🔌', text: '光ったマスに「延長コード」を置こう' };
      case 2: return { em: '👀', text: '見てるだけでOK！自動で攻撃するよ' };
      case 3: return { em: '♨️', text: 'もう1体「電気ケトル」を置こう' };
      case 4: return { em: '🤔', text: hint ?? '強い敵が来た…倒せるかな？' };
      case 5: return { em: '🌊', text: '光ってる ULT を押そう！' };
      case 6: return { em: '🎓', text: '卒業！自由に遊んでみよう' };
    }
  })();

  // セル描画
  const renderCell = (x: number, y: number) => {
    const key = `${x},${y}`;
    const isPath = PATH_KEY.has(key);
    const unit = grid[key];
    const isTarget = targetCell && targetCell.x === x && targetCell.y === y && !unit;
    const flash = (fireFlashes.current[key] ?? 0) > 0;
    return (
      <button
        key={key}
        onClick={() => place(x, y)}
        disabled={!targetCell || isPath || !!unit}
        className="relative aspect-square rounded-md transition-all"
        style={{
          background: isPath ? '#3a2c1a' : '#1a1a2e',
          border: `2px solid ${isTarget ? '#fbbf24' : isPath ? '#5a4030' : '#2a2a44'}`,
          boxShadow: isTarget ? '0 0 16px #fbbf24, inset 0 0 12px #fbbf2466' : flash ? '0 0 12px #ff7043' : 'none',
          animation: isTarget ? 'glow-pulse 1.2s infinite' : 'none',
          cursor: isTarget ? 'pointer' : 'default',
        }}
      >
        {unit && <span className="text-2xl">{UNITS[unit].em}</span>}
        {isTarget && !unit && <span className="text-xs text-yellow-300 font-black animate-pulse">ここ</span>}
      </button>
    );
  };

  // 敵オーバーレイ
  const cellSize = 56; // px (matches w-14)
  const renderEnemy = (e: Enemy) => {
    if (e.pr < 0) return null;
    const i = Math.min(e.pi, PATH.length - 1);
    const [x1, y1] = PATH[i];
    const [x2, y2] = PATH[Math.min(i + 1, PATH.length - 1)];
    const px = (x1 + (x2 - x1) * e.pr) * cellSize + cellSize / 2;
    const py = (y1 + (y2 - y1) * e.pr) * cellSize + cellSize / 2;
    return (
      <div key={e.id} className="absolute pointer-events-none flex flex-col items-center"
        style={{ left: px, top: py, transform: 'translate(-50%, -50%)' }}>
        <div className="w-8 h-1 bg-black/50 rounded">
          <div className="h-full bg-red-500 rounded" style={{ width: `${(e.hp / e.mhp) * 100}%` }} />
        </div>
        <span className="text-2xl">{e.em}</span>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(270 60% 25%), transparent 70%)' }} />

      {/* 進行ドット */}
      <div className="flex justify-center gap-1.5 mt-2 mb-3 relative z-10">
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} className="w-2 h-2 rounded-full transition-all"
            style={{
              background: i === step ? '#c084fc' : i < step ? '#7c3aed' : '#333',
              boxShadow: i === step ? '0 0 8px #c084fc' : 'none',
            }} />
        ))}
      </div>

      {/* バナー */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${step}-${stepBanner.text}`}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="glass-panel px-4 py-3 mb-4 max-w-sm w-full text-center relative z-10"
        >
          <div className="text-3xl mb-1">{stepBanner.em}</div>
          <div className="text-sm font-bold text-foreground">{stepBanner.text}</div>
        </motion.div>
      </AnimatePresence>

      {/* HP / Ult */}
      {step >= 2 && (
        <div className="flex gap-3 mb-3 relative z-10 text-xs">
          <span className="text-red-400 font-black">❤️ {hp}</span>
          {step >= 5 && (
            <span className="font-black" style={{ color: ultCharge >= 100 ? '#00e5ff' : '#666' }}>
              🌊 ULT {ultCharge}%
            </span>
          )}
        </div>
      )}

      {/* グリッド + 敵 */}
      {step >= 1 && step <= 5 && (
        <motion.div
          animate={shake ? { x: [-4, 4, -3, 3, 0] } : {}}
          transition={{ duration: 0.25 }}
          className="relative z-10 mb-4"
          style={{ width: COLS * cellSize, height: ROWS * cellSize }}
        >
          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`, gridTemplateRows: `repeat(${ROWS}, ${cellSize}px)` }}>
            {Array.from({ length: ROWS }).map((_, y) =>
              Array.from({ length: COLS }).map((_, x) => renderCell(x, y))
            )}
          </div>
          {enemies.map(renderEnemy)}
        </motion.div>
      )}

      {/* アクション領域 */}
      <div className="relative z-10 flex flex-col items-center gap-2 max-w-sm w-full">
        {step === 0 && (
          <button onClick={() => setStep(1)}
            className="game-btn-primary text-lg px-8 py-3"
            style={{ animation: 'glow-pulse 1.2s infinite' }}>
            ▶ スタート
          </button>
        )}
        {step === 5 && (
          <button onClick={fireUlt} disabled={ultFired}
            className="px-6 py-3 rounded-lg font-black text-lg"
            style={{
              background: 'linear-gradient(135deg, #00e5ff, #7c4dff)',
              color: '#fff',
              boxShadow: ultFired ? 'none' : '0 0 24px #00e5ff',
              animation: ultFired ? 'none' : 'glow-pulse 0.9s infinite',
              opacity: ultFired ? 0.4 : 1,
            }}>
            🌊 ULT発動！
          </button>
        )}
        {step === 6 && (
          <button onClick={onComplete} className="game-btn-primary text-lg px-8 py-3"
            style={{ animation: 'glow-pulse 1.5s infinite' }}>
            🎮 自由プレイへ
          </button>
        )}

        {step !== 6 && (
          <button onClick={onComplete} className="text-[10px] text-muted-foreground/60 mt-3 py-1">
            スキップ
          </button>
        )}
      </div>
    </div>
  );
};

export default TutorialScreen;
