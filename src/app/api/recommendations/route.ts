import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { computeSummary, extractLowNutrients } from "@/lib/summary";
import { RDA_NUTRIENT_KEY_MAP } from "@/lib/nutrition";
import { recommendExerciseMinutes, recommendFoodsForNutrient } from "@/lib/recommendation";

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();
  const dateParam = request.nextUrl.searchParams.get("date");
  const baseDate = dateParam ? new Date(dateParam) : new Date();

  const summary = await computeSummary(userId, "day", baseDate);
  const kcalTarget = summary.goal?.dailyKcalTarget ?? 2000;
  const remainingKcal = kcalTarget - summary.totals.kcal;

  const lowNutrientRows = summary.rdaProgress.filter((p) => p.nutrient !== "salt_g" && p.percent < 70);
  const foodRecommendations = await Promise.all(
    lowNutrientRows.slice(0, 3).map(async (row) => {
      const field = RDA_NUTRIENT_KEY_MAP[row.nutrient];
      if (!field) return null;
      const foods = await recommendFoodsForNutrient(field, Math.max(remainingKcal, 0));
      return { nutrient: row.nutrient, percent: Math.round(row.percent), foods };
    })
  );

  const exercise = recommendExerciseMinutes(
    summary.totals.kcal - kcalTarget,
    summary.goal?.targetWeightKg ?? undefined
  );

  return NextResponse.json({
    kcalTarget,
    totalKcal: Math.round(summary.totals.kcal),
    remainingKcal: Math.round(remainingKcal),
    foodRecommendations: foodRecommendations.filter(Boolean),
    exerciseRecommendation: exercise,
    dailyStepsTarget: summary.goal?.dailyStepsTarget ?? null,
    lowNutrients: extractLowNutrients(summary.rdaProgress),
  });
}
