import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRinyaPersonaContent,
  getRinyaQaEntries,
  splitLines,
  toRinyaPersonaContent,
  toRinyaQaEntries,
} from "./microcms";

// テストのフィクスチャには **CMS に入っている実際の値を書かない**（CLAUDE.md §4.4.1）。
// 人格データは microCMS 側にだけ置くのが本構成の目的なので、ここでは
// `ルールA` のような明らかに架空の値を使う。公開済みの事実（Profile に表示しているもの）は例外。

describe("splitLines", () => {
  it("1行1件に分割し、前後の空白と空行を落とす", () => {
    expect(splitLines("ルールA\n  ルールB  \n\n")).toEqual(["ルールA", "ルールB"]);
  });

  it("CRLF / CR の改行も扱う", () => {
    expect(splitLines("A\r\nB\rC")).toEqual(["A", "B", "C"]);
  });

  it("microCMS が空フィールドを落とすため undefined を受ける", () => {
    expect(splitLines(undefined)).toEqual([]);
    expect(splitLines("")).toEqual([]);
    expect(splitLines("   \n  \n ")).toEqual([]);
  });
});

describe("toRinyaPersonaContent", () => {
  it("両フィールドを行リストに正規化する", () => {
    expect(toRinyaPersonaContent({ toneRules: "ルールA\nルールB", privateFacts: "事実X" })).toEqual({
      toneRules: ["ルールA", "ルールB"],
      privateFacts: ["事実X"],
    });
  });

  it("フィールドが存在しないレスポンス（空のとき microCMS が落とす形）でも壊れない", () => {
    // 実測: 値が空だとキー自体が返ってこない
    expect(toRinyaPersonaContent({ createdAt: "2026-09-10T15:14:22.288Z" })).toEqual({
      toneRules: [],
      privateFacts: [],
    });
  });
});

describe("toRinyaQaEntries", () => {
  it("keyword と answer を取り出す", () => {
    expect(
      toRinyaQaEntries([{ id: "a", keyword: " 大学 ", question: "どこの大学？", answer: " 回答A " }]),
    ).toEqual([{ keyword: "大学", answer: "回答A" }]);
  });

  it("keyword か answer が欠けた行は捨てる", () => {
    expect(
      toRinyaQaEntries([
        { id: "a", keyword: "大学" },
        { id: "b", answer: "回答だけ" },
        { id: "c", keyword: "   ", answer: "空白だけのキーワード" },
        { id: "d", keyword: "有効", answer: "有効な回答" },
      ]),
    ).toEqual([{ keyword: "有効", answer: "有効な回答" }]);
  });

  it("0件（CMS にコンテンツを作っていない状態）でも空配列を返す", () => {
    expect(toRinyaQaEntries([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// フォールバック分岐（計画書のスコープ「フォールバック分岐のテスト」）
// 実APIも実キーも使わない。fetch をスタブして各分岐を固定する。
// ---------------------------------------------------------------------------

describe("getRinyaPersonaContent / getRinyaQaEntries のフォールバック", () => {
  beforeEach(() => {
    vi.stubEnv("MICROCMS_SERVICE_DOMAIN", "test-service");
    vi.stubEnv("MICROCMS_API_KEY", "test-key");
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    info = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  let warn: ReturnType<typeof vi.spyOn>;
  let info: ReturnType<typeof vi.spyOn>;

  const stubFetch = (impl: () => Promise<Response> | never) => vi.stubGlobal("fetch", vi.fn(impl));
  const jsonResponse = (body: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

  it("(a) fetch が失敗したら既定値を返して警告する", async () => {
    stubFetch(() => Promise.reject(new Error("network down")));
    await expect(getRinyaPersonaContent()).resolves.toEqual({ toneRules: [], privateFacts: [] });
    await expect(getRinyaQaEntries()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("(b) 404 が返っても既定値を返して警告する（ビルドを落とさない）", async () => {
    stubFetch(() => Promise.resolve(new Response("Not Found", { status: 404 })));
    await expect(getRinyaPersonaContent()).resolves.toEqual({ toneRules: [], privateFacts: [] });
    await expect(getRinyaQaEntries()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("(c) rinya-qa が contents を持たない（オブジェクト形式で作成）なら空＋警告", async () => {
    // 実際に踏んだケース：リスト形式ではなくオブジェクト形式で API を作ると
    // フィールドが直接返り、contents が存在しない
    stubFetch(() => jsonResponse({ keyword: "食べ物", answer: "回答" }));
    await expect(getRinyaQaEntries()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("リスト形式"));
  });

  it("(d) rinya-qa が 0 件なら空＋警告", async () => {
    stubFetch(() => jsonResponse({ contents: [], totalCount: 0, offset: 0, limit: 100 }));
    await expect(getRinyaQaEntries()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("(e) rinya-persona が空レスポンス（フィールド未入力）なら既定値＋警告", async () => {
    // microCMS は値が空のフィールドをレスポンスから落とすので、作成直後はこの形になる
    stubFetch(() => jsonResponse({ createdAt: "2026-09-10T15:14:22.288Z" }));
    await expect(getRinyaPersonaContent()).resolves.toEqual({ toneRules: [], privateFacts: [] });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("toneRules が空"));
  });

  it("(f) 正常に取得できたときは警告ではなく info を出す", async () => {
    stubFetch(() => jsonResponse({ toneRules: "語尾はA\n一人称はB", privateFacts: "事実X" }));
    await expect(getRinyaPersonaContent()).resolves.toEqual({
      toneRules: ["語尾はA", "一人称はB"],
      privateFacts: ["事実X"],
    });
    expect(info).toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
