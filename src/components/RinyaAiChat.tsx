import { Fragment, useState, type SubmitEvent } from "react";
import { DialogTrigger, Popover, Dialog, Button } from "react-aria-components";
import { RINYA_QA } from "../data/rinya-qa";
import { MAX_QUESTION_LENGTH } from "../lib/rinyaPrompt";
import styles from "./RinyaAiChat.module.scss";

type Message = {
  role: "user" | "ai";
  text: string;
  /** AIに繋がらず定型文で答えた回答。理由を画面に出して「事実が未登録」と誤解されるのを防ぐ。 */
  fromFallback?: boolean;
};
type Status = "idle" | "sending" | "error";

const API_URL = "/api/rinya-ai";
const FETCH_TIMEOUT_MS = 20000;

// 人格データ（口調・持ちネタ）は本人提供のものだけを使う方針のため、
// UI文言は本人の口調を装わず、状態を説明するだけの中立的な文にする（CLAUDE.md §9.3）。
const GREETING = "質問を入力してください。";
const ERROR_MESSAGE = "エラーが発生しました。時間をおいてもう一度お試しください。";
const RATE_LIMIT_MESSAGE = "リクエストが多いため、少し待ってからお試しください。";
const FALLBACK_NOTE = "AIに接続できなかったため、登録済みの定型文で回答しています。";

/**
 * 回答APIを叩く。生成は Worker 側（Cloudflare Workers AI）で行い、
 * 失敗・無料枠超過のときはサーバが固定Q&Aへフォールバックした回答を返す。
 */
async function respond(question: string): Promise<{ answer: string; fromFallback: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });

    if (res.status === 429) throw new Error("rate_limited");
    if (!res.ok) throw new Error(`rinya-ai request failed: ${res.status}`);

    const data = (await res.json()) as { answer?: unknown; source?: unknown };
    if (typeof data.answer !== "string" || data.answer.trim() === "") {
      throw new Error("rinya-ai returned an empty answer");
    }
    return { answer: data.answer, fromFallback: data.source === "fallback" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Home右下の固定ピルから開くrinyaAIチャット（React island、`client:idle`）。回答生成は `/api/rinya-ai`。
 *
 * `client:visible` にしてはいけない：ピルが `position: fixed` なので astro-island 要素が
 * 高さ0でドキュメント最下部に入り、最下部までスクロールしないと hydration されず、
 * 「ボタンは見えているのに押しても反応しない」状態になる。
 */
export default function RinyaAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const suggestions = RINYA_QA.slice(0, 3).map((qa) => qa.keyword);

  function send(question: string) {
    setStatus("sending");
    respond(question)
      .then(({ answer, fromFallback }) => {
        setMessages((prev) => [...prev, { role: "ai", text: answer, fromFallback }]);
        setStatus("idle");
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error && error.message === "rate_limited" ? RATE_LIMIT_MESSAGE : ERROR_MESSAGE);
        setStatus("error");
      });
  }

  function ask(question: string) {
    if (!question || status === "sending") return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLastQuestion(question);
    setInput("");
    send(question);
  }

  function retry() {
    if (!lastQuestion || status === "sending") return;
    send(lastQuestion);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(input.trim());
  }

  return (
    <DialogTrigger>
      <Button className={styles.pill}>
        {/* alt="" ：ボタン自身が「rinyaAI に聞く」というテキストを持つため、装飾として扱う */}
        <img className={styles.pillAvatar} src="/avatar.svg" alt="" width="36" height="36" />
        rinyaAI に聞く
      </Button>
      <Popover placement="top end" className={styles.popover}>
        <Dialog className={styles.dialog} aria-label="rinyaAIチャット">
          <header className={styles.header}>
            <p className={styles.title}>rinyaAI</p>
            <p className={styles.subtitle}>AI（Cloudflare Workers AI）が回答します。口調データは準備中です</p>
          </header>

          <div className={styles.messages} aria-live="polite">
            {messages.length === 0 && <p className={`${styles.bubble} ${styles.ai}`}>{GREETING}</p>}
            {messages.map((message, i) => (
              <Fragment key={i}>
                <p className={`${styles.bubble} ${styles[message.role]}`}>{message.text}</p>
                {message.fromFallback && <p className={styles.status}>{FALLBACK_NOTE}</p>}
              </Fragment>
            ))}
            {status === "sending" && <p className={styles.status}>入力中…</p>}
            {status === "error" && (
              <div className={styles.status}>
                <p role="alert">{errorMessage ?? ERROR_MESSAGE}</p>
                <button type="button" className={styles.retry} onClick={retry}>
                  もう一度送る
                </button>
              </div>
            )}
          </div>

          {messages.length === 0 && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" className={styles.suggestion} onClick={() => ask(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="質問を入力…"
              aria-label="rinyaAIへの質問"
              maxLength={MAX_QUESTION_LENGTH}
              disabled={status === "sending"}
            />
            <button
              className={styles.send}
              type="submit"
              disabled={status === "sending" || input.trim() === ""}
            >
              送信
            </button>
          </form>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
