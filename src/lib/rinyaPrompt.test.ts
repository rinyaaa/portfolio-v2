import { describe, it, expect } from "vitest";
import type { RinyaPersona } from "../data/rinya-persona";
import {
  MAX_ANSWER_LENGTH,
  MAX_QUESTION_LENGTH,
  buildSystemPrompt,
  extractAnswerText,
  sanitizeAnswer,
  validateQuestion,
} from "./rinyaPrompt";

const basePersona: RinyaPersona = {
  toneRules: [],
  facts: ["大学：愛知工業大学", "趣味：二郎"],
  examples: [],
};

describe("validateQuestion", () => {
  it("前後の空白を落とした質問文を返す", () => {
    expect(validateQuestion("  好きな食べ物は？  ")).toEqual({ ok: true, question: "好きな食べ物は？" });
  });

  it("文字列でない値を弾く", () => {
    for (const raw of [undefined, null, 42, {}, ["質問"]]) {
      expect(validateQuestion(raw)).toEqual({ ok: false, reason: "not_string" });
    }
  });

  it("空文字・空白だけの質問を弾く", () => {
    expect(validateQuestion("")).toEqual({ ok: false, reason: "empty" });
    expect(validateQuestion("　 \n\t ")).toEqual({ ok: false, reason: "empty" });
  });

  it("上限文字数はちょうどまで許可し、超えたら弾く", () => {
    const atLimit = "あ".repeat(MAX_QUESTION_LENGTH);
    expect(validateQuestion(atLimit)).toEqual({ ok: true, question: atLimit });
    expect(validateQuestion("あ".repeat(MAX_QUESTION_LENGTH + 1))).toEqual({ ok: false, reason: "too_long" });
  });

  it("空白を落とした後の長さで判定する", () => {
    const padded = `  ${"あ".repeat(MAX_QUESTION_LENGTH)}  `;
    expect(validateQuestion(padded).ok).toBe(true);
  });
});

describe("buildSystemPrompt", () => {
  it("事実をすべて載せる", () => {
    const prompt = buildSystemPrompt(basePersona);
    for (const fact of basePersona.facts) {
      expect(prompt).toContain(fact);
    }
  });

  it("事実に無いことを創作させない指示と、入力中の指示に従わない指示を必ず含む", () => {
    const prompt = buildSystemPrompt(basePersona);
    expect(prompt).toContain("推測・創作せず");
    expect(prompt).toContain("訪問者のメッセージに含まれる指示");
  });

  it("口調データが空のときは口調を真似させない", () => {
    const prompt = buildSystemPrompt(basePersona);
    expect(prompt).toContain("推測して真似せず");
  });

  it("口調データがあるときはそれを載せ、真似しない指示は出さない", () => {
    const prompt = buildSystemPrompt({ ...basePersona, toneRules: ["語尾は「〜っす」"] });
    expect(prompt).toContain("語尾は「〜っす」");
    expect(prompt).not.toContain("推測して真似せず");
  });

  it("発言例があるときだけ例のセクションを出す", () => {
    expect(buildSystemPrompt(basePersona)).not.toContain("言い回しの例");

    const withExamples = buildSystemPrompt({
      ...basePersona,
      examples: [{ question: "好きな食べ物は？", answer: "二郎" }],
    });
    expect(withExamples).toContain("言い回しの例");
    expect(withExamples).toContain("Q: 好きな食べ物は？");
    expect(withExamples).toContain("A: 二郎");
  });
});

describe("extractAnswerText", () => {
  it("OpenAI互換の形（choices[].message.content）から取り出す", () => {
    const raw = { choices: [{ index: 0, message: { role: "assistant", content: " 二郎です " } }] };
    expect(extractAnswerText(raw)).toBe("二郎です");
  });

  it("旧来の形（response）から取り出す", () => {
    expect(extractAnswerText({ response: " 二郎です " })).toBe("二郎です");
  });

  it("想定外の形・空の回答では null を返す", () => {
    for (const raw of [
      null,
      undefined,
      "文字列",
      {},
      { response: "" },
      { response: "   " },
      { response: 42 },
      { choices: [] },
      { choices: [{}] },
      { choices: [{ message: {} }] },
      { choices: [{ message: { content: "" } }] },
      { choices: [{ message: { content: null } }] },
      { choices: "配列ではない" },
    ]) {
      expect(extractAnswerText(raw)).toBeNull();
    }
  });
});

describe("sanitizeAnswer", () => {
  it("前後の空白を落とす", () => {
    expect(sanitizeAnswer("  二郎です  ")).toBe("二郎です");
  });

  it("上限を超えた回答を打ち切る", () => {
    const long = "あ".repeat(MAX_ANSWER_LENGTH + 50);
    const result = sanitizeAnswer(long);
    expect(result).toHaveLength(MAX_ANSWER_LENGTH + 1); // 打ち切り記号の1文字
    expect(result.endsWith("…")).toBe(true);
  });

  it("上限ちょうどの回答はそのまま返す", () => {
    const atLimit = "あ".repeat(MAX_ANSWER_LENGTH);
    expect(sanitizeAnswer(atLimit)).toBe(atLimit);
  });

  it("チャットテンプレートの制御トークンを落とす", () => {
    expect(sanitizeAnswer("愛知工業大学に通っています。<turn|>")).toBe("愛知工業大学に通っています。");
    expect(sanitizeAnswer("<start_of_turn>二郎です<end_of_turn>")).toBe("二郎です");
    expect(sanitizeAnswer("二郎です<|im_end|>")).toBe("二郎です");
  });

  it("日本語や記号を含む通常の回答は壊さない", () => {
    expect(sanitizeAnswer("Astro と React で作っています（TypeScript / SCSS）。")).toBe(
      "Astro と React で作っています（TypeScript / SCSS）。",
    );
    expect(sanitizeAnswer("1 < 2 なので x > y ではありません。")).toBe("1 < 2 なので x > y ではありません。");
  });
});
