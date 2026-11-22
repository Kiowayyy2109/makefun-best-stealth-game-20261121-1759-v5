// Geometry helpers: angles, segment tests, wall collision and line of sight.

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function circleHitsRect(cx, cy, rad, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}

export function moveCircle(pos, dx, dy, rad, solids) {
  let nx = pos.x + dx;
  for (const s of solids) {
    if (circleHitsRect(nx, pos.y, rad, s)) {
      nx = dx > 0 ? s.x - rad : s.x + s.w + rad;
    }
  }
  let ny = pos.y + dy;
  for (const s of solids) {
    if (circleHitsRect(nx, ny, rad, s)) {
      ny = dy > 0 ? s.y - rad : s.y + s.h + rad;
    }
  }
  pos.x = nx; pos.y = ny;
}

function segSeg(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (d === 0) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999;
}

export function segmentBlocked(x1, y1, x2, y2, solids) {
  for (const s of solids) {
    if (pointInRect(x1, y1, s) || pointInRect(x2, y2, s)) continue;
    if (segSeg(x1, y1, x2, y2, s.x, s.y, s.x + s.w, s.y)) return true;
    if (segSeg(x1, y1, x2, y2, s.x + s.w, s.y, s.x + s.w, s.y + s.h)) return true;
    if (segSeg(x1, y1, x2, y2, s.x + s.w, s.y + s.h, s.x, s.y + s.h)) return true;
    if (segSeg(x1, y1, x2, y2, s.x, s.y + s.h, s.x, s.y)) return true;
  }
  return false;
}

// Cast a ray from (x,y) at angle a; return distance to nearest solid edge.
export function rayDistance(x, y, a, maxDist, solids) {
  const ex = x + Math.cos(a) * maxDist, ey = y + Math.sin(a) * maxDist;
  let best = maxDist;
  for (const s of solids) {
    const edges = [
      [s.x, s.y, s.x + s.w, s.y], [s.x + s.w, s.y, s.x + s.w, s.y + s.h],
      [s.x + s.w, s.y + s.h, s.x, s.y + s.h], [s.x, s.y + s.h, s.x, s.y],
    ];
    for (const e of edges) {
      const d = (ex - x) * (e[3] - e[1]) - (ey - y) * (e[2] - e[0]);
      if (d === 0) continue;
      const t = ((e[0] - x) * (e[3] - e[1]) - (e[1] - y) * (e[2] - e[0])) / d;
      const u = ((e[0] - x) * (ey - y) - (e[1] - y) * (ex - x)) / d;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) {
        const dd = t * maxDist;
        if (dd < best) best = dd;
      }
    }
  }
  return best;
}

// Build a vision-cone polygon clipped by walls via fan raycasts.
export function conePolygon(x, y, angle, halfFov, range, solids, steps) {
  const pts = [[x, y]];
  const n = steps || 22;
  for (let i = 0; i <= n; i++) {
    const a = angle - halfFov + (2 * halfFov * i) / n;
    const d = rayDistance(x, y, a, range, solids);
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

export function segmentPointDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const nx = x1 + t * dx, ny = y1 + t * dy;
  return dist(px, py, nx, ny);
}

// Small deterministic PRNG so screenshot scenes are reproducible.
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
