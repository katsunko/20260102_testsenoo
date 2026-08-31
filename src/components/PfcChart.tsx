"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PfcBalance } from "@/types";

const COLORS = { protein: "#2563eb", fat: "#f59e0b", carb: "#16a34a" };

export function PfcChart({ pfc }: { pfc: PfcBalance }) {
  const data = [
    { name: "タンパク質", value: Math.round(pfc.proteinKcal), color: COLORS.protein },
    { name: "脂質", value: Math.round(pfc.fatKcal), color: COLORS.fat },
    { name: "炭水化物", value: Math.round(pfc.carbKcal), color: COLORS.carb },
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value} kcal`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-4 text-sm text-gray-600">
        <span>P {pfc.proteinPercent.toFixed(0)}%</span>
        <span>F {pfc.fatPercent.toFixed(0)}%</span>
        <span>C {pfc.carbPercent.toFixed(0)}%</span>
      </div>
    </div>
  );
}
