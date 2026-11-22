// Synthesized sound effects with WebAudio. No audio files, no network.

let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freqA, freqB, dur, type, gain, when) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + (when || 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freqA, t0);
  if (freqB) osc.frequency.exponentialRampToValueAtTime(freqB, t0 + dur);
  g.gain.setValueAtTime(gain || 0.08, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(a.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, freq, gain) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start();
}

export function sfxFootstep(sneak) {
  noiseBurst(sneak ? 0.05 : 0.09, sneak ? 500 : 800, sneak ? 0.015 : 0.045);
}
export function sfxPickup() {
  tone(880, null, 0.12, 'sine', 0.09);
  tone(1318, null, 0.2, 'sine', 0.08, 0.08);
}
export function sfxCoin() {
  tone(1568, null, 0.1, 'square', 0.04);
  tone(2093, null, 0.22, 'square', 0.035, 0.07);
}
export function sfxSmoke() { noiseBurst(0.5, 1200, 0.07); }
export function sfxAlarmSting() {
  tone(392, 370, 0.35, 'sawtooth', 0.07);
  tone(392, 370, 0.35, 'sawtooth', 0.07, 0.4);
}
export function sfxWary() { tone(660, 740, 0.12, 'triangle', 0.06); }
export function sfxCaught() {
  tone(220, 110, 0.7, 'sawtooth', 0.1);
  noiseBurst(0.4, 600, 0.06);
}
export function sfxExitOpen() {
  tone(523, null, 0.14, 'triangle', 0.08);
  tone(659, null, 0.14, 'triangle', 0.08, 0.12);
  tone(784, null, 0.3, 'triangle', 0.09, 0.24);
}
export function sfxWin() {
  const notes = [523, 659, 784, 1046, 784, 1046];
  notes.forEach((n, i) => tone(n, null, 0.22, 'triangle', 0.08, i * 0.13));
}
export function sfxClick() { tone(1200, 900, 0.05, 'sine', 0.04); }
export function sfxLaserTrip() {
  tone(1800, 300, 0.3, 'square', 0.06);
}
