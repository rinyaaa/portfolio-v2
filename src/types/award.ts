/** ホームのAwardsセクションに表示する実績1件分。microCMS化はせず、コードに直接配列で定義する。 */
export type Award = {
  rank: string;
  title: string;
  date: string | null;
  project?: string;
};
