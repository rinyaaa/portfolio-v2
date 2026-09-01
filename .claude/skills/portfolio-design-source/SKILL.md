---
name: portfolio-design-source
description: このportfolioでUI/デザインを実装・変更するときに使う。「UIを直して」「デザインを反映して」「Figma通りに実装して」「aboutページを作って」「Skillセクション/Awardsセクションを実装して」等で発動。このプロジェクトのFigmaデザインファイルとフレーム↔ページ対応、実装前に確認すべき未確定データを提供する。
---

# ポートフォリオのデザインソース（Figma）

見た目のデザインは以下のFigmaファイルが正。UI/デザインに関わるタスクは、実装前に必ず `figma-design-to-code` スキル経由で該当フレームを確認すること（`get_design_context` を直接呼ばず、先にそのスキルを読む）。

- ファイル：`https://www.figma.com/design/ZqSjtDOwDZ7tLvNFYOPkWS/ポートフォリオ`
- フレーム対応（2026-09-01 確認済み、ユーザー確認済み）：
  - `182:32`（"MacBook Pro 14\" - 4"）→ Home（`src/pages/index.astro`）。Profile拡張 + Skill（Frontend/Tools/Others、**アイコンはFigma上まだ"HTML5"プレースホルダーのまま**）+ New Post プレビュー（3カード + "Show more" → `/post`）+ Awards一覧 + Connect with me（Instagram / X / GitHub / Email）
  - `20:2`（"MacBook Pro 14\" - 3"）→ about（`src/pages/about.astro`、**未作成**）。名刺風デザイン（"nenex" / "Frontend Engineer" / タグ、GitHub `@r2e8l` / X `rinyaaa` / email、QRコード）
  - `7:35`（"MacBook Pro 14\" - 2"）・`2:3`（"MacBook Pro 14\" - 1"）は古い下書きなので**使わない**（nav・タグが現行仕様と不一致、Awardsが未完成）

## 実装前に確認が必要な未確定データ

以下はFigma上でもまだ確定しておらず、推測で埋めない（`## 9.3 推測で進めない`参照）。実装タスクを `github-task-intake` でissue化する際に、都度ユーザーに確認する：

- Skillセクションの実際の技術リスト（Frontend/Tools/Others 各カテゴリ）
- Awardsセクションの実際の実績データ
- Connect with me の Instagram リンク先
- aboutページQRコードの遷移先URL

確認済みの公開ハンドル（about名刺より）：GitHub `@r2e8l` / X `rinyaaa`。[[seo-identity-strategy]]（メモリ）にJSON-LD `sameAs` への反映方針あり。
