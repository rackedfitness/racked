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

/** A low "thud" that drops in pitch — the physical impact under a big moment. */
function playBoom(audio: AudioContext, start: number, { peak, duration }: { peak: number; duration: number }) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, start);
  osc.frequency.exponentialRampToValueAtTime(34, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Impact thud, then a triumphant ascending arpeggio and sparkle, for a new personal record. */
export function playPRSound() {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  playBoom(audio, now, { peak: 0.55, duration: 0.4 });
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];
  notes.forEach((freq, i) => {
    const start = now + 0.04 + i * 0.08;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = i < 4 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(i < 4 ? 0.3 : 0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (i < 4 ? 0.4 : 0.55));
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.6);
  });
}

/** Heavy boom on the landing, then a rising power chord that sustains. */
export function playRankUpSound() {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  playBoom(audio, now, { peak: 0.8, duration: 0.8 });

  [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
    const start = now + 0.08 + i * 0.07;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.26, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.35);
  });

  // the sustained chord everything resolves into
  [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
    const start = now + 0.42;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.3);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 1.35);
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
