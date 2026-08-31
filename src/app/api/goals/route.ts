import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";

const createGoalSchema = z.object({
  type: z.enum(["LOSE_WEIGHT", "GAIN_WEIGHT", "MAINTAIN", "BUILD_MUSCLE"]),
  targetWeightKg: z.number().positive().optional(),
  targetDate: z.string().optional(),
  dailyKcalTarget: z.number().int().positive(),
  pfcRatioProtein: z.number().min(0).max(100),
  pfcRatioFat: z.number().min(0).max(100),
  pfcRatioCarb: z.number().min(0).max(100),
  dailyStepsTarget: z.number().int().positive().optional(),
});

export async function GET() {
  const userId = getCurrentUserId();
  const goal = await prisma.goal.findFirst({ where: { userId, isActive: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ goal });
}

export async function POST(request: NextRequest) {
  const userId = getCurrentUserId();
  const parsed = createGoalSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const ratioSum = data.pfcRatioProtein + data.pfcRatioFat + data.pfcRatioCarb;
  if (Math.abs(ratioSum - 100) > 0.5) {
    return NextResponse.json({ error: "PFC比率の合計は100%にしてください" }, { status: 400 });
  }

  const goal = await prisma.$transaction(async (tx) => {
    await tx.goal.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
    return tx.goal.create({
      data: {
        userId,
        type: data.type,
        targetWeightKg: data.targetWeightKg,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        dailyKcalTarget: data.dailyKcalTarget,
        pfcRatioProtein: data.pfcRatioProtein,
        pfcRatioFat: data.pfcRatioFat,
        pfcRatioCarb: data.pfcRatioCarb,
        dailyStepsTarget: data.dailyStepsTarget,
        isActive: true,
      },
    });
  });

  return NextResponse.json({ goal }, { status: 201 });
}
