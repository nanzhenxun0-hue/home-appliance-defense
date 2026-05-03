export type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type TutorialUnitType = 'cord' | 'kettle';

export interface TutorialTarget {
  x: number;
  y: number;
  unit: TutorialUnitType;
}

export interface TutorialPlacementResult {
  ok: boolean;
  unit?: TutorialUnitType;
  placeKey?: string;
  redirected?: boolean;
  reason?: 'no_target' | 'occupied' | 'invalid_range' | 'no_open_cell' | 'power_shortage';
}

export const tutorialKey = (x: number, y: number) => `${x},${y}`;

export const getTutorialTarget = (step: TutorialStep): TutorialTarget | null => {
  if (step === 1) return { x: 2, y: 0, unit: 'kettle' };
  if (step === 3) return { x: 1, y: 0, unit: 'cord' };
  if (step === 5) return { x: 2, y: 2, unit: 'kettle' };
  if (step === 6) return { x: 3, y: 2, unit: 'cord' };
  if (step === 7) return { x: 2, y: 2, unit: 'kettle' };
  return null;
};

export const getTutorialRequiredUnit = (step: TutorialStep): TutorialUnitType | null =>
  getTutorialTarget(step)?.unit ?? null;

export const getTutorialFallbackPlacement = (
  step: TutorialStep,
  grid: Record<string, TutorialUnitType>,
  pathKeys: Set<string>,
): string | null => {
  const target = getTutorialTarget(step);
  if (!target) return null;

  const candidates = [
    [target.x, target.y],
    [target.x - 1, target.y], [target.x + 1, target.y],
    [target.x, target.y - 1], [target.x, target.y + 1],
    [target.x - 1, target.y - 1], [target.x + 1, target.y - 1],
    [target.x - 1, target.y + 1], [target.x + 1, target.y + 1],
  ];

  for (const [x, y] of candidates) {
    const key = tutorialKey(x, y);
    if (x < 0 || y < 0) continue;
    if (pathKeys.has(key) || grid[key]) continue;
    return key;
  }
  return null;
};

export const resolveTutorialPlacement = ({
  step,
  x,
  y,
  grid,
  pathKeys,
}: {
  step: TutorialStep;
  x: number;
  y: number;
  grid: Record<string, TutorialUnitType>;
  pathKeys: Set<string>;
}): TutorialPlacementResult => {
  const target = getTutorialTarget(step);
  if (!target) return { ok: false, reason: 'no_target' };
  if (step === 5) return { ok: false, reason: 'power_shortage' };

  const tappedKey = tutorialKey(x, y);
  const dx = Math.abs(x - target.x);
  const dy = Math.abs(y - target.y);
  const isPowerStep = step === 3 || step === 6;

  if (dx > 1 || dy > 1 || pathKeys.has(tappedKey) || grid[tappedKey]) {
    const fallback = isPowerStep ? getTutorialFallbackPlacement(step, grid, pathKeys) : null;
    if (fallback) return { ok: true, unit: target.unit, placeKey: fallback, redirected: true };
    return { ok: false, reason: grid[tappedKey] ? 'occupied' : dx > 1 || dy > 1 ? 'invalid_range' : 'no_open_cell' };
  }

  return { ok: true, unit: target.unit, placeKey: tappedKey, redirected: false };
};

export const shouldAdvanceAfterTutorialPlacement = (step: TutorialStep): TutorialStep | null => {
  if (step === 1) return 2;
  if (step === 3) return 4;
  if (step === 6) return 7;
  return null;
};