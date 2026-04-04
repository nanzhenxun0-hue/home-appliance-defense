import { TDEFS, RCOLOR, st } from '@/game/constants';
import { canPlace } from '@/game/logic';
import type { GameState, TowerID } from '@/game/types';
import towerCordImg from '@/assets/tower-cord.png';
import towerKettleImg from '@/assets/tower-kettle.png';
import towerFanImg from '@/assets/tower-fan.png';
import towerVacuumImg from '@/assets/tower-vacuum.png';
import towerRouterImg from '@/assets/tower-router.png';
import towerFridgeImg from '@/assets/tower-fridge.png';

const TOWER_IMGS: Record<TowerID, string> = {
  cord: towerCordImg,
  kettle: towerKettleImg,
  fan: towerFanImg,
  vacuum: towerVacuumImg,
  router: towerRouterImg,
  fridge: towerFridgeImg,
};

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
              borderColor: isSel ? '#a855f7' : d.rc + '33',
            }}
          >
            <img
              src={TOWER_IMGS[id]}
              alt={d.n}
              width={36}
              height={36}
              loading="lazy"
              className="mx-auto"
              style={{ filter: ok ? 'drop-shadow(0 0 4px ' + d.rc + '66)' : 'grayscale(1)' }}
            />
            <div className="text-[8px] font-black" style={{ color: RCOLOR[d.r] }}>{d.r}</div>
            <div className="text-[9px] font-bold text-foreground/80 mt-0.5 sf-title">{d.n}</div>
            <div className="text-[11px] text-game-gold font-black">💰{d.baseCost}W</div>
            <div className="text-[8px] mt-0.5 flex gap-1 justify-center flex-wrap">
              {S.rng > 0 && <span className="text-game-blue">📏{S.rng}</span>}
              {S.dmg > 0 && <span className="text-game-gold">⚔{S.dmg}</span>}
              {S.pg > 0 && <span className="text-game-green">+{S.pg}W</span>}
              {S.pc > 0 && <span className="text-game-red">-{S.pc}W</span>}
            </div>
            {d.req && (
              <div className="text-[8px] mt-0.5 font-black" style={{ color: chainOk ? '#f97316' : '#ef4444' }}>
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
