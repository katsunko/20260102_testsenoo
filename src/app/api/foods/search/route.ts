import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const items = await prisma.foodItem.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ items });
}
