# デザイン参照（Figmaの焼き直し）

Figma MCP は Starter プランで**月20回**の呼び出し上限があり、使い切ると閲覧もできない。
night-run（Dockerサンドボックス）からも Figma は見えないため、**このディレクトリの画像がデザインの参照元**になる。

大元は Figma `https://www.figma.com/design/ZqSjtDOwDZ7tLvNFYOPkWS/`（見た目の正はあくまでこちら。CLAUDE.md §9.1）。
ここにあるのはそれを2026-09-10時点で書き出したもの。

| ファイル | 対応するFigmaフレーム | 関連issue |
| --- | --- | --- |
| `01-home-light.jpg` | `273:69` Home — Light（Birthdayセクション追加） | [#45](https://github.com/rinyaaa/portfolio-v2/issues/45) 誕生日カウントダウン / [#46](https://github.com/rinyaaa/portfolio-v2/issues/46) 心拍ウィジェット / [#47](https://github.com/rinyaaa/portfolio-v2/issues/47) rinyaAI導線（右下のピル） |
| `02-about-light.jpg` | `20:2` about | 参考のみ。**中央の名刺画像は旧版**（GitHub/Xのハンドルが逆・タグが古い）。実装では見ないこと |
| `03-rinyaai-chat-states.jpg` | `276:91` rinyaAI — チャット状態 | [#47](https://github.com/rinyaaa/portfolio-v2/issues/47) |
| `04-card-back-web.jpg` | `268:54` 名刺 裏 — Web版 | [#48](https://github.com/rinyaaa/portfolio-v2/issues/48) |
| `05-card-flip-spec.jpg` | `272:102` 名刺フリップ — 操作仕様 | [#48](https://github.com/rinyaaa/portfolio-v2/issues/48) |
| `06-rinyaai-pill.png` | rinyaAI 導線（画面右下に固定）のピル | [#47](https://github.com/rinyaaa/portfolio-v2/issues/47)。**PNG書き出しなのでピクセル実測が可能**（枠線2px `#f9b6dc` / 地 `#ffffff` / 文字 `#202020` / 高さ84px / 丸60px / 左12px・間隔16px・右30px / 文字22px）。実装は `src/components/RinyaAiChat.module.scss`。**デザインと意図的に違う点2つ**（どちらも「84pxは大きすぎる」という本人指示・2026-09-10）：① 全体の高さ 84px → **50px**（従来サイズ）、② 文字サイズは比率から外して **0.95rem（≒15.2px）**固定 — 比率どおり（0.25×高さ）だと12.5pxになり日本語が読みにくいため。そのため文字/高さの比はデザイン0.25に対し実装0.30。**配色（枠線・地・文字）と、丸・左余白・間隔・右余白の比率はデザインどおり** |

## PDF原本を置いていない理由

Figmaから書き出したPDFには、**表示上は切り取られている電話番号入りの元画像がそのまま埋め込まれている**。
`pdfimages` で誰でも復元できるため、公開リポジトリには置けない（「電話番号はWeb版に載せない」= #48 の判断が無効になる）。
ここにあるJPEGは**ページを画像に焼き直したもの**なので、見えているピクセルしか残っていない（page 4 で電話番号が消えていることを確認済み）。

同じ理由で、これらを `public/` に置いてはいけない（Astro が `public/` をそのままサイトで配信するため）。

## 配色・フォントの実測値

画像から色を推測しないこと。実測済みの値は Figma フレーム `265:54`「Tokens — Light / Dark」と issue [#44](https://github.com/rinyaaa/portfolio-v2/issues/44) にある。要点：

- 背景グラデーション `#fce8f4 → #fcf3fc` / カード面 `#ffffff` / 名刺の紙面 `#fcf3fc`
- 本文 `#202020` / 副次 `#6e6e6e`（AA未達。`#666666` 推奨） / 見出し `#323246`
- ナビのピル `#fbddf1`、アクティブ `#f9b6dc`（**白文字は 1.65:1 で不足**。文字は `#4a2233` = 8.13:1 にする）
- タグ `#db2877`（AA未達。`#c81a68` = 4.73:1 推奨） / 入力欄の枠線 `#d4699b`（白地 3.34:1）
- 装飾ドット `#fac7e3` / `#f8b1d8` / `#cadcfc` / `#e9d5fe`
- フォント：英字見出し = Itim、日本語 = Rounded Mplus 1c（サイトが読み込む webfont は `M PLUS Rounded 1c` / `Quicksand`）

なお、これらのFigma値は実装済みの `src/styles/global.scss` の CSS 変数（`--bg-top: #fde7ef` 等）と微妙に違う。
どちらに寄せるかは #44 で決める。**今ある実装の色を勝手に置き換えないこと。**

## 名刺の画像アセット（暫定）

`public/card/` に置いてある。**PDFの焼き直しから切り出した暫定素材**で、解像度はFigma原本より落ちる。
差し替えるときは Figma の `252:89`（表）/ `252:124`（裏）から書き出し直すこと。

| ファイル | 中身 | 元 | サイズ |
| --- | --- | --- | --- |
| `public/card/illustration.jpg` | 名刺 表 の左half（キャラクターのイラスト） | PDF p.2 の名刺画像の左627px | 627×758 |
| `public/card/photo.jpg` | 名刺 裏 の人物写真 | PDF p.4 の埋め込み画像から人物部分だけを切り出し | 502×795 |

- `photo.jpg` は**電話番号が写り込んでいないことを目視で確認済み**。切り出し範囲を広げ直すときは必ず再確認する
- どちらも背景が名刺の地色（`#fcf3fc` 系）で塗られた状態。人物を透過で抜いた版が欲しくなったら書き出しからやり直す
- **QRコード（遷移先 `https://nenex.me`）はまだ無い。** 本人が用意して `public/card/` に置く予定。
  無い状態で実装する場合は、QRの領域だけプレースホルダーにして、PRにその旨を書くこと
