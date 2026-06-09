import { useCallback, useEffect, useState } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/persistence';

export type SoundName =
  | 'place' | 'sell' | 'upgrade' | 'hit' | 'kill' | 'crit'
  | 'wave_start' | 'wave_clear' | 'boss_warn' | 'danger'
  | 'game_over' | 'victory'
  | 'gacha_pull' | 'gacha_reveal' | 'gacha_rare' | 'gacha_od' | 'gacha_promo'
  | 'ui_tap' | 'ui_back' | 'ui_error' | 'ui_confirm' | 'coin' | 'unlock'
  | 'ult_charge' | 'ult_fire' | 'freeze' | 'wind' | 'explosion' | 'zap' | 'combo' | 'levelup';

interface Tone {
  freq: number;
  type: OscillatorType;
  dur: number;
  vol: number;
  sweep?: number;
  delay?: number;
}

const noise = (vol: number, dur: number, delay = 0): Tone[] => ([{ freq: 1, type: 'square', dur, vol, delay }]);

const TONES: Record<SoundName, Tone[]> = {
  place:       [{ freq: 520, type: 'square', dur: 0.08, vol: 0.06 }, { freq: 780, type: 'square', dur: 0.06, vol: 0.04, delay: 0.06 }],
  sell:        [{ freq: 400, type: 'sawtooth', dur: 0.1, vol: 0.04, sweep: 200 }],
  upgrade:     [{ freq: 440, type: 'square', dur: 0.08, vol: 0.05 }, { freq: 660, type: 'square', dur: 0.08, vol: 0.05, delay: 0.08 }, { freq: 880, type: 'square', dur: 0.12, vol: 0.06, delay: 0.16 }],
  hit:         [{ freq: 180, type: 'sawtooth', dur: 0.05, vol: 0.04 }],
  kill:        [{ freq: 300, type: 'square', dur: 0.06, vol: 0.05, sweep: 600 }],
  crit:        [{ freq: 900, type: 'square', dur: 0.05, vol: 0.06 }, { freq: 1400, type: 'square', dur: 0.07, vol: 0.07, delay: 0.04 }],
  wave_start:  [{ freq: 660, type: 'square', dur: 0.1, vol: 0.05 }, { freq: 880, type: 'square', dur: 0.15, vol: 0.06, delay: 0.1 }],
  wave_clear:  [{ freq: 523, type: 'square', dur: 0.08, vol: 0.05 }, { freq: 784, type: 'square', dur: 0.12, vol: 0.06, delay: 0.08 }, { freq: 1047, type: 'square', dur: 0.18, vol: 0.07, delay: 0.18 }],
  boss_warn:   [
    { freq: 110, type: 'sawtooth', dur: 0.3, vol: 0.09, sweep: 60 },
    { freq: 220, type: 'sawtooth', dur: 0.3, vol: 0.07, sweep: 110, delay: 0.05 },
    { freq: 110, type: 'sawtooth', dur: 0.3, vol: 0.09, sweep: 60, delay: 0.4 },
    { freq: 220, type: 'sawtooth', dur: 0.3, vol: 0.07, sweep: 110, delay: 0.45 },
  ],
  danger:      [{ freq: 200, type: 'sine', dur: 0.15, vol: 0.06, sweep: 100 }, { freq: 200, type: 'sine', dur: 0.15, vol: 0.06, sweep: 100, delay: 0.25 }],
  game_over:   [
    { freq: 440, type: 'sawtooth', dur: 0.25, vol: 0.07, sweep: 220 },
    { freq: 330, type: 'sawtooth', dur: 0.3, vol: 0.07, sweep: 165, delay: 0.25 },
    { freq: 220, type: 'sawtooth', dur: 0.5, vol: 0.07, sweep: 90, delay: 0.55 },
  ],
  victory:     [
    { freq: 523, type: 'square', dur: 0.12, vol: 0.06 },
    { freq: 659, type: 'square', dur: 0.12, vol: 0.06, delay: 0.14 },
    { freq: 784, type: 'square', dur: 0.12, vol: 0.06, delay: 0.28 },
    { freq: 1047, type: 'square', dur: 0.35, vol: 0.08, delay: 0.42 },
    { freq: 1568, type: 'sine', dur: 0.4, vol: 0.05, delay: 0.5 },
  ],
  gacha_pull:  [{ freq: 300, type: 'sine', dur: 0.4, vol: 0.05, sweep: 1000 }, { freq: 100, type: 'sawtooth', dur: 0.4, vol: 0.04, sweep: 600, delay: 0.05 }],
  gacha_reveal:[{ freq: 600, type: 'square', dur: 0.06, vol: 0.04 }, { freq: 900, type: 'square', dur: 0.08, vol: 0.04, delay: 0.05 }],
  gacha_rare:  [{ freq: 440, type: 'square', dur: 0.1, vol: 0.06 }, { freq: 660, type: 'square', dur: 0.1, vol: 0.06, delay: 0.1 }, { freq: 880, type: 'square', dur: 0.15, vol: 0.07, delay: 0.2 }, { freq: 1320, type: 'sine', dur: 0.2, vol: 0.05, delay: 0.3 }],
  gacha_od:    [
    { freq: 200, type: 'sawtooth', dur: 0.5, vol: 0.09, sweep: 1400 },
    { freq: 523, type: 'square', dur: 0.12, vol: 0.08, delay: 0.55 },
    { freq: 659, type: 'square', dur: 0.12, vol: 0.08, delay: 0.67 },
    { freq: 784, type: 'square', dur: 0.12, vol: 0.08, delay: 0.79 },
    { freq: 1047, type: 'square', dur: 0.15, vol: 0.09, delay: 0.91 },
    { freq: 1568, type: 'sine', dur: 0.5, vol: 0.07, delay: 1.06 },
  ],
  gacha_promo: [{ freq: 1200, type: 'sine', dur: 0.2, vol: 0.06 }, { freq: 1800, type: 'sine', dur: 0.3, vol: 0.06, delay: 0.2 }, { freq: 2400, type: 'sine', dur: 0.4, vol: 0.05, delay: 0.4 }],
  ui_tap:      [{ freq: 800, type: 'sine', dur: 0.04, vol: 0.03 }],
  ui_back:     [{ freq: 500, type: 'sine', dur: 0.06, vol: 0.03, sweep: 300 }],
  ui_error:    [{ freq: 200, type: 'square', dur: 0.08, vol: 0.05 }, { freq: 150, type: 'square', dur: 0.1, vol: 0.05, delay: 0.08 }],
  ui_confirm:  [{ freq: 660, type: 'sine', dur: 0.06, vol: 0.04 }, { freq: 990, type: 'sine', dur: 0.08, vol: 0.04, delay: 0.06 }],
  coin:        [{ freq: 988, type: 'square', dur: 0.05, vol: 0.05 }, { freq: 1319, type: 'square', dur: 0.1, vol: 0.05, delay: 0.05 }],
  unlock:      [{ freq: 523, type: 'sine', dur: 0.08, vol: 0.05 }, { freq: 784, type: 'sine', dur: 0.08, vol: 0.05, delay: 0.08 }, { freq: 1047, type: 'sine', dur: 0.15, vol: 0.06, delay: 0.16 }, { freq: 1568, type: 'sine', dur: 0.2, vol: 0.05, delay: 0.3 }],
  ult_charge:  [{ freq: 200, type: 'sine', dur: 0.5, vol: 0.05, sweep: 1200 }],
  ult_fire:    [
    { freq: 120, type: 'sawtooth', dur: 0.6, vol: 0.1, sweep: 60 },
    { freq: 600, type: 'square', dur: 0.15, vol: 0.07 },
    { freq: 1200, type: 'square', dur: 0.2, vol: 0.06, delay: 0.1 },
    { freq: 1800, type: 'sine', dur: 0.5, vol: 0.05, delay: 0.2 },
  ],
  freeze:      [{ freq: 1800, type: 'sine', dur: 0.2, vol: 0.05, sweep: 400 }, { freq: 2400, type: 'sine', dur: 0.3, vol: 0.04, sweep: 600, delay: 0.05 }],
  wind:        [{ freq: 400, type: 'sawtooth', dur: 0.4, vol: 0.04, sweep: 800 }, { freq: 600, type: 'sawtooth', dur: 0.4, vol: 0.03, sweep: 300, delay: 0.1 }],
  explosion:   [
    { freq: 100, type: 'sawtooth', dur: 0.3, vol: 0.1, sweep: 40 },
    { freq: 200, type: 'square', dur: 0.2, vol: 0.07 },
    { freq: 60, type: 'sine', dur: 0.5, vol: 0.08, sweep: 30, delay: 0.05 },
  ],
  zap:         [{ freq: 2000, type: 'square', dur: 0.05, vol: 0.06, sweep: 400 }, { freq: 3000, type: 'square', dur: 0.04, vol: 0.05, sweep: 600, delay: 0.02 }],
  combo:       [{ freq: 880, type: 'square', dur: 0.06, vol: 0.05 }, { freq: 1320, type: 'square', dur: 0.06, vol: 0.06, delay: 0.06 }, { freq: 1760, type: 'square', dur: 0.1, vol: 0.07, delay: 0.12 }],
  levelup:     [{ freq: 523, type: 'square', dur: 0.08, vol: 0.05 }, { freq: 659, type: 'square', dur: 0.08, vol: 0.05, delay: 0.08 }, { freq: 784, type: 'square', dur: 0.08, vol: 0.05, delay: 0.16 }, { freq: 1047, type: 'square', dur: 0.18, vol: 0.07, delay: 0.24 }],
};

// Singleton
let ctxSingleton: AudioContext | null = null;
let analyserSingleton: AnalyserNode | null = null;
let masterGain: GainNode | null = null;
const ENABLED_KEY = 'kaden-td-sfx-enabled';
let enabled = safeGetItem(ENABLED_KEY) !== '0';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

// Onomatopoeia / sound-event bus
export interface SoundEvent { id: number; name: SoundName; t: number }
const eventListeners = new Set<(e: SoundEvent) => void>();
let eventCounter = 0;
const emitSoundEvent = (name: SoundName) => {
  const e: SoundEvent = { id: ++eventCounter, name, t: performance.now() };
  eventListeners.forEach(l => l(e));
};

export const subscribeSoundEvents = (cb: (e: SoundEvent) => void) => {
  eventListeners.add(cb);
  return () => { eventListeners.delete(cb); };
};

export const getSharedAnalyser = (): AnalyserNode | null => {
  if (typeof window === 'undefined') return null;
  if (!ctxSingleton) return null;
  return analyserSingleton;
};

const getCtx = () => {
  if (!ctxSingleton) {
    ctxSingleton = new AudioContext();
    masterGain = ctxSingleton.createGain();
    masterGain.gain.value = 1;
    analyserSingleton = ctxSingleton.createAnalyser();
    analyserSingleton.fftSize = 256;
    analyserSingleton.smoothingTimeConstant = 0.75;
    masterGain.connect(analyserSingleton);
    analyserSingleton.connect(ctxSingleton.destination);
  }
  if (ctxSingleton.state === 'suspended') ctxSingleton.resume();
  return ctxSingleton;
};

export const getMasterNode = (): AudioNode | null => {
  getCtx();
  return masterGain;
};

const playSound = (name: SoundName) => {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const dest = masterGain ?? ctx.destination;
    for (const tone of TONES[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(dest);
      const start = ctx.currentTime + (tone.delay || 0);
      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.freq, start);
      if (tone.sweep) osc.frequency.exponentialRampToValueAtTime(tone.sweep, start + tone.dur);
      gain.gain.setValueAtTime(tone.vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + tone.dur);
      osc.start(start);
      osc.stop(start + tone.dur + 0.01);
    }
    emitSoundEvent(name);
  } catch {}
};

export const useSound = () => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  useEffect(() => {
    const l = () => setIsEnabled(enabled);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const play = useCallback((name: SoundName) => playSound(name), []);
  const toggle = useCallback(() => {
    enabled = !enabled;
    safeSetItem(ENABLED_KEY, enabled ? '1' : '0');
    emit();
    return enabled;
  }, []);
  const init = useCallback(() => { getCtx(); }, []);
  return { play, toggle, init, enabled: isEnabled };
};
