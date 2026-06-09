import { useState, useCallback } from 'react';
import type { TowerID } from '@/game/types';
import { TDEFS } from '@/game/constants';
import { safeGetItem, safeSetItem } from '@/lib/persistence';

const STORAGE_KEY = 'kaden-td-team';
const MAX_TEAM = 7;

const loadTeam = (): TowerID[] => {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const team = parsed.filter((tid: TowerID) => TDEFS[tid]).slice(0, MAX_TEAM);
        if (team.length > 0) return team;
      }
    }
  } catch {}
  return ['cord', 'kettle'];
};

const saveTeam = (team: TowerID[]) => {
  safeSetItem(STORAGE_KEY, JSON.stringify(team));
};

export const useTeam = () => {
  const [team, setTeam] = useState<TowerID[]>(loadTeam);

  const toggle = useCallback((tid: TowerID) => {
    setTeam(prev => {
      let next: TowerID[];
      if (prev.includes(tid)) {
        next = prev.filter(t => t !== tid);
      } else {
        if (prev.length >= MAX_TEAM) return prev;
        next = [...prev, tid];
      }
      saveTeam(next);
      return next;
    });
  }, []);

  const setFullTeam = useCallback((newTeam: TowerID[]) => {
    const t = newTeam.slice(0, MAX_TEAM);
    saveTeam(t);
    setTeam(t);
  }, []);

  return { team, toggle, setFullTeam, MAX_TEAM };
};
