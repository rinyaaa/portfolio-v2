import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCollection, getEntry } from "astro:content";
import { RINYA_PERSONA, withCmsPersona } from "../../data/rinya-persona";
import { RINYA_QA } from "../../data/rinya-qa";
import { findRinyaAnswer } from "../../lib/rinyaAi";
import { isSameOriginRequest } from "../../lib/rinyaRequest";
import { MAX_ANSWER_TOKENS, buildSystemPrompt, pickAnswer, validateQuestion } from "../../lib/rinyaPrompt";

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

/**
 * ビルド時に microCMS から焼き込んだ人格データを読む（実行時 fetch はしない）。
 * CMS が未作成・未設定・取得失敗ならコレクションが空になり、コードの既定値がそのまま使われる。
 */
async function loadPersona() {
  const entry = await getEntry("rinyaPersona", "singleton");
  const qa = await getCollection("rinyaQa");
  // `question` が空でも回答文が口調の見本になるので捨てない
  const examples = qa.map((item) => ({ question: item.data.question, answer: item.data.answer }));

  const persona = withCmsPersona(
    RINYA_PERSONA,
    {
      toneRules: entry?.data.toneRules ?? [],
      privateFacts: entry?.data.privateFacts ?? [],
    },
    examples,
  );

  // 固定Q&Aのフォールバックも CMS 由来を優先し、無ければコードの既定値（現状は空）を使う
  const fallbackQa = qa.length > 0 ? qa.map((item) => item.data) : RINYA_QA;

  return { persona, fallbackQa };
}

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

/** レート制限の判定結果。`unavailable` は「制限が働かないので AI は呼ばない」を意味する。 */
type RateLimitResult = "ok" | "limited" | "unavailable";

/**
 * 1つのIPが無料枠を使い切らないようにする入口制限（`wrangler.jsonc` の `ratelimits`）。
 *
 * 制限が判定できないとき（バインディングが無い / `limit()` が例外）は `unavailable` を返し、
 * 呼び出し側は AI を呼ばず固定Q&Aで応答する。**ここを「制限なしで通す」にしてはいけない**——
 * 制限が壊れている間に連続リクエストを受けると無料枠を使い切り、rinyaAI 自体が答えられなくなる。
 */
async function checkRateLimit(request: Request): Promise<RateLimitResult> {
  const limiter = env.RINYA_AI_RATE_LIMITER;
  if (!limiter) return "unavailable";

  const key = request.headers.get("cf-connecting-ip") ?? "unknown";
  try {
    const { success } = await limiter.limit({ key });
    return success ? "ok" : "limited";
  } catch {
    return "unavailable";
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

  const { persona, fallbackQa } = await loadPersona();
  const fallback = () => json({ answer: findRinyaAnswer(validated.question, fallbackQa), source: "fallback" }, 200);

  const rateLimit = await checkRateLimit(request);
  if (rateLimit === "limited") {
    return json({ error: "rate_limited" }, 429);
  }
  if (rateLimit === "unavailable") {
    // 制限が働かない状態で AI を呼ぶと無料枠を使い切られるため、定型文で応答する
    return fallback();
  }

  if (!env.AI) {
    // ローカルで Workers AI に接続できていない場合（`wrangler login` 前など）
    return fallback();
  }

  try {
    const result = await env.AI.run(RINYA_AI_MODEL, {
      messages: [
        { role: "system", content: buildSystemPrompt(persona) },
        { role: "user", content: validated.question },
      ],
      max_tokens: MAX_ANSWER_TOKENS,
      temperature: TEMPERATURE,
      // 既定では内部推論(reasoning_content)が有効で、出力トークンをそれに使い切って
      // 回答が finish_reason: "length" で切れる。1問1答に推論は不要なので切る
      // （消費Neuronsも減る）。
      chat_template_kwargs: { enable_thinking: false },
    });

    // 整形後が空になる場合（制御トークンだけの回答など）も null になり、固定Q&Aへ落ちる
    const answer = pickAnswer(result);
    if (answer === null) return fallback();

    return json({ answer, source: "ai" }, 200);
  } catch (error) {
    // 質問文は出さない。原因の切り分けに必要な情報だけ残す。
    console.error("rinya-ai: Workers AI の呼び出しに失敗", error instanceof Error ? error.name : "unknown");
    return fallback();
  }
};
