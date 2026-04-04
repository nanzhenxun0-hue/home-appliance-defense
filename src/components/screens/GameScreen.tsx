import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLS, ROWS, CELL, GW, GH, DIFF, TDEFS, UPS, WAVES, PS, st, sellVal } from '@/game/constants';
import { mkState, buildQ, tickGame, getEnabled, canPlace, resetUid, calcPowerBalance } from '@/game/logic';
import { drawFrame } from '@/game/renderer';
import type { DifficultyKey, TowerID, UIState, GameState } from '@/game/types';
import { useSound } from '@/hooks/useSound';
import { useHighScore } from '@/hooks/useHighScore';
import HUD from '@/components/game/HUD';
import Shop from '@/components/game/Shop';
import InspectPanel from '@/components/game/InspectPanel';

interface GameScreenProps {
  diff: DifficultyKey;
  onHome: () => void;
}

const GameScreen = ({ diff, onHome }: GameScreenProps) => {
  const cvs = useRef<HTMLCanvasElement>(null);
  const gs = useRef<GameState>(mkState(diff));
  const raf = useRef<number>(0);
  const pmRef = useRef<TowerID | null>(null);
  const hcRef = useRef({ c: -1, r: -1 });
  const pinRef = useRef<string | null>(null);
  const uiT = useRef(0);
  const timeRef = useRef(0);
  const scoreSaved = useRef(false);

  const d = DIFF[diff];
  const [ui, setUi] = useState<UIState>(() => ({
    power: d.sp, wave: 0, baseHP: d.shp, maxHP: d.shp,
    wActive: false, over: false, win: false,
  }));
  const [placeMode, setPlaceMode] = useState<TowerID | null>(null);
  const [hoverCell, setHoverCell] = useState<{ c: number; r: number } | null>(null);
  const [pinKey, setPinKey] = useState<string | null>(null);
  const [waveAnnounce, setWaveAnnounce] = useState<string | null>(null);

  const { play: playSound, init: initSound } = useSound();
  const { addScore } = useHighScore();

  useEffect(() => { pmRef.current = placeMode; }, [placeMode]);
  useEffect(() => { pinRef.current = pinKey; }, [pinKey]);

  const getCell = (ev: React.MouseEvent) => {
    const el = cvs.current; if (!el) return { c: -1, r: -1 };
    const rc = el.getBoundingClientRect();
    const c = Math.floor((ev.clientX - rc.left) / rc.width * GW / CELL);
    const r = Math.floor((ev.clientY - rc.top) / rc.height * GH / CELL);
    return (c < 0 || c >= COLS || r < 0 || r >= ROWS) ? { c: -1, r: -1 } : { c, r };
  };

  const onMM = (ev: React.MouseEvent) => {
    const { c, r } = getCell(ev);
    if (c !== hcRef.current.c || r !== hcRef.current.r) {
      hcRef.current = { c, r };
      setHoverCell(c < 0 ? null : { c, r });
    }
  };
  const onML = () => { hcRef.current = { c: -1, r: -1 }; setHoverCell(null); };

  const onClick = (ev: React.MouseEvent) => {
    initSound();
    const s = gs.current; if (s.over || s.win) return;
    const { c, r } = getCell(ev); if (c < 0) return;
    const key = `${c},${r}`;
    if (pmRef.current) {
      const tid = pmRef.current;
      const def = TDEFS[tid];
      if (PS.has(key) || s.grid[key]) return;
      if (!canPlace(tid, s.grid)) return;
      if (s.power < def.baseCost) return;
      s.power -= def.baseCost;
      s.grid[key] = { tid, lv: 0 };
      s.timers[key] = 0;
      playSound('place');
    } else {
      if (s.grid[key]) setPinKey(pk => pk === key ? null : key);
      else setPinKey(null);
    }
  };

  const onRC = (ev: React.MouseEvent) => {
    ev.preventDefault(); setPlaceMode(null); setPinKey(null);
  };

  const doUpgrade = () => {
    const s = gs.current, key = pinRef.current; if (!key) return;
    const cell = s.grid[key]; if (!cell) return;
    const { tid, lv } = cell;
    if (lv >= UPS[tid].length - 1) return;
    const cost = UPS[tid][lv + 1].c; if (s.power < cost) return;
    s.power -= cost; cell.lv++;
    playSound('upgrade');
    setUi(u => ({ ...u, power: Math.floor(s.power) }));
  };

  const doSell = () => {
    const s = gs.current, key = pinRef.current; if (!key) return;
    const cell = s.grid[key]; if (!cell) return;
    s.power += sellVal(cell.tid, cell.lv);
    delete s.grid[key]; delete s.timers[key];
    setPinKey(null);
    playSound('sell');
  };

  const startWave = () => {
    initSound();
    const s = gs.current;
    if (s.waveActive || s.wave >= WAVES.length) return;
    s.spawnQ = buildQ(s.wave, diff);
    s.waveT = 0; s.powerT = 0; s.wave++; s.waveActive = true;
    playSound('wave_start');
    setWaveAnnounce(`Wave ${s.wave}`);
    setTimeout(() => setWaveAnnounce(null), 1500);
  };

  const doRestart = () => {
    resetUid();
    gs.current = mkState(diff);
    scoreSaved.current = false;
    const d2 = DIFF[diff];
    setUi({ power: d2.sp, wave: 0, baseHP: d2.shp, maxHP: d2.shp, wActive: false, over: false, win: false });
    setPlaceMode(null); setPinKey(null); setHoverCell(null);
    hcRef.current = { c: -1, r: -1 };
  };

  // Save score on game end
  useEffect(() => {
    if ((ui.over || ui.win) && !scoreSaved.current) {
      scoreSaved.current = true;
      addScore({
        diff, wave: ui.wave, won: ui.win,
        date: new Date().toLocaleDateString('ja-JP'),
        power: ui.power,
      });
      playSound(ui.win ? 'victory' : 'game_over');
    }
  }, [ui.over, ui.win]);

  // Game loop
  useEffect(() => {
    let lastTs: number | null = null;
    const loop = (ts: number) => {
      raf.current = requestAnimationFrame(loop);
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0.016;
      lastTs = ts;
      timeRef.current += dt;
      const s = gs.current;
      if (!s.over && !s.win) tickGame(s, dt);
      const ctx = cvs.current?.getContext('2d');
      if (ctx) drawFrame(ctx, s, pmRef.current, hcRef.current.c, hcRef.current.r, pinRef.current, timeRef.current);
      uiT.current += dt;
      if (uiT.current > 0.09 || s.over || s.win) {
        uiT.current = 0;
        setUi({
          power: Math.floor(s.power), wave: s.wave, baseHP: s.baseHP, maxHP: s.maxHP,
          wActive: s.waveActive, over: s.over, win: s.win,
        });
      }
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const s = gs.current;
  const hovKey = hoverCell ? `${hoverCell.c},${hoverCell.r}` : null;
  const lowPower = s.power <= 0 && s.waveActive;

  return (
    <div className="bg-background h-screen flex flex-col items-center p-1.5 gap-1.5 select-none overflow-hidden relative">
      {/* SF ambient particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none z-0"
          style={{
            width: 1.5 + Math.random() * 2,
            height: 1.5 + Math.random() * 2,
            left: `${Math.random() * 100}%`,
            bottom: '-2%',
            background: i % 3 === 0 ? 'hsl(350 100% 60%)' : i % 3 === 1 ? 'hsl(210 100% 65%)' : 'hsl(270 100% 70%)',
            animation: `sf-particle-float ${8 + Math.random() * 12}s linear infinite`,
            animationDelay: `${Math.random() * 8}s`,
            boxShadow: '0 0 4px currentColor',
          }}
        />
      ))}
      {/* HUD */}
      <HUD ui={ui} diff={diff} grid={s.grid} onHome={onHome} onStartWave={startWave} />

      {/* Place mode banner */}
      <AnimatePresence>
        {placeMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel px-3 py-1 flex gap-2 items-center flex-wrap justify-center w-full max-w-[860px] text-[11px] font-bold"
            style={{ borderColor: '#4299e122', color: '#90caf9' }}
          >
            <span className="text-base">{TDEFS[placeMode].em}</span>
            <b className="text-foreground">{TDEFS[placeMode].n}</b>設置モード
            <span className="text-game-green text-[10px]">✅ 緑マスをクリックで配置</span>
            <button
              onClick={() => setPlaceMode(null)}
              className="game-btn-ghost text-[10px] px-2 py-0.5 text-game-red"
              style={{ borderColor: '#f4433644', background: '#2a0a0a' }}
            >
              ✕ キャンセル
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-visible border border-border w-full max-w-[860px] flex-1 min-h-0"
        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.95)' }}>
        <canvas
          ref={cvs} width={GW} height={GH}
          className="block w-full h-full rounded-xl"
          style={{ objectFit: 'contain', cursor: placeMode ? 'crosshair' : 'default' }}
          onMouseMove={onMM} onMouseLeave={onML} onClick={onClick} onContextMenu={onRC}
        />

        {/* Low power warning overlay */}
        {lowPower && <div className="power-warning-overlay" />}

        {/* Wave announce */}
        <AnimatePresence>
          {waveAnnounce && (
            <motion.div
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <span className="text-game-gold font-black text-4xl" style={{ textShadow: '0 0 30px rgba(255,215,0,0.6)' }}>
                {waveAnnounce}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game over / Win overlay */}
        {(ui.over || ui.win) && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-lg flex flex-col items-center justify-center gap-4 z-30 rounded-xl">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-4xl">
              {ui.win ? '🎉' : '💀'}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="text-xl font-black" style={{ color: ui.win ? '#ffd700' : '#ef5350' }}>
                {ui.win ? '全ウェーブクリア！' : 'ゲームオーバー'}
              </div>
              <div className="text-muted-foreground text-xs text-center mt-1">
                {ui.win ? '家を守り抜きました！' : `Wave ${ui.wave} で力尽きた…`}
              </div>
            </motion.div>
            <div className="flex gap-2">
              <button onClick={doRestart} className="game-btn-primary text-sm px-5 py-2">🔄 再挑戦</button>
              <button onClick={onHome} className="game-btn-ghost">🏠 ホーム</button>
            </div>
          </div>
        )}
      </div>

      {/* Shop */}
      <Shop grid={s.grid} power={ui.power} placeMode={placeMode} onSelect={(tid) => { setPlaceMode(tid); setPinKey(null); }} />

      {/* Inspect panel */}
      {pinKey && s.grid[pinKey] && (
        <div className="w-full max-w-[860px]">
          <InspectPanel cellKey={pinKey} grid={s.grid} power={ui.power} onUpgrade={doUpgrade} onSell={doSell} onClose={() => setPinKey(null)} />
        </div>
      )}

      {/* Hover info */}
      {!pinKey && hovKey && s.grid[hovKey] && !placeMode && (() => {
        const { tid, lv } = s.grid[hovKey];
        const def = TDEFS[tid]; const S = st(tid, lv);
        return (
          <div className="text-muted-foreground text-[10px] flex gap-2 items-center flex-wrap justify-center">
            <span style={{ color: def.rc }}>{def.em}{S.lbl}</span>
            {S.dmg > 0 && <span>⚔️{S.dmg}</span>}
            {S.rng > 0 && <span>📏{S.rng}</span>}
            {S.pg > 0 && <span className="text-game-green">+{S.pg}W</span>}
            <span className="text-muted-foreground/50">クリックで詳細・強化・売却</span>
          </div>
        );
      })()}

      {!pinKey && (!hovKey || !s.grid[hovKey!]) && (
        <div className="text-muted-foreground/30 text-[9px] flex gap-3 flex-wrap justify-center">
          <span>🔗 緑の線＝連携中　赤の線＝連携切れ　💤＝停止</span>
          <span>クリックでタワー選択→強化・売却</span>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
