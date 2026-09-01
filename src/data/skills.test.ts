import { describe, it, expect } from "vitest";
import { skills } from "./skills";
import logosIconSet from "@iconify-json/logos/icons.json";

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

  it("各アイコンは @iconify-json/logos に実在する", () => {
    for (const skill of skills) {
      expect(skill.icon).toMatch(/^logos:/);
      const iconName = skill.icon.replace(/^logos:/, "");
      expect(logosIconSet.icons).toHaveProperty(iconName);
    }
  });

  it("アイコン・ラベルとも重複がない", () => {
    expect(new Set(skills.map((s) => s.icon)).size).toBe(skills.length);
    expect(new Set(skills.map((s) => s.name)).size).toBe(skills.length);
  });
});
