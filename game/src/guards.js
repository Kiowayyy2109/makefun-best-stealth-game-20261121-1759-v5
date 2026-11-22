// Guard brains: four patrol archetypes, a four-stage suspicion model
// (unaware -> wary -> chase -> search), cameras and laser grids.

import { angleDiff, dist, segmentBlocked, moveCircle } from './geometry.js';

export const GUARD_TYPES = {
  patroller: { range: 178, halfFov: 0.56, speed: 64, turn: 2.6, label: 'Patroller' },
  sentry: { range: 158, halfFov: 0.6, speed: 0, turn: 0.9, label: 'Sentry' },
  heavy: { range: 192, halfFov: 0.82, speed: 40, turn: 1.7, label: 'Heavy' },
  scout: { range: 156, halfFov: 0.4, speed: 108, turn: 3.6, label: 'Scout' },
};

export function createGuard(def) {
  const cfg = GUARD_TYPES[def.type];
  return {
    type: def.type, cfg,
    x: def.x, y: def.y, homeX: def.x, homeY: def.y,
    angle: def.angle, baseAngle: def.angle,
    waypoints: def.waypoints, wpIndex: 0, wpWait: 0,
    suspicion: 0, state: 'unaware',
    lastSeenX: 0, lastSeenY: 0, loseTimer: 0, searchTimer: 0,
    investigateX: null, investigateY: null,
    walkPhase: 0, moving: false, sentryPhase: Math.random() * 6.28,
    conePts: null, seesPlayer: false,
  };
}

export function createCamera(def) {
  return { ...def, meter: 0, tripped: false, seesPlayer: false, conePts: null };
}

export function playerVisibility(g, px, py, solids, hidden, litFactor) {
  const d = dist(g.x, g.y, px, py);
  if (d > g.cfg.range) return 0;
  const ang = Math.atan2(py - g.y, px - g.x);
  if (Math.abs(angleDiff(ang, g.angle)) > g.cfg.halfFov && d > 26) return 0;
  if (segmentBlocked(g.x, g.y, px, py, solids)) return 0;
  if (hidden) return 0;
  const closeness = 1 - d / g.cfg.range;
  return (0.35 + closeness * 1.5) * litFactor;
}

function turnToward(g, target, dt, rate) {
  const diff = angleDiff(target, g.angle);
  const step = (rate || g.cfg.turn) * dt;
  if (Math.abs(diff) <= step) g.angle = target;
  else g.angle += Math.sign(diff) * step;
  return Math.abs(diff) < 0.05;
}

function walkToward(g, tx, ty, dt, speedMul) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 6) { g.moving = false; return true; }
  const target = Math.atan2(ty - g.y, tx - g.x);
  turnToward(g, target, dt);
  const sp = g.cfg.speed * (speedMul || 1);
  const pos = { x: g.x, y: g.y };
  moveCircle(pos, Math.cos(g.angle) * sp * dt, Math.sin(g.angle) * sp * dt, 13, g._solids);
  g.x = pos.x; g.y = pos.y;
  g.moving = true; g.walkPhase += dt * sp * 0.11;
  return d < 14;
}

export function updateGuard(g, dt, world) {
  const { player, solids, time } = world;
  g._solids = solids;
  g.moving = false;
  const vis = playerVisibility(g, player.x, player.y, solids, player.hidden, player.litFactor);
  g.seesPlayer = vis > 0;

  if (g.state !== 'chase') {
    if (vis > 0) {
      const before = g.suspicion;
      g.suspicion = Math.min(1, g.suspicion + vis * dt);
      g.lastSeenX = player.x; g.lastSeenY = player.y;
      if (before < 0.35 && g.suspicion >= 0.35) world.events.push('wary');
      if (g.suspicion >= 1) {
        g.state = 'chase'; g.loseTimer = 0;
        world.events.push('alarm');
      } else if (g.suspicion >= 0.35) {
        g.state = 'wary';
        turnToward(g, Math.atan2(player.y - g.y, player.x - g.x), dt, 3.2);
      }
    } else {
      const decay = g.state === 'wary' ? 0.22 : 0.3;
      g.suspicion = Math.max(0, g.suspicion - decay * dt);
      if (g.state === 'wary' && g.suspicion <= 0.05) g.state = 'unaware';
    }
  }

  if (g.state === 'chase') {
    if (vis > 0) {
      g.lastSeenX = player.x; g.lastSeenY = player.y; g.loseTimer = 0;
      g.suspicion = 1;
    } else {
      g.loseTimer += dt;
      if (g.loseTimer > 3.2) {
        g.state = 'search'; g.searchTimer = 4.5; g.suspicion = 0.7;
        world.events.push('search');
      }
    }
    if (g.state === 'chase') {
      walkToward(g, g.lastSeenX, g.lastSeenY, dt, 1.55);
      if (dist(g.x, g.y, player.x, player.y) < 26 && !player.hidden) {
        world.events.push('caught');
      }
      return;
    }
  }

  if (g.state === 'search') {
    const arrived = walkToward(g, g.lastSeenX, g.lastSeenY, dt, 1.15);
    if (arrived) {
      g.searchTimer -= dt;
      g.angle += Math.sin(time * 1.7 + g.sentryPhase) * dt * 1.4;
      if (g.searchTimer <= 0) { g.state = 'return'; g.suspicion = 0.25; }
    }
    return;
  }

  if (world.alarm.active && g.state !== 'wary') {
    walkToward(g, world.alarm.x, world.alarm.y, dt, 1.3);
    return;
  }

  if (g.investigateX !== null && g.state !== 'wary') {
    const arrived = walkToward(g, g.investigateX, g.investigateY, dt, 1.1);
    if (arrived) {
      g.angle += Math.sin(time * 2 + g.sentryPhase) * dt * 1.2;
      g._investigateWait = (g._investigateWait || 0) + dt;
      if (g._investigateWait > 1.6) { g.investigateX = null; g._investigateWait = 0; g.state = 'return'; }
    }
    return;
  }

  if (g.state === 'return') {
    let tx = g.homeX, ty = g.homeY;
    if (g.waypoints) { const wp = g.waypoints[g.wpIndex]; tx = wp[0]; ty = wp[1]; }
    if (walkToward(g, tx, ty, dt, 1)) g.state = 'unaware';
    return;
  }

  // Idle behaviour per archetype.
  if (g.type === 'sentry') {
    g.angle = g.baseAngle + Math.sin(time * 0.55 + g.sentryPhase) * 1.05;
  } else if (g.waypoints) {
    if (g.wpWait > 0) {
      g.wpWait -= dt;
      g.angle += Math.sin(time * 1.3 + g.sentryPhase) * dt * 0.5;
    } else {
      const wp = g.waypoints[g.wpIndex];
      if (walkToward(g, wp[0], wp[1], dt, 1)) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        g.wpWait = 0.9;
      }
    }
  } else {
    g.angle += Math.sin(time * 0.4 + g.sentryPhase) * dt * 0.6;
  }
}

export function hearNoise(guards, x, y, radius) {
  for (const g of guards) {
    if (g.state === 'chase') continue;
    if (dist(g.x, g.y, x, y) < radius + 120) {
      g.investigateX = x; g.investigateY = y;
      g.suspicion = Math.max(g.suspicion, 0.45);
      if (g.state === 'unaware') g.state = 'wary';
    }
  }
}

export function updateCamera(cam, dt, world, time) {
  cam.angle = cam.base + Math.sin(time * 0.5) * cam.sweep;
  const { player, solids } = world;
  let vis = 0;
  const d = dist(cam.x, cam.y, player.x, player.y);
  if (d < cam.range && !player.hidden) {
    const ang = Math.atan2(player.y - cam.y, player.x - cam.x);
    if (Math.abs(angleDiff(ang, cam.angle)) < 0.42 &&
        !segmentBlocked(cam.x, cam.y, player.x, player.y, solids)) {
      vis = 1 - d / cam.range;
    }
  }
  cam.seesPlayer = vis > 0;
  if (vis > 0) {
    cam.meter = Math.min(1, cam.meter + dt * (0.5 + vis));
    if (cam.meter >= 1 && !cam.tripped) {
      cam.tripped = true;
      world.events.push('alarm');
      world.alarm.x = player.x; world.alarm.y = player.y;
    }
  } else {
    cam.meter = Math.max(0, cam.meter - dt * 0.35);
    if (cam.meter < 0.4) cam.tripped = false;
  }
}

export function laserIsOn(lz, time) {
  const ph = ((time + lz.phase) % lz.period) / lz.period;
  return ph < lz.duty;
}
