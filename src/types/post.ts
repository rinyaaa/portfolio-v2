/** microCMS の画像フィールド（eyecatch 等）。 */
export type MicroCMSImage = {
  url: string;
  width: number;
  height: number;
};

export type MicroCMSCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
};

export type MicroCMSPost = {
  id: string;
  title: string;
  date?: string;
  genres?: MicroCMSCategory[];
  content: string;
  eyecatch: MicroCMSImage;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
};

/** microCMS のリスト API 共通レスポンス。 */
export type MicroCMSListResponse<T> = {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
};

/**
 * サイトの上位レイヤ（pages / components）が受け取る加工済み記事。
 * microCMS 依存はここで吸収して正規化する。
 */
export type Post = {
  id: string;
  title: string;
  date: string | null;
  genres: string[];
  bodyHtml: string;
  eyecatch: MicroCMSImage;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  sortKey: string;
};
