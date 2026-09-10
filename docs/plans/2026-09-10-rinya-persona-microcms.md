# rinyaAI: 人格データ（口調ルール・非公開の事実・Q&A）を microCMS へ移す

- 対象 issue: [#53](https://github.com/rinyaaa/portfolio-v2/issues/53)
- 前提となる実装: [#47 / PR #50](https://github.com/rinyaaa/portfolio-v2/pull/50) と `docs/plans/2026-09-10-rinya-ai-workers-ai.md`

## 背景・なぜやるか

rinyaAI は Cloudflare Workers AI で動くようになったが、人格データ（`toneRules` / `examples`）は空のまま。
置き場が `src/data/rinya-persona.ts` ＝ **Public リポジトリ**なので、素の口調のデータを入れると GitHub で誰でも読め、git 履歴に永久に残る。
microCMS（APIキー必須・非公開）に移せばこの問題が解決し、ブラウザから編集でき、既存の Webhook で自動再ビルドされる。

「素の口調のまま公開する」方針（2026-09-10 本人選択）を、リポジトリを汚さずに実現するための前提工事。

## スコープ

- microCMS に API を2つ作る（**作成作業は本人が管理画面で行う**。スキーマは下記）
- `src/lib/microcms.ts` に取得・正規化関数を追加（microCMS 依存はここに集約＝ CLAUDE.md §5 の方針）
- ビルド時に取得して Worker バンドルに焼き込む（実行時 fetch はしない）
- 取得失敗・未設定時はコードの既定値にフォールバック（ビルドは落とさない／警告ログを出す）
- 既存の `facts`（サイト表示済みの事実）はコードのまま維持し、CMS の `privateFacts` を追記する
- CLAUDE.md §4（コンテンツ定義）・§4.5 の更新
- 純粋関数（正規化・フォールバック分岐）のテスト

## スコープ外

- **My Profile 表示の CMS 化** … 本人判断でコードのまま（2026-09-10）。取得失敗時に氏名・大学・所属が HTML から消える SEO リスクもゼロになる。将来 CMS 化したくなっても、`rinya-persona` にフィールドを足すだけで済む（microCMS はフィールド数無制限）
- **RAG / AI Search** … まず `facts` を充実させる方針で合意（2026-09-10）。記事が数百件規模になってから
- **口調データ・Q&A の内容の作成と入力** … 別作業。生の Slack 発言は CMS にもリポジトリにも入れない（下記「データ投入の役割分担」）
- **microCMS の書き込み API の利用** … 本人が管理画面で入力する（Hobby の API キーは1個・GET権限）

## 受け入れ条件

- [ ] `rinya-persona.toneRules` に1行入れてビルドすると、rinyaAI の回答がそのルールに従う（ローカルで実AIに確認）
- [ ] `rinya-qa` に1件入れると、その `question` に対して AI が `answer` の言い回しを踏襲する
- [ ] CMS が空・未設定・取得失敗のいずれでも、rinyaAI は現在と同じ中立的な回答を返し、**ビルドは成功する**（警告ログあり）
- [ ] **デプロイされた Worker に `MICROCMS_API_KEY` が存在しない**（`wrangler secret list` で確認）
- [ ] 口調データ・非公開の事実が **git 履歴に入らない**（生成物は `.gitignore`、`git log -p` で確認）
- [ ] クライアントJS（`dist/client/_astro/*.js`）に `toneRules` / `privateFacts` の内容が含まれない
- [ ] `npm test` / `npx astro check` / CI相当ビルド（Cloudflare 認証なし）が通る
- [ ] CLAUDE.md §4 に新スキーマが記載されている

## microCMS のスキーマ（本人が管理画面で作成する）

### `rinya-persona`（オブジェクト形式・1レコード）

| フィールドID | 種類 | 必須 | 用途 |
| --- | --- | --- | --- |
| `toneRules` | テキストエリア | | 口調ルール。**1行1ルール**（例：語尾・一人称・砕け具合） |
| `privateFacts` | テキストエリア | | サイトには表示しないが AI だけが知る事実。**1行1件**（例：好きな食べ物） |

### `rinya-qa`（リスト形式）

| フィールドID | 種類 | 必須 | 用途 |
| --- | --- | --- | --- |
| `keyword` | テキストフィールド | ✅ | マッチ用のキーワード（既存 `RinyaQaEntry.keyword` と同じ役割） |
| `question` | テキストフィールド | | few-shot の例に使う質問文 |
| `answer` | テキストエリア | ✅ | 本人の口調の回答。few-shot の例 ＋ AI 失敗時のフォールバック |

- 下書きステータスにしておけば API のデフォルト取得に含まれない（CLAUDE.md §4.1）ので、書きかけが本番に出ない
- Hobby の API 上限は5個。`posts` + `categories` + 上記2つ ＝ **4個使用（残1個）**

## 実装方針

### 変更するファイル

- `src/lib/microcms.ts` … `fetchRinyaPersona()` / `fetchRinyaQa()` と正規化（テキストエリアを行分割して `string[]` に、空行は捨てる）を追加
- `src/data/rinya-persona.ts` … `RINYA_PERSONA` を「CMS 由来 ＋ コード既定値」で組み立てる形に変更。`facts` は現状維持、`toneRules` / `examples` / 追加の `privateFacts` が CMS 由来
- `src/data/rinya-qa.ts` … CMS 由来に（取れなければ空配列）
- `src/lib/rinyaPrompt.ts` … `privateFacts` をシステムプロンプトに載せる（`facts` と同じ扱いで、公開/非公開の区別はプロンプト上不要）
- `CLAUDE.md` … §4 に上記スキーマ、§4.5 に「`privateFacts` は隣人に見られて困る内容を入れない」前提を追記
- `.gitignore` … 生成物（案a を採る場合）

### 追加するモジュール

- `src/content.config.ts` … Astro Content Layer のカスタムローダー（第一候補）
- 代替：`scripts/fetch-persona.mjs` ＋ `package.json` の `build` を `node scripts/fetch-persona.mjs && astro build` に

### 技術検証の結果（2026-09-10 実施 → **案b（Content Layer）で確定**）

固定データを返すローダーで最小のコレクションを作り、`export const prerender = false` のエンドポイントから `getEntry` で読めるかを確認した。

- **結果：読める。** `GET /api/probe-check` → `{"ok":true,"value":{"id":"singleton","value":"CONTENT_LAYER_OK"}}`
- データの置き場所：`dist/server/chunks/_astro_data-layer-content_*.mjs`（＝**Worker バンドルに入る**）。ビルド中間物は `.astro/data-store.json`
- よって案a（prebuild スクリプト）は不要。`src/lib/microcms.ts` を Node の `.mjs` から import する問題も回避できる
- 注意：Astro は `_` で始まるファイルをルーティングから除外する。検証中に `api/__probe.ts` が 404 になって一度ハマった

### microCMS のレスポンス仕様（検証で判明・実装で必ず扱う）

**値が空のフィールドはレスポンスから消える**（`""` ではなくキー自体が存在しない）。実測:

```json
// toneRules が空のとき
{ "createdAt": "...", "updatedAt": "...", "publishedAt": "...", "revisedAt": "..." }
// toneRules に値を入れたとき
{ "createdAt": "...", ..., "toneRules": "テスト（あとで消します）" }
```

正規化は `undefined` を前提に書く（`?? ""` で受けてから行分割する）。

### なぜ実行時 fetch（案c）を採らないか

1. CLAUDE.md §3 の「実行時に microCMS を叩かない」方針に反し、microCMS が落ちると rinyaAI も答えられなくなる
2. **セキュリティ後退になる** … 現状 `MICROCMS_API_KEY` はビルド時だけ必要で、**デプロイ済みの Worker には入っていない**。実行時 fetch にすると Worker のシークレットとして常駐させることになる

### 並列化の単位

直列（機能が1つ、かつ技術検証の結果に後続が依存する）。

## データ投入の役割分担（実装後の別作業）

生の Slack 発言をリポジトリにも CMS にも入れないための手順。

1. **本人** … Slack times を30件ほど貼る（社内固有名は伏せる）＋ 訪問者が聞きそうな10問に素の口調で答える
2. **AI** … そこから口調ルール（語尾・一人称・砕け具合）と Q&A の例を**草案**にする。一般化したルールと例文だけを出し、生の発言は残さない
3. **本人** … 草案を添削・承認する
4. **本人** … 承認した内容を microCMS の管理画面に入力する（AI は書き込まない）

## 想定リスク・確認事項

- **Content Layer が SSR エンドポイントで使えるかは未検証** … 上記「最初にやること」で潰す
- **`privateFacts` はプロンプトインジェクションで漏れる可能性が残る** … システムプロンプトに載る以上、完全には防げない（rinyaAI 実装時のセキュリティレビューでも同じ結論）。**隣人に見られて困る内容は入れない**という前提で運用する
- **Hobby の API 上限5個のうち4個使用になる**（残1個）
- CMS が空のときに黙って既定値で通ると「口調データが本番に反映されていない」ことに気づけない → ビルドログに警告を出す
