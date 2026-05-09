import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EDEFS } from '@/game/constants';
import type { EnemyType } from '@/game/types';

interface EnemyCompendiumScreenProps {
  onBack: () => void;
}

const ENEMY_ORDER: EnemyType[] = [
  'dust', 'fast_dust', 'slime', 'tank_slime', 'magnet', 'virus',
  'cockroach', 'mold', 'surge', 'dust_lord', 'boss', 'boss_ice', 'boss_fire', 'boss_massetsu', 'final_boss',
];

const ENEMY_GROUPS = [
  { id: 'mob', label: '通常敵', items: ENEMY_ORDER.slice(0, 10) },
  { id: 'boss', label: 'ボス', items: ENEMY_ORDER.slice(10) },
];

const EnemyCompendiumScreen = ({ onBack }: EnemyCompendiumScreenProps) => {
  const [selected, setSelected] = useState<EnemyType | null>(null);
  const totalHp = useMemo(() => ENEMY_ORDER.reduce((sum, id) => sum + EDEFS[id].hp, 0), []);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-3 pt-4 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, hsl(var(--destructive) / 0.35), transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="game-btn-ghost text-sm">← 戻る</button>
          <div className="text-xs text-muted-foreground">
            <span className="text-game-red font-black">{ENEMY_ORDER.length}</span> 体 / HP合計 {totalHp}
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="text-xl font-black text-game-red text-center mb-1">
          👹 敵キャラ図鑑
        </motion.h1>
        <p className="text-[10px] text-muted-foreground text-center mb-3">
          能力 / 弱点 / 対処メモ
        </p>

        <div className="space-y-4">
          {ENEMY_GROUPS.map(group => (
            <section key={group.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black tracking-widest text-game-red">{group.label}</span>
                <div className="flex-1 h-px bg-game-red/30" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {group.items.map(id => {
                  const def = EDEFS[id];
                  return (
                    <button key={id}
                      onClick={() => setSelected(id)}
                      className="relative flex flex-col items-center p-2 rounded-lg transition-all active:scale-95 bg-card/80 border border-border">
                      <span className="text-2xl mb-0.5 drop-shadow-[0_0_8px_hsl(var(--destructive)/0.35)]">{def.em}</span>
                      <span className="text-[8px] font-bold text-foreground/85 truncate w-full text-center">{def.name}</span>
                      <span className="text-[7px] text-muted-foreground">HP {def.hp}</span>
                      {def.special || def.bossAbility ? <span className="absolute top-0.5 right-0.5 text-[8px] text-game-gold">★</span> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

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
              className="w-full max-w-md max-h-[86vh] overflow-y-auto rounded-2xl p-4 bg-card border border-game-red/40 shadow-2xl">
              {(() => {
                const def = EDEFS[selected];
                return (
                  <>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl bg-destructive/10 border border-game-red/50">
                        {def.em}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {def.role && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-game-red/10 text-game-red">{def.role}</span>}
                          {(def.special || def.bossAbility) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-game-gold/10 text-game-gold">特殊</span>}
                        </div>
                        <h2 className="text-base font-black text-foreground mt-1">{def.name}</h2>
                        <div className="text-[9px] text-muted-foreground mt-0.5">報酬 {def.rew}V ・ 接触DMG {def.dmg}</div>
                      </div>
                      <button onClick={() => setSelected(null)} className="text-muted-foreground text-lg leading-none">✕</button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      <EnemyStat label="HP" val={def.hp} />
                      <EnemyStat label="SPD" val={def.spd} />
                      <EnemyStat label="REW" val={def.rew} />
                    </div>

                    {def.skillName && (
                      <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-game-red/40">
                        <div className="text-[9px] text-game-red font-black mb-0.5">固有能力</div>
                        <div className="text-[12px] font-black text-foreground">{def.skillName}</div>
                        <div className="text-[10px] text-foreground/75 leading-snug mt-1">{def.skillDesc}</div>
                      </div>
                    )}

                    {def.guide && (
                      <div className="p-2 rounded-lg bg-game-blue/10 border border-game-blue/40">
                        <div className="text-[9px] text-game-blue font-black mb-0.5">対処メモ</div>
                        <div className="text-[10px] text-foreground/85 leading-snug">{def.guide}</div>
                      </div>
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

const EnemyStat = ({ label, val }: { label: string; val: number }) => (
  <div className="rounded-md bg-muted/40 border border-border px-2 py-1 text-center">
    <div className="text-[8px] text-muted-foreground font-bold">{label}</div>
    <div className="text-[12px] text-foreground font-mono font-black">{val}</div>
  </div>
);

export default EnemyCompendiumScreen;