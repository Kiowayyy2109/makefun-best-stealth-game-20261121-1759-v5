# makefun-best-stealth-game-20261121-1759-v5

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Kiowayyy2109/makefun-best-stealth-game-20261121-1759-v5/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Kiowayyy2109/makefun-best-stealth-game-20261121-1759-v5/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Nightshade: Velvet Hour

A top-down 2D stealth game about a thief the dark remembers. Slip through
six themed floors of the Vane Museum - the Marble Gallery, the Crimson
Vault, the Emerald Hall, the Obsidian Vault, the Rooftop Garden and the
Gilded Sanctum - lift three relics per floor, and reach the exit unseen.

Every floor is lit like a stage: a darkness overlay pierced by flickering
lamp pools and wall-clipped vision cones, drifting dust motes, shimmering
relics and props that cast soft shadows. Guards come in four flavours -
patrollers walking waypoint loops, rotating sentries, slow heavies with
wide cones and fast scouts with narrow ones - backed by sweeping security
cameras and blinking laser grids.

Detection is a fair fight. Suspicion climbs through unaware, wary (?) and
chase (!) into a searching hunt, with a visible detection meter and time
to break line of sight and recover. Shadow pools hide a still or sneaking
thief; running is fast but throws a noise ring that pulls guards toward
you. Two gadgets round out the kit: a coin toss (Q) that drags patrols
off their routes, and a smoke bomb (F) that breaks every line of sight at
once. Trip a laser or fill a camera's meter and the alarm sends every
guard converging on your last known position before they cool down into
a search.

Each floor is rated GHOST (never suspected), SILENT (glimpsed, never
alarmed) or SHADOW, with relic, clear, rating and time bonuses feeding a
running score across all six floors.

## Run it

Serve the `game/` folder with any static file server and open
`game/index.html` in desktop Chrome - or run the hand-in program, which
copies `game/` and `screenshots/` to the output directory and writes the
dossier the judge reads:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The game is plain static files: no build step, no network requests, all
sound synthesized live with WebAudio.

## Controls

- **WASD / Arrow keys** - move
- **Shift** - sneak: slow, silent, and hidden while in shadow
- **Q** - coin toss distraction (3 per floor)
- **F** - smoke bomb (2 per floor)
- **P / Esc** - pause
- **R** - restart the floor
- **M** - mute

## Layout

- `main.ts` - the hand-in program (Node 22, standard library only)
- `game/index.html` - the page shell
- `game/src/levels.js` - the six themed floors and their hazards
- `game/src/guards.js` - guard archetypes, suspicion, cameras, lasers
- `game/src/player.js` - movement, shadow hiding and the two gadgets
- `game/src/render.js` - floors, lighting, cones, figures, HUD, minimap
- `game/src/geometry.js` - raycasts, line of sight and collision
- `game/src/audio.js` - synthesized WebAudio sound effects
- `game/src/input.js` - keyboard handling
- `game/src/main.js` - the state machine, scoring and screens
- `screenshots/` - four real renders of the game (cover first)

---

<sub>Entered on [make.fun](https://make.fun/?ref=CHRW-KCFF&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
