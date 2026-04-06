import { useCallback, useRef } from 'react';

type SoundName =
  | 'place' | 'sell' | 'upgrade' | 'hit' | 'kill'
  | 'wave_start' | 'game_over' | 'victory'
  | 'gacha_pull' | 'gacha_reveal' | 'gacha_rare' | 'gacha_od'
  | 'ui_tap' | 'ui_back';

interface ToneConfig {
  freq: number;
  type: OscillatorType;
  dur: number;
  vol: number;
  sweep?: number; // end frequency for sweep
  delay?: number;
}

const TONES: Record<SoundName, ToneConfig[]> = {
  place:      [{ freq: 520, type: 'square', dur: 0.08, vol: 0.06 }, { freq: 780, type: 'square', dur: 0.06, vol: 0.04, delay: 0.06 }],
  sell:       [{ freq: 400, type: 'sawtooth', dur: 0.1, vol: 0.04, sweep: 200 }],
  upgrade:    [{ freq: 440, type: 'square', dur: 0.08, vol: 0.05 }, { freq: 660, type: 'square', dur: 0.08, vol: 0.05, delay: 0.08 }, { freq: 880, type: 'square', dur: 0.12, vol: 0.06, delay: 0.16 }],
  hit:        [{ freq: 180, type: 'sawtooth', dur: 0.05, vol: 0.04 }],
  kill:       [{ freq: 300, type: 'square', dur: 0.06, vol: 0.05, sweep: 600 }],
  wave_start: [{ freq: 660, type: 'square', dur: 0.1, vol: 0.05 }, { freq: 880, type: 'square', dur: 0.15, vol: 0.06, delay: 0.1 }],
  game_over:  [{ freq: 440, type: 'sawtooth', dur: 0.2, vol: 0.06, sweep: 110 }],
  victory:    [{ freq: 523, type: 'square', dur: 0.1, vol: 0.05 }, { freq: 659, type: 'square', dur: 0.1, vol: 0.05, delay: 0.12 }, { freq: 784, type: 'square', dur: 0.1, vol: 0.05, delay: 0.24 }, { freq: 1047, type: 'square', dur: 0.25, vol: 0.06, delay: 0.36 }],
  gacha_pull: [{ freq: 300, type: 'sine', dur: 0.3, vol: 0.05, sweep: 800 }],
  gacha_reveal: [{ freq: 600, type: 'square', dur: 0.06, vol: 0.04 }, { freq: 900, type: 'square', dur: 0.08, vol: 0.04, delay: 0.05 }],
  gacha_rare: [{ freq: 440, type: 'square', dur: 0.1, vol: 0.06 }, { freq: 660, type: 'square', dur: 0.1, vol: 0.06, delay: 0.1 }, { freq: 880, type: 'square', dur: 0.15, vol: 0.07, delay: 0.2 }],
  gacha_od:   [
    { freq: 200, type: 'sawtooth', dur: 0.4, vol: 0.08, sweep: 1200 },
    { freq: 523, type: 'square', dur: 0.12, vol: 0.07, delay: 0.5 },
    { freq: 659, type: 'square', dur: 0.12, vol: 0.07, delay: 0.62 },
    { freq: 784, type: 'square', dur: 0.12, vol: 0.07, delay: 0.74 },
    { freq: 1047, type: 'square', dur: 0.3, vol: 0.08, delay: 0.86 },
  ],
  ui_tap:     [{ freq: 800, type: 'sine', dur: 0.04, vol: 0.03 }],
  ui_back:    [{ freq: 500, type: 'sine', dur: 0.06, vol: 0.03, sweep: 300 }],
};

export const useSound = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const enabled = useRef(true);

  const getCtx = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume();
    }
    return audioCtx.current;
  }, []);

  const init = useCallback(() => { getCtx(); }, [getCtx]);

  const play = useCallback((name: SoundName) => {
    if (!enabled.current) return;
    try {
      const ctx = getCtx();
      const tones = TONES[name];
      for (const tone of tones) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const start = ctx.currentTime + (tone.delay || 0);
        osc.type = tone.type;
        osc.frequency.setValueAtTime(tone.freq, start);
        if (tone.sweep) {
          osc.frequency.exponentialRampToValueAtTime(tone.sweep, start + tone.dur);
        }
        gain.gain.setValueAtTime(tone.vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + tone.dur);
        osc.start(start);
        osc.stop(start + tone.dur + 0.01);
      }
    } catch {}
  }, [getCtx]);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);

  return { play, toggle, init, enabled };
};
