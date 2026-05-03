import { useState, useCallback } from 'react';
import type { TowerID } from '@/game/types';

const STORAGE_KEY = 'kaden-td-team';
const MAX_TEAM = 6;

const loadTeam = (): TowerID[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return ['cord', 'kettle'];
};

const saveTeam = (team: TowerID[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
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
