import type { RinyaQaEntry } from '../types/rinyaQa';

/**
 * 該当が無いときに返す定型文の **既定値**。本人の口調を装わない中立的な文言にしてある。
 *
 * 本人の口調で断らせたい場合は microCMS `rinya-persona` の `fallbackAnswer` に入れる
 * （口調データを Public リポジトリに置かないため。CLAUDE.md §4.4.1）。
 * CMS が未設定・取得失敗のときはこの文言が使われる（CLAUDE.md §9.3）。
 */
export const RINYA_FALLBACK_ANSWER = 'この質問への回答はまだ用意されていません。';

/**
 * 質問文を固定Q&Aの `keyword` で簡易マッチして回答を返す。
 * 該当が無い、または `qa` が空（本人提供データ待ち）の場合はフォールバックを返し、作り話はしない。
 *
 * `fallbackAnswer` は CMS 由来の定型文。空・未設定なら `RINYA_FALLBACK_ANSWER` に落とす。
 */
export function findRinyaAnswer(
  question: string,
  qa: RinyaQaEntry[],
  fallbackAnswer?: string,
): string {
  const fallback = fallbackAnswer?.trim() || RINYA_FALLBACK_ANSWER;

  const normalized = question.trim().toLowerCase();
  if (!normalized) return fallback;

  const hit = qa.find((entry) => normalized.includes(entry.keyword.trim().toLowerCase()));
  return hit?.answer ?? fallback;
}
