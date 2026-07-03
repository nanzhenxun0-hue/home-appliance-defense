import { useState, useCallback, useEffect, useMemo } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/persistence';
import {
  ACHIEVEMENTS, CHALLENGES, MISSION_POOL,
  EMPTY_METRICS, rollMissions, todayKey, thisWeekKey,
  type ProgressSnapshot, type MissionMetric, type Mission,
} from '@/game/meta';

const STORAGE_KEY = 'kaden-td-meta-v1';

const fresh = (): ProgressSnapshot => ({
  totalWaves: 0, totalPulls: 0, totalWins: 0, totalVolts: 0, odDrops: 0, endlessBest: 0,
  extremeClears: [], challengeClears: [], achievementsUnlocked: [],
  dailyKey: todayKey(), daily: { ...EMPTY_METRICS },
  weeklyKey: thisWeekKey(), weekly: { ...EMPTY_METRICS },
  activeDaily: rollMissions('daily'), activeWeekly: rollMissions('weekly'),
  claimedDaily: [], claimedWeekly: [],
  loginStreak: 1, lastLoginDate: todayKey(),
});

const load = (): ProgressSnapshot => {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as ProgressSnapshot;
    // Backfill missing keys
    const base = fresh();
    return {
      ...base, ...parsed,
      daily: { ...EMPTY_METRICS, ...(parsed.daily || {}) },
      weekly: { ...EMPTY_METRICS, ...(parsed.weekly || {}) },
      extremeClears: parsed.extremeClears || [],
      challengeClears: parsed.challengeClears || [],
      achievementsUnlocked: parsed.achievementsUnlocked || [],
      activeDaily: parsed.activeDaily?.length ? parsed.activeDaily : rollMissions('daily'),
      activeWeekly: parsed.activeWeekly?.length ? parsed.activeWeekly : rollMissions('weekly'),
      claimedDaily: parsed.claimedDaily || [],
      claimedWeekly: parsed.claimedWeekly || [],
    };
  } catch { return fresh(); }
};

const save = (p: ProgressSnapshot) => safeSetItem(STORAGE_KEY, JSON.stringify(p));

export type TrackEvent =
  | { type: 'wave_clear'; wave: number; diff: string }
  | { type: 'game_win'; diff: string; area: string }
  | { type: 'gacha_pull'; count: number; odCount?: number }
  | { type: 'volts_earned'; amount: number }
  | { type: 'endless_milestone'; wave: number }
  | { type: 'extreme_clear'; area: string }
  | { type: 'challenge_win'; id: string };

const rolloverIfNeeded = (p: ProgressSnapshot): ProgressSnapshot => {
  let next = p;
  const dk = todayKey();
  const wk = thisWeekKey();
  if (next.dailyKey !== dk) {
    // update login streak
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    })();
    const streak = next.lastLoginDate === yesterday ? next.loginStreak + 1 : 1;
    next = {
      ...next,
      dailyKey: dk,
      daily: { ...EMPTY_METRICS },
      activeDaily: rollMissions('daily'),
      claimedDaily: [],
      lastLoginDate: dk,
      loginStreak: streak,
    };
  }
  if (next.weeklyKey !== wk) {
    next = {
      ...next,
      weeklyKey: wk,
      weekly: { ...EMPTY_METRICS },
      activeWeekly: rollMissions('weekly'),
      claimedWeekly: [],
    };
  }
  return next;
};

const applyEvent = (p: ProgressSnapshot, e: TrackEvent): ProgressSnapshot => {
  const bumpBoth = (metric: MissionMetric, amount: number): ProgressSnapshot => ({
    ...p,
    daily: { ...p.daily, [metric]: p.daily[metric] + amount },
    weekly: { ...p.weekly, [metric]: p.weekly[metric] + amount },
  });
  const setMaxBoth = (metric: MissionMetric, value: number): ProgressSnapshot => ({
    ...p,
    daily: { ...p.daily, [metric]: Math.max(p.daily[metric], value) },
    weekly: { ...p.weekly, [metric]: Math.max(p.weekly[metric], value) },
  });

  switch (e.type) {
    case 'wave_clear': {
      const q = bumpBoth('waveClears', 1);
      const q2 = { ...q, totalWaves: p.totalWaves + 1 };
      return {
        ...q2,
        daily: { ...q2.daily, bestWave: Math.max(q2.daily.bestWave, e.wave) },
        weekly: { ...q2.weekly, bestWave: Math.max(q2.weekly.bestWave, e.wave) },
      };
    }
    case 'game_win': {
      const q = bumpBoth('gameWins', 1);
      return { ...q, totalWins: p.totalWins + 1 };
    }
    case 'gacha_pull': {
      const q = bumpBoth('pulls', e.count);
      const withOd = e.odCount ? {
        ...q,
        odDrops: p.odDrops + e.odCount,
        daily: { ...q.daily, odDrops: q.daily.odDrops + e.odCount },
        weekly: { ...q.weekly, odDrops: q.weekly.odDrops + e.odCount },
      } : q;
      return { ...withOd, totalPulls: p.totalPulls + e.count };
    }
    case 'volts_earned': {
      const q = bumpBoth('voltsEarned', e.amount);
      return { ...q, totalVolts: p.totalVolts + e.amount };
    }
    case 'endless_milestone': {
      const q = setMaxBoth('endlessWave', e.wave);
      return { ...q, endlessBest: Math.max(p.endlessBest, e.wave) };
    }
    case 'extreme_clear': {
      if (p.extremeClears.includes(e.area)) return p;
      return { ...p, extremeClears: [...p.extremeClears, e.area] };
    }
    case 'challenge_win': {
      if (p.challengeClears.includes(e.id)) return p;
      return { ...p, challengeClears: [...p.challengeClears, e.id] };
    }
  }
};

// Check achievement unlocks; returns [nextProgress, newlyUnlockedIds]
const evalAchievements = (p: ProgressSnapshot): [ProgressSnapshot, string[]] => {
  const newly: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (p.achievementsUnlocked.includes(a.id)) continue;
    if (a.check(p)) newly.push(a.id);
  }
  if (newly.length === 0) return [p, []];
  return [{ ...p, achievementsUnlocked: [...p.achievementsUnlocked, ...newly] }, newly];
};

export interface UseMetaResult {
  progress: ProgressSnapshot;
  track: (e: TrackEvent) => string[]; // returns newly unlocked achievement ids
  claimMission: (id: string) => number; // returns volt reward, or 0 if not claimable
  claimAchievementReward: (id: string) => number;
  missionProgress: (m: Mission) => number;
  isChallengeCleared: (id: string) => boolean;
}

export const useMeta = (onVoltReward?: (v: number, label: string) => void): UseMetaResult => {
  const [progress, setProgress] = useState<ProgressSnapshot>(() => rolloverIfNeeded(load()));

  // Rollover check on mount + when tab regains focus
  useEffect(() => {
    const handler = () => setProgress(p => {
      const next = rolloverIfNeeded(p);
      if (next !== p) save(next);
      return next;
    });
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, []);

  const track = useCallback((e: TrackEvent): string[] => {
    let newlyUnlocked: string[] = [];
    setProgress(prev => {
      const rolled = rolloverIfNeeded(prev);
      const applied = applyEvent(rolled, e);
      const [next, newly] = evalAchievements(applied);
      newlyUnlocked = newly;
      save(next);
      // Auto-grant achievement volts
      if (newly.length > 0 && onVoltReward) {
        for (const id of newly) {
          const a = ACHIEVEMENTS.find(x => x.id === id);
          if (a) onVoltReward(a.volts, `実績: ${a.name}`);
        }
      }
      return next;
    });
    return newlyUnlocked;
  }, [onVoltReward]);

  const missionProgress = useCallback((m: Mission): number => {
    const bucket = m.scope === 'daily' ? progress.daily : progress.weekly;
    return bucket[m.metric] || 0;
  }, [progress]);

  const claimMission = useCallback((id: string): number => {
    const m = MISSION_POOL.find(x => x.id === id);
    if (!m) return 0;
    let reward = 0;
    setProgress(prev => {
      const bucket = m.scope === 'daily' ? prev.daily : prev.weekly;
      const claimed = m.scope === 'daily' ? prev.claimedDaily : prev.claimedWeekly;
      if (claimed.includes(id)) return prev;
      if ((bucket[m.metric] || 0) < m.target) return prev;
      reward = m.volts;
      const next = m.scope === 'daily'
        ? { ...prev, claimedDaily: [...prev.claimedDaily, id] }
        : { ...prev, claimedWeekly: [...prev.claimedWeekly, id] };
      save(next);
      return next;
    });
    if (reward > 0 && onVoltReward) onVoltReward(reward, `ミッション: ${m.name}`);
    return reward;
  }, [onVoltReward]);

  const claimAchievementReward = useCallback((id: string): number => {
    // Rewards auto-granted at unlock time; kept for API symmetry
    const a = ACHIEVEMENTS.find(x => x.id === id);
    return a?.volts ?? 0;
  }, []);

  const isChallengeCleared = useCallback((id: string) => progress.challengeClears.includes(id), [progress]);

  return { progress, track, claimMission, claimAchievementReward, missionProgress, isChallengeCleared };
};
