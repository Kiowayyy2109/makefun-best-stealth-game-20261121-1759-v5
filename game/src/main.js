// Nightshade: Velvet Hour - a top-down stealth game in six themed rooms.
// State machine, alarm logic, gadgets, scoring, screens and the staged
// screenshot scenes (?shot=1..4) all live here; the other modules each
// own one job (levels, geometry, guards, player, audio, render, input).

import { LEVELS, WORLD_W } from './levels.js';
import { conePolygon, dist, segmentPointDistance, makeRng, pointInRect } from './geometry.js';
import { createGuard, createCamera, updateGuard, updateCamera, hearNoise, laserIsOn } from './guards.js';
import { createPlayer, updatePlayer, throwCoin, dropSmoke } from './player.js';
import { createInput } from './input.js';
import * as SFX from './audio.js';
import { drawWorld, drawMinimap, drawHUD, VIEW_W, VIEW_H, HUD_H } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotParam = parseInt(params.get('shot') || '0', 10);
const SHOT_MODE = shotParam >= 1 && shotParam <= 4;
const FIXED_TIME = 2.35;

const S = {
  screen: SHOT_MODE ? 'playing' : 'title',
  levelIndex: 0, level: null, solids: [],
  player: null, guards: [], cameras: [], fx: [], motes: [],
  relicsTaken: 0, score: 0, detection: 0,
  alarm: { active: false, t: 0, x: 0, y: 0 },
  time: 0, levelTime: 0, fade: 0, fading: 0,
  spotted: false, alarmed: false, lastRating: '',
  muted: false, paused: false, stateLabel: 'UNSEEN',
  message: '', messageT: 0, totalRatings: [],
};
window.__NS = S;

function buildMotes(seed) {
  const rng = makeRng(seed);
  const motes = [];
  for (let i = 0; i < 42; i++) {
    motes.push({ x: rng() * WORLD_W, y: rng() * 672, drift: 4 + rng() * 9, phase: rng() * 6.28 });
  }
  return motes;
}

function loadLevel(index) {
  const def = LEVELS[index];
  S.levelIndex = index;
  S.level = JSON.parse(JSON.stringify(def));
  S.level.solids = S.level.walls.concat(S.level.props);
  S.solids = S.level.solids;
  S.player = createPlayer(S.level.playerStart);
  S.guards = def.guards.map(createGuard);
  S.cameras = def.cameras.map(createCamera);
  S.fx = [];
  S.motes = buildMotes(1234 + index * 777);
  S.relicsTaken = 0;
  S.levelTime = 0;
  S.alarm = { active: false, t: 0, x: 0, y: 0 };
  S.spotted = false; S.alarmed = false;
  S.detection = 0;
  S.fade = 1; S.fading = -1;
  S.screen = 'briefing';
  if (SHOT_MODE) S.screen = 'playing';
}

function solidsWithSmoke() { return S.solids; }

function raiseAlarm(x, y) {
  if (!S.alarm.active) SFX.sfxAlarmSting();
  S.alarm.active = true; S.alarm.t = 7;
  S.alarm.x = x; S.alarm.y = y;
  S.alarmed = true;
}

function updateCones() {
  for (const g of S.guards) {
    g.conePts = conePolygon(g.x, g.y, g.angle, g.cfg.halfFov, g.cfg.range, S.solids, 20);
  }
  for (const c of S.cameras) {
    c.conePts = conePolygon(c.x, c.y, c.angle, 0.42, c.range, S.solids, 16);
  }
}

function stepGame(dt) {
  S.levelTime += dt;
  const events = [];
  const world = { player: S.player, solids: S.solids, time: S.time, events, alarm: S.alarm };

  const noiseR = updatePlayer(S.player, dt, input, S.solids, S.level, S.fx);
  if (noiseR > 0 && Math.random() < dt * 8) hearNoise(S.guards, S.player.x, S.player.y, 10);

  for (const g of S.guards) updateGuard(g, dt, world);
  for (const c of S.cameras) updateCamera(c, dt, world, S.time);

  for (const ev of events) {
    if (ev === 'alarm') raiseAlarm(S.player.x, S.player.y);
    if (ev === 'wary') { S.spotted = true; SFX.sfxWary(); }
    if (ev === 'caught') { onCaught(); return; }
  }

  // Cameras and chases refresh the alarm position.
  if (S.guards.some((g) => g.state === 'chase')) {
    S.alarm.x = S.player.x; S.alarm.y = S.player.y;
    if (!S.alarm.active) raiseAlarm(S.player.x, S.player.y);
    S.alarm.t = Math.max(S.alarm.t, 2);
  }
  if (S.alarm.active) {
    const anySee = S.guards.some((g) => g.seesPlayer) || S.cameras.some((c) => c.seesPlayer);
    if (!anySee) {
      S.alarm.t -= dt;
      if (S.alarm.t <= 0) { S.alarm.active = false; showMessage('The alarm fades. Guards are searching.'); }
    } else S.alarm.t = 7;
  }

  // Laser grids.
  for (const lz of S.level.lasers) {
    if (!laserIsOn(lz, S.time)) { lz.tripped = false; continue; }
    const d = segmentPointDistance(S.player.x, S.player.y, lz.x1, lz.y1, lz.x2, lz.y2);
    if (d < 13 && !lz.tripped) {
      lz.tripped = true;
      SFX.sfxLaserTrip();
      raiseAlarm(S.player.x, S.player.y);
      hearNoise(S.guards, S.player.x, S.player.y, 400);
      showMessage('Laser tripped!');
    }
  }

  // Relic pickup.
  for (const r of S.level.relics) {
    if (!r.taken && dist(S.player.x, S.player.y, r.x, r.y) < 24) {
      r.taken = true; S.relicsTaken += 1; S.score += 300;
      SFX.sfxPickup();
      S.fx.push({ kind: 'sparkle', x: r.x, y: r.y, t: 0, life: 0.7 });
      showMessage(r.name + ' taken  (' + S.relicsTaken + ' / 3)');
      if (S.relicsTaken === 3) { SFX.sfxExitOpen(); showMessage('All relics taken - the EXIT is open!'); }
    }
  }

  // Exit.
  if (S.relicsTaken >= 3 && pointInRect(S.player.x, S.player.y, S.level.exit)) {
    onLevelClear();
    return;
  }

  S.detection = Math.max(0, ...S.guards.map((g) => g.suspicion), ...S.cameras.map((c) => c.meter));
  if (S.guards.some((g) => g.state === 'chase')) S.stateLabel = 'HUNTED';
  else if (S.alarm.active) S.stateLabel = 'ALARM';
  else if (S.detection >= 0.35) S.stateLabel = 'SPOTTED?';
  else if (S.guards.some((g) => g.state === 'search')) S.stateLabel = 'SEARCHING';
  else S.stateLabel = S.player.hidden ? 'HIDDEN' : 'UNSEEN';

  // FX ageing.
  for (const f of S.fx) f.t += dt;
  S.fx = S.fx.filter((f) => f.t < f.life);
  if (S.messageT > 0) S.messageT -= dt;
  updateCones();
}

function showMessage(text) { S.message = text; S.messageT = 3.2; }

function ratingForLevel() {
  if (!S.alarmed && !S.spotted) return 'GHOST';
  if (!S.alarmed) return 'SILENT';
  return 'SHADOW';
}

function onLevelClear() {
  const rating = ratingForLevel();
  S.lastRating = rating;
  S.totalRatings.push(rating);
  let gain = 500;
  if (rating === 'GHOST') gain += 400;
  if (rating === 'SILENT') gain += 200;
  gain += Math.max(0, Math.round(300 - S.levelTime * 2));
  S.score += gain;
  S.lastGain = gain;
  SFX.sfxExitOpen();
  S.screen = S.levelIndex >= LEVELS.length - 1 ? 'win' : 'levelclear';
  if (S.screen === 'win') SFX.sfxWin();
}

function onCaught() {
  SFX.sfxCaught();
  S.score = Math.max(0, S.score - 150);
  S.screen = 'caught';
}

function startLevel(index) {
  loadLevel(index);
  S.screen = 'briefing';
}

// ---------- screenshot staging ----------
function stageShot(n) {
  if (n === 1) {
    loadLevel(1); // Crimson Vault under full alarm.
    S.player.x = 640; S.player.y = 336; S.player.angle = -0.6;
    S.relicsTaken = 2; S.level.relics[0].taken = true; S.level.relics[2].taken = true;
    S.alarm.active = true; S.alarm.t = 7; S.alarmed = true; S.detection = 1;
    S.stateLabel = 'ALARM';
    const spots = [[470, 250, 0.5], [810, 260, 2.6], [520, 450, -0.7], [790, 440, -2.4]];
    S.guards.forEach((g, i) => {
      const s = spots[i % spots.length];
      g.x = s[0]; g.y = s[1]; g.angle = Math.atan2(S.player.y - g.y, S.player.x - g.x);
      g.suspicion = 1; g.state = 'chase';
    });
    S.fx.push({ kind: 'smokecloud', x: 585, y: 300, t: 0.6, life: 4.2, r: 64 });
    for (let i = 0; i < 10; i++) {
      S.fx.push({ kind: 'smoke', x: 585, y: 300, t: 0.4, life: 2.2, vx: (i - 5) * 6, vy: -8 - (i % 3) * 5 });
    }
    S.score = 1450;
  } else if (n === 2) {
    loadLevel(0); // Marble Gallery near-miss.
    S.player.x = 505; S.player.y = 268; S.player.angle = 2.8; S.player.sneaking = true;
    const g = S.guards[0];
    g.x = 350; g.y = 300; g.angle = 0.35; g.suspicion = 0.62; g.state = 'wary';
    S.detection = 0.62; S.stateLabel = 'SPOTTED?'; S.spotted = true;
    S.score = 300;
  } else if (n === 3) {
    loadLevel(3); // Obsidian Vault shadow sneak.
    S.player.x = 680; S.player.y = 420; S.player.angle = 0.4;
    S.player.sneaking = true; S.player.inShadow = true; S.player.hidden = true;
    S.relicsTaken = 1; S.level.relics[1].taken = true;
    S.stateLabel = 'HIDDEN'; S.score = 800;
  } else if (n === 4) {
    loadLevel(4); // Rooftop Garden, exit open.
    S.player.x = 1120; S.player.y = 520; S.player.angle = 0.7;
    S.relicsTaken = 3; S.level.relics.forEach((r) => { r.taken = true; });
    S.stateLabel = 'UNSEEN'; S.score = 2300;
    showMessage('All relics taken - the EXIT is open!');
  }
  S.screen = 'playing';
  updateCones();
}

// ---------- screens ----------
function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(8,9,18,0.88)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(201,162,39,0.7)'; ctx.lineWidth = 2; ctx.stroke();
}
function centered(text, y, font, color) {
  ctx.fillStyle = color || '#e9e4d2';
  ctx.font = font; ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, y);
}

function drawScreens() {
  if (S.screen === 'playing') {
    if (S.paused) {
      ctx.fillStyle = 'rgba(3,4,10,0.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      centered('PAUSED', 330, 'bold 44px system-ui, sans-serif');
      centered('P or Esc to resume  ·  R restart  ·  M mute', 380, '16px system-ui, sans-serif', '#9aa2b5');
    }
    return;
  }
  if (S.screen === 'title') {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#07060f'); g.addColorStop(0.6, '#141126'); g.addColorStop(1, '#07060f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save(); ctx.globalAlpha = 0.5; drawWorld(ctx, S); ctx.restore();
    ctx.fillStyle = 'rgba(4,4,12,0.55)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    centered('N I G H T S H A D E', 250, 'bold 84px Georgia, serif', '#e9d98a');
    centered('—  V E L V E T   H O U R  —', 300, '22px Georgia, serif', '#b7a6e8');
    centered('Six rooms. Eighteen relics. One thief the dark remembers.', 360, '18px system-ui, sans-serif', '#cfd4e2');
    centered('Sneak in shadow, toss coins, vanish in smoke - and never be seen.', 392, '16px system-ui, sans-serif', '#9aa2b5');
    panel(390, 440, 500, 118);
    centered('WASD / Arrows - move      SHIFT - sneak (silent)', 478, '15px system-ui, sans-serif');
    centered('Q - coin toss      F - smoke bomb      R - restart', 506, '15px system-ui, sans-serif');
    centered('P - pause      M - mute', 534, '15px system-ui, sans-serif');
    centered('Press ENTER to begin the heist', 610 + Math.sin(S.time * 3) * 3, 'bold 19px system-ui, sans-serif', '#ffd94d');
    return;
  }
  ctx.fillStyle = 'rgba(3,4,10,0.45)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (S.screen === 'briefing') {
    panel(340, 190, 600, 330);
    centered(S.level.theme.name, 252, 'bold 30px Georgia, serif', '#e9d98a');
    centered(S.level.sub, 284, '15px system-ui, sans-serif', '#9aa2b5');
    wrapText(S.level.brief, 640, 330, 520, 24, '16px system-ui, sans-serif', '#dfe3ee');
    centered('Collect 3 relics, then reach the EXIT unseen.', 428, '15px system-ui, sans-serif', '#b7a6e8');
    centered('Press ENTER to slip inside', 478, 'bold 17px system-ui, sans-serif', '#ffd94d');
  } else if (S.screen === 'levelclear') {
    panel(390, 220, 500, 280);
    centered('FLOOR CLEARED', 282, 'bold 32px Georgia, serif', '#5affaa');
    centered('Rating:  ' + S.lastRating, 336, 'bold 24px system-ui, sans-serif', '#ffd94d');
    centered(ratingLine(S.lastRating), 372, '15px system-ui, sans-serif', '#cfd4e2');
    centered('Bonus +' + S.lastGain + '    Total score ' + S.score, 412, '16px system-ui, sans-serif');
    centered('Press ENTER for the next floor', 462, 'bold 16px system-ui, sans-serif', '#ffd94d');
  } else if (S.screen === 'caught') {
    panel(390, 230, 500, 250);
    centered('CAUGHT', 292, 'bold 40px Georgia, serif', '#ff5468');
    centered('The guards drag you into the light.', 336, '16px system-ui, sans-serif', '#cfd4e2');
    centered('Score penalty -150. The relics are returned.', 368, '14px system-ui, sans-serif', '#9aa2b5');
    centered('Press ENTER to try this floor again', 428, 'bold 16px system-ui, sans-serif', '#ffd94d');
  } else if (S.screen === 'win') {
    panel(340, 190, 600, 340);
    centered('THE VAULT IS EMPTY', 252, 'bold 34px Georgia, serif', '#e9d98a');
    centered('Nightshade was never here.', 292, '17px system-ui, sans-serif', '#b7a6e8');
    centered('Final score:  ' + S.score, 344, 'bold 24px system-ui, sans-serif', '#ffd94d');
    centered('Floor ratings:  ' + S.totalRatings.join('  ·  '), 386, '15px system-ui, sans-serif', '#cfd4e2');
    const ghosts = S.totalRatings.filter((r) => r === 'GHOST').length;
    centered(ghosts >= 4 ? 'A perfect ghost. The museum will blame the wind.' : 'The night keeps your secret - mostly.', 424, '15px system-ui, sans-serif', '#9aa2b5');
    centered('Press ENTER to play again', 482, 'bold 16px system-ui, sans-serif', '#ffd94d');
  }
}

function ratingLine(r) {
  if (r === 'GHOST') return 'Never seen. Never suspected. A ghost.';
  if (r === 'SILENT') return 'Glimpsed once, but the alarm never sang.';
  return 'You got out - but they know your shadow now.';
}

function wrapText(text, cx, y, maxW, lh, font, color) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center';
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW && line) {
      ctx.fillText(line, cx, yy); yy += lh; line = '';
    }
    line += w + ' ';
  }
  if (line) ctx.fillText(line, cx, yy);
  return yy;
}

// ---------- input actions ----------
function onAction(action) {
  if (action === 'mute') {
    S.muted = !S.muted; SFX.setMuted(S.muted); return;
  }
  if (S.screen === 'title' && action === 'confirm') { SFX.sfxClick(); startLevel(0); return; }
  if (S.screen === 'briefing' && action === 'confirm') { S.screen = 'playing'; SFX.sfxClick(); return; }
  if (S.screen === 'levelclear' && action === 'confirm') { startLevel(S.levelIndex + 1); return; }
  if (S.screen === 'caught' && action === 'confirm') { startLevel(S.levelIndex); S.screen = 'playing'; return; }
  if (S.screen === 'win' && action === 'confirm') { S.score = 0; S.totalRatings = []; startLevel(0); return; }
  if (S.screen !== 'playing') return;
  if (action === 'pause') { S.paused = !S.paused; return; }
  if (action === 'restart') { startLevel(S.levelIndex); S.screen = 'playing'; return; }
  if (S.paused) return;
  if (action === 'coin') throwCoin(S.player, S.guards, S.fx, hearNoise, SFX.sfxCoin);
  if (action === 'smoke') dropSmoke(S.player, S.fx, SFX.sfxSmoke);
}
const input = createInput(onAction);
canvas.addEventListener('mousedown', () => {
  if (S.screen === 'playing' && !S.paused) onAction('confirm');
});

// ---------- boot & loop ----------
if (SHOT_MODE) stageShot(shotParam);
else { loadLevel(0); S.screen = 'title'; updateCones(); }

let last = performance.now();
function frame(now) {
  const rawDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const dt = SHOT_MODE ? 0 : rawDt;
  if (!SHOT_MODE) S.time += rawDt;
  else S.time = FIXED_TIME;
  if (S.screen === 'playing' && !S.paused && !SHOT_MODE) stepGame(rawDt);
  if (S.fade > 0 && S.fading < 0) S.fade = Math.max(0, S.fade - rawDt * 1.6);
  void dt;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawWorld(ctx, S);
  drawHUD(ctx, S);
  drawMinimap(ctx, S);
  drawScreens();
  if (S.screen === 'playing' && S.messageT > 0 && !SHOT_MODE || (SHOT_MODE && S.message)) {
    ctx.fillStyle = 'rgba(8,9,18,0.85)';
    const w = ctx.measureText(S.message).width + 36;
    ctx.beginPath(); ctx.roundRect((VIEW_W - w) / 2, VIEW_H - 52, Math.max(w, 260), 34, 8); ctx.fill();
    ctx.fillStyle = '#ffe9a3'; ctx.font = 'bold 14px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(S.message, VIEW_W / 2, VIEW_H - 30);
  }
  if (S.fade > 0) {
    ctx.fillStyle = 'rgba(2,2,8,' + S.fade + ')';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (SHOT_MODE && !window.__shotReady) window.__shotReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
