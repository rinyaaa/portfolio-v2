import { describe, it, expect } from "vitest";
import { hasAwards } from "./awards";

describe("hasAwards", () => {
  it("空配列なら false", () => {
    expect(hasAwards([])).toBe(false);
  });

  it("1件以上あれば true", () => {
    expect(
      hasAwards([{ rank: "最優秀賞", title: "テスト", date: "2026-01-01" }])
    ).toBe(true);
  });
});
