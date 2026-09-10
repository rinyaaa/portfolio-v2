/**
 * Home の My Profile セクションに表示する本人のプロフィール。
 * rinyaAI の回答根拠（`rinya-persona.ts`）からも参照するため、
 * 「本人が提供しサイト上で公開している事実」の置き場所をここ1箇所に集約する
 * （表示とAIで二重管理して食い違うのを防ぐ。CLAUDE.md §9.3）。
 */
export type ProfileItem = {
  label: string;
  value: string;
};

export const PROFILE_NAME = "石丸凜弥（nenex）";

/** 構造化データ（JSON-LD Person）の `name` に使う本名。 */
export const PROFILE_FULL_NAME = "石丸凜弥";

/** 呼ばれ方。JSON-LD の `alternateName` と rinyaAI の回答根拠で共有する。 */
export const ALTERNATE_NAMES = ["りんや", "いしまる", "nenex", "ねねっくす"];

export type SnsAccount = {
  /** 表示ラベル。`ConnectLinks` のアイコン種別キーにも使う。 */
  label: string;
  handle: string;
  url: string;
};

/**
 * 公開しているSNS。Connect with me の導線・JSON-LD の `sameAs`・rinyaAI の回答根拠が
 * すべてここを参照する（URLとハンドルを1箇所で持つ）。
 */
export const SNS_ACCOUNTS: SnsAccount[] = [
  { label: "Instagram", handle: "@rinya_7", url: "https://instagram.com/rinya_7" },
  { label: "X", handle: "@r2e8l", url: "https://x.com/r2e8l" },
  { label: "GitHub", handle: "@rinyaaa", url: "https://github.com/rinyaaa" },
];

/** 公開している連絡先メールアドレス（Connect with me の mailto に使う）。 */
export const CONTACT_EMAIL = "nenex.aitsysken@gmail.com";

/** 所属大学。My Profile の表示と JSON-LD の `affiliation` で同じ値を共有する。 */
export const UNIVERSITY = "愛知工業大学";

export const PROFILE_ITEMS: ProfileItem[] = [
  { label: "大学", value: UNIVERSITY },
  { label: "所属", value: "シス研・梶研究室 / NxTEND / FORGERS" },
  { label: "開発", value: "Webフルスタック開発" },
  { label: "趣味", value: "旅行 / 絶叫系 / イベント運営 / 二郎" },
  { label: "一言", value: "ポートフォリオ制作頑張ります！" },
];
