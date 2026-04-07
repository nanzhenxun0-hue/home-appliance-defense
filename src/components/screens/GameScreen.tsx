import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLS, ROWS, CELL, GW, GH, DIFF, TDEFS, UPS, WAVES, PS, st, sellVal } from '@/game/constants';
import { mkState, buildQ, tickGame, getEnabled, canPlace, resetUid, calcPowerBalance } from '@/game/logic';
import { drawFrame } from '@/game/renderer';
import type { DifficultyKey, TowerID, UIState, GameState } from '@/game/types';
import { WAVE_VOLT_REWARD, RARITY_COLOR } from '@/game/types';
import { useSound } from '@/hooks/useSound';
import { useHighScore } from '@/hooks/useHighScore';
import { getActiveChainCombos } from '@/game/chainCombo';
import HUD from '@/components/game/HUD';
import InspectPanel from '@/components/game/InspectPanel';

interface GameScreenProps {
  diff: DifficultyKey;
  team: TowerID[];
  onHome: () => void;
  onVoltEarned?: (amount: number) => void;
}

const GameScreen = ({ diff, team, onHome, onVoltEarned }: GameScreenProps) => {
  const cvs = useRef<HTMLCanvasElement>(null);
  const gs = useRef<GameState>(mkState(diff, team));
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
  const [pinKey, setPinKey] = useState<string | null>(null);
  const [waveAnnounce, setWaveAnnounce] = useState<string | null>(null);
  const [comboAnnounce, setComboAnnounce] = useState<string | null>(null);
  const prevComboCount = useRef(0);

  const { play: playSound, init: initSound } = useSound();
  const { addScore } = useHighScore();

  useEffect(() => { pmRef.current = placeMode; }, [placeMode]);
  useEffect(() => { pinRef.current = pinKey; }, [pinKey]);

  // Touch/click handler for canvas
  const getCell = useCallback((clientX: number, clientY: number) => {
    const el = cvs.current; if (!el) return { c: -1, r: -1 };
    const rc = el.getBoundingClientRect();
    const scaleX = GW / rc.width;
    const scaleY = GH / rc.height;
    const c = Math.floor((clientX - rc.left) * scaleX / CELL);
    const r = Math.floor((clientY - rc.top) * scaleY / CELL);
    return (c < 0 || c >= COLS || r < 0 || r >= ROWS) ? { c: -1, r: -1 } : { c, r };
  }, []);

  const handleTap = useCallback((clientX: number, clientY: number) => {
    initSound();
    const s = gs.current; if (s.over || s.win) return;
    const { c, r } = getCell(clientX, clientY); if (c < 0) return;
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
      setPlaceMode(null);
      playSound('place');
      // Check for new chain combos
      const placed = [...new Set(Object.values(s.grid).map(c => c.tid))];
      const newCombos = getActiveChainCombos(placed);
      if (newCombos.length > prevComboCount.current) {
        const latest = newCombos[newCombos.length - 1];
        setComboAnnounce(`${latest.em} ${latest.name}`);
        playSound('upgrade');
        setTimeout(() => setComboAnnounce(null), 2000);
      }
      prevComboCount.current = newCombos.length;
    } else {
      if (s.grid[key]) setPinKey(pk => pk === key ? null : key);
      else setPinKey(null);
    }
  }, [getCell, initSound, playSound]);

  const onCanvasClick = (ev: React.MouseEvent) => handleTap(ev.clientX, ev.clientY);
  const onCanvasTouch = (ev: React.TouchEvent) => {
    ev.preventDefault();
    const t = ev.touches[0];
    if (t) handleTap(t.clientX, t.clientY);
  };
  const onMM = (ev: React.MouseEvent) => {
    const { c, r } = getCell(ev.clientX, ev.clientY);
    hcRef.current = { c, r };
  };

  const doUpgrade = () => {
    const s = gs.current, key = pinRef.current; if (!key) return;
    const cell = s.grid[key]; if (!cell) return;
    const { tid, lv } = cell;
    if (lv >= UPS[tid].length - 1) return;
    const cost = UPS[tid][lv + 1].c; if (s.power < cost) return;
    s.power -= cost; cell.lv++;
    playSound('upgrade');
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
    gs.current = mkState(diff, team);
    scoreSaved.current = false;
    const d2 = DIFF[diff];
    setUi({ power: d2.sp, wave: 0, baseHP: d2.shp, maxHP: d2.shp, wActive: false, over: false, win: false });
    setPlaceMode(null); setPinKey(null);
    hcRef.current = { c: -1, r: -1 };
  };

  // Wave clear → earn volts
  const prevWaveActive = useRef(false);
  useEffect(() => {
    if (prevWaveActive.current && !ui.wActive && !ui.over && !ui.win && ui.wave > 0) {
      const reward = WAVE_VOLT_REWARD(ui.wave);
      onVoltEarned?.(reward);
    }
    prevWaveActive.current = ui.wActive;
  }, [ui.wActive, ui.wave, ui.over, ui.win, onVoltEarned]);

  // Save score on game end
  useEffect(() => {
    if ((ui.over || ui.win) && !scoreSaved.current) {
      scoreSaved.current = true;
      addScore({ diff, wave: ui.wave, won: ui.win, date: new Date().toLocaleDateString('ja-JP'), power: ui.power });
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

  return (
    <div className="bg-background h-[100dvh] flex flex-col select-none overflow-hidden relative">
      {/* HUD - compact mobile */}
      <HUD ui={ui} diff={diff} grid={s.grid} placedTowers={[...new Set(Object.values(s.grid).map(c => c.tid))]} onHome={onHome} onStartWave={startWave} />

      {/* Canvas - fills available space */}
      <div className="flex-1 min-h-0 relative mx-1 rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(168,85,247,0.15)' }}>
        <canvas
          ref={cvs} width={GW} height={GH}
          className="block w-full h-full"
          style={{ objectFit: 'contain', touchAction: 'none', cursor: placeMode ? 'crosshair' : 'default' }}
          onMouseMove={onMM}
          onClick={onCanvasClick}
          onTouchStart={onCanvasTouch}
          onContextMenu={e => { e.preventDefault(); setPlaceMode(null); setPinKey(null); }}
        />

        {/* Low power overlay */}
        {s.power <= 0 && s.waveActive && <div className="absolute inset-0 pointer-events-none bg-red-900/5 animate-pulse" />}

        {/* Wave announce */}
        <AnimatePresence>
          {waveAnnounce && (
            <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <span className="text-purple-400 font-black text-3xl drop-shadow-lg">{waveAnnounce}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game over / Win */}
        {(ui.over || ui.win) && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-lg flex flex-col items-center justify-center gap-3 z-30 rounded-lg">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-4xl">
              {ui.win ? '🎉' : '💀'}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="text-lg font-black text-center" style={{ color: ui.win ? '#ffd700' : '#ef5350' }}>
                {ui.win ? '全ウェーブクリア！' : 'ゲームオーバー'}
              </div>
              <div className="text-muted-foreground text-xs text-center mt-1">
                {ui.win ? '家を守り抜きました！' : `Wave ${ui.wave} で力尽きた…`}
              </div>
            </motion.div>
            <div className="flex gap-2">
              <button onClick={doRestart} className="game-btn-primary text-sm px-4 py-1.5">🔄 再挑戦</button>
              <button onClick={onHome} className="game-btn-ghost text-sm px-3 py-1.5">🏠 ホーム</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar - Team placement */}
      <div className="px-1 py-1.5 flex flex-col gap-1">
        {/* Place mode banner */}
        <AnimatePresence>
          {placeMode && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
              className="glass-panel px-2 py-1 flex gap-2 items-center justify-center text-[10px]"
              style={{ borderColor: RARITY_COLOR[TDEFS[placeMode].r] + '33' }}>
              <span>{TDEFS[placeMode].em} {TDEFS[placeMode].n} 設置中</span>
              <button onClick={() => setPlaceMode(null)} className="text-red-400 font-bold px-2">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team bar */}
        <div className="flex gap-1 justify-center overflow-x-auto">
          {team.map(tid => {
            const def = TDEFS[tid];
            const isSel = placeMode === tid;
            const canAff = ui.power >= def.baseCost;
            const chainOk = canPlace(tid, s.grid);
            const ok = canAff && chainOk;

            return (
              <button
                key={tid}
                onClick={() => ok && setPlaceMode(isSel ? null : tid)}
                className="flex flex-col items-center px-2 py-1 rounded-lg transition-all min-w-[56px]"
                style={{
                  background: isSel ? RARITY_COLOR[def.r] + '22' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSel ? RARITY_COLOR[def.r] : RARITY_COLOR[def.r] + '33'}`,
                  opacity: ok ? 1 : 0.35,
                  boxShadow: isSel ? `0 0 12px ${RARITY_COLOR[def.r]}44` : 'none',
                }}
                disabled={!ok}
              >
                <span className="text-lg leading-none">{def.em}</span>
                <span className="text-[8px] font-bold mt-0.5" style={{ color: RARITY_COLOR[def.r] }}>{def.r}</span>
                <span className="text-[9px] text-foreground/70 font-medium">{def.n.slice(0, 4)}</span>
                <span className="text-[9px] text-yellow-400 font-bold">{def.baseCost}W</span>
              </button>
            );
          })}
        </div>

        {/* Inspect panel */}
        {pinKey && s.grid[pinKey] && (
          <InspectPanel cellKey={pinKey} grid={s.grid} power={ui.power} onUpgrade={doUpgrade} onSell={doSell} onClose={() => setPinKey(null)} />
        )}
      </div>
    </div>
  );
};

export default GameScreen;
