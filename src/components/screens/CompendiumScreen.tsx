import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TDEFS, UPS } from '@/game/constants';
import { TOWER_USAGE } from '@/game/towerUsage';
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER, PERSONALITY_BONUS, type TowerID, type Rarity } from '@/game/types';

interface Props {
  owned: TowerID[];
  onBack: () => void;
}

// ── Demo canvas animation ─────────────────────────────────────────────────────

type AttackStyle = 'single' | 'fan' | 'circle' | 'beam' | 'splash' | 'chain';

interface DemoConfig {
  style: AttackStyle;
  fanAngle?: number;
  col: string;
  interval: number;
}

const DEMO_CFG: Partial<Record<TowerID, DemoConfig>> = {
  blender:      { style: 'fan',    fanAngle: Math.PI,        col: '#64b5f6', interval: 1.6 },
  washer:       { style: 'fan',    fanAngle: Math.PI*4/3,    col: '#26c6da', interval: 1.8 },
  aircon:       { style: 'fan',    fanAngle: Math.PI*5/6,    col: '#4fc3f7', interval: 1.6 },
  oven:         { style: 'fan',    fanAngle: Math.PI*5/6,    col: '#ff7043', interval: 1.8 },
  waffleiron:   { style: 'fan',    fanAngle: Math.PI*2/3,    col: '#ffd54f', interval: 1.6 },
  dryer:        { style: 'fan',    fanAngle: Math.PI,        col: '#ef9a9a', interval: 1.8 },
  promo_endless:{ style: 'circle',                           col: '#ff4081', interval: 2.2 },
  fryer:        { style: 'splash',                           col: '#ffca28', interval: 1.8 },
  plasma:       { style: 'beam',                             col: '#ffd700', interval: 2.2 },
  tesla:        { style: 'chain',                            col: '#7c4dff', interval: 1.6 },
};

interface DemoEnemy { x: number; y: number; hp: number; maxHp: number; flash: number }
interface DemoFx {
  type: 'proj' | 'fan' | 'ring' | 'beam' | 'splash';
  x: number; y: number; tx?: number; ty?: number;
  r?: number; maxR?: number;
  arc?: number; arcDir?: number;
  col: string; life: number; ml: number;
}

const TowerDemoCanvas = ({ tid }: { tid: TowerID }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const TX = 38, TY = H / 2; // Tower position
    const cfg: DemoConfig = DEMO_CFG[tid] ?? { style: 'single', col: '#a78bfa', interval: 1.4 };
    const def = TDEFS[tid];

    // State
    const enemies: DemoEnemy[] = [];
    const fxs: DemoFx[] = [];
    let attackTimer = 0;
    let spawnTimer = 0;
    let lastTime = 0;
    let uid = 0;
    const nextId = () => uid++;

    const spawnEnemy = () => {
      const y = H * 0.3 + Math.random() * H * 0.4;
      enemies.push({ x: W + 10, y, hp: 3, maxHp: 3, flash: 0 });
    };
    spawnEnemy(); spawnEnemy();

    const doAttack = () => {
      const inRange = enemies.filter(e => e.hp > 0 && e.x > TX);
      if (inRange.length === 0) return;
      const nearest = inRange.reduce((a, b) => Math.hypot(a.x - TX, a.y - TY) < Math.hypot(b.x - TX, b.y - TY) ? a : b);

      if (cfg.style === 'single') {
        fxs.push({ type: 'proj', x: TX, y: TY, tx: nearest.x, ty: nearest.y, col: cfg.col, life: 0.22, ml: 0.22 });
        nearest.hp--; nearest.flash = 0.15;
        if (nearest.hp <= 0) enemies.splice(enemies.indexOf(nearest), 1);

      } else if (cfg.style === 'fan') {
        const dir = Math.atan2(nearest.y - TY, nearest.x - TX);
        const halfA = (cfg.fanAngle ?? Math.PI) / 2;
        fxs.push({ type: 'fan', x: TX, y: TY, r: 0, maxR: 90, arc: cfg.fanAngle, arcDir: dir, col: cfg.col, life: 0.38, ml: 0.38 });
        for (const e of inRange) {
          const ea = Math.atan2(e.y - TY, e.x - TX);
          let diff = Math.abs(ea - dir);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff <= halfA) {
            fxs.push({ type: 'proj', x: TX, y: TY, tx: e.x, ty: e.y, col: cfg.col, life: 0.16, ml: 0.16 });
            e.hp--; e.flash = 0.15;
            if (e.hp <= 0) enemies.splice(enemies.indexOf(e), 1);
          }
        }

      } else if (cfg.style === 'circle') {
        fxs.push({ type: 'ring', x: TX, y: TY, r: 0, maxR: 95, col: cfg.col, life: 0.4, ml: 0.4 });
        fxs.push({ type: 'ring', x: TX, y: TY, r: 0, maxR: 70, col: '#ffd700', life: 0.32, ml: 0.32 });
        for (const e of inRange) {
          fxs.push({ type: 'proj', x: TX, y: TY, tx: e.x, ty: e.y, col: cfg.col, life: 0.18, ml: 0.18 });
          e.hp--; e.flash = 0.15;
          if (e.hp <= 0) enemies.splice(enemies.indexOf(e), 1);
        }

      } else if (cfg.style === 'beam') {
        fxs.push({ type: 'beam', x: TX, y: TY, tx: W, ty: TY, col: cfg.col, life: 0.22, ml: 0.22 });
        for (const e of inRange) {
          e.hp--; e.flash = 0.15;
          if (e.hp <= 0) enemies.splice(enemies.indexOf(e), 1);
        }

      } else if (cfg.style === 'splash') {
        fxs.push({ type: 'proj', x: TX, y: TY, tx: nearest.x, ty: nearest.y, col: cfg.col, life: 0.22, ml: 0.22 });
        setTimeout(() => {
          fxs.push({ type: 'splash', x: nearest.x, y: nearest.y, r: 0, maxR: 40, col: cfg.col, life: 0.45, ml: 0.45 });
          for (const e of inRange) {
            if (Math.hypot(e.x - nearest.x, e.y - nearest.y) < 40) {
              e.hp--; e.flash = 0.15;
              if (e.hp <= 0) enemies.splice(enemies.indexOf(e), 1);
            }
          }
        }, 200);

      } else if (cfg.style === 'chain') {
        let cx = TX, cy = TY;
        const chain = [nearest, ...inRange.filter(e => e !== nearest).slice(0, 2)];
        chain.forEach(e => {
          fxs.push({ type: 'proj', x: cx, y: cy, tx: e.x, ty: e.y, col: cfg.col, life: 0.2, ml: 0.2 });
          e.hp--; e.flash = 0.15;
          cx = e.x; cy = e.y;
          if (e.hp <= 0) enemies.splice(enemies.indexOf(e), 1);
        });
      }
    };

    let raf: number;
    const loop = (t: number) => {
      const dt = Math.min((t - lastTime) / 1000, 0.05);
      lastTime = t;

      // Update enemies
      for (const e of enemies) {
        e.x -= 28 * dt;
        e.flash = Math.max(0, e.flash - dt);
        if (e.x < TX - 10) e.x = W + 10 + Math.random() * 40;
      }
      enemies.splice(0, enemies.length, ...enemies.filter(e => e.x < W + 30));

      // Spawn
      spawnTimer += dt;
      if (spawnTimer > 1.8 && enemies.length < 4) {
        spawnEnemy(); spawnTimer = 0;
      }

      // Attack timer
      attackTimer += dt;
      if (attackTimer >= cfg.interval) {
        attackTimer = 0;
        doAttack();
      }

      // Update FX
      for (const fx of fxs) {
        fx.life -= dt;
        if (fx.type === 'fan' || fx.type === 'ring' || fx.type === 'splash') {
          const prog = 1 - fx.life / fx.ml;
          fx.r = (fx.maxR ?? 80) * prog;
        }
      }
      fxs.splice(0, fxs.length, ...fxs.filter(f => f.life > 0));

      // ── Draw ──
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, W, H);

      // Ground line
      ctx.strokeStyle = '#1e1e3a';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(TX + 16, TY + 14); ctx.lineTo(W, TY + 14); ctx.stroke();

      // Tower glow ring
      const towerGrad = ctx.createRadialGradient(TX, TY, 0, TX, TY, 24);
      towerGrad.addColorStop(0, cfg.col + '44');
      towerGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = towerGrad;
      ctx.beginPath(); ctx.arc(TX, TY, 24, 0, Math.PI * 2); ctx.fill();

      // Tower emoji
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.em, TX, TY);

      // Enemies
      for (const e of enemies) {
        const isFlash = e.flash > 0;
        ctx.globalAlpha = isFlash ? 0.6 : 1;
        ctx.fillStyle = isFlash ? '#fff' : '#ef4444';
        ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '9px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👿', e.x, e.y);
        // HP bar
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(e.x - 8, e.y - 12, 16, 3);
        ctx.fillStyle = e.hp > 1 ? '#4ade80' : '#ef4444';
        ctx.fillRect(e.x - 8, e.y - 12, 16 * (e.hp / e.maxHp), 3);
        ctx.globalAlpha = 1;
      }

      // FX
      for (const fx of fxs) {
        const a = Math.max(0, fx.life / fx.ml);
        ctx.shadowBlur = 8; ctx.shadowColor = fx.col;

        if (fx.type === 'proj') {
          ctx.globalAlpha = a;
          ctx.strokeStyle = fx.col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fx.x, fx.y);
          const prog = 1 - a;
          ctx.lineTo(fx.x + (fx.tx! - fx.x) * prog, fx.y + (fx.ty! - fx.y) * prog);
          ctx.stroke();
          ctx.fillStyle = fx.col;
          ctx.beginPath();
          ctx.arc(fx.x + (fx.tx! - fx.x) * prog, fx.y + (fx.ty! - fx.y) * prog, 3, 0, Math.PI * 2);
          ctx.fill();

        } else if (fx.type === 'fan') {
          const halfArc = (fx.arc ?? Math.PI) / 2;
          const a0 = (fx.arcDir ?? 0) - halfArc;
          const a1 = (fx.arcDir ?? 0) + halfArc;
          ctx.globalAlpha = a * 0.20;
          ctx.fillStyle = fx.col;
          ctx.beginPath();
          ctx.moveTo(fx.x, fx.y);
          ctx.arc(fx.x, fx.y, fx.r ?? 0, a0, a1);
          ctx.closePath(); ctx.fill();
          ctx.globalAlpha = a * 0.90;
          ctx.strokeStyle = fx.col;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, fx.r ?? 0, a0, a1);
          ctx.stroke();
          ctx.globalAlpha = a * 0.35;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(fx.x, fx.y);
          ctx.lineTo(fx.x + Math.cos(a0) * (fx.r ?? 0), fx.y + Math.sin(a0) * (fx.r ?? 0));
          ctx.moveTo(fx.x, fx.y);
          ctx.lineTo(fx.x + Math.cos(a1) * (fx.r ?? 0), fx.y + Math.sin(a1) * (fx.r ?? 0));
          ctx.stroke();

        } else if (fx.type === 'ring') {
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = fx.col;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r ?? 0, 0, Math.PI * 2); ctx.stroke();

        } else if (fx.type === 'splash') {
          ctx.globalAlpha = a * 0.25;
          ctx.fillStyle = fx.col;
          ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r ?? 0, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = a * 0.8;
          ctx.strokeStyle = fx.col;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r ?? 0, 0, Math.PI * 2); ctx.stroke();

        } else if (fx.type === 'beam') {
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = fx.col;
          ctx.lineWidth = 3 * a + 0.5;
          ctx.beginPath();
          ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.tx!, fx.ty!); ctx.stroke();
          ctx.globalAlpha = a * 0.35;
          ctx.lineWidth = 8 * a;
          ctx.beginPath();
          ctx.moveTo(fx.x, fx.y); ctx.lineTo(fx.tx!, fx.ty!); ctx.stroke();
        }

        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }

      // Attack type label
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = cfg.col;
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const labelMap: Record<AttackStyle, string> = {
        single: '単体', fan: '扇形AOE', circle: '全方位AOE', beam: '貫通ビーム', splash: 'スプラッシュ', chain: 'チェーン',
      };
      ctx.fillText(labelMap[cfg.style], 4, 4);
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tid]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={100}
      className="rounded-xl w-full"
      style={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.06)' }}
    />
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const CompendiumScreen = ({ owned, onBack }: Props) => {
  const [filter, setFilter] = useState<Rarity | 'ALL'>('ALL');
  const [selected, setSelected] = useState<TowerID | null>(null);

  const ownedSet = useMemo(() => new Set(owned), [owned]);

  const grouped = useMemo(() => {
    const all = (Object.keys(TDEFS) as TowerID[]);
    const filtered = filter === 'ALL' ? all : all.filter(id => TDEFS[id].r === filter);
    return RARITY_ORDER
      .map(r => ({ r, items: filtered.filter(id => TDEFS[id].r === r) }))
      .filter(g => g.items.length > 0);
  }, [filter]);

  const totalCount = Object.keys(TDEFS).length;
  const ownedCount = owned.length;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-3 pt-4 pb-20">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, hsl(190 80% 30%), transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="game-btn-ghost text-sm">← 戻る</button>
          <div className="text-xs text-muted-foreground">
            <span className="text-game-gold font-black">{ownedCount}</span> / {totalCount} 体
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="text-xl font-black text-game-blue text-center mb-1">
          📚 家電図鑑
        </motion.h1>
        <p className="text-[10px] text-muted-foreground text-center mb-3">
          全{totalCount}体の家電 / 能力 / アップグレード情報
        </p>

        {/* Filter chips */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-2 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setFilter('ALL')}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
            style={{
              background: filter === 'ALL' ? '#3b82f622' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === 'ALL' ? '#3b82f6' : '#333'}`,
              color: filter === 'ALL' ? '#7dd3fc' : '#888',
            }}>
            ALL
          </button>
          {RARITY_ORDER.map(r => (
            <button key={r}
              onClick={() => setFilter(r)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
              style={{
                background: filter === r ? RARITY_COLOR[r] + '22' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === r ? RARITY_COLOR[r] : '#333'}`,
                color: filter === r ? RARITY_COLOR[r] : '#888',
              }}>
              {r}
            </button>
          ))}
        </div>

        {/* Grouped grid */}
        <div className="space-y-3">
          {grouped.map(({ r, items }) => (
            <div key={r}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black tracking-widest" style={{ color: RARITY_COLOR[r] }}>
                  {r} · {RARITY_LABEL[r]}
                </span>
                <div className="flex-1 h-px" style={{ background: RARITY_COLOR[r] + '44' }} />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {items.map(id => {
                  const def = TDEFS[id];
                  const has = ownedSet.has(id);
                  return (
                    <button key={id}
                      onClick={() => setSelected(id)}
                      className="relative flex flex-col items-center p-2 rounded-lg transition-all active:scale-95"
                      style={{
                        background: has ? RARITY_COLOR[r] + '14' : '#0a0a0a',
                        border: `1px solid ${has ? RARITY_COLOR[r] + '66' : '#222'}`,
                        opacity: has ? 1 : 0.55,
                      }}>
                      <span className="text-2xl mb-0.5" style={{ filter: has ? 'none' : 'grayscale(1) brightness(0.5)' }}>
                        {has ? def.em : '❓'}
                      </span>
                      <span className="text-[8px] font-bold text-foreground/80 truncate w-full text-center">
                        {has ? def.n : '???'}
                      </span>
                      {!has && (
                        <span className="absolute top-0.5 right-0.5 text-[8px] text-muted-foreground">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-4"
              style={{
                background: 'linear-gradient(160deg, hsl(230 25% 8%), hsl(230 30% 5%))',
                border: `2px solid ${RARITY_COLOR[TDEFS[selected].r]}88`,
                boxShadow: `0 0 40px ${RARITY_COLOR[TDEFS[selected].r]}55`,
              }}>
              {(() => {
                const def = TDEFS[selected];
                const ups = UPS[selected];
                const has = ownedSet.has(selected);
                const personality = def.personality && PERSONALITY_BONUS[def.personality];
                return (
                  <>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-4xl"
                        style={{ background: RARITY_COLOR[def.r] + '22', border: `1.5px solid ${RARITY_COLOR[def.r]}` }}>
                        {has ? def.em : '❓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                            style={{ background: RARITY_COLOR[def.r], color: '#000' }}>
                            {def.r}
                          </span>
                          {def.role && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-foreground/70">
                              {def.role}
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-black text-foreground mt-0.5">{has ? def.n : '???'}</h2>
                        <div className="text-[9px] text-muted-foreground mt-0.5">
                          基本コスト: <span className="text-game-gold font-bold">{def.baseCost}V</span>
                          {def.req && <> ・ 依存: <span className="text-game-green">{TDEFS[def.req]?.em} {TDEFS[def.req]?.n}</span></>}
                        </div>
                      </div>
                      <button onClick={() => setSelected(null)} className="text-muted-foreground text-lg leading-none">✕</button>
                    </div>

                    {!has ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">
                        🔒 未取得 — ガチャで入手しよう
                      </div>
                    ) : (
                      <>
                        {/* ── Animated demo canvas ── */}
                        <div className="mb-3">
                          <div className="text-[9px] text-muted-foreground font-bold mb-1 flex items-center gap-1">
                            🎬 <span>攻撃パターンデモ</span>
                            <span className="text-[8px] opacity-40">（アニメーション）</span>
                          </div>
                          <TowerDemoCanvas tid={selected} />
                        </div>

                        {def.quote && (
                          <div className="text-[10px] italic text-foreground/70 mb-2 px-2 py-1.5 rounded"
                            style={{ background: RARITY_COLOR[def.r] + '0d', borderLeft: `2px solid ${RARITY_COLOR[def.r]}` }}>
                            {def.quote}
                          </div>
                        )}

                        {personality && (
                          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded bg-white/5">
                            <span className="text-base">{personality.icon}</span>
                            <div className="flex-1">
                              <div className="text-[9px] text-muted-foreground">性格</div>
                              <div className="text-[11px] font-bold text-foreground">{def.personality}</div>
                            </div>
                            <div className="text-[10px] font-bold text-game-green">{personality.label}</div>
                          </div>
                        )}

                        {/* Special skill */}
                        {def.skillName && (
                          <div className="mb-3 p-2 rounded-lg"
                            style={{ background: '#fbbf2410', border: '1px solid #fbbf2455' }}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] text-game-gold font-black">⚡ 固有スキル</span>
                              <span className="text-[11px] font-black text-yellow-200">{def.skillName}</span>
                            </div>
                            <div className="text-[10px] text-foreground/80 leading-snug">{def.skillDesc}</div>
                          </div>
                        )}

                        {/* 扱い方ガイド */}
                        {TOWER_USAGE[selected] && (
                          <div className="mb-3 p-2 rounded-lg space-y-1.5"
                            style={{ background: '#0ea5e910', border: '1px solid #0ea5e955' }}>
                            <div className="text-[9px] text-game-blue font-black mb-1">📖 扱い方ガイド</div>
                            <UsageRow icon="📍" label="配置" text={TOWER_USAGE[selected].placement} />
                            <UsageRow icon="🔗" label="シナジー" text={TOWER_USAGE[selected].synergy} />
                            <UsageRow icon="💡" label="コツ" text={TOWER_USAGE[selected].tips} />
                          </div>
                        )}

                        {/* Upgrade table */}
                        <div className="mb-2">
                          <div className="text-[10px] text-muted-foreground font-bold mb-1">⬆ アップグレード</div>
                          <div className="space-y-1.5">
                            {ups.map((u, i) => (
                              <div key={i} className="p-2 rounded-md"
                                style={{
                                  background: i === 2 ? RARITY_COLOR[def.r] + '12' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${i === 2 ? RARITY_COLOR[def.r] + '55' : '#222'}`,
                                }}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black px-1 py-px rounded"
                                      style={{ background: i === 2 ? RARITY_COLOR[def.r] : '#333', color: '#000' }}>
                                      Lv{i + 1}
                                    </span>
                                    <span className="text-[11px] font-bold text-foreground">{u.lbl}</span>
                                    {u.abilityUnlock && <span className="text-[9px] text-game-gold">★解放</span>}
                                  </div>
                                  {i > 0 && (
                                    <span className="text-[9px] text-game-gold">+{u.c}V</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-4 gap-1 text-[9px] mb-1">
                                  {u.dmg > 0 && <Stat label="ATK" val={u.dmg} col="#ff7043" />}
                                  {u.rng > 0 && <Stat label="RNG" val={u.rng} col="#7dd3fc" />}
                                  {u.spd > 0 && <Stat label="SPD" val={u.spd} col="#a5d6a7" />}
                                  {u.pg > 0 && <Stat label="⚡+" val={u.pg} col="#fcd34d" />}
                                  {u.pc > 0 && <Stat label="⚡-" val={u.pc} col="#fb7185" />}
                                  {u.bf && <Stat label="バフ" val={`x${u.bf}`} col="#c084fc" />}
                                </div>
                                <div className="text-[10px] text-foreground/70">{u.eff}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Stat = ({ label, val, col }: { label: string; val: number | string; col: string }) => (
  <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-black/30">
    <span className="text-[8px] text-muted-foreground">{label}</span>
    <span className="font-mono font-bold" style={{ color: col }}>{val}</span>
  </div>
);

const UsageRow = ({ icon, label, text }: { icon: string; label: string; text: string }) => (
  <div className="flex gap-1.5">
    <span className="text-[11px] flex-shrink-0">{icon}</span>
    <div className="flex-1">
      <span className="text-[9px] text-game-blue font-bold mr-1">{label}</span>
      <span className="text-[10px] text-foreground/85 leading-snug">{text}</span>
    </div>
  </div>
);

export default CompendiumScreen;
