import { TDEFS, UPS, st, sellVal, RCOLOR } from '@/game/constants';
import { RARITY_COLOR } from '@/game/types';
import { getEnabled } from '@/game/logic';
import type { GameState } from '@/game/types';

interface InspectPanelProps {
  cellKey: string | null;
  grid: GameState['grid'];
  power: number;
  onUpgrade: () => void;
  onSell: () => void;
  onClose: () => void;
}

const InspectPanel = ({ cellKey, grid, power, onUpgrade, onSell, onClose }: InspectPanelProps) => {
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
    S.dmg > 0 && ['⚔️', `${S.dmg}`, nextS && nextS.dmg !== S.dmg ? `→${nextS.dmg}` : ''],
    S.rng > 0 && ['📏', `${S.rng}`, nextS && nextS.rng !== S.rng ? `→${nextS.rng}` : ''],
    S.spd > 0 && ['⚡', `${S.spd}/s`, nextS && nextS.spd !== S.spd ? `→${nextS.spd}/s` : ''],
    S.pg > 0 && ['🔋', `+${S.pg}W`, nextS && nextS.pg !== S.pg ? `→+${nextS.pg}W` : ''],
    S.pc > 0 && ['💸', `-${S.pc}W`, nextS && nextS.pc !== S.pc ? `→-${nextS.pc}W` : ''],
    S.bf && ['📡', `+${Math.round((S.bf - 1) * 100)}%`, nextS?.bf ? `→+${Math.round((nextS.bf - 1) * 100)}%` : ''],
  ].filter(Boolean) as [string, string, string][];

  return (
    <div className="glass-panel-strong p-4 rounded-t-xl rounded-b-none" style={{ boxShadow: `0 -8px 32px rgba(0,0,0,0.8), 0 0 20px ${def.rc}11` }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{def.em}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black" style={{ color: def.rc }}>{S.lbl}</span>
            <span className="game-badge" style={{ borderColor: RCOLOR[def.r] + '55', color: RCOLOR[def.r] }}>{def.r}</span>
            {!isOn && (
              <span className="game-badge text-game-red" style={{ borderColor: '#f4433633' }}>💤 停止中</span>
            )}
          </div>
          {/* Level dots */}
          <div className="flex gap-1 items-center mt-1">
            {UPS[tid].map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: 22,
                  background: i <= lv ? def.rc : '#2a2a2a',
                  border: `1px solid ${i <= lv ? def.rc : '#333'}`,
                }}
              />
            ))}
            <span className="text-muted-foreground text-[9px] ml-1">Lv{lv + 1}/{UPS[tid].length}</span>
          </div>
        </div>
        <button onClick={onClose} className="game-btn-ghost w-7 h-7 p-0 flex items-center justify-center text-sm flex-shrink-0">
          ✕
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {stats.map(([icon, val, nxt], i) => (
          <div key={i} className="bg-game-surface/50 rounded-lg px-2.5 py-1 text-[11px] flex flex-col items-center gap-0.5">
            <span className="text-muted-foreground text-[9px]">{icon}</span>
            <span className="text-foreground/90">{val}</span>
            {nxt && <span className="text-game-green text-[9px]">{nxt}</span>}
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {!maxed ? (
          <button
            onClick={onUpgrade}
            disabled={!canUp}
            className="flex-[2] py-2.5 rounded-lg border-none font-black text-xs transition-all duration-150"
            style={{
              cursor: canUp ? 'pointer' : 'not-allowed',
              background: canUp ? `linear-gradient(90deg, ${def.rc}dd, ${def.rc}88)` : '#1a1a1a',
              color: canUp ? '#fff' : '#444',
              boxShadow: canUp ? `0 0 14px ${def.rc}55` : 'none',
            }}
          >
            {canUp ? `▲ ${nextS!.lbl}に強化 (${nextS!.c}W)` : `強化には${nextS!.c}W必要`}
          </button>
        ) : (
          <div className="flex-[2] py-2.5 rounded-lg text-game-gold text-xs font-black text-center border border-game-gold/20 bg-game-surface">
            ✨ MAXレベル！
          </div>
        )}
        <button
          onClick={onSell}
          className="flex-1 py-2.5 rounded-lg cursor-pointer font-bold text-xs text-center transition-all duration-150 border hover:brightness-125"
          style={{
            borderColor: '#f4433644',
            background: '#160808',
            color: '#ef9a9a',
          }}
        >
          💰 売却<br /><span className="text-[10px]" style={{ color: '#c88' }}>+{sv}W</span>
        </button>
      </div>
    </div>
  );
};

export default InspectPanel;
