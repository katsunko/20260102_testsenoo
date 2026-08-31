import { prisma } from "./prisma";

export type MealDraftItem = {
  foodNameRaw: string;
  estimatedGrams: number;
  foodItemId: string | null;
  matchedFoodName: string | null;
};

/** 食品名候補(AI抽出結果など)を食品成分表マスタと突き合わせ、確認用のドラフト項目に変換する。 */
export async function buildMealDraftItems(
  candidates: { name: string; grams: number }[]
): Promise<MealDraftItem[]> {
  const draftItems: MealDraftItem[] = [];
  for (const candidate of candidates) {
    const match = await prisma.foodItem.findFirst({
      where: { name: { contains: candidate.name, mode: "insensitive" } },
    });
    draftItems.push({
      foodNameRaw: candidate.name,
      estimatedGrams: candidate.grams,
      foodItemId: match?.id ?? null,
      matchedFoodName: match?.name ?? null,
    });
  }
  return draftItems;
}
