import { describe, expect, it } from 'vitest';
import {
  getTutorialFallbackPlacement,
  resolveTutorialPlacement,
  shouldAdvanceAfterTutorialPlacement,
  type TutorialUnitType,
} from './tutorialFlow';

const pathKeys = new Set(['0,1', '1,1', '2,1', '3,1', '4,1']);

describe('tutorial STEP3 extension-cord placement', () => {
  it('accepts the highlighted extension-cord cell and advances to STEP4', () => {
    const grid: Record<string, TutorialUnitType> = { '2,0': 'kettle' };
    const result = resolveTutorialPlacement({ step: 3, x: 1, y: 0, grid, pathKeys });

    expect(result).toMatchObject({ ok: true, unit: 'cord', placeKey: '1,0', redirected: false });
    expect(shouldAdvanceAfterTutorialPlacement(3)).toBe(4);
  });

  it('rescues a path-cell mis-tap by redirecting to the highlighted safe cell', () => {
    const grid: Record<string, TutorialUnitType> = { '2,0': 'kettle' };
    const result = resolveTutorialPlacement({ step: 3, x: 1, y: 1, grid, pathKeys });

    expect(result).toMatchObject({ ok: true, unit: 'cord', placeKey: '1,0', redirected: true });
  });

  it('rescues an occupied-cell mis-tap by using the next open highlighted neighbor', () => {
    const grid: Record<string, TutorialUnitType> = { '2,0': 'kettle', '1,0': 'cord' };
    const result = resolveTutorialPlacement({ step: 6, x: 2, y: 2, grid, pathKeys });

    expect(result.ok).toBe(true);
    expect(result.unit).toBe('cord');
    expect(result.placeKey).toBe(getTutorialFallbackPlacement(6, grid, pathKeys));
  });

  it('keeps STEP5 as the intended power-shortage failure and advances only after warning', () => {
    const grid: Record<string, TutorialUnitType> = { '2,0': 'kettle', '1,0': 'cord' };
    const result = resolveTutorialPlacement({ step: 5, x: 2, y: 2, grid, pathKeys });

    expect(result).toEqual({ ok: false, reason: 'power_shortage' });
    expect(shouldAdvanceAfterTutorialPlacement(5)).toBeNull();
  });
});