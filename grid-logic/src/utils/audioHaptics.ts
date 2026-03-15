import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';

// Sound Generation Utilities using Web Audio API

let audioCtx: AudioContext | null = null;
let isSoundEnabled = true;
let isHapticsEnabled = true;

// Keep local flags in sync immediately, fixes Vite HMR issues
try {
  isSoundEnabled = useSettingsStore.getState().soundEnabled;
  isHapticsEnabled = useSettingsStore.getState().hapticsEnabled;
  useSettingsStore.subscribe((state) => {
    isSoundEnabled = state.soundEnabled;
    isHapticsEnabled = state.hapticsEnabled;
  });
} catch (e) {
  console.error("Store subscribe failed", e);
}

const getAudioContext = () => {
  if (!audioCtx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Call this on user's first click anywhere in the app to unlock audio
export const initAudio = () => {
  if (!isSoundEnabled) return;
  getAudioContext();
};

export const playTone = (frequency: number, type: OscillatorType, duration: number, volume = 0.2) => {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.setTargetAtTime(0, ctx.currentTime + duration * 0.8, 0.015);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
};

export const playThud = (freq: number) => {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.05); 

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
};

const getEquippedSfx = () => {
  try {
    return useUserStore.getState().user?.equipped?.sfx || 'default';
  } catch {
    return 'default';
  }
};

export const playPop = () => {
  if (getEquippedSfx() === 'sfx_retro') {
    playTone(400, 'square', 0.05, 0.1);
  } else {
    playThud(350);
  }
};

export const playUnpop = () => {
  if (getEquippedSfx() === 'sfx_retro') {
    playTone(200, 'square', 0.05, 0.1);
  } else {
    playThud(250);
  }
};

export const playClick = () => {
  if (getEquippedSfx() === 'sfx_retro') {
    playTone(600, 'square', 0.02, 0.05);
  } else {
    playThud(200);
  }
};

export const playSuccess = () => {
  if (!isSoundEnabled) return;
  playTone(523.25, 'triangle', 0.2, 0.2); // C5
  setTimeout(() => { if(isSoundEnabled) playTone(659.25, 'triangle', 0.2, 0.2) }, 100); // E5
  setTimeout(() => { if(isSoundEnabled) playTone(783.99, 'triangle', 0.4, 0.2) }, 200); // G5 
  setTimeout(() => { if(isSoundEnabled) playTone(1046.50, 'triangle', 0.6, 0.2) }, 300); // C6
};

export const playError = () => {
  if (!isSoundEnabled) return;
  playTone(150, 'sawtooth', 0.3, 0.2); // Buzzy error
};

// Haptic feedback standardizer
export const vibrate = (pattern: number | number[]) => {
  if (!isHapticsEnabled) return;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore empty catch safely
    }
  }
};

export const triggerHapticPop = () => vibrate(15);
export const triggerHapticSuccess = () => vibrate([30, 50, 60]);
export const triggerHapticError = () => vibrate([40, 40, 40]);
