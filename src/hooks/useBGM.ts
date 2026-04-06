import { useRef, useCallback } from 'react';

type BGMType = 'home' | 'battle' | 'none';

// Musical note frequencies
const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

interface ScheduledNodes {
  sources: AudioBufferSourceNode[];
  gains: GainNode[];
}

const createHomeBGM = (ctx: AudioContext): ScheduledNodes => {
  const bpm = 85;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const loopLen = bar * 8;
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);

  // Dreamy synth pad chords (Am → F → C → G progression, repeated)
  const chords = [
    [NOTE.A3, NOTE.C4, NOTE.E4],
    [NOTE.F3, NOTE.A3, NOTE.C4],
    [NOTE.C4, NOTE.E4, NOTE.G4],
    [NOTE.G3, NOTE.B3, NOTE.D4],
    [NOTE.A3, NOTE.C4, NOTE.E4],
    [NOTE.F3, NOTE.A3, NOTE.C4],
    [NOTE.C4, NOTE.E4, NOTE.G4],
    [NOTE.G3, NOTE.B3, NOTE.D4],
  ];

  // Gentle arpeggio melody
  const melody = [
    NOTE.E5, NOTE.C5, NOTE.D5, NOTE.A4,
    NOTE.C5, NOTE.A4, NOTE.G4, NOTE.E4,
    NOTE.G5, NOTE.E5, NOTE.C5, NOTE.G4,
    NOTE.D5, NOTE.B4, NOTE.G4, NOTE.D4,
    NOTE.E5, NOTE.C5, NOTE.D5, NOTE.A4,
    NOTE.C5, NOTE.A4, NOTE.G4, NOTE.E4,
    NOTE.G5, NOTE.E5, NOTE.C5, NOTE.G4,
    NOTE.D5, NOTE.B4, NOTE.A4, NOTE.G4,
  ];

  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);

  for (let i = 0; i < L.length; i++) {
    const t = i / sr;

    // Pad: soft sine chords with slow attack
    const chordIdx = Math.floor(t / bar) % chords.length;
    const chord = chords[chordIdx];
    let pad = 0;
    for (const freq of chord) {
      pad += Math.sin(2 * Math.PI * freq * t) * 0.04;
      pad += Math.sin(2 * Math.PI * freq * 1.002 * t) * 0.03; // slight detune for warmth
    }
    // Envelope per bar
    const barPos = (t % bar) / bar;
    const padEnv = Math.min(barPos * 4, 1) * Math.min((1 - barPos) * 4, 1);
    pad *= padEnv;

    // Bass
    const bassFreq = chord[0] * 0.5;
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.06 * padEnv;

    // Arpeggio melody (8th notes)
    const noteIdx = Math.floor(t / (beat * 0.5)) % melody.length;
    const noteT = (t % (beat * 0.5)) / (beat * 0.5);
    const mEnv = Math.exp(-noteT * 6) * 0.035;
    const mel = (Math.sin(2 * Math.PI * melody[noteIdx] * t) * 0.7 +
                 Math.sin(2 * Math.PI * melody[noteIdx] * 2 * t) * 0.3) * mEnv;

    // Subtle hi-hat shimmer (noise bursts on offbeats)
    const hatPos = (t % beat) / beat;
    const hat = (Math.random() * 2 - 1) * 0.008 * Math.exp(-hatPos * 20) *
                (Math.floor(t / (beat * 0.5)) % 2 === 1 ? 1 : 0.3);

    // Stereo spread
    const spread = Math.sin(t * 0.3) * 0.3;
    const mix = pad + bass + mel + hat;
    L[i] = mix * (0.5 + spread);
    R[i] = mix * (0.5 - spread);
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain);
  gain.connect(ctx.destination);

  return { sources: [src], gains: [gain] };
};

const createBattleBGM = (ctx: AudioContext): ScheduledNodes => {
  const bpm = 140;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const loopLen = bar * 4;
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);

  // Aggressive minor key progression (Em → C → D → B)
  const bassNotes = [NOTE.E3 * 0.5, NOTE.C3 * 0.5, NOTE.D3 * 0.5, NOTE.B3 * 0.25];
  const chords = [
    [NOTE.E4, NOTE.G4, NOTE.B4],
    [NOTE.C4, NOTE.E4, NOTE.G4],
    [NOTE.D4, NOTE.F4, NOTE.A4],
    [NOTE.B3, NOTE.D4, NOTE.F4],
  ];

  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);

  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const barIdx = Math.floor(t / bar) % 4;

    // Distorted bass (square-ish)
    const bassFreq = bassNotes[barIdx];
    const bassSig = Math.sin(2 * Math.PI * bassFreq * t);
    const bass = (bassSig > 0 ? 1 : -1) * 0.04 + bassSig * 0.03; // mix square + sine

    // 16th note bass pulse
    const sixteenth = beat * 0.25;
    const pulsePos = (t % sixteenth) / sixteenth;
    const bassEnv = Math.exp(-pulsePos * 8);

    // Power chord stabs on beats 1 and 3
    const beatPos = (t % bar) / beat;
    const beatIdx = Math.floor(beatPos);
    const isStab = beatIdx === 0 || beatIdx === 2;
    let chord = 0;
    if (isStab) {
      const stabT = (beatPos - beatIdx);
      const stabEnv = Math.exp(-stabT * 3) * 0.04;
      for (const f of chords[barIdx]) {
        // Sawtooth approximation
        const phase = (f * t) % 1;
        chord += (phase * 2 - 1) * stabEnv;
      }
    }

    // Fast arpeggio lead
    const arpNotes = [...chords[barIdx], chords[barIdx][0] * 2];
    const arpIdx = Math.floor(t / (beat * 0.25)) % arpNotes.length;
    const arpT = (t % (beat * 0.25)) / (beat * 0.25);
    const arpEnv = Math.exp(-arpT * 10) * 0.025;
    const arp = Math.sin(2 * Math.PI * arpNotes[arpIdx] * t) * arpEnv;

    // Kick drum (low freq sine burst)
    const kickPos = (t % beat) / beat;
    const kick = Math.sin(2 * Math.PI * (150 - kickPos * 120) * t) * 0.07 * Math.exp(-kickPos * 15);

    // Snare on beats 2 and 4
    const isSnare = beatIdx === 1 || beatIdx === 3;
    const snareT = (beatPos - beatIdx);
    const snare = isSnare ? (Math.random() * 2 - 1) * 0.05 * Math.exp(-snareT * 12) : 0;

    // Hi-hat (16th notes)
    const hat = (Math.random() * 2 - 1) * 0.012 * Math.exp(-pulsePos * 15);

    const mix = bass * bassEnv + chord + arp + kick + snare + hat;
    const spread = Math.sin(t * 1.5) * 0.2;
    L[i] = mix * (0.5 + spread);
    R[i] = mix * (0.5 - spread);
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain);
  gain.connect(ctx.destination);

  return { sources: [src], gains: [gain] };
};

export const useBGM = () => {
  const ctx = useRef<AudioContext | null>(null);
  const current = useRef<BGMType>('none');
  const nodes = useRef<ScheduledNodes | null>(null);
  const enabled = useRef(true);

  const getCtx = useCallback(() => {
    if (!ctx.current) ctx.current = new AudioContext();
    if (ctx.current.state === 'suspended') ctx.current.resume();
    return ctx.current;
  }, []);

  const stopCurrent = useCallback(() => {
    if (nodes.current) {
      for (const g of nodes.current.gains) {
        try { g.gain.exponentialRampToValueAtTime(0.001, (ctx.current?.currentTime ?? 0) + 0.5); } catch {}
      }
      const old = nodes.current;
      setTimeout(() => {
        for (const s of old.sources) { try { s.stop(); } catch {} }
      }, 600);
      nodes.current = null;
    }
  }, []);

  const play = useCallback((type: BGMType) => {
    if (type === current.current) return;
    stopCurrent();
    current.current = type;
    if (type === 'none' || !enabled.current) return;

    const ac = getCtx();
    const n = type === 'home' ? createHomeBGM(ac) : createBattleBGM(ac);
    nodes.current = n;
    for (const s of n.sources) s.start(0);
    for (const g of n.gains) {
      g.gain.setValueAtTime(0.001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.7, ac.currentTime + 1.0);
    }
  }, [getCtx, stopCurrent]);

  const stop = useCallback(() => {
    stopCurrent();
    current.current = 'none';
  }, [stopCurrent]);

  const toggle = useCallback(() => {
    enabled.current = !enabled.current;
    if (!enabled.current) stop();
    return enabled.current;
  }, [stop]);

  return { play, stop, toggle, enabled };
};
