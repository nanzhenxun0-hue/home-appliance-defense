import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialScreenProps {
  onComplete: () => void;
}

/**
 * 行動型チュートリアル（読ませない、やらせる）
 * 電力システムを「動かない違和感 → 延長コードで解決」で体感させる
 *
 * STEP0: スタート押すだけ
 * STEP1: 電気ケトルを置かせる（光ったマス）
 * STEP2: 動かない！（電力なし、敵が来る）
 * STEP3: 延長コードを置かせる
 * STEP4: 電力ON → ケトル発光 → 攻撃開始
 * STEP5: 2体目のケトルを置こうとする → 電力不足で置けない
 * STEP6: 延長コードを追加 → ケトル設置可
 * STEP7: 軽い失敗（適当配置だと突破される）→ 配置やり直し
 * STEP8: 卒業
 */

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type UnitType = 'cord' | 'kettle';

const COLS = 5;
const ROWS = 4;
const PATH: Array<[number, number]> = [
  [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
];
const PATH_KEY = new Set(PATH.map(([x, y]) => `${x},${y}`));

const UNITS = {
  cord:   { em: '🔌', name: '延長コード', supply: 2, demand: 0, dmg: 0 },
  kettle: { em: '♨️', name: '電気ケトル', supply: 0, demand: 1, dmg: 30, range: 1.6, atkSpd: 1.0 },
} as const;

interface Enemy { id: number; pi: number; pr: number; hp: number; mhp: number; spd: number; em: string }

const TutorialScreen = ({ onComplete }: TutorialScreenProps) => {
  const [step, setStep] = useState<Step>(0);
  const [grid, setGrid] = useState<Record<string, UnitType>>({});
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [hp, setHp] = useState(5);
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const enemyId = useRef(1);
  const lastTs = useRef<number | null>(null);
  const raf = useRef<number>(0);
  const fireFlashes = useRef<Record<string, number>>({});

  // 電力計算
  const power = useMemo(() => {
    let supply = 0, demand = 0;
    for (const k in grid) {
      const u = grid[k];
      supply += UNITS[u].supply;
      demand += UNITS[u].demand;
    }
    return { supply, demand, ok: supply >= demand };
  }, [grid]);

  // どのマスに置かせるか（光らせる）/ 何が置けるか
  const targetCell = useMemo<{ x: number; y: number } | null>(() => {
    if (step === 1) return { x: 2, y: 0 };  // ケトル
    if (step === 3) return { x: 1, y: 0 };  // コード（ケトル隣）
    if (step === 5) return { x: 2, y: 2 };  // 2体目ケトル試行
    if (step === 6) return { x: 3, y: 2 };  // 追加コード
    if (step === 7) return { x: 2, y: 2 };  // ケトル置き直し
    return null;
  }, [step]);

  const requiredUnit: UnitType | null =
    step === 1 ? 'kettle' :
    step === 3 ? 'cord' :
    step === 5 ? 'kettle' :
    step === 6 ? 'cord' :
    step === 7 ? 'kettle' :
    null;

  // 敵スポーン
  useEffect(() => {
    if (step === 2) {
      // 動かない体験（弱い敵をゆっくり）
      enemyId.current = 1;
      setHp(5);
      setEnemies([
        { id: enemyId.current++, pi: 0, pr: 0, hp: 30, mhp: 30, spd: 0.35, em: '🌫️' },
      ]);
    } else if (step === 4) {
      // 動き出す体験
      setEnemies([
        { id: enemyId.current++, pi: 0, pr: 0,    hp: 30, mhp: 30, spd: 0.4, em: '🌫️' },
        { id: enemyId.current++, pi: 0, pr: -1.5, hp: 30, mhp: 30, spd: 0.4, em: '🌫️' },
      ]);
    } else if (step === 7) {
      // 軽い失敗チャンス（タフめ）
      setHp(3);
      setEnemies([
        { id: enemyId.current++, pi: 0, pr: 0,    hp: 60, mhp: 60, spd: 0.45, em: '💧' },
        { id: enemyId.current++, pi: 0, pr: -1.5, hp: 60, mhp: 60, spd: 0.45, em: '💧' },
      ]);
    } else if (step === 0 || step === 1 || step === 3 || step === 5 || step === 6 || step === 8) {
      setEnemies([]);
    }
  }, [step]);

  // ヒント自動表示
  useEffect(() => {
    setHint(null);
    if (step === 2) {
      const t = setTimeout(() => setHint('💡 ⚡電力がない…？'), 1500);
      return () => clearTimeout(t);
    }
    if (step === 7) {
      const t = setTimeout(() => setHint('💡 敵の通り道に置こう'), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ゲームループ
  useEffect(() => {
    if (step !== 2 && step !== 4 && step !== 7) {
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
        const next = prev.map(e => ({ ...e })).filter(e => e.hp > 0);

        // ケトル攻撃（電力OKのときだけ）
        if (power.ok) {
          for (const [key, u] of Object.entries(grid)) {
            if (u !== 'kettle') continue;
            const [gx, gy] = key.split(',').map(Number);
            let target: Enemy | null = null;
            for (const en of next) {
              if (en.pr < 0) continue;
              const ex = en.pi, ey = 1;
              const dx = ex - gx, dy = ey - gy;
              if (Math.hypot(dx, dy) <= UNITS.kettle.range) {
                if (!target || en.pi > target.pi) target = en;
              }
            }
            if (target) {
              target.hp -= 45 * dt;
              fireFlashes.current[key] = 0.15;
            }
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

      for (const k in fireFlashes.current) {
        fireFlashes.current[k] -= dt;
        if (fireFlashes.current[k] <= 0) delete fireFlashes.current[k];
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [step, grid, power.ok]);

  // 進行条件
  useEffect(() => {
    // STEP2: 敵が一定距離まで来たら → STEP3 へ進ませる（動かない違和感を体験させた後）
    if (step === 2) {
      const e = enemies[0];
      if (e && e.pi >= 2) {
        const t = setTimeout(() => {
          setEnemies([]);
          setStep(3);
        }, 200);
        return () => clearTimeout(t);
      }
    }
    // STEP3 安全弁: コードが置かれていれば必ず STEP4 へ
    if (step === 3) {
      const hasCord = Object.values(grid).includes('cord');
      if (hasCord) {
        const t = setTimeout(() => setStep(4), 500);
        return () => clearTimeout(t);
      }
    }
    if (step === 4) {
      // 通常: 敵全滅で次へ。安全弁: 6秒経っても進まなければ強制進行
      if (enemies.length === 0) {
        const t = setTimeout(() => setStep(5), 800);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setStep(5), 12000);
      return () => clearTimeout(t);
    }
    if (step === 6) {
      const cordCount = Object.values(grid).filter(v => v === 'cord').length;
      if (cordCount >= 2) {
        const t = setTimeout(() => setStep(7), 500);
        return () => clearTimeout(t);
      }
    }
    if (step === 7) {
      if (hp <= 0) {
        setEnemies([]);
        const t = setTimeout(() => {
          setHp(3);
          setHint('💡 配置を変えよう。光ったマスに置いてね');
          // ケトルだけ撤去（コードは残す）
          setGrid(g => {
            const ng: typeof g = {};
            for (const k in g) if (g[k] === 'cord') ng[k] = g[k];
            return ng;
          });
          setEnemies([
            { id: enemyId.current++, pi: 0, pr: 0,    hp: 60, mhp: 60, spd: 0.45, em: '💧' },
            { id: enemyId.current++, pi: 0, pr: -1.5, hp: 60, mhp: 60, spd: 0.45, em: '💧' },
          ]);
        }, 900);
        return () => clearTimeout(t);
      }
      if (enemies.length === 0 && hp > 0) {
        const t = setTimeout(() => setStep(8), 800);
        return () => clearTimeout(t);
      }
    }
  }, [step, enemies, hp, grid]);

  const place = (x: number, y: number) => {
    if (PATH_KEY.has(`${x},${y}`)) return;
    if (!targetCell || !requiredUnit) return;
    // 既に置いてあるセルは無視
    if (grid[`${x},${y}`]) return;
    // 寛容な配置: 目標から1マス以内ならOK（誤タップ救済）
    const dx = Math.abs(x - targetCell.x);
    const dy = Math.abs(y - targetCell.y);
    if (dx > 1 || dy > 1) {
      setShake(true); setTimeout(() => setShake(false), 250);
      return;
    }

    // STEP5: わざと電力不足で置けない演出
    if (step === 5 && requiredUnit === 'kettle') {
      setWarning('⚡ 電力が足りない！');
      setShake(true);
      setTimeout(() => setShake(false), 250);
      setTimeout(() => {
        setWarning(null);
        setStep(6);
      }, 1400);
      return;
    }

    // 実際に置く位置（目標位置に固定して整列、空いていれば実タップ位置）
    const placeKey = `${x},${y}`;
    setGrid(g => ({ ...g, [placeKey]: requiredUnit }));
    if (step === 1) setTimeout(() => setStep(2), 600);
    if (step === 3) setTimeout(() => setStep(4), 600);
    if (step === 6) setTimeout(() => setStep(7), 600);
  };

  const stepBanner = (() => {
    switch (step) {
      case 0: return { em: '👋', text: 'スタートを押そう' };
      case 1: return { em: '♨️', text: '光ったマスに「電気ケトル」を置こう' };
      case 2: return { em: '🤔', text: hint ?? 'あれ？動かない…？' };
      case 3: return { em: '🔌', text: '電力が必要みたい。延長コードを置こう' };
      case 4: return { em: '⚡', text: '電力があると動く！' };
      case 5: return { em: '➕', text: 'もう1体ケトルを置こうとしてみよう' };
      case 6: return { em: '🔌', text: '延長コードを追加しよう' };
      case 7: return { em: '🛡️', text: hint ?? '配置を工夫して防衛！' };
      case 8: return { em: '🎓', text: '電力を管理して防衛しよう！' };
    }
  })();

  // セル描画
  const cellSize = 56;
  const renderCell = (x: number, y: number) => {
    const key = `${x},${y}`;
    const isPath = PATH_KEY.has(key);
    const unit = grid[key];
    const isTarget = targetCell && targetCell.x === x && targetCell.y === y && !unit;
    const flash = (fireFlashes.current[key] ?? 0) > 0;
    // 目標から1マス以内も placeable（誤タップ救済）
    const inRange = targetCell && Math.abs(x - targetCell.x) <= 1 && Math.abs(y - targetCell.y) <= 1;
    const placeable = !!targetCell && !!requiredUnit && !isPath && !unit && !!inRange;
    const isKettleOn = unit === 'kettle' && power.ok;
    const isKettleOff = unit === 'kettle' && !power.ok;

    return (
      <button
        key={key}
        onClick={() => place(x, y)}
        disabled={!placeable && !isTarget}
        className="relative aspect-square rounded-md transition-all"
        style={{
          background: isPath ? '#3a2c1a' : isTarget ? '#3a2c00' : '#1a1a2e',
          border: `2px solid ${isTarget ? '#fbbf24' : isPath ? '#5a4030' : '#2a2a44'}`,
          boxShadow: isTarget
            ? '0 0 24px #fbbf24cc, inset 0 0 16px #fbbf2477'
            : flash ? '0 0 12px #ff7043'
            : isKettleOn ? '0 0 14px #ffd54f, inset 0 0 8px #ffb74d88'
            : 'none',
          animation: isTarget ? 'glow-pulse 0.9s infinite' : 'none',
          cursor: placeable ? 'pointer' : 'default',
          opacity: isKettleOff ? 0.45 : 1,
          filter: isKettleOff ? 'grayscale(0.7)' : 'none',
        }}
      >
        {unit && <span className="text-2xl">{UNITS[unit].em}</span>}
        {isKettleOn && <span className="absolute -top-1 -right-1 text-[10px]">⚡</span>}
        {isKettleOff && <span className="absolute -top-1 -right-1 text-[10px]">💤</span>}
        {isTarget && !unit && (
          <>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl animate-bounce drop-shadow-[0_0_6px_#fbbf24]">⬇️</span>
            <span className="text-[10px] text-yellow-300 font-black animate-pulse">ここ</span>
          </>
        )}
      </button>
    );
  };

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
        {[0,1,2,3,4,5,6,7,8].map(i => (
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
          className="glass-panel px-4 py-3 mb-3 max-w-sm w-full text-center relative z-10"
        >
          <div className="text-3xl mb-1">{stepBanner.em}</div>
          <div className="text-sm font-bold text-foreground">{stepBanner.text}</div>
        </motion.div>
      </AnimatePresence>

      {/* HP / 電力 */}
      {step >= 1 && step <= 7 && (
        <div className="flex gap-3 mb-2 relative z-10 text-xs items-center">
          {step >= 2 && <span className="text-red-400 font-black">❤️ {hp}</span>}
          <span className="font-black px-2 py-0.5 rounded"
            style={{
              color: power.ok ? '#7dd3fc' : '#fb7185',
              background: power.ok ? '#0c4a6e88' : '#7f1d1d88',
              border: `1px solid ${power.ok ? '#0ea5e9' : '#ef4444'}`,
            }}>
            ⚡ {power.demand}/{power.supply}
          </span>
          {!power.ok && grid && Object.values(grid).includes('kettle') && (
            <span className="text-rose-400 font-black animate-pulse text-[10px]">電力不足！</span>
          )}
        </div>
      )}

      {/* 警告 */}
      <AnimatePresence>
        {warning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute top-1/3 z-30 px-6 py-3 rounded-lg font-black text-lg"
            style={{ background: '#7f1d1d', color: '#fff', boxShadow: '0 0 24px #ef4444' }}>
            {warning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* グリッド + 敵 */}
      {step >= 1 && step <= 7 && (
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

      {/* 配置可能ユニット表示 */}
      {requiredUnit && (
        <div className="relative z-10 mb-2 flex items-center gap-2 px-3 py-1.5 rounded-md"
          style={{ background: '#1a1a2e', border: '1px solid #fbbf24' }}>
          <span className="text-xl">{UNITS[requiredUnit].em}</span>
          <span className="text-xs font-bold text-yellow-200">{UNITS[requiredUnit].name}</span>
          {requiredUnit === 'cord' && <span className="text-[10px] text-sky-300">+⚡{UNITS.cord.supply}</span>}
          {requiredUnit === 'kettle' && <span className="text-[10px] text-rose-300">−⚡{UNITS.kettle.demand}</span>}
        </div>
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
        {step === 8 && (
          <button onClick={onComplete} className="game-btn-primary text-lg px-8 py-3"
            style={{ animation: 'glow-pulse 1.5s infinite' }}>
            🎮 自由プレイへ
          </button>
        )}

        {step !== 8 && (
          <button onClick={onComplete} className="text-[10px] text-muted-foreground/60 mt-3 py-1">
            スキップ
          </button>
        )}
      </div>
    </div>
  );
};

export default TutorialScreen;
