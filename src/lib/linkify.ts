import { SNS_ACCOUNTS } from "../data/profile";

/**
 * 回答テキストの中で **リンクにしてよいホスト** の許可リスト。
 *
 * AI の出力を無条件にリンク化しない。モデルはもっともらしい嘘のURLを作ることがあり、
 * それをクリック可能にすると訪問者を意図しない場所へ誘導してしまう。
 * 本人のドメインだけに限定すれば、AI が何を出力してもリンクになる先は安全な場所だけになる。
 */
const ALLOWED_HOSTS: readonly string[] = [
  "nenex.me",
  "api.nenex.me",
  "alive.nenex.me",
  "v1.nenex.me",
  // Connect with me に載っているSNS（`src/data/profile.ts` を単一データ源として使う）
  ...SNS_ACCOUNTS.map((account) => new URL(account.url).host),
];

/** テキストを「そのまま表示する部分」と「リンクにする部分」に分割した結果。 */
export type AnswerSegment = { type: "text"; value: string } | { type: "link"; value: string; href: string };

/**
 * http(s) のURLらしき連続文字を拾う。
 *
 * 文字集合を **RFC 3986 で URL に使える ASCII だけ**に限定している。
 * 「除外文字リスト」方式にすると `https://nenex.me/post/、あと` のように
 * 日本語が直後に続いたときに URL に飲み込まれる（実際にテストで踏んだ）。
 * 日本語は URL 内では percent-encode されるため、ASCII 限定で問題ない。
 */
const URL_PATTERN = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;

/** URL の末尾に付きがちな句読点を落とす（「〜https://nenex.me。」のような文末）。 */
function trimTrailingPunctuation(raw: string): { url: string; trailing: string } {
  const match = /[.,．，、。!?！？)）\]】]+$/.exec(raw);
  if (!match) return { url: raw, trailing: "" };
  return { url: raw.slice(0, match.index), trailing: match[0] };
}

/** 許可リストに載っているホストかを判定する（サブドメイン偽装 `nenex.me.evil.com` を弾く）。 */
export function isAllowedLinkHost(href: string): boolean {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return ALLOWED_HOSTS.includes(url.host);
  } catch {
    return false;
  }
}

/**
 * 回答テキストを、表示用のセグメントに分割する。
 * 許可リストに無いURLは `text` のまま返す（＝リンクにしない）。
 */
export function toAnswerSegments(text: string): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const start = match.index;
    const { url, trailing } = trimTrailingPunctuation(raw);

    if (!isAllowedLinkHost(url)) continue;

    if (start > lastIndex) segments.push({ type: "text", value: text.slice(lastIndex, start) });
    segments.push({ type: "link", value: url, href: url });
    if (trailing !== "") segments.push({ type: "text", value: trailing });
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) segments.push({ type: "text", value: text.slice(lastIndex) });
  return segments;
}
