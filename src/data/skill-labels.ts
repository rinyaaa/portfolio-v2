/**
 * Home の Skill セクションに並べる技術と、その表示ラベル。
 *
 * アイコン画像を読む処理（`skills.ts`）から名前だけを切り離してある。
 * rinyaAI の人格データ（`rinya-persona.ts`）も「使える技術」の事実としてここを参照するため、
 * サーバ側で iconify の巨大なアイコンJSONを読み込まずに名前だけ使えるようにするのが狙い。
 */
export const ICON_NAMES = [
  "html-5",
  "css-3-official",
  "javascript",
  "typescript-icon",
  "react",
  "nextjs-icon",
  "react-router",
  "threejs",
  "astro-icon",
  "kotlin-icon",
  "nodejs-icon",
  "flutter",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const SKILL_LABELS: Record<IconName, string> = {
  "html-5": "HTML",
  "css-3-official": "CSS",
  javascript: "JavaScript",
  "typescript-icon": "TypeScript",
  react: "React",
  "nextjs-icon": "Next.js",
  "react-router": "React Router",
  threejs: "Three.js",
  "astro-icon": "Astro",
  "kotlin-icon": "Kotlin(サーバーサイド)",
  "nodejs-icon": "Node.js",
  flutter: "Flutter",
};

/** 表示順の技術名リスト。 */
export const SKILL_NAMES: string[] = ICON_NAMES.map((iconName) => SKILL_LABELS[iconName]);
