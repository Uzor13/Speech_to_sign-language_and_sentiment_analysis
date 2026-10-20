#!/usr/bin/env node
/**
 * Generate sign manifest entries from whatever is in public/signs/clips.
 *
 * Adding one or two signs by hand is easy; adding fifty is not. This reads the
 * clips folder, derives a gloss from each filename, preserves the aliases and
 * durations already recorded for clips it recognises, and prints the result.
 *
 *   npm run manifest           # print the merged manifest
 *   npm run manifest -- --write  # write it back to public/signs/manifest.json
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const signsDir = path.join(root, 'public', 'signs');
const manifestPath = path.join(signsDir, 'manifest.json');
const clipsDir = path.join(signsDir, 'clips');
const lettersDir = path.join(signsDir, 'letters');

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
const IMAGE = /^([a-z])\.(png|jpg|jpeg|webp|svg|gif)$/i;

/** "number-3.mp4" -> "NUMBER-3"; "pick_on.mp4" -> "PICK-ON" */
const glossFor = (filename) =>
  path
    .basename(filename, path.extname(filename))
    .replace(/[\s_]+/g, '-')
    .toUpperCase();

const listFiles = async (dir) => (existsSync(dir) ? (await readdir(dir)).sort() : []);

const existing = existsSync(manifestPath)
  ? JSON.parse(await readFile(manifestPath, 'utf8'))
  : {};
const previous = new Map((existing.entries ?? []).map((e) => [e.gloss?.toUpperCase(), e]));

const clips = (await listFiles(clipsDir)).filter((f) => VIDEO.test(f));
const letters = (await listFiles(lettersDir))
  .map((f) => f.match(IMAGE)?.[1]?.toLowerCase())
  .filter(Boolean);

const entries = clips.map((file) => {
  const gloss = glossFor(file);
  const prior = previous.get(gloss);
  return {
    gloss,
    file: `clips/${file}`,
    // Keep hand-written aliases and durations rather than clobbering them.
    ...(prior?.aliases ? { aliases: prior.aliases } : {}),
    ...(prior?.durationMs ? { durationMs: prior.durationMs } : {}),
  };
});

const manifest = {
  ...existing,
  version: existing.version ?? 1,
  basePath: existing.basePath ?? '/signs',
  dialect: existing.dialect ?? 'asl',
  defaults: existing.defaults ?? { clipMs: 1200, letterMs: 450, pauseMs: 300 },
  letters: { ...(existing.letters ?? { dir: 'letters', ext: 'png' }), available: letters },
  entries,
};

const json = `${JSON.stringify(manifest, null, 2)}\n`;

if (process.argv.includes('--write')) {
  await writeFile(manifestPath, json);
  console.log(`Wrote ${path.relative(root, manifestPath)}`);
} else {
  console.log(json);
}

const kept = entries.filter((e) => previous.has(e.gloss)).length;
console.error(
  `${clips.length} clip(s), ${letters.length} letter image(s). ` +
    `${kept} existing entr${kept === 1 ? 'y' : 'ies'} preserved.` +
    (process.argv.includes('--write') ? '' : ' Re-run with --write to save.'),
);
