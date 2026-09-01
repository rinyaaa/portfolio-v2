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

## ライセンス

[MIT](./LICENSE)
