# AI Fashion Stylist

Gemini API (`gemini-2.5-flash`) の構造化出力（Structured Outputs）と Server-Sent Events (SSE) を組み合わせ、ユーザーの選択条件に応じたファッションコーディネートをリアルタイムにストリーミング生成・描画するフルスタック Web アプリケーションです。

---

## 主な機能

* **動的プロンプトビルダー**: 性別・季節・着用シーン・スタイルテイスト・予算感のタグ選択と自由記述を組み合わせてプロンプトを自動構築。
* **JSON 構造化ストリーミング**: バックエンドで Gemini API から JSON スキーマ準拠のデータをストリーミング取得し、SSE 経由でフロントエンドへ配信。
* **リアルタイムカード UI 描画**: フロントエンドで不完全な JSON チャンクを逐次パース（`partial-json`）し、タイトル・構成アイテム・アドバイスをカード形式でリアルタイムレンダリング。
* **UI / UX 最適化**: 生成待機中のスケルトンローディング表示、カテゴリ・カラーバッジの整理、エラー発生時の再試行バナーを実装。

---

## 技術スタック

### モノレポ / ビルドツール
* **pnpm** (ワークスペース管理)
* **Turborepo** (タスクランナー / ビルドパイプライン)

### フロントエンド (`apps/frontend`)
* **React** / **TypeScript**
* **Vite**
* **Tailwind CSS v4** (`@tailwindcss/typography`)
* **partial-json** (ストリーミング途中の不完全な JSON 文字列のリアルタイム復元・パース)
* **EventSource API** (SSE クライアント通信)

### バックエンド (`apps/backend`)
* **NestJS** / **TypeScript**
* **RxJS** (`Observable` を用いた SSE ストリーム制御)
* **Google Gen AI SDK (`@google/genai`)** (`gemini-2.5-flash` / `responseSchema` による JSON 構造化出力)

---

## セットアップと起動方法

### 1. 前提条件
* Node.js (v20 以上推奨)
* pnpm
* Google AI Studio で発行した Gemini API キー

### 2. 依存パッケージのインストール
ルートディレクトリで実行します。

```bash
pnpm install
```

### 3. 環境変数の設定
`apps/backend/.env` ファイルを作成し、API キーを設定します。

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. 開発サーバーの起動
フロントエンド・バックエンドを一括で起動します。

```bash
pnpm dev
```

* **フロントエンド**: `http://localhost:5173`
* **バックエンド API**: `http://localhost:3000`

*(※ 個別に起動する場合は `pnpm --filter frontend dev` / `pnpm --filter backend dev` を使用)*

---

## 学習・実装のポイント

1. **Markdown ストリーミングから JSON 構造化ストリーミングへの移行**
   * 初期実装ではテキスト（Markdown）の逐次表示を行っていたが、UI コンポーネント（カード・バッジ）へのマッピング精度を高めるため、`responseMimeType: 'application/json'` と `responseSchema` を指定した JSON ストリーミングへ刷新。
2. **途切れた JSON チャンクの安全なパース (`partial-json`)**
   * SSE で断片的に届く JSON 文字列に対し、標準の `JSON.parse()` では受信完了までパースエラーとなる課題を、`partial-json` を導入することで解決し、生成途中の状態でもリアルタイムにカード UI へ反映。
3. **モノレポ環境での CORS とポート管理**
   * Vite のポートフォールバック（`5173` / `5174`）を考慮し、NestJS 側（`main.ts`）の `enableCors` で複数オリジンを許可するよう構成。

---

## 今後の実装予定 (Roadmap)

* **出力イメージのビジュアル表示**
  * 生成されたコーディネートや各アイテムのテキスト情報をもとに、画像生成 API（Imagen 等）または商品・コーディネート画像の検索 API と連携し、スタイリングの完成イメージを視覚的に表示する機能。
* **全体 UI / UX のさらなる洗練**
  * カラー名（例：「ネイビー」「ダークブラウン」）に応じた実際のカラーコード（HEX）の自動マッピングとリアルなカラースウォッチ表示。
  * マイクロインタラクション（アイテムカードの出現アニメーションやトランジション）の強化とモバイル表示の最適化。
* **データ永続化とお気に入り・履歴機能**
  * Prisma + PostgreSQL を導入し、生成したコーディネート結果の保存・お気に入り登録・過去の履歴一覧表示機能を実装。