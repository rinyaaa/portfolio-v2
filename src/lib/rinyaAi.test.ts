import { describe, it, expect } from 'vitest';
import { findRinyaAnswer, RINYA_FALLBACK_ANSWER } from './rinyaAi';
import type { RinyaQaEntry } from '../types/rinyaQa';

describe('findRinyaAnswer', () => {
  it('回答データが空でもフォールバックを返し、壊れない（本人提供データ待ちの現状）', () => {
    expect(findRinyaAnswer('好きな食べ物は？', [])).toBe(RINYA_FALLBACK_ANSWER);
  });

  it('keyword が質問文に含まれていれば一致する', () => {
    const qa: RinyaQaEntry[] = [{ keyword: '食べ物', answer: '二郎ラーメンかな' }];
    expect(findRinyaAnswer('好きな食べ物は？', qa)).toBe('二郎ラーメンかな');
  });

  it('一致しない質問はフォールバックを返す', () => {
    const qa: RinyaQaEntry[] = [{ keyword: '食べ物', answer: '二郎ラーメンかな' }];
    expect(findRinyaAnswer('好きな色は？', qa)).toBe(RINYA_FALLBACK_ANSWER);
  });

  it('空文字の質問はフォールバックを返す', () => {
    const qa: RinyaQaEntry[] = [{ keyword: '食べ物', answer: '二郎ラーメンかな' }];
    expect(findRinyaAnswer('   ', qa)).toBe(RINYA_FALLBACK_ANSWER);
  });

  it('大文字小文字を区別しない', () => {
    const qa: RinyaQaEntry[] = [{ keyword: 'react', answer: '好きだよ' }];
    expect(findRinyaAnswer('Reactは好き？', qa)).toBe('好きだよ');
  });
});
