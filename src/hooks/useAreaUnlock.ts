import { useCallback, useState } from 'react';
import type { AreaKey } from '@/game/types';
import { AREA_ORDER } from '@/game/areas';
import { safeGetItem, safeSetItem } from '@/lib/persistence';

const STORAGE_KEY = 'kaden-td-unlocked-areas';

const load = (): Set<AreaKey> => {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const arr: AreaKey[] = Array.isArray(parsed) ? parsed.filter((a: AreaKey) => AREA_ORDER.includes(a)) : [];
    return new Set([AREA_ORDER[0], ...arr]);
  } catch {
    return new Set([AREA_ORDER[0]]);
  }
};

const save = (areas: Set<AreaKey>) => {
  safeSetItem(STORAGE_KEY, JSON.stringify([...areas]));
};

export const useAreaUnlock = () => {
  const [unlockedAreas, setUnlockedAreas] = useState<Set<AreaKey>>(load);

  const unlockNext = useCallback((clearedArea: AreaKey) => {
    const idx = AREA_ORDER.indexOf(clearedArea);
    if (idx < 0 || idx >= AREA_ORDER.length - 1) return;
    const next = AREA_ORDER[idx + 1];
    setUnlockedAreas(prev => {
      if (prev.has(next)) return prev;
      const next_set = new Set(prev);
      next_set.add(next);
      save(next_set);
      return next_set;
    });
  }, []);

  return { unlockedAreas, unlockNext };
};
