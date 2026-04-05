import { useState, useCallback } from 'react';
import type { TowerID, Rarity, GachaInventory } from '@/game/types';
import { GACHA_COST, GACHA_COST_10, GACHA_RATES, RARITY_ORDER } from '@/game/types';
import { TDEFS } from '@/game/constants';

const STORAGE_KEY = 'kaden-td-gacha';

const DEFAULT_OWNED: TowerID[] = ['cord', 'kettle']; // starter units

const loadInventory = (): GachaInventory => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { owned: [...DEFAULT_OWNED], volts: 300 }; // starter volts
};

const saveInventory = (inv: GachaInventory) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
};

const pickRarity = (): Rarity => {
  let r = Math.random();
  for (const rarity of RARITY_ORDER) {
    r -= GACHA_RATES[rarity];
    if (r <= 0) return rarity;
  }
  return 'C';
};

const towersOfRarity = (rarity: Rarity): TowerID[] =>
  (Object.entries(TDEFS) as [TowerID, typeof TDEFS[TowerID]][])
    .filter(([, d]) => d.r === rarity)
    .map(([id]) => id);

const pullOne = (): TowerID => {
  const rarity = pickRarity();
  const pool = towersOfRarity(rarity);
  return pool[Math.floor(Math.random() * pool.length)];
};

export const useGacha = () => {
  const [inv, setInv] = useState<GachaInventory>(loadInventory);

  const update = useCallback((fn: (prev: GachaInventory) => GachaInventory) => {
    setInv(prev => {
      const next = fn(prev);
      saveInventory(next);
      return next;
    });
  }, []);

  const pull1 = useCallback((): TowerID | null => {
    if (inv.volts < GACHA_COST) return null;
    const tid = pullOne();
    update(prev => ({
      owned: prev.owned.includes(tid) ? prev.owned : [...prev.owned, tid],
      volts: prev.volts - GACHA_COST,
    }));
    return tid;
  }, [inv.volts, update]);

  const pull10 = useCallback((): TowerID[] | null => {
    if (inv.volts < GACHA_COST_10) return null;
    const results: TowerID[] = [];
    for (let i = 0; i < 10; i++) results.push(pullOne());
    update(prev => {
      const newOwned = [...prev.owned];
      for (const tid of results) {
        if (!newOwned.includes(tid)) newOwned.push(tid);
      }
      return { owned: newOwned, volts: prev.volts - GACHA_COST_10 };
    });
    return results;
  }, [inv.volts, update]);

  const addVolts = useCallback((amount: number) => {
    update(prev => ({ ...prev, volts: prev.volts + amount }));
  }, [update]);

  const resetGacha = useCallback(() => {
    const fresh = { owned: [...DEFAULT_OWNED], volts: 300 };
    saveInventory(fresh);
    setInv(fresh);
  }, []);

  return { inv, pull1, pull10, addVolts, resetGacha };
};
