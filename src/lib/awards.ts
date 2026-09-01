import type { Award } from "../types/award";

/** Awardsセクションを表示するかどうか。配列が空なら非表示にする。 */
export function hasAwards(awards: Award[]): boolean {
  return awards.length > 0;
}
