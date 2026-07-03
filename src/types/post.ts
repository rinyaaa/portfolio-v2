/** microCMS の画像フィールド（eyecatch 等）。 */
export type MicroCMSImage = {
  url: string;
  width: number;
  height: number;
};

/**
 * microCMS の「カテゴリ」コンテンツ（`genres` が参照する先）。
 * genres フィールドは複数参照なので、この配列で返る。
 * 想定される name: KajiLab / Private / Product（CMS 側で増やせる）。
 */
export type MicroCMSCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
};

/**
 * microCMS `posts`（リスト形式）の1コンテンツ。生レスポンスの形。
 * 仕様は CLAUDE.md 4.1 を参照。
 * - `content` はリッチエディタの出力 HTML（本文）。
 * - `genres` はカテゴリへの複数参照（オブジェクト配列で返る）。
 * - `date` / `eyecatch` は未設定なら undefined。
 * - `id` は microCMS の contentId（詳細ページの URL に使う）。
 */
export type MicroCMSPost = {
  id: string;
  title: string;
  date?: string;
  genres?: MicroCMSCategory[];
  content: string;
  eyecatch?: MicroCMSImage;
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
  /** microCMS の contentId（詳細ページ works/[id] に使う） */
  id: string;
  title: string;
  /** イベント/発表日（JST の YYYY-MM-DD）。未設定なら null。 */
  date: string | null;
  /** ジャンル名の配列（カテゴリ参照の name を取り出したもの） */
  genres: string[];
  /** 描画に使う本文 HTML（microCMS リッチエディタの content） */
  bodyHtml: string;
  /** アイキャッチ画像。未設定なら null。 */
  eyecatch: MicroCMSImage | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  /**
   * ソート用キー（JST の YYYY-MM-DD, 降順で新しいものが上）。
   * date があればそれ、無ければ publishedAt、無ければ createdAt。
   */
  sortKey: string;
};
