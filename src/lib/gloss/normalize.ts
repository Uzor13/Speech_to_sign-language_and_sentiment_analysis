/**
 * English-side clean-up, shared by every dialect: the *input* is English
 * whether you are signing ASL or BSL.
 *
 * Note that case is deliberately preserved. Proper-noun detection is what
 * decides whether "Peter" is fingerspelled, and lowercasing destroys it.
 */

/** Forms that cannot be derived by a suffix rule. */
const CONTRACTIONS = new Map([
  ["won't", 'will not'],
  ["can't", 'can not'],
  ['cannot', 'can not'],
  ["shan't", 'shall not'],
  ["ain't", 'is not'],
  ["let's", 'let us'],
  ["y'all", 'you all'],
  ["gonna", 'going to'],
  ["wanna", 'want to'],
  ["gotta", 'got to'],
]);

/** Pronouns and determiners where "'s" means "is", not possession. */
const S_IS_COPULA = new Set([
  'it', 'that', 'this', 'he', 'she', 'there', 'here', 'what', 'who', 'where', 'how',
]);

export const FILLERS = new Set(['um', 'umm', 'uh', 'uhh', 'erm', 'er', 'ah', 'hmm', 'mm', 'mhm']);

export function expandContractions(text: string): string {
  let out = text.replace(/[‘’]/g, "'");

  for (const [from, to] of CONTRACTIONS) {
    out = out.replace(new RegExp(`\\b${from}\\b`, 'gi'), (m) =>
      m[0] === m[0]?.toUpperCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to,
    );
  }

  // "'s" is ambiguous. Expand it to "is" only after a word where possession is
  // impossible; everywhere else leave it for the possessives rule.
  out = out.replace(/\b(\w+)'s\b/gi, (match, word: string) =>
    S_IS_COPULA.has(word.toLowerCase()) ? `${word} is` : match,
  );

  return out
    .replace(/\b(\w+)n't\b/gi, '$1 not')
    .replace(/\b(\w+)'ll\b/gi, '$1 will')
    .replace(/\b(\w+)'ve\b/gi, '$1 have')
    .replace(/\b(\w+)'re\b/gi, '$1 are')
    .replace(/\b(\w+)'d\b/gi, '$1 would')
    .replace(/\b(\w+)'m\b/gi, '$1 am')
    // "do not" rather than "don not", after the n't rule above
    .replace(/\bdon not\b/gi, 'do not')
    .replace(/\bdoesn not\b/gi, 'does not')
    .replace(/\bdidn not\b/gi, 'did not')
    .replace(/\bisn not\b/gi, 'is not')
    .replace(/\baren not\b/gi, 'are not')
    .replace(/\bwasn not\b/gi, 'was not')
    .replace(/\bweren not\b/gi, 'were not')
    .replace(/\bhasn not\b/gi, 'has not')
    .replace(/\bhaven not\b/gi, 'have not')
    .replace(/\bhadn not\b/gi, 'had not')
    .replace(/\bwouldn not\b/gi, 'would not')
    .replace(/\bcouldn not\b/gi, 'could not')
    .replace(/\bshouldn not\b/gi, 'should not')
    .replace(/\bmustn not\b/gi, 'must not');
}

export function stripFillers(text: string): string {
  return text
    .split(/(\s+)/)
    .filter((part) => !FILLERS.has(part.replace(/[^A-Za-z]/g, '').toLowerCase()) || /^\s+$/.test(part))
    .join('')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

export function normalizeText(raw: string, options: { stripFillers?: boolean } = {}): string {
  if (!raw) return '';
  let out = expandContractions(raw);
  if (options.stripFillers !== false) out = stripFillers(out);
  return out.replace(/\s{2,}/g, ' ').trim();
}
