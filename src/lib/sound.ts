let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) ctx = new AudioCtor();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/** Short, satisfying "click" for a normal set completion. */
export function playTapSound() {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

/** Triumphant ascending arpeggio for a new personal record. */
export function playPRSound() {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const start = now + i * 0.09;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

/** Double beep for "rest timer is done." */
export function playRestCompleteSound() {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  [0, 0.16].forEach((offset) => {
    const start = now + offset;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(740, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.16);
  });
}
