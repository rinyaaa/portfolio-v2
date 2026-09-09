/** rinyaAI（固定Q&A方式）の1問1答。人格データは本人提供のものだけを入れる（CLAUDE.md §9.3）。 */
export type RinyaQaEntry = {
  /** マッチに使うキーワード（質問文にこの語が含まれていれば回答する）。 */
  keyword: string;
  /** 本人の口調で書かれた回答。 */
  answer: string;
};
