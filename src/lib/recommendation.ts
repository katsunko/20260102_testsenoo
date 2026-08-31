import { prisma } from "./prisma";
import type { NutrientTotals } from "./nutrition";

// NutrientTotals と FoodItem は同名フィールドで対応しているため、RDA判定対象の栄養素はそのまま検索キーとして使える。
const RECOMMENDABLE_NUTRIENTS: (keyof NutrientTotals)[] = [
  "proteinG",
  "vitaminA",
  "vitaminD",
  "vitaminE",
  "vitaminK",
  "vitaminB1",
  "vitaminB2",
  "vitaminB6",
  "vitaminB12",
  "vitaminC",
  "niacin",
  "folate",
  "pantothenicAcid",
  "calcium",
  "iron",
  "zinc",
  "magnesium",
  "potassium",
];

/** カロリー超過分をMETs換算で運動時間(分)に変換する。体重未設定時は60kgを仮定。 */
export function recommendExerciseMinutes(kcalOver: number, weightKg = 60) {
  if (kcalOver <= 0) return { walkMinutes: 0, joggingMinutes: 0 };

  const kcalPerMinute = (met: number) => (met * 3.5 * weightKg) / 200;
  const walkMinutes = Math.round(kcalOver / kcalPerMinute(3.5));
  const joggingMinutes = Math.round(kcalOver / kcalPerMinute(7.0));

  return { walkMinutes, joggingMinutes };
}

export type FoodRecommendation = { foodName: string; per100gAmount: number; unit: string };

/**
 * 不足している栄養素を補える食品を、食品成分表マスタから上位順に提案する。
 * remainingKcal を超えない一般的な分量(100g想定)のものを優先する。
 */
export async function recommendFoodsForNutrient(
  nutrient: keyof NutrientTotals,
  remainingKcal: number,
  limit = 3
): Promise<FoodRecommendation[]> {
  if (!RECOMMENDABLE_NUTRIENTS.includes(nutrient)) return [];
  const field = nutrient;

  const candidates = await prisma.foodItem.findMany({
    where: {
      [field]: { not: null, gt: 0 },
      ...(remainingKcal > 0 ? { kcalPer100g: { lte: Math.max(remainingKcal, 50) } } : {}),
    },
    orderBy: { [field]: "desc" },
    take: limit,
  });

  return candidates.map((item) => ({
    foodName: item.name,
    per100gAmount: (item as unknown as Record<string, number | null>)[field] ?? 0,
    unit: "per100g",
  }));
}
