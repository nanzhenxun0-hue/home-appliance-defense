import { useEffect, useState, useCallback } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/persistence';

export type BGMType = 'home' | 'tutorial' | 'gacha' | 'battle' | 'boss' | 'victory' | 'none';

const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

interface BGMNodes { source: AudioBufferSourceNode; gain: GainNode; }

// ---------- Track generators ----------
const renderHome = (ctx: AudioContext) => {
  const bpm = 85, beat = 60 / bpm, bar = beat * 4, loopLen = bar * 8, sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);
  const chords = [
    [NOTE.A3, NOTE.C4, NOTE.E4], [NOTE.F3, NOTE.A3, NOTE.C4],
    [NOTE.C4, NOTE.E4, NOTE.G4], [NOTE.G3, NOTE.B3, NOTE.D4],
    [NOTE.A3, NOTE.C4, NOTE.E4], [NOTE.F3, NOTE.A3, NOTE.C4],
    [NOTE.C4, NOTE.E4, NOTE.G4], [NOTE.G3, NOTE.B3, NOTE.D4],
  ];
  const melody = [
    NOTE.E5, NOTE.C5, NOTE.D5, NOTE.A4, NOTE.C5, NOTE.A4, NOTE.G4, NOTE.E4,
    NOTE.G5, NOTE.E5, NOTE.C5, NOTE.G4, NOTE.D5, NOTE.B4, NOTE.G4, NOTE.D4,
    NOTE.E5, NOTE.C5, NOTE.D5, NOTE.A4, NOTE.C5, NOTE.A4, NOTE.G4, NOTE.E4,
    NOTE.G5, NOTE.E5, NOTE.C5, NOTE.G4, NOTE.D5, NOTE.B4, NOTE.A4, NOTE.G4,
  ];
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const chordIdx = Math.floor(t / bar) % chords.length;
    const chord = chords[chordIdx];
    let pad = 0;
    for (const f of chord) { pad += Math.sin(2 * Math.PI * f * t) * 0.04 + Math.sin(2 * Math.PI * f * 1.002 * t) * 0.03; }
    const barPos = (t % bar) / bar;
    const padEnv = Math.min(barPos * 4, 1) * Math.min((1 - barPos) * 4, 1);
    pad *= padEnv;
    const bass = Math.sin(2 * Math.PI * chord[0] * 0.5 * t) * 0.06 * padEnv;
    const noteIdx = Math.floor(t / (beat * 0.5)) % melody.length;
    const noteT = (t % (beat * 0.5)) / (beat * 0.5);
    const mEnv = Math.exp(-noteT * 6) * 0.035;
    const mel = (Math.sin(2 * Math.PI * melody[noteIdx] * t) * 0.7 + Math.sin(2 * Math.PI * melody[noteIdx] * 2 * t) * 0.3) * mEnv;
    const hatPos = (t % beat) / beat;
    const hat = (Math.random() * 2 - 1) * 0.008 * Math.exp(-hatPos * 20) * (Math.floor(t / (beat * 0.5)) % 2 === 1 ? 1 : 0.3);
    const spread = Math.sin(t * 0.3) * 0.3;
    const mix = pad + bass + mel + hat;
    L[i] = mix * (0.5 + spread); R[i] = mix * (0.5 - spread);
  }
  return buf;
};

const renderTutorial = (ctx: AudioContext) => {
  // Friendly, slow, child-like — major key marimba-ish
  const bpm = 100, beat = 60 / bpm, bar = beat * 4, loopLen = bar * 4, sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);
  const chords = [
    [NOTE.C4, NOTE.E4, NOTE.G4], [NOTE.G3, NOTE.B3, NOTE.D4],
    [NOTE.A3, NOTE.C4, NOTE.E4], [NOTE.F3, NOTE.A3, NOTE.C4],
  ];
  const melody = [NOTE.G4, NOTE.E4, NOTE.C4, NOTE.E4, NOTE.D4, NOTE.B3, NOTE.G3, NOTE.B3,
                  NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.F4, NOTE.E4, NOTE.D4, NOTE.C4];
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const chord = chords[Math.floor(t / bar) % chords.length];
    let pad = 0;
    for (const f of chord) pad += Math.sin(2 * Math.PI * f * t) * 0.035;
    const barPos = (t % bar) / bar;
    pad *= Math.min(barPos * 3, 1) * Math.min((1 - barPos) * 3, 1);
    const bass = Math.sin(2 * Math.PI * chord[0] * 0.5 * t) * 0.05;
    const nIdx = Math.floor(t / beat) % melody.length;
    const nT = (t % beat) / beat;
    const env = Math.exp(-nT * 4) * 0.04;
    const f = melody[nIdx];
    const mel = (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 2 * t) * 0.5) * env;
    L[i] = pad + bass + mel; R[i] = pad + bass + mel;
  }
  return buf;
};

const renderGacha = (ctx: AudioContext) => {
  // Sparkly, anticipating — fast arp on tonic
  const bpm = 128, beat = 60 / bpm, bar = beat * 4, loopLen = bar * 4, sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);
  const bass = [NOTE.D3, NOTE.A3 * 0.5, NOTE.F3, NOTE.G3];
  const arp = [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.D5, NOTE.F5, NOTE.D5, NOTE.A4, NOTE.F4];
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const barIdx = Math.floor(t / bar) % 4;
    const b = Math.sin(2 * Math.PI * bass[barIdx] * t) * 0.05;
    const sixteenth = beat * 0.25;
    const aIdx = Math.floor(t / sixteenth) % arp.length;
    const aT = (t % sixteenth) / sixteenth;
    const aEnv = Math.exp(-aT * 6) * 0.04;
    const a = (Math.sin(2 * Math.PI * arp[aIdx] * t) + Math.sin(2 * Math.PI * arp[aIdx] * 2 * t) * 0.3) * aEnv;
    const sparkle = (Math.random() * 2 - 1) * 0.01 * Math.exp(-((t % beat) / beat) * 8);
    const kick = Math.sin(2 * Math.PI * (120 - ((t % beat) / beat) * 100) * t) * 0.05 * Math.exp(-((t % beat) / beat) * 12);
    const spread = Math.sin(t * 2) * 0.25;
    const mix = b + a + sparkle + kick;
    L[i] = mix * (0.5 + spread); R[i] = mix * (0.5 - spread);
  }
  return buf;
};

const renderBattle = (ctx: AudioContext) => {
  const bpm = 140, beat = 60 / bpm, bar = beat * 4, loopLen = bar * 4, sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);
  const bassNotes = [NOTE.E3 * 0.5, NOTE.C3 * 0.5, NOTE.D3 * 0.5, NOTE.B3 * 0.25];
  const chords = [[NOTE.E4, NOTE.G4, NOTE.B4], [NOTE.C4, NOTE.E4, NOTE.G4], [NOTE.D4, NOTE.F4, NOTE.A4], [NOTE.B3, NOTE.D4, NOTE.F4]];
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const barIdx = Math.floor(t / bar) % 4;
    const bassSig = Math.sin(2 * Math.PI * bassNotes[barIdx] * t);
    const bass = (bassSig > 0 ? 1 : -1) * 0.04 + bassSig * 0.03;
    const sixteenth = beat * 0.25;
    const pulsePos = (t % sixteenth) / sixteenth;
    const bassEnv = Math.exp(-pulsePos * 8);
    const beatPos = (t % bar) / beat;
    const beatIdx = Math.floor(beatPos);
    const isStab = beatIdx === 0 || beatIdx === 2;
    let chord = 0;
    if (isStab) {
      const stabT = beatPos - beatIdx;
      const stabEnv = Math.exp(-stabT * 3) * 0.04;
      for (const f of chords[barIdx]) { chord += (((f * t) % 1) * 2 - 1) * stabEnv; }
    }
    const arpNotes = [...chords[barIdx], chords[barIdx][0] * 2];
    const arpIdx = Math.floor(t / (beat * 0.25)) % arpNotes.length;
    const arpT = (t % (beat * 0.25)) / (beat * 0.25);
    const arp = Math.sin(2 * Math.PI * arpNotes[arpIdx] * t) * Math.exp(-arpT * 10) * 0.025;
    const kickPos = (t % beat) / beat;
    const kick = Math.sin(2 * Math.PI * (150 - kickPos * 120) * t) * 0.07 * Math.exp(-kickPos * 15);
    const snare = (beatIdx === 1 || beatIdx === 3) ? (Math.random() * 2 - 1) * 0.05 * Math.exp(-(beatPos - beatIdx) * 12) : 0;
    const hat = (Math.random() * 2 - 1) * 0.012 * Math.exp(-pulsePos * 15);
    const mix = bass * bassEnv + chord + arp + kick + snare + hat;
    const spread = Math.sin(t * 1.5) * 0.2;
    L[i] = mix * (0.5 + spread); R[i] = mix * (0.5 - spread);
  }
  return buf;
};

const renderBoss = (ctx: AudioContext) => {
  // Heavy, ominous, faster tempo
  const bpm = 160, beat = 60 / bpm, bar = beat * 4, loopLen = bar * 4, sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);
  const bassNotes = [NOTE.E3 * 0.5, NOTE.E3 * 0.5, NOTE.F3 * 0.5, NOTE.D3 * 0.5];
  const stabs = [[NOTE.E4, NOTE.G4, NOTE.B4, NOTE.E5], [NOTE.E4, NOTE.G4, NOTE.B4, NOTE.E5],
                 [NOTE.F4, NOTE.A4, NOTE.C5, NOTE.F5], [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.D5]];
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const barIdx = Math.floor(t / bar) % 4;
    const bf = bassNotes[barIdx];
    const bs = Math.sin(2 * Math.PI * bf * t);
    const bass = ((bs > 0 ? 1 : -1) * 0.06 + bs * 0.04);
    const eighth = beat * 0.5;
    const ePos = (t % eighth) / eighth;
    const bassEnv = Math.exp(-ePos * 6);
    const beatPos = (t % bar) / beat;
    const beatIdx = Math.floor(beatPos);
    const stabT = beatPos - beatIdx;
    const stabEnv = Math.exp(-stabT * 4) * 0.05;
    let stab = 0;
    for (const f of stabs[barIdx]) stab += (((f * t) % 1) * 2 - 1) * stabEnv;
    const kickPos = (t % beat) / beat;
    const kick = Math.sin(2 * Math.PI * (180 - kickPos * 150) * t) * 0.09 * Math.exp(-kickPos * 14);
    const snare = (beatIdx === 1 || beatIdx === 3) ? (Math.random() * 2 - 1) * 0.06 * Math.exp(-stabT * 10) : 0;
    const choir = Math.sin(2 * Math.PI * bf * 4 * t) * 0.015 + Math.sin(2 * Math.PI * bf * 6 * t) * 0.012;
    const choirEnv = Math.min(beatPos / 4, 1) * Math.min((4 - beatPos) / 4, 1);
    const mix = bass * bassEnv + stab + kick + snare + choir * choirEnv;
    const spread = Math.sin(t * 0.8) * 0.3;
    L[i] = mix * (0.5 + spread); R[i] = mix * (0.5 - spread);
  }
  return buf;
};

const renderVictory = (ctx: AudioContext) => {
  // Short triumphant loop
  const bpm = 120, beat = 60 / bpm, bar = beat * 4, loopLen = bar * 2, sr = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.ceil(sr * loopLen), sr);
  const chords = [[NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5], [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4]];
  const mel = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C5, NOTE.D5, NOTE.E5, NOTE.G5, NOTE.E5];
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  for (let i = 0; i < L.length; i++) {
    const t = i / sr;
    const ch = chords[Math.floor(t / bar) % 2];
    let pad = 0; for (const f of ch) pad += Math.sin(2 * Math.PI * f * t) * 0.04;
    const barPos = (t % bar) / bar;
    pad *= Math.min(barPos * 3, 1) * Math.min((1 - barPos) * 3, 1);
    const nIdx = Math.floor(t / (beat * 0.5)) % mel.length;
    const nT = (t % (beat * 0.5)) / (beat * 0.5);
    const m = Math.sin(2 * Math.PI * mel[nIdx] * t) * Math.exp(-nT * 5) * 0.05;
    L[i] = pad + m; R[i] = pad + m;
  }
  return buf;
};

const RENDERERS: Record<Exclude<BGMType, 'none'>, (ctx: AudioContext) => AudioBuffer> = {
  home: renderHome, tutorial: renderTutorial, gacha: renderGacha,
  battle: renderBattle, boss: renderBoss, victory: renderVictory,
};

// ---------- Singleton state ----------
let ctxSingleton: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmAnalyser: AnalyserNode | null = null;
let currentTrack: BGMType = 'none';
let currentNodes: BGMNodes | null = null;
const bufferCache = new Map<BGMType, AudioBuffer>();
const ENABLED_KEY = 'kaden-td-bgm-enabled';
let enabled = safeGetItem(ENABLED_KEY) !== '0';
let audioUnlocked = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const getBGMAnalyser = (): AnalyserNode | null => bgmAnalyser;

const getCtx = () => {
  if (!ctxSingleton) {
    ctxSingleton = new AudioContext();
    masterGain = ctxSingleton.createGain();
    masterGain.gain.value = 0.7;
    bgmAnalyser = ctxSingleton.createAnalyser();
    bgmAnalyser.fftSize = 256;
    bgmAnalyser.smoothingTimeConstant = 0.8;
    masterGain.connect(bgmAnalyser);
    bgmAnalyser.connect(ctxSingleton.destination);
  }
  if (ctxSingleton.state === 'suspended') ctxSingleton.resume();
  return ctxSingleton;
};

const stopCurrent = () => {
  if (!currentNodes) return;
  const old = currentNodes;
  try { old.gain.gain.exponentialRampToValueAtTime(0.001, (ctxSingleton?.currentTime ?? 0) + 0.4); } catch {}
  setTimeout(() => { try { old.source.stop(); } catch {} }, 500);
  currentNodes = null;
};

const playTrack = (type: BGMType) => {
  if (type === currentTrack) return;
  stopCurrent();
  currentTrack = type;
  emit();
  if (type === 'none' || !enabled || !audioUnlocked) return;
  const ac = getCtx();
  let buf = bufferCache.get(type);
  if (!buf) { buf = RENDERERS[type](ac); bufferCache.set(type, buf); }
  const source = ac.createBufferSource();
  source.buffer = buf; source.loop = true;
  const gain = ac.createGain(); gain.gain.value = 0.001;
  source.connect(gain); gain.connect(masterGain!);
  source.start(0);
  gain.gain.exponentialRampToValueAtTime(1, ac.currentTime + 0.8);
  currentNodes = { source, gain };
};

export const useBGM = () => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [track, setTrack] = useState(currentTrack);
  useEffect(() => {
    const l = () => { setIsEnabled(enabled); setTrack(currentTrack); };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const play = useCallback((type: BGMType) => playTrack(type), []);
  const init = useCallback(() => {
    audioUnlocked = true;
    if (currentTrack !== 'none' && enabled && !currentNodes) {
      const t = currentTrack;
      currentTrack = 'none';
      playTrack(t);
    } else {
      try { getCtx(); } catch {}
    }
  }, []);
  const stop = useCallback(() => { stopCurrent(); currentTrack = 'none'; emit(); }, []);
  const toggle = useCallback(() => {
    enabled = !enabled;
    safeSetItem(ENABLED_KEY, enabled ? '1' : '0');
    if (!enabled) stopCurrent();
    else if (currentTrack !== 'none') { audioUnlocked = true; const t = currentTrack; currentTrack = 'none'; playTrack(t); }
    emit();
    return enabled;
  }, []);
  const setVolume = useCallback((v: number) => {
    if (masterGain) masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), getCtx().currentTime, 0.1);
  }, []);

  return { play, stop, toggle, setVolume, init, enabled: isEnabled, current: track };
};
