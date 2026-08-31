import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";

const mealItemSchema = z.object({
  foodItemId: z.string().nullable().optional(),
  foodNameRaw: z.string().min(1),
  grams: z.number().positive(),
});

const createMealSchema = z.object({
  loggedAt: z.string().datetime().or(z.string()),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  inputMethod: z.enum(["TEXT", "PHOTO"]),
  rawText: z.string().optional(),
  photoUrl: z.string().optional(),
  items: z.array(mealItemSchema).min(1),
});

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId();
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const meals = await prisma.mealLog.findMany({
    where: { userId, loggedAt: { gte: startOfDay, lt: endOfDay } },
    include: { items: { include: { foodItem: true } } },
    orderBy: { loggedAt: "asc" },
  });

  return NextResponse.json({ meals });
}

export async function POST(request: NextRequest) {
  const userId = getCurrentUserId();
  const parsed = createMealSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { loggedAt, mealType, inputMethod, rawText, photoUrl, items } = parsed.data;

  const meal = await prisma.mealLog.create({
    data: {
      userId,
      loggedAt: new Date(loggedAt),
      mealType,
      inputMethod,
      rawText,
      photoUrl,
      status: "CONFIRMED",
      items: {
        create: items.map((item) => ({
          foodItemId: item.foodItemId ?? null,
          foodNameRaw: item.foodNameRaw,
          estimatedGrams: item.grams,
          confirmedGrams: item.grams,
        })),
      },
    },
    include: { items: { include: { foodItem: true } } },
  });

  return NextResponse.json({ meal }, { status: 201 });
}
