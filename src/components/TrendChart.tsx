"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import type { DailyBreakdownItem } from "@/types";

export function TrendChart({ data, kcalTarget }: { data: DailyBreakdownItem[]; kcalTarget?: number }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.map((d) => ({ date: d.date.slice(5), kcal: d.kcal }))}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip formatter={(value: number) => `${value} kcal`} />
          {kcalTarget ? <ReferenceLine y={kcalTarget} stroke="#ef4444" strokeDasharray="4 4" /> : null}
          <Bar dataKey="kcal" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
