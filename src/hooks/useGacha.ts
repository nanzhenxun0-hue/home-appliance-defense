import { useState, useCallback } from 'react';
import type { TowerID, Rarity, GachaInventory } from '@/game/types';
import { GACHA_COST, GACHA_COST_10, GACHA_RATES, RARITY_ORDER } from '@/game/types';
import { TDEFS } from '@/game/constants';

const STORAGE_KEY = 'kaden-td-gacha';

const DEFAULT_OWNED: TowerID[] = ['cord', 'kettle']; // starter units

// Pity: guaranteed high rarity at certain pull counts
const PITY_SOFT = 50;  // soft pity starts (increased OD rate)
const PITY_HARD = 80;  // guaranteed OD
const PICKUP_RATE = 0.5; // 50% chance the OD/G is the pickup unit

export interface GachaState extends GachaInventory {
  pity: number;          // pulls since last OD
  totalPulls: number;
  pickup: TowerID | null; // current pickup unit
  pickupBanner: string;
}

const loadInventory = (): GachaState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owned: parsed.owned || [...DEFAULT_OWNED],
        volts: parsed.volts ?? 300,
        pity: parsed.pity ?? 0,
        totalPulls: parsed.totalPulls ?? 0,
        pickup: parsed.pickup ?? 'plasma',
        pickupBanner: parsed.pickupBanner ?? 'プラズマキャノン ピックアップ',
      };
    }
  } catch {}
  return { owned: [...DEFAULT_OWNED], volts: 300, pity: 0, totalPulls: 0, pickup: 'plasma', pickupBanner: 'プラズマキャノン ピックアップ' };
};

const saveInventory = (inv: GachaState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
};

const towersOfRarity = (rarity: Rarity): TowerID[] =>
  (Object.entries(TDEFS) as [TowerID, typeof TDEFS[TowerID]][])
    .filter(([, d]) => d.r === rarity)
    .map(([id]) => id);

const pickRarity = (pity: number): Rarity => {
  // Hard pity
  if (pity >= PITY_HARD) return 'OD';

  // Soft pity: increase OD rate linearly from 1% to ~30%
  let odRate = GACHA_RATES['OD'];
  if (pity >= PITY_SOFT) {
    odRate += (pity - PITY_SOFT) / (PITY_HARD - PITY_SOFT) * 0.29;
  }

  let r = Math.random();
  // OD first (boosted)
  r -= odRate;
  if (r <= 0) return 'OD';
  // Then other rarities (adjusted)
  const others: Rarity[] = ['G', 'M', 'L', 'E', 'R', 'U', 'C'];
  for (const rarity of others) {
    r -= GACHA_RATES[rarity];
    if (r <= 0) return rarity;
  }
  return 'C';
};

const pullOne = (pity: number, pickup: TowerID | null): { tid: TowerID; rarity: Rarity } => {
  const rarity = pickRarity(pity);
  const pool = towersOfRarity(rarity);

  // Pickup: 50% chance to get pickup unit if rarity matches
  if (pickup && (rarity === 'OD' || rarity === 'G')) {
    const pickupDef = TDEFS[pickup];
    if (pickupDef && pickupDef.r === rarity && Math.random() < PICKUP_RATE) {
      return { tid: pickup, rarity };
    }
  }

  const tid = pool[Math.floor(Math.random() * pool.length)];
  return { tid, rarity };
};

export const useGacha = () => {
  const [inv, setInv] = useState<GachaState>(loadInventory);

  const update = useCallback((fn: (prev: GachaState) => GachaState) => {
    setInv(prev => {
      const next = fn(prev);
      saveInventory(next);
      return next;
    });
  }, []);

  const pull1 = useCallback((): TowerID | null => {
    if (inv.volts < GACHA_COST) return null;
    const { tid, rarity } = pullOne(inv.pity, inv.pickup);
    update(prev => ({
      ...prev,
      owned: prev.owned.includes(tid) ? prev.owned : [...prev.owned, tid],
      volts: prev.volts - GACHA_COST,
      pity: rarity === 'OD' ? 0 : prev.pity + 1,
      totalPulls: prev.totalPulls + 1,
    }));
    return tid;
  }, [inv.volts, inv.pity, inv.pickup, update]);

  const pull10 = useCallback((): TowerID[] | null => {
    if (inv.volts < GACHA_COST_10) return null;
    const results: TowerID[] = [];
    let tempPity = inv.pity;
    for (let i = 0; i < 10; i++) {
      const { tid, rarity } = pullOne(tempPity, inv.pickup);
      results.push(tid);
      tempPity = rarity === 'OD' ? 0 : tempPity + 1;
    }
    update(prev => {
      const newOwned = [...prev.owned];
      for (const tid of results) {
        if (!newOwned.includes(tid)) newOwned.push(tid);
      }
      return {
        ...prev,
        owned: newOwned,
        volts: prev.volts - GACHA_COST_10,
        pity: tempPity,
        totalPulls: prev.totalPulls + 10,
      };
    });
    return results;
  }, [inv.volts, inv.pity, inv.pickup, update]);

  const addVolts = useCallback((amount: number) => {
    update(prev => ({ ...prev, volts: prev.volts + amount }));
  }, [update]);

  const resetGacha = useCallback(() => {
    const fresh: GachaState = { owned: [...DEFAULT_OWNED], volts: 300, pity: 0, totalPulls: 0, pickup: 'plasma', pickupBanner: 'プラズマキャノン ピックアップ' };
    saveInventory(fresh);
    setInv(fresh);
  }, []);

  return { inv, pull1, pull10, addVolts, resetGacha };
};
