import { useCallback, useState } from 'react';
import type { AreaKey } from '@/game/types';
import { AREA_ORDER } from '@/game/areas';

const STORAGE_KEY = 'kaden-td-unlocked-areas';

const load = (): Set<AreaKey> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr: AreaKey[] = raw ? JSON.parse(raw) : [];
    return new Set([AREA_ORDER[0], ...arr]);
  } catch {
    return new Set([AREA_ORDER[0]]);
  }
};

const save = (areas: Set<AreaKey>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...areas]));
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
