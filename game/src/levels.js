// Nightshade: level definitions. Six themed floors of the Vane Museum,
// each with its own palette, floor pattern, props, patrols and hazards.
// Coordinates live in world space: 1280 x 672, origin under the HUD bar.

export const WORLD_W = 1280;
export const WORLD_H = 672;

function wall(x, y, w, h, kind) { return { x, y, w, h, kind: kind || 'wall' }; }
function prop(x, y, w, h, type) { return { x, y, w, h, type, kind: type }; }
function guard(type, x, y, angle, waypoints) {
  return { type, x, y, angle, waypoints: waypoints || null };
}
function lamp(x, y, r, color, flicker) {
  return { x, y, r, color: color || '255,214,150', flicker: !!flicker };
}
function shadowPool(x, y, r) { return { x, y, r }; }
function relic(x, y, name) { return { x, y, name, taken: false }; }
function camera(x, y, base, sweep, range) {
  return { x, y, base, sweep, range: range || 150, angle: base, meter: 0 };
}
function laser(x1, y1, x2, y2, period, duty, phase) {
  return { x1, y1, x2, y2, period, duty, phase: phase || 0, tripped: false };
}

const border = [
  wall(0, 0, 1280, 16), wall(0, 656, 1280, 16),
  wall(0, 0, 16, 672), wall(1264, 0, 16, 672),
];

export const LEVELS = [
  {
    id: 1,
    name: 'The Marble Gallery',
    sub: 'Floor I - East Wing',
    brief: 'Lift the three gallery relics and slip out the east door. Guards patrol the marble. Stay out of the light, stay out of the cones.',
    theme: {
      floor: 'marble', floorA: '#cfd4dc', floorB: '#aeb6c2', grout: '#8d97a5',
      wall: '#5a6270', wallTop: '#7c8694', accent: '#c9a227', carpet: '#7a1f2b',
      name: 'MARBLE GALLERY',
    },
    playerStart: { x: 70, y: 600 },
    exit: { x: 1196, y: 560, w: 68, h: 96 },
    decor: [
      { type: 'carpet', x: 300, y: 300, w: 680, h: 72 },
      { type: 'carpet', x: 604, y: 120, w: 72, h: 430 },
    ],
    walls: border.concat([
      wall(240, 16, 20, 200), wall(240, 300, 20, 180),
      wall(520, 180, 20, 300), wall(760, 16, 20, 220),
      wall(760, 330, 20, 200), wall(1020, 200, 20, 280),
      wall(240, 460, 280, 20), wall(780, 470, 240, 20),
    ]),
    props: [
      prop(120, 120, 54, 54, 'statue'), prop(420, 90, 90, 34, 'desk'),
      prop(880, 110, 54, 54, 'statue'), prop(330, 560, 44, 44, 'crate'),
      prop(640, 560, 44, 44, 'crate'), prop(1120, 360, 80, 34, 'shelf'),
      prop(120, 380, 80, 34, 'shelf'), prop(880, 580, 40, 40, 'plant'),
    ],
    shadows: [shadowPool(150, 470, 62), shadowPool(580, 120, 56), shadowPool(950, 300, 66), shadowPool(420, 620, 52), shadowPool(1150, 140, 54)],
    lights: [lamp(360, 336, 120, '255,220,160', true), lamp(640, 336, 120, '255,220,160'), lamp(920, 336, 120, '255,220,160', true), lamp(150, 150, 90), lamp(1130, 610, 95)],
    guards: [
      guard('patroller', 360, 336, 0, [[360, 336], [920, 336], [920, 200], [360, 200]]),
      guard('sentry', 640, 480, -1.57, null),
      guard('patroller', 1100, 580, 3.14, [[1100, 580], [1100, 260]]),
    ],
    cameras: [camera(640, 24, 1.57, 0.7, 165)],
    lasers: [laser(530, 486, 530, 640, 3.2, 0.62, 0)],
    relics: [relic(150, 90, 'Ivory Mask'), relic(1135, 120, 'Sun Disc'), relic(640, 90, 'Marble Idol')],
  },
  {
    id: 2,
    name: 'The Crimson Vault',
    sub: 'Floor II - Treasury',
    brief: 'The treasury sleeps under red velvet and laser light. Time the grids, use the coin, and do not let the heavies box you in.',
    theme: {
      floor: 'crimson', floorA: '#4a1420', floorB: '#3a0e18', grout: '#5d1f2e',
      wall: '#2c2c34', wallTop: '#454552', accent: '#e0b34c', carpet: '#8c2436',
      name: 'CRIMSON VAULT',
    },
    playerStart: { x: 70, y: 90 },
    exit: { x: 1196, y: 60, w: 68, h: 96 },
    decor: [
      { type: 'carpet', x: 120, y: 300, w: 1040, h: 76 },
      { type: 'rug', x: 560, y: 480, w: 160, h: 110 },
    ],
    walls: border.concat([
      wall(200, 150, 240, 20), wall(200, 150, 20, 200),
      wall(560, 16, 20, 190), wall(840, 200, 240, 20),
      wall(1060, 200, 20, 220), wall(400, 470, 20, 186),
      wall(700, 420, 260, 20), wall(400, 470, 300, 20),
    ]),
    props: [
      prop(300, 240, 46, 46, 'crate'), prop(320, 560, 90, 34, 'desk'),
      prop(920, 90, 54, 54, 'statue'), prop(1120, 500, 44, 44, 'crate'),
      prop(600, 250, 40, 40, 'plant'), prop(140, 520, 80, 34, 'shelf'),
      prop(980, 560, 80, 34, 'shelf'),
    ],
    shadows: [shadowPool(120, 220, 58), shadowPool(500, 560, 60), shadowPool(880, 330, 56), shadowPool(240, 420, 52), shadowPool(1080, 640, 56)],
    lights: [lamp(320, 336, 115, '255,170,120', true), lamp(640, 336, 115, '255,170,120'), lamp(960, 336, 115, '255,170,120', true), lamp(640, 540, 90, '255,190,130')],
    guards: [
      guard('heavy', 480, 336, 0, [[480, 336], [800, 336]]),
      guard('patroller', 1000, 130, 3.14, [[1000, 130], [700, 130], [700, 330]]),
      guard('scout', 240, 580, 0, [[240, 580], [560, 580], [560, 520]]),
      guard('sentry', 1130, 330, 3.14, null),
    ],
    cameras: [camera(300, 648, -1.57, 0.8, 160), camera(980, 24, 1.57, 0.6, 160)],
    lasers: [laser(452, 486, 688, 486, 2.8, 0.6, 0.4), laser(1080, 220, 1080, 420, 3.6, 0.55, 1.2)],
    relics: [relic(1100, 620, 'Ruby Chalice'), relic(120, 620, 'Garnet Crown'), relic(640, 240, 'Vault Keystone')],
  },
  {
    id: 3,
    name: 'The Emerald Hall',
    sub: 'Floor III - Conservatory Wing',
    brief: 'Glass, green tile and patient sentries. The scouts here are quick - break line of sight, hide in the fern shadows, strike when cones turn away.',
    theme: {
      floor: 'emerald', floorA: '#17503c', floorB: '#123f2f', grout: '#0b2d21',
      wall: '#3d4a42', wallTop: '#5a6d60', accent: '#7fe0b0', carpet: '#0f6a4a',
      name: 'EMERALD HALL',
    },
    playerStart: { x: 640, y: 610 },
    exit: { x: 606, y: 16, w: 68, h: 60 },
    decor: [
      { type: 'rug', x: 140, y: 140, w: 200, h: 140 }, { type: 'rug', x: 940, y: 392, w: 200, h: 140 },
      { type: 'carpet', x: 120, y: 316, w: 1040, h: 44 },
    ],
    walls: border.concat([
      wall(320, 16, 20, 240), wall(940, 16, 20, 240),
      wall(320, 420, 20, 236), wall(940, 420, 20, 236),
      wall(120, 420, 200, 20), wall(960, 230, 200, 20),
      wall(560, 230, 160, 20), wall(560, 430, 160, 20),
    ]),
    props: [
      prop(200, 200, 40, 40, 'plant'), prop(1040, 460, 40, 40, 'plant'),
      prop(620, 300, 44, 44, 'statue'), prop(180, 540, 90, 34, 'desk'),
      prop(1010, 110, 90, 34, 'desk'), prop(430, 120, 44, 44, 'crate'),
      prop(810, 520, 44, 44, 'crate'), prop(640, 540, 80, 34, 'shelf'),
    ],
    shadows: [shadowPool(210, 210, 64), shadowPool(1050, 470, 64), shadowPool(640, 130, 58), shadowPool(150, 620, 54), shadowPool(1130, 90, 54), shadowPool(470, 336, 50)],
    lights: [lamp(240, 336, 110, '190,255,215'), lamp(640, 336, 125, '190,255,215', true), lamp(1040, 336, 110, '190,255,215'), lamp(640, 620, 85, '200,255,220')],
    guards: [
      guard('scout', 240, 336, 0, [[240, 336], [1040, 336]]),
      guard('sentry', 420, 560, -1.57, null),
      guard('sentry', 860, 110, 1.57, null),
      guard('patroller', 640, 480, 3.14, [[640, 480], [420, 480], [420, 190], [860, 190], [860, 480]]),
    ],
    cameras: [camera(24, 336, 0, 0.75, 170), camera(1256, 336, 3.14, 0.75, 170)],
    lasers: [laser(572, 250, 572, 420, 3.0, 0.6, 0), laser(708, 250, 708, 420, 3.0, 0.6, 1.5)],
    relics: [relic(120, 90, 'Jade Serpent'), relic(1160, 590, 'Fern Codex'), relic(640, 336, 'Emerald Heart')],
  },
  {
    id: 4,
    name: 'The Obsidian Vault',
    sub: 'Floor IV - Deep Store',
    brief: 'Black stone, thin light, thick patrols. Almost everything here is shadow - and almost every shadow is watched. Move like smoke.',
    theme: {
      floor: 'obsidian', floorA: '#23232c', floorB: '#17171f', grout: '#0c0c12',
      wall: '#3a3a48', wallTop: '#55556a', accent: '#9db4ff', carpet: '#2c3550',
      name: 'OBSIDIAN VAULT',
    },
    playerStart: { x: 70, y: 336 },
    exit: { x: 1196, y: 288, w: 68, h: 96 },
    decor: [
      { type: 'carpet', x: 120, y: 310, w: 900, h: 52 },
      { type: 'rug', x: 980, y: 90, w: 170, h: 120 }, { type: 'rug', x: 130, y: 460, w: 170, h: 120 },
    ],
    walls: border.concat([
      wall(280, 120, 20, 200), wall(280, 420, 20, 140),
      wall(520, 16, 20, 170), wall(520, 300, 20, 200),
      wall(800, 180, 20, 220), wall(800, 500, 20, 156),
      wall(1020, 300, 160, 20), wall(300, 560, 220, 20),
    ]),
    props: [
      prop(150, 150, 46, 46, 'crate'), prop(620, 120, 54, 54, 'statue'),
      prop(920, 560, 90, 34, 'desk'), prop(420, 380, 44, 44, 'crate'),
      prop(1080, 480, 80, 34, 'shelf'), prop(160, 620, 40, 36, 'plant'),
      prop(700, 580, 44, 44, 'crate'),
    ],
    shadows: [shadowPool(180, 260, 70), shadowPool(430, 160, 62), shadowPool(680, 420, 70), shadowPool(950, 180, 62), shadowPool(560, 620, 60), shadowPool(1100, 620, 58), shadowPool(90, 520, 56)],
    lights: [lamp(400, 336, 95, '170,195,255', true), lamp(680, 200, 90, '170,195,255'), lamp(950, 420, 95, '170,195,255', true), lamp(150, 90, 75, '170,195,255')],
    guards: [
      guard('patroller', 400, 200, 0, [[400, 200], [680, 200], [680, 470], [400, 470]]),
      guard('heavy', 950, 336, 3.14, [[950, 336], [620, 336]]),
      guard('scout', 1080, 120, 3.14, [[1080, 120], [880, 120], [880, 260]]),
      guard('sentry', 180, 420, 0.6, null),
      guard('patroller', 1080, 580, 0, [[1080, 580], [860, 580]]),
    ],
    cameras: [camera(640, 648, -1.57, 0.9, 175)],
    lasers: [laser(820, 180, 820, 60, 2.6, 0.58, 0.7), laser(300, 330, 300, 560, 3.4, 0.6, 0)],
    relics: [relic(1160, 90, 'Obsidian Star'), relic(120, 90, 'Night Opal'), relic(950, 620, 'Void Sigil')],
  },
  {
    id: 5,
    name: 'The Rooftop Garden',
    sub: 'Floor V - Sky Terrace',
    brief: 'Open sky, plank walks and planter cover. The wind carries sound - run carelessly and every guard on the roof will hear you.',
    theme: {
      floor: 'rooftop', floorA: '#6b4f35', floorB: '#5b422c', grout: '#4a3520',
      wall: '#4c4438', wallTop: '#6a6050', accent: '#ffd98a', carpet: '#3f6a35',
      name: 'ROOFTOP GARDEN',
    },
    playerStart: { x: 80, y: 80 },
    exit: { x: 1196, y: 560, w: 68, h: 96 },
    decor: [
      { type: 'grass', x: 420, y: 90, w: 200, h: 130 }, { type: 'grass', x: 660, y: 450, w: 200, h: 130 },
      { type: 'grass', x: 120, y: 420, w: 170, h: 120 }, { type: 'grass', x: 990, y: 120, w: 170, h: 120 },
    ],
    walls: border.concat([
      wall(300, 200, 20, 220), wall(620, 16, 20, 200),
      wall(620, 330, 20, 190), wall(960, 250, 20, 220),
      wall(320, 420, 300, 20), wall(980, 470, 200, 20),
    ]),
    props: [
      prop(470, 140, 44, 44, 'plant'), prop(710, 500, 44, 44, 'plant'),
      prop(180, 470, 44, 44, 'plant'), prop(1040, 170, 44, 44, 'plant'),
      prop(800, 300, 54, 54, 'statue'), prop(140, 250, 90, 34, 'desk'),
      prop(1050, 580, 44, 44, 'crate'), prop(480, 580, 80, 34, 'shelf'),
    ],
    shadows: [shadowPool(480, 150, 60), shadowPool(720, 510, 60), shadowPool(190, 480, 58), shadowPool(1050, 180, 58), shadowPool(850, 90, 52), shadowPool(360, 620, 50)],
    lights: [lamp(520, 155, 105, '255,230,170', true), lamp(760, 515, 105, '255,230,170'), lamp(205, 480, 95, '255,230,170', true), lamp(1075, 180, 95, '255,230,170'), lamp(640, 336, 80, '255,240,200')],
    guards: [
      guard('patroller', 460, 336, 0, [[460, 336], [820, 336], [820, 130], [460, 130]]),
      guard('scout', 1100, 380, 3.14, [[1100, 380], [1100, 560], [900, 560]]),
      guard('sentry', 180, 620, -0.8, null),
      guard('heavy', 760, 620, 3.14, [[760, 620], [1040, 620]]),
    ],
    cameras: [camera(1256, 90, 2.6, 0.6, 165)],
    lasers: [laser(640, 216, 640, 330, 3.0, 0.6, 0.9)],
    relics: [relic(1160, 80, 'Sky Lantern'), relic(90, 620, 'Moon Orchid'), relic(800, 300, 'Wind Chime')],
  },
  {
    id: 6,
    name: 'The Gilded Sanctum',
    sub: 'Floor VI - Inner Sanctum',
    brief: 'The last room. Every guard type, every trap, one fortune in gold. Take the three sanctum relics and vanish like you were never here.',
    theme: {
      floor: 'gilded', floorA: '#8a6d2f', floorB: '#755c26', grout: '#5c4718',
      wall: '#4a3a16', wallTop: '#6e5622', accent: '#ffe9a3', carpet: '#5e1220',
      name: 'GILDED SANCTUM',
    },
    playerStart: { x: 640, y: 620 },
    exit: { x: 606, y: 16, w: 68, h: 60 },
    decor: [
      { type: 'carpet', x: 590, y: 120, w: 100, h: 440 },
      { type: 'rug', x: 480, y: 250, w: 320, h: 170 }, { type: 'carpet', x: 140, y: 316, w: 1000, h: 44 },
    ],
    walls: border.concat([
      wall(260, 120, 20, 190), wall(260, 420, 20, 140),
      wall(1000, 120, 20, 190), wall(1000, 420, 20, 140),
      wall(480, 230, 320, 20), wall(480, 440, 320, 20),
      wall(480, 230, 20, 230), wall(780, 230, 20, 230),
    ]),
    props: [
      prop(618, 318, 44, 44, 'statue'), prop(140, 140, 54, 54, 'statue'),
      prop(1090, 140, 54, 54, 'statue'), prop(140, 500, 44, 44, 'crate'),
      prop(1090, 500, 44, 44, 'crate'), prop(360, 330, 40, 40, 'plant'),
      prop(880, 330, 40, 40, 'plant'), prop(590, 540, 100, 34, 'desk'),
    ],
    shadows: [shadowPool(160, 250, 60), shadowPool(1120, 250, 60), shadowPool(360, 480, 56), shadowPool(920, 480, 56), shadowPool(640, 345, 46), shadowPool(120, 640, 50)],
    lights: [lamp(640, 336, 140, '255,236,170', true), lamp(200, 180, 100, '255,226,150'), lamp(1080, 180, 100, '255,226,150'), lamp(200, 520, 95, '255,226,150', true), lamp(1080, 520, 95, '255,226,150')],
    guards: [
      guard('patroller', 360, 180, 0, [[360, 180], [920, 180], [920, 500], [360, 500]]),
      guard('heavy', 640, 130, 1.57, [[640, 130], [640, 250]]),
      guard('scout', 150, 336, 0, [[150, 336], [420, 336]]),
      guard('scout', 1130, 336, 3.14, [[1130, 336], [860, 336]]),
      guard('sentry', 640, 560, -1.57, null),
    ],
    cameras: [camera(24, 90, 0.5, 0.6, 160), camera(1256, 582, -2.6, 0.6, 160)],
    lasers: [laser(500, 250, 500, 440, 2.8, 0.6, 0), laser(780, 250, 780, 440, 2.8, 0.6, 1.4)],
    relics: [relic(640, 336, 'The Nightshade Crown'), relic(110, 110, 'Sun Reliquary'), relic(1170, 110, 'Moon Reliquary')],
  },
];
