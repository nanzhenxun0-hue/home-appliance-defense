import { TDEFS, RCOLOR, st } from '@/game/constants';
import { canPlace } from '@/game/logic';
import type { GameState, TowerID } from '@/game/types';

interface ShopProps {
  grid: GameState['grid'];
  power: number;
  placeMode: TowerID | null;
  onSelect: (tid: TowerID | null) => void;
}

const Shop = ({ grid, power, placeMode, onSelect }: ShopProps) => {
  return (
    <div className="flex gap-1 flex-wrap justify-center w-full max-w-[860px]">
      {(Object.entries(TDEFS) as [TowerID, typeof TDEFS[TowerID]][]).map(([id, d]) => {
        const isSel = placeMode === id;
        const canAff = power >= d.baseCost;
        const chainOk = canPlace(id, grid);
        const ok = canAff && chainOk;
        const S = st(id, 0);

        return (
          <div
            key={id}
            onClick={() => ok && onSelect(placeMode === id ? null : id)}
            className={`shop-card ${isSel ? 'shop-card-active' : ''}`}
            style={{
              opacity: ok ? 1 : 0.35,
              cursor: ok ? 'pointer' : 'not-allowed',
              borderColor: isSel ? '#4299e1' : d.rc + '44',
            }}
          >
            <div className="text-xl leading-tight">{d.em}</div>
            <div className="text-[8px] font-black" style={{ color: RCOLOR[d.r] }}>{d.r}</div>
            <div className="text-[9px] font-bold text-foreground/80 mt-0.5">{d.n}</div>
            <div className="text-[11px] text-game-gold font-black">💰{d.baseCost}W</div>
            <div className="text-[8px] mt-0.5 flex gap-1 justify-center flex-wrap">
              {S.rng > 0 && <span className="text-game-blue">📏{S.rng}</span>}
              {S.dmg > 0 && <span className="text-game-gold">⚔{S.dmg}</span>}
              {S.pg > 0 && <span className="text-game-green">+{S.pg}W</span>}
              {S.pc > 0 && <span className="text-game-red">-{S.pc}W</span>}
            </div>
            {d.req && (
              <div className="text-[8px] mt-0.5 font-black" style={{ color: chainOk ? '#ff9800' : '#f44336' }}>
                {chainOk ? `✅要:${TDEFS[d.req].n.slice(0, 4)}` : `🔒要:${TDEFS[d.req].n.slice(0, 4)}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Shop;
