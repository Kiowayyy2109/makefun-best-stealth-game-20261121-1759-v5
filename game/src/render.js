// Rendering: themed floors, prop shadows, a darkness overlay pierced by
// lamp pools and vision cones, animated figures, HUD and minimap.

import { conePolygon, dist } from './geometry.js';
import { laserIsOn } from './guards.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 48;

let darkCanvas = null;
function darkCtx() {
  if (!darkCanvas) {
    darkCanvas = document.createElement('canvas');
    darkCanvas.width = VIEW_W; darkCanvas.height = VIEW_H;
  }
  return darkCanvas.getContext('2d');
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawFloor(ctx, level, time) {
  const t = level.theme;
  ctx.fillStyle = t.floorA;
  ctx.fillRect(0, HUD_H, VIEW_W, 672);
  const tile = 56;
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 23; x++) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillStyle = t.floorB;
      ctx.fillRect(x * tile, HUD_H + y * tile, tile, tile);
    }
  }
  ctx.strokeStyle = t.grout; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= 23; x++) { ctx.moveTo(x * tile, HUD_H); ctx.lineTo(x * tile, HUD_H + 672); }
  for (let y = 0; y <= 12; y++) { ctx.moveTo(0, HUD_H + y * tile); ctx.lineTo(VIEW_W, HUD_H + y * tile); }
  ctx.stroke(); ctx.globalAlpha = 1;
  if (t.floor === 'marble') {
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    for (let i = 0; i < 14; i++) {
      const bx = (i * 173) % 1200 + 30, by = HUD_H + (i * 97) % 620 + 20;
      ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + 30, by + 14, bx + 52, by - 10, bx + 84, by + 8); ctx.stroke();
    }
  }
  if (t.floor === 'rooftop') {
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = 0; y < 12; y++) { ctx.moveTo(0, HUD_H + y * 56 + 3); ctx.lineTo(VIEW_W, HUD_H + y * 56 + 3); }
    ctx.stroke(); ctx.lineWidth = 1;
  }
  if (t.floor === 'obsidian') {
    ctx.strokeStyle = 'rgba(160,180,255,0.07)';
    for (let i = 0; i < 10; i++) {
      const bx = (i * 211) % 1150 + 40, by = HUD_H + (i * 131) % 600 + 30;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 26, by + 18); ctx.lineTo(bx + 44, by + 12); ctx.stroke();
    }
  }
  for (const d of level.decor) {
    ctx.save();
    if (d.type === 'carpet' || d.type === 'rug') {
      ctx.fillStyle = t.carpet;
      rr(ctx, d.x, d.y + HUD_H, d.w, d.h, 6); ctx.fill();
      ctx.strokeStyle = t.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.65;
      rr(ctx, d.x + 6, d.y + HUD_H + 6, d.w - 12, d.h - 12, 4); ctx.stroke();
    } else if (d.type === 'grass') {
      ctx.fillStyle = '#3d6331';
      rr(ctx, d.x, d.y + HUD_H, d.w, d.h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(140,220,120,0.35)';
      for (let i = 0; i < 22; i++) {
        const gx = d.x + ((i * 37) % Math.max(10, d.w - 8)) + 4;
        const gy = d.y + HUD_H + ((i * 53) % Math.max(10, d.h - 8)) + 4;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 2, gy - 6); ctx.stroke();
      }
    }
    ctx.restore();
  }
  // Shadow pools read as deep soft shade on the floor itself.
  for (const s of level.shadows) {
    const g = ctx.createRadialGradient(s.x, s.y + HUD_H, 6, s.x, s.y + HUD_H, s.r);
    g.addColorStop(0, 'rgba(2,4,12,0.55)');
    g.addColorStop(1, 'rgba(2,4,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y + HUD_H, s.r, 0, 6.29); ctx.fill();
  }
  void time;
}

function drawProp(ctx, p, theme) {
  const y = p.y + HUD_H;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2 + 4, y + p.h - 2, p.w / 2, 7, 0, 0, 6.29); ctx.fill();
  if (p.type === 'crate') {
    ctx.fillStyle = '#8a6a42'; ctx.fillRect(p.x, y, p.w, p.h);
    ctx.strokeStyle = '#5f4726'; ctx.lineWidth = 3; ctx.strokeRect(p.x + 2, y + 2, p.w - 4, p.h - 4);
    ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y + p.h);
    ctx.moveTo(p.x + p.w, y); ctx.lineTo(p.x, y + p.h); ctx.stroke();
  } else if (p.type === 'desk') {
    ctx.fillStyle = '#6d4c2f'; ctx.fillRect(p.x, y, p.w, p.h);
    ctx.fillStyle = '#86603c'; ctx.fillRect(p.x + 4, y + 4, p.w - 8, p.h - 8);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(p.x + 12, y + 9, 22, 15);
    ctx.fillStyle = theme.accent; ctx.fillRect(p.x + p.w - 26, y + 10, 12, 12);
  } else if (p.type === 'shelf') {
    ctx.fillStyle = '#4c3a24'; ctx.fillRect(p.x, y, p.w, p.h);
    const cols = ['#a33', '#3a6ea5', '#c9a227', '#4a7c59', '#7a4a8c'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(p.x + 6 + i * ((p.w - 12) / 6), y + 6, (p.w - 12) / 6 - 3, p.h - 12);
    }
  } else if (p.type === 'statue') {
    ctx.fillStyle = '#9aa2ae'; ctx.fillRect(p.x + 6, y + p.h - 12, p.w - 12, 12);
    ctx.beginPath(); ctx.arc(p.x + p.w / 2, y + 16, 10, 0, 6.29); ctx.fill();
    ctx.fillRect(p.x + p.w / 2 - 8, y + 24, 16, p.h - 36);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(p.x + p.w / 2 - 3, y + 13, 3.5, 0, 6.29); ctx.fill();
  } else if (p.type === 'plant') {
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(p.x + p.w / 2 - 9, y + p.h - 14, 18, 14);
    ctx.fillStyle = '#2e6b34';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.28 + 0.4;
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2 + Math.cos(a) * 10, y + p.h - 20 + Math.sin(a) * 6, 11, 6, a, 0, 6.29);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#777'; ctx.fillRect(p.x, y, p.w, p.h);
  }
}

function drawWalls(ctx, level) {
  const t = level.theme;
  for (const s of level.solids) {
    if (s.kind && s.kind !== 'wall') { drawProp(ctx, s, t); continue; }
    const y = s.y + HUD_H;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(s.x + 4, y + 5, s.w, s.h);
    ctx.fillStyle = t.wall; ctx.fillRect(s.x, y, s.w, s.h);
    ctx.fillStyle = t.wallTop; ctx.fillRect(s.x, y, s.w, Math.min(7, s.h));
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(s.x, y, Math.min(4, s.w), s.h);
  }
}

function drawRelicsAndExit(ctx, S) {
  const { level, time } = S;
  const ex = level.exit;
  const open = S.relicsTaken >= 3;
  const ey = ex.y + HUD_H;
  ctx.save();
  if (open) {
    const pulse = 0.6 + Math.sin(time * 4) * 0.25;
    const g = ctx.createRadialGradient(ex.x + ex.w / 2, ey + ex.h / 2, 6, ex.x + ex.w / 2, ey + ex.h / 2, 90);
    g.addColorStop(0, 'rgba(90,255,170,' + (0.5 * pulse + 0.3) + ')');
    g.addColorStop(1, 'rgba(90,255,170,0)');
    ctx.fillStyle = g; ctx.fillRect(ex.x - 50, ey - 40, ex.w + 100, ex.h + 80);
  }
  ctx.fillStyle = open ? '#1d5c3d' : '#333a44';
  rr(ctx, ex.x, ey, ex.w, ex.h, 5); ctx.fill();
  ctx.strokeStyle = open ? '#5affaa' : '#69707c'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = open ? '#bfffd9' : '#9aa2ae';
  ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex.x + ex.w / 2, ey + ex.h / 2 - 2);
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(open ? 'OPEN' : S.relicsTaken + ' / 3', ex.x + ex.w / 2, ey + ex.h / 2 + 14);
  ctx.restore();
  for (const r of level.relics) {
    if (r.taken) continue;
    const ry = r.y + HUD_H;
    const bob = Math.sin(time * 2.4 + r.x) * 3;
    const shimmer = 0.75 + Math.sin(time * 3.5 + r.y) * 0.25;
    const g = ctx.createRadialGradient(r.x, ry + bob, 2, r.x, ry + bob, 30);
    g.addColorStop(0, 'rgba(255,225,120,' + 0.55 * shimmer + ')');
    g.addColorStop(1, 'rgba(255,225,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(r.x, ry + bob, 30, 0, 6.29); ctx.fill();
    ctx.save();
    ctx.translate(r.x, ry + bob); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd94d'; ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(-4.5, -4.5, 9, 9);
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(r.x, ry + 14, 10, 3.5, 0, 0, 6.29); ctx.fill();
  }
}

function drawLasers(ctx, S) {
  const { level, time } = S;
  for (const lz of level.lasers) {
    ctx.fillStyle = '#22242c';
    ctx.beginPath(); ctx.arc(lz.x1, lz.y1 + HUD_H, 6, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.arc(lz.x2, lz.y2 + HUD_H, 6, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#ff5468';
    ctx.beginPath(); ctx.arc(lz.x1, lz.y1 + HUD_H, 2.5, 0, 6.29); ctx.fill();
    ctx.beginPath(); ctx.arc(lz.x2, lz.y2 + HUD_H, 2.5, 0, 6.29); ctx.fill();
    if (!laserIsOn(lz, time)) continue;
    const flick = 0.8 + Math.sin(time * 40 + lz.x1) * 0.2;
    ctx.strokeStyle = 'rgba(255,40,70,' + 0.28 * flick + ')'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(lz.x1, lz.y1 + HUD_H); ctx.lineTo(lz.x2, lz.y2 + HUD_H); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,90,110,' + 0.95 * flick + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lz.x1, lz.y1 + HUD_H); ctx.lineTo(lz.x2, lz.y2 + HUD_H); ctx.stroke();
  }
}

function drawDarkness(ctx, S) {
  const { level, guards, cameras, player, time } = S;
  const d = darkCtx();
  d.clearRect(0, 0, VIEW_W, VIEW_H);
  const alarmTint = S.alarm.active ? 0.06 + Math.sin(time * 6) * 0.03 : 0;
  d.fillStyle = 'rgba(3,5,14,' + (S.shotMode ? 0.66 : 0.72) + ')';
  d.fillRect(0, HUD_H, VIEW_W, 672);
  if (alarmTint > 0) { d.fillStyle = 'rgba(200,20,30,' + alarmTint + ')'; d.fillRect(0, HUD_H, VIEW_W, 672); }
  d.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, strength) => {
    const g = d.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,' + strength + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g; d.beginPath(); d.arc(x, y, r, 0, 6.29); d.fill();
  };
  for (const l of level.lights) {
    const fl = l.flicker ? 0.92 + Math.sin(time * 11 + l.x * 0.7) * 0.08 : 1;
    hole(l.x, l.y + HUD_H, l.r * fl, 0.88);
  }
  for (const g of guards) {
    if (!g.conePts) continue;
    d.beginPath();
    d.moveTo(g.conePts[0][0], g.conePts[0][1] + HUD_H);
    for (let i = 1; i < g.conePts.length; i++) d.lineTo(g.conePts[i][0], g.conePts[i][1] + HUD_H);
    d.closePath();
    d.fillStyle = 'rgba(0,0,0,0.55)'; d.fill();
  }
  for (const c of cameras) {
    if (!c.conePts) continue;
    d.beginPath();
    d.moveTo(c.conePts[0][0], c.conePts[0][1] + HUD_H);
    for (let i = 1; i < c.conePts.length; i++) d.lineTo(c.conePts[i][0], c.conePts[i][1] + HUD_H);
    d.closePath();
    d.fillStyle = 'rgba(0,0,0,0.45)'; d.fill();
  }
  hole(player.x, player.y + HUD_H, 58, 0.8);
  if (S.relicsTaken >= 3) hole(level.exit.x + level.exit.w / 2, level.exit.y + HUD_H + level.exit.h / 2, 80, 0.6);
  d.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCanvas, 0, 0);
  // Warm lamp glows above the dark.
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const l of level.lights) {
    const fl = l.flicker ? 0.9 + Math.sin(time * 11 + l.x * 0.7) * 0.1 : 1;
    const g = ctx.createRadialGradient(l.x, l.y + HUD_H, 2, l.x, l.y + HUD_H, l.r * fl);
    g.addColorStop(0, 'rgba(' + l.color + ',0.20)');
    g.addColorStop(1, 'rgba(' + l.color + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, l.y + HUD_H, l.r * fl, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.9)';
    ctx.beginPath(); ctx.arc(l.x, l.y + HUD_H, 3, 0, 6.29); ctx.fill();
  }
  ctx.restore();
}

function drawConeTints(ctx, S) {
  const { guards, cameras } = S;
  const paint = (pts, alertLevel) => {
    if (!pts) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] + HUD_H);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + HUD_H);
    ctx.closePath();
    const cx = pts[0][0], cy = pts[0][1] + HUD_H;
    let far = pts[pts.length - 1];
    const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(60, dist(cx, cy, far[0], far[1] + HUD_H)));
    if (alertLevel >= 1) { g.addColorStop(0, 'rgba(255,60,50,0.42)'); g.addColorStop(1, 'rgba(255,60,50,0.05)'); }
    else if (alertLevel >= 0.35) { g.addColorStop(0, 'rgba(255,170,40,0.40)'); g.addColorStop(1, 'rgba(255,170,40,0.05)'); }
    else { g.addColorStop(0, 'rgba(255,236,170,0.30)'); g.addColorStop(1, 'rgba(255,236,170,0.03)'); }
    ctx.fillStyle = g; ctx.fill();
  };
  for (const g of guards) paint(g.conePts, g.suspicion);
  for (const c of cameras) paint(c.conePts, c.meter);
}

function drawGuardFigure(ctx, g, time) {
  const y = g.y + HUD_H;
  const bob = g.moving ? Math.sin(g.walkPhase) * 2.2 : Math.sin(time * 2 + g.sentryPhase) * 0.7;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(g.x, y + 13, 13, 4.5, 0, 0, 6.29); ctx.fill();
  const swing = g.moving ? Math.sin(g.walkPhase) * 6 : 0;
  ctx.strokeStyle = '#23232e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(g.x, y + 4); ctx.lineTo(g.x + swing, y + 13);
  ctx.moveTo(g.x, y + 4); ctx.lineTo(g.x - swing, y + 13);
  ctx.stroke();
  const uniform = g.type === 'heavy' ? '#7a2430' : g.type === 'scout' ? '#2c5d8a' : g.type === 'sentry' ? '#5d4a8a' : '#8a2f3a';
  ctx.fillStyle = uniform;
  ctx.beginPath(); ctx.arc(g.x, y + bob * 0.4, g.type === 'heavy' ? 14 : 12, 0, 6.29); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2; ctx.stroke();
  // Facing wedge + cap.
  const fx = Math.cos(g.angle), fy = Math.sin(g.angle);
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(g.x + fx * 5, y + bob * 0.4 + fy * 5, 6, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#1d1d26';
  ctx.beginPath(); ctx.arc(g.x + fx * 4, y + bob * 0.4 + fy * 4, 6.4, g.angle - 2.4, g.angle + 2.4); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(g.x - 2 + fx * 11, y + bob * 0.4 - 2 + fy * 11, 4, 4);
  // State marker.
  if (g.state === 'chase' || g.suspicion >= 1) {
    ctx.fillStyle = '#ff4040'; ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', g.x, y - 20 + Math.sin(time * 10) * 2);
  } else if (g.state === 'wary' || g.suspicion >= 0.35) {
    ctx.fillStyle = '#ffb02e'; ctx.font = 'bold 19px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('?', g.x, y - 19);
  }
  if (g.suspicion > 0.03 && g.suspicion < 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(g.x - 14, y - 32, 28, 5);
    ctx.fillStyle = g.suspicion >= 0.35 ? '#ffb02e' : '#ffe9a3';
    ctx.fillRect(g.x - 13, y - 31, 26 * g.suspicion, 3);
  }
}

function drawPlayerFigure(ctx, p, time) {
  const y = p.y + HUD_H;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(p.x, y + 13, 12, 4.5, 0, 0, 6.29); ctx.fill();
  const swing = p.moving ? Math.sin(p.walkPhase) * (p.sneaking ? 3.5 : 6.5) : 0;
  ctx.strokeStyle = '#101018'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, y + 4); ctx.lineTo(p.x + swing, y + 13);
  ctx.moveTo(p.x, y + 4); ctx.lineTo(p.x - swing, y + 13);
  ctx.stroke();
  const crouch = p.sneaking ? 3 : 0;
  // Cloak: a tapered violet robe that flares when running.
  const flare = p.moving && !p.sneaking ? 4 : 1;
  ctx.fillStyle = p.hidden ? 'rgba(88,70,160,0.75)' : '#5a48b0';
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.angle) * 11, y + crouch + Math.sin(p.angle) * 11);
  ctx.quadraticCurveTo(p.x + 12 + flare, y + 8 + crouch, p.x - Math.cos(p.angle) * 13, y + 12 + crouch - Math.sin(p.angle) * 4);
  ctx.quadraticCurveTo(p.x - 12 - flare, y + 8 + crouch, p.x + Math.cos(p.angle) * 11, y + crouch + Math.sin(p.angle) * 11);
  ctx.fill();
  ctx.strokeStyle = '#2c2060'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.angle) * 5, y + crouch - 2 + Math.sin(p.angle) * 5, 5.6, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#241a4d';
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.angle) * 4, y + crouch - 3 + Math.sin(p.angle) * 4, 6, p.angle - 2.6, p.angle + 2.6); ctx.fill();
  if (p.hidden) {
    ctx.fillStyle = 'rgba(160,190,255,0.9)'; ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, y - 16);
  }
  void time;
}

function drawCameras(ctx, S) {
  for (const c of S.cameras) {
    const y = c.y + HUD_H;
    ctx.fillStyle = '#14141c'; ctx.beginPath(); ctx.arc(c.x, y, 9, 0, 6.29); ctx.fill();
    ctx.strokeStyle = '#8a93a5'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = c.meter > 0.05 ? '#ff4040' : '#57e6a9';
    ctx.beginPath(); ctx.arc(c.x + Math.cos(c.angle) * 4, y + Math.sin(c.angle) * 4, 3, 0, 6.29); ctx.fill();
    if (c.meter > 0.03) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(c.x - 13, y - 22, 26, 5);
      ctx.fillStyle = '#ff5468'; ctx.fillRect(c.x - 12, y - 21, 24 * c.meter, 3);
    }
  }
}

function drawFx(ctx, S) {
  for (const f of S.fx) {
    const k = f.t / f.life;
    if (f.kind === 'puff') {
      ctx.fillStyle = 'rgba(220,220,230,' + 0.35 * (1 - k) + ')';
      ctx.beginPath(); ctx.arc(f.x, f.y + HUD_H + f.vy * k, 4 + k * 6, 0, 6.29); ctx.fill();
    } else if (f.kind === 'noise') {
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.35 * (1 - k) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y + HUD_H, f.r * k, 0, 6.29); ctx.stroke();
    } else if (f.kind === 'coinping') {
      ctx.strokeStyle = 'rgba(255,220,90,' + 0.8 * (1 - k) + ')'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(f.x, f.y + HUD_H, 8 + k * 60, 0, 6.29); ctx.stroke();
      ctx.fillStyle = '#ffd94d'; ctx.beginPath(); ctx.arc(f.x, f.y + HUD_H, 4, 0, 6.29); ctx.fill();
    } else if (f.kind === 'sparkle') {
      ctx.fillStyle = 'rgba(255,235,150,' + (1 - k) + ')';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.28 + f.t * 3;
        ctx.fillRect(f.x + Math.cos(a) * k * 26 - 2, f.y + HUD_H + Math.sin(a) * k * 26 - 2, 4, 4);
      }
    } else if (f.kind === 'smoke') {
      ctx.fillStyle = 'rgba(200,205,220,' + 0.30 * (1 - k) + ')';
      ctx.beginPath(); ctx.arc(f.x + f.vx * f.t, f.y + HUD_H + f.vy * f.t, 10 + k * 22, 0, 6.29); ctx.fill();
    } else if (f.kind === 'smokecloud') {
      ctx.fillStyle = 'rgba(195,200,215,' + 0.20 * Math.min(1, (1 - k) * 3) + ')';
      ctx.beginPath(); ctx.arc(f.x, f.y + HUD_H, f.r, 0, 6.29); ctx.fill();
    }
  }
  // Drifting dust motes catch the lamplight.
  ctx.fillStyle = 'rgba(255,244,200,0.35)';
  for (const m of S.motes) {
    const mx = (m.x + S.time * m.drift) % VIEW_W;
    const my = HUD_H + ((m.y + Math.sin(S.time * 0.6 + m.phase) * 8 + 672) % 672);
    ctx.fillRect(mx, my, 2, 2);
  }
}

export function drawWorld(ctx, S) {
  drawFloor(ctx, S.level, S.time);
  drawRelicsAndExit(ctx, S);
  drawWalls(ctx, S.level);
  drawLasers(ctx, S);
  drawDarkness(ctx, S);
  drawConeTints(ctx, S);
  for (const g of S.guards) drawGuardFigure(ctx, g, S.time);
  drawCameras(ctx, S);
  drawPlayerFigure(ctx, S.player, S.time);
  drawFx(ctx, S);
  if (S.alarm.active) {
    ctx.strokeStyle = 'rgba(255,40,50,' + (0.35 + Math.sin(S.time * 6) * 0.2) + ')';
    ctx.lineWidth = 6; ctx.strokeRect(3, HUD_H + 3, VIEW_W - 6, 666);
  }
}

export function drawMinimap(ctx, S) {
  const mw = 188, mh = 100, mx = VIEW_W - mw - 12, my = HUD_H + 10;
  ctx.fillStyle = 'rgba(8,10,20,0.82)';
  rr(ctx, mx, my, mw, mh, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  const sx = mw / 1280, sy = mh / 672;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (const s of S.level.solids) ctx.fillRect(mx + s.x * sx, my + s.y * sy, Math.max(2, s.w * sx), Math.max(2, s.h * sy));
  for (const r of S.level.relics) {
    if (r.taken) continue;
    ctx.fillStyle = '#ffd94d'; ctx.fillRect(mx + r.x * sx - 2, my + r.y * sy - 2, 4, 4);
  }
  ctx.fillStyle = S.relicsTaken >= 3 ? '#5affaa' : '#69707c';
  ctx.fillRect(mx + S.level.exit.x * sx, my + S.level.exit.y * sy, Math.max(4, S.level.exit.w * sx), Math.max(4, S.level.exit.h * sy));
  for (const g of S.guards) {
    ctx.fillStyle = g.suspicion >= 1 ? '#ff4040' : g.suspicion >= 0.35 ? '#ffb02e' : '#e8e8f0';
    ctx.beginPath(); ctx.arc(mx + g.x * sx, my + g.y * sy, 2.6, 0, 6.29); ctx.fill();
  }
  ctx.fillStyle = '#8f7bff';
  ctx.beginPath(); ctx.arc(mx + S.player.x * sx, my + S.player.y * sy, 3.2, 0, 6.29); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
}

export function drawHUD(ctx, S) {
  ctx.fillStyle = '#0b0d16'; ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e9e4d2'; ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('NIGHTSHADE', 16, 30);
  ctx.fillStyle = '#9aa2b5'; ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(S.level.theme.name + '  ·  LEVEL ' + S.level.id + ' / 6', 140, 30);
  // Relic pips.
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(400 + i * 26, 24); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = i < S.relicsTaken ? '#ffd94d' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }
  // Detection eye meter.
  const det = S.detection;
  ctx.fillStyle = '#9aa2b5'; ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('DETECTION', 500, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; rr(ctx, 500, 26, 170, 10, 5); ctx.fill();
  ctx.fillStyle = det >= 1 ? '#ff4040' : det >= 0.35 ? '#ffb02e' : '#ffe9a3';
  if (det > 0.01) { rr(ctx, 500, 26, 170 * Math.min(1, det), 10, 5); ctx.fill(); }
  ctx.fillStyle = S.alarm.active ? '#ff5468' : '#9aa2b5';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(S.alarm.active ? '!! ALARM !!' : S.stateLabel, 690, 30);
  ctx.fillStyle = '#e9e4d2'; ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('SCORE ' + S.score, 1030, 30);
  ctx.fillStyle = '#9aa2b5'; ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('COIN(Q) ' + S.player.coins + '   SMOKE(F) ' + S.player.smokes + (S.muted ? '   MUTED' : ''), 1264, 30);
  ctx.textAlign = 'left';
}
