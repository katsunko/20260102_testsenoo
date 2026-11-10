/**
 * X(Twitter)への投稿スクリプト。
 *
 * 【重要】このスクリプトは workflow_dispatch (人間が手動でActionsタブから起動した場合)
 * でのみ実行される想定で、cronやpushからは絶対にトリガーしないこと。
 * 半自動フローの「人間確認後に投稿」という要件を担保する最後の砦がこのスクリプトの
 * 呼び出しタイミングであり、呼び出し元のワークフロー定義を変更しない限り安全。
 *
 * X API v2への投稿にはBasic以上の有料プランが必要(2024年以降の仕様)。
 * 契約前は README記載の「記事frontmatterのxPostDraftをコピペしてXに手動投稿」を
 * 正の運用方法とする。
 *
 * 必要な環境変数(いずれもこのセッションでは未設定):
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
 *
 * 使い方:
 *   npm run post-to-x -- --slug 2026-09-01-example-lounge-report --url https://example.com/articles/...
 */
import { TwitterApi } from 'twitter-api-v2';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = join(__dirname, '..', 'site', 'src', 'content', 'articles');

function parseArgs() {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const urlIdx = args.indexOf('--url');
  if (slugIdx === -1 || urlIdx === -1) {
    throw new Error('使い方: post-to-x --slug <記事ファイル名(拡張子なし)> --url <公開URL>');
  }
  return { slug: args[slugIdx + 1], url: args[urlIdx + 1] };
}

function extractXPostDraft(slug: string): string {
  const filepath = join(ARTICLES_DIR, `${slug}.md`);
  const content = readFileSync(filepath, 'utf-8');
  const match = content.match(/xPostDraft:\s*"((?:[^"\\]|\\.)*)"/);
  if (!match) {
    throw new Error(`xPostDraftが見つかりませんでした: ${filepath}`);
  }
  return match[1].replace(/\\"/g, '"');
}

async function main() {
  const { slug, url } = parseArgs();
  const draft = extractXPostDraft(slug);
  const text = `${draft}\n${url}`;

  const requiredEnv = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `X APIの認証情報が未設定です: ${missing.join(', ')}\n` +
        'この環境変数が揃うまでは手動コピペ運用(READMEを参照)を使ってください。',
    );
  }

  const client = new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });

  const result = await client.v2.tweet(text);
  console.log('Posted:', result.data.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
