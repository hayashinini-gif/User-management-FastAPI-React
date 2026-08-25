/**
 * Joins class names, dropping anything that is not a non-empty string.
 * Lets components write:  cn('base', isActive && 'active', className)
 */
export function cn(...parts: unknown[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(' ')
}
