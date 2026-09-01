# 20260102_testsenoo
年末年始は、いい日々でしたね。
また行きたいですね。

---

## 海外ラウンジガイド 記事生成bot(セットアップ手順)

プライオリティパスが使える海外空港ラウンジのガイド記事を毎日下書き生成し、人間のレビュー・編集を経てから
公開する半自動botです。完全無人での自動投稿はしません。

### 構成

- `site/` — Astro製のブログ本体(GitHub Pagesで公開)
- `bot/` — 記事下書き生成スクリプト(Claude API)、X投稿スクリプト(手動起動のみ)
- `.github/workflows/`
  - `daily-draft.yml` — 毎日cronで下書きを生成し、レビュー用PRを作成
  - `deploy.yml` — `main`へのマージをトリガーにGitHub Pagesへデプロイ
  - `publish-to-x.yml` — **workflow_dispatch(手動起動)専用**。X投稿の自動化はここでは行わない

### 必要なGitHub Actions Secrets

このリポジトリには実際のAPIキーは含まれていません。以下をリポジトリの
`Settings > Secrets and variables > Actions` に追加すると各ワークフローが動き始めます。

| Secret | 用途 | 未設定時の挙動 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 記事・X投稿文案の生成 | `daily-draft.yml`は警告を出してスキップ(cronが毎日失敗通知を出すことはない) |
| `X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN` / `X_ACCESS_SECRET` | X APIへの投稿(任意、Basic以上の有料プラン契約が必要) | `publish-to-x.yml`はエラーで停止。設定しない場合は下記の手動投稿で運用する |

GitHub Pagesへのデプロイには追加のシークレットは不要です(`GITHUB_TOKEN`のみで完結)。
アフィリエイトのトラッキングIDは非機微情報のため、Secretsではなく `bot/config/affiliate-links.json` に直接記載します。

### 日々の運用フロー(半自動)

1. 毎朝、`daily-draft.yml` がClaude APIで記事下書き+X投稿文案を生成し、レビュー用PRを自動で作成します。
2. 人間がPRの内容を確認・編集します(ラウンジの設備情報の事実確認、アフィリエイトリンクの妥当性、X文案の調整)。
3. 問題なければPRをmergeします。mergeすると `deploy.yml` が自動的にAstroサイトをビルドし、GitHub Pagesへデプロイします。
4. X投稿は自動化していません。公開後、記事frontmatterの `xPostDraft` の内容をコピペしてXへ手動投稿してください。
   X APIの認証情報(有料プラン契約済み)がある場合のみ、`Actions`タブから `Publish to X (manual only)` を手動実行することもできます。

### 実体験メモの投入

`bot/inputs/lounge-notes/YYYY-MM-DD.md` にラウンジの実訪問メモや事前リサーチメモを置いておくと、
その日の記事生成時に最優先の事実として使われます。無い場合は一般的な傾向として書ける内容にフォールバックします。

### ローカルでの動作確認

```bash
# Astroサイトのビルド確認
cd site && npm install && npm run build

# 記事生成スクリプトの依存解決(実行にはANTHROPIC_API_KEYが必要)
cd bot && npm install
```