# portfolio-v2

石丸凜弥（りんや / いしまる / nenex / ねねっくす）の個人ポートフォリオサイト。

公開先: [nenex.me](https://nenex.me)（Cloudflare Pages）

## 技術スタック

- [Astro](https://astro.build)（static出力）+ [React](https://react.dev) islands（`@astrojs/react`）
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/)（アクセシブルなヘッドレスUI）
- SCSS Modules
- TypeScript（strict）
- [microCMS](https://microcms.io)（記事管理、ビルド時fetch）
- [Cloudflare Pages](https://pages.cloudflare.com)（ホスティング、`@astrojs/cloudflare` adapter）

設計・技術選定の詳細と理由は [CLAUDE.md](./CLAUDE.md) を参照。

## セットアップ

`.env.example` を `.env` にコピーし、microCMSの認証情報を設定する。

```sh
cp .env.example .env
```

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm install` | 依存関係のインストール |
| `npm run dev` | ローカル開発サーバー起動（要 `.env`） |
| `npm run build` | 本番ビルド（microCMSから全件取得して静的化、`./dist/`） |
| `npm run preview` | ビルド結果をローカルでプレビュー（`wrangler dev`） |
| `npm test` | 単体テスト実行（vitest） |
| `npm run test:watch` | 単体テストをwatchモードで実行 |
| `npm run generate-types` | Cloudflareバインディングの型生成（`wrangler types`） |
| `npm run deploy` | ビルド + Cloudflareへデプロイ |

## 安全網の範囲と限界

このリポジトリはAIコーディングエージェント（Claude Code等）での開発を前提に多層の安全網を入れているが、**事故の確率を下げる仕組みであって、安全を保証する仕組みではない**。ルールの本体は [AGENTS.md](./AGENTS.md)、Claude Code固有の実装詳細は [CLAUDE.md](./CLAUDE.md) §9。

**守られていること**

- 破壊的なコマンド（`rm -rf`・force push・`git reset --hard`・`git clean`・ワークツリーの削除）と、`.env`・秘密鍵を直接読むコマンド（`cat`・`cp` 等）は実行前にブロックされる（`.claude/settings.json` の `permissions.deny` ＋ フラグ後置・`bash -c` 経由などの変種もトークン解析で検出する `.claude/hooks/deny_dangerous_bash.py`）
- 安全網自体の劣化（denyが消えた・hookが無くなった等）は `python3 scripts/verify_safety_net.py` で検査できる
- PRごとにCI（`.github/workflows/ci.yml`：build + test + gitleaksによる秘密情報スキャン）が走り、Dependabotが依存の更新PRを出す
- 壊れたとき・公開するときは専用スキル（`safe-rollback` / `go-live-checklist`）が安全な手順に誘導する

**守られていないこと**

- **チェックはすべて確率的。** LLMによるレビューには見逃しがあり、テストは書かれた範囲しか検査しない。「チェックが通った＝安全」ではない。
- **コマンド検査はブロックリスト方式で、原理的に完全ではない。** 代表的な迂回（シェル経由・ラッパー・`cat`/`cp` での直接読み取り）は塞いであるが、glob展開（`cat .e*`）やプログラム経由の読み取り（`python3 -c "open('.env')"`）はすり抜けうる。hookは第一関門で、最後の砦はCIとレビュー。hookは `python3` が無い・入力を解釈できない場合は通す（フェイルオープン）設計。
- **ブランチ保護は未設定**（GitHub側の設定が必要）。CIの失敗を無視してマージすることは今のところ止められない。
- **リポジトリの外は守れない。** GitHub・Cloudflare・microCMSのアカウント防御（2FA等）やAPIキーの発行・保管は管轄外。
- **運用は自動化されない。** Dependabotの更新PRやCIの失敗は、誰かが気にかけて初めて意味を持つ。週1回「健康診断して」と依頼すれば `project-health-check` スキルが棚卸しするが、依頼する習慣自体は人間側に残る。

**使うAIツールによる強制力の違い**

| 層 | Claude Code | Codex / Cursor 等 |
| --- | --- | --- |
| 破壊的コマンド・秘密情報読み取りのブロック | 強制（deny + hook） | **強制されない**（AGENTS.mdの指示ベース） |
| 復旧・公開監査・健康診断の手順 | スキルとして自動発動 | AGENTS.md経由で手順書として参照（自動発動しない） |
| CI・gitleaks・Dependabot | 強制 | **強制**（唯一ツールに依存しない層） |

つまりClaude Code以外では、強制力のある防御はGitHub側（CI）だけになる。他ツールを併用する場合は、CIの結果を必ず確認すること。

人間側の振る舞い（許可ダイアログの判断・報告の読みかた）は [docs/working-with-claude-code.md](./docs/working-with-claude-code.md) にまとめてある。

## ライセンス

[MIT](./LICENSE)
