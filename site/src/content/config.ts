import { defineCollection, z } from 'astro:content';

// 集客用コンテンツ(海外ラウンジガイド)。1記事1ラウンジを基本単位とする。
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z
      .enum(['priority_pass_lounge', 'travel', 'credit_card', 'miles_points', 'alcohol'])
      .default('priority_pass_lounge'),
    airportCode: z.string().optional(), // 例: "NRT", "HND"
    excerpt: z.string().optional(),
    affiliateDisclosure: z.boolean().default(true),
    // 記事末尾のCardCtaコンポーネントで表示する推しカード(affiliate-links.jsonのキー)
    ctaCardKey: z.string().default('priority_pass'),
    // 記事下書き時にbotが生成したX投稿文案(人間レビュー後にコピペ運用)
    xPostDraft: z.string().optional(),
    draft: z.boolean().default(true),
  }),
});

// コンバージョン用コンテンツ(カード比較ページ=マネーページ)
const guides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    description: z.string(),
    affiliateDisclosure: z.boolean().default(true),
    cards: z
      .array(
        z.object({
          key: z.string(), // affiliate-links.json のキーと対応
          name: z.string(),
          annualFeeJpy: z.number(),
          priorityPassFeeCovered: z.boolean(),
          guestFreeVisits: z.number().default(0),
          notes: z.string().optional(),
        }),
      )
      .default([]),
    // このページから内部リンクする代表的なラウンジ記事のslug
    relatedArticleSlugs: z.array(z.string()).default([]),
  }),
});

export const collections = { articles, guides };
