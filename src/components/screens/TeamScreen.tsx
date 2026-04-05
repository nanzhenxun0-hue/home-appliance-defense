import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TowerID } from '@/game/types';
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER } from '@/game/types';
import { TDEFS, st } from '@/game/constants';
import { ABILITIES } from '@/game/abilities';
import { getTowerSprite } from '@/game/sprites';

interface TeamScreenProps {
  owned: TowerID[];
  team: TowerID[];
  maxTeam: number;
  onToggle: (tid: TowerID) => void;
  onStart: () => void;
  onBack: () => void;
}

const SpriteIcon = ({ tid, size = 40 }: { tid: TowerID; size?: number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const sprite = getTowerSprite(tid);
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, 0, 0, size, size);
    };
    if (sprite.complete) draw();
    else sprite.onload = draw;
  }, [tid, size]);
  return <canvas ref={ref} width={size} height={size} className="block" style={{ imageRendering: 'pixelated' }} />;
};

const TeamScreen = ({ owned, team, maxTeam, onToggle, onStart, onBack }: TeamScreenProps) => {
  const grouped = RARITY_ORDER.map(r => ({
    rarity: r,
    units: owned.filter(tid => TDEFS[tid].r === r),
  })).filter(g => g.units.length > 0);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-15"
        style={{ background: 'radial-gradient(ellipse at 50% 80%, hsl(210 80% 25%), transparent 70%)' }} />

      <div className="relative z-10 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="game-btn-ghost text-sm">← 戻る</button>
          <h1 className="text-lg font-black text-blue-300">🎮 編成</h1>
          <span className="text-xs text-muted-foreground">{team.length}/{maxTeam}</span>
        </div>

        {/* Current team */}
        <div className="glass-panel p-3 rounded-xl">
          <div className="text-xs text-muted-foreground mb-2 font-bold">出撃チーム（最大{maxTeam}体）</div>
          <div className="flex gap-2 justify-center min-h-[72px]">
            {Array.from({ length: maxTeam }).map((_, i) => {
              const tid = team[i];
              if (tid) {
                const def = TDEFS[tid];
                return (
                  <motion.button
                    key={`slot-${i}`}
                    layoutId={`team-${tid}`}
                    onClick={() => onToggle(tid)}
                    className="flex flex-col items-center p-1.5 rounded-lg w-14"
                    style={{
                      background: RARITY_COLOR[def.r] + '20',
                      border: `2px solid ${RARITY_COLOR[def.r]}66`,
                      boxShadow: `0 0 8px ${RARITY_COLOR[def.r]}33`,
                    }}
                  >
                    <SpriteIcon tid={tid} size={32} />
                    <span className="text-[7px] font-black" style={{ color: RARITY_COLOR[def.r] }}>{def.r}</span>
                    <span className="text-[8px] text-foreground/60">{def.n.slice(0, 3)}</span>
                  </motion.button>
                );
              }
              return (
                <div key={`slot-${i}`}
                  className="w-14 h-[72px] rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <span className="text-muted-foreground/30 text-xs">空</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={team.length === 0}
          className="game-btn-primary w-full py-3 text-lg font-black disabled:opacity-30"
          style={{ animation: team.length > 0 ? 'glow-pulse 2.5s infinite' : 'none' }}
        >
          ▶ 出撃！
        </button>

        {/* Unit list by rarity */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {grouped.map(({ rarity, units }) => (
            <div key={rarity}>
              <div className="text-[10px] font-black mb-1 flex items-center gap-1" style={{ color: RARITY_COLOR[rarity] }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: RARITY_COLOR[rarity] }} />
                {RARITY_LABEL[rarity]}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {units.map(tid => {
                  const def = TDEFS[tid];
                  const inTeam = team.includes(tid);
                  const S = st(tid, 0);
                  const canAdd = inTeam || team.length < maxTeam;
                  const ability = ABILITIES[tid];

                  return (
                    <motion.button
                      key={tid}
                      onClick={() => canAdd && onToggle(tid)}
                      className="flex items-center gap-2 p-2 rounded-lg transition-all text-left"
                      style={{
                        background: inTeam ? RARITY_COLOR[def.r] + '20' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${inTeam ? RARITY_COLOR[def.r] + '88' : RARITY_COLOR[def.r] + '22'}`,
                        opacity: canAdd ? 1 : 0.4,
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <SpriteIcon tid={tid} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold text-foreground/80 truncate">{def.n}</div>
                        <div className="flex gap-1 text-[8px] flex-wrap">
                          {S.dmg > 0 && <span className="text-yellow-400">⚔{S.dmg}</span>}
                          {S.pg > 0 && <span className="text-green-400">+{S.pg}W</span>}
                          <span className="text-yellow-400">{def.baseCost}W</span>
                        </div>
                        <div className="text-[7px] text-purple-300 truncate">{ability.icon} {ability.name}</div>
                        {inTeam && <span className="text-[7px] text-green-400 font-bold">✅</span>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamScreen;
