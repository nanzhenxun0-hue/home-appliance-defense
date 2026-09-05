import { describe, it } from 'vitest';
import { mkState, buildQ, tickGame, getWaves } from '@/game/logic';
import { AREA_WAVES } from '@/game/constants';

describe('boss waves', () => {
  for (const area of Object.keys(AREA_WAVES)) {
    it('sim ' + area, () => {
      const waves = getWaves(area as any);
      for (let w = 0; w < waves.length; w++) {
        const s = mkState('normal' as any, ['kettle'] as any, area as any);
        s.spawnQ = buildQ(w, 'normal' as any, area as any);
        s.wave = w + 1; s.waveActive = true; s.waveT = 0;
        const t0 = Date.now();
        let ticks = 0;
        while (s.waveActive && ticks < 60000) { tickGame(s, 0.05); ticks++; if (Date.now()-t0 > 4000) { throw new Error(`HANG area=${area} wave=${w+1} ticks=${ticks} enemies=${s.enemies.length} q=${s.spawnQ.length}`);} }
        if (s.waveActive) throw new Error(`NOEND area=${area} wave=${w+1} enemies=${s.enemies.length} q=${s.spawnQ.length}`);
      }
    }, 60000);
  }
});
