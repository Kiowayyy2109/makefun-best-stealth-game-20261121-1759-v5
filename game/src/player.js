// The thief: movement, sneak / run noise, shadow hiding and the two
// gadgets - a coin toss that pulls guards away and a smoke bomb that
// breaks every line of sight at once.

import { moveCircle, dist } from './geometry.js';
import { sfxFootstep } from './audio.js';

export function createPlayer(start) {
  return {
    x: start.x, y: start.y, r: 13,
    angle: -Math.PI / 2, walkPhase: 0, moving: false,
    sneaking: false, hidden: false, inShadow: false, litFactor: 1,
    coins: 3, smokes: 2, stepTimer: 0, noisePulse: 0,
  };
}

export function updatePlayer(p, dt, input, solids, level, fx) {
  let mx = 0, my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  p.sneaking = !!input.sneak;
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    const len = Math.sqrt(mx * mx + my * my);
    const speed = p.sneaking ? 78 : 168;
    const pos = { x: p.x, y: p.y };
    moveCircle(pos, (mx / len) * speed * dt, (my / len) * speed * dt, p.r, solids);
    p.x = pos.x; p.y = pos.y;
    p.angle = Math.atan2(my, mx);
    p.walkPhase += dt * (p.sneaking ? 5 : 10);
    p.stepTimer -= dt;
    if (p.stepTimer <= 0) {
      p.stepTimer = p.sneaking ? 0.42 : 0.27;
      sfxFootstep(p.sneaking);
      fx.push({ kind: 'puff', x: p.x, y: p.y + 8, t: 0, life: 0.5, vx: 0, vy: -6 });
      if (!p.sneaking) fx.push({ kind: 'noise', x: p.x, y: p.y, t: 0, life: 0.6, r: 92 });
    }
  }
  // Shadow pools hide a still or sneaking thief; bright lamps expose.
  p.inShadow = false;
  for (const s of level.shadows) {
    if (dist(p.x, p.y, s.x, s.y) < s.r) { p.inShadow = true; break; }
  }
  let lit = 0.75;
  for (const l of level.lights) {
    const d = dist(p.x, p.y, l.x, l.y);
    if (d < l.r) lit = Math.max(lit, 1.25 - (d / l.r) * 0.45);
  }
  p.litFactor = lit;
  const inSmoke = fx.some((f) => f.kind === 'smokecloud' && dist(p.x, p.y, f.x, f.y) < f.r);
  p.hidden = inSmoke || (p.inShadow && (p.sneaking || !p.moving));
  return !p.sneaking && p.moving ? 92 : 0; // noise radius emitted this frame
}

export function throwCoin(p, guards, fx, hearNoise, sfx) {
  if (p.coins <= 0) return false;
  p.coins -= 1;
  const lx = p.x + Math.cos(p.angle) * 150;
  const ly = p.y + Math.sin(p.angle) * 150;
  fx.push({ kind: 'coinping', x: lx, y: ly, t: 0, life: 1.1, r: 10 });
  hearNoise(guards, lx, ly, 130);
  sfx();
  return true;
}

export function dropSmoke(p, fx, sfx) {
  if (p.smokes <= 0) return false;
  p.smokes -= 1;
  fx.push({ kind: 'smokecloud', x: p.x, y: p.y, t: 0, life: 4.2, r: 64 });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    fx.push({
      kind: 'smoke', x: p.x, y: p.y, t: 0, life: 1.6 + (i % 5) * 0.22,
      vx: Math.cos(a) * (14 + (i % 4) * 7), vy: Math.sin(a) * (10 + (i % 3) * 6) - 8,
    });
  }
  sfx();
  return true;
}
