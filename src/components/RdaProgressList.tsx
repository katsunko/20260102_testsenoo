"use client";

import type { RdaProgress } from "@/types";
import { NUTRIENT_LABELS } from "@/types";

function barColor(nutrient: string, percent: number) {
  if (nutrient === "salt_g") {
    return percent > 100 ? "bg-red-500" : "bg-gray-400";
  }
  if (percent < 50) return "bg-red-500";
  if (percent < 80) return "bg-amber-500";
  return "bg-emerald-500";
}

export function RdaProgressList({ items }: { items: RdaProgress[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">データがありません。まずは食事を記録してください。</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.nutrient}>
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>{NUTRIENT_LABELS[item.nutrient] ?? item.nutrient}</span>
            <span>
              {item.intake.toFixed(1)}
              {item.unit} / {item.rdaValue}
              {item.unit}({Math.round(item.percent)}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
            <div
              className={`h-full ${barColor(item.nutrient, item.percent)}`}
              style={{ width: `${Math.min(item.percent, 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
