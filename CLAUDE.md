# Portfolio Site — 設計・技術選定

個人ポートフォリオサイト。公開先は **nenex.me**（Cloudflare Pages のカスタムドメイン）。
esa.io を CMS として記事を管理し、esa の更新を Webhook で受けて Cloudflare Pages が
再ビルド → 自動デプロイされる構成。

> 既存の `nenex.me/api/health`（心拍数などの API）は別パスで稼働しており、
> 本ポートフォリオ（ルート配信）とルーティングは競合しない。

> このファイルは Claude Code 用のプロジェクト設計ドキュメント。実装の指針と
> 制約をここに集約する。コードを書く前に必ず参照すること。

---

## 1. 要件

- **高速な読み込み**：トップ・一覧の初回表示を最優先。デフォルトで JS をほぼ送らない。
- **React に近い書き味**：JSX ベースで書ける。慣れた React コンポーネントも使える。
- **CMS で記事投稿**：記事の執筆・管理は esa.io 側で完結。リポジトリに Markdown を持たない。
- **更新の自動反映**：esa を更新 → CI/CD が走る → サイトに反映（手動デプロイ不要）。
- **タイトルによるジャンル分け・ソート**：esa の記事タイトルに埋め込んだタグで分類・並び替え。
  - 例：`発表スライドまとめ #date:2026-06-26 #発表報告`
  - `#date:YYYY-MM-DD` … イベント/発表日（ソートキー）
  - `#発表報告` などのハッシュタグ … ジャンル（フィルタキー）

---

## 2. 技術スタック（確定）

| レイヤ | 採用 | 理由 |
| --- | --- | --- |
| フレームワーク | **Astro**（static / SSG 出力） | デフォルトで JS を送らず初回表示が最速。Markdown/コンテンツ処理が強い。 |
| インタラクティブ部 | **React islands**（`@astrojs/react`） | フィルタ・ソート UI など必要な箇所だけ React で書き、`client:*` で部分 hydration。 |
| UI（アクセシビリティ） | **React Aria Components**（`react-aria-components`） | ヘッドレス（スタイル無し）でアクセシブルな挙動だけを提供。見た目は CSS Modules で当てる。フル UI ライブラリのような重いランタイムを持ち込まない。 |
| スタイリング | **CSS Modules**（`*.module.css`） | Astro ネイティブ対応。ビルド時に純 CSS 化＆スコープ化されるので初回 JS が増えない。React Aria の無地コンポーネントに見た目を付ける担当。 |
| 言語 | **TypeScript**（strict） | esa API レスポンスの型安全と、タイトルパーサのテスト容易性。 |
| コンテンツ取得 | **esa.io API v1**（ビルド時 fetch） | ビルド時に全記事を取得して静的化。実行時の API 依存ゼロ。 |
| Markdown 描画 | esa の `body_html` を使用 or 自前で `body_md` を変換 | 既定は esa の `body_html`（後述）。 |
| ホスティング | **Cloudflare Pages**（static） | 高速 CDN・広い無料枠。Deploy Hook で再ビルド起動。 |
| CI/CD トリガ | **esa Webhook → Cloudflare Deploy Hook** | 中継サーバ不要。URL を叩くだけで再ビルド→配信。 |

### なぜ Next.js ではなく Astro か
ポートフォリオは「ほぼ静的・一部だけ動的」。Astro は island architecture により
不要な JS を一切載せないので、Next.js（App Router）より初回 JS が軽い。React の
書き味は islands で担保される。

### なぜ UI ライブラリは「ヘッドレス（React Aria）」か
Mantine / Chakra のようなフル UI ライブラリは見た目まで提供する代わりに
ランタイム JS が重く、CSS Modules 採用とも二重管理になりやすい。React Aria
Components は **挙動とアクセシビリティ（キーボード操作・WAI-ARIA・フォーカス管理）
だけ**を提供する無地のコンポーネント。スタイルは CSS Modules で自由に当てられるので、
「軽さ」と「CSS Modules 一本化」を両立できる。Tabs / ComboBox（ジャンルフィルタ）/
Dialog などに使う。

> 注意：React Aria Components は React レンダリングなので、それを使う UI は
> React island（`.tsx` + `client:*`）になる。静的な表示部分は `.astro` のまま。

---

## 3. データフロー / CI・CD

```
[esa.io で記事を更新/公開]
        │  Webhook (POST)
        ▼
[Cloudflare Pages Deploy Hook URL]
        │  再ビルドをキック
        ▼
[Cloudflare Pages Build]
   1. astro build
   2. ビルド中に esa API から全記事を fetch
   3. タイトルをパースして genre / date を抽出
   4. 静的 HTML を生成
        ▼
[Cloudflare CDN へ配信]  ← 完成
```

- **実行時に esa を叩かない**。すべてビルド時に解決して静的化する（高速・安定）。
- esa 側で記事を更新するたびに上記が自動で回る。

### カスタムドメイン（nenex.me）
- Cloudflare Pages プロジェクトに **Custom domain = nenex.me** を割り当てる。
- DNS が Cloudflare 管理なら CNAME/ALIAS は自動設定される。
- ルート（`/`, `/works/*`, `/about` など）はポートフォリオ、`/api/health` は既存 API。
  パスが分かれているのでルーティング競合なし。

### Webhook 設定（運用メモ）
1. Cloudflare Pages プロジェクト → Settings → Builds & deployments → **Deploy Hook** を作成。
   発行された URL（`https://api.cloudflare.com/.../deploy_hooks/...`）を控える。
2. esa.io → チーム設定 → **Webhook → Generic** を追加し、上記 URL を `POST` 先に設定。
3. 対象イベント：記事の作成・更新（`post_create` / `post_update`）。
4. これで esa 更新 → 自動再ビルド → 反映、が成立する。

---

## 4. esa 連携の設計

### 4.1 API
- エンドポイント：`GET https://api.esa.io/v1/teams/:team/posts`
- 認証：`Authorization: Bearer ${ESA_TOKEN}`（個人アクセストークン）
- ページング：`per_page=100` で全件取得するまでループ（`next_page` を辿る）。
- WIP 記事の扱い：**`wip: false`（Ship 済み）のみ公開**。WIP は下書き扱いで表示しない。
- 必要フィールド：`number`, `name`, `wip`, `body_md`, `body_html`,
  `created_at`, `updated_at`, `category`, `tags`, `url`。

### 4.2 タイトルのパース仕様（重要）
esa の `name`（タイトル）に埋め込んだトークンで分類・ソートする。

書式例：
```
発表スライドまとめ #date:2026-06-26 #発表報告
```

パース結果：
| 抽出物 | パターン | 用途 |
| --- | --- | --- |
| `displayTitle` | トークンを取り除いた残り（`発表スライドまとめ`） | 画面表示用タイトル |
| `eventDate` | `#date:YYYY-MM-DD` | ソートキー（降順 = 新しい発表が上） |
| `genres` | `#date:` 以外のすべての `#xxx` | ジャンル分け / フィルタ |

ルール：
- `#date:` が無ければ `updated_at`（または `created_at`）をフォールスバックのソートキーに使う。
- ジャンルは複数可（`#発表報告 #LT` のように並べられる）。
- 日本語ハッシュタグを許可するため、トークンは「空白区切りで `#` 始まり」を1トークンとする。
- パーサは純粋関数として切り出し、**単体テストを必ず書く**（`src/lib/parseEsaTitle.test.ts`）。

パーサのシグネチャ（実装の型イメージ）：
```ts
type ParsedPost = {
  displayTitle: string;
  eventDate: string | null; // "YYYY-MM-DD"
  genres: string[];         // ["発表報告", ...]（"date:..." は含めない）
};
function parseEsaTitle(name: string): ParsedPost;
```

### 4.3 本文の描画
- 既定では esa が返す **`body_html` をそのまま描画**（変換不要で確実）。
- 将来コードハイライトや独自整形が欲しくなったら `body_md` を取得して
  自前の Markdown パイプライン（remark/rehype）に切替える。`body_html` 依存は
  `src/lib/esa.ts` に閉じ込め、上位レイヤから差し替え可能にしておく。

---

## 5. ディレクトリ構成（予定）

```
portfolio/
├─ CLAUDE.md                  ← このファイル
├─ astro.config.mjs           ← integrations: react / output: 'static'
├─ tsconfig.json              ← strict
├─ package.json
├─ .env.example               ← ESA_TEAM / ESA_TOKEN のテンプレ
├─ public/                    ← 静的アセット（OGP 画像など）
└─ src/
   ├─ lib/
   │  ├─ esa.ts               ← esa API クライアント（全件取得・型定義）
   │  ├─ parseEsaTitle.ts     ← タイトルパーサ（純粋関数）
   │  └─ parseEsaTitle.test.ts
   ├─ types/
   │  └─ post.ts              ← EsaPost / ParsedPost などの型
   ├─ components/
   │  ├─ PostList.tsx         ← React island：フィルタ/ソート UI（React Aria 使用）
   │  ├─ PostList.module.css
   │  ├─ GenreFilter.tsx      ← React island（React Aria Tabs/ComboBox）
   │  ├─ GenreFilter.module.css
   │  ├─ HeartRate.tsx        ← React island：/api/health を実行時 fetch して表示
   │  ├─ HeartRate.module.css
   │  ├─ PostCard.astro       ← 静的カード
   │  └─ PostCard.module.css
   ├─ layouts/
   │  └─ Base.astro
   └─ pages/
      ├─ index.astro          ← トップ（一覧 + フィルタ）
      ├─ works/[number].astro ← 記事詳細（getStaticPaths で全記事を静的生成）
      └─ about.astro
```

### 設計方針
- **esa 依存は `src/lib/esa.ts` に集約**。pages/components は加工済みデータだけ受け取る。
- 一覧の**フィルタ/ソートはクライアント側**（React island, `client:visible`）。
  全記事データはビルド時に JSON として埋め込み、UI 操作で API は叩かない。
- 重い処理（全件取得・パース）は**ビルド時に1回**だけ実行する。

---

## 6. 環境変数

| 変数 | 用途 | 置き場所 |
| --- | --- | --- |
| `ESA_TEAM` | esa のチーム名（URL の `:team`） | `.env` / Cloudflare Pages の環境変数 |
| `ESA_TOKEN` | esa 個人アクセストークン（read 権限） | Cloudflare Pages の **暗号化**環境変数。リポジトリにコミットしない。 |

- `.env.example` を用意し、実値の `.env` は `.gitignore` に入れる。
- Cloudflare Pages：Settings → Environment variables に Production/Preview 両方へ設定。

---

## 7. 開発コマンド（予定）

```bash
npm install
npm run dev        # ローカル開発（要 .env）」
npm run build      # 本番ビルド（esa から全件取得して静的化）
npm run preview    # ビルド結果をローカル確認
npm run test       # parseEsaTitle などの単体テスト（vitest 想定）
```

---

## 8. コーディング規約 / Claude への指示

- **TypeScript strict**。`any` は原則禁止。esa レスポンスは型を定義して扱う。
- ロジック（取得・パース・ソート）と表示（Astro/React）を分離する。
- インタラクティブが不要なものは `.astro`（= JS を送らない）で書く。React island は
  本当に必要な箇所だけにし、`client:load` の濫用を避ける（`client:visible` を優先）。
- パーサなどの純粋関数には必ずテストを添える。
- esa の仕様（WIP 除外・タイトル書式）を変える場合は本ファイルを更新してから実装する。

---

## 9. 実装 TODO（順序）

1. `npm create astro@latest` で雛形作成、`@astrojs/react` と `react-aria-components` を追加（スタイリングは CSS Modules なので追加 integration 不要）。
2. `src/lib/parseEsaTitle.ts` + テストを先に実装（仕様 4.2 を満たす）。
3. `src/lib/esa.ts`：全件取得（ページング）・WIP 除外・型定義。
4. `src/pages/index.astro`：ビルド時取得 → `PostList`（island）へ渡す。
5. `PostList.tsx` / `GenreFilter.tsx`：ジャンルフィルタ + `#date:` 降順ソート。
6. `src/pages/works/[number].astro`：`getStaticPaths` で詳細ページを静的生成。
7. Cloudflare Pages にデプロイ、環境変数設定、Deploy Hook 発行。
8. esa の Webhook に Deploy Hook URL を登録して自動反映を確認。
