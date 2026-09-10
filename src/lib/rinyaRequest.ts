/**
 * rinyaAI の回答API（`src/pages/api/rinya-ai.ts`）の入口チェック。
 * 判定をここに純粋関数として置き、テストで固定する。
 */

/**
 * 同一オリジンからの呼び出しかを判定する。
 *
 * `Origin` が無いリクエストは**通さない**。他サイトからの埋め込みだけでなく、
 * curl やボットからの直叩きも Workers AI の生成まで到達させないため
 * （無料枠 10,000 Neurons/日 を第三者に使われるのを防ぐ）。
 * ブラウザは同一オリジンの `POST`（`content-type: application/json`）でも
 * `Origin` を必ず送るので、これでUIの動作は壊れない。
 */
export function isSameOriginRequest(origin: string | null, requestUrl: string): boolean {
  if (origin === null || origin === "") return false;
  if (origin === "null") return false; // サンドボックス化されたiframe等の不透明オリジン

  try {
    return origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}
