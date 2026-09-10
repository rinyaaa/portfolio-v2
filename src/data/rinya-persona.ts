import { BIRTHDAY } from "./birthday";
import { ALTERNATE_NAMES, PROFILE_ITEMS, PROFILE_NAME, SNS_ACCOUNTS } from "./profile";
import { SKILL_NAMES } from "./skill-labels";

/**
 * rinyaAI がシステムプロンプトに載せる人格データ。
 *
 * **口調ルールと発言例は本人提供のものだけを入れる**（CLAUDE.md §9.3。実装者が創作しない）。
 * 未提供のうちは空配列のままにしておき、その場合 rinyaAI は本人の口調を装わず
 * 中立的な丁寧語で答える（`buildSystemPrompt` 側で分岐する）。
 *
 * `facts` は「本人が提供し、すでにサイト上で公開されている事実」だけを集めたもの。
 * 出どころは Home の各セクション（Profile / Skill / Birthday / Connect with me）と
 * 構造化データなので、表示とAIで内容が食い違わないよう元データを直接 import している。
 * **サイトに表示していないことは、本人の承認なしにここへ足さない**
 * （例：CMSやホスティングなど技術構成を訪問者へ開示するかは本人の判断事項）。
 * メールアドレスは Connect with me に載っているが、AIが文脈次第で書き出さないよう
 * ここには含めず「Connect with me から」と案内させる。
 */
export type RinyaPersona = {
  /** 本人の口調ルール（例：語尾・一人称・砕けた度合い）。**本人提供待ちのため空**。 */
  toneRules: string[];
  /** 回答の根拠にできる事実。ここに無いことは「分からない」と答えさせる。 */
  facts: string[];
  /**
   * 本人の実際の言い回しを学ばせるための例。**本人提供のものだけを入れる**。
   * `question` は任意——質問文が無くても「回答文そのもの」が口調の見本になるため、
   * microCMS 側で `question` を空にしたレコードも捨てずに使う。
   */
  examples: { question?: string; answer: string }[];
};

const profileFacts = PROFILE_ITEMS.map((item) => `${item.label}：${item.value}`);

/**
 * サイト表示済みの事実だけで組み立てた既定の人格データ。
 * CMS が未作成・未設定・取得失敗のときはこれがそのまま使われる（＝現状と同じ挙動）。
 */
export const RINYA_PERSONA: RinyaPersona = {
  toneRules: [],
  facts: [
    `名前：${PROFILE_NAME}。${ALTERNATE_NAMES.map((name) => `「${name}」`).join("")}と呼ばれる`,
    ...profileFacts,
    `誕生日：${BIRTHDAY.month}月${BIRTHDAY.day}日（生年は非公開）`,
    `使える技術：${SKILL_NAMES.join(" / ")}`,
    `SNS：${SNS_ACCOUNTS.map((account) => `${account.label} は ${account.handle}`).join("、")}`,
    "連絡先：このサイトの Connect with me セクションから辿れる",
  ],
  examples: [],
};

/**
 * 既定の人格データに、microCMS 由来の口調ルールと非公開の事実を重ねる。
 *
 * - `toneRules` … CMS の内容で**置き換える**（既定は空なので実質「入れる」）
 * - `privateFacts` … 既定の `facts`（サイト表示済み）の**後ろに足す**。
 *   サイトに表示していない事実はここから来る。表示済みの事実を CMS 側で二重管理しないため。
 * - CMS が空なら既定値のまま返る（＝口調を装わない中立的な回答になる）
 */
export function withCmsPersona(
  base: RinyaPersona,
  cms: { toneRules: string[]; privateFacts: string[] },
  examples: RinyaPersona["examples"] = [],
): RinyaPersona {
  return {
    toneRules: cms.toneRules,
    facts: [...base.facts, ...cms.privateFacts],
    examples,
  };
}
