import type { RinyaQaEntry } from "../types/rinyaQa";

/**
 * rinyaAI の回答データ。人格データ（口調・持ちネタ）は本人提供のものだけを使う方針のため、
 * 本人からのヒアリングが済むまで空のまま扱う（CLAUDE.md §9.3。実装者が口調・嗜好・経歴を創作しない）。
 */
export const RINYA_QA: RinyaQaEntry[] = [];
