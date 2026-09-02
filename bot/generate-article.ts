/**
 * 毎日の下書き生成スクリプト。
 * Claude APIで海外ラウンジガイド記事+X投稿文案を生成し、
 * site/src/content/articles/ にMarkdownとして書き出す。
 *
 * 生成物はPR作成の元データになるだけで、人間のレビュー・編集を経てから
 * mergeされて初めて公開される(半自動フロー)。
 *
 * 必要な環境変数:
 *   ANTHROPIC_API_KEY - Claude APIキー
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(REPO_ROOT, 'site', 'src', 'content', 'articles');
const LOUNGE_NOTES_DIR = join(__dirname, 'inputs', 'lounge-notes');
const AFFILIATE_LINKS_PATH = join(__dirname, 'config', 'affiliate-links.json');
const SYSTEM_PROMPT_PATH = join(__dirname, 'prompts', 'system-prompt.md');

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-5';

interface GeneratedArticle {
  title: string;
  slug: string;
  frontmatter: {
    tags: string[];
    category: string;
    airportCode: string;
    excerpt: string;
  };
  body_markdown: string;
  cta_card_key: string;
  cta_context_line: string;
  x_post_text: string;
}

function todayLoungeNotes(): string | null {
  if (!existsSync(LOUNGE_NOTES_DIR)) return null;
  const today = new Date().toISOString().slice(0, 10);
  const candidate = join(LOUNGE_NOTES_DIR, `${today}.md`);
  if (existsSync(candidate)) return readFileSync(candidate, 'utf-8');

  // 当日分が無ければ、未使用の一次情報メモを先着順で1件使う運用も許容する
  const files = readdirSync(LOUNGE_NOTES_DIR).filter((f) => f.endsWith('.md'));
  if (files.length === 0) return null;
  return readFileSync(join(LOUNGE_NOTES_DIR, files[0]), 'utf-8');
}

function loadAffiliateKeys(): string[] {
  const raw = JSON.parse(readFileSync(AFFILIATE_LINKS_PATH, 'utf-8'));
  return Object.keys(raw).filter((k) => !k.startsWith('_'));
}

async function generateArticle(): Promise<GeneratedArticle> {
  const systemPrompt = readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');
  const loungeNotes = todayLoungeNotes();
  const affiliateKeys = loadAffiliateKeys();

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userContent = loungeNotes
    ? `以下は今日使うラウンジの一次情報メモです。これを事実source of truthとして記事を書いてください。\n\n---\n${loungeNotes}\n---`
    : '今日投入された一次情報メモはありません。一般的な傾向として書ける内容に留めて、海外ラウンジガイド記事を1本書いてください。';

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `${systemPrompt}\n\n利用可能な cta_card_key: ${affiliateKeys.join(', ')}`,
    messages: [{ role: 'user', content: userContent }],
    tools: [
      {
        name: 'emit_article',
        description: '生成した記事とX投稿案を指定フォーマットで出力する',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            slug: { type: 'string' },
            frontmatter: {
              type: 'object',
              properties: {
                tags: { type: 'array', items: { type: 'string' } },
                category: { type: 'string' },
                airportCode: { type: 'string' },
                excerpt: { type: 'string' },
              },
              required: ['tags', 'category', 'airportCode', 'excerpt'],
            },
            body_markdown: { type: 'string' },
            cta_card_key: { type: 'string', enum: affiliateKeys },
            cta_context_line: { type: 'string' },
            x_post_text: { type: 'string' },
          },
          required: [
            'title',
            'slug',
            'frontmatter',
            'body_markdown',
            'cta_card_key',
            'cta_context_line',
            'x_post_text',
          ],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'emit_article' },
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claudeから構造化出力(emit_article)が得られませんでした');
  }
  return toolUse.input as GeneratedArticle;
}

function toFrontmatterYaml(article: GeneratedArticle, date: string): string {
  const { title, frontmatter, cta_card_key, x_post_text } = article;
  const tagsYaml = frontmatter.tags.map((t) => `  - "${t}"`).join('\n');
  return [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${date}`,
    'tags:',
    tagsYaml || '  []',
    `category: "${frontmatter.category}"`,
    frontmatter.airportCode ? `airportCode: "${frontmatter.airportCode}"` : null,
    `excerpt: "${frontmatter.excerpt.replace(/"/g, '\\"')}"`,
    'affiliateDisclosure: true',
    `ctaCardKey: "${cta_card_key}"`,
    `xPostDraft: "${x_post_text.replace(/"/g, '\\"')}"`,
    'draft: true',
    '---',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

async function main() {
  const article = await generateArticle();
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${date}-${article.slug}.md`;
  const filepath = join(ARTICLES_DIR, filename);

  const ctaNote = `\n\n<!-- CTA: cta_card_key=${article.cta_card_key} / ${article.cta_context_line} -->\n`;
  const content = `${toFrontmatterYaml(article, date)}\n\n${article.body_markdown}${ctaNote}`;

  writeFileSync(filepath, content, 'utf-8');

  // GitHub ActionsのPR本文用に、生成結果のサマリをstdoutへ出す
  console.log(`Generated: ${filepath}`);
  console.log(`X post draft:\n${article.x_post_text}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
