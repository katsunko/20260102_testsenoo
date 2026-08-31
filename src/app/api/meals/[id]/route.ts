import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateMealSchema = z.object({
  items: z
    .array(
      z.object({
        foodItemId: z.string().nullable().optional(),
        foodNameRaw: z.string().min(1),
        grams: z.number().positive(),
      })
    )
    .min(1)
    .optional(),
  status: z.enum(["PENDING", "CONFIRMED"]).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = updateMealSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { items, status } = parsed.data;

  if (items) {
    await prisma.mealItem.deleteMany({ where: { mealLogId: id } });
  }

  const meal = await prisma.mealLog.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(items
        ? {
            items: {
              create: items.map((item) => ({
                foodItemId: item.foodItemId ?? null,
                foodNameRaw: item.foodNameRaw,
                estimatedGrams: item.grams,
                confirmedGrams: item.grams,
              })),
            },
          }
        : {}),
    },
    include: { items: { include: { foodItem: true } } },
  });

  return NextResponse.json({ meal });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.mealLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
