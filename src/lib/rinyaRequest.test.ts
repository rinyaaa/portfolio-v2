import { describe, it, expect } from "vitest";
import { isSameOriginRequest } from "./rinyaRequest";

const REQUEST_URL = "https://nenex.me/api/rinya-ai";

describe("isSameOriginRequest", () => {
  it("同一オリジンからの呼び出しを通す", () => {
    expect(isSameOriginRequest("https://nenex.me", REQUEST_URL)).toBe(true);
    expect(isSameOriginRequest("http://localhost:4321", "http://localhost:4321/api/rinya-ai")).toBe(true);
  });

  it("別オリジンからの呼び出しを弾く", () => {
    expect(isSameOriginRequest("https://evil.example.com", REQUEST_URL)).toBe(false);
    expect(isSameOriginRequest("http://nenex.me", REQUEST_URL)).toBe(false); // スキーム違い
    expect(isSameOriginRequest("https://nenex.me.evil.com", REQUEST_URL)).toBe(false);
    expect(isSameOriginRequest("https://nenex.me:8443", REQUEST_URL)).toBe(false); // ポート違い
  });

  it("Origin が無い・空・不透明なリクエストを弾く（curl やボットの直叩き対策）", () => {
    expect(isSameOriginRequest(null, REQUEST_URL)).toBe(false);
    expect(isSameOriginRequest("", REQUEST_URL)).toBe(false);
    expect(isSameOriginRequest("null", REQUEST_URL)).toBe(false);
  });

  it("URLとして解釈できない値を弾く", () => {
    expect(isSameOriginRequest("https://nenex.me", "not a url")).toBe(false);
    expect(isSameOriginRequest("not an origin", REQUEST_URL)).toBe(false);
  });
});
