/** Home の Skill セクションに表示する技術（静的ハードコード。CMS管理化はスコープ外）。 */
export type Skill = {
  name: string;
  /** astro-icon に渡す `パック名:アイコン名`（@iconify-json/logos）。 */
  icon: string;
};

export const skills: Skill[] = [
  { name: "HTML", icon: "logos:html-5" },
  { name: "CSS", icon: "logos:css-3-official" },
  { name: "JavaScript", icon: "logos:javascript" },
  { name: "TypeScript", icon: "logos:typescript" },
  { name: "React", icon: "logos:react" },
  { name: "Next.js", icon: "logos:nextjs-icon" },
  { name: "React Router", icon: "logos:react-router" },
  { name: "Three.js", icon: "logos:threejs" },
  { name: "Astro", icon: "logos:astro-icon" },
  { name: "Kotlin(サーバーサイド)", icon: "logos:kotlin-icon" },
  { name: "Node.js", icon: "logos:nodejs-icon" },
  { name: "Flutter", icon: "logos:flutter" },
];
