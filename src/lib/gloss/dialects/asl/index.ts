import type { Dialect } from '../../types';
import { ASL_LEXICON } from './lexicon';
import { ASL_ALPHABET } from './alphabet';
import { ASL_RULES } from './rules';

export const ASL: Dialect = {
  id: 'asl',
  label: 'American Sign Language',
  lexicon: ASL_LEXICON,
  alphabet: ASL_ALPHABET,
  rules: ASL_RULES,
};

export { ASL_LEXICON, ASL_ALPHABET, ASL_RULES };
