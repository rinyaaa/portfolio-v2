import type { RinyaQaEntry } from '../types/rinyaQa';

/** 回答データに該当が無いとき、または回答データがまだ空のときに返す定型文（本人の口調）。 */
export const RINYA_FALLBACK_ANSWER = 'うーん、それはまだ答えを用意してないんだ。ごめんね！';

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
