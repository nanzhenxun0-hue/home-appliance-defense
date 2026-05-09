import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialScreenProps {
  onComplete: () => void;
}

// Mini grid: 5 cols × 3 rows
// Path cells: row0 all, col4 row1, row2 all
const MINI_COLS = 5;
const MINI_ROWS = 3;
const PATH_KEYS = new Set([
  '0,0','1,0','2,0','3,0','4,0',
  '4,1',
  '4,2','3,2','2,2','1,2','0,2',
]);
const PATH_SEQUENCE: [number,number][] = [
  [0,0],[1,0],[2,0],[3,0],[4,0],
  [4,1],
  [4,2],[3,2],[2,2],[1,2],[0,2],
];
const PLACEABLE = ['0,1','1,1','2,1','3,1'];

// Phase IDs
type PhaseId =
  | 'intro'
  | 'place_cord'
  | 'place_fan'
  | 'wave_intro'
  | 'wave_play'
  | 'upgrade'
  | 'ult'
  | 'enemies'
  | 'gacha_team'
  | 'areas_boss'
  | 'done';

interface Phase {
  id: PhaseId;
  title: string;
  sub?: string;
  task?: string;
  tip?: string;
}

const PHASES: Phase[] = [
  { id: 'intro',       title: '🏠 家電タワーディフェンスへようこそ！', sub: '悪魔化した家電たちが家を壊しに来ます。あなたは正常な家電を使って町を守ります！この実践チュートリアルで全てのルールを体感しましょう。' },
  { id: 'place_cord',  title: '① タワーを設置しよう', sub: '下の[🔌 延長コード]を選んで、グリッドの緑のマスをタップして設置！', task: '延長コードを設置してください', tip: '路（紫のライン）の外のマスにのみ設置できます' },
  { id: 'place_fan',   title: '② 依存チェーンの仕組み', sub: '高レアなタワーは「依存元」が必要です。[🌀 扇風機]は🔌延長コードが隣にないと動きません。設置して接続してみましょう！', task: '扇風機を延長コードの隣に設置', tip: '赤いタワーは依存元なし＝停止中。繋がると光ります！' },
  { id: 'wave_intro',  title: '③ 電力とウェーブ開始', sub: 'タワーは「電力（W）」を消費します。⚡ボタンでウェーブ開始！敵を倒すと電力が増えます。', task: '「ウェーブ開始」ボタンを押してください', tip: '電力が0になるとタワーが止まるので要注意！' },
  { id: 'wave_play',   title: '④ 敵を撃退しよう！', sub: '🌫️ダストが侵攻中！タワーが自動で攻撃します。敵が家に到達するとHP（❤️）が減ります。', task: '全ての敵を倒してクリア！', tip: '敵が基地（🏠）に到達する前に倒しましょう' },
  { id: 'upgrade',     title: '⑤ タワーを強化しよう', sub: 'タワーをタップ→「強化」ボタンでLvアップ！Lv3になると特殊能力が解放されます⭐', task: '設置したタワーをタップして強化してみよう', tip: 'Lv3: 扇風機→敵をスタートへ戻す / 掃除機→自動追尾' },
  { id: 'ult',         title: '⑥ 全自動洗浄（オールクリーン）', sub: '敵を倒すごとに🌊ULTゲージが溜まります。100%になったら[🌊]ボタンを押すと全敵を一掃！試してみよう。', task: '🌊ULTボタンを押してみよう', tip: 'ボスを倒すとゲージが25%一気に増加します！' },
  { id: 'enemies',     title: '⑦ 特殊な敵に注意！', sub: '後半ステージには特殊能力を持つ強敵が登場します。それぞれの対策を覚えましょう！' },
  { id: 'gacha_team',  title: '⑧ ガチャとチーム編成', sub: '⚡ボルト（V）でガチャを回して家電ユニットを集めよう。5体のチームを編成してから出撃！' },
  { id: 'areas_boss',  title: '⑨ エリアとボス戦', sub: '5つのエリアを解放しながら進めます。各エリアの最終ウェーブには強力なボスが登場！' },
  { id: 'done',        title: '🎉 準備完了！', sub: 'これで全ルールを把握しました！実際にガチャを回してチームを編成し、郊外エリアから挑戦してみよう！' },
];

const ENEMY_TYPES = [
  { em: '🪳', name: 'ゴキブリ', col: '#795548', effect: 'タワーを詰まらせる', desc: '定期的に最寄りのタワーを5秒間停止させます。複数体で来ると危険！', counter: '範囲攻撃タワーで素早く処理' },
  { em: '🍄', name: 'カビ', col: '#558b2f', effect: '電力を腐食する', desc: '存在しているだけで毎秒1Wずつ電力を削ります。長生きさせると電力枯渇に。', counter: '素早く倒すか掃除機で引き戻す' },
  { em: '⚡', name: '過電流', col: '#ffeb3b', effect: 'タワーをスタン', desc: '隣接タワーを1.5秒スタンさせながら通過します。重要タワーが止まる！', counter: '遠距離タワーを多く配置する' },
  { em: '👻', name: 'ホコリ大王', col: '#9e9e9e', effect: '死亡時に分裂', desc: '倒すと小型ダスト2体が出現！先に周囲を処理してから挑もう。', counter: '範囲AOEタワーで一掃する' },
];

const AREAS = [
  { em: '🏘️', name: '郊外', col: '#4caf50', desc: 'はじめての戦場。基本的な敵のみ。' },
  { em: '🏭', name: '工場', col: '#ff9800', desc: '重装甲の敵が多数登場。電力管理が鍵。' },
  { em: '🏙️', name: '都心', col: '#2196f3', desc: '高速移動の敵とボスの猛攻。' },
  { em: '🌋', name: '火山', col: '#f44336', desc: '炎属性ボスと溶岩地帯。冷却タワー必須。' },
  { em: '🏔️', name: '氷河', col: '#00e5ff', desc: '最終決戦。ファイナルボス降臨！' },
];

const BOSS_ABILITIES = [
  { em: '🌀', name: 'ワープ', desc: 'ランダムな地点にテレポート' },
  { em: '🛡️', name: 'バリア', desc: '数秒間ダメージを無効化' },
  { em: '💨', name: '全体加速', desc: '全ての敵の移動速度UP' },
  { em: '⚠️', name: 'タワー無効', desc: 'ランダムタワーを停止' },
];

// Tower info for placing
const TOWERS = [
  { id: 'cord', em: '🔌', name: '延長コード', col: '#9e9e9e', req: null, desc: '+W供給' },
  { id: 'fan',  em: '🌀', name: '扇風機',     col: '#81d4fa', req: 'cord', desc: 'ノックバック' },
];

export default function TutorialScreen({ onComplete }: TutorialScreenProps) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [grid, setGrid] = useState<Record<string, { id: string; em: string; col: string; lv: number }>>({});
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [power, setPower] = useState(120);
  const [hp, setHp] = useState(10);
  const [ultGauge, setUltGauge] = useState(0);
  const [ultActive, setUltActive] = useState(false);
  const [waveStarted, setWaveStarted] = useState(false);
  const [enemies, setEnemies] = useState<{ id: number; progress: number; hp: number; maxHp: number; em: string }[]>([]);
  const [waveCleared, setWaveCleared] = useState(false);
  const [taskDone, setTaskDone] = useState(false);
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [enemyIdx, setEnemyIdx] = useState(0);
  const phase = PHASES[phaseIdx];
  const rafRef = useRef<number>(0);
  const lastTs = useRef<number | null>(null);
  const enemyCounter = useRef(0);

  const flash = useCallback((msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), 1800);
  }, []);

  const nextPhase = useCallback(() => {
    setPhaseIdx(i => i + 1);
    setTaskDone(false);
    setSelectedTower(null);
    setSelectedCell(null);
    setShowUpgradePanel(false);
    setWaveStarted(false);
    setWaveCleared(false);
    setEnemies([]);
    lastTs.current = null;
  }, []);

  // Wave simulation loop
  useEffect(() => {
    if (phase.id !== 'wave_play' || !waveStarted) return;

    let spawnedCount = 0;
    let nextSpawn = 0;
    const totalEnemies = 5;

    const loop = (ts: number) => {
      const dt = lastTs.current ? Math.min((ts - lastTs.current) / 1000, 0.1) : 0.016;
      lastTs.current = ts;
      nextSpawn -= dt;

      setEnemies(prev => {
        let next = prev.map(e => ({ ...e, progress: e.progress + dt * 0.6 }));

        // Spawn new enemy
        if (nextSpawn <= 0 && spawnedCount < totalEnemies) {
          spawnedCount++;
          enemyCounter.current++;
          nextSpawn = 1.2;
          next = [...next, { id: enemyCounter.current, progress: 0, hp: 3, maxHp: 3, em: '🌫️' }];
        }

        // Tower attacks enemies
        if (Object.keys(grid).length > 0) {
          next = next.map(e => {
            const pIdx = Math.min(Math.floor(e.progress * (PATH_SEQUENCE.length - 1)), PATH_SEQUENCE.length - 1);
            const [ec, er] = PATH_SEQUENCE[pIdx];
            for (const [key] of Object.entries(grid)) {
              const [tc, tr] = key.split(',').map(Number);
              const dist = Math.hypot(tc - ec, tr - er);
              if (dist <= 2.5 && Math.random() < dt * 1.5) {
                return { ...e, hp: e.hp - 1 };
              }
            }
            return e;
          });
        }

        // Remove dead enemies & gain power
        const dead = next.filter(e => e.hp <= 0);
        if (dead.length > 0) {
          setPower(p => Math.min(p + dead.length * 15, 999));
          setUltGauge(g => Math.min(100, g + dead.length * 12));
        }

        // Enemies that reached the end hit HP
        const reached = next.filter(e => e.progress >= 1);
        if (reached.length > 0) {
          setHp(h => Math.max(0, h - reached.length));
          flash('💥 ダメージを受けた！');
        }

        next = next.filter(e => e.hp > 0 && e.progress < 1);

        // Check cleared
        if (spawnedCount >= totalEnemies && next.length === 0 && !waveCleared) {
          setWaveCleared(true);
          setTaskDone(true);
          flash('⭐ ウェーブクリア！');
          setUltGauge(g => Math.min(100, g + 40));
        }

        return next;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase.id, waveStarted, grid, waveCleared, flash]);

  // Ult simulation
  useEffect(() => {
    if (ultActive) {
      const t = setTimeout(() => setUltActive(false), 2000);
      return () => clearTimeout(t);
    }
  }, [ultActive]);

  // Grid cell position helper
  const cellPos = (c: number, r: number) => {
    const size = 52;
    return { left: c * size + 4, top: r * size + 4, size };
  };

  // Enemy canvas position
  const enemyPos = (progress: number) => {
    const t = Math.max(0, Math.min(0.9999, progress));
    const fi = t * (PATH_SEQUENCE.length - 1);
    const i0 = Math.floor(fi);
    const i1 = Math.min(i0 + 1, PATH_SEQUENCE.length - 1);
    const frac = fi - i0;
    const [c0, r0] = PATH_SEQUENCE[i0];
    const [c1, r1] = PATH_SEQUENCE[i1];
    const size = 52;
    return {
      left: (c0 + (c1 - c0) * frac) * size + 4 + 14,
      top: (r0 + (r1 - r0) * frac) * size + 4 + 10,
    };
  };

  const handleCellClick = (key: string) => {
    if (!PATH_KEYS.has(key) && !grid[key]) {
      // Placement
      if (phase.id === 'place_cord' && selectedTower === 'cord') {
        setGrid(g => ({ ...g, [key]: { id: 'cord', em: '🔌', col: '#9e9e9e', lv: 0 } }));
        setSelectedTower(null);
        setPower(p => p - 25);
        setTaskDone(true);
        flash('🔌 延長コード設置！');
      } else if (phase.id === 'place_fan' && selectedTower === 'fan') {
        // Check adjacency to cord
        const [c, r] = key.split(',').map(Number);
        const hasAdjacentCord = Object.entries(grid).some(([k, v]) => {
          if (v.id !== 'cord') return false;
          const [gc, gr] = k.split(',').map(Number);
          return Math.abs(gc - c) + Math.abs(gr - r) <= 1;
        });
        setGrid(g => ({ ...g, [key]: { id: 'fan', em: '🌀', col: '#81d4fa', lv: 0 } }));
        setSelectedTower(null);
        setPower(p => p - 55);
        if (hasAdjacentCord) {
          setTaskDone(true);
          flash('🌀 扇風機 接続OK！チェーン完成！');
        } else {
          flash('⚠️ 延長コードと繋がっていません！隣に配置しよう');
        }
      } else if ((phase.id === 'wave_intro' || phase.id === 'wave_play' || phase.id === 'upgrade') && selectedTower) {
        const t = TOWERS.find(tw => tw.id === selectedTower);
        if (t) {
          setGrid(g => ({ ...g, [key]: { id: t.id, em: t.em, col: t.col, lv: 0 } }));
          setSelectedTower(null);
          setPower(p => p - 25);
        }
      }
    } else if (grid[key]) {
      // Select for upgrade
      if (phase.id === 'upgrade') {
        setSelectedCell(key);
        setShowUpgradePanel(true);
      }
    }
  };

  const handleUpgrade = () => {
    if (!selectedCell || !grid[selectedCell]) return;
    if (power < 30) { flash('⚠️ 電力が足りない！'); return; }
    setGrid(g => {
      const cell = g[selectedCell!];
      const newLv = Math.min(cell.lv + 1, 2);
      return { ...g, [selectedCell!]: { ...cell, lv: newLv } };
    });
    setPower(p => p - 30);
    setShowUpgradePanel(false);
    setTaskDone(true);
    const cell = grid[selectedCell];
    if (cell.lv >= 1) flash('⭐ Lv3！特殊能力解放！');
    else flash('⬆️ タワーを強化！');
  };

  const handleUlt = () => {
    if (ultGauge < 100) { flash('まだゲージが溜まっていません！'); return; }
    setUltGauge(0);
    setUltActive(true);
    setTaskDone(true);
    setEnemies([]);
    flash('🌊 全自動洗浄発動！全敵消滅！！');
  };

  const handleStartWave = () => {
    if (phase.id === 'wave_intro') {
      setTaskDone(true);
      flash('⚡ ウェーブ開始！');
      nextPhase();
    }
  };

  // Check adjacency for display
  const isConnected = (key: string) => {
    const cell = grid[key];
    if (!cell || cell.id === 'cord') return true;
    const [c, r] = key.split(',').map(Number);
    return Object.entries(grid).some(([k, v]) => {
      if (k === key) return false;
      const [gc, gr] = k.split(',').map(Number);
      return Math.abs(gc - c) + Math.abs(gr - r) <= 1;
    });
  };

  const gridSize = MINI_COLS * 52 + 8;

  const showGrid = ['place_cord','place_fan','wave_intro','wave_play','upgrade','ult'].includes(phase.id);
  const showTowerBar = ['place_cord','place_fan','wave_intro','upgrade'].includes(phase.id);
  const showWaveBtn = phase.id === 'wave_intro';
  const showUltBtn = phase.id === 'ult';
  const showUpgradeBtn = phase.id === 'upgrade';

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden relative">
      {/* BG gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, hsl(270 60% 15%), transparent 70%)' }} />

      {/* Ult flash */}
      <AnimatePresence>
        {ultActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
            style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.35), transparent 70%)' }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 2, opacity: 0 }}
              className="text-4xl font-black" style={{ color: '#00e5ff', textShadow: '0 0 30px #00e5ff' }}>
              🌊 全自動洗浄！
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash message */}
      <AnimatePresence>
        {flashMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 z-40 flex justify-center pointer-events-none">
            <div className="px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ background: 'rgba(0,0,0,0.85)', color: '#c084fc', border: '1px solid #c084fc44' }}>
              {flashMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 px-4 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
        <div className="flex gap-1">
          {PHASES.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === phaseIdx ? 20 : 6,
                background: i < phaseIdx ? '#7c3aed' : i === phaseIdx ? '#c084fc' : '#2a2a3a',
                boxShadow: i === phaseIdx ? '0 0 6px #c084fc' : 'none',
              }} />
          ))}
        </div>
        <button onClick={onComplete} className="text-xs text-muted-foreground px-2 py-1 rounded hover:text-foreground transition-colors">
          スキップ →
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          <motion.div key={phase.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }} className="flex flex-col gap-3">

            {/* Title card */}
            <div className="glass-panel rounded-xl px-4 py-3">
              <h2 className="font-black text-base text-foreground leading-snug">{phase.title}</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{phase.sub}</p>
              {phase.task && !taskDone && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: '#ffd700' }}>
                  <span className="text-base">🎯</span> タスク: {phase.task}
                </div>
              )}
              {taskDone && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-green-400">
                  ✅ タスク完了！次へ進もう
                </motion.div>
              )}
              {phase.tip && (
                <div className="mt-2 text-[10px] px-2 py-1 rounded-lg" style={{ background: '#1a1a2e', color: '#80cbc4' }}>
                  💡 {phase.tip}
                </div>
              )}
            </div>

            {/* ── MINI GAME GRID ── */}
            {showGrid && (
              <div className="flex flex-col items-center gap-2">
                {/* Stats bar */}
                <div className="flex gap-3 text-xs font-bold w-full justify-center">
                  <span style={{ color: '#ffd700' }}>⚡ {power}W</span>
                  <span style={{ color: '#ef5350' }}>❤️ {hp}/10</span>
                  <div className="flex items-center gap-1">
                    <span style={{ color: '#00e5ff' }}>🌊</span>
                    <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: '#1a1a2e' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${ultGauge}%`, background: ultGauge >= 100 ? '#00e5ff' : '#334' }} />
                    </div>
                    <span className="text-[10px]" style={{ color: '#00e5ff' }}>{ultGauge}%</span>
                  </div>
                </div>

                {/* Grid */}
                <div className="relative rounded-xl overflow-hidden"
                  style={{ width: gridSize, height: MINI_ROWS * 52 + 8, background: '#0e0e1a', border: '1px solid #2a2a3a' }}>

                  {/* Path tiles */}
                  {Array.from({ length: MINI_ROWS }).map((_, r) =>
                    Array.from({ length: MINI_COLS }).map((_, c) => {
                      const key = `${c},${r}`;
                      const onPath = PATH_KEYS.has(key);
                      const { left, top, size } = cellPos(c, r);
                      const placeable = PLACEABLE.includes(key) && !grid[key];
                      const isPlacePhase = ['place_cord','place_fan','wave_intro','wave_play','upgrade','ult'].includes(phase.id);
                      return (
                        <div key={key}
                          onClick={() => isPlacePhase && handleCellClick(key)}
                          className="absolute transition-all duration-150"
                          style={{
                            left, top, width: size - 4, height: size - 4,
                            borderRadius: 6,
                            background: onPath ? '#1e1830' : placeable && selectedTower ? 'rgba(168,85,247,0.18)' : '#161a28',
                            border: onPath ? '1px solid rgba(168,85,247,0.2)' : placeable && selectedTower ? '1.5px solid #a855f7' : '1px solid #1e2030',
                            cursor: !onPath && selectedTower ? 'pointer' : 'default',
                          }}>
                          {onPath && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                              {(r === 0 || r === 2) ? '→' : '↕'}
                            </div>
                          )}
                          {!onPath && placeable && selectedTower && (
                            <div className="absolute inset-0 flex items-center justify-center text-purple-400 text-xs font-bold opacity-60">+</div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Path arrows / icons */}
                  {(() => {
                    const { left: sl, top: st } = cellPos(0, 0);
                    const { left: el, top: et } = cellPos(0, 2);
                    return (
                      <>
                        <div className="absolute flex items-center justify-center text-base pointer-events-none"
                          style={{ left: sl, top: st, width: 48, height: 48 }}>🚪</div>
                        <div className="absolute flex items-center justify-center text-base pointer-events-none"
                          style={{ left: el, top: et, width: 48, height: 48 }}>🏠</div>
                      </>
                    );
                  })()}

                  {/* Towers */}
                  {Object.entries(grid).map(([key, cell]) => {
                    const [c, r] = key.split(',').map(Number);
                    const { left, top, size } = cellPos(c, r);
                    const connected = isConnected(key);
                    return (
                      <motion.div key={key} initial={{ scale: 0 }} animate={{ scale: 1 }}
                        onClick={() => handleCellClick(key)}
                        className="absolute flex flex-col items-center justify-center rounded-lg cursor-pointer"
                        style={{
                          left: left + 1, top: top + 1, width: size - 6, height: size - 6,
                          background: connected ? `${cell.col}22` : '#1a1a1a',
                          border: `2px solid ${connected ? cell.col : '#444'}`,
                          boxShadow: connected && selectedCell === key ? `0 0 12px ${cell.col}` : 'none',
                          opacity: connected ? 1 : 0.5,
                        }}>
                        <span className="text-xl">{cell.em}</span>
                        {cell.lv > 0 && <span className="text-[8px] font-bold" style={{ color: '#ffd700' }}>{'★'.repeat(cell.lv + 1)}</span>}
                        {!connected && <span className="text-[8px] text-red-400">停止</span>}
                      </motion.div>
                    );
                  })}

                  {/* Enemies */}
                  {enemies.map(e => {
                    const { left, top } = enemyPos(e.progress);
                    const hpPct = e.hp / e.maxHp;
                    return (
                      <motion.div key={e.id}
                        className="absolute pointer-events-none"
                        style={{ left, top, zIndex: 20 }}>
                        <div className="text-lg leading-none">{e.em}</div>
                        <div className="w-5 h-1 rounded-full overflow-hidden mt-0.5" style={{ background: '#0a0a15' }}>
                          <div className="h-full rounded-full" style={{ width: `${hpPct * 100}%`, background: hpPct > 0.5 ? '#a855f7' : '#ef4444' }} />
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Wave cleared overlay */}
                  {waveCleared && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center rounded-xl"
                      style={{ background: 'rgba(0,0,0,0.7)' }}>
                      <div className="text-center">
                        <div className="text-2xl mb-1">⭐</div>
                        <div className="text-sm font-black text-green-400">ウェーブクリア！</div>
                        <div className="text-xs text-muted-foreground mt-0.5">ULTゲージが増えた！</div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Tower select bar */}
                {showTowerBar && (
                  <div className="flex gap-2">
                    {TOWERS.map(t => {
                      const canPlace = phase.id === 'place_cord' ? t.id === 'cord'
                        : phase.id === 'place_fan' ? t.id === 'fan'
                        : true;
                      const affordable = power >= (t.id === 'cord' ? 25 : 55);
                      return (
                        <button key={t.id}
                          onClick={() => canPlace && affordable && setSelectedTower(selectedTower === t.id ? null : t.id)}
                          disabled={!canPlace || !affordable}
                          className="flex flex-col items-center px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: selectedTower === t.id ? `${t.col}25` : 'rgba(255,255,255,0.03)',
                            border: `1.5px solid ${selectedTower === t.id ? t.col : t.col + '40'}`,
                            opacity: canPlace && affordable ? 1 : 0.35,
                            boxShadow: selectedTower === t.id ? `0 0 10px ${t.col}66` : 'none',
                          }}>
                          <span className="text-xl">{t.em}</span>
                          <span className="text-[9px] font-bold mt-0.5" style={{ color: t.col }}>{t.name}</span>
                          <span className="text-[9px] text-yellow-400">{t.id === 'cord' ? '25W' : '55W'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Wave start button */}
                {showWaveBtn && (
                  <button onClick={handleStartWave}
                    className="game-btn-primary w-full py-2.5 text-sm font-bold">
                    ⚡ ウェーブ開始！
                  </button>
                )}

                {/* Upgrade panel */}
                {showUpgradeBtn && !showUpgradePanel && !taskDone && (
                  <div className="text-xs text-muted-foreground text-center">👆 グリッドのタワーをタップして強化ウィンドウを開こう</div>
                )}
                <AnimatePresence>
                  {showUpgradePanel && selectedCell && grid[selectedCell] && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="w-full rounded-xl p-3 flex flex-col gap-2"
                      style={{ background: `${grid[selectedCell].col}15`, border: `1.5px solid ${grid[selectedCell].col}44` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{grid[selectedCell].em}</span>
                        <div>
                          <div className="text-xs font-bold" style={{ color: grid[selectedCell].col }}>
                            Lv {grid[selectedCell].lv + 1}
                            {grid[selectedCell].lv >= 2 && ' ⭐MAX'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {grid[selectedCell].lv < 2 ? `強化コスト: 30W` : '最大レベル'}
                          </div>
                        </div>
                        <button onClick={() => { setShowUpgradePanel(false); setSelectedCell(null); }}
                          className="ml-auto text-muted-foreground text-sm px-2">✕</button>
                      </div>
                      {grid[selectedCell].lv >= 2 ? (
                        <div className="text-xs text-yellow-400 text-center font-bold">⭐ 特殊能力発動中！</div>
                      ) : (
                        <button onClick={handleUpgrade} disabled={power < 30}
                          className="w-full py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
                          style={{ background: `${grid[selectedCell].col}cc`, color: '#fff' }}>
                          ▲ 強化する（30W）
                          {grid[selectedCell].lv === 1 && ' → Lv3 特殊能力解放！'}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ULT button */}
                {showUltBtn && (
                  <button onClick={handleUlt}
                    disabled={ultGauge < 100}
                    className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-35"
                    style={{
                      background: ultGauge >= 100 ? 'linear-gradient(135deg, #00e5ff, #0066aa)' : '#111',
                      border: `2px solid ${ultGauge >= 100 ? '#00e5ff' : '#333'}`,
                      color: ultGauge >= 100 ? '#fff' : '#555',
                      boxShadow: ultGauge >= 100 ? '0 0 20px #00e5ff55' : 'none',
                      animation: ultGauge >= 100 ? 'glow-pulse 1.2s infinite' : 'none',
                    }}>
                    🌊 全自動洗浄！（オールクリーン）
                    {ultGauge < 100 && <div className="text-[10px] mt-0.5 opacity-60">ゲージ {ultGauge}% / 100%（敵を倒して溜めよう）</div>}
                  </button>
                )}
              </div>
            )}

            {/* ── ENEMY SHOWCASE ── */}
            {phase.id === 'enemies' && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {ENEMY_TYPES.map((et, i) => (
                    <button key={i} onClick={() => setEnemyIdx(i)}
                      className="flex-1 min-w-[80px] flex flex-col items-center py-2 px-1 rounded-xl transition-all"
                      style={{
                        background: enemyIdx === i ? `${et.col}22` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${enemyIdx === i ? et.col : '#333'}`,
                        boxShadow: enemyIdx === i ? `0 0 10px ${et.col}44` : 'none',
                      }}>
                      <span className="text-2xl">{et.em}</span>
                      <span className="text-[9px] font-bold mt-0.5" style={{ color: et.col }}>{et.name}</span>
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={enemyIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="rounded-xl p-3 flex flex-col gap-1.5"
                    style={{ background: `${ENEMY_TYPES[enemyIdx].col}12`, border: `1.5px solid ${ENEMY_TYPES[enemyIdx].col}44` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{ENEMY_TYPES[enemyIdx].em}</span>
                      <div>
                        <div className="font-black text-sm" style={{ color: ENEMY_TYPES[enemyIdx].col }}>{ENEMY_TYPES[enemyIdx].name}</div>
                        <div className="text-[10px] font-bold text-yellow-400">⚠️ {ENEMY_TYPES[enemyIdx].effect}</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ENEMY_TYPES[enemyIdx].desc}</p>
                    <div className="text-[10px] px-2 py-1 rounded-lg font-bold"
                      style={{ background: '#1a1a2e', color: '#a5d6a7' }}>
                      🛡️ 対策: {ENEMY_TYPES[enemyIdx].counter}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {ENEMY_TYPES.map((_, i) => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: i === enemyIdx ? ENEMY_TYPES[enemyIdx].col : '#2a2a3a' }} />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="text-[10px] text-muted-foreground text-center">タップで切り替え / {enemyIdx + 1}/{ENEMY_TYPES.length}</div>
              </div>
            )}

            {/* ── GACHA & TEAM ── */}
            {phase.id === 'gacha_team' && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Gacha banners */}
                  {[
                    { em: '📦', name: 'ノーマルガチャ', cost: '100V', col: '#9e9e9e', desc: '全ユニット対象。天井80回でOD確定' },
                    { em: '💎', name: 'プレミアム', cost: '250V', col: '#ffd700', desc: '高レア率UP。E以上保証' },
                    { em: '🌟', name: '限定バナー', cost: '400V', col: '#e91e63', desc: '限定ユニットのピックアップ率50%' },
                  ].map(b => (
                    <div key={b.name} className="rounded-xl p-2.5 flex flex-col gap-1"
                      style={{ background: `${b.col}12`, border: `1px solid ${b.col}44` }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{b.em}</span>
                        <div>
                          <div className="text-[10px] font-black" style={{ color: b.col }}>{b.name}</div>
                          <div className="text-[9px] text-yellow-400 font-bold">{b.cost}/回</div>
                        </div>
                      </div>
                      <div className="text-[9px] text-muted-foreground">{b.desc}</div>
                    </div>
                  ))}
                  <div className="rounded-xl p-2.5 flex flex-col gap-1 col-span-1"
                    style={{ background: '#7c3aed15', border: '1px solid #7c3aed44' }}>
                    <div className="text-[10px] font-black text-purple-400">🔄 重複→チップ変換</div>
                    <div className="text-[9px] text-muted-foreground">持ってるユニットが出たらチップに変換！チップを集めると交換ショップでユニットが貰える</div>
                  </div>
                </div>

                <div className="rounded-xl p-3" style={{ background: '#1a1a2e', border: '1px solid #333' }}>
                  <div className="text-xs font-black text-foreground mb-2">👥 チーム編成</div>
                  <div className="flex gap-1.5 mb-2">
                    {['🔌','♨️','🌀','💡','🌪️'].map((em, i) => (
                      <div key={i} className="flex-1 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ background: '#252538', border: '1px solid #334' }}>{em}</div>
                    ))}
                  </div>
                  <div className="text-[9px] text-muted-foreground">最大5体を選んでチームを組もう。依存チェーンを意識した編成が強い！</div>
                </div>

                {/* Pity system */}
                <div className="rounded-xl p-2.5" style={{ background: '#2a1a0033', border: '1px solid #ff980044' }}>
                  <div className="text-[10px] font-black text-orange-400 mb-1">🎯 天井システム（ピティ）</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#111' }}>
                      <div className="h-full rounded-full" style={{ width: '60%', background: 'linear-gradient(90deg, #ffd700, #ff9800)' }} />
                    </div>
                    <span className="text-[10px] font-mono text-orange-400">48/80</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">80回以内にOD(最高レア)が必ず1体出現！50回から確率アップ中</div>
                </div>
              </div>
            )}

            {/* ── AREAS & BOSS ── */}
            {phase.id === 'areas_boss' && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1.5">
                  {AREAS.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{ background: `${a.col}12`, border: `1px solid ${a.col}33`, opacity: i === 0 ? 1 : 0.6 }}>
                      <span className="text-2xl">{a.em}</span>
                      <div className="flex-1">
                        <div className="text-xs font-black" style={{ color: a.col }}>{a.name}エリア</div>
                        <div className="text-[9px] text-muted-foreground">{a.desc}</div>
                      </div>
                      <div className="text-[9px] font-bold" style={{ color: i === 0 ? '#4caf50' : '#555' }}>
                        {i === 0 ? '🔓 解放済' : '🔒'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-3" style={{ background: '#1a0a0a', border: '1px solid #f4433644' }}>
                  <div className="text-xs font-black text-red-400 mb-2">👹 ボスの特殊能力</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BOSS_ABILITIES.map(b => (
                      <div key={b.name} className="rounded-lg px-2 py-1.5 flex items-start gap-1.5"
                        style={{ background: 'rgba(244,67,54,0.08)' }}>
                        <span className="text-base leading-none mt-0.5">{b.em}</span>
                        <div>
                          <div className="text-[10px] font-bold text-red-300">{b.name}</div>
                          <div className="text-[9px] text-muted-foreground">{b.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[9px] text-muted-foreground">10ウェーブごとにボス登場！倒すとULTゲージが25%増加</div>
                </div>
              </div>
            )}

            {/* ── INTRO ── */}
            {phase.id === 'intro' && (
              <div className="flex flex-col gap-3">
                {/* Game preview mini visual */}
                <div className="rounded-2xl overflow-hidden relative"
                  style={{ background: '#0e0e1a', border: '1px solid #2a2a3a', height: 140 }}>
                  {/* Fake path */}
                  {[[0,1],[1,1],[2,1],[3,1],[4,1],[4,2],[4,3],[3,3],[2,3],[1,3],[0,3]].map(([c,r],i) => (
                    <div key={i} className="absolute rounded-sm"
                      style={{ left: c*44+6, top: r*32+6, width:40, height:28, background:'#1e1830', border:'1px solid rgba(168,85,247,0.2)' }} />
                  ))}
                  {/* Fake towers */}
                  {[{c:1,r:2,em:'🔌',col:'#9e9e9e'},{c:2,r:2,em:'🌀',col:'#81d4fa'},{c:3,r:2,em:'🌪️',col:'#a5d6a7'}].map((t,i) => (
                    <motion.div key={i} initial={{scale:0}} animate={{scale:1}} transition={{delay:i*0.15}}
                      className="absolute flex items-center justify-center rounded-lg text-xl"
                      style={{ left:t.c*44+8, top:t.r*32+8, width:36, height:24, background:`${t.col}22`, border:`1.5px solid ${t.col}` }}>
                      {t.em}
                    </motion.div>
                  ))}
                  {/* Fake enemies */}
                  {['🌫️','🌫️','⚡'].map((em,i) => (
                    <motion.div key={i} className="absolute text-lg"
                      animate={{ x: [0, -20, -40, -60] }}
                      transition={{ duration: 3+i*0.5, repeat: Infinity, delay: i*1 }}
                      style={{ left: 180-i*30, top: 38 }}>
                      {em}
                    </motion.div>
                  ))}
                  <div className="absolute top-2 left-3 text-xs font-bold" style={{color:'#ffd700'}}>⚡ 120W</div>
                  <div className="absolute top-2 right-3 text-xs font-bold" style={{color:'#ef5350'}}>❤️ 10/10</div>
                  <div className="absolute bottom-2 left-3 text-[10px] text-purple-400">🚪 エントランス</div>
                  <div className="absolute bottom-2 right-3 text-base">🏠</div>
                </div>
                {/* What you'll learn */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { em:'👆', label:'タワー設置と\nチェーン依存' },
                    { em:'⚡', label:'電力管理と\nウェーブ攻略' },
                    { em:'⭐', label:'強化とLv3\n特殊能力' },
                    { em:'🌊', label:'全自動洗浄\nULTシステム' },
                    { em:'🪳', label:'特殊な敵の\n種類と対策' },
                    { em:'🗺️', label:'ガチャ・チーム・\nエリア選択' },
                  ].map(item => (
                    <div key={item.em} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid #2a2a3a' }}>
                      <span className="text-base">{item.em}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight whitespace-pre-line">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center text-[10px] text-muted-foreground">所要時間：約3〜5分</div>
              </div>
            )}

            {/* ── DONE ── */}
            {phase.id === 'done' && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { em: '🔌', title: 'チェーン設置', desc: '依存元を先に置こう' },
                    { em: '⚡', title: '電力管理', desc: '常に余裕を持たせて' },
                    { em: '🌊', title: 'ULT温存', desc: 'ボス戦前に満タンに' },
                    { em: '🎰', title: 'ガチャ戦略', desc: '天井狙いで効率よく' },
                    { em: '⬆️', title: '先に強化', desc: 'Lv3能力が超強力！' },
                    { em: '🛡️', title: 'ボス対策', desc: 'バリア中は温存する' },
                  ].map(t => (
                    <div key={t.em} className="glass-panel rounded-xl px-3 py-2 flex items-start gap-2">
                      <span className="text-base">{t.em}</span>
                      <div>
                        <div className="font-bold text-foreground/90">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={onComplete}
                  className="w-full py-4 rounded-2xl font-black text-base text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}>
                  🎮 ゲームスタート！
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="relative z-10 px-4 pb-4 pt-2 flex-shrink-0">
        {phase.id !== 'done' && (
          <div className="flex gap-2">
            {phaseIdx > 0 && (
              <button onClick={() => { setPhaseIdx(i => i - 1); setTaskDone(false); setSelectedTower(null); setShowUpgradePanel(false); setWaveStarted(false); setWaveCleared(false); setEnemies([]); }}
                className="game-btn-ghost flex-1 py-2.5 text-sm">
                ← 戻る
              </button>
            )}
            <button
              onClick={() => {
                if (phase.id === 'wave_play' && !taskDone) {
                  if (!waveStarted) {
                    setWaveStarted(true);
                    setUltGauge(g => Math.min(100, g + 35));
                  }
                  return;
                }
                if (phase.id === 'ult' && !taskDone) {
                  setUltGauge(100);
                  flash('💡 ゲージが満タンになった！ULTボタンを押そう！');
                  return;
                }
                nextPhase();
              }}
              className="flex-[2] py-2.5 text-sm font-bold rounded-xl transition-all"
              style={{
                background: taskDone || !phase.task ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#1a1a2e',
                color: taskDone || !phase.task ? '#fff' : '#555',
                border: taskDone || !phase.task ? 'none' : '1px solid #333',
              }}>
              {phase.id === 'wave_play' && !taskDone && !waveStarted ? '▶ ウェーブ開始' :
               phase.id === 'ult' && !taskDone ? '💡 ゲージを満タンにする' :
               phase.task && !taskDone ? '↓ 上のタスクをやってみよう' :
               phaseIdx >= PHASES.length - 2 ? '🎮 ゲームスタート！' : '次へ →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
