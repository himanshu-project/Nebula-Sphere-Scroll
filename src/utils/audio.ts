let audioCtx: AudioContext | null = null;

export type SoundEffectType = 'click' | 'laser' | 'chime' | 'bass';

export const playSound = (type: SoundEffectType = 'click') => {
  // Initialize AudioContext lazily to comply with browser autoplay policies
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
  }

  // Resume context if it was suspended
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'click') {
    osc.type = 'sine';
    // Sharp volume envelope for a percussive "click"
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.002); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); // Fast decay

    // Pitch drop to give it a "tick" character
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'laser') {
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'chime') {
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    osc.frequency.setValueAtTime(1200, now);
    
    osc.start(now);
    osc.stop(now + 1.5);
  } else if (type === 'bass') {
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 1.0);
    
    osc.start(now);
    osc.stop(now + 1.0);
  }
};
