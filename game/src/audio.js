// Synthesised sound effects with plain WebAudio: no audio files, no network. The context
// is created lazily on the first user gesture (browsers block audio before one) and every
// effect is a short oscillator or filtered-noise burst. Silent when audio is unavailable.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      return null;
    }
    return context;
  }

  function tone(frequency, duration, type, volume, slideTo) {
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  function noise(duration, volume, filterFrequency) {
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFrequency;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  return {
    /** Call from any user gesture so later effects are allowed to sound. */
    unlock() {
      ensure();
    },
    chop() {
      noise(0.09, 0.25, 1800);
      tone(180, 0.06, 'square', 0.08);
    },
    toss() {
      noise(0.18, 0.16, 900);
      tone(300, 0.16, 'sine', 0.1, 620);
    },
    wokHei() {
      tone(520, 0.12, 'triangle', 0.16);
      setTimeout(() => tone(780, 0.18, 'triangle', 0.16), 90);
    },
    ding() {
      tone(880, 0.25, 'sine', 0.14);
      tone(1318, 0.3, 'sine', 0.08);
    },
    serve() {
      tone(660, 0.1, 'triangle', 0.14);
      setTimeout(() => tone(880, 0.14, 'triangle', 0.14), 90);
      setTimeout(() => tone(990, 0.2, 'triangle', 0.12), 180);
    },
    bad() {
      tone(160, 0.22, 'sawtooth', 0.1, 110);
    },
    click() {
      tone(440, 0.05, 'square', 0.06);
    },
  };
}
