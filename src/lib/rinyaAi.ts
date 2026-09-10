import type { RinyaQaEntry } from '../types/rinyaQa';

/**
 * 回答データに該当が無いとき、または回答データがまだ空のときに返す中立的な定型文。
 * 人格データ（口調・持ちネタ）は本人提供のものだけを使う方針のため、
 * ここでは本人の口調を装わず、状態を説明するだけの文言にする（CLAUDE.md §9.3）。
 */
export const RINYA_FALLBACK_ANSWER = 'この質問への回答はまだ用意されていません。';

/**
 * 質問文を固定Q&Aの `keyword` で簡易マッチして回答を返す。
 * 該当が無い、または `qa` が空（本人提供データ待ち）の場合はフォールバックを返し、作り話はしない。
 */
export function findRinyaAnswer(question: string, qa: RinyaQaEntry[]): string {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return RINYA_FALLBACK_ANSWER;

  const hit = qa.find((entry) => normalized.includes(entry.keyword.trim().toLowerCase()));
  return hit?.answer ?? RINYA_FALLBACK_ANSWER;
}
