import type { MicroCMSPost, MicroCMSListResponse, Post } from '../types/post';

const API_VERSION = 'v1';
const ENDPOINT = 'posts';
const LIMIT = 100; // microCMS の 1 リクエスト最大件数

type MicroCMSConfig = {
  serviceDomain: string;
  apiKey: string;
};

/**
 * ビルド時の環境変数から microCMS 設定を読む。
 * 未設定なら早期にエラーにして、原因を分かりやすくする。
 */
function getConfig(): MicroCMSConfig {
  // ローカルは .env（import.meta.env）、Cloudflare Pages は OS 環境変数（process.env）から渡る。
  // 環境差で取りこぼさないよう両方を見る。
  const serviceDomain =
    import.meta.env.MICROCMS_SERVICE_DOMAIN ?? process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = import.meta.env.MICROCMS_API_KEY ?? process.env.MICROCMS_API_KEY;
  if (!serviceDomain || !apiKey) {
    throw new Error(
      'MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が未設定です。ローカルは .env、Cloudflare Pages は環境変数を確認してください。',
    );
  }
  return { serviceDomain, apiKey };
}

/** 指定 offset のページを1回 fetch する（date 降順）。 */
async function fetchPostsPage(
  offset: number,
  { serviceDomain, apiKey }: MicroCMSConfig,
): Promise<MicroCMSListResponse<MicroCMSPost>> {
  const base = `https://${serviceDomain}.microcms.io/api/${API_VERSION}/${ENDPOINT}`;
  const url = `${base}?limit=${LIMIT}&offset=${offset}&orders=-date`;
  const res = await fetch(url, {
    headers: { 'X-MICROCMS-API-KEY': apiKey },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`microCMS API request failed: ${res.status} ${res.statusText} ${body}`.trim());
  }
  return (await res.json()) as MicroCMSListResponse<MicroCMSPost>;
}

/**
 * microCMS の全記事を取得する
 */
export async function fetchAllMicroCMSPosts(): Promise<MicroCMSPost[]> {
  const config = getConfig();
  const all: MicroCMSPost[] = [];
  let offset = 0;
  let totalCount = Infinity;

  while (offset < totalCount) {
    const data = await fetchPostsPage(offset, config);
    all.push(...data.contents);
    totalCount = data.totalCount;
    offset += data.contents.length;
    // 想定外に contents が空なら無限ループを避けて打ち切る
    if (data.contents.length === 0) break;
  }

  return all;
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * ISO 8601 の瞬間を JST の暦日に変換する。
 */
function toJstDateString(iso: string): string {
  return new Date(new Date(iso).getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 生の MicroCMSPost を上位レイヤ用の Post に正規化する。 */
export function toPost(raw: MicroCMSPost): Post {
  const publishedAt = raw.publishedAt ?? null;
  // date > publishedAt > createdAt の優先でソートキーを決める（仕様 4.3）
  const sortSource = raw.date ?? raw.publishedAt ?? raw.createdAt;
  return {
    id: raw.id,
    title: raw.title.trim(),
    date: raw.date ? toJstDateString(raw.date) : null,
    genres: (raw.genres ?? []).map((g) => g.name),
    bodyHtml: raw.content,
    eyecatch: raw.eyecatch,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    publishedAt,
    sortKey: toJstDateString(sortSource),
  };
}

export function sortPostsByKeyDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

/**
 * 公開記事を取得し、sortKey 降順（新しいものが上）に並べて返す。
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await fetchAllMicroCMSPosts();
  return sortPostsByKeyDesc(posts.map(toPost));
}
