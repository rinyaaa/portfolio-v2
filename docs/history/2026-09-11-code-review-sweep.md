# 2026-09-11 コード棚卸し（issue #55）

PR #50 / #52 / #54 が短期間に連続でマージされ、rinyaAI・心拍ウィジェット・誕生日カウントダウン・microCMS連携が入った。急いで積み上げた部分の棚卸しをした記録。**このタスクではコードを1行も変更していない**（`src/` 配下に差分無し）。発見した内容は個別issueとして起票済み。

## やったこと

- `src/` 配下を一通り読み、バグ・不要コード・UI/UX（コードから判断できる範囲：alt属性・aria-*・キーボード操作・タッチターゲット・コントラスト比）を洗い出した。
- 見た目の良し悪しの判断・既知の未対応事項（issue #44 ダークモード、#48 about名刺ページ、`docs/plans/` の `[ ]` 項目）は対象外とした。
- `npm run build` は実行しない（microCMSのAPIキーを無人実行に持ち込まない方針）。`npm test` と `npx astro check` はどちらも成功を確認済み（103 tests passed / 0 errors）。
- セキュリティ所見は公開の場（issue/PR/このファイル）に内容を書かず、`night-run/state/security-findings.md`（git管理外）にのみ記録した。**1件**。

## 発見一覧（重要度順）

### バグ

1. **rinyaAIチャットの質問例チップが常に空になる**（[#56](https://github.com/rinyaaa/portfolio-v2/issues/56)）
   `src/components/RinyaAiChat.tsx` が静的な `RINYA_QA`（常に空配列）を参照しており、PR #54 でビルド時に取り込んだmicroCMS由来のQ&Aがチャットの質問例チップに反映されない。React islandは `astro:content` を直接呼べないため、呼び出し元からpropsで渡す必要がある。

2. **eyecatch未設定の記事があるとカード/詳細ページがクラッシュする**（[#57](https://github.com/rinyaaa/portfolio-v2/issues/57)）
   `PostCard.tsx` / `pages/post/[id].astro` が `post.eyecatch.url` に無条件アクセスしているが、型定義上は必須なのに実際のmicroCMS仕様では未設定にできる（値が空のフィールドはレスポンスから消える）。`PostCard.module.scss` の `.noImage`（未使用CSSクラス）が対応しかけて未接続になっている痕跡がある。

3. **記事詳細ページのmeta descriptionでHTMLエンティティが未デコード**（[#58](https://github.com/rinyaaa/portfolio-v2/issues/58)）
   タグ除去の正規表現だけでエンティティデコードをしておらず、`&amp;` 等が生のままOGP/meta descriptionに出る。

4. **ConnectLinksで未知のSNSラベルを追加するとアイコンが無音で消える**（[#62](https://github.com/rinyaaa/portfolio-v2/issues/62)）
   `ICON_PATHS` に無いラベルのSNSを追加すると型エラーにもビルドエラーにもならずアイコンだけが描画されない。

### UI/UX（コードから判断できる範囲）

5. **`--pink-strong` を白/pink-soft背景の文字色に使っている箇所がコントラスト比未達**（[#59](https://github.com/rinyaaa/portfolio-v2/issues/59)）
   `RinyaAiChat.module.scss` の `.suggestion`（白地で約2.83:1）・`.retry`（pink-soft地で約2.08:1）、`detail.module.scss` の記事本文リンク。同ファイル内の `.answerLink` は同じ色の同じ問題（2.83:1）をコメントで明示して避けているのに、他の要素には残っている。

6. **`--text-muted` (#7a7a7a) の白背景コントラストが約4.29:1でWCAG AA（4.5:1）未達**（[#60](https://github.com/rinyaaa/portfolio-v2/issues/60)）
   サイト全体で補助文字色として広く使われているトークンなので影響範囲が広い。

7. **ジャンルフィルタのタッチターゲットが44px未満**（[#61](https://github.com/rinyaaa/portfolio-v2/issues/61)）
   `GenreFilter.module.scss` の `.chip`（実測高さ約30px）に `min-height` が無い。`RinyaAiChat.module.scss` は `.suggestion`/`.retry`/`.send` に44pxを明示しており、対応が一貫していない。
   （起票時は `Header.module.scss` の `.link` も対象にしていたが、レビューで `body` の `line-height: 1.7` の継承を見落としていたと判明し、実測は約44.6pxで基準をほぼ満たすため対象から外した。issue本文に訂正を追記済み。）

### 不要なコード

- `PostCard.module.scss` の `.noImage`（未使用CSSクラス）→ issue #57 に含めて起票済み（eyecatch欠落対応と同時に直すのが自然なため、別issueに分けなかった）。
- それ以外に明確な死んだコード・過剰な抽象化は見つからなかった（エクスポートの棚卸しはgrepで実施済み、型注釈での自己参照を除き未使用エクスポートは無し）。

### セキュリティ

- 1件を `night-run/state/security-findings.md` にのみ記録した（内容はこのファイルにもissue/PRにも書かない）。

## 詰まった点

- ブラウザ・Figmaが見られない制約下で「見た目の良し悪し」を切り分けるため、コントラスト比とタッチターゲットは手計算・CSS値からの実測に限定した。
- コントラスト計算はWCAG相対輝度式を手計算したもの（自動チェッカーでの再確認を推奨）。
- タッチターゲットの高さ計算で、`line-height` の継承（`body { line-height: 1.7 }`）を見落として `Header.module.scss` の `.link` を誤って「44px未満」と判定していた（レビューで指摘され#61から対象外に訂正）。line-heightが要素側で明示されていない場合は継承元まで辿って計算する必要がある。

## 次回への申し送り

- 上記issueは互いに独立して着手可能。#59・#60（コントラスト）は配色トークンの変更を伴うため、着手前にFigmaとの整合確認（CLAUDE.md §8）が必要。
- #56（質問例チップ）はrinyaAIの導線として体験に直結するため優先度高めで見てよさそう。
