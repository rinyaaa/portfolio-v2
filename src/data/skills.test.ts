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

  it("各アイコンは astro-icon の logos パックを指す", () => {
    for (const skill of skills) {
      expect(skill.icon).toMatch(/^logos:/);
    }
  });

  it("アイコン・ラベルとも重複がない", () => {
    expect(new Set(skills.map((s) => s.icon)).size).toBe(skills.length);
    expect(new Set(skills.map((s) => s.name)).size).toBe(skills.length);
  });
});
