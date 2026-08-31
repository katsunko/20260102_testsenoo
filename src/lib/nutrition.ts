import type { FoodItem } from "@prisma/client";

/** 食品成分表の1項目を「グラム数」で按分した際の栄養素合計。 */
export type NutrientTotals = {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  fiberG: number;
  sugarG: number;
  saltG: number;
  vitaminA: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  vitaminB1: number;
  vitaminB2: number;
  vitaminB6: number;
  vitaminB12: number;
  vitaminC: number;
  niacin: number;
  folate: number;
  pantothenicAcid: number;
  sodium: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  phosphorus: number;
  iron: number;
  zinc: number;
  copper: number;
  manganese: number;
};

const EMPTY_TOTALS: NutrientTotals = {
  kcal: 0,
  proteinG: 0,
  fatG: 0,
  carbG: 0,
  fiberG: 0,
  sugarG: 0,
  saltG: 0,
  vitaminA: 0,
  vitaminD: 0,
  vitaminE: 0,
  vitaminK: 0,
  vitaminB1: 0,
  vitaminB2: 0,
  vitaminB6: 0,
  vitaminB12: 0,
  vitaminC: 0,
  niacin: 0,
  folate: 0,
  pantothenicAcid: 0,
  sodium: 0,
  potassium: 0,
  calcium: 0,
  magnesium: 0,
  phosphorus: 0,
  iron: 0,
  zinc: 0,
  copper: 0,
  manganese: 0,
};

/** FoodItemの100gあたり値 → NutrientTotalsのキーの対応。 */
const FOOD_ITEM_FIELD_MAP: Record<keyof Omit<NutrientTotals, "kcal">, keyof FoodItem> = {
  proteinG: "proteinG",
  fatG: "fatG",
  carbG: "carbG",
  fiberG: "fiberG",
  sugarG: "sugarG",
  saltG: "saltG",
  vitaminA: "vitaminA",
  vitaminD: "vitaminD",
  vitaminE: "vitaminE",
  vitaminK: "vitaminK",
  vitaminB1: "vitaminB1",
  vitaminB2: "vitaminB2",
  vitaminB6: "vitaminB6",
  vitaminB12: "vitaminB12",
  vitaminC: "vitaminC",
  niacin: "niacin",
  folate: "folate",
  pantothenicAcid: "pantothenicAcid",
  sodium: "sodium",
  potassium: "potassium",
  calcium: "calcium",
  magnesium: "magnesium",
  phosphorus: "phosphorus",
  iron: "iron",
  zinc: "zinc",
  copper: "copper",
  manganese: "manganese",
};

/** RdaReference.nutrient の文字列キーと NutrientTotals のフィールドの対応(RDA判定対象のみ)。 */
export const RDA_NUTRIENT_KEY_MAP: Partial<Record<string, keyof NutrientTotals>> = {
  vitamin_a: "vitaminA",
  vitamin_d: "vitaminD",
  vitamin_e: "vitaminE",
  vitamin_k: "vitaminK",
  vitamin_b1: "vitaminB1",
  vitamin_b2: "vitaminB2",
  vitamin_b6: "vitaminB6",
  vitamin_b12: "vitaminB12",
  vitamin_c: "vitaminC",
  niacin: "niacin",
  folate: "folate",
  pantothenic_acid: "pantothenicAcid",
  calcium: "calcium",
  iron: "iron",
  zinc: "zinc",
  magnesium: "magnesium",
  potassium: "potassium",
  salt_g: "saltG",
};

/** 食品成分表(100gあたり)を指定グラム数で按分した栄養素量を計算する。 */
export function calcNutrientsForGrams(foodItem: FoodItem, grams: number): NutrientTotals {
  const ratio = grams / 100;
  const result: NutrientTotals = { ...EMPTY_TOTALS };
  result.kcal = foodItem.kcalPer100g * ratio;

  for (const key of Object.keys(FOOD_ITEM_FIELD_MAP) as (keyof typeof FOOD_ITEM_FIELD_MAP)[]) {
    const value = foodItem[FOOD_ITEM_FIELD_MAP[key]];
    result[key] = typeof value === "number" ? value * ratio : 0;
  }

  return result;
}

/** 複数の栄養素合計を1つに集計する。 */
export function sumNutrientTotals(totalsList: NutrientTotals[]): NutrientTotals {
  const sum: NutrientTotals = { ...EMPTY_TOTALS };
  for (const totals of totalsList) {
    for (const key of Object.keys(sum) as (keyof NutrientTotals)[]) {
      sum[key] += totals[key];
    }
  }
  return sum;
}

/** 期間合計を日数で割り、1日あたりの平均値にする(週/月のRDA充足率判定に使用)。 */
export function averageNutrientTotals(totals: NutrientTotals, days: number): NutrientTotals {
  const divisor = days > 0 ? days : 1;
  const avg = { ...totals };
  for (const key of Object.keys(avg) as (keyof NutrientTotals)[]) {
    avg[key] = totals[key] / divisor;
  }
  return avg;
}

export type PfcBalance = {
  proteinKcal: number;
  fatKcal: number;
  carbKcal: number;
  totalKcal: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
};

const KCAL_PER_G = { protein: 4, fat: 9, carb: 4 } as const;

/** PFC(タンパク質・脂質・炭水化物)のカロリー比率を計算する。 */
export function calcPfcBalance(totals: NutrientTotals): PfcBalance {
  const proteinKcal = totals.proteinG * KCAL_PER_G.protein;
  const fatKcal = totals.fatG * KCAL_PER_G.fat;
  const carbKcal = totals.carbG * KCAL_PER_G.carb;
  const totalKcal = proteinKcal + fatKcal + carbKcal;

  return {
    proteinKcal,
    fatKcal,
    carbKcal,
    totalKcal,
    proteinPercent: totalKcal > 0 ? (proteinKcal / totalKcal) * 100 : 0,
    fatPercent: totalKcal > 0 ? (fatKcal / totalKcal) * 100 : 0,
    carbPercent: totalKcal > 0 ? (carbKcal / totalKcal) * 100 : 0,
  };
}

export type RdaTarget = { nutrient: string; unit: string; rdaValue: number };

export type RdaProgress = {
  nutrient: string;
  unit: string;
  rdaValue: number;
  intake: number;
  percent: number;
};

/**
 * 摂取量(NutrientTotals)と食事摂取基準(RdaTarget[])を突き合わせ、充足率を計算する。
 * salt_g のような上限目標値も同じ percent 形式で返すため、呼び出し側で
 * 「充足率」として扱うか「上限に対する消費率」として扱うかを nutrient 名で判定する。
 */
export function calcRdaProgress(totals: NutrientTotals, targets: RdaTarget[]): RdaProgress[] {
  return targets
    .map((target) => {
      const field = RDA_NUTRIENT_KEY_MAP[target.nutrient];
      if (!field) return null;
      const intake = totals[field];
      return {
        nutrient: target.nutrient,
        unit: target.unit,
        rdaValue: target.rdaValue,
        intake,
        percent: target.rdaValue > 0 ? (intake / target.rdaValue) * 100 : 0,
      };
    })
    .filter((v): v is RdaProgress => v !== null);
}

/** 生年月日から食事摂取基準の年齢区分を求める(RdaReference.ageBand と対応)。 */
export function getAgeBand(birthDate: Date | null | undefined, now: Date = new Date()): "18-29" | "30-49" | "50-69" {
  if (!birthDate) return "30-49";
  const age = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  if (age < 30) return "18-29";
  if (age < 50) return "30-49";
  return "50-69";
}
