import { DIFF, TDEFS, WAVES, st } from '@/game/constants';
import { calcPowerBalance } from '@/game/logic';
import type { DifficultyKey, GameState, UIState } from '@/game/types';

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
    <div className="flex gap-1 items-center flex-wrap justify-center px-1.5 py-1">
      <button onClick={onHome} className="hud-chip cursor-pointer text-xs">🏠</button>

      <div className="hud-chip text-[10px]" style={{ borderColor: dc.col + '33', color: dc.col }}>
        {dc.em}{dc.label}
      </div>

      {/* HP */}
      <div className="hud-chip text-[10px]">
        ❤️
        <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${hpPct * 100}%`,
              background: hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336',
            }} />
        </div>
        <span style={{ color: hpPct <= 0.25 ? '#f44336' : '#ff8a80' }}>{ui.baseHP}</span>
      </div>

      {/* Power */}
      <div className="hud-chip text-[10px]">
        ⚡<span className="text-yellow-400 mx-0.5">{ui.power}W</span>
        {ui.wActive && (
          <span style={{ color: net >= 0 ? '#69f0ae' : '#f44336' }}>
            {net >= 0 ? `+${net}` : net}/s
          </span>
        )}
      </div>

      {/* Wave */}
      <div className="hud-chip text-[10px]">
        🌊<span className="text-blue-300">{ui.wave}</span>/{WAVES.length}
      </div>

      {/* Wave button */}
      {!ui.wActive && !ui.over && !ui.win && ui.wave < WAVES.length && (
        <button onClick={onStartWave}
          className="hud-chip cursor-pointer font-black text-[10px]"
          style={{
            background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
            color: '#b9f6ca', borderColor: '#4caf5055',
          }}>
          ▶ Wave{ui.wave + 1}
        </button>
      )}

      {ui.wActive && (
        <span className="hud-chip text-orange-400 animate-pulse text-[10px]">⚠️侵入中</span>
      )}
    </div>
  );
};

export default HUD;
