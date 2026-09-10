/** microCMS `rinya-persona`（オブジェクト形式）の生レスポンス。
 *  **値が空のフィールドはレスポンスから消える**（`""` ではなくキー自体が無い）ため、すべて optional。 */
export type MicroCMSRinyaPersona = {
  toneRules?: string;
  privateFacts?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  revisedAt?: string;
};

/** microCMS `rinya-qa`（リスト形式）の1件。`keyword` / `answer` は必須設定なので値がある前提だが、
 *  API の設定変更で欠ける可能性があるため optional で受けて整形側で捨てる。 */
export type MicroCMSRinyaQa = {
  id: string;
  keyword?: string;
  question?: string;
  answer?: string;
};

/** 上位レイヤが受け取る正規化済みの人格データ（CMS由来の分）。 */
export type RinyaPersonaContent = {
  toneRules: string[];
  privateFacts: string[];
};
