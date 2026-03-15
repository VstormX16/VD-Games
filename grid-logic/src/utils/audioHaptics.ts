// Sound Generation Utilities using Web Audio API

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Call this on user's first click anywhere in the app to unlock audio
export const initAudio = () => {
  getAudioContext();
};

export const playTone = (frequency: number, type: OscillatorType, duration: number, volume = 0.2) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Simple flat volume, then sharp cut-off. Much more reliable across browsers.
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.setTargetAtTime(0, ctx.currentTime + duration * 0.8, 0.015);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio playback failed:", e);
  }
};

export const playThud = (freq: number) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Sine wave is best for bassy thuds without sharp edges
    oscillator.type = 'sine';
    
    // Start at a lower frequency and drop fast to create that "thump"
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.05); 

    // Instant attack, very very quick decay for a clean thud
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.error("Audio playback failed:", e);
  }
};

export const playPop = () => {
  playThud(350); // Higher pitched organic tick/thud
};

export const playUnpop = () => {
  playThud(250); // Lower pitched organic tick/thud
};

export const playClick = () => {
  // Ultra-short, deep thud for UI (menus, etc) - no pixel/8-bit sounds
  playThud(200); 
};

export const playSuccess = () => {
  playTone(523.25, 'triangle', 0.2, 0.2); // C5
  setTimeout(() => playTone(659.25, 'triangle', 0.2, 0.2), 100); // E5
  setTimeout(() => playTone(783.99, 'triangle', 0.4, 0.2), 200); // G5 
  setTimeout(() => playTone(1046.50, 'triangle', 0.6, 0.2), 300); // C6
};

export const playError = () => {
  playTone(150, 'sawtooth', 0.3, 0.2); // Buzzy error
};

// Haptic feedback standardizer
export const vibrate = (pattern: number | number[]) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const triggerHapticPop = () => {
  vibrate(15); // Short, crisp pop
};

export const triggerHapticSuccess = () => {
  vibrate([30, 50, 60]); // Ascending double buzz
};

export const triggerHapticError = () => {
  vibrate([40, 40, 40]); // Stuttery error buzz
};
