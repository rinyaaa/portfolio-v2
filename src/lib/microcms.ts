import type { MicroCMSPost, MicroCMSListResponse, Post } from '../types/post';
import type {
  MicroCMSRinyaPersona,
  MicroCMSRinyaQa,
  RinyaPersonaContent,
} from '../types/rinyaPersona';
import type { RinyaQaEntry } from '../types/rinyaQa';

const API_VERSION = 'v1';
const ENDPOINT = 'posts';
const PERSONA_ENDPOINT = 'rinya-persona';
const QA_ENDPOINT = 'rinya-qa';
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

/** ソート済みの記事一覧から先頭 count 件を取り出す（Home の New Post プレビュー用）。 */
export function takeLatestPosts(posts: Post[], count: number): Post[] {
  return posts.slice(0, count);
}

// ---------------------------------------------------------------------------
// rinyaAI の人格データ（`rinya-persona` / `rinya-qa`）
//
// 記事と違い、**取得できなくてもビルドを落とさない**。人格データが無くても
// rinyaAI は中立的な口調で答えられる設計（`buildSystemPrompt` が分岐する）なので、
// CMS 未作成・未設定・障害でサイト全体をビルド不能にする理由がない。
// ただし黙って既定値で通ると気づけないので、警告をビルドログに出す。
// ---------------------------------------------------------------------------

/** microCMS を1回 GET する。人格データ用（失敗は呼び出し側で握る）。 */
async function fetchPersonaResource<T>(endpoint: string, query = ''): Promise<T> {
  const { serviceDomain, apiKey } = getConfig();
  const url = `https://${serviceDomain}.microcms.io/api/${API_VERSION}/${endpoint}${query}`;
  const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': apiKey } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `microCMS API request failed: ${res.status} ${res.statusText} ${body}`.trim(),
    );
  }
  return (await res.json()) as T;
}

/**
 * テキストエリア1つを「1行1件」のリストに正規化する。
 * microCMS は**空のフィールドをレスポンスから落とす**ため `undefined` を受ける前提。
 * 改行コードの差（CRLF/CR）と空行・前後空白を吸収する。
 */
export function splitLines(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** `rinya-persona` の生レスポンスを正規化する。 */
export function toRinyaPersonaContent(raw: MicroCMSRinyaPersona): RinyaPersonaContent {
  return {
    toneRules: splitLines(raw.toneRules),
    privateFacts: splitLines(raw.privateFacts),
  };
}

/** `rinya-qa` の生レスポンスを正規化する。`keyword` / `answer` が欠けた行は捨てる。 */
export function toRinyaQaEntries(raw: MicroCMSRinyaQa[]): RinyaQaEntry[] {
  return raw.flatMap((entry) => {
    const keyword = entry.keyword?.trim();
    const answer = entry.answer?.trim();
    if (!keyword || !answer) return [];
    return [{ keyword, answer }];
  });
}

/** `rinya-persona` を取得する。取得できなければ空（＝口調未設定）を返す。 */
export async function getRinyaPersonaContent(): Promise<RinyaPersonaContent> {
  try {
    const raw = await fetchPersonaResource<MicroCMSRinyaPersona>(PERSONA_ENDPOINT);
    const content = toRinyaPersonaContent(raw);
    // 取得は成功したが中身が空、というケースを見逃さない。ここを黙って通すと
    // 「CMS に入れたのに反映されていない」ことにビルドログから気づけない。
    // 値そのものは出さず、件数だけを出す。
    if (content.toneRules.length === 0) {
      console.warn(
        `[rinyaAI] ${PERSONA_ENDPOINT}: toneRules が空です。本人の口調を装わず中立的な口調でビルドします。`,
      );
    } else {
      console.info(
        `[rinyaAI] ${PERSONA_ENDPOINT}: toneRules ${content.toneRules.length}行 / privateFacts ${content.privateFacts.length}行 を読み込みました。`,
      );
    }
    return content;
  } catch (error) {
    console.warn(
      `[rinyaAI] ${PERSONA_ENDPOINT} を取得できませんでした。口調データ無しでビルドを続けます:`,
      error instanceof Error ? error.message : 'unknown',
    );
    return { toneRules: [], privateFacts: [] };
  }
}

/** `rinya-qa` を取得する。取得できなければ空配列を返す。 */
export async function getRinyaQaEntries(): Promise<RinyaQaEntry[]> {
  try {
    const list = await fetchPersonaResource<MicroCMSListResponse<MicroCMSRinyaQa>>(
      QA_ENDPOINT,
      `?limit=${LIMIT}`,
    );
    // リスト形式なら `contents` が配列で返る。オブジェクト形式で作ってしまうとフィールドが
    // 直接返って `contents` が無いため、原因が分かる警告にして空で続行する。
    if (!Array.isArray(list?.contents)) {
      console.warn(
        `[rinyaAI] ${QA_ENDPOINT} のレスポンスに contents がありません。` +
          `microCMS の API を「リスト形式」で作成しているか確認してください。` +
          `返ってきたキー: [${Object.keys(list ?? {}).join(', ')}]`,
      );
      return [];
    }
    const entries = toRinyaQaEntries(list.contents);
    // 取得件数と採用件数をビルドログに残す。0件なのか、必須フィールド欠けで捨てられたのか、
    // 下書きで公開されていないのかを切り分けられるようにする。
    if (entries.length !== list.contents.length || entries.length === 0) {
      console.warn(
        `[rinyaAI] ${QA_ENDPOINT}: API上の公開件数=${list.totalCount ?? '?'} / 取得=${list.contents.length} / 採用=${entries.length}。` +
          `採用0件なら、下書きのままか、keyword・answer が空の可能性があります。`,
      );
    } else {
      console.info(`[rinyaAI] ${QA_ENDPOINT}: ${entries.length}件を読み込みました。`);
    }
    return entries;
  } catch (error) {
    console.warn(
      `[rinyaAI] ${QA_ENDPOINT} を取得できませんでした。Q&A 無しでビルドを続けます:`,
      error instanceof Error ? error.message : 'unknown',
    );
    return [];
  }
}
