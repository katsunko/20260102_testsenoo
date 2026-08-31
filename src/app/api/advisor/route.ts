import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { computeSummary, extractLowNutrients } from "@/lib/summary";
import { generateAdvisorMessage } from "@/lib/anthropic";

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();
  const dateParam = request.nextUrl.searchParams.get("date");
  const baseDate = dateParam ? new Date(dateParam) : new Date();
  const targetDate = new Date(baseDate);
  targetDate.setHours(0, 0, 0, 0);

  const cached = await prisma.advisorMessage.findFirst({
    where: { userId, targetDate, trigger: "DAILY" },
    orderBy: { generatedAt: "desc" },
  });
  if (cached) {
    return NextResponse.json({ message: cached.messageText, cached: true });
  }

  const summary = await computeSummary(userId, "day", baseDate);
  const lowNutrients = extractLowNutrients(summary.rdaProgress);
  const dateLabel = targetDate.toISOString().slice(0, 10);

  const messageText = await generateAdvisorMessage({
    dateLabel,
    totalKcal: summary.totals.kcal,
    kcalTarget: summary.goal?.dailyKcalTarget ?? 2000,
    proteinPercent: summary.pfc.proteinPercent,
    fatPercent: summary.pfc.fatPercent,
    carbPercent: summary.pfc.carbPercent,
    lowNutrients,
    goalType: summary.goal?.type,
  });

  const saved = await prisma.advisorMessage.create({
    data: { userId, targetDate, trigger: "DAILY", messageText },
  });

  return NextResponse.json({ message: saved.messageText, cached: false });
}
