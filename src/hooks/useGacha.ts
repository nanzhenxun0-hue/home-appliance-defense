import { useState, useCallback } from 'react';
import type { TowerID, Rarity, GachaInventory, GachaBannerType } from '@/game/types';
import { GACHA_RATES, RARITY_ORDER, GACHA_BANNERS } from '@/game/types';
import { TDEFS } from '@/game/constants';

const STORAGE_KEY = 'kaden-td-gacha';
const DEFAULT_OWNED: TowerID[] = ['cord', 'kettle'];

const PITY_SOFT = 50;
const PITY_HARD = 80;
const PICKUP_RATE = 0.5;

export interface GachaState extends GachaInventory {
  pity: number;
  totalPulls: number;
  pickup: TowerID | null;
  pickupBanner: string;
}

// Chip gain per rarity on duplicate
const CHIP_ON_DUP: Record<string, number> = {
  C: 3, U: 5, R: 10, E: 20, L: 50, M: 100, G: 200, OD: 500,
};

const loadInventory = (): GachaState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owned: parsed.owned || [...DEFAULT_OWNED],
        volts: parsed.volts ?? 500,
        chips: parsed.chips ?? 0,
        pity: parsed.pity ?? 0,
        totalPulls: parsed.totalPulls ?? 0,
        pickup: parsed.pickup ?? 'plasma',
        pickupBanner: parsed.pickupBanner ?? 'プラズマキャノン ピックアップ',
      };
    }
  } catch {}
  return { owned: [...DEFAULT_OWNED], volts: 500, chips: 0, pity: 0, totalPulls: 0, pickup: 'plasma', pickupBanner: 'プラズマキャノン ピックアップ' };
};

const saveInventory = (inv: GachaState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
};

const towersOfRarity = (rarity: Rarity): TowerID[] =>
  (Object.entries(TDEFS) as [TowerID, typeof TDEFS[TowerID]][])
    .filter(([, d]) => d.r === rarity)
    .map(([id]) => id);

const pickRarity = (pity: number, rateOverride?: Partial<Record<Rarity, number>>): Rarity => {
  if (pity >= PITY_HARD) return 'OD';

  const rates = { ...GACHA_RATES, ...(rateOverride || {}) };
  let odRate = rates['OD'];
  if (pity >= PITY_SOFT) {
    odRate += (pity - PITY_SOFT) / (PITY_HARD - PITY_SOFT) * 0.29;
  }

  let r = Math.random();
  r -= odRate;
  if (r <= 0) return 'OD';
  const others: Rarity[] = ['G', 'M', 'L', 'E', 'R', 'U', 'C'];
  for (const rarity of others) {
    r -= rates[rarity];
    if (r <= 0) return rarity;
  }
  return 'C';
};

const pullOne = (pity: number, pickup: TowerID | null, rateOverride?: Partial<Record<Rarity, number>>): { tid: TowerID; rarity: Rarity } => {
  const rarity = pickRarity(pity, rateOverride);
  const pool = towersOfRarity(rarity);

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

  const pull1 = useCallback((bannerType: GachaBannerType = 'normal'): TowerID | null => {
    const banner = GACHA_BANNERS.find(b => b.id === bannerType) || GACHA_BANNERS[0];
    if (inv.volts < banner.cost1) return null;
    const pickup = banner.pickup || inv.pickup;
    const { tid, rarity } = pullOne(inv.pity, pickup, banner.rateBoost);
    update(prev => {
      const isDup = prev.owned.includes(tid);
      const chipGain = isDup ? (CHIP_ON_DUP[rarity] ?? 5) : 0;
      return {
        ...prev,
        owned: isDup ? prev.owned : [...prev.owned, tid],
        chips: prev.chips + chipGain,
        volts: prev.volts - banner.cost1,
        pity: rarity === 'OD' ? 0 : prev.pity + 1,
        totalPulls: prev.totalPulls + 1,
      };
    });
    return tid;
  }, [inv.volts, inv.pity, inv.pickup, update]);

  const pull10 = useCallback((bannerType: GachaBannerType = 'normal'): TowerID[] | null => {
    const banner = GACHA_BANNERS.find(b => b.id === bannerType) || GACHA_BANNERS[0];
    if (inv.volts < banner.cost10) return null;
    const results: TowerID[] = [];
    const rarities: Rarity[] = [];
    let tempPity = inv.pity;
    const pickup = banner.pickup || inv.pickup;
    for (let i = 0; i < 10; i++) {
      const { tid, rarity } = pullOne(tempPity, pickup, banner.rateBoost);
      results.push(tid);
      rarities.push(rarity);
      tempPity = rarity === 'OD' ? 0 : tempPity + 1;
    }
    update(prev => {
      const newOwned = [...prev.owned];
      let chipGain = 0;
      for (let i = 0; i < results.length; i++) {
        const tid = results[i];
        if (newOwned.includes(tid)) {
          chipGain += CHIP_ON_DUP[rarities[i]] ?? 5;
        } else {
          newOwned.push(tid);
        }
      }
      return {
        ...prev,
        owned: newOwned,
        chips: prev.chips + chipGain,
        volts: prev.volts - banner.cost10,
        pity: tempPity,
        totalPulls: prev.totalPulls + 10,
      };
    });
    return results;
  }, [inv.volts, inv.pity, inv.pickup, update]);

  // Exchange chips for a random unit of given rarity
  const exchangeChips = useCallback((rarity: Rarity, cost: number): TowerID | null => {
    if (inv.chips < cost) return null;
    const pool = towersOfRarity(rarity).filter(t => !inv.owned.includes(t));
    if (pool.length === 0) return null;
    const tid = pool[Math.floor(Math.random() * pool.length)];
    update(prev => ({
      ...prev,
      chips: prev.chips - cost,
      owned: [...prev.owned, tid],
    }));
    return tid;
  }, [inv.chips, inv.owned, update]);

  const addVolts = useCallback((amount: number) => {
    update(prev => ({ ...prev, volts: prev.volts + amount }));
  }, [update]);

  const resetGacha = useCallback(() => {
    const fresh: GachaState = { owned: [...DEFAULT_OWNED], volts: 500, chips: 0, pity: 0, totalPulls: 0, pickup: 'plasma', pickupBanner: 'プラズマキャノン ピックアップ' };
    saveInventory(fresh);
    setInv(fresh);
  }, []);

  return { inv, pull1, pull10, addVolts, exchangeChips, resetGacha };
};
