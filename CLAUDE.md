# Portfolio Site — 設計・技術選定

安全ルールを含む全AIエージェント共通の指示は以下からインポートされる。**ルールの本体はAGENTS.md側にあり、変更もそちらで行う**——このファイルにはClaude Code固有の事項だけを書くこと（二重管理による食い違いを防ぐため）。

@AGENTS.md

個人ポートフォリオサイト。公開先は **nenex.me**（Cloudflare Pages のカスタムドメイン）。
**microCMS** を CMS として記事を管理し、microCMS の更新を Webhook で受けて Cloudflare Pages が
再ビルド → 自動デプロイされる構成。

> 既存の `nenex.me/api/health`（心拍数などの API）は別パスで稼働しており、
> 本ポートフォリオ（ルート配信）とルーティングは競合しない。

> このファイルは Claude Code 用のプロジェクト設計ドキュメント。実装の指針と
> 制約をここに集約する。コードを書く前に必ず参照すること。

> **CMS 変更の経緯**：当初は esa.io を採用予定だったが、2ヶ月の無料期間後に
> 有料（月額）になるため、無料枠のある **microCMS** に変更。microCMS は
> 日付・ジャンルを「構造化フィールド」で持てるため、esa 時代のタイトル埋め込み
> パース（`#date:` / `#genre`）は不要になった。

---

## 1. 要件

- **高速な読み込み**：トップ・一覧の初回表示を最優先。デフォルトで JS をほぼ送らない。
- **React に近い書き味**：JSX ベースで書ける。慣れた React コンポーネントも使える。
- **CMS で記事投稿**：記事の執筆・管理は microCMS 側で完結。リポジトリに Markdown を持たない。
- **更新の自動反映**：microCMS を更新 → CI/CD が走る → サイトに反映（手動デプロイ不要）。
- **ジャンル分け・ソート**：microCMS の構造化フィールドで分類・並び替え。
  - `date`（日時フィールド）… イベント/発表日（ソートキー、降順で新しいものが上）
  - `genres`（複数選択：`KajiLab` / `Private` / `Product`）… ジャンル（フィルタキー）

---

## 2. 技術スタック（確定）

| レイヤ | 採用 | 理由 |
| --- | --- | --- |
| フレームワーク | **Astro**（static / SSG 出力） | デフォルトで JS を送らず初回表示が最速。Markdown/コンテンツ処理が強い。 |
| インタラクティブ部 | **React islands**（`@astrojs/react`） | フィルタ・ソート UI など必要な箇所だけ React で書き、`client:*` で部分 hydration。 |
| UI（アクセシビリティ） | **React Aria Components**（`react-aria-components`） | ヘッドレス（スタイル無し）でアクセシブルな挙動だけを提供。見た目は CSS Modules で当てる。フル UI ライブラリのような重いランタイムを持ち込まない。 |
| スタイリング | **SCSS Modules**（`*.module.scss` / `sass`） | Astro ネイティブ対応。ビルド時に純 CSS 化＆スコープ化されるので初回 JS が増えない。ネスト等が使える SCSS で記述。グローバルは `src/styles/global.scss`。React Aria の無地コンポーネントに見た目を付ける担当。 |
| 言語 | **TypeScript**（strict） | microCMS API レスポンスの型安全と、整形ロジックのテスト容易性。 |
| コンテンツ取得 | **microCMS REST API**（ビルド時 fetch） | ビルド時に全記事を取得して静的化。実行時の API 依存ゼロ。 |
| 本文描画 | microCMS リッチエディタの **HTML** をそのまま描画 | 変換不要で確実（後述）。 |
| ホスティング | **Cloudflare Pages**（static） | 高速 CDN・広い無料枠。Deploy Hook で再ビルド起動。 |
| CI/CD トリガ | **microCMS Webhook → Cloudflare Deploy Hook** | 中継サーバ不要。URL を叩くだけで再ビルド→配信。 |

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

### なぜ microCMS か
無料の Hobby プランがあり個人ポートフォリオに十分。日付・ジャンルを構造化
フィールドで持てるため、esa のようなタイトル埋め込みパースが不要。ブラウザから
どこでも執筆でき、更新 Webhook が標準対応で Cloudflare Pages と直結できる。

---

## 3. データフロー / CI・CD

```
[microCMS で記事を更新/公開]
        │  Webhook (POST)
        ▼
[Cloudflare Pages Deploy Hook URL]
        │  再ビルドをキック
        ▼
[Cloudflare Pages Build]
   1. astro build
   2. ビルド中に microCMS API から全記事を fetch（公開分のみ）
   3. date / genres でソート・分類
   4. 静的 HTML を生成
        ▼
[Cloudflare CDN へ配信]  ← 完成
```

- **実行時に microCMS を叩かない**。すべてビルド時に解決して静的化する（高速・安定）。
- microCMS 側で記事を更新するたびに上記が自動で回る。

### カスタムドメイン（nenex.me）
- Cloudflare Pages プロジェクトに **Custom domain = nenex.me** を割り当てる。
- DNS が Cloudflare 管理なら CNAME/ALIAS は自動設定される。
- ルート（`/`, `/works/*`, `/about` など）はポートフォリオ、`/api/health` は既存 API。
  パスが分かれているのでルーティング競合なし。

### Webhook 設定（運用メモ）
1. Cloudflare Pages プロジェクト → Settings → Builds & deployments → **Deploy Hook** を作成。
   発行された URL（`https://api.cloudflare.com/.../deploy_hooks/...`）を控える。
2. microCMS → サービス設定 → API 設定 → **Webhook** を追加し、種別「Custom（またはカスタム通知）」で
   上記 URL を `POST` 先に設定。
3. 対象イベント：コンテンツの公開・更新・削除。
4. これで microCMS 更新 → 自動再ビルド → 反映、が成立する。

---

## 4. microCMS 連携の設計

### 4.1 コンテンツ定義（microCMS 管理画面で作成）
- **エンドポイント（API ID）**：`posts`（**リスト形式**）
- **フィールド**：

| フィールドID | 種類 | 必須 | 用途 |
| --- | --- | --- | --- |
| `title` | テキストフィールド | ✅ | 表示タイトル |
| `date` | 日時 | | 発表/イベント日（ソートキー） |
| `genres` | コンテンツ参照（複数）→ `categories` | | ジャンル分け / フィルタ |
| `content` | リッチエディタ | ✅ | 本文（API では HTML 文字列で返る） |
| `eyecatch` | 画像 | | カード/詳細のアイキャッチ |

- `genres` は**カテゴリ用の別コンテンツ（`categories`）への複数参照**。API では
  `[{ id, name, ... }]` のオブジェクト配列で返る（`name` に `KajiLab` 等）。
  カテゴリは CMS 側で自由に追加できる。
- microCMS が自動付与：`id`, `createdAt`, `updatedAt`, `publishedAt`, `revisedAt`。
- 日時は UTC で返る。表示・ソート用の日付は **JST に変換してから** `YYYY-MM-DD` にする
  （そのまま切ると深夜跨ぎで 1 日ずれるため）。
- **WIP（下書き）**：microCMS 標準の「下書き」ステータスにしておけば、公開するまで
  API のデフォルト取得には**含まれない**（`draftKey` を渡さない限り出ない）。
  → esa の `wip` フィルタのような明示除外は不要。

### 4.2 API
- エンドポイント：`GET https://{MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/posts`
- 認証：`X-MICROCMS-API-KEY: ${MICROCMS_API_KEY}`
- ページング：`limit=100` と `offset` を使い、`totalCount` に達するまでループ。
- ソート：API 側で `orders=-date`（date 降順）を指定。`date` 未設定分は
  `publishedAt`（無ければ `createdAt`）をフォールバックのソートキーに使う（整形側で補完）。
- 取得フィールド：`id`, `title`, `date`, `genres`, `content`, `eyecatch`,
  `createdAt`, `updatedAt`, `publishedAt`。

### 4.3 整形（正規化）
- microCMS の生レスポンス（`MicroCMSPost`）を上位レイヤ用の `Post` に正規化する。
- 変換責務は `src/lib/microcms.ts` に集約し、pages/components は `Post` だけ受け取る。
- `genres`（参照オブジェクト配列）は `name` を取り出して `string[]` にする。
- `date` / `sortKey` は JST の `YYYY-MM-DD`。`sortKey = date ?? publishedAt ?? createdAt`。
  クライアント側の再ソートも文字列比較だけで済むようにする。

### 4.4 本文の描画
- 既定では microCMS のリッチエディタが返す **`content`（HTML）をそのまま描画**（変換不要で確実）。
- 将来コードハイライトや独自整形が欲しくなったら、body の HTML を rehype で後処理するか、
  Markdown 運用へ切替える。HTML 依存は `src/lib/microcms.ts` に閉じ込め、上位から差し替え可能に。

---

## 5. ディレクトリ構成（予定）

```
portfolio/
├─ CLAUDE.md                  ← このファイル
├─ astro.config.mjs           ← integrations: react / output: 'static'
├─ tsconfig.json              ← strict
├─ package.json
├─ .env.example               ← MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY のテンプレ
├─ public/                    ← 静的アセット（OGP 画像など）
└─ src/
   ├─ env.d.ts                ← import.meta.env の型（microCMS の環境変数）
   ├─ lib/
   │  └─ microcms.ts          ← microCMS API クライアント（全件取得・整形・型定義）
   ├─ types/
   │  └─ post.ts              ← MicroCMSPost / Post などの型
   ├─ components/
   │  ├─ PostList.tsx         ← React island：フィルタ/ソート UI（React Aria 使用）
   │  ├─ PostList.module.scss
   │  ├─ GenreFilter.tsx      ← React island（React Aria Tabs/ComboBox）
   │  ├─ GenreFilter.module.scss
   │  ├─ HeartRate.tsx        ← React island：/api/health を実行時 fetch して表示
   │  ├─ HeartRate.module.scss
   │  ├─ PostCard.astro       ← 静的カード
   │  └─ PostCard.module.scss
   ├─ layouts/
   │  └─ Base.astro
   └─ pages/
      ├─ index.astro          ← トップ（一覧 + フィルタ）
      ├─ works/[id].astro     ← 記事詳細（getStaticPaths で全記事を静的生成、id は microCMS の contentId）
      └─ about.astro
```

### 設計方針
- **microCMS 依存は `src/lib/microcms.ts` に集約**。pages/components は加工済みデータだけ受け取る。
- 一覧の**フィルタ/ソートはクライアント側**（React island, `client:visible`）。
  全記事データはビルド時に JSON として埋め込み、UI 操作で API は叩かない。
- 重い処理（全件取得・整形）は**ビルド時に1回**だけ実行する。

---

## 6. 環境変数

| 変数 | 用途 | 置き場所 |
| --- | --- | --- |
| `MICROCMS_SERVICE_DOMAIN` | microCMS のサービスドメイン（`https://xxxx.microcms.io` の `xxxx`） | `.env` / Cloudflare Pages の環境変数 |
| `MICROCMS_API_KEY` | microCMS の API キー（GET 権限） | Cloudflare Pages の **暗号化**環境変数。リポジトリにコミットしない。 |

- `.env.example` を用意し、実値の `.env` は `.gitignore` に入れる。
- Cloudflare Pages：Settings → Environment variables に Production/Preview 両方へ設定。

---

## 7. 開発コマンド

[README.md](./README.md) を参照（人間向けセットアップ手順・コマンド一覧はそちらに一本化）。

---

## 8. コーディング規約 / Claude への指示

- **TypeScript strict**。`any` は原則禁止。microCMS レスポンスは型を定義して扱う。
- ロジック（取得・整形・ソート）と表示（Astro/React）を分離する。
- インタラクティブが不要なものは `.astro`（= JS を送らない）で書く。React island は
  本当に必要な箇所だけにし、`client:load` の濫用を避ける（`client:visible` を優先）。
- 純粋関数（整形・ソート）には必ずテストを添える。
- microCMS の仕様（コンテンツ定義・フィールド）を変える場合は本ファイルを更新してから実装する。
- **UI/デザインを実装・変更する前は必ずFigmaを見る**（下記9.1）。見た目に関わるタスクをFigma未確認のまま実装しない。

---

## 9. Claude Code固有の補足（安全網 / 開発体制）

### 9.1 デザインソース（Figma）

UI/デザインを実装・変更する前は必ずFigmaを確認する。フレーム↔ページ対応・未確定データの詳細は `.claude/skills/portfolio-design-source/SKILL.md`（UI関連タスクで自動発動）。

### 9.2 安全網 / 開発体制

安全ルールの本体は `AGENTS.md`（冒頭で `@AGENTS.md` インポート済み）。ここにはAGENTS.mdに無いClaude Code固有の実装詳細・プロジェクト固有事実だけ書く。

- **開発体制**：エンジニア（あなた）常駐モード。denyベースラインは維持しつつ、緩和が必要な場面は都度相談。
- AGENTS.mdルール1（破壊的コマンド）は `.claude/hooks/deny_dangerous_bash.py`（PreToolUse hook）で強制。検出パターン変更時は `python3 .claude/hooks/test_deny_dangerous_bash.py` を実行。
- **GitHub / PRレビュー運用**：GitHub（`rinyaaa/portfolio-v2`）でPRベースレビュー。CI（`.github/workflows/ci.yml`：build+test+gitleaks secret-scan）・Dependabot設定済み、マージ前に `/security-review` を実行。ブランチ保護は未設定（要GitHub側設定）。
- **night-run**：コンテナ内はtestのみ実行し、build（microCMSへのビルド時fetchが発生する）は含めない——無人サンドボックスにmicroCMSのAPIキーを持ち込まない判断（2026-09-01）。build検証はCIの役割。

### 9.3 推測で進めない（ポートフォリオ全般の方針）

このリポジトリでは、人物・実績・SNSリンクなど**ユーザー本人に関する事実として公開される内容**を扱う場面が多い。技術的な判断以上に「本人に確認しないと分からないこと」が多いプロジェクトなので、以下は自分の判断で埋めずユーザーに確認する：

- プロフィール文・経歴・所属・資格・受賞歴などの本文コピー
- 技術スタック一覧（Skillセクション等）の具体的な項目
- SNS/連絡先のURL、QRコードの遷移先
- Figmaのフレームがどのページ・どの実装範囲に対応するか（複数解釈がありうる場合）
- 今回のセッションでどこまで実装を進めるか（デザイン確認だけか、実装まで含むか等）

該当データが必要な実装は `github-task-intake` でissue化し、その時点でユーザーに確認する運用とする。

