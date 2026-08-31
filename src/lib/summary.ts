import { prisma } from "./prisma";
import { getDateRange, splitIntoDays, type SummaryRange } from "./date-range";
import { calcNutrientsForGrams, calcPfcBalance, calcRdaProgress, getAgeBand, sumNutrientTotals } from "./nutrition";

export async function computeSummary(userId: string, range: SummaryRange, baseDate: Date) {
  const { start, end } = getDateRange(range, baseDate);

  const [meals, user, activeGoal] = await Promise.all([
    prisma.mealLog.findMany({
      where: { userId, status: "CONFIRMED", loggedAt: { gte: start, lt: end } },
      include: { items: { include: { foodItem: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.goal.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const perMealTotals = meals.map((meal) =>
    sumNutrientTotals(
      meal.items
        .filter((item) => item.foodItem)
        .map((item) => calcNutrientsForGrams(item.foodItem!, item.confirmedGrams ?? item.estimatedGrams))
    )
  );
  const totals = sumNutrientTotals(perMealTotals);
  const pfc = calcPfcBalance(totals);

  const ageBand = getAgeBand(user?.birthDate ?? null);
  const rdaTargets = await prisma.rdaReference.findMany({
    where: { ageBand, sex: user?.sex ?? "MALE" },
  });
  const rdaProgress = calcRdaProgress(totals, rdaTargets);

  const dailyBreakdown = splitIntoDays(start, end).map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayMeals = meals.filter((m) => m.loggedAt >= day && m.loggedAt < dayEnd);
    const dayTotals = sumNutrientTotals(
      dayMeals.flatMap((meal) =>
        meal.items
          .filter((item) => item.foodItem)
          .map((item) => calcNutrientsForGrams(item.foodItem!, item.confirmedGrams ?? item.estimatedGrams))
      )
    );
    return {
      date: day.toISOString().slice(0, 10),
      kcal: Math.round(dayTotals.kcal),
      pfc: calcPfcBalance(dayTotals),
    };
  });

  return { range, start, end, totals, pfc, rdaProgress, goal: activeGoal, dailyBreakdown, user };
}

/** RDA充足率が70%未満の栄養素名(日本語)を抽出する。食塩(上限)は超過判定にする。 */
const NUTRIENT_LABELS: Record<string, string> = {
  vitamin_a: "ビタミンA",
  vitamin_d: "ビタミンD",
  vitamin_e: "ビタミンE",
  vitamin_k: "ビタミンK",
  vitamin_b1: "ビタミンB1",
  vitamin_b2: "ビタミンB2",
  vitamin_b6: "ビタミンB6",
  vitamin_b12: "ビタミンB12",
  vitamin_c: "ビタミンC",
  niacin: "ナイアシン",
  folate: "葉酸",
  pantothenic_acid: "パントテン酸",
  calcium: "カルシウム",
  iron: "鉄",
  zinc: "亜鉛",
  magnesium: "マグネシウム",
  potassium: "カリウム",
  salt_g: "食塩(過剰)",
};

export function extractLowNutrients(rdaProgress: { nutrient: string; percent: number }[]): string[] {
  return rdaProgress
    .filter((p) => (p.nutrient === "salt_g" ? p.percent > 100 : p.percent < 70))
    .map((p) => NUTRIENT_LABELS[p.nutrient] ?? p.nutrient);
}
