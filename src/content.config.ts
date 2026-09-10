import { defineCollection } from "astro:content";
// `astro:content` の `z` は deprecated なので `astro/zod` から取る
import { z } from "astro/zod";
import { getRinyaPersonaContent, getRinyaQaEntries } from "./lib/microcms";

/**
 * rinyaAI の人格データを **ビルド時に** microCMS から取得して Worker のバンドルに焼き込む。
 *
 * Content Layer を使う理由：`src/pages/api/rinya-ai.ts` は実行時に Worker 上で動くため、
 * 実行時 fetch を避けるにはビルド時のデータをバンドルへ入れる必要がある。
 * 検証済み（2026-09-10）：`prerender = false` のエンドポイントから `getEntry` で読める。
 * データは `dist/server/chunks/_astro_data-layer-content_*.mjs` に入る。
 *
 * 実行時に microCMS を叩かないのは、①`MICROCMS_API_KEY` を Worker に常駐させたくない
 * ②microCMS が落ちても rinyaAI は答えられるようにする、の2点のため（CLAUDE.md §3・§4.5）。
 */
const rinyaPersona = defineCollection({
  // スキーマを付けないと生成型が `data: any` になり、フィールド名を変えても `astro check` が
  // 通ってしまう（実行時に静かに口調データが消える）。CLAUDE.md §8「any は原則禁止」。
  schema: z.object({
    toneRules: z.array(z.string()),
    privateFacts: z.array(z.string()),
  }),
  loader: async () => {
    const content = await getRinyaPersonaContent();
    // オブジェクト形式APIなので1件だけ。id は固定。
    return [{ id: "singleton", ...content }];
  },
});

const rinyaQa = defineCollection({
  schema: z.object({
    keyword: z.string(),
    // microCMS 側で任意フィールドなので空のことがある
    question: z.string().optional(),
    answer: z.string(),
  }),
  loader: async () => {
    const entries = await getRinyaQaEntries();
    // Content Layer は id が必須。keyword は microCMS 側で必須なので一意性は運用で担保する。
    return entries.map((entry, index) => ({ id: `${index}`, ...entry }));
  },
});

export const collections = { rinyaPersona, rinyaQa };
