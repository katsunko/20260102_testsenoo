# 栄養トラッカー

食事を記録すると自動でPFCバランス・ビタミン・ミネラルを計算し、日/週/月単位で可視化する個人用栄養管理Webアプリ。
キャラクター(碧井コーチ)が記録内容に基づいてアドバイスし、目標に応じて食事・運動をレコメンドする。

設計の詳細は [docs/DESIGN.md](./docs/DESIGN.md) を参照。

## 現在の実装状況(Phase 1)

- 食事記録(テキスト入力、Claude APIによる食品・分量抽出 + 未設定時のフォールバック)
- PFC・ビタミン・ミネラルの自動計算、日/週/月サマリー
- 目標設定(カロリー・PFC比率・目標体重・目標歩数)
- キャラクターアドバイザー(Claude API未設定時はルールベースのフォールバックメッセージ)
- 食事・運動レコメンド(不足栄養素に応じた食品提案、カロリー超過分の運動時間換算)

写真解析(Vision LLM)とiPhoneヘルスケア連携は未実装(`docs/DESIGN.md` のPhase3, 6を参照)。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーし、値を設定する。

```bash
cp .env.example .env
```

- `DATABASE_URL`: PostgreSQL接続文字列(Supabase推奨。ローカルPostgresでも可)
- `ANTHROPIC_API_KEY`: 未設定でも動作するが、その場合は食品解析・アドバイスがルールベースのフォールバックになる
- `DEFAULT_USER_ID`: Phase1では単一ユーザー前提のため固定IDを使用

### 3. データベースのセットアップ

```bash
npx prisma migrate dev
npm run db:seed
```

シードで食品成分表サンプル(20品目)・食事摂取基準(RDA)参照値・デフォルトユーザーを投入する。
本番運用時は `prisma/data/food_items.sample.json` を文部科学省 日本食品標準成分表の全データに置き換えることを推奨(`docs/DESIGN.md` 9章参照)。

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でダッシュボード・食事記録・履歴・目標設定の各画面にアクセスできる。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint実行 |
| `npm run typecheck` | 型チェックのみ実行 |
| `npm run db:migrate` | Prismaマイグレーション |
| `npm run db:seed` | 食品マスタ・RDA参照値の投入 |

## 技術スタック

Next.js 16(App Router) / TypeScript / Tailwind CSS / Prisma / PostgreSQL / Recharts / Anthropic Claude API
