import { describe, it, expect } from 'vitest';
import { toPost } from './microcms';
import type { MicroCMSPost, MicroCMSCategory } from '../types/post';

/** テスト用の MicroCMSPost を作るヘルパー（必要な項目だけ上書き）。 */
function makeRaw(overrides: Partial<MicroCMSPost> = {}): MicroCMSPost {
  return {
    id: 'abc123',
    title: 'サンプル記事',
    content: '<p>本文</p>',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    publishedAt: '2026-01-03T00:00:00.000Z',
    ...overrides,
  };
}

/** テスト用のカテゴリ参照オブジェクトを作る。 */
function cat(name: string): MicroCMSCategory {
  return {
    id: `${name}-id`,
    name,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('toPost', () => {
  it('生レスポンスを Post に正規化する', () => {
    const post = toPost(
      makeRaw({
        date: '2026-06-26T00:00:00.000Z',
        genres: [cat('Product'), cat('KajiLab')],
        eyecatch: { url: 'https://example.com/a.png', width: 100, height: 80 },
      }),
    );
    expect(post).toEqual({
      id: 'abc123',
      title: 'サンプル記事',
      date: '2026-06-26',
      genres: ['Product', 'KajiLab'],
      bodyHtml: '<p>本文</p>',
      eyecatch: { url: 'https://example.com/a.png', width: 100, height: 80 },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      publishedAt: '2026-01-03T00:00:00.000Z',
      sortKey: '2026-06-26',
    });
  });

  it('genres は参照オブジェクトから name を取り出す', () => {
    expect(toPost(makeRaw({ genres: [cat('Private')] })).genres).toEqual(['Private']);
  });

  it('genres 未設定なら空配列', () => {
    expect(toPost(makeRaw({ genres: undefined })).genres).toEqual([]);
  });

  it('date は JST の暦日に変換する（UTC 深夜跨ぎで +1 日）', () => {
    // 2026-07-01T15:00Z = JST 2026-07-02 00:00 → 07-02 になる
    expect(toPost(makeRaw({ date: '2026-07-01T15:00:00.000Z' })).date).toBe('2026-07-02');
  });

  it('タイトルの前後空白を落とす', () => {
    expect(toPost(makeRaw({ title: 'aaa ' })).title).toBe('aaa');
  });

  it('eyecatch 未設定なら null', () => {
    expect(toPost(makeRaw({ eyecatch: undefined })).eyecatch).toBeNull();
  });

  it('date があれば sortKey は date', () => {
    expect(toPost(makeRaw({ date: '2026-06-26T00:00:00.000Z' })).sortKey).toBe('2026-06-26');
  });

  it('date が無ければ sortKey は publishedAt にフォールバック', () => {
    const post = toPost(makeRaw({ date: undefined, publishedAt: '2026-03-10T00:00:00.000Z' }));
    expect(post.date).toBeNull();
    expect(post.sortKey).toBe('2026-03-10');
  });

  it('date も publishedAt も無ければ sortKey は createdAt', () => {
    const post = toPost(
      makeRaw({ date: undefined, publishedAt: undefined, createdAt: '2025-11-05T00:00:00.000Z' }),
    );
    expect(post.sortKey).toBe('2025-11-05');
  });

  it('publishedAt 未設定なら null', () => {
    expect(toPost(makeRaw({ publishedAt: undefined })).publishedAt).toBeNull();
  });
});
