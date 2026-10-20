import type { Dialect } from '../types';
import { ASL } from './asl';

export const DIALECTS: Record<string, Dialect> = { asl: ASL };

export const DEFAULT_DIALECT = ASL;

export function getDialect(id: string | undefined): Dialect {
  if (!id) return DEFAULT_DIALECT;
  return DIALECTS[id] ?? DEFAULT_DIALECT;
}

export { ASL };
