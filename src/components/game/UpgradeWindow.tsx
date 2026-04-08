import { motion, AnimatePresence } from 'framer-motion';
import { TDEFS, UPS, st, sellVal, RCOLOR } from '@/game/constants';
import { RARITY_COLOR } from '@/game/types';
import { getEnabled } from '@/game/logic';
import type { GameState } from '@/game/types';

interface UpgradeWindowProps {
  cellKey: string | null;
  grid: GameState['grid'];
  power: number;
  onUpgrade: () => void;
  onSell: () => void;
  onClose: () => void;
}

const UpgradeWindow = ({ cellKey, grid, power, onUpgrade, onSell, onClose }: UpgradeWindowProps) => {
  const cell = cellKey ? grid[cellKey] : null;
  if (!cell) return null;

  const { tid, lv } = cell;
  const def = TDEFS[tid];
  const S = st(tid, lv);
  const maxed = lv >= UPS[tid].length - 1;
  const nextS = maxed ? null : st(tid, lv + 1);
  const sv = sellVal(tid, lv);
  const canUp = !maxed && power >= (nextS?.c || 0);
  const en = getEnabled(grid);
  const isOn = cellKey ? en.has(cellKey) : false;

  const stats = [
    S.dmg > 0 && { icon: '⚔️', label: 'ATK', val: S.dmg, next: nextS && nextS.dmg !== S.dmg ? nextS.dmg : null },
    S.rng > 0 && { icon: '📏', label: 'RNG', val: S.rng, next: nextS && nextS.rng !== S.rng ? nextS.rng : null },
    S.spd > 0 && { icon: '⚡', label: 'SPD', val: S.spd, next: nextS && nextS.spd !== S.spd ? nextS.spd : null },
    S.pg > 0 && { icon: '🔋', label: 'GEN', val: `+${S.pg}W`, next: nextS && nextS.pg !== S.pg ? `+${nextS.pg}W` : null },
    S.pc > 0 && { icon: '💸', label: 'USE', val: `-${S.pc}W`, next: nextS && nextS.pc !== S.pc ? `-${nextS.pc}W` : null },
    S.bf && { icon: '📡', label: 'BUFF', val: `+${Math.round((S.bf - 1) * 100)}%`, next: nextS?.bf ? `+${Math.round((nextS.bf - 1) * 100)}%` : null },
  ].filter(Boolean) as { icon: string; label: string; val: string | number; next: string | number | null }[];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Window */}
        <motion.div
          initial={{ scale: 0.8, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 30 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-[320px] rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${def.rc}15 0%, hsl(230 20% 7%) 30%)`,
            border: `2px solid ${def.rc}44`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${def.rc}22`,
          }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ background: `${def.rc}20`, border: `2px solid ${def.rc}55` }}>
              {def.em}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm" style={{ color: def.rc }}>{S.lbl}</span>
                <span className="game-badge text-[8px]" style={{ borderColor: RCOLOR[def.r] + '55', color: RCOLOR[def.r] }}>{def.r}</span>
              </div>
              {!isOn && (
                <span className="text-[9px] text-game-red">💤 依存元なし - 停止中</span>
              )}
              {/* Level bar */}
              <div className="flex gap-1 items-center mt-1.5">
                {UPS[tid].map((u, i) => (
                  <div key={i} className="flex-1 h-2 rounded-full relative overflow-hidden"
                    style={{
                      background: i <= lv ? def.rc : '#2a2a2a',
                      border: `1px solid ${i <= lv ? def.rc : '#333'}`,
                      boxShadow: i <= lv ? `0 0 6px ${def.rc}55` : 'none',
                    }}>
                    {i === 2 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[6px]">★</span>
                    )}
                  </div>
                ))}
                <span className="text-[9px] text-muted-foreground ml-1">Lv{lv + 1}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
              ✕
            </button>
          </div>

          {/* Effect description */}
          <div className="px-4 pb-2">
            <div className="text-[10px] px-2 py-1 rounded-lg inline-block"
              style={{ background: `${def.rc}15`, color: def.rc, border: `1px solid ${def.rc}33` }}>
              {S.eff}
            </div>
            {def.ability && lv >= 2 && (
              <div className="text-[9px] text-game-gold mt-1">
                ★ 特殊能力発動中！
              </div>
            )}
            {def.ability && lv < 2 && (
              <div className="text-[9px] text-muted-foreground mt-1">
                🔒 Lv3で特殊能力解放
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-1.5">
              {stats.map((s, i) => (
                <div key={i} className="bg-muted/20 rounded-lg px-2 py-1.5 text-center">
                  <div className="text-[9px] text-muted-foreground">{s.icon} {s.label}</div>
                  <div className="text-sm font-bold text-foreground/90">{s.val}</div>
                  {s.next !== null && (
                    <div className="text-[9px] text-game-green font-bold">→{s.next}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 flex gap-2">
            {!maxed ? (
              <button
                onClick={onUpgrade}
                disabled={!canUp}
                className="flex-[2] py-3 rounded-xl border-none font-black text-sm transition-all duration-150"
                style={{
                  cursor: canUp ? 'pointer' : 'not-allowed',
                  background: canUp ? `linear-gradient(135deg, ${def.rc}dd, ${def.rc}88)` : '#1a1a1a',
                  color: canUp ? '#fff' : '#555',
                  boxShadow: canUp ? `0 0 20px ${def.rc}44` : 'none',
                }}
              >
                {canUp ? (
                  <>▲ 強化 <span className="text-xs opacity-80">({nextS!.c}W)</span></>
                ) : (
                  <>{nextS!.c}W 必要</>
                )}
              </button>
            ) : (
              <div className="flex-[2] py-3 rounded-xl text-game-gold text-sm font-black text-center border border-game-gold/20 bg-game-surface flex items-center justify-center gap-1">
                ✨ MAX
              </div>
            )}
            <button
              onClick={onSell}
              className="flex-1 py-3 rounded-xl cursor-pointer font-bold text-xs transition-all duration-150 border hover:brightness-125"
              style={{
                borderColor: '#f4433644',
                background: '#180808',
                color: '#ef9a9a',
              }}
            >
              💰 売却<br /><span className="text-[10px] opacity-70">+{sv}W</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeWindow;
