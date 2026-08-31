import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseMealTextWithClaude } from "@/lib/anthropic";
import { buildMealDraftItems } from "@/lib/meal-draft";

const bodySchema = z.object({ rawText: z.string().min(1) });

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { rawText } = parsed.data;

  const aiItems = await parseMealTextWithClaude(rawText);

  const candidateNames =
    aiItems?.map((item) => ({ name: item.name, grams: item.grams })) ??
    (await naiveExtractFoodNames(rawText));

  const draftItems = await buildMealDraftItems(candidateNames);

  return NextResponse.json({ items: draftItems, aiUsed: aiItems !== null });
}

/** ANTHROPIC_API_KEY未設定時のフォールバック: DB上の食品名がテキストに含まれるかを単純一致で探す。 */
async function naiveExtractFoodNames(rawText: string): Promise<{ name: string; grams: number }[]> {
  const allFoods = await prisma.foodItem.findMany({ select: { name: true } });
  const found = allFoods.filter((food) => rawText.includes(food.name));
  if (found.length > 0) {
    return found.map((food) => ({ name: food.name, grams: 100 }));
  }
  return [{ name: rawText.slice(0, 30), grams: 100 }];
}
