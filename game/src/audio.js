// Gobble's Great Escape — every sound is synthesised with WebAudio.
// No audio files: a gobble is a fast falling blip, a pickup a bright chirp,
// an alarm a low sting, and the escape a little fanfare.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type, volume, slideTo) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + duration);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  }

  return {
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    gobble() {
      tone(520, 0.09, 'square', 0.08, 300);
      setTimeout(() => tone(620, 0.09, 'square', 0.08, 340), 90);
      setTimeout(() => tone(480, 0.12, 'square', 0.07, 260), 180);
    },
    corn() { tone(880, 0.1, 'sine', 0.12, 1320); },
    spotted() {
      tone(220, 0.25, 'sawtooth', 0.12, 110);
      setTimeout(() => tone(220, 0.25, 'sawtooth', 0.12, 110), 260);
    },
    bark() { tone(300, 0.07, 'square', 0.1, 180); setTimeout(() => tone(280, 0.07, 'square', 0.1, 170), 90); },
    caught() { tone(160, 0.4, 'sawtooth', 0.16, 60); },
    burn() { tone(700, 0.2, 'sawtooth', 0.1, 200); },
    stage() {
      [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'sine', 0.12), i * 130));
    },
    escaped() {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.13), i * 150));
    },
  };
}
