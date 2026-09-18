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

  describe('CMS 由来のフォールバック文', () => {
    // 本人の口調の断り文句は Public リポジトリに置かず microCMS に置く（CLAUDE.md §4.4.1）ため、
    // 呼び出し側から差し込めることを保証する。フィクスチャは架空の値を使う。
    const qa: RinyaQaEntry[] = [{ keyword: '食べ物', answer: '回答A' }];

    it('該当が無いときは渡された文言を返す', () => {
      expect(findRinyaAnswer('好きな色は？', qa, '断り文A')).toBe('断り文A');
    });

    it('qa が空でも渡された文言を返す', () => {
      expect(findRinyaAnswer('好きな色は？', [], '断り文A')).toBe('断り文A');
    });

    it('空の質問でも渡された文言を返す', () => {
      expect(findRinyaAnswer('   ', qa, '断り文A')).toBe('断り文A');
    });

    it('該当があるときは Q&A の回答が優先される', () => {
      expect(findRinyaAnswer('好きな食べ物は？', qa, '断り文A')).toBe('回答A');
    });

    it('未設定・空白だけのときはコードの既定文に落ちる', () => {
      for (const raw of [undefined, '', '   ', '\n']) {
        expect(findRinyaAnswer('好きな色は？', qa, raw)).toBe(RINYA_FALLBACK_ANSWER);
      }
    });

    it('前後の空白は落として使う', () => {
      expect(findRinyaAnswer('好きな色は？', qa, '  断り文A  ')).toBe('断り文A');
    });
  });
});
