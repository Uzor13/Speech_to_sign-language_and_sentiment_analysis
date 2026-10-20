import { describe, expect, it } from 'vitest';

import { createEmptyRegistry, createRegistry } from './registry';
import { TEST_MANIFEST } from '@/test/fixtures/manifest';
import { ASL_ALPHABET } from '@/lib/gloss/dialects/asl/alphabet';
import type { GlossToken } from '@/lib/gloss/types';

const registry = createRegistry(TEST_MANIFEST, ASL_ALPHABET);

const sign = (gloss: string, source: string[] = []): GlossToken => ({
  id: `t-${gloss}`,
  gloss,
  kind: 'sign',
  source,
});

describe('registry.resolve', () => {
  it('matches an exact gloss', () => {
    expect(registry.resolve(sign('FATHER', ['father']))).toMatchObject({
      kind: 'clip',
      via: 'gloss',
      src: '/signs/clips/father.mp4',
    });
  });

  it('matches an alias on the original English word', () => {
    expect(registry.resolve(sign('DAD', ['dad']))).toMatchObject({
      kind: 'clip',
      via: 'alias',
      src: '/signs/clips/father.mp4',
    });
  });

  it('is case-insensitive on the gloss', () => {
    expect(registry.resolve(sign('father')).kind).toBe('clip');
  });

  it('fingerspells a word with no clip rather than dropping it', () => {
    const resolved = registry.resolve(sign('APPLE', ['apple']));
    expect(resolved).toMatchObject({ kind: 'fingerspell', via: 'no-clip' });
    expect(resolved.letters).toEqual(['a', 'p', 'p', 'l', 'e']);
  });

  it('spells a name even when a clip shares its gloss', () => {
    const token: GlossToken = {
      id: 'n',
      gloss: 'FATHER',
      kind: 'fingerspell',
      source: ['Father'],
      preferFingerspell: true,
      letters: ['f', 'a', 't', 'h', 'e', 'r'],
    };
    expect(registry.resolve(token)).toMatchObject({
      kind: 'fingerspell',
      via: 'prefer-fingerspell',
    });
  });

  it('signs a multi-digit number digit by digit when there is no clip for it', () => {
    const token: GlossToken = {
      id: 'n25',
      gloss: 'NUMBER-25',
      kind: 'number',
      source: ['25'],
      value: 25,
    };
    expect(registry.resolve(token)).toMatchObject({ kind: 'digits', digits: ['2', '5'] });
  });

  it('prefers a whole-number clip over digits when one exists', () => {
    const token: GlossToken = {
      id: 'n2',
      gloss: 'NUMBER-2',
      kind: 'number',
      source: ['2'],
      value: 2,
    };
    expect(registry.resolve(token)).toMatchObject({ kind: 'clip', via: 'gloss' });
  });

  it('resolves nothing for a gloss with no spellable letters', () => {
    expect(registry.resolve(sign('!!!', ['!!!']))).toMatchObject({ kind: 'none' });
  });
});

describe('registry letter assets', () => {
  it('returns a path for a letter that has an image', () => {
    expect(registry.letterSrc('a')).toBe('/signs/letters/a.png');
  });

  it('returns nothing for a letter with no image, so a card is drawn instead', () => {
    expect(registry.letterSrc('z')).toBeUndefined();
  });
});

describe('empty registry', () => {
  // This is the state the repository actually ships in, so it has to work.
  const empty = createEmptyRegistry(ASL_ALPHABET);

  it('fingerspells everything', () => {
    for (const gloss of ['FATHER', 'APPLE', 'DRINK']) {
      expect(empty.resolve(sign(gloss, [gloss.toLowerCase()])).kind).toBe('fingerspell');
    }
  });

  it('has no glosses and no letter images', () => {
    expect(empty.glosses()).toEqual([]);
    expect(empty.letterSrc('a')).toBeUndefined();
  });
});
