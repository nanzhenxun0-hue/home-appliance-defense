import { useCallback } from 'react';
import type { HighScoreEntry, DifficultyKey } from '@/game/types';
import { safeGetItem, safeSetItem } from '@/lib/persistence';

const STORAGE_KEY = 'kaden-td-highscores';

export const useHighScore = () => {
  const getScores = useCallback((): HighScoreEntry[] => {
    try {
      const raw = safeGetItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const addScore = useCallback((entry: HighScoreEntry) => {
    const scores = getScores();
    scores.push(entry);
    scores.sort((a, b) => {
      if (a.won !== b.won) return a.won ? -1 : 1;
      if (a.wave !== b.wave) return b.wave - a.wave;
      return b.power - a.power;
    });
    // Keep top 20
    const trimmed = scores.slice(0, 20);
    safeSetItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }, [getScores]);

  const getBest = useCallback((diff: DifficultyKey): HighScoreEntry | null => {
    const scores = getScores().filter(s => s.diff === diff);
    return scores.length > 0 ? scores[0] : null;
  }, [getScores]);

  return { getScores, addScore, getBest };
};
