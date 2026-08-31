import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { computeSummary } from "@/lib/summary";
import type { SummaryRange } from "@/lib/date-range";

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();
  const range = (request.nextUrl.searchParams.get("range") ?? "day") as SummaryRange;
  const dateParam = request.nextUrl.searchParams.get("date");
  const baseDate = dateParam ? new Date(dateParam) : new Date();

  const summary = await computeSummary(userId, range, baseDate);

  return NextResponse.json({
    range: summary.range,
    start: summary.start.toISOString(),
    end: summary.end.toISOString(),
    totals: summary.totals,
    pfc: summary.pfc,
    rdaProgress: summary.rdaProgress,
    goal: summary.goal,
    dailyBreakdown: summary.dailyBreakdown,
  });
}
