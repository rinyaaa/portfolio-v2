import logos from "@iconify-json/logos/icons.json";
import { ICON_NAMES, SKILL_LABELS } from "./skill-labels";

/** Home の Skill セクションに表示する技術（静的ハードコード。CMS管理化はスコープ外）。
 * アイコンは @iconify-json/logos のJSONデータから直接読む(JSONインポートなのでCJSは絡まない)。
 * astro-icon経由(@iconify/utils)だと、そのCJSコードがCloudflareの開発用ランタイム(workerd)
 * で動かず "module is not defined" になるため使わない。 */
export type Skill = {
  name: string;
  viewBox: string;
  svg: string;
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
  name: SKILL_LABELS[iconName],
  ...loadIcon(iconName),
}));
