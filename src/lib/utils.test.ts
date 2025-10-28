import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className utility)', () => {
  it('merges class names', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('removes falsy values', () => {
    const result = cn('px-4', false, 'py-2', undefined, null, 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('handles Tailwind merge conflicts', () => {
    // twMerge should deduplicate conflicting classes
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4'); // px-4 should override px-2
  });

  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles arrays of classes', () => {
    const result = cn(['px-4', 'py-2'], 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('handles objects with boolean values', () => {
    const result = cn({
      'px-4': true,
      'py-2': true,
      'bg-red-500': false,
      'bg-blue-500': true,
    });
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });
});
