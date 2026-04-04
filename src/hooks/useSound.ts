import { useCallback, useRef } from 'react';

// Skeleton hook for sound effects - ready for actual audio files
type SoundName = 'place' | 'sell' | 'upgrade' | 'hit' | 'kill' | 'wave_start' | 'game_over' | 'victory';

const SOUND_MAP: Record<SoundName, string> = {
  place: '',
  sell: '',
  upgrade: '',
  hit: '',
  kill: '',
  wave_start: '',
  game_over: '',
  victory: '',
};

export const useSound = () => {
  const audioCtx = useRef<AudioContext | null>(null);
  const enabled = useRef(true);

  const init = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
    }
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!enabled.current) return;
    // Placeholder: when audio files are added, load and play them here
    // For now, use Web Audio API to generate simple beeps
    try {
      if (!audioCtx.current) init();
      const ctx = audioCtx.current!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.05;

      const freqs: Record<SoundName, number> = {
        place: 440, sell: 330, upgrade: 660, hit: 200,
        kill: 520, wave_start: 880, game_over: 150, victory: 1000,
      };
      osc.frequency.value = freqs[name];
      osc.type = 'sine';
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [init]);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);

  return { play, toggle, init };
};
