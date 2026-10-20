import { describe, expect, it } from 'vitest';

import { parseManifest } from './parse';

describe('parseManifest', () => {
  it('accepts a valid manifest', () => {
    const result = parseManifest({
      version: 1,
      basePath: '/signs',
      entries: [{ gloss: 'father', file: 'clips/father.mp4', aliases: ['Dad'] }],
      letters: { dir: 'letters', ext: 'png', available: ['A', 'b'] },
    });

    expect(result.ok).toBe(true);
    expect(result.manifest.entries[0]).toMatchObject({
      gloss: 'FATHER',
      aliases: ['dad'],
    });
    expect(result.manifest.letters.available).toEqual(['a', 'b']);
  });

  it('skips an entry with no gloss but keeps the rest', () => {
    const result = parseManifest({
      entries: [{ file: 'clips/x.mp4' }, { gloss: 'DRINK', file: 'clips/drink.mp4' }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('missing "gloss"');
    expect(result.manifest.entries).toHaveLength(1);
  });

  it('skips an entry with no file', () => {
    const result = parseManifest({ entries: [{ gloss: 'DRINK' }] });
    expect(result.errors[0]).toContain('missing "file"');
    expect(result.manifest.entries).toHaveLength(0);
  });

  it('lets the later of two duplicate glosses win, and says so', () => {
    const result = parseManifest({
      entries: [
        { gloss: 'DRINK', file: 'clips/old.mp4' },
        { gloss: 'DRINK', file: 'clips/new.mp4' },
      ],
    });

    expect(result.errors.some((e) => e.includes('duplicate'))).toBe(true);
    expect(result.manifest.entries).toHaveLength(1);
    expect(result.manifest.entries[0]?.file).toBe('clips/new.mp4');
  });

  it('never throws on rubbish input, and degrades to fingerspelling', () => {
    for (const input of [null, undefined, 42, 'nope', [], true]) {
      const result = parseManifest(input);
      expect(result.ok).toBe(false);
      expect(result.manifest.entries).toEqual([]);
    }
  });

  it('falls back to defaults for missing or invalid values', () => {
    const result = parseManifest({ version: 'x', defaults: { clipMs: -5 } });
    expect(result.manifest.version).toBe(1);
    expect(result.manifest.defaults.clipMs).toBe(1200);
  });

  it('ignores unknown fields, so documentation can live in the file', () => {
    const result = parseManifest({ _howToAddASign: ['read me'], entries: [] });
    expect(result.ok).toBe(true);
  });

  it('ignores letters.available entries that are not single letters', () => {
    const result = parseManifest({ letters: { available: ['a', 'bb', '1'] } });
    expect(result.manifest.letters.available).toEqual(['a']);
    expect(result.errors.some((e) => e.includes('single letters'))).toBe(true);
  });
});
