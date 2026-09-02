import logos from "@iconify-json/logos/icons.json";

/** Home の Skill セクションに表示する技術（静的ハードコード。CMS管理化はスコープ外）。
 * アイコンは @iconify-json/logos のJSONデータから直接読む(JSONインポートなのでCJSは絡まない)。
 * astro-icon経由(@iconify/utils)だと、そのCJSコードがCloudflareの開発用ランタイム(workerd)
 * で動かず "module is not defined" になるため使わない。 */
export type Skill = {
  name: string;
  viewBox: string;
  svg: string;
};

const ICON_NAMES = [
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

const LABELS: Record<(typeof ICON_NAMES)[number], string> = {
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

function loadIcon(iconName: string) {
  const icon = logos.icons[iconName as keyof typeof logos.icons] as
    | { body: string; width?: number; height?: number }
    | undefined;
  if (!icon) {
    throw new Error(`skills.ts: iconify "logos" コレクションにアイコン "${iconName}" が存在しません`);
  }
  const width = icon.width ?? logos.width;
  const height = icon.height ?? logos.height;
  return { viewBox: `0 0 ${width} ${height}`, svg: icon.body };
}

export const skills: Skill[] = ICON_NAMES.map((iconName) => ({
  name: LABELS[iconName],
  ...loadIcon(iconName),
}));
