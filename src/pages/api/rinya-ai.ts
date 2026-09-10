import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { RINYA_PERSONA } from "../../data/rinya-persona";
import { RINYA_QA } from "../../data/rinya-qa";
import { findRinyaAnswer } from "../../lib/rinyaAi";
import { isSameOriginRequest } from "../../lib/rinyaRequest";
import {
  MAX_ANSWER_TOKENS,
  buildSystemPrompt,
  extractAnswerText,
  sanitizeAnswer,
  validateQuestion,
} from "../../lib/rinyaPrompt";

/** このエンドポイントだけ静的化せず、リクエストごとに Worker 上で実行する。 */
export const prerender = false;

/**
 * 回答生成に使う Workers AI のモデル。
 *
 * 差し替えるのはこの1行だけ（レスポンス形の違いは `extractAnswerText` が吸収する）。
 * `gemma-4-26b-a4b-it` を既定にしたのは、無料枠 10,000 Neurons/日 での本数が最も多いため
 * （1問 ≒ 20〜25 Neurons → 約400問/日。`gpt-oss-120b` は約130問/日、`gemma-3-12b-it` は約137問/日）。
 * 日本語の口調の good/bad は本人の耳で確認して決める（issue #47 の未決事項）。
 */
const RINYA_AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";

/** 生成のばらつき。事実ベースで答えさせたいので低めにする。 */
const TEMPERATURE = 0.6;

type AnswerSource = "ai" | "fallback";

function json(body: { answer: string; source: AnswerSource } | { error: string }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // 回答は毎回生成する（CDNにもブラウザにも残さない）
      "cache-control": "no-store",
    },
  });
}

/**
 * 1つのIPが無料枠を使い切らないようにする入口制限（`wrangler.jsonc` の `ratelimits`）。
 * バインディングが無い環境（ローカルの一部構成）では制限なしで通す。
 */
async function withinRateLimit(request: Request): Promise<boolean> {
  const limiter = env.RINYA_AI_RATE_LIMITER;
  if (!limiter) return true;

  const key = request.headers.get("cf-connecting-ip") ?? "unknown";
  try {
    const { success } = await limiter.limit({ key });
    return success;
  } catch {
    return true; // 制限の失敗で機能を落とさない
  }
}

/**
 * rinyaAI の回答API。質問文をログに残さない（Workers Logs に流さない）。
 *
 * Workers AI が無料枠超過・エラーのときは固定Q&A（`RINYA_QA`）にフォールバックする。
 * Workers Free プランでは無料枠超過は課金ではなくエラーになるため、費用は増えずに
 * 「答えられない」状態に縮退する。
 */
export const POST: APIRoute = async ({ request }) => {
  if (!isSameOriginRequest(request.headers.get("origin"), request.url)) {
    return json({ error: "forbidden" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const validated = validateQuestion((body as { question?: unknown } | null)?.question);
  if (!validated.ok) {
    const status = validated.reason === "too_long" ? 413 : 400;
    return json({ error: validated.reason }, status);
  }

  if (!(await withinRateLimit(request))) {
    return json({ error: "rate_limited" }, 429);
  }

  const fallback = () => json({ answer: findRinyaAnswer(validated.question, RINYA_QA), source: "fallback" }, 200);

  if (!env.AI) {
    // ローカルで Workers AI に接続できていない場合（`wrangler login` 前など）
    return fallback();
  }

  try {
    const result = await env.AI.run(RINYA_AI_MODEL, {
      messages: [
        { role: "system", content: buildSystemPrompt(RINYA_PERSONA) },
        { role: "user", content: validated.question },
      ],
      max_tokens: MAX_ANSWER_TOKENS,
      temperature: TEMPERATURE,
      // 既定では内部推論(reasoning_content)が有効で、出力トークンをそれに使い切って
      // 回答が finish_reason: "length" で切れる。1問1答に推論は不要なので切る
      // （消費Neuronsも減る）。
      chat_template_kwargs: { enable_thinking: false },
    });

    const answer = extractAnswerText(result);
    if (answer === null) return fallback();

    return json({ answer: sanitizeAnswer(answer), source: "ai" }, 200);
  } catch (error) {
    // 質問文は出さない。原因の切り分けに必要な情報だけ残す。
    console.error("rinya-ai: Workers AI の呼び出しに失敗", error instanceof Error ? error.name : "unknown");
    return fallback();
  }
};
