import { DIFF, TDEFS, WAVES, st } from '@/game/constants';
import { canPlace, calcPowerBalance, getEnabled } from '@/game/logic';
import type { DifficultyKey, GameState, TowerID, UIState } from '@/game/types';

interface HUDProps {
  ui: UIState;
  diff: DifficultyKey;
  grid: GameState['grid'];
  onHome: () => void;
  onStartWave: () => void;
}

const HUD = ({ ui, diff, grid, onHome, onStartWave }: HUDProps) => {
  const dc = DIFF[diff];
  const hpPct = ui.baseHP / ui.maxHP;
  const { net } = calcPowerBalance(grid);

  return (
    <div className="flex gap-1.5 items-center flex-wrap justify-center w-full max-w-[860px]">
      <button onClick={onHome} className="hud-chip cursor-pointer hover:brightness-125">🏠</button>

      <div className="hud-chip" style={{ borderColor: dc.col + '33', color: dc.col }}>
        {dc.em}{dc.label}
      </div>

      {/* HP */}
      <div className="hud-chip">
        ❤️
        <div className="w-12 h-1.5 bg-game-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${hpPct * 100}%`,
              background: hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336',
            }}
          />
        </div>
        <span className="text-[13px]" style={{ color: hpPct <= 0.25 ? '#f44336' : hpPct <= 0.5 ? '#ff9800' : '#ff8a80' }}>
          {ui.baseHP}
        </span>
        <span className="text-muted-foreground text-[9px]">/{ui.maxHP}</span>
      </div>

      {/* Power */}
      <div className="hud-chip" style={{
        borderColor: ui.wActive ? (net >= 0 ? '#1a3a1a' : '#3a2a00') : undefined,
      }}>
        ⚡
        <span className="text-game-gold text-[13px] mx-0.5">{ui.power}W</span>
        {ui.wActive ? (
          <span className="text-[10px]" style={{ color: net >= 0 ? '#69f0ae' : net > -3 ? '#ff9800' : '#f44336' }}>
            {net >= 0 ? `+${net}` : net}/s
          </span>
        ) : (
          <span className="text-[9px] text-muted-foreground">Wave中に増減</span>
        )}
      </div>

      {/* Wave */}
      <div className="hud-chip">
        🌊<span className="text-game-blue">{ui.wave}</span>/{WAVES.length}
      </div>

      {/* Wave button */}
      {!ui.wActive && !ui.over && !ui.win && ui.wave < WAVES.length && (
        <button
          onClick={onStartWave}
          className="hud-chip cursor-pointer font-black"
          style={{
            background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
            color: '#b9f6ca',
            borderColor: '#4caf5055',
            animation: 'green-glow 2s infinite',
          }}
        >
          ▶ Wave {ui.wave + 1}！
        </button>
      )}

      {ui.wActive && (
        <span className="hud-chip text-game-orange animate-pulse" style={{ borderColor: '#ff980044' }}>
          ⚠️ 侵入中！
        </span>
      )}

      {!ui.wActive && ui.wave > 0 && ui.wave < WAVES.length && !ui.over && !ui.win && (
        <span className="text-game-green text-[11px] font-bold">✅ Wave {ui.wave} クリア！</span>
      )}
    </div>
  );
};

export default HUD;
