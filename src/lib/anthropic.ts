import Anthropic from "@anthropic-ai/sdk";
import { ADVISOR_PERSONA_SYSTEM_PROMPT, type AdvisorContext, buildFallbackAdvisorMessage } from "./persona";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type ParsedMealItem = { name: string; grams: number };

const MEAL_ITEM_EXTRACTION_INSTRUCTION =
  "食品名(一般的な和名)と概算のグラム数を抽出してください。" +
  '出力は必ず次のJSON形式の配列のみ: [{"name": "食品名", "grams": 数値}]。説明文や前置きは一切書かないこと。';

function extractMealItemsFromText(text: string): ParsedMealItem[] | null {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((item) => typeof item?.name === "string" && typeof item?.grams === "number")
      .map((item) => ({ name: item.name, grams: item.grams }));
  } catch {
    return null;
  }
}

/**
 * 食事のテキスト説明から食品名と概算グラム数を抽出する。
 * ANTHROPIC_API_KEY 未設定時は null を返し、呼び出し側で簡易フォールバック処理を行う。
 */
export async function parseMealTextWithClaude(rawText: string): Promise<ParsedMealItem[] | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `あなたは食事の説明文から、${MEAL_ITEM_EXTRACTION_INSTRUCTION}`,
    messages: [{ role: "user", content: rawText }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  return extractMealItemsFromText(textBlock.text);
}

export type SupportedImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/**
 * 食事写真から食品名と概算グラム数(見た目からの推定)を抽出する。
 * ANTHROPIC_API_KEY 未設定時は null を返し、呼び出し側でエラーメッセージを表示する
 * (テキスト解析と異なり、画像は単純一致によるフォールバックが成立しないため)。
 */
export async function parseMealImageWithClaude(
  base64Image: string,
  mediaType: SupportedImageMediaType
): Promise<ParsedMealItem[] | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system:
      `あなたは食事写真を見て、写っている料理・食材ごとに${MEAL_ITEM_EXTRACTION_INSTRUCTION}` +
      "日本の家庭料理・外食を想定し、皿の大きさなどから分量を常識的に見積もること。",
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
          { type: "text", text: "この食事に写っている食品を抽出してください。" },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  return extractMealItemsFromText(textBlock.text);
}

/**
 * 当日/週次の栄養サマリーからキャラクター(碧井コーチ)のアドバイスメッセージを生成する。
 * ANTHROPIC_API_KEY 未設定時はルールベースのフォールバックメッセージを返す。
 */
export async function generateAdvisorMessage(ctx: AdvisorContext): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) return buildFallbackAdvisorMessage(ctx);

  const userPrompt = `
対象期間: ${ctx.dateLabel}
摂取カロリー: ${Math.round(ctx.totalKcal)}kcal(目標: ${ctx.kcalTarget}kcal)
PFCバランス: タンパク質${ctx.proteinPercent.toFixed(0)}% / 脂質${ctx.fatPercent.toFixed(0)}% / 炭水化物${ctx.carbPercent.toFixed(0)}%
不足気味の栄養素: ${ctx.lowNutrients.length > 0 ? ctx.lowNutrients.join("、") : "特になし"}
目標タイプ: ${ctx.goalType ?? "未設定"}
`.trim();

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      system: ADVISOR_PERSONA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const textBlock = message.content.find((block) => block.type === "text");
    if (textBlock && textBlock.type === "text") return textBlock.text.trim();
    return buildFallbackAdvisorMessage(ctx);
  } catch {
    return buildFallbackAdvisorMessage(ctx);
  }
}
