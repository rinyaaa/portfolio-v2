import { describe, it, expect } from 'vitest';
import { formatJaDate } from './formatDate';

describe('formatJaDate', () => {
  it('YYYY-MM-DD を日本語表記にする', () => {
    expect(formatJaDate('2025-12-22')).toBe('2025年12月22日');
  });

  it('先頭ゼロを落とす', () => {
    expect(formatJaDate('2026-07-03')).toBe('2026年7月3日');
  });

  it('null は空文字', () => {
    expect(formatJaDate(null)).toBe('');
  });

  it('空文字は空文字', () => {
    expect(formatJaDate('')).toBe('');
  });

  it('不正な形式は空文字', () => {
    expect(formatJaDate('2025/12/22')).toBe('');
  });
});
