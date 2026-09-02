import { describe, it, expect } from "vitest";
import { skills } from "./skills";

describe("skills", () => {
  it("issue #26 で指定された12件をすべて含む", () => {
    const names = skills.map((s) => s.name);
    expect(names).toEqual([
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "React Router",
      "Three.js",
      "Astro",
      "Kotlin(サーバーサイド)",
      "Node.js",
      "Flutter",
    ]);
  });

  it("各アイコンは有効なviewBoxとSVGマークアップを持つ", () => {
    for (const skill of skills) {
      expect(skill.viewBox).toMatch(/^\d+ \d+ \d+ \d+$/);
      expect(skill.svg).toContain("<path");
    }
  });

  it("ラベルに重複がない", () => {
    expect(new Set(skills.map((s) => s.name)).size).toBe(skills.length);
  });
});
