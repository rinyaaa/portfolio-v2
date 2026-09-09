import { useState, type SubmitEvent } from "react";
import { DialogTrigger, Popover, Dialog, Button } from "react-aria-components";
import { RINYA_QA } from "../data/rinya-qa";
import { findRinyaAnswer } from "../lib/rinyaAi";
import styles from "./RinyaAiChat.module.scss";

type Message = { role: "user" | "ai"; text: string };
type Status = "idle" | "sending" | "error";

const GREETING = "こんにちは！りんやのことなら何でも聞いてね〜";
const ERROR_MESSAGE = "うまく答えられなかった…！少し時間をおいてもう一回聞いてみて。";

/** 回答を1問1答のQ&Aから探す（今夜はデータが空のため常にフォールバックになる）。 */
function respond(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(findRinyaAnswer(question, RINYA_QA));
      } catch (error) {
        reject(error);
      }
    }, 300);
  });
}

/** Home右下の固定ピルから開くrinyaAIチャット（React island、client:load）。 */
export default function RinyaAiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const suggestions = RINYA_QA.slice(0, 3).map((qa) => qa.keyword);

  function send(question: string) {
    setStatus("sending");
    respond(question)
      .then((answer) => {
        setMessages((prev) => [...prev, { role: "ai", text: answer }]);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
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
      <Button className={styles.pill}>rinyaAI に聞く</Button>
      <Popover placement="top end" className={styles.popover}>
        <Dialog className={styles.dialog} aria-label="rinyaAIチャット">
          <header className={styles.header}>
            <p className={styles.title}>rinyaAI</p>
            <p className={styles.subtitle}>AIが本人の口調で答えます</p>
          </header>

          <div className={styles.messages} aria-live="polite">
            {messages.length === 0 && <p className={`${styles.bubble} ${styles.ai}`}>{GREETING}</p>}
            {messages.map((message, i) => (
              <p key={i} className={`${styles.bubble} ${styles[message.role]}`}>
                {message.text}
              </p>
            ))}
            {status === "sending" && <p className={styles.status}>入力中…</p>}
            {status === "error" && (
              <div className={styles.status}>
                <p role="alert">{ERROR_MESSAGE}</p>
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
