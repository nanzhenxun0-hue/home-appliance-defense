import { motion } from 'framer-motion';
import type { TowerID } from '@/game/types';
import { RARITY_COLOR, RARITY_ORDER } from '@/game/types';
import { TDEFS, st } from '@/game/constants';
import { getActiveSynergies, SYNERGIES } from '@/game/synergy';
import CharIcon from '@/components/CharIcon';

interface TeamScreenProps {
  owned: TowerID[];
  counts?: Partial<Record<TowerID, number>>;
  team: TowerID[];
  maxTeam: number;
  onToggle: (tid: TowerID) => void;
  onStart: () => void;
  onBack: () => void;
  isAdmin?: boolean;
}

const ALL_TOWER_IDS = Object.keys(TDEFS) as import('@/game/types').TowerID[];

const TeamScreen = ({ owned, counts = {}, team, maxTeam, onToggle, onStart, onBack, isAdmin = false }: TeamScreenProps) => {
  const displayList = isAdmin
    ? [...ALL_TOWER_IDS].sort((a, b) => RARITY_ORDER.indexOf(TDEFS[a].r) - RARITY_ORDER.indexOf(TDEFS[b].r))
    : [...owned].sort((a, b) => RARITY_ORDER.indexOf(TDEFS[a].r) - RARITY_ORDER.indexOf(TDEFS[b].r));
  const sortedOwned = displayList;

  const activeSynergies = getActiveSynergies(team);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col p-2.5 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-15"
        style={{ background: 'radial-gradient(ellipse at 50% 80%, hsl(210 80% 25%), transparent 70%)' }} />

      <div className="relative z-10 flex flex-col gap-2 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="game-btn-ghost text-sm">← 戻る</button>
          <h1 className="text-lg font-black text-blue-300">🎮 編成</h1>
          <span className="text-xs text-muted-foreground">{team.length}/{maxTeam}</span>
        </div>
        {isAdmin && (
          <div className="rounded-lg px-3 py-1.5 text-[10px] font-bold text-center"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid #d9770666', color: '#fcd34d' }}>
            🛡️ 管理者モード — 全{ALL_TOWER_IDS.length}ユニット選択可能
          </div>
        )}

        {/* Current team */}
        <div className="glass-panel p-2 rounded-xl">
          <div className="text-[10px] text-muted-foreground mb-1 font-bold">出撃チーム（最大{maxTeam}体）</div>
          <div className="grid grid-cols-7 gap-1 min-h-[46px]">
            {Array.from({ length: maxTeam }).map((_, i) => {
              const tid = team[i];
              if (tid) {
                const def = TDEFS[tid];
                return (
                  <motion.button key={`slot-${i}`} layoutId={`team-${tid}`}
                    onClick={() => onToggle(tid)}
                    className="flex flex-col items-center justify-center p-0.5 rounded-lg min-h-[46px]"
                    style={{
                      background: RARITY_COLOR[def.r] + '20',
                      border: `2px solid ${RARITY_COLOR[def.r]}66`,
                      boxShadow: `0 0 8px ${RARITY_COLOR[def.r]}33`,
                    }}>
                    <span className="text-xl leading-none">{def.em}</span>
                    <span className="text-[7px] font-black" style={{ color: RARITY_COLOR[def.r] }}>{def.r}</span>
                    <span className="text-[7px] text-foreground/60 leading-none">{def.n.slice(0, 3)}</span>
                  </motion.button>
                );
              }
              return (
                <div key={`slot-${i}`} className="min-h-[46px] rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <span className="text-muted-foreground/30 text-[9px]">空</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Synergies */}
        {activeSynergies.length > 0 && (
          <div className="glass-panel p-2 rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-game-gold mb-1">🔗 発動中シナジー</div>
            {activeSynergies.map(syn => (
              <motion.div key={syn.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-game-gold/5 border border-game-gold/20">
                <span className="text-xs font-bold text-game-gold">{syn.name}</span>
                <span className="text-[9px] text-foreground/70 flex-1">{syn.desc}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Potential Synergies */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground text-[10px]">全シナジー一覧</summary>
          <div className="mt-1 space-y-1">
            {SYNERGIES.map(syn => {
              const active = activeSynergies.some(a => a.id === syn.id);
              const count = syn.members.filter(m => team.includes(m)).length;
              return (
                <div key={syn.id} className="flex items-center gap-2 px-2 py-1 rounded"
                  style={{ background: active ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)', opacity: active ? 1 : 0.6 }}>
                  <span className="text-[10px] font-bold">{syn.name}</span>
                  <span className="text-[9px] text-foreground/50 flex-1">{syn.desc}</span>
                  <span className="text-[9px] font-mono" style={{ color: active ? '#ffd700' : '#666' }}>
                    {count}/{syn.minCount}
                  </span>
                </div>
              );
            })}
          </div>
        </details>

        {/* Start button */}
        <button onClick={onStart} disabled={team.length === 0}
          className="game-btn-primary w-full py-2 text-base font-black disabled:opacity-30"
          style={{ animation: team.length > 0 ? 'glow-pulse 2.5s infinite' : 'none' }}>
          ▶ 出撃！
          {activeSynergies.length > 0 && <span className="text-xs ml-2 text-game-gold">🔗×{activeSynergies.length}</span>}
        </button>

        {/* Unit list by rarity */}
        <div className="flex-1 overflow-hidden pb-1">
          <div className="grid grid-cols-5 gap-1">
                {sortedOwned.map(tid => {
                  const def = TDEFS[tid];
                  const inTeam = team.includes(tid);
                  const S = st(tid, 0);
                  const canAdd = inTeam || team.length < maxTeam;
                  // Check if this unit is part of any potential synergy with current team
                  const hasSynergyPotential = !inTeam && SYNERGIES.some(syn =>
                    syn.members.includes(tid) &&
                    syn.members.filter(m => team.includes(m)).length >= syn.minCount - 1
                  );

                  return (
                    <motion.button key={tid} onClick={() => canAdd && onToggle(tid)}
                      className="flex flex-col items-center justify-center p-0.5 rounded-lg transition-all relative min-h-[44px]"
                      style={{
                        background: inTeam ? RARITY_COLOR[def.r] + '20' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${inTeam ? RARITY_COLOR[def.r] + '88' : hasSynergyPotential ? '#ffd70055' : RARITY_COLOR[def.r] + '22'}`,
                        opacity: canAdd ? 1 : 0.4,
                      }}
                      whileTap={{ scale: 0.95 }}>
                      {hasSynergyPotential && (
                        <span className="absolute top-0.5 right-0.5 text-[7px] text-game-gold">🔗</span>
                      )}
                      <span className="text-lg leading-none">{def.em}</span>
                      <span className="text-[8px] font-bold text-foreground/80 truncate w-full text-center leading-none">{def.n}</span>
                      <div className="flex gap-0.5 text-[6px] mt-0.5 flex-wrap justify-center leading-none">
                        {S.dmg > 0 && <span className="text-yellow-400">⚔{S.dmg}</span>}
                        {S.rng > 0 && <span className="text-blue-300">📏{S.rng}</span>}
                        {S.pg > 0 && <span className="text-green-400">+{S.pg}W</span>}
                        {S.pc > 0 && <span className="text-red-400">-{S.pc}W</span>}
                      </div>
                      <span className="text-[7px] text-yellow-400 font-bold leading-none">{def.baseCost}W</span>
                      {(counts[tid] ?? 1) > 1 && (
                        <span className="absolute top-0.5 left-0.5 text-[8px] font-black text-pink-300 bg-black/60 px-1 rounded">×{counts[tid]}</span>
                      )}
                      {inTeam && <span className="absolute bottom-0.5 right-0.5 text-[7px] text-green-400 font-bold">✅</span>}
                    </motion.button>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamScreen;
