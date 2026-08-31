import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";

const createExerciseSchema = z.object({
  loggedAt: z.string(),
  type: z.string().min(1),
  durationMin: z.number().int().positive().optional(),
  caloriesBurned: z.number().positive().optional(),
  steps: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const exercises = await prisma.exerciseLog.findMany({
    where: { userId, loggedAt: { gte: start, lt: end } },
    orderBy: { loggedAt: "asc" },
  });

  return NextResponse.json({ exercises });
}

export async function POST(request: NextRequest) {
  const userId = getCurrentUserId();
  const parsed = createExerciseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const exercise = await prisma.exerciseLog.create({
    data: {
      userId,
      loggedAt: new Date(data.loggedAt),
      type: data.type,
      durationMin: data.durationMin,
      caloriesBurned: data.caloriesBurned,
      steps: data.steps,
      source: "MANUAL",
    },
  });

  return NextResponse.json({ exercise }, { status: 201 });
}
