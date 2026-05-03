import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TDEFS, UPS } from '@/game/constants';
import { TOWER_USAGE } from '@/game/towerUsage';
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER, PERSONALITY_BONUS, type TowerID, type Rarity } from '@/game/types';

interface Props {
  owned: TowerID[];
  onBack: () => void;
}

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
              className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl p-4"
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

export default CompendiumScreen;
