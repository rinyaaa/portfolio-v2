import { describe, it, expect } from "vitest";
import { isAllowedLinkHost, toAnswerSegments } from "./linkify";

describe("isAllowedLinkHost", () => {
  it("本人のドメインを許可する", () => {
    for (const href of [
      "https://nenex.me",
      "https://nenex.me/post/",
      "https://alive.nenex.me",
      "https://api.nenex.me/health",
      "https://github.com/rinyaaa",
      "https://x.com/r2e8l",
      "https://instagram.com/rinya_7",
    ]) {
      expect(isAllowedLinkHost(href)).toBe(true);
    }
  });

  it("許可リスト外は拒否する（AIが捏造したURLをクリック可能にしない）", () => {
    for (const href of [
      "https://evil.example.com",
      "https://nenex.me.evil.com", // サブドメイン偽装
      "https://github.com.evil.com",
      "https://qiita.com/someone",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
      "not a url",
    ]) {
      expect(isAllowedLinkHost(href)).toBe(false);
    }
  });
});

describe("toAnswerSegments", () => {
  it("URLが無ければテキスト1つ", () => {
    expect(toAnswerSegments("愛知工業大学です。")).toEqual([{ type: "text", value: "愛知工業大学です。" }]);
  });

  it("許可されたURLをリンクに分割する", () => {
    expect(toAnswerSegments("詳しくは https://nenex.me/post/ を見てな")).toEqual([
      { type: "text", value: "詳しくは " },
      { type: "link", value: "https://nenex.me/post/", href: "https://nenex.me/post/" },
      { type: "text", value: " を見てな" },
    ]);
  });

  it("許可リスト外のURLはテキストのまま（リンクにしない）", () => {
    const text = "ここ見て https://evil.example.com/phishing";
    expect(toAnswerSegments(text)).toEqual([{ type: "text", value: text }]);
  });

  it("URL末尾の句読点をリンクに含めない", () => {
    expect(toAnswerSegments("https://nenex.me。")).toEqual([
      { type: "link", value: "https://nenex.me", href: "https://nenex.me" },
      { type: "text", value: "。" },
    ]);
    expect(toAnswerSegments("https://nenex.me/post/、あと")).toEqual([
      { type: "link", value: "https://nenex.me/post/", href: "https://nenex.me/post/" },
      { type: "text", value: "、あと" },
    ]);
  });

  it("複数のURLを扱える", () => {
    const segments = toAnswerSegments("https://nenex.me と https://github.com/rinyaaa やけん");
    expect(segments.filter((s) => s.type === "link").map((s) => s.value)).toEqual([
      "https://nenex.me",
      "https://github.com/rinyaaa",
    ]);
  });

  it("許可と非許可が混在しても許可分だけリンクにする", () => {
    const segments = toAnswerSegments("https://evil.example.com じゃなくて https://nenex.me やけん");
    expect(segments.filter((s) => s.type === "link").map((s) => s.value)).toEqual(["https://nenex.me"]);
    expect(segments.some((s) => s.type === "text" && s.value.includes("evil.example.com"))).toBe(true);
  });

  it("分割しても元のテキストが失われない", () => {
    for (const text of [
      "詳しくは https://nenex.me/post/ を見てな",
      "https://nenex.me。",
      "https://evil.example.com のみ",
      "https://nenex.me と https://x.com/r2e8l",
    ]) {
      expect(toAnswerSegments(text).map((s) => s.value).join("")).toBe(text);
    }
  });
});
