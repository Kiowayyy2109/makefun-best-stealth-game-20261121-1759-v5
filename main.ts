// Nightshade: Velvet Hour - hand-in program (Node 22, standard library only).
// The museum is this directory's game/ folder: plain static files a desktop
// browser loads fully offline (game/index.html plus its ES modules, no
// library, no network request). This program delivers the entry: it copies
// game/ and screenshots/ from beside this file into the output directory
// and writes dossier.json there with the vendored make.fun library, so the
// judge reads exactly the bytes that were played and screenshotted.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own limits: the dossier text cap shapes the
// bytes directly, and the rest refuse anything the gate would refuse -
// more than 4 screenshots or one over 256 KiB, more than 993 entries or
// 48 MiB under game/, or a single game path over 1000 bytes.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
